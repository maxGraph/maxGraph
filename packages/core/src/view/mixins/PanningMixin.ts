import { mixInto } from '../../util/utils';
import { hasScrollbars } from '../../util/styleUtils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import PanningHandler from '../handler/PanningHandler';
import { Graph } from '../Graph';
import Cell from '../cell/Cell';
import Rectangle from '../geometry/Rectangle';
import Point from '../geometry/Point';
import SelectionCellsHandler from '../handler/SelectionCellsHandler';

declare module '../Graph' {
  interface Graph {
    shiftPreview1: HTMLElement | null;
    shiftPreview2: HTMLElement | null;
    useScrollbarsForPanning: boolean;
    timerAutoScroll: boolean;
    allowAutoPanning: boolean;
    panDx: number;
    panDy: number;

    isUseScrollbarsForPanning: () => boolean;
    isTimerAutoScroll: () => boolean;
    isAllowAutoPanning: () => boolean;
    getPanDx: () => number;
    setPanDx: (dx: number) => void;
    getPanDy: () => number;
    setPanDy: (dy: number) => void;
    panGraph: (dx: number, dy: number) => void;
    scrollCellToVisible: (cell: Cell, center?: boolean) => void;
    scrollRectToVisible: (rect: Rectangle) => boolean;
    setPanning: (enabled: boolean) => void;
  }
}

type PartialGraph = Pick<Graph, 'getContainer' | 'getView' | 'getPlugin' | 'fireEvent'>;
type PartialPanning = Pick<
  Graph,
  | 'shiftPreview1'
  | 'shiftPreview2'
  | 'useScrollbarsForPanning'
  | 'timerAutoScroll'
  | 'allowAutoPanning'
  | 'panDx'
  | 'panDy'
  | 'isUseScrollbarsForPanning'
  | 'isTimerAutoScroll'
  | 'isAllowAutoPanning'
  | 'getPanDx'
  | 'setPanDx'
  | 'getPanDy'
  | 'setPanDy'
  | 'panGraph'
  | 'scrollCellToVisible'
  | 'scrollRectToVisible'
  | 'setPanning'
