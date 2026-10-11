/*
Copyright 2026-present The maxGraph project Contributors

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

const builtInEventNames = {
  /**
   * Specifies the event name for mouseDown.
   */
  MOUSE_DOWN: 'mouseDown',

  /**
   * Specifies the event name for mouseMove.
   */
  MOUSE_MOVE: 'mouseMove',

  /**
   * Specifies the event name for mouseUp.
   */
  MOUSE_UP: 'mouseUp',

  /**
   * Specifies the event name for activate.
   */
  ACTIVATE: 'activate',

  /**
   * Specifies the event name for resizeStart.
   */
  RESIZE_START: 'resizeStart',

  /**
   * Specifies the event name for resize.
   */
  RESIZE: 'resize',

  /**
   * Specifies the event name for resizeEnd.
   */
  RESIZE_END: 'resizeEnd',

  /**
   * Specifies the event name for moveStart.
   */
  MOVE_START: 'moveStart',

  /**
   * Specifies the event name for move.
   */
  MOVE: 'move',

  /**
   * Specifies the event name for moveEnd.
   */
  MOVE_END: 'moveEnd',

  /**
   * Specifies the event name for panStart.
   */
  PAN_START: 'panStart',

  /**
   * Specifies the event name for pan.
   */
  PAN: 'pan',

  /**
   * Specifies the event name for panEnd.
   */
  PAN_END: 'panEnd',

  /**
   * Specifies the event name for minimize.
   */
  MINIMIZE: 'minimize',

  /**
   * Specifies the event name for normalize.
   */
  NORMALIZE: 'normalize',

  /**
   * Specifies the event name for maximize.
   */
  MAXIMIZE: 'maximize',

  /**
   * Specifies the event name for hide.
   */
  HIDE: 'hide',

  /**
   * Specifies the event name for show.
   */
  SHOW: 'show',

  /**
   * Specifies the event name for close.
   */
  CLOSE: 'close',

  /**
   * Specifies the event name for destroy.
   */
  DESTROY: 'destroy',

  /**
   * Specifies the event name for refresh.
   */
  REFRESH: 'refresh',

  /**
   * Specifies the event name for size.
   */
  SIZE: 'size',

  /**
   * Specifies the event name for select.
   */
  SELECT: 'select',

  /**
   * Specifies the event name for fired.
   */
  FIRED: 'fired',

  /**
   * Specifies the event name for fireMouseEvent.
   */
  FIRE_MOUSE_EVENT: 'fireMouseEvent',

  /**
   * Specifies the event name for gesture.
   */
  GESTURE: 'gesture',

  /**
   * Specifies the event name for tapAndHold.
   */
  TAP_AND_HOLD: 'tapAndHold',

  /**
   * Specifies the event name for get.
   */
  GET: 'get',

  /**
   * Specifies the event name for receive.
   */
  RECEIVE: 'receive',

  /**
   * Specifies the event name for connect.
   */
  CONNECT: 'connect',

  /**
   * Specifies the event name for disconnect.
   */
  DISCONNECT: 'disconnect',

  /**
   * Specifies the event name for suspend.
   */
  SUSPEND: 'suspend',

  /**
   * Specifies the event name for resume.
   */
  RESUME: 'resume',

  /**
   * Specifies the event name for mark.
   */
  MARK: 'mark',

  /**
   * Specifies the event name for root.
   */
  ROOT: 'root',

  /**
   * Specifies the event name for post.
   */
  POST: 'post',

  /**
   * Specifies the event name for open.
   */
  OPEN: 'open',

  /**
   * Specifies the event name for save.
   */
  SAVE: 'save',

  /**
   * Specifies the event name for beforeAddVertex.
   */
  BEFORE_ADD_VERTEX: 'beforeAddVertex',

  /**
   * Specifies the event name for addVertex.
   */
  ADD_VERTEX: 'addVertex',

  /**
   * Specifies the event name for afterAddVertex.
   */
  AFTER_ADD_VERTEX: 'afterAddVertex',

  /**
   * Specifies the event name for done.
   */
  DONE: 'done',

  /**
   * Specifies the event name for execute.
   */
  EXECUTE: 'execute',

  /**
   * Specifies the event name for executed.
   */
  EXECUTED: 'executed',

  /**
   * Specifies the event name for beginUpdate.
   */
  BEGIN_UPDATE: 'beginUpdate',

  /**
   * Specifies the event name for startEdit.
   */
  START_EDIT: 'startEdit',

  /**
   * Specifies the event name for endUpdate.
   */
  END_UPDATE: 'endUpdate',

  /**
   * Specifies the event name for endEdit.
   */
  END_EDIT: 'endEdit',

  /**
   * Specifies the event name for beforeUndo.
   */
  BEFORE_UNDO: 'beforeUndo',

  /**
   * Specifies the event name for undo.
   */
  UNDO: 'undo',

  /**
   * Specifies the event name for redo.
   */
  REDO: 'redo',

  /**
   * Specifies the event name for change.
   */
  CHANGE: 'change',

  /**
   * Specifies the event name for notify.
   */
  NOTIFY: 'notify',

  /**
   * Specifies the event name for layoutCells.
   */
  LAYOUT_CELLS: 'layoutCells',

  /**
   * Specifies the event name for click.
   */
  CLICK: 'click',

  /**
   * Specifies the event name for scale.
   */
  SCALE: 'scale',

  /**
   * Specifies the event name for translate.
   */
  TRANSLATE: 'translate',

  /**
   * Specifies the event name for scaleAndTranslate.
   */
  SCALE_AND_TRANSLATE: 'scaleAndTranslate',

  /**
   * Specifies the event name for up.
   */
  UP: 'up',

  /**
   * Specifies the event name for down.
   */
  DOWN: 'down',

  /**
   * Specifies the event name for add.
   */
  ADD: 'add',

  /**
   * Specifies the event name for remove.
   */
  REMOVE: 'remove',

  /**
   * Specifies the event name for clear.
   */
  CLEAR: 'clear',

  /**
   * Specifies the event name for addCells.
   */
  ADD_CELLS: 'addCells',

  /**
   * Specifies the event name for cellsAdded.
   */
  CELLS_ADDED: 'cellsAdded',

  /**
   * Specifies the event name for moveCells.
   */
  MOVE_CELLS: 'moveCells',

  /**
   * Specifies the event name for cellsMoved.
   */
  CELLS_MOVED: 'cellsMoved',

  /**
   * Specifies the event name for resizeCells.
   */
  RESIZE_CELLS: 'resizeCells',

  /**
   * Specifies the event name for cellsResized.
   */
  CELLS_RESIZED: 'cellsResized',

  /**
   * Specifies the event name for toggleCells.
   */
  TOGGLE_CELLS: 'toggleCells',

  /**
   * Specifies the event name for cellsToggled.
   */
  CELLS_TOGGLED: 'cellsToggled',

  /**
   * Specifies the event name for orderCells.
   */
  ORDER_CELLS: 'orderCells',

  /**
   * Specifies the event name for cellsOrdered.
   */
  CELLS_ORDERED: 'cellsOrdered',

  /**
   * Specifies the event name for removeCells.
   */
  REMOVE_CELLS: 'removeCells',

  /**
   * Specifies the event name for cellsRemoved.
   */
  CELLS_REMOVED: 'cellsRemoved',

  /**
   * Specifies the event name for groupCells.
   */
  GROUP_CELLS: 'groupCells',

  /**
   * Specifies the event name for ungroupCells.
   */
  UNGROUP_CELLS: 'ungroupCells',

  /**
   * Specifies the event name for removeCellsFromParent.
   */
  REMOVE_CELLS_FROM_PARENT: 'removeCellsFromParent',

  /**
   * Specifies the event name for foldCells.
   */
  FOLD_CELLS: 'foldCells',

  /**
   * Specifies the event name for cellsFolded.
   */
  CELLS_FOLDED: 'cellsFolded',

  /**
   * Specifies the event name for alignCells.
   */
  ALIGN_CELLS: 'alignCells',

  /**
   * Specifies the event name for labelChanged.
   */
  LABEL_CHANGED: 'labelChanged',

  /**
   * Specifies the event name for connectCell.
   */
  CONNECT_CELL: 'connectCell',

  /**
   * Specifies the event name for cellConnected.
   */
  CELL_CONNECTED: 'cellConnected',

  /**
   * Specifies the event name for splitEdge.
   */
  SPLIT_EDGE: 'splitEdge',

  /**
   * Specifies the event name for flipEdge.
   */
  FLIP_EDGE: 'flipEdge',

  /**
   * Specifies the event name for startEditing.
   */
  START_EDITING: 'startEditing',

  /**
   * Specifies the event name for editingStarted.
   */
  EDITING_STARTED: 'editingStarted',

  /**
   * Specifies the event name for editingStopped.
   */
  EDITING_STOPPED: 'editingStopped',

  /**
   * Specifies the event name for addOverlay.
   */
  ADD_OVERLAY: 'addOverlay',

  /**
   * Specifies the event name for removeOverlay.
   */
  REMOVE_OVERLAY: 'removeOverlay',

  /**
   * Specifies the event name for updateCellSize.
   */
  UPDATE_CELL_SIZE: 'updateCellSize',

  /**
   * Specifies the event name for escape.
   */
  ESCAPE: 'escape',

  /**
   * Specifies the event name for doubleClick.
   */
  DOUBLE_CLICK: 'doubleClick',

  /**
   * Specifies the event name for start.
   */
  START: 'start',

  /**
   * Specifies the event name for reset.
   */
  RESET: 'reset',
} as const;

type BuiltInEventNames = typeof builtInEventNames;

/**
 * Type of {@link EventNames}, listing the names of the events fired by maxGraph.
 *
 * @category Event
 * @since 0.26.0
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- an interface rather than a type alias, to keep it open to module augmentation
export interface EventNamesMap extends BuiltInEventNames {}

/**
 * Names of the events fired by maxGraph, to be used when adding a listener with {@link EventSource.addListener} or when
 * firing an {@link EventObject}.
 *
 * Before 0.26.0, these names were static properties of {@link InternalEvent}.
 *
 * @category Event
 * @since 0.26.0
 */
export const EventNames: EventNamesMap = builtInEventNames;

/**
 * Union of the values of {@link EventNames}.
 *
 * @category Event
 * @since 0.26.0
 */
export type EventName = Required<EventNamesMap>[keyof EventNamesMap];
