import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Collapse,
} from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  resetError: () => void;
  showDetails: boolean;
  toggleDetails: () => void;
}

// 기본 Error Fallback 컴포넌트
function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  showDetails,
  toggleDetails,
}: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        p: 4,
        textAlign: 'center',
      }}
    >
      <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        문제가 발생했습니다
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
        예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={resetError}
        >
          다시 시도
        </Button>
        
        <Button
          variant="outlined"
          onClick={toggleDetails}
        >
          {showDetails ? '세부사항 숨기기' : '세부사항 보기'}
        </Button>
      </Box>

      <Collapse in={showDetails} sx={{ width: '100%', maxWidth: 800 }}>
        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            오류 세부사항:
          </Typography>
          
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
              {error.message}
            </Typography>
          </Alert>

          {errorInfo.componentStack && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                컴포넌트 스택:
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}

// Error Boundary 클래스 컴포넌트
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 외부 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          showDetails={this.state.showDetails}
          toggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트용 Error Boundary Hook
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// 특정 영역용 Error Boundary
interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function SectionErrorBoundary({
  children,
  title = '이 섹션을 로드할 수 없습니다',
  description = '문제가 발생했습니다. 페이지를 새로고침해주세요.',
  onError,
}: SectionErrorBoundaryProps) {
  const SectionFallback = React.useCallback(
    ({ resetError }: ErrorFallbackProps) => (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={resetError}>
            다시 시도
          </Button>
        }
        sx={{ m: 2 }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2">
          {description}
        </Typography>
      </Alert>
    ),
    [title, description]
  );

  return (
    <ErrorBoundary fallback={SectionFallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