>;
type PartialType = PartialGraph & PartialPanning;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const PanningMixin: PartialType = {
  shiftPreview1: null,
  shiftPreview2: null,

  /**
   * Specifies if scrollbars should be used for panning in {@link panGraph} if
   * any scrollbars are available. If scrollbars are enabled in CSS, but no
   * scrollbars appear because the graph is smaller than the container size,
   * then no panning occurs if this is `true`.
   * @default true
   */
  useScrollbarsForPanning: true,

  isUseScrollbarsForPanning() {
    return this.useScrollbarsForPanning;
  },

  /**
   * Specifies if autoscrolling should be carried out via mxPanningManager even
   * if the container has scrollbars. This disables {@link scrollPointToVisible} and
   * uses {@link PanningManager} instead. If this is true then {@link autoExtend} is
   * disabled. It should only be used with a scroll buffer or when scollbars
   * are visible and scrollable in all directions.
   * @default false
   */
  timerAutoScroll: false,

  isTimerAutoScroll() {
    return this.timerAutoScroll;
  },

  /**
   * Specifies if panning via {@link panGraph} should be allowed to implement autoscroll
   * if no scrollbars are available in {@link scrollPointToVisible}. To enable panning
   * inside the container, near the edge, set {@link PanningManager.border} to a
   * positive value.
   * @default false
   */
  allowAutoPanning: false,

  isAllowAutoPanning() {
    return this.allowAutoPanning;
  },

  /**
   * Current horizontal panning value.
   * @default 0
   */
  panDx: 0,

  getPanDx() {
    return this.panDx;
  },

  setPanDx(dx) {
    this.panDx = dx;
  },

  /**
   * Current vertical panning value.
   * @default 0
   */
  panDy: 0,

  getPanDy() {
    return this.panDy;
  },

  setPanDy(dy) {
    this.panDy = dy;
  },

  /**
   * Shifts the graph display by the given amount. This is used to preview
   * panning operations, use {@link GraphView.setTranslate} to set a persistent
   * translation of the view. Fires {@link InternalEvent.PAN}.
   *
   * @param dx Amount to shift the graph along the x-axis.
   * @param dy Amount to shift the graph along the y-axis.
   */
  panGraph(dx, dy) {
    const container = this.getContainer();

    if (this.useScrollbarsForPanning && hasScrollbars(container)) {
      container.scrollLeft = -dx;
      container.scrollTop = -dy;
    } else {
      const canvas = this.getView().getCanvas();

      // Puts everything inside the container in a DIV so that it
      // can be moved without changing the state of the container
      if (dx === 0 && dy === 0) {
        canvas.removeAttribute('transform');

        if (this.shiftPreview1) {
          let child = this.shiftPreview1.firstChild;

          while (child) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (this.shiftPreview1.parentNode) {
            this.shiftPreview1.parentNode.removeChild(this.shiftPreview1);
          }

          this.shiftPreview1 = null;

          container.appendChild(<Node>canvas.parentNode);
          const shiftPreview2 = <HTMLElement>this.shiftPreview2;
          child = shiftPreview2.firstChild;

          while (child) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (shiftPreview2.parentNode) {
            shiftPreview2.parentNode.removeChild(shiftPreview2);
          }
          this.shiftPreview2 = null;
        }
      } else {
        canvas.setAttribute('transform', `translate(${dx},${dy})`);

        if (!this.shiftPreview1) {
          // Needs two divs for stuff before and after the SVG element
          this.shiftPreview1 = document.createElement('div');
          this.shiftPreview1.style.position = 'absolute';
          this.shiftPreview1.style.overflow = 'visible';

          this.shiftPreview2 = document.createElement('div');
          this.shiftPreview2.style.position = 'absolute';
          this.shiftPreview2.style.overflow = 'visible';

          let current = this.shiftPreview1;
          let child = container.firstChild;

          while (child) {
            const next = child.nextSibling;

            // SVG element is moved via transform attribute
            // @ts-ignore
            if (child !== canvas.parentNode) {
              current.appendChild(child);
            } else {
              current = this.shiftPreview2;
            }

            child = next;
          }

          // Inserts elements only if not empty
          if (this.shiftPreview1.firstChild) {
            container.insertBefore(this.shiftPreview1, canvas.parentNode);
          }

          if (this.shiftPreview2.firstChild) {
            container.appendChild(this.shiftPreview2);
          }
        }

        this.shiftPreview1.style.left = `${dx}px`;
        this.shiftPreview1.style.top = `${dy}px`;

        if (this.shiftPreview2) {
          this.shiftPreview2.style.left = `${dx}px`;
          this.shiftPreview2.style.top = `${dy}px`;
        }
      }

      this.panDx = dx;
      this.panDy = dy;

      this.fireEvent(new EventObject(InternalEvent.PAN));
    }
  },

  /**
   * Pans the graph so that it shows the given cell. Optionally the cell may
   * be centered in the container.
   *
   * To center a given graph if the {@link container} has no scrollbars, use the following code.
   *
   * [code]
   * var bounds = graph.getGraphBounds();
   * graph.view.setTranslate(-bounds.x - (bounds.width - container.clientWidth) / 2,
   * 						   -bounds.y - (bounds.height - container.clientHeight) / 2);
   * [/code]
   *
   * @param cell {@link mxCell} to be made visible.
   * @param center Optional boolean flag. Default is `false`.
   */
  scrollCellToVisible(cell, center = false) {
    const x = -this.getView().translate.x;
    const y = -this.getView().translate.y;

    const state = this.getView().getState(cell);

    if (state) {
      const bounds = new Rectangle(x + state.x, y + state.y, state.width, state.height);

      if (center && this.getContainer()) {
        const w = this.getContainer().clientWidth;
        const h = this.getContainer().clientHeight;

        bounds.x = bounds.getCenterX() - w / 2;
        bounds.width = w;
        bounds.y = bounds.getCenterY() - h / 2;
        bounds.height = h;
      }

      const tr = new Point(this.getView().translate.x, this.getView().translate.y);

      if (this.scrollRectToVisible(bounds)) {
        // Triggers an update via the view's event source
        const tr2 = new Point(this.getView().translate.x, this.getView().translate.y);
        this.getView().translate.x = tr.x;
        this.getView().translate.y = tr.y;
        this.getView().setTranslate(tr2.x, tr2.y);
      }
    }
  },

  /**
   * Pans the graph so that it shows the given rectangle.
   *
   * @param rect {@link mxRectangle} to be made visible.
   */
  scrollRectToVisible(rect) {
    let isChanged = false;

    const container = <HTMLElement>this.getContainer();
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    const widthLimit = Math.min(w, rect.width);
    const heightLimit = Math.min(h, rect.height);

    if (hasScrollbars(container)) {
      rect.x += this.getView().translate.x;
      rect.y += this.getView().translate.y;
      let dx = container.scrollLeft - rect.x;
      const ddx = Math.max(dx - container.scrollLeft, 0);

      if (dx > 0) {
        container.scrollLeft -= dx + 2;
      } else {
        dx = rect.x + widthLimit - container.scrollLeft - container.clientWidth;

        if (dx > 0) {
          container.scrollLeft += dx + 2;
        }
      }

      let dy = container.scrollTop - rect.y;
      const ddy = Math.max(0, dy - container.scrollTop);

      if (dy > 0) {
        container.scrollTop -= dy + 2;
      } else {
        dy = rect.y + heightLimit - container.scrollTop - container.clientHeight;

        if (dy > 0) {
          container.scrollTop += dy + 2;
        }
      }

      if (!this.useScrollbarsForPanning && (ddx != 0 || ddy != 0)) {
        this.getView().setTranslate(ddx, ddy);
      }
    } else {
      const x = -this.getView().translate.x;
      const y = -this.getView().translate.y;

      const s = this.getView().scale;

      if (rect.x + widthLimit > x + w) {
        this.getView().translate.x -= (rect.x + widthLimit - w - x) / s;
        isChanged = true;
      }

      if (rect.y + heightLimit > y + h) {
        this.getView().translate.y -= (rect.y + heightLimit - h - y) / s;
        isChanged = true;
      }

      if (rect.x < x) {
        this.getView().translate.x += (x - rect.x) / s;
        isChanged = true;
      }

      if (rect.y < y) {
        this.getView().translate.y += (y - rect.y) / s;
        isChanged = true;
      }

      if (isChanged) {
        this.getView().refresh();

        const selectionCellsHandler = this.getPlugin(
          'SelectionCellsHandler'
        ) as SelectionCellsHandler;

        // Repaints selection marker (ticket 18)
        if (selectionCellsHandler) {
          selectionCellsHandler.refresh();
        }
      }
    }

    return isChanged;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Specifies if panning should be enabled. This implementation updates
   * {@link PanningHandler.panningEnabled} in {@link panningHandler}.
   *
   * @param enabled Boolean indicating if panning should be enabled.
   */
  setPanning(enabled) {
    const panningHandler = this.getPlugin('PanningHandler') as PanningHandler;

    if (panningHandler) panningHandler.panningEnabled = enabled;
  },
};

mixInto(Graph)(PanningMixin);
