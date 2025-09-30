from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Sido


# -------------------------
# Model Test
# -------------------------
class SidoModelTest(TestCase):
    """Sido 모델 테스트"""
    databases = ['default']

    @classmethod
    def setUpTestData(cls):
        Sido.objects.all().delete()
        cls.sido_data = {
            'ufid': 'TEST_UFID_001',
            'bjcd': '1100000000',
            'name': '서울특별시',
            'divi': '특별시',
            'scls': '11000000',
            'fmta': '20240101'
        }
        cls.sido = Sido.objects.create(**cls.sido_data)

    def test_sido_creation(self):
        """시도 모델 생성 테스트"""
        self.assertEqual(self.sido.ufid, 'TEST_UFID_001')
        self.assertEqual(self.sido.name, '서울특별시')
        self.assertIsNotNone(self.sido.created_at)
        self.assertIsNotNone(self.sido.updated_at)

    def test_sido_str_method(self):
        """시도 모델 __str__ 메서드 테스트"""
        self.assertEqual(str(self.sido), '서울특별시')

    def test_sido_meta_ordering(self):
        """시도 모델 정렬 테스트 (가나다순)"""
        Sido.objects.create(
            ufid='TEST_UFID_002',
            name='부산광역시',
            divi='광역시',
            scls='21000000',
            fmta='20240101'
        )
        sido_list = list(Sido.objects.order_by("name"))
        self.assertEqual(sido_list[0].name, '부산광역시')
        self.assertEqual(sido_list[1].name, '서울특별시')


# -------------------------
# API Test
# -------------------------
class SidoAPITest(APITestCase):
    """Sido API 테스트"""
    databases = ['default']

    @classmethod
    def setUpTestData(cls):
        Sido.objects.all().delete()
        cls.user = User.objects.create_user(username="testuser", password="password")
        refresh = RefreshToken.for_user(cls.user)
        cls.access_token = str(refresh.access_token)

        cls.sido = Sido.objects.create(
            ufid='TEST_UFID_001',
            bjcd='1100000000',
            name='서울특별시',
            divi='특별시',
            scls='11000000',
            fmta='20240101'
        )

        Sido.objects.create(
            ufid='TEST_UFID_002',
            bjcd='2100000000',
            name='부산광역시',
            divi='광역시',
            scls='21000000',
            fmta='20240101'
        )

        Sido.objects.create(
            ufid='TEST_UFID_003',
            bjcd='3100000000',
            name='대구광역시',
            divi='광역시',
            scls='31000000',
            fmta='20240101'
        )

    def setUp(self):
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_sido_list_api(self):
        url = reverse('sido-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_sido_list_api_public(self):
        """list는 누구나 접근 가능"""
        client = APIClient()  # no auth
        url = reverse('sido-list')
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_sido_detail_api(self):
        url = reverse('sido-detail', kwargs={'ufid': self.sido.ufid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['ufid'], self.sido.ufid)

    def test_sido_create_api(self):
        url = reverse('sido-list')
        new_sido_data = {
            'ufid': 'TEST_UFID_004',
            'bjcd': '4100000000',
            'name': '인천광역시',
            'divi': '광역시',
            'scls': '41000000',
            'fmta': '20240101'
        }
        response = self.client.post(url, new_sido_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sido.objects.count(), 4)

    def test_sido_update_api(self):
        url = reverse('sido-detail', kwargs={'ufid': self.sido.ufid})
        update_data = {
            'bjcd': self.sido.bjcd,
            'name': '서울특별시 (수정)',
            'divi': '특별시',
            'scls': self.sido.scls,
            'fmta': self.sido.fmta
        }
        response = self.client.put(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sido.refresh_from_db()
        self.assertEqual(self.sido.name, '서울특별시 (수정)')

    def test_sido_delete_api(self):
        url = reverse('sido-detail', kwargs={'ufid': self.sido.ufid})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Sido.objects.filter(ufid=self.sido.ufid).exists())

    def test_sido_filtering(self):
        url = reverse('sido-list')
        response = self.client.get(url, {'divi': '광역시'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_sido_ordering(self):
        url = reverse('sido-list')
        response = self.client.get(url, {'ordering': 'name'})
        names = [item['name'] for item in response.data['results'] if item['ufid'].startswith("TEST_")]
        self.assertEqual(names, sorted(names))

    def test_sido_pagination(self):
        for i in range(25):
            Sido.objects.create(
                ufid=f'TEST_UFID_{i+10:03d}',
                name=f'테스트시도{i+1}',
                divi='테스트',
                scls=f'{i+10:08d}',
                fmta='20240101'
            )
        url = reverse('sido-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 20)
        self.assertIsNotNone(response.data['next'])

    def test_sido_invalid_data_creation(self):
        url = reverse('sido-list')
        invalid_data = {'ufid': '', 'name': ''}
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ufid', response.data)
        self.assertIn('name', response.data)

    def test_sido_duplicate_ufid(self):
        url = reverse('sido-list')
        duplicate_data = {
            'ufid': 'TEST_UFID_001',
            'bjcd': '9999999999',
            'name': '중복테스트',
            'divi': '테스트',
            'scls': '99999999',
            'fmta': '20240101'
        }
        response = self.client.post(url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# -------------------------
# Serializer Test
# -------------------------
class SidoSerializerTest(TestCase):
    """Sido Serializer 테스트"""
    databases = ['default']

    @classmethod
    def setUpTestData(cls):
        cls.sido = Sido.objects.create(
            ufid='TEST_UFID_001',
            bjcd='1100000000',
            name='서울특별시',
            divi='특별시',
            scls='11000000',
            fmta='20240101'
        )

    def test_sido_serializer_serialization(self):
        from .serializers import SidoSerializer
        serializer = SidoSerializer(self.sido)
        data = serializer.data
        self.assertEqual(data['ufid'], self.sido.ufid)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_sido_serializer_deserialization(self):
        from .serializers import SidoCreateSerializer
        new_data = {
            'ufid': 'TEST_UFID_002',
            'bjcd': '2100000000',
            'name': '부산광역시',
            'divi': '광역시',
            'scls': '21000000',
            'fmta': '20240101'
        }
        serializer = SidoCreateSerializer(data=new_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        sido = serializer.save()
        self.assertEqual(sido.ufid, 'TEST_UFID_002')

    def test_sido_serializer_invalid(self):
        from .serializers import SidoCreateSerializer
        invalid_data = {'ufid': '', 'name': ''}
        serializer = SidoCreateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('ufid', serializer.errors)
        self.assertIn('name', serializer.errors)
