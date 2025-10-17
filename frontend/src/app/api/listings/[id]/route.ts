import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_BASE_URL; // 예: http://localhost:4000

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 실제 백엔드로 프록시
  if (BACKEND) {
    const r = await fetch(`${BACKEND}/listings/${id}`, { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json({ error: "Not found" }, { status: r.status });
    }
    const json = await r.json();
    return NextResponse.json(json);
  }

  // 백엔드 미설정 시: 의도적으로 404 → 클라이언트에서 목업 폴백
  return NextResponse.json(
    { error: "Backend not configured" },
    { status: 404 }
  );
}
