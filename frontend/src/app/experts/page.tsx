"use client";

import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function ExpertsPage() {
  return (
    <MobileLayout title="전문가 매칭">
      <Container>
        <Header>
          <HeaderEmoji>👨‍💼</HeaderEmoji>
          <Title>전문가 매칭</Title>
          <Subtitle>부동산 전문가와 1:1 상담하세요</Subtitle>
        </Header>

        <Content>
          <EmptyState>
            <EmptyIcon>🚀</EmptyIcon>
            <EmptyTitle>곧 만나요!</EmptyTitle>
            <EmptyText>
              부동산 전문가와의 매칭 서비스를
              <br />
              준비하고 있습니다.
            </EmptyText>
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </EmptyState>

          <FeatureList>
            <FeatureItem>
              <FeatureEmoji>💬</FeatureEmoji>
              <FeatureText>
                <FeatureTitle>1:1 전문 상담</FeatureTitle>
                <FeatureDesc>경험 많은 전문가와 실시간 상담</FeatureDesc>
              </FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureEmoji>📊</FeatureEmoji>
              <FeatureText>
                <FeatureTitle>시장 분석</FeatureTitle>
                <FeatureDesc>데이터 기반 시장 트렌드 분석</FeatureDesc>
              </FeatureText>
            </FeatureItem>
            <FeatureItem>
              <FeatureEmoji>✅</FeatureEmoji>
              <FeatureText>
                <FeatureTitle>맞춤 추천</FeatureTitle>
                <FeatureDesc>내 상황에 딱 맞는 매물 추천</FeatureDesc>
              </FeatureText>
            </FeatureItem>
          </FeatureList>
        </Content>
      </Container>
    </MobileLayout>
  );
}

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const Container = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
`;

const Header = styled.div`
  padding: 28px 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  text-align: center;
`;

const HeaderEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  animation: ${float} 3s ease-in-out infinite;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
`;

const Content = styled.div`
  flex: 1;
  padding: 24px 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  background: white;
  border-radius: 16px;
  padding: 40px 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.6s ease;
`;

const EmptyIcon = styled.div`
  font-size: 72px;
  margin-bottom: 20px;
  animation: ${float} 3s ease-in-out infinite;
`;

const EmptyTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
`;

const EmptyText = styled.p`
  font-size: 15px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 24px 0;
`;

const ComingSoonBadge = styled.div`
  display: inline-block;
  padding: 10px 24px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 13px;
  font-weight: 700;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const FeatureList = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.6s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const FeatureEmoji = styled.div`
  font-size: 36px;
  flex-shrink: 0;
`;

const FeatureText = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0 0 6px 0;
`;

const FeatureDesc = styled.p`
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

