"use client";

import { use } from "react";
import styled from "styled-components";
import MobileLayout from "@/components/MobileLayout";

type Params = { params: Promise<{ id: string }> };

export default function ExplorePage({ params }: Params) {
  const { id } = use(params);

  return (
    <MobileLayout title="주변 환경" showBack={true}>
      <Wrap>
        <Hero>매물 #{id} 주변 환경</Hero>
        <Card>
          <Title>주변 환경 페이지 준비 중</Title>
          <Desc>
            교통, 편의시설, 학교, 공원 등 주변 정보를 이 곳에서 확인하실 수 있도록 준비 중이에요.
          </Desc>
        </Card>
      </Wrap>
    </MobileLayout>
  );
}

const Wrap = styled.div`
  padding: 12px;
`;

const Hero = styled.h2`
  margin: 8px 0 12px 0;
  font-size: 18px;
  font-weight: 800;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
`;

const Desc = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
`;


