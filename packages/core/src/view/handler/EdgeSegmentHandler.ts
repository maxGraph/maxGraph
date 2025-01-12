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

import Point from '../geometry/Point';
import { CURSOR } from '../../util/Constants';
import Rectangle from '../geometry/Rectangle';
import { contains } from '../../util/mathUtils';
import { setOpacity } from '../../util/styleUtils';
import ElbowEdgeHandler from './ElbowEdgeHandler';
import CellState from '../cell/CellState';
import Cell from '../cell/Cell';
import InternalMouseEvent from '../event/InternalMouseEvent';
import { EdgeHandlerConfig } from './config';

class EdgeSegmentHandler extends ElbowEdgeHandler {
  constructor(state: CellState) {
    super(state);
  }

  points: Point[] = [];

  /**
   * Returns the current absolute points.
   */
  getCurrentPoints() {
    let pts = this.state.absolutePoints;

    // Special case for straight edges where we add a virtual middle handle for moving the edge
    const tol = Math.max(1, this.graph.view.scale);

    if (
      (pts.length === 2 && pts[0] && pts[1]) ||
      (pts.length === 3 &&
        pts[0] &&
        pts[1] &&
        pts[2] &&
        ((Math.abs(pts[0].x - pts[1].x) < tol && Math.abs(pts[1].x - pts[2].x) < tol) ||
          (Math.abs(pts[0].y - pts[1].y) < tol && Math.abs(pts[1].y - pts[2].y) < tol)))
    ) {
      const cx = pts[0].x + (pts[pts.length - 1]!.x - pts[0].x) / 2;
      const cy = pts[0].y + (pts[pts.length - 1]!.y - pts[0].y) / 2;

      pts = [pts[0], new Point(cx, cy), new Point(cx, cy), pts[pts.length - 1]];
    }

    return pts;
  }

