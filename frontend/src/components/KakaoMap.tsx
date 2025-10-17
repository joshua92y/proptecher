"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 지도에 표시할 마커 데이터 타입
 */
export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  price?: string;
  onClick?: (id: string) => void;
}

interface KakaoMapProps {
  /** 지도 중심 좌표 */
  center?: { lat: number; lng: number };
  /** 지도 확대 레벨 (1-14, 작을수록 확대) */
  level?: number;
  /** 지도 너비 */
  width?: string;
  /** 지도 높이 */
  height?: string;
  /** 표시할 마커 목록 */
  markers?: MapMarker[];
  /** 마커 클릭 시 콜백 */
  onMarkerClick?: (markerId: string) => void;
  /** 지도 영역 변경 시 콜백 (bounds) */
  onBoundsChanged?: (bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) => void;
  /** 클러스터링 사용 여부 */
  useClusterer?: boolean;
}

/**
 * 카카오맵 컴포넌트
 * 
 * @example
 * ```tsx
 * <KakaoMap
 *   center={{ lat: 37.5665, lng: 126.9780 }}
 *   level={3}
 *   markers={[
 *     { id: "1", position: { lat: 37.5665, lng: 126.9780 }, title: "서울시청" }
 *   ]}
 *   onMarkerClick={(id) => console.log("Clicked:", id)}
 * />
 * ```
 */
export default function KakaoMap({
  center: initialCenter = { lat: 37.5665, lng: 126.9780 }, // 초기 중심 좌표
  level: initialLevel = 3, // 초기 확대 레벨
  width = "100%",
  height = "500px",
  markers = [],
  onMarkerClick,
  onBoundsChanged,
  useClusterer = false,
}: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const onBoundsChangedRef = useRef(onBoundsChanged);

  // onBoundsChanged가 변경되면 ref 업데이트
  useEffect(() => {
    onBoundsChangedRef.current = onBoundsChanged;
  }, [onBoundsChanged]);

  // 카카오맵 SDK 로드 및 지도 초기화 (최초 1회만)
  useEffect(() => {
    if (!mapContainerRef.current) {
      console.log("KakaoMap: mapContainerRef is not ready");
      return;
    }

    // 이미 지도가 생성되었으면 재생성하지 않음
    if (mapRef.current) {
      console.log("KakaoMap: Map already exists, skipping initialization");
      return;
    }

    const initMap = () => {
      console.log("KakaoMap: Initializing map...");
      console.log("KakaoMap: window.kakao exists?", !!window.kakao);
      
      if (!window.kakao || !window.kakao.maps) {
        console.error("❌ Kakao Maps SDK가 로드되지 않았습니다.");
        console.log("Tip: .env.local 파일과 Next.js 서버 재시작을 확인하세요.");
        return;
      }

      console.log("✅ Kakao Maps SDK loaded successfully");
      
      window.kakao.maps.load(() => {
        console.log("KakaoMap: kakao.maps.load() callback called");
        const container = mapContainerRef.current;
        if (!container) {
          console.error("Container element lost");
          return;
        }

        const options = {
          center: new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
          level: initialLevel,
        };

        console.log("KakaoMap: Creating map with options:", options);
        const map = new window.kakao.maps.Map(container, options);
        mapRef.current = map;
        console.log("✅ Map created successfully");

        // 클러스터러 초기화
        if (useClusterer && window.kakao.maps.MarkerClusterer) {
          clustererRef.current = new window.kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 5, // 레벨 5부터 클러스터링
            minClusterSize: 2,
          });
        }

        // 지도 영역 변경 이벤트 (idle 이벤트 사용 - 지도 이동이 완료된 후에만 호출)
        if (onBoundsChangedRef.current) {
          window.kakao.maps.event.addListener(map, "idle", () => {
            const bounds = map.getBounds();
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            
            if (onBoundsChangedRef.current) {
              onBoundsChangedRef.current({
                sw: { lat: sw.getLat(), lng: sw.getLng() },
                ne: { lat: ne.getLat(), lng: ne.getLng() },
              });
            }
          });
        }

        setIsMapLoaded(true);
      });
    };

    // SDK가 이미 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      if (window.kakao.maps.load) {
        initMap();
      } else {
        // 이미 로드된 경우
        setIsMapLoaded(true);
      }
    } else {
      // SDK 로드 대기
      const checkKakao = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakao);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkKakao);
    }
  }, []); // 빈 배열: 최초 마운트 시에만 실행

  // 마커 업데이트
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.kakao) return;

    // 기존 마커 제거
    const hadMarkers = markersRef.current.length > 0;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 클러스터러 초기화
    if (clustererRef.current) {
      clustererRef.current.clear();
    }

    // 새 마커 생성
    const newMarkers = markers.map((markerData) => {
      const markerPosition = new window.kakao.maps.LatLng(
        markerData.position.lat,
        markerData.position.lng
      );

      // 커스텀 마커 이미지 (선택사항)
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: markerData.title,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        if (onMarkerClick) {
          onMarkerClick(markerData.id);
        } else if (markerData.onClick) {
          markerData.onClick(markerData.id);
        }
      });

      // 인포윈도우 (가격 표시)
      if (markerData.price) {
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:12px;font-weight:bold;">${markerData.price}</div>`,
          removable: false,
        });

        // 마커 hover 시 인포윈도우 표시
        window.kakao.maps.event.addListener(marker, "mouseover", () => {
          infowindow.open(mapRef.current, marker);
        });

        window.kakao.maps.event.addListener(marker, "mouseout", () => {
          infowindow.close();
        });
      }

      return marker;
    });

    // 클러스터러 사용 시
    if (clustererRef.current && newMarkers.length > 0) {
      clustererRef.current.addMarkers(newMarkers);
    } else {
      // 일반 마커 표시
      newMarkers.forEach((marker) => marker.setMap(mapRef.current));
    }

    markersRef.current = newMarkers;

    // 마커가 있을 경우 지도 범위 조정 (최초 로드 시에만)
    if (newMarkers.length > 0 && !hadMarkers) {
      console.log("KakaoMap: Auto-fitting bounds (first time only)");
      const bounds = new window.kakao.maps.LatLngBounds();
      newMarkers.forEach((marker) => {
        bounds.extend(marker.getPosition());
      });
      mapRef.current.setBounds(bounds);
    }
  }, [isMapLoaded, markers, onMarkerClick]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width,
        height,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
}

