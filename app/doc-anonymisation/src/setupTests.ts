import '@testing-library/jest-dom';

// Polyfill for TextEncoder - this is needed for Integration tests that use MemoryRouter
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}