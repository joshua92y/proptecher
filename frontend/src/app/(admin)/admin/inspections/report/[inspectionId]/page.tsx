"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

type Props = { params: Promise<{ inspectionId: string }> };

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  photos: string[];
  memo: string;
}

interface ReportData {
  title: string;
  address: string;
  priceText: string;
  floorplanImage: string | null;
  external: ChecklistItem[];
  internal: ChecklistItem[];
}

// 추천 여부 색상 및 아이콘 헬퍼
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

export default function InspectionReportPage({ params }: Props) {
  const { inspectionId } = React.use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // 보고서 작성 필드
  const [recommendation, setRecommendation] = useState<string>("");
  const [finalOpinion, setFinalOpinion] = useState<string>("");
  
  // 확정 완료 상태
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string>("");

  useEffect(() => {
    loadReportData();
    checkIfConfirmed();
  }, [inspectionId]);

  const checkIfConfirmed = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/admin/inspections/${inspectionId}/report`
      );
      
      if (response.ok) {
        const data = await response.json();
        // 이미 확정된 보고서인 경우
        setRecommendation(data.recommendation || "");
        setFinalOpinion(data.finalOpinion || "");
        setIsConfirmed(true);
        setConfirmedAt(data.confirmedAt || "");
      }
    } catch (error) {
      // 확정되지 않은 보고서 - 작성 모드
      console.log("작성 모드");
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. 평면도 데이터 불러오기
      const floorplanResponse = await fetch(
        `${apiUrl}/api/admin/inspections/${inspectionId}/floorplan`
      );
      
      let floorplanImage = null;
      if (floorplanResponse.ok) {
        const floorplanData = await floorplanResponse.json();
        floorplanImage = floorplanData.floorplanURL || null;
      }
      
      // 2. 체크리스트 데이터 불러오기 (DB)
      let external = [];
      let internal = [];
      
      const progressResponse = await fetch(
        `${apiUrl}/api/admin/inspections/${inspectionId}/progress`
      );
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        if (progressData.checklistData) {
          external = progressData.checklistData.external || [];
          internal = progressData.checklistData.internal || [];
        }
      }
      
      setReportData({
        title: "서울 강남구 아파트",
        address: "서울특별시 강남구 테헤란로 123",
        priceText: "매매 10억원",
        floorplanImage,
        external,
        internal,
      });
      
    } catch (error) {
      console.error("보고서 데이터 로딩 실패:", error);
      
      // 오류 발생 시 기본 데이터
      setReportData({
        title: "임장 보고서",
        address: "",
        priceText: "",
        floorplanImage: null,
        external: [],
        internal: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!recommendation) {
      alert("추천 여부를 선택해주세요.");
      return;
    }
    if (!finalOpinion.trim()) {
      alert("종합 의견을 작성해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/admin/inspections/${inspectionId}/submit-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recommendation,
            finalOpinion,
            checklistData: {
              external: reportData?.external || [],
              internal: reportData?.internal || [],
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 보고서 확정:", result);
        
        // 확정 완료 상태로 전환
        setIsConfirmed(true);
        setConfirmedAt(result.confirmedAt || new Date().toISOString());
      } else {
        const error = await response.json();
        throw new Error(error.error || "보고서 확정 실패");
      }
    } catch (error) {
      console.error("보고서 확정 실패:", error);
      alert(`❌ 보고서 확정에 실패했습니다: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <Container>
          <LoadingText>보고서 데이터를 불러오는 중...</LoadingText>
        </Container>
      </MobileLayout>
    );
  }

  const allItems = [
    ...(reportData?.external || []),
    ...(reportData?.internal || []),
  ];
  const checkedCount = allItems.filter((item) => item.checked).length;
  const totalCount = allItems.length;

  // 확정 완료 후 보고서 화면
  if (isConfirmed) {
    return (
      <MobileLayout showBottomNav={false}>
        <Container>
          <Header>
            <BackButton onClick={() => router.push("/admin/inspections")}>‹</BackButton>
            <Title>임장보고서</Title>
            <Spacer />
          </Header>

          <Content>
            {/* 확정 완료 배너 */}
            <ConfirmedBanner>
              <BannerIcon>✅</BannerIcon>
              <BannerText>
                <BannerTitle>보고서가 확정되었습니다</BannerTitle>
                <BannerDate>
                  {new Date(confirmedAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </BannerDate>
              </BannerText>
            </ConfirmedBanner>

            {/* 매물 정보 */}
            <Section>
              <SectionTitle>매물 정보</SectionTitle>
              <InfoCard>
                <InfoRow>
                  <Label>주소</Label>
                  <Value>{reportData?.address || "-"}</Value>
                </InfoRow>
                <InfoRow>
                  <Label>가격</Label>
                  <Value>{reportData?.priceText || "-"}</Value>
                </InfoRow>
              </InfoCard>
            </Section>

            {/* 평면도 */}
            {reportData?.floorplanImage && (
              <Section>
                <SectionTitle>평면도</SectionTitle>
                <FloorplanImage src={reportData.floorplanImage} alt="평면도" />
              </Section>
            )}

            {/* 체크리스트 요약 */}
            <Section>
              <SectionTitle>체크리스트 현황</SectionTitle>
              <InfoCard>
                <InfoRow>
                  <Label>완료 항목</Label>
                  <Value>
                    {checkedCount} / {totalCount}
                  </Value>
                </InfoRow>
                <ChecklistSummary>
                  {allItems.map((item) => (
                    <ChecklistItem key={item.id}>
                      <Checkbox checked={item.checked}>
                        {item.checked ? "✓" : "○"}
                      </Checkbox>
                      <ChecklistLabel checked={item.checked}>
                        {item.label}
                      </ChecklistLabel>
                    </ChecklistItem>
                  ))}
                </ChecklistSummary>
              </InfoCard>
            </Section>

            {/* 추천 여부 */}
            <Section>
              <SectionTitle>추천 여부</SectionTitle>
              <RecommendationDisplay $color={getRecommendationColor(recommendation)}>
                {getRecommendationIcon(recommendation)} {recommendation}
              </RecommendationDisplay>
            </Section>

            {/* 종합 의견 */}
            <Section>
              <SectionTitle>종합 의견</SectionTitle>
              <OpinionDisplay>{finalOpinion}</OpinionDisplay>
            </Section>
          </Content>

          {/* 하단 버튼 */}
          <SubmitButtonWrap>
            <SubmitButton onClick={() => router.push("/admin/inspections")}>
              📋 임장요청 목록으로
            </SubmitButton>
          </SubmitButtonWrap>
        </Container>
      </MobileLayout>
    );
  }

  // 보고서 작성 화면
  return (
    <MobileLayout showBottomNav={false}>
      <Container>
        <Header>
          <BackButton onClick={() => router.back()}>‹</BackButton>
          <Title>임장보고서 작성</Title>
          <Spacer />
        </Header>

        <Content>
          {/* 매물 정보 */}
          <Section>
            <SectionTitle>매물 정보</SectionTitle>
            <InfoCard>
              <InfoRow>
                <Label>주소</Label>
                <Value>{reportData?.address || "-"}</Value>
              </InfoRow>
              <InfoRow>
                <Label>가격</Label>
                <Value>{reportData?.priceText || "-"}</Value>
              </InfoRow>
            </InfoCard>
          </Section>

          {/* 평면도 */}
          {reportData?.floorplanImage && (
            <Section>
              <SectionTitle>평면도</SectionTitle>
              <FloorplanImage src={reportData.floorplanImage} alt="평면도" />
            </Section>
          )}

          {/* 체크리스트 요약 */}
          <Section>
            <SectionTitle>체크리스트 현황</SectionTitle>
            <InfoCard>
              <InfoRow>
                <Label>완료 항목</Label>
                <Value>
                  {checkedCount} / {totalCount}
                </Value>
              </InfoRow>
              <ChecklistSummary>
                {allItems.map((item) => (
                  <ChecklistItem key={item.id}>
                    <Checkbox checked={item.checked}>
                      {item.checked ? "✓" : "○"}
                    </Checkbox>
                    <ChecklistLabel checked={item.checked}>
                      {item.label}
                    </ChecklistLabel>
                  </ChecklistItem>
                ))}
              </ChecklistSummary>
            </InfoCard>
          </Section>

          {/* 추천 여부 */}
          <Section>
            <SectionTitle>
              추천 여부 <Required>*</Required>
            </SectionTitle>
            <RecommendationButtons>
              <RecommendButton
                $selected={recommendation === "적극추천"}
                $color="#22c55e"
                onClick={() => setRecommendation("적극추천")}
              >
                ⭐ 적극 추천
              </RecommendButton>
              <RecommendButton
                $selected={recommendation === "추천"}
                $color="#3b82f6"
                onClick={() => setRecommendation("추천")}
              >
                👍 추천
              </RecommendButton>
              <RecommendButton
                $selected={recommendation === "보류"}
                $color="#f59e0b"
                onClick={() => setRecommendation("보류")}
              >
                ⏸ 보류
              </RecommendButton>
              <RecommendButton
                $selected={recommendation === "비추천"}
                $color="#ef4444"
                onClick={() => setRecommendation("비추천")}
              >
                👎 비추천
              </RecommendButton>
            </RecommendationButtons>
          </Section>

          {/* 종합 의견 */}
          <Section>
            <SectionTitle>
              종합 의견 <Required>*</Required>
            </SectionTitle>
            <OpinionTextarea
              placeholder="이 매물에 대한 종합적인 의견을 작성해주세요.&#10;&#10;예시:&#10;- 매물의 전반적인 상태&#10;- 장점과 단점&#10;- 특이사항&#10;- 가격 대비 가치&#10;- 투자/거주 가치 등"
              value={finalOpinion}
              onChange={(e) => setFinalOpinion(e.target.value)}
              rows={10}
            />
            <CharCount>{finalOpinion.length} 자</CharCount>
          </Section>
        </Content>

        {/* 제출 버튼 */}
        <SubmitButtonWrap>
          <SubmitButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? "확정 중..." : "✅ 보고서 확정"}
          </SubmitButton>
        </SubmitButtonWrap>
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
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #eee;
`;

const BackButton = styled.button`
  border: none;
  background: none;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  margin-right: 12px;
  color: #333;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const Spacer = styled.div`
  width: 40px;
`;

const Content = styled.div`
  padding: 20px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin: 0 0 12px 0;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 4px;
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111;
`;

const FloorplanImage = styled.img`
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ChecklistSummary = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChecklistItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.div<{ checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background: ${(p) => (p.checked ? "#7c3aed" : "#e5e7eb")};
  color: ${(p) => (p.checked ? "white" : "#9ca3af")};
  font-weight: 700;
`;

const ChecklistLabel = styled.span<{ checked: boolean }>`
  font-size: 13px;
  color: ${(p) => (p.checked ? "#111" : "#9ca3af")};
  text-decoration: ${(p) => (p.checked ? "none" : "line-through")};
`;

const RecommendationButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const RecommendButton = styled.button<{ $selected: boolean; $color: string }>`
  padding: 16px;
  border: 2px solid ${(p) => (p.$selected ? p.$color : "#e5e7eb")};
  border-radius: 12px;
  background: ${(p) => (p.$selected ? p.$color : "white")};
  color: ${(p) => (p.$selected ? "white" : "#6b7280")};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const OpinionTextarea = styled.textarea`
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
`;

const SubmitButtonWrap = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #eee;
  z-index: 10;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 14px;
  color: #6b7280;
`;

const ConfirmedBanner = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
`;

const BannerIcon = styled.div`
  font-size: 40px;
  flex-shrink: 0;
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

const RecommendationDisplay = styled.div<{ $color: string }>`
  padding: 20px;
  border-radius: 12px;
  background: ${(p) => p.$color};
  color: white;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 4px 12px ${(p) => p.$color}33;
`;

const OpinionDisplay = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  line-height: 1.8;
  color: #111;
  white-space: pre-wrap;
  word-break: break-word;
`;

