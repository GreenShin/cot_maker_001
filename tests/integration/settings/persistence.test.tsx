import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { SettingsPage } from '../../../src/pages/settings/SettingsPage';
import { theme } from '../../../src/styles/theme';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const createMockStore = () => configureStore({
  reducer: {
    settings: (state = {
      author: '관리자',
      canEditUsers: true,
      canEditProducts: true,
      fontSize: 14,
      theme: 'light'
    }, action) => state
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </Provider>
  );
};

describe('Settings Persistence Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should load default settings on first visit', async () => {
    renderWithProviders(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('관리자')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /질문자 수정가능/ })).toBeChecked();
      expect(screen.getByRole('switch', { name: /상품 수정가능/ })).toBeChecked();
      expect(screen.getByRole('slider', { name: /글꼴 크기/ })).toHaveAttribute('aria-valuenow', '14');
      expect(screen.getByRole('switch', { name: /다크 모드/ })).not.toBeChecked();
    });
  });

  it('should save settings to localStorage when changed', async () => {
    renderWithProviders(<SettingsPage />);
    
    // Change author name
    const authorInput = screen.getByLabelText(/작성자 이름/);
    fireEvent.change(authorInput, { target: { value: '새 관리자' } });
    
    // Toggle switches
    const userEditToggle = screen.getByRole('switch', { name: /질문자 수정가능/ });
    fireEvent.click(userEditToggle);
    
    const productEditToggle = screen.getByRole('switch', { name: /상품 수정가능/ });
    fireEvent.click(productEditToggle);
    
    // Change font size
    const fontSlider = screen.getByRole('slider', { name: /글꼴 크기/ });
    fireEvent.change(fontSlider, { target: { value: '16' } });
    
    // Toggle theme
    const themeToggle = screen.getByRole('switch', { name: /다크 모드/ });
    fireEvent.click(themeToggle);

    // Save settings
    const saveButton = screen.getByText(/저장/);
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Check localStorage was updated
      const savedSettings = JSON.parse(localStorageMock.getItem('cotAdminSettings') || '{}');
      expect(savedSettings.author).toBe('새 관리자');
      expect(savedSettings.canEditUsers).toBe(false);
      expect(savedSettings.canEditProducts).toBe(false);
      expect(savedSettings.fontSize).toBe(16);
      expect(savedSettings.theme).toBe('dark');
    });
  });

  it('should restore settings from localStorage on app restart', async () => {
    // Pre-populate localStorage
    const savedSettings = {
      author: '저장된 관리자',
      canEditUsers: false,
      canEditProducts: true,
      fontSize: 18,
      theme: 'dark'
    };
    localStorageMock.setItem('cotAdminSettings', JSON.stringify(savedSettings));

    renderWithProviders(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('저장된 관리자')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /질문자 수정가능/ })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /상품 수정가능/ })).toBeChecked();
      expect(screen.getByRole('slider', { name: /글꼴 크기/ })).toHaveAttribute('aria-valuenow', '18');
      expect(screen.getByRole('switch', { name: /다크 모드/ })).toBeChecked();
    });
  });

  it('should apply theme changes immediately', async () => {
    renderWithProviders(<SettingsPage />);
    
    const themeToggle = screen.getByRole('switch', { name: /다크 모드/ });
    fireEvent.click(themeToggle);

    await waitFor(() => {
      // Theme should be applied to the document
      expect(document.documentElement).toHaveAttribute('data-mui-color-scheme', 'dark');
    });
  });

  it('should apply font size changes immediately', async () => {
    renderWithProviders(<SettingsPage />);
    
    const fontSlider = screen.getByRole('slider', { name: /글꼴 크기/ });
    fireEvent.change(fontSlider, { target: { value: '20' } });

    await waitFor(() => {
      // Font size should be applied via CSS variables
      expect(document.documentElement.style.getPropertyValue('--app-font-size')).toBe('20px');
    });
  });

  it('should handle corrupted localStorage gracefully', async () => {
    // Set invalid JSON in localStorage
    localStorageMock.setItem('cotAdminSettings', 'invalid json');

    renderWithProviders(<SettingsPage />);
    
    await waitFor(() => {
      // Should fall back to defaults
      expect(screen.getByDisplayValue('관리자')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /질문자 수정가능/ })).toBeChecked();
    });
  });

  it('should provide reset to defaults functionality', async () => {
    // First, change some settings
    renderWithProviders(<SettingsPage />);
    
    const authorInput = screen.getByLabelText(/작성자 이름/);
    fireEvent.change(authorInput, { target: { value: '변경된 관리자' } });
    
    // Reset to defaults
    const resetButton = screen.getByText(/기본값으로 초기화/);
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('관리자')).toBeInTheDocument();
      expect(localStorageMock.getItem('cotAdminSettings')).toBeNull();
    });
  });
});
