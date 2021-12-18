import { mixInto } from '../../util/utils';
import Cell from '../cell/Cell';
import CellArray from '../cell/CellArray';
import { Graph } from '../Graph';

declare module '../Graph' {
  interface Graph {
    dropEnabled: boolean;
    splitEnabled: boolean;
    autoScroll: boolean;
    autoExtend: boolean;

    isAutoScroll: () => boolean;
    isAutoExtend: () => boolean;
    isDropEnabled: () => boolean;
    setDropEnabled: (value: boolean) => void;
    isSplitEnabled: () => boolean;
    setSplitEnabled: (value: boolean) => void;
    isSplitTarget: (target: Cell, cells: CellArray, evt: MouseEvent) => boolean;
  }
}

type PartialGraph = Pick<Graph, 'getEdgeValidationError'>;
type PartialDragDrop = Pick<
  Graph,
  | 'dropEnabled'
  | 'splitEnabled'
  | 'autoScroll'
  | 'autoExtend'
  | 'isAutoScroll'
  | 'isAutoExtend'
  | 'isDropEnabled'
  | 'setDropEnabled'
  | 'isSplitEnabled'
  | 'setSplitEnabled'
  | 'isSplitTarget'
>;
type PartialType = PartialGraph & PartialDragDrop;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const DragDropMixin: PartialType = {
  /**
   * Specifies the return value for {@link isDropEnabled}.
   * @default false
   */
  dropEnabled: false,

  /**
   * Specifies if dropping onto edges should be enabled. This is ignored if
   * {@link dropEnabled} is `false`. If enabled, it will call {@link splitEdge} to carry
   * out the drop operation.
   * @default true
   */
  splitEnabled: true,

  /**
   * Specifies if the graph should automatically scroll if the mouse goes near
   * the container edge while dragging. This is only taken into account if the
   * container has scrollbars.
   *
   * If you need this to work without scrollbars then set {@link ignoreScrollbars} to
   * true. Please consult the {@link ignoreScrollbars} for details. In general, with
   * no scrollbars, the use of {@link allowAutoPanning} is recommended.
   * @default true
   */
  autoScroll: true,

  isAutoScroll() {
    return this.autoScroll;
  },

  /**
   * Specifies if the size of the graph should be automatically extended if the
   * mouse goes near the container edge while dragging. This is only taken into
   * account if the container has scrollbars. See {@link autoScroll}.
   * @default true
   */
  autoExtend: true,

  isAutoExtend() {
    return this.autoExtend;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns {@link dropEnabled} as a boolean.
   */
  isDropEnabled() {
    return this.dropEnabled;
  },

  /**
   * Specifies if the graph should allow dropping of cells onto or into other
   * cells.
   *
   * @param dropEnabled Boolean indicating if the graph should allow dropping
   * of cells into other cells.
   */
  setDropEnabled(value) {
    this.dropEnabled = value;
  },

  /*****************************************************************************
   * Group: Split behaviour
   *****************************************************************************/

  /**
   * Returns {@link splitEnabled} as a boolean.
   */
  isSplitEnabled() {
    return this.splitEnabled;
  },

  /**
   * Specifies if the graph should allow dropping of cells onto or into other
   * cells.
   *
   * @param dropEnabled Boolean indicating if the graph should allow dropping
   * of cells into other cells.
   */
  setSplitEnabled(value) {
    this.splitEnabled = value;
  },

  /**
   * Returns true if the given edge may be splitted into two edges with the
   * given cell as a new terminal between the two.
   *
   * @param target {@link mxCell} that represents the edge to be splitted.
   * @param cells {@link mxCell} that should split the edge.
   * @param evt Mouseevent that triggered the invocation.
   */
  isSplitTarget(target, cells, evt) {
    if (
      target.isEdge() &&
      cells.length === 1 &&
      cells[0].isConnectable() &&
      !this.getEdgeValidationError(target, target.getTerminal(true), cells[0])
    ) {
      const src = target.getTerminal(true);
      const trg = target.getTerminal(false);

      return !cells[0].isAncestor(src) && !cells[0].isAncestor(trg);
    }
    return false;
  },
};

mixInto(Graph)(DragDropMixin);
