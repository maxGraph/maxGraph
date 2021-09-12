/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxClient from '../../mxClient';
import InternalEvent from '../../view/event/InternalEvent';
import { getInnerHtml, write } from '../DomUtils';
import mxWindow, { popup } from './mxWindow';

/**
 * Class: mxLog
 *
 * A singleton class that implements a simple console.
 *
 * Variable: consoleName
 *
 * Specifies the name of the console window. Default is 'Console'.
 */
class mxLog {
  /**
   * Initializes the DOM node for the console.
   * This requires document.body to point to a non-null value.
   * This is called from within setVisible if the log has not yet been initialized.
   */
  // static init(): void;
  static init() {
    if (mxLog.window == null && document.body != null) {
      const title = `${mxLog.consoleName} - mxGraph ${mxClient.VERSION}`;

      // Creates a table that maintains the layout
      const table = document.createElement('table');
      table.setAttribute('width', '100%');
      table.setAttribute('height', '100%');

      const tbody = document.createElement('tbody');
      let tr = document.createElement('tr');
      const td = document.createElement('td');
      td.style.verticalAlign = 'top';

      // Adds the actual console as a textarea
      mxLog.textarea = document.createElement('textarea');
      mxLog.textarea.setAttribute('wrap', 'off');
      mxLog.textarea.setAttribute('readOnly', 'true');
      mxLog.textarea.style.height = '100%';
      mxLog.textarea.style.resize = 'none';
      mxLog.textarea.value = mxLog.buffer;

      // Workaround for wrong width in standards mode
      if (mxClient.IS_NS && document.compatMode !== 'BackCompat') {
        mxLog.textarea.style.width = '99%';
      } else {
        mxLog.textarea.style.width = '100%';
      }

      td.appendChild(mxLog.textarea);
      tr.appendChild(td);
      tbody.appendChild(tr);

      // Creates the container div
      tr = document.createElement('tr');
      mxLog.td = document.createElement('td');
      mxLog.td.style.verticalAlign = 'top';
      mxLog.td.setAttribute('height', '30px');

      tr.appendChild(mxLog.td);
      tbody.appendChild(tr);
      table.appendChild(tbody);

      // Adds various debugging buttons
      mxLog.addButton('Info', function (evt) {
        mxLog.info();
      });

      mxLog.addButton('DOM', function (evt) {
        const content = getInnerHtml(document.body);
        mxLog.debug(content);
      });

      mxLog.addButton('Trace', function (evt) {
        mxLog.TRACE = !mxLog.TRACE;

        if (mxLog.TRACE) {
          mxLog.debug('Tracing enabled');
        } else {
          mxLog.debug('Tracing disabled');
        }
      });

      mxLog.addButton('Copy', function (evt) {
        try {
          utils.copy(mxLog.textarea.value);
        } catch (err) {
          alert(err);
        }
      });

      mxLog.addButton('Show', function (evt) {
        try {
          popup(mxLog.textarea.value);
        } catch (err) {
          alert(err);
        }
      });

      mxLog.addButton('Clear', function (evt) {
        mxLog.textarea.value = '';
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

      mxLog.window = new mxWindow(
        title,
        table,
        Math.max(0, w - 320),
        Math.max(0, h - 210),
        300,
        160
      );
      mxLog.window.setMaximizable(true);
      mxLog.window.setScrollable(false);
      mxLog.window.setResizable(true);
      mxLog.window.setClosable(true);
      mxLog.window.destroyOnClose = false;

      // Workaround for ignored textarea height in various setups
      if (
        mxClient.IS_NS &&
        !mxClient.IS_GC &&
        !mxClient.IS_SF &&
        document.compatMode !== 'BackCompat'
      ) {
        const elt = mxLog.window.getElement();

        const resizeHandler = (sender, evt) => {
          mxLog.textarea.style.height = `${Math.max(0, elt.offsetHeight - 70)}px`;
        };

        mxLog.window.addListener(InternalEvent.RESIZE_END, resizeHandler);
        mxLog.window.addListener(InternalEvent.MAXIMIZE, resizeHandler);
        mxLog.window.addListener(InternalEvent.NORMALIZE, resizeHandler);

        mxLog.textarea.style.height = '92px';
      }
    }
  }

  static consoleName = 'Console';

  /**
   * Variable: TRACE
   *
   * Specified if the output for <enter> and <leave> should be visible in the
   * console. Default is false.
   */
  static TRACE = false;

  /**
   * Variable: DEBUG
   *
   * Specifies if the output for <debug> should be visible in the console.
   * Default is true.
   */
  static DEBUG = true;

  /**
   * Variable: WARN
   *
   * Specifies if the output for <warn> should be visible in the console.
   * Default is true.
   */
  static WARN = true;

  /**
   * Variable: buffer
   *
   * Buffer for pre-initialized content.
   */
  static buffer = '';

  /**
   * Writes the current navigator information to the console.
   */
  // static info(): void;
  static info() {
    mxLog.writeln(toString(navigator));
  }

  /**
   * Adds a button to the console using the given label and function.
   */
  // static addButton(lab: string, funct: Function): void;
  static addButton(lab, funct) {
    const button = document.createElement('button');
    write(button, lab);
    InternalEvent.addListener(button, 'click', funct);
    mxLog.td.appendChild(button);
  }

  /**
   * Returns true if the console is visible.
   */
  // static isVisible(): boolean;
  static isVisible() {
    if (mxLog.window != null) {
      return mxLog.window.isVisible();
    }

    return false;
  }

  /**
   * Shows the console.
   */
  // static show(): void;
  static show() {
    mxLog.setVisible(true);
  }

  /**
   * Function: setVisible
   *
   * Shows or hides the console.
   */
  static setVisible(visible) {
    if (mxLog.window == null) {
      mxLog.init();
    }

    if (mxLog.window != null) {
      mxLog.window.setVisible(visible);
    }
  }

  /**
   * Writes the specified string to the console if TRACE is true and returns the current time in milliseconds.
   */
  // static enter(string: string): void;
  static enter(string) {
    if (mxLog.TRACE) {
      mxLog.writeln(`Entering ${string}`);
      return new Date().getTime();
    }
  }

  /**
   * Function: leave
   *
   * Writes the specified string to the console
   * if <TRACE> is true and computes the difference
   * between the current time and t0 in milliseconds.
   * See <enter> for an example.
   */
  static leave(string, t0) {
    if (mxLog.TRACE) {
      const dt = t0 !== 0 ? ` (${new Date().getTime() - t0} ms)` : '';
      mxLog.writeln(`Leaving ${string}${dt}`);
    }
  }

  /**
   * Adds all arguments to the console if DEBUG is enabled.
   */
  // static debug(message: string): void;
  static debug(...args) {
    if (mxLog.DEBUG) {
      mxLog.writeln(...args);
    }
  }

  /**
   * Adds all arguments to the console if WARN is enabled.
   */
  // static warn(message: string): void;
  static warn(...args) {
    if (mxLog.WARN) {
      mxLog.writeln(...args);
    }
  }

  /**
   * Adds the specified strings to the console.
   */
  // static write(): void;
  static write() {
    let string = '';

    for (let i = 0; i < arguments.length; i += 1) {
      string += arguments[i];

      if (i < arguments.length - 1) {
        string += ' ';
      }
    }

    if (mxLog.textarea != null) {
      mxLog.textarea.value = mxLog.textarea.value + string;

      // Workaround for no update in Presto 2.5.22 (Opera 10.5)
      if (navigator.userAgent != null && navigator.userAgent.indexOf('Presto/2.5') >= 0) {
        mxLog.textarea.style.visibility = 'hidden';
        mxLog.textarea.style.visibility = 'visible';
      }

      mxLog.textarea.scrollTop = mxLog.textarea.scrollHeight;
    } else {
      mxLog.buffer += string;
    }
  }

  /**
   * Adds the specified strings to the console, appending a linefeed at the end of each string.
   */
  // static writeln(): void;
  static writeln() {
    let string = '';

    for (let i = 0; i < arguments.length; i += 1) {
      string += arguments[i];

      if (i < arguments.length - 1) {
        string += ' ';
      }
    }

    mxLog.write(`${string}\n`);
  }
}

export default mxLog;
