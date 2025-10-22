"use client";

import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function PolicyPage() {
  const categories = [
    { id: "all", label: "전체", active: true },
    { id: "tax", label: "세금", active: false },
    { id: "loan", label: "대출", active: false },
    { id: "support", label: "지원", active: false },
    { id: "subscription", label: "청약", active: false },
  ];

  const policies = [
    {
      id: 1,
      category: "청약",
      title: "2024년 주택 청약 제도 변경",
      summary: "생애최초 특별공급 청약 대상 확대 및 소득 기준 완화",
      date: "2024.10.15",
      views: 1234,
    },
    {
      id: 2,
      category: "세금",
      title: "취득세 감면 혜택 확대",
      summary: "신혼부부 생애최초 주택 구입 시 취득세 최대 200만원 감면",
      date: "2024.10.10",
      views: 987,
    },
    {
      id: 3,
      category: "지원",
      title: "신혼부부 특별공급 확대",
      summary: "전국 공공분양 아파트 신혼부부 특별공급 비율 20%로 확대",
      date: "2024.10.05",
      views: 856,
    },
    {
      id: 4,
      category: "대출",
      title: "디딤돌 대출 한도 상향",
      summary: "생애최초 주택 구입자 디딤돌 대출 최대 4억원까지 확대",
      date: "2024.10.01",
      views: 745,
    },
    {
      id: 5,
      category: "지원",
      title: "청년 전월세 보증금 지원",
      summary: "만 19-34세 청년 대상 전월세 보증금 최대 3,500만원 무이자 지원",
      date: "2024.09.28",
      views: 623,
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "청약":
        return { bg: "#e3f2fd", color: "#1565c0" };
      case "세금":
        return { bg: "#fff3e0", color: "#e65100" };
      case "지원":
        return { bg: "#e8f5e9", color: "#2e7d32" };
      case "대출":
        return { bg: "#f3e5f5", color: "#6a1b9a" };
      default:
        return { bg: "#f5f5f5", color: "#666" };
    }
  };

  return (
    <MobileLayout title="정책 정보">
      <Container>
        <Header suppressHydrationWarning={true}>
          <Title suppressHydrationWarning={true}>부동산 정책 정보</Title>
          <Subtitle suppressHydrationWarning={true}>최신 부동산 관련 정책을 확인하세요</Subtitle>
        </Header>

        <CategoryFilter suppressHydrationWarning={true}>
          {categories.map((cat) => (
            <CategoryButton key={cat.id} $active={cat.active} suppressHydrationWarning={true}>
              {cat.label}
            </CategoryButton>
          ))}
        </CategoryFilter>

        <PolicyList suppressHydrationWarning={true}>
          {policies.map((policy) => {
            const colors = getCategoryColor(policy.category);
            return (
              <PolicyItem key={policy.id} suppressHydrationWarning={true}>
                <PolicyHeader suppressHydrationWarning={true}>
                  <CategoryTag $bg={colors.bg} $color={colors.color} suppressHydrationWarning={true}>
                    {policy.category}
                  </CategoryTag>
                  <PolicyMeta>
                    <Date>{policy.date}</Date>
                    <Views>👁️ {policy.views.toLocaleString()}</Views>
                  </PolicyMeta>
                </PolicyHeader>
                <PolicyTitle>{policy.title}</PolicyTitle>
                <PolicySummary>{policy.summary}</PolicySummary>
              </PolicyItem>
            );
          })}
        </PolicyList>
      </Container>
    </MobileLayout>
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  min-height: 100%;
  background: #f8f9fa;
`;

const Header = styled.div`
  padding: 28px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: white;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryButton = styled.button<{ $active: boolean }>`
  padding: 10px 18px;
  border-radius: 24px;
  border: 2px solid ${(p) => (p.$active ? "#667eea" : "#e0e0e0")};
  background: ${(p) => (p.$active ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "white")};
  color: ${(p) => (p.$active ? "white" : "#666")};
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? "700" : "500")};
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const PolicyList = styled.div`
  padding: 16px 20px;
`;

const PolicyItem = styled.div`
  background: white;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const PolicyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CategoryTag = styled.span<{ $bg: string; $color: string }>`
  display: inline-block;
  padding: 6px 12px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
`;

const PolicyMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Date = styled.span`
  font-size: 12px;
  color: #999;
  font-weight: 500;
`;

const Views = styled.span`
  font-size: 12px;
  color: #999;
  font-weight: 500;
`;

const PolicyTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #222;
  margin: 0 0 10px 0;
  line-height: 1.5;
  transition: color 0.3s ease;

  ${PolicyItem}:hover & {
    color: #667eea;
  }
`;

const PolicySummary = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
`;

