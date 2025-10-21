"""
버스정류장 CSV 데이터를 가져오는 Django 관리 명령어
"""
import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.contrib.gis.geos import Point
from django.db import transaction
from locations.models import BusStop


class Command(BaseCommand):
    help = 'CSV 파일에서 버스정류장 데이터를 가져옵니다'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='가져올 CSV 파일 경로 (예: TOTAL_sp_bus_stop_locations.csv)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='배치 처리 크기 (기본값: 1000)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='기존 데이터를 모두 삭제하고 새로 가져옵니다'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        batch_size = options['batch_size']
        clear_existing = options['clear']

        # CSV 파일 경로 확인
        if not os.path.exists(csv_file):
            raise CommandError(f'CSV 파일을 찾을 수 없습니다: {csv_file}')

        # 기존 데이터 삭제 옵션
        if clear_existing:
            self.stdout.write('기존 버스정류장 데이터를 삭제합니다...')
            BusStop.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('기존 데이터 삭제 완료')
            )

        self.stdout.write(f'CSV 파일에서 데이터를 가져옵니다: {csv_file}')
        
        total_count = 0
        success_count = 0
        error_count = 0

        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                batch_objects = []
                
                for row_num, row in enumerate(reader, start=2):  # 헤더 제외하고 2부터 시작
                    total_count += 1
                    
                    try:
                        # CSV 행 데이터 검증 및 변환
                        정류장번호 = row.get('정류장번호', '').strip()
                        정류장명 = row.get('정류장명', '').strip()
                        위도_str = row.get('위도', '').strip()
                        경도_str = row.get('경도', '').strip()
                        
                        # 필수 필드 검증
                        if not 정류장번호 or not 정류장명:
                            self.stdout.write(
                                self.style.WARNING(f'행 {row_num}: 정류장번호 또는 정류장명이 비어있습니다.')
                            )
                            error_count += 1
                            continue
                        
                        # 좌표 변환
                        try:
                            위도 = float(위도_str) if 위도_str else None
                            경도 = float(경도_str) if 경도_str else None
                            
                            # 유효한 좌표 범위 검증 (한국 영역)
                            if 위도 and 경도:
                                if not (33 <= 위도 <= 39 and 124 <= 경도 <= 132):
                                    self.stdout.write(
                                        self.style.WARNING(f'행 {row_num}: 좌표가 한국 영역을 벗어납니다 ({위도}, {경도})')
                                    )
                                    error_count += 1
                                    continue
                                
                                위치 = Point(경도, 위도, srid=4326)  # 경도, 위도 순서 주의
                            else:
                                위치 = None
                                
                        except (ValueError, TypeError):
                            self.stdout.write(
                                self.style.WARNING(f'행 {row_num}: 유효하지 않은 좌표입니다 ({위도_str}, {경도_str})')
                            )
                            error_count += 1
                            continue
                        
                        # 날짜 변환
                        정보수집일 = None
                        정보수집일_str = row.get('정보수집일', '').strip()
                        if 정보수집일_str:
                            try:
                                정보수집일 = datetime.strptime(정보수집일_str, '%Y-%m-%d').date()
                            except ValueError:
                                self.stdout.write(
                                    self.style.WARNING(f'행 {row_num}: 유효하지 않은 날짜 형식입니다: {정보수집일_str}')
                                )
                        
                        # BusStop 객체 생성
                        bus_stop = BusStop(
                            정류장번호=정류장번호,
                            정류장명=정류장명,
                            위치=위치,
                            정보수집일=정보수집일,
                            모바일단축번호=row.get('모바일단축번호', '').strip() or None,
                            도시코드=row.get('도시코드', '').strip() or None,
                            도시명=row.get('도시명', '').strip() or None,
                            관리도시명=row.get('관리도시명', '').strip() or None,
                        )
                        
                        batch_objects.append(bus_stop)
                        
                        # 배치 크기에 도달하면 저장
                        if len(batch_objects) >= batch_size:
                            success_count += self._save_batch(batch_objects)
                            batch_objects = []
                            
                            if total_count % 10000 == 0:
                                self.stdout.write(f'처리 중... {total_count}개 행 처리됨')
                        
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'행 {row_num} 처리 오류: {str(e)}')
                        )
                        error_count += 1
                        continue
                
                # 마지막 배치 저장
                if batch_objects:
                    success_count += self._save_batch(batch_objects)

        except Exception as e:
            raise CommandError(f'CSV 파일 읽기 오류: {str(e)}')

        # 결과 출력
        self.stdout.write(
            self.style.SUCCESS(
                f'\n데이터 가져오기 완료!\n'
                f'총 처리된 행: {total_count}\n'
                f'성공적으로 저장된 정류장: {success_count}\n'
                f'오류 발생: {error_count}'
            )
        )

    def _save_batch(self, batch_objects):
        """배치 객체들을 데이터베이스에 저장"""
        try:
            with transaction.atomic():
                # bulk_create를 사용하여 성능 최적화
                created_objects = BusStop.objects.bulk_create(
                    batch_objects, 
                    ignore_conflicts=True,  # 중복 시 무시
                    batch_size=500
                )
                return len(created_objects)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'배치 저장 오류: {str(e)}')
            )
            return 0
