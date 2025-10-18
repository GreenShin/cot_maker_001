import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserAnon } from '../../models/userAnon';
import { PanelResizer } from '../common/PanelResizer';
import type { RootState } from '../../store';

const STORAGE_KEY = 'questioner-panel-split-ratio';
const DEFAULT_RATIO = 0.5; // 50:50
const MIN_RATIO = 0.2; // 최소 20%
const MAX_RATIO = 0.8; // 최대 80%

interface QuestionerPanelProps {
  selectedUser: UserAnon | null;
  onOpenUserSelector: () => void;
  productSource?: '증권' | '보험' | null;
  questionType?: string | null;
}

export function QuestionerPanel({ 
  selectedUser, 
  onOpenUserSelector,
  productSource,
  questionType
}: QuestionerPanelProps) {
  const [judgmentDialogOpen, setJudgmentDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(DEFAULT_RATIO);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const settings = useSelector((state: RootState) => state.settings);

  // localStorage에서 비율 로드
  useEffect(() => {
    try {
      const savedRatio = localStorage.getItem(STORAGE_KEY);
      if (savedRatio) {
        const ratio = parseFloat(savedRatio);
        if (ratio >= MIN_RATIO && ratio <= MAX_RATIO) {
          setSplitRatio(ratio);
        }
      }
    } catch (error) {
      console.error('패널 비율 로드 실패:', error);
    }
  }, []);

  // 비율 조절 핸들러 - 의존성 제거하여 안정적인 참조 유지
  const handleResize = useCallback((deltaY: number) => {
    if (!containerRef.current) return;
    
    const containerHeight = containerRef.current.clientHeight;
    if (containerHeight === 0) return;
    
    setSplitRatio(prevRatio => {
      const deltaRatio = deltaY / containerHeight;
      const newRatio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, prevRatio + deltaRatio));
      
      try {
        localStorage.setItem(STORAGE_KEY, newRatio.toString());
      } catch (error) {
        console.error('패널 비율 저장 실패:', error);
      }
      
      return newRatio;
    });
  }, []); // 빈 의존성 배열로 안정적인 참조 유지

  // 상품분류와 질문유형에 맞는 질문자 주관적 판단 가져오기
  const getQuestionerJudgment = (): string => {
    if (!productSource || !questionType) {
      return '';
    }

    // 질문유형을 설정의 탭 키로 변환
    const tabKeyMap: Record<string, string> = {
      // 증권
      '고객 특성 강조형': '고객특성강조형',
      '투자성향 및 조건 기반형': '투자성향조건기반형',
      '상품비교 추천형': '상품비교추천형',
      // 보험
      '연령별 및 생애주기 저축성 상품 추천형': '연령별생애주기저축성',
      '투자성 상품 추천형': '투자성상품추천형',
      '건강 및 질병 보장 대비형': '건강질병보장대비형'
    };

    const tabKey = tabKeyMap[questionType];
    if (!tabKey) {
      return '';
    }

    if (productSource === '증권') {
      return settings.tabs.증권[tabKey as keyof typeof settings.tabs.증권]?.questionerJudgment || '';
    } else {
      return settings.tabs.보험[tabKey as keyof typeof settings.tabs.보험]?.questionerJudgment || '';
    }
  };

  const handleViewJudgment = () => {
    if (!productSource || !questionType) {
      setAlertOpen(true);
      return;
    }

    const judgment = getQuestionerJudgment();
    if (!judgment) {
      setAlertOpen(true);
      return;
    }

    setJudgmentDialogOpen(true);
  };

  const questionerJudgmentContent = getQuestionerJudgment();
  const hasJudgmentContent = !!questionerJudgmentContent;

  return (
    <Box ref={containerRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상단: 질문자 선택 영역 (동적 비율) */}
      <Box sx={{ 
        height: `${splitRatio * 100}%`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <Box sx={{ 
          flexShrink: 0, 
          borderBottom: 1, 
          borderColor: 'divider', 
          p: 2,
          pb: 1
        }}>
          <Typography variant="h6">
            질문자 선택 (선택사항)
          </Typography>
        </Box>
        
        {/* 스크롤 가능한 콘텐츠 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 1 }}>
          {!selectedUser ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                질문자 선택은 선택사항입니다. 필요시 선택해 주세요.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={onOpenUserSelector}
              >
                질문자 검색
              </Button>
            </Box>
          ) : (
            <Box>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    선택된 질문자
                  </Typography>
                  <Typography variant="body2">
                    <strong>고객출처:</strong> {selectedUser.customerSource}<br />
                    <strong>연령대:</strong> {selectedUser.ageGroup}<br />
                    <strong>성별:</strong> {selectedUser.gender}<br />
                    <strong>투자성향:</strong> {selectedUser.customerSource === '증권' && 'investmentTendency' in selectedUser ? selectedUser.investmentTendency : '미정의'}<br />
                    <strong>투자액:</strong> {selectedUser.investmentAmount}
                  </Typography>
                </CardContent>
              </Card>
              
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                size="small"
                onClick={onOpenUserSelector}
              >
                다른 질문자 선택
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* 리사이저 */}
      <PanelResizer onResize={handleResize} orientation="horizontal" />

      {/* 하단: 질문자 주관적 판단 영역 (동적 비율) */}
      <Box sx={{ 
        height: `${(1 - splitRatio) * 100}%`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 헤더 (제목 + 보기 버튼) */}
        <Box sx={{ 
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1, 
          borderColor: 'divider', 
          p: 2,
          pb: 1
        }}>
          <Typography variant="h6">
            질문자 주관적 판단
          </Typography>
          <IconButton
            onClick={handleViewJudgment}
            disabled={!productSource || !questionType || !hasJudgmentContent}
            aria-label="전체화면으로 보기"
            title="전체화면으로 보기"
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
        </Box>
        
        {/* 스크롤 가능한 본문 영역 */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 2,
          pt: 1
        }}>
          <Box sx={{
            minHeight: '100px',
            p: 2,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '& h1': { fontSize: '1.5em', fontWeight: 'bold', mb: 1.5, mt: 2 },
            '& h2': { fontSize: '1.25em', fontWeight: 'bold', mb: 1, mt: 2, borderBottom: 1, borderColor: 'divider', pb: 0.5 },
            '& h3': { fontSize: '1.1em', fontWeight: 'bold', mb: 0.75, mt: 1.5 },
            '& p': { mb: 1.5, lineHeight: 1.6 },
            '& ul, & ol': { mb: 1.5, pl: 2.5 },
            '& li': { mb: 0.5 },
            '& code': { 
              bgcolor: 'action.hover', 
              px: 0.5, 
              py: 0.25, 
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.9em'
            },
            '& pre': { 
              bgcolor: 'action.hover', 
              p: 1.5, 
              borderRadius: 1,
              overflow: 'auto',
              mb: 1.5,
              fontSize: '0.9em'
            },
            '& pre code': {
              bgcolor: 'transparent',
              p: 0
            },
            '& blockquote': { 
              borderLeft: 4, 
              borderColor: 'primary.main', 
              pl: 1.5, 
              ml: 0,
              color: 'text.secondary',
              fontStyle: 'italic',
              mb: 1.5
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              mb: 1.5,
              fontSize: '0.9em'
            },
            '& th, & td': {
              border: 1,
              borderColor: 'divider',
              px: 1,
              py: 0.5,
              textAlign: 'left'
            },
            '& th': {
              bgcolor: 'action.hover',
              fontWeight: 'bold'
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            },
            '& hr': {
              my: 2,
              borderColor: 'divider'
            }
          }}>
            {!productSource || !questionType ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                상품분류와 질문유형을 선택하면 가이드가 표시됩니다.
              </Typography>
            ) : hasJudgmentContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {questionerJudgmentContent}
              </ReactMarkdown>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                설정에서 해당 질문유형의 질문자 주관적 판단을 입력해주세요.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* 질문자 주관적 판단 미리보기 Dialog (전체화면) */}
      <Dialog
        open={judgmentDialogOpen}
        onClose={() => setJudgmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6">질문자 주관적 판단</Typography>
          <IconButton
            onClick={() => setJudgmentDialogOpen(false)}
            size="small"
            aria-label="닫기"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          mt: 2,
          '& h1': { fontSize: '2em', fontWeight: 'bold', mb: 2, mt: 3 },
          '& h2': { fontSize: '1.5em', fontWeight: 'bold', mb: 1.5, mt: 2.5, borderBottom: 1, borderColor: 'divider', pb: 1 },
          '& h3': { fontSize: '1.25em', fontWeight: 'bold', mb: 1, mt: 2 },
          '& p': { mb: 2, lineHeight: 1.6 },
          '& ul, & ol': { mb: 2, pl: 3 },
          '& li': { mb: 0.5 },
          '& code': { 
            bgcolor: 'action.hover', 
            px: 0.5, 
            py: 0.25, 
            borderRadius: 0.5,
            fontFamily: 'monospace'
          },
          '& pre': { 
            bgcolor: 'action.hover', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto',
            mb: 2
          },
          '& pre code': {
            bgcolor: 'transparent',
            p: 0
          },
          '& blockquote': { 
            borderLeft: 4, 
            borderColor: 'primary.main', 
            pl: 2, 
            ml: 0,
            color: 'text.secondary',
            fontStyle: 'italic'
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            mb: 2
          },
          '& th, & td': {
            border: 1,
            borderColor: 'divider',
            px: 2,
            py: 1,
            textAlign: 'left'
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 'bold'
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          },
          '& hr': {
            my: 3,
            borderColor: 'divider'
          }
        }}>
          {questionerJudgmentContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {questionerJudgmentContent}
            </ReactMarkdown>
          ) : (
            <Typography color="text.secondary" fontStyle="italic">
              내용이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setJudgmentDialogOpen(false)} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 경고 팝업 (상품분류/질문유형 미선택) */}
      <Dialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>알림</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {!productSource || !questionType 
              ? '상품분류와 질문유형을 먼저 선택해주세요.'
              : '설정에서 해당 질문유형의 질문자 주관적 판단을 입력해주세요.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
