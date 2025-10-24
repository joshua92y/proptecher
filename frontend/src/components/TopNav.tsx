"use client";

import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopNav({ title, showBack = false, onBack }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (showBack) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    // 경로에 따른 기본 타이틀
    if (pathname === "/") return "홈";
    if (pathname?.startsWith("/properties") && pathname !== "/properties") return "매물 상세";
    if (pathname === "/properties") return "부동산 찾기";
    if (pathname === "/experts") return "전문가 매칭";
    if (pathname === "/policy") return "정책 정보";
    if (pathname === "/mypage") return "마이페이지";
    if (pathname === "/admin") return "관리자";
    
    return "이주메이트";
  };

  return (
    <Container>
      <LeftSection>
        <IconButton onClick={handleBack} aria-label={showBack ? "뒤로가기" : "홈"}>
          {showBack ? (
            <BackIcon>←</BackIcon>
          ) : (
            <HomeIcon>🏠</HomeIcon>
          )}
        </IconButton>
      </LeftSection>

      <CenterSection>
        <Title>{getTitle()}</Title>
      </CenterSection>

      <RightSection>
        <IconButton onClick={() => router.push("/mypage")} aria-label="프로필">
          <ProfileIcon>👤</ProfileIcon>
        </IconButton>
      </RightSection>
    </Container>
  );
}

const Container = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  width: 48px;
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  width: 48px;
  justify-content: flex-end;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:active {
    background: #f0f0f0;
  }
`;

const BackIcon = styled.span`
  font-size: 24px;
  color: #333;
  font-weight: 300;
`;

const HomeIcon = styled.span`
  font-size: 20px;
`;

const ProfileIcon = styled.span`
  font-size: 20px;
`;

const Title = styled.h1`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
`;

