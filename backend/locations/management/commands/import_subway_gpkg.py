"""
GPKG(GeoPackage) 파일에서 지하철역(포인트) 데이터를 가져오는 명령어

예시:
  python manage.py import_subway_gpkg "G:\\backup\\subway.gpkg" \
    --layer 0 \
    --name-field 역명 --line-field 노선명 --code-field 역코드 \
    --srid 4326 --clear

필드 이름을 모를 경우 --dry-run 으로 레이어/필드 목록을 먼저 확인하세요:
  python manage.py import_subway_gpkg "G:\\backup\\subway.gpkg" --dry-run
"""
import os
from typing import Optional
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.contrib.gis.gdal import DataSource, SpatialReference, CoordTransform
from django.contrib.gis.geos import Point
from locations.models import SubwayStation


NAME_CANDIDATES = ['역명', 'station_nm', 'station_na', 'name', 'STATION_NM', 'STATION_NA', 'NAME', 'STN_KOR']
LINE_CANDIDATES = ['노선명', '호선', 'line', 'LINE', '노선', 'ROUTE_NM', 'LINE_NM']
CODE_CANDIDATES = ['역코드', 'station_id', 'STATION_ID', 'STATION_CD', 'CODE', 'ID', 'STN_ID']
ADDR_CANDIDATES = ['주소', 'ADDR', 'address', 'ADDRESS']
SIDO_CANDIDATES = ['시도', 'SIDO', 'CTP_KOR_NM', 'city', 'City']
SGG_CANDIDATES = ['시군구', 'SIG_KOR_NM', 'gu', 'SGG']


