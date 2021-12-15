/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Client from '../Client';
import MaxToolbar from '../util/gui/MaxToolbar';
import Geometry from '../view/geometry/Geometry';
import { convertPoint } from '../util/utils';
import InternalEvent from '../view/event/InternalEvent';
import { getClientX, getClientY } from '../util/eventUtils';
import { makeDraggable } from '../util/gestureUtils';
import Editor from './Editor';

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
 * var toolbar = new DefaultToolbar(container, editor);
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
class DefaultToolbar {
  constructor(container: Element, editor: Editor) {
    this.editor = editor;

    if (container != null && editor != null) {
      this.init(container);
    }
  }

  /**
   * Reference to the enclosing {@link Editor}.
   */
  editor: Editor = null;

  /**
   * Holds the internal {@link MaxToolbar}.
   */
  toolbar: MaxToolbar | null = null;

  /**
   * Reference to the function used to reset the {@link toolbar}.
   */
  resetHandler: Function = null;

  /**
   * Defines the spacing between existing and new vertices in gridSize units when a new vertex is dropped on an existing cell.  Default is 4 (40 pixels).
   *
   * @Default is 4
   */
  spacing: number = 4;

  /**
   * Specifies if elements should be connected if new cells are dropped onto connectable elements.
   *
   * @Default is false.
   */
  connectOnDrop: boolean = false;

