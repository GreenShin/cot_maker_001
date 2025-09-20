import { Box, Paper } from '@mui/material';
import { EdgeResizer } from '../common/EdgeResizer';
import { useResizablePanels } from '../../hooks/useResizablePanels';

interface Detail3PaneProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function Detail3Pane({ leftPanel, centerPanel, rightPanel }: Detail3PaneProps) {
  const { panelSizes, adjustLeftWidth, adjustRightWidth } = useResizablePanels();

  // 중앙 패널 전용 스크롤바 스타일
  const centerScrollBoxSx = {
    height: '100%', 
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
    },
  };

  // 사이드 패널용 스타일 (스크롤 없음)
  const sideBoxSx = {
    height: '100%',
    overflow: 'hidden',
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 0, 
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 왼쪽 패널 - 질문자 검색/선택 */}
      <Box 
        sx={{ 
          width: `${panelSizes.leftWidth}px`,
          minWidth: `${panelSizes.leftWidth}px`,
          maxWidth: `${panelSizes.leftWidth}px`,
          position: 'relative',
        }}
      >
        <Paper 
          sx={{ 
            width: '100%',
            height: '100%',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '4px 0 0 4px',
            overflow: 'hidden',
          }}
        >
          <Box sx={sideBoxSx}>
            {leftPanel}
          </Box>
        </Paper>
        {/* 왼쪽 패널의 오른쪽 모서리 리사이저 */}
        <EdgeResizer 
          onResize={adjustLeftWidth}
          direction="left"
          position="left-edge"
        />
      </Box>

      {/* 중앙 패널 - CoT 데이터 입력 */}
      <Paper 
        sx={{ 
          flex: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <Box sx={centerScrollBoxSx}>
          {centerPanel}
        </Box>
      </Paper>

      {/* 오른쪽 패널 - 상품 검색/선택 */}
      <Box 
        sx={{ 
          width: `${panelSizes.rightWidth}px`,
          minWidth: `${panelSizes.rightWidth}px`,
          maxWidth: `${panelSizes.rightWidth}px`,
          position: 'relative',
        }}
      >
        <Paper 
          sx={{ 
            width: '100%',
            height: '100%',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0 4px 4px 0',
            overflow: 'hidden',
          }}
        >
          <Box sx={sideBoxSx}>
            {rightPanel}
          </Box>
        </Paper>
        {/* 오른쪽 패널의 왼쪽 모서리 리사이저 */}
        <EdgeResizer 
          onResize={adjustRightWidth}
          direction="right"
          position="right-edge"
        />
      </Box>
    </Box>
  );
}
