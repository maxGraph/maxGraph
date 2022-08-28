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

import InternalEvent from '../event/InternalEvent';
import EventObject from '../event/EventObject';
import EventSource from '../event/EventSource';
import UndoableEdit from './UndoableEdit';

/**
 * @class UndoManager
 *
 * Implements a command history. When changing the graph model, an
 * {@link mxUndoableChange} object is created at the start of the transaction (when
 * model.beginUpdate is called). All atomic changes are then added to this
 * object until the last model.endUpdate call, at which point the
 * {@link mxUndoableEdit} is dispatched in an event, and added to the history inside
 * {@link UndoManager}. This is done by an event listener in
 * {@link Editor.installUndoHandler}.
 *
 * Each atomic change of the model is represented by an object (eg.
 * {@link mxRootChange}, {@link mxChildChange}, {@link mxTerminalChange} etc) which contains the
 * complete undo information. The {@link UndoManager} also listens to the
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
 * ```javascript
 * var undoManager = new UndoManager();
 * var listener(sender, evt)
 * {
 *   undoManager.undoableEditHappened(evt.getProperty('edit'));
 * };
 * graph.getDataModel().addListener(mxEvent.UNDO, listener);
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
class UndoManager extends EventSource {
  constructor(size: number=100) {
    super();
    this.size = size;
    this.clear();
  }

  /**
   * Maximum command history size. 0 means unlimited history. Default is
   * 100.
   * @default 100
   */
  size: number = 100;

  /**
   * Array that contains the steps of the command history.
   */
  history: UndoableEdit[] = [];

  /**
   * Index of the element to be added next.
   */
  indexOfNextAdd: number = 0;

  /**
   * Returns true if the history is empty.
   */
  isEmpty(): boolean {
    return this.history.length == 0;
  }

  /**
   * Clears the command history.
   */
  clear(): void {
    this.history = [];
    this.indexOfNextAdd = 0;
    this.fireEvent(new EventObject(InternalEvent.CLEAR));
  }

  /**
   * Returns true if an undo is possible.
   */
  canUndo(): boolean {
    return this.indexOfNextAdd > 0;
  }

  /**
   * Undoes the last change.
   */
  undo(): void {
    while (this.indexOfNextAdd > 0) {
      const edit = this.history[--this.indexOfNextAdd];
      edit.undo();

      if (edit.isSignificant()) {
        this.fireEvent(new EventObject(InternalEvent.UNDO, { edit }));
        break;
      }
    }
  }

  /**
   * Returns true if a redo is possible.
   */
  canRedo(): boolean {
    return this.indexOfNextAdd < this.history.length;
  }

  /**
   * Redoes the last change.
   */
  redo(): void {
    const n = this.history.length;

    while (this.indexOfNextAdd < n) {
      const edit = this.history[this.indexOfNextAdd++];
      edit.redo();

      if (edit.isSignificant()) {
        this.fireEvent(new EventObject(InternalEvent.REDO, { edit }));
        break;
      }
    }
  }

  /**
   * Method to be called to add new undoable edits to the <history>.
   */
  undoableEditHappened(undoableEdit: UndoableEdit): void {
    this.trim();

    if (this.size > 0 && this.size == this.history.length) {
      this.history.shift();
    }

    this.history.push(undoableEdit);
    this.indexOfNextAdd = this.history.length;
    this.fireEvent(new EventObject(InternalEvent.ADD, { edit: undoableEdit }));
  }

  /**
   * Removes all pending steps after <indexOfNextAdd> from the history,
   * invoking die on each edit. This is called from <undoableEditHappened>.
   */
  trim(): void {
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

export default UndoManager;
