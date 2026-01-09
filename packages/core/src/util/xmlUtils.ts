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

import { NODE_TYPE } from './Constants.js';
import { htmlEntities, trim } from './StringUtils.js';
import { getTextContent } from './domUtils.js';
import { isElement } from '../internal/utils.js';
import type { StyleValue } from '../types.js';

/**
 * Returns a new, empty XML document.
 */
export const createXmlDocument = (): XMLDocument => {
  return document.implementation.createDocument('', '', null);
};

export const parseXml = (xmlString: string): Document => {
  return new DOMParser().parseFromString(xmlString, 'text/xml');
};

/**
 * Returns the XML content of the specified node.
 *
 * All `\n` are then replaced with the linefeed parameter value.
 *
 * @param node DOM node to return the XML for.
 * @param linefeed Optional string that linefeed are converted into. Default is `&#xa;`.
 */
export const getXml = (node: Element, linefeed = '&#xa;'): string => {
  const xmlSerializer = new XMLSerializer();
  let xml = xmlSerializer.serializeToString(node);

  // Replaces linefeed with HTML Entities.
  xml = xml.replace(/\n/g, linefeed);
  return xml;
};

/**
 * Returns a pretty printed string that represents the XML tree for the
 * given node. This method should only be used to print XML for reading,
 * use <getXml> instead to obtain a string for processing.
 *
 * @param node DOM node to return the XML for.
 * @param tab Optional string that specifies the indentation for one level.
 * @param indent Optional string that represents the current indentation.
 * @param newline Optional string that represents a linefeed.
 * @param ns Optional string that represents the target namespace URI.
 */
export const getPrettyXml = (
  node: Element | null,
  tab = '  ',
  indent = '',
  newline = '\n',
  ns: string | null = null
): string => {
  const result = [];

  if (node != null) {
    if (node.namespaceURI != null && node.namespaceURI !== ns) {
      ns = node.namespaceURI;

      if (node.getAttribute('xmlns') == null) {
        node.setAttribute('xmlns', node.namespaceURI);
      }
    }

    switch (node.nodeType) {
      case NODE_TYPE.DOCUMENT: {
        result.push(
          getPrettyXml(
            (<Document>(<unknown>node)).documentElement,
            tab,
            indent,
            newline,
            ns
          )
        );

        break;
      }
      case NODE_TYPE.DOCUMENT_FRAGMENT: {
        let tmp = node.firstChild;

        if (tmp != null) {
          while (tmp != null) {
            result.push(getPrettyXml(<Element>tmp, tab, indent, newline, ns));
            tmp = tmp.nextSibling;
          }
        }

        break;
      }
      case NODE_TYPE.COMMENT: {
        const value = getTextContent(<Text>(<unknown>node));

        if (value.length > 0) {
          result.push(`${indent}<!--${value}-->${newline}`);
        }

        break;
      }
      case NODE_TYPE.TEXT: {
        const value = trim(getTextContent(<Text>(<unknown>node)));

        if (value && value.length > 0) {
          result.push(indent + htmlEntities(value, false) + newline);
        }

        break;
      }
      case NODE_TYPE.CDATA: {
        const value = getTextContent(<Text>(<unknown>node));

        if (value.length > 0) {
          result.push(`${indent}<![CDATA[${value}]]${newline}`);
        }

        break;
      }
      default: {
        result.push(`${indent}<${node.nodeName}`);

        // Creates the string with the node attributes
        // and converts all HTML entities in the values
        const attrs = node.attributes;

        if (attrs != null) {
          for (let i = 0; i < attrs.length; i += 1) {
            const val = htmlEntities(attrs[i].value);
            result.push(` ${attrs[i].nodeName}="${val}"`);
          }
        }

        // Recursively creates the XML string for each child
        // node and appends it here with an indentation
        let tmp = node.firstChild;

        if (tmp != null) {
          result.push(`>${newline}`);

          while (tmp != null) {
            result.push(getPrettyXml(<Element>tmp, tab, indent + tab, newline, ns));
            tmp = tmp.nextSibling;
          }

          result.push(`${indent}</${node.nodeName}>${newline}`);
        } else {
          result.push(` />${newline}`);
        }
      }
    }
  }
  return result.join('');
};

/**
 * Returns the first node where attr equals value.
 * This implementation does not use XPath.
 */
export const findNode = (
  node: Element,
  attr: string,
  value: StyleValue
): Element | null => {
  if (isElement(node)) {
    const tmp = node.getAttribute(attr);
    if (tmp && tmp === value) {
      return node;
    }
  }

  node = node.firstChild as Element;

  while (node) {
    const result = findNode(node, attr, value);
    if (result) {
      return result;
    }
    node = node.nextSibling as Element;
  }

  return null;
};