class Command(BaseCommand):
    help = 'GPKG에서 지하철역 포인트 데이터를 가져옵니다.'

    def add_arguments(self, parser):
        parser.add_argument('gpkg_path', type=str, help='GPKG 파일 경로')
        parser.add_argument('--layer', type=str, default=None, help='레이어 인덱스(숫자) 또는 이름')
        parser.add_argument('--name-field', type=str, default=None, help='역명 필드명')
        parser.add_argument('--line-field', type=str, default=None, help='노선명 필드명')
        parser.add_argument('--code-field', type=str, default=None, help='역코드 필드명')
        parser.add_argument('--sido-field', type=str, default=None, help='시도 필드명')
        parser.add_argument('--sgg-field', type=str, default=None, help='시군구 필드명')
        parser.add_argument('--srid', type=int, default=4326, help='저장 SRID (기본 4326)')
        parser.add_argument('--addr-field', type=str, default=None, help='주소 필드명')
        parser.add_argument('--clear', action='store_true', help='기존 데이터를 삭제하고 새로 적재')
        parser.add_argument('--batch-size', type=int, default=1000, help='배치 저장 크기')
        parser.add_argument('--dry-run', action='store_true', help='스키마/레이어 정보만 출력하고 종료')

    def handle(self, *args, **opts):
        path = opts['gpkg_path']
        layer_sel = opts['layer']
        srid = opts['srid']
        clear = opts['clear']
        batch_size = opts['batch_size']
        dry_run = opts['dry_run']

        if not os.path.exists(path):
            raise CommandError(f'GPKG 파일이 존재하지 않습니다: {path}')

        try:
            ds = DataSource(path)
        except Exception as e:
            raise CommandError(f'GPKG 열기 실패: {e}')

        self.stdout.write(self.style.MIGRATE_HEADING(f'레이어 수: {len(ds)}'))
        for i, lyr in enumerate(ds):
            self.stdout.write(f'  - [{i}] {lyr.name} | geom_type={lyr.geom_type.name} | fields={list(lyr.fields)}')

        if dry_run:
            self.stdout.write(self.style.SUCCESS('dry-run 완료'))
            return

        # 레이어 선택
        layer = None
        if layer_sel is None:
            layer = ds[0]
        else:
            try:
                idx = int(layer_sel)
                layer = ds[idx]
            except ValueError:
                # 이름으로
                layer = next((lyr for lyr in ds if lyr.name == layer_sel), None)
        if layer is None:
            raise CommandError('레이어를 찾을 수 없습니다. --layer 옵션을 확인하세요.')

        # 필드 매핑 확정
        name_field = self._resolve_field(layer, opts['name_field'], NAME_CANDIDATES)
        line_field = self._resolve_field(layer, opts['line_field'], LINE_CANDIDATES)
        code_field = self._resolve_field(layer, opts['code_field'], CODE_CANDIDATES, required=False)
        addr_field = self._resolve_field(layer, opts['addr_field'], ADDR_CANDIDATES, required=False)
        sido_field = self._resolve_field(layer, opts['sido_field'], SIDO_CANDIDATES, required=False)
        sgg_field = self._resolve_field(layer, opts['sgg_field'], SGG_CANDIDATES, required=False)

        self.stdout.write(f'사용 필드 매핑: 역명={name_field}, 노선명={line_field}, 역코드={code_field}, 주소={addr_field}, 시도={sido_field}, 시군구={sgg_field}')

        if clear:
            self.stdout.write('기존 지하철역 데이터를 삭제합니다...')
            SubwayStation.objects.all().delete()

        # 좌표계 변환 준비
        target_srs = SpatialReference(srid)
        src_srs = layer.srs
        transformer: Optional[CoordTransform] = None
        if src_srs and (src_srs.srid != srid or src_srs.wkt != target_srs.wkt):
            transformer = CoordTransform(src_srs, target_srs)

        total = 0
        created = 0
        batch = []

        for feat in layer:
            total += 1
            geom = feat.geom
            if geom is None:
                continue
            try:
                if transformer:
                    geom.transform(transformer)
                # 포인트만 처리
                if geom.geom_name != 'POINT':
                    continue
                x, y = geom.x, geom.y
                pt = Point(x, y, srid=srid)
            except Exception:
                continue

            try:
                name = str(feat.get(name_field)).strip() if name_field else None
                if not name:
                    continue
                line = None
                if line_field:
                    line = str(feat.get(line_field)).strip() or None
                code = None
                if code_field:
                    val = feat.get(code_field)
                    code = (str(val).strip() if val is not None else None) or None
                addr = None
                if addr_field:
                    aval = feat.get(addr_field)
                    addr = (str(aval).strip() if aval is not None else None) or None
                sido = str(feat.get(sido_field)).strip() if (sido_field and feat.get(sido_field) is not None) else None
                sgg = str(feat.get(sgg_field)).strip() if (sgg_field and feat.get(sgg_field) is not None) else None

                obj = SubwayStation(
                    역코드=code,
                    역명=name,
                    노선명=line,
                    위치=pt,
                    주소=addr,
                    시도=sido,
                    시군구=sgg,
                )
                batch.append(obj)

                if len(batch) >= batch_size:
                    created += self._flush(batch)
                    batch = []
            except Exception:
                continue

        if batch:
            created += self._flush(batch)

        self.stdout.write(self.style.SUCCESS(f'가져오기 완료: 총 {total}개 / 생성 {created}개'))

    def _flush(self, batch):
        # 역코드가 있는 경우 unique 제약이 걸려 있으므로 중복은 무시
        try:
            with transaction.atomic():
                created_objs = SubwayStation.objects.bulk_create(batch, ignore_conflicts=True, batch_size=500)
                return len(created_objs)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'배치 저장 오류: {e}'))
            return 0

    def _resolve_field(self, layer, explicit: Optional[str], candidates, required: bool = True) -> Optional[str]:
        if explicit:
            if explicit in layer.fields:
                return explicit
            raise CommandError(f'필드가 존재하지 않습니다: {explicit} (레이어 필드: {list(layer.fields)})')
        for c in candidates:
            if c in layer.fields:
                return c
        if required:
            raise CommandError(f'필드를 찾을 수 없습니다. 후보: {candidates} (레이어 필드: {list(layer.fields)})')
        return None


