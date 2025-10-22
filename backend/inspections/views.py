from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.files.base import ContentFile
import base64
import uuid
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
    permission_classes = []  # 인증 비활성화 (개발용)

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

    @action(detail=False, methods=['get'], url_path='my-reports')
    def my_reports(self, request):
        """
        GET /api/inspections/my-reports
        내가 요청한 완료된 임장 목록 조회 (소비자용)
        """
        # 완료된 임장 요청 조회
        completed_requests = InspectionRequest.objects.filter(
            상태='completed'
        ).select_related('담당평가사ID').order_by('-완료일시')

        data = []
        for req in completed_requests:
            try:
                active = ActiveInspection.objects.get(요청ID=req, 보고서확정여부=True)
                data.append({
                    'id': str(req.id),
                    'inspectionId': str(active.id),
                    'title': req.매물제목,
                    'address': req.매물주소,
                    'priceText': req.가격정보 or '',
                    'recommendation': active.추천여부,
                    'confirmedAt': active.확정일시.isoformat() if active.확정일시 else None,
                    'img': req.매물이미지URL,
                    'agentName': req.담당평가사ID.이름 if req.담당평가사ID else None
                })
            except ActiveInspection.DoesNotExist:
                continue

        return Response({'reports': data})

    @action(detail=True, methods=['get'], url_path='(?P<inspection_id>[^/.]+)/view-report')
    def view_report(self, request, inspection_id=None):
        """
        GET /api/inspections/{inspection_id}/view-report
        내 임장보고서 조회 (소비자용)
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id, 보고서확정여부=True)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Report not found or not confirmed'}, status=404)

        return Response({
            'title': active.요청ID.매물제목,
            'address': active.요청ID.매물주소,
            'priceText': active.요청ID.가격정보 or '',
            'finalOpinion': active.종합의견,
            'recommendation': active.추천여부,
            'checklistData': active.체크리스트데이터,
            'floorplanURL': active.평면도URL,
            'confirmedAt': active.확정일시,
            'agentName': active.평가사ID.이름 if active.평가사ID else None,
            'agentCompany': active.평가사ID.소속 if active.평가사ID else None,
        })


class AdminInspectionViewSet(viewsets.ViewSet):
    """
    평가사용 임장 관리 ViewSet
    """
    permission_classes = []  # 인증 비활성화 (개발용)

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
        # 인증 비활성화 상태에서는 모든 진행중 임장 반환
        active_inspections = ActiveInspection.objects.filter(
            보고서확정여부=False
        ).select_related('요청ID')

        serializer = ActiveInspectionSerializer(active_inspections, many=True)
        return Response({'active': serializer.data})

    @action(detail=False, methods=['get'], url_path='completed')
    def list_completed(self, request):
        """
        GET /api/admin/inspections/completed
        완료된 임장 목록 조회
        """
        # 완료된 임장 조회 (보고서 확정된 것만)
        completed_inspections = ActiveInspection.objects.filter(
            보고서확정여부=True
        ).select_related('요청ID', '평가사ID').order_by('-확정일시')

        data = []
        for active in completed_inspections:
            data.append({
                'id': str(active.id),
                'requestId': str(active.요청ID.id),
                'title': active.요청ID.매물제목,
                'address': active.요청ID.매물주소,
                'priceText': active.요청ID.가격정보 or '',
                'recommendation': active.추천여부,
                'confirmedAt': active.확정일시.isoformat() if active.확정일시 else None,
                'img': active.요청ID.매물이미지URL
            })

        return Response({'completed': data})

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

    @action(detail=True, methods=['post'], url_path='(?P<inspection_id>[^/.]+)/floorplan')
    def save_floorplan(self, request, inspection_id=None):
        """
        POST /api/admin/inspections/{inspection_id}/floorplan
        평면도 저장 (JSON 데이터 + 이미지)
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        # JSON 데이터 저장
        floorplan_data = request.data.get('floorplanData')
        if floorplan_data:
            active.평면도데이터 = floorplan_data

        # Base64 이미지 저장 (임시로 평면도URL에 Base64 직접 저장)
        image_data = request.data.get('floorplanImage')
        if image_data:
            # Base64 이미지를 직접 DB에 저장 (간단한 구현)
            # 프로덕션에서는 S3나 별도 스토리지 사용 권장
            active.평면도URL = image_data

        active.save()

        return Response({
            'success': True,
            'floorplanURL': active.평면도URL,
            'message': '평면도가 저장되었습니다.'
        })

    @action(detail=True, methods=['get'], url_path='(?P<inspection_id>[^/.]+)/floorplan')
    def get_floorplan(self, request, inspection_id=None):
        """
        GET /api/admin/inspections/{inspection_id}/floorplan
        평면도 불러오기
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        return Response({
            'floorplanData': active.평면도데이터,
            'floorplanURL': active.평면도URL
        })

    @action(detail=True, methods=['post'], url_path='(?P<inspection_id>[^/.]+)/submit-report')
    def submit_report(self, request, inspection_id=None):
        """
        POST /api/admin/inspections/{inspection_id}/submit-report
        임장보고서 확정 제출
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        # 보고서 데이터 저장
        active.종합의견 = request.data.get('finalOpinion')
        active.추천여부 = request.data.get('recommendation')
        active.체크리스트데이터 = request.data.get('checklistData')
        active.보고서확정여부 = True
        active.확정일시 = timezone.now()
        active.진행률 = 100
        
        active.save()

        # 원본 요청 상태 업데이트
        inspection_request = active.요청ID
        inspection_request.상태 = 'completed'
        inspection_request.완료일시 = timezone.now()
        inspection_request.save()

        return Response({
            'success': True,
            'message': '보고서가 확정되었습니다.',
            'confirmedAt': active.확정일시
        })

    @action(detail=True, methods=['get'], url_path='(?P<inspection_id>[^/.]+)/report')
    def get_report(self, request, inspection_id=None):
        """
        GET /api/admin/inspections/{inspection_id}/report
        확정된 보고서 조회
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        if not active.보고서확정여부:
            return Response({'error': 'Report not confirmed yet'}, status=400)

        return Response({
            'finalOpinion': active.종합의견,
            'recommendation': active.추천여부,
            'checklistData': active.체크리스트데이터,
            'floorplanData': active.평면도데이터,
            'floorplanURL': active.평면도URL,
            'confirmedAt': active.확정일시,
            'progress': active.진행률
        })

    @action(detail=True, methods=['post'], url_path='(?P<inspection_id>[^/.]+)/save-progress')
    def save_progress(self, request, inspection_id=None):
        """
        POST /api/admin/inspections/{inspection_id}/save-progress
        진행 상황 저장 (체크리스트, 진행률)
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        # 체크리스트 데이터 저장
        checklist_data = request.data.get('checklistData')
        if checklist_data:
            active.체크리스트데이터 = checklist_data

        # 진행률 저장
        progress = request.data.get('progress')
        if progress is not None:
            active.진행률 = progress

        active.save()

        return Response({
            'success': True,
            'message': '진행 상황이 저장되었습니다.'
        })

    @action(detail=True, methods=['get'], url_path='(?P<inspection_id>[^/.]+)/progress')
    def get_progress(self, request, inspection_id=None):
        """
        GET /api/admin/inspections/{inspection_id}/progress
        진행 상황 불러오기
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)

        return Response({
            'checklistData': active.체크리스트데이터,
            'progress': active.진행률
        })
