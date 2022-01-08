import Cell from '../cell/Cell';
import Translations from '../../util/Translations';
import { isNode } from '../../util/domUtils';
import CellState from '../cell/CellState';
import Multiplicity from '../other/Multiplicity';
import { Graph } from '../Graph';
import { mixInto } from '../../util/utils';

declare module '../Graph' {
  interface Graph {
    multiplicities: Multiplicity[];

    validationAlert: (message: string) => void;
    isEdgeValid: (edge: Cell | null, source: Cell, target: Cell) => boolean;
    getEdgeValidationError: (
      edge: Cell | null,
      source: Cell | null,
      target: Cell | null
    ) => string | null;
    validateEdge: (edge: Cell, source: Cell, target: Cell) => string | null;
    validateGraph: (cell?: Cell | null, context?: any) => string | null;
    getCellValidationError: (cell: Cell) => string | null;
    validateCell: (cell: Cell, context: CellState) => string | null;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'getDataModel'
  | 'isAllowLoops'
  | 'isMultigraph'
  | 'getView'
  | 'isValidRoot'
  | 'getContainsValidationErrorsResource'
  | 'getAlreadyConnectedResource'
  | 'isAllowDanglingEdges'
  | 'isValidConnection'
  | 'setCellWarning'
>;
type PartialValidation = Pick<
  Graph,
  | 'multiplicities'
  | 'validationAlert'
  | 'isEdgeValid'
  | 'getEdgeValidationError'
  | 'validateEdge'
  | 'validateGraph'
  | 'getCellValidationError'
  | 'validateCell'
>;
type PartialType = PartialGraph & PartialValidation;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const ValidationMixin: PartialType = {
  /*****************************************************************************
   * Group: Validation
   *****************************************************************************/

  /**
   * Displays the given validation error in a dialog. This implementation uses
   * mxUtils.alert.
   */
  validationAlert(message: string) {
    alert(message);
  },

  /**
   * Checks if the return value of {@link getEdgeValidationError} for the given
   * arguments is null.
   *
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   */
  isEdgeValid(edge: Cell | null, source: Cell | null, target: Cell | null) {
    return !this.getEdgeValidationError(edge, source, target);
  },

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
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   */
  getEdgeValidationError(edge: Cell | null=null, source: Cell | null=null, target: Cell | null=null) {
    if (edge && !this.isAllowDanglingEdges() && (!source || !target)) {
      return '';
    }

    if (edge && !edge.getTerminal(true) && !edge.getTerminal(false)) {
      return null;
    }

    // Checks if we're dealing with a loop
    if (!this.isAllowLoops() && source === target && source) {
      return '';
    }

    // Checks if the connection is generally allowed
    if (!this.isValidConnection(source, target)) {
      return '';
    }

    if (source && target) {
      let error = '';

      // Checks if the cells are already connected
      // and adds an error message if required
      if (!this.isMultigraph()) {
        const tmp = this.getDataModel().getEdgesBetween(source, target, true);

        // Checks if the source and target are not connected by another edge
        if (tmp.length > 1 || (tmp.length === 1 && tmp[0] !== edge)) {
          error += `${
            Translations.get(this.getAlreadyConnectedResource()) ||
            this.getAlreadyConnectedResource()
          }\n`;
        }
      }

      // Gets the number of outgoing edges from the source
      // and the number of incoming edges from the target
      // without counting the edge being currently changed.
      const sourceOut = source.getDirectedEdgeCount(true, edge);
      const targetIn = target.getDirectedEdgeCount(false, edge);

      // Checks the change against each multiplicity rule
      for (const multiplicity of this.multiplicities) {
        const err = multiplicity.check(
          <Graph>(<unknown>this), // needs to cast to Graph
          <Cell>edge,
          source,
          target,
          sourceOut,
          targetIn
        );

        if (err != null) {
          error += err;
        }
      }

      // Validates the source and target terminals independently
      const err = this.validateEdge(<Cell>edge, source, target);
      if (err != null) {
        error += err;
      }
      return error.length > 0 ? error : null;
    }

    return this.isAllowDanglingEdges() ? null : '';
  },

  /**
   * Hook method for subclassers to return an error message for the given
   * edge and terminals. This implementation returns null.
   *
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   */
  validateEdge(edge: Cell | null=null, source: Cell | null=null, target: Cell | null=null) {
    return null;
  },

  /**
   * Validates the graph by validating each descendant of the given cell or
   * the root of the model. Context is an object that contains the validation
   * state for the complete validation run. The validation errors are
   * attached to their cells using {@link setCellWarning}. Returns null in the case of
   * successful validation or an array of strings (warnings) in the case of
   * failed validations.
   *
   * Paramters:
   *
   * @param cell Optional {@link Cell} to start the validation recursion. Default is
   * the graph root.
   * @param context Object that represents the global validation state.
   */
  validateGraph(cell: Cell | null=null, context) {
    cell = cell ?? this.getDataModel().getRoot();

    if (!cell) {
      return 'The root does not exist!';
    }

    context = context ?? {};

    let isValid = true;
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const tmp = cell.getChildAt(i);
      let ctx = context;

      if (this.isValidRoot(tmp)) {
        ctx = {};
      }

      const warn = this.validateGraph(tmp, ctx);

      if (warn) {
        this.setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
      } else {
        this.setCellWarning(tmp, null);
      }

      isValid = isValid && warn == null;
    }

    let warning = '';

    // Adds error for invalid children if collapsed (children invisible)
    if (cell && cell.isCollapsed() && !isValid) {
      warning += `${
        Translations.get(this.getContainsValidationErrorsResource()) ||
        this.getContainsValidationErrorsResource()
      }\n`;
    }

    // Checks edges and cells using the defined multiplicities
    if (cell && cell.isEdge()) {
      warning +=
        this.getEdgeValidationError(
          cell,
          cell.getTerminal(true),
          cell.getTerminal(false)
        ) || '';
    } else {
      warning += this.getCellValidationError(<Cell>cell) || '';
    }

    // Checks custom validation rules
    const err = this.validateCell(<Cell>cell, context);

    if (err != null) {
      warning += err;
    }

    // Updates the display with the warning icons
    // before any potential alerts are displayed.
    // LATER: Move this into addCellOverlay. Redraw
    // should check if overlay was added or removed.
    if (cell.getParent() == null) {
      this.getView().validate();
    }
    return warning.length > 0 || !isValid ? warning : null;
  },

