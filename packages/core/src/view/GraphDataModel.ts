/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import EventSource from './event/EventSource';
import UndoableEdit from './undoable_changes/UndoableEdit';
import CellPath from './cell/CellPath';
import Cell from './cell/Cell';
import { isNumeric } from '../util/mathUtils';
import EventObject from './event/EventObject';
import InternalEvent from './event/InternalEvent';
import ChildChange from './undoable_changes/ChildChange';
import CollapseChange from './undoable_changes/CollapseChange';
import GeometryChange from './undoable_changes/GeometryChange';
import RootChange from './undoable_changes/RootChange';
import StyleChange from './undoable_changes/StyleChange';
import TerminalChange from './undoable_changes/TerminalChange';
import ValueChange from './undoable_changes/ValueChange';
import VisibleChange from './undoable_changes/VisibleChange';
import Geometry from './geometry/Geometry';
import CellArray from './cell/CellArray';
import ObjectCodec from '../serialization/ObjectCodec';
import CodecRegistry from '../serialization/CodecRegistry';

import type { FilterFunction } from '../types';

/**
 * Extends {@link EventSource} to implement a graph model. The graph model acts as
 * a wrapper around the cells which are in charge of storing the actual graph
 * datastructure. The model acts as a transactional wrapper with event
 * notification for all changes, whereas the cells contain the atomic
 * operations for updating the actual datastructure.
 *
 * ### Layers
 *
 * The cell hierarchy in the model must have a top-level root cell which
 * contains the layers (typically one default layer), which in turn contain the
 * top-level cells of the layers. This means each cell is contained in a layer.
 * If no layers are required, then all new cells should be added to the default
 * layer.
 *
 * Layers are useful for hiding and showing groups of cells, or for placing
 * groups of cells on top of other cells in the display. To identify a layer,
 * the {@link isLayer} function is used. It returns true if the parent of the given
 * cell is the root of the model.
 *
 * ### Events
 *
 * See events section for more details. There is a new set of events for
 * tracking transactional changes as they happen. The events are called
 * startEdit for the initial beginUpdate, executed for each executed change
 * and endEdit for the terminal endUpdate. The executed event contains a
 * property called change which represents the change after execution.
 *
 * ### Encoding the model
 *
 * #### To encode a graph model, use the following code:
 *
 * ```javascript
 * var enc = new Codec();
 * var node = enc.encode(graph.getDataModel());
 * ```
 *
 * This will create an XML node that contains all the model information.
 *
 * #### Encoding and decoding changes:
 *
 * For the encoding of changes, a graph model listener is required that encodes
 * each change from the given array of changes.
 *
 * ```javascript
 * model.addListener(mxEvent.CHANGE, function(sender, evt)
 * {
 *   var changes = evt.getProperty('edit').changes;
 *   var nodes = [];
 *   var codec = new Codec();
 *
 *   for (var i = 0; i < changes.length; i++)
 *   {
 *     nodes.push(codec.encode(changes[i]));
 *   }
 *   // do something with the nodes
 * });
 * ```
 *
 * For the decoding and execution of changes, the codec needs a lookup function
 * that allows it to resolve cell IDs as follows:
 *
 * ```javascript
 * var codec = new Codec();
 * codec.lookup(id)
 * {
 *   return model.getCell(id);
 * }
 * ```
 *
 * For each encoded change (represented by a node), the following code can be
 * used to carry out the decoding and create a change object.
 *
 * ```javascript
 * var changes = [];
 * var change = codec.decode(node);
 * change.model = model;
 * change.execute();
 * changes.push(change);
 * ```
 *
 * The changes can then be dispatched using the model as follows.
 *
 * ```javascript
 * var edit = new mxUndoableEdit(model, false);
 * edit.changes = changes;
 *
 * edit.notify()
 * {
 *   edit.source.fireEvent(new mxEventObject(mxEvent.CHANGE,
 *   	'edit', edit, 'changes', edit.changes));
 *   edit.source.fireEvent(new mxEventObject(mxEvent.NOTIFY,
 *   	'edit', edit, 'changes', edit.changes));
 * }
 *
 * model.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
 * model.fireEvent(new mxEventObject(mxEvent.CHANGE,
 *    'edit', edit, 'changes', changes));
 * ```
 *
 * Event: mxEvent.CHANGE
 *
 * Fires when an undoable edit is dispatched. The `edit` property
 * contains the {@link UndoableEdit}. The `changes` property contains
 * the array of atomic changes inside the undoable edit. The changes property
 * is **deprecated**, please use edit.changes instead.
 *
 * ### Example
 *
 * For finding newly inserted cells, the following code can be used:
 *
 * ```javascript
 * graph.model.addListener(mxEvent.CHANGE, function(sender, evt)
 * {
 *   var changes = evt.getProperty('edit').changes;
 *
 *   for (var i = 0; i < changes.length; i++)
 *   {
 *     var change = changes[i];
 *
 *     if (change instanceof mxChildChange &&
 *       change.change.previous == null)
 *     {
 *       graph.startEditingAtCell(change.child);
 *       break;
 *     }
 *   }
 * });
 * ```
 *
 * Event: mxEvent.NOTIFY
 *
 * Same as <mxEvent.CHANGE>, this event can be used for classes that need to
 * implement a sync mechanism between this model and, say, a remote model. In
 * such a setup, only local changes should trigger a notify event and all
 * changes should trigger a change event.
 *
 * Event: mxEvent.EXECUTE
 *
 * Fires between begin- and endUpdate and after an atomic change was executed
 * in the model. The `change` property contains the atomic change
 * that was executed.
 *
 * Event: mxEvent.EXECUTED
 *
 * Fires between START_EDIT and END_EDIT after an atomic change was executed.
 * The `change` property contains the change that was executed.
 *
 * Event: mxEvent.BEGIN_UPDATE
 *
 * Fires after the {@link updateLevel} was incremented in {@link beginUpdate}. This event
 * contains no properties.
 *
 * Event: mxEvent.START_EDIT
 *
 * Fires after the {@link updateLevel} was changed from 0 to 1. This event
 * contains no properties.
 *
 * Event: mxEvent.END_UPDATE
 *
 * Fires after the {@link updateLevel} was decreased in {@link endUpdate} but before any
 * notification or change dispatching. The `edit` property contains
 * the {@link currentEdit}.
 *
 * Event: mxEvent.END_EDIT
 *
 * Fires after the {@link updateLevel} was changed from 1 to 0. This event
 * contains no properties.
 *
 * Event: mxEvent.BEFORE_UNDO
 *
 * Fires before the change is dispatched after the update level has reached 0
 * in {@link endUpdate}. The `edit` property contains the {@link curreneEdit}.
 *
 * Event: mxEvent.UNDO
 *
 * Fires after the change was dispatched in {@link endUpdate}. The `edit`
 * property contains the {@link currentEdit}.
 *
 * @class GraphDataModel
 */
