"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import MobileLayout from "@/components/MobileLayout";
import { apiFetch } from "@/lib/utils/api";

const PRIMARY = "#2F80ED";
const REGION_LIST = ["서울", "경기", "인천", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "부산", "대구", "광주", "대전", "울산", "제주"];
const PURPOSE_LIST = ["귀어","귀농","취업","기타"] as const;

export default function PreferencesPage() {
  const [email, setEmail] = useState<string>("");
  const [regions, setRegions] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const e = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (e) setEmail(e);
  }, []);

  useEffect(() => {
    if (!email) return;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/users/preferences?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setRegions(Array.isArray(data.preferred_regions) ? data.preferred_regions : []);
        setPurpose(data.purpose ?? null);
      } catch {
        setRegions([]); setPurpose(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  const toggleRegion = (name: string) => {
    setRegions((prev) => prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]);
  };

  const onSave = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await apiFetch(`/api/users/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, preferred_regions: regions, purpose })
      });
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await apiFetch(`/api/users/preferences`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setRegions([]); setPurpose(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout title="관심지역/귀촌목적">
      <Container>
        {loading ? (
          <Empty>불러오는 중...</Empty>
        ) : (
          <>
            <Section>
              <Title>관심 지역</Title>
              <Chips>
                {REGION_LIST.map((n) => (
                  <Chip key={n} $active={regions.includes(n)} onClick={() => toggleRegion(n)}>{n}</Chip>
                ))}
              </Chips>
            </Section>

            <Section>
              <Title>귀촌 목적</Title>
              <Chips>
                {PURPOSE_LIST.map((p) => (
                  <Chip key={p} $active={purpose === p} onClick={() => setPurpose(p)}>{p}</Chip>
                ))}
                <Chip $active={!purpose} onClick={() => setPurpose(null)}>선택 안함</Chip>
              </Chips>
            </Section>

            <FixedFooter>
              <FooterInner>
                <PrimaryButton onClick={onSave} disabled={saving}>{saving ? '저장중...' : '저장'}</PrimaryButton>
                <GhostButton onClick={onReset} disabled={saving}>초기화</GhostButton>
              </FooterInner>
            </FixedFooter>
          </>
        )}
      </Container>
    </MobileLayout>
  );
}

const Container = styled.div`
  min-height: 100%; padding: 16px; padding-bottom: 160px;
`;
const Section = styled.section`
  margin-bottom: 20px;
`;
const Title = styled.h3`
  margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #111;
`;
const Chips = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px;
`;
const Chip = styled.button<{ $active?: boolean }>`
  border: 1.5px solid ${(p)=>p.$active?PRIMARY:'#e5e7eb'}; background: ${(p)=>p.$active?'#F5FAFF':'#fff'};
  color: #111; border-radius: 16px; padding: 8px 12px; font-weight: 700; font-size: 13px;
`;
const Empty = styled.p`
  text-align: center; color: #9ca3af; margin-top: 40px;
`;
const FixedFooter = styled.div`
  position: fixed; left: 0; right: 0; bottom: calc(64px + env(safe-area-inset-bottom)); padding: 12px 16px;
`;
const FooterInner = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 10px; max-width: 560px; margin: 0 auto;
`;
const PrimaryButton = styled.button<{disabled?: boolean}>`
  width: 100%; height: 58px; border-radius: 16px; background: ${PRIMARY}; color: #fff; border: none; font-weight: 800; font-size: 18px;
`;
const GhostButton = styled.button`
  width: 100%; height: 54px; border-radius: 14px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-weight: 700; font-size: 16px;
`;



