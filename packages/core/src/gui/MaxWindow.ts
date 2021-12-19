/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Rectangle from '../view/geometry/Rectangle';
import EventObject from '../view/event/EventObject';
import EventSource from '../view/event/EventSource';
import { fit, getCurrentStyle } from '../util/utils';
import InternalEvent from '../view/event/InternalEvent';
import Client from '../Client';
import { NODETYPE } from '../util/constants';
import { br, write } from '../util/domUtils';
import Resources from '../util/Resources';
import { getClientX, getClientY } from '../util/eventUtils';
import { htmlEntities } from '../util/stringUtils';

/**
 * Basic window inside a document.
 *
 * Creating a simple window.
 * @example
 *
 * ```javascript
 * var tb = document.createElement('div');
 * var wnd = new MaxWindow('Title', tb, 100, 100, 200, 200, true, true);
 * wnd.setVisible(true);
 * ```
 *
 * Creating a window that contains an iframe.
 * @example
 *
 * ```javascript
 * var frame = document.createElement('iframe');
 * frame.setAttribute('width', '192px');
 * frame.setAttribute('height', '172px');
 * frame.setAttribute('src', 'http://www.example.com/');
 * frame.style.backgroundColor = 'white';
 *
 * var w = document.body.clientWidth;
 * var h = (document.body.clientHeight || document.documentElement.clientHeight);
 * var wnd = new MaxWindow('Title', frame, (w-200)/2, (h-200)/3, 200, 200);
 * wnd.setVisible(true);
 * ```
 *
 * To limit the movement of a window, eg. to keep it from being moved beyond
 * the top, left corner the following method can be overridden (recommended):
 *
 * ```javascript
 * wnd.setLocation(x, y)
 * {
 *   x = Math.max(0, x);
 *   y = Math.max(0, y);
 *   setLocation.apply(this, arguments);
 * };
 * ```
 *
 * Or the following event handler can be used:
 *
 * @example
 * ```javascript
 * wnd.addListener(mxEvent.MOVE, function(e)
 * {
 *   wnd.setLocation(Math.max(0, wnd.getX()), Math.max(0, wnd.getY()));
 * });
 * ```
 *
 * To keep a window inside the current window:
 *
 * @example
 * ```javascript
 * mxEvent.addListener(window, 'resize', mxUtils.bind(this, function()
 * {
 *   var iw = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
 *   var ih = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
 *
 *   var x = this.window.getX();
 *   var y = this.window.getY();
 *
 *   if (x + this.window.table.clientWidth > iw)
 *   {
 *     x = Math.max(0, iw - this.window.table.clientWidth);
 *   }
 *
 *   if (y + this.window.table.clientHeight > ih)
 *   {
 *     y = Math.max(0, ih - this.window.table.clientHeight);
 *   }
 *
 *   if (this.window.getX() != x || this.window.getY() != y)
 *   {
 *     this.window.setLocation(x, y);
 *   }
 * }));
 * ```
 *
 * ### Event: mxEvent.MOVE_START
 *
 * Fires before the window is moved. The <code>event</code> property contains
 * the corresponding mouse event.
 *
 * ### Event: mxEvent.MOVE
 *
 * Fires while the window is being moved. The <code>event</code> property
 * contains the corresponding mouse event.
 *
 * ### Event: mxEvent.MOVE_END
 *
 * Fires after the window is moved. The <code>event</code> property contains
 * the corresponding mouse event.
 *
 * ### Event: mxEvent.RESIZE_START
 *
 * Fires before the window is resized. The <code>event</code> property contains
 * the corresponding mouse event.
 *
 * ### Event: mxEvent.RESIZE
 *
 * Fires while the window is being resized. The <code>event</code> property
 * contains the corresponding mouse event.
 *
 * ### Event: mxEvent.RESIZE_END
 *
 * Fires after the window is resized. The <code>event</code> property contains
 * the corresponding mouse event.
 *
 * ### Event: mxEvent.MAXIMIZE
 *
 * Fires after the window is maximized. The <code>event</code> property
 * contains the corresponding mouse event.
 *
 * ### Event: mxEvent.MINIMIZE
 *
 * Fires after the window is minimized. The <code>event</code> property
 * contains the corresponding mouse event.
 *
 * ### Event: mxEvent.NORMALIZE
 *
 * Fires after the window is normalized, that is, it returned from
 * maximized or minimized state. The <code>event</code> property contains the
 * corresponding mouse event.
 *
 * ### Event: mxEvent.ACTIVATE
 *
 * Fires after a window is activated. The <code>previousWindow</code> property
 * contains the previous window. The event sender is the active window.
 *
 * ### Event: mxEvent.SHOW
 *
 * Fires after the window is shown. This event has no properties.
 *
 * ### Event: mxEvent.HIDE
 *
 * Fires after the window is hidden. This event has no properties.
 *
 * ### Event: mxEvent.CLOSE
 *
 * Fires before the window is closed. The <code>event</code> property contains
 * the corresponding mouse event.
 *
 * ### Event: mxEvent.DESTROY
 *
 * Fires before the window is destroyed. This event has no properties.
 *
 * @class MaxWindow
 * @extends EventSource
 */
