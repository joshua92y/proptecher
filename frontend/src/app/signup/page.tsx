"use client";

import React, { useMemo, useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/utils/api";

type ReasonKey =
  | "계약 기간 만료"
  | "주거비용 문제"
  | "일자리 · 취업"
  | "교육 · 인프라"
  | "문화 · 여가 시설"
  | "대중교통 편의성"
  | "지인과 가까이 살기 위해";

const REASONS: ReasonKey[] = [
  "계약 기간 만료",
  "주거비용 문제",
  "일자리 · 취업",
  "교육 · 인프라",
  "문화 · 여가 시설",
  "대중교통 편의성",
  "지인과 가까이 살기 위해",
];

export default function SignupWizardPage() {
  const router = useRouter();
  // steps: 0 Terms, 1 UserType, 2 Intro, 3 Name+Email+Password, 4 Reasons, 5 Preferred Regions, 6 Purpose, 7 Profile Example
  const [step, setStep] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<ReasonKey, boolean>>({
    "계약 기간 만료": false,
    "주거비용 문제": false,
    "일자리 · 취업": false,
    "교육 · 인프라": false,
    "문화 · 여가 시설": false,
    "대중교통 편의성": false,
    "지인과 가까이 살기 위해": false,
  });
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [userType, setUserType] = useState<"seeker" | "appraiser" | "agent" | null>(null);

  const selectedReasons = useMemo(
    () => Object.entries(reasons).filter(([, v]) => v).map(([k]) => k as ReasonKey),
    [reasons]
  );

  const goNext = () => setStep((s) => Math.min(7, s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    // 스크롤 상단 고정 (모바일에서 단계 전환 시 UX 개선)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const handleFinish = async () => {
    // 실제 회원가입 API 호출
    try {
      const res = await apiFetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          user_type: userType || "seeker",
          preferred_regions: preferredRegions,
          purpose,
        }),
      });
      if (!res.ok) {
        // 간단한 실패 핸들링
        console.error("Register failed", await res.text());
      } else {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", "mock-token");
          localStorage.setItem("userName", data.name || name || "");
          localStorage.setItem("userType", userType || "seeker");
          localStorage.setItem("userEmail", data.email || email);
        }
      }
    } catch (e) {
      console.error(e);
    }
    router.replace("/");
  };

  return (
    <MobileLayout
      title={
        step === 0
          ? "이용약관"
          : step === 1
          ? "시작하기"
          : step === 2
          ? "이주 유형 정보 수집"
          : step >= 3
          ? `정보 작성 (${step - 2}/5)`
          : undefined
      }
      showBack={step > 0}
      onBack={goPrev}
    >
      <Container>
        {/* 단계 컨텐츠 */}
        {step === 0 && (
          <StepCard>
            <StepTitle>서비스 이용약관 (예시)</StepTitle>
            <TermsBox>
              <p style={{marginTop:0}}>본 약관은 이주메이트(이하 "서비스") 이용에 관한 기본 사항을 규정합니다. 본 문서는 목업 예시이며 법적 효력은 없습니다.</p>
              <ul>
                <li>개인정보 수집 최소화 및 목적 외 사용 금지</li>
                <li>서비스 품질 향상을 위한 비식별 통계 활용</li>
                <li>이용자 권리 및 분쟁 해결 절차</li>
              </ul>
              <p>동의 후 다음 단계로 진행해주세요.</p>
            </TermsBox>
            <AgreeRow>
              <Checkbox
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                id="agree"
              />
              <AgreeLabel>약관에 동의합니다</AgreeLabel>
            </AgreeRow>
          </StepCard>
        )}

        {step === 1 && (
          <StepCard>
            <StepTitle>사용자 유형을 선택해주세요</StepTitle>
            <StepHint>역할에 따라 맞춤 화면을 제공해 드립니다.</StepHint>
            <UserTypeGrid>
              <UserTypeCard $active={userType === "seeker"} onClick={() => setUserType("seeker")}>
                <UserTypeIcon>🏡</UserTypeIcon>
                <UserTypeLabel>이주희망자</UserTypeLabel>
              </UserTypeCard>
              <UserTypeCard $active={userType === "appraiser"} onClick={() => setUserType("appraiser")}>
                <UserTypeIcon>🧭</UserTypeIcon>
                <UserTypeLabel>평가사</UserTypeLabel>
              </UserTypeCard>
              <UserTypeCard $active={userType === "agent"} onClick={() => setUserType("agent")}>
                <UserTypeIcon>🤝</UserTypeIcon>
                <UserTypeLabel>공인중개사</UserTypeLabel>
              </UserTypeCard>
            </UserTypeGrid>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard>
            <IntroIllustration />
            <IntroTitle>어플 사용전 간단한
              <br />사용자 정보를 작성해주세요</IntroTitle>
            <IntroSub>5분 내로 금방 끝나니 걱정 마세요!</IntroSub>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard>
            <StepTitle>희망 이주자 분의 이름을 적어주세요</StepTitle>
            <StepHint>실명을 기입해주세요</StepHint>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
            />
            <StepTitle style={{marginTop:16}}>메일 주소</StepTitle>
            <StepHint>로그인 ID로 사용됩니다</StepHint>
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
            <StepTitle style={{marginTop:16}}>비밀번호</StepTitle>
            <StepHint>6자 이상 입력해주세요</StepHint>
            <TextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              type="password"
              autoComplete="new-password"
            />
          </StepCard>
        )}

        {step === 4 && (
          <StepCard>
            <StepTitle>어떤 이유로 이주를 희망하시나요?</StepTitle>
            <StepHint>해당되는 항목을 모두 체크해주세요</StepHint>

            <ReasonList>
              {REASONS.map((label) => (
                <ReasonItem
                  key={label}
                  $active={!!reasons[label]}
                  onClick={() => setReasons((prev) => ({ ...prev, [label]: !prev[label] }))}
                >
                  {label}
                </ReasonItem>
              ))}
            </ReasonList>

          </StepCard>
        )}

        {step === 5 && (
          <StepCard>
            <StepTitle>관심 지역을 선택해주세요 (최대 3개)</StepTitle>
            <StepHint>여러 개 선택 가능, 스킵 가능</StepHint>
            <ReasonList>
              {["서울","경기","인천","강원","충북","충남","전북","전남","경북","경남","부산","대구","광주","대전","울산","제주"].map((n)=> {
                const isActive = preferredRegions.includes(n);
                const canAdd = isActive || preferredRegions.length < 3;
                return (
                  <ReasonItem key={n} $active={isActive} disabled={!canAdd}
                    onClick={()=> setPreferredRegions((prev)=> prev.includes(n)? prev.filter(x=>x!==n): (prev.length<3?[...prev,n]:prev))}
                  >{n}</ReasonItem>
                );
              })}
            </ReasonList>
            <ButtonRow>
              <GhostButton onClick={goNext}>스킵</GhostButton>
              <PrimaryButton onClick={goNext}>다음으로</PrimaryButton>
            </ButtonRow>
          </StepCard>
        )}

        {step === 6 && (
          <StepCard>
            <StepTitle>귀촌 목적을 선택해주세요 (선택)</StepTitle>
            <StepHint>스킵하거나, 하나를 선택해주세요</StepHint>
            <ReasonList>
              {["귀어","귀농","취업","기타"].map((p)=> (
                <ReasonItem key={p} $active={purpose===p} onClick={()=> setPurpose(p)}>{p}</ReasonItem>
              ))}
              <ReasonItem $active={!purpose} onClick={()=> setPurpose(null)}>선택 안함</ReasonItem>
            </ReasonList>
            <ButtonRow>
              <GhostButton onClick={goPrev}>이전</GhostButton>
              <PrimaryButton onClick={goNext}>다음으로</PrimaryButton>
            </ButtonRow>
          </StepCard>
        )}

        {step === 7 && (
          <StepCard>
            <StepTitle>프로필 사진 및 개인정보 입력 (예시)</StepTitle>
            <StepHint>3/3 단계는 목업 예시입니다. 실제 서비스에서는 프로필 사진 업로드와 연락처/주소 등 기본 정보를 요청할 예정입니다.</StepHint>

            <ProfilePreview>
              <PhotoPlaceholder />
              <PreviewFields>
                <PreviewInput disabled placeholder="이름 (예: 홍길동)" />
                <PreviewInput disabled placeholder="연락처 (예: 010-1234-5678)" />
                <PreviewInput disabled placeholder="주소 (예: 서울시 …)" />
              </PreviewFields>
            </ProfilePreview>

          </StepCard>
        )}

        {/* 하단 고정 CTA 바 */}
        <FixedFooter>
          <FooterInner>
        {step < 7 ? (
              <PrimaryButton
                onClick={goNext}
                disabled={
                  (step === 0 && !termsAccepted) ||
                  (step === 1 && !userType) ||
                  (step === 3 && (!name.trim() || !email.trim() || password.length < 6)) ||
              (step === 4 && selectedReasons.length === 0)
                }
              >
                다음으로
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={handleFinish}>시작하기</PrimaryButton>
            )}
          </FooterInner>
        </FixedFooter>
      </Container>
    </MobileLayout>
  );
}

