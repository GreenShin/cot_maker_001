import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  author: string;
  canEditUsers: boolean;
  canEditProducts: boolean;
  fontSize: number;
  theme: 'light' | 'dark';
  // UI 상태
  isLoaded: boolean;
}

const STORAGE_KEY = 'cotAdminSettings';

// 기본값
const initialState: SettingsState = {
  author: '관리자',
  canEditUsers: true,
  canEditProducts: true,
  fontSize: 14,
  theme: 'light',
  isLoaded: false
};

// 로컬 스토리지에서 설정 로드
const loadSettingsFromStorage = (): Partial<SettingsState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('설정 로드 실패:', error);
  }
  return {};
};

// 로컬 스토리지에 설정 저장
const saveSettingsToStorage = (settings: Omit<SettingsState, 'isLoaded'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('설정 저장 실패:', error);
  }
};

// CSS 변수 적용
const applyCSSVariables = (settings: SettingsState) => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--app-font-size', `${settings.fontSize}px`);
    document.documentElement.setAttribute('data-mui-color-scheme', settings.theme);
  }
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // 설정 초기화 (앱 시작 시)
    initializeSettings: (state) => {
      const storedSettings = loadSettingsFromStorage();
      Object.assign(state, { ...initialState, ...storedSettings, isLoaded: true });
      applyCSSVariables(state);
    },

    // 작성자 이름 변경
    setAuthor: (state, action: PayloadAction<string>) => {
      state.author = action.payload;
      saveSettingsToStorage(state);
    },

    // 질문자 수정 권한 토글
    toggleCanEditUsers: (state) => {
      state.canEditUsers = !state.canEditUsers;
      saveSettingsToStorage(state);
    },

    // 상품 수정 권한 토글
    toggleCanEditProducts: (state) => {
      state.canEditProducts = !state.canEditProducts;
      saveSettingsToStorage(state);
    },

    // 글꼴 크기 변경
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = Math.max(10, Math.min(24, action.payload)); // 10-24px 범위
      applyCSSVariables(state);
      saveSettingsToStorage(state);
    },

    // 테마 토글
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      applyCSSVariables(state);
      saveSettingsToStorage(state);
    },

    // 테마 직접 설정
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      applyCSSVariables(state);
      saveSettingsToStorage(state);
    },

    // 모든 설정 한 번에 업데이트
    updateSettings: (state, action: PayloadAction<Partial<Omit<SettingsState, 'isLoaded'>>>) => {
      Object.assign(state, action.payload);
      applyCSSVariables(state);
      saveSettingsToStorage(state);
    },

    // 기본값으로 초기화
    resetToDefaults: (state) => {
      Object.assign(state, { ...initialState, isLoaded: true });
      applyCSSVariables(state);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('설정 삭제 실패:', error);
      }
    }
  }
});

export const {
  initializeSettings,
  setAuthor,
  toggleCanEditUsers,
  toggleCanEditProducts,
  setFontSize,
  toggleTheme,
  setTheme,
  updateSettings,
  resetToDefaults
} = settingsSlice.actions;

export default settingsSlice.reducer;
