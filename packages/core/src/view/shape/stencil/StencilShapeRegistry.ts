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

import type StencilShape from './StencilShape.js';
import { BaseRegistry } from '../../../internal/BaseRegistry.js';
import type { Registry } from '../../../types.js';

/**
 * A registry that stores the {@link StencilShape}s and their configuration.
 *
 * Here is an example showing how to add stencils:
 * ```javascript
 * const response = requestUtils.load('test/stencils.xml');
 * const root = response.getDocumentElement(); // <shapes> node
 * let shape = root.firstChild;
 *
 * while (shape) {
 *   if (shape.nodeType === constants.NODE_TYPE.ELEMENT) {
 *    StencilShapeRegistry.add(shape.getAttribute('name'), new StencilShape(shape));
 *  }
 *
 *  shape = shape.nextSibling;
 * }
 *
 * The XSD for the stencil description is available in the `stencils.xsd` file.
 * ```
 *
 * @category Configuration
 * @category Shape
 */
export const StencilShapeRegistry: Registry<StencilShape> = new BaseRegistry();
