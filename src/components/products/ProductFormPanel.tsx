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
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
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

          {/* 상품유형별 상세 정보 */}
          {/* 공통 상단: 납입형태 */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>유형별 상세</Typography>
              <Grid container spacing={2}>
                {/* 증권 전용 */}
                {watchedProductSource === '증권' && (
                  <>
                    <Grid item xs={4}>
                      <Controller
                        name="protectedType"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>상품 유형</InputLabel>
                            <Select {...field} label="상품 유형" value={field.value ?? ''}>
                              <MenuItem value="">선택 안함</MenuItem>
                              <MenuItem value="원금보장형">원금보장형</MenuItem>
                              <MenuItem value="원금비보장형">원금비보장형</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="maturityType"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>만기</InputLabel>
                            <Select {...field} label="만기" value={field.value ?? ''}>
                              <MenuItem value="">선택 안함</MenuItem>
                              <MenuItem value="없음">없음</MenuItem>
                              <MenuItem value="있음">있음</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="maturityPeriod"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="만기 기간"
                            fullWidth
                            placeholder="예: 1개월, 3개월, 1년, 3~10년"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="incomeRate6m"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="최근 6개월 수익률"
                            fullWidth
                            placeholder="예: +3.2%"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="riskGrade"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>위험등급(라벨)</InputLabel>
                            <Select {...field} label="위험등급(라벨)" value={field.value ?? ''}>
                              <MenuItem value="">선택 안함</MenuItem>
                              <MenuItem value="1등급(매우높은위험)">1등급(매우높은위험)</MenuItem>
                              <MenuItem value="2등급(높은위험)">2등급(높은위험)</MenuItem>
                              <MenuItem value="3등급(다소높은위험)">3등급(다소높은위험)</MenuItem>
                              <MenuItem value="4등급(보통위험)">4등급(보통위험)</MenuItem>
                              <MenuItem value="5등급(낮은위험)">5등급(낮은위험)</MenuItem>
                              <MenuItem value="6등급(매우낮은위험)">6등급(매우낮은위험)</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="paymentType"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>납입형태</InputLabel>
                            <Select {...field} label="납입형태" value={field.value ?? ''}>
                              <MenuItem value="">선택 안함</MenuItem>
                              <MenuItem value="일시납">일시납</MenuItem>
                              <MenuItem value="월납">월납</MenuItem>
                              <MenuItem value="혼합">혼합</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="lossRate"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>손실한도 유무</InputLabel>
                            <Select {...field} label="손실한도 유무" value={field.value ?? ''}>
                              <MenuItem value="">선택 안함</MenuItem>
                              <MenuItem value="유">유</MenuItem>
                              <MenuItem value="무">무</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="liquidityConditions"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="유동성 조건"
                            fullWidth
                            placeholder="중도해지, 환매조건 등"
                          />
                        )}
                      />
                    </Grid>
                  </>
                )}

                {/* 보험 전용 */}
                {watchedProductSource === '보험' && (
                  <>
                    <Grid item xs={6}>
                      <Controller
                        name="motherProductName"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField {...field} label="모상품명" fullWidth />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="riderType"
                        control={control}
                        defaultValue={undefined}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>특약유형</InputLabel>
                            <Select {...field} label="특약유형">
                              {['사망','후유장해','간병','진단비','수술비','의료비','일당','배책','운전자','재물'].map(v => (
                                <MenuItem key={v} value={v}>{v}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="productPeriod"
                        control={control}
                        defaultValue={undefined}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>보험기간</InputLabel>
                            <Select {...field} label="보험기간">
                              <MenuItem value="종신">종신</MenuItem>
                              <MenuItem value="비종신">비 종신</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="disclosureType"
                        control={control}
                        defaultValue={undefined}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>고지형태</InputLabel>
                            <Select {...field} label="고지형태">
                              {['간편고지','초간편고지','일반 심사'].map(v => (
                                <MenuItem key={v} value={v}>{v}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="renewableType"
                        control={control}
                        defaultValue={undefined}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>갱신형 여부</InputLabel>
                            <Select {...field} label="갱신형 여부">
                              <MenuItem value="갱신형">갱신형</MenuItem>
                              <MenuItem value="미갱신형">미갱신형</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="refundType"
                        control={control}
                        defaultValue={undefined}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>해약환급금</InputLabel>
                            <Select {...field} label="해약환급금">
                              <MenuItem value="유">유</MenuItem>
                              <MenuItem value="무">무</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="paymentType"
                        control={control}
                        defaultValue={undefined}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>납입형태</InputLabel>
                            <Select {...field} label="납입형태">
                              <MenuItem value="일시납">일시납</MenuItem>
                              <MenuItem value="월납">월납</MenuItem>
                              <MenuItem value="혼합">혼합</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Controller
                        name="eligibleAge"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField {...field} label="자격연령" fullWidth placeholder="예: 20-60세" />
                        )}
                      />
                    </Grid>
                    <Grid item xs={8}>
                      <Controller
                        name="exclusionItems"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField {...field} label="면책항목" fullWidth />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller
                        name="paymentConditions"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField {...field} label="특정 지급조건" fullWidth />
                        )}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
