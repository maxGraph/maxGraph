import { NODETYPE_ELEMENT } from './constants';

/**
 * Function: extractTextWithWhitespace
 *
 * Returns the text content of the specified node.
 *
 * Parameters:
 *
 * elems - DOM nodes to return the text for.
 */
export const extractTextWithWhitespace = (elems) => {
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
  const ret = [];

  function doExtract(elts) {
    // Single break should be ignored
    if (
      elts.length == 1 &&
      (elts[0].nodeName == 'BR' || elts[0].innerHTML == '\n')
    ) {
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
          if (elem.nodeValue.length > 0) {
            ret.push(elem.nodeValue);
          }
        } else if (elem.nodeType !== 8 && elem.childNodes.length > 0) {
          doExtract(elem.childNodes);
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
 * Function: getTextContent
 *
 * Returns the text content of the specified node.
 *
 * Parameters:
 *
 * node - DOM node to return the text content for.
 */
export const getTextContent = (node) => {
  return node != null
    ? node[node.textContent === undefined ? 'text' : 'textContent']
    : '';
};

/**
 * Function: setTextContent
 *
 * Sets the text content of the specified node.
 *
 * Parameters:
 *
 * node - DOM node to set the text content for.
 * text - String that represents the text content.
 */
export const setTextContent = (node, text) => {
  if (node.innerText !== undefined) {
    node.innerText = text;
  } else {
    node[node.textContent === undefined ? 'text' : 'textContent'] = text;
  }
};

/**
 * Function: getInnerHtml
 *
 * Returns the inner HTML for the given node as a string or an empty string
 * if no node was specified. The inner HTML is the text representing all
 * children of the node, but not the node itself.
 *
 * Parameters:
 *
 * node - DOM node to return the inner HTML for.
 */
export const getInnerHtml = (node) => {
  if (node != null) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(node);
  }

  return '';
};

/**
 * Function: getOuterHtml
 *
 * Returns the outer HTML for the given node as a string or an empty
 * string if no node was specified. The outer HTML is the text representing
 * all children of the node including the node itself.
 *
 * Parameters:
 *
 * node - DOM node to return the outer HTML for.
 */
export const getOuterHtml = (node) => {
  if (node != null) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(node);
  }

  return '';
};

/**
 * Function: write
 *
 * Creates a text node for the given string and appends it to the given
 * parent. Returns the text node.
 *
 * Parameters:
 *
 * parent - DOM node to append the text node to.
 * text - String representing the text to be added.
 */
export const write = (parent, text) => {
  const doc = parent.ownerDocument;
  const node = doc.createTextNode(text);

  if (parent != null) {
    parent.appendChild(node);
  }

  return node;
};

/**
 * Function: writeln
 *
 * Creates a text node for the given string and appends it to the given
 * parent with an additional linefeed. Returns the text node.
 *
 * Parameters:
 *
 * parent - DOM node to append the text node to.
 * text - String representing the text to be added.
 */
export const writeln = (parent, text) => {
  const doc = parent.ownerDocument;
  const node = doc.createTextNode(text);

  if (parent != null) {
    parent.appendChild(node);
    parent.appendChild(document.createElement('br'));
  }

  return node;
};

/**
 * Function: br
 *
 * Appends a linebreak to the given parent and returns the linebreak.
 *
 * Parameters:
 *
 * parent - DOM node to append the linebreak to.
 */
export const br = (parent, count) => {
  count = count || 1;
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
 * Function: para
 *
 * Appends a new paragraph with the given text to the specified parent and
 * returns the paragraph.
 *
 * Parameters:
 *
 * parent - DOM node to append the text node to.
 * text - String representing the text for the new paragraph.
 */
export const para = (parent, text) => {
  const p = document.createElement('p');
  write(p, text);

  if (parent != null) {
    parent.appendChild(p);
  }

  return p;
};

/**
 * Function: isNode
 *
 * Returns true if the given value is an XML node with the node name
 * and if the optional attribute has the specified value.
 *
 * This implementation assumes that the given value is a DOM node if the
 * nodeType property is numeric, that is, if isNaN returns false for
 * value.nodeType.
 *
 * Parameters:
 *
 * value - Object that should be examined as a node.
 * nodeName - String that specifies the node name.
 * attributeName - Optional attribute name to check.
 * attributeValue - Optional attribute value to check.
 */
export const isNode = (value, nodeName, attributeName, attributeValue) => {
  if (
    value != null &&
    !isNaN(value.nodeType) &&
    (nodeName == null || value.nodeName.toLowerCase() == nodeName.toLowerCase())
  ) {
    return (
      attributeName == null ||
      value.getAttribute(attributeName) == attributeValue
    );
  }

  return false;
};

/**
 * Function: isAncestorNode
 *
 * Returns true if the given ancestor is an ancestor of the
 * given DOM node in the DOM. This also returns true if the
 * child is the ancestor.
 *
 * Parameters:
 *
 * ancestor - DOM node that represents the ancestor.
 * child - DOM node that represents the child.
 */
export const isAncestorNode = (ancestor, child) => {
  let parent = child;

  while (parent != null) {
    if (parent === ancestor) {
      return true;
    }

    parent = parent.parentNode;
  }

  return false;
};

/**
 * Function: getChildNodes
 *
 * Returns an array of child nodes that are of the given node type.
 *
 * Parameters:
 *
 * node - Parent DOM node to return the children from.
 * nodeType - Optional node type to return. Default is
 * <mxConstants.NODETYPE_ELEMENT>.
 */
export const getChildNodes = (node: Element, nodeType: number=NODETYPE_ELEMENT) => {
  nodeType = nodeType || NODETYPE_ELEMENT;

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
 * Function: importNode
 *
 * Cross browser implementation for document.importNode. Uses document.importNode
 * in all browsers but IE, where the node is cloned by creating a new node and
 * copying all attributes and children into it using importNode, recursively.
 *
 * Parameters:
 *
 * doc - Document to import the node into.
 * node - Node to be imported.
 * allChildren - If all children should be imported.
 */
export const importNode = (doc, node, allChildren) => {
  return doc.importNode(node, allChildren);
};

/**
 * Function: importNodeImplementation
 *
 * Full DOM API implementation for importNode without using importNode API call.
 *
 * Parameters:
 *
 * doc - Document to import the node into.
 * node - Node to be imported.
 * allChildren - If all children should be imported.
 */
export const importNodeImplementation = (doc, node, allChildren) => {
  switch (node.nodeType) {
    case 1 /* element */: {
      const newNode = doc.createElement(node.nodeName);

      if (node.attributes && node.attributes.length > 0) {
        for (let i = 0; i < node.attributes.length; i += 1) {
          newNode.setAttribute(
            node.attributes[i].nodeName,
            node.getAttribute(node.attributes[i].nodeName)
          );
        }
      }

      if (allChildren && node.childNodes && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i += 1) {
          newNode.appendChild(
            importNodeImplementation(doc, node.childNodes[i], allChildren)
          );
        }
      }

      return newNode;
      break;
    }
    case 3: /* text */
    case 4: /* cdata-section */
    case 8 /* comment */: {
      return doc.createTextNode(
        node.nodeValue != null ? node.nodeValue : node.value
      );
      break;
    }
  }
};

/**
 * Function: clearSelection
 *
 * Clears the current selection in the page.
 */
export const clearSelection = () => {
  if (document.selection) {
    document.selection.empty();
  } else if (window.getSelection) {
    if (window.getSelection().empty) {
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {
      window.getSelection().removeAllRanges();
    }
  }
};
