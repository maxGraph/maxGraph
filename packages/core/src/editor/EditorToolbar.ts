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

import Client from '../Client';
import MaxToolbar from '../gui/MaxToolbar';
import Geometry from '../view/geometry/Geometry';
import { convertPoint } from '../util/styleUtils';
import InternalEvent from '../view/event/InternalEvent';
import { getClientX, getClientY } from '../util/EventUtils';
import { makeDraggable } from '../util/gestureUtils';
import Editor from './Editor';
import Cell from '../view/cell/Cell';
import { Graph } from '../view/Graph';
import EventObject from '../view/event/EventObject';
import type { DropHandler } from '../view/other/DragSource';

/**
 * Toolbar for the editor. This modifies the state of the graph
 * or inserts new cells upon mouse clicks.
 *
 * @Example:
 *
 * Create a toolbar with a button to copy the selection into the clipboard,
 * and a combo box with one action to paste the selection from the clipboard
 * into the graph.
 *
 * ```
 * var toolbar = new EditorToolbar(container, editor);
 * toolbar.addItem('Copy', null, 'copy');
 *
 * var combo = toolbar.addActionCombo('More actions...');
 * toolbar.addActionOption(combo, 'Paste', 'paste');
 * ```
 *
 * @Codec:
 *
 * This class uses the {@link DefaultToolbarCodec} to read configuration
 * data into an existing instance. See {@link DefaultToolbarCodec} for a
 * description of the configuration format.
 */
export class EditorToolbar {
  constructor(container: HTMLElement | null = null, editor: Editor | null = null) {
    this.editor = editor;

    if (container != null && editor != null) {
      this.init(container);
    }
  }

  /**
   * Reference to the enclosing {@link Editor}.
   */
  editor: Editor | null;

  /**
   * Holds the internal {@link MaxToolbar}.
   */
  toolbar: MaxToolbar | null = null;

  /**
   * Reference to the function used to reset the {@link toolbar}.
   */
  resetHandler: Function | null = null;

  /**
   * Defines the spacing between existing and new vertices in gridSize units when a new vertex is dropped on an existing cell.  Default is 4 (40 pixels).
   *
   * @Default is 4
   */
  spacing = 4;

  /**
   * Specifies if elements should be connected if new cells are dropped onto connectable elements.
   *
   * @Default is false.
   */
  connectOnDrop = false;

  /**
   * Constructs the {@link toolbar} for the given container and installs a listener that updates the {@link Editor.insertFunction} on {@link editor} if an item is selected in the toolbar.  This assumes that {@link editor} is not null.
   */
  init(container: HTMLElement): void {
    if (container != null) {
      this.toolbar = new MaxToolbar(container);

      // Installs the insert function in the editor if an item is
      // selected in the toolbar
      this.toolbar.addListener(
        InternalEvent.SELECT,
        (sender: Element, evt: EventObject) => {
          const funct = evt.getProperty('function');

          if (funct != null) {
            (<Editor>this.editor).insertFunction = () => {
              funct.apply(this, [container]);
              (<MaxToolbar>this.toolbar).resetMode();
            };
          } else {
            (<Editor>this.editor).insertFunction = null;
          }
        }
      );

      // Resets the selected tool after a doubleclick or escape keystroke
      this.resetHandler = () => {
        if (this.toolbar != null) {
          this.toolbar.resetMode(true);
        }
      };

      (<Editor>this.editor).graph.addListener(
        InternalEvent.DOUBLE_CLICK,
        this.resetHandler
      );
      (<Editor>this.editor).addListener(InternalEvent.ESCAPE, this.resetHandler);
    }
  }

  /**
   * Adds a new item that executes the given action in {@link editor}. The title,
   * icon and pressedIcon are used to display the toolbar item.
   *
   * @param title - String that represents the title (tooltip) for the item.
   * @param icon - URL of the icon to be used for displaying the item.
   * @param action - Name of the action to execute when the item is clicked.
   * @param pressed - Optional URL of the icon for the pressed state.
   */
  addItem(title: string, icon: string, action: string, pressed?: string): any {
    const clickHandler = () => {
      if (action != null && action.length > 0) {
        (<Editor>this.editor).execute(action);
      }
    };
    return (<MaxToolbar>this.toolbar).addItem(title, icon, clickHandler, pressed);
  }

  /**
   * Adds a vertical separator using the optional icon.
   *
   * @param icon - Optional URL of the icon that represents the vertical separator. Default is {@link Client.imageBasePath} + ‘/separator.gif’.
   */
  addSeparator(icon?: string): void {
    icon = icon || `${Client.imageBasePath}/separator.gif`;
    (<MaxToolbar>this.toolbar).addSeparator(icon);
  }

  /**
   * Helper method to invoke {@link MaxToolbar.addCombo} on toolbar and return the resulting DOM node.
   */
  addCombo(): HTMLElement {
    return (<MaxToolbar>this.toolbar).addCombo();
  }

