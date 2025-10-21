"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import KakaoMap, { MapMarker } from "@/components/KakaoMap";
import MobileLayout from "@/components/MobileLayout";

// 임장 요청 타입
interface InspectionRequest {
  id: string;
  title: string;
  address: string;
  priceText: string;
  img: string | null;
  lat?: number;
  lng?: number;
  preferredDate?: string;
  contactPhone?: string;
}

// API 응답 타입
interface InspectionListResponse {
  requests: Array<{
    id: string;
    title: string;
    address: string;
    priceText: string;
    img: string | null;
  }>;
}

export default function AdminInspectionsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null);
  const [centerAddress, setCenterAddress] = useState("임장 요청 관리");
  const [showTopNav, setShowTopNav] = useState(true);
  const [modalHeight, setModalHeight] = useState(30); // 30%
  const [isDragging, setIsDragging] = useState(false);
  
  const initialCenter = useRef({ lat: 37.5665, lng: 126.9780 }); // 기본값 (서울)
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          initialCenter.current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("현재 위치:", initialCenter.current);
        },
        (error) => {
          console.warn("위치 권한 거부 또는 오류:", error);
          // 기본 위치 사용
        }
      );
    }
  }, []);

  // 임장 요청 목록 가져오기
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // TODO: 실제 인증 토큰 사용
      const response = await fetch(`${apiUrl}/api/admin/inspections/requests`, {
        headers: {
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: InspectionListResponse = await response.json();
      
      // 주소를 좌표로 변환 (Kakao Geocoder 사용)
      const requestsWithCoords = await Promise.all(
        data.requests.map(async (req) => {
          const coords = await geocodeAddress(req.address);
          return {
            ...req,
            lat: coords?.lat,
            lng: coords?.lng,
          };
        })
      );

      setRequests(requestsWithCoords);
    } catch (error) {
      console.error("임장 요청 목록 로딩 실패:", error);
      // Mock 데이터 사용
      setRequests([
        {
          id: "1",
          title: "서울 강남구 아파트",
          address: "서울특별시 강남구 테헤란로 123",
          priceText: "매매 10억원",
          img: null,
          lat: 37.5012,
          lng: 127.0396,
        },
        {
          id: "2",
          title: "서울 송파구 오피스텔",
          address: "서울특별시 송파구 올림픽로 345",
          priceText: "전세 5억원",
          img: null,
          lat: 37.5145,
          lng: 127.1059,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 주소를 좌표로 변환
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        resolve(null);
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve({
            lat: parseFloat(result[0].y),
            lng: parseFloat(result[0].x),
          });
        } else {
          resolve(null);
        }
      });
    });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 지도 영역 내 요청만 필터링
  const requestsInView = requests.filter((req) => {
    if (!bounds || !req.lat || !req.lng) return false;
    return (
      req.lat >= bounds.sw.lat &&
      req.lat <= bounds.ne.lat &&
      req.lng >= bounds.sw.lng &&
      req.lng <= bounds.ne.lng
    );
  });

  // 선택된 요청을 최상단에 표시
  const visibleList = selectedId
    ? [
        ...requestsInView.filter((r) => r.id === selectedId),
        ...requestsInView.filter((r) => r.id !== selectedId),
      ]
    : requestsInView;

  // 마커 데이터 생성
  const mapMarkers: MapMarker[] = requests
    .filter((req) => req.lat && req.lng)
    .map((req) => ({
      id: req.id,
      position: { lat: req.lat!, lng: req.lng! },
      title: req.title,
      price: req.priceText,
    }));

  // 지도 영역 변경 시 (debounced)
  const handleBoundsChanged = useCallback(
    debounce((newBounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
      setBounds(newBounds);
      setSelectedId(null);
      
      // 지도 중심의 주소 가져오기
      const centerLat = (newBounds.sw.lat + newBounds.ne.lat) / 2;
      const centerLng = (newBounds.sw.lng + newBounds.ne.lng) / 2;
      getAddressFromCoords(centerLat, centerLng);
    }, 500),
    []
  );

  // 좌표를 주소로 변환
  const getAddressFromCoords = (lat: number, lng: number) => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        const addr = result[0].address;
        const shortAddr = addr.region_3depth_name
          ? `${addr.region_2depth_name} ${addr.region_3depth_name}`
          : addr.region_2depth_name;
        setCenterAddress(shortAddr || "임장 요청 관리");
      }
    });
  };

  // 마커 클릭
  const handleMarkerClick = (markerId: string) => {
    setSelectedId(markerId);
    setModalHeight(70); // 70%로 확장
    
    // 선택된 요청의 주소 표시
    const selected = requests.find((r) => r.id === markerId);
    if (selected) {
      setCenterAddress(selected.address.split(" ").slice(0, 3).join(" "));
    }
  };

  // 요청 상세로 이동
  const goDetail = (id: string) => {
    router.push(`/admin/inspections/requests/${id}`);
  };

  // 드래그 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartHeight.current = modalHeight;
  }, [modalHeight]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY.current - currentY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (deltaY / windowHeight) * 100;

    let newHeight = dragStartHeight.current + deltaPercent;
    newHeight = Math.max(10, Math.min(90, newHeight));
    setModalHeight(newHeight);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // 스냅 포인트 (10%, 30%, 70%)
    if (modalHeight < 20) setModalHeight(10);
    else if (modalHeight < 50) setModalHeight(30);
    else setModalHeight(70);
  }, [modalHeight]);

  useEffect(() => {
    if (isDragging) {
      const move = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const end = () => handleDragEnd();

      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      window.addEventListener('touchmove', move);
      window.addEventListener('touchend', end);

      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', end);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', end);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <>
      {showTopNav && (
        <TopNavCustom>
          <TopNavButton onClick={() => router.push("/admin")}>🏠</TopNavButton>
          <TopNavTitle>{centerAddress}</TopNavTitle>
          <TopNavButton onClick={() => router.push("/mypage")}>👤</TopNavButton>
        </TopNavCustom>
      )}

      <Wrap onClick={() => setShowTopNav(!showTopNav)}>
        <MapWrap>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              로딩 중...
            </div>
          ) : (
            <KakaoMap
              key="inspection-map"
              center={initialCenter.current}
              level={6}
              markers={mapMarkers}
              onMarkerClick={handleMarkerClick}
              onBoundsChanged={handleBoundsChanged}
              useClusterer={true}
              width="100%"
              height="100%"
            />
          )}
        </MapWrap>

        <ListModal
          ref={modalRef}
          $height={modalHeight}
          $isDragging={isDragging}
          onClick={(e) => e.stopPropagation()}
        >
          <DragHandle
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <HandleBar />
          </DragHandle>

          <ModalHeader>
            <ModalTitle>
              📋 임장 요청 {requestsInView.length}건
            </ModalTitle>
            {selectedId && <SelectedBadge>선택됨</SelectedBadge>}
          </ModalHeader>

          <ModalContent>
            {loading ? (
              <Empty>로딩 중...</Empty>
            ) : visibleList.length === 0 ? (
              <Empty>이 영역에는 임장 요청이 없어요.</Empty>
            ) : (
              visibleList.map((req) => (
                <RequestCard key={req.id} onClick={() => goDetail(req.id)}>
                  <Thumb src={req.img || "/images/placeholder.jpg"} alt={req.title} />
                  <Info>
                    <h3>{req.title}</h3>
                    <p>{req.address}</p>
                    <Meta>
                      <span>{req.priceText}</span>
                      {req.preferredDate && <span>📅 {req.preferredDate}</span>}
                    </Meta>
                  </Info>
                  <Badge>요청됨</Badge>
                </RequestCard>
              ))
            )}
          </ModalContent>
        </ListModal>

        <BottomNavCustom>
          <BottomNavItem onClick={() => router.push("/")} $active={false}>
            <NavIcon>🏠</NavIcon>
            <NavLabel>홈</NavLabel>
          </BottomNavItem>
          <BottomNavItem onClick={() => router.push("/listings")} $active={false}>
            <NavIcon>🏘️</NavIcon>
            <NavLabel>부동산</NavLabel>
          </BottomNavItem>
          <BottomNavItem onClick={() => router.push("/admin/inspections")} $active={true}>
            <NavIcon>📋</NavIcon>
            <NavLabel>임장관리</NavLabel>
          </BottomNavItem>
          <BottomNavItem onClick={() => router.push("/mypage")} $active={false}>
            <NavIcon>👤</NavIcon>
            <NavLabel>MY</NavLabel>
          </BottomNavItem>
        </BottomNavCustom>
      </Wrap>
    </>
  );
}

