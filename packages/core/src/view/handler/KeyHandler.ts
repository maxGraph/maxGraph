/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { Graph } from '../Graph';
import InternalEvent from '../event/InternalEvent';
import { isAncestorNode } from '../../util/domUtils';
import { getSource, isAltDown, isConsumed, isControlDown as _isControlDown, isShiftDown } from '../../util/eventUtils';

/**
 * Class: mxKeyHandler
 *
 * Event handler that listens to keystroke events. This is not a singleton,
 * however, it is normally only required once if the target is the document
 * element (default).
 *
 * This handler installs a key event listener in the topmost DOM node and
 * processes all events that originate from descandants of <mxGraph.container>
 * or from the topmost DOM node. The latter means that all unhandled keystrokes
 * are handled by this object regardless of the focused state of the <graph>.
 *
 * Example:
 *
 * The following example creates a key handler that listens to the delete key
 * (46) and deletes the selection cells if the graph is enabled.
 *
 * (code)
 * let keyHandler = new mxKeyHandler(graph);
 * keyHandler.bindKey(46, (evt)=>
 * {
 *   if (graph.isEnabled())
 *   {
 *     graph.removeCells();
 *   }
 * });
 * (end)
 *
 * Keycodes:
 *
 * See http://tinyurl.com/yp8jgl or http://tinyurl.com/229yqw for a list of
 * keycodes or install a key event listener into the document element and print
 * the key codes of the respective events to the console.
 *
 * To support the Command key and the Control key on the Mac, the following
 * code can be used.
 *
 * (code)
 * keyHandler.getFunction = (evt)=>
 * {
 *   if (evt != null)
 *   {
 *     return (mxEvent.isControlDown(evt) || (Client.IS_MAC && evt.metaKey)) ? this.controlKeys[evt.keyCode] : this.normalKeys[evt.keyCode];
 *   }
 *
 *   return null;
 * };
 * (end)
 *
 * Constructor: mxKeyHandler
 *
 * Constructs an event handler that executes functions bound to specific
 * keystrokes.
 *
 * Parameters:
 *
 * graph - Reference to the associated <mxGraph>.
 * target - Optional reference to the event target. If null, the document
 * element is used as the event target, that is, the object where the key
 * event listener is installed.
 */
class KeyHandler {
  constructor(graph: Graph, target: Element) {
    if (graph != null) {
      this.graph = graph;
      this.target = target || document.documentElement;

      this.keydownHandler = evt => {
        this.keyDown(evt);
      };

      // Installs the keystroke listener in the target
      InternalEvent.addListener(this.target, 'keydown', this.keydownHandler);
    }
  }

  keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  /**
   * Variable: graph
   *
   * Reference to the <mxGraph> associated with this handler.
   */
  graph: Graph | null = null;

  /**
   * Variable: target
   *
   * Reference to the target DOM, that is, the DOM node where the key event
   * listeners are installed.
   */
  target: Element | null = null;

  /**
   * Variable: normalKeys
   *
   * Maps from keycodes to functions for non-pressed control keys.
   */
  normalKeys: { [key: number]: Function } = {};

  /**
   * Variable: shiftKeys
   *
   * Maps from keycodes to functions for pressed shift keys.
   */
  shiftKeys: { [key: number]: Function } = {};

  /**
   * Variable: controlKeys
   *
   * Maps from keycodes to functions for pressed control keys.
   */
  controlKeys: { [key: number]: Function } = {};

  /**
   * Variable: controlShiftKeys
   *
   * Maps from keycodes to functions for pressed control and shift keys.
   */
  controlShiftKeys: { [key: number]: Function } = {};

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Function: isEnabled
   *
   * Returns true if events are handled. This implementation returns
   * <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Function: setEnabled
   *
   * Enables or disables event handling by updating <enabled>.
   *
   * Parameters:
   *
   * enabled - Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Function: bindKey
   *
   * Binds the specified keycode to the given function. This binding is used
   * if the control key is not pressed.
   *
   * Parameters:
   *
   * code - Integer that specifies the keycode.
   * funct - JavaScript function that takes the key event as an argument.
   */
  bindKey(code: number, funct: Function) {
    this.normalKeys[code] = funct;
  }

  /**
   * Function: bindShiftKey
   *
   * Binds the specified keycode to the given function. This binding is used
   * if the shift key is pressed.
   *
   * Parameters:
   *
   * code - Integer that specifies the keycode.
   * funct - JavaScript function that takes the key event as an argument.
   */
  bindShiftKey(code: number, funct: Function) {
    this.shiftKeys[code] = funct;
  }

  /**
   * Function: bindControlKey
   *
   * Binds the specified keycode to the given function. This binding is used
   * if the control key is pressed.
   *
   * Parameters:
   *
   * code - Integer that specifies the keycode.
   * funct - JavaScript function that takes the key event as an argument.
   */
  bindControlKey(code: number, funct: Function) {
    this.controlKeys[code] = funct;
  }

