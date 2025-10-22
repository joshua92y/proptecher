"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

interface ReportData {
  title: string;
  address: string;
  priceText: string;
  finalOpinion: string;
  recommendation: string;
  checklistData: {
    floorplan: string | null;
    external: ChecklistItem[];
    internal: ChecklistItem[];
  } | null;
  floorplanURL: string | null;
  confirmedAt: string;
  agentName: string | null;
  agentCompany: string | null;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
  photos: string[];
}

type Props = { params: Promise<{ inspectionId: string }> };

export default function InspectionReportViewPage({ params }: Props) {
  const { inspectionId } = React.use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReport();
  }, [inspectionId]);

  const loadReport = async () => {
    try {
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/inspections/${inspectionId}/view-report`
      );

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        alert("❌ 보고서를 불러올 수 없습니다");
        router.back();
      }
    } catch (error) {
      console.error("보고서 로딩 실패:", error);
      alert("❌ 보고서를 불러올 수 없습니다");
      router.back();
    } finally {
      setLoading(false);
    }
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <LoadingContainer>
          <LoadingText>보고서 로딩 중...</LoadingText>
        </LoadingContainer>
      </MobileLayout>
    );
  }

  if (!reportData) {
    return null;
  }

  const checklistData = reportData.checklistData;
  const externalChecked = checklistData?.external?.filter((i) => i.checked).length || 0;
  const externalTotal = checklistData?.external?.length || 0;
  const internalChecked = checklistData?.internal?.filter((i) => i.checked).length || 0;
  const internalTotal = checklistData?.internal?.length || 0;

  return (
    <MobileLayout showBottomNav={false}>
      <Container>
        <Header>
          <BackButton onClick={() => router.back()}>‹</BackButton>
          <Title>임장보고서</Title>
          <Spacer />
        </Header>

        <Content>
          <ConfirmedBanner>
            <BannerIcon>✅</BannerIcon>
            <BannerText>
              <BannerTitle>임장보고서가 완료되었습니다</BannerTitle>
              <BannerDate>{formatDate(reportData.confirmedAt)}</BannerDate>
            </BannerText>
          </ConfirmedBanner>

          {/* 매물 정보 */}
          <Section>
            <SectionTitle>📍 매물 정보</SectionTitle>
            <PropertyInfo>
              <PropertyTitle>{reportData.title}</PropertyTitle>
              <PropertyAddress>{reportData.address}</PropertyAddress>
              <PropertyPrice>{reportData.priceText}</PropertyPrice>
            </PropertyInfo>
          </Section>

          {/* 평가사 정보 */}
          {reportData.agentName && (
            <Section>
              <SectionTitle>👤 담당 평가사</SectionTitle>
              <AgentInfo>
                <AgentName>{reportData.agentName}</AgentName>
                {reportData.agentCompany && (
                  <AgentCompany>{reportData.agentCompany}</AgentCompany>
                )}
              </AgentInfo>
            </Section>
          )}

          {/* 평면도 */}
          {reportData.floorplanURL && (
            <Section>
              <SectionTitle>🏠 평면도</SectionTitle>
              <FloorplanImage
                src={reportData.floorplanURL}
                alt="평면도"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </Section>
          )}

          {/* 체크리스트 요약 */}
          {checklistData && (
            <Section>
              <SectionTitle>✅ 점검 항목</SectionTitle>
              <ChecklistSummary>
                <ChecklistRow>
                  <ChecklistLabel>🏢 외부 점검</ChecklistLabel>
                  <ChecklistValue>
                    {externalChecked} / {externalTotal}
                  </ChecklistValue>
                </ChecklistRow>
                <ChecklistRow>
                  <ChecklistLabel>🏠 내부 점검</ChecklistLabel>
                  <ChecklistValue>
                    {internalChecked} / {internalTotal}
                  </ChecklistValue>
                </ChecklistRow>
              </ChecklistSummary>
            </Section>
          )}

          {/* 추천 여부 */}
          <Section>
            <SectionTitle>💡 추천 여부</SectionTitle>
            <RecommendationBox>
              <LargeRecommendationBadge
                $color={getRecommendationColor(reportData.recommendation)}
              >
                <BadgeIcon>
                  {getRecommendationIcon(reportData.recommendation)}
                </BadgeIcon>
                <BadgeText>{reportData.recommendation}</BadgeText>
              </LargeRecommendationBadge>
            </RecommendationBox>
          </Section>

          {/* 종합 의견 */}
          <Section>
            <SectionTitle>📝 종합 의견</SectionTitle>
            <OpinionBox>{reportData.finalOpinion}</OpinionBox>
          </Section>
        </Content>

        <ButtonWrap>
          <BackToListButton onClick={() => router.push("/mypage/inspections")}>
            📋 목록으로 돌아가기
          </BackToListButton>
        </ButtonWrap>
      </Container>
    </MobileLayout>
  );
}

// Styled Components
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 100px;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 100;
`;

const BackButton = styled.button`
  font-size: 28px;
  color: #111;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const Spacer = styled.div`
  width: 32px;
`;

const Content = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: #6b7280;
`;

const ConfirmedBanner = styled.div`
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BannerIcon = styled.div`
  font-size: 48px;
`;

const BannerText = styled.div`
  flex: 1;
`;

const BannerTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const BannerDate = styled.div`
  font-size: 13px;
  opacity: 0.9;
`;

const Section = styled.section`
  background: white;
  margin: 12px 0;
  padding: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin: 0 0 16px 0;
`;

const PropertyInfo = styled.div``;

const PropertyTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin-bottom: 8px;
`;

const PropertyAddress = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const PropertyPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #7c3aed;
`;

const AgentInfo = styled.div``;

const AgentName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
`;

const AgentCompany = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const FloorplanImage = styled.img`
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const ChecklistSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChecklistRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
`;

const ChecklistLabel = styled.span`
  font-size: 14px;
  color: #374151;
`;

const ChecklistValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #7c3aed;
`;

const RecommendationBox = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
`;

const LargeRecommendationBadge = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 48px;
  border-radius: 16px;
  background: ${(p) => p.$color};
  color: white;
`;

const BadgeIcon = styled.div`
  font-size: 48px;
`;

const BadgeText = styled.div`
  font-size: 20px;
  font-weight: 700;
`;

const OpinionBox = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  white-space: pre-wrap;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #7c3aed;
`;

const ButtonWrap = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
  z-index: 100;
`;

const BackToListButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #6d28d9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

