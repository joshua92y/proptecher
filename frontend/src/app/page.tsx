"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes, css } from "styled-components";
import MobileLayout from "@/components/MobileLayout";
import { getListings, type ListingListItem } from "@/lib/data/listings";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [favRegions, setFavRegions] = useState<string[]>([]);
  const [listings, setListings] = useState<ListingListItem[]>([]);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressMock = 57; // 임시 목업 진행률 (%)

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const name = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
      const em = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      // 로그인 여부는 토큰 기준으로만 판단
      setIsLoggedIn(!!token);
      setUserName(name);
      setEmail(em);
    } catch (_) {
      setIsLoggedIn(false);
      setUserName(null);
      setEmail(null);
    }
  }, []);

  // 관심지역 + 매물 불러오기
  useEffect(() => {
    if (!isLoggedIn || !email) return;
    (async () => {
      try {
        // 1) 관심지역
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${API_BASE}/api/users/preferences?email=${encodeURIComponent(email)}`);
        const pref = await res.json();
        const regs: string[] = Array.isArray(pref.preferred_regions) ? pref.preferred_regions : [];
        setFavRegions(regs);

        // 2) 매물
        const all = await getListings();
        setListings(all);
      } catch {}
    })();
  }, [isLoggedIn, email]);

  const regionListings: ListingListItem[] = useMemo(() => {
    if (!favRegions || favRegions.length === 0) return [];
    return listings.filter(l => favRegions.some(r => (l.addr || '').includes(r)));
  }, [favRegions, listings]);

  // 2초 자동 슬라이드 (매물 2개 이상)
  useEffect(() => {
    if (regionListings.length <= 1 || paused) return;
    const t = setInterval(() => setCur((i) => (i + 1) % regionListings.length), 2000);
    return () => clearInterval(t);
  }, [regionListings.length, paused]);

  // 새로운 홈페이지 기능
  const handlePlusClick = () => {
    if (!isLoggedIn) {
      router.push('/mypage');
      return;
    }
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
          {/* 상단 고정 네비게이션(MobileLayout 내 TopNav)만 사용. 중복 헤더 제거 */}

          {/* Main Content */}
          <NewMainContent>
            {/* 반응형 섹션 (요구안 디자인을 유사하게, flex/grid 기반) */}
            <SectionContainer>
              {/* 상단 네비와 중복되는 컨텐츠 헤더 제거 */}

              <GreetingCard onClick={() => router.push('/mypage')}>
                <GreetingAvatar />
                <div>
                  <GreetingText>
                    {isLoggedIn ? (
                      <>안녕하세요, <WelcomeName>{userName || '사용자'}</WelcomeName> 님!</>
                    ) : (
                      <>로그인 또는 회원가입이 필요합니다</>
                    )}
                  </GreetingText>
                  {isLoggedIn && (
                    <TagRow>
                      <TagLabel>희망 이주지</TagLabel>
                      <TagChips>
                        {(favRegions.length ? favRegions : ['지역 설정 없음']).slice(0,3).map((r) => (
                          <Tag key={r}>#{r}</Tag>
                        ))}
                      </TagChips>
                    </TagRow>
                  )}
                  {isLoggedIn && (
                    <ProgressWrap>
                      <GreetingBar>
                        <GreetingFill style={{ width: `${progressMock}%` }} />
                      </GreetingBar>
                      <StageRow>
                        <StageLabel $active>탐색</StageLabel>
                        <StageLabel>정주</StageLabel>
                        <StageLabel>정주</StageLabel>
                        <StageLabel>정주</StageLabel>
                      </StageRow>
                    </ProgressWrap>
                  )}
                </div>
              </GreetingCard>

              {isLoggedIn ? (
                <>
                  <HeadingRow>
                    <SectionTitleAlt>{userName}님을 위한 보금자리</SectionTitleAlt>
                    <Chevron>›</Chevron>
                  </HeadingRow>
                  {regionListings.length === 0 ? (
                    <EmptyCard onClick={() => router.push('/properties')}>
                      <EmptyPlus>+</EmptyPlus>
                      <EmptyText>이사가실 집을 찾아보세요!</EmptyText>
                    </EmptyCard>
                  ) : (
                    <RecommendHorizontal
                      key={cur}
                      $hold={paused}
                      onMouseEnter={() => setPaused(true)}
                      onMouseLeave={() => setPaused(false)}
                      onTouchStart={() => setPaused(true)}
                      onTouchEnd={() => setPaused(false)}
                      onClick={() => router.push(`/properties/${regionListings[cur].id}`)}
                    >
                      <RecommendImg />
                      <div>
                        <RecommendName>{regionListings[cur].addr}</RecommendName>
                        <RecommendPrice>{regionListings[cur].title || regionListings[cur].price}</RecommendPrice>
                        <RecommendCTA>자세히 보기</RecommendCTA>
                      </div>
                    </RecommendHorizontal>
                  )}
                </>
              ) : (
                <LoginPromptSection>
                  <LoginPromptTitle>로그인하고 맞춤 매물을 추천받아보세요</LoginPromptTitle>
                  <LoginPromptDesc>회원가입으로 이주메이트의 모든 기능을 이용해보세요</LoginPromptDesc>
                  <LoginPromptButton onClick={() => router.push('/login')}>
                    로그인하기
                  </LoginPromptButton>
                </LoginPromptSection>
              )}

              {isLoggedIn ? (
                <>
                  <HeadingRow>
                    <SectionTitleAlt>{userName}님을 위한 이주메이트</SectionTitleAlt>
                    <Chevron>›</Chevron>
                  </HeadingRow>
                  <TwoGrid>
                    <PartnerBox>
                      <PartnerText>정책 파트너와 대화하기</PartnerText>
                    </PartnerBox>
                    <PartnerBox>
                      <PartnerText>현지 조력자와 대화하기</PartnerText>
                    </PartnerBox>
                  </TwoGrid>
                </>
              ) : null}

              {isLoggedIn && (
                <>
                  <HeadingRow>
                    <SectionTitleAlt>{userName}님의 정주 완주율</SectionTitleAlt>
                    <Chevron>›</Chevron>
                  </HeadingRow>
                  <GreetingCard>
                    <GreetingContent>
                      <GreetingBar>
                        <GreetingFill style={{ width: '57%' }} />
                      </GreetingBar>
                      <GreetingPercent>57%</GreetingPercent>
                    </GreetingContent>
                  </GreetingCard>
                </>
              )}
              {isLoggedIn && (
                <StackedList>
                  <InfoRow>
                    <InfoSquare style={{ background: '#FFD9A4' }} />
                    <div>
                      <InfoHeading>주거지</InfoHeading>
                      <InfoParagraph>어쩌고 저쩌고 진행중입니다</InfoParagraph>
                    </div>
                    <RightBadge>
                      <Ring percent={38} color="#E9A547"><RingInner /><RingLabel>38%</RingLabel></Ring>
                    </RightBadge>
                  </InfoRow>
                  <InfoRow>
                    <InfoSquare style={{ background: '#D2F4A2' }} />
                    <div>
                      <InfoHeading>일자리 지원</InfoHeading>
                      <InfoParagraph>어쩌고 저쩌고 진행중입니다</InfoParagraph>
                    </div>
                    <RightBadge>
                      <Ring percent={54} color="#8FC83E"><RingInner /><RingLabel>54%</RingLabel></Ring>
                    </RightBadge>
                  </InfoRow>
                  <InfoRow>
                    <InfoSquare style={{ background: '#D9E5FF' }} />
                    <div>
                      <InfoHeading>국가 지원 정책</InfoHeading>
                      <InfoParagraph>어쩌고 저쩌고 진행중입니다</InfoParagraph>
                    </div>
                    <RightBadge>
                      <Ring percent={54} color="#6C8FD9"><RingInner /><RingLabel>54%</RingLabel></Ring>
                    </RightBadge>
                  </InfoRow>
                </StackedList>
              )}
            </SectionContainer>

            {/* (기존 중복 섹션 제거: 최신 반응형 섹션만 유지) */}
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

/* NewHeader/Logo/Actions 아이콘 영역 제거 */

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

const CTAButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const CTAButtonPrimary = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const CTAButton = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
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

// ===== 반응형 섹션 스타일 =====
const SectionContainer = styled.section`
  background: #E6F0F8; border-radius: 10px; padding: 16px; margin-bottom: 24px;
`;
/* 중복 헤더 컴포넌트 삭제 */
const GreetingCard = styled.div`
  background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  padding: 16px; display: flex; gap: 16px; align-items: center; margin-bottom: 16px; cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  &:hover { transform: scale(1.02); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
  &:active { transform: scale(1.02); box-shadow: 0 10px 18px rgba(0,0,0,0.14); }
`;
const GreetingAvatar = styled.div`
  width: 74px; height: 74px; border-radius: 50%; background: #E6F0F8;
`;
const GreetingText = styled.div`
  font-size: 20px; font-weight: 500; color: #737373;
`;
const GreetingProgress = styled.div`
  display: flex; align-items: center; gap: 12px; margin-top: 8px;
`;
const GreetingContent = styled.div`
  flex: 1;
`;
const GreetingBar = styled.div`
  width: 100%; height: 12px; background: #EEEDED; border-radius: 5px; overflow: hidden;
`;
const GreetingFill = styled.div`
  height: 100%; background: #3394E2;
`;
const GreetingPercent = styled.span`
  font-size: 18px; font-weight: 500; color: #737373;
`;
const ProgressWrap = styled.div`
  margin-top: 12px;
`;
const StageRow = styled.div`
  display: flex; justify-content: space-between; margin-top: 8px; align-items:center; width:100%;
`;
const StageLabel = styled.span<{ $active?: boolean }>`
  text-align: center; font-size: 15px; font-weight: 700; color: ${(p)=>p.$active?'#111':'#9ca3af'};
`;
const TagRow = styled.div`
  display:flex; align-items:center; gap:12px; margin-top:8px;
`;
const TagLabel = styled.div`
  font-size:14px; font-weight:700; color:#737373;
`;
const TagChips = styled.div`
  display:flex; flex-wrap:wrap; gap:8px;
`;
const Tag = styled.span`
  display:inline-block; padding:6px 10px; border-radius:10px; background:#f3f4f6; color:#374151; font-size:13px; font-weight:700;
`;
const SectionTitleAlt = styled.h3`
  font-size: 20px; font-weight: 500; color: #000; margin: 12px 0;
`;
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
`;

const holdPulse = keyframes`
  from { transform: translateX(0) scale(1); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  to   { transform: translateX(0) scale(1.02); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
`;

const RecommendHorizontal = styled.div<{$hold?: boolean}>`
  display: grid; grid-template-columns: 114px 1fr; gap: 16px; align-items: center;
  background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 16px;
  animation: ${slideInRight} .35s ease;
  ${(p)=> p.$hold && css`animation: ${slideInRight} .35s ease, ${holdPulse} .9s ease-in-out infinite alternate;`}
  transition: transform .2s ease, box-shadow .2s ease;
  &:hover { transform: translateX(0) scale(1.02); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
`;
const RecommendImg = styled.div`
  width: 114px; height: 114px; background: #d9d9d9; border-radius: 10px;
`;
const RecommendName = styled.div`
  font-size: 16px; font-weight: 600; color: #000; line-height: 1.8;
`;
const RecommendPrice = styled.div`
  font-size: 16px; color: #868686;
`;
const RecommendCTA = styled.button`
  margin-top: 8px; width: 136px; height: 41px; border-radius: 10px; background: #fff; border: 1px solid #BFBFBF; color: #353535;
`;

const EmptyCard = styled.button`
  width: 100%; background:#fff; border-radius: 16px; padding: 28px 20px; border:1px solid #e5e7eb; display:flex; flex-direction:column; align-items:center; gap:18px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);
`;
const EmptyPlus = styled.div`
  width: 96px; height: 96px; border-radius: 50%; background: #e9f2fb; color:#2F80ED; display:grid; place-items:center; font-size:48px; font-weight:800;
`;
const EmptyText = styled.div`
  font-size: 18px; color:#111; font-weight:700;
`;
const HeadingRow = styled.div`
  display:flex; align-items:center; justify-content:space-between; margin: 16px 0 8px;
`;
const Chevron = styled.span`
  font-size: 22px; color: #8F8F8F; line-height: 1;
`;
const TwoGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;
`;
const PartnerBox = styled.div`
  background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 24px; min-height: 132px;
  display: flex; align-items: center; cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
  &:active { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(0,0,0,0.14); }
`;
const PartnerText = styled.div`
  font-size: 16px; font-weight: 600; color: #000; line-height: 1.3;
`;
const StackedList = styled.div`
  display: grid; gap: 12px; margin-top: 8px;
`;
const InfoRow = styled.div`
  display: grid; grid-template-columns: 73px 1fr 80px; gap: 16px; align-items: center; background: #fff;
  border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 16px; cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
  &:active { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(0,0,0,0.14); }
`;
const InfoSquare = styled.div`
  width: 73px; height: 73px; border-radius: 10px;
`;
const InfoHeading = styled.div`
  font-size: 16px; font-weight: 600; color: #000;
`;
const InfoParagraph = styled.div`
  font-size: 14px; font-weight: 300; color: #000; margin-top: 6px;
`;
const RightBadge = styled.div`
  display:flex; justify-content:flex-end;
`;
const Ring = styled.div<{percent:number; color:string}>`
  position: relative; width: 72px; height:72px; border-radius: 50%;
  background: conic-gradient(${p=>p.color} ${p=>p.percent*3.6}deg, #E6EEF6 0deg);
  display:grid; place-items:center;
`;
const RingInner = styled.div`
  width:58px; height:58px; border-radius:50%; background:#fff; border:2px solid #fff;
`;
const RingLabel = styled.div`
  position:absolute; font-size:18px; font-weight:600; color:#000;
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

const LoginPromptSection = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
`;

const LoginPromptTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0 0 8px 0;
`;

const LoginPromptDesc = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 20px 0;
`;

const LoginPromptButton = styled.button`
  background: #2F80ED;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 200px;

  &:active {
    background: #2563eb;
  }
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


