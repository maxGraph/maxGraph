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

import EventSource from '../view/event/EventSource.js';
import { fit, getDocumentScrollOrigin } from '../util/styleUtils.js';
import EventObject from '../view/event/EventObject.js';
import Client from '../Client.js';
import InternalEvent from '../view/event/InternalEvent.js';
import { write } from '../util/domUtils.js';
import { isLeftMouseButton } from '../util/EventUtils.js';
import Cell from '../view/cell/Cell.js';
import InternalMouseEvent from '../view/event/InternalMouseEvent.js';
import type { PopupMenuItem } from '../types.js';

/**
 * Basic popup menu.
 *
 * To add a vertical scrollbar to a given submenu, the following code can be used:
 *
 * ```javascript
 * const popupMenu = new MaxPopupMenu(...);
 * const popupMenuShowMenu = popupMenu.showMenu;
 * popupMenu.showMenu = function() {
 *   popupMenuShowMenu.apply(this, []);
 *
 *   this.div.style.overflowY = 'auto';
 *   this.div.style.overflowX = 'hidden';
 *   this.div.style.maxHeight = '160px';
 * };
 * ```
 *
 * ### Events
 *
 * **{@link InternalEvent.SHOW}**
 *
 * Fires after the menu has been shown in {@link popup}.
 *
 * @category GUI
 */
class MaxPopupMenu extends EventSource {
  constructor(
    factoryMethod?: (handler: MaxPopupMenu, cell: Cell | null, me: MouseEvent) => void
  ) {
    super();

    if (factoryMethod) {
      this.factoryMethod = factoryMethod;
    }

    // Adds the inner table
    this.table = document.createElement('table');
    this.table.className = 'mxPopupMenu';

    this.tbody = document.createElement('tbody');
    this.table.appendChild(this.tbody);

    // Adds the outer div
    this.div = document.createElement('div');
    this.div.className = 'mxPopupMenu';
    this.div.style.display = 'inline';
    this.div.style.zIndex = String(this.zIndex);
    this.div.appendChild(this.table);

    // Disables the context menu on the outer div
    InternalEvent.disableContextMenu(this.div);
  }

  div: HTMLElement;
  table: HTMLElement;
  tbody: HTMLElement;
  activeRow: PopupMenuItem | null = null;
  eventReceiver: HTMLElement | null = null;

  /**
   * URL of the image to be used for the submenu icon.
   */
  submenuImage = `${Client.imageBasePath}/submenu.gif`;

  /**
   * Specifies the zIndex for the popupmenu and its shadow. Default is 1006.
   */
  zIndex = 10006;

  /**
   * Function that is used to create the popup menu. The function takes the
   * current panning handler, the {@link Cell} under the mouse and the mouse
   * event that triggered the call as arguments.
   */
  factoryMethod?: (handler: MaxPopupMenu, cell: Cell | null, me: MouseEvent) => void;

  /**
   * Specifies if popupmenus should be activated by clicking the left mouse
   * button. Default is false.
   */
  useLeftButtonForPopup = false;

  /**
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Contains the number of times <addItem> has been called for a new menu.
   */
  itemCount = 0;

  /**
   * Specifies if submenus should be expanded on mouseover. Default is false.
   */
  autoExpand = false;

  /**
   * Specifies if separators should only be added if a menu item follows them.
   * Default is false.
   */
  smartSeparators = false;

  /**
   * Specifies if any labels should be visible. Default is true.
   */
  labels = true;

  willAddSeparator = false;
  containsItems = false;

  /**
   * Returns true if events are handled. This implementation
   * returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates <enabled>.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Returns true if the given event is a popupmenu trigger for the optional
   * given cell.
   *
   * @param me {@link MouseEvent} that represents the mouse event.
   */
  isPopupTrigger(me: InternalMouseEvent) {
    return (
      me.isPopupTrigger() ||
      (this.useLeftButtonForPopup && isLeftMouseButton(me.getEvent()))
    );
  }

