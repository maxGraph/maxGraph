/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import HierarchicalLayoutStage from './HierarchicalLayoutStage';
import MedianCellSorter from './MedianCellSorter';

/**
 * Sets the horizontal locations of node and edge dummy nodes on each layer.
 * Uses median down and up weighings as well heuristic to straighten edges as
 * far as possible.
 *
 * Constructor: mxMedianHybridCrossingReduction
 *
 * Creates a coordinate assignment.
 *
 * Arguments:
 *
 * intraCellSpacing - the minimum buffer between cells on the same rank
 * interRankCellSpacing - the minimum distance between cells on adjacent ranks
 * orientation - the position of the root node(s) relative to the graph
 * initialX - the leftmost coordinate node placement starts at
 */
class MedianHybridCrossingReduction extends HierarchicalLayoutStage {
  constructor(layout) {
    super();

    this.layout = layout;
  }

  /**
   * Reference to the enclosing <HierarchicalLayout>.
   */
  layout = null;

  /**
   * The maximum number of iterations to perform whilst reducing edge
   * crossings. Default is 24.
   */
  maxIterations = 24;

  /**
   * Stores each rank as a collection of cells in the best order found for
   * each layer so far
   */
  nestedBestRanks = null;

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
   * Class: MedianCellSorter
   *
   * A utility class used to track cells whilst sorting occurs on the median
   * values. Does not violate (x.compareTo(y)==0) == (x.equals(y))
   *
   * Constructor: MedianCellSorter
   *
   * Constructs a new median cell sorter.
   */
  function;

