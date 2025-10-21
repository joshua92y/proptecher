"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

// 진행중인 임장 타입
interface ActiveInspection {
  id: string;
  requestId: string;
  title: string;
  address: string;
  priceText: string;
  progress: number;
  img: string | null;
}

export default function ActiveInspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<ActiveInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const response = await fetch(`${apiUrl}/api/admin/inspections/active`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setInspections(data.active || []);
      } catch (error) {
        console.error("진행중인 임장 로딩 실패:", error);
        // Mock 데이터
        setInspections([
          {
            id: "1",
            requestId: "req1",
            title: "서울 강남구 아파트",
            address: "서울특별시 강남구 테헤란로 123",
            priceText: "매매 10억원",
            progress: 50,
            img: null,
          },
          {
            id: "2",
            requestId: "req2",
            title: "서울 송파구 오피스텔",
            address: "서울특별시 송파구 올림픽로 345",
            priceText: "전세 5억원",
            progress: 25,
            img: null,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActive();
  }, []);

  const goDetail = (id: string) => {
    router.push(`/admin/inspections/active/${id}`);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 26) return "#FF6B6B";
    if (progress < 51) return "#FFA94D";
    if (progress < 76) return "#FFD43B";
    return "#51CF66";
  };

  return (
    <MobileLayout>
      <Container>
        <Header>
          <Title>🔄 진행중인 임장</Title>
          <Count>{inspections.length}건</Count>
        </Header>

        <Content>
          {loading ? (
            <EmptyState>로딩 중...</EmptyState>
          ) : inspections.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📋</EmptyIcon>
              <EmptyText>진행중인 임장이 없습니다</EmptyText>
              <EmptySubText>요청을 수락하면 여기에 표시됩니다</EmptySubText>
            </EmptyState>
          ) : (
            inspections.map((inspection) => (
              <Card key={inspection.id} onClick={() => goDetail(inspection.id)}>
                <Thumb src={inspection.img || "/images/placeholder.jpg"} alt={inspection.title} />
                <CardInfo>
                  <CardTitle>{inspection.title}</CardTitle>
                  <CardAddress>{inspection.address}</CardAddress>
                  <CardPrice>{inspection.priceText}</CardPrice>
                  
                  <ProgressSection>
                    <ProgressLabel>
                      <span>진행률</span>
                      <ProgressPercent $color={getProgressColor(inspection.progress)}>
                        {inspection.progress}%
                      </ProgressPercent>
                    </ProgressLabel>
                    <ProgressBar>
                      <ProgressFill 
                        $progress={inspection.progress} 
                        $color={getProgressColor(inspection.progress)}
                      />
                    </ProgressBar>
                  </ProgressSection>
                </CardInfo>
              </Card>
            ))
          )}
        </Content>
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
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0;
`;

const Count = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
`;

const Content = styled.div`
  padding: 16px;
  animation: ${slideUp} 0.4s ease;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const Thumb = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardAddress = styled.p`
  font-size: 13px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardPrice = styled.p`
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
  margin: 0;
`;

const ProgressSection = styled.div`
  margin-top: 8px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;

  span {
    font-size: 12px;
    color: #999;
  }
`;

const ProgressPercent = styled.span<{ $color: string }>`
  font-size: 14px;
  font-weight: 700;
  color: ${(props) => props.$color} !important;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number; $color: string }>`
  width: ${(props) => props.$progress}%;
  height: 100%;
  background: ${(props) => props.$color};
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #666;
  margin: 0 0 8px 0;
`;

const EmptySubText = styled.p`
  font-size: 14px;
  color: #999;
  margin: 0;
`;
