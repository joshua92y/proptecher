"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { repo, type RequestCard } from "@/lib/repos/inspections";

type Notice = { id: string; title: string; date: string; isNew?: boolean; href?: string; };

const NOTICES: Notice[] = [
  { id: "n1", title: "12개월 평가 수수료 인상 안내", date: "2025.09.27", isNew: true },
  { id: "n2", title: "연말 정산 서류 제출 기한 안내", date: "2025.09.27" },
  { id: "n3", title: "불편한 업데이트 및 새로운 기능 소개", date: "2025.09.27" },
  { id: "n4", title: "평가사 교육 프로그램 신청 안내", date: "2025.09.27" },
];

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<RequestCard[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const [reqs, active] = await Promise.all([repo.getRequests(), repo.getActive()]);
      if (!alive) return;
      setRequests(reqs);
      setActiveCount(active.length);
    };
    sync();
    const off = repo.subscribe(sync);
    return () => { alive = false; off?.(); };
  }, []);

  const requestCount = requests.length;

  return (
    <>
      {/* 프로필 카드 */}
      <Card>
        <Row>
          <Avatar />
          <Col>
            <Name>홍길동</Name>
            <MetaRow><Star>★</Star><span>4.8</span><Dot>·</Dot><Small>127건 완료</Small></MetaRow>
            <Small>인천시 동남구  ·  경력 3년</Small>
          </Col>
        </Row>
      </Card>

      {/* 매물 임장 요청 */}
      <SectionHeader>
        <SectionTitle>매물 임장 요청</SectionTitle>
        <Badge>{requestCount}</Badge>
      </SectionHeader>

      <List>
        {requestCount === 0 ? (
          <Empty>현재 접수된 임장 요청이 없습니다.</Empty>
        ) : (
          requests.map((r) => (
            <Item key={r.id} href={`/admin/inspections/${encodeURIComponent(r.id)}`}>
              <Thumb>{r.img && <Image src={r.img} alt="" fill style={{ objectFit: "cover" }} />}</Thumb>
              <ItemBody>
                <ItemTitle>{r.title}</ItemTitle>
                <Line><Pin>📍</Pin><span>{r.address}</span></Line>
                <Price>{r.priceText}</Price>
              </ItemBody>
            </Item>
          ))
        )}
      </List>

      {/* 진행중인 임장 */}
      <SectionHeader style={{ marginTop: 20 }}>
        <SectionTitle>진행중인 임장</SectionTitle>
        <Badge>{activeCount}</Badge>
      </SectionHeader>
      <PrimaryButton as={Link} href="/admin/inspections/active">진행중인 임장 보기</PrimaryButton>

      {/* 공지사항 */}
      <SectionHeader style={{ marginTop: 24 }}>
        <SectionTitle>공지사항</SectionTitle>
      </SectionHeader>
      <Card>
        {NOTICES.map((n, i) => (
          <NoticeRow key={n.id} href={n.href ?? "#"}>
            <NoticeTitle>{n.title}{n.isNew && <NoticeNew>N</NoticeNew>}</NoticeTitle>
            <NoticeMeta>{n.date}</NoticeMeta>
            <Chevron>›</Chevron>
            {i < NOTICES.length - 1 && <Divider />}
          </NoticeRow>
        ))}
        <AllNotice href="#">전체 공지사항 보기</AllNotice>
      </Card>
    </>
  );
}

/* styled */
const Card = styled.div`background:#fff;border:1px solid #eee;border-radius:12px;padding:12px;margin:12px;`;
const Row = styled.div`display:flex;gap:12px;align-items:center;`;
const Col = styled.div`display:flex;flex-direction:column;gap:4px;`;
const Avatar = styled.div`width:42px;height:42px;border-radius:50%;background:#ddd;`;
const Name = styled.div`font-weight:700;`;
const MetaRow = styled.div`display:flex;align-items:center;gap:6px;color:#666;`;
const Star = styled.span`color:#f6b100;`;
const Dot = styled.span`color:#aaa;`;
const Small = styled.span`font-size:12px;color:#777;`;

const SectionHeader = styled.div`display:flex;align-items:center;justify-content:space-between;padding:0 12px;margin-top:12px;`;
const SectionTitle = styled.h2`font-size:14px;margin:0;`;
const Badge = styled.span`background:#eee;border-radius:999px;padding:2px 8px;font-size:12px;`;

const List = styled.div`display:flex;flex-direction:column;gap:10px;padding:0 12px;`;
const Empty = styled.div`padding:24px;color:#888;text-align:center;`;
const Item = styled(Link)`display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #eee;border-radius:12px;padding:8px 10px;`;
const Thumb = styled.div`position:relative;width:64px;height:48px;border-radius:8px;overflow:hidden;background:#f5f5f5;`;
const ItemBody = styled.div`flex:1;`;
const ItemTitle = styled.div`font-weight:700;`;
const Line = styled.div`display:flex;gap:6px;color:#666;align-items:center;`;
const Pin = styled.span``;
const Price = styled.div`font-weight:700;margin-top:4px;`;
const PrimaryButton = styled.a`display:block;margin:12px;background:#7b3fe4;color:#fff;text-align:center;padding:12px;border-radius:12px;`;
const NoticeRow = styled.a`position:relative;display:flex;align-items:center;gap:10px;padding:10px 4px;color:inherit;text-decoration:none;`;
const NoticeTitle = styled.div`flex:1;`;
const NoticeNew = styled.span`margin-left:6px;background:#ff4d4f;color:#fff;border-radius:999px;padding:2px 6px;font-size:10px;`;
const NoticeMeta = styled.div`color:#888;font-size:12px;`;
const Chevron = styled.div`color:#bbb;`;
const Divider = styled.div`position:absolute;left:0;right:0;bottom:0;height:1px;background:#eee;`;
const AllNotice = styled.a`display:block;text-align:center;padding:10px 0;margin-top:4px;color:#7b3fe4;`;