  /**
   * Performs a vertex ordering within ranks as described by Gansner et al
   * 1993
   */
  execute(parent) {
    const model = this.layout.getModel();

    // Stores initial ordering as being the best one found so far
    this.nestedBestRanks = [];

    for (let i = 0; i < model.ranks.length; i += 1) {
      this.nestedBestRanks[i] = model.ranks[i].slice();
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
          const rank = model.ranks[j];

          for (let k = 0; k < rank.length; k += 1) {
            const cell = rank[k];
            this.nestedBestRanks[j][cell.getGeneralPurposeVariable(j)] = cell;
          }
        }
      } else {
        // Increase count of iterations where we haven't improved the
        // layout
        iterationsWithoutImprovement += 1;

        // Restore the best values to the cells
        for (let j = 0; j < this.nestedBestRanks.length; j += 1) {
          const rank = model.ranks[j];

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
    const ranks = [];
    const rankList = [];

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
  calculateCrossings(model) {
    const numRanks = model.ranks.length;
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
  calculateRankCrossing(i, model) {
    let totalCrossings = 0;
    const rank = model.ranks[i];
    const previousRank = model.ranks[i - 1];

    const tmpIndices = [];

    // Iterate over the top rank and fill in the connection information
    for (let j = 0; j < rank.length; j += 1) {
      const node = rank[j];
      const rankPosition = node.getGeneralPurposeVariable(i);
      const connectedCells = node.getPreviousLayerConnectedCells(i);
      const nodeIndices = [];

      for (let k = 0; k < connectedCells.length; k += 1) {
        const connectedNode = connectedCells[k];
        const otherCellRankPosition = connectedNode.getGeneralPurposeVariable(
          i - 1
        );
        nodeIndices.push(otherCellRankPosition);
      }

      nodeIndices.sort((x, y) => {
        return x - y;
      });
      tmpIndices[rankPosition] = nodeIndices;
    }

    let indices = [];

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
  transpose(mainLoopIteration, model) {
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

      for (let i = 0; i < model.ranks.length; i += 1) {
        const rank = model.ranks[i];
        const orderedCells = [];

        for (let j = 0; j < rank.length; j++) {
          const cell = rank[j];
          let tempRank = cell.getGeneralPurposeVariable(i);

          // FIXME: Workaround to avoid negative tempRanks
          if (tempRank < 0) {
            tempRank = j;
          }
          orderedCells[tempRank] = cell;
        }

        let leftCellAboveConnections = null;
        let leftCellBelowConnections = null;
        let rightCellAboveConnections = null;
        let rightCellBelowConnections = null;

        let leftAbovePositions = null;
        let leftBelowPositions = null;
        let rightAbovePositions = null;
        let rightBelowPositions = null;

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
            leftCellAboveConnections = leftCell.getNextLayerConnectedCells(i);
            leftCellBelowConnections = leftCell.getPreviousLayerConnectedCells(
              i
            );
            leftAbovePositions = [];
            leftBelowPositions = [];

            for (let k = 0; k < leftCellAboveConnections.length; k++) {
              leftAbovePositions[k] = leftCellAboveConnections[
                k
              ].getGeneralPurposeVariable(i + 1);
            }

            for (let k = 0; k < leftCellBelowConnections.length; k++) {
              leftBelowPositions[k] = leftCellBelowConnections[
                k
              ].getGeneralPurposeVariable(i - 1);
            }
          } else {
            leftCellAboveConnections = rightCellAboveConnections;
            leftCellBelowConnections = rightCellBelowConnections;
            leftAbovePositions = rightAbovePositions;
            leftBelowPositions = rightBelowPositions;
            leftCell = rightCell;
          }

          rightCell = orderedCells[j + 1];
          rightCellAboveConnections = rightCell.getNextLayerConnectedCells(i);
          rightCellBelowConnections = rightCell.getPreviousLayerConnectedCells(
            i
          );

          rightAbovePositions = [];
          rightBelowPositions = [];

          for (let k = 0; k < rightCellAboveConnections.length; k++) {
            rightAbovePositions[k] = rightCellAboveConnections[
              k
            ].getGeneralPurposeVariable(i + 1);
          }

          for (let k = 0; k < rightCellBelowConnections.length; k++) {
            rightBelowPositions[k] = rightCellBelowConnections[
              k
            ].getGeneralPurposeVariable(i - 1);
          }

          let totalCurrentCrossings = 0;
          let totalSwitchedCrossings = 0;

          for (let k = 0; k < leftAbovePositions.length; k += 1) {
            for (let ik = 0; ik < rightAbovePositions.length; ik += 1) {
              if (leftAbovePositions[k] > rightAbovePositions[ik]) {
                totalCurrentCrossings += 1;
              }

              if (leftAbovePositions[k] < rightAbovePositions[ik]) {
                totalSwitchedCrossings += 1;
              }
            }
          }

          for (let k = 0; k < leftBelowPositions.length; k += 1) {
            for (let ik = 0; ik < rightBelowPositions.length; ik += 1) {
              if (leftBelowPositions[k] > rightBelowPositions[ik]) {
                totalCurrentCrossings += 1;
              }

              if (leftBelowPositions[k] < rightBelowPositions[ik]) {
                totalSwitchedCrossings += 1;
              }
            }
          }

          if (
            totalSwitchedCrossings < totalCurrentCrossings ||
            (totalSwitchedCrossings === totalCurrentCrossings && nudge)
          ) {
            const temp = leftCell.getGeneralPurposeVariable(i);
            leftCell.setGeneralPurposeVariable(
              i,
              rightCell.getGeneralPurposeVariable(i)
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
  weightedMedian(iteration, model) {
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
  medianRank(rankValue, downwardSweep) {
    const numCellsForRank = this.nestedBestRanks[rankValue].length;
    const medianValues = [];
    const reservedPositions = [];

    for (let i = 0; i < numCellsForRank; i += 1) {
      const cell = this.nestedBestRanks[rankValue][i];
      const sorterEntry = new MedianCellSorter();
      sorterEntry.cell = cell;

      // Flip whether or not equal medians are flipped on up and down
      // sweeps
      // TODO re-implement some kind of nudge
      // medianValues[i].nudge = !downwardSweep;
      var nextLevelConnectedCells;

      if (downwardSweep) {
        nextLevelConnectedCells = cell.getNextLayerConnectedCells(rankValue);
      } else {
        nextLevelConnectedCells = cell.getPreviousLayerConnectedCells(
          rankValue
        );
      }

      var nextRankValue;

      if (downwardSweep) {
        nextRankValue = rankValue + 1;
      } else {
        nextRankValue = rankValue - 1;
      }

      if (
        nextLevelConnectedCells != null &&
        nextLevelConnectedCells.length !== 0
      ) {
        sorterEntry.medianValue = this.medianValue(
          nextLevelConnectedCells,
          nextRankValue
        );
        medianValues.push(sorterEntry);
      } else {
        // Nodes with no adjacent vertices are flagged in the reserved array
        // to indicate they should be left in their current position.
        reservedPositions[cell.getGeneralPurposeVariable(rankValue)] = true;
      }
    }

    medianValues.sort(new MedianCellSorter().compare);

    // Set the new position of each node within the rank using
    // its temp variable
    for (let i = 0; i < numCellsForRank; i += 1) {
      if (reservedPositions[i] == null) {
        const { cell } = medianValues.shift();
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
  medianValue(connectedCells, rankValue) {
    const medianValues = [];
    let arrayCount = 0;

    for (let i = 0; i < connectedCells.length; i += 1) {
      const cell = connectedCells[i];
      medianValues[arrayCount++] = cell.getGeneralPurposeVariable(rankValue);
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
    const rightMedian =
      medianValues[arrayCount - 1] - medianValues[medianPoint];

    return (
      (medianValues[medianPoint - 1] * rightMedian +
        medianValues[medianPoint] * leftMedian) /
      (leftMedian + rightMedian)
    );
  }
}

export default MedianHybridCrossingReduction;