  /**
   * Function: bindControlShiftKey
   *
   * Binds the specified keycode to the given function. This binding is used
   * if the control and shift key are pressed.
   *
   * Parameters:
   *
   * code - Integer that specifies the keycode.
   * funct - JavaScript function that takes the key event as an argument.
   */
  bindControlShiftKey(code: number, funct: Function) {
    this.controlShiftKeys[code] = funct;
  }

  /**
   * Function: isControlDown
   *
   * Returns true if the control key is pressed. This uses <mxEvent.isControlDown>.
   *
   * Parameters:
   *
   * evt - Key event whose control key pressed state should be returned.
   */
  isControlDown(evt: KeyboardEvent) {
    return _isControlDown(evt);
  }

  /**
   * Function: getFunction
   *
   * Returns the function associated with the given key event or null if no
   * function is associated with the given event.
   *
   * Parameters:
   *
   * evt - Key event whose associated function should be returned.
   */
  getFunction(evt: KeyboardEvent) {
    if (evt != null && !isAltDown(evt)) {
      if (this.isControlDown(evt)) {
        if (isShiftDown(evt)) {
          return this.controlShiftKeys[evt.keyCode];
        }
        return this.controlKeys[evt.keyCode];
      }
      if (isShiftDown(evt)) {
        return this.shiftKeys[evt.keyCode];
      }
      return this.normalKeys[evt.keyCode];
    }

    return null;
  }

  /**
   * Function: isGraphEvent
   *
   * Returns true if the event should be processed by this handler, that is,
   * if the event source is either the target, one of its direct children, a
   * descendant of the <mxGraph.container>, or the <mxGraph.cellEditor> of the
   * <graph>.
   *
   * Parameters:
   *
   * evt - Key event that represents the keystroke.
   */
  isGraphEvent(evt: KeyboardEvent) {
    const source = <EventTarget>getSource(evt);

    // Accepts events from the target object or
    // in-place editing inside graph
    if (
      source === this.target ||
      source.parentNode === this.target ||
      ((<Graph>this.graph).cellEditor != null &&
      (<Graph>this.graph).cellEditor.isEventSource(evt))
    ) {
      return true;
    }

    // Accepts events from inside the container
    return isAncestorNode((<Graph>this.graph).container, source);
  }

  /**
   * Function: keyDown
   *
   * Handles the event by invoking the function bound to the respective keystroke
   * if <isEnabledForEvent> returns true for the given event and if
   * <isEventIgnored> returns false, except for escape for which
   * <isEventIgnored> is not invoked.
   *
   * Parameters:
   *
   * evt - Key event that represents the keystroke.
   */
  keyDown(evt: KeyboardEvent) {
    if (this.isEnabledForEvent(evt)) {
      // Cancels the editing if escape is pressed
      if (evt.keyCode === 27 /* Escape */) {
        this.escape(evt);
      }

      // Invokes the function for the keystroke
      else if (!this.isEventIgnored(evt)) {
        const boundFunction = this.getFunction(evt);

        if (boundFunction != null) {
          boundFunction(evt);
          InternalEvent.consume(evt);
        }
      }
    }
  }

  /**
   * Function: isEnabledForEvent
   *
   * Returns true if the given event should be handled. <isEventIgnored> is
   * called later if the event is not an escape key stroke, in which case
   * <escape> is called. This implementation returns true if <isEnabled>
   * returns true for both, this handler and <graph>, if the event is not
   * consumed and if <isGraphEvent> returns true.
   *
   * Parameters:
   *
   * evt - Key event that represents the keystroke.
   */
  isEnabledForEvent(evt: KeyboardEvent) {
    return (
      (<Graph>this.graph).isEnabled() &&
      !isConsumed(evt) &&
      this.isGraphEvent(evt) &&
      this.isEnabled()
    );
  }

  /**
   * Function: isEventIgnored
   *
   * Returns true if the given keystroke should be ignored. This returns
   * graph.isEditing().
   *
   * Parameters:
   *
   * evt - Key event that represents the keystroke.
   */
  isEventIgnored(evt: KeyboardEvent) {
    return (<Graph>this.graph).isEditing();
  }

  /**
   * Function: escape
   *
   * Hook to process ESCAPE keystrokes. This implementation invokes
   * <mxGraph.stopEditing> to cancel the current editing, connecting
   * and/or other ongoing modifications.
   *
   * Parameters:
   *
   * evt - Key event that represents the keystroke. Possible keycode in this
   * case is 27 (ESCAPE).
   */
  escape(evt: KeyboardEvent) {
    if ((<Graph>this.graph).isEscapeEnabled()) {
      (<Graph>this.graph).escape(evt);
    }
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its references into the DOM. This does
   * normally not need to be called, it is called automatically when the
   * window unloads (in IE).
   */
  destroy() {
    if (this.target != null && this.keydownHandler != null) {
      InternalEvent.removeListener(this.target, 'keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    this.target = null;
  }
}

export default KeyHandler;