class MaxWindow extends EventSource {
  constructor(
    title: HTMLElement,
    content: HTMLElement | null,
    x: number,
    y: number,
    width: number,
    height: number,
    minimizable: boolean,
    movable: boolean=true,
    replaceNode: HTMLElement,
    style: string=''
  ) {
    super();

    if (content != null) {
      minimizable = minimizable != null ? minimizable : true;
      this.content = content;
      this.init(x, y, width, height, style);

      this.installMaximizeHandler();
      this.installMinimizeHandler();
      this.installCloseHandler();
      this.setMinimizable(minimizable);
      this.setTitle(title);

      if (movable) {
        this.installMoveHandler();
      }

      if (replaceNode != null && replaceNode.parentNode != null) {
        replaceNode.parentNode.replaceChild(this.div, replaceNode);
      } else {
        document.body.appendChild(this.div);
      }
    }
  }

  static activeWindow: MaxWindow | null = null;

  td: HTMLElement | null = null;
  div: HTMLElement | null = null;
  table: HTMLElement | null = null;
  resize: HTMLElement | null = null;
  buttons: HTMLElement | null = null;
  minimize: HTMLElement | null = null;
  maximize: HTMLElement | null = null;
  closeImg: HTMLElement | null = null;
  contentWrapper: HTMLElement | null = null;

  /**
   * Initializes the DOM tree that represents the window.
   */
  init(x: number, y: number, width: number, height: number, style: string): void {
    style = style != null ? style : 'MaxWindow';

    this.div = document.createElement('div');
    this.div.className = style;

    this.div.style.left = `${x}px`;
    this.div.style.top = `${y}px`;
    this.table = document.createElement('table');
    this.table.className = style;

    // Disables built-in pan and zoom in IE10 and later
    if (Client.IS_POINTER) {
      this.div.style.touchAction = 'none';
    }

    // Workaround for table size problems in FF
    if (width != null) {
      this.div.style.width = `${width}px`;
      this.table.style.width = `${width}px`;
    }

    if (height != null) {
      this.div.style.height = `${height}px`;
      this.table.style.height = `${height}px`;
    }

    // Creates title row
    const tbody = document.createElement('tbody');
    let tr = document.createElement('tr');

    this.title = document.createElement('td');
    this.title.className = `${style}Title`;

    this.buttons = document.createElement('div');
    this.buttons.style.position = 'absolute';
    this.buttons.style.display = 'inline-block';
    this.buttons.style.right = '4px';
    this.buttons.style.top = '5px';
    this.title.appendChild(this.buttons);

    tr.appendChild(this.title);
    tbody.appendChild(tr);

    // Creates content row and table cell
    tr = document.createElement('tr');
    this.td = document.createElement('td');
    this.td.className = `${style}Pane`;

    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = `${style}Pane`;
    this.contentWrapper.style.width = '100%';
    this.contentWrapper.appendChild(this.content);

    // Workaround for div around div restricts height
    // of inner div if outerdiv has hidden overflow
    if (this.content.nodeName.toUpperCase() !== 'DIV') {
      this.contentWrapper.style.height = '100%';
    }

    // Puts all content into the DOM
    this.td.appendChild(this.contentWrapper);
    tr.appendChild(this.td);
    tbody.appendChild(tr);
    this.table.appendChild(tbody);
    this.div.appendChild(this.table);

    // Puts the window on top of other windows when clicked
    const activator = (evt) => {
      this.activate();
    };

    InternalEvent.addGestureListeners(this.title, activator);
    InternalEvent.addGestureListeners(this.table, activator);

    this.hide();
  }

