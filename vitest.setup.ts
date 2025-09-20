import '@testing-library/jest-dom';

// jsdom에서 window.confirm 모킹 (항상 오버라이드)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).confirm = () => true;


