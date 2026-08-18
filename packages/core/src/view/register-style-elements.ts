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

import { registerDefaultShapes } from './shape/register-shapes.js';
import {
  registerDefaultEdgeMarkers,
  registerDefaultEdgeStyles,
  registerDefaultPerimeters,
} from './style/register.js';

/**
 * Register all default builtin style elements provided by `maxGraph`, by calling:
 * - {@link registerDefaultEdgeMarkers}
 * - {@link registerDefaultEdgeStyles}
 * - {@link registerDefaultPerimeters}
 * - {@link registerDefaultShapes}
 *
 * This is exactly what {@link Graph} registers when it is instantiated. {@link BaseGraph} registers nothing, so this
 * function is the way to get all builtins at once without subclassing it.
 *
 * Registering everything defeats tree-shaking: all builtin shapes, edge styles, perimeters and edge markers end up in
 * the application bundle, whether they are used or not. Prefer registering only the elements used by the application.
 * See the tree-shaking documentation for guidance.
 *
 * @category Configuration
 * @category Style
 * @since 0.25.0
 */
export const registerDefaultStyleElements = (): void => {
  registerDefaultEdgeMarkers();
  registerDefaultEdgeStyles();
  registerDefaultPerimeters();
  registerDefaultShapes();
};
