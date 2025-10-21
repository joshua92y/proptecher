-- regions 앱의 마이그레이션 기록을 locations로 이전
-- django_migrations 테이블 업데이트

-- 1. regions 앱의 마이그레이션 기록 삭제 (regions 앱이 제거되었으므로)
DELETE FROM django_migrations WHERE app = 'regions';

-- 2. locations에 Region 모델이 추가되었음을 기록
INSERT INTO django_migrations (app, name, applied)
VALUES ('locations', '0004_region', NOW())
ON CONFLICT DO NOTHING;

-- 확인
SELECT app, name FROM django_migrations WHERE app IN ('regions', 'locations') ORDER BY app, name;

