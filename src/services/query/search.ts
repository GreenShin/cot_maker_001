import { CoTQA } from '../../models/cotqa.js';
import { Product } from '../../models/product.js';
import { UserAnon } from '../../models/userAnon.js';
import { QueryService, QueryFilter, QueryOptions } from './queryService.js';
import { SQLiteAdapter } from '../storage/sqliteAdapter.js';

// 검색 옵션
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  highlightMatches?: boolean;
}

// 검색 결과
export interface SearchResult<T> {
  item: T;
  matches: SearchMatch[];
  score: number; // 관련성 점수 (0-1)
}

export interface SearchMatch {
  field: string;
  value: string;
  matchStart: number;
  matchEnd: number;
  context?: string; // 매치 주변 컨텍스트
}

// 텍스트 검색 유틸리티 클래스
export class TextSearchService {
  private normalizeText(text: string, options: SearchOptions = {}): string {
    let normalized = text.trim();
    
    if (!options.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    return normalized;
  }

  private createSearchPattern(query: string, options: SearchOptions = {}): RegExp {
    let pattern = query;
    
    if (options.useRegex) {
      return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }
    
    // 특수 문자 이스케이프
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  }

  private findMatches(
    text: string,
    query: string,
    field: string,
    options: SearchOptions = {}
  ): SearchMatch[] {
    if (!text || !query) return [];
    
    const normalizedText = this.normalizeText(text, options);
    const normalizedQuery = this.normalizeText(query, options);
    const pattern = this.createSearchPattern(normalizedQuery, options);
    
    const matches: SearchMatch[] = [];
    let match;
    
    while ((match = pattern.exec(normalizedText)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      // 컨텍스트 생성 (매치 주변 50자)
      const contextStart = Math.max(0, matchStart - 50);
      const contextEnd = Math.min(normalizedText.length, matchEnd + 50);
      const context = normalizedText.slice(contextStart, contextEnd);
      
      matches.push({
        field,
        value: match[0],
        matchStart,
        matchEnd,
        context,
      });
      
      // 무한 루프 방지
      if (pattern.lastIndex === match.index) {
        pattern.lastIndex++;
      }
    }
    
    return matches;
  }

  private calculateScore(matches: SearchMatch[], totalFields: number): number {
    if (matches.length === 0) return 0;
    
    // 매치 개수와 필드 다양성을 고려한 점수
    const matchCount = matches.length;
    const uniqueFields = new Set(matches.map(m => m.field)).size;
    
    // 기본 점수: 매치 개수 기반
    let score = Math.min(matchCount / 10, 1); // 최대 10개 매치까지 고려
    
    // 필드 다양성 보너스
    const fieldDiversityBonus = uniqueFields / totalFields * 0.3;
    score += fieldDiversityBonus;
    
    return Math.min(score, 1);
  }

  // CoTQA 검색
  searchCoTQA(
    items: CoTQA[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<CoTQA>[] {
    if (!query.trim()) return items.map(item => ({ item, matches: [], score: 1 }));
    
    const results: SearchResult<CoTQA>[] = [];
    
    for (const item of items) {
      const allMatches: SearchMatch[] = [];
      
      // 검색 대상 필드들
      const searchFields = [
        { key: 'question', value: item.question },
        { key: 'cot1', value: item.cot1 },
        { key: 'cot2', value: item.cot2 },
        { key: 'cot3', value: item.cot3 },
        { key: 'answer', value: item.answer },
        { key: 'questionType', value: item.questionType },
        { key: 'status', value: item.status },
        { key: 'author', value: item.author || '' },
      ];
      
      // 동적 CoT 필드들도 검색
      Object.keys(item).forEach(key => {
        if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
          const value = (item as any)[key];
          if (typeof value === 'string') {
            searchFields.push({ key, value });
          }
        }
      });
      
      // 각 필드에서 매치 찾기
      for (const field of searchFields) {
        const matches = this.findMatches(field.value, query, field.key, options);
        allMatches.push(...matches);
      }
      
      if (allMatches.length > 0) {
        const score = this.calculateScore(allMatches, searchFields.length);
        results.push({ item, matches: allMatches, score });
      }
    }
    
    // 점수순으로 정렬
    return results.sort((a, b) => b.score - a.score);
  }

  // Product 검색
  searchProducts(
    items: Product[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<Product>[] {
    if (!query.trim()) return items.map(item => ({ item, matches: [], score: 1 }));
    
    const results: SearchResult<Product>[] = [];
    
    for (const item of items) {
      const allMatches: SearchMatch[] = [];
      
      const searchFields = [
        { key: 'productName', value: item.productName },
        { key: 'productCategory', value: item.productCategory },
        { key: 'description', value: item.description || '' },
        { key: 'managementCompany', value: item.managementCompany || '' },
        { key: 'expectedReturn', value: item.expectedReturn || '' },
      ];
      
      for (const field of searchFields) {
        const matches = this.findMatches(field.value, query, field.key, options);
        allMatches.push(...matches);
      }
      
      if (allMatches.length > 0) {
        const score = this.calculateScore(allMatches, searchFields.length);
        results.push({ item, matches: allMatches, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  // UserAnon 검색
  searchUsers(
    items: UserAnon[],
    query: string,
    options: SearchOptions = {}
  ): SearchResult<UserAnon>[] {
    if (!query.trim()) return items.map(item => ({ item, matches: [], score: 1 }));
    
    const results: SearchResult<UserAnon>[] = [];
    
    for (const item of items) {
      const allMatches: SearchMatch[] = [];
      
      const searchFields = [
        { key: 'ageGroup', value: item.ageGroup },
        { key: 'gender', value: item.gender },
        { key: 'customerSource', value: item.customerSource },
      ];
      
      // 고객출처별 특수 필드
      if (item.customerSource === '증권' && 'investmentTendency' in item) {
        searchFields.push({ key: 'investmentTendency', value: item.investmentTendency || '' });
      } else if (item.customerSource === '보험' && 'insuranceCrossRatio' in item) {
        searchFields.push({ key: 'insuranceCrossRatio', value: item.insuranceCrossRatio || '' });
      }
      
      // 보유 상품 검색
      if (item.ownedProducts) {
        item.ownedProducts.forEach((product, index) => {
          searchFields.push({
            key: `ownedProducts[${index}].productName`,
            value: product.productName,
          });
        });
      }
      
      for (const field of searchFields) {
        const matches = this.findMatches(field.value, query, field.key, options);
        allMatches.push(...matches);
      }
      
      if (allMatches.length > 0) {
        const score = this.calculateScore(allMatches, searchFields.length);
        results.push({ item, matches: allMatches, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  // 텍스트 하이라이트
  highlightText(
    text: string,
    matches: SearchMatch[],
    highlightClass: string = 'search-highlight'
  ): string {
    if (!matches.length) return text;
    
    // 매치들을 위치순으로 정렬
    const sortedMatches = [...matches].sort((a, b) => a.matchStart - b.matchStart);
    
    let result = '';
    let lastIndex = 0;
    
    for (const match of sortedMatches) {
      // 매치 이전 텍스트
      result += text.slice(lastIndex, match.matchStart);
      
      // 하이라이트된 매치
      result += `<span class="${highlightClass}">${text.slice(match.matchStart, match.matchEnd)}</span>`;
      
      lastIndex = match.matchEnd;
    }
    
    // 마지막 매치 이후 텍스트
    result += text.slice(lastIndex);
    
    return result;
  }

  // 검색 제안
  getSuggestions(
    items: (CoTQA | Product | UserAnon)[],
    query: string,
    maxSuggestions: number = 5
  ): string[] {
    if (!query.trim() || query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();
    
    // 각 아이템의 텍스트 필드에서 제안 추출
    for (const item of items) {
      const texts: string[] = [];
      
      if ('question' in item) {
        // CoTQA
        texts.push(item.question, item.cot1, item.cot2, item.cot3, item.answer);
      } else if ('productName' in item) {
        // Product
        texts.push(item.productName, item.productCategory);
        if (item.description) texts.push(item.description);
      } else {
        // UserAnon
        texts.push(item.ageGroup, item.gender, item.customerSource);
      }
      
      // 단어 단위로 분할하여 제안 생성
      for (const text of texts) {
        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.includes(lowerQuery) && word.length > 2) {
            suggestions.add(word);
          }
        }
      }
      
      if (suggestions.size >= maxSuggestions) break;
    }
    
    return Array.from(suggestions).slice(0, maxSuggestions);
  }
}

// SQLite 기반 고급 검색 서비스
export class SQLiteSearchService {
  private queryService: QueryService;
  private sqliteAdapter: SQLiteAdapter;

  constructor(sqliteAdapter: SQLiteAdapter) {
    this.sqliteAdapter = sqliteAdapter;
    this.queryService = new QueryService(sqliteAdapter);
  }

  /**
   * CoT 전체 텍스트 검색 (FTS 활용)
   */
  async searchCoTsFTS(searchTerm: string, options: {
    limit?: number;
    minRelevance?: number;
    filters?: Record<string, any>;
  } = {}): Promise<{
    items: CoTQA[];
    total: number;
    searchTime: number;
  }> {
    const startTime = performance.now();
    const { limit = 100, minRelevance = 0.1, filters = {} } = options;

    try {
      // FTS 기반 검색 실행
      const result = await this.queryService.fullTextSearch<CoTQA>(searchTerm, {
        limit,
        minRelevance
      });

      // 추가 필터 적용
      let filteredItems = result.data;
      if (Object.keys(filters).length > 0) {
        filteredItems = filteredItems.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            if (value === undefined || value === null || value === '') return true;
            return (item as any)[key] === value;
          });
        });
      }

      return {
        items: filteredItems,
        total: filteredItems.length,
        searchTime: performance.now() - startTime
      };

    } catch (error) {
      console.error('FTS search failed:', error);
      return { items: [], total: 0, searchTime: performance.now() - startTime };
    }
  }

  /**
   * 통합 검색 (모든 엔티티 대상)
   */
  async searchAll(searchTerm: string, options: {
    includeCoTs?: boolean;
    includeProducts?: boolean;
    includeUsers?: boolean;
    limit?: number;
  } = {}): Promise<{
    cots: CoTQA[];
    products: Product[];
    users: UserAnon[];
    totalResults: number;
    searchTime: number;
  }> {
    const startTime = performance.now();
    const {
      includeCoTs = true,
      includeProducts = true,
      includeUsers = true,
      limit = 20
    } = options;

    const results = {
      cots: [] as CoTQA[],
      products: [] as Product[],
      users: [] as UserAnon[],
      totalResults: 0,
      searchTime: 0
    };

    try {
      const searchPromises: Promise<any>[] = [];

      // CoT 검색
      if (includeCoTs) {
        searchPromises.push(
          this.queryService.query<CoTQA>('cotqa', {
            search: {
              term: searchTerm,
              fields: ['question', 'cot1', 'cot2', 'cot3', 'answer'],
              useFTS: true
            },
            pagination: { page: 1, limit }
          })
        );
      }

      // 상품 검색  
      if (includeProducts) {
        searchPromises.push(
          this.queryService.query<Product>('product', {
            search: {
              term: searchTerm,
              fields: ['product_name', 'product_category', 'description']
            },
            pagination: { page: 1, limit }
          })
        );
      }

      // 질문자 검색
      if (includeUsers) {
        searchPromises.push(
          this.queryService.query<UserAnon>('user_anon', {
            search: {
              term: searchTerm,
              fields: ['customer_source', 'age_group', 'gender']
            },
            pagination: { page: 1, limit }
          })
        );
      }

      const searchResults = await Promise.all(searchPromises);

      let resultIndex = 0;
      if (includeCoTs) {
        results.cots = searchResults[resultIndex].data;
        resultIndex++;
      }
      if (includeProducts) {
        results.products = searchResults[resultIndex].data;
        resultIndex++;
      }
      if (includeUsers) {
        results.users = searchResults[resultIndex].data;
      }

      results.totalResults = results.cots.length + results.products.length + results.users.length;
      results.searchTime = performance.now() - startTime;

      return results;

    } catch (error) {
      console.error('Unified search failed:', error);
      results.searchTime = performance.now() - startTime;
      return results;
    }
  }

  /**
   * 고급 필터링을 통한 CoT 검색
   */
  async searchCoTsWithFilters(options: {
    searchTerm?: string;
    productSource?: '증권' | '보험';
    questionType?: string;
    status?: string;
    dateRange?: { start: string; end: string };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    items: CoTQA[];
    total: number;
    page: number;
    totalPages: number;
    searchTime: number;
  }> {
    const startTime = performance.now();
    const {
      searchTerm,
      productSource,
      questionType,
      status,
      dateRange,
      sortBy = 'updated_at',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = options;

    try {
      const filters: QueryFilter[] = [];

      if (productSource) {
        filters.push({ field: 'product_source', operator: 'eq', value: productSource });
      }
      if (questionType) {
        filters.push({ field: 'question_type', operator: 'eq', value: questionType });
      }
      if (status) {
        filters.push({ field: 'status', operator: 'eq', value: status });
      }
      if (dateRange) {
        filters.push({ 
          field: 'created_at', 
          operator: 'between', 
          value: [dateRange.start, dateRange.end] 
        });
      }

      const queryOptions: QueryOptions = {
        filters,
        sort: [{ field: sortBy, direction: sortOrder }],
        pagination: { page, limit },
        search: searchTerm ? {
          term: searchTerm,
          fields: ['question', 'cot1', 'cot2', 'cot3', 'answer'],
          useFTS: true
        } : undefined
      };

      const result = await this.queryService.query<CoTQA>('cotqa', queryOptions);

      return {
        items: result.data,
        total: result.total,
        page: result.page || page,
        totalPages: result.totalPages || 1,
        searchTime: performance.now() - startTime
      };

    } catch (error) {
      console.error('Advanced CoT search failed:', error);
      return {
        items: [],
        total: 0,
        page,
        totalPages: 1,
        searchTime: performance.now() - startTime
      };
    }
  }

  /**
   * 관련 CoT 추천
   */
  async getRelatedCoTs(cotId: string, limit: number = 5): Promise<CoTQA[]> {
    try {
      // 기준 CoT 조회
      const baseCot = await this.sqliteAdapter.selectOne<CoTQA>(
        'SELECT * FROM cotqa WHERE id = ?',
        [cotId]
      );

      if (!baseCot) return [];

      // 같은 상품분류/질문유형의 유사한 CoT 찾기
      const relatedCoTs = await this.sqliteAdapter.selectAll<CoTQA>(`
        SELECT *,
               CASE 
                 WHEN product_source = ? AND question_type = ? THEN 3
                 WHEN product_source = ? THEN 2
                 ELSE 1
               END as similarity_score
        FROM cotqa
        WHERE id != ?
          AND (product_source = ? OR question_type = ?)
        ORDER BY similarity_score DESC, updated_at DESC
        LIMIT ?
      `, [
        baseCot.productSource, baseCot.questionType,
        baseCot.productSource,
        cotId,
        baseCot.productSource, baseCot.questionType,
        limit
      ]);

      return relatedCoTs;

    } catch (error) {
      console.error('Related CoTs search failed:', error);
      return [];
    }
  }

  /**
   * 검색 자동완성/제안
   */
  async getSearchSuggestions(partialTerm: string, limit: number = 10): Promise<string[]> {
    try {
      if (partialTerm.length < 2) return [];

      // 질문과 답변에서 자주 등장하는 단어/구문 추출
      const suggestions = await this.sqliteAdapter.selectAll<{ term: string }>(`
        SELECT DISTINCT 
          CASE 
            WHEN question LIKE ? THEN
              SUBSTR(question, 
                INSTR(LOWER(question), LOWER(?)) - 10,
                LENGTH(?) + 20
              )
            WHEN answer LIKE ? THEN
              SUBSTR(answer,
                INSTR(LOWER(answer), LOWER(?)) - 10, 
                LENGTH(?) + 20
              )
            ELSE NULL
          END as term
        FROM cotqa
        WHERE term IS NOT NULL 
          AND LENGTH(TRIM(term)) > 5
        ORDER BY LENGTH(term) ASC
        LIMIT ?
      `, [
        `%${partialTerm}%`, partialTerm, partialTerm,
        `%${partialTerm}%`, partialTerm, partialTerm,
        limit
      ]);

      return suggestions
        .map(s => s.term.trim())
        .filter(term => term.toLowerCase().includes(partialTerm.toLowerCase()));

    } catch (error) {
      console.error('Search suggestions failed:', error);
      return [];
    }
  }

  /**
   * 검색 통계
   */
  async getSearchAnalytics(): Promise<{
    totalCoTs: number;
    totalProducts: number;
    totalUsers: number;
    topQuestionTypes: Array<{ type: string; count: number }>;
    recentSearches: Array<{ date: string; count: number }>;
  }> {
    try {
      const analytics = await Promise.all([
        // 총 개수
        this.sqliteAdapter.selectOne<{ count: number }>('SELECT COUNT(*) as count FROM cotqa'),
        this.sqliteAdapter.selectOne<{ count: number }>('SELECT COUNT(*) as count FROM product'),
        this.sqliteAdapter.selectOne<{ count: number }>('SELECT COUNT(*) as count FROM user_anon'),
        
        // 인기 질문 유형
        this.sqliteAdapter.selectAll<{ type: string; count: number }>(`
          SELECT question_type as type, COUNT(*) as count
          FROM cotqa
          GROUP BY question_type
          ORDER BY count DESC
          LIMIT 10
        `),
        
        // 최근 생성 추세
        this.sqliteAdapter.selectAll<{ date: string; count: number }>(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM cotqa
          WHERE created_at >= date('now', '-30 days')
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `)
      ]);

      return {
        totalCoTs: analytics[0]?.count || 0,
        totalProducts: analytics[1]?.count || 0,
        totalUsers: analytics[2]?.count || 0,
        topQuestionTypes: analytics[3],
        recentSearches: analytics[4]
      };

    } catch (error) {
      console.error('Search analytics failed:', error);
      return {
        totalCoTs: 0,
        totalProducts: 0,
        totalUsers: 0,
        topQuestionTypes: [],
        recentSearches: []
      };
    }
  }
}

// 싱글톤 인스턴스
export const textSearchService = new TextSearchService();
