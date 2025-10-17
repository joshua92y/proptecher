"use client";

import styled from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function MyPage() {
  const menuItems = [
    { id: "profile", label: "프로필 수정", icon: "✏️" },
    { id: "favorites", label: "관심 매물", icon: "❤️" },
    { id: "history", label: "최근 본 매물", icon: "👁️" },
    { id: "inquiries", label: "문의 내역", icon: "💬" },
    { id: "settings", label: "설정", icon: "⚙️" },
  ];

  return (
    <MobileLayout title="마이페이지">
      <Container>
        <ProfileSection>
          <ProfileImage>👤</ProfileImage>
          <ProfileName>게스트</ProfileName>
          <ProfileEmail>guest@example.com</ProfileEmail>
          <LoginButton>로그인 / 회원가입</LoginButton>
        </ProfileSection>

        <MenuSection>
          {menuItems.map((item) => (
            <MenuItem key={item.id}>
              <MenuIcon>{item.icon}</MenuIcon>
              <MenuLabel>{item.label}</MenuLabel>
              <MenuArrow>›</MenuArrow>
            </MenuItem>
          ))}
        </MenuSection>

        <Footer>
          <FooterButton>로그아웃</FooterButton>
          <FooterButton>회원탈퇴</FooterButton>
        </Footer>
      </Container>
    </MobileLayout>
  );
}

const Container = styled.div`
  min-height: 100%;
  background: #fafafa;
`;

const ProfileSection = styled.div`
  background: #fff;
  padding: 32px 20px;
  text-align: center;
  border-bottom: 8px solid #f5f5f5;
`;

const ProfileImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto 16px;
`;

const ProfileName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin: 0 0 4px 0;
`;

const ProfileEmail = styled.p`
  font-size: 14px;
  color: #999;
  margin: 0 0 20px 0;
`;

const LoginButton = styled.button`
  padding: 12px 32px;
  border-radius: 8px;
  border: 1px solid #6e39ff;
  background: #fff;
  color: #6e39ff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    background: #f5f5ff;
  }
`;

const MenuSection = styled.div`
  background: #fff;
  margin-bottom: 8px;
`;

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid #f5f5f5;
  background: #fff;
  cursor: pointer;
  text-align: left;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #fafafa;
  }
`;

const MenuIcon = styled.span`
  font-size: 20px;
  margin-right: 12px;
`;

const MenuLabel = styled.span`
  flex: 1;
  font-size: 15px;
  color: #333;
`;

const MenuArrow = styled.span`
  font-size: 20px;
  color: #ccc;
`;

const Footer = styled.div`
  padding: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const FooterButton = styled.button`
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;

  &:active {
    color: #666;
  }
`;

