-- backend/init.sql
-- PostgreSQL 초기화 스크립트

-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- locations_korea 스키마 생성
CREATE SCHEMA IF NOT EXISTS locations_korea;

-- 스키마 권한 설정
GRANT USAGE ON SCHEMA locations_korea TO postgres;
GRANT CREATE ON SCHEMA locations_korea TO postgres;

-- 테이블 생성 (예시 - 실제 데이터는 별도로 import 필요)
CREATE TABLE IF NOT EXISTS locations_korea.sido_5179 (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(MULTIPOLYGON, 5179),
    "UFID" VARCHAR(34),
    "BJCD" VARCHAR(10),
    "NAME" VARCHAR(100),
    "DIVI" VARCHAR(6),
    "SCLS" VARCHAR(8),
    "FMTA" VARCHAR(9),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 공간 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sido_5179_geom ON locations_korea.sido_5179 USING GIST (geom);

-- 테이블 권한 설정
GRANT ALL PRIVILEGES ON TABLE locations_korea.sido_5179 TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE locations_korea.sido_5179_id_seq TO postgres;
