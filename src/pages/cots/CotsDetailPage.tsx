import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { Detail3Pane } from '../../components/layout/Detail3Pane';
import { UserSelectorDialog } from '../../components/selectors/UserSelectorDialog';
import { ProductSelectorDialog } from '../../components/selectors/ProductSelectorDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RootState } from '../../store';
import { initializeSettings } from '../../store/slices/settingsSlice';
import { CoTQA } from '../../models/cotqa';
import { UserAnon } from '../../models/userAnon';
import { Product } from '../../models/product';

// 폼 검증 스키마
const cotFormSchema = z.object({
  productSource: z.enum(['securities', 'insurance']),
  questionType: z.string().min(1, '질문유형을 선택해 주세요'),
  question: z.string().min(1, '질문을 입력해 주세요'),
  cot1: z.string().min(1, 'CoT1을 입력해 주세요'),
  cot2: z.string().min(1, 'CoT2를 입력해 주세요'),
  cot3: z.string().min(1, 'CoT3을 입력해 주세요'),
  answer: z.string().min(1, '답변을 입력해 주세요'),
  datasetStatus: z.string(),
  author: z.string().min(1, '작성자를 입력해 주세요'),
});

type CotFormData = z.infer<typeof cotFormSchema>;

interface CotsDetailPageProps {}

