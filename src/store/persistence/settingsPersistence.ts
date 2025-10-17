import { SettingsState, TabContent } from '../slices/settingsSlice';

// LocalStorage 키 (settingsSlice.ts의 STORAGE_KEY와 동일해야 함)
const SETTINGS_STORAGE_KEY = 'cotAdminSettings';

// 빈 탭 콘텐츠
const emptyTabContent: TabContent = {
  questionerJudgment: '',
  question: '',
  cot1: '',
  cot2: '',
  cot3: '',
  answer: ''
};

// 기본 설정값
export const defaultSettings: SettingsState = {
  author: '',
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
  isLoaded: false,
};

// 설정 저장
export const saveSettings = (settings: SettingsState): void => {
  try {
    // 저장할 설정 데이터 (isLoaded 제외)
    const settingsToSave: Omit<SettingsState, 'isLoaded'> = {
      author: settings.author,
      category: settings.category,
      currentTab: settings.currentTab,
      tabs: settings.tabs,
      fontSize: settings.fontSize,
      theme: settings.theme,
    };

    const serialized = JSON.stringify(settingsToSave);
    localStorage.setItem(SETTINGS_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('설정 저장 실패:', error);
  }
};

// 설정 로드
export const loadSettings = (): SettingsState => {
  try {
    const serialized = localStorage.getItem(SETTINGS_STORAGE_KEY);
    
    if (serialized === null) {
      return defaultSettings;
    }

    const parsed = JSON.parse(serialized);
    
    // 탭 콘텐츠 검증 함수
    const validateTabContent = (content: any): TabContent => {
      if (!content || typeof content !== 'object') {
        return { ...emptyTabContent };
      }
      return {
        questionerJudgment: typeof content.questionerJudgment === 'string' ? content.questionerJudgment : '',
        question: typeof content.question === 'string' ? content.question : '',
        cot1: typeof content.cot1 === 'string' ? content.cot1 : '',
        cot2: typeof content.cot2 === 'string' ? content.cot2 : '',
        cot3: typeof content.cot3 === 'string' ? content.cot3 : '',
        answer: typeof content.answer === 'string' ? content.answer : ''
      };
    };

    // 타입 검증 및 기본값 병합
    const settings: SettingsState = {
      author: typeof parsed.author === 'string' ? parsed.author : defaultSettings.author,
      category: (parsed.category === '증권' || parsed.category === '보험')
        ? parsed.category
        : defaultSettings.category,
      currentTab: {
        증권: parsed.currentTab?.증권 && ['고객특성강조형', '투자성향조건기반형', '상품비교추천형'].includes(parsed.currentTab.증권)
          ? parsed.currentTab.증권
          : defaultSettings.currentTab.증권,
        보험: parsed.currentTab?.보험 && ['연령별생애주기저축성', '투자성상품추천형', '건강질병보장대비형'].includes(parsed.currentTab.보험)
          ? parsed.currentTab.보험
          : defaultSettings.currentTab.보험
      },
      tabs: {
        증권: {
          고객특성강조형: validateTabContent(parsed.tabs?.증권?.고객특성강조형),
          투자성향조건기반형: validateTabContent(parsed.tabs?.증권?.투자성향조건기반형),
          상품비교추천형: validateTabContent(parsed.tabs?.증권?.상품비교추천형)
        },
        보험: {
          연령별생애주기저축성: validateTabContent(parsed.tabs?.보험?.연령별생애주기저축성),
          투자성상품추천형: validateTabContent(parsed.tabs?.보험?.투자성상품추천형),
          건강질병보장대비형: validateTabContent(parsed.tabs?.보험?.건강질병보장대비형)
        }
      },
      fontSize: typeof parsed.fontSize === 'number' && parsed.fontSize >= 10 && parsed.fontSize <= 24 
        ? parsed.fontSize 
        : defaultSettings.fontSize,
      theme: (parsed.theme === 'light' || parsed.theme === 'dark') 
        ? parsed.theme 
        : defaultSettings.theme,
      isLoaded: true,
    };

    return settings;
  } catch (error) {
    console.error('설정 로드 실패:', error);
    return defaultSettings;
  }
};

// 설정 초기화
export const resetSettings = (): void => {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error('설정 초기화 실패:', error);
  }
};

// 특정 설정값만 업데이트
export const updateSetting = <K extends keyof Omit<SettingsState, 'isLoaded'>>(
  key: K,
  value: SettingsState[K]
): void => {
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    saveSettings(updatedSettings);
  } catch (error) {
    console.error(`설정 업데이트 실패 (${key}):`, error);
  }
};