  /**
   * URL of the image to be used for the close icon in the titlebar.
   */
  closeImage = `${Client.imageBasePath}/close.gif`;

  /**
   * URL of the image to be used for the minimize icon in the titlebar.
   */
  minimizeImage = `${Client.imageBasePath}/minimize.gif`;

  /**
   * URL of the image to be used for the normalize icon in the titlebar.
   */
  normalizeImage = `${Client.imageBasePath}/normalize.gif`;

  /**
   * URL of the image to be used for the maximize icon in the titlebar.
   */
  maximizeImage = `${Client.imageBasePath}/maximize.gif`;

  /**
   * URL of the image to be used for the resize icon.
   */
  resizeImage = `${Client.imageBasePath}/resize.gif`;

  /**
   * Boolean flag that represents the visible state of the window.
   */
  visible: boolean = false;

  /**
   * <mxRectangle> that specifies the minimum width and height of the window.
   * Default is (50, 40).
   */
  minimumSize = new Rectangle(0, 0, 50, 40);

  /**
   * Specifies if the window should be destroyed when it is closed. If this
   * is false then the window is hidden using <setVisible>. Default is true.
   */
  destroyOnClose: boolean = true;

  /**
   * Reference to the DOM node (TD) that contains the title.
   */
  title: HTMLElement | null = null;

  /**
   * Reference to the DOM node that represents the window content.
   */
  content: HTMLElement | null = null;

  /**
   * Sets the window title to the given string. HTML markup inside the title
   * will be escaped.
   */
  setTitle(title: string): void {
    // Removes all text content nodes (normally just one)
    let child = this.title.firstChild;

    while (child != null) {
      const next = child.nextSibling;

      if (child.nodeType === NODETYPE.TEXT) {
        child.parentNode.removeChild(child);
      }

      child = next;
    }

    write(this.title, title || '');
    this.title.appendChild(this.buttons);
  }

  /**
   * Sets if the window contents should be scrollable.
   */
  setScrollable(scrollable: boolean): void {
    // Workaround for hang in Presto 2.5.22 (Opera 10.5)
    if (navigator.userAgent == null || navigator.userAgent.indexOf('Presto/2.5') < 0) {
      if (scrollable) {
        this.contentWrapper.style.overflow = 'auto';
      } else {
        this.contentWrapper.style.overflow = 'hidden';
      }
    }
  }

  /**
   * Puts the window on top of all other windows.
   */
  activate(): void {
    if (MaxWindow.activeWindow !== this) {
      const style = getCurrentStyle(this.getElement());
      const index = style != null ? style.zIndex : 3;

      if (MaxWindow.activeWindow) {
        const elt = MaxWindow.activeWindow.getElement();

        if (elt != null && elt.style != null) {
          elt.style.zIndex = index;
        }
      }

      const previousWindow = MaxWindow.activeWindow;
      this.getElement().style.zIndex = parseInt(index) + 1;
      MaxWindow.activeWindow = this;

      this.fireEvent(
        new EventObject(InternalEvent.ACTIVATE, 'previousWindow', previousWindow)
      );
    }
  }

  /**
   * Returuns the outermost DOM node that makes up the window.
   */
  getElement(): HTMLElement {
    return this.div;
  }

  /**
   * Makes sure the window is inside the client area of the window.
   */
  fit(): void {
    fit(this.div);
  }

  /**
   * Returns true if the window is resizable.
   */
  isResizable(): boolean {
    if (this.resize != null) {
      return this.resize.style.display !== 'none';
    }
    return false;
  }

