/**
 * SQLite-WASM 어댑터
 * OPFS와 통합된 대용량 데이터 처리를 위한 SQLite-WASM 래퍼
 */

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { runMigrations, getDatabaseStats } from './migrations/index.js';
import { 
  getOptimalStorageConfig, 
  getStoragePath, 
  getBrowserWarning,
  StoragePerformanceMonitor,
  type StorageConfig 
} from './opfsCompat.js';

export interface SQLiteConfig extends StorageConfig {
  dbName: string;
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  rowsAffected?: number;
  lastInsertRowid?: number;
}

export interface TransactionOptions {
  readOnly?: boolean;
  timeout?: number;
}

/**
 * SQLite-WASM 어댑터 클래스
 * OPFS 기반 대용량 데이터 처리를 위한 고수준 인터페이스 제공
 */
export class SQLiteAdapter {
  private sqlite3: Sqlite3Static | null = null;
  private db: Database | null = null;
  private config: SQLiteConfig;
  private performanceMonitor?: StoragePerformanceMonitor;
  private initPromise?: Promise<void>;

  constructor(dbName: string = 'cotdb', customConfig?: Partial<SQLiteConfig>) {
    const optimalConfig = getOptimalStorageConfig();
    
    this.config = {
      ...optimalConfig,
      dbName,
      enableLogging: process.env.NODE_ENV === 'development',
      enablePerformanceMonitoring: true,
      ...customConfig
    };

    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor = new StoragePerformanceMonitor(this.config.type);
    }

