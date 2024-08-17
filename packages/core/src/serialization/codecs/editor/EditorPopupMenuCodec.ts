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

import ObjectCodec from '../../ObjectCodec';
import type Codec from '../../Codec';
import EditorPopupMenu from '../../../editor/EditorPopupMenu';

/**
 * Custom codec for configuring {@link EditorPopupMenu}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * This codec only reads configuration data for existing popup menus, it does not encode or create menus.
 * Note that this codec only passes the configuration node to the popup menu, which uses the config to dynamically create menus.
 *
 * @see {@link EditorPopupMenu.createMenu}.
 * @category Serialization with Codecs
 */
export class EditorPopupMenuCodec extends ObjectCodec {
  constructor() {
    super(new EditorPopupMenu());
  }

  /**
   * Returns null.
   */
  encode(_enc: Codec, _obj: Element): Element | null {
    return null;
  }

  /**
   * Uses the given node as the config for <EditorPopupMenu>.
   */
  decode(dec: Codec, node: Element, into: any) {
    const inc = node.getElementsByTagName('include')[0];

    if (inc != null) {
      this.processInclude(dec, inc, into);
    } else if (into != null) {
      into.config = node;
    }

    return into;
  }
}
