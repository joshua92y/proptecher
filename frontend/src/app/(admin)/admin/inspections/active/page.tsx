// src/app/(admin)/admin/inspections/active/page.tsx
"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { repo } from "@/lib/repos/inspections";
import type { ActiveInspection } from "@/lib/repos/inspections";

export default function ActiveInspectionsPage() {
  const sp = useSearchParams();
  const acceptedId = sp.get("accepted") ?? undefined;

  const [items, setItems] = useState<ActiveInspection[] | null>(null);

  // 삭제(취소) 모달 상태
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<ActiveInspection | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const list = await repo.getActive();
      if (alive) setItems(list);
    };

    sync();
    const off = repo.subscribe(sync);
    return () => {
      alive = false;
      off?.();
    };
  }, []);

  const isLoading = items === null;
  const list = items ?? [];

  const openConfirm = (it: ActiveInspection) => {
    setTarget(it);
    setReason("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (working) return;
    setConfirmOpen(false);
    setTarget(null);
    setReason("");
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      setWorking(true);
      await repo.cancelActive(target.id, { reason, requeue: true });
      setWorking(false);
      closeConfirm();
    } catch {
      setWorking(false);
      alert("삭제 처리 중 문제가 발생했어요.");
    }
  };

  return (
    <Wrap>
      <Header>
        <H1>진행중인 임장</H1>
      </Header>

      {isLoading ? (
        <Empty>불러오는 중…</Empty>
      ) : list.length === 0 ? (
        <Empty>진행중인 임장이 없습니다.</Empty>
      ) : (
        <List>
          {list.map((it) => {
            const isJustAccepted = acceptedId === it.id;
            return (
              <Card key={it.id} $pulse={!!isJustAccepted}>
                {/* 우상단 삭제(취소) 버튼 */}
                <DeleteBtn
                  aria-label="임장 취소"
                  title="임장 취소"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openConfirm(it);
                  }}
                >
                  🗑️
                </DeleteBtn>

                {/* 상단: 왼쪽에 몰아서 (제목 + 임장비 + 최근수락) */}
                <LeftTop>
                  <Title>{it.title}</Title>
                  <PriceChip>{it.priceText}</PriceChip>
                  {isJustAccepted && <NewBadge>최근 수락됨</NewBadge>}
                </LeftTop>

                <Addr>📍 {it.address}</Addr>

                {/* 진행률 */}
                <ProgressRow>
                  <ProgressLabel>진행률</ProgressLabel>
                  <Percent>{it.progress}%</Percent>
                </ProgressRow>
                <ProgressBar>
                  <ProgressFill
                    style={{ width: `${Math.min(100, Math.max(0, it.progress))}%` }}
                  />
                </ProgressBar>

                {/* 액션 버튼: 상세보기 / 진행현황 */}
                <ActionRow>
                  <ActionGhostLink
                    href={`/admin/inspections/${encodeURIComponent(it.requestId)}?readonly=1`}
                  >
                    상세 보기
                  </ActionGhostLink>

                  <ActionPrimaryLink
                    href={`/admin/inspections/progress/${encodeURIComponent(it.id)}`}
                  >
                    진행현황
                  </ActionPrimaryLink>
                </ActionRow>
              </Card>
            );
          })}
        </List>
      )}

      {/* 확인 모달 */}
      {confirmOpen && (
        <ModalBackdrop onClick={closeConfirm}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>임장 취소</ModalTitle>
              <ModalClose onClick={closeConfirm}>✕</ModalClose>
            </ModalHeader>

            <ModalBody>
              <Textarea
                placeholder="취소 사유를 입력해주세요.."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
              />
              <SmallNote>* 임장 3회 취소 시 패널티가 부과될 수 있습니다.</SmallNote>
            </ModalBody>

            <ModalActions>
              <BtnGhost onClick={closeConfirm} disabled={working}>
                취소
              </BtnGhost>
              <BtnPrimary onClick={handleConfirmDelete} disabled={working}>
                {working ? "처리 중…" : "확인"}
              </BtnPrimary>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}
    </Wrap>
  );
}

/* ───────── styled ───────── */
const Wrap = styled.div``;

const Header = styled.div`
  padding: 12px;
`;
const H1 = styled.h1`
  font-size: 16px;
  margin: 0;
`;

const Empty = styled.div`
  padding: 24px;
  color: #888;
  text-align: center;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px 12px;
`;

const Card = styled.div<{ $pulse?: boolean }>`
  position: relative;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
  /* 휴지통 자리 확보(겹침 방지) */
  padding-right: 48px;

  ${(p) =>
    p.$pulse &&
    `
    box-shadow: 0 0 0 0 rgba(123,63,228,0.35);
    animation: pulse 1.4s ease-out 2;
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(123,63,228,0.4); }
      100% { box-shadow: 0 0 0 14px rgba(123,63,228,0); }
    }
  `}
`;

const DeleteBtn = styled.button`
  position: absolute;
  right: 10px;
  top: 10px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  color: #9aa0a6;
`;

const LeftTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap; /* 좁을 때 줄바꿈 */
  justify-content: flex-start; /* 왼쪽 정렬 */
`;

const Title = styled.div`
  font-weight: 700;
  /* 왼쪽에 붙여 두기 위해 flex 확장 제거 */
  /* 긴 제목이 칩을 밀지 않도록 약간의 여유만 */
  max-width: 100%;
`;

const PriceChip = styled.span`
  font-size: 12px;
  background: #f1e6ff;
  color: #7b3fe4;
  border-radius: 999px;
  padding: 3px 8px;
`;

const NewBadge = styled.span`
  font-size: 10px;
  background: #7b3fe4;
  color: #fff;
  border-radius: 999px;
  padding: 2px 6px;
`;

const Addr = styled.div`
  color: #666;
  font-size: 13px;
  margin-top: 4px;
`;

const ProgressRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #555;
  font-size: 12px;
`;
const ProgressLabel = styled.span``;
const Percent = styled.span``;

const ProgressBar = styled.div`
  height: 8px;
  margin-top: 4px;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%;
  background: #7b3fe4;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;
const ActionGhost = styled.a`
  flex: 1;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
`;
const ActionPrimary = styled.a`
  flex: 1;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #7b3fe4;
  color: #fff;
  border-radius: 10px;
  text-decoration: none;
`;

/* ——— modal ——— */
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;
const ModalCard = styled.div`
  width: min(520px, calc(100% - 32px));
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
`;
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
`;
const ModalTitle = styled.div`
  font-weight: 700;
  font-size: 16px;
  flex: 1;
`;
const ModalClose = styled.button`
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
`;
const ModalBody = styled.div`
  padding: 12px 16px;
`;
const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px;
  resize: vertical;
`;
const SmallNote = styled.div`
  color: #999;
  font-size: 12px;
  margin-top: 8px;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 16px 16px;
`;
const BtnGhost = styled.button`
  flex: 1;
  height: 42px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 10px;
`;
const BtnPrimary = styled.button`
  flex: 1;
  height: 42px;
  border: none;
  background: #7b3fe4;
  color: #fff;
  border-radius: 10px;
`;

const baseButtonCss = `
  flex:1; height:40px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  text-decoration:none; font-weight:700;
`;

const ActionGhostLink = styled(Link)`
  ${baseButtonCss}
  border:1px solid #ccc; background:#fff; color:#111;
`;

const ActionPrimaryLink = styled(Link)`
  ${baseButtonCss}
  border:none; background:#7b3fe4; color:#fff;
`;