// Debounce 함수
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Styled Components
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
`;

const MapWrap = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
`;

const ListModal = styled.div<{ $height: number; $isDragging: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${(props) => props.$height}vh;
  background: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: ${(props) => (props.$isDragging ? 'none' : 'height 0.3s ease')};
  z-index: 100;
  touch-action: none;
`;

const DragHandle = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }
`;

const HandleBar = styled.div`
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
`;

const ModalHeader = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const SelectedBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
  }
`;

const RequestCard = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }

  &:active {
    transform: translateY(0);
  }
`;

const Thumb = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  background: #f0f0f0;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 6px 0;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    font-size: 13px;
    color: #666;
    margin: 0 0 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Meta = styled.div`
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;

  span:first-child {
    color: #667eea;
    font-weight: 600;
  }
`;

const Badge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #FFA94D 0%, #FF6B6B 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
`;

const Empty = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
`;

// Top Navigation
const TopNavCustom = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 200;
  animation: ${fadeIn} 0.3s ease;
`;

const TopNavButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.9);
  }
`;

const TopNavTitle = styled.h1`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
`;

// Bottom Navigation
const BottomNavCustom = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom);
`;

const BottomNavItem = styled.div<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${(props) => (props.$active ? 1 : 0.5)};

  &:active {
    transform: scale(0.95);
  }
`;

const NavIcon = styled.div`
  font-size: 24px;
`;

const NavLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #333;
`;

