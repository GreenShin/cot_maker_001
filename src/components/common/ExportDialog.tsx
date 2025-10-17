import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  LinearProgress,
} from '@mui/material';
import { Download, CheckCircle } from '@mui/icons-material';
import { exportToCsv, exportToJson, exportToXlsx, downloadFile, type CharsetEncoding } from '../../services/io/exporter';
import type { ImportableEntity } from '../../services/io/importer';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: 'users' | 'products' | 'cots';
  data: any[];
  filename?: string;
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

// Entity type 매핑 함수
const getImportableEntityType = (entityType: 'users' | 'products' | 'cots'): ImportableEntity => {
  switch (entityType) {
    case 'users': return 'userAnon';
    case 'products': return 'product';
    case 'cots': return 'cotqa';
    default: throw new Error(`지원하지 않는 엔티티: ${entityType}`);
  }
};

export function ExportDialog({
  open,
  onClose,
  entityType,
  data,
  filename
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [charset, setCharset] = useState<CharsetEncoding>('utf-8-bom');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  // 다이얼로그가 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open) {
      setIsExporting(false);
      setExportProgress(0);
      setExportComplete(false);
      setFormat('csv');
      setCharset('utf-8-bom');
    }
  }, [open]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const importableEntityType = getImportableEntityType(entityType);
      const options = {
        onProgress: (progress: number) => setExportProgress(progress),
        filename,
        charset: format === 'csv' ? charset : undefined,
      };

      let result;
      switch (format) {
        case 'csv':
          result = await exportToCsv(data, importableEntityType, options);
          break;
        case 'json':
          result = await exportToJson(data, importableEntityType, options);
          break;
        case 'xlsx':
          result = await exportToXlsx(data, importableEntityType, options);
          break;
      }

      if (result.success) {
        downloadFile(result);
        setExportComplete(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        alert(`Export 실패: ${result.error}`);
        setIsExporting(false);
      }
    } catch (error: any) {
      alert(`Export 오류: ${error.message}`);
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    // Export가 진행 중이 아닐 때만 닫기 허용
    if (!isExporting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isExporting}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Download />
          데이터 Export
        </Box>
      </DialogTitle>

      <DialogContent>
        {!isExporting && !exportComplete && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {data.length}개 항목을 Export 합니다.
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">파일 형식</FormLabel>
              <RadioGroup
                value={format}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json' | 'xlsx')}
              >
                <FormControlLabel value="csv" control={<Radio />} label="CSV (쉼표로 구분된 값)" />
                <FormControlLabel value="json" control={<Radio />} label="JSON (JavaScript 객체 표기법)" />
                <FormControlLabel value="xlsx" control={<Radio />} label="XLSX (Excel 스프레드시트)" />
              </RadioGroup>
            </FormControl>

            {format === 'csv' && (
              <Box sx={{ mb: 2 }}>
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
                  💡 Excel에서 한글이 깨지지 않으려면 <strong>UTF-8 BOM (권장)</strong>을 선택하세요.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {isExporting && !exportComplete && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Export 중... {exportProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={exportProgress} />
          </Box>
        )}

        {exportComplete && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6">Export 완료!</Typography>
            <Typography variant="body2" color="text.secondary">
              파일이 다운로드되었습니다.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isExporting}>
          취소
        </Button>
        {!exportComplete && (
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting || data.length === 0}
            startIcon={<Download />}
          >
            Export
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