  /**
   * Helper method to invoke <MaxToolbar.addActionCombo> on <toolbar> using
   * the given title and return the resulting DOM node.
   *
   * @param title String that represents the title of the combo.
   */
  addActionCombo(title: string) {
    return (<MaxToolbar>this.toolbar).addActionCombo(title);
  }

  /**
   * Binds the given action to a option with the specified label in the given combo.  Combo is an object returned from an earlier call to {@link addCombo} or {@link addActionCombo}.
   *
   * @param combo - DOM node that represents the combo box.
   * @param title - String that represents the title of the combo.
   * @param action - Name of the action to execute in {@link editor}.
   */
  addActionOption(combo: HTMLSelectElement, title: string, action: string): void {
    const clickHandler = () => {
      (<Editor>this.editor).execute(action);
    };

    this.addOption(combo, title, clickHandler);
  }

  /**
   * Helper method to invoke {@link MaxToolbar.addOption} on {@link toolbar} and return the resulting DOM node that represents the option.
   *
   * @param combo - DOM node that represents the combo box.
   * @param title - String that represents the title of the combo.
   * @param value - Object that represents the value of the option.
   */
  addOption(
    combo: HTMLSelectElement,
    title: string,
    value: string | ((evt: any) => void) | null
  ): HTMLElement {
    return (<MaxToolbar>this.toolbar).addOption(combo, title, value);
  }

  /**
   * Creates an item for selecting the given mode in the {@link editor}'s graph.
   * Supported modenames are select, connect and pan.
   *
   * @param title - String that represents the title of the item.
   * @param icon - URL of the icon that represents the item.
   * @param mode - String that represents the mode name to be used in {@link Editor.setMode}.
   * @param pressed - Optional URL of the icon that represents the pressed state.
   * @param funct - Optional JavaScript function that takes the {@link Editor} as the first and only argument that is executed after the mode has been selected.
   */
  addMode(
    title: string,
    icon: string,
    mode: string,
    pressed: string | null = null,
    funct: Function | null = null
  ): any {
    const clickHandler = () => {
      (<Editor>this.editor).setMode(mode);

      if (funct != null) {
        funct(<Editor>this.editor);
      }
    };
    return (<MaxToolbar>this.toolbar).addSwitchMode(title, icon, clickHandler, pressed);
  }

  /**
   * Creates an item for inserting a clone of the specified prototype cell into
   * the <editor>'s graph. The ptype may either be a cell or a function that
   * returns a cell.
   *
   * @param title String that represents the title of the item.
   * @param icon URL of the icon that represents the item.
   * @param ptype Function or object that represents the prototype cell. If ptype
   * is a function then it is invoked with no arguments to create new
   * instances.
   * @param pressed Optional URL of the icon that represents the pressed state.
   * @param insert Optional JavaScript function that handles an insert of the new
   * cell. This function takes the <Editor>, new cell to be inserted, mouse
   * event and optional <Cell> under the mouse pointer as arguments.
   * @param toggle Optional boolean that specifies if the item can be toggled.
   * Default is true.
   */
  addPrototype(
    title: string,
    icon: string,
    ptype: Function | Cell,
    pressed: string,
    insert: (
      editor: Editor,
      cell: Cell,
      me: MouseEvent,
      cellUnderMousePointer?: Cell | null
    ) => void,
    toggle = true
  ): HTMLImageElement | HTMLButtonElement {
    // Creates a wrapper function that is in charge of constructing
    // the new cell instance to be inserted into the graph
    const factory = () => {
      if (typeof ptype === 'function') {
        return ptype();
      }
      if (ptype != null) {
        return (<Editor>this.editor).graph.cloneCell(ptype);
      }
      return null;
    };

    // Defines the function for a click event on the graph
    // after this item has been selected in the toolbar
    const clickHandler = (evt: MouseEvent, cell: Cell | null) => {
      if (typeof insert === 'function') {
        insert(<Editor>this.editor, factory(), evt, cell);
      } else {
        this.drop(factory(), evt, cell);
      }

      (<MaxToolbar>this.toolbar).resetMode();
      InternalEvent.consume(evt);
    };

    const img = (<MaxToolbar>this.toolbar).addMode(
      title,
      icon,
      clickHandler,
      pressed,
      null,
      toggle
    );

    // Creates a wrapper function that calls the click handler without
    // the graph argument
    const dropHandler: DropHandler = (
      graph: Graph,
      evt: MouseEvent,
      cell: Cell | null
    ) => {
      clickHandler(evt, cell);
    };

    this.installDropHandler(img, dropHandler);
    return img;
  }

  /**
   * Handles a drop from a toolbar item to the graph. The given vertex
   * represents the new cell to be inserted. This invokes {@link insert} or
   * {@link connect} depending on the given target cell.
   *
   * @param vertex - {@link Cell} to be inserted.
   * @param evt - Mouse event that represents the drop.
   * @param target - Optional {@link Cell} that represents the drop target.
   */
  drop(vertex: Cell, evt: MouseEvent, target: Cell | null = null): void {
    const { graph } = <Editor>this.editor;
    const model = graph.getDataModel();

    if (
      target == null ||
      target.isEdge() ||
      !this.connectOnDrop ||
      !target.isConnectable()
    ) {
      while (target != null && !graph.isValidDropTarget(target, [vertex], evt)) {
        target = target.getParent();
      }
      this.insert(vertex, evt, target);
    } else {
      this.connect(vertex, evt, target);
    }
  }

