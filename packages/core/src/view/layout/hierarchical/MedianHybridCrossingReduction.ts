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

import HierarchicalLayout from '../HierarchicalLayout';
import GraphAbstractHierarchyCell from '../datatypes/GraphAbstractHierarchyCell';
import GraphHierarchyModel from './GraphHierarchyModel';
import HierarchicalLayoutStage from './HierarchicalLayoutStage';
import MedianCellSorter from '../util/MedianCellSorter';
import SwimlaneLayout from '../SwimlaneLayout';

/**
 * Sets the horizontal locations of node and edge dummy nodes on each layer.
 * Uses median down and up weightings as well heuristic to straighten edges as
 * far as possible.
 *
 * @category Layout
 */
class MedianHybridCrossingReduction extends HierarchicalLayoutStage {
  constructor(layout: HierarchicalLayout | SwimlaneLayout) {
    super();

    this.layout = layout;
  }

  /**
   * Reference to the enclosing <HierarchicalLayout>.
   */
  layout: HierarchicalLayout | SwimlaneLayout;

  /**
   * The maximum number of iterations to perform whilst reducing edge
   * crossings. Default is 24.
   */
  maxIterations = 24;

  /**
   * Stores each rank as a collection of cells in the best order found for
   * each layer so far
   */
  nestedBestRanks: GraphAbstractHierarchyCell[][] | null = null;

  /**
   * The total number of crossings found in the best configuration so far
   */
  currentBestCrossings = 0;

  /**
   * The total number of crossings found in the best configuration so far
   */
  iterationsWithoutImprovement = 0;

  /**
   * The total number of crossings found in the best configuration so far
   */
  maxNoImprovementIterations = 2;

  /**
   * Performs a vertex ordering within ranks as described by Gansner et al
   * 1993
   */
  execute(parent: any) {
    const model = <GraphHierarchyModel>this.layout.getDataModel();
    let ranks = <GraphAbstractHierarchyCell[][]>model.ranks;

    // Stores initial ordering as being the best one found so far
    this.nestedBestRanks = [];

    for (let i = 0; i < ranks.length; i += 1) {
      this.nestedBestRanks[i] = ranks[i].slice();
    }

    let iterationsWithoutImprovement = 0;
    let currentBestCrossings = this.calculateCrossings(model);

    for (
      let i = 0;
      i < this.maxIterations &&
      iterationsWithoutImprovement < this.maxNoImprovementIterations;
      i++
    ) {
      this.weightedMedian(i, model);
      this.transpose(i, model);
      const candidateCrossings = this.calculateCrossings(model);

      if (candidateCrossings < currentBestCrossings) {
        currentBestCrossings = candidateCrossings;
        iterationsWithoutImprovement = 0;

        // Store the current rankings as the best ones
        for (let j = 0; j < this.nestedBestRanks.length; j += 1) {
          const rank = ranks[j];

          for (let k = 0; k < rank.length; k += 1) {
            const cell = rank[k];
            this.nestedBestRanks[j][<number>cell.getGeneralPurposeVariable(j)] = cell;
          }
        }
      } else {
        // Increase count of iterations where we haven't improved the
        // layout
        iterationsWithoutImprovement += 1;

        // Restore the best values to the cells
        for (let j = 0; j < this.nestedBestRanks.length; j += 1) {
          const rank = ranks[j];

          for (let k = 0; k < rank.length; k += 1) {
            const cell = rank[k];
            cell.setGeneralPurposeVariable(j, k);
          }
        }
      }

      if (currentBestCrossings === 0) {
        // Do nothing further
        break;
      }
    }

    // Store the best rankings but in the model
    ranks = [];
    const rankList: GraphAbstractHierarchyCell[][] = [];
    for (let i = 0; i < model.maxRank + 1; i += 1) {
      rankList[i] = [];
      ranks[i] = rankList[i];
    }

    for (let i = 0; i < this.nestedBestRanks.length; i += 1) {
      for (let j = 0; j < this.nestedBestRanks[i].length; j += 1) {
        rankList[i].push(this.nestedBestRanks[i][j]);
      }
    }
    model.ranks = ranks;
  }

