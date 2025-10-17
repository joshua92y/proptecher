/**
 * Kakao Maps JavaScript API Type Definitions
 * @see https://apis.map.kakao.com/web/documentation/
 */

declare global {
  interface Window {
    kakao: any;
  }

  namespace kakao {
    namespace maps {
      // ==================== 기본 클래스 ====================
      
      class Map {
        constructor(container: HTMLElement, options: MapOptions);
        setCenter(latlng: LatLng): void;
        getCenter(): LatLng;
        setLevel(level: number, options?: { animate?: boolean }): void;
        getLevel(): number;
        setBounds(bounds: LatLngBounds): void;
        getBounds(): LatLngBounds;
        panTo(latlng: LatLng): void;
        relayout(): void;
      }

      interface MapOptions {
        center: LatLng;
        level?: number;
        draggable?: boolean;
        scrollwheel?: boolean;
        disableDoubleClick?: boolean;
        disableDoubleClickZoom?: boolean;
        keyboardShortcuts?: boolean;
      }

      class LatLng {
        constructor(latitude: number, longitude: number);
        getLat(): number;
        getLng(): number;
      }

      class LatLngBounds {
        constructor(sw: LatLng, ne: LatLng);
        getSouthWest(): LatLng;
        getNorthEast(): LatLng;
        extend(latlng: LatLng): void;
        contain(latlng: LatLng): boolean;
      }

      // ==================== 마커 ====================
      
      class Marker {
        constructor(options: MarkerOptions);
        setMap(map: Map | null): void;
        getMap(): Map;
        setPosition(position: LatLng): void;
        getPosition(): LatLng;
        setImage(image: MarkerImage): void;
        setTitle(title: string): void;
        setClickable(clickable: boolean): void;
      }

      interface MarkerOptions {
        map?: Map;
        position: LatLng;
        image?: MarkerImage;
        title?: string;
        clickable?: boolean;
        zIndex?: number;
      }

      class MarkerImage {
        constructor(src: string, size: Size, options?: MarkerImageOptions);
      }

      interface MarkerImageOptions {
        alt?: string;
        coords?: string;
        offset?: Point;
        shape?: string;
        spriteOrigin?: Point;
        spriteSize?: Size;
      }

      // ==================== 인포윈도우 ====================
      
      class InfoWindow {
        constructor(options: InfoWindowOptions);
        open(map: Map, marker: Marker): void;
        close(): void;
        setContent(content: string | HTMLElement): void;
        setPosition(position: LatLng): void;
      }

      interface InfoWindowOptions {
        content?: string | HTMLElement;
        disableAutoPan?: boolean;
        map?: Map;
        position?: LatLng;
        removable?: boolean;
        zIndex?: number;
      }

      // ==================== 오버레이 ====================
      
      class CustomOverlay {
        constructor(options: CustomOverlayOptions);
        setMap(map: Map | null): void;
        getMap(): Map;
        setPosition(position: LatLng): void;
        getPosition(): LatLng;
        setContent(content: string | HTMLElement): void;
        setVisible(visible: boolean): void;
        setZIndex(zIndex: number): void;
      }

      interface CustomOverlayOptions {
        map?: Map;
        position?: LatLng;
        content?: string | HTMLElement;
        xAnchor?: number;
        yAnchor?: number;
        zIndex?: number;
      }

      // ==================== 이벤트 ====================
      
      namespace event {
        function addListener(
          target: any,
          type: string,
          handler: (event?: any) => void
        ): void;
        function removeListener(
          target: any,
          type: string,
          handler: (event?: any) => void
        ): void;
      }

      // ==================== 유틸리티 ====================
      
      class Size {
        constructor(width: number, height: number);
      }

      class Point {
        constructor(x: number, y: number);
      }

      // ==================== Services 라이브러리 ====================
      
      namespace services {
        class Geocoder {
          addressSearch(
            addr: string,
            callback: (result: any[], status: Status) => void
          ): void;
          coord2Address(
            lng: number,
            lat: number,
            callback: (result: any[], status: Status) => void
          ): void;
        }

        class Places {
          keywordSearch(
            keyword: string,
            callback: (result: any[], status: Status, pagination: Pagination) => void,
            options?: PlacesSearchOptions
          ): void;
          categorySearch(
            code: string,
            callback: (result: any[], status: Status, pagination: Pagination) => void,
            options?: PlacesSearchOptions
          ): void;
        }

        interface PlacesSearchOptions {
          location?: LatLng;
          radius?: number;
          bounds?: LatLngBounds;
          sort?: string;
          page?: number;
          size?: number;
        }

        interface Pagination {
          current: number;
          totalCount: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
          gotoPage(page: number): void;
        }

        enum Status {
          OK = 'OK',
          ZERO_RESULT = 'ZERO_RESULT',
          ERROR = 'ERROR',
        }
      }

      // ==================== Clusterer 라이브러리 ====================
      
      class MarkerClusterer {
        constructor(options: MarkerClustererOptions);
        addMarker(marker: Marker): void;
        addMarkers(markers: Marker[]): void;
        removeMarker(marker: Marker): void;
        removeMarkers(markers: Marker[]): void;
        clear(): void;
        redraw(): void;
      }

      interface MarkerClustererOptions {
        map: Map;
        markers?: Marker[];
        gridSize?: number;
        averageCenter?: boolean;
        minLevel?: number;
        minClusterSize?: number;
        styles?: any[];
        texts?: string[] | ((size: number) => string);
        calculator?: (size: number) => number[];
        disableClickZoom?: boolean;
      }
    }
  }
}

export {};

