import Editor from "src/editor/Editor";
import InternalEvent from "../view/event/InternalEvent";
import { write } from "./domUtils";

/**
 * Function: linkAction
 *
 * Adds a hyperlink to the specified parent that invokes action on the
 * specified editor.
 *
 * Parameters:
 *
 * parent - DOM node to contain the new link.
 * text - String that is used as the link label.
 * editor - <Editor> that will execute the action.
 * action - String that defines the name of the action to be executed.
 * pad - Optional left-padding for the link. Default is 0.
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
 * Function: linkInvoke
 *
 * Adds a hyperlink to the specified parent that invokes the specified
 * function on the editor passing along the specified argument. The
 * function name is the name of a function of the editor instance,
 * not an action name.
 *
 * Parameters:
 *
 * parent - DOM node to contain the new link.
 * text - String that is used as the link label.
 * editor - <Editor> instance to execute the function on.
 * functName - String that represents the name of the function.
 * arg - Object that represents the argument to the function.
 * pad - Optional left-padding for the link. Default is 0.
 */
export const linkInvoke = (parent, text, editor, functName, arg, pad) => {
  return link(
    parent,
    text,
    () => {
      editor[functName](arg);
    },
    pad
  );
};

/**
 * Function: link
 *
 * Adds a hyperlink to the specified parent and invokes the given function
 * when the link is clicked.
 *
 * Parameters:
 *
 * parent - DOM node to contain the new link.
 * text - String that is used as the link label.
 * funct - Function to execute when the link is clicked.
 * pad - Optional left-padding for the link. Default is 0.
 */
export const link = (parent, text, funct, pad) => {
  const a = document.createElement('span');

  a.style.color = 'blue';
  a.style.textDecoration = 'underline';
  a.style.cursor = 'pointer';

  if (pad != null) {
    a.style.paddingLeft = `${pad}px`;
  }

  InternalEvent.addListener(a, 'click', funct);
  write(a, text);

  if (parent != null) {
    parent.appendChild(a);
  }

  return a;
};

/**
 * Function: button
 *
 * Returns a new button with the given level and function as an onclick
 * event handler.
 *
 * (code)
 * document.body.appendChild(mxUtils.button('Test', (evt)=>
 * {
 *   alert('Hello, World!');
 * }));
 * (end)
 *
 * Parameters:
 *
 * label - String that represents the label of the button.
 * funct - Function to be called if the button is pressed.
 * doc - Optional document to be used for creating the button. Default is the
 * current document.
 */
export const button = (label, funct, doc) => {
  doc = doc != null ? doc : document;

  const button = doc.createElement('button');
  write(button, label);

  InternalEvent.addListener(button, 'click', evt => {
    funct(evt);
  });

  return button;
};