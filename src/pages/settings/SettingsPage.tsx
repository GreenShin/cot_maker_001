import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Button,
  Box,
  Stack,
  Divider
} from '@mui/material';
import type { RootState, AppDispatch } from '../../store';
import {
  initializeSettings,
  setAuthor,
  toggleCanEditUsers,
  toggleCanEditProducts,
  setFontSize,
  toggleTheme,
  resetToDefaults
} from '../../store/slices/settingsSlice';
import { useResizablePanels } from '../../hooks/useResizablePanels';
import { useTextareaHeights } from '../../hooks/useTextareaHeights';

export function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);
  const { resetPanelSizes } = useResizablePanels();
  const { resetHeights } = useTextareaHeights();

  // 설정 초기화는 App 컴포넌트에서 처리

  const handleAuthorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setAuthor(event.target.value));
  };

  const handleFontSizeChange = (_: Event, value: number | number[]) => {
    dispatch(setFontSize(value as number));
  };

  const handleReset = () => {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      dispatch(resetToDefaults());
    }
  };

  const handlePanelReset = () => {
    if (confirm('패널 크기를 기본값으로 초기화하시겠습니까?')) {
      resetPanelSizes();
    }
  };

  const handleTextareaReset = () => {
    if (confirm('텍스트 영역 높이를 기본값으로 초기화하시겠습니까?')) {
      resetHeights();
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        설정
      </Typography>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* 작성자 이름 */}
            <TextField
              label="작성자 이름"
              value={settings.author}
              onChange={handleAuthorChange}
              fullWidth
              helperText="새로 생성되는 CoT의 기본 작성자입니다"
            />

            {/* 수정 권한 토글들 */}
            <Box>
              <Typography variant="h6" gutterBottom>
                수정 권한
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.canEditUsers}
                      onChange={() => dispatch(toggleCanEditUsers())}
                      inputProps={{ role: 'switch' }}
                    />
                  }
                  label="질문자 수정가능"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.canEditProducts}
                      onChange={() => dispatch(toggleCanEditProducts())}
                      inputProps={{ role: 'switch' }}
                    />
                  }
                  label="상품 수정가능"
                />
              </Stack>
            </Box>

            {/* 글꼴 크기 슬라이더 */}
            <Box>
              <Typography variant="h6" gutterBottom>
                글꼴 크기: {settings.fontSize}px
              </Typography>
              <Slider
                value={settings.fontSize}
                onChange={handleFontSizeChange}
                min={10}
                max={24}
                step={1}
                marks={[
                  { value: 10, label: '10px' },
                  { value: 14, label: '14px' },
                  { value: 18, label: '18px' },
                  { value: 24, label: '24px' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* 다크 모드 토글 */}
            <FormControlLabel
              control={
                <Switch
                  checked={settings.theme === 'dark'}
                  onChange={() => dispatch(toggleTheme())}
                  inputProps={{ role: 'switch' }}
                />
              }
              label="다크 모드"
            />

            {/* 초기화 버튼 */}
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handlePanelReset}
                  fullWidth
                >
                  패널 크기 초기화
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleTextareaReset}
                  fullWidth
                >
                  텍스트 영역 높이 초기화
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleReset}
                  fullWidth
                >
                  모든 설정 초기화
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
    </Box>
  );
}


