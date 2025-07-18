/*
Copyright 2021-present The maxGraph project Contributors

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

import { NODE_TYPE } from './Constants.js';

/**
 * Returns the text content of the specified node.
 *
 * @param elems DOM nodes to return the text for.
 */
export const extractTextWithWhitespace = (elems: Element[]): string => {
  // Known block elements for handling linefeeds (list is not complete)
  const blocks = [
    'BLOCKQUOTE',
    'DIV',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'OL',
    'P',
    'PRE',
    'TABLE',
    'UL',
  ];
  const ret: string[] = [];

  function doExtract(elts: Element[]) {
    // Single break should be ignored
    if (elts.length == 1 && (elts[0].nodeName == 'BR' || elts[0].innerHTML == '\n')) {
      return;
    }

    for (let i = 0; i < elts.length; i += 1) {
      const elem = elts[i];

      // DIV with a br or linefeed forces a linefeed
      if (
        elem.nodeName == 'BR' ||
        elem.innerHTML == '\n' ||
        ((elts.length == 1 || i == 0) &&
          elem.nodeName == 'DIV' &&
          elem.innerHTML.toLowerCase() == '<br>')
      ) {
        ret.push('\n');
      } else {
        if (elem.nodeType === 3 || elem.nodeType === 4) {
          if (elem.nodeValue && elem.nodeValue.length > 0) {
            ret.push(elem.nodeValue);
          }
        } else if (elem.nodeType !== 8 && elem.childNodes.length > 0) {
          doExtract(<Element[]>Array.from(elem.childNodes));
        }

        if (i < elts.length - 1 && blocks.indexOf(elts[i + 1].nodeName) >= 0) {
          ret.push('\n');
        }
      }
    }
  }

  doExtract(elems);

  return ret.join('');
};

/**
 * Returns the text content of the specified node.
 *
 * @param node DOM node to return the text content for.
 */
export const getTextContent = (node: Text | null): string => {
  return node?.textContent ?? '';
};

/**
 * Sets the text content of the specified node.
 *
 * @param node DOM node to set the text content for.
 * @param text String that represents the text content.
 */
export const setTextContent = (node: HTMLElement | Text, text: string) => {
  if ('innerText' in node) {
    node.innerText = text;
  } else {
    node.textContent = text;
  }
};

/**
 * Returns the inner HTML for the given node as a string or an empty string
 * if no node was specified. The inner HTML is the text representing all
 * children of the node, but not the node itself.
 *
 * @param node DOM node to return the inner HTML for.
 */
export const getInnerHtml = (node: Element) => {
  if (node != null) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(node);
  }

  return '';
};

/**
 * Returns the outer HTML for the given node as a string or an empty
 * string if no node was specified. The outer HTML is the text representing
 * all children of the node including the node itself.
 *
 * @param node DOM node to return the outer HTML for.
 */
export const getOuterHtml = (node: Element) => {
  if (node != null) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(node);
  }

  return '';
};

/**
 * Creates a text node for the given string and appends it to the given
 * parent. Returns the text node.
 *
 * @param parent DOM node to append the text node to.
 * @param text String representing the text to be added.
 */
export const write = (parent: Element, text: string) => {
  const doc = parent.ownerDocument;
  const node = doc.createTextNode(text);

  if (parent != null) {
    parent.appendChild(node);
  }

  return node;
};

/**
 * Creates a text node for the given string and appends it to the given
 * parent with an additional linefeed. Returns the text node.
 *
 * @param parent DOM node to append the text node to.
 * @param text String representing the text to be added.
 */
export const writeln = (parent: Element, text: string) => {
  const doc = parent.ownerDocument;
  const node = doc.createTextNode(text);

  if (parent != null) {
    parent.appendChild(node);
    parent.appendChild(document.createElement('br'));
  }

  return node;
};

/**
 * Appends a linebreak to the given parent and returns the linebreak.
 *
 * @param parent DOM node to append the linebreak to.
 */
export const br = (parent: Element, count = 1) => {
  let br = null;

  for (let i = 0; i < count; i += 1) {
    if (parent != null) {
      br = parent.ownerDocument.createElement('br');
      parent.appendChild(br);
    }
  }

  return br;
};

/**
 * Appends a new paragraph with the given text to the specified parent and
 * returns the paragraph.
 *
 * @param parent DOM node to append the text node to.
 * @param text String representing the text for the new paragraph.
 */
