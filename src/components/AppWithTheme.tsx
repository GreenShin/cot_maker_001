import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { App } from '../app/App';
import { lightTheme, darkTheme } from '../styles/theme';
import type { RootState } from '../store';

export function AppWithTheme() {
  const settings = useSelector((state: RootState) => state.settings);

  // 설정에 따라 동적으로 테마 생성
  const currentTheme = useMemo(() => {
    const baseTheme = settings.theme === 'dark' ? darkTheme : lightTheme;
    
    return createTheme({
      ...baseTheme,
      typography: {
        ...baseTheme.typography,
        fontSize: settings.fontSize || 14,
        // 모든 텍스트 요소에 폰트 크기 적용
        h1: { fontSize: `${(settings.fontSize || 14) * 2.125}px` },
        h2: { fontSize: `${(settings.fontSize || 14) * 1.875}px` },
        h3: { fontSize: `${(settings.fontSize || 14) * 1.5}px` },
        h4: { fontSize: `${(settings.fontSize || 14) * 1.25}px` },
        h5: { fontSize: `${(settings.fontSize || 14) * 1.125}px` },
        h6: { fontSize: `${(settings.fontSize || 14)}px` },
        body1: { fontSize: `${settings.fontSize || 14}px` },
        body2: { fontSize: `${(settings.fontSize || 14) * 0.875}px` },
        button: { fontSize: `${(settings.fontSize || 14) * 0.875}px` },
        caption: { fontSize: `${(settings.fontSize || 14) * 0.75}px` },
        overline: { fontSize: `${(settings.fontSize || 14) * 0.75}px` },
      },
      components: {
        ...baseTheme.components,
        // MUI 컴포넌트들의 기본 폰트 크기 오버라이드
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiInputBase-input': {
                fontSize: `${settings.fontSize || 14}px`,
                outline: 'none !important',
                border: 'none !important',
              },
              '& .MuiInputLabel-root': {
                fontSize: `${settings.fontSize || 14}px`,
              },
              '& .MuiOutlinedInput-root': {
                outline: 'none !important',
                '&:focus-within': {
                  outline: 'none !important',
                },
                '& input:focus': {
                  outline: 'none !important',
                  border: 'none !important',
                  boxShadow: 'none !important',
                },
                '& textarea:focus': {
                  outline: 'none !important',
                  border: 'none !important',
                  boxShadow: 'none !important',
                },
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-notchedOutline': {
                outline: 'none !important',
              },
              '&:focus': {
                outline: 'none !important',
              },
              '&.Mui-focused': {
                outline: 'none !important',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              ...(settings.theme === 'dark' && {
                backgroundColor: '#161b22',
                color: '#f0f6fc',
                border: '1px solid #30363d',
              }),
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              fontSize: `${(settings.fontSize || 14) * 0.875}px`,
            },
            outlined: {
              ...(settings.theme === 'dark' && {
                borderColor: '#30363d',
                color: '#f0f6fc',
                backgroundColor: '#21262d',
                '&:hover': {
                  borderColor: '#8b949e',
                  backgroundColor: '#30363d',
                },
              }),
            },
          },
        },
        // DataGrid 스타일은 CSS에서 처리
        MuiTypography: {
          styleOverrides: {
            root: {
              fontSize: 'inherit', // 부모로부터 상속받도록
            },
          },
        },
      },
    });
  }, [settings.theme, settings.fontSize]);

  return (
    <ThemeProvider theme={currentTheme}>
      <App />
    </ThemeProvider>
  );
}