export class GraphDataModel extends EventSource {
  /**
   * Holds the root cell, which in turn contains the cells that represent the
   * layers of the diagram as child cells. That is, the actual elements of the
   * diagram are supposed to live in the third generation of cells and below.
   */
  root: Cell | null = null;

  /**
   * Maps from Ids to cells.
   */
  cells: any = {};

  /**
   * Specifies if edges should automatically be moved into the nearest common
   * ancestor of their terminals. Default is true.
   */
  maintainEdgeParent: boolean = true;

  /**
   * Specifies if relative edge parents should be ignored for finding the nearest
   * common ancestors of an edge's terminals. Default is true.
   */
  ignoreRelativeEdgeParent: boolean = true;

  /**
   * Specifies if the model should automatically create Ids for new cells.
   * Default is true.
   */
  createIds: boolean = true;

  /**
   * Defines the prefix of new Ids. Default is an empty string.
   */
  prefix: string = '';

  /**
   * Defines the postfix of new Ids. Default is an empty string.
   */
  postfix: string = '';

  /**
   * Specifies the next Id to be created. Initial value is 0.
   */
  // nextId: number | string;
  nextId: number = 0;

  /**
   * Holds the changes for the current transaction. If the transaction is
   * closed then a new object is created for this variable using
   * {@link createUndoableEdit}.
   */
  currentEdit: any = null;

  /**
   * Counter for the depth of nested transactions. Each call to {@link beginUpdate}
   * will increment this number and each call to {@link endUpdate} will decrement
   * it. When the counter reaches 0, the transaction is closed and the
   * respective events are fired. Initial value is 0.
   */
  updateLevel: number = 0;

  /**
   * True if the program flow is currently inside endUpdate.
   */
  endingUpdate: boolean = false;

  constructor(root: Cell | null = null) {
    super();

    this.currentEdit = this.createUndoableEdit();

    if (root != null) {
      this.setRoot(root);
    } else {
      this.clear();
    }
  }

  /**
   * Sets a new root using {@link createRoot}.
   */
  clear() {
    this.setRoot(this.createRoot());
  }

  /**
   * Returns {@link createIds}.
   */
  isCreateIds() {
    return this.createIds;
  }

  /**
   * Sets {@link createIds}.
   */
  setCreateIds(value: boolean) {
    this.createIds = value;
  }

