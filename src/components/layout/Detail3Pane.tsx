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

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 0, 
        height: '100%',
        minHeight: '600px'
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
          }}
        >
          {leftPanel}
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
        }}
      >
        {centerPanel}
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
          }}
        >
          {rightPanel}
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
