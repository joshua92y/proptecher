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
  exclusive_area_pyeong?: number; // 전용면적(평)
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
  const overlaysRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(initialLevel);
  const onBoundsChangedRef = useRef(onBoundsChanged);
  const onMarkerClickRef = useRef(onMarkerClick);

  // 콜백 함수들이 변경되면 ref 업데이트
  useEffect(() => {
    onBoundsChangedRef.current = onBoundsChanged;
  }, [onBoundsChanged]);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // 인포윈도우 및 지도 클릭 이벤트 리스너
  useEffect(() => {
    const handleMarkerClick = (event: any) => {
      const markerId = event.detail;
      if (onMarkerClickRef.current) {
        onMarkerClickRef.current(markerId);
      }
    };

    const handleMapClick = () => {
      // 지도 빈 곳 클릭 시 이벤트 발생
      window.dispatchEvent(new CustomEvent('mapEmptyClick'));
    };

    window.addEventListener('markerClick', handleMarkerClick);
    window.addEventListener('mapClick', handleMapClick);

    return () => {
      window.removeEventListener('markerClick', handleMarkerClick);
      window.removeEventListener('mapClick', handleMapClick);
    };
  }, []); // 의존성 제거하여 매번 리렌더링 방지

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
      console.log("KakaoMap: window.kakao.maps exists?", !!window.kakao?.maps);
      console.log("KakaoMap: Script src should be loaded");

      // SDK 로딩 대기
      if (!window.kakao || !window.kakao.maps) {
        console.error("❌ Kakao Maps SDK가 아직 로드되지 않았습니다. 재시도 중...");
        setTimeout(() => {
          if (!window.kakao || !window.kakao.maps) {
            console.error("❌ Kakao Maps SDK 로드 실패. .env.local 파일을 확인하세요.");
            console.log("환경변수 확인:", process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY);
            return;
          }
          initMap(); // 재시도
        }, 1000);
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

        // 확대 레벨 변경 이벤트
        window.kakao.maps.event.addListener(map, "zoom_changed", () => {
          const level = map.getLevel();
          setCurrentZoomLevel(level);
        });

        // 지도 클릭 이벤트 (빈 곳 클릭 시)
        window.kakao.maps.event.addListener(map, "click", () => {
          // 지도 빈 곳 클릭 시 이벤트 발생
          window.dispatchEvent(new CustomEvent('mapClick'));
        });

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

    // 확대 레벨에 따른 표시 로직 결정
    const SHOW_INFOWINDOW_LEVEL = 4; // 레벨 4 이하에서는 인포윈도우 표시
    const showInfoWindows = currentZoomLevel <= SHOW_INFOWINDOW_LEVEL;
    const showMarkers = currentZoomLevel > SHOW_INFOWINDOW_LEVEL;

    // 기존 마커/오버레이 제거
    const hadMarkers = markersRef.current.length > 0;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    overlaysRef.current.forEach((ov) => ov.setMap(null));
    overlaysRef.current = [];

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

      // 마커 표시/숨김 제어
      if (showMarkers) {
        marker.setMap(mapRef.current);
      }

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        // 축소된 상태에서 마커 클릭 시 자동 확대
        const ZOOM_IN_LEVEL = 4; // 확대할 목표 레벨
        const ZOOM_THRESHOLD = 6; // 이 레벨 이상에서 확대 적용

        if (currentZoomLevel >= ZOOM_THRESHOLD && mapRef.current) {
          // 확대 애니메이션이 완료된 후 클릭 콜백 실행
          const handleZoomComplete = () => {
            // 확대 완료 이벤트 리스너 제거
            window.kakao.maps.event.removeListener(mapRef.current, "idle", handleZoomComplete);

            // 이제 클릭 콜백 실행 (모달 열기)
            if (onMarkerClickRef.current) {
              onMarkerClickRef.current(markerData.id);
            } else if (markerData.onClick) {
              markerData.onClick(markerData.id);
            }
          };

          // 확대 완료 이벤트 리스너 추가
          window.kakao.maps.event.addListener(mapRef.current, "idle", handleZoomComplete);

          // 마커 위치로 지도 중심 이동 및 확대
          mapRef.current.setLevel(ZOOM_IN_LEVEL);
          mapRef.current.setCenter(markerPosition);
        } else {
          // 이미 확대된 상태라면 바로 클릭 콜백 실행
          if (onMarkerClickRef.current) {
            onMarkerClickRef.current(markerData.id);
          } else if (markerData.onClick) {
            markerData.onClick(markerData.id);
          }
        }
      });

      // 커스텀 오버레이 (디자인된 말풍선) - 확대 레벨에 따라 표시
      if (showInfoWindows && markerData.price) {
        const content = `
          <style>
            @media (max-width: 768px) {
              .info-window { width: 52px !important; }
              .info-header { height: 24px !important; }
              .info-body { height: 28px !important; }
              .info-area { font-size: 11px !important; line-height: 22px !important; }
              .info-price { font-size: 10px !important; line-height: 24px !important; }
              .info-tail { border-left-width: 3px !important; border-right-width: 3px !important; border-top-width: 6px !important; bottom: -6px !important; }
            }
            @media (max-width: 480px) {
              .info-window { width: 45px !important; }
              .info-header { height: 22px !important; }
              .info-body { height: 26px !important; }
              .info-area { font-size: 10px !important; line-height: 20px !important; }
              .info-price { font-size: 9px !important; line-height: 22px !important; }
              .info-tail { border-left-width: 3px !important; border-right-width: 3px !important; border-top-width: 5px !important; bottom: -5px !important; }
            }
          </style>
          <div class="info-window" style="
            position: relative;
            width: 65px;
            height: auto;
            background: #FFFFFF;
            box-shadow: 0px 2px 10.4px rgba(0, 0, 0, 0.25);
            border-radius: 8px;
            overflow: hidden;
            transform: translateY(-6px);
            cursor: pointer;
          " onclick="window.dispatchEvent(new CustomEvent('markerClick', {detail: '${markerData.id}'}))">
            <!-- 상단 파란색 헤더 (평수) -->
            <div class="info-header" style="
              width: 100%;
              height: 28px;
              background: #198AE5;
              border-radius: 8px 8px 0px 0px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span class="info-area" style="
                font-family: 'Pretendard', sans-serif;
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 26px;
                text-align: center;
                color: #FFFFFF;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                padding: 0 3px;
              ">${markerData.exclusive_area_pyeong ? Math.round(markerData.exclusive_area_pyeong) + '평' : '정보 없음'}</span>
            </div>
            <!-- 하단 흰색 본체 (가격) -->
            <div class="info-body" style="
              width: 100%;
              height: 32px;
              background: #FFFFFF;
              border: 1px solid #BFBFBF;
              border-top: none;
              border-radius: 0px 0px 8px 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span class="info-price" style="
                font-family: 'Pretendard', sans-serif;
                font-style: normal;
                font-weight: 400;
                font-size: 11px;
                line-height: 28px;
                text-align: center;
                color: #353535;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                padding: 0 3px;
              ">${markerData.price || markerData.title || "매물"}</span>
            </div>
            <!-- 아래쪽 뾰족한 꼬리 (마커처럼) -->
            <div class="info-tail" style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 8px solid #FFFFFF;
              filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2));
            "></div>
          </div>`;
        const overlay = new window.kakao.maps.CustomOverlay({
          position: markerPosition,
          content,
          yAnchor: 1.0,
          zIndex: 10,
        });
        overlay.setMap(mapRef.current);
        overlaysRef.current.push(overlay);
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
  }, [isMapLoaded, markers, onMarkerClick, currentZoomLevel]);

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