  /**
   * Adds the given item to the given parent item. If no parent item is specified then the item is added to the top-level menu.
   *
   * The return value may be used as the parent argument, i.e. as a submenu item.
   * The return value is the table row that represents the item.
   *
   * @param title String that represents the title of the menu item.
   * @param image Optional URL for the image icon.
   * @param funct Function associated that takes a `mouseup` or `touchend` event.
   * @param parent Optional item returned by {@link addItem}.
   * @param iconCls Optional string that represents the CSS class for the image icon. It is ignored if image is given.
   * @param enabled Optional boolean indicating if the item is enabled. Default is `true`.
   * @param active Optional boolean indicating if the menu should implement any event handling. Default is `true`.
   * @param noHover Optional boolean to disable hover state. Default is `false`.
   */
  addItem(
    title: string,
    image?: string | null,
    funct?: ((evt: MouseEvent) => void) | null,
    parent: PopupMenuItem | null = null,
    iconCls: string | null = null,
    enabled = true,
    active = true,
    noHover = false
  ) {
    parent = (parent ?? this) as PopupMenuItem;
    this.itemCount++;

    // Smart separators only added if element contains items
    if (parent.willAddSeparator) {
      if (parent.containsItems) {
        this.addSeparator(parent, true);
      }

      parent.willAddSeparator = false;
    }

    parent.containsItems = true;

    const tr = <PopupMenuItem>(<unknown>document.createElement('tr'));
    tr.className = 'mxPopupMenuItem';
    const col1 = document.createElement('td');
    col1.className = 'mxPopupMenuIcon';

    // Adds the given image into the first column
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      col1.appendChild(img);
    } else if (iconCls) {
      const div = document.createElement('div');
      div.className = iconCls;
      col1.appendChild(div);
    }

    tr.appendChild(col1);

    if (this.labels) {
      const col2 = document.createElement('td');
      col2.className = `mxPopupMenuItem${!enabled ? ' mxDisabled' : ''}`;

      write(col2, title);
      col2.align = 'left';
      tr.appendChild(col2);

      const col3 = document.createElement('td');
      col3.className = `mxPopupMenuItem${!enabled ? ' mxDisabled' : ''}`;
      col3.style.paddingRight = '6px';
      col3.style.textAlign = 'right';

      tr.appendChild(col3);

      if (parent.div == null) {
        this.createSubmenu(parent);
      }
    }

    parent.tbody?.appendChild(tr);

    if (active && enabled) {
      InternalEvent.addGestureListeners(
        tr,
        (evt) => {
          this.eventReceiver = tr;

          if (parent && parent.activeRow != tr && parent.activeRow != parent) {
            if (parent.activeRow && parent.activeRow.div.parentNode) {
              this.hideSubmenu(parent);
            }

            if (tr.div) {
              this.showSubmenu(parent, tr);
              parent.activeRow = tr;
            }
          }

          InternalEvent.consume(evt);
        },
        (_evt) => {
          if (parent && parent.activeRow != tr && parent.activeRow != parent) {
            if (parent.activeRow && parent.activeRow.div.parentNode) {
              this.hideSubmenu(parent);
            }

            if (this.autoExpand && tr.div) {
              this.showSubmenu(parent, tr);
              parent.activeRow = tr;
            }
          }

          // Sets hover style because TR in IE doesn't have hover
          if (!noHover) {
            tr.className = 'mxPopupMenuItemHover';
          }
        },
        (evt) => {
          // EventReceiver avoids clicks on a submenu item
          // which has just been shown in the mousedown
          if (this.eventReceiver == tr) {
            if (parent && parent.activeRow != tr) {
              this.hideMenu();
            }

            funct?.(evt);
          }

          this.eventReceiver = null;
          InternalEvent.consume(evt);
        }
      );

      // Resets hover style because TR in IE doesn't have hover
      if (!noHover) {
        InternalEvent.addListener(tr, 'mouseout', (_evt: MouseEvent) => {
          tr.className = 'mxPopupMenuItem';
        });
      }
    }