    this.log('SQLite Adapter initialized with config:', this.config);
  }

  /**
   * 데이터베이스 초기화
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      this.log('Initializing SQLite-WASM...');

      // 브라우저 경고 확인
      const warning = getBrowserWarning();
      if (warning) {
        console.warn(warning);
      }

      // SQLite-WASM 초기화
      this.sqlite3 = await sqlite3InitModule({
        print: this.config.enableLogging ? console.log : () => {},
        printErr: this.config.enableLogging ? console.error : () => {}
      });

      this.log('SQLite-WASM loaded successfully');

      // 데이터베이스 열기
      const dbPath = getStoragePath(this.config.dbName, this.config);
      this.log(`Opening database at: ${dbPath}`);

      this.db = new this.sqlite3.oo1.DB(dbPath);
      
      if (!this.db) {
        throw new Error('Failed to open SQLite database');
      }

      // SQLite 설정 최적화
      this.optimizeDatabase();

      // 마이그레이션 실행
      runMigrations(this.db);

      // 통계 로그
      const stats = getDatabaseStats(this.db);
      this.log('Database initialized with stats:', stats);

    } catch (error) {
      this.log('Failed to initialize SQLite adapter:', error);
      this.performanceMonitor?.recordError();
      throw error;
    }
  }

  /**
   * 데이터베이스 최적화 설정
   */
  private optimizeDatabase(): void {
    if (!this.db) return;

    try {
      // 페이지 크기 설정
      this.db.exec(`PRAGMA page_size = ${this.config.pageSize}`);
      
      // 캐시 크기 설정
      this.db.exec(`PRAGMA cache_size = ${this.config.cacheSize}`);
      
      // WAL 모드 활성화 (OPFS에서만)
      if (this.config.enableWAL && this.config.type === 'opfs') {
        this.db.exec('PRAGMA journal_mode = WAL');
        this.db.exec('PRAGMA synchronous = NORMAL');
      }
      
      // 외래 키 제약 조건 활성화
      this.db.exec('PRAGMA foreign_keys = ON');
      
      // 분석 통계 활성화 (쿼리 최적화용)
      this.db.exec('PRAGMA optimize');

      this.log('Database optimization completed');
    } catch (error) {
      console.warn('Database optimization failed:', error);
    }
  }

  /**
   * SQL 쿼리 실행
   */
  query(sql: string, params: any[] = []): QueryResult {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const startTime = performance.now();

    try {
      this.log(`Executing query: ${sql}`, params);

      // 매개변수가 있는 경우 prepare statement 사용
      if (params.length > 0) {
        const stmt = this.db.prepare(sql);
        try {
          const result = stmt.get(params);
          const columns = stmt.getColumnNames();
          const values = result ? [Object.values(result)] : [];
          
          return {
            columns,
            values,
            rowsAffected: this.db.changes(),
            lastInsertRowid: this.db.lastInsertRowid()
          };
        } finally {
          stmt.finalize();
        }
      }

      // 단순 쿼리 실행
      const result = this.db.exec({
        sql,
        returnValue: 'resultRows',
        rowMode: 'array'
      });

      return {
        columns: result.length > 0 ? result[0].columns || [] : [],
        values: result.length > 0 ? result[0].values || [] : [],
        rowsAffected: this.db.changes(),
        lastInsertRowid: this.db.lastInsertRowid()
      };

    } catch (error) {
      this.performanceMonitor?.recordError();
      this.log('Query failed:', error);
      throw error;
    } finally {
      const executionTime = performance.now() - startTime;
      this.performanceMonitor?.recordQuery(executionTime);
      this.log(`Query executed in ${executionTime.toFixed(2)}ms`);
    }
  }

  /**
   * 다중 행 조회
   */
  selectAll<T = any>(sql: string, params: any[] = []): T[] {
    const result = this.query(sql, params);
    
    if (result.values.length === 0) {
      return [];
    }

    // 컬럼명을 키로 사용하여 객체 배열 생성
    return result.values.map(row => {
      const obj: any = {};
      result.columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj as T;
    });
  }

  /**
   * 단일 행 조회
   */
  selectOne<T = any>(sql: string, params: any[] = []): T | null {
    const results = this.selectAll<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 데이터 삽입
   */
  insert(sql: string, params: any[] = []): number {
    const result = this.query(sql, params);
    return result.lastInsertRowid || 0;
  }

  /**
   * 데이터 업데이트/삭제
   */
  execute(sql: string, params: any[] = []): number {
    const result = this.query(sql, params);
    return result.rowsAffected || 0;
  }

  /**
   * 트랜잭션 실행
   */
  async transaction<T>(
    callback: (adapter: SQLiteAdapter) => T | Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const isReadOnly = options.readOnly || false;
    const startSql = isReadOnly ? 'BEGIN DEFERRED' : 'BEGIN IMMEDIATE';

    this.query(startSql);

    try {
      const result = await callback(this);
      this.query('COMMIT');
      return result;
    } catch (error) {
      this.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * 전체 텍스트 검색 (FTS)
   */
  searchText(searchTerm: string, limit: number = 100): any[] {
    if (!this.config.enableFTS) {
      throw new Error('Full-text search is not enabled');
    }

    const sql = `
      SELECT cotqa.*
      FROM cotqa_fts
      JOIN cotqa ON cotqa.id = cotqa_fts.id
      WHERE cotqa_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;

    return this.selectAll(sql, [searchTerm, limit]);
  }

  /**
   * 배치 삽입 (대용량 데이터용)
   */
  async batchInsert<T extends Record<string, any>>(
    tableName: string,
    data: T[],
    batchSize: number = 1000
  ): Promise<void> {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    await this.transaction(async () => {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        for (const row of batch) {
          const values = columns.map(col => row[col]);
          this.insert(sql, values);
        }

        // 중간 진행 상황 로그
        if (this.config.enableLogging && i % (batchSize * 10) === 0) {
          this.log(`Batch insert progress: ${i + batch.length}/${data.length}`);
        }
      }
    });

    this.log(`Batch insert completed: ${data.length} records inserted into ${tableName}`);
  }

  /**
   * 페이징 조회
   */
  paginate<T = any>(
    sql: string, 
    params: any[] = [], 
    page: number = 1, 
    pageSize: number = 50
  ): { data: T[]; total: number; page: number; pageSize: number; totalPages: number } {
    // 총 개수 조회
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = this.selectOne<{ total: number }>(countSql, params);
    const total = countResult?.total || 0;

    // 페이징된 데이터 조회
    const offset = (page - 1) * pageSize;
    const paginatedSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
    const data = this.selectAll<T>(paginatedSql, params);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 데이터베이스 백업
   */
  async backup(): Promise<Uint8Array> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // SQLite 데이터베이스를 바이너리로 추출
    return this.db.export();
  }

  /**
   * 데이터베이스 복원
   */
  async restore(backupData: Uint8Array): Promise<void> {
    if (!this.sqlite3) {
      throw new Error('SQLite not initialized');
    }

    // 기존 데이터베이스 닫기
    this.close();

    // 새 데이터베이스 생성하고 백업 데이터 로드
    const dbPath = getStoragePath(`${this.config.dbName}_restored`, this.config);
    this.db = new this.sqlite3.oo1.DB();
    this.db.deserialize(backupData);

    this.log('Database restored from backup');
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics() {
    return this.performanceMonitor?.getMetrics();
  }

  /**
   * 데이터베이스 통계 조회
   */
  getStats() {
    if (!this.db) return {};
    return getDatabaseStats(this.db);
  }

  /**
   * 연결 종료
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.log('Database connection closed');
    }
  }

  /**
   * 로깅 유틸리티
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[SQLiteAdapter] ${message}`, ...args);
    }
  }

  /**
   * 건강 상태 확인
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string; stats?: any }> {
    try {
      if (!this.db) {
        return { status: 'error', message: 'Database not initialized' };
      }

      // 간단한 쿼리 실행으로 연결 상태 확인
      this.query('SELECT 1');
      
      const stats = this.getStats();
      return { status: 'ok', stats };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

/**
 * 싱글톤 SQLite 어댑터 인스턴스
 */
let sqliteInstance: SQLiteAdapter | null = null;

/**
 * SQLite 어댑터 싱글톤 인스턴스 조회
 */
export const getSQLiteAdapter = (): SQLiteAdapter => {
  if (!sqliteInstance) {
    sqliteInstance = new SQLiteAdapter();
  }
  return sqliteInstance;
};

/**
 * SQLite 어댑터 초기화 (앱 시작 시 호출)
 */
export const initializeSQLite = async (config?: Partial<SQLiteConfig>): Promise<SQLiteAdapter> => {
  if (!sqliteInstance) {
    sqliteInstance = new SQLiteAdapter('cotdb', config);
  }
  
  await sqliteInstance.initialize();
  return sqliteInstance;
};
