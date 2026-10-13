/*
Copyright 2026-present The maxGraph project Contributors

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

import { GUIDE_COLOR, GUIDE_STROKEWIDTH } from '../../util/Constants.js';
import { shallowCopy } from '../../internal/clone-utils.js';

/**
 * Global configuration for {@link Guide}.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.26.0
 * @category Configuration
 */
export const GuideConfig = {
  /**
   * Defines the color to be used for the guidelines.
   * @default {@link GUIDE_COLOR}
   */
  color: GUIDE_COLOR,

  /**
   * Defines if the guidelines are dashed.
   * @default true
   */
  dashed: true,

  /**
   * Defines the stroke width to be used for the guidelines.
   * @default {@link GUIDE_STROKEWIDTH}
   */
  strokeWidth: GUIDE_STROKEWIDTH,
};

const defaultGuideConfig = { ...GuideConfig };
/**
 * Resets {@link GuideConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.26.0
 * @category Configuration
 */
export const resetGuideConfig = (): void => {
  shallowCopy(defaultGuideConfig, GuideConfig);
};
