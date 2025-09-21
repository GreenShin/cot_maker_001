import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { userAnonSchema, type UserAnon } from '../../models/userAnon';
import { productSchema, type Product } from '../../models/product';
import { cotQASchema, type CoTQA } from '../../models/cotqa';

export type ImportableEntity = 'userAnon' | 'product' | 'cotqa';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: Array<{ row: number; message: string; data?: any }>;
  summary: {
    totalRows: number;
    successRows: number;
    errorRows: number;
  };
}

export interface ImportOptions {
  onProgress?: (progress: number) => void;
  worksheetName?: string;
  batchSize?: number;
}

// 엔티티별 스키마 매핑
const getSchemaForEntity = (entityType: ImportableEntity) => {
  switch (entityType) {
    case 'userAnon': return userAnonSchema;
    case 'product': return productSchema;
    case 'cotqa': return cotQASchema;
    default: throw new Error(`Unknown entity type: ${entityType}`);
  }
};

// CSV 임포트 (Papa Parse + Streaming)
export async function importCsvData<T>(
  csvContent: string,
  entityType: ImportableEntity,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const { onProgress, batchSize = 1000 } = options;
  const schema = getSchemaForEntity(entityType);
  
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: [],
    summary: { totalRows: 0, successRows: 0, errorRows: 0 }
  };

  return new Promise((resolve) => {
    let processedRows = 0;
    let totalRows = 0;

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      chunk: (results, parser) => {
        // 배치 처리
        results.data.forEach((row: any, index: number) => {
          const rowNumber = processedRows + index + 1;
          
          try {
            const validatedData = schema.parse(row) as T;
            result.data.push(validatedData);
            result.summary.successRows++;
          } catch (error: any) {
            result.errors.push({
              row: rowNumber,
              message: error.message,
              data: row
            });
            result.summary.errorRows++;
          }
        });

        processedRows += results.data.length;
        totalRows = processedRows;
        result.summary.totalRows = totalRows;

        // 진행률 콜백
        if (onProgress && totalRows > 0) {
          const progress = Math.round((processedRows / totalRows) * 100);
          onProgress(progress);
        }

        // 배치 크기 초과 시 일시 중단
        if (processedRows >= batchSize) {
          parser.pause();
          setTimeout(() => parser.resume(), 0);
        }
      },
      complete: () => {
        result.success = result.errors.length === 0;
        if (onProgress) onProgress(100);
        resolve(result);
      },
      error: (error) => {
        result.errors.push({
          row: 0,
          message: `CSV 파싱 오류: ${error.message}`
        });
        resolve(result);
      }
    });
  });
}

// JSON 임포트
export async function importJsonData<T>(
  jsonData: any[],
  entityType: ImportableEntity,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const { onProgress } = options;
  const schema = getSchemaForEntity(entityType);
  
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: [],
    summary: { totalRows: jsonData.length, successRows: 0, errorRows: 0 }
  };

  for (let i = 0; i < jsonData.length; i++) {
    try {
      const validatedData = schema.parse(jsonData[i]) as T;
      result.data.push(validatedData);
      result.summary.successRows++;
    } catch (error: any) {
      result.errors.push({
        row: i + 1,
        message: error.message,
        data: jsonData[i]
      });
      result.summary.errorRows++;
    }

    // 진행률 업데이트
    if (onProgress && i % 100 === 0) {
      const progress = Math.round(((i + 1) / jsonData.length) * 100);
      onProgress(progress);
    }
  }

  result.success = result.errors.length === 0;
  if (onProgress) onProgress(100);
  
  return result;
}

// XLSX 임포트 (SheetJS + Streaming)
export async function importXlsxData<T>(
  xlsxBuffer: ArrayBuffer,
  entityType: ImportableEntity,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const { onProgress, worksheetName } = options;
  
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: [],
    summary: { totalRows: 0, successRows: 0, errorRows: 0 }
  };

  try {
    // XLSX 파일 읽기
    const workbook = XLSX.read(xlsxBuffer, { type: 'array' });
    const sheetName = worksheetName || workbook.SheetNames[0];
    
    if (!workbook.Sheets[sheetName]) {
      result.errors.push({
        row: 0,
        message: `워크시트 '${sheetName}'을 찾을 수 없습니다`
      });
      return result;
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // JSON으로 변환 (스트리밍 시뮬레이션을 위해 청크 단위로 처리)
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // JSON 임포트 로직 재사용
    return await importJsonData(jsonData, entityType, { onProgress });
    
  } catch (error: any) {
    result.errors.push({
      row: 0,
      message: `XLSX 파일 처리 오류: ${error.message}`
    });
    return result;
  }
}

// 임포트 결과 요약 생성
export function generateImportSummary<T>(result: ImportResult<T>): string {
  const { summary, errors } = result;
  
  let summaryText = `임포트 완료\n`;
  summaryText += `- 총 행 수: ${summary.totalRows}\n`;
  summaryText += `- 성공: ${summary.successRows}\n`;
  summaryText += `- 실패: ${summary.errorRows}\n`;
  
  if (errors.length > 0) {
    summaryText += `\n오류 상세:\n`;
    errors.slice(0, 10).forEach(error => {
      summaryText += `- 행 ${error.row}: ${error.message}\n`;
    });
    
    if (errors.length > 10) {
      summaryText += `... 외 ${errors.length - 10}개 오류\n`;
    }
  }
  
  return summaryText;
}
