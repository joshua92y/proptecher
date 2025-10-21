import { NextRequest, NextResponse } from "next/server";
import type { InspectionItem, InspectionStatus } from "../route";
import { _MEM as MEMORY } from "../route";

/** 상세 조회 */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const item = MEMORY.find((x) => x.id === params.id) ?? null;
  return NextResponse.json({ item });
}

/** 상태 변경: PATCH { action: "accept" | "reject" | "done" } */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const action = body.action as "accept" | "reject" | "done";

  const idx = MEMORY.findIndex((x) => x.id === params.id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const target = MEMORY[idx];

  if (action === "accept") {
    target.status = "active";
    target.acceptedAt = new Date().toISOString();
  } else if (action === "reject") {
    target.status = "rejected";
  } else if (action === "done") {
    target.status = "done";
  } else {
    return NextResponse.json({ ok: false, error: "bad action" }, { status: 400 });
  }

  MEMORY[idx] = target;
  return NextResponse.json({ ok: true, item: target });
}
