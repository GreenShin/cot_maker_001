import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { ImportableEntity } from './importer';

export interface ExportResult {
  success: boolean;
  data: string | ArrayBuffer;
  filename: string;
  error?: string;
}

export interface ExportOptions {
  onProgress?: (progress: number) => void;
  filename?: string;
  worksheetName?: string;
}

// 파일명 생성 유틸리티
const generateFilename = (entityType: ImportableEntity, extension: string, customName?: string): string => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const baseName = customName || entityType;
  return `${baseName}_${timestamp}.${extension}`;
};

// CSV 익스포트
export async function exportToCsv<T extends Record<string, any>>(
  data: T[],
  entityType: ImportableEntity,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, filename } = options;
  
  try {
    if (onProgress) onProgress(0);

    // 빈 데이터 처리
    if (data.length === 0) {
      const emptyResult = Papa.unparse([]);
      return {
        success: true,
        data: getHeaderOnlyCSV(entityType),
        filename: generateFilename(entityType, 'csv', filename)
      };
    }

    if (onProgress) onProgress(25);

    // Papa Parse로 CSV 변환
    const csv = Papa.unparse(data, {
      header: true,
      encoding: 'utf-8'
    });

    if (onProgress) onProgress(75);

    const result: ExportResult = {
      success: true,
      data: csv,
      filename: generateFilename(entityType, 'csv', filename)
    };

    if (onProgress) onProgress(100);
    return result;

  } catch (error: any) {
    return {
      success: false,
      data: '',
      filename: '',
      error: `CSV 익스포트 오류: ${error.message}`
    };
  }
}

// JSON 익스포트
export async function exportToJson<T>(
  data: T[],
  entityType: ImportableEntity,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, filename } = options;
  
  try {
    if (onProgress) onProgress(0);

    const jsonString = JSON.stringify(data, null, 2);

    if (onProgress) onProgress(50);

    const result: ExportResult = {
      success: true,
      data: jsonString,
      filename: generateFilename(entityType, 'json', filename)
    };

    if (onProgress) onProgress(100);
    return result;

  } catch (error: any) {
    return {
      success: false,
      data: '',
      filename: '',
      error: `JSON 익스포트 오류: ${error.message}`
    };
  }
}

// XLSX 익스포트
export async function exportToXlsx<T extends Record<string, any>>(
  data: T[],
  entityType: ImportableEntity,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, filename, worksheetName = 'Sheet1' } = options;
  
  try {
    if (onProgress) onProgress(0);

    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    if (onProgress) onProgress(25);

    // 워크시트 생성
    const worksheet = data.length > 0 
      ? XLSX.utils.json_to_sheet(data)
      : XLSX.utils.aoa_to_sheet([getHeadersForEntity(entityType)]);

    if (onProgress) onProgress(50);

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    if (onProgress) onProgress(75);

    // ArrayBuffer로 변환
    const xlsxBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true
    });

    const result: ExportResult = {
      success: true,
      data: xlsxBuffer,
      filename: generateFilename(entityType, 'xlsx', filename)
    };

    if (onProgress) onProgress(100);
    return result;

  } catch (error: any) {
    return {
      success: false,
      data: new ArrayBuffer(0),
      filename: '',
      error: `XLSX 익스포트 오류: ${error.message}`
    };
  }
}

// 대용량 데이터 스트리밍 익스포트 (청크 단위 처리)
export async function exportLargeDataset<T extends Record<string, any>>(
  dataProvider: (offset: number, limit: number) => Promise<{ items: T[]; hasMore: boolean }>,
  entityType: ImportableEntity,
  format: 'csv' | 'json' | 'xlsx',
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress } = options;
  const chunkSize = 1000;
  let offset = 0;
  let allData: T[] = [];
  let hasMore = true;

  try {
    while (hasMore) {
      const chunk = await dataProvider(offset, chunkSize);
      allData = allData.concat(chunk.items);
      hasMore = chunk.hasMore;
      offset += chunkSize;

      if (onProgress) {
        // 진행률은 추정치 (정확한 총 개수를 모르므로)
        const progress = Math.min(90, (allData.length / 10000) * 90);
        onProgress(progress);
      }
    }

    // 최종 익스포트
    switch (format) {
      case 'csv':
        return await exportToCsv(allData, entityType, options);
      case 'json':
        return await exportToJson(allData, entityType, options);
      case 'xlsx':
        return await exportToXlsx(allData, entityType, options);
      default:
        throw new Error(`지원하지 않는 형식: ${format}`);
    }

  } catch (error: any) {
    return {
      success: false,
      data: format === 'xlsx' ? new ArrayBuffer(0) : '',
      filename: '',
      error: `대용량 익스포트 오류: ${error.message}`
    };
  }
}

// 엔티티별 헤더 정의
function getHeadersForEntity(entityType: ImportableEntity): string[] {
  switch (entityType) {
    case 'userAnon':
      return ['id', 'customerSource', 'ageGroup', 'gender', 'investmentTendency', 'insuranceCrossRatio', 'investmentAmount'];
    case 'product':
      return ['id', 'productSource', 'productName', 'productCategory', 'taxType', 'description', 'riskLevel', 'managementCompany', 'expectedReturn'];
    case 'cotqa':
      return ['id', 'productSource', 'questionType', 'questioner', 'products', 'question', 'cot1', 'cot2', 'cot3', 'answer', 'status', 'author'];
    default:
      return [];
  }
}

// 빈 데이터용 헤더만 있는 CSV 생성
function getHeaderOnlyCSV(entityType: ImportableEntity): string {
  const headers = getHeadersForEntity(entityType);
  return Papa.unparse([headers]);
}

// 파일 다운로드 유틸리티 (브라우저용)
export function downloadFile(result: ExportResult): void {
  const blob = new Blob(
    [result.data], 
    { 
      type: result.filename.endsWith('.xlsx') 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : result.filename.endsWith('.json')
        ? 'application/json'
        : 'text/csv'
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
