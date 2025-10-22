// src/lib/data/listings.ts

// ========== 1) 백엔드 원본 타입(+ 가격 필드 추가) ==========
export type ApiListing = {
  listing_type: "전세" | "월세" | "매매";
  house_type?: string;        // 주택 종류
  sale_price?: number;        // 매매가(원)
  jeonse_price?: number;      // 전세보증금(원)
  monthly_deposit?: number;   // 월세 보증금(원)
  monthly_rent?: number;      // 월세(원)

  address: string;
  maintenance_fee_monthly: number;
  parking_info: string;
  exclusive_area_sqm: number;
  exclusive_area_pyeong: number;
  rooms: number;
  bathrooms: number;
  floor: string;
  built_year: number;
  supply_area_sqm: number;
  orientation: "동" | "서" | "남" | "북" | "남동" | "남서" | "북동" | "북서";
  household_total: number;
  parking_total: number;
  entrance_type: "복도식" | "계단식" | "혼합" | "기타";
  move_in_date: string; // "즉시" 허용 또는 "YYYY-MM-DD"
  building_use: string;
  approval_date: string; // YYYY-MM-DD
  first_registered_at: string; // YYYY-MM-DD
  contract_term_months: number;
  renewable: boolean;
  public_transport_score: number; // 0-10
  line_variety_score: number;     // 0-5
  bus_stops: Array<{
    stop_name: string;
    distance_m: number | null;
    bus_numbers: string[];
  }>;
  stations: Array<{
    station_name: string;
    line_names: string[];
    distance_m: number | null;
  }>;
  // 선택: 이미지/요약/QA
  images?: string[];
  amenity_summary?: string;
  /** 아래 두 개는 더 이상 사용하지 않지만, 서버 호환을 위해 타입은 남겨둠 */
  apt_summary?: string;
  life_summary?: string;
  qa?: Array<{ id: string; question: string; answer?: string }>;
};


// ========== 2) 화면 전용 뷰모델 (가격/층/년도 가공 포함) ==========
export type ListingDetailVM = {
  heroImages: string[];
  leaseType: "전세" | "월세" | "매매";
  /** 상단에 붙는 가격 문자열 (만원/억 표기: 전세=보증금, 매매=매매가, 월세=보증금/월세) */
  priceText: string;
  address: string;
  adminFeeText: string | null; // "12만원" 등
  parking: string | null;      // "세대당 1대 가능..." 등
  orientation: string | null;  // "남동"
  houseType?: string;          // 주택 종류
  specs: {
    exclusiveAreaText: string; // "84.97㎡ (25.72평)"
    supplyAreaText: string;    // "109.23㎡"
    areaBothText: string;      // "84.97㎡ / 109.23㎡"
    rooms: number;
    baths: number;
    roomsBathsText: string;    // "3룸 2욕실"
    floor: string;             // "15층/25층" 또는 원문 ("지하1층" 등)
    builtYear: number;         // 2018
    builtYearText: string;     // "2018년"
  };
  env: {
    traffic: {
      scores: { convenience: number; diversity: number };
      busStops: Array<{ name: string; distance: string | null; lines: string[] }>;
      subways: Array<{ name: string; distance: string | null; lines: string[] }>;
    };
    amenity: { summary: string };
  };
  householdTotalText: string;          // "512세대"
  parkingTotalText: string;            // "600대"
  entranceType: string | null;         // "계단식" 등
  moveInText: string;                  // "바로 입주 가능" / "YYYY.MM.DD"
  buildingUseText: string | null;      // "공동주택(아파트)"
  approvalDateText: string | null;     // "YYYY.MM.DD"
  firstRegisteredText: string | null;  // "YYYY.MM.DD"

  apt: { summary: string | null };
  life: { summary: string | null };
  qa: Array<{ id: string; question: string; answer?: string }>;
};

// ========== 3) 어댑터 & 유틸: ApiListing → ListingDetailVM ==========
const toCurrencyShort = (n: number) => {
  if (n <= 0) return "0원";
  if (n >= 10_000) return `${Math.round(n / 10_000)}만원`;
  return `${n.toLocaleString()}원`;
};

const mToText = (m: number | null) => (m == null ? null : `${m}m`);

