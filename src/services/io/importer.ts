import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { userAnonSchema, type UserAnon } from '../../models/userAnon.js';
import { productSchema, type Product } from '../../models/product.js';
import { cotQASchema, type CoTQA } from '../../models/cotqa.js';
import { SQLiteAdapter } from '../storage/sqliteAdapter.js';
import { QueryService } from '../query/queryService.js';

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
  sqliteAdapter?: SQLiteAdapter; // SQLite 배치 삽입용
  directInsert?: boolean; // 메모리에 로드하지 않고 직접 DB에 삽입
  validateOnly?: boolean; // 검증만 수행 (삽입하지 않음)
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

// 엔티티별 테이블 매핑
const getTableNameForEntity = (entityType: ImportableEntity): string => {
  switch (entityType) {
    case 'userAnon': return 'user_anon';
    case 'product': return 'product';
    case 'cotqa': return 'cotqa';
    default: throw new Error(`Unknown entity type: ${entityType}`);
  }
};

// 대용량 배치 삽입 (SQLite-WASM)
export async function importWithSQLiteBatch<T>(
  data: any[],
  entityType: ImportableEntity,
  sqliteAdapter: SQLiteAdapter,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const { onProgress, batchSize = 1000 } = options;
  const schema = getSchemaForEntity(entityType);
  const tableName = getTableNameForEntity(entityType);
  
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: [],
    summary: { totalRows: data.length, successRows: 0, errorRows: 0 }
  };

  const validatedData: T[] = [];
  let processedRows = 0;

  // 1단계: 데이터 검증
  for (let i = 0; i < data.length; i++) {
    try {
      const validated = schema.parse(data[i]) as T;
      
      // 메타데이터 추가 (ID, 타임스탬프 등)
      const enrichedData = await enrichDataForInsert(validated, entityType);
      validatedData.push(enrichedData as T);
      
    } catch (error: any) {
      result.errors.push({
        row: i + 1,
        message: error.message,
        data: data[i]
      });
      result.summary.errorRows++;
    }

    processedRows++;
    if (onProgress && processedRows % 100 === 0) {
      const progress = Math.round((processedRows / data.length) * 50); // 검증은 50%까지
      onProgress(progress);
    }
  }

  // 검증 전용 모드인 경우 여기서 종료
  if (options.validateOnly) {
    result.success = result.errors.length === 0;
    result.data = validatedData;
    result.summary.successRows = validatedData.length;
    return result;
  }

  // 2단계: 배치 삽입
  if (validatedData.length > 0 && !result.errors.length) {
    try {
      await sqliteAdapter.transaction(async () => {
        await sqliteAdapter.batchInsert(tableName, validatedData, batchSize);
      });

      result.summary.successRows = validatedData.length;
      result.success = true;
      
      if (onProgress) onProgress(100);

    } catch (error: any) {
      result.errors.push({
        row: 0,
        message: `배치 삽입 실패: ${error.message}`
      });
      result.summary.errorRows = validatedData.length;
    }
  }

  return result;
}

// 데이터 보강 (ID, 타임스탬프 등)
async function enrichDataForInsert<T>(data: T, entityType: ImportableEntity): Promise<T> {
  const now = new Date().toISOString();
  const enriched = { ...data } as any;

  // ID 생성 (없는 경우)
  if (!enriched.id) {
    enriched.id = generateId(entityType);
  }

  // 타임스탬프 추가
  enriched.createdAt = enriched.createdAt || now;
  enriched.updatedAt = now;

  // 엔티티별 특별 처리
  if (entityType === 'cotqa') {
    // 동적 CoT 필드 처리
    enriched.dynamicCots = extractDynamicCoTs(enriched);
  } else if (entityType === 'userAnon') {
    // 보유 상품 배열을 별도 테이블에 저장하기 위한 처리
    // (현재는 JSON으로 저장하지만 향후 정규화 가능)
  }

  return enriched as T;
}

// ID 생성
function generateId(entityType: ImportableEntity): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${entityType}-${timestamp}-${random}`;
}

// 동적 CoT 필드 추출
function extractDynamicCoTs(cotData: any): string {
  const dynamicFields: Record<string, string> = {};
  
  // cot4, cot5, ... 필드들을 찾아서 JSON으로 변환
  Object.keys(cotData).forEach(key => {
    const match = key.match(/^cot(\d+)$/);
    if (match && parseInt(match[1]) > 3) {
      dynamicFields[key] = cotData[key];
      delete cotData[key]; // 원본에서 제거
    }
  });

  return JSON.stringify(dynamicFields);
}

// 스트리밍 CSV 임포트 (SQLite-WASM 통합)
export async function importCsvDataStreaming<T>(
  csvContent: string,
  entityType: ImportableEntity,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const { onProgress, sqliteAdapter, directInsert = false } = options;
  
  // SQLite 직접 삽입 모드
  if (directInsert && sqliteAdapter) {
    return new Promise((resolve) => {
      const result: ImportResult<T> = {
        success: false,
        data: [],
        errors: [],
        summary: { totalRows: 0, successRows: 0, errorRows: 0 }
      };

      const batchBuffer: any[] = [];
      const BATCH_SIZE = 1000;
      let processedRows = 0;

      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        chunk: async (results, parser) => {
          parser.pause(); // 배치 처리 중 일시 중단

          // 현재 청크를 배치 버퍼에 추가
          batchBuffer.push(...results.data);

          // 배치 크기에 도달하면 데이터베이스에 삽입
          if (batchBuffer.length >= BATCH_SIZE) {
            try {
              const batchResult = await importWithSQLiteBatch<T>(
                batchBuffer.splice(0, BATCH_SIZE),
                entityType,
                sqliteAdapter,
                { onProgress: (progress) => onProgress?.(progress * processedRows / 100) }
              );

              result.summary.successRows += batchResult.summary.successRows;
              result.summary.errorRows += batchResult.summary.errorRows;
              result.errors.push(...batchResult.errors);

            } catch (error: any) {
              result.errors.push({
                row: processedRows,
                message: `배치 처리 오류: ${error.message}`
              });
            }
          }

          processedRows += results.data.length;
          result.summary.totalRows = processedRows;

          parser.resume(); // 다음 청크 처리 재개
        },
        complete: async () => {
          // 남은 데이터 처리
          if (batchBuffer.length > 0) {
            try {
              const finalResult = await importWithSQLiteBatch<T>(
                batchBuffer,
                entityType,
                sqliteAdapter,
                options
              );

              result.summary.successRows += finalResult.summary.successRows;
              result.summary.errorRows += finalResult.summary.errorRows;
              result.errors.push(...finalResult.errors);

            } catch (error: any) {
              result.errors.push({
                row: processedRows,
                message: `최종 배치 처리 오류: ${error.message}`
              });
            }
          }

          result.success = result.summary.errorRows === 0;
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

  // 기존 메모리 기반 처리 (호환성)
  return importCsvData(csvContent, entityType, options);
}

// CSV 임포트 (Papa Parse + Streaming) - 기존 함수 유지
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
