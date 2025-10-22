// src/app/(admin)/admin/inspections/progress/[inspectionId]/page.tsx
// 진행중 임장(평면도 버튼 + 체크리스트 + 사진/메모 + 진행률 반영)

"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { repo } from "@/lib/repos/inspections";
import type { ActiveInspection } from "@/lib/repos/inspections";

/* ───────────── 로컬 저장 키 ───────────── */
const PROG_PREFIX = "inspection:progress:"; // PROG_PREFIX + inspectionId

type Photo = string; // dataURL
type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  photos: Photo[]; // 최대 3장
  memo: string;
};
type ProgressDoc = {
  floorplan?: Photo | null; // 평면도 이미지
  external: ChecklistItem[];
  internal: ChecklistItem[];
};

/* 기본 템플릿 */
const defaultDoc = (): ProgressDoc => ({
  floorplan: null,
  external: [
    { id: "ext-outer",   label: "건물 외관 상태 확인", checked: false, photos: [], memo: "" },
    { id: "ext-parking", label: "주차장 상태 및 접근성", checked: false, photos: [], memo: "" },
    { id: "ext-env",     label: "주변 환경 (소음, 냄새 등)", checked: false, photos: [], memo: "" },
  ],
  internal: [
    { id: "int-entrance", label: "현관문 및 신발장 상태", checked: false, photos: [], memo: "" },
    { id: "int-living",   label: "거실 바닥재 및 벽지 상태", checked: false, photos: [], memo: "" },
    { id: "int-bath",     label: "욕실 누수/곰팡이 상태", checked: false, photos: [], memo: "" },
  ],
});

/* DB load/save */
function mergeItems(base: ChecklistItem[], saved?: ChecklistItem[]): ChecklistItem[] {
  if (!saved) return base;
  const map = new Map(saved.map(s => [s.id, s]));
  return base.map(b => ({ ...b, ...(map.get(b.id) ?? {}) }));
}

