import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  SlideProps,
} from '@mui/material';

interface ErrorToastProps {
  open: boolean;
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration?: number;
  onClose: () => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function ErrorToast({
  open,
  message,
  title,
  severity = 'error',
  autoHideDuration = 6000,
  onClose,
}: ErrorToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%', minWidth: 300 }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
}

// Toast 메시지 타입
export interface ToastMessage {
  id: string;
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration?: number;
}

// Toast 컨텍스트
interface ToastContextType {
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { ...message, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showError = React.useCallback((message: string, title?: string) => {
    showToast({ message, title, severity: 'error' });
  }, [showToast]);

  const showSuccess = React.useCallback((message: string, title?: string) => {
    showToast({ message, title, severity: 'success' });
  }, [showToast]);

  const showWarning = React.useCallback((message: string, title?: string) => {
    showToast({ message, title, severity: 'warning' });
  }, [showToast]);

  const showInfo = React.useCallback((message: string, title?: string) => {
    showToast({ message, title, severity: 'info' });
  }, [showToast]);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const contextValue = React.useMemo(() => ({
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  }), [showToast, showError, showSuccess, showWarning, showInfo]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map((toast) => (
        <ErrorToast
          key={toast.id}
          open={true}
          message={toast.message}
          title={toast.title}
          severity={toast.severity}
          autoHideDuration={toast.autoHideDuration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

// Toast Hook
export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// 유틸리티 함수들
export const createErrorToast = (error: unknown, defaultMessage = '오류가 발생했습니다'): ToastMessage => {
  let message = defaultMessage;
  let title = '오류';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return {
    id: crypto.randomUUID(),
    message,
    title,
    severity: 'error',
  };
};

export const createSuccessToast = (message: string, title = '성공'): ToastMessage => ({
  id: crypto.randomUUID(),
  message,
  title,
  severity: 'success',
});
