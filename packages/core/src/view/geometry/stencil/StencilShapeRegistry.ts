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

import StencilShape from './StencilShape';

type Stencils = {
  [k: string]: StencilShape;
};

/**
 * A singleton class that provides a registry for stencils and the methods for painting those stencils onto a canvas or into a DOM.
 *
 * Here is an example showing how to add stencils:
 * ```javascript
 * const response = requestUtils.load('test/stencils.xml');
 * const root = response.getDocumentElement(); // <shapes> node
 * let shape = root.firstChild;
 *
 * while (shape) {
 *   if (shape.nodeType === constants.NODE_TYPE.ELEMENT) {
 *    StencilShapeRegistry.addStencil(shape.getAttribute('name'), new StencilShape(shape));
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
class StencilShapeRegistry {
  static stencils: Stencils = {};

  /**
   * Adds the given {@link StencilShape}.
   */
  static addStencil(name: string, stencil: StencilShape): void {
    StencilShapeRegistry.stencils[name] = stencil;
  }

  /**
   * Returns the {@link StencilShape} for the given name.
   */
  static getStencil(name?: string | null): StencilShape | undefined {
    // Tests are validating that using the non-null assertion (!) is safe
    return StencilShapeRegistry.stencils[name!];
  }
}

export default StencilShapeRegistry;