async function loadDoc(inspectionId: string): Promise<ProgressDoc> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/admin/inspections/${inspectionId}/progress`);
    
    if (response.ok) {
      const data = await response.json();
      const base = defaultDoc();
      
      if (data.checklistData) {
        return {
          ...base,
          floorplan: data.checklistData.floorplan || null,
          external: mergeItems(base.external, data.checklistData.external),
          internal: mergeItems(base.internal, data.checklistData.internal),
        };
      }
    }
    
    return defaultDoc();
  } catch (error) {
    console.error("진행 상황 불러오기 실패:", error);
    return defaultDoc();
  }
}

async function saveDoc(inspectionId: string, doc: ProgressDoc) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${apiUrl}/api/admin/inspections/${inspectionId}/save-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checklistData: {
          floorplan: doc.floorplan,
          external: doc.external,
          internal: doc.internal,
        },
      }),
    });
  } catch (error) {
    console.error("진행 상황 저장 실패:", error);
  }
}

/* 진행률 계산 + DB 반영 */
async function updateProgressEverywhere(inspectionId: string, doc: ProgressDoc) {
  const all = [...doc.external, ...doc.internal];
  const total = 1 + all.length; // 1 = 평면도
  const done = (doc.floorplan ? 1 : 0) + all.filter(i => i.checked).length;
  const pct = Math.round((done / total) * 100);

  // DB에 진행률 저장
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${apiUrl}/api/admin/inspections/${inspectionId}/save-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        progress: pct,
      }),
    });
  } catch (error) {
    console.error("진행률 저장 실패:", error);
  }
}

/* ───────────── 페이지 ───────────── */
import React from "react";

type Props = { params: Promise<{ inspectionId: string }> };

export default function ProgressPage({ params }: Props) {
  const { inspectionId } = React.use(params);
  const router = useRouter();

  const [header, setHeader] = useState<{ title: string; address: string } | null>(null);
  const [doc, setDoc] = useState<ProgressDoc | null>(null);
  const isLoading = doc === null;

  // 헤더(제목/주소)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const active = await repo.getActive();
        const me = active.find((x) => x.id === inspectionId);
        if (alive) setHeader({ title: me?.title ?? "임장 진행", address: me?.address ?? "" });
      } catch {
        if (alive) setHeader({ title: "임장 진행", address: "" });
      }
    })();
    return () => { alive = false; };
  }, [inspectionId]);

  // 문서 로드
  useEffect(() => {
    const load = async () => {
      const loaded = await loadDoc(inspectionId);
      setDoc(loaded);
    };
    load();
  }, [inspectionId]);

  // 진행률 반영
  useEffect(() => {
    if (!doc) return;
    updateProgressEverywhere(inspectionId, doc);
  }, [inspectionId, doc]);

  const totalChecked = useMemo(
    () => (doc ? [...doc.external, ...doc.internal].filter((i) => i.checked).length : 0),
    [doc]
  );

  /* 체크리스트 조작 */
  const toggleCheck = (section: "external" | "internal", id: string) =>
    setDoc((d) => {
      if (!d) return d;
      const next = { ...d, [section]: d[section].map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)) };
      saveDoc(inspectionId, next);
      return next;
    });

  const setMemo = (section: "external" | "internal", id: string, memo: string) =>
    setDoc((d) => {
      if (!d) return d;
      const next = { ...d, [section]: d[section].map((it) => (it.id === id ? { ...it, memo } : it)) };
      saveDoc(inspectionId, next);
      return next;
    });

  const addPhoto = async (section: "external" | "internal", id: string, file: File) => {
    const url = await fileToDataURL(file);
    setDoc((d) => {
      if (!d) return d;
      const next = {
        ...d,
        [section]: d[section].map((it) =>
          it.id === id ? { ...it, photos: [...it.photos, url].slice(0, 3) } : it
        ),
      };
      saveDoc(inspectionId, next);
      return next;
    });
  };

  const removePhoto = (section: "external" | "internal", id: string, idx: number) =>
    setDoc((d) => {
      if (!d) return d;
      const next = {
        ...d,
        [section]: d[section].map((it) =>
          it.id === id ? { ...it, photos: it.photos.filter((_, i) => i !== idx) } : it
        ),
      };
      saveDoc(inspectionId, next);
      return next;
    });

  /* 액션 */
  const saveDraft = async () => {
    if (!doc) return;
    saveDoc(inspectionId, doc);
    await updateProgressEverywhere(inspectionId, doc);
    alert("임시저장 되었어요.");
  };

  const submitReport = async () => {
    if (!doc) return;
    // 현재 진행 상황 저장
    saveDoc(inspectionId, doc);
    await updateProgressEverywhere(inspectionId, doc);
    // 보고서 작성 페이지로 이동
    router.push(`/admin/inspections/report/${inspectionId}`);
  };

  return (
    <MobileLayout showBottomNav={false}>
      <Wrap>
        <Header>
          <BackButton onClick={() => router.back()}>‹</BackButton>
          <H1>{header?.address || header?.title || "진행중 임장"}</H1>
          <Spacer />
        </Header>

      {isLoading ? (
        <Empty>불러오는 중…</Empty>
      ) : (
        <>
          {/* 평면도 */}
          <SectionTitle>평면도</SectionTitle>
          <Card>
            {!doc!.floorplan ? (
              <FloorEmpty>
                <p>평면도 정보가 없습니다.</p>
                {/* 업로드 제거, 별도 페이지로 이동만 */}
                <PrimaryLink href={`/admin/inspections/floorplan/${encodeURIComponent(inspectionId)}`}>
                  평면도 그리기
                </PrimaryLink>
              </FloorEmpty>
            ) : (
              <FloorPreview>
                <img src={doc!.floorplan!} alt="floorplan" />
                <Row gap={8} style={{ marginTop: 8 }}>
                  <Ghost
                    onClick={() =>
                      setDoc((d) => {
                        if (!d) return d;
                        const next = { ...d, floorplan: null };
                        saveDoc(inspectionId, next);
                        return next;
                      })
                    }
                  >
                    제거
                  </Ghost>
                  <PrimaryLink href={`/admin/inspections/floorplan/${encodeURIComponent(inspectionId)}`}>
                    다시 그리기
                  </PrimaryLink>
                </Row>
              </FloorPreview>
            )}
          </Card>

          {/* 매물 체크리스트 */}
          <SectionTitle>매물 체크리스트</SectionTitle>

          <SubTitle>외부</SubTitle>
          <Card>
            {doc!.external.map((it) => (
              <CheckBlock key={it.id}>
                <CheckHead>
                  <CheckBox
                    type="checkbox"
                    checked={it.checked}
                    onChange={() => toggleCheck("external", it.id)}
                  />
                  <CheckLabel>{it.label}</CheckLabel>
                </CheckHead>

                <PhotoRow>
                  {it.photos.map((p, idx) => (
                    <Photo key={idx}>
                      <img src={p} alt="" />
                      <Remove onClick={() => removePhoto("external", it.id, idx)}>✕</Remove>
                    </Photo>
                  ))}
                  {it.photos.length < 3 && (
                    <PhotoAdd>
                      <span>＋</span>
                      <HiddenInput
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) addPhoto("external", it.id, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </PhotoAdd>
                  )}
                </PhotoRow>

                <Memo
                  placeholder="특이사항이나 메모를 입력해주세요."
                  value={it.memo}
                  onChange={(e) => setMemo("external", it.id, e.target.value)}
                />
              </CheckBlock>
            ))}
          </Card>

          <SubTitle>내부</SubTitle>
          <Card>
            {doc!.internal.map((it) => (
              <CheckBlock key={it.id}>
                <CheckHead>
                  <CheckBox
                    type="checkbox"
                    checked={it.checked}
                    onChange={() => toggleCheck("internal", it.id)}
                  />
                  <CheckLabel>{it.label}</CheckLabel>
                </CheckHead>

                <PhotoRow>
                  {it.photos.map((p, idx) => (
                    <Photo key={idx}>
                      <img src={p} alt="" />
                      <Remove onClick={() => removePhoto("internal", it.id, idx)}>✕</Remove>
                    </Photo>
                  ))}
                  {it.photos.length < 3 && (
                    <PhotoAdd>
                      <span>＋</span>
                      <HiddenInput
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) addPhoto("internal", it.id, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </PhotoAdd>
                  )}
                </PhotoRow>

                <Memo
                  placeholder="특이사항이나 메모를 입력해주세요."
                  value={it.memo}
                  onChange={(e) => setMemo("internal", it.id, e.target.value)}
                />
              </CheckBlock>
            ))}
          </Card>

          <SpacerBottom />
        </>
      )}

      {/* 하단 고정 액션 */}
      {!isLoading && (
        <BottomBar>
          <BtnGhost onClick={saveDraft}>임시저장</BtnGhost>
          <BtnPrimary onClick={submitReport}>보고서 확정</BtnPrimary>
        </BottomBar>
      )}
      </Wrap>
    </MobileLayout>
  );
}

/* ───────────── utils ───────────── */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("file read error"));
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(file);
  });
}

/* ───────────── styled ───────────── */
const Wrap = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 80px;
`;

