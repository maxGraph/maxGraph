/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 *
 * Code to add stencils.
 *
 * (code)
 * let req = mxUtils.load('test/stencils.xml');
 * let root = req.getDocumentElement();
 * let shape = root.firstChild;
 *
 * while (shape != null)
 * {
 *    if (shape.nodeType === mxConstants.NODETYPE_ELEMENT)
 *   {
 *     mxStencilRegistry.addStencil(shape.getAttribute('name'), new mxStencil(shape));
 *   }
 *
 *   shape = shape.nextSibling;
 * }
 * (end)
 */

import StencilShape from './StencilShape';

type Stencils = {
  [k: string]: StencilShape;
};

/**
 * A singleton class that provides a registry for stencils and the methods
 * for painting those stencils onto a canvas or into a DOM.
 *
 * @class StencilShapeRegistry
 */
class StencilShapeRegistry {
  static stencils: Stencils = {};

  /**
   * Adds the given <mxStencil>.
   * @static
   * @param {string} name
   * @param {StencilShape} stencil
   */
  static addStencil(name: string, stencil: StencilShape) {
    StencilShapeRegistry.stencils[name] = stencil;
  }

  /**
   * Returns the <mxStencil> for the given name.
   * @static
   * @param {string} name
   * @returns {StencilShape}
   */
  static getStencil(name: string) {
    return StencilShapeRegistry.stencils[name];
  }
}

export default StencilShapeRegistry;
