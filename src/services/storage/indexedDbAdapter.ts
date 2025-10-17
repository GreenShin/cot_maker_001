import { StorageAdapter, PaginatedResult, QueryOptions, InMemoryStorageAdapter } from './storage';

/**
 * IndexedDB 기반 스토리지 어댑터
 * 대용량 데이터 처리를 위한 브라우저 내장 데이터베이스 활용
 */
export class IndexedDBStorageAdapter<T extends { id: string; createdAt?: string; updatedAt?: string }> 
  implements StorageAdapter<T> {
  
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;
  private version = 2; // 스키마 업데이트로 인한 버전 증가

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
      console.log(`Opening IndexedDB: ${this.dbName} version ${this.version}`);
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log(`IndexedDB opened successfully. Available stores:`, Array.from(this.db.objectStoreNames));
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`IndexedDB upgrade needed from version ${(event as any).oldVersion} to ${this.version}`);
        console.log('Existing stores:', Array.from(db.objectStoreNames));
        
        // 모든 필요한 object store를 한 번에 생성
        const entityConfigs = [
          {
            name: 'users',
            indexes: [
              ['customerSource', 'customerSource', { unique: false }],
              ['ageGroup', 'ageGroup', { unique: false }],
              ['gender', 'gender', { unique: false }]
            ]
          },
          {
            name: 'products', 
            indexes: [
              ['productSource', 'productSource', { unique: false }],
              ['productCategory', 'productCategory', { unique: false }],
              ['riskLevel', 'riskLevel', { unique: false }]
            ]
          },
          {
            name: 'cots',
            indexes: [
              ['productSource', 'productSource', { unique: false }],
              ['questionType', 'questionType', { unique: false }],
              ['status', 'status', { unique: false }],
              ['questioner', 'questioner', { unique: false }]
            ]
          }
        ];

        entityConfigs.forEach(config => {
          if (!db.objectStoreNames.contains(config.name)) {
            console.log(`Creating object store: ${config.name}`);
            const store = db.createObjectStore(config.name, { keyPath: 'id' });
            
            // 공통 인덱스
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            
            // 엔티티별 특화 인덱스
            config.indexes.forEach(([indexName, keyPath, options]) => {
              store.createIndex(indexName as string, keyPath as string, options as IDBIndexParameters);
            });
          } else {
            console.log(`Object store already exists: ${config.name}`);
          }
        });
        
        console.log('IndexedDB upgrade completed. New stores:', Array.from(db.objectStoreNames));
      };
    });
  }

  /**
   * 트랜잭션 헬퍼
   */
  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.initDB();
    
    // Object store 존재 확인
    if (!db.objectStoreNames.contains(this.storeName)) {
      console.error(`Object store '${this.storeName}' not found. Available stores:`, Array.from(db.objectStoreNames));
      
      // 캐시를 지우고 다시 초기화 시도
      this.db = null;
      const freshDb = await this.initDB();
      
      if (!freshDb.objectStoreNames.contains(this.storeName)) {
        throw new Error(`Object store '${this.storeName}' does not exist. Please refresh the browser.`);
      }
    }
    
    console.log(`Creating transaction for store '${this.storeName}' in mode '${mode}'`);
    const transaction = db.transaction([this.storeName], mode);
    return transaction.objectStore(this.storeName);
  }

  async getAll(): Promise<T[]> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result;
        // CoT 데이터 정규화
        if (this.entityName === 'cots') {
          results = results.map((item: any) => {
            // products 필드가 배열이 아니면 빈 배열로 변환
            if (!Array.isArray(item.products)) {
              console.warn(`CoT ${item.id} has invalid products field:`, item.products, '- normalizing to []');
              item.products = [];
            }
            // questioner 필드가 빈 문자열이면 undefined로 변환
            if (item.questioner === '') {
              console.warn(`CoT ${item.id} has empty questioner field - normalizing to undefined`);
              item.questioner = undefined;
            }
            return item;
          });
        }
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getById(id: string): Promise<T | null> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        // CoT 데이터 정규화
        if (result && this.entityName === 'cots') {
          // products 필드가 배열이 아니면 빈 배열로 변환
          if (!Array.isArray(result.products)) {
            console.warn(`CoT ${id} has invalid products field:`, result.products, '- normalizing to []');
            result.products = [];
          }
          // questioner 필드가 빈 문자열이면 undefined로 변환
          if (result.questioner === '') {
            console.warn(`CoT ${id} has empty questioner field - normalizing to undefined`);
            result.questioner = undefined;
          }
        }
        resolve(result || null);
      };
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
    console.log(`=== IndexedDB ${this.entityName} update ===`);
    console.log('ID:', id);
    console.log('Partial item:', item);
    
    const existing = await this.getById(id);
    console.log('Existing item:', existing);
    
    if (!existing) {
      const error = `${this.entityName} with id ${id} not found`;
      console.error(error);
      throw new Error(error);
    }

    const updated = {
      ...existing,
      ...item,
      id, // ID는 변경 불가
      updatedAt: new Date().toISOString()
    } as T;

    console.log('Updated item (merged):', updated);

    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => {
        console.log('IndexedDB put successful');
        resolve(updated);
      };
      request.onerror = () => {
        console.error('IndexedDB put failed:', request.error);
        reject(request.error);
      };
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
    if (!primaryKey) {
      return this.getAll();
    }
    const primaryValue = filters[primaryKey];

    return new Promise((resolve, reject) => {
      let request: IDBRequest;

      // 인덱스가 있는 필드면 인덱스 사용
      try {
        const index = store.index(primaryKey);
        request = primaryValue !== undefined ? index.getAll(primaryValue) : store.getAll();
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
    } else if (this.entityName === 'users') {
      // 질문자의 경우 보유상품 리스트의 상품명을 검색 대상에 포함
      const userItem = item as any;
      
      // 기본 사용자 정보 추가
      Object.values(userItem).forEach(value => {
        if (typeof value === 'string') {
          fields.push(value);
        }
      });
      
      // 보유상품의 productName 추가
      if (userItem.ownedProducts && Array.isArray(userItem.ownedProducts)) {
        userItem.ownedProducts.forEach((product: any) => {
          if (product.productName) {
            fields.push(product.productName);
          }
        });
      }
    } else if (this.entityName === 'products') {
      // 상품의 경우 상품명, 설명, 운용사 등을 주요 검색 대상으로 설정
      const productItem = item as any;
      
      // 우선순위 높은 필드들 먼저 추가 (검색 성능 최적화)
      if (productItem.productName) fields.push(productItem.productName);
      if (productItem.description) fields.push(productItem.description);
      if (productItem.managementCompany) fields.push(productItem.managementCompany);
      
      // 나머지 문자열 필드들
      Object.entries(productItem).forEach(([key, value]) => {
        if (typeof value === 'string' && 
            !['productName', 'description', 'managementCompany', 'id', 'createdAt', 'updatedAt'].includes(key)) {
          fields.push(value);
        }
      });
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
  async bulkImport(items: T[], batchSize = 1000, onProgress?: (progress: number) => void): Promise<void> {
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
      
      // 진행률 업데이트
      const progress = Math.round(((i + batchSize) / items.length) * 100);
      console.log(`Bulk import progress: ${progress}% (${Math.min(i + batchSize, items.length)}/${items.length} items)`);
      onProgress?.(Math.min(progress, 100));
    }
    
    onProgress?.(100);
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

  /**
   * 데이터베이스 스키마 강제 업그레이드 (개발/디버깅용)
   */
  static async forceSchemaUpgrade(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Forcing IndexedDB schema upgrade by deleting existing database...');
      const deleteReq = indexedDB.deleteDatabase('cotDatasetDB');
      
      deleteReq.onsuccess = () => {
        console.log('Database deleted successfully. New schema will be created on next access.');
        resolve();
      };
      
      deleteReq.onerror = () => {
        console.error('Failed to delete database:', deleteReq.error);
        reject(deleteReq.error);
      };
      
      deleteReq.onblocked = () => {
        console.warn('Database deletion blocked. Please close all tabs and try again.');
        // 약간 기다린 후 다시 시도
        setTimeout(() => {
          console.log('Retrying database deletion...');
          this.forceSchemaUpgrade().then(resolve).catch(reject);
        }, 1000);
      };
    });
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
      return new InMemoryStorageAdapter<T>(entityName);
    }
  }
}
