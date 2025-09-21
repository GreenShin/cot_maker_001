/**
 * SQL 기반 검색/정렬/페이징 서비스
 * SQLite-WASM과 통합된 고성능 쿼리 처리
 */

import { SQLiteAdapter } from '../storage/sqliteAdapter.js';

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'nin' | 'like' | 'nlike' | 'between' | 'exists';
  value: any;
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sort?: QuerySort[];
  search?: {
    term: string;
    fields: string[];
    useFTS?: boolean; // Full-Text Search 사용 여부
  };
  pagination?: {
    page: number;
    limit: number;
  };
  select?: string[]; // 선택할 컬럼
  groupBy?: string[];
  having?: QueryFilter[];
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  aggregations?: Record<string, any>;
}

export interface AggregateOptions {
  count?: string[];
  sum?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
  groupBy?: string[];
}

/**
 * SQL 쿼리 빌더
 * 동적 SQL 생성을 위한 헬퍼 클래스
 */
export class SQLQueryBuilder {
  private table: string;
  private selectFields: string[] = ['*'];
  private whereConditions: string[] = [];
  private joinClauses: string[] = [];
  private orderByClause: string = '';
  private groupByClause: string = '';
  private havingClause: string = '';
  private limitClause: string = '';
  private params: any[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  where(condition: string, ...params: any[]): this {
    this.whereConditions.push(condition);
    this.params.push(...params);
    return this;
  }

  join(joinClause: string): this {
    this.joinClauses.push(joinClause);
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    if (this.orderByClause) {
      this.orderByClause += `, ${field} ${direction.toUpperCase()}`;
    } else {
      this.orderByClause = `ORDER BY ${field} ${direction.toUpperCase()}`;
    }
    return this;
  }

  groupBy(fields: string[]): this {
    this.groupByClause = `GROUP BY ${fields.join(', ')}`;
    return this;
  }

  having(condition: string, ...params: any[]): this {
    this.havingClause = `HAVING ${condition}`;
    this.params.push(...params);
    return this;
  }

  limit(limit: number, offset: number = 0): this {
    this.limitClause = `LIMIT ${limit}`;
    if (offset > 0) {
      this.limitClause += ` OFFSET ${offset}`;
    }
    return this;
  }

  build(): { sql: string; params: any[] } {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.table}`;

    // JOIN 절
    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses.join(' ');
    }

    // WHERE 절
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    // GROUP BY 절
    if (this.groupByClause) {
      sql += ` ${this.groupByClause}`;
    }

    // HAVING 절
    if (this.havingClause) {
      sql += ` ${this.havingClause}`;
    }

    // ORDER BY 절
    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`;
    }

    // LIMIT 절
    if (this.limitClause) {
      sql += ` ${this.limitClause}`;
    }

    return { sql, params: this.params };
  }

  reset(): this {
    this.selectFields = ['*'];
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByClause = '';
    this.groupByClause = '';
    this.havingClause = '';
    this.limitClause = '';
    this.params = [];
    return this;
  }
}

/**
 * 쿼리 서비스 클래스
 * 고급 검색, 정렬, 페이징 기능 제공
 */
export class QueryService {
  private sqliteAdapter: SQLiteAdapter;

  constructor(sqliteAdapter: SQLiteAdapter) {
    this.sqliteAdapter = sqliteAdapter;
  }

  /**
   * 일반적인 쿼리 실행
   */
  async query<T>(tableName: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
    const builder = new SQLQueryBuilder(tableName);

    // SELECT 필드 설정
    if (options.select && options.select.length > 0) {
      builder.select(options.select);
    }

    // 필터 조건 적용
    if (options.filters) {
      this.applyFilters(builder, options.filters);
    }

    // 검색 조건 적용
    if (options.search) {
      await this.applySearch(builder, tableName, options.search);
    }

    // 정렬 적용
    if (options.sort && options.sort.length > 0) {
      options.sort.forEach(sort => {
        builder.orderBy(sort.field, sort.direction);
      });
    }

    // 페이징 처리
    let total = 0;
    let totalPages = 0;
    
    if (options.pagination) {
      // 총 개수 조회
      const countBuilder = new SQLQueryBuilder(tableName);
      countBuilder.select(['COUNT(*) as count']);
      
      if (options.filters) {
        this.applyFilters(countBuilder, options.filters);
      }
      if (options.search) {
        await this.applySearch(countBuilder, tableName, options.search);
      }
      
      const { sql: countSql, params: countParams } = countBuilder.build();
      const countResult = this.sqliteAdapter.selectOne<{ count: number }>(countSql, countParams);
      total = countResult?.count || 0;
      totalPages = Math.ceil(total / options.pagination.limit);

      // 페이징 적용
      const offset = (options.pagination.page - 1) * options.pagination.limit;
      builder.limit(options.pagination.limit, offset);
    }

    // 쿼리 실행
    const { sql, params } = builder.build();
    const data = this.sqliteAdapter.selectAll<T>(sql, params);

    return {
      data: data.map(item => this.snakeToCamelCase(item)),
      total,
      page: options.pagination?.page,
      limit: options.pagination?.limit,
      totalPages: totalPages || undefined
    };
  }

