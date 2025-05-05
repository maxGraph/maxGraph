/*
Copyright 2021-present The maxGraph project Contributors

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

import { isNullish } from '../../internal/utils';
import Cell from '../cell/Cell';
import type { UndoableChange } from '../../types';

/**
 * Action to change the attribute of a cell's user object.
 * There is no method on the graph model that uses this action.
 *
 * To use the action, you can use the code shown in the example below.
 *
 * ### Example
 *
 * To change the attributeName in the cell's user object to attributeValue, use the following code:
 *
 * ```javascript
 * model.beginUpdate();
 * try {
 *   const edit = new CellAttributeChange(cell, attributeName, attributeValue);
 *   model.execute(edit);
 * } finally {
 *   model.endUpdate();
 * }
 * ```
 *
 * @category Change
 */
class CellAttributeChange implements UndoableChange {
  cell: Cell;
  attribute: string;
  value: any;
  previous: any;

  /**
   * Constructs a change of an attribute of the DOM node stored as the value of the given {@link Cell}`.
   */
  constructor(cell: Cell, attribute: string, value: any) {
    this.cell = cell;
    this.attribute = attribute;
    this.value = value;
    this.previous = value;
  }

  /**
   * Changes the attribute of the cell's user object by
   * using {@link Cell#setAttribute}.
   */
  execute(): void {
    const tmp = this.cell.getAttribute(this.attribute);

    if (isNullish(this.previous)) {
      this.cell.value.removeAttribute(this.attribute);
    } else {
      this.cell.setAttribute(this.attribute, this.previous);
    }

    this.previous = tmp;
  }
}

export default CellAttributeChange;
