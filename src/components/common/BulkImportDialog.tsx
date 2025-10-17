import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon, Info } from '@mui/icons-material';
import { storageService } from '../../services/storage/storageService';
import { importCsvData, importJsonData, importXlsxData, type ImportableEntity, type CharsetEncoding } from '../../services/io/importer';

interface BulkImportDialogProps {
  open: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  entityType: 'users' | 'products' | 'cots';
  onSuccess?: (count: number) => void;
  onError?: (error: string) => void;
}

// Entity type 매핑 함수
const getImportableEntityType = (entityType: 'users' | 'products' | 'cots'): ImportableEntity => {
  switch (entityType) {
    case 'users': return 'userAnon';
    case 'products': return 'product';
    case 'cots': return 'cotqa';
    default: throw new Error(`지원하지 않는 엔티티: ${entityType}`);
  }
};

interface ImportProgress {
  stage: 'parsing' | 'validating' | 'importing' | 'completed' | 'error';
  progress: number;
  message: string;
  totalItems?: number;
  processedItems?: number;
}

// Charset 옵션 정의
const charsetOptions: { value: CharsetEncoding; label: string; description: string }[] = [
  { value: 'utf-8-bom', label: 'UTF-8 BOM (권장)', description: 'Excel 호환, 한글 정상 표시' },
  { value: 'utf-8', label: 'UTF-8', description: '유니코드 표준 (BOM 없음)' },
  { value: 'euc-kr', label: 'EUC-KR', description: '한국어 레거시 인코딩' },
  { value: 'shift-jis', label: 'Shift-JIS', description: '일본어' },
  { value: 'iso-8859-1', label: 'ISO-8859-1', description: '서유럽 문자' },
  { value: 'windows-1252', label: 'Windows-1252', description: 'Windows 라틴 문자' },
];

