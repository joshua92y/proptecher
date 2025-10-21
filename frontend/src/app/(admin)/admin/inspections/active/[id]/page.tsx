"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import MobileLayout from "@/components/MobileLayout";

export default function InspectionProgressPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const [progress, setProgress] = useState(0);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("임장 진행 상황");

  useEffect(() => {
    // TODO: API에서 데이터 가져오기
    setProgress(50);
    setMemo("전반적으로 상태 양호\n옵션 리스트 첨부");
    setTitle("서울 강남구 아파트");
  }, [inspectionId]);

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("✅ 저장되었습니다!");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("❌ 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("임장을 완료 처리하시겠습니까?\n완료 후에는 수정할 수 없습니다.")) return;

    try {
      setSaving(true);
      // TODO: API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("✅ 임장이 완료되었습니다!");
      router.push("/admin/inspections");
    } catch (error) {
      console.error("완료 처리 실패:", error);
      alert("❌ 완료 처리에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getProgressColor = (prog: number) => {
    if (prog < 26) return "#FF6B6B";
    if (prog < 51) return "#FFA94D";
    if (prog < 76) return "#FFD43B";
    return "#51CF66";
  };

  const progressSteps = [0, 25, 50, 75, 100];

  return (
    <MobileLayout showBottomNav={false}>
      <Container>
        <Header>
          <BackButton onClick={() => router.back()}>←</BackButton>
          <HeaderTitle>{title}</HeaderTitle>
          <div style={{ width: 40 }} />
        </Header>

        <Content>
          <Section>
            <SectionTitle>📊 진행률</SectionTitle>
            <ProgressDisplay>
              <ProgressBar>
                <ProgressFill $progress={progress} $color={getProgressColor(progress)} />
              </ProgressBar>
              <ProgressPercent $color={getProgressColor(progress)}>
                {progress}%
              </ProgressPercent>
            </ProgressDisplay>
            
            <ProgressButtons>
              {progressSteps.map((step) => (
                <ProgressButton
                  key={step}
                  $active={progress === step}
                  onClick={() => handleProgressChange(step)}
                >
                  {step}%
                </ProgressButton>
              ))}
            </ProgressButtons>
          </Section>

          <Divider />

          <Section>
            <SectionTitle>📷 평면도 업로드</SectionTitle>
            <FileUploadArea>
              <FileInput type="file" id="floorplan" accept="image/*" />
              <FileLabel htmlFor="floorplan">
                <UploadIcon>📁</UploadIcon>
                <UploadText>파일 선택</UploadText>
              </FileLabel>
              <FileName>floor_plan.jpg ✅</FileName>
            </FileUploadArea>
          </Section>

          <Divider />

          <Section>
            <SectionTitle>📄 리포트 업로드</SectionTitle>
            <FileUploadArea>
              <FileInput type="file" id="report" accept=".pdf,.doc,.docx" />
              <FileLabel htmlFor="report">
                <UploadIcon>📁</UploadIcon>
                <UploadText>파일 선택</UploadText>
              </FileLabel>
              <FileName>inspection_report.pdf</FileName>
            </FileUploadArea>
          </Section>

          <Divider />

          <Section>
            <SectionTitle>💬 메모</SectionTitle>
            <MemoTextarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="임장 메모를 작성하세요..."
              rows={6}
            />
          </Section>
        </Content>

        <ButtonGroup>
          <SaveButton onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장하기"}
          </SaveButton>
          <CompleteButton onClick={handleComplete} disabled={saving || progress < 100}>
            {saving ? "처리 중..." : "완료하기"}
          </CompleteButton>
        </ButtonGroup>
      </Container>
    </MobileLayout>
  );
}

// Styled Components
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  animation: ${fadeIn} 0.3s ease;
  padding-bottom: 100px;
`;

const Header = styled.div`
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  color: #333;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.9);
  }
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Content = styled.div`
  padding: 20px;
  animation: ${slideUp} 0.4s ease;
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
`;

const ProgressDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number; $color: string }>`
  width: ${(props) => props.$progress}%;
  height: 100%;
  background: ${(props) => props.$color};
  transition: all 0.3s ease;
  border-radius: 6px;
`;

const ProgressPercent = styled.span<{ $color: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${(props) => props.$color};
  min-width: 60px;
  text-align: right;
`;

const ProgressButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ProgressButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  border: 2px solid ${(props) => (props.$active ? "#667eea" : "#ddd")};
  background: ${(props) => (props.$active ? "#667eea" : "white")};
  color: ${(props) => (props.$active ? "white" : "#666")};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FileUploadArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border: 2px dashed #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
`;

const UploadIcon = styled.span`
  font-size: 24px;
`;

const UploadText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #666;
`;

const FileName = styled.div`
  font-size: 13px;
  color: #667eea;
  padding: 8px 12px;
  background: #f8f9ff;
  border-radius: 8px;
`;

const MemoTextarea = styled.textarea`
  width: 100%;
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 24px 0;
`;

const ButtonGroup = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const BaseButton = styled.button`
  flex: 1;
  height: 52px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const SaveButton = styled(BaseButton)`
  background: white;
  color: #667eea;
  border: 2px solid #667eea;

  &:hover:not(:disabled) {
    background: #f8f9ff;
  }
`;

const CompleteButton = styled(BaseButton)`
  background: linear-gradient(135deg, #51CF66 0%, #37B24D 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(81, 207, 102, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(81, 207, 102, 0.4);
  }
`;

