"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

interface MyInspection {
  id: string;
  inspectionId: string;
  title: string;
  address: string;
  priceText: string;
  recommendation: string;
  confirmedAt: string;
  img: string | null;
  agentName: string | null;
}

export default function MyInspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<MyInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInspections();
  }, []);

  const fetchMyInspections = async () => {
    try {
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/inspections/my-reports`);

      if (response.ok) {
        const data = await response.json();
        setInspections(data.reports || []);
      } else {
        console.error("임장보고서 목록 로딩 실패:", response.status);
      }
    } catch (error) {
      console.error("임장보고서 목록 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const goDetail = (inspectionId: string) => {
    router.push(`/mypage/inspections/${inspectionId}`);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "적극추천":
        return "#22c55e";
      case "추천":
        return "#3b82f6";
      case "보류":
        return "#f59e0b";
      case "비추천":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "적극추천":
        return "⭐";
      case "추천":
        return "👍";
      case "보류":
        return "⏸";
      case "비추천":
        return "👎";
      default:
        return "○";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <MobileLayout title="내 임장보고서">
      <Container>
        <Header>
          <Title>📋 내 임장보고서</Title>
          <Count>{inspections.length}건</Count>
        </Header>

        <Content>
          {loading ? (
            <EmptyState>로딩 중...</EmptyState>
          ) : inspections.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📋</EmptyIcon>
              <EmptyText>완료된 임장보고서가 없습니다</EmptyText>
              <EmptySubText>
                임장 요청 후 평가사가 보고서를 작성하면 여기에 표시됩니다
              </EmptySubText>
            </EmptyState>
          ) : (
            inspections.map((inspection) => (
              <Card
                key={inspection.id}
                onClick={() => goDetail(inspection.inspectionId)}
              >
                <Thumb
                  src={inspection.img || "/images/apt1.jpg"}
                  alt={inspection.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.background =
                      "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)";
                    target.alt = "이미지 없음";
                  }}
                />
                <CardInfo>
                  <CardTitle>{inspection.title}</CardTitle>
                  <CardAddress>{inspection.address}</CardAddress>
                  <CardPrice>{inspection.priceText}</CardPrice>

                  <InfoRow>
                    <RecommendationBadge
                      $color={getRecommendationColor(inspection.recommendation)}
                    >
                      {getRecommendationIcon(inspection.recommendation)}{" "}
                      {inspection.recommendation}
                    </RecommendationBadge>
                  </InfoRow>

                  {inspection.agentName && (
                    <AgentInfo>👤 {inspection.agentName} 평가사</AgentInfo>
                  )}

                  <ConfirmedDate>
                    📅 {formatDate(inspection.confirmedAt)}
                  </ConfirmedDate>
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

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 20px;
`;

const Header = styled.header`
  padding: 20px;
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const Count = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 6px 12px;
  border-radius: 20px;
`;

const Content = styled.div`
  padding: 16px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
`;

const EmptySubText = styled.div`
  font-size: 14px;
  color: #9ca3af;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.15);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const Thumb = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: #f3f4f6;
`;

const CardInfo = styled.div`
  padding: 16px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin: 0 0 8px 0;
`;

const CardAddress = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 4px;

  &:before {
    content: "📍";
  }
`;

const CardPrice = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: #7c3aed;
  margin: 0 0 12px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const RecommendationBadge = styled.div<{ $color: string }>`
  display: inline-block;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${(p) => p.$color};
  color: white;
  font-size: 13px;
  font-weight: 700;
`;

const AgentInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const ConfirmedDate = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
`;

