/*
Copyright 2025-present The maxGraph project Contributors

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

export { EdgeStyle } from './edge';

/**
 * Provides various perimeter functions to be used in a style as the value of {@link CellStateStyle.perimeter}.
 *
 * @category Perimeter
 */
export * as Perimeter from './perimeter';

/**
 * Includes all builtins edge markers which can be registered in {@link MarkerShape}.
 *
 * They are registered by default when instantiating {@link Graph} or they can all be registered by calling {@link registerDefaultEdgeMarkers}.
 *
 * @since 0.18.0
 * @category Style
 */
export * as EdgeMarker from './marker/edge-markers';
