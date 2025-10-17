import type { QueryOptions, PaginatedResult } from '../storage/storage';

export interface SearchFilters {
  text?: string;
  productSource?: '증권' | '보험';
  questionType?: string;
  gender?: '남' | '여';
  ageGroup?: string;
  status?: string;
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export class QueryService {
  // 텍스트 검색을 위한 필드 매핑
  private static readonly SEARCHABLE_FIELDS = {
    userAnon: ['customerSource', 'ageGroup', 'gender', 'investmentTendency', 'insuranceCrossRatio'],
    product: ['productName', 'productCategory', 'description', 'managementCompany'],
    cotqa: ['question', 'cot1', 'cot2', 'cot3', 'answer', 'author']
  };

  // 필터를 쿼리 옵션으로 변환
  static buildQueryOptions(
    filters: SearchFilters,
    page: number = 1,
    pageSize: number = 50,
    sortBy: string = 'updatedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): QueryOptions {
    const queryFilters: Record<string, any> = {};

    // 기본 필터들
    if (filters.productSource) queryFilters.productSource = filters.productSource;
    if (filters.questionType) queryFilters.questionType = filters.questionType;
    if (filters.gender) queryFilters.gender = filters.gender;
    if (filters.ageGroup) queryFilters.ageGroup = filters.ageGroup;
    if (filters.status) queryFilters.status = filters.status;
    if (filters.author) queryFilters.author = filters.author;

    // 날짜 범위 필터
    if (filters.dateRange) {
      queryFilters.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    return {
      page,
      pageSize,
      sortBy,
      sortOrder,
      search: filters.text,
      filters: queryFilters
    };
  }

  // CoT 전용 텍스트 검색 (질문, CoT1~n, 답변 포함)
  static searchCoTContent(cotData: any[], searchText: string): any[] {
    if (!searchText) return cotData;

    const searchLower = searchText.toLowerCase();

    return cotData.filter(cot => {
      // 기본 검색 필드들
      const basicFields = [cot.question, cot.answer, cot.author].join(' ');
      
      // 동적 CoT 필드들 (cot1, cot2, cot3, cot4, ...)
      const cotFields = Object.keys(cot)
        .filter(key => key.match(/^cot\d+$/))
        .map(key => cot[key])
        .join(' ');

      const allContent = (basicFields + ' ' + cotFields).toLowerCase();
      return allContent.includes(searchLower);
    });
  }

  // 고급 필터링
  static applyAdvancedFilters<T>(data: T[], filters: Record<string, any>): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }

        const itemValue = (item as any)[key];

        // 배열 필드 처리
        if (Array.isArray(itemValue)) {
          if (Array.isArray(value)) {
            return value.some(v => itemValue.includes(v));
          }
          return itemValue.includes(value);
        }

        // 날짜 범위 처리
        if (typeof value === 'object' && value.gte && value.lte) {
          const itemDate = new Date(itemValue);
          const startDate = new Date(value.gte);
          const endDate = new Date(value.lte);
          return itemDate >= startDate && itemDate <= endDate;
        }

        // 부분 문자열 매치
        if (typeof itemValue === 'string' && typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }

        // 정확한 매치
        return itemValue === value;
      });
    });
  }

  // 정렬 유틸리티
  static sortData<T>(
    data: T[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): T[] {
    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      // null/undefined 처리
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

      // 날짜 처리
      if (typeof aValue === 'string' && aValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortOrder === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      // 문자열 처리
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue, 'ko');
        return sortOrder === 'asc' ? result : -result;
      }

      // 숫자 처리
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 기본 비교
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // 페이지네이션 유틸리티
  static paginateData<T>(
    data: T[],
    page: number,
    pageSize: number
  ): PaginatedResult<T> {
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = data.slice(startIndex, endIndex);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  // 통합 쿼리 처리
  static async processQuery<T>(
    data: T[],
    options: QueryOptions
  ): Promise<PaginatedResult<T>> {
    let result = [...data];

    // 필터 적용
    if (options.filters && Object.keys(options.filters).length > 0) {
      result = this.applyAdvancedFilters(result, options.filters);
    }

    // 텍스트 검색 적용
    if (options.search) {
      // CoT 데이터인 경우 특별 처리
      if (result.length > 0 && result[0] && typeof result[0] === 'object' && 'question' in result[0] && 'cot1' in result[0]) {
        result = this.searchCoTContent(result, options.search);
      } else {
        // 일반 텍스트 검색
        const searchLower = options.search.toLowerCase();
        result = result.filter(item => {
          const searchableText = Object.values(item as any)
            .filter(value => typeof value === 'string')
            .join(' ')
            .toLowerCase();
          return searchableText.includes(searchLower);
        });
      }
    }

    // 정렬 적용
    if (options.sortBy) {
      result = this.sortData(result, options.sortBy, options.sortOrder);
    }

    // 페이지네이션 적용
    return this.paginateData(result, options.page || 1, options.pageSize || 50);
  }
}
