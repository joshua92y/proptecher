"use client";

import styled from "styled-components";
import type { ListingDetailVM } from "@/lib/data/listings";

type Props = {
  open: boolean;
  onClose: () => void;
  data: ListingDetailVM;
};

export default function ListingInfoModal({ open, onClose, data }: Props) {
  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>매물 기본 정보</Title>
          <Close onClick={onClose}>×</Close>
        </Header>
        <Body>
          <Card>
            <Table>
              <tbody>
                <Row label="방/욕실" value={data.specs.roomsBathsText} />
                <Row label="해당층/건물층" value={data.specs.floor} />
                <Row label="전용/공급면적" value={data.specs.areaBothText} />
                <Row label="방향" value={data.orientation ?? "-"} />
                <Row label="총 세대수" value={data.householdTotalText} />
                <Row label="총 주차대수" value={data.parkingTotalText} />
                <Row label="현관유형" value={data.entranceType ?? "-"} />
                <Row label="입주가능일" value={data.moveInText} />
                <Row label="건축물용도" value={data.buildingUseText ?? "-"} />
                <Row label="사용승인일" value={data.approvalDateText ?? "-"} />
                <Row label="최초등록일" value={data.firstRegisteredText ?? "-"} />
              </tbody>
            </Table>
          </Card>
        </Body>
      </Dialog>
    </Overlay>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Tr>
      <CellLabel>{label}</CellLabel>
      <CellValue>{value}</CellValue>
    </Tr>
  );
}

/* ---------- styled ---------- */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const Dialog = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 92%;
  max-width: 480px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,.15);
`;
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #eee;
`;
const Title = styled.h3`
  margin: 0;
  font-size: 18px;
`;
const Close = styled.button`
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
`;
const Body = styled.div`
  padding: 12px 16px 16px;
`;
const Card = styled.div`
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Tr = styled.tr`
  &:not(:last-child) td { border-bottom: 1px solid #f1f1f1; }
`;
const CellLabel = styled.td`
  width: 120px;
  padding: 12px 10px;
  color: #666;
  vertical-align: middle;
  background: #fafafa;
`;
const CellValue = styled.td`
  padding: 12px 10px;
  font-weight: 600;
  color: #111;
  background: #fff;
`;
