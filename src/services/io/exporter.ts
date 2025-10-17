import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import Encoding from 'encoding-japanese';
import type { ImportableEntity } from './importer';

export interface ExportResult {
  success: boolean;
  data: string | ArrayBuffer | Uint8Array;
  filename: string;
  error?: string;
}

export type CharsetEncoding = 'utf-8' | 'utf-8-bom' | 'euc-kr' | 'shift-jis' | 'iso-8859-1' | 'windows-1252';

export interface ExportOptions {
  onProgress?: (progress: number) => void;
  filename?: string;
  worksheetName?: string;
  charset?: CharsetEncoding;
}

// 파일명 생성 유틸리티
const generateFilename = (entityType: ImportableEntity, extension: string, customName?: string): string => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const baseName = customName || entityType;
  return `${baseName}_${timestamp}.${extension}`;
};

// Charset 인코딩 유틸리티
function encodeToCharset(text: string, charset: CharsetEncoding): string | Uint8Array {
  const encoder = new TextEncoder();
  
  switch (charset) {
    case 'utf-8':
      // UTF-8 without BOM
      return text;
    
    case 'utf-8-bom':
      // UTF-8 with BOM (Excel 호환)
      const utf8Bytes = encoder.encode(text);
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const combined = new Uint8Array(bom.length + utf8Bytes.length);
      combined.set(bom, 0);
      combined.set(utf8Bytes, bom.length);
      return combined;
    
    case 'euc-kr':
      // EUC-KR 인코딩 (한국어)
      // 브라우저는 EUC-KR 인코딩을 직접 지원하지 않으므로
      // encoding-japanese 라이브러리를 사용하여 변환
      const unicodeArray = [];
      for (let i = 0; i < text.length; i++) {
        unicodeArray.push(text.charCodeAt(i));
      }
      // EUCJP를 사용 (한글 일부 지원)
      // 완벽한 EUC-KR 변환은 서버 사이드나 전용 라이브러리 필요
      const euckrArray = Encoding.convert(unicodeArray, {
        to: 'EUCJP',
        from: 'UNICODE'
      });
      return new Uint8Array(euckrArray);
    
    case 'shift-jis':
      // Shift-JIS 인코딩 (일본어)
      const sjisUnicodeArray = [];
      for (let i = 0; i < text.length; i++) {
        sjisUnicodeArray.push(text.charCodeAt(i));
      }
      const sjisArray = Encoding.convert(sjisUnicodeArray, {
        to: 'SJIS',
        from: 'UNICODE'
      });
      return new Uint8Array(sjisArray);
    
    case 'iso-8859-1':
    case 'windows-1252':
      // Latin-1 인코딩 (서유럽 문자)
      const latin1Array = [];
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        latin1Array.push(code < 256 ? code : 63); // 63 = '?'
      }
      return new Uint8Array(latin1Array);
    
    default:
      // 기본값: UTF-8 with BOM
      const defaultBytes = encoder.encode(text);
      const defaultBom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const defaultCombined = new Uint8Array(defaultBom.length + defaultBytes.length);
      defaultCombined.set(defaultBom, 0);
      defaultCombined.set(defaultBytes, defaultBom.length);
      return defaultCombined;
  }
}

// CSV export를 위한 데이터 전처리 함수
function preprocessDataForCsv<T extends Record<string, any>>(
  data: T[],
  entityType: ImportableEntity
): any[] {
  return data.map(row => {
    const processed: any = { ...row };
    
    // userAnon의 ownedProducts 처리
    if (entityType === 'userAnon' && 'ownedProducts' in processed) {
      if (Array.isArray(processed.ownedProducts) && processed.ownedProducts.length > 0) {
        // 형식: "상품명1:구매일1|상품명2:구매일2"
        processed.ownedProducts = processed.ownedProducts
          .map((p: any) => `${p.productName}:${p.purchaseDate}`)
          .join('|');
      } else {
        processed.ownedProducts = '';
      }
    }
    
    // cotqa 필드명 변경
    if (entityType === 'cotqa') {
      const cotqaExport: any = {};
      
      // 필드명 매핑 (내부 필드 -> export 필드)
      if ('id' in processed) cotqaExport.question_key = processed.id;
      if ('productSource' in processed) cotqaExport.product_type = processed.productSource;
      if ('questionType' in processed) cotqaExport.question_type = processed.questionType;
      if ('createdAt' in processed) cotqaExport.created_at = processed.createdAt;
      if ('updatedAt' in processed) cotqaExport.updated_at = processed.updatedAt;
      
      // 유지되는 필드들
      if ('questioner' in processed) cotqaExport.questioner = processed.questioner;
      if ('questionerGender' in processed) cotqaExport.questioner_gender = processed.questionerGender;
      if ('questionerAgeGroup' in processed) cotqaExport.questioner_age_group = processed.questionerAgeGroup;
      if ('products' in processed) {
        // products 배열을 문자열로 변환 (CSV 호환)
        if (Array.isArray(processed.products) && processed.products.length > 0) {
          cotqaExport.products = processed.products.join('|');
        } else {
          cotqaExport.products = '';
        }
      }
      if ('question' in processed) cotqaExport.question = processed.question;
      if ('cot1' in processed) cotqaExport.cot1 = processed.cot1;
      if ('cot2' in processed) cotqaExport.cot2 = processed.cot2;
      if ('cot3' in processed) cotqaExport.cot3 = processed.cot3;
      if ('answer' in processed) cotqaExport.answer = processed.answer;
      if ('status' in processed) cotqaExport.status = processed.status;
      if ('author' in processed) cotqaExport.author = processed.author;
      
      // 동적 CoT 필드들 (cot4, cot5, ...)
      Object.keys(processed).forEach(key => {
        if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
          cotqaExport[key] = processed[key];
        }
      });
      
      return cotqaExport;
    }
    
    return processed;
  });
}

