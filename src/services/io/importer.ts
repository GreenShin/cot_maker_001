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

// 엔티티별 데이터 전처리 함수
const preprocessRowData = (row: any, entityType: ImportableEntity): any => {
  const processedRow = { ...row };
  
  switch (entityType) {
    case 'userAnon':
      // ownedProducts 필드 처리 - undefined, null, 빈 문자열 모두 빈 배열로 처리
      if (!processedRow.ownedProducts || processedRow.ownedProducts === '') {
        processedRow.ownedProducts = [];
      } else if (typeof processedRow.ownedProducts === 'string') {
        try {
          // JSON 문자열인 경우
          if (processedRow.ownedProducts.startsWith('[') || processedRow.ownedProducts.startsWith('{')) {
            processedRow.ownedProducts = JSON.parse(processedRow.ownedProducts);
          } 
          // 구분자로 구분된 문자열인 경우 (productName:purchaseDate|productName:purchaseDate)
          else if (processedRow.ownedProducts.includes('|')) {
            const products = processedRow.ownedProducts.split('|').map((item: string) => {
              const [productName, purchaseDate] = item.split(':');
              return { 
                productName: productName?.trim() || '', 
                purchaseDate: purchaseDate?.trim() || '' 
              };
            }).filter((item: any) => item.productName && item.purchaseDate);
            processedRow.ownedProducts = products;
          }
          // 단일 상품인 경우
          else if (processedRow.ownedProducts.includes(':')) {
            const [productName, purchaseDate] = processedRow.ownedProducts.split(':');
            processedRow.ownedProducts = [{ 
              productName: productName?.trim() || '', 
              purchaseDate: purchaseDate?.trim() || '' 
            }];
          }
          // 그 외의 경우 빈 배열로 처리
          else {
            processedRow.ownedProducts = [];
          }
        } catch (error) {
          // 파싱 실패 시 빈 배열로 처리
          processedRow.ownedProducts = [];
        }
      } else if (!Array.isArray(processedRow.ownedProducts)) {
        // 배열이 아닌 다른 타입인 경우 빈 배열로 처리
        processedRow.ownedProducts = [];
      }
      break;
      
    case 'cotqa':
      // products 필드 처리 - undefined, null, 빈 문자열 모두 빈 배열로 처리
      if (!processedRow.products || processedRow.products === '') {
        processedRow.products = [];
      } else if (typeof processedRow.products === 'string') {
        try {
          if (processedRow.products.startsWith('[')) {
            processedRow.products = JSON.parse(processedRow.products);
          } else if (processedRow.products.includes(',')) {
            processedRow.products = processedRow.products.split(',').map((item: string) => item.trim());
          } else if (processedRow.products.trim()) {
            processedRow.products = [processedRow.products.trim()];
          } else {
            processedRow.products = [];
          }
        } catch (error) {
          processedRow.products = [];
        }
      } else if (!Array.isArray(processedRow.products)) {
        // 배열이 아닌 다른 타입인 경우 빈 배열로 처리
        processedRow.products = [];
      }
      break;
      
    case 'product':
      // 특별한 전처리가 필요한 경우 여기에 추가
      break;
  }
  
  return processedRow;
};

// Zod 에러를 사용자 친화적 메시지로 변환
const formatZodError = (error: any): string => {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map((err: any) => {
      const path = err.path.length > 0 ? `'${err.path.join('.')}'` : '데이터';
      
      switch (err.code) {
        case 'invalid_type':
          if (err.path[0] === 'ownedProducts') {
            return `보유상품 데이터 형식이 올바르지 않습니다 (배열이어야 함)`;
          }
          return `${path} 필드 타입이 올바르지 않습니다`;
        case 'invalid_enum_value':
          return `${path} 값이 유효하지 않습니다. 허용값: ${err.options?.join(', ')}`;
        case 'too_small':
          if (err.type === 'array') {
            return `${path} 배열이 최소 ${err.minimum}개 항목이 필요합니다`;
          }
          return `${path} 값이 너무 짧습니다 (최소 ${err.minimum}자)`;
        case 'invalid_string':
          if (err.validation === 'regex') {
            if (err.path[0] === 'purchaseDate') {
              return `구매년월은 YYYY-MM 형식이어야 합니다 (예: 2024-01)`;
            }
          }
          return `${path} 형식이 올바르지 않습니다`;
        case 'required_error':
          return `필수 필드 ${path}가 누락되었습니다`;
        default:
          return err.message || '알 수 없는 유효성 검사 오류';
      }
    }).join(', ');
  }
  
  return error.message || '데이터 유효성 검사 실패';
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
            // 데이터 전처리
            const preprocessedRow = preprocessRowData(row, entityType);
            
            // 디버깅을 위한 로깅
            if (entityType === 'userAnon' && rowNumber <= 3) {
              console.log(`Row ${rowNumber} - Original:`, row);
              console.log(`Row ${rowNumber} - Preprocessed:`, preprocessedRow);
            }
            
            const validatedData = schema.parse(preprocessedRow) as T;
            result.data.push(validatedData);
            result.summary.successRows++;
          } catch (error: any) {
            // 디버깅을 위한 상세한 에러 로깅
            if (entityType === 'userAnon' && rowNumber <= 3) {
              console.log(`Row ${rowNumber} - Validation Error:`, error);
              console.log(`Row ${rowNumber} - Error details:`, JSON.stringify(error, null, 2));
            }
            
            result.errors.push({
              row: rowNumber,
              message: formatZodError(error),
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
      // 데이터 전처리
      const preprocessedRow = preprocessRowData(jsonData[i], entityType);
      const validatedData = schema.parse(preprocessedRow) as T;
      result.data.push(validatedData);
      result.summary.successRows++;
    } catch (error: any) {
      result.errors.push({
        row: i + 1,
        message: formatZodError(error),
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
