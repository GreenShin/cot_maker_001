import React, { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

interface TextareaResizerProps {
  onResize: (deltaPx: number) => void;
}

export function TextareaResizer({ onResize }: TextareaResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startYRef = useRef<number>(0);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    startYRef.current = event.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startYRef.current;
      // 픽셀 단위로 직접 전달 (부드러운 리사이징)
      if (Math.abs(deltaY) >= 1) { // 최소 1px 이동시에만 업데이트
        onResize(deltaY);
        startYRef.current = e.clientY;
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
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [onResize]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'absolute',
        bottom: '-6px',
        left: 0,
        right: 0,
        height: '12px',
        cursor: 'row-resize',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // 시각적 피드백
        backgroundColor: isDragging 
          ? 'rgba(25, 118, 210, 0.3)' 
          : isHovering 
            ? 'rgba(25, 118, 210, 0.1)' 
            : 'transparent',
        borderTop: '2px solid',
        borderColor: isDragging 
          ? 'primary.main' 
          : isHovering 
            ? 'primary.light' 
            : 'transparent',
        transition: 'all 0.15s ease',
        opacity: isDragging || isHovering ? 1 : 0,
        '&:hover': {
          opacity: 1,
          backgroundColor: 'rgba(25, 118, 210, 0.15)',
        },
        '&:active': {
          backgroundColor: 'rgba(25, 118, 210, 0.4)',
        },
      }}
    >
      {/* 드래그 힌트 아이콘 */}
      {(isDragging || isHovering) && (
        <DragIndicator
          sx={{
            fontSize: '14px',
            color: 'primary.main',
            opacity: isDragging ? 1 : 0.7,
          }}
        />
      )}
    </Box>
  );
}