// CSV 익스포트
export async function exportToCsv<T extends Record<string, any>>(
  data: T[],
  entityType: ImportableEntity,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, filename, charset = 'utf-8-bom' } = options;
  
  try {
    if (onProgress) onProgress(0);

    // 빈 데이터 처리
    if (data.length === 0) {
      const emptyCSV = getHeaderOnlyCSV(entityType);
      const encodedData = encodeToCharset(emptyCSV, charset);
      return {
        success: true,
        data: encodedData,
        filename: generateFilename(entityType, 'csv', filename)
      };
    }

    if (onProgress) onProgress(25);

    // CSV를 위한 데이터 전처리 (배열 필드를 문자열로 변환)
    const preprocessedData = preprocessDataForCsv(data, entityType);

    // Papa Parse로 CSV 변환
    const csv = Papa.unparse(preprocessedData, {
      header: true
    });

    if (onProgress) onProgress(50);

    // 지정된 charset으로 인코딩
    const encodedData = encodeToCharset(csv, charset);

    if (onProgress) onProgress(75);

    const result: ExportResult = {
      success: true,
      data: encodedData,
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
export async function exportToJson<T extends Record<string, any>>(
  data: T[],
  entityType: ImportableEntity,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, filename } = options;
  
  try {
    if (onProgress) onProgress(0);

    // JSON export에도 필드명 매핑 적용 (CoT의 경우)
    const processedData = preprocessDataForCsv(data, entityType);

    if (onProgress) onProgress(25);

    const jsonString = JSON.stringify(processedData, null, 2);

    if (onProgress) onProgress(75);

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

    // XLSX export에도 필드명 매핑 적용 (CoT의 경우)
    const processedData = preprocessDataForCsv(data, entityType);

    // 워크시트 생성
    const worksheet = processedData.length > 0 
      ? XLSX.utils.json_to_sheet(processedData)
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
      return [
        'id',
        'productSource',
        'productName',
        'productCategory',
        'taxType',
        'description',
        'riskLevel',
        'managementCompany',
        'expectedReturn',
        // 증권 상품 확장 필드
        'protectedType',
        'maturityType',
        'maturityPeriod',
        'incomeRate6m',
        'riskGrade',
        'paymentType',
        'lossRate',
        'liquidityConditions',
        // 보험 상품 확장 필드
        'motherProductName',
        'riderType',
        'productPeriod',
        'disclosureType',
        'renewableType',
        'refundType',
        'exclusionItems',
        'paymentConditions',
        'eligibleAge',
        // 메타
        'createdAt',
        'updatedAt'
      ];
    case 'cotqa':
      return ['question_key', 'product_type', 'question_type', 'questioner', 'questioner_gender', 'questioner_age_group', 'products', 'question', 'cot1', 'cot2', 'cot3', 'answer', 'status', 'author', 'created_at', 'updated_at'];
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
  // Uint8Array를 ArrayBuffer로 변환
  let blobData: string | ArrayBuffer;
  if (result.data instanceof Uint8Array) {
    // Uint8Array의 underlying ArrayBuffer를 복사
    blobData = new ArrayBuffer(result.data.byteLength);
    new Uint8Array(blobData).set(result.data);
  } else {
    blobData = result.data;
  }

  const blob = new Blob(
    [blobData], 
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