  /**
   * Calculates the total number of edge crossing in the current graph.
   * Returns the current number of edge crossings in the hierarchy graph
   * model in the current candidate layout
   *
   * @param model the internal model describing the hierarchy
   */
  calculateCrossings(model: GraphHierarchyModel) {
    const ranks = <GraphAbstractHierarchyCell[][]>model.ranks;
    const numRanks = ranks.length;
    let totalCrossings = 0;

    for (let i = 1; i < numRanks; i += 1) {
      totalCrossings += this.calculateRankCrossing(i, model);
    }
    return totalCrossings;
  }

  /**
   * Calculates the number of edges crossings between the specified rank and
   * the rank below it. Returns the number of edges crossings with the rank
   * beneath
   *
   * @param i  the topmost rank of the pair ( higher rank value )
   * @param model the internal model describing the hierarchy
   */
  calculateRankCrossing(i: number, model: GraphHierarchyModel) {
    let totalCrossings = 0;
    const ranks = <GraphAbstractHierarchyCell[][]>model.ranks;
    const rank = ranks[i];
    const previousRank = ranks[i - 1];

    const tmpIndices = [];

    // Iterate over the top rank and fill in the connection information
    for (let j = 0; j < rank.length; j += 1) {
      const node = rank[j];
      const rankPosition = <number>node.getGeneralPurposeVariable(i);
      const connectedCells = <GraphAbstractHierarchyCell[]>(
        node.getPreviousLayerConnectedCells(i)
      );
      const nodeIndices = [];

      for (let k = 0; k < connectedCells.length; k += 1) {
        const connectedNode = connectedCells[k];
        const otherCellRankPosition = <number>(
          connectedNode.getGeneralPurposeVariable(i - 1)
        );
        nodeIndices.push(otherCellRankPosition);
      }

      nodeIndices.sort((x: number, y: number) => {
        return x - y;
      });
      tmpIndices[rankPosition] = nodeIndices;
    }

    let indices: number[] = [];
    for (let j = 0; j < tmpIndices.length; j++) {
      indices = indices.concat(tmpIndices[j]);
    }

    let firstIndex = 1;
    while (firstIndex < previousRank.length) {
      firstIndex <<= 1;
    }

    const treeSize = 2 * firstIndex - 1;
    firstIndex -= 1;

    const tree = [];
    for (let j = 0; j < treeSize; ++j) {
      tree[j] = 0;
    }

    for (let j = 0; j < indices.length; j += 1) {
      const index = indices[j];
      let treeIndex = index + firstIndex;
      ++tree[treeIndex];

      while (treeIndex > 0) {
        if (treeIndex % 2) {
          totalCrossings += tree[treeIndex + 1];
        }

        treeIndex = (treeIndex - 1) >> 1;
        ++tree[treeIndex];
      }
    }
    return totalCrossings;
  }

