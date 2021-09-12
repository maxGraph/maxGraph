/**
 * @class WeightedCellSorter
 *
 * A utility class used to track cells whilst sorting occurs on the weighted
 * sum of their connected edges. Does not violate (x.compareTo(y)==0) ==
 * (x.equals(y))
 *
 */
import Cell from "../../cell/datatypes/Cell";

class WeightedCellSorter {
  constructor(cell: Cell, weightedValue: number) {
    this.cell = cell;
    this.weightedValue = weightedValue;
  }

  /**
   * The weighted value of the cell stored.
   */
  weightedValue: number = 0;

  /**
   * Whether or not to flip equal weight values.
   */
  nudge: boolean = false;

  /**
   * Whether or not this cell has been visited in the current assignment.
   */
  visited: boolean = false;

  /**
   * The index this cell is in the model rank.
   */
  rankIndex: number | null = null;

  /**
   * The cell whose median value is being calculated.
   */
  cell: Cell;

  /**
   * Compares two WeightedCellSorters.
   */
  compare(a: WeightedCellSorter, b: WeightedCellSorter): number {
    if (a != null && b != null) {
      if (b.weightedValue > a.weightedValue) {
        return -1;
      }
      if (b.weightedValue < a.weightedValue) {
        return 1;
      }
      if (b.nudge) {
        return -1;
      }
      return 1;
    }
    return 0;
  }
}

export default WeightedCellSorter;
