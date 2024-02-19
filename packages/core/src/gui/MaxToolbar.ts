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

import InternalEvent from '../view/event/InternalEvent';
import Point from '../view/geometry/Point';
import MaxPopupMenu from './MaxPopupMenu';
import EventSource from '../view/event/EventSource';
import EventObject from '../view/event/EventObject';
import Client from '../Client';
import { br, write, writeln } from '../util/domUtils';
import Cell from '../view/cell/Cell';
import { KeyboardEventListener, MouseEventListener, PopupMenuItem } from '../types';

interface HTMLSelectOptionWithFunct extends HTMLOptionElement {
  funct?: (evt: any) => void;
}

export interface HTMLImageElementWithProps extends HTMLImageElement {
  initialClassName?: any;
  altIcon?: any;
}

/**
 * Creates a toolbar inside a given DOM node. The toolbar may contain icons,
 * buttons and combo boxes.
 *
 * ### Event: mxEvent.SELECT
 *
 * Fires when an item was selected in the toolbar. The <code>function</code>
 * property contains the function that was selected in <selectMode>.
 *
 * @class MaxToolbar
 * @extends {EventSource}
 */
class MaxToolbar extends EventSource {
  constructor(container: HTMLElement) {
    super();
    this.container = container;
  }

  menu: MaxPopupMenu | null = null;
  currentImg: HTMLImageElementWithProps | HTMLButtonElement | null = null;
  selectedMode: HTMLImageElementWithProps | null = null;
  defaultMode: HTMLImageElementWithProps | HTMLButtonElement | null = null;
  defaultFunction: Function | null = null;

  /**
   * Reference to the DOM nodes that contains the toolbar.
   */
  container: HTMLElement;

  /**
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Specifies if <resetMode> requires a forced flag of true for resetting
   * the current mode in the toolbar. Default is false. This is set to true
   * if the toolbar item is double clicked to avoid a reset after a single
   * use of the item.
   */
  noReset = false;

  /**
   * Boolean indicating if the default mode should be the last selected
   * switch mode or the first inserted switch mode. Default is true, that
   * is the last selected switch mode is the default mode. The default mode
   * is the mode to be selected after a reset of the toolbar. If this is
   * false, then the default mode is the first inserted mode item regardless
   * of what was last selected. Otherwise, the selected item after a reset is
   * the previously selected item.
   */
  updateDefaultMode = true;

  /**
   * Adds the given function as an image with the specified title and icon
   * and returns the new image node.
   *
   * @param title Optional string that is used as the tooltip.
   * @param icon Optional URL of the image to be used. If no URL is given, then a
   * button is created.
   * @param funct Function to execute on a mouse click.
   * @param pressedIcon Optional URL of the pressed image. Default is a gray
   * background.
   * @param style Optional style classname. Default is mxToolbarItem.
   * @param factoryMethod Optional factory method for popup menu, eg.
   * (menu, evt, cell)=> { menu.addItem('Hello, World!'); }
   */
  addItem(
    title: string | null = null,
    icon: string | null = null,
    funct: MouseEventListener | KeyboardEventListener | null = null,
    pressedIcon: string | null = null,
    style: string | null = null,
    factoryMethod:
      | ((handler: PopupMenuItem, cell: Cell | null, me: MouseEvent) => void)
      | null = null
  ) {
    const img = document.createElement(icon != null ? 'img' : 'button');
    const initialClassName =
      style || (factoryMethod != null ? 'mxToolbarMode' : 'mxToolbarItem');
    img.className = initialClassName;
    if (icon) {
      img.setAttribute('src', icon);
    }

    if (title != null) {
      if (icon != null) {
        img.setAttribute('title', title);
      } else {
        write(img, title);
      }
    }

    this.container.appendChild(img);

    // Invokes the function on a click on the toolbar item
    if (funct != null) {
      InternalEvent.addListener(img, 'click', funct);

      if (Client.IS_TOUCH) {
        InternalEvent.addListener(img, 'touchend', funct);
      }
    }

    const mouseHandler = (evt: MouseEvent) => {
      if (pressedIcon != null) {
        img.setAttribute('src', <string>icon);
      } else {
        img.style.backgroundColor = '';
      }
    };

    // Highlights the toolbar item with a gray background
    // while it is being clicked with the mouse
    InternalEvent.addGestureListeners(
      img,
      (evt) => {
        if (pressedIcon != null) {
          img.setAttribute('src', pressedIcon);
        } else {
          img.style.backgroundColor = 'gray';
        }

        // Popup Menu
        if (factoryMethod != null) {
          if (this.menu == null) {
            this.menu = new MaxPopupMenu();
            //this.menu.init();
          }

          const last = this.currentImg;

          if (this.menu.isMenuShowing()) {
            this.menu.hideMenu();
          }

          if (last != img) {
            // Redirects factory method to local factory method
            this.currentImg = img;
            this.menu.factoryMethod = factoryMethod;

            const point = new Point(img.offsetLeft, img.offsetTop + img.offsetHeight);
            this.menu.popup(point.x, point.y, null, evt);

            // Sets and overrides to restore classname
            if (this.menu.isMenuShowing()) {
              img.className = `${initialClassName}Selected`;
              const hideMenu = this.menu.hideMenu;

              this.menu.hideMenu = () => {
                hideMenu.apply(this);
                img.className = initialClassName;
                this.currentImg = null;
              };
            }
          }
        }
      },
      null,
      mouseHandler
    );

    InternalEvent.addListener(img, 'mouseout', mouseHandler);
    return img;
  }

