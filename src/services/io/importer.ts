import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Encoding from 'encoding-japanese';
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

export type CharsetEncoding = 'utf-8' | 'utf-8-bom' | 'euc-kr' | 'shift-jis' | 'iso-8859-1' | 'windows-1252';

export interface ImportOptions {
  onProgress?: (progress: number) => void;
  worksheetName?: string;
  batchSize?: number;
  charset?: CharsetEncoding;
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
  let processedRow: any = { ...row };
  
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
      // 필드명 매핑 (import 필드 -> 내부 필드)
      {
        const cotqaImport: any = {};
        
        // 필드명 변환
        if ('question_key' in processedRow) cotqaImport.id = processedRow.question_key;
        else if ('id' in processedRow) cotqaImport.id = processedRow.id; // backward compatibility
        
        if ('product_type' in processedRow) cotqaImport.productSource = processedRow.product_type;
        else if ('productSource' in processedRow) cotqaImport.productSource = processedRow.productSource; // backward compatibility
        
        if ('question_type' in processedRow) cotqaImport.questionType = processedRow.question_type;
        else if ('questionType' in processedRow) cotqaImport.questionType = processedRow.questionType; // backward compatibility
        
        if ('created_at' in processedRow) cotqaImport.createdAt = processedRow.created_at;
        else if ('createdAt' in processedRow) cotqaImport.createdAt = processedRow.createdAt; // backward compatibility
        
        if ('updated_at' in processedRow) cotqaImport.updatedAt = processedRow.updated_at;
        else if ('updatedAt' in processedRow) cotqaImport.updatedAt = processedRow.updatedAt; // backward compatibility
        
        // 유지되는 필드들
        if ('questioner' in processedRow) {
          cotqaImport.questioner = processedRow.questioner || undefined;
        }
        
        if ('questioner_gender' in processedRow) {
          cotqaImport.questionerGender = processedRow.questioner_gender || undefined;
        } else if ('questionerGender' in processedRow) {
          cotqaImport.questionerGender = processedRow.questionerGender || undefined;
        }
        
        if ('questioner_age_group' in processedRow) {
          cotqaImport.questionerAgeGroup = processedRow.questioner_age_group || undefined;
        } else if ('questionerAgeGroup' in processedRow) {
          cotqaImport.questionerAgeGroup = processedRow.questionerAgeGroup || undefined;
        }
        
        if ('products' in processedRow) {
          // products 문자열을 배열로 변환 (CSV 호환)
          if (!processedRow.products || processedRow.products === '') {
            cotqaImport.products = [];
          } else if (typeof processedRow.products === 'string') {
            cotqaImport.products = processedRow.products.split('|').filter((p: string) => p.trim());
          } else if (Array.isArray(processedRow.products)) {
            cotqaImport.products = processedRow.products;
          } else {
            cotqaImport.products = [];
          }
        } else {
          cotqaImport.products = [];
        }
        
        if ('question' in processedRow) cotqaImport.question = processedRow.question;
        if ('cot1' in processedRow) cotqaImport.cot1 = processedRow.cot1;
        if ('cot2' in processedRow) cotqaImport.cot2 = processedRow.cot2;
        if ('cot3' in processedRow) cotqaImport.cot3 = processedRow.cot3;
        if ('answer' in processedRow) cotqaImport.answer = processedRow.answer;
        
        if ('status' in processedRow) {
          cotqaImport.status = processedRow.status || '초안';
        } else {
          cotqaImport.status = '초안';
        }
        
        if ('author' in processedRow) {
          cotqaImport.author = processedRow.author || undefined;
        }
        
        // 동적 CoT 필드들
        Object.keys(processedRow).forEach(key => {
          if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
            cotqaImport[key] = processedRow[key];
          }
        });
        
