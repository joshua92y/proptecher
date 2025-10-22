"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Text, Group, Arc } from "react-konva";
import Konva from "konva";
import { useRouter } from "next/navigation";

// ------------------------ Types ------------------------------
type Point = { x: number; y: number };

type Wall = {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
};

type Room = {
  id: string;
  name: string;
  points: Point[];
  color: string;
};

type ObjectType = "door" | "window" | "sink" | "toilet" | "bed" | "sofa" | "table" | "desk";

type FloorObject = {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
};

type DrawMode = "wall" | "room" | "object" | "select" | null;

// ------------------------ Constants --------------------------
const CANVAS_W = 360;
const CANVAS_H = 560;
const GRID_SIZE = 10; // 10px = 0.5m (1:50 축척)
const SNAP_THRESHOLD = 15;
const WALL_THICKNESS = 8;
const WALL_COLOR = "#1a1a1a";

// 축척: 1px = 0.05m (5cm)
const SCALE_RATIO = 0.05; // meters per pixel
const SCALE_DISPLAY = "1:50"; // 축척 표시

// 오브젝트 기본 크기 (실제 크기 기준, px로 변환)
const OBJECT_SIZES: Record<ObjectType, { w: number; h: number; label: string; icon: string }> = {
  door: { w: 18, h: 4, label: "문", icon: "🚪" },
  window: { w: 20, h: 4, label: "창문", icon: "🪟" },
  sink: { w: 12, h: 10, label: "싱크대", icon: "🚰" },
  toilet: { w: 8, h: 12, label: "변기", icon: "🚽" },
  bed: { w: 30, h: 40, label: "침대", icon: "🛏️" },
  sofa: { w: 40, h: 18, label: "소파", icon: "🛋️" },
  table: { w: 24, h: 16, label: "테이블", icon: "🪑" },
  desk: { w: 24, h: 12, label: "책상", icon: "💼" },
};

// ------------------------ Helpers ----------------------------
const uid = () => Math.random().toString(36).slice(2, 9);

function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

function findNearestPoint(
  point: Point,
  existingPoints: Point[],
  threshold: number
): Point | null {
  for (const p of existingPoints) {
    const dist = Math.sqrt(Math.pow(point.x - p.x, 2) + Math.pow(point.y - p.y, 2));
    if (dist < threshold) {
      return p;
    }
  }
  return null;
}

function getAllWallPoints(walls: Wall[]): Point[] {
  const points: Point[] = [];
  walls.forEach((wall) => {
    points.push(wall.start, wall.end);
  });
  return points;
}