// Styles
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PRIMARY = "#2F80ED"; // 버튼/강조 컬러 (이미지 스타일 근접)

const Container = styled.div`
  min-height: 100%;
  padding: 16px;
  padding-bottom: 160px; /* 고정 CTA 영역 여유 */
`;

const StepCard = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 28px 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  animation: ${slideIn} .25s ease;
  margin-bottom: 16px;
`;

const TermsBox = styled.div`
  max-height: 40vh;
  overflow: auto;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  margin: 8px 0 12px 0;
`;

const AgreeRow = styled.label`
  display: flex; align-items: center; gap: 8px; user-select: none;
`;

const Checkbox = styled.input`
  width: 18px; height: 18px;
`;

const AgreeLabel = styled.span`
  font-size: 14px; color: #374151; font-weight: 600;
`;

const IntroIllustration = styled.div`
  width: 96px; height: 96px; border-radius: 24px; background: #e5e7eb; margin: 8px 0 24px 0;
`;

const IntroTitle = styled.h2`
  font-size: 26px; line-height: 1.35; margin: 0 0 8px 0; color: #111; font-weight: 800;
`;

const IntroSub = styled.p`
  color: #9ca3af; margin: 0 0 24px 0; font-size: 14px;
`;

const StepTitle = styled.h3`
  font-size: 24px; margin: 0 0 10px 0; color: #111; font-weight: 800;
