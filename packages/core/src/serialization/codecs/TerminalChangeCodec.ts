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

import ObjectCodec from '../ObjectCodec.js';
import TerminalChange from '../../view/undoable_changes/TerminalChange.js';
import type Codec from '../Codec.js';

/**
 * Codec for {@link TerminalChange}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 *
 * Reference Fields:
 *
 * - cell
 * - terminal
 *
 * @category Serialization with Codecs
 */
export class TerminalChangeCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    super(
      new TerminalChange(__dummy, __dummy, __dummy, __dummy),
      ['model', 'previous'] as Array<keyof TerminalChange>,
      ['cell', 'terminal'] as Array<keyof TerminalChange>
    );
  }

  /**
   * Restores the state by assigning the previous value.
   */
  afterDecode(_dec: Codec, _node: Element, obj: any): any {
    obj.previous = obj.terminal;
    return obj;
  }
}
