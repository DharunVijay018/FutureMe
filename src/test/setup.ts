import '@testing-library/jest-dom';

// Polyfills / mocks for browser environment if needed in jsdom
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
