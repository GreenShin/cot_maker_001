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
