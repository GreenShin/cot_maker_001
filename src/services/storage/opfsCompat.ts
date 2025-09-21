/**
 * OPFS (Origin Private File System) 호환성 및 폴백 처리
 * SQLite-WASM과 함께 사용하여 브라우저별 최적의 저장소 전략 제공
 */

/**
 * OPFS 지원 상태
 */
export interface OPFSSupport {
  supported: boolean;
  reason?: string;
  fallbackStorage: 'indexeddb' | 'memory';
}

/**
 * 브라우저 호환성 정보
 */
export interface BrowserCompat {
  name: string;
  version: string;
  engine: string;
  opfsSupported: boolean;
  sqliteWasmSupported: boolean;
  recommendedStorage: 'opfs' | 'indexeddb' | 'memory';
}

/**
 * OPFS 지원 여부 확인
 */
export const checkOPFSSupport = (): OPFSSupport => {
  // OPFS API 존재 여부 확인
  if (!('storage' in navigator)) {
    return {
      supported: false,
      reason: 'Navigator.storage API not available',
      fallbackStorage: 'indexeddb'
    };
  }

  if (!('getDirectory' in navigator.storage)) {
    return {
      supported: false,
      reason: 'Navigator.storage.getDirectory not available',
      fallbackStorage: 'indexeddb'
    };
  }

  // SharedArrayBuffer 지원 여부 (SQLite-WASM 멀티스레딩용)
  if (!('SharedArrayBuffer' in window)) {
    console.warn('SharedArrayBuffer not available - SQLite-WASM will run in single-thread mode');
  }

  // OPFS에 쓰기 가능 여부 테스트
  try {
    // 비동기 테스트는 별도 함수로 분리
    return {
      supported: true,
      fallbackStorage: 'indexeddb'
    };
  } catch (error) {
    return {
      supported: false,
      reason: `OPFS test failed: ${error}`,
      fallbackStorage: 'indexeddb'
    };
  }
};

/**
 * OPFS 비동기 테스트
 */
export const testOPFSWriteAccess = async (): Promise<boolean> => {
  try {
    const opfsRoot = await navigator.storage.getDirectory();
    const testFile = await opfsRoot.getFileHandle('opfs-test.tmp', { create: true });
    const writable = await testFile.createWritable();
    
    await writable.write('test');
    await writable.close();
    
    // 테스트 파일 정리
    await opfsRoot.removeEntry('opfs-test.tmp');
    
    return true;
  } catch (error) {
    console.warn('OPFS write test failed:', error);
    return false;
  }
};

/**
 * 브라우저 호환성 감지
 */
export const detectBrowserCompat = (): BrowserCompat => {
  const ua = navigator.userAgent;
  const opfsSupport = checkOPFSSupport();
  
  // Chrome/Chromium 계열
  if (ua.includes('Chrome')) {
    const version = ua.match(/Chrome\/(\d+)/)?.[1] || '0';
    const versionNum = parseInt(version);
    
    return {
      name: 'Chrome',
      version,
      engine: 'Blink',
      opfsSupported: versionNum >= 102, // OPFS 지원 시작 버전
      sqliteWasmSupported: versionNum >= 87, // WebAssembly 안정 지원
      recommendedStorage: versionNum >= 102 && opfsSupport.supported ? 'opfs' : 'indexeddb'
    };
  }
  
  // Edge 계열
  if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/(\d+)/)?.[1] || '0';
    const versionNum = parseInt(version);
    
    return {
      name: 'Edge',
      version,
      engine: 'Blink',
      opfsSupported: versionNum >= 102,
      sqliteWasmSupported: versionNum >= 87,
      recommendedStorage: versionNum >= 102 && opfsSupport.supported ? 'opfs' : 'indexeddb'
    };
  }
  
  // Safari 계열
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const version = ua.match(/Version\/(\d+)/)?.[1] || '0';
    const versionNum = parseInt(version);
    
    return {
      name: 'Safari',
      version,
      engine: 'WebKit',
      opfsSupported: versionNum >= 16, // Safari 16에서 OPFS 지원 시작
      sqliteWasmSupported: versionNum >= 14, // WebAssembly 안정 지원
      recommendedStorage: versionNum >= 16 && opfsSupport.supported ? 'opfs' : 'indexeddb'
    };
  }
  
  // Firefox 계열
  if (ua.includes('Firefox')) {
    const version = ua.match(/Firefox\/(\d+)/)?.[1] || '0';
    const versionNum = parseInt(version);
    
    return {
      name: 'Firefox',
      version,
      engine: 'Gecko',
      opfsSupported: versionNum >= 111, // Firefox 111에서 OPFS 지원 시작
      sqliteWasmSupported: versionNum >= 79, // WebAssembly 안정 지원
      recommendedStorage: versionNum >= 111 && opfsSupport.supported ? 'opfs' : 'indexeddb'
    };
  }
  
  // 기타 브라우저
  return {
    name: 'Unknown',
    version: '0',
    engine: 'Unknown',
    opfsSupported: false,
    sqliteWasmSupported: false,
    recommendedStorage: 'memory' // 안전한 폴백
  };
};

/**
 * 저장소 설정 최적화
 */
