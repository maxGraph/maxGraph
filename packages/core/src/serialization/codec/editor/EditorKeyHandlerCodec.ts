/*
Copyright 2023-present The maxGraph project Contributors

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

import ObjectCodec from '../../ObjectCodec.js';
import type Codec from '../../Codec.js';
import EditorKeyHandler from '../../../editor/EditorKeyHandler.js';

/**
 * Custom codec for configuring {@link EditorKeyHandler}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * This codec only reads configuration data for existing key handlers, it does not encode or create key handlers.
 *
 * @category Serialization with Codecs
 */
export class EditorKeyHandlerCodec extends ObjectCodec {
  constructor() {
    super(new EditorKeyHandler());
  }

  /**
   * Returns `null`.
   */
  override encode(_enc: Codec, _obj: EditorKeyHandler) {
    return null;
  }

  /**
   * Reads a sequence of the following child nodes and attributes:
   *
   * Child Nodes:
   *
   * add - Binds a keystroke to an action name.
   *
   * Attributes:
   *
   * as - Keycode.
   * action - Action name to execute in editor.
   * control - Optional boolean indicating if
   *     the control key must be pressed.
   *
   * Example:
   *
   * ```javascript
   * <EditorKeyHandler as="keyHandler">
   *   <add as="88" control="true" action="cut"/>
   *   <add as="67" control="true" action="copy"/>
   *   <add as="86" control="true" action="paste"/>
   * </EditorKeyHandler>
   * ```
   *
   * The keycodes are for the x, c and v keys.
   *
   * See also: <EditorKeyHandler.bindAction>, http://www.js-examples.com/page/tutorials__key_codes.html
   */
  override decode(dec: Codec, _node: Element, into: any) {
    if (into != null) {
      const { editor } = into;
      let node: Element | null = <Element | null>_node.firstChild;

      while (node != null) {
        if (!this.processInclude(dec, node, into) && node.nodeName === 'add') {
          const as = node.getAttribute('as');
          const action = node.getAttribute('action');
          const control = node.getAttribute('control');

          into.bindAction(as, action, control);
        }
        node = <Element | null>node.nextSibling;
      }
    }
    return into;
  }
}
