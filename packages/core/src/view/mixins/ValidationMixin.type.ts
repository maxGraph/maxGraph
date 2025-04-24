/*
Copyright 2024-present The maxGraph project Contributors

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

import type Multiplicity from '../other/Multiplicity';
import type Cell from '../cell/Cell';
import type CellState from '../cell/CellState';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    multiplicities: Multiplicity[];

    /**
     * Displays the given validation error in a dialog.
     *
     * This implementation uses `window.alert`.
     */
    validationAlert: (message: string) => void;

    /**
     * Checks if the return value of {@link getEdgeValidationError} for the given
     * arguments is null.
     *
     * @param edge {@link Cell} that represents the edge to validate.
     * @param source {@link Cell} that represents the source terminal.
     * @param target {@link Cell} that represents the target terminal.
     */
    isEdgeValid: (edge: Cell | null, source: Cell, target: Cell) => boolean;

    /**
     * Returns the validation error message to be displayed when inserting or
     * changing an edges' connectivity. A return value of null means the edge
     * is valid, a return value of '' means it's not valid, but do not display
     * an error message. Any other (non-empty) string returned from this method
     * is displayed as an error message when trying to connect an edge to a
     * source and target. This implementation uses the {@link multiplicities}, and
     * checks {@link multigraph}, {@link allowDanglingEdges} and {@link allowLoops} to generate
     * validation errors.
     *
     * For extending this method with specific checks for source/target cells,
     * the method can be extended as follows. Returning an empty string means
     * the edge is invalid with no error message, a non-null string specifies
     * the error message, and null means the edge is valid.
     *
     * ```javascript
     * graph.getEdgeValidationError = function(edge, source, target)
     * {
     *   if (source != null && target != null &&
     *     this.model.getValue(source) != null &&
     *     this.model.getValue(target) != null)
     *   {
     *     if (target is not valid for source)
     *     {
     *       return 'Invalid Target';
     *     }
     *   }
     *
     *   // "Supercall"
     *   return getEdgeValidationError.apply(this, arguments);
     * }
     * ```
     *
     * @param edge {@link Cell} that represents the edge to validate.
     * @param source {@link Cell} that represents the source terminal.
     * @param target {@link Cell} that represents the target terminal.
     */
    getEdgeValidationError: (
      edge: Cell | null,
      source: Cell | null,
      target: Cell | null
    ) => string | null;

    /**
     * Hook method for subclasses to return an error message for the given edge and terminals.
     *
     * This implementation returns `null`.
     *
     * @param edge {@link Cell} that represents the edge to validate.
     * @param source {@link Cell} that represents the source terminal.
     * @param target {@link Cell} that represents the target terminal.
     */
    validateEdge: (edge: Cell, source: Cell, target: Cell) => string | null;

    /**
     * Validates the graph by validating each descendant of the given cell or
     * the root of the model. Context is an object that contains the validation
     * state for the complete validation run. The validation errors are
     * attached to their cells using {@link setCellWarning}. Returns null in the case of
     * successful validation or an array of strings (warnings) in the case of
     * failed validations.
     *
     * @param cell Optional {@link Cell} to start the validation recursion. Default is
     * the graph root.
     * @param context Object that represents the global validation state.
     */
    validateGraph: (cell?: Cell | null, context?: any) => string | null;

    /**
     * Checks all {@link multiplicities} that cannot be enforced while the graph is
     * being modified, namely, all multiplicities that require a minimum of
     * 1 edge.
     *
     * @param cell {@link Cell} for which the multiplicities should be checked.
     */
    getCellValidationError: (cell: Cell) => string | null;

    /**
     * Hook method for subclasses to return an error message for the given cell and validation context.
     *
     * Any HTML breaks will be converted to linefeed in the calling method.
     *
     * This implementation returns `null`.
     *
     * @param cell {@link Cell} that represents the cell to validate.
     * @param context Object that represents the global validation state.
     */
    validateCell: (cell: Cell, context: CellState) => string | null;
  }
}
