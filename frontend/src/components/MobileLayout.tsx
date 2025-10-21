"use client";

import styled from "styled-components";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBottomNav?: boolean;
  showTopNav?: boolean;
}

export default function MobileLayout({
  children,
  title,
  showBack = false,
  onBack,
  showBottomNav = true,
  showTopNav = true,
}: MobileLayoutProps) {
  return (
    <Container>
      {showTopNav && <TopNav title={title} showBack={showBack} onBack={onBack} />}
      
      <Content $hasTopNav={showTopNav} $hasBottomNav={showBottomNav}>
        {children}
      </Content>
      
      {showBottomNav && <BottomNav />}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  background: #fafafa;
`;

const Content = styled.main<{ $hasTopNav: boolean; $hasBottomNav: boolean }>`
  position: relative;
  min-height: 100vh;
  padding-top: ${(p) => (p.$hasTopNav ? "56px" : "0")};
  padding-bottom: ${(p) => (p.$hasBottomNav ? "64px" : "0")};
  overflow-y: auto;
  background: #fff;
  transition: padding-top 0.3s ease;
`;

