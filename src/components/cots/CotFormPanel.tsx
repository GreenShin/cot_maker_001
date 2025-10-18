import React, { useState } from 'react';
import { Control, FieldErrors, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid2,
  Divider,
  IconButton,
  FormHelperText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  DeleteForever as DeleteForeverIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResizableTextField } from '../common/ResizableTextField';
import { useTextareaHeights } from '../../hooks/useTextareaHeights';
import type { RootState } from '../../store';

interface CotFormData {
  productSource: '증권' | '보험';
  questionType: string;
  question: string;
  cot1: string;
  cot2: string;
  cot3: string;
  answer: string;
  datasetStatus: string;
  author: string;
  reviewComment: string;
}

interface CotFormPanelProps {
  isEditMode: boolean;
  control: Control<any>;
  errors: FieldErrors<any>;
  isSubmitting: boolean;
  watchedProductSource: string;
  watchedQuestionType: string;
  cotFields: string[];
  cotNFields: Record<string, string>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onBack: () => void;
  onDelete: () => void;
  onAddCotField: () => void;
  onRemoveCotField: (index: number) => void;
  onCotNFieldChange: (fieldName: string, value: string) => void;
  onPinnedFieldToggle?: (fieldName: string, fieldLabel: string) => void;
  pinnedFieldName?: string | null;
}

// 상품분류에 따른 질문유형 옵션
const getQuestionTypes = (productSource: string): string[] => {
  if (productSource === '증권') {
    return ['고객 특성 강조형', '투자성향 및 조건 기반형', '상품비교 추천형'];
  } else {
    return ['연령별 및 생애주기 저축성 상품 추천형', '투자성 상품 추천형', '건강 및 질병 보장 대비형'];
  }
};

