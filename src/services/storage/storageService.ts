import { StorageAdapter } from './storage';
import { StorageFactory } from './indexedDbAdapter';
import type { UserAnon } from '../../models/userAnon';
import type { Product } from '../../models/product';
import type { CoTQA } from '../../models/cotqa';

/**
 * 통합 스토리지 서비스
 * 대용량 데이터 처리를 위한 최적화된 스토리지 관리
 */
export class StorageService {
  private static instance: StorageService;
  
  public readonly users: StorageAdapter<UserAnon>;
  public readonly products: StorageAdapter<Product>;
  public readonly cots: StorageAdapter<CoTQA>;

  private constructor() {
    // IndexedDB 우선, 지원하지 않으면 InMemory 폴백
    this.users = StorageFactory.create<UserAnon>('users', true);
    this.products = StorageFactory.create<Product>('products', true);
    this.cots = StorageFactory.create<CoTQA>('cots', true);
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * 전체 데이터베이스 상태 확인
   */
  async getDatabaseStatus() {
    const [usersInfo, productsInfo, cotsInfo] = await Promise.all([
      this.getStorageInfo('users'),
      this.getStorageInfo('products'),
      this.getStorageInfo('cots')
    ]);

    const totalCount = usersInfo.count + productsInfo.count + cotsInfo.count;
    const totalSize = usersInfo.estimatedSize + productsInfo.estimatedSize + cotsInfo.estimatedSize;

    return {
      users: usersInfo,
      products: productsInfo,
      cots: cotsInfo,
      total: {
        count: totalCount,
        estimatedSize: totalSize,
        formattedSize: this.formatBytes(totalSize)
      },
      isIndexedDB: this.isUsingIndexedDB()
    };
  }

  /**
   * 개별 스토리지 정보 조회
   */
  private async getStorageInfo(entityType: 'users' | 'products' | 'cots') {
    const adapter = this[entityType];
    
    if ('getStorageInfo' in adapter) {
      return await (adapter as any).getStorageInfo();
    } else {
      // InMemory 어댑터의 경우
      const count = await adapter.count();
      return {
        count,
        estimatedSize: count * 512, // 추정치
      };
    }
  }

  /**
   * IndexedDB 사용 여부 확인
   */
  private isUsingIndexedDB(): boolean {
    return this.users.constructor.name === 'IndexedDBStorageAdapter';
  }

  /**
   * 바이트 크기를 읽기 쉬운 형태로 변환
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 대량 데이터 Import 최적화
   */
  async bulkImport<T>(
    entityType: 'users' | 'products' | 'cots',
    data: T[],
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const adapter = this[entityType];
    
    if ('bulkImport' in adapter) {
      // IndexedDB 어댑터의 배치 처리 사용
      await (adapter as any).bulkImport(data, 1000, onProgress);
    } else {
      // InMemory 어댑터의 경우 개별 처리
      for (let i = 0; i < data.length; i++) {
        await adapter.create(data[i] as any);
        
        if (onProgress && i % 100 === 0) {
          onProgress((i / data.length) * 100);
        }
      }
    }
    
    onProgress?.(100);
  }

  /**
   * 메모리 사용량 최적화를 위한 데이터 정리
   */
  async optimizeStorage(): Promise<void> {
    // IndexedDB의 경우 자동 최적화됨
    if (this.isUsingIndexedDB()) {
      console.log('IndexedDB는 자동으로 최적화됩니다.');
      return;
    }

    // InMemory의 경우 가비지 컬렉션 힌트
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * 전체 데이터베이스 백업
   */
  async exportAllData() {
    const [users, products, cots] = await Promise.all([
      this.users.getAll(),
      this.products.getAll(),
      this.cots.getAll()
    ]);

    return {
      users,
      products,
      cots,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        counts: {
          users: users.length,
          products: products.length,
          cots: cots.length
        }
      }
    };
  }

  /**
   * 전체 데이터베이스 복원
   */
  async importAllData(data: {
    users: UserAnon[];
    products: Product[];
    cots: CoTQA[];
  }, onProgress?: (entity: string, progress: number) => void): Promise<void> {
    // 기존 데이터 정리
    await Promise.all([
      this.clearEntity('users'),
      this.clearEntity('products'),
      this.clearEntity('cots')
    ]);

    // 순차적으로 Import (참조 무결성 보장)
    await this.bulkImport('users', data.users, (progress) => 
      onProgress?.('users', progress)
    );
    
    await this.bulkImport('products', data.products, (progress) => 
      onProgress?.('products', progress)
    );
    
    await this.bulkImport('cots', data.cots, (progress) => 
      onProgress?.('cots', progress)
    );
  }

  /**
   * 개별 엔티티 데이터 정리
   */
  private async clearEntity(entityType: 'users' | 'products' | 'cots'): Promise<void> {
    const adapter = this[entityType];
    
    if ('clear' in adapter) {
      await (adapter as any).clear();
    } else {
      // 개별 삭제로 폴백
      const items = await adapter.getAll();
      await Promise.all(items.map(item => adapter.delete(item.id)));
    }
  }

  /**
   * 브라우저 스토리지 할당량 확인
   */
  async getStorageQuota(): Promise<{
    quota: number;
    usage: number;
    available: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        quota,
        usage,
        available,
        percentage
      };
    }

    // 폴백: 대략적인 추정치
    return {
      quota: 1024 * 1024 * 1024, // 1GB 가정
      usage: 0,
      available: 1024 * 1024 * 1024,
      percentage: 0
    };
  }

  /**
   * 성능 모니터링을 위한 쿼리 시간 측정
   */
  async measureQueryPerformance<T>(
    entityType: 'users' | 'products' | 'cots',
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`${entityType} query took ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }
}

// 싱글톤 인스턴스 export
export const storageService = StorageService.getInstance();

// 개발/디버깅용 전역 유틸리티 함수
if (typeof window !== 'undefined') {
  (window as any).debugStorage = {
    // IndexedDB 스키마 강제 업그레이드
    async resetDatabase() {
      const { IndexedDBStorageAdapter } = await import('./indexedDbAdapter');
      await IndexedDBStorageAdapter.forceSchemaUpgrade();
      console.log('Database reset completed. Please refresh the browser.');
      return 'Database reset completed. Please refresh the browser.';
    },
    
    // 스토리지 상태 확인
    async checkStatus() {
      const status = await storageService.getDatabaseStatus();
      console.table(status);
      return status;
    },
    
    // 질문자 생성 테스트
    async testCreateUser() {
      try {
        const testUser = {
          customerSource: '증권' as const,
          ageGroup: '30대' as const,
          gender: '남' as const,
          investmentAmount: '1000만원 이하' as const,
          investmentTendency: '안정추구형' as const,
          ownedProducts: [
            {
              productName: '테스트상품',
              purchaseDate: '2024-01'
            }
          ]
        };
        
        const created = await storageService.users.create(testUser as any);
        console.log('Test user created successfully:', created);
        return created;
      } catch (error) {
        console.error('Test user creation failed:', error);
        throw error;
      }
    }
  };
  
  console.log('💡 Debug tools available: window.debugStorage');
  console.log('   - resetDatabase(): Force database schema upgrade');  
  console.log('   - checkStatus(): Show storage status');
  console.log('   - testCreateUser(): Test user creation');
}
