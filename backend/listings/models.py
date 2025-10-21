from django.db import models
from django.conf import settings


class Listing(models.Model):
    """
    매물 모델
    """
    LISTING_TYPE_CHOICES = [
        ('sale', '매매'),
        ('jeonse', '전세'),
        ('monthly', '월세'),
    ]

    HOUSE_TYPE_CHOICES = [
        ('apartment', '아파트'),
        ('officetel', '오피스텔'),
        ('villa', '빌라'),
        ('oneroom', '원룸'),
        ('tworoom', '투룸'),
        ('duplex', '복층'),
        ('store', '상가'),
        ('office', '사무실'),
    ]

    STATUS_CHOICES = [
        ('available', '모집중'),
        ('viewing', '임장예약중'),
        ('contracted', '계약완료'),
        ('sold', '거래완료'),
    ]

    등록사용자ID = models.ForeignKey(
        'users.UserProfile',
        on_delete=models.CASCADE,
        related_name='registered_listings',
        verbose_name='등록한 사용자 프로필'
    )
    관리중개사ID = models.ForeignKey(
        'agents.Agent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_listings',
        verbose_name='관리 중개사'
    )
    지역ID = models.ForeignKey(
        'locations.Region',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='지역 정보'
    )

    # 매물 기본 정보
    매물타입 = models.CharField(
        max_length=10,
        choices=LISTING_TYPE_CHOICES,
        verbose_name='매물 타입'
    )
    주택종류 = models.CharField(
        max_length=20,
        choices=HOUSE_TYPE_CHOICES,
        verbose_name='주택 종류'
    )

    # 가격 정보
    매매가 = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='매매 가격(원)'
    )
    전세보증금 = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='전세 보증금(원)'
    )
    월세보증금 = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='월세 보증금(원)'
    )
    월세 = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='월세 금액(원)'
    )

    # 위치 정보
    주소 = models.TextField(
        verbose_name='매물 전체 주소'
    )
    도로명주소 = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='도로명 주소'
    )
    지번주소 = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='지번 주소'
    )
    상세주소 = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='상세 주소 (동/호수)'
    )
    위도 = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name='위도 좌표'
    )
    경도 = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name='경도 좌표'
    )

    # 관리비 및 주차 정보
    월관리비 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='월 관리비(원)'
    )
    관리비포함항목 = models.TextField(
        null=True,
        blank=True,
        verbose_name='관리비 포함 항목'
    )
    주차정보 = models.TextField(
        null=True,
        blank=True,
        verbose_name='주차 정보'
    )

    # 면적 및 구조 정보
    전용면적_제곱미터 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='전용면적(㎡)'
    )
    전용면적_평 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='전용면적(평)'
    )
    방수 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='방 개수'
    )
    욕실수 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='욕실 개수'
    )
    층수 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='층수 정보'
    )
    현재층 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='현재 층'
    )
    총층수 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='총 층수'
    )

    # 건물 정보
    준공년도 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='준공 연도'
    )
    공급면적_제곱미터 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='공급면적(㎡)'
    )
    방향 = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        verbose_name='방향'
    )
    총세대수 = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='총 세대수'
    )
    총주차대수 = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='총 주차대수'
    )
    현관유형 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='현관 유형'
    )

    # 임대 조건
    입주가능일 = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='입주 가능일'
    )
    건축물용도 = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='건축물 용도'
    )
    사용승인일 = models.DateField(
        null=True,
        blank=True,
        verbose_name='사용승인일'
    )
    최초등록일 = models.DateField(
        null=True,
        blank=True,
        verbose_name='최초 등록일'
    )
    계약기간_개월 = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='계약 기간(개월)'
    )
    재계약가능여부 = models.BooleanField(
        null=True,
        blank=True,
        verbose_name='재계약 가능 여부'
    )

    # 교통 정보 (JSON 필드)
    대중교통점수 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='대중교통 편의성 점수(0-10)'
    )
    노선다양성점수 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='노선 다양성 점수(0-5)'
    )
    버스정류장정보 = models.JSONField(
        null=True,
        blank=True,
        default=list,
        verbose_name='버스 정류장 정보'
    )
    지하철역정보 = models.JSONField(
        null=True,
        blank=True,
        default=list,
        verbose_name='지하철역 정보'
    )

    # 편의시설 정보
    편의시설요약 = models.TextField(
        null=True,
        blank=True,
        verbose_name='편의시설 및 상권 요약'
    )

    # 이미지 (JSONField로 여러 이미지 URL 저장)
    이미지URLs = models.JSONField(
        null=True,
        blank=True,
        default=list,
        verbose_name='매물 이미지 URL 목록'
    )

    # Q&A (별도 모델로 분리하는 것이 권장되지만 일단 JSON으로)
    QA정보 = models.JSONField(
        null=True,
        blank=True,
        default=list,
        verbose_name='Q&A 정보'
    )

    # 상태 및 통계
    매물상태 = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        verbose_name='매물 상태'
    )
    상세설명 = models.TextField(
        null=True,
        blank=True,
        verbose_name='매물 상세 설명'
    )
    조회수 = models.PositiveIntegerField(
        default=0,
        verbose_name='조회수'
    )
    찜수 = models.PositiveIntegerField(
        default=0,
        verbose_name='찜 개수'
    )
    활성화여부 = models.BooleanField(
        default=True,
        verbose_name='활성화 여부'
    )

    # 교통 정보 (JSON 필드로 저장)
    대중교통점수 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='대중교통 편의성 점수(0-10)'
    )
    노선다양성점수 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='노선 다양성 점수(0-5)'
    )
    버스정류장정보 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='버스 정류장 정보'
    )
    # 예시: [{"stop_name": "선릉역", "distance_m": 180, "bus_numbers": ["146", "341"]}]

    지하철역정보 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='지하철역 정보'
    )
    # 예시: [{"station_name": "선릉역", "line_names": ["2호선"], "distance_m": 420}]

    # 편의시설 정보
    편의시설요약 = models.TextField(
        null=True,
        blank=True,
        verbose_name='편의시설 및 상권 요약'
    )

    # 이미지 (JSONField로 여러 이미지 URL 저장)
    이미지URLs = models.JSONField(
        null=True,
        blank=True,
        verbose_name='매물 이미지 URL 목록'
    )
    # 예시: ["/images/house1.jpg", "/images/house2.jpg"]

    # Q&A (별도 모델로 분리하는 것이 권장)
    QA정보 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Q&A 정보'
    )

    # 타임스탬프
    생성일시 = models.DateTimeField(
        auto_now_add=True,
        verbose_name='등록 일시'
    )
    수정일시 = models.DateTimeField(
        auto_now=True,
        verbose_name='수정 일시'
    )

    class Meta:
        verbose_name = '매물'
        verbose_name_plural = '매물'
        db_table = 'listings'
        ordering = ['-생성일시']

    def __str__(self):
        return f"{self.get_매물타입_display()} - {self.주소}"
