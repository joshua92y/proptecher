// components/consumer/modals/RequestInspectionModal.tsx
"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: { preferred_date: string; contact_phone: string; request_note?: string }) => void;
};

export default function RequestInspectionModal({ open, onClose, onSubmit }: Props) {
  const [preferredDate, setPreferredDate] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  // mount/animation state
  const [visible, setVisible] = useState(open);
  const [state, setState] = useState<"in" | "out">("out");

  useEffect(() => {
    if (open) {
      setVisible(true);
      // next frame to allow transition
      requestAnimationFrame(() => setState("in"));
    } else if (visible) {
      setState("out");
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <Dim onClick={onClose} data-state={state}>
      <Sheet onClick={(e) => e.stopPropagation()} data-state={state}>
        <Title>임장 요청</Title>

        <Field>
          <Label>희망 날짜</Label>
          <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
        </Field>

        <Field>
          <Label>연락처</Label>
          <Input placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>

        <Field>
          <Label>요청 사항 (선택)</Label>
          <TextArea rows={4} placeholder="원하시는 점을 적어주세요."
            value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <Row>
          <Ghost onClick={onClose}>취소</Ghost>
          <Primary
            disabled={!preferredDate || !phone}
            onClick={() => {
              onSubmit({ preferred_date: preferredDate, contact_phone: phone, request_note: note || undefined });
              onClose();
            }}>
            요청하기
          </Primary>
        </Row>
      </Sheet>
    </Dim>
  );
}

// 하단 네비게이션 바 높이를 CSS 변수로 조절 가능
const Dim = styled.div`
  position: fixed; left:0; right:0; top:0; 
  bottom: calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0));
  background: rgba(0,0,0,0.35);
  display:flex; align-items:flex-end; z-index: 4000;
  opacity: 0; transition: opacity 200ms ease;
  &[data-state="in"] { opacity: 1; }
  &[data-state="out"] { opacity: 0; }
`;
const Sheet = styled.div`
  width:100%; background:#fff; border-radius:16px 16px 0 0; padding:16px; box-shadow: 0 -8px 24px rgba(0,0,0,0.1);
  padding-bottom: 16px;
  transform: translateY(100%); opacity: 0;
  transition: transform 220ms ease, opacity 220ms ease;
  &[data-state="in"] { transform: translateY(0); opacity: 1; }
  &[data-state="out"] { transform: translateY(100%); opacity: 0; }
`;
const Title = styled.h3`margin:0 0 12px; font-size:16px;`;
const Field = styled.div`& + & { margin-top:10px; }`;
const Label = styled.div`font-size:12px; color:#666; margin-bottom:6px;`;
const Input = styled.input`width:100%; border:1px solid #ddd; border-radius:10px; padding:10px;`;
const TextArea = styled.textarea`width:100%; border:1px solid #ddd; border-radius:10px; padding:10px; resize:vertical;`;
const Row = styled.div`display:flex; gap:8px; margin-top:12px;`;
const Ghost = styled.button`flex:1; height:44px; border:1px solid #ccc; background:#fff; border-radius:12px;`;
const Primary = styled.button`flex:1; height:44px; border:none; background:#7b3fe4; color:#fff; border-radius:12px; font-weight:700;`;
