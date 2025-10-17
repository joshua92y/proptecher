"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function Home() {
  const router = useRouter();
  const [showTopNav, setShowTopNav] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 배너 슬라이더
  const banners = [
    { 
      id: 1, 
      title: "신규 가입 이벤트", 
      subtitle: "첫 임장 신청 시 20% 할인", 
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      emoji: "🎉"
    },
    { 
      id: 2, 
      title: "프리미엄 매물", 
      subtitle: "엄선된 매물 추천", 
      bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      emoji: "⭐"
    },
    { 
      id: 3, 
      title: "전문가 상담", 
      subtitle: "무료 상담 신청하기", 
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      emoji: "💬"
    },
  ];

  // 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const features = [
    {
      id: "listings",
      title: "부동산 찾기",
      icon: "🏘️",
      description: "지도에서 원하는 매물을 쉽게 찾아보세요",
      path: "/listings",
      color: "#667eea",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: "experts",
      title: "전문가 매칭",
      icon: "👨‍💼",
      description: "전문가와 1:1 상담으로 완벽한 선택을",
      path: "/experts",
      color: "#f093fb",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      id: "policy",
      title: "정책 정보",
      icon: "📋",
      description: "최신 부동산 정책과 혜택을 확인하세요",
      path: "/policy",
      color: "#4facfe",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
  ];

  // 정책 뉴스 (목업)
  const policyNews = [
    { id: 1, title: "2024년 주택 청약 제도 변경", date: "2024.10.15", tag: "청약" },
    { id: 2, title: "취득세 감면 혜택 확대", date: "2024.10.10", tag: "세금" },
    { id: 3, title: "신혼부부 특별공급 확대", date: "2024.10.05", tag: "지원" },
  ];

  // 인기 매물 (목업)
  const popularListings = [
    { id: "1", title: "전세 2억 5500", addr: "무주읍 적천로 343", price: "2.55억", views: 1234 },
    { id: "2", title: "월세 500/90", addr: "서울시 강남구", price: "500/90", views: 987 },
    { id: "3", title: "전세 3억", addr: "서울시 송파구", price: "3억", views: 856 },
  ];

  return (
    <MobileLayout title="홈" showTopNav={showTopNav}>
      <Container>
        {/* 배너 슬라이더 */}
        <BannerSection onClick={() => setShowTopNav(!showTopNav)}>
          <SliderContainer>
            {banners.map((banner, index) => (
              <Slide
                key={banner.id}
                $active={index === currentSlide}
                $bg={banner.bg}
              >
                <SlideContent>
                  <BannerEmoji>{banner.emoji}</BannerEmoji>
                  <SlideTitle>{banner.title}</SlideTitle>
                  <SlideSubtitle>{banner.subtitle}</SlideSubtitle>
                </SlideContent>
              </Slide>
            ))}
          </SliderContainer>
          <SliderDots>
            {banners.map((_, index) => (
              <Dot
                key={index}
                $active={index === currentSlide}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
              />
            ))}
          </SliderDots>
        </BannerSection>

        {/* 주요 기능 카드 */}
        <FeatureSection>
          <FeatureGrid>
            {/* 부동산 찾기 - 큰 카드 (왼쪽) */}
            <FeatureCardLarge 
              onClick={() => router.push(features[0].path)}
              $gradient={features[0].gradient}
            >
              <FeatureIconWrapperLarge>
                <FeatureIconLarge>{features[0].icon}</FeatureIconLarge>
              </FeatureIconWrapperLarge>
              <FeatureContentLarge>
                <FeatureTitleLarge>{features[0].title}</FeatureTitleLarge>
                <FeatureDescriptionLarge>{features[0].description}</FeatureDescriptionLarge>
              </FeatureContentLarge>
              <FeatureArrowLarge>→</FeatureArrowLarge>
            </FeatureCardLarge>

            {/* 전문가 매칭 & 정책 정보 - 작은 카드들 (오른쪽) */}
            <FeatureRightColumn>
              <FeatureCardSmall 
                onClick={() => router.push(features[1].path)}
                $gradient={features[1].gradient}
              >
                <FeatureIconWrapperSmall>
                  <FeatureIconSmall>{features[1].icon}</FeatureIconSmall>
                </FeatureIconWrapperSmall>
                <FeatureContentSmall>
                  <FeatureTitleSmall>{features[1].title}</FeatureTitleSmall>
                  <FeatureDescSmall>{features[1].description}</FeatureDescSmall>
                </FeatureContentSmall>
              </FeatureCardSmall>

              <FeatureCardSmall 
                onClick={() => router.push(features[2].path)}
                $gradient={features[2].gradient}
              >
                <FeatureIconWrapperSmall>
                  <FeatureIconSmall>{features[2].icon}</FeatureIconSmall>
                </FeatureIconWrapperSmall>
                <FeatureContentSmall>
                  <FeatureTitleSmall>{features[2].title}</FeatureTitleSmall>
                  <FeatureDescSmall>{features[2].description}</FeatureDescSmall>
                </FeatureContentSmall>
              </FeatureCardSmall>
            </FeatureRightColumn>
          </FeatureGrid>
        </FeatureSection>

        {/* 정책 뉴스 */}
        <Section>
          <SectionHeader>
            <SectionTitle>정책 뉴스</SectionTitle>
            <SectionMore onClick={() => router.push("/policy")}>더보기 ›</SectionMore>
          </SectionHeader>
          <NewsList>
            {policyNews.map((news) => (
              <NewsItem key={news.id}>
                <NewsTag>{news.tag}</NewsTag>
                <NewsTitle>{news.title}</NewsTitle>
                <NewsDate>{news.date}</NewsDate>
              </NewsItem>
            ))}
          </NewsList>
        </Section>

        {/* 인기 매물 */}
        <Section>
          <SectionHeader>
            <SectionTitle>🔥 인기 매물</SectionTitle>
            <SectionMore onClick={() => router.push("/listings")}>더보기 ›</SectionMore>
          </SectionHeader>
          <ListingList>
            {popularListings.map((listing) => (
              <ListingItem key={listing.id} onClick={() => router.push(`/listings/${listing.id}`)}>
                <ListingThumb>🏠</ListingThumb>
                <ListingInfo>
                  <ListingTitle>{listing.title}</ListingTitle>
                  <ListingAddr>{listing.addr}</ListingAddr>
                  <ListingMeta>
                    <ListingPrice>{listing.price}</ListingPrice>
                    <ListingViews>👁️ {listing.views.toLocaleString()}</ListingViews>
                  </ListingMeta>
                </ListingInfo>
              </ListingItem>
            ))}
          </ListingList>
        </Section>
      </Container>
    </MobileLayout>
  );
}


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

