/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import InternalEvent from '../view/event/InternalEvent';
import EventObject from '../view/event/EventObject';
import EventSource from '../view/event/EventSource';

/**
 * @class mxUndoManager
 *
 * Implements a command history. When changing the graph model, an
 * {@link mxUndoableChange} object is created at the start of the transaction (when
 * model.beginUpdate is called). All atomic changes are then added to this
 * object until the last model.endUpdate call, at which point the
 * {@link mxUndoableEdit} is dispatched in an event, and added to the history inside
 * {@link mxUndoManager}. This is done by an event listener in
 * {@link mxEditor.installUndoHandler}.
 *
 * Each atomic change of the model is represented by an object (eg.
 * {@link mxRootChange}, {@link mxChildChange}, {@link mxTerminalChange} etc) which contains the
 * complete undo information. The {@link mxUndoManager} also listens to the
 * {@link mxGraphView} and stores it's changes to the current root as insignificant
 * undoable changes, so that drilling (step into, step up) is undone.
 *
 * This means when you execute an atomic change on the model, then change the
 * current root on the view and click undo, the change of the root will be
 * undone together with the change of the model so that the display represents
 * the state at which the model was changed. However, these changes are not
 * transmitted for sharing as they do not represent a state change.
 *
 * ### Example
 *
 * When adding an undo manager to a graph, make sure to add it
 * to the model and the view as well to maintain a consistent
 * display across multiple undo/redo steps.
 *
 * @example
 * ```javascript
 * var undoManager = new mxUndoManager();
 * var listener(sender, evt)
 * {
 *   undoManager.undoableEditHappened(evt.getProperty('edit'));
 * };
 * graph.getModel().addListener(mxEvent.UNDO, listener);
 * graph.getView().addListener(mxEvent.UNDO, listener);
 * ```
 *
 * The code creates a function that informs the undoManager
 * of an undoable edit and binds it to the undo event of
 * {@link mxGraphModel} and {@link mxGraphView} using
 * {@link EventSource.addListener}.
 *
 * ### Event: mxEvent.CLEAR
 *
 * Fires after {@link clear} was invoked. This event has no properties.
 *
 * ### Event: mxEvent.UNDO
 *
 * Fires afer a significant edit was undone in {@link undo}. The `edit`
 * property contains the {@link mxUndoableEdit} that was undone.
 *
 * ### Event: mxEvent.REDO
 *
 * Fires afer a significant edit was redone in {@link redo}. The `edit`
 * property contains the {@link mxUndoableEdit} that was redone.
 *
 * ### Event: mxEvent.ADD
 *
 * Fires after an undoable edit was added to the history. The `edit`
 * property contains the {@link mxUndoableEdit} that was added.
 */
class mxUndoManager extends EventSource {
  constructor(size) {
    super();

    this.size = size != null ? size : 100;
    this.clear();
  }

  /**
   * Maximum command history size. 0 means unlimited history. Default is
   * 100.
   * @default 100
   */
  // size: number;
  size = null;

  /**
   * Array that contains the steps of the command history.
   */
  // history: Array<mxUndoableEdit>;
  history = null;

  /**
   * Index of the element to be added next.
   */
  // indexOfNextAdd: number;
  indexOfNextAdd = 0;

  /**
   * Returns true if the history is empty.
   */
  // isEmpty(): boolean;
  isEmpty() {
    return this.history.length == 0;
  }

  /**
   * Clears the command history.
   */
  // clear(): void;
  clear() {
    this.history = [];
    this.indexOfNextAdd = 0;
    this.fireEvent(new EventObject(InternalEvent.CLEAR));
  }

  /**
   * Returns true if an undo is possible.
   */
  // canUndo(): boolean;
  canUndo() {
    return this.indexOfNextAdd > 0;
  }

  /**
   * Undoes the last change.
   */
  // undo(): void;
  undo() {
    while (this.indexOfNextAdd > 0) {
      const edit = this.history[--this.indexOfNextAdd];
      edit.undo();

      if (edit.isSignificant()) {
        this.fireEvent(new EventObject(InternalEvent.UNDO, 'edit', edit));
        break;
      }
    }
  }

  /**
   * Returns true if a redo is possible.
   */
  // canRedo(): boolean;
  canRedo() {
    return this.indexOfNextAdd < this.history.length;
  }

  /**
   * Redoes the last change.
   */
  // redo(): void;
  redo() {
    const n = this.history.length;

    while (this.indexOfNextAdd < n) {
      const edit = this.history[this.indexOfNextAdd++];
      edit.redo();

      if (edit.isSignificant()) {
        this.fireEvent(new EventObject(InternalEvent.REDO, 'edit', edit));
        break;
      }
    }
  }

  /**
   * Method to be called to add new undoable edits to the <history>.
   */
  // undoableEditHappened(undoableEdit: mxUndoableEdit): void;
  undoableEditHappened(undoableEdit) {
    this.trim();

    if (this.size > 0 && this.size == this.history.length) {
      this.history.shift();
    }

    this.history.push(undoableEdit);
    this.indexOfNextAdd = this.history.length;
    this.fireEvent(new EventObject(InternalEvent.ADD, 'edit', undoableEdit));
  }

  /**
   * Removes all pending steps after <indexOfNextAdd> from the history,
   * invoking die on each edit. This is called from <undoableEditHappened>.
   */
  // trim(): void;
  trim() {
    if (this.history.length > this.indexOfNextAdd) {
      const edits = this.history.splice(
        this.indexOfNextAdd,
        this.history.length - this.indexOfNextAdd
      );

      for (let i = 0; i < edits.length; i += 1) {
        edits[i].die();
      }
    }
  }
}

export default mxUndoManager;