export function CotsDetailPage({}: CotsDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  
  const isEditMode = id !== 'new';
  const [selectedUser, setSelectedUser] = React.useState<UserAnon | null>(null);
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);
  const [cotFields, setCotFields] = React.useState(['CoT1', 'CoT2', 'CoT3']);
  
  // 팝업 상태
  const [userSelectorOpen, setUserSelectorOpen] = React.useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // React Hook Form 설정
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CotFormData>({
    resolver: zodResolver(cotFormSchema),
    defaultValues: {
      productSource: 'securities',
      questionType: '',
      question: '',
      cot1: '',
      cot2: '',
      cot3: '',
      answer: '',
      datasetStatus: 'draft',
      author: '',
    },
  });

  const watchedProductSource = watch('productSource');

  // 상품분류 변경시 질문유형 초기화
  React.useEffect(() => {
    setValue('questionType', '');
  }, [watchedProductSource, setValue]);

  // 설정 초기화
  React.useEffect(() => {
    dispatch(initializeSettings());
  }, [dispatch]);

  // 설정 로드 후 작성자 업데이트
  React.useEffect(() => {
    if (!isEditMode && settings.author) {
      setValue('author', settings.author);
    }
  }, [settings.author, isEditMode, setValue]);
  
  // 동적 CoTn 필드 상태
  const [cotNFields, setCotNFields] = React.useState<Record<string, string>>({});

  const handleAddCotField = () => {
    const nextIndex = cotFields.length + 1;
    setCotFields([...cotFields, `CoT${nextIndex}`]);
  };

  const handleRemoveCotField = (index: number) => {
    if (index >= 3) { // CoT1-3은 필수이므로 삭제 불가
      const newFields = cotFields.filter((_, i) => i !== index);
      setCotFields(newFields);
      // CoTn 데이터에서도 제거
      const newCotN = { ...cotNFields };
      delete newCotN[`CoT${index + 1}`];
      setCotNFields(newCotN);
    }
  };

  const onSubmit = (data: CotFormData) => {
    // TODO: 저장 로직 구현
    const formDataWithCotN = {
      ...data,
      cotN: cotNFields,
      selectedUser,
      selectedProducts,
    };
    console.log('Save CoT:', formDataWithCotN);
  };

  const handleBack = () => {
    navigate('/');
  };

  // 질문자 선택 핸들러
  const handleUserSelect = (user: UserAnon) => {
    setSelectedUser(user);
  };

  // 상품 선택 핸들러
  const handleProductsSelect = (products: Product[]) => {
    setSelectedProducts(products);
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (isEditMode) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    // TODO: 실제 삭제 로직 구현
    console.log('Delete CoT:', id);
    setDeleteConfirmOpen(false);
    navigate('/');
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  // 상품분류에 따른 질문유형 옵션
  const getQuestionTypes = (productSource: string): string[] => {
    if (productSource === 'securities') {
      return ['고객 특성 강조형', '투자성향 및 조건 기반형', '상품비교 추천형'];
    } else {
      return ['연령별 및 생애주기 저축성 상품 추천형', '투자성 상품 추천형', '건강 및 질병 보장 대비형'];
    }
  };

  // 왼쪽 패널: 질문자 검색/선택
  const leftPanel = (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        질문자 선택
      </Typography>
      
      {!selectedUser ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            질문자를 선택해 주세요
          </Typography>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => setUserSelectorOpen(true)}
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
            onClick={() => setUserSelectorOpen(true)}
          >
            다른 질문자 선택
          </Button>
        </Box>
      )}
    </Paper>
  );

  // 중앙 패널: CoT 폼
  const centerPanel = (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {isEditMode ? 'CoT 수정' : '새 CoT 생성'}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            목록
          </Button>
          {isEditMode && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleDelete}
              sx={{ mr: 1 }}
            >
              삭제
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            저장
          </Button>
        </Box>
      </Box>

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
                    <MenuItem value="securities">증권</MenuItem>
                    <MenuItem value="insurance">보험</MenuItem>
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
            <TextField
              {...field}
              label="질문"
              multiline
              rows={3}
              fullWidth
              placeholder="질문을 입력해 주세요"
              error={!!errors.question}
              helperText={errors.question?.message}
            />
          )}
        />

        {/* CoT 필드들 */}
        {cotFields.map((fieldName, index) => (
          <Box key={fieldName} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {index < 3 ? (
              <Controller
                name={`cot${index + 1}` as keyof CotFormData}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={fieldName + ' (필수)'}
                    multiline
                    rows={2}
                    fullWidth
                    placeholder={`${fieldName} 내용을 입력해 주세요`}
                    error={!!errors[`cot${index + 1}` as keyof typeof errors]}
                    helperText={errors[`cot${index + 1}` as keyof typeof errors]?.message}
                  />
                )}
              />
            ) : (
              <TextField
                label={fieldName}
                multiline
                rows={2}
                fullWidth
                value={cotNFields[fieldName] || ''}
                onChange={(e) => {
                  setCotNFields({
                    ...cotNFields,
                    [fieldName]: e.target.value,
                  });
                }}
                placeholder={`${fieldName} 내용을 입력해 주세요`}
              />
            )}
            {index >= 3 && (
              <IconButton
                color="error"
                onClick={() => handleRemoveCotField(index)}
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
          onClick={handleAddCotField}
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
            <TextField
              {...field}
              label="답변"
              multiline
              rows={4}
              fullWidth
              placeholder="답변을 입력해 주세요"
              error={!!errors.answer}
              helperText={errors.answer?.message}
            />
          )}
        />

        {/* CoT 상태 */}
        <Controller
          name="datasetStatus"
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

        {/* 작성자 */}
        <Controller
          name="author"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="작성자"
              disabled={isEditMode}
              error={!!errors.author}
              helperText={errors.author?.message || (isEditMode ? '수정 모드에서는 작성자를 변경할 수 없습니다' : '설정에서 기본 작성자를 변경할 수 있습니다')}
            />
          )}
        />
      </Box>
    </Paper>
  );

  // 오른쪽 패널: 상품 검색/다중선택
  const rightPanel = (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        상품 선택
      </Typography>
      
      <Button
        variant="outlined"
        startIcon={<SearchIcon />}
        onClick={() => setProductSelectorOpen(true)}
        sx={{ mb: 2 }}
        fullWidth
      >
        상품 검색
      </Button>

      {selectedProducts.length === 0 ? (
        <Alert severity="info">
          상품을 선택해 주세요. 여러 개의 상품을 선택할 수 있습니다.
        </Alert>
      ) : (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            선택된 상품 ({selectedProducts.length}개)
          </Typography>
          {selectedProducts.map((product, index) => (
            <Accordion key={product.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {product.productName}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={product.productSource} 
                    color={product.productSource === '증권' ? 'primary' : 'secondary'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  <strong>상품분류:</strong> {product.productCategory}<br />
                  <strong>세금유형:</strong> {product.taxType}<br />
                  <strong>위험등급:</strong> {product.riskLevel}<br />
                  <strong>상품설명:</strong> {'description' in product ? product.description || '설명 없음' : '설명 없음'}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );

  return (
    <>
      <Detail3Pane
        leftPanel={leftPanel}
        centerPanel={centerPanel}
        rightPanel={rightPanel}
      />
      
      {/* 질문자 선택 팝업 */}
      <UserSelectorDialog
        open={userSelectorOpen}
        onClose={() => setUserSelectorOpen(false)}
        onSelect={handleUserSelect}
        selectedUserId={selectedUser?.id}
      />
      
      {/* 상품 선택 팝업 */}
      <ProductSelectorDialog
        open={productSelectorOpen}
        onClose={() => setProductSelectorOpen(false)}
        onSelect={handleProductsSelect}
        selectedProductIds={selectedProducts.map(p => p.id)}
      />
      
      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="CoT 삭제"
        message="정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
