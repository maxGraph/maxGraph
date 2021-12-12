/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import InternalEvent from '../view/event/InternalEvent';
import EventObject from '../view/event/EventObject';
import KeyHandler from '../view/handlers/KeyHandler';

/**
 * Binds keycodes to actionnames in an editor.  This aggregates an internal {@link handler} and extends the implementation of {@link mxKeyHandler.escape} to not only cancel the editing, but also hide the properties dialog and fire an <Editor.escape> event via {@link editor}.  An instance of this class is created by {@link Editor} and stored in {@link Editor.keyHandler}.
 *
 * @Example
 * Bind the delete key to the delete action in an existing editor.
 * ```javascript
 * var keyHandler = new DefaultKeyHandler(editor);
 * keyHandler.bindAction(46, 'delete');
 * ```
 *
 * @Codec
 * This class uses the {@link DefaultKeyHandlerCodec} to read configuration data into an existing instance.  See {@link DefaultKeyHandlerCodec} for a description of the configuration format.
 *
 * @Keycodes
 * See {@link mxKeyHandler}.
 * An {@link InternalEvent.ESCAPE} event is fired via the editor if the escape key is pressed.
 */
class DefaultKeyHandler {
  constructor(editor) {
    if (editor != null) {
      this.editor = editor;
      this.handler = new KeyHandler(editor.graph);

      // Extends the escape function of the internal key
      // handle to hide the properties dialog and fire
      // the escape event via the editor instance
      const old = this.handler.escape;

      this.handler.escape = evt => {
        old.apply(this, [editor]);
        editor.hideProperties();
        editor.fireEvent(new EventObject(InternalEvent.ESCAPE, 'event', evt));
      };
    }
  }

  /**
   * Reference to the enclosing {@link Editor}.
   */
  // editor: Editor;
  editor = null;

  /**
   * Holds the {@link mxKeyHandler} for key event handling.
   */
  // handler: mxKeyHandler;
  handler = null;

  /**
   * Binds the specified keycode to the given action in {@link editor}.  The optional control flag specifies if the control key must be pressed to trigger the action.
   *
   * @param code      Integer that specifies the keycode.
   * @param action    Name of the action to execute in {@link editor}.
   * @param control   Optional boolean that specifies if control must be pressed.  Default is false.
   */
  // bindAction(code: number, action: string, control?: boolean): void;
  bindAction(code, action, control) {
    const keyHandler = () => {
      this.editor.execute(action);
    };

    if (control) {
      // Binds the function to control-down keycode
      this.handler.bindControlKey(code, keyHandler);
    } else {
      // Binds the function to the normal keycode
      this.handler.bindKey(code, keyHandler);
    }
  }

  /**
   * Destroys the {@link handler} associated with this object.  This does normally not need to be called, the {@link handler} is destroyed automatically when the window unloads (in IE) by {@link Editor}.
   */
  // destroy(): void;
  destroy() {
    this.handler.destroy();
    this.handler = null;
  }
}

export default DefaultKeyHandler;