  /**
   * Takes each possible adjacent cell pair on each rank and checks if
   * swapping them around reduces the number of crossing
   *
   * @param mainLoopIteration the iteration number of the main loop
   * @param model the internal model describing the hierarchy
   */
  transpose(mainLoopIteration: number, model: GraphHierarchyModel) {
    let improved = true;

    // Track the number of iterations in case of looping
    let count = 0;
    const maxCount = 10;
    while (improved && count++ < maxCount) {
      // On certain iterations allow allow swapping of cell pairs with
      // equal edge crossings switched or not switched. This help to
      // nudge a stuck layout into a lower crossing total.
      const nudge = mainLoopIteration % 2 === 1 && count % 2 === 1;
      improved = false;
      const ranks = <GraphAbstractHierarchyCell[][]>model.ranks;

      for (let i = 0; i < ranks.length; i += 1) {
        const rank = ranks[i];
        const orderedCells = [];

        for (let j = 0; j < rank.length; j++) {
          const cell = rank[j];
          let tempRank = <number>cell.getGeneralPurposeVariable(i);

          // FIXME: Workaround to avoid negative tempRanks
          if (tempRank < 0) {
            tempRank = j;
          }
          orderedCells[tempRank] = cell;
        }

        let leftCellAboveConnections: GraphAbstractHierarchyCell[] | null = null;
        let leftCellBelowConnections: GraphAbstractHierarchyCell[] | null = null;
        let rightCellAboveConnections: GraphAbstractHierarchyCell[] | null = null;
        let rightCellBelowConnections: GraphAbstractHierarchyCell[] | null = null;

        let leftAbovePositions: number[] | null = null;
        let leftBelowPositions: number[] | null = null;
        let rightAbovePositions: number[] | null = null;
        let rightBelowPositions: number[] | null = null;

        let leftCell = null;
        let rightCell = null;

        for (let j = 0; j < rank.length - 1; j++) {
          // For each intra-rank adjacent pair of cells
          // see if swapping them around would reduce the
          // number of edges crossing they cause in total
          // On every cell pair except the first on each rank, we
          // can save processing using the previous values for the
          // right cell on the new left cell
          if (j === 0) {
            leftCell = orderedCells[j];
            leftCellAboveConnections = <GraphAbstractHierarchyCell[]>(
              leftCell.getNextLayerConnectedCells(i)
            );
            leftCellBelowConnections = <GraphAbstractHierarchyCell[]>(
              leftCell.getPreviousLayerConnectedCells(i)
            );
            leftAbovePositions = [];
            leftBelowPositions = [];

            for (let k = 0; k < leftCellAboveConnections.length; k++) {
              leftAbovePositions[k] = <number>(
                leftCellAboveConnections[k].getGeneralPurposeVariable(i + 1)
              );
            }

            for (let k = 0; k < leftCellBelowConnections.length; k++) {
              leftBelowPositions[k] = <number>(
                leftCellBelowConnections[k].getGeneralPurposeVariable(i - 1)
              );
            }
          } else {
            leftCellAboveConnections = rightCellAboveConnections;
            leftCellBelowConnections = rightCellBelowConnections;
            leftAbovePositions = rightAbovePositions;
            leftBelowPositions = rightBelowPositions;
            leftCell = rightCell;
          }

          rightCell = orderedCells[j + 1];
          rightCellAboveConnections = <GraphAbstractHierarchyCell[]>(
            rightCell.getNextLayerConnectedCells(i)
          );
          rightCellBelowConnections = <GraphAbstractHierarchyCell[]>(
            rightCell.getPreviousLayerConnectedCells(i)
          );

          rightAbovePositions = [];
          rightBelowPositions = [];

          for (let k = 0; k < rightCellAboveConnections.length; k++) {
            rightAbovePositions[k] = <number>(
              rightCellAboveConnections[k].getGeneralPurposeVariable(i + 1)
            );
          }

          for (let k = 0; k < rightCellBelowConnections.length; k++) {
            rightBelowPositions[k] = <number>(
              rightCellBelowConnections[k].getGeneralPurposeVariable(i - 1)
            );
          }

          let totalCurrentCrossings = 0;
          let totalSwitchedCrossings = 0;

          for (let k = 0; k < (<number[]>leftAbovePositions).length; k += 1) {
            for (let ik = 0; ik < rightAbovePositions.length; ik += 1) {
              if ((<number[]>leftAbovePositions)[k] > rightAbovePositions[ik]) {
                totalCurrentCrossings += 1;
              }

              if ((<number[]>leftAbovePositions)[k] < rightAbovePositions[ik]) {
                totalSwitchedCrossings += 1;
              }
            }
          }

          for (let k = 0; k < (<number[]>leftBelowPositions).length; k += 1) {
            for (let ik = 0; ik < rightBelowPositions.length; ik += 1) {
              if ((<number[]>leftBelowPositions)[k] > rightBelowPositions[ik]) {
                totalCurrentCrossings += 1;
              }

              if ((<number[]>leftBelowPositions)[k] < rightBelowPositions[ik]) {
                totalSwitchedCrossings += 1;
              }
            }
          }

          if (
            totalSwitchedCrossings < totalCurrentCrossings ||
            (totalSwitchedCrossings === totalCurrentCrossings && nudge)
          ) {
            const temp = <number>(
              (<GraphAbstractHierarchyCell>leftCell).getGeneralPurposeVariable(i)
            );
            (<GraphAbstractHierarchyCell>leftCell).setGeneralPurposeVariable(
              i,
              <number>rightCell.getGeneralPurposeVariable(i)
            );
            rightCell.setGeneralPurposeVariable(i, temp);

            // With this pair exchanged we have to switch all of
            // values for the left cell to the right cell so the
            // next iteration for this rank uses it as the left
            // cell again
            rightCellAboveConnections = leftCellAboveConnections;
            rightCellBelowConnections = leftCellBelowConnections;
            rightAbovePositions = leftAbovePositions;
            rightBelowPositions = leftBelowPositions;
            rightCell = leftCell;

            if (!nudge) {
              // Don't count nudges as improvement or we'll end
              // up stuck in two combinations and not finishing
              // as early as we should
              improved = true;
            }
          }
        }
      }
    }
  }