const Container = styled.div`
  min-height: 100%;
  background: #f8f9fa;
  padding-bottom: 20px;
`;

// 배너 슬라이더
const BannerSection = styled.section`
  position: relative;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const SliderContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Slide = styled.div<{ $active: boolean; $bg: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${(p) => p.$bg};
  opacity: ${(p) => (p.$active ? 1 : 0)};
  transition: opacity 0.8s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SlideContent = styled.div`
  text-align: center;
  color: white;
  animation: ${fadeIn} 0.8s ease;
`;

const BannerEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  animation: ${float} 3s ease-in-out infinite;
`;

const SlideTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const SlideSubtitle = styled.p`
  font-size: 15px;
  margin: 0;
  opacity: 0.95;
  font-weight: 500;
`;

const SliderDots = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${(p) => (p.$active ? "28px" : "8px")};
  height: 8px;
  border-radius: 4px;
  border: none;
  background: ${(p) => (p.$active ? "white" : "rgba(255,255,255,0.5)")};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${(p) => (p.$active ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none")};
  
  &:hover {
    background: white;
  }
`;

// 기능 카드 섹션
const FeatureSection = styled.section`
  padding: 20px 16px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 280px;
`;

// 오른쪽 컬럼 (작은 카드 2개)
const FeatureRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// 큰 카드 (부동산 찾기)
const FeatureCardLarge = styled.button<{ $gradient: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  border: none;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(p) => p.$gradient};
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

    &::before {
      opacity: 0.08;
    }
  }

  &:active {
    transform: translateY(-3px);
  }
`;

const FeatureIconWrapperLarge = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 18px;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.4s ease;
  margin-bottom: 16px;

  ${FeatureCardLarge}:hover & {
    transform: scale(1.15) rotate(8deg);
  }
`;

const FeatureIconLarge = styled.span`
  font-size: 40px;
`;

const FeatureContentLarge = styled.div`
  flex: 1;
  text-align: left;
  z-index: 1;
  margin-bottom: 12px;
`;

const FeatureTitleLarge = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin: 0 0 10px 0;
  transition: color 0.3s ease;

  ${FeatureCardLarge}:hover & {
    color: #667eea;
  }
`;

const FeatureDescriptionLarge = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const FeatureArrowLarge = styled.span`
  font-size: 32px;
  color: #ccc;
  z-index: 1;
  transition: all 0.3s ease;
  align-self: flex-end;

  ${FeatureCardLarge}:hover & {
    color: #667eea;
    transform: translateX(6px);
  }
`;

// 작은 카드 (전문가 매칭, 정책 정보)
const FeatureCardSmall = styled.button<{ $gradient: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border: none;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(p) => p.$gradient};
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    &::before {
      opacity: 0.05;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const FeatureIconWrapperSmall = styled.div`
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 14px;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.3s ease;
  margin-bottom: 12px;

  ${FeatureCardSmall}:hover & {
    transform: scale(1.1) rotate(5deg);
  }
`;

const FeatureIconSmall = styled.span`
  font-size: 28px;
`;

const FeatureContentSmall = styled.div`
  z-index: 1;
`;

const FeatureTitleSmall = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0 0 6px 0;
  transition: color 0.3s ease;

  ${FeatureCardSmall}:hover & {
    color: #667eea;
  }
`;

const FeatureDescSmall = styled.p`
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// 섹션
const Section = styled.section`
  padding: 20px 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #222;
  margin: 0;
`;

const SectionMore = styled.button`
  font-size: 14px;
  color: #667eea;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    color: #764ba2;
    transform: translateX(2px);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// 뉴스 리스트
const NewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NewsItem = styled.div`
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const NewsTag = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  margin-bottom: 8px;
`;

const NewsTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #222;
  margin-bottom: 6px;
  line-height: 1.4;
`;

const NewsDate = styled.div`
  font-size: 12px;
  color: #999;
  font-weight: 500;
`;

// 매물 리스트
const ListingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ListingItem = styled.div`
  display: flex;
  gap: 14px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateX(2px);
  }
`;

const ListingThumb = styled.div`
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  flex-shrink: 0;
  transition: transform 0.3s ease;

  ${ListingItem}:hover & {
    transform: scale(1.05) rotate(-5deg);
  }
`;

const ListingInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ListingTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin-bottom: 5px;
`;

const ListingAddr = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ListingMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ListingPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ListingViews = styled.span`
  font-size: 12px;
  color: #999;
  font-weight: 500;
`;

