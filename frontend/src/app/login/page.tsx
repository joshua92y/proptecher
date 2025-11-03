"use client";

import React, { useState } from "react";
import styled from "styled-components";
import MobileLayout from "@/components/MobileLayout";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/utils/api";

const PRIMARY = "#2F80ED";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Login failed");
      }
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", data.token || "mock-token");
        if (data.name) localStorage.setItem("userName", data.name);
        if (data.email) localStorage.setItem("userEmail", data.email);
        if (data.profile?.type) localStorage.setItem("userType", data.profile.type);
      }
      router.replace("/");
    } catch (e: any) {
      setError("이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="로그인">
      <Container>
        <FormCard>
          <Label>이메일</Label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
          <Label>비밀번호</Label>
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <ErrorText>{error}</ErrorText>}
        </FormCard>

        <FixedFooter>
          <FooterInner>
            <PrimaryButton onClick={onSubmit} disabled={loading || !email || password.length < 6}>
              {loading ? "로그인 중..." : "로그인"}
            </PrimaryButton>
            <GhostButton onClick={() => router.push("/signup")}>회원가입</GhostButton>
          </FooterInner>
        </FixedFooter>
      </Container>
    </MobileLayout>
  );
}

const Container = styled.div`
  min-height: 100%;
  padding: 16px;
  padding-bottom: 160px;
`;

const FormCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  color: #374151;
  margin: 12px 0 6px 4px;
`;

const Input = styled.input`
  width: 100%; height: 52px; border-radius: 12px; border: 1px solid #e5e7eb; padding: 0 14px; font-size: 16px;
  &:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px rgba(47,128,237,0.18); outline: none; }
`;

const ErrorText = styled.p`
  color: #ef4444; font-size: 13px; margin-top: 10px;
`;

const FixedFooter = styled.div`
  position: fixed; left: 0; right: 0; bottom: calc(64px + env(safe-area-inset-bottom));
  padding: 12px 16px;
`;

const FooterInner = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 10px; max-width: 560px; margin: 0 auto;
`;

const PrimaryButton = styled.button<{disabled?: boolean}>`
  width: 100%; height: 58px; border-radius: 16px; background: ${PRIMARY}; color: #fff; border: none; font-weight: 800; font-size: 18px;
  box-shadow: 0 8px 18px rgba(47,128,237,0.35);
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};
`;

const GhostButton = styled.button`
  width: 100%; height: 54px; border-radius: 14px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-weight: 700; font-size: 16px;
`;