  /**
   * Creates a new root cell with a default layer (child 0).
   */
  createRoot() {
    const cell = new Cell();
    cell.insert(new Cell());
    return cell;
  }

  /**
   * Returns the {@link Cell} for the specified Id or null if no cell can be
   * found for the given Id.
   *
   * @param {string} id  A string representing the Id of the cell.
   */
  getCell(id: string) {
    return this.cells ? this.cells[id] : null;
  }

  filterCells(cells: CellArray, filter: FilterFunction) {
    return new CellArray(...cells).filterCells(filter);
  }

  getRoot(cell: Cell | null = null) {
    return cell ? cell.getRoot() : this.root;
  }

  /**
   * Sets the {@link root} of the model using {@link RootChange} and adds the change to
   * the current transaction. This resets all datastructures in the model and
   * is the preferred way of clearing an existing model. Returns the new
   * root.
   *
   * Example:
   *
   * ```javascript
   * var root = new mxCell();
   * root.insert(new mxCell());
   * model.setRoot(root);
   * ```
   *
   * @param {Cell} root  that specifies the new root.
   */
  setRoot(root: Cell | null) {
    this.execute(new RootChange(this, root));
    return root;
  }

  /**
   * Inner callback to change the root of the model and update the internal
   * datastructures, such as {@link cells} and {@link nextId}. Returns the previous root.
   *
   * @param {Cell} root  that specifies the new root.
   */
  rootChanged(root: Cell | null) {
    const oldRoot = this.root;
    this.root = root;

    // Resets counters and datastructures
    this.nextId = 0;
    this.cells = null;
    this.cellAdded(root);

    return oldRoot;
  }

  /**
   * Returns true if the given cell is the root of the model and a non-null
   * value.
   *
   * @param {Cell} cell  that represents the possible root.
   */
  isRoot(cell: Cell | null = null) {
    return cell != null && this.root === cell;
  }

  /**
   * Returns true if {@link isRoot} returns true for the parent of the given cell.
   *
   * @param {Cell} cell  that represents the possible layer.
   */
  isLayer(cell: Cell) {
    return this.isRoot(cell.getParent());
  }

  /**
   * Returns true if the model contains the given {@link Cell}.
   *
   * @param {Cell} cell  that specifies the cell.
   */
  contains(cell: Cell) {
    return (<Cell>this.root).isAncestor(cell);
  }

  /**
   * Adds the specified child to the parent at the given index using
   * {@link ChildChange} and adds the change to the current transaction. If no
   * index is specified then the child is appended to the parent's array of
   * children. Returns the inserted child.
   *
   * @param {Cell} parent  that specifies the parent to contain the child.
   * @param {Cell} child  that specifies the child to be inserted.
   * @param index  Optional integer that specifies the index of the child.
   */
  add(parent: Cell | null, child: Cell | null, index: number | null = null) {
    if (child !== parent && parent != null && child != null) {
      // Appends the child if no index was specified
      if (index == null) {
        index = parent.getChildCount();
      }

      const parentChanged = parent !== child.getParent();
      this.execute(new ChildChange(this, parent, child, index));

      // Maintains the edges parents by moving the edges
      // into the nearest common ancestor of its terminals
      if (this.maintainEdgeParent && parentChanged) {
        this.updateEdgeParents(child);
      }
    }
    return child;
  }

  /**
   * Inner callback to update {@link cells} when a cell has been added. This
   * implementation resolves collisions by creating new Ids. To change the
   * ID of a cell after it was inserted into the model, use the following
   * code:
   *
   * (code
   * delete model.cells[cell.getId()];
   * cell.setId(newId);
   * model.cells[cell.getId()] = cell;
   * ```
   *
   * If the change of the ID should be part of the command history, then the
   * cell should be removed from the model and a clone with the new ID should
   * be reinserted into the model instead.
   *
   * @param {Cell} cell  that specifies the cell that has been added.
   */
  cellAdded(cell: Cell | null) {
    if (cell != null) {
      // Creates an Id for the cell if not Id exists
      if (cell.getId() == null && this.createIds) {
        cell.setId(this.createId(cell));
      }

      if (cell.getId() != null) {
        let collision: Cell | null = this.getCell(<string>cell.getId());

        if (collision !== cell) {
          // Creates new Id for the cell
          // as long as there is a collision
          while (collision != null) {
            cell.setId(this.createId(cell));
            collision = this.getCell(<string>cell.getId());
          }

          // Lazily creates the cells dictionary
          if (this.cells == null) {
            this.cells = {};
          }

          this.cells[<string>cell.getId()] = cell;
        }
      }

      // Makes sure IDs of deleted cells are not reused
      if (isNumeric(String(cell.getId()))) {
        this.nextId = Math.max(this.nextId, parseInt(<string>cell.getId()));
      }

      // Recursively processes child cells
      for (let child of cell.getChildren()) {
        this.cellAdded(child);
      }
    }
  }

