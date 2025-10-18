import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // 스택 오버플로우 방지: threads 대신 forks 사용
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        // 각 테스트 파일을 격리된 환경에서 실행
        isolate: true,
      },
    },
    // 테스트 타임아웃 증가
    testTimeout: 10000,
    // 테스트 간 격리 강화
    isolate: true,
    // 워커 간 통신 제한
    maxWorkers: 1,
  },
});


