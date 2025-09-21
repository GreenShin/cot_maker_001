import React from 'react';
import { Control, FieldErrors, Controller, useFieldArray } from 'react-hook-form';
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
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';

interface UserFormData {
  customerSource: '증권' | '보험';
  ageGroup: string;
  gender: '남' | '여';
  investmentAmount?: string;
  investmentTendency?: string;
  insuranceCrossRatio?: string;
  ownedProducts: Array<{
    productName: string;
    purchaseDate: string;
  }>;
}

interface OwnedProductField {
  id: string;
  productName: string;
  purchaseDate: string;
}

interface UserFormPanelProps {
  isEditMode: boolean;
  control: Control<UserFormData>;
  errors: FieldErrors<UserFormData>;
  isSubmitting: boolean;
  watchedCustomerSource: string;
  ownedProductFields: OwnedProductField[];
  onSubmit: () => void;
  onBack: () => void;
  onDelete: () => void;
  onAddOwnedProduct: () => void;
  onRemoveOwnedProduct: (index: number) => void;
}

// 고객출처별 투자성향/보험가입교차비율 옵션
const getInvestmentTendencyOptions = (): string[] => [
  '미정의', '공격투자형', '적극투자형', '위험중립형', '안정추구형', '전문투자가형'
];

const getInsuranceCrossRatioOptions = (): string[] => [
  '미정의', '보장only', '변액only', '기타only', 
  '보장+변액', '보장+기타', '변액+기타', '보장+변액+기타'
];

const ageGroupOptions = [
  '10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상'
];

const investmentAmountOptions = [
  '1000만원 이하', '3000만원 이하', '5000만원 이하', '1억원 이하', '1억원 초과'
];

export function UserFormPanel({
  isEditMode,
  control,
  errors,
  isSubmitting,
  watchedCustomerSource,
  ownedProductFields,
  onSubmit,
  onBack,
  onDelete,
  onAddOwnedProduct,
  onRemoveOwnedProduct,
}: UserFormPanelProps) {
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
          {isEditMode ? '질문자 수정' : '새 질문자 생성'}
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
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* 기본 정보 섹션 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                기본 정보
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Controller
                    name="customerSource"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.customerSource}>
                        <InputLabel>고객출처</InputLabel>
                        <Select
                          {...field}
                          label="고객출처"
                        >
                          <MenuItem value="증권">증권</MenuItem>
                          <MenuItem value="보험">보험</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <Controller
                    name="ageGroup"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.ageGroup}>
                        <InputLabel>연령대</InputLabel>
                        <Select
                          {...field}
                          label="연령대"
                        >
                          {ageGroupOptions.map((age) => (
                            <MenuItem key={age} value={age}>
                              {age}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.gender}>
                        <InputLabel>성별</InputLabel>
                        <Select
                          {...field}
                          label="성별"
                        >
                          <MenuItem value="남">남성</MenuItem>
                          <MenuItem value="여">여성</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 투자 정보 섹션 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                투자 정보
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Controller
                    name="investmentAmount"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>투자액</InputLabel>
                        <Select
                          {...field}
                          label="투자액"
                        >
                          {investmentAmountOptions.map((amount) => (
                            <MenuItem key={amount} value={amount}>
                              {amount}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  {watchedCustomerSource === '증권' ? (
                    <Controller
                      name="investmentTendency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>투자성향</InputLabel>
                          <Select
                            {...field}
                            label="투자성향"
                          >
                            {getInvestmentTendencyOptions().map((tendency) => (
                              <MenuItem key={tendency} value={tendency}>
                                {tendency}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  ) : (
                    <Controller
                      name="insuranceCrossRatio"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>보험가입교차비율</InputLabel>
                          <Select
                            {...field}
                            label="보험가입교차비율"
                          >
                            {getInsuranceCrossRatioOptions().map((ratio) => (
                              <MenuItem key={ratio} value={ratio}>
                                {ratio}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 보유상품 섹션 */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  보유상품 ({ownedProductFields.length}개)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={onAddOwnedProduct}
                >
                  상품 추가
                </Button>
              </Box>

              {ownedProductFields.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    보유상품이 없습니다. 상품을 추가해보세요.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ownedProductFields.map((field, index) => (
                    <Box key={field.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Controller
                              name={`ownedProducts.${index}.productName`}
                              control={control}
                              render={({ field: inputField }) => (
                                <TextField
                                  {...inputField}
                                  label="상품명"
                                  fullWidth
                                  error={!!errors.ownedProducts?.[index]?.productName}
                                  helperText={errors.ownedProducts?.[index]?.productName?.message}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Controller
                              name={`ownedProducts.${index}.purchaseDate`}
                              control={control}
                              render={({ field: inputField }) => (
                                <TextField
                                  {...inputField}
                                  label="구매년월 (YYYY-MM)"
                                  placeholder="2024-01"
                                  fullWidth
                                  error={!!errors.ownedProducts?.[index]?.purchaseDate}
                                  helperText={errors.ownedProducts?.[index]?.purchaseDate?.message || 'YYYY-MM 형식으로 입력'}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                      <IconButton
                        color="error"
                        onClick={() => onRemoveOwnedProduct(index)}
                        sx={{ mt: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