  /**
   * Adds and returns a new SELECT element using the given style. The element
   * is placed inside a DIV with the mxToolbarComboContainer style classname.
   *
   * @param style - Optional style classname. Default is mxToolbarCombo.
   */
  addCombo(style?: string): HTMLSelectElement {
    const div = document.createElement('div');
    div.style.display = 'inline';
    div.className = 'mxToolbarComboContainer';

    const select = document.createElement('select');
    select.className = style || 'mxToolbarCombo';
    div.appendChild(select);

    this.container.appendChild(div);

    return select;
  }

  /**
   * Adds and returns a new SELECT element using the given title as the
   * default element. The selection is reset to this element after each
   * change.
   *
   * @param title - String that specifies the title of the default element.
   * @param style - Optional style classname. Default is mxToolbarCombo.
   */
  addActionCombo(title: string, style?: string): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = style || 'mxToolbarCombo';
    this.addOption(select, title, null);

    InternalEvent.addListener(select, 'change', (evt: InternalEvent) => {
      const value = <HTMLSelectOptionWithFunct>select.options[select.selectedIndex];
      select.selectedIndex = 0;

      if (value.funct != null) {
        value.funct(evt);
      }
    });

    this.container.appendChild(select);
    return select;
  }

  /**
   * Adds and returns a new OPTION element inside the given SELECT element.
   * If the given value is a function then it is stored in the option's funct
   * field.
   *
   * @param combo - SELECT element that will contain the new entry.
   * @param title - String that specifies the title of the option.
   * @param value - Specifies the value associated with this option.
   */
  addOption(
    combo: HTMLSelectElement,
    title: string,
    value: string | ((evt: any) => void) | null = null
  ): HTMLOptionElement {
    const option = <HTMLSelectOptionWithFunct>document.createElement('option');
    writeln(option, title);

    if (typeof value === 'function') {
      option.funct = value;
    } else {
      option.setAttribute('value', <string>value);
    }

    combo.appendChild(option);
    return option;
  }

  /**
   * Adds a new selectable item to the toolbar. Only one switch mode item may
   * be selected at a time. The currently selected item is the default item
   * after a reset of the toolbar.
   */
  addSwitchMode(
    title: string,
    icon: string,
    funct: () => void,
    pressedIcon: string | null = null,
    style = 'mxToolbarMode'
  ) {
    const img = <HTMLImageElementWithProps>document.createElement('img');
    img.initialClassName = style;
    img.className = img.initialClassName;
    img.setAttribute('src', icon);
    img.altIcon = pressedIcon;

    if (title != null) {
      img.setAttribute('title', title);
    }

    InternalEvent.addListener(img, 'click', (evt: MouseEvent) => {
      const selectedModeImg = <HTMLImageElementWithProps>this.selectedMode;
      let tmp = selectedModeImg.altIcon;

      if (tmp != null) {
        selectedModeImg.altIcon = selectedModeImg.getAttribute('src');
        selectedModeImg.setAttribute('src', tmp);
      } else {
        selectedModeImg.className = selectedModeImg.initialClassName;
      }

      if (this.updateDefaultMode) {
        this.defaultMode = img;
      }

      this.selectedMode = img;

      tmp = img.altIcon;

      if (tmp != null) {
        img.altIcon = img.getAttribute('src');
        img.setAttribute('src', tmp);
      } else {
        img.className = `${img.initialClassName}Selected`;
      }

      this.fireEvent(new EventObject(InternalEvent.SELECT));
      funct();
    });

    this.container.appendChild(img);

    if (this.defaultMode == null) {
      this.defaultMode = img;

      // Function should fire only once so
      // do not pass it with the select event
      this.selectMode(img);
      funct();
    }
    return img;
  }

  /**
   * Adds a new item to the toolbar. The selection is typically reset after
   * the item has been consumed, for example by adding a new vertex to the
   * graph. The reset is not carried out if the item is double clicked.
   *
   * The function argument uses the following signature: funct(evt, cell) where
   * evt is the native mouse event and cell is the cell under the mouse.
   */
  addMode(
    title: string | null = null,
    icon: string | null = null,
    funct: Function,
    pressedIcon: string,
    style: string | null = null,
    toggle = false
  ) {
    toggle = toggle != null ? toggle : true;
    const img = <HTMLImageElementWithProps>(
      document.createElement(icon != null ? 'img' : 'button')
    );

    img.initialClassName = style || 'mxToolbarMode';
    img.className = img.initialClassName;
    if (icon) {
      img.setAttribute('src', icon);
    }
    img.altIcon = pressedIcon;

    if (title != null) {
      img.setAttribute('title', title);
    }

    if (this.enabled && toggle) {
      InternalEvent.addListener(img, 'click', (evt: MouseEvent) => {
        this.selectMode(img, funct);
        this.noReset = false;
      });

      InternalEvent.addListener(img, 'dblclick', (evt: MouseEvent) => {
        this.selectMode(img, funct);
        this.noReset = true;
      });

      if (this.defaultMode == null) {
        this.defaultMode = img;
        this.defaultFunction = funct;
        this.selectMode(img, funct);
      }
    }

    this.container.appendChild(img);
    return img;
  }

  /**
   * Resets the state of the previously selected mode and displays the given
   * DOM node as selected. This function fires a select event with the given
   * function as a parameter.
   */
  selectMode(domNode: HTMLImageElement, funct: Function | null = null): void {
    if (this.selectedMode != domNode) {
      if (this.selectedMode != null) {
        const tmp = this.selectedMode.altIcon;

        if (tmp != null) {
          this.selectedMode.altIcon = this.selectedMode.getAttribute('src');
          this.selectedMode.setAttribute('src', tmp);
        } else {
          this.selectedMode.className = this.selectedMode.initialClassName;
        }
      }

      this.selectedMode = domNode;
      const tmp = this.selectedMode.altIcon;

      if (tmp != null) {
        this.selectedMode.altIcon = this.selectedMode.getAttribute('src');
        this.selectedMode.setAttribute('src', tmp);
      } else {
        this.selectedMode.className = `${this.selectedMode.initialClassName}Selected`;
      }

      this.fireEvent(new EventObject(InternalEvent.SELECT, { function: funct }));
    }
  }

  /**
   * Selects the default mode and resets the state of the previously selected
   * mode.
   */
  resetMode(forced = false): void {
    if ((forced || !this.noReset) && this.selectedMode != this.defaultMode) {
      // The last selected switch mode will be activated
      // so the function was already executed and is
      // no longer required here
      this.selectMode(<HTMLImageElement>this.defaultMode, this.defaultFunction);
    }
  }

  /**
   * Adds the specifies image as a separator.
   *
   * @param icon - URL of the separator icon.
   */
  addSeparator(icon: string): HTMLImageElement | HTMLButtonElement {
    return this.addItem(null, icon, null);
  }

  /**
   * Adds a break to the container.
   */
  addBreak(): void {
    br(this.container);
  }

  /**
   * Adds a horizontal line to the container.
   */
  addLine(): void {
    const hr = document.createElement('hr');

    hr.style.marginRight = '6px';
    hr.setAttribute('size', '1');

    this.container.appendChild(hr);
  }

  /**
   * Removes the toolbar and all its associated resources.
   */
  destroy(): void {
    InternalEvent.release(this.container);
    // @ts-ignore
    this.container = null;
    this.defaultMode = null;
    this.defaultFunction = null;
    this.selectedMode = null;

    if (this.menu != null) {
      this.menu.destroy();
    }
  }
}

export default MaxToolbar;
