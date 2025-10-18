import React, { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

interface PanelResizerProps {
  onResize: (deltaY: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function PanelResizer({ onResize, orientation = 'horizontal' }: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startPosRef = useRef<number>(0);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    
    if (orientation === 'horizontal') {
      startPosRef.current = event.clientY;
    } else {
      startPosRef.current = event.clientX;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const delta = orientation === 'horizontal' 
        ? e.clientY - startPosRef.current
        : e.clientX - startPosRef.current;
        
      if (Math.abs(delta) >= 1) {
        onResize(delta);
        startPosRef.current = orientation === 'horizontal' ? e.clientY : e.clientX;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = orientation === 'horizontal' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onResize, orientation]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        flexShrink: 0,
        ...(isHorizontal ? {
          width: '100%',
          height: '8px',
          cursor: 'row-resize',
        } : {
          width: '8px',
          height: '100%',
          cursor: 'col-resize',
        }),
        zIndex: 100, // 더 높은 z-index로 확실히 클릭 가능하도록
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // 기본 상태에서도 보이도록 설정
        backgroundColor: isDragging 
          ? 'rgba(25, 118, 210, 0.3)' 
          : isHovering 
            ? 'rgba(25, 118, 210, 0.2)' 
            : 'rgba(0, 0, 0, 0.08)', // 기본 상태에서도 약간 보이도록
        borderTop: isHorizontal ? '1px solid' : 'none',
        borderBottom: isHorizontal ? '1px solid' : 'none',
        borderLeft: !isHorizontal ? '1px solid' : 'none',
        borderRight: !isHorizontal ? '1px solid' : 'none',
        borderColor: isDragging 
          ? 'primary.main' 
          : isHovering 
            ? 'primary.light' 
            : 'divider', // 기본 상태에서도 테두리 표시
        transition: 'all 0.15s ease',
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.25)',
          borderColor: 'primary.light',
        },
        '&:active': {
          backgroundColor: 'rgba(25, 118, 210, 0.4)',
          borderColor: 'primary.main',
        },
      }}
    >
      {/* 드래그 힌트 아이콘 - 항상 표시 */}
      <DragIndicator
        sx={{
          fontSize: '16px',
          color: isDragging 
            ? 'primary.main' 
            : isHovering 
              ? 'primary.main' 
              : 'text.disabled', // 기본 상태에서도 표시
          opacity: isDragging ? 1 : isHovering ? 0.8 : 0.4, // 기본 상태 투명도
          transform: isHorizontal ? 'rotate(90deg)' : 'none',
          transition: 'all 0.15s ease',
        }}
      />
    </Box>
  );
}

