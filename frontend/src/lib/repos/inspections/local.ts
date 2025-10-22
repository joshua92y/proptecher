"use client";

import type {
  InspectionsRepo,
  RequestCard,
  ActiveInspection,
  RequestDetail,
  CreateFromListingPayload,
  InspectionStatus,
  RequestId,
  ListingId,
  InspectionId,
  CancelOptions,
} from "./types";

/* ───────── storage keys & helpers ───────── */
const REQ_KEY = "inspections:requests";
const REQ_DETAIL_KEY = "inspections:requestDetails";
const ACT_KEY = "inspections:active";
const UPDATED_EVT = "inspections-updated";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const s = window.localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(UPDATED_EVT));
}

// list helpers
function getRequestsRaw(): RequestCard[] { return read<RequestCard[]>(REQ_KEY, []); }
function setRequestsRaw(v: RequestCard[]) { write(REQ_KEY, v); }

function getDetailsMap(): Record<RequestId, Partial<RequestDetail>> {
  return read<Record<RequestId, Partial<RequestDetail>>>(REQ_DETAIL_KEY, {});
}
function setDetailsMap(map: Record<RequestId, Partial<RequestDetail>>) {
  write(REQ_DETAIL_KEY, map);
}

function getActiveRaw(): ActiveInspection[] { return read<ActiveInspection[]>(ACT_KEY, []); }
function setActiveRaw(v: ActiveInspection[]) { write(ACT_KEY, v); }

/* ───────── repo implementation ───────── */
export const localRepo: InspectionsRepo = {
  subscribe(cb) {
    const h = () => cb();
    if (isBrowser()) {
      window.addEventListener("storage", h);
      window.addEventListener(UPDATED_EVT, h as EventListener);
    }
    return () => {
      if (isBrowser()) {
        window.removeEventListener("storage", h);
        window.removeEventListener(UPDATED_EVT, h as EventListener);
      }
    };
  },

  async getRequests() { return getRequestsRaw(); },
  async getActive() { return getActiveRaw(); },

  async getRequestDetail(requestId) {
    const base = getRequestsRaw().find(r => r.id === requestId);
    if (!base) return null;

    const extra = getDetailsMap()[requestId] ?? {};

    // 안전하게 병합 + 기본값
    const detail: RequestDetail = {
      ...base,
      ...extra,
      fee_won: extra.fee_won,
      lat: extra.lat,
      lng: extra.lng,
      description: extra.description ?? "요청 상세가 아직 입력되지 않았습니다.",
      highlights: extra.highlights ?? [],
      photos: extra.photos ?? [],
    };

    return detail;
  },

  async getStatusByListing(listingId) {
    if (getActiveRaw().some(a => a.listing_id === listingId)) return "active";
    if (getRequestsRaw().some(r => r.listing_id === listingId)) return "requested";
    return null;
  },

  async createRequestFromListing(listingId: ListingId, payload: CreateFromListingPayload) {
    // 중복 방지: 이미 requested/active면 새로 만들지 않음
    const status: InspectionStatus | null = await this.getStatusByListing(listingId);
    if (status) {
      const exists = getRequestsRaw().find(r => r.listing_id === listingId);
      return { requestId: (exists?.id ?? `dup_${listingId}`) as RequestId };
    }

    const requestId: RequestId = `req_${listingId}_${Date.now()}`;
    const next: RequestCard = {
      id: requestId,
      listing_id: listingId,
      title: payload.title,
      address: payload.address,
      priceText: payload.priceText,
      img: payload.img ?? null,
      preferred_date: payload.preferred_date ?? null,
      contact_phone: payload.contact_phone ?? null,
      request_note: payload.request_note ?? null,
      requested_at: Date.now(),
    };

    const reqs = getRequestsRaw();
    reqs.unshift(next);
    setRequestsRaw(reqs);

    // 소비자 입력값 외에, 추가 상세는 별도 map에 보관 (설명/사진 등)
    const map = getDetailsMap();
    if (!map[requestId]) map[requestId] = {};
    setDetailsMap(map);

    return { requestId };
  },

  async acceptRequest(requestId) {
    const reqs = getRequestsRaw();
    const idx = reqs.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error("request not found");

    const req = reqs.splice(idx, 1)[0];
    setRequestsRaw(reqs);

    const inspectionId: InspectionId = `ins_${requestId}`;
    const active = getActiveRaw();
    active.unshift({
      id: inspectionId,
      requestId: req.id,
      listing_id: req.listing_id,
      title: req.title,
      address: req.address,
      priceText: req.priceText,
      img: req.img ?? null,
      progress: 0,
      startedAt: Date.now(),
    });
    setActiveRaw(active);

    return { inspectionId };
  },

  async rejectRequest(requestId) {
    // 요청 목록에서 제거 + 상세 map도 정리
    setRequestsRaw(getRequestsRaw().filter(r => r.id !== requestId));
    const map = getDetailsMap();
    if (map[requestId]) {
      delete map[requestId];
      setDetailsMap(map);
    }
  },

  async cancelActive(inspectionId, opts?: CancelOptions) {
    const active = getActiveRaw();
    const idx = active.findIndex(a => a.id === inspectionId);
    if (idx === -1) return;

    const canceled = active.splice(idx, 1)[0];
    setActiveRaw(active);

    // requeue가 true면 '요청' 목록으로 되돌림
    if (opts?.requeue) {
      const reqs = getRequestsRaw();
      const requestId: RequestId = canceled.requestId ?? (`req_from_${inspectionId}` as RequestId);
      reqs.unshift({
        id: requestId,
        listing_id: canceled.listing_id,
        title: canceled.title,
        address: canceled.address,
        priceText: canceled.priceText,
        img: canceled.img ?? null,
        preferred_date: null,
        contact_phone: null,
        request_note: opts.reason ?? null,
        requested_at: Date.now(),
      });
      setRequestsRaw(reqs);
    }
  },

  // 선택적 업데이트들
  async updateRequestDetail(requestId, patch) {
    const map = getDetailsMap();
    map[requestId] = { ...(map[requestId] ?? {}), ...patch };
    setDetailsMap(map);
  },

  async updateInspectionProgress(inspectionId, progress) {
    const list = getActiveRaw().map(a =>
      a.id === inspectionId ? { ...a, progress: Math.max(0, Math.min(100, Math.round(progress))) } : a
    );
    setActiveRaw(list);
  },

  async completeInspection(inspectionId) {
    setActiveRaw(getActiveRaw().filter(a => a.id !== inspectionId));
  },
};
