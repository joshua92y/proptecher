"use client";

import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function Home() {
  const router = useRouter();

  // 새로운 홈페이지 기능
  const handlePlusClick = () => {
    router.push('/properties');
  };

  const handleCardClick = () => {
    console.log('Card clicked');
  };

  return (
    <MobileLayout title="홈">
      <div>
        {/* 새로운 홈페이지 디자인 */}
        <NewHomeContainer>
          {/* Header */}
          <NewHeader>
            <NewLogo>이주메이트</NewLogo>
            <NewHeaderActions>
              <NewIconButton>
                <SearchIcon>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </SearchIcon>
                <IconLabel>검색하기</IconLabel>
              </NewIconButton>
              <NewIconButton>
                <ChatIcon>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </ChatIcon>
                <IconLabel>챗봇 상담</IconLabel>
              </NewIconButton>
            </NewHeaderActions>
          </NewHeader>

          {/* Main Content */}
          <NewMainContent>
            {/* Welcome Card */}
            <WelcomeCard>
              <WelcomeContent>
                <WelcomeAvatar />
                <WelcomeText>
                  <WelcomeGreeting>
                    안녕하세요, <WelcomeName>주영</WelcomeName> 님!
                  </WelcomeGreeting>
                  <ProgressSection>
                    <ProgressBar>
                      <ProgressFill style={{width: '57%'}} />
                    </ProgressBar>
                    <ProgressText>57%</ProgressText>
                  </ProgressSection>
                </WelcomeText>
              </WelcomeContent>
            </WelcomeCard>

            {/* Add Friend Section */}
            <Section>
              <SectionTitle>지원님을 위한 이주메이트</SectionTitle>
              <ActionCard>
                <PlusButton onClick={handlePlusClick}>
                  <PlusIcon>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                  </PlusIcon>
                </PlusButton>
                <ActionText>이사갈 집을 찾아보세요!</ActionText>
              </ActionCard>
            </Section>

            {/* Recommendations Section */}
            <Section>
              <SectionHeader>
                <SectionTitle>지원님께 딱 맞는 지원 정책 추천</SectionTitle>
                <ArrowButton>
                  <ArrowIcon>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </ArrowIcon>
                </ArrowButton>
              </SectionHeader>

              <RecommendationCards>
                <RecommendationCard onClick={handleCardClick}>
                  <CardImage />
                  <CardContent>
                    <CardTitle>지방으로 가면 200만원 드려요!</CardTitle>
                    <CardDescription>수도권에서 지방으로 이주 시 정부에서 200만원을 지원해주는 정책안을 미련</CardDescription>
                  </CardContent>
                </RecommendationCard>

                <RecommendationCard onClick={handleCardClick}>
                  <CardImage />
                  <CardContent>
                    <CardTitle>지방으로 가면 200만원 드려요!</CardTitle>
                    <CardDescription>수도권에서 지방으로 이주 시 정부에서</CardDescription>
                  </CardContent>
                </RecommendationCard>
              </RecommendationCards>
            </Section>
          </NewMainContent>
        </NewHomeContainer>

      </div>
    </MobileLayout>
  );
}


// 새로운 홈페이지 스타일
const NewHomeContainer = styled.div`
  min-height: 100%;
  background: linear-gradient(180deg, #e8f0f7 0%, #f5f8fa 100%);
`;

const NewHeader = styled.header`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NewLogo = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const NewHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const NewIconButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const SearchIcon = styled.svg`
  width: 28px;
  height: 28px;
  color: #6b7280;
`;

const ChatIcon = styled.svg`
  width: 28px;
  height: 28px;
  color: #6b7280;
`;

const IconLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
`;

const NewMainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  padding-bottom: 100px; /* Bottom nav space */
`;

const WelcomeCard = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 32px;
`;

const WelcomeContent = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const WelcomeAvatar = styled.div`
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 50%;
  flex-shrink: 0;
`;

const WelcomeText = styled.div`
  flex: 1;
`;

const WelcomeGreeting = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 16px 0;
`;

const WelcomeName = styled.span`
  color: #3b82f6;
  font-weight: 700;
`;

const ProgressSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #3b82f6;
  border-radius: 6px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #374151;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin-bottom: 16px;
`;

const ActionCard = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 48px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
`;

const PlusButton = styled.button`
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const PlusIcon = styled.svg`
  width: 48px;
  height: 48px;
  color: white;
`;

const ActionText = styled.p`
  font-size: 18px;
  color: #6b7280;
  margin: 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ArrowButton = styled.button`
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #6b7280;
  }
`;

const ArrowIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const RecommendationCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RecommendationCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  gap: 16px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

const CardImage = styled.div`
  width: 128px;
  height: 128px;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  border-radius: 12px;
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0 0 8px 0;
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
`;

// 애니메이션
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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;