        processedRow = cotqaImport;
      }
      break;
      
    case 'product':
      // snake_case → camelCase 매핑 및 값 정규화
      {
        const mapKey = (key: string): string => {
          const mapping: Record<string, string> = {
            product_name: 'productName',
            product_type: 'productCategory',
            protected_type: 'protectedType',
            maturity_type: 'maturityType',
            income_rate: 'incomeRate6m',
            'income-rate': 'incomeRate6m',
            risk_grade: 'riskGrade',
            'risk_ grade': 'riskGrade',
            tax_type: 'taxType',
            payment_type: 'paymentType',
            loss_rate: 'lossRate',
            liquidity_conditions: 'liquidityConditions',
            mother_product_name: 'motherProductName',
            rider_type: 'riderType',
            product_period: 'productPeriod',
            disclosure_type: 'disclosureType',
            renewable_type: 'renewableType',
            refund_type: 'refundType',
            exclusion_items: 'exclusionItems',
            payment_conditions: 'paymentConditions',
            eligible_age: 'eligibleAge',
          };
          return mapping[key] || key;
        };

        const normalized: any = {};
        Object.keys(processedRow).forEach((key) => {
          const value = processedRow[key];
          // 빈 문자열을 undefined로 변환 (선택적 필드가 제대로 처리되도록)
          normalized[mapKey(key)] = value === '' ? undefined : value;
        });

        // 값 정규화: 예시로 productSource, taxType 등 공통 필드 소문자/공백 제거 후 매핑
        if (typeof normalized.productSource === 'string') {
          const v = normalized.productSource.trim();
          if (v === '증권' || v === '보험') normalized.productSource = v;
        }
        if (typeof normalized.taxType === 'string') {
          const v = normalized.taxType.replace(/\s/g, '');
          // 내부 기본 스키마는 '과세'|'비과세' 사용
          if (v === '일반과세') normalized.taxType = '과세';
          if (v === '비과세') normalized.taxType = '비과세';
          if (v === '세금우대' || v === '연금저축') normalized.taxType = '과세';
        }
        processedRow = normalized;
      }
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

// Charset 디코딩 유틸리티
function decodeFromCharset(buffer: ArrayBuffer, charset: CharsetEncoding): string {
  const uint8Array = new Uint8Array(buffer);
  let codes = Array.from(uint8Array);

  // UTF-8 BOM 체크 (0xEF, 0xBB, 0xBF)
  const hasUtf8Bom = codes.length >= 3 && 
                      codes[0] === 0xEF && 
                      codes[1] === 0xBB && 
                      codes[2] === 0xBF;

  if (hasUtf8Bom) {
    // BOM 제거하고 UTF-8로 디코딩
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array.slice(3));
  }

  // charset 파라미터에 따라 디코딩
  switch (charset) {
    case 'utf-8':
    case 'utf-8-bom':
      // UTF-8 디코딩
      try {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(uint8Array);
      } catch (e) {
        // UTF-8 디코딩 실패 시 fallback
        return String.fromCharCode(...codes);
      }
    
    case 'euc-kr':
      // EUC-KR 디코딩
      // encoding-japanese의 EUCJP를 사용 (한글 일부 지원)
      try {
        const unicodeArray = Encoding.convert(codes, {
          to: 'UNICODE',
          from: 'EUCJP'
        });
        return Encoding.codeToString(unicodeArray);
      } catch (e) {
        // 실패 시 UTF-8 시도
        try {
          const decoder = new TextDecoder('utf-8');
          return decoder.decode(uint8Array);
        } catch (e2) {
          return String.fromCharCode(...codes);
        }
      }
    
    case 'shift-jis':
      // Shift-JIS 디코딩
      const unicodeArray = Encoding.convert(codes, {
        to: 'UNICODE',
        from: 'SJIS'
      });
      return Encoding.codeToString(unicodeArray);
    
    case 'iso-8859-1':
    case 'windows-1252':
      // Latin-1 디코딩
      return String.fromCharCode(...codes);
    
    default:
      // 기본: UTF-8
      try {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(uint8Array);
      } catch (e) {
        return String.fromCharCode(...codes);
      }
  }
}

// CSV 임포트 (Papa Parse + Streaming)
export async function importCsvData<T>(
  csvContent: string | ArrayBuffer,
  entityType: ImportableEntity,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const { onProgress, batchSize = 1000, charset = 'utf-8-bom' } = options;
  const schema = getSchemaForEntity(entityType);
  
  // ArrayBuffer인 경우 charset으로 디코딩
  let csvText: string;
  if (csvContent instanceof ArrayBuffer) {
    csvText = decodeFromCharset(csvContent, charset);
  } else {
    csvText = csvContent;
  }
  
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: [],
    summary: { totalRows: 0, successRows: 0, errorRows: 0 }
  };

  return new Promise((resolve) => {
    let processedRows = 0;
    let totalRows = 0;

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      chunk: (results: Papa.ParseResult<any>, parser: Papa.Parser) => {
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
      error: (error: any) => {
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
    const sheetName: string = (worksheetName as string) ?? workbook.SheetNames[0];
    
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
