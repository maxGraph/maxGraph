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

import type { EdgeHandlerFactory, EdgeStyleHandlerKind } from '../../types.js';
import EdgeHandler from './EdgeHandler.js';
import EdgeSegmentHandler from './EdgeSegmentHandler.js';
import ElbowEdgeHandler from './ElbowEdgeHandler.js';

/**
 * Returns a factory for each builtin {@link EdgeStyleHandlerKind}: {@link EdgeHandler} for `'default'`,
 * {@link ElbowEdgeHandler} for `'elbow'` and {@link EdgeSegmentHandler} for `'segment'`.
 *
 * The function returns a new object each time it is called.
 *
 * Use it to configure {@link SelectionCellsHandler} with all the builtin edge handlers at once, instead of declaring
 * them one by one with {@link SelectionCellsHandler.setEdgeHandlerFactory}.
 *
 * Calling it defeats tree-shaking: {@link ElbowEdgeHandler} and {@link EdgeSegmentHandler} end up in the application
 * bundle, whether the application registers edge styles using them or not. Prefer declaring only the handler kinds
 * matching the edge styles the application registers. See the tree-shaking documentation for guidance.
 *
 * @category Configuration
 * @category Plugin
 * @since 0.25.0
 */
export const getDefaultEdgeHandlerFactories = (): Partial<
  Record<EdgeStyleHandlerKind, EdgeHandlerFactory>
> => ({
  default: (state) => new EdgeHandler(state),
  elbow: (state) => new ElbowEdgeHandler(state),
  segment: (state) => new EdgeSegmentHandler(state),
});