  /**
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  getPreviewPoints(point: Point) {
    if (this.isSource || this.isTarget) {
      return super.getPreviewPoints(point);
    }
    const pts = this.getCurrentPoints();
    let last = this.convertPoint(pts[0]!.clone(), false);
    point = this.convertPoint(point.clone(), false);
    let result: Point[] = [];

    for (let i = 1; i < pts.length; i += 1) {
      const pt = this.convertPoint(pts[i]!.clone(), false);

      if (i === this.index) {
        if (Math.round(last.x - pt.x) === 0) {
          last.x = point.x;
          pt.x = point.x;
        }

        if (Math.round(last.y - pt.y) === 0) {
          last.y = point.y;
          pt.y = point.y;
        }
      }

      if (i < pts.length - 1) {
        result.push(pt);
      }

      last = pt;
    }

    // Replaces single point that intersects with source or target
    if (result.length === 1) {
      const source = this.state.getVisibleTerminalState(true);
      const target = this.state.getVisibleTerminalState(false);
      const scale = this.state.view.getScale();
      const tr = this.state.view.getTranslate();

      const x = result[0].x * scale + tr.x;
      const y = result[0].y * scale + tr.y;

      if (
        (source != null && contains(source, x, y)) ||
        (target != null && contains(target, x, y))
      ) {
        result = [point, point];
      }
    }

    return result;
  }

  /**
   * Overridden to perform optimization of the edge style result.
   */
  updatePreviewState(
    edge: CellState,
    point: Point,
    terminalState: CellState,
    me: InternalMouseEvent
  ): void {
    super.updatePreviewState(edge, point, terminalState, me);

    // Checks and corrects preview by running edge style again
    if (!this.isSource && !this.isTarget) {
      point = this.convertPoint(point.clone(), false);
      const pts = edge.absolutePoints;
      let pt0 = pts[0] as Point;
      let pt1 = pts[1] as Point;

      let result = [];

      for (let i = 2; i < pts.length; i += 1) {
        const pt2 = pts[i] as Point;

        // Merges adjacent segments only if more than 2 to allow for straight edges
        if (
          (Math.round(pt0.x - pt1.x) !== 0 || Math.round(pt1.x - pt2.x) !== 0) &&
          (Math.round(pt0.y - pt1.y) !== 0 || Math.round(pt1.y - pt2.y) !== 0)
        ) {
          result.push(this.convertPoint(pt1.clone(), false));
        }

        pt0 = pt1;
        pt1 = pt2;
      }

      const source = this.state.getVisibleTerminalState(true);
      const target = this.state.getVisibleTerminalState(false);
      const rpts = this.state.absolutePoints;

      const end = pts[pts.length - 1];

      // A straight line is represented by 3 handles
      if (
        result.length === 0 &&
        pts[0] &&
        end &&
        (Math.round(pts[0].x - end.x) === 0 || Math.round(pts[0].y - end.y) === 0)
      ) {
        result = [point, point];
      }
      // Handles special case of transitions from straight vertical to routed
      else if (
        pts.length === 5 &&
        result.length === 2 &&
        source != null &&
        target != null &&
        rpts != null &&
        Math.round(rpts[0]!.x - rpts[rpts.length - 1]!.x) === 0
      ) {
        const view = this.graph.getView();
        const scale = view.getScale();
        const tr = view.getTranslate();

        let y0 = view.getRoutingCenterY(source) / scale - tr.y;

        // Use fixed connection point y-coordinate if one exists
        const sc = this.graph.getConnectionConstraint(edge, source, true);

        if (sc != null) {
          const pt = this.graph.getConnectionPoint(source, sc);

          if (pt != null) {
            this.convertPoint(pt, false);
            y0 = pt.y;
          }
        }

        let ye = view.getRoutingCenterY(target) / scale - tr.y;

        // Use fixed connection point y-coordinate if one exists
        const tc = this.graph.getConnectionConstraint(edge, target, false);

        if (tc) {
          const pt = this.graph.getConnectionPoint(target, tc);

          if (pt != null) {
            this.convertPoint(pt, false);
            ye = pt.y;
          }
        }

        result = [new Point(point.x, y0), new Point(point.x, ye)];
      }

      this.points = result;

      // LATER: Check if points and result are different
      edge.view.updateFixedTerminalPoints(edge, source, target);
      edge.view.updatePoints(edge, this.points, source, target);
      edge.view.updateFloatingTerminalPoints(edge, source, target);
    }
  }

  /**
   * Overriden to merge edge segments.
   */
  connect(
    edge: Cell,
    terminal: Cell,
    isSource: boolean,
    isClone: boolean,
    me: InternalMouseEvent
  ) {
    const model = this.graph.getDataModel();
    let geo = edge.getGeometry();
    let result: Point[] | null = null;

    // Merges adjacent edge segments
    if (geo != null && geo.points != null && geo.points.length > 0) {
      const pts = this.abspoints;
      let pt0 = pts[0];
      let pt1 = pts[1];
      result = [];

      for (let i = 2; i < pts.length; i += 1) {
        const pt2 = pts[i];

        // Merges adjacent segments only if more than 2 to allow for straight edges
        if (
          pt0 &&
          pt1 &&
          pt2 &&
          (Math.round(pt0.x - pt1.x) !== 0 || Math.round(pt1.x - pt2.x) !== 0) &&
          (Math.round(pt0.y - pt1.y) !== 0 || Math.round(pt1.y - pt2.y) !== 0)
        ) {
          result.push(this.convertPoint(pt1.clone(), false));
        }

        pt0 = pt1;
        pt1 = pt2;
      }
    }

    this.graph.batchUpdate(() => {
      if (result != null) {
        geo = edge.getGeometry();

        if (geo != null) {
          geo = geo.clone();
          geo.points = result;

          model.setGeometry(edge, geo);
        }
      }
      edge = super.connect(edge, terminal, isSource, isClone, me);
    });

    return edge;
  }

  /**
   * Returns no tooltips.
   */
  getTooltipForNode(node: Element): string | null {
    return null;
  }