  /**
   * Hook method to create an Id for the specified cell. This implementation
   * concatenates {@link prefix}, id and {@link postfix} to create the Id and increments
   * {@link nextId}. The cell is ignored by this implementation, but can be used in
   * overridden methods to prefix the Ids with eg. the cell type.
   *
   * @param {Cell} cell  to create the Id for.
   */
  createId(cell: Cell) {
    const id = this.nextId;
    this.nextId++;
    return this.prefix + id + this.postfix;
  }

  /**
   * Updates the parent for all edges that are connected to cell or one of
   * its descendants using {@link updateEdgeParent}.
   */
  updateEdgeParents(cell: Cell, root: Cell = <Cell>this.getRoot(cell)) {
    // Updates edges on children first
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = <Cell>cell.getChildAt(i);
      this.updateEdgeParents(child, root);
    }

    // Updates the parents of all connected edges
    const edgeCount = cell.getEdgeCount();
    const edges = [];

    for (let i = 0; i < edgeCount; i += 1) {
      edges.push(<Cell>cell.getEdgeAt(i));
    }

    for (let i = 0; i < edges.length; i += 1) {
      const edge = edges[i];

      // Updates edge parent if edge and child have
      // a common root node (does not need to be the
      // model root node)
      if (root.isAncestor(edge)) {
        this.updateEdgeParent(edge, root);
      }
    }
  }

  /**
   * Inner callback to update the parent of the specified {@link Cell} to the
   * nearest-common-ancestor of its two terminals.
   *
   * @param {Cell} edge  that specifies the edge.
   * @param {Cell} root  that represents the current root of the model.
   */
  updateEdgeParent(edge: Cell, root: Cell): void {
    let source = edge.getTerminal(true);
    let target = edge.getTerminal(false);
    let cell = null;

    // Uses the first non-relative descendants of the source terminal
    while (
      source != null &&
      !source.isEdge() &&
      source.geometry != null &&
      source.geometry.relative
    ) {
      source = source.getParent();
    }

    // Uses the first non-relative descendants of the target terminal
    while (
      target != null &&
      this.ignoreRelativeEdgeParent &&
      !target.isEdge() &&
      target.geometry != null &&
      target.geometry.relative
    ) {
      target = target.getParent();
    }

    if (root.isAncestor(source) && root.isAncestor(target)) {
      if (source === target) {
        cell = source ? source.getParent() : null;
      } else if (source) {
        cell = source.getNearestCommonAncestor(<Cell>target);
      }

      if (
        cell != null &&
        (cell.getParent() !== this.root || cell.isAncestor(edge)) &&
        edge &&
        edge.getParent() !== cell
      ) {
        let geo = edge.getGeometry();

        if (geo != null) {
          const origin1 = (<Cell>edge.getParent()).getOrigin();
          const origin2 = cell.getOrigin();

          const dx = origin2.x - origin1.x;
          const dy = origin2.y - origin1.y;

          geo = <Geometry>geo.clone();
          geo.translate(-dx, -dy);
          this.setGeometry(edge, geo);
        }

        this.add(cell, edge, cell.getChildCount());
      }
    }
  }

  /**
   * Removes the specified cell from the model using {@link ChildChange} and adds
   * the change to the current transaction. This operation will remove the
   * cell and all of its children from the model. Returns the removed cell.
   *
   * @param {Cell} cell  that should be removed.
   */
  remove(cell: Cell): Cell {
    if (cell === this.root) {
      this.setRoot(null);
    } else if (cell.getParent() != null) {
      this.execute(new ChildChange(this, null, cell));
    }
    return cell;
  }

  /**
   * Inner callback to update {@link cells} when a cell has been removed.
   *
   * @param {Cell} cell  that specifies the cell that has been removed.
   */
  cellRemoved(cell: Cell): void {
    if (cell != null && this.cells != null) {
      // Recursively processes child cells
      const childCount = cell.getChildCount();

      for (let i = childCount - 1; i >= 0; i--) {
        this.cellRemoved(<Cell>cell.getChildAt(i));
      }

      // Removes the dictionary entry for the cell
      if (this.cells != null && cell.getId() != null) {
        // @ts-ignore
        delete this.cells[cell.getId()];
      }
    }
  }

  /**
   * Inner callback to update the parent of a cell using <mxCell.insert>
   * on the parent and return the previous parent.
   *
   * @param {Cell} cell  to update the parent for.
   * @param {Cell} parent  that specifies the new parent of the cell.
   * @param index  Optional integer that defines the index of the child
   * in the parent's child array.
   */
  parentForCellChanged(cell: Cell, parent: Cell | null, index: number): Cell {
    const previous = <Cell>cell.getParent();

    if (parent != null) {
      if (parent !== previous || previous.getIndex(cell) !== index) {
        parent.insert(cell, index);
      }
    } else if (previous != null) {
      const oldIndex = previous.getIndex(cell);
      previous.remove(oldIndex);
    }

    // Adds or removes the cell from the model
    const par = parent ? this.contains(parent) : null;
    const pre = this.contains(previous);

    if (par && !pre) {
      this.cellAdded(cell);
    } else if (pre && !par) {
      this.cellRemoved(cell);
    }
    return previous;
  }

  /**
   * Sets the source or target terminal of the given {@link Cell} using
   * {@link TerminalChange} and adds the change to the current transaction.
   * This implementation updates the parent of the edge using {@link updateEdgeParent}
   * if required.
   *
   * @param {Cell} edge  that specifies the edge.
   * @param {Cell} terminal  that specifies the new terminal.
   * @param isSource  Boolean indicating if the terminal is the new source or
   * target terminal of the edge.
   */
  // setTerminal(edge: mxCell, terminal: mxCell, isSource: boolean): mxCell;
  setTerminal(edge: Cell, terminal: Cell | null, isSource: boolean): Cell | null {
    const terminalChanged = terminal !== edge.getTerminal(isSource);
    this.execute(new TerminalChange(this, edge, terminal, isSource));

    if (this.maintainEdgeParent && terminalChanged) {
      this.updateEdgeParent(edge, <Cell>this.getRoot());
    }
    return terminal;
  }

  /**
   * Sets the source and target {@link Cell} of the given {@link Cell} in a single
   * transaction using {@link setTerminal} for each end of the edge.
   *
   * @param {Cell} edge  that specifies the edge.
   * @param {Cell} source  that specifies the new source terminal.
   * @param {Cell} target  that specifies the new target terminal.
   */
  // setTerminals(edge: mxCell, source: mxCell, target: mxCell): void;
  setTerminals(edge: Cell, source: Cell | null, target: Cell | null): void {
    this.beginUpdate();
    try {
      this.setTerminal(edge, source, true);
      this.setTerminal(edge, target, false);
    } finally {
      this.endUpdate();
    }
  }

  /**
   * Inner helper function to update the terminal of the edge using
   * <mxCell.insertEdge> and return the previous terminal.
   *
   * @param {Cell} edge  that specifies the edge to be updated.
   * @param {Cell} terminal  that specifies the new terminal.
   * @param isSource  Boolean indicating if the terminal is the new source or
   * target terminal of the edge.
   */
  // terminalForCellChanged(edge: mxCell, terminal: mxCell, isSource: boolean): mxCell;
  terminalForCellChanged(
    edge: Cell,
    terminal: Cell | null,
    isSource: boolean = false
  ): Cell | null {
    const previous = edge.getTerminal(isSource);
    if (terminal != null) {
      terminal.insertEdge(edge, isSource);
    } else if (previous != null) {
      previous.removeEdge(edge, isSource);
    }
    return previous;
  }

  /**
   * Returns all edges between the given source and target pair. If directed
   * is true, then only edges from the source to the target are returned,
   * otherwise, all edges between the two cells are returned.
   *
   * @param {Cell} source  that defines the source terminal of the edge to be
   * returned.
   * @param {Cell} target  that defines the target terminal of the edge to be
   * returned.
   * @param directed  Optional boolean that specifies if the direction of the
   * edge should be taken into account. Default is false.
   */
  getEdgesBetween(source: Cell, target: Cell, directed: boolean = false): CellArray {
    const tmp1 = source.getEdgeCount();
    const tmp2 = target.getEdgeCount();

    // Assumes the source has less connected edges
    let terminal = source;
    let edgeCount = tmp1;

    // Uses the smaller array of connected edges
    // for searching the edge
    if (tmp2 < tmp1) {
      edgeCount = tmp2;
      terminal = target;
    }

    const result = new CellArray();

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edgeCount; i += 1) {
      const edge = <Cell>terminal.getEdgeAt(i);
      const src = edge.getTerminal(true);
      const trg = edge.getTerminal(false);
      const directedMatch = src === source && trg === target;
      const oppositeMatch = trg === source && src === target;

      if (directedMatch || (!directed && oppositeMatch)) {
        result.push(edge);
      }
    }
    return result;
  }

  /**
   * Sets the user object of then given {@link Cell} using {@link ValueChange}
   * and adds the change to the current transaction.
   *
   * @param {Cell} cell  whose user object should be changed.
   * @param value  Object that defines the new user object.
   */
  setValue(cell: Cell, value: any): any {
    this.execute(new ValueChange(this, cell, value));
    return value;
  }

  /**
   * Inner callback to update the user object of the given {@link Cell}
   * using <mxCell.valueChanged> and return the previous value,
   * that is, the return value of <mxCell.valueChanged>.
   *
   * To change a specific attribute in an XML node, the following code can be
   * used.
   *
   * ```javascript
   * graph.getDataModel().valueForCellChanged(cell, value)
   * {
   *   var previous = cell.value.getAttribute('label');
   *   cell.value.setAttribute('label', value);
   *
   *   return previous;
   * };
   * ```
   */
  valueForCellChanged(cell: Cell, value: any): any {
    return cell.valueChanged(value);
  }

  /**
   * Sets the {@link Geometry} of the given {@link Cell}. The actual update
   * of the cell is carried out in {@link geometryForCellChanged}. The
   * {@link GeometryChange} action is used to encapsulate the change.
   *
   * @param {Cell} cell  whose geometry should be changed.
   * @param {Geometry} geometry  that defines the new geometry.
   */
  setGeometry(cell: Cell, geometry: Geometry): Geometry {
    if (geometry !== cell.getGeometry()) {
      this.execute(new GeometryChange(this, cell, geometry));
    }
    return geometry;
  }

  /**
   * Inner callback to update the {@link Geometry} of the given {@link Cell} using
   * <mxCell.setGeometry> and return the previous {@link Geometry}.
   */
  geometryForCellChanged(cell: Cell, geometry: Geometry | null): Geometry | null {
    const previous = cell.getGeometry();
    cell.setGeometry(geometry);
    return previous;
  }

  /**
   * Sets the style of the given {@link Cell} using {@link StyleChange} and
   * adds the change to the current transaction.
   *
   * @param {Cell} cell  whose style should be changed.
   * @param style  String of the form [stylename;|key=value;] to specify
   * the new cell style.
   */
  setStyle(cell: Cell, style: string | null) {
    if (style !== cell.getStyle()) {
      this.execute(new StyleChange(this, cell, style));
    }
  }

  /**
   * Inner callback to update the style of the given {@link Cell}
   * using <mxCell.setStyle> and return the previous style.
   *
   * @param {Cell} cell  that specifies the cell to be updated.
   * @param style  String of the form [stylename;|key=value;] to specify
   * the new cell style.
   */
  styleForCellChanged(cell: Cell, style: string | null) {
    const previous = cell.getStyle();
    cell.setStyle(style);
    return previous;
  }

  /**
   * Sets the collapsed state of the given {@link Cell} using {@link CollapseChange}
   * and adds the change to the current transaction.
   *
   * @param {Cell} cell  whose collapsed state should be changed.
   * @param collapsed  Boolean that specifies the new collpased state.
   */
  setCollapsed(cell: Cell, collapsed: boolean): boolean {
    if (collapsed !== cell.isCollapsed()) {
      this.execute(new CollapseChange(this, cell, collapsed));
    }
    return collapsed;
  }

  /**
   * Inner callback to update the collapsed state of the
   * given {@link Cell} using <mxCell.setCollapsed> and return
   * the previous collapsed state.
   *
   * @param {Cell} cell  that specifies the cell to be updated.
   * @param collapsed  Boolean that specifies the new collpased state.
   */
  collapsedStateForCellChanged(cell: Cell, collapsed: boolean): boolean {
    const previous = cell.isCollapsed();
    cell.setCollapsed(collapsed);
    return previous;
  }

  /**
   * Sets the visible state of the given {@link Cell} using {@link VisibleChange} and
   * adds the change to the current transaction.
   *
   * @param {Cell} cell  whose visible state should be changed.
   * @param visible  Boolean that specifies the new visible state.
   */
  setVisible(cell: Cell, visible: boolean): boolean {
    if (visible !== cell.isVisible()) {
      this.execute(new VisibleChange(this, cell, visible));
    }
    return visible;
  }

  /**
   * Inner callback to update the visible state of the
   * given {@link Cell} using <mxCell.setCollapsed> and return
   * the previous visible state.
   *
   * @param {Cell} cell  that specifies the cell to be updated.
   * @param visible  Boolean that specifies the new visible state.
   */
  visibleStateForCellChanged(cell: Cell, visible: boolean): boolean {
    const previous = cell.isVisible();
    cell.setVisible(visible);
    return previous;
  }

  /**
   * Executes the given edit and fires events if required. The edit object
   * requires an execute function which is invoked. The edit is added to the
   * {@link currentEdit} between {@link beginUpdate} and {@link endUpdate} calls, so that
   * events will be fired if this execute is an individual transaction, that
   * is, if no previous {@link beginUpdate} calls have been made without calling
   * {@link endUpdate}. This implementation fires an {@link execute} event before
   * executing the given change.
   *
   * @param change  Object that described the change.
   */
  execute(change: any): void {
    change.execute();
    this.beginUpdate();
    this.currentEdit.add(change);
    this.fireEvent(new EventObject(InternalEvent.EXECUTE, { change }));
    // New global executed event
    this.fireEvent(new EventObject(InternalEvent.EXECUTED, { change }));
    this.endUpdate();
  }

  /**
   * Increments the {@link updateLevel} by one. The event notification
   * is queued until {@link updateLevel} reaches 0 by use of
   * {@link endUpdate}.
   *
   * All changes on {@link GraphDataModel} are transactional,
   * that is, they are executed in a single undoable change
   * on the model (without transaction isolation).
   * Therefore, if you want to combine any
   * number of changes into a single undoable change,
   * you should group any two or more API calls that
   * modify the graph model between {@link beginUpdate}
   * and {@link endUpdate} calls as shown here:
   *
   * ```javascript
   * var model = graph.getDataModel();
   * var parent = graph.getDefaultParent();
   * var index = model.getChildCount(parent);
   * model.beginUpdate();
   * try
   * {
   *   model.add(parent, v1, index);
   *   model.add(parent, v2, index+1);
   * }
   * finally
   * {
   *   model.endUpdate();
   * }
   * ```
   *
   * Of course there is a shortcut for appending a
   * sequence of cells into the default parent:
   *
   * ```javascript
   * graph.addCells([v1, v2]).
   * ```
   */
  beginUpdate(): void {
    this.updateLevel += 1;
    this.fireEvent(new EventObject(InternalEvent.BEGIN_UPDATE));

    if (this.updateLevel === 1) {
      this.fireEvent(new EventObject(InternalEvent.START_EDIT));
    }
  }

  /**
   * Decrements the {@link updateLevel} by one and fires an {@link undo}
   * event if the {@link updateLevel} reaches 0. This function
   * indirectly fires a {@link change} event by invoking the notify
   * function on the {@link currentEdit} und then creates a new
   * {@link currentEdit} using {@link createUndoableEdit}.
   *
   * The {@link undo} event is fired only once per edit, whereas
   * the {@link change} event is fired whenever the notify
   * function is invoked, that is, on undo and redo of
   * the edit.
   */
  endUpdate(): void {
    this.updateLevel -= 1;

    if (this.updateLevel === 0) {
      this.fireEvent(new EventObject(InternalEvent.END_EDIT));
    }

    if (!this.endingUpdate) {
      this.endingUpdate = this.updateLevel === 0;
      this.fireEvent(new EventObject(InternalEvent.END_UPDATE, { edit: this.currentEdit }));

      try {
        if (this.endingUpdate && !this.currentEdit.isEmpty()) {
          this.fireEvent(
            new EventObject(InternalEvent.BEFORE_UNDO, { edit: this.currentEdit })
          );
          const tmp = this.currentEdit;
          this.currentEdit = this.createUndoableEdit();
          tmp.notify();
          this.fireEvent(new EventObject(InternalEvent.UNDO, { edit: tmp }));
        }
      } finally {
        this.endingUpdate = false;
      }
    }
  }

  /**
   * Creates a new {@link UndoableEdit} that implements the
   * notify function to fire a {@link change} and {@link notify} event
   * through the {@link UndoableEdit}'s source.
   *
   * @param significant  Optional boolean that specifies if the edit to be created is
   * significant. Default is true.
   */
  createUndoableEdit(significant: boolean = true): UndoableEdit {
    const edit = new UndoableEdit(this, significant);

    edit.notify = () => {
      // LATER: Remove changes property (deprecated)
      edit.source.fireEvent(new EventObject(InternalEvent.CHANGE, { edit, changes: edit.changes }));
      edit.source.fireEvent(new EventObject(InternalEvent.NOTIFY, { edit, changes: edit.changes }));
    };

    return edit;
  }

  /**
   * Merges the children of the given cell into the given target cell inside
   * this model. All cells are cloned unless there is a corresponding cell in
   * the model with the same id, in which case the source cell is ignored and
   * all edges are connected to the corresponding cell in this model. Edges
   * are considered to have no identity and are always cloned unless the
   * cloneAllEdges flag is set to false, in which case edges with the same
   * id in the target model are reconnected to reflect the terminals of the
   * source edges.
   */
  // mergeChildren(from: Transactions, to: Transactions, cloneAllEdges?: boolean): void;
  mergeChildren(from: Cell, to: Cell, cloneAllEdges: boolean = true): void {
    this.beginUpdate();
    try {
      const mapping: any = {};
      this.mergeChildrenImpl(from, to, cloneAllEdges, mapping);

      // Post-processes all edges in the mapping and
      // reconnects the terminals to the corresponding
      // cells in the target model
      for (const key in mapping) {
        const cell = mapping[key];
        let terminal = cell.getTerminal(true);

        if (terminal != null) {
          terminal = mapping[CellPath.create(terminal)];
          this.setTerminal(cell, terminal, true);
        }

        terminal = cell.getTerminal(false);

        if (terminal != null) {
          terminal = mapping[CellPath.create(terminal)];
          this.setTerminal(cell, terminal, false);
        }
      }
    } finally {
      this.endUpdate();
    }
  }

  /**
   * Clones the children of the source cell into the given target cell in
   * this model and adds an entry to the mapping that maps from the source
   * cell to the target cell with the same id or the clone of the source cell
   * that was inserted into this model.
   */
  // mergeChildrenImpl(from: Transactions, to: Transactions, cloneAllEdges: boolean, mapping: any): void;
  mergeChildrenImpl(from: Cell, to: Cell, cloneAllEdges: boolean, mapping: any = {}) {
    this.beginUpdate();
    try {
      const childCount = from.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const cell = <Cell>from.getChildAt(i);

        if (typeof cell.getId === 'function') {
          const id: string = <string>cell.getId();
          let target =
            id != null && (!cell.isEdge() || !cloneAllEdges) ? this.getCell(id) : null;

          // Clones and adds the child if no cell exists for the id
          if (target == null) {
            const clone = cell.clone();
            clone.setId(id);

            // Sets the terminals from the original cell to the clone
            // because the lookup uses strings not cells in JS
            clone.setTerminal(cell.getTerminal(true), true);
            clone.setTerminal(cell.getTerminal(false), false);

            // Do *NOT* use model.add as this will move the edge away
            // from the parent in updateEdgeParent if maintainEdgeParent
            // is enabled in the target model
            target = to.insert(clone);
            this.cellAdded(target);
          }

          // Stores the mapping for later reconnecting edges
          mapping[CellPath.create(cell)] = target;

          // Recurses
          this.mergeChildrenImpl(cell, <Cell>target, cloneAllEdges, mapping);
        }
      }
    } finally {
      this.endUpdate();
    }
  }

  //
  // Cell Cloning
  //

  /**
   * Returns a deep clone of the given {@link Cell}` (including
   * the children) which is created using {@link cloneCells}`.
   *
   * @param {Cell} cell  to be cloned.
   */
  cloneCell(cell: Cell | null=null, includeChildren: boolean=true): Cell | null {
    if (cell != null) {
      return new CellArray(cell).cloneCells(includeChildren)[0];
    }
    return null;
  }
}

