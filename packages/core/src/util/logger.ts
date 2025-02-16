/*
Copyright 2024-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import type { Logger } from '../types';

/**
 * If `baseTimestamp` is provided and not zero, returns a message describing the elapsed milliseconds since this value.
 * Otherwise, returns an empty string.
 * @param baseTimestamp the base timestamp to compute the elapsed milliseconds from
 *
 * @private not part of the public API, can be removed or changed without prior notice
 */
export const getElapseMillisecondsMessage = (baseTimestamp?: number): string =>
  baseTimestamp ? ` (${new Date().getTime() - baseTimestamp} ms)` : '';

/**
 * A {@link Logger} that does nothing.
 *
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Logging
 */
export class NoOpLogger implements Logger {
  debug(_message: string): void {}

  enter(_message: string): number | undefined {
    return undefined;
  }

  error(_message: string, ..._optionalParams: any[]): void {}

  info(_message: string): void {}

  leave(_message: string, _baseTimestamp?: number): void {}

  show(): void {}

  trace(_message: string): void {}

  warn(_message: string): void {}
}

/**
 * A {@link Logger} that directs logs to the browser console.
 *
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Logging
 */
export class ConsoleLogger implements Logger {
  debugEnabled = false;
  infoEnabled = false;
  traceEnabled = false;

  /* eslint-disable no-console -- we must use "console" to direct logs to the browser console */

  enter(message: string): number | undefined {
    if (this.traceEnabled) {
      console.trace(`Entering ${message}`);
      return new Date().getTime();
    }
  }

  leave(message: string, baseTimestamp?: number): void {
    if (this.traceEnabled) {
      const dt = getElapseMillisecondsMessage(baseTimestamp);
      console.trace(`Leaving ${message}${dt}`);
    }
  }

  show(): void {}

  trace(message: string): void {
    if (this.traceEnabled) {
      console.trace(message);
    }
  }

  debug(message: string): void {
    if (this.debugEnabled) {
      console.debug(message);
    }
  }

  info(message: string): void {
    if (this.infoEnabled) {
      console.info(message);
    }
  }

  warn(message: string): void {
    console.warn(message);
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
}
/* eslint-enable no-console */