  /**
   * Handles a drop by inserting the given vertex into the given parent cell
   * or the default parent if no parent is specified.
   *
   * @param vertex - {@link Cell} to be inserted.
   * @param evt - Mouse event that represents the drop.
   * @param target - Optional {@link Cell} that represents the parent.
   */
  insert(vertex: Cell, evt: MouseEvent, target: Cell | null = null): any {
    const { graph } = <Editor>this.editor;

    if (graph.canImportCell(vertex)) {
      const x = getClientX(evt);
      const y = getClientY(evt);
      const pt = convertPoint(graph.container, x, y);

      // Splits the target edge or inserts into target group
      if (
        target &&
        graph.isSplitEnabled() &&
        graph.isSplitTarget(target, [vertex], evt)
      ) {
        return graph.splitEdge(target, [vertex], null, pt.x, pt.y);
      }
      return (<Editor>this.editor).addVertex(target, vertex, pt.x, pt.y);
    }
    return null;
  }

  /**
   * Handles a drop by connecting the given vertex to the given source cell.
   *
   * @param vertex - {@link Cell} to be inserted.
   * @param evt - Mouse event that represents the drop.
   * @param source - Optional {@link Cell} that represents the source terminal.
   */
  connect(vertex: Cell, evt: MouseEvent, source: Cell | null = null): void {
    const { graph } = <Editor>this.editor;
    const model = graph.getDataModel();

    if (
      source != null &&
      vertex.isConnectable() &&
      graph.isEdgeValid(null, source, vertex)
    ) {
      let edge = null;

      model.beginUpdate();
      try {
        const geo = <Geometry>source.getGeometry();
        const g = (<Geometry>vertex.getGeometry()).clone();

        // Moves the vertex away from the drop target that will
        // be used as the source for the new connection
        g.x = geo.x + (geo.width - g.width) / 2;
        g.y = geo.y + (geo.height - g.height) / 2;

        const step = this.spacing * graph.gridSize;
        const dist = source.getDirectedEdgeCount(true) * 20;

        if ((<Editor>this.editor).horizontalFlow) {
          g.x += (g.width + geo.width) / 2 + step + dist;
        } else {
          g.y += (g.height + geo.height) / 2 + step + dist;
        }

        vertex.setGeometry(g);

        // Fires two add-events with the code below - should be fixed
        // to only fire one add event for both inserts
        const parent = source.getParent();
        graph.addCell(vertex, parent);
        graph.constrainChild(vertex);

        // Creates the edge using the editor instance and calls
        // the second function that fires an add event
        edge = (<Editor>this.editor).createEdge(source, vertex);

        if (edge.getGeometry() == null) {
          const edgeGeometry = new Geometry();
          edgeGeometry.relative = true;

          model.setGeometry(edge, edgeGeometry);
        }

        graph.addEdge(edge, parent, source, vertex);
      } finally {
        model.endUpdate();
      }

      graph.setSelectionCells([vertex, edge]);
      graph.scrollCellToVisible(vertex);
    }
  }

  /**
   * Makes the given img draggable using the given function for handling a drop event.
   *
   * @param img - DOM node that represents the image.
   * @param dropHandler - Function that handles a drop of the image.
   */
  installDropHandler(img: HTMLElement, dropHandler: DropHandler): void {
    const sprite = document.createElement('img');
    sprite.setAttribute('src', <string>img.getAttribute('src'));

    // Handles delayed loading of the images
    const loader = (evt: InternalEvent) => {
      // Preview uses the image node with double size. Later this can be
      // changed to use a separate preview and guides, but for this the
      // dropHandler must use the additional x- and y-arguments and the
      // dragsource which makeDraggable returns much be configured to
      // use guides via mxDragSource.isGuidesEnabled.
      sprite.style.width = `${2 * img.offsetWidth}px`;
      sprite.style.height = `${2 * img.offsetHeight}px`;

      makeDraggable(img, (<Editor>this.editor).graph, dropHandler, sprite);
      InternalEvent.removeListener(sprite, 'load', loader);
    };
  }

  /**
   * Destroys the {@link toolbar} associated with this object and removes all installed listeners.
   * This does normally not need to be called, the {@link toolbar} is destroyed automatically when the window unloads (in IE) by {@link Editor}.
   */
  destroy(): void {
    if (this.resetHandler != null) {
      (<Editor>this.editor).graph.removeListener(this.resetHandler);
      (<Editor>this.editor).removeListener(this.resetHandler);
      this.resetHandler = null;
    }

    if (this.toolbar != null) {
      this.toolbar.destroy();
      this.toolbar = null;
    }
  }
}
