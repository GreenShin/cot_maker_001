import React from 'react';
import { Control, FieldErrors, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { ResizableTextField } from '../common/ResizableTextField';
import { useTextareaHeights } from '../../hooks/useTextareaHeights';

interface CotFormData {
  productSource: '증권' | '보험';
  questionType: string;
  question: string;
  cot1: string;
  cot2: string;
  cot3: string;
  answer: string;
  status: '초안' | '검토중' | '완료' | '보류';
  author?: string;
  [key: string]: any; // 동적 CoT 필드들 허용
}

interface CotFormPanelProps {
  isEditMode: boolean;
  control: Control<CotFormData>;
  errors: FieldErrors<CotFormData>;
  isSubmitting: boolean;
  watchedProductSource: string;
  cotFields: string[];
  cotNFields: Record<string, string>;
  onSubmit: () => void;
  onBack: () => void;
  onDelete: () => void;
  onAddCotField: () => void;
  onRemoveCotField: (index: number) => void;
  onCotNFieldChange: (fieldName: string, value: string) => void;
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
  cotFields,
  cotNFields,
  onSubmit,
  onBack,
  onDelete,
  onAddCotField,
  onRemoveCotField,
  onCotNFieldChange,
}: CotFormPanelProps) {
  const { heights, adjustFieldHeight, getFieldHeight, getFieldRows } = useTextareaHeights();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mr: 1 }}
          >
            목록
          </Button>
          {isEditMode && (
            <Button
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
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            저장
          </Button>
        </Box>
      </Box>

      {/* 스크롤 가능한 폼 콘텐츠 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 첫 번째 줄: 상품분류, 질문유형 */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Controller
              name="productSource"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.productSource}>
                  <InputLabel>상품분류</InputLabel>
                  <Select
                    {...field}
                    label="상품분류"
                  >
                    <MenuItem value="증권">증권</MenuItem>
                    <MenuItem value="보험">보험</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller
              name="questionType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.questionType}>
                  <InputLabel>질문유형</InputLabel>
                  <Select
                    {...field}
                    label="질문유형"
                  >
                    {getQuestionTypes(watchedProductSource).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.questionType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.questionType.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>

        {/* 두 번째 줄: 질문 */}
        <Controller
          name="question"
          control={control}
          render={({ field }) => (
            <ResizableTextField
              {...field}
              fieldName="question"
              label="질문"
              rows={getFieldRows("question")}
              heightPx={getFieldHeight("question")}
              fullWidth
              placeholder="질문을 입력해 주세요"
              error={!!errors.question}
              helperText={errors.question?.message}
              onHeightChange={adjustFieldHeight}
            />
          )}
        />

        {/* CoT 필드들 */}
        {cotFields.map((fieldName, index) => (
          <Box key={fieldName} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              {index < 3 ? (
                <Controller
                  name={index === 0 ? 'cot1' : index === 1 ? 'cot2' : 'cot3'}
                  control={control}
                  render={({ field }) => (
                    <ResizableTextField
                      {...field}
                      fieldName={`cot${index + 1}`}
                      label={fieldName + ' (필수)'}
                      rows={getFieldRows(`cot${index + 1}`)}
                      heightPx={getFieldHeight(`cot${index + 1}`)}
                      fullWidth
                      placeholder={`${fieldName} 내용을 입력해 주세요`}
                      error={!!(index === 0 ? errors.cot1 : index === 1 ? errors.cot2 : errors.cot3)}
                      helperText={(index === 0 ? errors.cot1 : index === 1 ? errors.cot2 : errors.cot3)?.message}
                      onHeightChange={adjustFieldHeight}
                    />
                  )}
                />
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
              helperText={errors.answer?.message}
              onHeightChange={adjustFieldHeight}
            />
          )}
        />

        {/* CoT 상태 및 작성자 */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>CoT 상태</InputLabel>
                  <Select
                    {...field}
                    label="CoT 상태"
                  >
                    <MenuItem value="draft">초안</MenuItem>
                    <MenuItem value="review">검토중</MenuItem>
                    <MenuItem value="approved">승인됨</MenuItem>
                    <MenuItem value="rejected">반려됨</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={6}>
            <Controller
              name="author"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="작성자"
                  fullWidth
                  disabled={isEditMode}
                  error={!!errors.author}
                  helperText={errors.author?.message || (isEditMode ? '수정 모드에서는 작성자를 변경할 수 없습니다' : '설정에서 기본 작성자를 변경할 수 있습니다')}
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>
        </Box>
      </Box>
    </Box>
  );
}