// 설정 검증
export const validateSettings = (settings: Partial<SettingsState>): boolean => {
  try {
    // 작성자 검증
    if (settings.author !== undefined && typeof settings.author !== 'string') {
      return false;
    }

    // 카테고리 검증
    if (settings.category !== undefined && settings.category !== '증권' && settings.category !== '보험') {
      return false;
    }

    // 현재 탭 검증
    if (settings.currentTab !== undefined) {
      if (typeof settings.currentTab !== 'object') {
        return false;
      }
    }

    // 탭 검증
    if (settings.tabs !== undefined) {
      if (typeof settings.tabs !== 'object') {
        return false;
      }
    }

    // 폰트 크기 검증
    if (settings.fontSize !== undefined) {
      if (typeof settings.fontSize !== 'number' || settings.fontSize < 10 || settings.fontSize > 24) {
        return false;
      }
    }

    // 테마 모드 검증
    if (settings.theme !== undefined) {
      if (settings.theme !== 'light' && settings.theme !== 'dark') {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

// 설정 마이그레이션 (버전 업데이트 시 사용)
export const migrateSettings = (version: string): SettingsState => {
  const current = loadSettings();
  
  // 향후 버전별 마이그레이션 로직 추가
  switch (version) {
    case '1.0.0':
      // 현재 버전이므로 마이그레이션 불필요
      break;
    default:
      // 알 수 없는 버전의 경우 기본값으로 리셋
      console.warn('알 수 없는 설정 버전, 기본값으로 초기화합니다.');
      resetSettings();
      return defaultSettings;
  }
  
  return current;
};

// 설정 내보내기
export const exportSettings = (): string => {
  try {
    // localStorage에서 직접 읽어서 export (검증 없이 원본 데이터)
    const storedData = localStorage.getItem(SETTINGS_STORAGE_KEY);
    
    if (storedData) {
      const parsedSettings = JSON.parse(storedData);
      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: parsedSettings,
      };
      return JSON.stringify(exportData, null, 2);
    } else {
      // localStorage에 데이터가 없으면 현재 기본값으로 export
      const settings = loadSettings();
      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: {
          author: settings.author,
          category: settings.category,
          currentTab: settings.currentTab,
          tabs: settings.tabs,
          fontSize: settings.fontSize,
          theme: settings.theme,
        },
      };
      return JSON.stringify(exportData, null, 2);
    }
  } catch (error) {
    console.error('설정 내보내기 오류:', error);
    // 오류 발생 시 기본값으로 export
    const settings = loadSettings();
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      settings: {
        author: settings.author,
        category: settings.category,
        currentTab: settings.currentTab,
        tabs: settings.tabs,
        fontSize: settings.fontSize,
        theme: settings.theme,
      },
    };
    return JSON.stringify(exportData, null, 2);
  }
};

// 설정 가져오기
export const importSettings = (data: string): boolean => {
  try {
    const importData = JSON.parse(data);
    
    if (!importData.settings || !importData.version) {
      throw new Error('잘못된 설정 파일 형식입니다.');
    }
    
    // 버전 확인
    if (importData.version !== '1.0.0') {
      console.warn('다른 버전의 설정 파일입니다. 호환성 문제가 발생할 수 있습니다.');
    }
    
    // 설정 검증
    if (!validateSettings(importData.settings)) {
      throw new Error('잘못된 설정값이 포함되어 있습니다.');
    }
    
    // 설정 적용
    const newSettings: SettingsState = {
      ...defaultSettings,
      ...importData.settings,
    };
    
    saveSettings(newSettings);
    return true;
  } catch (error) {
    console.error('설정 가져오기 실패:', error);
    return false;
  }
};

// 설정 변경 감지를 위한 이벤트 리스너
export const onSettingsChange = (callback: (settings: SettingsState) => void): (() => void) => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === SETTINGS_STORAGE_KEY) {
      const newSettings = loadSettings();
      callback(newSettings);
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // 클린업 함수 반환
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// 설정 스토리지 정보
export const getStorageInfo = () => {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return {
      exists: data !== null,
      size: data ? new Blob([data]).size : 0,
      lastModified: data ? new Date().toISOString() : null,
    };
  } catch {
    return {
      exists: false,
      size: 0,
      lastModified: null,
    };
  }
};
