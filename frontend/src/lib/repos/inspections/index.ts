// src/lib/repos/inspections/index.ts
// ✨ 개발 중엔 local만 사용. 나중에 api 붙이면 여기서 스위치.

export * from "./types";
export { localRepo as repo } from "./local";
// (서버 붙일 때)
// import { apiRepo } from "./api";
// export const repo = apiRepo;