  /**
   * Sets if the window should be resizable. To avoid interference with some
   * built-in features of IE10 and later, the use of the following code is
   * recommended if there are resizable <MaxWindow>s in the page:
   *
   * ```javascript
   * if (Client.IS_POINTER)
   * {
   *   document.body.style.msTouchAction = 'none';
   * }
   * ```
   */
  setResizable(resizable: boolean): void {
    if (resizable) {
      if (this.resize == null) {
        this.resize = document.createElement('img');
        this.resize.style.position = 'absolute';
        this.resize.style.bottom = '2px';
        this.resize.style.right = '2px';

        this.resize.setAttribute('src', this.resizeImage);
        this.resize.style.cursor = 'nw-resize';

        let startX: number | null = null;
        let startY: number | null = null;
        let width: number | null = null;
        let height: number | null = null;

        const start = (evt: MouseEvent) => {
          // LATER: pointerdown starting on border of resize does start
          // the drag operation but does not fire consecutive events via
          // one of the listeners below (does pan instead).
          // Workaround: document.body.style.msTouchAction = 'none'
          this.activate();
          startX = getClientX(evt);
          startY = getClientY(evt);
          width = this.div.offsetWidth;
          height = this.div.offsetHeight;

          InternalEvent.addGestureListeners(document, null, dragHandler, dropHandler);
          this.fireEvent(new EventObject(InternalEvent.RESIZE_START, 'event', evt));
          InternalEvent.consume(evt);
        };

        // Adds a temporary pair of listeners to intercept
        // the gesture event in the document
        let dragHandler = (evt: MouseEvent) => {
          if (startX != null && startY != null) {
            const dx = getClientX(evt) - startX;
            const dy = getClientY(evt) - startY;

            this.setSize(width + dx, height + dy);

            this.fireEvent(new EventObject(InternalEvent.RESIZE, 'event', evt));
            InternalEvent.consume(evt);
          }
        };

        let dropHandler = (evt: MouseEvent) => {
          if (startX != null && startY != null) {
            startX = null;
            startY = null;
            InternalEvent.removeGestureListeners(
              document,
              null,
              dragHandler,
              dropHandler
            );
            this.fireEvent(new EventObject(InternalEvent.RESIZE_END, 'event', evt));
            InternalEvent.consume(evt);
          }
        };

        InternalEvent.addGestureListeners(this.resize, start, dragHandler, dropHandler);
        this.div.appendChild(this.resize);
      } else {
        this.resize.style.display = 'inline';
      }
    } else if (this.resize != null) {
      this.resize.style.display = 'none';
    }
  }

  /**
   * Sets the size of the window.
   */
  setSize(width: number, height: number): void {
    width = Math.max(this.minimumSize.width, width);
    height = Math.max(this.minimumSize.height, height);

    // Workaround for table size problems in FF
    this.div.style.width = `${width}px`;
    this.div.style.height = `${height}px`;

    this.table.style.width = `${width}px`;
    this.table.style.height = `${height}px`;

    this.contentWrapper.style.height = `${
      this.div.offsetHeight - this.title.offsetHeight - this.contentHeightCorrection
    }px`;
  }

  /**
   * Sets if the window is minimizable.
   */
  setMinimizable(minimizable: boolean): void {
    this.minimize.style.display = minimizable ? '' : 'none';
  }

  /**
   * Returns an <mxRectangle> that specifies the size for the minimized window.
   * A width or height of 0 means keep the existing width or height. This
   * implementation returns the height of the window title and keeps the width.
   */
  getMinimumSize(): Rectangle {
    return new Rectangle(0, 0, 0, this.title.offsetHeight);
  }

