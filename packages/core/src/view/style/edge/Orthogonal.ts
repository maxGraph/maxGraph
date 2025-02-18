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

import { scaleCellState, scalePointArray } from './shared';
import { DEFAULT_MARKERSIZE, DIRECTION_MASK, NONE } from '../../../util/Constants';
import {
  getBoundingBox,
  getPortConstraints,
  reversePortConstraints,
} from '../../../util/mathUtils';
import type CellState from '../../cell/CellState';
import { OrthogonalConnectorConfig } from '../config';
import type { EdgeStyleFunction } from '../../../types';
import Point from '../../geometry/Point';
import Rectangle from '../../geometry/Rectangle';
import { SegmentConnector } from './Segment';

const dirVectors = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

const wayPoints1 = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];

const routePatterns = [
  [
    [513, 2308, 2081, 2562],
    [513, 1090, 514, 2184, 2114, 2561],
    [513, 1090, 514, 2564, 2184, 2562],
    [513, 2308, 2561, 1090, 514, 2568, 2308],
  ],
  [
    [514, 1057, 513, 2308, 2081, 2562],
    [514, 2184, 2114, 2561],
    [514, 2184, 2562, 1057, 513, 2564, 2184],
    [514, 1057, 513, 2568, 2308, 2561],
  ],
  [
    [1090, 514, 1057, 513, 2308, 2081, 2562],
    [2114, 2561],
    [1090, 2562, 1057, 513, 2564, 2184],
    [1090, 514, 1057, 513, 2308, 2561, 2568],
  ],
  [
    [2081, 2562],
    [1057, 513, 1090, 514, 2184, 2114, 2561],
    [1057, 513, 1090, 514, 2184, 2562, 2564],
    [1057, 2561, 1090, 514, 2568, 2308],
  ],
];

const vertexSeparations: any = [];

const limits = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// const LEFT_MASK = 32;
//
// const TOP_MASK = 64;
//
// const RIGHT_MASK = 128;
//
// const BOTTOM_MASK = 256;
//
// const LEFT = 1;
//
// const TOP = 2;
//
// const RIGHT = 4;
//
// const BOTTOM = 8;

// TODO remove magic numbers
const SIDE_MASK = 480;
// LEFT_MASK | TOP_MASK | RIGHT_MASK | BOTTOM_MASK,

const CENTER_MASK = 512;

const SOURCE_MASK = 1024;

const TARGET_MASK = 2048;

const VERTEX_MASK = 3072;
// SOURCE_MASK | TARGET_MASK,

function getJettySize(state: CellState, isSource: boolean): number {
  const buffer = OrthogonalConnectorConfig.buffer;
  let value =
    (isSource ? state.style.sourceJettySize : state.style.targetJettySize) ??
    state.style.jettySize ??
    buffer;

  if (value === 'auto') {
    // Computes the automatic jetty size
    const type = (isSource ? state.style.startArrow : state.style.endArrow) ?? NONE;

    if (type !== NONE) {
      const size =
        (isSource ? state.style.startSize : state.style.endSize) ?? DEFAULT_MARKERSIZE;
      value = Math.max(2, Math.ceil((size + buffer) / buffer)) * buffer;
    } else {
      value = 2 * buffer;
    }
  }

  return value;
}

/**
 * Implements a local orthogonal router between the given cells.
 *
 * @param state {@link CellState} that represents the edge to be updated.
 * @param sourceScaled {@link CellState} that represents the source terminal.
 * @param targetScaled {@link CellState} that represents the target terminal.
 * @param controlHints List of relative control {@link Point}s.
 * @param result Array of {@link Point}s that represent the actual points of the
 * edge.
 */