export function BulkImportDialog({
  open,
  onClose,
  entityType,
  onSuccess,
  onError
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [charset, setCharset] = useState<CharsetEncoding>('utf-8-bom');
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    stage: 'parsing',
    progress: 0,
    message: '준비 중...'
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    errors: string[];
  } | null>(null);

  const steps = [
    { key: 'parsing', label: '파일 파싱', description: '파일을 읽고 데이터를 추출합니다' },
    { key: 'validating', label: '데이터 검증', description: '스키마 규칙에 따라 데이터를 검증합니다' },
    { key: 'importing', label: '데이터 저장', description: '검증된 데이터를 데이터베이스에 저장합니다' },
    { key: 'completed', label: '완료', description: 'Import가 성공적으로 완료되었습니다' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const getFileType = (file: File): 'csv' | 'json' | 'xlsx' | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') return 'csv';
    if (extension === 'json') return 'json';
    if (extension === 'xlsx' || extension === 'xls') return 'xlsx';
    return null;
  };

  const handleImport = async () => {
    if (!file) return;

    const fileType = getFileType(file);
    if (!fileType) {
      onError?.('지원하지 않는 파일 형식입니다. CSV, JSON, XLSX 파일만 지원합니다.');
      return;
    }

    setIsImporting(true);
    setImportProgress({ stage: 'parsing', progress: 0, message: '파일을 읽는 중...' });

    try {
      // 1단계: 파일 파싱
      const importableEntityType = getImportableEntityType(entityType);
      let parseResult;
      const progressCallback = (progress: number) => {
        setImportProgress({
          stage: 'parsing',
          progress: progress * 0.5, // 파싱은 전체의 50%
          message: '파일을 파싱하는 중...'
        });
      };

      switch (fileType) {
        case 'csv':
          const csvBuffer = await file.arrayBuffer();
          parseResult = await importCsvData(csvBuffer, importableEntityType, { 
            onProgress: progressCallback,
            charset 
          });
          break;
        case 'json':
          const jsonText = await file.text();
          try {
            const jsonData = JSON.parse(jsonText);
            if (!Array.isArray(jsonData)) {
              throw new Error('JSON 파일은 배열 형태여야 합니다');
            }
            parseResult = await importJsonData(jsonData, importableEntityType, { 
              onProgress: progressCallback 
            });
          } catch (jsonError: any) {
            throw new Error(`JSON 파싱 오류: ${jsonError.message}`);
          }
          break;
        case 'xlsx':
          const arrayBuffer = await file.arrayBuffer();
          parseResult = await importXlsxData(arrayBuffer, importableEntityType, { 
            onProgress: progressCallback 
          });
          break;
      }

      if (!parseResult.success) {
        const errorMessages = parseResult.errors
          .slice(0, 5) // 처음 5개 에러만 표시
          .map(error => `행 ${error.row}: ${error.message}`)
          .join(', ');
        const totalErrors = parseResult.errors.length;
        const moreErrors = totalErrors > 5 ? ` (총 ${totalErrors}개 에러)` : '';
        throw new Error(`파싱 실패: ${errorMessages}${moreErrors}`);
      }

      setImportProgress({
        stage: 'validating',
        progress: 25,
        message: `${parseResult.data.length}개 항목 검증 중...`,
        totalItems: parseResult.data.length
      });

      // 2단계: 데이터 검증 (이미 파싱 단계에서 완료됨)
      await new Promise(resolve => setTimeout(resolve, 500)); // UI 업데이트를 위한 지연

      setImportProgress({
        stage: 'importing',
        progress: 50,
        message: '데이터베이스에 저장 중...',
        totalItems: parseResult.data.length,
        processedItems: 0
      });

      // 3단계: 대량 Import
      await storageService.bulkImport(
        entityType,
        parseResult.data,
        (progress) => {
          const processedItems = Math.floor((progress / 100) * parseResult.data.length);
          setImportProgress({
            stage: 'importing',
            progress: 50 + (progress / 2), // 50% ~ 100%
            message: `${processedItems}/${parseResult.data.length} 항목 저장 중...`,
            totalItems: parseResult.data.length,
            processedItems
          });
        }
      );

      // 4단계: 완료
      setImportProgress({
        stage: 'completed',
        progress: 100,
        message: `${parseResult.data.length}개 항목이 성공적으로 Import되었습니다.`,
        totalItems: parseResult.data.length,
        processedItems: parseResult.data.length
      });

      setImportResult({
        success: true,
        count: parseResult.data.length,
        errors: []
      });

      onSuccess?.(parseResult.data.length);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import 중 오류가 발생했습니다';
      
      setImportProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      setImportResult({
        success: false,
        count: 0,
        errors: [errorMessage]
      });

      onError?.(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      const shouldRefresh = importResult?.success || false;
      setFile(null);
      setImportProgress({ stage: 'parsing', progress: 0, message: '준비 중...' });
      setImportResult(null);
      onClose(shouldRefresh);
    }
  };

  const getActiveStep = () => {
    const stageIndex = steps.findIndex(step => step.key === importProgress.stage);
    return Math.max(0, stageIndex);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isImporting}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudUpload />
          대용량 데이터 Import
          <Chip 
            label={entityType === 'users' ? '질문자' : entityType === 'products' ? '상품' : 'CoT'} 
            size="small" 
            color="primary" 
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {!isImporting && !importResult && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                대용량 데이터 Import를 위해 최적화된 기능입니다. 
                최대 30만개 항목까지 처리 가능하며, IndexedDB를 사용하여 브라우저에 저장됩니다.
              </Typography>
            </Alert>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {file ? (
                <Box>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="h6">{file.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)} • {getFileType(file)?.toUpperCase()}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6">파일을 선택하세요</Typography>
                  <Typography variant="body2" color="text.secondary">
                    CSV, JSON, XLSX 형식 지원
                  </Typography>
                </Box>
              )}
            </Box>

            {file && getFileType(file) === 'csv' && (
              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>문자 인코딩</InputLabel>
                  <Select
                    value={charset}
                    onChange={(e) => setCharset(e.target.value as CharsetEncoding)}
                    label="문자 인코딩"
                  >
                    {charsetOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography>{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Excel에서 저장한 CSV 파일은 대부분 <strong>UTF-8 BOM</strong>입니다. 한글이 깨지면 다른 인코딩을 시도해보세요.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {(isImporting || importResult) && (
          <Box>
            <Stepper activeStep={getActiveStep()} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.key}>
                  <StepLabel
                    error={importProgress.stage === 'error' && index === getActiveStep()}
                    StepIconComponent={({ active, completed, error }) => {
                      if (error) return <ErrorIcon color="error" />;
                      if (completed) return <CheckCircle color="success" />;
                      if (active) return <Info color="primary" />;
                      return <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#e0e0e0' }} />;
                    }}
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                    {index === getActiveStep() && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {importProgress.message}
                        </Typography>
                        {importProgress.totalItems && importProgress.processedItems !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            {importProgress.processedItems} / {importProgress.totalItems} 항목 처리됨
                          </Typography>
                        )}
                        <LinearProgress 
                          variant="determinate" 
                          value={importProgress.progress} 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {importResult && (
              <Box sx={{ mt: 2 }}>
                <Alert 
                  severity={importResult.success ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
                  {importResult.success ? (
                    <Typography>
                      ✅ {importResult.count}개 항목이 성공적으로 Import되었습니다.
                    </Typography>
                  ) : (
                    <Box>
                      <Typography>❌ Import 실패</Typography>
                      {importResult.errors.map((error, index) => (
                        <Typography key={index} variant="body2" sx={{ mt: 1 }}>
                          • {error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isImporting}>
          {importResult?.success ? '완료' : '취소'}
        </Button>
        {file && !isImporting && !importResult && (
          <Button
            variant="contained"
            onClick={handleImport}
            startIcon={<CloudUpload />}
          >
            Import 시작
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
