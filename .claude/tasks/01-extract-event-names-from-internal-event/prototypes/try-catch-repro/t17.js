import { N } from './names.js';
function g() {
  try {
    globalThis.f(N.A);
  } catch (e) {}
}
g();