  /**
   * Constructs the {@link toolbar} for the given container and installs a listener that updates the {@link Editor.insertFunction} on {@link editor} if an item is selected in the toolbar.  This assumes that {@link editor} is not null.
   */
  init(container: Element): void {
    if (container != null) {
      this.toolbar = new MaxToolbar(container);

      // Installs the insert function in the editor if an item is
      // selected in the toolbar
      this.toolbar.addListener(InternalEvent.SELECT, (sender, evt) => {
        const funct = evt.getProperty('function');

        if (funct != null) {
          this.editor.insertFunction = () => {
            funct.apply(this, [container]);
            this.toolbar.resetMode();
          };
        } else {
          this.editor.insertFunction = null;
        }
      });

      // Resets the selected tool after a doubleclick or escape keystroke
      this.resetHandler = () => {
        if (this.toolbar != null) {
          this.toolbar.resetMode(true);
        }
      };

      this.editor.graph.addListener(InternalEvent.DOUBLE_CLICK, this.resetHandler);
      this.editor.addListener(InternalEvent.ESCAPE, this.resetHandler);
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
  // addItem(title: string, icon: string, action: string, pressed?: string): any;
  addItem(title, icon, action, pressed) {
    const clickHandler = () => {
      if (action != null && action.length > 0) {
        this.editor.execute(action);
      }
    };
    return this.toolbar.addItem(title, icon, clickHandler, pressed);
  }

  /**
   * Adds a vertical separator using the optional icon.
   *
   * @param icon - Optional URL of the icon that represents the vertical separator. Default is {@link Client.imageBasePath} + ‘/separator.gif’.
   */
  // addSeparator(icon?: string): void;
  addSeparator(icon) {
    icon = icon || `${Client.imageBasePath}/separator.gif`;
    this.toolbar.addSeparator(icon);
  }

  /**
   * Helper method to invoke {@link MaxToolbar.addCombo} on toolbar and return the resulting DOM node.
   */
  // addCombo(): HTMLElement;
  addCombo() {
    return this.toolbar.addCombo();
  }

  /**
   * Function: addActionCombo
   *
   * Helper method to invoke <MaxToolbar.addActionCombo> on <toolbar> using
   * the given title and return the resulting DOM node.
   *
   * Parameters:
   *
   * title - String that represents the title of the combo.
   */
  addActionCombo(title) {
    return this.toolbar.addActionCombo(title);
  }

  /**
   * Binds the given action to a option with the specified label in the given combo.  Combo is an object returned from an earlier call to {@link addCombo} or {@link addActionCombo}.
   *
   * @param combo - DOM node that represents the combo box.
   * @param title - String that represents the title of the combo.
   * @param action - Name of the action to execute in {@link editor}.
   */
  // addActionOption(combo: HTMLElement, title: string, action: string): void;
  addActionOption(combo, title, action) {
    const clickHandler = () => {
      this.editor.execute(action);
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
  // addOption(combo: HTMLElement, title: string, value: object): HTMLElement;
  addOption(combo, title, value) {
    return this.toolbar.addOption(combo, title, value);
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
  // addMode(title: string, icon: string, mode: string, pressed?: string, funct?: Function): any;
  addMode(title, icon, mode, pressed, funct) {
    const clickHandler = () => {
      this.editor.setMode(mode);

      if (funct != null) {
        funct(this.editor);
      }
    };
    return this.toolbar.addSwitchMode(title, icon, clickHandler, pressed);
  }

  /**
   * Function: addPrototype
   *
   * Creates an item for inserting a clone of the specified prototype cell into
   * the <editor>'s graph. The ptype may either be a cell or a function that
   * returns a cell.
   *
   * Parameters:
   *
   * title - String that represents the title of the item.
   * icon - URL of the icon that represents the item.
   * ptype - Function or object that represents the prototype cell. If ptype
   * is a function then it is invoked with no arguments to create new
   * instances.
   * pressed - Optional URL of the icon that represents the pressed state.
   * insert - Optional JavaScript function that handles an insert of the new
   * cell. This function takes the <Editor>, new cell to be inserted, mouse
   * event and optional <Cell> under the mouse pointer as arguments.
   * toggle - Optional boolean that specifies if the item can be toggled.
   * Default is true.
   */
  addPrototype(title, icon, ptype, pressed, insert, toggle) {
    // Creates a wrapper function that is in charge of constructing
    // the new cell instance to be inserted into the graph
    const factory = () => {
      if (typeof ptype === 'function') {
        return ptype();
      }
      if (ptype != null) {
        return this.editor.graph.cloneCell(ptype);
      }

      return null;
    };

    // Defines the function for a click event on the graph
    // after this item has been selected in the toolbar
    const clickHandler = (evt, cell) => {
      if (typeof insert === 'function') {
        insert(this.editor, factory(), evt, cell);
      } else {
        this.drop(factory(), evt, cell);
      }

      this.toolbar.resetMode();
      InternalEvent.consume(evt);
    };

    const img = this.toolbar.addMode(title, icon, clickHandler, pressed, null, toggle);

    // Creates a wrapper function that calls the click handler without
    // the graph argument
    const dropHandler = (graph, evt, cell) => {
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
   * Parameters:
   *
   * @param vertex - {@link mxCell} to be inserted.
   * @param evt - Mouse event that represents the drop.
   * @param target - Optional {@link mxCell} that represents the drop target.
   */
  // drop(vertex: mxCell, evt: MouseEvent, target?: mxCell): void;
  drop(vertex, evt, target) {
    const { graph } = this.editor;
    const model = graph.getModel();

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
   * @param vertex - {@link mxCell} to be inserted.
   * @param evt - Mouse event that represents the drop.
   * @param target - Optional {@link mxCell} that represents the parent.
   */
  // insert(vertex: mxCell, evt: MouseEvent, target?: mxCell): any;
  insert(vertex, evt, target) {
    const { graph } = this.editor;

    if (graph.canImportCell(vertex)) {
      const x = getClientX(evt);
      const y = getClientY(evt);
      const pt = convertPoint(graph.container, x, y);

      // Splits the target edge or inserts into target group
      if (graph.isSplitEnabled() && graph.isSplitTarget(target, [vertex], evt)) {
        return graph.splitEdge(target, [vertex], null, pt.x, pt.y);
      }
      return this.editor.addVertex(target, vertex, pt.x, pt.y);
    }

    return null;
  }

  /**
   * Handles a drop by connecting the given vertex to the given source cell.
   *
   * @param vertex - {@link mxCell} to be inserted.
   * @param evt - Mouse event that represents the drop.
   * @param source - Optional {@link mxCell} that represents the source terminal.
   */
  // connect(vertex: mxCell, evt: MouseEvent, source?: mxCell): void;
  connect(vertex, evt, source) {
    const { graph } = this.editor;
    const model = graph.getModel();

    if (
      source != null &&
      vertex.isCellConnectable() &&
      graph.isEdgeValid(null, source, vertex)
    ) {
      let edge = null;

      model.beginUpdate();
      try {
        const geo = source.getGeometry();
        const g = vertex.getGeometry().clone();

        // Moves the vertex away from the drop target that will
        // be used as the source for the new connection
        g.x = geo.x + (geo.width - g.width) / 2;
        g.y = geo.y + (geo.height - g.height) / 2;

        const step = this.spacing * graph.gridSize;
        const dist = model.getDirectedEdgeCount(source, true) * 20;

        if (this.editor.horizontalFlow) {
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
        edge = this.editor.createEdge(source, vertex);

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
  // installDropHandler(img: HTMLElement, dropHandler: Function): void;
  installDropHandler(img, dropHandler) {
    const sprite = document.createElement('img');
    sprite.setAttribute('src', img.getAttribute('src'));

    // Handles delayed loading of the images
    const loader = (evt) => {
      // Preview uses the image node with double size. Later this can be
      // changed to use a separate preview and guides, but for this the
      // dropHandler must use the additional x- and y-arguments and the
      // dragsource which makeDraggable returns much be configured to
      // use guides via mxDragSource.isGuidesEnabled.
      sprite.style.width = `${2 * img.offsetWidth}px`;
      sprite.style.height = `${2 * img.offsetHeight}px`;

      makeDraggable(img, this.editor.graph, dropHandler, sprite);
      InternalEvent.removeListener(sprite, 'load', loader);
    };
  }

  /**
   * Destroys the {@link toolbar} associated with this object and removes all installed listeners.
   * This does normally not need to be called, the {@link toolbar} is destroyed automatically when the window unloads (in IE) by {@link Editor}.
   */
  // destroy(): void;
  destroy() {
    if (this.resetHandler != null) {
      this.editor.graph.removeListener('dblclick', this.resetHandler);
      this.editor.removeListener('escape', this.resetHandler);
      this.resetHandler = null;
    }

    if (this.toolbar != null) {
      this.toolbar.destroy();
      this.toolbar = null;
    }
  }
}

export default DefaultToolbar;
// import('../serialization/DefaultToolbarCodec');
