import React, { useState, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

interface EdgeResizerProps {
  onResize: (delta: number) => void;
  direction: 'left' | 'right';
  position: 'left-edge' | 'right-edge';
}

export function EdgeResizer({ onResize, direction, position }: EdgeResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startXRef = useRef<number>(0);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    startXRef.current = event.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const adjustedDelta = direction === 'left' ? delta : -delta;
      onResize(adjustedDelta);
      startXRef.current = e.clientX;
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
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onResize, direction]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const isLeftEdge = position === 'left-edge';
  const isRightEdge = position === 'right-edge';

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '8px',
        cursor: 'col-resize',
        zIndex: 10,
        // 위치 설정
        ...(isLeftEdge && { right: '-4px' }),
        ...(isRightEdge && { left: '-4px' }),
        // 시각적 피드백
        backgroundColor: isDragging 
          ? 'rgba(25, 118, 210, 0.3)' 
          : isHovering 
            ? 'rgba(25, 118, 210, 0.1)' 
            : 'transparent',
        borderLeft: isRightEdge ? '2px solid' : 'none',
        borderRight: isLeftEdge ? '2px solid' : 'none',
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
            fontSize: '16px',
            color: 'primary.main',
            transform: 'rotate(90deg)',
            opacity: isDragging ? 1 : 0.7,
          }}
        />
      )}
    </Box>
  );
}