/**
 * Codec for <Transactions>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
 */
export class ModelCodec extends ObjectCodec {
  constructor() {
    super(new GraphDataModel());
  }

  /**
   * Encodes the given <Transactions> by writing a (flat) XML sequence of
   * cell nodes as produced by the <CellCodec>. The sequence is
   * wrapped-up in a node with the name root.
   */
  encodeObject(enc: any, obj: Cell, node: Element) {
    const rootNode = enc.document.createElement('root');
    enc.encodeCell(obj.getRoot(), rootNode);
    node.appendChild(rootNode);
  }

  /**
   * Overrides decode child to handle special child nodes.
   */
  decodeChild(dec: any, child: Element, obj: Cell | GraphDataModel) {
    if (child.nodeName === 'root') {
      this.decodeRoot(dec, child, <GraphDataModel>obj);
    } else {
      this.decodeChild.apply(this, [dec, child, obj]);
    }
  }

  /**
   * Reads the cells into the graph model. All cells
   * are children of the root element in the node.
   */
  decodeRoot(dec: any, root: Element, model: GraphDataModel) {
    let rootCell = null;
    let tmp = root.firstChild;

    while (tmp != null) {
      const cell = dec.decodeCell(tmp);

      if (cell != null && cell.getParent() == null) {
        rootCell = cell;
      }
      tmp = tmp.nextSibling;
    }

    // Sets the root on the model if one has been decoded
    if (rootCell != null) {
      model.setRoot(rootCell);
    }
  }
}

CodecRegistry.register(new ModelCodec());
export default GraphDataModel;