  /**
   * Installs the event listeners required for minimizing the window.
   */
  installMinimizeHandler(): void {
    this.minimize = document.createElement('img');

    this.minimize.setAttribute('src', this.minimizeImage);
    this.minimize.setAttribute('title', 'Minimize');
    this.minimize.style.cursor = 'pointer';
    this.minimize.style.marginLeft = '2px';
    this.minimize.style.display = 'none';

    this.buttons.appendChild(this.minimize);

    let minimized = false;
    let maxDisplay = null;
    let height = null;

    const funct = (evt) => {
      this.activate();

      if (!minimized) {
        minimized = true;

        this.minimize.setAttribute('src', this.normalizeImage);
        this.minimize.setAttribute('title', 'Normalize');
        this.contentWrapper.style.display = 'none';
        maxDisplay = this.maximize.style.display;

        this.maximize.style.display = 'none';
        height = this.table.style.height;

        const minSize = this.getMinimumSize();

        if (minSize.height > 0) {
          this.div.style.height = `${minSize.height}px`;
          this.table.style.height = `${minSize.height}px`;
        }

        if (minSize.width > 0) {
          this.div.style.width = `${minSize.width}px`;
          this.table.style.width = `${minSize.width}px`;
        }

        if (this.resize != null) {
          this.resize.style.visibility = 'hidden';
        }

        this.fireEvent(new EventObject(InternalEvent.MINIMIZE, 'event', evt));
      } else {
        minimized = false;

        this.minimize.setAttribute('src', this.minimizeImage);
        this.minimize.setAttribute('title', 'Minimize');
        this.contentWrapper.style.display = ''; // default
        this.maximize.style.display = maxDisplay;
        this.div.style.height = height;
        this.table.style.height = height;

        if (this.resize != null) {
          this.resize.style.visibility = '';
        }

        this.fireEvent(new EventObject(InternalEvent.NORMALIZE, 'event', evt));
      }

      InternalEvent.consume(evt);
    };

    InternalEvent.addGestureListeners(this.minimize, funct);
  }

  /**
   * Sets if the window is maximizable.
   */
  setMaximizable(maximizable: boolean): void {
    this.maximize.style.display = maximizable ? '' : 'none';
  }

  /**
   * Installs the event listeners required for maximizing the window.
   */
  installMaximizeHandler(): void {
    this.maximize = document.createElement('img');

    this.maximize.setAttribute('src', this.maximizeImage);
    this.maximize.setAttribute('title', 'Maximize');
    this.maximize.style.cursor = 'default';
    this.maximize.style.marginLeft = '2px';
    this.maximize.style.cursor = 'pointer';
    this.maximize.style.display = 'none';

    this.buttons.appendChild(this.maximize);

    let maximized = false;
    let x = null;
    let y = null;
    let height = null;
    let width = null;
    let minDisplay = null;

    const funct = (evt) => {
      this.activate();

      if (this.maximize.style.display !== 'none') {
        if (!maximized) {
          maximized = true;

          this.maximize.setAttribute('src', this.normalizeImage);
          this.maximize.setAttribute('title', 'Normalize');
          this.contentWrapper.style.display = '';
          minDisplay = this.minimize.style.display;
          this.minimize.style.display = 'none';

          // Saves window state
          x = parseInt(this.div.style.left);
          y = parseInt(this.div.style.top);
          height = this.table.style.height;
          width = this.table.style.width;

          this.div.style.left = '0px';
          this.div.style.top = '0px';
          const docHeight = Math.max(
            document.body.clientHeight || 0,
            document.documentElement.clientHeight || 0
          );

          this.div.style.width = `${document.body.clientWidth - 2}px`;
          this.div.style.height = `${docHeight - 2}px`;

          this.table.style.width = `${document.body.clientWidth - 2}px`;
          this.table.style.height = `${docHeight - 2}px`;

          if (this.resize != null) {
            this.resize.style.visibility = 'hidden';
          }

          const style = getCurrentStyle(this.contentWrapper);

          if (style.overflow === 'auto' || this.resize != null) {
            this.contentWrapper.style.height = `${
              this.div.offsetHeight -
              this.title.offsetHeight -
              this.contentHeightCorrection
            }px`;
          }

          this.fireEvent(new EventObject(InternalEvent.MAXIMIZE, 'event', evt));
        } else {
          maximized = false;

          this.maximize.setAttribute('src', this.maximizeImage);
          this.maximize.setAttribute('title', 'Maximize');
          this.contentWrapper.style.display = '';
          this.minimize.style.display = minDisplay;

          // Restores window state
          this.div.style.left = `${x}px`;
          this.div.style.top = `${y}px`;

          this.div.style.height = height;
          this.div.style.width = width;

          const style = getCurrentStyle(this.contentWrapper);

          if (style.overflow === 'auto' || this.resize != null) {
            this.contentWrapper.style.height = `${
              this.div.offsetHeight -
              this.title.offsetHeight -
              this.contentHeightCorrection
            }px`;
          }

          this.table.style.height = height;
          this.table.style.width = width;

          if (this.resize != null) {
            this.resize.style.visibility = '';
          }

          this.fireEvent(new EventObject(InternalEvent.NORMALIZE, 'event', evt));
        }

        InternalEvent.consume(evt);
      }
    };

    InternalEvent.addGestureListeners(this.maximize, funct);
    InternalEvent.addListener(this.title, 'dblclick', funct);
  }

