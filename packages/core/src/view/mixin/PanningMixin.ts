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

import { hasScrollbars } from '../../util/styleUtils.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import type PanningHandler from '../plugin/PanningHandler.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import Rectangle from '../geometry/Rectangle.js';
import Point from '../geometry/Point.js';
import type SelectionCellsHandler from '../plugin/SelectionCellsHandler.js';

type PartialGraph = Pick<
  AbstractGraph,
  'getContainer' | 'getView' | 'getPlugin' | 'fireEvent' | 'getBorder' | 'getGraphBounds'
>;
type PartialPanning = Pick<
  AbstractGraph,
  | 'shiftPreview1'
  | 'shiftPreview2'
  | 'useScrollbarsForPanning'
  | 'timerAutoScroll'
  | 'allowAutoPanning'
  | 'ignoreScrollbars'
  | 'translateToScrollPosition'
  | 'panDx'
  | 'panDy'
  | 'isUseScrollbarsForPanning'
  | 'isTimerAutoScroll'
  | 'isAllowAutoPanning'
  | 'isIgnoreScrollbars'
  | 'isTranslateToScrollPosition'
  | 'getPanDx'
  | 'setPanDx'
  | 'getPanDy'
  | 'setPanDy'
  | 'panGraph'
  | 'center'
  | 'scrollCellToVisible'
  | 'scrollPointToVisible'
  | 'scrollRectToVisible'
  | 'setPanning'
>;
type PartialType = PartialGraph & PartialPanning;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const PanningMixin: PartialType = {
  shiftPreview1: null,
  shiftPreview2: null,

  useScrollbarsForPanning: true,

  isUseScrollbarsForPanning() {
    return this.useScrollbarsForPanning;
  },

  timerAutoScroll: false,

  isTimerAutoScroll() {
    return this.timerAutoScroll;
  },

  allowAutoPanning: false,

  isAllowAutoPanning() {
    return this.allowAutoPanning;
  },

  ignoreScrollbars: false,

  isIgnoreScrollbars() {
    return this.ignoreScrollbars;
  },

  translateToScrollPosition: false,

  isTranslateToScrollPosition() {
    return this.translateToScrollPosition;
  },

  panDx: 0,

  getPanDx() {
    return this.panDx;
  },

  setPanDx(dx) {
    this.panDx = dx;
  },

  panDy: 0,

  getPanDy() {
    return this.panDy;
  },

  setPanDy(dy) {
    this.panDy = dy;
  },

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

  scrollPointToVisible(x, y, extend = false, border = 20) {
    const panningHandler = this.getPlugin<PanningHandler>('PanningHandler');
    const container = this.getContainer();

    if (
      !this.isTimerAutoScroll() &&
      (this.ignoreScrollbars || hasScrollbars(container))
    ) {
      const c = container;

      if (
        x >= c.scrollLeft &&
        y >= c.scrollTop &&
        x <= c.scrollLeft + c.clientWidth &&
        y <= c.scrollTop + c.clientHeight
      ) {
        let dx = c.scrollLeft + c.clientWidth - x;

        if (dx < border) {
          const old = c.scrollLeft;
          c.scrollLeft += border - dx;

          // Automatically extends the canvas size to the bottom, right
          // if the event is outside of the canvas and the edge of the
          // canvas has been reached. Notes: Needs fix for IE.
          if (extend && old === c.scrollLeft) {
            // @ts-ignore
            const root = this.getView().getDrawPane().ownerSVGElement;
            const width = c.scrollWidth + border - dx;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            // @ts-ignore
            root.style.width = `${width}px`;

            c.scrollLeft += border - dx;
          }
        } else {
          dx = x - c.scrollLeft;

          if (dx < border) {
            c.scrollLeft -= border - dx;
          }
        }

        let dy = c.scrollTop + c.clientHeight - y;

        if (dy < border) {
          const old = c.scrollTop;
          c.scrollTop += border - dy;

          if (old == c.scrollTop && extend) {
            // @ts-ignore
            const root = this.getView().getDrawPane().ownerSVGElement;
            const height = c.scrollHeight + border - dy;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            // @ts-ignore
            root.style.height = `${height}px`;

            c.scrollTop += border - dy;
          }
        } else {
          dy = y - c.scrollTop;

          if (dy < border) {
            c.scrollTop -= border - dy;
          }
        }
      }
    } else if (
      this.isAllowAutoPanning() &&
      panningHandler &&
      !panningHandler.isActive()
    ) {
      panningHandler.getPanningManager().panTo(x + this.getPanDx(), y + this.getPanDy());
    }
  },

  center(horizontal = true, vertical = true, cx = 0.5, cy = 0.5) {
    const container = this.getContainer();
    const _hasScrollbars = hasScrollbars(container);
    const padding = 2 * this.getBorder();
    const cw = container.clientWidth - padding;
    const ch = container.clientHeight - padding;
    const bounds = this.getGraphBounds();

    const t = this.getView().translate;
    const s = this.getView().scale;

    let dx = horizontal ? cw - bounds.width : 0;
    let dy = vertical ? ch - bounds.height : 0;

    if (!_hasScrollbars) {
      this.getView().setTranslate(
        horizontal ? Math.floor(t.x - bounds.x / s + (dx * cx) / s) : t.x,
        vertical ? Math.floor(t.y - bounds.y / s + (dy * cy) / s) : t.y
      );
    } else {
      bounds.x -= t.x;
      bounds.y -= t.y;

      const sw = container.scrollWidth;
      const sh = container.scrollHeight;

      if (sw > cw) {
        dx = 0;
      }

      if (sh > ch) {
        dy = 0;
      }

      this.getView().setTranslate(
        Math.floor(dx / 2 - bounds.x),
        Math.floor(dy / 2 - bounds.y)
      );
      container.scrollLeft = (sw - cw) / 2;
      container.scrollTop = (sh - ch) / 2;
    }
  },

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

        const selectionCellsHandler = this.getPlugin<SelectionCellsHandler>(
          'SelectionCellsHandler'
        );

        // Repaints selection marker (ticket 18)
        if (selectionCellsHandler) {
          selectionCellsHandler.refresh();
        }
      }
    }

    return isChanged;
  },

  setPanning(enabled) {
    const panningHandler = this.getPlugin<PanningHandler>('PanningHandler');
    panningHandler && (panningHandler.panningEnabled = enabled);
  },
};
