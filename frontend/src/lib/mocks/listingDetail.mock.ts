// src/lib/mocks/listingDetail.mock.ts
import type { ListingDetailVM } from "@/lib/data/listings";

export const MOCK_LISTING_DETAIL: ListingDetailVM = {
  heroImages: ["/images/house1.jpg"],
  leaseType: "월세",
  address: "전북 무주군 무주읍 적천로 343",
  adminFeeText: "10만원",
  parking: "주차 1대",
  orientation: "남향",

  specs: {
    exclusiveAreaText: "84㎡ (25평)",
    rooms: 2,
    baths: 1,
    floor: "1/5",
    builtYear: 2018,
  },

  env: {
    traffic: {
      scores: {
        convenience: 6,   // /10
        diversity: 3,     // /5
      },
      busStops: [
        {
          name: "가까운역 버스정류장",
          distance: "20m",           // distance_m → 변환된 텍스트
          lines: ["25", "1", "302"],
        },
      ],
      subways: [
        {
          name: "가까운역",
          distance: "20m",
          lines: ["4호선"],
        },
        {
          name: "가까운역",
          distance: "20m",
          lines: ["7호선"],
        },
      ],
    },
    amenity: {
      summary: "근처에 대형마트, 카페, 음식점 밀집 구역",
    },
  },

  apt: { summary: "총 100세대, 주차 120대, 2018년 승인" },
  life: { summary: "소음 적고 치안 양호, 초등학교 도보 7분" },
  qa: [],
};
