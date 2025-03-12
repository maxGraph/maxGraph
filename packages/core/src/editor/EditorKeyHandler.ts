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
import EventObject from '../view/event/EventObject';
import KeyHandler from '../view/handler/KeyHandler';
import Editor from './Editor';

/**
 * Binds keycodes to action names in an editor.
 *
 * This aggregates an internal {@link handler} and extends the implementation of {@link KeyHandler.escape} to not only cancel the editing,
 * but also hide the properties dialog and fire an {@link InternalEvent.ESCAPE} event via {@link editor}.
 *
 * An instance of this class is created by {@link Editor} and stored in {@link Editor.keyHandler}.
 *
 * ### Example
 * Bind the delete key to the delete action in an existing editor.
 * ```javascript
 * const keyHandler = new EditorKeyHandler(editor);
 * keyHandler.bindAction(46, 'delete');
 * ```
 *
 * ### Codec
 * This class uses the {@link EditorKeyHandlerCodec} to read configuration data into an existing instance.  See {@link EditorKeyHandlerCodec} for a description of the configuration format.
 *
 * ### Keycodes
 * See {@link KeyHandler}.
 * An {@link InternalEvent.ESCAPE} event is fired via the editor if the escape key is pressed.
 *
 * @category Editor
 */
export class EditorKeyHandler {
  constructor(editor: Editor | null = null) {
    if (editor != null) {
      this.editor = editor;
      const handler = (this.handler = new KeyHandler(editor.graph));

      // Extends the escape function of the internal key
      // handle to hide the properties dialog and fire
      // the escape event via the editor instance
      const old = this.handler.escape;

      this.handler.escape = (evt) => {
        old.apply(handler, [evt]);
        editor.hideProperties();
        editor.fireEvent(new EventObject(InternalEvent.ESCAPE, { event: evt }));
      };
    }
  }

  /**
   * Reference to the enclosing {@link Editor}.
   */
  editor: Editor | null = null;

  /**
   * Holds the {@link KeyHandler} for key event handling.
   */
  handler: KeyHandler | null = null;

  /**
   * Binds the specified keycode to the given action in {@link editor}.  The optional control flag specifies if the control key must be pressed to trigger the action.
   *
   * @param code      Integer that specifies the keycode.
   * @param action    Name of the action to execute in {@link editor}.
   * @param control   Optional boolean that specifies if control must be pressed.  Default is false.
   */
  bindAction(code: number, action: string, control?: boolean): void {
    const keyHandler = () => {
      (<Editor>this.editor).execute(action);
    };

    if (control) {
      // Binds the function to control-down keycode
      (<KeyHandler>this.handler).bindControlKey(code, keyHandler);
    } else {
      // Binds the function to the normal keycode
      (<KeyHandler>this.handler).bindKey(code, keyHandler);
    }
  }

  /**
   * Destroys the {@link handler} associated with this object.  This does normally not need to be called, the {@link handler} is destroyed automatically when the window unloads (in IE) by {@link Editor}.
   */
  destroy(): void {
    (<KeyHandler>this.handler).onDestroy();
    this.handler = null;
  }
}

export default EditorKeyHandler;
