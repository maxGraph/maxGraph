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

import { MouseEventListener, MouseListenerSet } from '../../types';
import { hasScrollbars } from '../../util/styleUtils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import type { AbstractGraph } from '../AbstractGraph';

/**
 * Implements a handler for panning.
 */
class PanningManager {
  constructor(graph: AbstractGraph) {
    this.thread = null;
    this.active = false;
    this.tdx = 0;
    this.tdy = 0;
    this.t0x = 0;
    this.t0y = 0;
    this.dx = 0;
    this.dy = 0;
    this.scrollbars = false;
    this.scrollLeft = 0;
    this.scrollTop = 0;

    this.mouseListener = {
      mouseDown: () => {
        return;
      },
      mouseMove: () => {
        return;
      },
      mouseUp: () => {
        if (this.active) {
          this.stop();
        }
      },
    };

    graph.addMouseListener(this.mouseListener);

    this.mouseUpListener = () => {
      if (this.active) {
        this.stop();
      }
    };

    // Stops scrolling on every mouseup anywhere in the document
    InternalEvent.addListener(document, 'mouseup', this.mouseUpListener);

    const createThread = () => {
      this.scrollbars = hasScrollbars(graph.container);
      this.scrollLeft = graph.container.scrollLeft;
      this.scrollTop = graph.container.scrollTop;

      return window.setInterval(() => {
        this.tdx -= this.dx;
        this.tdy -= this.dy;

        if (this.scrollbars) {
          const left = -graph.container.scrollLeft - Math.ceil(this.dx);
          const top = -graph.container.scrollTop - Math.ceil(this.dy);
          graph.panGraph(left, top);
          graph.setPanDx(this.scrollLeft - graph.container.scrollLeft);
          graph.setPanDy(this.scrollTop - graph.container.scrollTop);
          graph.fireEvent(new EventObject(InternalEvent.PAN));
          // TODO: Implement graph.autoExtend
        } else {
          graph.panGraph(this.getDx(), this.getDy());
        }
      }, this.delay);
    };

    this.isActive = () => {
      return this.active;
    };

    this.getDx = () => {
      return Math.round(this.tdx);
    };

    this.getDy = () => {
      return Math.round(this.tdy);
    };

    this.start = () => {
      this.t0x = graph.view.translate.x;
      this.t0y = graph.view.translate.y;
      this.active = true;
    };

    this.panTo = (x, y, w = 0, h = 0) => {
      if (!this.active) {
        this.start();
      }

      this.scrollLeft = graph.container.scrollLeft;
      this.scrollTop = graph.container.scrollTop;

      const c = graph.container;
      this.dx = x + w - c.scrollLeft - c.clientWidth;

      if (this.dx < 0 && Math.abs(this.dx) < this.border) {
        this.dx = this.border + this.dx;
      } else if (this.handleMouseOut) {
        this.dx = Math.max(this.dx, 0);
      } else {
        this.dx = 0;
      }

      if (this.dx == 0) {
        this.dx = x - c.scrollLeft;

        if (this.dx > 0 && this.dx < this.border) {
          this.dx -= this.border;
        } else if (this.handleMouseOut) {
          this.dx = Math.min(0, this.dx);
        } else {
          this.dx = 0;
        }
      }

      this.dy = y + h - c.scrollTop - c.clientHeight;

      if (this.dy < 0 && Math.abs(this.dy) < this.border) {
        this.dy = this.border + this.dy;
      } else if (this.handleMouseOut) {
        this.dy = Math.max(this.dy, 0);
      } else {
        this.dy = 0;
      }

      if (this.dy == 0) {
        this.dy = y - c.scrollTop;

        if (this.dy > 0 && this.dy < this.border) {
          this.dy -= this.border;
        } else if (this.handleMouseOut) {
          this.dy = Math.min(0, this.dy);
        } else {
          this.dy = 0;
        }
      }

      if (this.dx != 0 || this.dy != 0) {
        this.dx *= this.damper;
        this.dy *= this.damper;

        if (this.thread == null) {
          this.thread = createThread();
        }
      } else if (this.thread != null) {
        window.clearInterval(this.thread);
        this.thread = null;
      }
    };

    this.stop = () => {
      if (this.active) {
        this.active = false;

        if (this.thread != null) {
          window.clearInterval(this.thread);
          this.thread = null;
        }

        this.tdx = 0;
        this.tdy = 0;

        if (!this.scrollbars) {
          const px = graph.getPanDx();
          const py = graph.getPanDy();

          if (px != 0 || py != 0) {
            graph.panGraph(0, 0);
            graph.view.setTranslate(
              this.t0x + px / graph.view.scale,
              this.t0y + py / graph.view.scale
            );
          }
        } else {
          graph.setPanDx(0);
          graph.setPanDy(0);
          graph.fireEvent(new EventObject(InternalEvent.PAN));
        }
      }
    };

    this.destroy = () => {
      graph.removeMouseListener(this.mouseListener);
      InternalEvent.removeListener(document, 'mouseup', this.mouseUpListener);
    };
  }

  /**
   * Damper value for the panning. Default is 1/6.
   */
  damper = 1 / 6;

  /**
   * Delay in milliseconds for the panning. Default is 10.
   */
  delay = 10;

  /**
   * Specifies if mouse events outside of the component should be handled. Default is true.
   */
  handleMouseOut = true;

  /**
   * Border to handle automatic panning inside the component. Default is 0 (disabled).
   */
  border = 0;

  thread: number | null = null;

  active = false;

  tdx = 0;
  tdy = 0;
  t0x = 0;
  t0y = 0;
  dx = 0;
  dy = 0;
  scrollbars = false;
  scrollLeft = 0;
  scrollTop = 0;

  mouseListener: MouseListenerSet;

  mouseUpListener: MouseEventListener;

  stop: () => void;
  isActive: () => boolean;
  getDx: () => number;
  getDy: () => number;
  start: () => void;
  panTo: (x: number, y: number, w?: number, h?: number) => void;
  destroy: () => void;
}

export default PanningManager;
