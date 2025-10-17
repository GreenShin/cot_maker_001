import { AppDispatch } from '../../store';
import { importCsvData, importJsonData, importXlsxData, type ImportResult } from '../../services/io/importer';
import { exportToCsv, exportToJson, exportToXlsx, downloadFile } from '../../services/io/exporter';
import { importCoTs } from '../../store/slices/cotsSlice';
import { importUsers } from '../../store/slices/usersSlice';
import { importProducts } from '../../store/slices/productsSlice';
import { CoTQA } from '../../models/cotqa';
import { Product } from '../../models/product';
import { UserAnon } from '../../models/userAnon';

// Import/Export 액션 타입
export type ImportExportEntity = 'cots' | 'users' | 'products';

export interface ImportExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  entity: ImportExportEntity;
  filename?: string;
}

// Import 액션
export const handleImport = async (
  dispatch: AppDispatch,
  options: ImportExportOptions,
  file: File,
  onSuccess?: (count: number) => void,
  onError?: (error: string) => void
) => {
  try {
    let result: ImportResult<any>;

    // File을 ArrayBuffer로 읽기
    const arrayBuffer = await file.arrayBuffer();
    const entityType = getEntityType(options.entity);

    switch (options.format) {
      case 'csv':
        result = await importCsvData(arrayBuffer, entityType);
        break;
      case 'json': {
        // JSON은 텍스트로 읽어야 함
        const text = await file.text();
        const jsonData = JSON.parse(text);
        result = await importJsonData(jsonData, entityType);
        break;
      }
      case 'xlsx':
        result = await importXlsxData(arrayBuffer, entityType);
        break;
      default:
        throw new Error('지원하지 않는 파일 형식입니다');
    }

    // 엔티티별로 스토어에 저장
    if (result.success) {
      const importResult = await (async () => {
        switch (options.entity) {
          case 'cots':
            return dispatch(importCoTs(result.data as CoTQA[]));
          case 'users':
            return dispatch(importUsers(result.data as UserAnon[]));
          case 'products':
            return dispatch(importProducts(result.data as Product[]));
          default:
            throw new Error('지원하지 않는 엔티티 타입입니다');
        }
      })();

      if (importResult.meta.requestStatus === 'fulfilled') {
        onSuccess?.(result.data.length);
      } else {
        throw new Error(importResult.payload as string || 'Import 실패');
      }
    } else {
      throw new Error(result.errors.join(', '));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Import 중 오류가 발생했습니다';
    onError?.(errorMessage);
  }
};

// Export 액션
export const handleExport = async (
  data: CoTQA[] | Product[] | UserAnon[],
  options: ImportExportOptions,
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  try {
    let result;
    const entityType = getEntityType(options.entity);

    switch (options.format) {
      case 'csv':
        result = await exportToCsv(data as any, entityType, { filename: options.filename });
        break;
      case 'json':
        result = await exportToJson(data as any, entityType, { filename: options.filename });
        break;
      case 'xlsx':
        result = await exportToXlsx(data as any, entityType, { filename: options.filename });
        break;
      default:
        throw new Error('지원하지 않는 파일 형식입니다');
    }

    if (result.success) {
      // 실제 파일 다운로드 실행
      downloadFile(result);
      onSuccess?.();
    } else {
      throw new Error(result.error || 'Export 실패');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Export 중 오류가 발생했습니다';
    onError?.(errorMessage);
  }
};

// File input 트리거
export const triggerFileInput = (
  accept: string,
  onFileSelect: (file: File) => void
) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };
  input.click();
};

// 파일 형식별 accept 속성
export const getAcceptString = (format: 'csv' | 'json' | 'xlsx') => {
  switch (format) {
    case 'csv':
      return '.csv,text/csv';
    case 'json':
      return '.json,application/json';
    case 'xlsx':
      return '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return '*/*';
  }
};

// Import/Export 버튼 컴포넌트용 props
export interface ImportExportButtonsProps {
  entity: ImportExportEntity;
  data?: CoTQA[] | Product[] | UserAnon[];
  onImportSuccess?: (count: number) => void;
  onImportError?: (error: string) => void;
  onExportSuccess?: () => void;
  onExportError?: (error: string) => void;
  disabled?: boolean;
}

// 엔티티 타입 변환 헬퍼
const getEntityType = (entity: ImportExportEntity) => {
  switch (entity) {
    case 'cots':
      return 'cotqa' as const;
    case 'users':
      return 'userAnon' as const;
    case 'products':
      return 'product' as const;
    default:
      throw new Error(`지원하지 않는 엔티티: ${entity}`);
  }
};

// 공통 Import/Export 훅
export const useImportExport = (
  dispatch: AppDispatch,
  entity: ImportExportEntity
) => {
  const importData = async (
    file: File,
    format: 'csv' | 'json' | 'xlsx',
    onSuccess?: (count: number) => void,
    onError?: (error: string) => void
  ) => {
    await handleImport(dispatch, { format, entity }, file, onSuccess, onError);
  };

  const exportData = async (
    data: CoTQA[] | Product[] | UserAnon[],
    format: 'csv' | 'json' | 'xlsx',
    filename?: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    await handleExport(data, { format, entity, filename }, onSuccess, onError);
  };

  const openImportDialog = (
    format: 'csv' | 'json' | 'xlsx',
    onSuccess?: (count: number) => void,
    onError?: (error: string) => void
  ) => {
    triggerFileInput(
      getAcceptString(format),
      (file) => importData(file, format, onSuccess, onError)
    );
  };

  return {
    importData,
    exportData,
    openImportDialog,
  };
};