export const para = (parent: Element, text: string) => {
  const p = document.createElement('p');
  write(p, text);

  if (parent != null) {
    parent.appendChild(p);
  }

  return p;
};

/**
 * Returns true if the given value is an XML node with the node name
 * and if the optional attribute has the specified value.
 *
 * This implementation assumes that the given value is a DOM node if the
 * nodeType property is numeric, that is, if isNaN returns false for
 * value.nodeType.
 *
 * @param value Object that should be examined as a node.
 * @param nodeName String that specifies the node name.
 * @param attributeName Optional attribute name to check.
 * @param attributeValue Optional attribute value to check.
 */
export const isNode = (
  value: any,
  nodeName: string | null = null,
  attributeName?: string,
  attributeValue?: string
) => {
  if (
    value != null &&
    !isNaN(value.nodeType) &&
    (nodeName == null || value.nodeName.toLowerCase() == nodeName.toLowerCase())
  ) {
    return attributeName == null || value.getAttribute(attributeName) == attributeValue;
  }

  return false;
};

/**
 * Returns true if the given ancestor is an ancestor of the
 * given DOM node in the DOM. This also returns true if the
 * child is the ancestor.
 *
 * @param ancestor DOM node that represents the ancestor.
 * @param child DOM node that represents the child.
 */
export const isAncestorNode = (ancestor: Element, child: Element | null) => {
  let parent = child;

  while (parent != null) {
    if (parent === ancestor) {
      return true;
    }

    parent = <Element | null>parent.parentNode;
  }
  return false;
};

/**
 * Returns an array of child nodes that are of the given node type.
 *
 * @param node Parent DOM node to return the children from.
 * @param nodeType Optional node type to return. Default is {@link NODE_TYPE.ELEMENT}.
 */
export const getChildNodes = (
  node: Element,
  nodeType: number = NODE_TYPE.ELEMENT
): ChildNode[] => {
  const children = [];
  let tmp = node.firstChild;

  while (tmp != null) {
    if (tmp.nodeType === nodeType) {
      children.push(tmp);
    }

    tmp = tmp.nextSibling;
  }
  return children;
};

/**
 * Cross browser implementation for document.importNode. Uses {@link Document.importNode}
 * in all browsers but IE, where the node is cloned by creating a new node and
 * copying all attributes and children into it using importNode, recursively.
 *
 * @param doc Document to import the node into.
 * @param node Node to be imported.
 * @param allChildren If all children should be imported.
 */
export const importNode = (doc: Document, node: Element, allChildren: boolean) => {
  return doc.importNode(node, allChildren);
};

/**
 * Clears the current selection in the page.
 */
export const clearSelection = () => {
  // @ts-ignore
  const sel = window.getSelection ? window.getSelection() : document.selection;

  if (sel) {
    if (sel.removeAllRanges) {
      sel.removeAllRanges();
    } else if (sel.empty) {
      sel.empty();
    }
  }
};

/**
 * Creates and returns an image (IMG node) or VML image (v:image) in IE6 in
 * quirks mode.
 *
 * @param src URL that points to the image to be displayed.
 */
export const createImage = (src: string) => {
  let imageNode = null;
  imageNode = document.createElement('img');
  imageNode.setAttribute('src', src);
  imageNode.setAttribute('border', '0');
  return imageNode;
};

/**
 * Adds a link node to the head of the document.
 *
 * The charset is hardcoded to `UTF-8` and the type is `text/css`.
 *
 * @param rel String that represents the rel attribute of the link node.
 * @param href String that represents the href attribute of the link node.
 * @param doc Optional parent document of the link node.
 * @param id unique id for the link element to check if it already exists
 */
export const addLinkToHead = (
  rel: string,
  href: string,
  doc: Document | null = null,
  id: string | null = null
) => {
  doc = doc || document;

  // Workaround for Operation Aborted in IE6 if base tag is used in head
  const link = doc.createElement('link');

  link.setAttribute('rel', rel);
  link.setAttribute('href', href);
  link.setAttribute('charset', 'UTF-8');
  link.setAttribute('type', 'text/css');

  if (id) {
    link.setAttribute('id', id);
  }

  const head = doc.getElementsByTagName('head')[0];
  head.appendChild(link);
};
