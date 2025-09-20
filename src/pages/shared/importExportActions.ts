import { AppDispatch } from '../../store';
import { ImportService } from '../../services/io/importer';
import { ExportService } from '../../services/io/exporter';
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
    const importService = new ImportService();
    let result: any[] = [];

    switch (options.format) {
      case 'csv':
        result = await importService.importFromCSV(file);
        break;
      case 'json':
        result = await importService.importFromJSON(file);
        break;
      case 'xlsx':
        result = await importService.importFromXLSX(file);
        break;
      default:
        throw new Error('지원하지 않는 파일 형식입니다');
    }

    // 엔티티별로 스토어에 저장
    switch (options.entity) {
      case 'cots':
        // CoTs 데이터 import 로직
        // dispatch(importCoTs(result as CoTQA[]));
        break;
      case 'users':
        // Users 데이터 import 로직
        // dispatch(importUsers(result as UserAnon[]));
        break;
      case 'products':
        // Products 데이터 import 로직
        // dispatch(importProducts(result as Product[]));
        break;
    }

    onSuccess?.(result.length);
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
    const exportService = new ExportService();
    const filename = options.filename || `${options.entity}_${new Date().toISOString().split('T')[0]}`;

    switch (options.format) {
      case 'csv':
        await exportService.exportToCSV(data, `${filename}.csv`);
        break;
      case 'json':
        await exportService.exportToJSON(data, `${filename}.json`);
        break;
      case 'xlsx':
        await exportService.exportToXLSX(data, `${filename}.xlsx`);
        break;
      default:
        throw new Error('지원하지 않는 파일 형식입니다');
    }

    onSuccess?.();
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
