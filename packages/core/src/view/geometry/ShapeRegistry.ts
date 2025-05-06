/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import type { Registry, ShapeConstructor } from '../../types';
import { BaseRegistry } from '../../internal/BaseRegistry';

/**
 * A registry that stores the {@link ShapeConstructor}s and their configuration.
 *
 * For adding new shapes you should use {@link ShapeRegistry.add}.
 *
 * Names generally used to register the built-in shapes:
 * - actor
 * - arrow
 * - arrow connector (for edges)
 * - cloud
 * - connector (for edges)
 * - cylinder
 * - double ellipse
 * - ellipse
 * - hexagon
 * - image
 * - label
 * - line (for edges)
 * - rectangle
 * - rhombus
 * - swimlane
 * - triangle
 *
 * @since 0.20.0
 * @category Configuration
 * @category Shape
 */
export const ShapeRegistry: Registry<ShapeConstructor> = new BaseRegistry();