  /**
   * Checks all {@link multiplicities} that cannot be enforced while the graph is
   * being modified, namely, all multiplicities that require a minimum of
   * 1 edge.
   *
   * @param cell {@link mxCell} for which the multiplicities should be checked.
   */
  getCellValidationError(cell: Cell) {
    const outCount = cell.getDirectedEdgeCount(true);
    const inCount = cell.getDirectedEdgeCount(false);
    const value = cell.getValue();
    let error = '';

    for (let i = 0; i < this.multiplicities.length; i += 1) {
      const rule = this.multiplicities[i];

      if (
        rule.source &&
        isNode(value, rule.type, rule.attr, rule.value) &&
        (outCount > rule.max || outCount < rule.min)
      ) {
        error += `${rule.countError}\n`;
      } else if (
        !rule.source &&
        isNode(value, rule.type, rule.attr, rule.value) &&
        (inCount > rule.max || inCount < rule.min)
      ) {
        error += `${rule.countError}\n`;
      }
    }

    return error.length > 0 ? error : null;
  },

  /**
   * Hook method for subclassers to return an error message for the given
   * cell and validation context. This implementation returns null. Any HTML
   * breaks will be converted to linefeeds in the calling method.
   *
   * @param cell {@link mxCell} that represents the cell to validate.
   * @param context Object that represents the global validation state.
   */
  validateCell(cell: Cell, context) {
    return null;
  },
};

mixInto(Graph)(ValidationMixin);
