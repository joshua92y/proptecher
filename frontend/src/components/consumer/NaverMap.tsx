"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type LatLng = { lat: number; lng: number };
type Bounds = { sw: LatLng; ne: LatLng };

type Marker = { id: string; position: LatLng; title?: string };

export default function NaverMap({
  center = { lat: 37.5665, lng: 126.9780 }, // 기본: 서울
  zoom = 14,
  markers = [],
  onMove,
  onMarkerClick,
}: {
  center?: LatLng;
  zoom?: number;
  markers?: Marker[];
  onMove?: (c: LatLng, b: Bounds) => void;
  onMarkerClick?: (id: string) => void;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const ncpId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;

  /** 스크립트 로드 후 지도 초기화 */
  const handleLoad = () => {
    if (!mapDivRef.current || !window.naver) return;

    const map = new naver.maps.Map(mapDivRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom,
      zoomControl: true,
    });
    mapRef.current = map;

    // 최초 bounds 알리기
    notifyMove();

    // 이동/줌 이벤트
    naver.maps.Event.addListener(map, "dragend", notifyMove);
    naver.maps.Event.addListener(map, "zoom_changed", notifyMove);

    // 마커 생성
    markers.forEach((m) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(m.position.lat, m.position.lng),
        map,
        title: m.title,
      });
      naver.maps.Event.addListener(marker, "click", () => {
        onMarkerClick?.(m.id);
      });
    });
  };

  const notifyMove = () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    const b = map.getBounds();
    onMove?.(
      { lat: c.y, lng: c.x },
      {
        sw: { lat: b.getMinY(), lng: b.getMinX() },
        ne: { lat: b.getMaxY(), lng: b.getMaxX() },
      }
    );
  };

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${ncpId}&submodules=geocoder`}
        strategy="afterInteractive"
        onLoad={handleLoad}
      />
      <div ref={mapDivRef} style={{ width: "100%", height: 360 }} />
    </>
  );
}
