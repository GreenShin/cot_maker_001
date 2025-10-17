import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 탭 콘텐츠 인터페이스
export interface TabContent {
  questionerJudgment: string;
  question: string;
  cot1: string;
  cot2: string;
  cot3: string;
  answer: string;
}

// 증권 탭 타입
export type SecuritiesTabType = '고객특성강조형' | '투자성향조건기반형' | '상품비교추천형';

// 보험 탭 타입
export type InsuranceTabType = '연령별생애주기저축성' | '투자성상품추천형' | '건강질병보장대비형';

export interface SettingsState {
  author: string;
  category: '증권' | '보험'; // 상품분류
  currentTab: {
    증권: SecuritiesTabType;
    보험: InsuranceTabType;
  };
  tabs: {
    증권: Record<SecuritiesTabType, TabContent>;
    보험: Record<InsuranceTabType, TabContent>;
  };
  fontSize: number;
  theme: 'light' | 'dark';
  // UI 상태
  isLoaded: boolean;
}

const STORAGE_KEY = 'cotAdminSettings';

// 빈 탭 콘텐츠
const emptyTabContent: TabContent = {
  questionerJudgment: '',
  question: '',
  cot1: '',
  cot2: '',
  cot3: '',
  answer: ''
};

// 기본값
const initialState: SettingsState = {
  author: '관리자',
  category: '증권',
  currentTab: {
    증권: '고객특성강조형',
    보험: '연령별생애주기저축성'
  },
  tabs: {
    증권: {
      고객특성강조형: { ...emptyTabContent },
      투자성향조건기반형: { ...emptyTabContent },
      상품비교추천형: { ...emptyTabContent }
    },
    보험: {
      연령별생애주기저축성: { ...emptyTabContent },
      투자성상품추천형: { ...emptyTabContent },
      건강질병보장대비형: { ...emptyTabContent }
    }
  },
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
    // CSS 변수 설정
    document.documentElement.style.setProperty('--app-font-size', `${settings.fontSize}px`);
    
    // 테마 속성 설정
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-mui-color-scheme', settings.theme);
    
    // 바디에 테마 클래스 적용
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${settings.theme}`);
    
    // 바디 배경색 직접 적용 (GitHub 다크모드 색상)
    if (settings.theme === 'dark') {
      document.body.style.backgroundColor = '#0d1117';
      document.body.style.color = '#f0f6fc';
    } else {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
    
    // 폰트 크기 클래스 적용
    document.body.className = document.body.className.replace(/app-font-size-\d+/g, '');
    document.body.classList.add(`app-font-size-${settings.fontSize}`);
    
    // 디버깅을 위한 로그
    console.log('Settings applied:', {
      fontSize: settings.fontSize,
      theme: settings.theme,
      bodyClasses: document.body.className
    });
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

    // 카테고리 변경
    setCategory: (state, action: PayloadAction<'증권' | '보험'>) => {
      state.category = action.payload;
      saveSettingsToStorage(state);
    },

    // 현재 탭 변경
    setCurrentTab: (state, action: PayloadAction<{ category: '증권' | '보험'; tab: SecuritiesTabType | InsuranceTabType }>) => {
      const { category, tab } = action.payload;
      if (category === '증권') {
        state.currentTab.증권 = tab as SecuritiesTabType;
      } else {
        state.currentTab.보험 = tab as InsuranceTabType;
      }
      saveSettingsToStorage(state);
    },

    // 탭 콘텐츠 필드 업데이트
    setTabField: (state, action: PayloadAction<{
      category: '증권' | '보험';
      tab: SecuritiesTabType | InsuranceTabType;
      field: keyof TabContent;
      value: string;
    }>) => {
      const { category, tab, field, value } = action.payload;
      if (category === '증권') {
        state.tabs.증권[tab as SecuritiesTabType][field] = value;
      } else {
        state.tabs.보험[tab as InsuranceTabType][field] = value;
      }
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
  setCategory,
  setCurrentTab,
  setTabField,
  setFontSize,
  toggleTheme,
  setTheme,
  updateSettings,
  resetToDefaults
} = settingsSlice.actions;

export default settingsSlice.reducer;
