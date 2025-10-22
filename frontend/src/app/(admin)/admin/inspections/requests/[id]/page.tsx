"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";
import KakaoMap, { MapMarker } from "@/components/KakaoMap";

// 임장 요청 상세 타입
interface InspectionRequestDetail {
  id: string;
  listing_id: string;
  title: string;
  address: string;
  priceText: string;
  fee_won: number;
  preferred_date: string;
  contact_phone: string;
  request_note: string | null;
  description: string | null;
  highlights: string[] | null;
  photos: string[] | null;
  requested_at: number;
  img: string | null;
  lat?: number;
  lng?: number;
}

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<InspectionRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 지도 마커 데이터
  const mapMarkers: MapMarker[] = request && request.lat && request.lng ? [
    {
      id: request.id,
      position: { lat: request.lat, lng: request.lng },
      title: request.title,
      price: request.priceText,
    }
  ] : [];

  // 요청 상세 가져오기
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        
        // 개발 중: Mock 데이터 사용 (인증 구현 후 API 연동)
        console.log("📋 임장 요청 상세 로딩 (Mock 데이터)");
        
        await new Promise(resolve => setTimeout(resolve, 300)); // 로딩 시뮬레이션
        
        // Mock 데이터
        setRequest({
          id: requestId,
          listing_id: "1",
          title: "서울 강남구 아파트",
          address: "서울특별시 강남구 테헤란로 123",
          priceText: "매매 10억원",
          fee_won: 150000,
          preferred_date: "2025-11-15",
          contact_phone: "010-1234-5678",
          request_note: "주말 오후 방문 희망합니다. 주차 가능 여부도 확인 부탁드립니다.",
          description: "최근 리모델링한 깔끔한 아파트입니다. 남향이며 고층입니다.",
          highlights: ["남향", "고층", "역세권", "주차 2대"],
          photos: null,
          requested_at: Date.now(),
          img: "/images/apt1.jpg",
          lat: 37.5012,  // 강남역 근처 좌표
          lng: 127.0396,
        });
        
        // TODO: 실제 API 연동 (인증 구현 후)
        // const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // const response = await fetch(`${apiUrl}/api/admin/inspections/requests/${requestId}`, {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
        // const data = await response.json();
        // setRequest(data);
        
      } catch (error) {
        console.error("임장 요청 상세 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [requestId]);

  // 수락 처리
  const handleAccept = async () => {
    if (!confirm("이 임장 요청을 수락하시겠습니까?")) return;

    try {
      setProcessing(true);
      
      // 개발 중: Mock 처리 (인증 구현 후 API 연동)
      console.log("✅ 임장 요청 수락 처리 (Mock):", requestId);
      await new Promise(resolve => setTimeout(resolve, 500)); // 처리 시뮬레이션
      
      // TODO: 실제 API 연동 (인증 구현 후)
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // const response = await fetch(`${apiUrl}/api/admin/inspections/${requestId}/accept`, {
      //   method: "POST",
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });
      // if (!response.ok) {
      //   throw new Error("수락 실패");
      // }

      alert("✅ 임장 요청을 수락했습니다!");
      router.push("/admin/inspections");
    } catch (error) {
      console.error("수락 처리 실패:", error);
      alert("❌ 수락 처리에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };


  if (loading) {
    return (
      <MobileLayout>
        <Container>
          <LoadingText>로딩 중...</LoadingText>
        </Container>
      </MobileLayout>
    );
  }

  if (!request) {
    return (
      <MobileLayout>
        <Container>
          <ErrorText>요청을 찾을 수 없습니다.</ErrorText>
        </Container>
      </MobileLayout>
    );
  }

  const requestDate = new Date(request.requested_at);

  return (
    <MobileLayout>
      <Container>
        <HeroImage
          src={request.img || "/images/apartment-1.jpg"}
          alt={request.title}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            target.alt = "이미지 없음";
          }}
        />

        {request.lat && request.lng && (
          <PropertyMapWrap>
            <MapTitle>🏠 매물 위치</MapTitle>
            <KakaoMap
              center={{ lat: request.lat, lng: request.lng }}
              level={3} // 확대된 상태로 표시
              markers={mapMarkers}
              width="100%"
              height="300px"
              useClusterer={false}
            />
          </PropertyMapWrap>
        )}

        <ContentWrap>
          <Section>
            <SectionTitle>📋 요청 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>매물명</InfoLabel>
                <InfoValue>{request.title}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>주소</InfoLabel>
                <InfoValue>{request.address}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>가격</InfoLabel>
                <InfoValue $highlight>{request.priceText}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </Section>

          <Divider />

          <Section>
            <SectionTitle>👤 요청자 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>📞 연락처</InfoLabel>
                <InfoValue>
                  <PhoneLink href={`tel:${request.contact_phone}`}>
                    {request.contact_phone}
                  </PhoneLink>
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>📅 희망 날짜</InfoLabel>
                <InfoValue>{request.preferred_date}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>💬 요청사항</InfoLabel>
                <InfoValue>
                  {request.request_note || "없음"}
                </InfoValue>
              </InfoItem>
            </InfoGrid>
          </Section>

          <Divider />

          <Section>
            <SectionTitle>💰 임장 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>임장비</InfoLabel>
                <InfoValue $highlight>
                  {request.fee_won.toLocaleString()}원
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>요청일시</InfoLabel>
                <InfoValue>
                  {requestDate.toLocaleDateString()} {requestDate.toLocaleTimeString()}
                </InfoValue>
              </InfoItem>
            </InfoGrid>
          </Section>

          {request.description && (
            <>
              <Divider />
              <Section>
                <SectionTitle>📝 매물 설명</SectionTitle>
                <Description>{request.description}</Description>
              </Section>
            </>
          )}

          {request.highlights && request.highlights.length > 0 && (
            <>
              <Divider />
              <Section>
                <SectionTitle>✨ 특징</SectionTitle>
                <TagList>
                  {request.highlights.map((tag, idx) => (
                    <Tag key={idx}>{tag}</Tag>
                  ))}
                </TagList>
              </Section>
            </>
          )}
        </ContentWrap>

        <ButtonGroup>
          <AcceptButton onClick={handleAccept} disabled={processing}>
            {processing ? "처리 중..." : "수락하기"}
          </AcceptButton>
        </ButtonGroup>
      </Container>
    </MobileLayout>
  );
}

