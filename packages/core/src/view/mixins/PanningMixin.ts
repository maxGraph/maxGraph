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

import { hasScrollbars } from '../../util/styleUtils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import type PanningHandler from '../handler/PanningHandler';
import { Graph } from '../Graph';
import Rectangle from '../geometry/Rectangle';
import Point from '../geometry/Point';
import type SelectionCellsHandler from '../handler/SelectionCellsHandler';

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
