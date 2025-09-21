import { SQLiteAdapter } from './sqliteAdapter.js';

// 스토리지 추상화 인터페이스
export interface StorageAdapter<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  query(filters: Record<string, any>): Promise<T[]>;
  count(filters?: Record<string, any>): Promise<number>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// 메모리 기반 스토리지 어댑터 (개발/테스트용)
export class InMemoryStorageAdapter<T extends { id: string; createdAt?: string; updatedAt?: string }> 
  implements StorageAdapter<T> {
  
  private data: Map<string, T> = new Map();
  private idCounter = 1;

  constructor(private entityName: string) {}

  async getAll(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  async getById(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = `${this.entityName}-${this.idCounter++}`;
    const now = new Date().toISOString();
    
    const newItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now
    } as T;

    this.data.set(id, newItem);
    return newItem;
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    const existing = this.data.get(id);
    if (!existing) {
      throw new Error(`${this.entityName} with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...item,
      id, // ID는 변경 불가
      updatedAt: new Date().toISOString()
    } as T;

    this.data.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  async query(filters: Record<string, any>): Promise<T[]> {
    const items = Array.from(this.data.values());
    
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return true; // 빈 필터는 무시
        }
        
        const itemValue = (item as any)[key];
        
        // 배열 필드의 경우 포함 여부 확인
        if (Array.isArray(itemValue)) {
          return Array.isArray(value) 
            ? value.some(v => itemValue.includes(v))
            : itemValue.includes(value);
        }
        
        // 문자열 필드의 경우 부분 일치
        if (typeof itemValue === 'string' && typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        
        // 정확한 일치
        return itemValue === value;
      });
    });
  }

  async count(filters?: Record<string, any>): Promise<number> {
    if (!filters) {
      return this.data.size;
    }
    const filtered = await this.query(filters);
    return filtered.length;
  }

  // 페이징 지원
  async getPaginated(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      pageSize = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      search = '',
      filters = {}
    } = options;

    let items = Array.from(this.data.values());

    // 필터 적용
    if (Object.keys(filters).length > 0) {
      items = await this.query(filters);
    }

    // 텍스트 검색 적용 (전체 텍스트 필드 대상)
    if (search) {
      items = items.filter(item => {
        const searchableText = Object.values(item)
          .filter(value => typeof value === 'string')
          .join(' ')
          .toLowerCase();
        return searchableText.includes(search.toLowerCase());
      });
    }

    // 정렬 적용
    items.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 페이징 적용
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  // 개발용 헬퍼 메서드
  seed(items: T[]): void {
    this.data.clear();
    items.forEach(item => {
      this.data.set(item.id, item);
    });
    this.idCounter = Math.max(...items.map(item => 
      parseInt(item.id.split('-').pop() || '0')
    )) + 1;
  }

  clear(): void {
    this.data.clear();
    this.idCounter = 1;
  }
}

// SQLite 기반 스토리지 어댑터 (OPFS + SQLite-WASM)
export class SQLiteStorageAdapter<T extends { id: string; createdAt?: string; updatedAt?: string }> 
  implements StorageAdapter<T> {
  
  private sqliteAdapter: SQLiteAdapter;
  private tableName: string;
  private schema: Record<string, string>;

  constructor(
    entityName: string, 
    schema: Record<string, string>,
    sqliteAdapter?: SQLiteAdapter
  ) {
    this.tableName = this.entityNameToTableName(entityName);
    this.schema = schema;
    this.sqliteAdapter = sqliteAdapter || new SQLiteAdapter();
  }

  async getAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY updated_at DESC`;
    return this.sqliteAdapter.selectAll<T>(sql);
  }

  async getById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return this.sqliteAdapter.selectOne<T>(sql, [id]);
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const newItem = {
      ...item,
      id,
      created_at: now,
      updated_at: now
    };

    // 동적 SQL 생성
    const columns = Object.keys(newItem);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const values = Object.values(newItem);

    this.sqliteAdapter.insert(sql, values);
    
    // 생성된 항목 반환 (camelCase 변환)
    return this.toCamelCase({
      ...newItem,
      createdAt: now,
      updatedAt: now
    }) as T;
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }

    const now = new Date().toISOString();
    const updateItem = {
      ...item,
      updated_at: now
    };

    // 동적 UPDATE SQL 생성
    const updates = Object.keys(updateItem)
      .filter(key => key !== 'id')
      .map(key => `${this.camelToSnakeCase(key)} = ?`)
      .join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`;
    const values = [
      ...Object.values(updateItem).filter((_, index) => Object.keys(updateItem)[index] !== 'id'),
      id
    ];

    this.sqliteAdapter.execute(sql, values);
    
    // 업데이트된 항목 반환
    return this.getById(id) as Promise<T>;
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const rowsAffected = this.sqliteAdapter.execute(sql, [id]);
    return rowsAffected > 0;
  }

  async query(filters: Record<string, any>): Promise<T[]> {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    // 동적 WHERE 절 생성
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      const columnName = this.camelToSnakeCase(key);
      
      if (Array.isArray(value)) {
        // IN 절 처리
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${columnName} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'string') {
        // LIKE 검색 처리
        conditions.push(`${columnName} LIKE ?`);
        params.push(`%${value}%`);
      } else {
        // 정확한 일치
        conditions.push(`${columnName} = ?`);
        params.push(value);
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY updated_at DESC`;

    return this.sqliteAdapter.selectAll<T>(sql, params).map(item => this.toCamelCase(item));
  }

  async count(filters?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions: string[] = [];
      
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') {
          continue;
        }
        
        const columnName = this.camelToSnakeCase(key);
        conditions.push(`${columnName} = ?`);
        params.push(value);
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    const result = this.sqliteAdapter.selectOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async getPaginated(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      pageSize = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      search = '',
      filters = {}
    } = options;

    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    const conditions: string[] = [];

    // 필터 조건 처리
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      const columnName = this.camelToSnakeCase(key);
      conditions.push(`${columnName} = ?`);
      params.push(value);
    }

    // 전체 텍스트 검색 (FTS 활용)
    if (search && this.tableName === 'cotqa') {
      // CoT 테이블인 경우 FTS 사용
      sql = `
        SELECT cotqa.*
        FROM cotqa_fts
        JOIN cotqa ON cotqa.id = cotqa_fts.id
      `;
      conditions.push('cotqa_fts MATCH ?');
      params.push(search);
    } else if (search) {
      // 일반 텍스트 검색
      const searchConditions = this.getTextColumns().map(col => 
        `${col} LIKE ?`
      );
      if (searchConditions.length > 0) {
        conditions.push(`(${searchConditions.join(' OR ')})`);
        searchConditions.forEach(() => params.push(`%${search}%`));
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // 정렬 처리
    const sortColumn = this.camelToSnakeCase(sortBy);
    sql += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // SQLite 어댑터의 페이징 기능 활용
    const result = this.sqliteAdapter.paginate<any>(sql, params, page, pageSize);
    
    return {
      ...result,
      data: result.data.map(item => this.toCamelCase(item))
    };
  }

  // 전체 텍스트 검색 (FTS 활용)
  async searchText(searchTerm: string, limit: number = 100): Promise<T[]> {
    if (this.tableName === 'cotqa') {
      const results = this.sqliteAdapter.searchText(searchTerm, limit);
      return results.map(item => this.toCamelCase(item));
    } else {
      // 일반 검색으로 폴백
      return this.query({ search: searchTerm });
    }
  }

  // 배치 삽입 (대용량 데이터용)
  async batchInsert(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    const dataWithMetadata = items.map((item, index) => ({
      ...item,
      id: this.generateId(index),
      created_at: now,
      updated_at: now
    }));

    await this.sqliteAdapter.batchInsert(this.tableName, dataWithMetadata);
  }

  // 유틸리티 메서드들
  private entityNameToTableName(entityName: string): string {
    const mapping: Record<string, string> = {
      'userAnon': 'user_anon',
      'product': 'product',
      'cotqa': 'cotqa',
      'ownedProduct': 'owned_product',
      'settings': 'settings'
    };
    return mapping[entityName] || entityName.toLowerCase();
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private snakeToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  private toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = this.snakeToCamelCase(key);
        result[camelKey] = this.toCamelCase(value);
      }
      return result;
    }
    
    return obj;
  }

  private generateId(suffix?: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const suffixStr = suffix !== undefined ? `-${suffix}` : '';
    return `${this.tableName}-${timestamp}-${random}${suffixStr}`;
  }

  private getTextColumns(): string[] {
    // 테이블별 텍스트 검색 대상 컬럼
    const textColumns: Record<string, string[]> = {
      'user_anon': ['customer_source', 'age_group', 'gender'],
      'product': ['product_name', 'product_category', 'description'],
      'cotqa': ['question', 'cot1', 'cot2', 'cot3', 'answer'],
      'owned_product': ['product_name'],
      'settings': ['key', 'value']
    };
    
    return textColumns[this.tableName] || [];
  }

  // 스토리지 초기화
  async initialize(): Promise<void> {
    await this.sqliteAdapter.initialize();
  }

  // 건강 상태 확인
  async healthCheck() {
    return this.sqliteAdapter.healthCheck();
  }
}

// 스토리지 팩토리
export type StorageType = 'sqlite' | 'memory';

export class StorageFactory {
  private static sqliteAdapter?: SQLiteAdapter;

  static async createAdapter<T extends { id: string; createdAt?: string; updatedAt?: string }>(
    entityName: string,
    schema: Record<string, string> = {},
    storageType: StorageType = 'sqlite'
  ): Promise<StorageAdapter<T>> {
    
    if (storageType === 'memory') {
      return new InMemoryStorageAdapter<T>(entityName);
    }

    // SQLite 어댑터 싱글톤
    if (!this.sqliteAdapter) {
      this.sqliteAdapter = new SQLiteAdapter();
      await this.sqliteAdapter.initialize();
    }

    return new SQLiteStorageAdapter<T>(entityName, schema, this.sqliteAdapter);
  }

  static async initializeSQLite(): Promise<SQLiteAdapter> {
    if (!this.sqliteAdapter) {
      this.sqliteAdapter = new SQLiteAdapter();
      await this.sqliteAdapter.initialize();
    }
    return this.sqliteAdapter;
  }

  static getSQLiteAdapter(): SQLiteAdapter | undefined {
    return this.sqliteAdapter;
  }
}
