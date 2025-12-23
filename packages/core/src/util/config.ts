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

import type { I18nProvider, Logger } from '../types.js';
import { NoOpLogger } from './logger.js';
import {
  ARROW_SIZE,
  ARROW_SPACING,
  ARROW_WIDTH,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_IMAGESIZE,
  DEFAULT_MARKERSIZE,
  DEFAULT_STARTSIZE,
  LINE_ARCSIZE,
  RECTANGLE_ROUNDING_FACTOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
  SHADOWCOLOR,
} from './Constants.js';
import { shallowCopy } from '../internal/clone-utils.js';
import { NoOpI18n } from '../i18n/provider.js';

/**
 * Global configuration for maxGraph.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Configuration
 */
export const GlobalConfig = {
  /**
   * Configure the {@link I18nProvider} to use for all translated messages.
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

const defaultGlobalConfig = { ...GlobalConfig };
/**
 * Resets {@link GlobalConfig} to default values, restoring the original {@link NoOpI18n} and {@link NoOpLogger} instances.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.23.0
 * @category Configuration
 */
export const resetGlobalConfig = (): void => {
  shallowCopy(defaultGlobalConfig, GlobalConfig);
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
   * Defines the size (in px) of the arrowhead in the arrow shape.
   * @default {@link ARROW_SIZE}
   * @since 0.22.0
   */
  arrowSize: ARROW_SIZE,
  /**
   * Defines the spacing (in px) between the arrow shape and its terminals.
   * @default {@link ARROW_SPACING}
   * @since 0.22.0
   */
  arrowSpacing: ARROW_SPACING,
  /**
   * Defines the width (in px) of the arrow shape.
   * @default {@link ARROW_WIDTH}
   * @since 0.22.0
   */
  arrowWidth: ARROW_WIDTH,
  /**
   * Defines the default family for all fonts.
   * @default {@link DEFAULT_FONTFAMILY}
   * @since 0.22.0
   */
  fontFamily: DEFAULT_FONTFAMILY,
  /**
   * Defines the default size (in px).
   * @default {@link DEFAULT_FONTSIZE}
   * @since 0.22.0
   */
  fontSize: DEFAULT_FONTSIZE,
  /**
   * Defines the default width and height (in px) for images used in the label shape.
   * @default {@link DEFAULT_IMAGESIZE}
   * @since 0.22.0
   */
  imageSize: DEFAULT_IMAGESIZE,
  /**
   * Defines the default size (in px) of the arcs for the rounded edges.
   * See {@link CellStateStyle.arcSize}.
   * @default {@link LINE_ARCSIZE}
   * @since 0.22.0
   */
  lineArcSize: LINE_ARCSIZE,
  /**
   * Defines the default size (in px) for all markers.
   * @default {@link DEFAULT_MARKERSIZE}
   * @since 0.22.0
   */
  markerSize: DEFAULT_MARKERSIZE,
  /**
   * Defines the default rounding factor for the rounded vertices in percent between `0` and `1`.
   * Values should be smaller than `0.5`.
   * See {@link CellStateStyle.arcSize}.
   * @default {@link RECTANGLE_ROUNDING_FACTOR}
   * @since 0.22.0
   */
  roundingFactor: RECTANGLE_ROUNDING_FACTOR,
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
  /**
   * Defines the default start size (in px) for swimlanes.
   * @default {@link DEFAULT_STARTSIZE}
   * @since 0.22.0
   */
  startSize: DEFAULT_STARTSIZE,
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