  /**
   * Sweeps up or down the layout attempting to minimise the median placement
   * of connected cells on adjacent ranks
   *
   * @param iteration the iteration number of the main loop
   * @param model the internal model describing the hierarchy
   */
  weightedMedian(iteration: number, model: GraphHierarchyModel) {
    // Reverse sweep direction each time through this method
    const downwardSweep = iteration % 2 === 0;
    if (downwardSweep) {
      for (let j = model.maxRank - 1; j >= 0; j -= 1) {
        this.medianRank(j, downwardSweep);
      }
    } else {
      for (let j = 1; j < model.maxRank; j += 1) {
        this.medianRank(j, downwardSweep);
      }
    }
  }

  /**
   * Attempts to minimise the median placement of connected cells on this rank
   * and one of the adjacent ranks
   *
   * @param rankValue the layer number of this rank
   * @param downwardSweep whether or not this is a downward sweep through the graph
   */
  medianRank(rankValue: number, downwardSweep: boolean) {
    const nestedBestRanks = <{ [key: number]: GraphAbstractHierarchyCell[] }>(
      this.nestedBestRanks
    );
    const numCellsForRank = nestedBestRanks[rankValue].length;
    const medianValues = [];
    const reservedPositions: { [key: number]: boolean } = {};

    for (let i = 0; i < numCellsForRank; i += 1) {
      const cell = nestedBestRanks[rankValue][i];
      const sorterEntry = new MedianCellSorter();
      sorterEntry.cell = cell;

      // Flip whether or not equal medians are flipped on up and down
      // sweeps
      // TODO re-implement some kind of nudge
      // medianValues[i].nudge = !downwardSweep;
      const nextLevelConnectedCells = downwardSweep
        ? cell.getNextLayerConnectedCells(rankValue)
        : cell.getPreviousLayerConnectedCells(rankValue);

      const nextRankValue = downwardSweep ? rankValue + 1 : rankValue - 1;

      if (nextLevelConnectedCells != null && nextLevelConnectedCells.length !== 0) {
        sorterEntry.medianValue = this.medianValue(
          nextLevelConnectedCells,
          nextRankValue
        );
        medianValues.push(sorterEntry);
      } else {
        // Nodes with no adjacent vertices are flagged in the reserved array
        // to indicate they should be left in their current position.
        reservedPositions[<number>cell.getGeneralPurposeVariable(rankValue)] = true;
      }
    }

    medianValues.sort(new MedianCellSorter().compare);

    // Set the new position of each node within the rank using
    // its temp variable
    for (let i = 0; i < numCellsForRank; i += 1) {
      if (reservedPositions[i] == null) {
        const cell = <GraphAbstractHierarchyCell>(
          (<MedianCellSorter>medianValues.shift()).cell
        );
        cell.setGeneralPurposeVariable(rankValue, i);
      }
    }
  }

  /**
   * Calculates the median rank order positioning for the specified cell using
   * the connected cells on the specified rank. Returns the median rank
   * ordering value of the connected cells
   *
   * @param connectedCells the cells on the specified rank connected to the
   * specified cell
   * @param rankValue the rank that the connected cell lie upon
   */
  medianValue(connectedCells: GraphAbstractHierarchyCell[], rankValue: number) {
    const medianValues = [];
    let arrayCount = 0;

    for (let i = 0; i < connectedCells.length; i += 1) {
      const cell = connectedCells[i];
      medianValues[arrayCount++] = <number>cell.getGeneralPurposeVariable(rankValue);
    }

    // Sort() sorts lexicographically by default (i.e. 11 before 9) so force
    // numerical order sort
    medianValues.sort((a, b) => {
      return a - b;
    });

    if (arrayCount % 2 === 1) {
      // For odd numbers of adjacent vertices return the median
      return medianValues[Math.floor(arrayCount / 2)];
    }
    if (arrayCount === 2) {
      return (medianValues[0] + medianValues[1]) / 2.0;
    }
    const medianPoint = arrayCount / 2;
    const leftMedian = medianValues[medianPoint - 1] - medianValues[0];
    const rightMedian = medianValues[arrayCount - 1] - medianValues[medianPoint];

    return (
      (medianValues[medianPoint - 1] * rightMedian +
        medianValues[medianPoint] * leftMedian) /
      (leftMedian + rightMedian)
    );
  }
}

export default MedianHybridCrossingReduction;
