// src/lib/types/listing.ts
export type LeaseType = "월세" | "전세" | "매매";

/** 거래 유형별로 필요한 가격 필드만 갖도록 만든 판별(Discriminated) 유니온 */
export type LeasePricing =
  | { type: "월세"; deposit: number; rent: number; priceText: string } // 예: 보증금 2,000 / 월세 90
  | { type: "전세"; jeonse: number;          priceText: string }       // 예: 전세 2.55억
  | { type: "매매";  sale: number;            priceText: string };      // 예: 매매 5.5억
// ⚠️ number 단위는 원(KRW)로 가정. 화면 표시는 priceText 사용.

export interface ListingCore {
  id: string;
  title: string;
  images: string[];                 // 예: ["/images/house1.jpg"]
  lease: LeasePricing;              // 위 유니온 타입 사용
  address: string;
  adminFeeText?: string;            // 예: "월 10만원"
  parkingText?: string;             // 예: "주차 1대"
  specs: {
    areaText: string;               // "84㎡ (25평)"
    roomsText: string;              // "2룸"
    bathsText: string;              // "1욕실"
    floorText: string;              // "1층/5층"
    builtYearText: string;          // "2018년"
  };
}

/** 주거환경(필수): 교통 + 편의시설/상권 */
export interface EnvInfo {
  traffic: {
    scores: { convenience10: number; diversity5: number }; // 10점/5점
    busStops: { name: string; distanceText: string; lines?: string[] }[]; // 버스 번호 배열 포함
    subways:  { name: string; line?: string; distanceText: string }[];    // 역/노선/거리
  };
  amenity: { summary: string };     // 편의시설/상권 요약
}

/** 생활 이야기(필수) */
export interface LifeInfo { summary: string; }

/** 최종: 소비자 상세에 쓰는 한 개 매물의 전체 데이터 */
export interface ListingDetail extends ListingCore {
  env: EnvInfo;   // 필수
  life: LifeInfo; // 필수
}
