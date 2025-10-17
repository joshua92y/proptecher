import { NextRequest, NextResponse } from "next/server";
import { getListingDetailVM } from "@/lib/data/listings";

export type InspectionStatus = "requested" | "active" | "rejected" | "done";

export type InspectionItem = {
  id: string;
  listingId: string;
  status: InspectionStatus;
  title: string;
  address: string;
  priceText: string;
  imageUrl: string | null;
  createdAt: string;
  acceptedAt?: string;
};

// 개발용 메모리 저장소
const MEMORY: InspectionItem[] = [];

/** 목록 조회
 *  - /api/inspections?status=requested
 *  - /api/inspections?status=active
 *  - /api/inspections?listingId=LISTING_ID (소비자 화면에서 상태 확인용)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const byListing = sp.get("listingId");
  const byStatus = sp.get("status") as InspectionStatus | null;

  if (byListing) {
    const item = MEMORY.find((x) => x.listingId === byListing && x.status !== "done" && x.status !== "rejected");
    return NextResponse.json({ item: item ?? null });
  }
  if (byStatus) {
    return NextResponse.json({ items: MEMORY.filter((x) => x.status === byStatus) });
  }
  return NextResponse.json({ items: MEMORY });
}

/** 생성: { listingId } (필요시 title/address/priceText/imageUrl 같이 보낼 수 있음) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const listingId: string | undefined = body.listingId;
    if (!listingId) return NextResponse.json({ ok: false, error: "listingId required" }, { status: 400 });

    // 이미 접수된 요청이 있으면 그대로 반환(중복 방지)
    const existing = MEMORY.find((x) => x.listingId === listingId && (x.status === "requested" || x.status === "active"));
    if (existing) return NextResponse.json({ ok: true, item: existing });

    let { title, address, priceText, imageUrl } = body;

    if (!title || !address || !priceText || !imageUrl) {
      const vm = await getListingDetailVM(listingId);
      if (!vm) return NextResponse.json({ ok: false, error: "listing not found" }, { status: 404 });
      const onlySqm = vm.specs.exclusiveAreaText.split("㎡")[0];
      const rounded = Math.round(parseFloat(onlySqm) || 0);
      title = title ?? `${vm.leaseType} (전용 ${rounded}㎡)`;
      address = address ?? vm.address;
      priceText = priceText ?? `${vm.priceText}원`;
      imageUrl = imageUrl ?? vm.heroImages[0] ?? "";
    }

    const item: InspectionItem = {
      id: `req_${Date.now()}`,
      listingId,
      status: "requested",
      title,
      address,
      priceText,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
    };
    MEMORY.unshift(item);
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
}

// --- 아래 export는 테스트/다른 라우트에서 접근 시 필요할 수 있으니 유지 ---
export const _MEM = MEMORY; // (선택) 개발용
