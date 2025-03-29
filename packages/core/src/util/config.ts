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

import type { I18nProvider, Logger } from '../types';
import { NoOpLogger } from './logger';
import {
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
  SHADOWCOLOR,
} from './Constants';
import { shallowCopy } from '../internal/clone-utils';
import { NoOpI18n } from '../i18n/provider';

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
   * * {@link NoOpI18n} - Default implementation that does nothing.
   * * {@link TranslationsAsI18n} - Uses {@link Translations} to manage translations.
   *
   * To change the i18n provider, set this property to an instance of the desired provider:
   * ```js
   * // To use the i18n system provided by maxGraph
   * GlobalConfig.i18n = new TranslationsAsI18n();
   * ```
   *
   * @default {@link NoOpI18n}
   * @since 0.17.0
   */
  i18n: new NoOpI18n() as I18nProvider,

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
   * @default {@link NoOpLogger}
   */
  logger: new NoOpLogger() as Logger,
};

/**
 * Configure style defaults for maxGraph.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const StyleDefaultsConfig = {
  /**
   * Defines the color to be used to draw shadows in shapes and windows.
   * @default {@link SHADOWCOLOR}
   */
  shadowColor: SHADOWCOLOR,
  /**
   * Specifies the x-offset of the shadow.
   * @default {@link SHADOW_OFFSET_X}
   */
  shadowOffsetX: SHADOW_OFFSET_X,
  /**
   * Specifies the y-offset of the shadow.
   * @default {@link SHADOW_OFFSET_Y}
   */
  shadowOffsetY: SHADOW_OFFSET_Y,
  /**
   * Defines the opacity for shadow. Possible values are between 1 (opaque) and 0 (transparent).
   * @default {@link SHADOW_OPACITY}
   */
  shadowOpacity: SHADOW_OPACITY,
};

const defaultStyleDefaultsConfig = { ...StyleDefaultsConfig };
/**
 * Resets {@link StyleDefaultsConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const resetStyleDefaultsConfig = (): void => {
  shallowCopy(defaultStyleDefaultsConfig, StyleDefaultsConfig);
};
