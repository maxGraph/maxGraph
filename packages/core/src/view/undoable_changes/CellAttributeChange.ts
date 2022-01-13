import { isNullish } from '../../util/Utils';
import Cell from '../cell/Cell';
import CodecRegistry from '../../serialization/CodecRegistry';
import GenericChangeCodec from './GenericChangeCodec';

import type { UndoableChange } from '../../types';

/**
 * Action to change the attribute of a cell's user object.
 * There is no method on the graph model that uses this
 * action. To use the action, you can use the code shown
 * in the example below.
 *
 * Example:
 *
 * To change the attributeName in the cell's user object
 * to attributeValue, use the following code:
 *
 * ```javascript
 * model.beginUpdate();
 * try
 * {
 *   var edit = new mxCellAttributeChange(
 *     cell, attributeName, attributeValue);
 *   model.execute(edit);
 * }
 * finally
 * {
 *   model.endUpdate();
 * }
 * ```
 *
 * Constructor: mxCellAttributeChange
 *
 * Constructs a change of a attribute of the DOM node
 * stored as the value of the given {@link Cell}`.
 */
class CellAttributeChange implements UndoableChange {
  cell: Cell;
  attribute: string;
  value: any;
  previous: any;

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

const __dummy: any = undefined;
CodecRegistry.register(
  new GenericChangeCodec(new CellAttributeChange(__dummy, __dummy, __dummy), 'value')
);
export default CellAttributeChange;
