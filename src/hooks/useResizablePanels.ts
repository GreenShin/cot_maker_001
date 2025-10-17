import { useState, useEffect, useCallback } from 'react';

interface PanelSizes {
  leftWidth: number;
  rightWidth: number;
}

const STORAGE_KEY = 'cot-panel-sizes';
const DEFAULT_LEFT_WIDTH = 300;
const DEFAULT_RIGHT_WIDTH = 300;
const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 600;

export function useResizablePanels() {
  const [panelSizes, setPanelSizes] = useState<PanelSizes>({
    leftWidth: DEFAULT_LEFT_WIDTH,
    rightWidth: DEFAULT_RIGHT_WIDTH,
  });

  // localStorage에서 패널 크기 로드
  useEffect(() => {
    try {
      const savedSizes = localStorage.getItem(STORAGE_KEY);
      if (savedSizes) {
        const parsedSizes: PanelSizes = JSON.parse(savedSizes);
        
        // 유효성 검사
        const leftWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, parsedSizes.leftWidth));
        const rightWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, parsedSizes.rightWidth));
        
        setPanelSizes({ leftWidth, rightWidth });
      }
    } catch (error) {
      console.error('패널 크기 로드 실패:', error);
    }
  }, []);

  // localStorage에 패널 크기 저장
  const savePanelSizes = useCallback((sizes: PanelSizes) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
    } catch (error) {
      console.error('패널 크기 저장 실패:', error);
    }
  }, []);

  // 왼쪽 패널 크기 변경
  const setLeftWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
    setPanelSizes(prevSizes => {
      const newSizes = { ...prevSizes, leftWidth: clampedWidth };
      savePanelSizes(newSizes);
      return newSizes;
    });
  }, [savePanelSizes]);

  // 왼쪽 패널 크기 델타로 변경
  const adjustLeftWidth = useCallback((delta: number) => {
    setPanelSizes(prevSizes => {
      const newWidth = prevSizes.leftWidth + delta;
      const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));
      const newSizes = { ...prevSizes, leftWidth: clampedWidth };
      savePanelSizes(newSizes);
      return newSizes;
    });
  }, [savePanelSizes]);

  // 오른쪽 패널 크기 변경
  const setRightWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
    setPanelSizes(prevSizes => {
      const newSizes = { ...prevSizes, rightWidth: clampedWidth };
      savePanelSizes(newSizes);
      return newSizes;
    });
  }, [savePanelSizes]);

  // 오른쪽 패널 크기 델타로 변경
  const adjustRightWidth = useCallback((delta: number) => {
    setPanelSizes(prevSizes => {
      const newWidth = prevSizes.rightWidth + delta;
      const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));
      const newSizes = { ...prevSizes, rightWidth: clampedWidth };
      savePanelSizes(newSizes);
      return newSizes;
    });
  }, [savePanelSizes]);

  // 패널 크기 리셋
  const resetPanelSizes = useCallback(() => {
    const defaultSizes = {
      leftWidth: DEFAULT_LEFT_WIDTH,
      rightWidth: DEFAULT_RIGHT_WIDTH,
    };
    setPanelSizes(defaultSizes);
    savePanelSizes(defaultSizes);
  }, [savePanelSizes]);

  return {
    panelSizes,
    setLeftWidth,
    setRightWidth,
    adjustLeftWidth,
    adjustRightWidth,
    resetPanelSizes,
    minWidth: MIN_PANEL_WIDTH,
    maxWidth: MAX_PANEL_WIDTH,
  };
}
