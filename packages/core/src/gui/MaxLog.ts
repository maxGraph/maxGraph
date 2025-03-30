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
import InternalEvent from '../view/event/InternalEvent';
import { getInnerHtml, write } from '../util/domUtils';
import { toString } from '../util/StringUtils';
import MaxWindow from './MaxWindow';
import { KeyboardEventListener, MouseEventListener } from '../types';
import { getElapseMillisecondsMessage } from '../internal/time-utils';
import { VERSION } from '../util/Constants';
import { GlobalConfig } from '../util/config';
import { popup } from './guiUtils';

const copyTextToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text).then(
    function () {
      GlobalConfig.logger.info('Async: Copying to clipboard was successful!');
    },
    function (err) {
      GlobalConfig.logger.error('Async: Could not copy text: ', err);
    }
  );
};

/**
 * A singleton class that implements a simple console.
 *
 * @category GUI
 * @category Logging
 */
class MaxLog {
  static textarea: HTMLTextAreaElement | null = null;
  static window: MaxWindow;
  static td: HTMLTableCellElement;

  /**
   * Initializes the DOM node for the console.
   * This requires `document.body` to point to a non-null value.
   * This is called from within setVisible if the log has not yet been initialized.
   */
  static init(): void {
    if (MaxLog.window == null && document.body != null) {
      const title = `${MaxLog.consoleName} - mxGraph ${VERSION}`;

      // Creates a table that maintains the layout
      const table = document.createElement('table');
      table.setAttribute('width', '100%');
      table.setAttribute('height', '100%');

      const tbody = document.createElement('tbody');
      let tr = document.createElement('tr');
      const td = document.createElement('td');
      td.style.verticalAlign = 'top';

      // Adds the actual console as a textarea
      MaxLog.textarea = document.createElement('textarea');
      MaxLog.textarea.setAttribute('wrap', 'off');
      MaxLog.textarea.setAttribute('readOnly', 'true');
      MaxLog.textarea.style.height = '100%';
      MaxLog.textarea.style.resize = 'none';
      MaxLog.textarea.value = MaxLog.buffer;

      // Workaround for wrong width in standards mode
      if (Client.IS_NS && document.compatMode !== 'BackCompat') {
        MaxLog.textarea.style.width = '99%';
      } else {
        MaxLog.textarea.style.width = '100%';
      }

      td.appendChild(MaxLog.textarea);
      tr.appendChild(td);
      tbody.appendChild(tr);

      // Creates the container div
      tr = document.createElement('tr');
      MaxLog.td = document.createElement('td');
      MaxLog.td.style.verticalAlign = 'top';
      MaxLog.td.setAttribute('height', '30px');

      tr.appendChild(MaxLog.td);
      tbody.appendChild(tr);
      table.appendChild(tbody);

      // Adds various debugging buttons
      MaxLog.addButton('Info', function (evt: MouseEvent) {
        MaxLog.info();
      });

      MaxLog.addButton('DOM', function (evt: MouseEvent) {
        const content = getInnerHtml(document.body);
        MaxLog.debug(content);
      });

      MaxLog.addButton('Trace', function (evt: MouseEvent) {
        MaxLog.TRACE = !MaxLog.TRACE;

        if (MaxLog.TRACE) {
          MaxLog.debug('Tracing enabled');
        } else {
          MaxLog.debug('Tracing disabled');
        }
      });

      MaxLog.addButton('Copy', function (evt: MouseEvent) {
        try {
          copyTextToClipboard((<HTMLTextAreaElement>MaxLog.textarea).value);
        } catch (err) {
          alert(err);
        }
      });

      MaxLog.addButton('Show', function (evt: MouseEvent) {
        try {
          popup((<HTMLTextAreaElement>MaxLog.textarea).value);
        } catch (err) {
          alert(err);
        }
      });

      MaxLog.addButton('Clear', function (evt: MouseEvent) {
        (<HTMLTextAreaElement>MaxLog.textarea).value = '';
      });

      // Cross-browser code to get window size
      let h = 0;
      let w = 0;

      if (typeof window.innerWidth === 'number') {
        h = window.innerHeight;
        w = window.innerWidth;
      } else {
        h = document.documentElement.clientHeight || document.body.clientHeight;
        w = document.body.clientWidth;
      }

      MaxLog.window = new MaxWindow(
        title,
        table,
        Math.max(0, w - 320),
        Math.max(0, h - 210),
        300,
        160
      );
      MaxLog.window.setMaximizable(true);
      MaxLog.window.setScrollable(false);
      MaxLog.window.setResizable(true);
      MaxLog.window.setClosable(true);
      MaxLog.window.destroyOnClose = false;

      // Workaround for ignored textarea height in various setups
      if (
        Client.IS_NS &&
        !Client.IS_GC &&
        !Client.IS_SF &&
        document.compatMode !== 'BackCompat'
      ) {
        const elt = MaxLog.window.getElement();

        const resizeHandler = (sender: any, evt: MouseEvent) => {
          (<HTMLTextAreaElement>MaxLog.textarea).style.height = `${Math.max(
            0,
            elt.offsetHeight - 70
          )}px`;
        };

        MaxLog.window.addListener(InternalEvent.RESIZE_END, resizeHandler);
        MaxLog.window.addListener(InternalEvent.MAXIMIZE, resizeHandler);
        MaxLog.window.addListener(InternalEvent.NORMALIZE, resizeHandler);

        MaxLog.textarea.style.height = '92px';
      }
    }
  }

