from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import InspectionRequest, ActiveInspection, InspectionCancellation
from .serializers import (
    InspectionRequestCreateSerializer,
    RequestCardSerializer,
    RequestDetailSerializer,
    ActiveInspectionSerializer,
    InspectionStatusSerializer,
)


class InspectionViewSet(viewsets.ViewSet):
    """
    임장 관련 ViewSet
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='requests')
    def create_request(self, request):
        """
        POST /api/inspections/requests
        임장 요청 생성 (소비자)
        """
        serializer = InspectionRequestCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        inspection = serializer.save()

        return Response({
            'request_id': str(inspection.id),
            'status': 'requested'
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='status')
    def get_status(self, request):
        """
        GET /api/inspections/status?listing_id={listing_id}
        매물의 임장 상태 조회
        """
        listing_id = request.query_params.get('listing_id')
        if not listing_id:
            return Response({'error': 'listing_id is required'}, status=400)

        # 사용자의 요청 중 해당 매물에 대한 최신 요청 조회
        from users.models import UserProfile
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            inspection = InspectionRequest.objects.filter(
                매물ID__id=listing_id,
                요청자ID=user_profile
            ).order_by('-요청일시').first()
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=404)

        if not inspection:
            return Response({'status': None})

        # 상태 판단
        if inspection.상태 == 'requested':
            inspection_status = 'requested'
        elif inspection.상태 == 'accepted' and hasattr(inspection, 'active_inspection'):
            inspection_status = 'active'
        else:
            inspection_status = None

        serializer = InspectionStatusSerializer({'status': inspection_status})
        return Response(serializer.data)


class AdminInspectionViewSet(viewsets.ViewSet):
    """
    평가사용 임장 관리 ViewSet
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='requests')
    def list_requests(self, request):
        """
        GET /api/admin/inspections/requests
        임장 요청 목록 조회 (평가사)
        """
        # 평가사 인증 확인
        from users.models import UserProfile
        from agents.models import Agent
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not hasattr(user_profile, 'agent_profile'):
                return Response({'error': 'Agent only'}, status=403)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=404)

        # 요청된 상태의 임장만 조회
        requests = InspectionRequest.objects.filter(
            상태='requested'
        ).select_related('매물ID')

        serializer = RequestCardSerializer(requests, many=True)
        return Response({'requests': serializer.data})

    @action(detail=True, methods=['get'], url_path='requests/(?P<request_id>[^/.]+)')
    def request_detail(self, request, request_id=None):
        """
        GET /api/admin/inspections/requests/{request_id}
        임장 요청 상세 조회
        """
        try:
            inspection = InspectionRequest.objects.get(id=request_id)
        except InspectionRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        serializer = RequestDetailSerializer(inspection)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='(?P<request_id>[^/.]+)/accept')
    def accept_request(self, request, request_id=None):
        """
        POST /api/admin/inspections/{request_id}/accept
        임장 요청 수락
        """
        try:
            inspection = InspectionRequest.objects.get(id=request_id, 상태='requested')
        except InspectionRequest.DoesNotExist:
            return Response({'error': 'Request not found or already processed'}, status=400)

        # 평가사 프로필 가져오기
        from users.models import UserProfile
        from agents.models import Agent
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            agent = user_profile.agent_profile
        except (UserProfile.DoesNotExist, AttributeError):
            return Response({'error': 'Agent profile not found'}, status=404)

        # 요청 상태 업데이트
        inspection.상태 = 'accepted'
        inspection.담당평가사ID = agent
        inspection.수락일시 = timezone.now()
        inspection.save()

        # ActiveInspection 생성
        active = ActiveInspection.objects.create(
            요청ID=inspection,
            평가사ID=agent,
            진행률=0
        )

        return Response({
            'inspectionId': str(active.id),
            'status': 'active'
        })

    @action(detail=True, methods=['post'], url_path='(?P<request_id>[^/.]+)/reject')
    def reject_request(self, request, request_id=None):
        """
        POST /api/admin/inspections/{request_id}/reject
        임장 요청 거절
        """
        try:
            inspection = InspectionRequest.objects.get(id=request_id, 상태='requested')
        except InspectionRequest.DoesNotExist:
            return Response({'error': 'Request not found or already processed'}, status=400)

        inspection.상태 = 'rejected'
        inspection.save()

        return Response({'status': 'rejected'})

    @action(detail=False, methods=['get'], url_path='active')
    def list_active(self, request):
        """
        GET /api/admin/inspections/active
        진행중인 임장 목록
        """
        from users.models import UserProfile
        from agents.models import Agent
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            agent = user_profile.agent_profile
        except (UserProfile.DoesNotExist, AttributeError):
            return Response({'error': 'Agent profile not found'}, status=404)

        active_inspections = ActiveInspection.objects.filter(
            평가사ID=agent
        ).select_related('요청ID')

        serializer = ActiveInspectionSerializer(active_inspections, many=True)
        return Response({'active': serializer.data})

    @action(detail=True, methods=['post'], url_path='(?P<inspection_id>[^/.]+)/cancel')
    def cancel_active(self, request, inspection_id=None):
        """
        POST /api/admin/inspections/{inspection_id}/cancel
        임장 취소
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        reason = request.data.get('reason', '')
        requeue = request.data.get('requeue', True)

        # 취소 기록 생성
        InspectionCancellation.objects.create(
            임장ID=active,
            평가사ID=active.평가사ID,
            취소사유=reason,
            재요청여부=requeue
        )

        # 요청 상태 업데이트
        inspection_request = active.요청ID
        if requeue:
            inspection_request.상태 = 'requested'  # 재요청 가능
        else:
            inspection_request.상태 = 'cancelled'
        inspection_request.save()

        # ActiveInspection 삭제
        active.delete()

        return Response({
            'status': 'cancelled',
            'requeued': requeue
        })