// ------------------------ Page -------------------------------
export default function FloorplanPage({ params }: { params: Promise<{ inspectionId: string }> }) {
  const router = useRouter();
  const stageRef = useRef<Konva.Stage>(null);
  const { inspectionId } = React.use(params);

  const [walls, setWalls] = useState<Wall[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [objects, setObjects] = useState<FloorObject[]>([]);
  
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(1); // 확대/축소 비율
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 벽 그리기 상태
  const [currentWallStart, setCurrentWallStart] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  
  // 방 그리기 상태
  const [currentRoomPoints, setCurrentRoomPoints] = useState<Point[]>([]);
  
  // 오브젝트 배치
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType | null>(null);
  const [showObjectPalette, setShowObjectPalette] = useState(false);
  
  // 방 이름 모달
  const [showRoomNameModal, setShowRoomNameModal] = useState(false);
  const [pendingRoomPoints, setPendingRoomPoints] = useState<Point[] | null>(null);
  const [roomNameInput, setRoomNameInput] = useState("");

  // 선택
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // 그리드 라인 생성
  const gridLines: number[][] = [];
  if (showGrid) {
    for (let x = GRID_SIZE; x < CANVAS_W; x += GRID_SIZE) {
      gridLines.push([x, 0, x, CANVAS_H]);
    }
    for (let y = GRID_SIZE; y < CANVAS_H; y += GRID_SIZE) {
      gridLines.push([0, y, CANVAS_W, y]);
    }
  }

  const getPointerPosition = (e: any): Point | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    
    let { x, y } = pos;
    
    // 스케일 적용
    x = x / scale;
    y = y / scale;
    
    // 그리드 스냅
    if (showGrid) {
      x = snapToGrid(x);
      y = snapToGrid(y);
    }
    
    // 마그네틱 스냅 (벽 그리기 시)
    if (drawMode === "wall") {
      const existingPoints = getAllWallPoints(walls);
      if (currentWallStart) {
        existingPoints.push(currentWallStart);
      }
      const nearPoint = findNearestPoint({ x, y }, existingPoints, SNAP_THRESHOLD);
      if (nearPoint) {
        return nearPoint;
      }
    }
    
  return { x, y };
  };

  // 벽 그리기 중지
  const stopWallDrawing = () => {
    setCurrentWallStart(null);
  };

  const handleWallStart = (e: any) => {
    if (drawMode !== "wall") return;
    const pos = getPointerPosition(e);
    if (!pos) return;
    
    if (currentWallStart === null) {
      setCurrentWallStart(pos);
    } else {
      const newWall: Wall = {
        id: uid(),
        start: currentWallStart,
        end: pos,
        thickness: WALL_THICKNESS,
      };
      setWalls([...walls, newWall]);
      setCurrentWallStart(pos);
    }
  };

  const handleRoomClick = (e: any) => {
    if (drawMode !== "room") return;
    const pos = getPointerPosition(e);
    if (!pos) return;

    const newPoints = [...currentRoomPoints, pos];
    
    if (newPoints.length > 2) {
      const firstPoint = newPoints[0];
      const dist = Math.sqrt(
        Math.pow(pos.x - firstPoint.x, 2) + Math.pow(pos.y - firstPoint.y, 2)
      );
      if (dist < SNAP_THRESHOLD) {
        setPendingRoomPoints([...newPoints.slice(0, -1), firstPoint]);
        setShowRoomNameModal(true);
        setCurrentRoomPoints([]);
        return;
      }
    }
    
    setCurrentRoomPoints(newPoints);
  };

  const handleObjectPlace = (e: any) => {
    if (drawMode !== "object" || !selectedObjectType) return;
    const pos = getPointerPosition(e);
    if (!pos) return;

    const objSize = OBJECT_SIZES[selectedObjectType];
    const newObject: FloorObject = {
      id: uid(),
      type: selectedObjectType,
      x: pos.x,
      y: pos.y,
      rotation: 0,
      width: objSize.w,
      height: objSize.h,
    };
    
    setObjects([...objects, newObject]);
    setSelectedObjectType(null);
    setShowObjectPalette(false);
  };

  const confirmRoomName = () => {
    if (!pendingRoomPoints || !roomNameInput.trim()) return;
    
    const newRoom: Room = {
      id: uid(),
      name: roomNameInput.trim(),
      points: pendingRoomPoints,
      color: getRandomRoomColor(),
    };
    
    setRooms([...rooms, newRoom]);
    setPendingRoomPoints(null);
    setRoomNameInput("");
    setShowRoomNameModal(false);
  };

  const getRandomRoomColor = () => {
    const colors = [
      "rgba(147, 197, 253, 0.3)",
      "rgba(134, 239, 172, 0.3)",
      "rgba(252, 211, 77, 0.3)",
      "rgba(251, 146, 60, 0.3)",
      "rgba(196, 181, 253, 0.3)",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleMouseMove = (e: any) => {
    const pos = getPointerPosition(e);
    if (pos) {
      setCurrentMousePos(pos);
    }
  };

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      if (drawMode === "wall") {
        handleWallStart(e);
      } else if (drawMode === "room") {
        handleRoomClick(e);
      } else if (drawMode === "object") {
        handleObjectPlace(e);
    } else {
        setSelectedWallId(null);
        setSelectedRoomId(null);
        setSelectedObjectId(null);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCurrentWallStart(null);
        setCurrentRoomPoints([]);
        setDrawMode(null);
        setSelectedObjectType(null);
        setShowObjectPalette(false);
      }
      if (e.key === "Delete") {
        if (selectedWallId) {
          setWalls(walls.filter((w) => w.id !== selectedWallId));
          setSelectedWallId(null);
        }
        if (selectedRoomId) {
          setRooms(rooms.filter((r) => r.id !== selectedRoomId));
          setSelectedRoomId(null);
        }
        if (selectedObjectId) {
          setObjects(objects.filter((o) => o.id !== selectedObjectId));
          setSelectedObjectId(null);
        }
      }
      // 확대/축소
      if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(s + 0.1, 3));
      }
      if (e.key === "-" || e.key === "_") {
        setScale((s) => Math.max(s - 0.1, 0.5));
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWallId, selectedRoomId, selectedObjectId, walls, rooms, objects]);

  const handleToolClick = (mode: DrawMode) => {
    if (drawMode === mode) {
      setDrawMode(null);
      setCurrentWallStart(null);
      setCurrentRoomPoints([]);
      setSelectedObjectType(null);
      setShowObjectPalette(false);
    } else {
      setDrawMode(mode);
      setCurrentWallStart(null);
      setCurrentRoomPoints([]);
      setSelectedWallId(null);
      setSelectedRoomId(null);
      setSelectedObjectId(null);
      
      if (mode === "object") {
        setShowObjectPalette(true);
      } else {
        setShowObjectPalette(false);
      }
    }
  };

  // 평면도 불러오기
  useEffect(() => {
    const loadFloorplan = async () => {
      try {
        setLoading(true);
        
        // API에서 평면도 데이터 불러오기
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(
          `${apiUrl}/api/admin/inspections/${inspectionId}/floorplan`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.floorplanData) {
            console.log("📐 평면도 불러오기 (DB):", data.floorplanData);
            
            setWalls(data.floorplanData.walls || []);
            setRooms(data.floorplanData.rooms || []);
            setObjects(data.floorplanData.objects || []);
            
            if (data.floorplanData.metadata) {
              setScale(data.floorplanData.metadata.scale || 1);
            }
          }
        } else if (response.status === 404) {
          // 평면도가 아직 없음 - 정상 (처음 그리는 경우)
          console.log("📐 새로운 평면도 시작");
        }
      } catch (error) {
        console.error("평면도 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFloorplan();
  }, [inspectionId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const stage = stageRef.current;
      if (!stage) return;
      
      // 1. 편집 가능한 JSON 데이터
      const floorplanData = {
        version: "1.0",
        walls,
        rooms,
        objects,
        metadata: {
          scale,
          gridSize: GRID_SIZE,
          canvasWidth: CANVAS_W,
          canvasHeight: CANVAS_H,
          updatedAt: new Date().toISOString(),
        }
      };
      
      // 2. 미리보기 이미지 (Base64)
      const imageDataURL = stage.toDataURL({ 
        pixelRatio: 2,
        mimeType: 'image/png'
      });
      
      console.log("💾 평면도 저장 중 (DB):", {
        walls: walls.length,
        rooms: rooms.length,
        objects: objects.length
      });
      
      // API로 클라우드 DB에 저장
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/admin/inspections/${inspectionId}/floorplan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            floorplanData,
            floorplanImage: imageDataURL,
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ 저장 완료 (DB):", result);
        
        // progress 체크리스트에 평면도 완료 상태 업데이트
        const progressResponse = await fetch(
          `${apiUrl}/api/admin/inspections/${inspectionId}/save-progress`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              checklistData: {
                floorplan: imageDataURL,
              },
            }),
          }
        );
        
        if (progressResponse.ok) {
          console.log("✅ 진행 상황 업데이트 완료");
        }
        
        alert("✅ 평면도가 저장되었습니다!");
        router.back();
      } else {
        const error = await response.json();
        throw new Error(error.error || "저장 실패");
      }
      
    } catch (error) {
      console.error("저장 실패:", error);
      alert(`❌ 저장에 실패했습니다: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // 오브젝트 회전
  const rotateObject = (id: string) => {
    setObjects(objects.map(obj => 
      obj.id === id 
        ? { ...obj, rotation: (obj.rotation + 90) % 360 }
        : obj
    ));
  };

  return (
    <div className="shell">
      {/* Header */}
      <header className="header">
        <button className="icon-btn" onClick={() => router.back()}>←</button>
        <div className="title">평면도 그리기</div>
        <div className="header-actions">
          <button 
            className={`chip ${showGrid ? 'active' : 'ghost'}`}
            onClick={() => setShowGrid(!showGrid)}
            title="그리드"
          >
            {showGrid ? '🟩' : '⬜'}
          </button>
          <button className="chip" onClick={() => setScale(Math.max(scale - 0.2, 0.5))}>
            🔍-
          </button>
          <span className="chip scale-display">{Math.round(scale * 100)}%</span>
          <button className="chip" onClick={() => setScale(Math.min(scale + 0.2, 3))}>
            🔍+
          </button>
          <button className="chip" onClick={() => router.back()}>취소</button>
          <button 
            className="chip primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </header>

      {/* 도구 패널 */}
      <aside className="tools">
        <button
          className={`tool-btn ${drawMode === "wall" ? "active" : ""}`}
          onClick={() => handleToolClick("wall")}
          title="벽 그리기"
        >
          🧱<span>벽</span>
        </button>
        <button
          className={`tool-btn ${drawMode === "room" ? "active" : ""}`}
          onClick={() => handleToolClick("room")}
          title="방 영역"
        >
          📐<span>방</span>
        </button>
        <button
          className={`tool-btn ${drawMode === "object" ? "active" : ""}`}
          onClick={() => handleToolClick("object")}
          title="오브젝트"
        >
          🪑<span>가구</span>
        </button>
        <button
          className={`tool-btn ${drawMode === "select" ? "active" : ""}`}
          onClick={() => handleToolClick("select")}
          title="선택"
        >
          ✋<span>선택</span>
        </button>
      </aside>

      {/* 그리기 중 제어 버튼 */}
      {(currentWallStart || currentRoomPoints.length > 0) && (
        <div className="drawing-controls">
          {currentWallStart && (
            <button 
              className="control-btn finish"
              onClick={stopWallDrawing}
            >
              ✓ 벽 그리기 완료
            </button>
          )}
          {currentRoomPoints.length > 0 && (
            <button 
              className="control-btn cancel"
              onClick={() => setCurrentRoomPoints([])}
            >
              ✕ 방 그리기 취소
            </button>
          )}
        </div>
      )}

      {/* 오브젝트 팔레트 */}
      {showObjectPalette && (
        <aside className="object-palette">
          <div className="palette-title">오브젝트 선택</div>
          {(Object.keys(OBJECT_SIZES) as ObjectType[]).map((type) => (
            <button
              key={type}
              className={`palette-item ${selectedObjectType === type ? "active" : ""}`}
              onClick={() => setSelectedObjectType(type)}
            >
              <span className="item-icon">{OBJECT_SIZES[type].icon}</span>
              <span className="item-label">{OBJECT_SIZES[type].label}</span>
            </button>
          ))}
        </aside>
      )}

      {/* Canvas Card */}
      <div className="card">
        {loading ? (
          <div style={{ 
            height: CANVAS_H, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#6b7280'
          }}>
            📐 평면도를 불러오는 중...
          </div>
        ) : (
        <div className="stage-wrap">
          <Stage
            ref={stageRef}
            width={CANVAS_W}
            height={CANVAS_H}
            scaleX={scale}
            scaleY={scale}
            onClick={handleStageClick}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
          >
            <Layer>
              {/* 배경 */}
              <Rect
                x={0}
                y={0}
                width={CANVAS_W / scale}
                height={CANVAS_H / scale}
                fill="#ffffff"
                listening={false}
              />

              {/* 그리드 */}
              {gridLines.map((points, i) => (
                <Line
                  key={`grid-${i}`}
                  points={points}
                  stroke="#e5e7eb"
                  strokeWidth={0.5 / scale}
                  listening={false}
                  opacity={0.5}
                />
              ))}

              {/* 방 영역 */}
              {rooms.map((room) => {
                const flatPoints = room.points.flatMap((p) => [p.x, p.y]);
                return (
                  <Group key={room.id}>
                    <Line
                      points={flatPoints}
                      closed
                      fill={room.color}
                      stroke={selectedRoomId === room.id ? "#7c3aed" : "#94a3b8"}
                      strokeWidth={(selectedRoomId === room.id ? 3 : 1) / scale}
                      onClick={() => {
                        if (drawMode === "select") {
                          setSelectedRoomId(room.id);
                          setSelectedWallId(null);
                          setSelectedObjectId(null);
                        }
                      }}
                    />
                    {room.points.length > 0 && (
                      <Text
                        x={room.points[0].x + 10}
                        y={room.points[0].y + 10}
                        text={room.name}
                        fontSize={14 / scale}
                        fontStyle="bold"
                        fill="#334155"
                        listening={false}
                      />
                    )}
                    
                    {/* 선택된 방 삭제 버튼 */}
                    {selectedRoomId === room.id && drawMode === "select" && room.points.length > 0 && (
                <Group
                        x={room.points[0].x - 20}
                        y={room.points[0].y - 20}
                        onClick={() => {
                          setRooms(rooms.filter(r => r.id !== room.id));
                          setSelectedRoomId(null);
                        }}
                      >
                        <Circle
                          radius={12 / scale}
                          fill="#ef4444"
                        />
                        <Text
                          x={-6 / scale}
                          y={-7 / scale}
                          text="✕"
                          fontSize={14 / scale}
                          fill="#fff"
                          listening={false}
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* 그리기 중인 방 */}
              {drawMode === "room" && currentRoomPoints.length > 0 && (
                <>
                  <Line
                    points={currentRoomPoints.flatMap((p) => [p.x, p.y])}
                    stroke="#7c3aed"
                    strokeWidth={2 / scale}
                    dash={[5 / scale, 5 / scale]}
                    listening={false}
                  />
                  {currentMousePos && (
                    <Line
                      points={[
                        currentRoomPoints[currentRoomPoints.length - 1].x,
                        currentRoomPoints[currentRoomPoints.length - 1].y,
                        currentMousePos.x,
                        currentMousePos.y,
                      ]}
                      stroke="#7c3aed"
                      strokeWidth={2 / scale}
                      dash={[3 / scale, 3 / scale]}
                      opacity={0.5}
                      listening={false}
                    />
                  )}
                  {currentRoomPoints.map((point, i) => (
                    <Circle
                      key={i}
                      x={point.x}
                      y={point.y}
                      radius={4 / scale}
                      fill="#7c3aed"
                      listening={false}
                    />
                  ))}
                </>
              )}

              {/* 벽 */}
              {walls.map((wall) => (
                <Group key={wall.id}>
                  <Line
                    points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
                    stroke={selectedWallId === wall.id ? "#7c3aed" : WALL_COLOR}
                    strokeWidth={wall.thickness / scale}
                    lineCap="round"
                    lineJoin="round"
                    onClick={() => {
                      if (drawMode === "select") {
                        setSelectedWallId(wall.id);
                        setSelectedRoomId(null);
                        setSelectedObjectId(null);
                      }
                    }}
                  />
                  
                  {/* 선택된 벽 삭제 버튼 */}
                  {selectedWallId === wall.id && drawMode === "select" && (
                    <Group
                      x={(wall.start.x + wall.end.x) / 2}
                      y={(wall.start.y + wall.end.y) / 2}
                      onClick={() => {
                        setWalls(walls.filter(w => w.id !== wall.id));
                        setSelectedWallId(null);
                      }}
                    >
                      <Circle
                        radius={12 / scale}
                        fill="#ef4444"
                  />
                  <Text
                        x={-6 / scale}
                        y={-7 / scale}
                        text="✕"
                        fontSize={14 / scale}
                        fill="#fff"
                    listening={false}
                  />
                    </Group>
                  )}
                </Group>
              ))}

              {/* 오브젝트 */}
              {objects.map((obj) => (
                <Group
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  rotation={obj.rotation}
                  draggable={drawMode === "select"}
                  onClick={() => {
                    if (drawMode === "select") {
                      setSelectedObjectId(obj.id);
                      setSelectedWallId(null);
                      setSelectedRoomId(null);
                    }
                  }}
                  onDblClick={() => rotateObject(obj.id)}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const newX = showGrid ? snapToGrid(node.x()) : node.x();
                    const newY = showGrid ? snapToGrid(node.y()) : node.y();
                    
                    setObjects(objects.map(o => 
                      o.id === obj.id 
                        ? { ...o, x: newX, y: newY }
                        : o
                    ));
                  }}
                >
                  {/* 오브젝트별 렌더링 */}
                  {obj.type === "door" && (
                    <>
                  <Rect
                        x={-obj.width / 2}
                        y={-obj.height / 2}
                        width={obj.width}
                        height={obj.height}
                        fill="#8b4513"
                        stroke={selectedObjectId === obj.id ? "#7c3aed" : "#654321"}
                        strokeWidth={2 / scale}
                      />
                      <Arc
                        x={obj.width / 2}
                        y={-obj.height / 2}
                        innerRadius={0}
                        outerRadius={obj.width}
                        angle={90}
                        stroke="#654321"
                        strokeWidth={1 / scale}
                      />
                    </>
                  )}
                  {obj.type === "window" && (
                    <>
                      <Rect
                        x={-obj.width / 2}
                        y={-obj.height / 2}
                        width={obj.width}
                        height={obj.height}
                        fill="#87ceeb"
                        stroke={selectedObjectId === obj.id ? "#7c3aed" : "#4682b4"}
                        strokeWidth={2 / scale}
                      />
                      <Line
                        points={[-obj.width / 2, 0, obj.width / 2, 0]}
                        stroke="#4682b4"
                        strokeWidth={1 / scale}
                      />
                    </>
                  )}
                  {(obj.type === "sink" || obj.type === "toilet" || 
                    obj.type === "bed" || obj.type === "sofa" || 
                    obj.type === "table" || obj.type === "desk") && (
                    <>
                  <Rect
                        x={-obj.width / 2}
                        y={-obj.height / 2}
                        width={obj.width}
                        height={obj.height}
                        fill="#f5f5f5"
                        stroke={selectedObjectId === obj.id ? "#7c3aed" : "#999"}
                        strokeWidth={2 / scale}
                  />
                  <Text
                        x={-obj.width / 2 + 2}
                        y={-obj.height / 2 + 2}
                        text={OBJECT_SIZES[obj.type].icon}
                        fontSize={10 / scale}
                    listening={false}
                  />
                    </>
                  )}
                </Group>
              ))}

              {/* 그리기 중인 벽 미리보기 */}
              {drawMode === "wall" && currentWallStart && currentMousePos && (
                <>
                  <Line
                    points={[
                      currentWallStart.x,
                      currentWallStart.y,
                      currentMousePos.x,
                      currentMousePos.y,
                    ]}
                    stroke="#7c3aed"
                    strokeWidth={WALL_THICKNESS / scale}
                    lineCap="round"
                    opacity={0.6}
                    listening={false}
                  />
                  <Circle
                    x={currentWallStart.x}
                    y={currentWallStart.y}
                    radius={4 / scale}
                    fill="#7c3aed"
                    listening={false}
                  />
                </>
              )}

              {/* 오브젝트 배치 미리보기 */}
              {drawMode === "object" && selectedObjectType && currentMousePos && (
                <Rect
                  x={currentMousePos.x - OBJECT_SIZES[selectedObjectType].w / 2}
                  y={currentMousePos.y - OBJECT_SIZES[selectedObjectType].h / 2}
                  width={OBJECT_SIZES[selectedObjectType].w}
                  height={OBJECT_SIZES[selectedObjectType].h}
                  fill="rgba(124, 58, 237, 0.2)"
                  stroke="#7c3aed"
                  strokeWidth={2 / scale}
                  dash={[5 / scale, 5 / scale]}
                  listening={false}
                />
              )}

              {/* 스냅 포인트 */}
              {currentMousePos && drawMode === "wall" && (
                <Circle
                  x={currentMousePos.x}
                  y={currentMousePos.y}
                  radius={3 / scale}
                  fill="#ef4444"
                  listening={false}
                />
              )}

              {/* 선택된 오브젝트 컨트롤 */}
              {selectedObjectId && drawMode === "select" && (() => {
                const obj = objects.find(o => o.id === selectedObjectId);
                if (!obj) return null;
                
                return (
                  <Group x={obj.x} y={obj.y}>
                    {/* 선택 테두리 */}
                    <Rect
                      x={-obj.width / 2 - 5}
                      y={-obj.height / 2 - 5}
                      width={obj.width + 10}
                      height={obj.height + 10}
                      stroke="#7c3aed"
                      strokeWidth={2 / scale}
                      dash={[5 / scale, 5 / scale]}
                      listening={false}
                    />
                    
                    {/* 회전 버튼 */}
                    <Group
                      x={obj.width / 2 + 15}
                      y={-obj.height / 2 - 15}
                      onClick={() => rotateObject(obj.id)}
                    >
                      <Circle
                        radius={10 / scale}
                        fill="#7c3aed"
                      />
                      <Text
                        x={-6 / scale}
                        y={-6 / scale}
                        text="↻"
                        fontSize={12 / scale}
                        fill="#fff"
                        listening={false}
                      />
                    </Group>
                    
                    {/* 삭제 버튼 */}
                    <Group
                      x={-obj.width / 2 - 15}
                      y={-obj.height / 2 - 15}
                      onClick={() => {
                        setObjects(objects.filter(o => o.id !== obj.id));
                        setSelectedObjectId(null);
                      }}
                    >
                      <Circle
                        radius={10 / scale}
                        fill="#ef4444"
                      />
                      <Text
                        x={-5 / scale}
                        y={-6 / scale}
                        text="✕"
                        fontSize={12 / scale}
                        fill="#fff"
                        listening={false}
                      />
                    </Group>
                  </Group>
                );
              })()}

              {/* 축척 표시 */}
              <Group x={10} y={CANVAS_H / scale - 30}>
                <Rect
                  x={0}
                  y={0}
                  width={100}
                  height={25}
                  fill="rgba(255, 255, 255, 0.9)"
                  stroke="#333"
                  strokeWidth={1 / scale}
                  cornerRadius={4}
                />
                <Text
                  x={5}
                  y={5}
                  text={`축척 ${SCALE_DISPLAY}`}
                  fontSize={10 / scale}
                  fill="#333"
                  listening={false}
                />
                <Line
                  points={[5, 18, 55, 18]}
                  stroke="#333"
                  strokeWidth={2 / scale}
                />
                <Line
                  points={[5, 15, 5, 21]}
                  stroke="#333"
                  strokeWidth={1 / scale}
                />
                <Line
                  points={[55, 15, 55, 21]}
                  stroke="#333"
                  strokeWidth={1 / scale}
                />
                <Text
                  x={60}
                  y={13}
                  text="2.5m"
                  fontSize={8 / scale}
                  fill="#333"
                  listening={false}
                />
              </Group>
            </Layer>
          </Stage>
            </div>
          )}

        {/* 안내 메시지 */}
        <div className="instructions">
          {drawMode === "wall" && currentWallStart && "📍 다음 벽의 끝점을 클릭하세요. 하단 '✓ 벽 그리기 완료' 버튼으로 종료"}
          {drawMode === "wall" && !currentWallStart && "📍 클릭하여 벽을 그립니다. 기존 벽에 자동 연결됩니다"}
          {drawMode === "room" && currentRoomPoints.length > 0 && "📍 방 경계를 계속 클릭하세요. 첫 점 근처 클릭 시 완성 | 하단 '✕' 버튼으로 취소"}
          {drawMode === "room" && currentRoomPoints.length === 0 && "📍 클릭하여 방 경계를 지정합니다"}
          {drawMode === "object" && selectedObjectType && `📍 ${OBJECT_SIZES[selectedObjectType].label} 배치 위치를 클릭하세요`}
          {drawMode === "object" && !selectedObjectType && "🪑 오른쪽에서 배치할 가구를 선택하세요"}
          {drawMode === "select" && selectedObjectId && "✋ 드래그로 이동 | ↻ 버튼으로 회전 | ✕ 버튼으로 삭제"}
          {drawMode === "select" && selectedWallId && "✋ 벽 선택됨 | ✕ 버튼으로 삭제"}
          {drawMode === "select" && selectedRoomId && "✋ 방 선택됨 | ✕ 버튼으로 삭제"}
          {drawMode === "select" && !selectedObjectId && !selectedWallId && !selectedRoomId && "✋ 벽/방/가구를 클릭하여 선택하세요. 가구는 드래그로 이동 가능"}
          {!drawMode && "🛠️ 왼쪽 도구를 선택하여 평면도를 그려주세요. +/- 키로 확대/축소"}
        </div>
      </div>

      {/* 방 이름 입력 모달 */}
      {showRoomNameModal && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-title">방 이름 입력</div>
              <input
              type="text"
              className="modal-input"
              placeholder="예: 거실, 침실1, 주방"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRoomName()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn primary wide" onClick={confirmRoomName}>
                확인
              </button>
              <button
                className="btn ghost wide"
                onClick={() => {
                  setShowRoomNameModal(false);
                  setPendingRoomPoints(null);
                  setRoomNameInput("");
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .shell {
          min-height: 100vh;
          background: #f5f5f7;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          position: relative;
        }
        .header {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          max-width: 800px;
          margin-bottom: 12px;
        }
        .icon-btn {
          border: none;
          background: #fff;
          border-radius: 10px;
          padding: 6px 10px;
          box-shadow: 0 0 0 1px #e5e7eb;
          cursor: pointer;
          font-size: 18px;
        }
        .title {
          font-weight: 600;
          font-size: 16px;
        }
        .header-actions {
          display: flex;
          gap: 6px;
        }
        .chip {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .chip.primary {
          background: #7c3aed;
          color: #fff;
          border-color: #7c3aed;
        }
        .chip.active {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }
        .chip.ghost {
          background: #fff;
          border-color: #d1d5db;
        }
        .chip.scale-display {
          pointer-events: none;
          background: #fff;
          min-width: 50px;
          text-align: center;
        }
        .chip:hover:not(.scale-display) {
          opacity: 0.8;
        }
        
        .tools {
          position: fixed;
          left: 12px;
          top: 80px;
          width: 70px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
        .tool-btn {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 10px;
          padding: 12px 8px;
          cursor: pointer;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 20px;
          transition: all 0.2s;
        }
        .tool-btn span {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
        }
        .tool-btn.active {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #fff;
        }
        .tool-btn.active span {
          color: #fff;
        }
        .tool-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .drawing-controls {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 100;
        }
        .control-btn {
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }
        .control-btn.finish {
          background: #10b981;
          color: #fff;
        }
        .control-btn.cancel {
          background: #ef4444;
          color: #fff;
        }
        .control-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        .control-btn:active {
          transform: translateY(0);
        }
        
        .object-palette {
          position: fixed;
          right: 12px;
          top: 80px;
          width: 120px;
          max-height: 480px;
          overflow-y: auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
        .palette-title {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          text-align: center;
        }
        .palette-item {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 8px;
          padding: 10px 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
          transition: all 0.2s;
        }
        .palette-item:last-child {
          margin-bottom: 0;
        }
        .palette-item.active {
          background: #7c3aed;
          border-color: #7c3aed;
        }
        .palette-item.active .item-label {
          color: #fff;
        }
        .item-icon {
          font-size: 24px;
        }
        .item-label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
        }
        .palette-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .card {
          width: 100%;
          max-width: 800px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .stage-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        
        .instructions {
          margin-top: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }
        
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          width: 300px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 16px;
          text-align: center;
        }
        .modal-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .modal-input:focus {
          outline: none;
          border-color: #7c3aed;
        }
        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn.primary {
          background: #7c3aed;
          color: #fff;
          border-color: #7c3aed;
        }
        .btn.ghost {
          background: #f9fafb;
        }
        .btn.wide {
          width: 100%;
        }
        .btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