export function CotFormPanel({
  isEditMode,
  control,
  errors,
  isSubmitting,
  watchedProductSource,
  watchedQuestionType,
  cotFields,
  cotNFields,
  onSubmit,
  onBack,
  onDelete,
  onAddCotField,
  onRemoveCotField,
  onCotNFieldChange,
  onPinnedFieldToggle,
  pinnedFieldName,
}: CotFormPanelProps) {
  const { heights, adjustFieldHeight, getFieldHeight, getFieldRows } = useTextareaHeights();
  const settings = useSelector((state: RootState) => state.settings);
  
  // 가이드 다이얼로그 상태
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [guideContent, setGuideContent] = useState('');
  const [guideTitle, setGuideTitle] = useState('');

  // 질문유형을 설정의 탭 키로 변환
  const getTabKey = (questionType: string): string => {
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
    return tabKeyMap[questionType] || '';
  };

  // 가이드 가져오기
  const getGuide = (fieldName: string): string => {
    if (!watchedProductSource || !watchedQuestionType) {
      return '';
    }

    const tabKey = getTabKey(watchedQuestionType);
    if (!tabKey) {
      return '';
    }

    if (watchedProductSource === '증권') {
      const tab = settings.tabs.증권[tabKey as keyof typeof settings.tabs.증권];
      return tab?.[fieldName as keyof typeof tab] || '';
    } else {
      const tab = settings.tabs.보험[tabKey as keyof typeof settings.tabs.보험];
      return tab?.[fieldName as keyof typeof tab] || '';
    }
  };

  // 가이드 보기 핸들러
  const handleViewGuide = (fieldName: string, fieldLabel: string) => {
    const guide = getGuide(fieldName);
    if (!guide) {
      return;
    }
    setGuideContent(guide);
    setGuideTitle(`${fieldLabel} 가이드`);
    setGuideDialogOpen(true);
  };

  // 가이드 버튼 렌더링
  const renderGuideButton = (fieldName: string, fieldLabel: string) => {
    const guide = getGuide(fieldName);
    const hasGuide = !!guide;
    const isPinned = pinnedFieldName === fieldName;

    return (
      <Box sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        display: 'flex',
        gap: 0.5,
      }}>
        {/* Pin 버튼 */}
        <IconButton
          onClick={() => onPinnedFieldToggle?.(fieldName, fieldLabel)}
          disabled={!hasGuide}
          aria-label={isPinned ? `${fieldLabel} 가이드 핀 해제` : `${fieldLabel} 가이드 핀 고정`}
          title={isPinned ? '핀 해제' : '핀 고정'}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          }}
        >
          {isPinned ? (
            <PushPinIcon fontSize="small" color="primary" />
          ) : (
            <PushPinOutlinedIcon fontSize="small" />
          )}
        </IconButton>
        
        {/* 가이드 보기 버튼 */}
        <IconButton
          onClick={() => handleViewGuide(fieldName, fieldLabel)}
          disabled={!hasGuide}
          aria-label={`${fieldLabel} 가이드 보기`}
          title={`${fieldLabel} 가이드 보기`}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };
  
  return (
    <Box 
      component="form" 
      onSubmit={onSubmit}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}
    >
      {/* 고정 헤더 */}
      <Box sx={{ 
        flexShrink: 0, 
        borderBottom: 1, 
        borderColor: 'divider', 
        pb: 1, 
        mb: 2,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography variant="h6">
          {isEditMode ? 'CoT 수정' : '새 CoT 생성'}
        </Typography>
        <Box>
          <Button
            type="button"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mr: 1 }}
          >
            목록
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={onDelete}
              sx={{ mr: 1 }}
            >
              삭제
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            저장
          </Button>
        </Box>
      </Box>

      {/* 스크롤 가능한 폼 콘텐츠 */}
      <Box sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 에러 알림 */}
        {errors.questionType && (
          <Alert 
            severity="error" 
            sx={{ 
              '& .MuiAlert-message': { 
                fontSize: '1rem',
                fontWeight: 500 
              } 
            }}
          >
            질문유형을 선택해 주세요
          </Alert>
        )}
        
        {errors.question && (
          <Alert 
            severity="error" 
            sx={{ 
              '& .MuiAlert-message': { 
                fontSize: '1rem',
                fontWeight: 500 
              } 
            }}
          >
            질문을 입력해 주세요
          </Alert>
        )}
        
        {/* 첫 번째 줄: 상품분류, 질문유형 */}
        <Grid2 container spacing={2}>
          <Grid2 size={6}>
            <Controller
              name="productSource"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.productSource}>
                  <InputLabel>상품분류 *</InputLabel>
                  <Select
                    {...field}
                    label="상품분류 *"
                  >
                    <MenuItem value="증권">증권</MenuItem>
                    <MenuItem value="보험">보험</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid2>
          <Grid2 size={6}>
            <Controller
              name="questionType"
              control={control}
              render={({ field }) => (
                <FormControl 
                  fullWidth 
                  error={!!errors.questionType}
                  sx={{
                    ...(errors.questionType && {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderWidth: 2,
                          borderColor: 'error.main',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'error.main',
                        fontWeight: 600,
                      },
                    }),
                  }}
                >
                  <InputLabel>질문유형 *</InputLabel>
                  <Select
                    {...field}
                    label="질문유형 *"
                  >
                    {getQuestionTypes(watchedProductSource).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.questionType && (
                    <FormHelperText 
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        ml: 0
                      }}
                    >
                      {String(errors.questionType?.message ?? '')}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid2>
        </Grid2>

        {/* 두 번째 줄: 질문 */}
        <Box sx={{ position: 'relative' }}>
          <Controller
            name="question"
            control={control}
            render={({ field }) => (
              <ResizableTextField
                {...field}
                fieldName="question"
                label="질문 *"
                rows={getFieldRows("question")}
                heightPx={getFieldHeight("question")}
                fullWidth
                placeholder="질문을 입력해 주세요"
                error={!!errors.question}
                helperText={String(errors.question?.message ?? '')}
                onHeightChange={adjustFieldHeight}
                sx={{
                  ...(errors.question && {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderWidth: 2,
                        borderColor: 'error.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'error.main',
                      fontWeight: 600,
                    },
                  }),
                }}
              />
            )}
          />
          {renderGuideButton('question', '질문')}
        </Box>

        {/* CoT 필드들 */}
        {cotFields.map((fieldName, index) => (
          <Box key={fieldName} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1, position: 'relative' }}>
              {index < 3 ? (
                <>
                  <Controller
                    name={`cot${index + 1}` as keyof CotFormData}
                    control={control}
                    render={({ field }) => (
                      <ResizableTextField
                        {...field}
                        fieldName={`cot${index + 1}`}
                        label={fieldName}
                        rows={getFieldRows(`cot${index + 1}`)}
                        heightPx={getFieldHeight(`cot${index + 1}`)}
                        fullWidth
                        placeholder={`${fieldName} 내용을 입력해 주세요`}
                        error={!!(errors as any)[`cot${index + 1}`]}
                        helperText={(errors as any)[`cot${index + 1}`]?.message ?? ''}
                        onHeightChange={adjustFieldHeight}
                      />
                    )}
                  />
                  {renderGuideButton(`cot${index + 1}`, fieldName)}
                </>
              ) : (
                <ResizableTextField
                  fieldName={fieldName}
                  label={fieldName}
                  rows={getFieldRows(fieldName)}
                  heightPx={getFieldHeight(fieldName)}
                  fullWidth
                  value={cotNFields[fieldName] || ''}
                  onChange={(e) => onCotNFieldChange(fieldName, e.target.value)}
                  placeholder={`${fieldName} 내용을 입력해 주세요`}
                  onHeightChange={adjustFieldHeight}
                />
              )}
            </Box>
            {index >= 3 && (
              <IconButton
                color="error"
                onClick={() => onRemoveCotField(index)}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}

        {/* CoT 추가 버튼 */}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddCotField}
          sx={{ alignSelf: 'flex-start' }}
        >
          CoT 단계 추가
        </Button>

        <Divider />

        {/* 답변 */}
        <Box sx={{ position: 'relative' }}>
          <Controller
            name="answer"
            control={control}
            render={({ field }) => (
              <ResizableTextField
                {...field}
                fieldName="answer"
                label="답변"
                rows={getFieldRows("answer")}
                heightPx={getFieldHeight("answer")}
                fullWidth
                placeholder="답변을 입력해 주세요"
                error={!!errors.answer}
                helperText={String(errors.answer?.message ?? '')}
                onHeightChange={adjustFieldHeight}
              />
            )}
          />
          {renderGuideButton('answer', '답변')}
        </Box>

        {/* 리뷰 의견 - 답변 아래 */}
        <Box sx={{ mt: 2 }}>
          <Controller
            name="reviewComment"
            control={control}
            render={({ field }) => (
              <ResizableTextField
                {...field}
                fieldName="reviewComment"
                label="리뷰 의견"
                rows={getFieldRows('reviewComment')}
                heightPx={getFieldHeight('reviewComment')}
                fullWidth
                placeholder="리뷰어의 검사/피드백 의견을 입력해 주세요"
                error={!!(errors as any).reviewComment}
                helperText={String((errors as any).reviewComment?.message ?? '')}
                onHeightChange={adjustFieldHeight}
              />
            )}
          />
        </Box>

        {/* CoT 상태 및 작성자 */}
        <Grid2 container spacing={2}>
          <Grid2 size={6}>
            <Controller
              name="datasetStatus"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>CoT 상태 *</InputLabel>
                  <Select
                    {...field}
                    label="CoT 상태 *"
                  >
                    <MenuItem value="초안">초안</MenuItem>
                    <MenuItem value="검토중">검토중</MenuItem>
                    <MenuItem value="완료">완료</MenuItem>
                    <MenuItem value="보류">보류</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid2>
          <Grid2 size={6}>
            <Controller
              name="author"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="작성자"
                  fullWidth
                  error={!!errors.author}
                  helperText={String(errors.author?.message ?? '설정에서 기본 작성자를 변경할 수 있습니다')}
                />
              )}
            />
          </Grid2>
        </Grid2>
        </Box>
      </Box>

      {/* 가이드 다이얼로그 */}
      <Dialog
        open={guideDialogOpen}
        onClose={() => setGuideDialogOpen(false)}
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
          <Typography variant="h6">{guideTitle}</Typography>
          <IconButton
            onClick={() => setGuideDialogOpen(false)}
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
          {guideContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {guideContent}
            </ReactMarkdown>
          ) : (
            <Typography color="text.secondary" fontStyle="italic">
              내용이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setGuideDialogOpen(false)} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
