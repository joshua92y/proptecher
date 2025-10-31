from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .serializers import RegisterSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "id": user.id,
            "email": user.username,
            "name": user.first_name,
            "profile": {
                "type": request.data.get("user_type", "seeker")
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response({"error": "이메일과 비밀번호를 입력하세요."}, status=400)

        user = authenticate(username=email, password=password)
        if user is None:
            return Response({"error": "이메일 또는 비밀번호가 올바르지 않습니다."}, status=400)

        try:
            profile = user.profile
            profile_type = profile.사용자유형
        except UserProfile.DoesNotExist:  # pragma: no cover
            profile_type = "user"

        # 실제 JWT 발급 대신 목업 토큰 반환
        token = "mock-token"
        return Response({
            "token": token,
            "email": user.username,
            "name": user.first_name,
            "profile": {"type": profile_type}
        })


class PreferencesView(APIView):
    permission_classes = [AllowAny]

    def get_profile(self, request):
        email = request.query_params.get('email') or request.data.get('email')
        if not email:
            return None, Response({"error": "email 파라미터가 필요합니다."}, status=400)
        try:
            user = User.objects.get(username=email)
            return user.profile, None
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return None, Response({"error": "사용자를 찾을 수 없습니다."}, status=404)

    def get(self, request):
        profile, error = self.get_profile(request)
        if error:
            return error
        return Response({
            "preferred_regions": profile.선호지역목록 or [],
            "purpose": profile.귀촌목적,
        })

    def put(self, request):
        profile, error = self.get_profile(request)
        if error:
            return error
        preferred = request.data.get('preferred_regions')
        purpose = request.data.get('purpose')
        if isinstance(preferred, list):
            profile.선호지역목록 = preferred
        if purpose in ["귀어","귀농","취업","기타", None]:
            profile.귀촌목적 = purpose
        profile.save()
        return Response({"success": True})

    def delete(self, request):
        profile, error = self.get_profile(request)
        if error:
            return error
        profile.선호지역목록 = None
        profile.귀촌목적 = None
        profile.save()
        return Response(status=204)
