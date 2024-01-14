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

import ObjectCodec from '../ObjectCodec';
import GraphDataModel from '../../view/GraphDataModel';
import Cell from '../../view/cell/Cell';
import type Codec from '../Codec';

/**
 * Codec for {@link GraphDataModel}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 */
export class ModelCodec extends ObjectCodec {
  constructor() {
    super(new GraphDataModel());
  }

  /**
   * Encodes the given {@link GraphDataModel} by writing a (flat) XML sequence of cell nodes as produced by the {@link CellCodec}.
   * The sequence is wrapped-up in a node with the name `root`.
   */
  encodeObject(enc: any, obj: Cell, node: Element) {
    const rootNode = enc.document.createElement('root');
    enc.encodeCell(obj.getRoot(), rootNode);
    node.appendChild(rootNode);
  }

  /**
   * Overrides decode child to handle special child nodes.
   */
  decodeChild(dec: Codec, child: Element, obj: Cell | GraphDataModel) {
    if (child.nodeName === 'root') {
      this.decodeRoot(dec, child, <GraphDataModel>obj);
    } else {
      this.decodeChild.apply(this, [dec, child, obj]);
    }
  }

  /**
   * Reads the cells into the graph model. All cells are children of the root element in the node.
   */
  decodeRoot(dec: Codec, root: Element, model: GraphDataModel) {
    let rootCell = null;
    let tmp = root.firstChild as Element;

    while (tmp != null) {
      // TODO review the signature of decodeCell
      // @ts-ignore
      const cell = dec.decodeCell(tmp);

      if (cell != null && cell.getParent() == null) {
        rootCell = cell;
      }
      tmp = tmp.nextSibling as Element;
    }

    // Sets the root on the model if one has been decoded
    if (rootCell != null) {
      model.setRoot(rootCell);
    }
  }
}
