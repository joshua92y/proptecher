// src/app/(admin)/admin/inspections/[requestId]/page.tsx
// 임장요청 매물 상세보기 — 소비자 입력값은 읽기 전용, 임장비는 제목 뒤에 붙여서 표시
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { repo, type RequestDetail } from "@/lib/repos/inspections";

/* ===== utils ===== */
const formatDateDot = (iso: string) => {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : iso || "-";
};
const toKrwShort = (won: number) =>
  won >= 10_000 ? `${Math.round(won / 10_000)}만원` : `${won.toLocaleString()}원`;

type Props = { params: { requestId: string } };

export default function RequestDetailPage({ params }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const readonly = sp.get("readonly") === "1";

  const { requestId } = params;

  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const d = await repo.getRequestDetail(requestId);
      if (!mounted) return;
      setData(
        d ?? {
          // 안전 폴백
          id: requestId,
          listing_id: "unknown",
          title: "다세대 주택 (전용 84㎡)",
          address: "전북 무주군 무주읍 적천로 343",
          priceText: "15만원",
          fee_won: 150000,
          preferred_date: "2025-12-20",
          contact_phone: "010-1234-5678",
          request_note: "예시 요청사항입니다.",
          description:
            "재개발 예정 구역으로 정확한 시세 파악이 필요합니다. 3층 남향으로 채광이 좋습니다.",
          highlights: [
            "재개발 예정 구역 (2029년 예정)",
            "남향 채광 우수",
            "역세권(도보 5분)",
            "주차장 세대동 1구역",
          ],
          photos: ["/images/room1.jpg", "/images/room2.jpg", "/images/room3.jpg", "/images/room4.jpg"],
          requested_at: Date.now(),
          img: null,
        }
      );
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  // 임장비: fee_won > priceText > "15만원"
  const feeText = useMemo(() => {
    if (!data) return "";
    if (typeof data.fee_won === "number") return toKrwShort(data.fee_won);
    if (data.priceText) return data.priceText;
    return "15만원";
  }, [data]);

  async function handleAccept() {
    try {
      const { inspectionId } = await repo.acceptRequest(requestId);
      // 서버 알림은 실패해도 화면 이동
      fetch(`/api/admin/inspections/${requestId}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
      router.replace(`/admin/inspections/active?accepted=${encodeURIComponent(inspectionId)}`);
    } catch {
      router.replace(`/admin/inspections/active?accepted=${encodeURIComponent(`ins_${requestId}`)}`);
    }
  }

  async function handleReject() {
    try {
      await repo.rejectRequest(requestId);
      fetch(`/api/admin/inspections/${requestId}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
      alert("요청을 거절했습니다.");
      router.back();
    } catch {
      alert("거절 처리 중 문제가 발생했어요.");
      router.back();
    }
  }

  if (loading) {
    return (
      <Wrap>
        <Header>
          <Back href="/admin">‹</Back>
          <H1>매물 임장 요청</H1>
          <Spacer />
        </Header>
        <SkeletonBox />
      </Wrap>
    );
  }
  if (!data) {
    return (
      <Wrap>
        <Header>
          <Back href="/admin">‹</Back>
          <H1>매물 임장 요청</H1>
          <Spacer />
        </Header>
        <Empty>해당 요청을 찾을 수 없어요.</Empty>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Header>
        <Back href="/admin">‹</Back>
        <H1>매물 임장 요청</H1>
        <Spacer />
      </Header>

      {/* 지도(플레이스홀더) */}
      <MapBox><Pin>📍</Pin></MapBox>

      {/* 요약 카드: 제목(주택유형+평수) 뒤에 임장비 붙임 */}
      <SummaryCard>
        <TitleRow>
          <Title>
            {data.title}
            <FeeInline>{feeText}</FeeInline>
          </Title>
        </TitleRow>
        <AddrRow>
          <AddrDot>•</AddrDot>
          <AddrText>{data.address}</AddrText>
        </AddrRow>
      </SummaryCard>

      {/* 상세 사항 */}
      <SectionTitle>상세 사항</SectionTitle>
      <InfoCard>
        <BlockTitle>매물 설명</BlockTitle>
        <P>{data.description ?? "-"}</P>

        <BlockTitle style={{ marginTop: 16 }}>특이사항</BlockTitle>
        <Ul>{(data.highlights ?? []).map((h, i) => (<li key={i}>{h}</li>))}</Ul>
      </InfoCard>

      {/* 현재 사진 */}
      <SectionHead>
        <SectionTitle>매물 현재 사진</SectionTitle>
        <SmallBadge>{(data.photos ?? []).length}장</SmallBadge>
      </SectionHead>
      <PhotoRow>
        {(data.photos ?? []).map((src, i) => (
          <Photo key={i} src={src} alt={`photo-${i}`} loading="lazy" />
        ))}
      </PhotoRow>

      {/* 소비자 요청 정보 — 읽기 전용 */}
      <SectionTitle>소비자 요청 정보</SectionTitle>
      <InfoCard>
        <Row>
          <Label>희망 날짜</Label>
          <Value>{formatDateDot(data.preferred_date ?? "")}</Value>
        </Row>
        <Row>
          <Label>연락처</Label>
          <Value>{data.contact_phone ?? "-"}</Value>
        </Row>
        <Row col>
          <Label>요청사항</Label>
          <ReadOnlyBox>{data.request_note ?? "작성된 요청사항이 없습니다."}</ReadOnlyBox>
        </Row>
      </InfoCard>

      {/* ✅ 읽기전용이 아닐 때만 하단 액션 노출 */}
      {!readonly && (
        <>
          <BottomBar>
            <Ghost onClick={handleReject}>거절하기</Ghost>
            <Primary onClick={handleAccept}>수락하기</Primary>
          </BottomBar>
          <SpacerBottom />
        </>
      )}
    </Wrap>
  );
}

/* ===== styled ===== */
const Wrap = styled.div`padding-bottom: 80px;`;
const Header = styled.div`display:flex; align-items:center; padding:10px 12px;`;
const Back = styled(Link)`font-size:22px; line-height:1;`;
const H1 = styled.h1`flex:1; text-align:center; font-size:16px; margin:0;`;
const Spacer = styled.div`width:22px;`;
const SkeletonBox = styled.div`height: 280px; border-radius: 12px; background: #f5f5f5; margin: 12px;`;
const Empty = styled.div`padding: 24px; text-align:center; color:#888;`;

const MapBox = styled.div`
  height: 200px; background:#eef2ff; margin: 0 12px; border-radius: 12px;
  display:flex; align-items:center; justify-content:center;
`;
const Pin = styled.div`font-size:28px;`;

const SummaryCard = styled.div`
  margin: 12px; background:#fff; border:1px solid #eee; border-radius:12px; padding:12px;
`;
const TitleRow = styled.div`display:flex; align-items:flex-start;`;
const Title = styled.div`font-weight:700; font-size:16px; line-height:1.3;`;
const FeeInline = styled.span`
  margin-left:8px; padding:4px 8px; border-radius:999px;
  background:#f1e6ff; color:#7b3fe4; font-size:12px; font-weight:700;
`;

const AddrRow = styled.div`display:flex; align-items:center; gap:6px; color:#666; margin-top:6px;`;
const AddrDot = styled.span``;
const AddrText = styled.span``;

const SectionTitle = styled.h3`margin: 16px 12px 8px; font-size:14px;`;
const SectionHead = styled.div`display:flex; align-items:center; justify-content:space-between; margin: 16px 12px 8px;`;
const SmallBadge = styled.span`font-size:12px; color:#666;`;

const InfoCard = styled.div`
  margin: 0 12px; background:#fff; border:1px solid #eee; border-radius:12px; padding:12px;
`;
const BlockTitle = styled.div`font-weight:700; margin-bottom:6px;`;
const P = styled.p`margin:0; color:#444; line-height:1.5;`;
const Ul = styled.ul`margin:6px 0 0 18px; color:#444;`;

const PhotoRow = styled.div`display:flex; gap:8px; padding:0 12px;`;
const Photo = styled.img`width: 88px; height: 66px; object-fit:cover; border:1px solid #eee; border-radius:8px;`;

const Row = styled.div<{ col?: boolean }>`
  display:flex; ${p => p.col ? "flex-direction:column; gap:6px;" : "align-items:center; justify-content:space-between;"}
  & + & { margin-top:8px; }
`;
const Label = styled.div`color:#666;`;
const Value = styled.div`font-weight:700;`;

const ReadOnlyBox = styled.div`
  width:100%; min-height:88px; border:1px solid #eee; border-radius:10px;
  padding:10px; background:#fafafa; color:#444; white-space:pre-wrap;
`;

const BottomBar = styled.div`
  position:fixed; left:0; right:0; bottom:0; display:flex; gap:8px;
  padding:10px 12px; background:#fff; border-top:1px solid #eee;
`;
const Ghost = styled.button`
  flex:1; height:44px; background:#fff; border:1px solid #ccc; border-radius:12px;
`;
const Primary = styled.button`
  flex:1; height:44px; border:none; background:#7b3fe4; color:#fff; font-weight:700; border-radius:12px;
`;
const SpacerBottom = styled.div`height: 60px;`;
