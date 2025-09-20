import { StorageAdapter, PaginatedResult, QueryOptions } from './storage';

/**
 * IndexedDB 기반 스토리지 어댑터
 * 대용량 데이터 처리를 위한 브라우저 내장 데이터베이스 활용
 */
export class IndexedDBStorageAdapter<T extends { id: string; createdAt?: string; updatedAt?: string }> 
  implements StorageAdapter<T> {
  
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;
  private version = 1;

  constructor(private entityName: string) {
    this.dbName = 'cotDatasetDB';
    this.storeName = entityName;
  }

  /**
   * 데이터베이스 초기화
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 스토어가 없으면 생성
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // 인덱스 생성 (검색 성능 향상)
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          
          // 엔티티별 특화 인덱스
          if (this.entityName === 'users') {
            store.createIndex('customerSource', 'customerSource', { unique: false });
            store.createIndex('ageGroup', 'ageGroup', { unique: false });
            store.createIndex('gender', 'gender', { unique: false });
          } else if (this.entityName === 'products') {
            store.createIndex('productSource', 'productSource', { unique: false });
            store.createIndex('productCategory', 'productCategory', { unique: false });
            store.createIndex('riskLevel', 'riskLevel', { unique: false });
          } else if (this.entityName === 'cots') {
            store.createIndex('productSource', 'productSource', { unique: false });
            store.createIndex('questionType', 'questionType', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('questioner', 'questioner', { unique: false });
          }
        }
      };
    });
  }

  /**
   * 트랜잭션 헬퍼
   */
  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], mode);
    return transaction.objectStore(this.storeName);
  }

  async getAll(): Promise<T[]> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(id: string): Promise<T | null> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = `${this.entityName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now
    } as T;

    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(newItem);
      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`${this.entityName} with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...item,
      id, // ID는 변경 불가
      updatedAt: new Date().toISOString()
    } as T;

    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<boolean> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async query(filters: Record<string, any>): Promise<T[]> {
    const store = await this.getStore();
    const results: T[] = [];

    // 인덱스를 활용한 효율적 쿼리
    const filterKeys = Object.keys(filters).filter(key => 
      filters[key] !== undefined && filters[key] !== null && filters[key] !== ''
    );

    if (filterKeys.length === 0) {
      return this.getAll();
    }

    // 첫 번째 필터로 초기 결과 집합 구성
    const primaryKey = filterKeys[0];
    const primaryValue = filters[primaryKey];

    return new Promise((resolve, reject) => {
      let request: IDBRequest;

      // 인덱스가 있는 필드면 인덱스 사용
      try {
        const index = store.index(primaryKey);
        request = index.getAll(primaryValue);
      } catch {
        // 인덱스가 없으면 전체 스캔
        request = store.getAll();
      }

      request.onsuccess = () => {
        let items: T[] = request.result;

        // 나머지 필터 적용
        items = items.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              return true;
            }
            
            const itemValue = (item as any)[key];
            
            // 배열 필드 처리
            if (Array.isArray(itemValue)) {
              return Array.isArray(value) 
                ? value.some(v => itemValue.includes(v))
                : itemValue.includes(value);
            }
            
            // 문자열 부분 일치
            if (typeof itemValue === 'string' && typeof value === 'string') {
              return itemValue.toLowerCase().includes(value.toLowerCase());
            }
            
            return itemValue === value;
          });
        });

        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async count(filters?: Record<string, any>): Promise<number> {
    if (!filters || Object.keys(filters).length === 0) {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    const filtered = await this.query(filters);
    return filtered.length;
  }

  /**
   * 고성능 페이징 쿼리
   */
  async getPaginated(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      pageSize = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      search = '',
      filters = {}
    } = options;

    // 필터 적용
    let items = await this.query(filters);

    // 텍스트 검색 (CoT의 경우 question, cot1~n, answer 검색)
    if (search) {
      items = items.filter(item => {
        const searchableFields = this.getSearchableFields(item);
        const searchableText = searchableFields.join(' ').toLowerCase();
        return searchableText.includes(search.toLowerCase());
      });
    }

    // 정렬
    items.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 페이징
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

  /**
   * 엔티티별 검색 가능한 필드 추출
   */
  private getSearchableFields(item: T): string[] {
    const fields: string[] = [];
    
    if (this.entityName === 'cots') {
      const cotItem = item as any;
      fields.push(
        cotItem.question || '',
        cotItem.cot1 || '',
        cotItem.cot2 || '',
        cotItem.cot3 || '',
        cotItem.answer || ''
      );
      
      // 동적 CoT 필드 추가
      let index = 4;
      while (cotItem[`cot${index}`]) {
        fields.push(cotItem[`cot${index}`]);
        index++;
      }
    } else {
      // 다른 엔티티는 모든 문자열 필드 검색
      Object.values(item).forEach(value => {
        if (typeof value === 'string') {
          fields.push(value);
        }
      });
    }
    
    return fields;
  }

  /**
   * 대량 데이터 Import (배치 처리)
   */
  async bulkImport(items: T[], batchSize = 1000): Promise<void> {
    const store = await this.getStore('readwrite');
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(item => new Promise<void>((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }))
      );
      
      // 진행률 표시 (선택적)
      console.log(`Imported ${Math.min(i + batchSize, items.length)}/${items.length} items`);
    }
  }

  /**
   * 데이터베이스 초기화
   */
  async clear(): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 데이터베이스 크기 정보
   */
  async getStorageInfo(): Promise<{ count: number; estimatedSize: number }> {
    const count = await this.count();
    
    // 대략적인 크기 추정 (실제 크기는 navigator.storage.estimate() 사용)
    const estimatedSize = count * 1024; // 항목당 평균 1KB 가정
    
    return { count, estimatedSize };
  }
}

/**
 * 스토리지 팩토리 - 환경에 따라 적절한 어댑터 선택
 */
export class StorageFactory {
  static create<T extends { id: string; createdAt?: string; updatedAt?: string }>(
    entityName: string,
    useIndexedDB = true
  ): StorageAdapter<T> {
    if (useIndexedDB && typeof indexedDB !== 'undefined') {
      return new IndexedDBStorageAdapter<T>(entityName);
    } else {
      // IndexedDB를 사용할 수 없는 환경에서는 InMemory 사용
      const { InMemoryStorageAdapter } = require('./storage');
      return new InMemoryStorageAdapter<T>(entityName);
    }
  }
}