  /**
   * 집계 쿼리 실행
   */
  async aggregate<T>(
    tableName: string, 
    aggregateOptions: AggregateOptions, 
    queryOptions: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const builder = new SQLQueryBuilder(tableName);

    // 집계 필드 구성
    const selectFields: string[] = [];

    if (aggregateOptions.count) {
      aggregateOptions.count.forEach(field => {
        selectFields.push(`COUNT(${field}) as count_${field}`);
      });
    }

    if (aggregateOptions.sum) {
      aggregateOptions.sum.forEach(field => {
        selectFields.push(`SUM(${field}) as sum_${field}`);
      });
    }

    if (aggregateOptions.avg) {
      aggregateOptions.avg.forEach(field => {
        selectFields.push(`AVG(${field}) as avg_${field}`);
      });
    }

    if (aggregateOptions.min) {
      aggregateOptions.min.forEach(field => {
        selectFields.push(`MIN(${field}) as min_${field}`);
      });
    }

    if (aggregateOptions.max) {
      aggregateOptions.max.forEach(field => {
        selectFields.push(`MAX(${field}) as max_${field}`);
      });
    }

    // GROUP BY 필드 추가
    if (aggregateOptions.groupBy) {
      selectFields.unshift(...aggregateOptions.groupBy);
      builder.groupBy(aggregateOptions.groupBy);
    }

    builder.select(selectFields);

    // 필터 조건 적용
    if (queryOptions.filters) {
      this.applyFilters(builder, queryOptions.filters);
    }

    // HAVING 조건 적용
    if (queryOptions.having) {
      queryOptions.having.forEach(filter => {
        const condition = this.buildFilterCondition(filter);
        builder.having(condition.sql, ...condition.params);
      });
    }

    // 정렬 적용
    if (queryOptions.sort && queryOptions.sort.length > 0) {
      queryOptions.sort.forEach(sort => {
        builder.orderBy(sort.field, sort.direction);
      });
    }

    // 쿼리 실행
    const { sql, params } = builder.build();
    const data = this.sqliteAdapter.selectAll<T>(sql, params);

    return {
      data: data.map(item => this.snakeToCamelCase(item)),
      total: data.length,
      aggregations: data.length > 0 ? data[0] : {}
    };
  }

  /**
   * 전체 텍스트 검색 (FTS)
   */
  async fullTextSearch<T>(
    searchTerm: string, 
    options: { 
      limit?: number; 
      highlightFields?: string[];
      minRelevance?: number;
    } = {}
  ): Promise<QueryResult<T>> {
    const { limit = 100, highlightFields = [], minRelevance = 0.1 } = options;

    // FTS 테이블을 사용한 검색
    const sql = `
      SELECT 
        cotqa.*,
        rank as relevance_score,
        snippet(cotqa_fts, 1, '<mark>', '</mark>', '...', 64) as question_snippet,
        snippet(cotqa_fts, 5, '<mark>', '</mark>', '...', 64) as answer_snippet
      FROM cotqa_fts
      JOIN cotqa ON cotqa.id = cotqa_fts.id
      WHERE cotqa_fts MATCH ?
        AND rank >= ?
      ORDER BY rank DESC
      LIMIT ?
    `;

    const data = this.sqliteAdapter.selectAll<T>(sql, [searchTerm, minRelevance, limit]);

    // 하이라이트 처리
    const processedData = data.map(item => {
      const processed = this.snakeToCamelCase(item);
      
      // 하이라이트 필드 처리
      if (highlightFields.length > 0) {
        highlightFields.forEach(field => {
          if (processed[field] && typeof processed[field] === 'string') {
            processed[field] = this.highlightText(processed[field], searchTerm);
          }
        });
      }
      
      return processed;
    });

    return {
      data: processedData,
      total: data.length
    };
  }

  /**
   * 복잡한 조인 쿼리
   */
  async joinQuery<T>(
    mainTable: string,
    joins: Array<{
      table: string;
      on: string;
      type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    }>,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const builder = new SQLQueryBuilder(mainTable);

    // JOIN 절 추가
    joins.forEach(join => {
      const joinType = join.type || 'INNER';
      builder.join(`${joinType} JOIN ${join.table} ON ${join.on}`);
    });

    // 나머지 옵션들 적용
    if (options.select) {
      builder.select(options.select);
    }

    if (options.filters) {
      this.applyFilters(builder, options.filters);
    }

    if (options.sort) {
      options.sort.forEach(sort => {
        builder.orderBy(sort.field, sort.direction);
      });
    }

    const { sql, params } = builder.build();
    const data = this.sqliteAdapter.selectAll<T>(sql, params);

    return {
      data: data.map(item => this.snakeToCamelCase(item)),
      total: data.length
    };
  }

