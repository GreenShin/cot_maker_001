import { Box, Paper, Divider } from '@mui/material';

interface Detail3PaneProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function Detail3Pane({ leftPanel, centerPanel, rightPanel }: Detail3PaneProps) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 2, 
        height: '100%',
        minHeight: '600px'
      }}
    >
      {/* 왼쪽 패널 - 질문자 검색/선택 */}
      <Paper 
        sx={{ 
          flex: '0 0 300px',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {leftPanel}
      </Paper>

      {/* 중앙 패널 - CoT 데이터 입력 */}
      <Paper 
        sx={{ 
          flex: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {centerPanel}
      </Paper>

      {/* 오른쪽 패널 - 상품 검색/선택 */}
      <Paper 
        sx={{ 
          flex: '0 0 300px',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {rightPanel}
      </Paper>
    </Box>
  );
}
