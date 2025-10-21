"use client";

import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function AdminDashboardPage() {
  const router = useRouter();

  const features = [
    {
      icon: "📋",
      title: "임장 요청",
      description: "새로운 임장 요청 확인",
      count: 5,
      path: "/admin/inspections",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      icon: "🔄",
      title: "진행중",
      description: "진행중인 임장 관리",
      count: 3,
      path: "/admin/inspections/active",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      icon: "✅",
      title: "완료",
      description: "완료된 임장 내역",
      count: 12,
      path: "/admin/inspections/completed",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      icon: "📊",
      title: "통계",
      description: "임장 통계 및 분석",
      count: null,
      path: "/admin/stats",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
  ];

  return (
    <MobileLayout>
      <Container>
        <Header>
          <Greeting>
            <GreetingIcon>👋</GreetingIcon>
            <div>
              <GreetingText>안녕하세요!</GreetingText>
              <GreetingSubText>평가사 대시보드</GreetingSubText>
            </div>
          </Greeting>
        </Header>

        <Content>
          <Section>
            <SectionTitle>빠른 메뉴</SectionTitle>
            <FeatureGrid>
              {features.map((feature, idx) => (
                <FeatureCard
                  key={idx}
                  onClick={() => router.push(feature.path)}
                  $gradient={feature.gradient}
                >
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                  {feature.count !== null && <FeatureCount>{feature.count}건</FeatureCount>}
                </FeatureCard>
              ))}
            </FeatureGrid>
          </Section>

          <Section>
            <SectionTitle>최근 활동</SectionTitle>
            <ActivityList>
              <ActivityItem>
                <ActivityIcon>📋</ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>새로운 임장 요청</ActivityTitle>
                  <ActivityTime>5분 전</ActivityTime>
                </ActivityContent>
              </ActivityItem>
              <ActivityItem>
                <ActivityIcon>✅</ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>임장 완료 처리</ActivityTitle>
                  <ActivityTime>1시간 전</ActivityTime>
                </ActivityContent>
              </ActivityItem>
              <ActivityItem>
                <ActivityIcon>🔄</ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>진행률 업데이트</ActivityTitle>
                  <ActivityTime>2시간 전</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            </ActivityList>
          </Section>
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

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f8f9fa 100%);
  animation: ${fadeIn} 0.3s ease;
`;

const Header = styled.div`
  background: white;
  padding: 24px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Greeting = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const GreetingIcon = styled.div`
  font-size: 48px;
  animation: ${float} 3s ease-in-out infinite;
`;

const GreetingText = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 4px 0;
`;

const GreetingSubText = styled.p`
  font-size: 14px;
  color: #999;
  margin: 0;
`;

const Content = styled.div`
  padding: 20px;
  animation: ${slideUp} 0.4s ease;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const FeatureCard = styled.div<{ $gradient: string }>`
  background: ${(props) => props.$gradient};
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 140px;
  display: flex;
  flex-direction: column;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
  }
`;

const FeatureIcon = styled.div`
  font-size: 36px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px 0;
`;

const FeatureDescription = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  flex: 1;
`;

const FeatureCount = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-top: 12px;
  text-align: right;
`;

const ActivityList = styled.div`
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
`;

const ActivityTime = styled.p`
  font-size: 12px;
  color: #999;
  margin: 0;
`;
