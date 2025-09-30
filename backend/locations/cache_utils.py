from django.core.cache import cache
from django.contrib.gis.db.models.functions import AsGeoJSON
from .models import Sido


def get_sido_data():
    """
    시도 데이터를 캐싱 (geometry 포함, GeoJSON 변환)
    """
    data = cache.get("sido_data")
    if data is None:  # 최초 접근 시 DB 조회
        data = list(
            Sido.objects.annotate(
                geom_json=AsGeoJSON("geom")
            ).values("ufid", "bjcd", "name", "divi", "scls", "fmta", "geom_json")
        )
        cache.set("sido_data", data, timeout=None)
    return data

def refresh_sido_cache():
    """
    시도 데이터 캐시 무효화 후 갱신
    """
    cache.delete("sido_data")
    get_sido_data()
