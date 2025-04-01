/*
Copyright 2024-present The maxGraph project Contributors
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

import ObjectCodec from '../ObjectCodec';
import { Graph } from '../../view/Graph';

/**
 * Codec for {@link Graph}s.
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * Transient Fields:
 *
 * - graphListeners
 * - eventListeners
 * - view
 * - container
 * - cellRenderer
 * - editor
 * - selection
 *
 * @category Serialization with Codecs
 */
export class GraphCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    // TODO: Register every possible plugin (i.e. all not being excluded via tree-shaking(?))
    super(new Graph(__dummy), [
      'graphListeners',
      'eventListeners',
      'view',
      'container',
      'cellRenderer',
      'editor',
      'selection',
    ]);
  }
}
