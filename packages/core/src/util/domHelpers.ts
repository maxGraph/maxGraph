import Editor from '../editor/Editor';
import { KeyboardEventListener, MouseEventListener } from '../types';
import InternalEvent from "../view/event/InternalEvent";
import { write } from "./domUtils";

/**
 * Adds a hyperlink to the specified parent that invokes action on the
 * specified editor.
 *
 * @param parent DOM node to contain the new link.
 * @param text String that is used as the link label.
 * @param editor <Editor> that will execute the action.
 * @param action String that defines the name of the action to be executed.
 * @param pad Optional left-padding for the link. Default is 0.
 */
export const linkAction = (parent: HTMLElement, text: string, editor: Editor, action: string, pad: number=0) => {
  return link(
    parent,
    text,
    () => {
      editor.execute(action);
    },
    pad
  );
};

/**
 * Adds a hyperlink to the specified parent that invokes the specified
 * function on the editor passing along the specified argument. The
 * function name is the name of a function of the editor instance,
 * not an action name.
 *
 * @param parent DOM node to contain the new link.
 * @param text String that is used as the link label.
 * @param editor <Editor> instance to execute the function on.
 * @param functName String that represents the name of the function.
 * @param arg Object that represents the argument to the function.
 * @param pad Optional left-padding for the link. Default is 0.
 */
export const linkInvoke = (parent: Element, text: string, editor: Editor, functName: string, arg: any, pad: number=0) => {
  return link(
    parent,
    text,
    () => {
      // @ts-ignore
      editor[functName](arg);
    },
    pad
  );
};

/**
 * Adds a hyperlink to the specified parent and invokes the given function
 * when the link is clicked.
 *
 * @param parent DOM node to contain the new link.
 * @param text String that is used as the link label.
 * @param funct Function to execute when the link is clicked.
 * @param pad Optional left-padding for the link. Default is 0.
 */
export const link = (parent: Element, text: string, funct: MouseEventListener | KeyboardEventListener, pad: number=0) => {
  const a = document.createElement('span');

  a.style.color = 'blue';
  a.style.textDecoration = 'underline';
  a.style.cursor = 'pointer';
  a.style.paddingLeft = `${pad}px`;

  InternalEvent.addListener(a, 'click', funct);
  write(a, text);

  if (parent != null) {
    parent.appendChild(a);
  }

  return a;
};

/**
 * Returns a new button with the given level and function as an onclick
 * event handler.
 *
 * ```javascript
 * document.body.appendChild(mxUtils.button('Test', (evt)=>
 * {
 *   alert('Hello, World!');
 * }));
 * ```
 *
 * @param label String that represents the label of the button.
 * @param funct Function to be called if the button is pressed.
 * @param doc Optional document to be used for creating the button. Default is the
 * current document.
 */
export const button = (label: string, funct: (evt: MouseEvent) => void, doc: Document | null=null): HTMLButtonElement => {
  doc = doc != null ? doc : document;

  const button = doc.createElement('button');
  write(button, label);

  InternalEvent.addListener(button, 'click', (evt: MouseEvent) => {
    funct(evt);
  });

  return button;
};
