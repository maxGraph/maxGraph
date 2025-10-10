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

import type { DirectionValue, EdgeStyleFunction } from '../../../types.js';
import type CellState from '../../cell/CellState.js';
import Point from '../../geometry/Point.js';
import Rectangle from '../../geometry/Rectangle.js';
import { ManhattanConnectorConfig } from '../config.js';
import Geometry from '../../geometry/Geometry.js';
import { OrthogonalConnector } from './Orthogonal.js';
import { SegmentConnector } from './Segment.js';

/**
 * ManhattanConnector code is based on code from https://github.com/mwangm/mxgraph-manhattan-connector
 *
 * Implements router to find the shortest route that avoids cells using manhattan distance as metric.
 *
 * This EdgeStyle is registered under `manhattanEdgeStyle` in {@link EdgeStyleRegistry} when using {@link Graph} or calling {@link registerDefaultEdgeStyles}.
 *
 * **IMPORTANT**: When registering it manually  in {@link EdgeStyleRegistry}, the following metadata must be used:
 * - handlerKind: 'segment'
 * - isOrthogonal: true
 */
export const ManhattanConnector: EdgeStyleFunction = (
  state: CellState,
  source: CellState,
  target: CellState | null,
  points: Point[],
  result: Point[]
) => {
  /**
   * Adds all values from source geometry to target.
   * Used to create padding box around cell geometry.
   * @param target
   * @param source
   * @returns
   */
  function moveAndExpand(target: Rectangle, source: Rectangle): Rectangle {
    target.x += source.x || 0;
    target.y += source.y || 0;
    target.width += source.width || 0;
    target.height += source.height || 0;
    return target;
  }

  function snapCoordinateToGrid(value: number, gridSize: number) {
    return gridSize * Math.round(value / gridSize);
  }

  function snapPointToGrid(p: Point, gx: number, gy?: number) {
    p.x = snapCoordinateToGrid(p.x, gx);
    p.y = snapCoordinateToGrid(p.y, gy || gx);
    return p;
  }

  function isPointInRectangle(rect: Rectangle, p: Point) {
    return (
      p.x >= rect.x &&
      p.x <= rect.x + rect.width &&
      p.y >= rect.y &&
      p.y <= rect.y + rect.height
    );
  }

  function getRectangleCenter(rect: Rectangle): Point {
    return new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);
  }

  function getDifferencePoint(p1: Point, p2: Point): Point {
    return new Point(p1.x - p2.x, p1.y - p2.y);
  }

  function movePoint(p: Point, moveX?: number, moveY?: number): Point {
    p.x += moveX || 0;
    p.y += moveY || 0;
    return p;
  }

  function getPointTheta(p1: Point, p2: Point) {
    const p = p2.clone();
    const y = -(p.y - p1.y);
    const x = p.x - p1.x;
    const PRECISION = 10;
    const rad =
      y.toFixed(PRECISION) == '0' && x.toFixed(PRECISION) == '0' ? 0 : Math.atan2(y, x);
    return (180 * rad) / Math.PI;
  }

  function normalizePoint(point: Point) {
    return new Point(
      point.x === 0 ? 0 : Math.abs(point.x) / point.x,
      point.y === 0 ? 0 : Math.abs(point.y) / point.y
    );
  }

  function getManhattanDistance(p1: Point, p2: Point) {
    return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
  }

  function toPointFromString(pointString: string) {
    const xy = pointString.split(pointString.indexOf('@') === -1 ? ' ' : '@');
    return new Point(Number.parseInt(xy[0], 10), Number.parseInt(xy[1], 10));
  }

  function pointToString(point: Point) {
    return `${point.x}@${point.y}`;
  }

  function getCellAbsoluteBounds(cellState: CellState) {
    const graph = cellState.view.graph;
    const cellBounds = graph.getCellBounds(cellState.cell, false, false)?.clone();
    if (!cellBounds) return undefined;
    const view = graph.view;
    const { scale, translate } = view;
    const { x, y } = translate;
    const round = (v: number) => Math.round(v * 10) / 10;
    const res = new Rectangle(
      round(cellBounds.x / scale - x),
      round(cellBounds.y / scale - y),
      round(cellBounds.width / scale),
      round(cellBounds.height / scale)
    );

    return res;
  }

  const mStep = ManhattanConnectorConfig.step;

  const config = {
    // Padding applied on the element bounding boxes
    paddingBox: new Geometry(-mStep, -mStep, mStep * 2, mStep * 2),

    // An array of directions to find next points on the route
    directions: [
      {
        offsetX: mStep,
        offsetY: 0,
        cost: mStep,
        angle: normalizeAngle(getPointTheta(new Point(0, 0), new Point(mStep, 0))),
      },
      {
        offsetX: 0,
        offsetY: mStep,
        cost: mStep,
        angle: normalizeAngle(getPointTheta(new Point(0, 0), new Point(0, mStep))),
      },
      {
        offsetX: -mStep,
        offsetY: 0,
        cost: mStep,
        angle: normalizeAngle(getPointTheta(new Point(0, 0), new Point(-mStep, 0))),
      },
      {
        offsetX: 0,
        offsetY: -mStep,
        cost: mStep,
        angle: normalizeAngle(getPointTheta(new Point(0, 0), new Point(0, -mStep))),
      },
    ],

    directionMap: {
      east: { x: 1, y: 0 },
      south: { x: 0, y: 1 },
      west: { x: -1, y: 0 },
      north: { x: 0, y: -1 },
    },

    // A penalty received for direction change
    penaltiesGenerator: (angle: number) => {
      if (angle == 45 || angle == 90 || angle == 180) return mStep / 2;
      return 0;
    },
    // If a function is provided, it's used to route the link while dragging an end
    // i.e. function(from, to, opts) { return []; }
    draggingRoute: null,

    previousDirAngle: 0,
  };

  /**
   * Map of obstacles
   * Helper structure to identify whether a point lies in an obstacle.
   */
  class ObstacleMap {
    map: Map<string, Rectangle[]>;
    options: typeof config;
    // tells how to divide the paper when creating the elements map
    mapGridSize: number;
    constructor(opt: any) {
      this.options = opt;
      this.mapGridSize = 100;
      this.map = new Map();
    }

    // Builds a map of all elements for quicker obstacle queries
    // The svg is divided to  cells, where each of them holds an information which
    // elements belong to it. When we query whether a point is in an obstacle we don't need
    // to go through all obstacles, we check only those in a particular cell.
    build(source: CellState | null, target: CellState | null) {
      const graph = source?.view.graph || target?.view.graph;
      if (!graph) return;
      return Array.from(graph.getView().getCellStates())
        .filter((s) => s.cell && s.cell.isVertex() && !s.cell.isEdge())
        .map((s) => getCellAbsoluteBounds(s))
        .map((bbox) => (bbox ? moveAndExpand(bbox, this.options.paddingBox) : null))
        .forEach((bbox) => {
          if (!bbox) return;

          const origin = snapPointToGrid(new Point(bbox.x, bbox.y), this.mapGridSize);
          const corner = snapPointToGrid(
            new Point(bbox.x + bbox.width, bbox.y + bbox.height),
            this.mapGridSize
          );

          for (let x = origin.x; x <= corner.x; x += this.mapGridSize) {
            for (let y = origin.y; y <= corner.y; y += this.mapGridSize) {
              const gridKey = x + '@' + y;

              const rectArr = this.map.get(gridKey) || [];
              if (!this.map.has(gridKey)) this.map.set(gridKey, rectArr);
              rectArr.push(bbox);
            }
          }
        });
    }

    isPointAccessible(point: Point): boolean {
      const mapKey = pointToString(snapPointToGrid(point.clone(), this.mapGridSize));
      const obstacles = this.map.get(mapKey);
      if (obstacles) {
        return obstacles.every((obstacle) => !isPointInRectangle(obstacle, point));
      }
      return true;
    }
  }

  class SortedSet {
    items: string[];

    hash: Map<string, { value: number; open: boolean }>;

    constructor() {
      this.items = [];
      this.hash = new Map();
    }

    add(key: string, value: number) {
      const hashItem = this.hash.get(key);
      if (hashItem) {
        hashItem.value = value;
        this.items.splice(this.items.indexOf(key), 1);
      } else {
        this.hash.set(key, {
          value,
          open: true,
        });
      }

      this.items.push(key);
      this.items.sort((i1, i2) => {
        const hashItem1 = this.hash.get(i1);
        const hashItem2 = this.hash.get(i2);
        if (!hashItem1 || !hashItem2) return 0;
        return hashItem1.value - hashItem2.value;
      });
    }

    remove(key: string) {
      const hashItem = this.hash.get(key);
      if (hashItem) hashItem.open = false;
    }

    isOpen(key: string) {
      const hashItem = this.hash.get(key);
      return hashItem && hashItem.open == true;
    }

    isClose(key: string) {
      const hashItem = this.hash.get(key);
      return hashItem && hashItem.open == false;
    }

    isEmpty() {
      return this.items.length == 0;
    }

    pop(): string | undefined {
      const key = this.items.shift();
      if (key) this.remove(key);
      return key;
    }
  }

  function reconstructRoute(
    parents: { [key: string]: Point },
    endPoint: Point,
    startCenter: Point,
    endCenter: Point
  ) {
    const route: Point[] = [];
    let previousDirection = normalizePoint(getDifferencePoint(endCenter, endPoint));
    let current = endPoint;
    let parent;

    while (parents[pointToString(current)]) {
      parent = parents[pointToString(current)];
      if (!parent) continue;
      const direction = normalizePoint(getDifferencePoint(current, parent));

      // Add point in when direction change
      if (!direction.equals(previousDirection)) {
        route.unshift(current);
        previousDirection = direction;
      }
      current = parent;
    }

    const startDirection = normalizePoint(getDifferencePoint(current, startCenter));
    if (!startDirection.equals(previousDirection)) {
      route.unshift(current);
    }

    return route;
  }

  function getRectPoints(
    bbox: Rectangle,
    directions: DirectionValue[],
    opt: typeof config
  ): Point[] {
    const step = ManhattanConnectorConfig.step;
    const center = getRectangleCenter(bbox);
    const res: Point[] = [];
    for (const direction of directions) {
      const directionPoint = opt.directionMap[direction];

      const x = (directionPoint.x * bbox.width) / 2;
      const y = (directionPoint.y * bbox.height) / 2;

      const point = movePoint(center.clone(), x, y);

      if (isPointInRectangle(bbox, point)) {
        movePoint(point, directionPoint.x * step, directionPoint.y * step);
      }

      res.push(snapPointToGrid(point, step));
    }
    return res;
  }

  function normalizeAngle(angle: number) {
    return (angle % 360) + (angle < 0 ? 360 : 0);
  }

  function getDirectionAngle(start: Point, end: Point, directionLength: number) {
    const q = 360 / directionLength;
    return Math.floor(normalizeAngle(getPointTheta(start, end) + q / 2) / q) * q;
  }

  function getDirectionChange(angle1: number, angle2: number) {
    const dirChange = Math.abs(angle1 - angle2);
    return dirChange > 180 ? 360 - dirChange : dirChange;
  }

  function estimateCost(from: Point, endPoints: Point[]) {
    let min = Infinity;

    for (let i = 0, len = endPoints.length; i < len; i++) {
      const cost = getManhattanDistance(from, endPoints[i]);
      if (cost < min) min = cost;
    }

    return min;
  }

  function alignPointToCell(
    point: Point,
    edgeState: CellState,
    cellState: CellState,
    isSourceCell: boolean
  ) {
    const cellBounds = getCellAbsoluteBounds(cellState);

    const y = isSourceCell ? edgeState.style.exitY : edgeState.style.entryY;
    const onlyHorizontalDirections = isSourceCell
      ? ManhattanConnectorConfig.startDirections.every(
          (d) => d != 'north' && d != 'south'
        )
      : ManhattanConnectorConfig.endDirections.every((d) => d != 'north' && d != 'south');

    if (y != undefined && onlyHorizontalDirections) {
      const cellHeight = cellBounds?.height || 0;
      point.y =
        cellBounds?.y != undefined
          ? cellBounds?.y + cellHeight * y
          : point.y - cellHeight / 2 + cellHeight * y;
    }

    const x = isSourceCell ? edgeState.style.exitX : edgeState.style.entryX;
    const onlyVerticalDirections = isSourceCell
      ? ManhattanConnectorConfig.startDirections.every((d) => d != 'west' && d != 'east')
      : ManhattanConnectorConfig.endDirections.every((d) => d != 'west' && d != 'east');
    if (x != undefined && onlyVerticalDirections) {
      const cellWidth = cellBounds?.width || 0;
      point.x =
        cellBounds?.x != undefined
          ? cellBounds?.x + cellWidth * x
          : point.x - cellWidth / 2 + cellWidth * (x || 0);
    }
  }

  function findRoute(
    start: Rectangle,
    end: Rectangle,
    obstacleMap: ObstacleMap,
    opt: typeof config
  ) {
    // Calculate start points and end points
    const step = ManhattanConnectorConfig.step;
    const startPoints = getRectPoints(
      start,
      ManhattanConnectorConfig.startDirections,
      opt
    ).filter((p) => obstacleMap.isPointAccessible(p));

    const startCenter = snapPointToGrid(getRectangleCenter(start), step);
    const endPoints = getRectPoints(
      end,
      ManhattanConnectorConfig.endDirections,
      opt
    ).filter((p) => obstacleMap.isPointAccessible(p));
    const endCenter = snapPointToGrid(getRectangleCenter(end), step);
    if (startPoints.length > 0 && endPoints.length > 0) {
      // The set of possible  points to be evaluated, initially containing the start points.
      const openSet = new SortedSet();
      // Keeps predecessor of given element.
      const parents: { [key: string]: Point } = {};
      // Cost from start to a point along best known path.
      const costs: { [key: string]: number } = {};

      startPoints.forEach((p) => {
        const key = pointToString(p);
        openSet.add(key, estimateCost(p, endPoints));
        costs[key] = 0;
      });
      let loopsRemain = ManhattanConnectorConfig.maxLoops;
      const endPointsKeys = endPoints.map((p) => pointToString(p));
      let currentDirectionAngle: number | undefined;
      let previousDirectionAngle: number | undefined;
      // Main route finding loop
      while (!openSet.isEmpty() && loopsRemain > 0) {
        const currentKey = openSet.pop();
        if (currentKey == undefined) {
          continue;
        }

        const currentPoint = toPointFromString(currentKey);
        const currentCost = costs[currentKey];
        previousDirectionAngle = currentDirectionAngle;
        currentDirectionAngle = parents[currentKey]
          ? getDirectionAngle(parents[currentKey], currentPoint, opt.directions.length)
          : opt.previousDirAngle != 0
            ? opt.previousDirAngle
            : getDirectionAngle(startCenter, currentPoint, opt.directions.length);

        // if get the endpoint
        if (endPointsKeys.indexOf(currentKey) >= 0) {
          // stop route to enter the end point in opposite direction.
          const directionChangedAngle = getDirectionChange(
            currentDirectionAngle,
            getDirectionAngle(currentPoint, endCenter, opt.directions.length)
          );
          if (currentPoint.equals(endCenter) || directionChangedAngle < 180) {
            opt.previousDirAngle = currentDirectionAngle;
            return reconstructRoute(parents, currentPoint, startCenter, endCenter);
          }
        }

        // Go over all possible directions and find neighbors.
        for (let i = 0; i < opt.directions.length; i++) {
          const direction = opt.directions[i];
          const directionChangedAngle = getDirectionChange(
            currentDirectionAngle,
            direction.angle
          );
          if (
            previousDirectionAngle &&
            directionChangedAngle > ManhattanConnectorConfig.maxAllowedDirectionChange
          ) {
            continue;
          }

          const neighborPoint = movePoint(
            currentPoint.clone(),
            direction.offsetX,
            direction.offsetY
          );
          const neighborKey = pointToString(neighborPoint);
          if (
            openSet.isClose(neighborKey) ||
            !obstacleMap.isPointAccessible(neighborPoint)
          ) {
            continue;
          }

          const costFromStart =
            currentCost + direction.cost + opt.penaltiesGenerator(directionChangedAngle);

          if (!openSet.isOpen(neighborKey) || costFromStart < costs[neighborKey]) {
            // Neighbor point has not been processed yet or the cost of the path
            // from start is lesser than previously calcluated.
            parents[neighborKey] = currentPoint;
            costs[neighborKey] = costFromStart;
            openSet.add(
              neighborKey,
              costFromStart + estimateCost(neighborPoint, endPoints)
            );
          }
        }

        loopsRemain--;
      }
      return null;
    }
    return null;
  }

  function router(
    state: CellState,
    source: CellState,
    target: CellState | null,
    points: Point[],
    result: Point[],
    opt: typeof config
  ) {
    // If edge is dragged after calculation, points will be filled, so fallback to SegmentConnector
    if ((points != null && points.length > 0) || source == null || target == null) {
      SegmentConnector(state, source, target, points, result);
      return;
    }

    let sourceBBox = getCellAbsoluteBounds(source);
    sourceBBox = sourceBBox ? moveAndExpand(sourceBBox, opt.paddingBox) : undefined;
    let targetBBox = getCellAbsoluteBounds(target);
    targetBBox = targetBBox ? moveAndExpand(targetBBox, opt.paddingBox) : undefined;
    const obstacleMap = new ObstacleMap(opt);

    obstacleMap.build(source, target);
    if (!sourceBBox || !targetBBox) {
      // Fallback to OrthogonalConnector
      return OrthogonalConnector(state, source, target, points, result);
    }
    const routePoints = findRoute(sourceBBox, targetBBox, obstacleMap, opt);

    if (routePoints == null || routePoints.length == 0) {
      // Fallback to OrthogonalConnector
      return OrthogonalConnector(state, source, target, points, result);
    }
    if (state.style) {
      if (state.visibleSourceState && routePoints.length > 0) {
        // If there are at least one point, align it to source cell
        alignPointToCell(routePoints[0], state, state.visibleSourceState, true);
      }

      if (state.visibleTargetState && routePoints.length > 1) {
        // If there are more than one point, align last point to target cell
        alignPointToCell(
          routePoints[routePoints.length - 1],
          state,
          state.visibleTargetState,
          false
        );
      }
    }

    // Scaling and translating result points
    const scale = state.view.scale;
    routePoints.forEach((pt) =>
      result.push(
        new Point(
          Math.round((pt.x + state.view.translate.x) * scale * 10) / 10,
          Math.round((pt.y + state.view.translate.y) * scale * 10) / 10
        )
      )
    );
  }

  router(state, source, target, points, result, config);
};
