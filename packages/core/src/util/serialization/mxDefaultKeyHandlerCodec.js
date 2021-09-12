/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxObjectCodec from './mxObjectCodec';
import mxDefaultKeyHandler from '../../editor/mxDefaultKeyHandler';
import mxCodecRegistry from './mxCodecRegistry';

/**
 * Class: mxDefaultKeyHandlerCodec
 *
 * Custom codec for configuring <mxDefaultKeyHandler>s. This class is created
 * and registered dynamically at load time and used implicitly via
 * <mxCodec> and the <mxCodecRegistry>. This codec only reads configuration
 * data for existing key handlers, it does not encode or create key handlers.
 */
class mxDefaultKeyHandlerCodec extends mxObjectCodec {
  constructor() {
    super(new mxDefaultKeyHandler());
  }

  /**
   * Function: encode
   *
   * Returns null.
   */
  encode(enc, obj) {
    return null;
  }

  /**
   * Function: decode
   *
   * Reads a sequence of the following child nodes
   * and attributes:
   *
   * Child Nodes:
   *
   * add - Binds a keystroke to an actionname.
   *
   * Attributes:
   *
   * as - Keycode.
   * action - Actionname to execute in editor.
   * control - Optional boolean indicating if
   *     the control key must be pressed.
   *
   * Example:
   *
   * (code)
   * <mxDefaultKeyHandler as="keyHandler">
   *   <add as="88" control="true" action="cut"/>
   *   <add as="67" control="true" action="copy"/>
   *   <add as="86" control="true" action="paste"/>
   * </mxDefaultKeyHandler>
   * (end)
   *
   * The keycodes are for the x, c and v keys.
   *
   * See also: <mxDefaultKeyHandler.bindAction>,
   * http://www.js-examples.com/page/tutorials__key_codes.html
   */
  decode(dec, node, into) {
    if (into != null) {
      const { editor } = into;
      node = node.firstChild;

      while (node != null) {
        if (!this.processInclude(dec, node, into) && node.nodeName === 'add') {
          const as = node.getAttribute('as');
          const action = node.getAttribute('action');
          const control = node.getAttribute('control');

          into.bindAction(as, action, control);
        }
        node = node.nextSibling;
      }
    }
    return into;
  }
}

mxCodecRegistry.register(new mxDefaultKeyHandlerCodec());
export default mxDefaultKeyHandlerCodec;
