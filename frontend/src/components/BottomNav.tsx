"use client";

import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: "home",
      label: "홈",
      icon: "🏠",
      path: "/",
      isActive: pathname === "/",
    },
    {
      id: "listings",
      label: "부동산",
      icon: "🏘️",
      path: "/listings",
      isActive: pathname?.startsWith("/listings"),
    },
    {
      id: "experts",
      label: "전문가",
      icon: "👨‍💼",
      path: "/experts",
      isActive: pathname?.startsWith("/experts"),
    },
    {
      id: "mypage",
      label: "MY",
      icon: "👤",
      path: "/mypage",
      isActive: pathname?.startsWith("/mypage"),
    },
  ];

  return (
    <Container>
      {navItems.map((item) => (
        <NavItem
          key={item.id}
          onClick={() => router.push(item.path)}
          $active={item.isActive}
        >
          <IconWrapper $active={item.isActive}>
            <Icon>{item.icon}</Icon>
          </IconWrapper>
          <Label $active={item.isActive}>{item.label}</Label>
        </NavItem>
      ))}
    </Container>
  );
}

const Container = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #fff;
  border-top: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  z-index: 1000;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
`;

const NavItem = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 4px;

  &:active {
    background: #f5f5f5;
  }
`;

const IconWrapper = styled.div<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${(p) => (p.$active ? "#f0f0ff" : "transparent")};
  transition: all 0.2s;
`;

const Icon = styled.span`
  font-size: 20px;
`;

const Label = styled.span<{ $active: boolean }>`
  font-size: 11px;
  font-weight: ${(p) => (p.$active ? "600" : "400")};
  color: ${(p) => (p.$active ? "#6e39ff" : "#666")};
  transition: all 0.2s;
`;