// Styled Components
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  animation: ${fadeIn} 0.3s ease;
  padding-bottom: 140px; /* ButtonGroup(64px + 패딩) + BottomNav(64px) 고려 */
`;

const HeroImage = styled.img`
  width: 100%;
  height: 280px;
  object-fit: cover;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const PropertyMapWrap = styled.div`
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #eee;
`;

const MapTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
`;

const ContentWrap = styled.div`
  padding: 20px;
  animation: ${slideUp} 0.4s ease;
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 13px;
  color: #999;
  font-weight: 500;
`;

const InfoValue = styled.span<{ $highlight?: boolean }>`
  font-size: 15px;
  color: ${(props) => (props.$highlight ? "#667eea" : "#333")};
  font-weight: ${(props) => (props.$highlight ? "600" : "400")};
  word-break: break-word;
`;

const PhoneLink = styled.a`
  color: #667eea;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 24px 0;
`;

const Description = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: #666;
  margin: 0;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  color: #667eea;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  position: fixed;
  bottom: 64px; /* BottomNav 높이만큼 위로 이동 */
  left: 0;
  right: 0;
  display: flex;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  z-index: 999; /* BottomNav(1000)보다 낮게 설정 */
`;

const AcceptButton = styled.button`
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
`;

const ErrorText = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #EF4444;
  font-size: 16px;
`;

