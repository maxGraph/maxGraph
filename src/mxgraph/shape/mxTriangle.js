/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */

import mxPoint from '../util/mxPoint';
import mxActor from './mxActor';
import mxUtils from '../util/mxUtils';
import mxConstants from '../util/mxConstants';

class mxTriangle extends mxActor {
  /**
   * Class: mxTriangle
   *
   * Implementation of the triangle shape.
   *
   * Constructor: mxTriangle
   *
   * Constructs a new triangle shape.
   */
  constructor() {
    super();
  }

  /**
   * Function: isRoundable
   *
   * Adds roundable support.
   */
  isRoundable() {
    return true;
  }

  /**
   * Function: redrawPath
   *
   * Draws the path for this shape.
   */
  redrawPath(c, x, y, w, h) {
    const arcSize =
      mxUtils.getValue(
        this.style,
        mxConstants.STYLE_ARCSIZE,
        mxConstants.LINE_ARCSIZE
      ) / 2;
    this.addPoints(
      c,
      [new mxPoint(0, 0), new mxPoint(w, 0.5 * h), new mxPoint(0, h)],
      this.isRounded,
      arcSize,
      true
    );
  }
}

export default mxTriangle;