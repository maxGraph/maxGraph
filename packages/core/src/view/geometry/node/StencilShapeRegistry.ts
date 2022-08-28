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
 * A singleton class that provides a registry for stencils and the methods
 * for painting those stencils onto a canvas or into a DOM.
 *
 * Code to add stencils:
 * ```javascript
 * let req = mxUtils.load('test/stencils.xml');
 * let root = req.getDocumentElement();
 * let shape = root.firstChild;
 *
 * while (shape != null)
 * {
 *   if (shape.nodeType === mxConstants.NODETYPE_ELEMENT)
 *  {
 *    mxStencilRegistry.addStencil(shape.getAttribute('name'), new mxStencil(shape));
 *  }
 *
 *  shape = shape.nextSibling;
 * }
 * ```
 * @class StencilShapeRegistry
 */
class StencilShapeRegistry {
  static stencils: Stencils = {};

  /**
   * Adds the given {@link Stencil}.
   * @static
   * @param {string} name
   * @param {StencilShape} stencil
   */
  static addStencil(name: string, stencil: StencilShape) {
    StencilShapeRegistry.stencils[name] = stencil;
  }

  /**
   * Returns the {@link Stencil} for the given name.
   * @static
   * @param {string} name
   * @returns {StencilShape}
   */
  static getStencil(name: string) {
    return StencilShapeRegistry.stencils[name];
  }
}

export default StencilShapeRegistry;