`;

const StepHint = styled.p`
  color: #9ca3af; margin: 0 0 20px 0; font-size: 15px;
`;

const TextField = styled.input`
  width: 100%; height: 56px; border-radius: 14px; border: 1px solid #e5e7eb; padding: 0 16px; font-size: 16px; outline: none;
  &:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px rgba(47,128,237,0.18); }
`;

const ButtonRow = styled.div`
  display: flex; gap: 12px; margin-top: 16px;
`;

const PrimaryButton = styled.button<{disabled?: boolean}>`
  flex: 1 1 auto;
  width: 100%;
  height: 58px;
  border-radius: 16px;
  border: none;
  background: ${PRIMARY};
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 0.2px;
  box-shadow: 0 8px 18px rgba(47,128,237,0.35);
  cursor: pointer;
  transition: transform .08s ease, filter .2s ease;
  &:active { transform: translateY(1px); }
  &:disabled {
    background: #bcd7fb;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const GhostButton = styled.button`
  flex: 1 1 auto; width: 100%; height: 58px; border-radius: 16px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-weight: 800; font-size: 16px; cursor: pointer;
`;

const ReasonList = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 8px;
`;

const ReasonItem = styled.button<{ $active: boolean }>`
  width: 100%; padding: 22px 18px; border-radius: 16px; text-align: left; font-size: 18px; color: #111; background: #fff; border: 1.5px solid ${(p) => (p.$active ? PRIMARY : '#e5e7eb')};
  box-shadow: 0 2px 6px rgba(0,0,0,0.04); cursor: pointer;
  background-color: ${(p) => (p.$active ? '#F5FAFF' : '#fff')};
  &:disabled { opacity: .5; cursor: not-allowed; }
`;

const UserTypeGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 12px;
`;

const UserTypeCard = styled.button<{ $active: boolean }>`
  width: 100%; padding: 20px 18px; border-radius: 16px; display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1.5px solid ${(p) => (p.$active ? PRIMARY : '#e5e7eb')}; cursor: pointer;
  background-color: ${(p) => (p.$active ? '#F5FAFF' : '#fff')};
`;

const UserTypeIcon = styled.span`
  font-size: 22px; width: 32px; text-align: center;
`;

const UserTypeLabel = styled.span`
  font-size: 18px; color: #111; font-weight: 700;
`;

const FixedFooter = styled.div`
  position: fixed; left: 0; right: 0; bottom: calc(64px + env(safe-area-inset-bottom));
  padding: 12px 16px 12px 16px;
  background: transparent;
`;

const FooterInner = styled.div`
  background: transparent;
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 560px; /* 모바일 전체, 태블릿/데스크탑에서 중앙 정렬 */
  margin: 0 auto;
`;

const ProfilePreview = styled.div`
  display: flex; gap: 16px; align-items: center; margin-bottom: 16px;
`;

const PhotoPlaceholder = styled.div`
  width: 96px; height: 96px; background: #e5e7eb; border-radius: 24px;
`;

const PreviewFields = styled.div`
  flex: 1; display: grid; gap: 10px;
`;

const PreviewInput = styled.input`
  width: 100%; height: 46px; border-radius: 10px; border: 1px dashed #d1d5db; padding: 0 12px; font-size: 14px; color: #6b7280; background: #f9fafb;
`;