  /**
   * Installs the event listeners required for moving the window.
   */
  installMoveHandler(): void {
    this.title.style.cursor = 'move';

    InternalEvent.addGestureListeners(this.title, (evt) => {
      const startX = getClientX(evt);
      const startY = getClientY(evt);
      const x = this.getX();
      const y = this.getY();

      // Adds a temporary pair of listeners to intercept
      // the gesture event in the document
      const dragHandler = (evt) => {
        const dx = getClientX(evt) - startX;
        const dy = getClientY(evt) - startY;
        this.setLocation(x + dx, y + dy);
        this.fireEvent(new EventObject(InternalEvent.MOVE, 'event', evt));
        InternalEvent.consume(evt);
      };

      const dropHandler = (evt) => {
        InternalEvent.removeGestureListeners(document, null, dragHandler, dropHandler);
        this.fireEvent(new EventObject(InternalEvent.MOVE_END, 'event', evt));
        InternalEvent.consume(evt);
      };

      InternalEvent.addGestureListeners(document, null, dragHandler, dropHandler);
      this.fireEvent(new EventObject(InternalEvent.MOVE_START, 'event', evt));
      InternalEvent.consume(evt);
    });

    // Disables built-in pan and zoom in IE10 and later
    if (Client.IS_POINTER) {
      this.title.style.touchAction = 'none';
    }
  }

  /**
   * Sets the upper, left corner of the window.
   */
  setLocation(x: number, y: number): void {
    this.div.style.left = `${x}px`;
    this.div.style.top = `${y}px`;
  }

  /**
   * Returns the current position on the x-axis.
   */
  getX(): number {
    return parseInt(this.div.style.left);
  }

  /**
   * Returns the current position on the y-axis.
   */
  getY(): number {
    return parseInt(this.div.style.top);
  }

  /**
   * Adds the <closeImage> as a new image node in <closeImg> and installs the
   * <close> event.
   */
  installCloseHandler(): void {
    this.closeImg = document.createElement('img');

    this.closeImg.setAttribute('src', this.closeImage);
    this.closeImg.setAttribute('title', 'Close');
    this.closeImg.style.marginLeft = '2px';
    this.closeImg.style.cursor = 'pointer';
    this.closeImg.style.display = 'none';

    this.buttons.appendChild(this.closeImg);

    InternalEvent.addGestureListeners(this.closeImg, (evt) => {
      this.fireEvent(new EventObject(InternalEvent.CLOSE, 'event', evt));

      if (this.destroyOnClose) {
        this.destroy();
      } else {
        this.setVisible(false);
      }

      InternalEvent.consume(evt);
    });
  }

  /**
   * Sets the image associated with the window.
   *
   *
   * @param image - URL of the image to be used.
   */
  setImage(image: string): void {
    this.image = document.createElement('img');
    this.image.setAttribute('src', image);
    this.image.setAttribute('align', 'left');
    this.image.style.marginRight = '4px';
    this.image.style.marginLeft = '0px';
    this.image.style.marginTop = '-2px';

    this.title.insertBefore(this.image, this.title.firstChild);
  }

  /**
   * Sets the image associated with the window.
   *
   *
   * @param closable - Boolean specifying if the window should be closable.
   */
  setClosable(closable: boolean): void {
    this.closeImg.style.display = closable ? '' : 'none';
  }

  /**
   * Returns true if the window is visible.
   */
  isVisible(): boolean {
    if (this.div != null) {
      return this.div.style.display !== 'none';
    }

    return false;
  }