  /**
   * Adds custom bends for the center of each segment.
   */
  start(x: number, y: number, index: number) {
    super.start(x, y, index);

    if (
      this.bends != null &&
      this.bends[index] != null &&
      !this.isSource &&
      !this.isTarget
    ) {
      setOpacity(this.bends[index].node, 100);
    }
  }

  /**
   * Adds custom bends for the center of each segment.
   */
  createBends() {
    const bends = [];

    // Source
    let bend = this.createHandleShape(0);
    this.initBend(bend);
    bend.setCursor(CURSOR.TERMINAL_HANDLE);
    bends.push(bend);

    const pts = this.getCurrentPoints();

    // Waypoints (segment handles)
    if (this.graph.isCellBendable(this.state.cell)) {
      if (this.points == null) {
        this.points = [];
      }

      for (let i = 0; i < pts.length - 1; i += 1) {
        bend = this.createVirtualBend();
        bends.push(bend);
        let horizontal = Math.round(pts[i]!.x - pts[i + 1]!.x) === 0;

        // Special case where dy is 0 as well
        if (Math.round(pts[i]!.y - pts[i + 1]!.y) === 0 && i < pts.length - 2) {
          horizontal = Math.round(pts[i]!.x - pts[i + 2]!.x) === 0;
        }

        bend.setCursor(horizontal ? 'col-resize' : 'row-resize');
        this.points.push(new Point(0, 0));
      }
    }

    // Target
    bend = this.createHandleShape(pts.length);
    this.initBend(bend);
    bend.setCursor(CURSOR.TERMINAL_HANDLE);
    bends.push(bend);

    return bends;
  }

  /**
   * Overridden to invoke <refresh> before the redraw.
   */
  redraw() {
    this.refresh();
    super.redraw();
  }

  /**
   * Updates the position of the custom bends.
   */
  redrawInnerBends(p0: Point, pe: Point) {
    if (this.graph.isCellBendable(this.state.cell)) {
      const pts = this.getCurrentPoints();

      if (pts != null && pts.length > 1) {
        let straight = false;

        // Puts handle in the center of straight edges
        if (
          pts.length === 4 &&
          pts[0] &&
          pts[1] &&
          pts[2] &&
          pts[3] &&
          Math.round(pts[1].x - pts[2].x) === 0 &&
          Math.round(pts[1].y - pts[2].y) === 0
        ) {
          straight = true;

          if (Math.round(pts[0].y - pts[pts.length - 1]!.y) === 0) {
            const cx = pts[0].x + (pts[pts.length - 1]!.x - pts[0].x) / 2;
            pts[1] = new Point(cx, pts[1].y);
            pts[2] = new Point(cx, pts[2].y);
          } else {
            const cy = pts[0].y + (pts[pts.length - 1]!.y - pts[0].y) / 2;
            pts[1] = new Point(pts[1].x, cy);
            pts[2] = new Point(pts[2].x, cy);
          }
        }

        for (let i = 0; i < pts.length - 1; i += 1) {
          if (this.bends[i + 1] != null) {
            p0 = pts[i] as Point;
            pe = pts[i + 1] as Point;
            const pt = new Point(p0.x + (pe.x - p0.x) / 2, p0.y + (pe.y - p0.y) / 2);
            const b = this.bends[i + 1].bounds as Rectangle;
            this.bends[i + 1].bounds = new Rectangle(
              Math.floor(pt.x - b.width / 2),
              Math.floor(pt.y - b.height / 2),
              b.width,
              b.height
            );
            this.bends[i + 1].redraw();

            if (this.manageLabelHandle) {
              this.checkLabelHandle(this.bends[i + 1].bounds as Rectangle);
            }
          }
        }

        if (straight) {
          setOpacity(this.bends[1].node, EdgeHandlerConfig.virtualBendOpacity);
          setOpacity(this.bends[3].node, EdgeHandlerConfig.virtualBendOpacity);
        }
      }
    }
  }
}

export default EdgeSegmentHandler;
