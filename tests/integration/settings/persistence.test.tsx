/**
 * Settings Persistence Integration Tests
 * 테마, 폰트 크기, 토글 등 설정의 localStorage 지속성 테스트
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { theme } from '../../../src/styles/theme.js';
import { settingsSlice } from '../../../src/store/slices/settingsSlice.js';
import { SettingsPage } from '../../../src/pages/settings/SettingsPage.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Store 생성
const createMockStore = (initialSettings?: any) => {
  const defaultSettings = {
    theme: 'light',
    fontSize: 'medium',
    language: 'ko',
    autoSave: true,
    notifications: true,
    compactMode: false,
    showLineNumbers: true,
    wordWrap: true,
    autoComplete: true,
    highContrastMode: false,
    ...initialSettings
  };

  return configureStore({
  reducer: {
      settings: settingsSlice.reducer,
    },
    preloadedState: {
      settings: {
        values: defaultSettings,
        loading: false,
        error: null,
        lastSaved: null
      }
    }
  });
};

// 테스트용 컴포넌트 래퍼
const TestWrapper = ({ children, store }: { children: React.ReactNode, store?: any }) => {
  const testStore = store || createMockStore();
  
  return (
    <Provider store={testStore}>
      <BrowserRouter>
      <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
        </BrowserRouter>
    </Provider>
  );
};

describe('Settings Persistence Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Initial Settings Loading', () => {
    it('should load default settings when localStorage is empty', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 기본 설정값들이 표시되는지 확인
      expect(screen.getByRole('radio', { name: /라이트 모드/ })).toBeChecked();
      expect(screen.getByRole('combobox', { name: /폰트 크기/ })).toHaveValue('medium');
      expect(screen.getByRole('checkbox', { name: /자동 저장/ })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /알림/ })).toBeChecked();
    });

    it('should load settings from localStorage on initialization', async () => {
      // localStorage에 설정값 미리 저장
      localStorageMock.setItem('app-settings', JSON.stringify({
        theme: 'dark',
        fontSize: 'large',
        language: 'en',
        autoSave: false,
        notifications: false,
        compactMode: true
      }));

      const store = createMockStore({
        theme: 'dark',
        fontSize: 'large',
        language: 'en',
        autoSave: false,
        notifications: false,
        compactMode: true
      });

      render(
        <TestWrapper store={store}>
          <SettingsPage />
        </TestWrapper>
      );

      // 저장된 설정값들이 로드되었는지 확인
      expect(screen.getByRole('radio', { name: /다크 모드/ })).toBeChecked();
      expect(screen.getByRole('combobox', { name: /폰트 크기/ })).toHaveValue('large');
      expect(screen.getByRole('checkbox', { name: /자동 저장/ })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: /알림/ })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: /컴팩트 모드/ })).toBeChecked();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // 잘못된 JSON 데이터 저장
      localStorageMock.setItem('app-settings', '{"theme": "invalid", "fontSize":');

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 기본값으로 폴백되어야 함
      expect(screen.getByRole('radio', { name: /라이트 모드/ })).toBeChecked();
      expect(screen.getByRole('combobox', { name: /폰트 크기/ })).toHaveValue('medium');
    });
  });

  describe('Theme Settings Persistence', () => {
    it('should persist theme changes to localStorage', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 다크 모드로 변경
      const darkModeRadio = screen.getByRole('radio', { name: /다크 모드/ });
      await user.click(darkModeRadio);

      // localStorage에 저장되었는지 확인
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"theme":"dark"')
        );
      });
    });

    it('should apply theme changes immediately', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 다크 모드로 변경
      const darkModeRadio = screen.getByRole('radio', { name: /다크 모드/ });
      await user.click(darkModeRadio);

      // 테마가 즉시 적용되는지 확인 (CSS 클래스 또는 스타일 변경)
      await waitFor(() => {
        const body = document.body;
        expect(body).toHaveAttribute('data-theme', 'dark');
      });
    });

    it('should support high contrast mode', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 고대비 모드 활성화
      const highContrastCheckbox = screen.getByRole('checkbox', { name: /고대비 모드/ });
      await user.click(highContrastCheckbox);

      // 설정 저장 확인
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"highContrastMode":true')
        );
      });

      // 고대비 클래스 적용 확인
      expect(document.body).toHaveClass('high-contrast');
    });
  });

  describe('Font Size Settings Persistence', () => {
    it('should persist font size changes', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 폰트 크기를 'large'로 변경
      const fontSizeSelect = screen.getByRole('combobox', { name: /폰트 크기/ });
      await user.click(fontSizeSelect);
      await user.click(screen.getByText('큰 글씨'));

      // localStorage에 저장되었는지 확인
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"fontSize":"large"')
        );
      });
    });

    it('should apply font size changes to document root', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 폰트 크기를 'small'로 변경
      const fontSizeSelect = screen.getByRole('combobox', { name: /폰트 크기/ });
      await user.click(fontSizeSelect);
      await user.click(screen.getByText('작은 글씨'));

      // 루트 엘리먼트에 CSS 변수 적용 확인
      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--font-size-base')).toBe('14px');
      });
    });

    it('should support custom font size values', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 사용자 정의 폰트 크기 입력
      const customFontSizeInput = screen.getByLabelText(/사용자 정의 폰트 크기/);
      await user.clear(customFontSizeInput);
      await user.type(customFontSizeInput, '18');

      // 적용 버튼 클릭
      const applyButton = screen.getByRole('button', { name: /적용/ });
      await user.click(applyButton);

      // 사용자 정의 값이 저장되었는지 확인
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"customFontSize":18')
        );
      });
    });
  });

  describe('Application Behavior Settings', () => {
    it('should persist auto-save toggle', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 자동 저장 비활성화
      const autoSaveCheckbox = screen.getByRole('checkbox', { name: /자동 저장/ });
      await user.click(autoSaveCheckbox);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"autoSave":false')
        );
      });
    });

    it('should persist notification settings', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 알림 비활성화
      const notificationsCheckbox = screen.getByRole('checkbox', { name: /알림/ });
      await user.click(notificationsCheckbox);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"notifications":false')
        );
      });
    });

    it('should persist compact mode setting', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 컴팩트 모드 활성화
      const compactModeCheckbox = screen.getByRole('checkbox', { name: /컴팩트 모드/ });
      await user.click(compactModeCheckbox);
    
    await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"compactMode":true')
        );
      });

      // 컴팩트 모드 클래스 적용 확인
      expect(document.body).toHaveClass('compact-mode');
    });
  });

  describe('Editor Settings Persistence', () => {
    it('should persist line numbers setting', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 줄 번호 비활성화
      const lineNumbersCheckbox = screen.getByRole('checkbox', { name: /줄 번호 표시/ });
      await user.click(lineNumbersCheckbox);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"showLineNumbers":false')
        );
      });
    });

    it('should persist word wrap setting', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 자동 줄바꿈 비활성화
      const wordWrapCheckbox = screen.getByRole('checkbox', { name: /자동 줄바꿈/ });
      await user.click(wordWrapCheckbox);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"wordWrap":false')
        );
      });
    });

    it('should persist auto-complete setting', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 자동 완성 비활성화
      const autoCompleteCheckbox = screen.getByRole('checkbox', { name: /자동 완성/ });
      await user.click(autoCompleteCheckbox);

    await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"autoComplete":false')
        );
      });
    });
  });

  describe('Language and Localization Settings', () => {
    it('should persist language changes', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 언어를 영어로 변경
      const languageSelect = screen.getByRole('combobox', { name: /언어/ });
      await user.click(languageSelect);
      await user.click(screen.getByText('English'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringContaining('"language":"en"')
        );
      });
    });

    it('should reload page when language changes', async () => {
      // window.location.reload 모킹
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 언어 변경
      const languageSelect = screen.getByRole('combobox', { name: /언어/ });
      await user.click(languageSelect);
      await user.click(screen.getByText('English'));

      // 확인 다이얼로그에서 확인 클릭
      const confirmButton = screen.getByRole('button', { name: /확인/ });
      await user.click(confirmButton);
    
    await waitFor(() => {
        expect(mockReload).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Import and Export', () => {
    it('should export current settings as JSON', async () => {
      const mockDownload = vi.fn();
      
      // 다운로드 함수 모킹
      Object.defineProperty(document, 'createElement', {
        value: vi.fn((tagName: string) => {
          if (tagName === 'a') {
            return {
              href: '',
              download: '',
              click: mockDownload,
              setAttribute: vi.fn(),
              style: {}
            };
          }
          return document.createElement(tagName);
        }),
        writable: true
      });

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 설정 내보내기 버튼 클릭
      const exportButton = screen.getByRole('button', { name: /설정 내보내기/ });
      await user.click(exportButton);

      expect(mockDownload).toHaveBeenCalled();
    });

    it('should import settings from JSON file', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 가져올 설정 데이터
      const importData = {
        theme: 'dark',
        fontSize: 'large',
        autoSave: false,
        notifications: false
      };

      // 파일 입력 요소 찾기
      const fileInput = screen.getByLabelText(/설정 파일 선택/);
      
      // 파일 객체 생성 및 업로드 시뮬레이션
      const file = new File([JSON.stringify(importData)], 'settings.json', {
        type: 'application/json'
      });

      await user.upload(fileInput, file);

      // 가져오기 확인 다이얼로그
      const importButton = screen.getByRole('button', { name: /가져오기/ });
      await user.click(importButton);

      // 설정이 적용되었는지 확인
      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /다크 모드/ })).toBeChecked();
        expect(screen.getByRole('combobox', { name: /폰트 크기/ })).toHaveValue('large');
        expect(screen.getByRole('checkbox', { name: /자동 저장/ })).not.toBeChecked();
      });

      // localStorage에 저장되었는지 확인
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app-settings',
        JSON.stringify(importData)
      );
    });

    it('should validate imported settings data', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 잘못된 설정 데이터
      const invalidData = {
        theme: 'invalid-theme',
        fontSize: 'invalid-size',
        invalidField: true
      };

      const file = new File([JSON.stringify(invalidData)], 'invalid-settings.json', {
        type: 'application/json'
      });

      const fileInput = screen.getByLabelText(/설정 파일 선택/);
      await user.upload(fileInput, file);

      // 오류 메시지 표시 확인
    await waitFor(() => {
        expect(screen.getByText(/잘못된 설정 파일입니다/)).toBeInTheDocument();
      });
    });
  });

  describe('Settings Reset and Defaults', () => {
    it('should reset all settings to default values', async () => {
      // 커스텀 설정으로 시작
      const store = createMockStore({
        theme: 'dark',
        fontSize: 'large',
        autoSave: false,
        notifications: false,
        compactMode: true
      });

      render(
        <TestWrapper store={store}>
          <SettingsPage />
        </TestWrapper>
      );

      // 초기화 버튼 클릭
      const resetButton = screen.getByRole('button', { name: /기본값으로 초기화/ });
      await user.click(resetButton);

      // 확인 다이얼로그에서 확인
      const confirmButton = screen.getByRole('button', { name: /확인/ });
      await user.click(confirmButton);

      // 기본값으로 복원되었는지 확인
    await waitFor(() => {
        expect(screen.getByRole('radio', { name: /라이트 모드/ })).toBeChecked();
        expect(screen.getByRole('combobox', { name: /폰트 크기/ })).toHaveValue('medium');
        expect(screen.getByRole('checkbox', { name: /자동 저장/ })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /알림/ })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /컴팩트 모드/ })).not.toBeChecked();
      });

      // localStorage가 클리어되었는지 확인
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app-settings');
    });

    it('should show confirmation dialog before reset', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const resetButton = screen.getByRole('button', { name: /기본값으로 초기화/ });
      await user.click(resetButton);

      // 확인 다이얼로그 표시 확인
      expect(screen.getByText(/모든 설정을 기본값으로 초기화하시겠습니까/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /확인/ })).toBeInTheDocument();
    });
  });

  describe('Performance and Error Handling', () => {
    it('should debounce rapid setting changes', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const autoSaveCheckbox = screen.getByRole('checkbox', { name: /자동 저장/ });

      // 빠른 연속 클릭
      await user.click(autoSaveCheckbox);
      await user.click(autoSaveCheckbox);
      await user.click(autoSaveCheckbox);

      // 디바운싱으로 인해 localStorage.setItem이 적절히 호출되었는지 확인
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      }, { timeout: 1000 });

      // 최종 상태가 올바른지 확인
      expect(autoSaveCheckbox).not.toBeChecked();
    });

    it('should handle localStorage quota exceeded error', async () => {
      // localStorage quota 초과 오류 시뮬레이션
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      const darkModeRadio = screen.getByRole('radio', { name: /다크 모드/ });
      await user.click(darkModeRadio);

      // 오류 메시지 표시 확인
      await waitFor(() => {
        expect(screen.getByText(/설정 저장에 실패했습니다/)).toBeInTheDocument();
      });
    });

    it('should maintain settings state during navigation', async () => {
      const store = createMockStore();
      
      const { rerender } = render(
        <TestWrapper store={store}>
          <SettingsPage />
        </TestWrapper>
      );

      // 설정 변경
      const darkModeRadio = screen.getByRole('radio', { name: /다크 모드/ });
      await user.click(darkModeRadio);

      // 컴포넌트 재렌더링 (페이지 이동 시뮬레이션)
      rerender(
        <TestWrapper store={store}>
          <SettingsPage />
        </TestWrapper>
      );

      // 설정이 유지되는지 확인
      expect(screen.getByRole('radio', { name: /다크 모드/ })).toBeChecked();
    });
  });

  describe('Accessibility Settings', () => {
    it('should persist accessibility preferences', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 고대비 모드 활성화
      const highContrastCheckbox = screen.getByRole('checkbox', { name: /고대비 모드/ });
      await user.click(highContrastCheckbox);

      // 화면 판독기 지원 활성화
      const screenReaderCheckbox = screen.getByRole('checkbox', { name: /화면 판독기 지원/ });
      await user.click(screenReaderCheckbox);
    
    await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'app-settings',
          expect.stringMatching(/"highContrastMode":true.*"screenReaderSupport":true/)
        );
      });
    });

    it('should apply ARIA attributes based on accessibility settings', async () => {
      const store = createMockStore({
        screenReaderSupport: true,
        highContrastMode: true
      });

      render(
        <TestWrapper store={store}>
          <SettingsPage />
        </TestWrapper>
      );

      // 접근성 속성 확인
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('aria-live', 'polite');

      // 고대비 모드 적용 확인
      expect(document.body).toHaveClass('high-contrast');
    });
  });

  describe('Settings Synchronization', () => {
    it('should sync settings across tabs', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 다른 탭에서 설정 변경 시뮬레이션 (storage event)
      const storageEvent = new StorageEvent('storage', {
        key: 'app-settings',
        newValue: JSON.stringify({ theme: 'dark', fontSize: 'large' }),
        oldValue: JSON.stringify({ theme: 'light', fontSize: 'medium' })
      });

      window.dispatchEvent(storageEvent);

      // 설정이 동기화되었는지 확인
      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /다크 모드/ })).toBeChecked();
        expect(screen.getByRole('combobox', { name: /폰트 크기/ })).toHaveValue('large');
      });
    });

    it('should show notification when settings are synced from another tab', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // 다른 탭에서 설정 변경
      const storageEvent = new StorageEvent('storage', {
        key: 'app-settings',
        newValue: JSON.stringify({ theme: 'dark' })
      });

      window.dispatchEvent(storageEvent);

      // 동기화 알림 표시
    await waitFor(() => {
        expect(screen.getByText(/다른 탭에서 설정이 변경되어 동기화되었습니다/)).toBeInTheDocument();
      });
    });
  });
});