  /**
   * Specifies the name of the console window.
   * @default 'Console'
   */
  static consoleName = 'Console';

  /**
   * Specified if the output for {@link enter} and {@link leave} should be visible in the console.
   * @default false
   */
  static TRACE = false;

  /**
   * Specifies if the output for {@link debug} should be visible in the console.
   * @default true
   */
  static DEBUG = true;

  /**
   * Specifies if the output for {@link warn} should be visible in the console.
   * @default true
   */
  static WARN = true;

  /**
   * Buffer for pre-initialized content.
   */
  static buffer = '';

  /**
   * Writes the current navigator information to the console.
   */
  static info(): void {
    MaxLog.writeln(toString(navigator));
  }

  /**
   * Adds a button to the console using the given label and function.
   */
  static addButton(lab: string, funct: MouseEventListener | KeyboardEventListener): void {
    const button = document.createElement('button');
    write(button, lab);
    InternalEvent.addListener(button, 'click', funct);
    MaxLog.td.appendChild(button);
  }

  /**
   * Returns `true` if the console is visible.
   */
  static isVisible() {
    if (MaxLog.window != null) {
      return MaxLog.window.isVisible();
    }

    return false;
  }

  /**
   * Shows the console.
   */
  static show() {
    MaxLog.setVisible(true);
  }

  /**
   * Shows or hides the console.
   */
  static setVisible(visible: boolean) {
    if (MaxLog.window == null) {
      MaxLog.init();
    }

    if (MaxLog.window != null) {
      MaxLog.window.setVisible(visible);
    }
  }

  /**
   * Writes the specified string to the console if {@link TRACE} is `true` and returns the current time in milliseconds.
   */
  static enter(string: string): number | undefined {
    if (MaxLog.TRACE) {
      MaxLog.writeln(`Entering ${string}`);
      return new Date().getTime();
    }
  }

  /**
   * Writes the specified string to the console if {@link TRACE} is `true` and computes the difference between the current
   * time and t0 in milliseconds.
   *
   * @see {@link enter} for an example.
   */
  static leave(string: string, t0?: number) {
    if (MaxLog.TRACE) {
      const dt = getElapseMillisecondsMessage(t0);
      MaxLog.writeln(`Leaving ${string}${dt}`);
    }
  }

  /**
   * Adds all arguments to the console if {@link DEBUG} is enabled.
   */
  static debug(...args: string[]) {
    if (MaxLog.DEBUG) {
      MaxLog.writeln(...args);
    }
  }

  /**
   * Adds all arguments to the console if {@link TRACE} is enabled.
   */
  static trace(...args: string[]) {
    if (MaxLog.TRACE) {
      MaxLog.writeln(...args);
    }
  }

  /**
   * Adds all arguments to the console if {@link WARN} is enabled.
   */
  static warn(...args: string[]) {
    if (MaxLog.WARN) {
      MaxLog.writeln(...args);
    }
  }

  /**
   * Adds the specified strings to the console.
   */
  static write(...args: string[]): void {
    let string = '';

    for (let i = 0; i < args.length; i += 1) {
      string += args[i];

      if (i < args.length - 1) {
        string += ' ';
      }
    }

    if (MaxLog.textarea != null) {
      MaxLog.textarea.value = MaxLog.textarea.value + string;

      // Workaround for no update in Presto 2.5.22 (Opera 10.5)
      if (navigator.userAgent != null && navigator.userAgent.indexOf('Presto/2.5') >= 0) {
        MaxLog.textarea.style.visibility = 'hidden';
        MaxLog.textarea.style.visibility = 'visible';
      }

      MaxLog.textarea.scrollTop = MaxLog.textarea.scrollHeight;
    } else {
      MaxLog.buffer += string;
    }
  }

  /**
   * Adds the specified strings to the console, appending a linefeed at the end of each string.
   */
  static writeln(...args: string[]): void {
    let string = '';

    for (let i = 0; i < args.length; i += 1) {
      string += args[i];

      if (i < args.length - 1) {
        string += ' ';
      }
    }

    MaxLog.write(`${string}\n`);
  }
}

export default MaxLog;
