import { useState, useEffect, useCallback } from 'react';

interface TextareaHeights {
  question: number;
  cot1: number;
  cot2: number;
  cot3: number;
  answer: number;
  [key: string]: number; // 동적 CoTn 필드를 위한 인덱스 시그니처
}

const STORAGE_KEY = 'cot-textarea-heights';
const DEFAULT_HEIGHT_ROWS = 3; // 기본 row 수
const MIN_HEIGHT_ROWS = 2;
const MAX_HEIGHT_ROWS = 12;
const ROW_HEIGHT_PX = 24; // 한 줄당 픽셀 높이 (대략적)

// 픽셀 단위로 기본 높이 계산
const DEFAULT_HEIGHT_PX = DEFAULT_HEIGHT_ROWS * ROW_HEIGHT_PX;
const MIN_HEIGHT_PX = MIN_HEIGHT_ROWS * ROW_HEIGHT_PX;
const MAX_HEIGHT_PX = MAX_HEIGHT_ROWS * ROW_HEIGHT_PX;

const defaultHeights: TextareaHeights = {
  question: DEFAULT_HEIGHT_PX,
  cot1: DEFAULT_HEIGHT_PX,
  cot2: DEFAULT_HEIGHT_PX,
  cot3: DEFAULT_HEIGHT_PX,
  answer: 4 * ROW_HEIGHT_PX, // 답변은 조금 더 크게
};

export function useTextareaHeights() {
  const [heights, setHeights] = useState<TextareaHeights>(defaultHeights);

  // localStorage에서 높이 로드
  useEffect(() => {
    try {
      const savedHeights = localStorage.getItem(STORAGE_KEY);
      if (savedHeights) {
        const parsedHeights: TextareaHeights = JSON.parse(savedHeights);
        
        // 유효성 검사 및 기본값 병합
        const validatedHeights: TextareaHeights = { ...defaultHeights };
        
        Object.keys(parsedHeights).forEach(key => {
          const height = parsedHeights[key];
          if (typeof height === 'number' && height >= MIN_HEIGHT_PX && height <= MAX_HEIGHT_PX) {
            validatedHeights[key] = height;
          }
        });
        
        setHeights(validatedHeights);
      }
    } catch (error) {
      console.error('textarea 높이 로드 실패:', error);
    }
  }, []);

  // localStorage에 높이 저장
  const saveHeights = useCallback((newHeights: TextareaHeights) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHeights));
    } catch (error) {
      console.error('textarea 높이 저장 실패:', error);
    }
  }, []);

  // 특정 필드의 높이 설정 (픽셀 단위)
  const setFieldHeight = useCallback((fieldName: string, heightPx: number) => {
    const clampedHeight = Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, heightPx));
    setHeights(prevHeights => {
      const newHeights = { ...prevHeights, [fieldName]: clampedHeight };
      saveHeights(newHeights);
      return newHeights;
    });
  }, [saveHeights]);

  // 특정 필드의 높이 델타로 조정 (픽셀 단위)
  const adjustFieldHeight = useCallback((fieldName: string, deltaPx: number) => {
    setHeights(prevHeights => {
      const currentHeight = prevHeights[fieldName] || DEFAULT_HEIGHT_PX;
      const newHeight = Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, currentHeight + deltaPx));
      const newHeights = { ...prevHeights, [fieldName]: newHeight };
      saveHeights(newHeights);
      return newHeights;
    });
  }, [saveHeights]);

  // 모든 높이 리셋
  const resetHeights = useCallback(() => {
    setHeights(defaultHeights);
    saveHeights(defaultHeights);
  }, [saveHeights]);

  // 동적 CoT 필드의 높이 가져오기 (픽셀 단위)
  const getFieldHeight = useCallback((fieldName: string): number => {
    return heights[fieldName] || DEFAULT_HEIGHT_PX;
  }, [heights]);

  // 픽셀을 rows로 변환 (TextField의 rows prop용)
  const getFieldRows = useCallback((fieldName: string): number => {
    const heightPx = heights[fieldName] || DEFAULT_HEIGHT_PX;
    return Math.round(heightPx / ROW_HEIGHT_PX);
  }, [heights]);

  return {
    heights,
    setFieldHeight,
    adjustFieldHeight,
    resetHeights,
    getFieldHeight,
    getFieldRows,
    minHeight: MIN_HEIGHT_PX,
    maxHeight: MAX_HEIGHT_PX,
    rowHeight: ROW_HEIGHT_PX,
  };
}
