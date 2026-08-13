import '@testing-library/jest-dom';

// Polyfill crypto.randomUUID for jsdom
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {
    randomUUID: () => Math.random().toString(36).slice(2),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  } as unknown as Crypto;
}

// Silence Next.js warnings in test env
(process.env as Record<string, string>).NODE_ENV = 'test';
