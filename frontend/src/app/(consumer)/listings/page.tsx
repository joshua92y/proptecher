/** 매물 지도 보기 페이지 */

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { getListings, type ListingListItem } from "@/lib/data/listings";
import KakaoMap, { type MapMarker } from "@/components/KakaoMap";
import MobileLayout from "@/components/MobileLayout";
import { getListingImageByType } from "@/lib/utils/randomImage";

/** 뷰포트 Bounds 타입(남서-북동) */
type Bounds = { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } };

/** ─────────────────────────────────────────
 * 페이지 컴포넌트
 * ───────────────────────────────────────── */
export default function ListingsPage() {
  const router = useRouter();

  /** 지도 상태 */
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const initialCenter = useRef<{ lat: number; lng: number }>({ lat: 35.0, lng: 127.0 });
  const [centerAddress, setCenterAddress] = useState<string>("위치 확인 중...");
  const [showTopNav, setShowTopNav] = useState(false);

  /** 매물 데이터 */
  const [allListings, setAllListings] = useState<ListingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  /** UI 상태 */
  const [modalHeight, setModalHeight] = useState(30); // 모달 높이 (%)
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(30);
  const lastMoveAt = useRef<number>(0);

  /** 초기 로딩: 전체 매물 가져오기 */
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const data = await getListings();
        setAllListings(data);
        
        // 첫 매물의 좌표로 초기 지도 중심 설정
        if (data.length > 0) {
          initialCenter.current = { lat: data[0].lat, lng: data[0].lng };
        }
      } catch (error) {
        console.error('Failed to load listings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  /** 지도 범위 내 매물 계산 */
  const listingsInView = useMemo(() => {
    if (!bounds) return allListings;
    return allListings.filter((l) =>
      l.lat >= bounds.sw.lat &&
      l.lat <= bounds.ne.lat &&
      l.lng >= bounds.sw.lng &&
      l.lng <= bounds.ne.lng
    );
  }, [allListings, bounds]);

  /** 선택된 매물만 리스트에 노출 */
  const visibleList = useMemo(() => {
    if (selectedId) return listingsInView.filter((l) => l.id === selectedId);
    return listingsInView;
  }, [listingsInView, selectedId]);

  /** 지도 마커 데이터 변환 */
  const mapMarkers: MapMarker[] = useMemo(() => {
    return allListings.map((listing) => ({
      id: listing.id,
      position: {
        lat: listing.lat,
        lng: listing.lng,
      },
      title: listing.title,
      price: listing.price,
    }));
  }, [allListings]);

  /** 지도 영역 변경 핸들러 (debounced) */
  const handleBoundsChanged = useCallback((newBounds: Bounds) => {
    const now = Date.now();
    if (now - lastMoveAt.current < 500) {
      return;
    }
    
    lastMoveAt.current = now;
    setBounds(newBounds);
    setSelectedId(null);
    
    // 중앙 좌표로 주소 변환
    const centerLat = (newBounds.sw.lat + newBounds.ne.lat) / 2;
    const centerLng = (newBounds.sw.lng + newBounds.ne.lng) / 2;
    getAddressFromCoords(centerLat, centerLng);
  }, []);

  /** 좌표를 주소로 변환 (Kakao API) */
  const getAddressFromCoords = useCallback((lat: number, lng: number) => {
    if (!window.kakao || !window.kakao.maps) return;
    
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        const addr = result[0].address;
        // 읍/면/동 + 번지만 표시
        const shortAddr = `${addr.region_3depth_name} ${addr.main_address_no}`;
        setCenterAddress(shortAddr || "주소 없음");
      }
    });
  }, []);

  /** 마커 클릭 시: 모달 올리기 + 주소 가져오기 */
  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
    setModalHeight(70); // 모달 70%로 올리기
    
    // 선택된 매물의 주소 가져오기
    const listing = allListings.find(l => l.id === id);
    if (listing) {
      getAddressFromCoords(listing.lat, listing.lng);
    }
  }, [allListings, getAddressFromCoords]);

  /** 드래그 시작 */
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = modalHeight;
  }, [modalHeight]);

  /** 드래그 중 */
  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = dragStartY.current - clientY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (deltaY / windowHeight) * 100;
    
    let newHeight = dragStartHeight.current + deltaPercent;
    newHeight = Math.max(10, Math.min(90, newHeight)); // 10% ~ 90%
    
    setModalHeight(newHeight);
  }, [isDragging]);

  /** 드래그 종료 */
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 스냅 포인트로 이동
    if (modalHeight < 25) {
      setModalHeight(10); // 최소
    } else if (modalHeight < 50) {
      setModalHeight(30); // 중간
    } else {
      setModalHeight(70); // 최대
    }
  }, [isDragging, modalHeight]);

  /** 드래그 이벤트 리스너 */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  /** 리스트 아이템 클릭 시: 상세 페이지 이동 */
  const goDetail = (id: string) => router.push(`/listings/${id}`);

  return (
    <>
      {/* 상단바 (조건부) */}
      {showTopNav && (
        <TopNavCustom>
          <TopNavButton onClick={() => router.push("/")}>🏠</TopNavButton>
          <TopNavTitle>{centerAddress}</TopNavTitle>
          <TopNavButton onClick={() => router.push("/mypage")}>👤</TopNavButton>
        </TopNavCustom>
      )}

      {/* 지도 + 모달 */}
      <Wrap onClick={() => setShowTopNav(!showTopNav)}>

      {/* 전체 화면 지도 */}
      <MapWrap>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            로딩 중...
          </div>
        ) : (
          <KakaoMap
            key="kakao-map"
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

      {/* 하단 드래그 가능 모달 */}
      <ListModal 
        $height={modalHeight} 
        $isDragging={isDragging}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <DragHandle 
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <HandleBar />
        </DragHandle>

        {/* 모달 헤더 */}
        <ModalHeader>
          <ModalTitle>
            전체 매물 {listingsInView.length}개
          </ModalTitle>
          {selectedId && <SelectedBadge>선택된 매물</SelectedBadge>}
        </ModalHeader>

        {/* 매물 리스트 */}
        <ModalContent>
          {loading ? (
            <Empty>로딩 중...</Empty>
          ) : visibleList.length === 0 ? (
            <Empty>이 영역에는 매물이 없어요.</Empty>
          ) : (
            visibleList.map((l) => (
              <ListItem key={l.id} onClick={() => goDetail(l.id)}>
                <Thumb src={getListingImageByType(l.id, l.type, l.img)} alt={l.title} />
                <Info>
                  <h3>{l.title}</h3>
                  <p>{l.addr}</p>
                  <Meta>{l.price}</Meta>
                </Info>
              </ListItem>
            ))
          )}
        </ModalContent>
      </ListModal>

      {/* 하단 네비게이션 */}
      <BottomNavCustom>
        <BottomNavItem onClick={() => router.push("/")} $active={false}>
          <NavIcon>🏠</NavIcon>
          <NavLabel>홈</NavLabel>
        </BottomNavItem>
        <BottomNavItem onClick={() => router.push("/listings")} $active={true}>
          <NavIcon>🏘️</NavIcon>
          <NavLabel>부동산</NavLabel>
        </BottomNavItem>
        <BottomNavItem onClick={() => router.push("/experts")} $active={false}>
          <NavIcon>👨‍💼</NavIcon>
          <NavLabel>전문가</NavLabel>
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

/** ─────────────────────────────────────────
 * styled-components (컴포넌트 아래에 배치)
 * ───────────────────────────────────────── */
const Wrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const MapWrap = styled.section`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

// 커스텀 상단바
const TopNavCustom = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const TopNavButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  border-radius: 50%;
  
  &:active {
    background: #f0f0f0;
  }
`;

const TopNavTitle = styled.h1`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

// 커스텀 하단바
const BottomNavCustom = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-top: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
`;

const BottomNavItem = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px 4px;

  &:active {
    background: #f5f5f5;
  }
`;

const NavIcon = styled.span`
  font-size: 20px;
`;

const NavLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #666;
`;

// 하단 드래그 모달
const ListModal = styled.div<{ $height: number; $isDragging: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${(p) => p.$height}%;
  background: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  transition: ${(p) => (p.$isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)')};
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DragHandle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const HandleBar = styled.div`
  width: 40px;
  height: 4px;
  background: #d0d0d0;
  border-radius: 2px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #222;
  margin: 0;
`;

const SelectedBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
`;

const ListItem = styled.div`
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Thumb = styled.img`
  width: 88px;
  height: 66px;
  object-fit: cover;
  border-radius: 10px;
  background: #f5f5f5;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;

  h3 { 
    font-size: 15px; 
    font-weight: 700; 
    color: #222;
    margin: 0;
  }
  
  p { 
    font-size: 13px; 
    color: #666; 
    margin: 0;
  }
`;

const Meta = styled.div`
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Empty = styled.div`
  text-align: center;
  color: #999;
  padding: 60px 20px;
  font-size: 15px;
`;