    return tr;
  }

  /**
   * Adds a checkmark to the given menuitem.
   */
  addCheckmark(item: HTMLElement, img: string) {
    if (item.firstChild) {
      const td = item.firstChild.nextSibling as HTMLElement;
      td.style.backgroundImage = `url('${img}')`;
      td.style.backgroundRepeat = 'no-repeat';
      td.style.backgroundPosition = '2px 50%';
    }
  }

  /**
   * Creates the nodes required to add submenu items inside the given parent
   * item. This is called in <addItem> if a parent item is used for the first
   * time. This adds various DOM nodes and a <submenuImage> to the parent.
   *
   * @param parent An item returned by <addItem>.
   */
  createSubmenu(parent: PopupMenuItem) {
    parent.table = document.createElement('table');
    parent.table.className = 'mxPopupMenu';

    parent.tbody = document.createElement('tbody');
    parent.table.appendChild(parent.tbody);

    parent.div = document.createElement('div');
    parent.div.className = 'mxPopupMenu';

    parent.div.style.position = 'absolute';
    parent.div.style.display = 'inline';
    parent.div.style.zIndex = String(this.zIndex);

    parent.div.appendChild(parent.table);

    const img = document.createElement('img');
    img.setAttribute('src', this.submenuImage);

    // Last column of the submenu item in the parent menu
    if (parent.firstChild?.nextSibling?.nextSibling) {
      const td = parent.firstChild.nextSibling.nextSibling;
      td.appendChild(img);
    }
  }

  /**
   * Shows the submenu inside the given parent row.
   */
  showSubmenu(parent: PopupMenuItem, row: PopupMenuItem): void {
    if (row.div) {
      row.div.style.left = `${
        parent.div.offsetLeft + row.offsetLeft + row.offsetWidth - 1
      }px`;
      row.div.style.top = `${parent.div.offsetTop + row.offsetTop}px`;
      document.body.appendChild(row.div);

      // Moves the submenu to the left side if there is no space
      const left = row.div.offsetLeft;
      const width = row.div.offsetWidth;
      const offset = getDocumentScrollOrigin(document);

      const b = document.body;
      const d = document.documentElement;

      const right = offset.x + (b.clientWidth || d.clientWidth);

      if (left + width > right) {
        row.div.style.left = `${Math.max(0, parent.div.offsetLeft - width - 6)}px`;
      }

      fit(row.div);
    }
  }

  /**
   * Adds a horizontal separator in the given parent item or the top-level menu
   * if no parent is specified.
   *
   * @param parent Optional item returned by <addItem>.
   * @param force Optional boolean to ignore <smartSeparators>. Default is false.
   */
  addSeparator(parent: PopupMenuItem | null = null, force = false) {
    // Defaults to this instance if no parent (submenu) specified, but
    // all the necessary DOM elements are present as in PopupMenuItem
    parent = <PopupMenuItem>(parent || this);

    if (this.smartSeparators && !force) {
      parent.willAddSeparator = true;
    } else if (parent.tbody) {
      parent.willAddSeparator = false;
      const tr = document.createElement('tr');

      const col1 = document.createElement('td');
      col1.className = 'mxPopupMenuIcon';
      col1.style.padding = '0 0 0 0px';

      tr.appendChild(col1);

      const col2 = document.createElement('td');
      col2.style.padding = '0 0 0 0px';
      col2.setAttribute('colSpan', '2');

      const hr = document.createElement('hr');
      hr.setAttribute('size', '1');
      col2.appendChild(hr);

      tr.appendChild(col2);

      parent.tbody.appendChild(tr);
    }
  }

  /**
   * Shows the popup menu for the given event and cell.
   *
   * Example:
   *
   * ```javascript
   * graph.getPlugin('PanningHandler').popup(x, y, cell, evt)
   * {
   *   mxUtils.alert('Hello, World!');
   * }
   * ```
   */
  popup(x: number, y: number, cell: Cell | null, evt: MouseEvent) {
    if (this.div && this.tbody && this.factoryMethod) {
      this.div.style.left = `${x}px`;
      this.div.style.top = `${y}px`;

      // Removes all child nodes from the existing menu
      while (this.tbody.firstChild) {
        InternalEvent.release(this.tbody.firstChild);
        this.tbody.removeChild(this.tbody.firstChild);
      }

      this.itemCount = 0;
      this.factoryMethod(this, cell, evt);

      if (this.itemCount > 0) {
        this.showMenu();
        this.fireEvent(new EventObject(InternalEvent.SHOW));
      }
    }
  }

  /**
   * Returns true if the menu is showing.
   */
  isMenuShowing(): boolean {
    return this.div && this.div.parentNode == document.body;
  }

  /**
   * Shows the menu.
   */
  showMenu(): void {
    // Fits the div inside the viewport
    document.body.appendChild(this.div);
    fit(this.div);
  }

  /**
   * Removes the menu and all submenus.
   */
  hideMenu(): void {
    if (this.div) {
      this.div.parentNode?.removeChild(this.div);

      this.hideSubmenu(<PopupMenuItem>(<unknown>this));
      this.containsItems = false;
      this.fireEvent(new EventObject(InternalEvent.HIDE));
    }
  }

  /**
   * Removes all submenus inside the given parent.
   *
   * @param parent An item returned by <addItem>.
   */
  hideSubmenu(parent: PopupMenuItem): void {
    if (parent.activeRow) {
      this.hideSubmenu(parent.activeRow);

      parent.activeRow.div.parentNode?.removeChild(parent.activeRow.div);
      parent.activeRow = null;
    }
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  destroy(): void {
    if (this.div) {
      InternalEvent.release(this.div);

      this.div.parentNode?.removeChild(this.div);
    }
  }
}

export default MaxPopupMenu;
