/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import ObjectCodec from './ObjectCodec';
import DefaultKeyHandler from '../../editor/DefaultKeyHandler';
import CodecRegistry from './CodecRegistry';

/**
 * Class: DefaultKeyHandlerCodec
 *
 * Custom codec for configuring <DefaultKeyHandler>s. This class is created
 * and registered dynamically at load time and used implicitly via
 * <Codec> and the <CodecRegistry>. This codec only reads configuration
 * data for existing key handlers, it does not encode or create key handlers.
 */
class DefaultKeyHandlerCodec extends ObjectCodec {
  constructor() {
    super(new DefaultKeyHandler());
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
   * <DefaultKeyHandler as="keyHandler">
   *   <add as="88" control="true" action="cut"/>
   *   <add as="67" control="true" action="copy"/>
   *   <add as="86" control="true" action="paste"/>
   * </DefaultKeyHandler>
   * (end)
   *
   * The keycodes are for the x, c and v keys.
   *
   * See also: <DefaultKeyHandler.bindAction>,
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

CodecRegistry.register(new DefaultKeyHandlerCodec());
export default DefaultKeyHandlerCodec;
