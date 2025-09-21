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
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { ProductFormData } from '../../hooks/useProductForm';
import {
  productSourceOptions,
  getProductCategoriesBySource,
  taxTypeOptions,
  riskLevelOptions,
} from '../../models/product';

interface ProductFormPanelProps {
  isEditMode: boolean;
  control: Control<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  isSubmitting: boolean;
  watchedProductSource: '증권' | '보험';
  onSubmit: () => void;
  onBack: () => void;
  onDelete: () => void;
}

export function ProductFormPanel({
  isEditMode,
  control,
  errors,
  isSubmitting,
  watchedProductSource,
  onSubmit,
  onBack,
  onDelete,
}: ProductFormPanelProps) {

  // 현재 선택된 상품출처에 따른 상품분류 옵션
  const categoryOptions = getProductCategoriesBySource(watchedProductSource);

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
          {isEditMode ? '상품 수정' : '새 상품 생성'}
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
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* 기본 정보 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>기본 정보</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Controller
                    name="productSource"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.productSource}>
                        <InputLabel>상품출처</InputLabel>
                        <Select {...field} label="상품출처">
                          {productSourceOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                        {errors.productSource && (
                          <Typography variant="caption" color="error">
                            {errors.productSource.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="productCategory"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.productCategory}>
                        <InputLabel>상품분류</InputLabel>
                        <Select {...field} label="상품분류">
                          {categoryOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                        {errors.productCategory && (
                          <Typography variant="caption" color="error">
                            {errors.productCategory.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 상품 세부 정보 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>상품 세부 정보</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="productName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="상품명"
                        fullWidth
                        error={!!errors.productName}
                        helperText={errors.productName?.message}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="상품 설명"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name="taxType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.taxType}>
                        <InputLabel>세금유형</InputLabel>
                        <Select {...field} label="세금유형">
                          {taxTypeOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                        {errors.taxType && (
                          <Typography variant="caption" color="error">
                            {errors.taxType.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name="riskLevel"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.riskLevel}>
                        <InputLabel>위험등급</InputLabel>
                        <Select {...field} label="위험등급">
                          {riskLevelOptions.map(option => (
                            <MenuItem key={option} value={option}>
                              {option}등급
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.riskLevel && (
                          <Typography variant="caption" color="error">
                            {errors.riskLevel.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name="managementCompany"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="운용사"
                        fullWidth
                        error={!!errors.managementCompany}
                        helperText={errors.managementCompany?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="expectedReturn"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="예상수익률"
                        fullWidth
                        placeholder="예: 연 3-5% 또는 변동형"
                        error={!!errors.expectedReturn}
                        helperText={errors.expectedReturn?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
