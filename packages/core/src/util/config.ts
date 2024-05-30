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
import { NoOpLogger } from './logger';

/**
 * Global configuration for maxGraph.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Configuration
 */
export const GlobalConfig = {
  /**
   * Configure the logger to use for all log messages.
   *
   * Available implementations provided by maxGraph are:
   * * {@link ConsoleLogger} - Directs logs to the browser console.
   * * {@link NoOpLogger} - Default implementation that does nothing.
   * * {@link MaxLogAsLogger} - Directs logs to {@link MaxLog}.
   *
   * To change the logger, set this property to an instance of the desired logger:
   * ```js
   * // To direct logs to the browser console
   * GlobalConfig.logger = new ConsoleLogger();
   * // To direct logs to MaxLog
   * GlobalConfig.logger = new MaxLogAsLogger();
   * ```
   *
   * @default `NoOpLogger`
   */
  logger: new NoOpLogger() as Logger,
};
