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

import ObjectCodec from '../ObjectCodec.js';
import { isNode } from '../../util/domUtils.js';
import type Codec from '../Codec.js';

/**
 * Codec for {@link ValueChange}s, {@link StyleChange}s, {@link GeometryChange}s, {@link CollapseChange}s and {@link VisibleChange}s.
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
 *
 * @category Serialization with Codecs
 */
export class GenericChangeCodec extends ObjectCodec {
  /**
   *
   * @param obj An instance of the change object.
   * @param variable The field name for the change data.
   */
  constructor(obj: any, variable: string) {
    super(obj, ['model', 'previous'], ['cell']);
    this.variable = variable;
  }

  variable: string;

  /**
   * Restores the state by assigning the previous value.
   */
  override afterDecode(dec: Codec, _node: Element, obj: any): any {
    // Allows forward references in sessions. This is a workaround
    // for the sequence of edits in mxGraph.moveCells and cellsAdded.
    if (isNode(obj.cell)) {
      obj.cell = dec.decodeCell(obj.cell, false);
    }

    obj.previous = obj[this.variable];
    return obj;
  }
}