export interface StorageConfig {
  type: 'opfs' | 'indexeddb' | 'memory';
  maxDatabaseSize: number; // MB 단위
  pageSize: number; // SQLite 페이지 크기
  cacheSize: number; // 캐시 페이지 수
  enableWAL: boolean; // WAL 모드 활성화
  enableFTS: boolean; // FTS 전체 텍스트 검색 활성화
}

/**
 * 브라우저별 최적 저장소 설정 반환
 */
export const getOptimalStorageConfig = (): StorageConfig => {
  const compat = detectBrowserCompat();
  const opfsSupport = checkOPFSSupport();
  
  // OPFS 지원 시 최고 성능 설정
  if (compat.recommendedStorage === 'opfs' && opfsSupport.supported) {
    return {
      type: 'opfs',
      maxDatabaseSize: 1024, // 1GB - OPFS는 대용량 지원
      pageSize: 16384, // 16KB - OPFS 최적화
      cacheSize: 2048, // 32MB 캐시
      enableWAL: true, // 동시성 지원
      enableFTS: true // 전체 텍스트 검색 활성화
    };
  }
  
  // IndexedDB 폴백 설정
  if (compat.recommendedStorage === 'indexeddb') {
    return {
      type: 'indexeddb',
      maxDatabaseSize: 512, // 512MB - IndexedDB 제한 고려
      pageSize: 8192, // 8KB - IndexedDB 최적화
      cacheSize: 1024, // 8MB 캐시
      enableWAL: false, // IndexedDB에서는 WAL 사용 안함
      enableFTS: true // 전체 텍스트 검색 유지
    };
  }
  
  // 메모리 폴백 설정 (최악의 경우)
  return {
    type: 'memory',
    maxDatabaseSize: 128, // 128MB - 메모리 제한
    pageSize: 4096, // 4KB - 메모리 절약
    cacheSize: 256, // 1MB 캐시
    enableWAL: false,
    enableFTS: false // 메모리 절약을 위해 FTS 비활성화
  };
};

/**
 * 저장소 경로 생성
 */
export const getStoragePath = (dbName: string, config: StorageConfig): string => {
  switch (config.type) {
    case 'opfs':
      return `/opfs/${dbName}.sqlite3`;
    case 'indexeddb':
      return `/indexeddb/${dbName}`;
    case 'memory':
      return `:memory:`;
    default:
      throw new Error(`Unsupported storage type: ${config.type}`);
  }
};

/**
 * 브라우저 경고 메시지 생성
 */
export const getBrowserWarning = (): string | null => {
  const compat = detectBrowserCompat();
  
  if (!compat.sqliteWasmSupported) {
    return `현재 브라우저(${compat.name} ${compat.version})는 WebAssembly를 완전히 지원하지 않아 성능에 제한이 있을 수 있습니다. Chrome 87+ 또는 Safari 14+ 사용을 권장합니다.`;
  }
  
  if (!compat.opfsSupported && compat.recommendedStorage !== 'opfs') {
    return `현재 브라우저는 OPFS를 지원하지 않아 IndexedDB를 사용합니다. 최적의 성능을 위해 Chrome 102+ 또는 Safari 16+ 사용을 권장합니다.`;
  }
  
  return null;
};

/**
 * 성능 모니터링 및 권장사항
 */
export interface PerformanceMetrics {
  storageType: string;
  avgQueryTime: number;
  totalQueries: number;
  errorCount: number;
  recommendations: string[];
}

export class StoragePerformanceMonitor {
  private metrics: PerformanceMetrics;
  private queryTimes: number[] = [];
  
  constructor(storageType: string) {
    this.metrics = {
      storageType,
      avgQueryTime: 0,
      totalQueries: 0,
      errorCount: 0,
      recommendations: []
    };
  }
  
  recordQuery(executionTime: number): void {
    this.queryTimes.push(executionTime);
    this.metrics.totalQueries++;
    this.metrics.avgQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    
    // 최근 100개 쿼리만 유지
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
  }
  
  recordError(): void {
    this.metrics.errorCount++;
  }
  
  getMetrics(): PerformanceMetrics {
    this.updateRecommendations();
    return { ...this.metrics };
  }
  
  private updateRecommendations(): void {
    this.metrics.recommendations = [];
    
    // 평균 쿼리 시간이 느린 경우
    if (this.metrics.avgQueryTime > 100) {
      this.metrics.recommendations.push('쿼리 성능이 느립니다. 인덱스 최적화를 검토해주세요.');
    }
    
    // 에러율이 높은 경우
    if (this.metrics.errorCount > this.metrics.totalQueries * 0.1) {
      this.metrics.recommendations.push('에러율이 높습니다. 브라우저 호환성을 확인해주세요.');
    }
    
    // 메모리 저장소 사용 시
    if (this.metrics.storageType === 'memory') {
      this.metrics.recommendations.push('메모리 저장소를 사용 중입니다. 페이지 새로고침 시 데이터가 손실됩니다.');
    }
  }
  
  reset(): void {
    this.queryTimes = [];
    this.metrics.totalQueries = 0;
    this.metrics.errorCount = 0;
    this.metrics.avgQueryTime = 0;
    this.metrics.recommendations = [];
  }
}
