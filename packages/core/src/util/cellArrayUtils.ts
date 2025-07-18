/*
Copyright 2022-present The maxGraph project Contributors

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

import Cell from '../view/cell/Cell.js';
import ObjectIdentity from './ObjectIdentity.js';

/**
 * Returns all opposite vertices terminal for the given edges, only returning sources and/or targets as specified.
 * The result is returned as an array of {@link Cell}.
 *
 * @param edges Array of {Cell} that contain the edges to be examined.
 * @param {Cell} terminal  that specifies the known end of the edges.
 * @param includeSources  Boolean that specifies if source terminals should be included in the result. Default is `true`.
 * @param includeTargets  Boolean that specifies if target terminals should be included in the result. Default is `true`.
 */
export const getOpposites = (
  edges: Cell[],
  terminal: Cell,
  includeSources = true,
  includeTargets = true
): Cell[] => {
  return edges.reduce((terminals, edge) => {
    const source = edge.getTerminal(true);
    const target = edge.getTerminal(false);

    // Checks if the terminal is the source of the edge and if the target should be stored in the result
    if (source === terminal && target != null && target !== terminal && includeTargets) {
      terminals.push(target);
    }
    // Checks if the terminal is the target of the edge and if the source should be stored in the result
    else if (
      target === terminal &&
      source != null &&
      source !== terminal &&
      includeSources
    ) {
      terminals.push(source);
    }

    return terminals;
  }, [] as Cell[]);
};

/**
 * Returns the topmost cells of the hierarchy in an array that contains no
 * descendants for each {@link Cell} that it contains. Duplicates should be
 * removed in the cells array to improve performance.
 */
export const getTopmostCells = (cells: Cell[]) => {
  const coveredEntries = new Map<Cell, boolean>();
  const tmp = [] as Cell[];

  for (let i = 0; i < cells.length; i += 1) {
    coveredEntries.set(cells[i], true);
  }

  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    let topmost = true;
    let parent = cell.getParent();

    while (parent != null) {
      if (coveredEntries.get(parent)) {
        topmost = false;
        break;
      }
      parent = parent.getParent();
    }

    if (topmost) {
      tmp.push(cell);
    }
  }

  return tmp;
};

/**
 * Returns an array that represents the set (no duplicates) of all parents
 * for the given array of cells.
 */
export const getParents = (cells: Cell[]) => {
  const parents = [];
  const coveredParents = new Map<Cell, boolean>();

  for (const cell of cells) {
    const parent = cell.getParent();
    if (parent && !coveredParents.get(parent)) {
      coveredParents.set(parent, true);
      parents.push(parent);
    }
  }

  return parents;
};

/**
 * Returns a deep clone of the given {@link Cell}` (including the children) which is created using {@link cloneCells}`.
 *
 * @param cell {@link Cell} to be cloned. Default is `null`.
 * @param includeChildren Boolean indicating if the cells should be cloned with all descendants. Default is `true`.
 */
export const cloneCell = (
  cell: Cell | null = null,
  includeChildren = true
): Cell | null => {
  if (!cell) {
    return null;
  }

  return cloneCells([cell], includeChildren)[0];
};

/**
 * Returns an array of clones for the given array of {@link Cell}`.
 * Depending on the value of includeChildren, a deep clone is created for
 * each cell. Connections are restored based if the corresponding
 * cell is contained in the provided in array.
 *
 * @param cells The cells to clone
 * @param includeChildren  Boolean indicating if the cells should be cloned with all descendants.
 * @param mapping  Optional mapping for existing clones.
 */
export const cloneCells = (
  cells: Cell[],
  includeChildren = true,
  mapping: any = {}
): Cell[] => {
  const clones = [] as Cell[];

  for (const cell of cells) {
    clones.push(cloneCellImpl(cell, mapping, includeChildren));
  }

  for (let i = 0; i < clones.length; i += 1) {
    if (clones[i] != null) {
      restoreClone(<Cell>clones[i], cells[i], mapping);
    }
  }

  return clones;
};

/**
 * Inner helper method for cloning cells recursively.
 *
 * @private
 */
const cloneCellImpl = (cell: Cell, mapping: any = {}, includeChildren = false): Cell => {
  const identity = <string>ObjectIdentity.get(cell);
  let clone = mapping ? mapping[identity] : null;

  if (clone == null) {
    clone = cell.clone();
    mapping[identity] = clone;

    if (includeChildren) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const cloneChild = cloneCellImpl(<Cell>cell.getChildAt(i), mapping, true);
        clone.insert(cloneChild);
      }
    }
  }
  return clone;
};

/**
 * Inner helper method for restoring the connections in a network of cloned cells.
 *
 * @private
 */
const restoreClone = (clone: Cell, cell: Cell, mapping: any): void => {
  const source = cell.getTerminal(true);
  if (source != null) {
    const tmp = mapping[<string>ObjectIdentity.get(source)];
    if (tmp != null) {
      tmp.insertEdge(clone, true);
    }
  }

  const target = cell.getTerminal(false);
  if (target != null) {
    const tmp = mapping[<string>ObjectIdentity.get(target)];
    if (tmp != null) {
      tmp.insertEdge(clone, false);
    }
  }

  const childCount = clone.getChildCount();
  for (let i = 0; i < childCount; i += 1) {
    restoreClone(<Cell>clone.getChildAt(i), <Cell>cell.getChildAt(i), mapping);
  }
};
