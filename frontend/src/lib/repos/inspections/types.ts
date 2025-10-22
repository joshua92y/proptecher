export type ListingId = string;
export type RequestId = string;
export type InspectionId = string;

export type InspectionStatus = "requested" | "active";

export type CreateFromListingPayload = {
  title: string;
  address: string;
  priceText: string;
  img: string | null;

  // 소비자 입력값(모달)
  preferred_date: string | null; // "YYYY-MM-DD" or null
  contact_phone: string | null;
  request_note: string | null;
};

export type RequestCard = {
  id: RequestId;
  listing_id: ListingId;

  title: string;
  address: string;
  priceText: string;
  img: string | null;

  preferred_date: string | null;
  contact_phone: string | null;
  request_note: string | null;

  requested_at: number;
};

export type RequestDetail = RequestCard & {
  // 관리자 측에서 채워갈 수 있는 추가 정보(선택)
  fee_won?: number;
  lat?: number;
  lng?: number;
  description?: string;
  highlights?: string[];
  photos?: string[];
};

export type ActiveInspection = {
  id: InspectionId;
  requestId: RequestId;
  listing_id: ListingId;
  title: string;
  address: string;
  priceText: string;
  img: string | null;
  progress: number; // 0~100
  startedAt: number;
};

export type AcceptOptions = { note?: string };
export type RejectOptions = { note?: string };
export type CancelOptions = { reason?: string; requeue?: boolean }; // requeue: 요청 목록으로 되돌리기 여부(기본 false)

export interface InspectionsRepo {
  subscribe(cb: () => void): () => void;

  getRequests(): Promise<RequestCard[]>;
  getActive(): Promise<ActiveInspection[]>;
  getRequestDetail(requestId: RequestId): Promise<RequestDetail | null>;
  getStatusByListing(listingId: ListingId): Promise<InspectionStatus | null>;

  createRequestFromListing(
    listingId: ListingId,
    payload: CreateFromListingPayload
  ): Promise<{ requestId: RequestId }>;

  acceptRequest(
    requestId: RequestId,
    opts?: AcceptOptions
  ): Promise<{ inspectionId: InspectionId }>;

  rejectRequest(
    requestId: RequestId,
    opts?: RejectOptions
  ): Promise<void>;

  cancelActive(
    inspectionId: InspectionId,
    opts?: CancelOptions
  ): Promise<void>;

  updateRequestDetail?(
    requestId: RequestId,
    patch: Partial<RequestDetail>
  ): Promise<void>;

  updateInspectionProgress?(
    inspectionId: InspectionId,
    progress: number
  ): Promise<void>;

  completeInspection?(inspectionId: InspectionId): Promise<void>;
}