const formatDateDot = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  if (iso === "즉시") return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[1]}.${m[2]}.${m[3]}`;
};

const formatMoveIn = (raw: string): string => {
  if (!raw) return "-";
  if (raw === "즉시") return "바로 입주 가능";
  const d = formatDateDot(raw);
  return d ?? raw;
};

const toAreaText = (sqm: number | null | undefined): string => {
  if (sqm == null || !Number.isFinite(sqm)) return "-";
  return `${sqm % 1 === 0 ? sqm.toFixed(0) : sqm.toFixed(2)}㎡`;
};

const formatPrice = (won: number): string => {
  if (!Number.isFinite(won) || won <= 0) return "-";
  if (won < 100_000_000) return (won / 10_000).toLocaleString();
  const man = Math.floor(won / 10_000);
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  return rest > 0 ? `${eok}억 ${rest.toLocaleString()}` : `${eok}억`;
};

function makePriceText(api: ApiListing): string {
  switch (api.listing_type) {
    case "전세":
      return api.jeonse_price != null ? formatPrice(api.jeonse_price) : "-";
    case "월세":
      if (api.monthly_deposit == null || api.monthly_rent == null) return "-";
      return `${formatPrice(api.monthly_deposit)}/${formatPrice(api.monthly_rent)}`;
    case "매매":
      return api.sale_price != null ? formatPrice(api.sale_price) : "-";
  }
  return "-";
}

const formatFloorText = (raw: string): string => {
  const s = (raw || "").trim();
  if (!s) return s;
  if (s.includes("층") || s.includes("지하") || s.includes("반지하") || s.includes("옥탑")) return s;
  const mm = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (mm) {
    const cur = Number(mm[1]);
    const tot = Number(mm[2]);
    if (!Number.isNaN(cur) && !Number.isNaN(tot)) return `${cur}층/${tot}층`;
  }
  const m1 = s.match(/^(\d+)$/);
  if (m1) return `${m1[1]}층`;
  return s;
};

const formatBuiltYearText = (y: number): string => {
  if (Number.isFinite(y) && y > 0) return `${y}년`;
  return `${y}`;
};

export function toVM(api: ApiListing): ListingDetailVM {
  // API 응답의 DecimalField는 문자열로 올 수 있으므로 숫자로 변환
  const exclusiveAreaSqm = api.exclusive_area_sqm != null
    ? (typeof api.exclusive_area_sqm === 'string' 
        ? parseFloat(api.exclusive_area_sqm) 
        : api.exclusive_area_sqm)
    : 0;
  const exclusiveAreaPyeong = api.exclusive_area_pyeong != null
    ? (typeof api.exclusive_area_pyeong === 'string'
        ? parseFloat(api.exclusive_area_pyeong)
        : api.exclusive_area_pyeong)
    : 0;
  const supplyAreaSqm = api.supply_area_sqm != null
    ? (typeof api.supply_area_sqm === 'string'
        ? parseFloat(api.supply_area_sqm)
        : api.supply_area_sqm)
    : null;

  const exclusiveAreaText = exclusiveAreaSqm > 0 && exclusiveAreaPyeong > 0
    ? `${exclusiveAreaSqm.toFixed(2)}㎡ (${exclusiveAreaPyeong.toFixed(2)}평)`
    : "-";
  const supplyAreaText = toAreaText(supplyAreaSqm);

  return {
    heroImages: api.images && api.images.length > 0 ? api.images : [],
    leaseType: api.listing_type,
    priceText: makePriceText(api),
    address: api.address,
    adminFeeText: toCurrencyShort(api.maintenance_fee_monthly),
    parking: api.parking_info || null,
    orientation: api.orientation || null,
    houseType: api.house_type,
    specs: {
      exclusiveAreaText,
      supplyAreaText,
      areaBothText: exclusiveAreaSqm > 0 
        ? `${toAreaText(exclusiveAreaSqm)} / ${supplyAreaText}`
        : supplyAreaText !== "-" ? supplyAreaText : "-",
      rooms: api.rooms ?? 0,
      baths: api.bathrooms ?? 0,
      roomsBathsText: `${api.rooms ?? 0}룸 ${api.bathrooms ?? 0}욕실`,
      floor: formatFloorText(api.floor),
      builtYear: api.built_year ?? 0,
      builtYearText: formatBuiltYearText(api.built_year ?? 0),
    },
    env: {
      traffic: {
        scores: {
          convenience: api.public_transport_score,
          diversity: api.line_variety_score,
        },
        busStops: api.bus_stops.map((b) => ({
          name: b.stop_name,
          distance: mToText(b.distance_m),
          lines: b.bus_numbers ?? [],
        })),
        subways: api.stations.map((s) => ({
          name: s.station_name,
          distance: mToText(s.distance_m),
          lines: s.line_names ?? [],
        })),
      },
      amenity: { summary: api.amenity_summary ?? "수집된 편의시설 요약이 아직 없어요." },
    },
    householdTotalText: api.household_total != null ? `${api.household_total}세대` : "-",
    parkingTotalText: api.parking_total != null ? `${api.parking_total}대` : "-",
    entranceType: api.entrance_type ?? null,
    moveInText: formatMoveIn(api.move_in_date),
    buildingUseText: api.building_use ?? null,
    approvalDateText: formatDateDot(api.approval_date),
    firstRegisteredText: formatDateDot(api.first_registered_at),

    /** 단지/생활은 실제 데이터 대신 플레이스홀더 고정 */
    apt: { summary: "내용이 아직 없어요." },
    life: { summary: "내용이 아직 없어요." },

    qa: api.qa ?? [],
  };
}

// ========== 4) API 타입 정의 ==========
export type ListingListItem = {
  id: string;
  title: string;
  price: string;
  addr: string;
  lat: number;
  lng: number;
  img: string | null;
  type?: string; // 주택 종류 (apartment, officetel, villa, oneroom, tworoom 등)
};

export type ListingsResponse = {
  listings: ListingListItem[];
};

// ========== 5) 매물 목록 조회 API ==========
export async function getListings(bounds?: string): Promise<ListingListItem[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = bounds 
      ? `${apiUrl}/api/listings/?bounds=${bounds}`
      : `${apiUrl}/api/listings/`;
    
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
    
    const json: ListingsResponse = await res.json();
    return json.listings;
  } catch (error) {
    console.error('Failed to fetch listings from API:', error);
    // 폴백: 빈 배열 반환
    return [];
  }
}

// ========== 6) 매물 상세 조회 API ==========
export async function getListingDetailVM(id: string): Promise<ListingDetailVM | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/listings/${id}/`, { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    const json: ApiListing = await res.json();
    return toVM(json);
  } catch (error) {
    console.error('Failed to fetch listing detail from API:', error);
    // 폴백(mock) — 개발 편의용
    const mock: ApiListing = {
      listing_type: "전세",
      jeonse_price: 320_000_000,

      address: "서울특별시 강남구 테헤란로 123",
      maintenance_fee_monthly: 120000,
      parking_info: "주차 1대",
      exclusive_area_sqm: 84.97,
      exclusive_area_pyeong: 25.72,
      rooms: 3,
      bathrooms: 2,
      floor: "12/25",
      built_year: 2008,
      supply_area_sqm: 109.23,
      orientation: "남동",
      household_total: 512,
      parking_total: 600,
      entrance_type: "계단식",
      move_in_date: "즉시",
      building_use: "공동주택(아파트)",
      approval_date: "2008-09-15",
      first_registered_at: "2025-10-03",
      contract_term_months: 24,
      renewable: true,
      public_transport_score: 8,
      line_variety_score: 4,
      bus_stops: [
        { stop_name: "선릉역.르네상스호텔", distance_m: 180, bus_numbers: ["146", "341", "360", "N13", "광역M711"] },
        { stop_name: "○○사거리", distance_m: null, bus_numbers: ["3412", "강남08"] }
      ],
      stations: [
        { station_name: "선릉역", line_names: ["2호선", "수인분당선"], distance_m: 420 },
        { station_name: "역삼역", line_names: ["2호선"], distance_m: null }
      ],
      images: ["/images/house1.jpg"],
      //  apt_summary / life_summary 제거 (이제 미사용)
      amenity_summary: "도보 5분 내 편의점/카페/식당 밀집, 대형마트 차량 7분.",
      qa: [],
    };
    return toVM(mock);
  }
}
