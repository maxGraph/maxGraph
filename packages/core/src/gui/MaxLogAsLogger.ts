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

import { Logger } from '../types';
import MaxLog from './MaxLog';

/**
 * A {@link Logger} that uses {@link MaxLog} to log messages.
 *
 * Notice that the log level for this logger are configured in {@link MaxLog}.
 *
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category GUI
 * @category Logging
 */
export class MaxLogAsLogger implements Logger {
  enter(message: string): number | undefined {
    return MaxLog.enter(message);
  }

  leave(message: string, baseTimestamp?: number): void {
    MaxLog.leave(message, baseTimestamp);
  }

  show(): void {
    MaxLog.show();
  }

  info(message: string): void {
    MaxLog.writeln(message);
  }

  debug(message: string): void {
    MaxLog.debug(message);
  }

  error(message: string, ...optionalParams: any[]): void {
    const args = optionalParams?.map((param) => String(param));
    MaxLog.writeln(`[ERROR] ${message}`, ...args);
  }

  trace(message: string): void {
    MaxLog.trace(message);
  }

  warn(message: string): void {
    MaxLog.warn(message);
  }
}
