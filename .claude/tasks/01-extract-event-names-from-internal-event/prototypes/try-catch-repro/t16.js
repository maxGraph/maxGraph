import { N } from './names.js';
function g() {
  try {
    globalThis.f(N.A);
  } finally {
    globalThis.done = 1;
  }
}
g();
