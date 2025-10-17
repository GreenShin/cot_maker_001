import { createTheme } from '@mui/material/styles';

// 라이트 테마
export const lightTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
  },
  typography: {
    fontSize: 14, // 기본 폰트 크기
  },
});

// 다크 테마
export const darkTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    background: {
      default: '#0d1117',  // GitHub 다크 메인 배경
      paper: '#161b22',    // GitHub 다크 카드/Paper 배경
    },
    text: {
      primary: '#f0f6fc',  // GitHub 다크 주요 텍스트
      secondary: '#8b949e', // GitHub 다크 보조 텍스트
    },
    primary: {
      main: '#58a6ff',     // GitHub 다크 액센트 블루
    },
    secondary: {
      main: '#f85149',     // GitHub 다크 레드 액센트
    },
    divider: '#30363d',   // GitHub 다크 테두리/구분선
  },
  typography: {
    fontSize: 14, // 기본 폰트 크기
  },
});

// 기본 테마 (라이트)
export const theme = lightTheme;