const Header = styled.div`
  display:flex; align-items:center; gap:8px; padding:12px;
  background: white;
  border-bottom: 1px solid #eee;
`;
const BackButton = styled.button`
  font-size:20px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
`;
const H1 = styled.h1`flex:1; text-align:center; font-size:16px; margin:0;`;
const Spacer = styled.div`width:20px;`;

const SectionTitle = styled.h2`
  font-size:16px; margin:16px 12px 8px;
`;
const SubTitle = styled.h3`
  font-size:14px; margin:12px 12px 6px; color:#333;
`;

const Card = styled.div`
  background:#fff; border:1px solid #eee; border-radius:12px;
  padding:12px; margin:0 12px 10px;
`;

const FloorEmpty = styled.div`
  height:180px; border:2px dashed #e1e1e8; border-radius:12px;
  display:flex; align-items:center; justify-content:center; flex-direction:column; gap:12px;
  color:#888;
  & > p { margin:0; }
`;
const FloorPreview = styled.div`
  display:flex; flex-direction:column; align-items:flex-start;
  img { width:100%; max-height:220px; object-fit:contain; border-radius:8px; border:1px solid #eee; }
`;

const HiddenInput = styled.input`
  position:absolute; opacity:0; width:0; height:0; pointer-events:none;
`;

const CheckBlock = styled.div`
  & + & { border-top:1px dashed #eee; margin-top:10px; padding-top:10px; }
`;
const CheckHead = styled.div`display:flex; align-items:center; gap:8px;`;
const CheckBox = styled.input`
  width:20px; height:20px;
`;
const CheckLabel = styled.div`font-weight:700;`;

const PhotoRow = styled.div`display:flex; gap:8px; margin-top:10px;`;
const Photo = styled.div`
  position:relative; width:76px; height:56px; border:1px dashed #ddd; border-radius:10px; overflow:hidden;
  img { width:100%; height:100%; object-fit:cover; display:block; }
`;
const Remove = styled.button`
  position:absolute; right:4px; top:4px; border:none; background:#0008; color:#fff; border-radius:999px; width:18px; height:18px; font-size:12px; line-height:18px;
`;
const PhotoAdd = styled.label`
  width:76px; height:56px; border:2px dashed #d7d1ee; border-radius:10px;
  display:flex; align-items:center; justify-content:center; color:#7b3fe4; cursor:pointer; position:relative;
  span { font-size:22px; }
`;

const Memo = styled.textarea`
  width:100%; margin-top:8px; border:1px solid #eee; border-radius:10px; padding:10px; resize:vertical; background:#fafafa;
`;

const Row = styled.div<{ gap?: number }>`
  display:flex; gap:${(p) => p.gap ?? 6}px;
`;

const Empty = styled.div`padding:24px; text-align:center; color:#888;`;

const BottomBar = styled.div`
  position:fixed; left:0; right:0; bottom:0; padding:10px 12px;
  background:#fff; border-top:1px solid #eee; display:flex; gap:8px;
`;
const Ghost = styled.button`
  padding:8px 12px; border:1px solid #ccc; border-radius:12px; background:#fff;
`;
const Primary = styled.button`
  padding:8px 12px; border:none; border-radius:12px; background:#7b3fe4; color:#fff; font-weight:700;
`;
const PrimaryLink = styled(Link)`
  display:inline-block; padding:8px 12px; border-radius:12px; background:#7b3fe4; color:#fff; font-weight:700; text-decoration:none;
`;
const BtnGhost = styled(Ghost)`flex:1; height:44px;`;
const BtnPrimary = styled(Primary)`flex:1; height:44px;`;

const SpacerBottom = styled.div`height:84px;`;
