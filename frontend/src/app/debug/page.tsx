"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [envVars, setEnvVars] = useState({
    kakaoKey: "",
    apiUrl: "",
  });

  useEffect(() => {
    // 환경변수 확인
    setEnvVars({
      kakaoKey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || "NOT FOUND",
      apiUrl: process.env.NEXT_PUBLIC_API_URL || "NOT FOUND",
    });

    // 카카오 SDK 로딩 확인
    const checkKakao = () => {
      if (window.kakao && window.kakao.maps) {
        setKakaoLoaded(true);
        console.log("✅ Kakao Maps SDK is loaded");
      } else {
        console.log("❌ Kakao Maps SDK is NOT loaded");
      }
    };

    // 즉시 체크
    checkKakao();

    // 3초 후 재체크
    const timer = setTimeout(checkKakao, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>🔍 디버그 페이지</h1>
      
      <h2>1. 환경변수 확인</h2>
      <pre style={{ background: "#f5f5f5", padding: "10px", borderRadius: "5px" }}>
        NEXT_PUBLIC_KAKAO_MAP_API_KEY: {envVars.kakaoKey}
        {"\n"}
        NEXT_PUBLIC_API_URL: {envVars.apiUrl}
      </pre>

      <h2>2. 카카오 SDK 로딩 상태</h2>
      <div style={{ 
        padding: "10px", 
        borderRadius: "5px", 
        background: kakaoLoaded ? "#d4edda" : "#f8d7da",
        color: kakaoLoaded ? "#155724" : "#721c24"
      }}>
        {kakaoLoaded ? "✅ Kakao Maps SDK 로드됨" : "❌ Kakao Maps SDK 로드 안됨"}
      </div>

      <h2>3. window.kakao 객체</h2>
      <pre style={{ background: "#f5f5f5", padding: "10px", borderRadius: "5px" }}>
        {typeof window !== "undefined" && window.kakao 
          ? JSON.stringify(Object.keys(window.kakao), null, 2)
          : "window.kakao가 없습니다"}
      </pre>

      <h2>4. 해결 방법</h2>
      <ol>
        <li><code>frontend/.env.local</code> 파일 확인</li>
        <li>Next.js 서버 재시작 (Ctrl+C 후 <code>npm run dev</code>)</li>
        <li>브라우저 새로고침 (Ctrl+Shift+R)</li>
        <li>브라우저 콘솔 확인 (F12)</li>
      </ol>

      <h2>5. 카카오 개발자 콘솔 확인</h2>
      <p>
        <a 
          href="https://developers.kakao.com/console/app" 
          target="_blank"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          카카오 개발자 콘솔
        </a>
        {" "}에서 도메인 등록 확인:
      </p>
      <ul>
        <li><code>http://localhost:3000</code></li>
      </ul>
    </div>
  );
}

