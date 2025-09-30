import json
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.gis.geos import MultiPolygon, Polygon
from locations.models import Sido


class SidoAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 테스트용 시도 데이터 생성
        polygon = Polygon((
            (127.0, 37.0),
            (127.1, 37.0),
            (127.1, 37.1),
            (127.0, 37.1),
            (127.0, 37.0)
        ))
        self.sido1 = Sido.objects.create(
            id=1,
            geom=MultiPolygon(polygon),
            ufid="UFID001",
            bjcd="11",
            name="서울특별시",
            divi="SIDO",
            scls="001",
            fmta="TEST001"
        )
        self.sido2 = Sido.objects.create(
            id=2,
            geom=MultiPolygon(polygon),
            ufid="UFID002",
            bjcd="26",
            name="부산광역시",
            divi="SIDO",
            scls="002",
            fmta="TEST002"
        )

    def test_list_sido(self):
        """시도 전체 조회 API"""
        response = self.client.get("/sido/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("features", data)  # GeoJSON 구조 확인
        self.assertGreaterEqual(len(data["features"]), 2)

    def test_retrieve_sido(self):
        """단일 시도 조회 API"""
        response = self.client.get(f"/sido/{self.sido1.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["properties"]["name"], "서울특별시")

    def test_search_sido_by_name(self):
        """이름 검색 API"""
        response = self.client.get("/sido/?search=서울")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        names = [f["properties"]["name"] for f in data["features"]]
        self.assertIn("서울특별시", names)

    def test_filter_sido_by_bjcd(self):
        """법정동 코드 필터 API"""
        response = self.client.get("/sido/?bjcd=26")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        names = [f["properties"]["name"] for f in data["features"]]
        self.assertIn("부산광역시", names)
        self.assertNotIn("서울특별시", names)
