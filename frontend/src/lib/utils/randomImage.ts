/**
 * 랜덤 매물 이미지 선택 유틸리티
 */

// public/images 폴더의 사용 가능한 이미지 목록
const AVAILABLE_IMAGES = [
  '/images/apt1.jpg',
  '/images/apt2.jpg',
  '/images/apt3.jpg',
  '/images/apt4.jpg',
  '/images/house1.jpg',
  '/images/house2.jpg',
  '/images/house3.jpg',
  '/images/room1.jpg',
  '/images/room2.jpg',
];

/**
 * 매물 ID 기반 랜덤 이미지 선택 (같은 ID는 항상 같은 이미지 반환)
 * @param listingId - 매물 ID
 * @param imageUrl - 원본 이미지 URL (null/undefined면 랜덤 이미지 반환)
 * @returns 이미지 URL
 */
export function getListingImage(listingId: string | number, imageUrl?: string | null): string {
  // 이미지 URL이 있으면 그대로 반환
  if (imageUrl) {
    return imageUrl;
  }

  // listingId를 숫자로 변환 (문자열이면 hash)
  const numericId = typeof listingId === 'string' 
    ? simpleHash(listingId) 
    : listingId;

  // ID 기반으로 이미지 선택 (같은 ID는 항상 같은 이미지)
  const index = numericId % AVAILABLE_IMAGES.length;
  return AVAILABLE_IMAGES[index];
}

/**
 * 문자열을 숫자로 변환하는 간단한 해시 함수
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 완전 랜덤 이미지 선택 (매번 다른 이미지)
 * @returns 랜덤 이미지 URL
 */
export function getRandomImage(): string {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_IMAGES.length);
  return AVAILABLE_IMAGES[randomIndex];
}

/**
 * 주택 종류에 따른 적합한 이미지 선택
 * @param listingId - 매물 ID
 * @param houseType - 주택 종류
 * @param imageUrl - 원본 이미지 URL
 * @returns 이미지 URL
 */
export function getListingImageByType(
  listingId: string | number,
  houseType?: string,
  imageUrl?: string | null
): string {
  // 이미지 URL이 있으면 그대로 반환
  if (imageUrl) {
    return imageUrl;
  }

  // 주택 종류별 이미지 필터링
  let filteredImages = AVAILABLE_IMAGES;
  
  if (houseType) {
    if (houseType === 'apartment' || houseType === 'officetel') {
      // 아파트, 오피스텔 -> apt 이미지
      filteredImages = AVAILABLE_IMAGES.filter(img => img.includes('apt'));
    } else if (houseType === 'villa') {
      // 빌라 -> house 이미지
      filteredImages = AVAILABLE_IMAGES.filter(img => img.includes('house'));
    } else if (houseType === 'oneroom' || houseType === 'tworoom') {
      // 원룸, 투룸 -> room 이미지
      filteredImages = AVAILABLE_IMAGES.filter(img => img.includes('room'));
    }
  }

  // 필터링 결과가 없으면 전체 이미지 사용
  if (filteredImages.length === 0) {
    filteredImages = AVAILABLE_IMAGES;
  }

  // ID 기반으로 이미지 선택
  const numericId = typeof listingId === 'string' 
    ? simpleHash(listingId) 
    : listingId;
  
  const index = numericId % filteredImages.length;
  return filteredImages[index];
}