export const OrthogonalConnector: EdgeStyleFunction = (
  state: CellState,
  sourceScaled: CellState,
  targetScaled: CellState | null,
  controlHints: Point[],
  result: Point[]
) => {
  // TODO: Figure out what to do when there are nulls in `pts`!
  const pts = <Point[]>(
    (<unknown>scalePointArray(<Point[]>state.absolutePoints, state.view.scale))
  );
  const source = scaleCellState(sourceScaled, state.view.scale);
  const target = scaleCellState(targetScaled, state.view.scale);

  const sourceEdge = source == null ? false : source.cell.isEdge();
  const targetEdge = target == null ? false : target.cell.isEdge();

  const p0 = pts[0];
  const pe = pts[pts.length - 1];

  let sourceX = source != null ? source.x : p0.x;
  let sourceY = source != null ? source.y : p0.y;
  let sourceWidth = source != null ? source.width : 0;
  let sourceHeight = source != null ? source.height : 0;

  let targetX = target != null ? target.x : pe.x;
  let targetY = target != null ? target.y : pe.y;
  let targetWidth = target != null ? target.width : 0;
  let targetHeight = target != null ? target.height : 0;

  let sourceBuffer = getJettySize(state, true);
  let targetBuffer = getJettySize(state, false);

  // Workaround for loop routing within buffer zone
  if (source != null && target === source) {
    targetBuffer = Math.max(sourceBuffer, targetBuffer);
    sourceBuffer = targetBuffer;
  }

  const totalBuffer = targetBuffer + sourceBuffer;

  let tooShort = false;

  // Checks minimum distance for fixed points and falls back to segment connector
  if (p0 != null && pe != null) {
    const dx = pe.x - p0.x;
    const dy = pe.y - p0.y;

    tooShort = dx * dx + dy * dy < totalBuffer * totalBuffer;
  }

  if (
    tooShort ||
    (OrthogonalConnectorConfig.pointsFallback &&
      controlHints != null &&
      controlHints.length > 0) ||
    sourceEdge ||
    targetEdge
  ) {
    SegmentConnector(state, sourceScaled, targetScaled, controlHints, result);
    return;
  }

  // Determine the side(s) of the source and target vertices
  // that the edge may connect to
  // portConstraint [source, target]
  const portConstraint = [DIRECTION_MASK.ALL, DIRECTION_MASK.ALL];
  let rotation = 0;

  if (source != null) {
    portConstraint[0] = getPortConstraints(source, state, true, DIRECTION_MASK.ALL);
    rotation = source.style.rotation ?? 0;

    if (rotation !== 0) {
      const newRect = <Rectangle>(
        getBoundingBox(
          new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight),
          rotation
        )
      );
      sourceX = newRect.x;
      sourceY = newRect.y;
      sourceWidth = newRect.width;
      sourceHeight = newRect.height;
    }
  }

  if (target != null) {
    portConstraint[1] = getPortConstraints(target, state, false, DIRECTION_MASK.ALL);
    rotation = target.style.rotation ?? 0;

    if (rotation !== 0) {
      const newRect = <Rectangle>(
        getBoundingBox(
          new Rectangle(targetX, targetY, targetWidth, targetHeight),
          rotation
        )
      );
      targetX = newRect.x;
      targetY = newRect.y;
      targetWidth = newRect.width;
      targetHeight = newRect.height;
    }
  }

  const dir = [0, 0];

  // Work out which faces of the vertices present against each other
  // in a way that would allow a 3-segment connection if port constraints
  // permitted.
  // geo -> [source, target] [x, y, width, height]
  const geo = [
    [sourceX, sourceY, sourceWidth, sourceHeight],
    [targetX, targetY, targetWidth, targetHeight],
  ];
  const buffer = [sourceBuffer, targetBuffer];

  for (let i = 0; i < 2; i += 1) {
    limits[i][1] = geo[i][0] - buffer[i];
    limits[i][2] = geo[i][1] - buffer[i];
    limits[i][4] = geo[i][0] + geo[i][2] + buffer[i];
    limits[i][8] = geo[i][1] + geo[i][3] + buffer[i];
  }

  // Work out which quad the target is in
  const sourceCenX = geo[0][0] + geo[0][2] / 2.0;
  const sourceCenY = geo[0][1] + geo[0][3] / 2.0;
  const targetCenX = geo[1][0] + geo[1][2] / 2.0;
  const targetCenY = geo[1][1] + geo[1][3] / 2.0;

  const dx = sourceCenX - targetCenX;
  const dy = sourceCenY - targetCenY;

  let quad = 0;

  // 0 | 1
  // -----
  // 3 | 2

  if (dx < 0) {
    if (dy < 0) {
      quad = 2;
    } else {
      quad = 1;
    }
  } else if (dy <= 0) {
    quad = 3;

    // Special case on x = 0 and negative y
    if (dx === 0) {
      quad = 2;
    }
  }

  // Check for connection constraints
  let currentTerm = null;

  if (source != null) {
    currentTerm = p0;
  }

  const constraint = [
    [0.5, 0.5],
    [0.5, 0.5],
  ];

  for (let i = 0; i < 2; i += 1) {
    if (currentTerm != null) {
      constraint[i][0] = (currentTerm.x - geo[i][0]) / geo[i][2];

      if (Math.abs(currentTerm.x - geo[i][0]) <= 1) {
        dir[i] = DIRECTION_MASK.WEST;
      } else if (Math.abs(currentTerm.x - geo[i][0] - geo[i][2]) <= 1) {
        dir[i] = DIRECTION_MASK.EAST;
      }

      constraint[i][1] = (currentTerm.y - geo[i][1]) / geo[i][3];

      if (Math.abs(currentTerm.y - geo[i][1]) <= 1) {
        dir[i] = DIRECTION_MASK.NORTH;
      } else if (Math.abs(currentTerm.y - geo[i][1] - geo[i][3]) <= 1) {
        dir[i] = DIRECTION_MASK.SOUTH;
      }
    }

    currentTerm = null;

    if (target != null) {
      currentTerm = pe;
    }
  }

  const sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3]);
  const sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2]);
  const sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3]);
  const sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2]);

  vertexSeparations[1] = Math.max(sourceLeftDist - totalBuffer, 0);
  vertexSeparations[2] = Math.max(sourceTopDist - totalBuffer, 0);
  vertexSeparations[4] = Math.max(sourceBottomDist - totalBuffer, 0);
  vertexSeparations[3] = Math.max(sourceRightDist - totalBuffer, 0);

  //= =============================================================
  // Start of source and target direction determination

  // Work through the preferred orientations by relative positioning
  // of the vertices and list them in preferred and available order

  const dirPref = [];
  const horPref = [];
  const vertPref = [];

  horPref[0] =
    sourceLeftDist >= sourceRightDist ? DIRECTION_MASK.WEST : DIRECTION_MASK.EAST;
  vertPref[0] =
    sourceTopDist >= sourceBottomDist ? DIRECTION_MASK.NORTH : DIRECTION_MASK.SOUTH;

  horPref[1] = reversePortConstraints(horPref[0]);
  vertPref[1] = reversePortConstraints(vertPref[0]);

  const preferredHorizDist =
    sourceLeftDist >= sourceRightDist ? sourceLeftDist : sourceRightDist;
  const preferredVertDist =
    sourceTopDist >= sourceBottomDist ? sourceTopDist : sourceBottomDist;

  const prefOrdering = [
    [0, 0],
    [0, 0],
  ];
  let preferredOrderSet = false;

  // If the preferred port isn't available, switch it
  for (let i = 0; i < 2; i += 1) {
    if (dir[i] !== 0x0) {
      continue;
    }

    if ((horPref[i] & portConstraint[i]) === 0) {
      horPref[i] = reversePortConstraints(horPref[i]);
    }

    if ((vertPref[i] & portConstraint[i]) === 0) {
      vertPref[i] = reversePortConstraints(vertPref[i]);
    }

    prefOrdering[i][0] = vertPref[i];
    prefOrdering[i][1] = horPref[i];
  }

  if (preferredVertDist > 0 && preferredHorizDist > 0) {
    // Possibility of two segment edge connection
    if ((horPref[0] & portConstraint[0]) > 0 && (vertPref[1] & portConstraint[1]) > 0) {
      prefOrdering[0][0] = horPref[0];
      prefOrdering[0][1] = vertPref[0];
      prefOrdering[1][0] = vertPref[1];
      prefOrdering[1][1] = horPref[1];
      preferredOrderSet = true;
    } else if (
      (vertPref[0] & portConstraint[0]) > 0 &&
      (horPref[1] & portConstraint[1]) > 0
    ) {
      prefOrdering[0][0] = vertPref[0];
      prefOrdering[0][1] = horPref[0];
      prefOrdering[1][0] = horPref[1];
      prefOrdering[1][1] = vertPref[1];
      preferredOrderSet = true;
    }
  }

  if (preferredVertDist > 0 && !preferredOrderSet) {
    prefOrdering[0][0] = vertPref[0];
    prefOrdering[0][1] = horPref[0];
    prefOrdering[1][0] = vertPref[1];
    prefOrdering[1][1] = horPref[1];
    preferredOrderSet = true;
  }

  if (preferredHorizDist > 0 && !preferredOrderSet) {
    prefOrdering[0][0] = horPref[0];
    prefOrdering[0][1] = vertPref[0];
    prefOrdering[1][0] = horPref[1];
    prefOrdering[1][1] = vertPref[1];
    preferredOrderSet = true;
  }

  // The source and target prefs are now an ordered list of
  // the preferred port selections
  // If the list contains gaps, compact it

  for (let i = 0; i < 2; i += 1) {
    if (dir[i] !== 0x0) {
      continue;
    }

    if ((prefOrdering[i][0] & portConstraint[i]) === 0) {
      prefOrdering[i][0] = prefOrdering[i][1];
    }

    dirPref[i] = prefOrdering[i][0] & portConstraint[i];
    dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8;
    dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16;
    dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24;

    if ((dirPref[i] & 0xf) === 0) {
      dirPref[i] = dirPref[i] << 8;
    }

    if ((dirPref[i] & 0xf00) === 0) {
      dirPref[i] = (dirPref[i] & 0xf) | (dirPref[i] >> 8);
    }

    if ((dirPref[i] & 0xf0000) === 0) {
      dirPref[i] = (dirPref[i] & 0xffff) | ((dirPref[i] & 0xf000000) >> 8);
    }

    dir[i] = dirPref[i] & 0xf;

    if (
      portConstraint[i] === DIRECTION_MASK.WEST ||
      portConstraint[i] === DIRECTION_MASK.NORTH ||
      portConstraint[i] === DIRECTION_MASK.EAST ||
      portConstraint[i] === DIRECTION_MASK.SOUTH
    ) {
      dir[i] = portConstraint[i];
    }
  }

  //= =============================================================
  // End of source and target direction determination

  let sourceIndex = dir[0] === DIRECTION_MASK.EAST ? 3 : dir[0];
  let targetIndex = dir[1] === DIRECTION_MASK.EAST ? 3 : dir[1];

  sourceIndex -= quad;
  targetIndex -= quad;

  if (sourceIndex < 1) {
    sourceIndex += 4;
  }

  if (targetIndex < 1) {
    targetIndex += 4;
  }

  const routePattern = routePatterns[sourceIndex - 1][targetIndex - 1];

  wayPoints1[0][0] = geo[0][0];
  wayPoints1[0][1] = geo[0][1];

  switch (dir[0]) {
    case DIRECTION_MASK.WEST:
      wayPoints1[0][0] -= sourceBuffer;
      wayPoints1[0][1] += constraint[0][1] * geo[0][3];
      break;
    case DIRECTION_MASK.SOUTH:
      wayPoints1[0][0] += constraint[0][0] * geo[0][2];
      wayPoints1[0][1] += geo[0][3] + sourceBuffer;
      break;
    case DIRECTION_MASK.EAST:
      wayPoints1[0][0] += geo[0][2] + sourceBuffer;
      wayPoints1[0][1] += constraint[0][1] * geo[0][3];
      break;
    case DIRECTION_MASK.NORTH:
      wayPoints1[0][0] += constraint[0][0] * geo[0][2];
      wayPoints1[0][1] -= sourceBuffer;
      break;
  }

  let currentIndex = 0;

  // Orientation, 0 horizontal, 1 vertical
  let lastOrientation =
    (dir[0] & (DIRECTION_MASK.EAST | DIRECTION_MASK.WEST)) > 0 ? 0 : 1;
  const initialOrientation = lastOrientation;
  let currentOrientation = 0;

  for (let i = 0; i < routePattern.length; i += 1) {
    const nextDirection = routePattern[i] & 0xf;

    // Rotate the index of this direction by the quad
    // to get the real direction
    let directionIndex = nextDirection === DIRECTION_MASK.EAST ? 3 : nextDirection;

    directionIndex += quad;

    if (directionIndex > 4) {
      directionIndex -= 4;
    }

    const direction = dirVectors[directionIndex - 1];

    currentOrientation = directionIndex % 2 > 0 ? 0 : 1;
    // Only update the current index if the point moved
    // in the direction of the current segment move,
    // otherwise the same point is moved until there is
    // a segment direction change
    if (currentOrientation !== lastOrientation) {
      currentIndex++;
      // Copy the previous way point into the new one
      // We can't base the new position on index - 1
      // because sometime elbows turn out not to exist,
      // then we'd have to rewind.
      wayPoints1[currentIndex][0] = wayPoints1[currentIndex - 1][0];
      wayPoints1[currentIndex][1] = wayPoints1[currentIndex - 1][1];
    }

    const tar = (routePattern[i] & TARGET_MASK) > 0;
    const sou = (routePattern[i] & SOURCE_MASK) > 0;
    let side = (routePattern[i] & SIDE_MASK) >> 5;
    side <<= quad;

    if (side > 0xf) {
      side >>= 4;
    }

    const center = (routePattern[i] & CENTER_MASK) > 0;

    if ((sou || tar) && side < 9) {
      let limit = 0;
      const souTar = sou ? 0 : 1;

      if (center && currentOrientation === 0) {
        limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2];
      } else if (center) {
        limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3];
      } else {
        limit = limits[souTar][side];
      }

      if (currentOrientation === 0) {
        const lastX = wayPoints1[currentIndex][0];
        const deltaX = (limit - lastX) * direction[0];

        if (deltaX > 0) {
          wayPoints1[currentIndex][0] += direction[0] * deltaX;
        }
      } else {
        const lastY = wayPoints1[currentIndex][1];
        const deltaY = (limit - lastY) * direction[1];

        if (deltaY > 0) {
          wayPoints1[currentIndex][1] += direction[1] * deltaY;
        }
      }
    } else if (center) {
      // Which center we're travelling to depend on the current direction
      wayPoints1[currentIndex][0] +=
        direction[0] * Math.abs(vertexSeparations[directionIndex] / 2);
      wayPoints1[currentIndex][1] +=
        direction[1] * Math.abs(vertexSeparations[directionIndex] / 2);
    }

    if (
      currentIndex > 0 &&
      wayPoints1[currentIndex][currentOrientation] ===
        wayPoints1[currentIndex - 1][currentOrientation]
    ) {
      currentIndex--;
    } else {
      lastOrientation = currentOrientation;
    }
  }

  for (let i = 0; i <= currentIndex; i += 1) {
    if (i === currentIndex) {
      // Last point can cause last segment to be in
      // same direction as jetty/approach. If so,
      // check the number of points is consistent
      // with the relative orientation of source and target
      // jx. Same orientation requires an even
      // number of turns (points), different requires
      // odd.
      const targetOrientation =
        (dir[1] & (DIRECTION_MASK.EAST | DIRECTION_MASK.WEST)) > 0 ? 0 : 1;
      const sameOrient = targetOrientation === initialOrientation ? 0 : 1;

      // (currentIndex + 1) % 2 is 0 for even number of points,
      // 1 for odd
      if (sameOrient !== (currentIndex + 1) % 2) {
        // The last point isn't required
        break;
      }
    }

    result.push(
      new Point(
        Math.round(wayPoints1[i][0] * state.view.scale * 10) / 10,
        Math.round(wayPoints1[i][1] * state.view.scale * 10) / 10
      )
    );
  }

  // Removes duplicates
  let index = 1;

  while (index < result.length) {
    if (
      result[index - 1] == null ||
      result[index] == null ||
      result[index - 1].x !== result[index].x ||
      result[index - 1].y !== result[index].y
    ) {
      index++;
    } else {
      result.splice(index, 1);
    }
  }
};