  /**
   * Shows or hides the window depending on the given flag.
   *
   *
   * @param visible - Boolean indicating if the window should be made visible.
   */
  setVisible(visible: boolean): void {
    if (this.div != null && this.isVisible() !== visible) {
      if (visible) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  /**
   * Shows the window.
   */
  show(): void {
    this.div.style.display = '';
    this.activate();

    const style = getCurrentStyle(this.contentWrapper);

    if (
      (style.overflow == 'auto' || this.resize != null) &&
      this.contentWrapper.style.display != 'none'
    ) {
      this.contentWrapper.style.height = `${
        this.div.offsetHeight - this.title.offsetHeight - this.contentHeightCorrection
      }px`;
    }

    this.fireEvent(new EventObject(InternalEvent.SHOW));
  }

  /**
   * Hides the window.
   */
  hide(): void {
    this.div.style.display = 'none';
    this.fireEvent(new EventObject(InternalEvent.HIDE));
  }

  /**
   * Destroys the window and removes all associated resources. Fires a
   * <destroy> event prior to destroying the window.
   */
  destroy(): void {
    this.fireEvent(new EventObject(InternalEvent.DESTROY));

    if (this.div != null) {
      InternalEvent.release(this.div);
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }

    this.title = null;
    this.content = null;
    this.contentWrapper = null;
  }
}

/**
 * Shows the specified text content in a new <MaxWindow> or a new browser
 * window if isInternalWindow is false.
 *
 * @param content String that specifies the text to be displayed.
 * @param isInternalWindow Optional boolean indicating if an MaxWindow should be
 * used instead of a new browser window. Default is false.
 */
export const popup = (content, isInternalWindow) => {
  if (isInternalWindow) {
    const div = document.createElement('div');

    div.style.overflow = 'scroll';
    div.style.width = '636px';
    div.style.height = '460px';

    const pre = document.createElement('pre');
    pre.innerHTML = htmlEntities(content, false)
      .replace(/\n/g, '<br>')
      .replace(/ /g, '&nbsp;');

    div.appendChild(pre);

    const w = document.body.clientWidth;
    const h = Math.max(
      document.body.clientHeight || 0,
      document.documentElement.clientHeight
    );
    const wnd = new MaxWindow(
      'Popup Window',
      div,
      w / 2 - 320,
      h / 2 - 240,
      640,
      480,
      false,
      true
    );

    wnd.setClosable(true);
    wnd.setVisible(true);
  } else {
    // Wraps up the XML content in a textarea
    if (Client.IS_NS) {
      const wnd = window.open();
      wnd.document.writeln(`<pre>${htmlEntities(content)}</pre`);
      wnd.document.close();
    } else {
      const wnd = window.open();
      const pre = wnd.document.createElement('pre');
      pre.innerHTML = htmlEntities(content, false)
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
      wnd.document.body.appendChild(pre);
    }
  }
};

/**
 * Displays the given error message in a new <MaxWindow> of the given width.
 * If close is true then an additional close button is added to the window.
 * The optional icon specifies the icon to be used for the window. Default
 * is <mxUtils.errorImage>.
 *
 * @param message String specifying the message to be displayed.
 * @param width Integer specifying the width of the window.
 * @param close Optional boolean indicating whether to add a close button.
 * @param icon Optional icon for the window decoration.
 */
export const error = (message: string, width: number, close: boolean, icon: string | null=null) => {
  const div = document.createElement('div');
  div.style.padding = '20px';

  const img = document.createElement('img');
  img.setAttribute('src', icon || utils.errorImage);
  img.setAttribute('valign', 'bottom');
  img.style.verticalAlign = 'middle';
  div.appendChild(img);

  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  write(div, message);

  const w = document.body.clientWidth;
  const h = document.body.clientHeight || document.documentElement.clientHeight;
  const warn = new MaxWindow(
    Resources.get(utils.errorResource) || utils.errorResource,
    div,
    (w - width) / 2,
    h / 4,
    width,
    null,
    false,
    true
  );

  if (close) {
    br(div);

    const tmp = document.createElement('p');
    const button = document.createElement('button');

    button.setAttribute('style', 'float:right');

    InternalEvent.addListener(button, 'click', (evt) => {
      warn.destroy();
    });

    write(button, Resources.get(utils.closeResource) || utils.closeResource);

    tmp.appendChild(button);
    div.appendChild(tmp);

    br(div);

    warn.setClosable(true);
  }

  warn.setVisible(true);

  return warn;
};

export default MaxWindow;
