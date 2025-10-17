// src/app/(consumer)/listings/[id]/page.tsx
/** 매물 상세 보기 — 레이아웃 유지 + 임장상태(repo) 반영 + 모달 입력 */
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { getListingDetailVM, type ListingDetailVM } from "@/lib/data/listings";
import ListingInfoModal from "@/components/consumer/modals/ListingInfoModal";
import RequestInspectionModal from "@/components/consumer/modals/RequestInspectionModal";
import { repo, type InspectionStatus } from "@/lib/repos/inspections";
import MobileLayout from "@/components/MobileLayout";
import { getListingImageByType } from "@/lib/utils/randomImage";

type Params = { params: Promise<{ id: string }> };

export default function ListingDetail({ params }: Params) {
  const { id } = use(params);
  const router = useRouter();

  // 탭
  const [mainTab, setMainTab] = useState<"env" | "apt" | "life">("env");
  const [subTab, setSubTab] = useState<"traffic" | "amenity">("traffic");

  // 모달
  const [openInfo, setOpenInfo] = useState(false);
  const [openRequest, setOpenRequest] = useState(false);

  // 데이터
  const [data, setData] = useState<ListingDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  // 임장 상태
  const [insStatus, setInsStatus] = useState<InspectionStatus | null>(null);

  useEffect(() => {
    let alive = true;
    let off: undefined | (() => void);

    // 매물 상세
    (async () => {
      setLoading(true);
      const vm = await getListingDetailVM(id);
      if (!alive) return;
      setData(vm);
      setLoading(false);
    })();

    // 현재 임장 상태 (repo)
    (async () => {
      const s = await repo.getStatusByListing(id);
      if (!alive) return;
      setInsStatus(s);
    })();

    // 저장소 변경 구독(관리자 수락 등 실시간 반영)
    off = repo.subscribe(async () => {
      const s = await repo.getStatusByListing(id);
      if (!alive) return;
      setInsStatus(s);
    });

    return () => {
      alive = false;
      off?.();
    };
  }, [id]);

  // 임장 요청 버튼 → 모달 열기
  const openRequestModal = () => setOpenRequest(true);

  // 모달 제출 → repo로 생성(중복 방지)
  async function handleCreateRequest(payload: {
    preferred_date: string;
    contact_phone: string;
    request_note?: string;
  }) {
    if (!data) return;
    if (insStatus) {
      alert("이미 접수/진행 중인 매물입니다.");
      return;
    }

    await repo.createRequestFromListing(id, {
      title: `${data.leaseType} (전용 ${data.specs.exclusiveAreaText.split("㎡")[0]}㎡)`,
      address: data.address,
      priceText: data.priceText,
      img: data.heroImages?.[0] ?? null,
      preferred_date: payload.preferred_date,
      contact_phone: payload.contact_phone,
      request_note: payload.request_note,
    });

    setInsStatus("requested");
    setOpenRequest(false);
    alert("임장 요청이 접수되었습니다.");
  }

  if (loading) {
    return (
      <MobileLayout title="매물 상세" showBack={true}>
        <Wrap>
          <SkeletonHero />
          <Section><SkeletonBox /></Section>
          <Section><SkeletonBox /></Section>
        </Wrap>
      </MobileLayout>
    );
  }

  if (!data) {
    return (
      <MobileLayout title="매물 상세" showBack={true}>
        <Wrap>
          <EmptyBox>해당 매물 데이터를 찾을 수 없어요.</EmptyBox>
          <Section>
            <ExploreCTA href="/listings">
              <RowLeft>
                <Emoji>🔙</Emoji>
                <div><b>목록으로 돌아가기</b></div>
              </RowLeft>
              <Arrow>›</Arrow>
            </ExploreCTA>
          </Section>
        </Wrap>
      </MobileLayout>
    );
  }

  const heroSrc = data.heroImages[0] ?? getListingImageByType(id, data.houseType);

  return (
    <MobileLayout title="매물 상세" showBack={true}>
    <Wrap>
      {/* 히어로 영역 */}
      <Hero>
        <HeroImgWrap>
          <Image src={heroSrc} alt="매물 사진" fill priority style={{ objectFit: "cover" }} />
        </HeroImgWrap>

        <Dots><Dot $active /><Dot /><Dot /></Dots>

        <HeroOverlay>
          <PriceAccent>{`${data.leaseType} ${data.priceText}`}</PriceAccent>
          <MetaRow><span>{data.address}</span></MetaRow>

          <MetaChips>
            {data.adminFeeText && <Chip>월 관리비 {data.adminFeeText}</Chip>}
            {data.parking && <Chip>{data.parking}</Chip>}
          </MetaChips>

          <InfoGrid>
            <InfoBox><SmallLabel>전용면적</SmallLabel><BigValue>{data.specs.exclusiveAreaText}</BigValue></InfoBox>
            <InfoBox><SmallLabel>방/욕실</SmallLabel><BigValue>{data.specs.roomsBathsText}</BigValue></InfoBox>
            <InfoBox><SmallLabel>층수</SmallLabel><BigValue>{data.specs.floor}</BigValue></InfoBox>
            <InfoBox><SmallLabel>준공년도</SmallLabel><BigValue>{data.specs.builtYearText}</BigValue></InfoBox>
          </InfoGrid>

          <RowLink onClick={() => setOpenInfo(true)}>
            <span>매물 기본 정보</span>
            <Arrow>›</Arrow>
          </RowLink>
        </HeroOverlay>

        {/* 기본정보 모달 */}
        <ListingInfoModal open={openInfo} onClose={() => setOpenInfo(false)} data={data} />
      </Hero>

      {/* 임장 리포트 요청 섹션 (상태에 따라 분기) */}
      <Section>
        {insStatus === null && (
          <SectionCard>
            <SectionTitle>임장 리포트 요청</SectionTitle>
            <SectionDesc>
              평면도, 매물 상세 정보 등 전문가의 현장 점검을 통한
              상세한 매물 분석 리포트를 받아보세요.
            </SectionDesc>
            <PrimaryButton onClick={openRequestModal}>임장 리포트 요청하기</PrimaryButton>
          </SectionCard>
        )}

        {insStatus === "requested" && (
          <SectionCard>
            <SectionTitle>임장 접수 완료</SectionTitle>
            <SectionDesc>
              2~3일 이내 전문가가 현장 점검을 진행합니다. 진행 상황은 이후 알림으로 알려드려요.
            </SectionDesc>
          </SectionCard>
        )}

        {insStatus === "active" && (
          <SectionCard>
            <SectionTitle>임장 진행 중</SectionTitle>
            <SectionDesc>
              평면도 및 상세 정보는 진행 완료 후 확인하실 수 있어요.
            </SectionDesc>
            {/* 진행중일 때는 버튼 없음 */}
          </SectionCard>
        )}
      </Section>

      {/* 주거정보 섹션 */}
      <Section>
        <MainTabs>
          <MainTab $active={mainTab === "env"} onClick={() => setMainTab("env")}>주거환경 정보</MainTab>
          <MainTab $active={mainTab === "life"} onClick={() => setMainTab("life")}>생활 이야기</MainTab>
          <MainTab $active={mainTab === "apt"} onClick={() => setMainTab("apt")} disabled>기타</MainTab>
        </MainTabs>

        {mainTab === "env" && (
          <>
            <SubTabs>
              <SubTab $active={subTab === "traffic"} onClick={() => setSubTab("traffic")}>교통</SubTab>
              <SubTab $active={subTab === "amenity"} onClick={() => setSubTab("amenity")}>편의시설/상권</SubTab>
            </SubTabs>

            {subTab === "traffic" && (
              <>
                <ScoreRow>
                  <ScoreBox>
                    <ScoreTitle>대중교통 편의성</ScoreTitle>
                    <ScoreValue><b>{data.env.traffic.scores.convenience}</b> <span>/10점</span></ScoreValue>
                  </ScoreBox>
                  <ScoreBox>
                    <ScoreTitle>노선 다양성</ScoreTitle>
                    <ScoreValue><b>{data.env.traffic.scores.diversity}</b> <span>/5점</span></ScoreValue>
                  </ScoreBox>
                </ScoreRow>

                <List>
                  {data.env.traffic.busStops.map((b, i) => (
                    <ListItem key={`bus-${i}`}>
                      <LeftDot />
                      <ItemText>
                        <ItemTitle>{b.name}</ItemTitle>
                        {b.distance && <ItemMeta>{b.distance}</ItemMeta>}
                        {b.lines?.length ? <PillRow>{b.lines.map((ln) => <Pill key={ln}>{ln}</Pill>)}</PillRow> : null}
                      </ItemText>
                    </ListItem>
                  ))}
                  {data.env.traffic.subways.map((s, i) => (
                    <ListItem key={`sub-${i}`}>
                      <LeftDot />
                      <ItemText>
                        <ItemTitle>{s.name}</ItemTitle>
                        {s.distance && <ItemMeta>{s.distance}</ItemMeta>}
                        {s.lines?.length ? <PillRow>{s.lines.map((ln) => <Pill key={ln}>{ln}</Pill>)}</PillRow> : null}
                      </ItemText>
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {subTab === "amenity" && (
              <InfoCard>
                <b>편의시설/상권</b>
                <SmallP>{data.env.amenity.summary}</SmallP>
              </InfoCard>
            )}
          </>
        )}

        {mainTab === "life" && (
          <InfoCard>
            <b>생활 이야기</b>
            <SmallP>{data.life.summary || "데이터가 아직 없어요."}</SmallP>
          </InfoCard>
        )}
      </Section>

      {/* Q&A */}
      <Section>
        <QAHeader>
          <QAHeading>Q&amp;A</QAHeading>
          <GhostButton>Q&amp;A 작성하기</GhostButton>
        </QAHeader>

        {data.qa.length === 0 ? (
          <EmptyBox>작성된 Q&amp;A가 없습니다.</EmptyBox>
        ) : (
          <List>
            {data.qa.map((q) => (
              <ListItem key={q.id}>
                <LeftDot />
                <ItemText>
                  <ItemTitle>Q. {q.question}</ItemTitle>
                  <ItemMeta>{q.answer ? `A. ${q.answer}` : "답변 대기"}</ItemMeta>
                </ItemText>
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      {/* 주변환경 CTA */}
      <Section>
        <ExploreCTA href={`/listings/${id}/explore`}>
          <RowLeft>
            <Emoji>👥</Emoji>
            <div><b>주변 환경이 궁금하다면?</b><SmallP>주변 환경 보러가기</SmallP></div>
          </RowLeft>
          <Arrow>›</Arrow>
        </ExploreCTA>
      </Section>

      {/* 하단 바 */}
      <BottomBar>
        <RoundBtn>📞</RoundBtn>
        <RoundBtn>💬</RoundBtn>
        <BottomPrimary>거래하기</BottomPrimary>
      </BottomBar>

      {/* 임장 요청 모달 */}
      <RequestInspectionModal
        open={openRequest}
        onClose={() => setOpenRequest(false)}
        onSubmit={handleCreateRequest}
      />
    </Wrap>
    </MobileLayout>
  );
}

/* ========= styled ========= */
const Wrap = styled.div``;

/* 로딩/스켈레톤 */
const SkeletonHero = styled.div`height:200px;background:#f3f3f3;`;
const SkeletonBox = styled.div`height:120px;background:#f8f8f8;border-radius:12px;`;

/* 히어로 */
const Hero = styled.div`position:relative;`;
const HeroImgWrap = styled.div`position:relative;width:100%;height:200px;overflow:hidden;`;
const Dots = styled.div`position:absolute;left:50%;bottom:10px;transform:translateX(-50%);display:flex;gap:6px;`;
const Dot = styled.span<{ $active?: boolean }>`
  width:6px;height:6px;border-radius:50%;background:${p=>p.$active?"#7b3fe4":"#ddd"};
`;
const HeroOverlay = styled.div`padding:12px;background:#fff;border-top-left-radius:12px;border-top-right-radius:12px;margin-top:-8px;`;
const PriceAccent = styled.div`color:#7b3fe4;font-weight:800;font-size:18px;`;
const MetaRow = styled.div`color:#666;margin-top:4px;`;
const MetaChips = styled.div`display:flex;gap:6px;margin-top:6px;`;
const Chip = styled.span`font-size:12px;background:#f3f1ff;color:#7b3fe4;border-radius:999px;padding:3px 8px;`;

const InfoGrid = styled.div`display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px;`;
const InfoBox = styled.div`background:#fafafa;border:1px solid #eee;border-radius:12px;padding:10px;`;
const SmallLabel = styled.div`font-size:12px;color:#666;`;
const BigValue = styled.div`font-size:14px;font-weight:700;`;
const RowLink = styled.button`display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:10px;background:none;border:none;padding:10px 0;`;
const Arrow = styled.span``;

/* 섹션 공통 */
const Section = styled.section`padding:12px;`;
const SectionCard = styled.div`background:#fff;border:1px solid #eee;border-radius:12px;padding:14px;`;
const SectionTitle = styled.h3`margin:0 0 6px;font-size:15px;`;
const SectionDesc = styled.p`margin:0 0 12px;color:#666;`;
const PrimaryButton = styled.button`
  width:100%;height:44px;border:none;border-radius:12px;background:#7b3fe4;color:#fff;font-weight:700;
`;

/* 탭 */
const MainTabs = styled.div`display:flex;gap:6px;margin-bottom:8px;`;
const MainTab = styled.button<{ $active?: boolean }>`
  flex:1;height:36px;border-radius:10px;border:1px solid ${p=>p.$active?"#7b3fe4":"#eee"};
  background:${p=>p.$active?"#f4efff":"#fff"};
`;
const SubTabs = styled.div`display:flex;gap:6px;margin:6px 0;`;
const SubTab = styled.button<{ $active?: boolean }>`
  height:28px;padding:0 10px;border-radius:999px;border:1px solid ${p=>p.$active?"#7b3fe4":"#eee"};
  background:${p=>p.$active?"#f4efff":"#fff"};font-size:12px;
`;

/* 리스트/점수 */
const ScoreRow = styled.div`display:flex;gap:8px;margin:8px 0;`;
const ScoreBox = styled.div`flex:1;background:#fafafa;border:1px solid #eee;border-radius:12px;padding:10px;`;
const ScoreTitle = styled.div`font-size:12px;color:#666;`;
const ScoreValue = styled.div`font-size:14px;`;

const List = styled.ul`list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;`;
const ListItem = styled.li`display:flex;gap:10px;align-items:flex-start;`;
const LeftDot = styled.div`width:6px;height:6px;background:#bbb;border-radius:50%;margin-top:7px;`;
const ItemText = styled.div``;
const ItemTitle = styled.div`font-weight:700;`;
const ItemMeta = styled.div`color:#888;font-size:12px;`;
const PillRow = styled.div`display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;`;
const Pill = styled.span`font-size:11px;background:#f5f5f5;border:1px solid #eee;border-radius:999px;padding:2px 6px;`;

const InfoCard = styled.div`padding:10px;border:1px solid #eee;border-radius:12px;background:#fff;`;
const SmallP = styled.p`margin:6px 0 0;color:#666;`;

/* Q&A */
const QAHeader = styled.div`display:flex;justify-content:space-between;align-items:center;`;
const QAHeading = styled.h3`margin:0;`;
const GhostButton = styled.button`border:1px solid #ddd;border-radius:10px;background:#fff;height:32px;padding:0 10px;`;
const EmptyBox = styled.div`padding:30px;text-align:center;color:#888;`;

/* CTA */
const ExploreCTA = styled(Link)`
  display:flex;justify-content:space-between;align-items:center;
  border:1px solid #eee;border-radius:12px;padding:12px;background:#fff;
`;
const RowLeft = styled.div`display:flex;align-items:center;gap:10px;`;
const Emoji = styled.span``;

/* 하단 바 */
const BottomBar = styled.div`
  position:sticky;bottom:0;display:flex;gap:8px;padding:10px 12px;background:#fff;border-top:1px solid #eee;
`;
const RoundBtn = styled.button`width:44px;height:44px;border-radius:999px;border:1px solid #eee;background:#fff;`;
const BottomPrimary = styled.button`
  flex:1;height:44px;border:none;border-radius:12px;background:#7b3fe4;color:#fff;font-weight:700;
`;