  /**
   * 배치 삽입 (트랜잭션 처리)
   */
  async batchInsert<T extends Record<string, any>>(
    tableName: string,
    data: T[],
    batchSize: number = 1000
  ): Promise<void> {
    await this.sqliteAdapter.transaction(async () => {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await this.sqliteAdapter.batchInsert(tableName, batch, batchSize);
      }
    });
  }

  /**
   * 통계 정보 조회
   */
  async getTableStats(tableName: string): Promise<{
    rowCount: number;
    columnStats: Record<string, any>;
  }> {
    // 행 수 조회
    const countResult = this.sqliteAdapter.selectOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCount = countResult?.count || 0;

    // 컬럼 통계 (예: 각 컬럼의 고유값 개수)
    const columnStats: Record<string, any> = {};

    // 테이블 스키마 정보 조회
    const schemaInfo = this.sqliteAdapter.selectAll<{ name: string; type: string }>(
      `PRAGMA table_info(${tableName})`
    );

    for (const column of schemaInfo) {
      if (column.type === 'TEXT' || column.type === 'INTEGER') {
        const distinctResult = this.sqliteAdapter.selectOne<{ distinct_count: number }>(
          `SELECT COUNT(DISTINCT ${column.name}) as distinct_count FROM ${tableName}`
        );
        columnStats[column.name] = {
          type: column.type,
          distinctCount: distinctResult?.distinct_count || 0
        };
      }
    }

    return { rowCount, columnStats };
  }

  // Private helper methods

  private applyFilters(builder: SQLQueryBuilder, filters: QueryFilter[]): void {
    filters.forEach(filter => {
      const condition = this.buildFilterCondition(filter);
      builder.where(condition.sql, ...condition.params);
    });
  }

  private async applySearch(
    builder: SQLQueryBuilder, 
    tableName: string, 
    search: QueryOptions['search']
  ): Promise<void> {
    if (!search || !search.term) return;

    if (search.useFTS && tableName === 'cotqa') {
      // FTS 검색 사용
      builder.join('JOIN cotqa_fts ON cotqa.id = cotqa_fts.id');
      builder.where('cotqa_fts MATCH ?', search.term);
    } else {
      // 일반 LIKE 검색
      const searchConditions = search.fields.map(field => `${field} LIKE ?`);
      if (searchConditions.length > 0) {
        const condition = `(${searchConditions.join(' OR ')})`;
        const params = search.fields.map(() => `%${search.term}%`);
        builder.where(condition, ...params);
      }
    }
  }

  private buildFilterCondition(filter: QueryFilter): { sql: string; params: any[] } {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'eq':
        return { sql: `${field} = ?`, params: [value] };
      case 'ne':
        return { sql: `${field} != ?`, params: [value] };
      case 'lt':
        return { sql: `${field} < ?`, params: [value] };
      case 'le':
        return { sql: `${field} <= ?`, params: [value] };
      case 'gt':
        return { sql: `${field} > ?`, params: [value] };
      case 'ge':
        return { sql: `${field} >= ?`, params: [value] };
      case 'in':
        const placeholders = Array.isArray(value) ? value.map(() => '?').join(', ') : '?';
        const inValues = Array.isArray(value) ? value : [value];
        return { sql: `${field} IN (${placeholders})`, params: inValues };
      case 'nin':
        const ninPlaceholders = Array.isArray(value) ? value.map(() => '?').join(', ') : '?';
        const ninValues = Array.isArray(value) ? value : [value];
        return { sql: `${field} NOT IN (${ninPlaceholders})`, params: ninValues };
      case 'like':
        return { sql: `${field} LIKE ?`, params: [`%${value}%`] };
      case 'nlike':
        return { sql: `${field} NOT LIKE ?`, params: [`%${value}%`] };
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return { sql: `${field} BETWEEN ? AND ?`, params: value };
        }
        throw new Error('Between operator requires array with 2 values');
      case 'exists':
        return { sql: `${field} IS NOT NULL`, params: [] };
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private highlightText(text: string, searchTerm: string): string {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private snakeToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.snakeToCamelCase(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        result[camelKey] = this.snakeToCamelCase(value);
      }
      return result;
    }
    
    return obj;
  }
}

/**
 * 쿼리 캐시
 * 자주 사용되는 쿼리 결과를 캐시하여 성능 향상
 */
export class QueryCache {
  private cache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5분

  constructor(private queryService: QueryService) {}

  async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<QueryResult<T>>,
    ttl: number = this.defaultTTL
  ): Promise<QueryResult<T>> {
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    // 캐시된 결과가 있고 TTL이 유효한 경우
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.result;
    }

    // 새로운 쿼리 실행
    const result = await queryFn();
    this.cache.set(cacheKey, {
      result,
      timestamp: now,
      ttl
    });

    return result;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}