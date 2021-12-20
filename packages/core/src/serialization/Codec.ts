/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import CellPath from '../view/cell/CellPath';
import CodecRegistry from './CodecRegistry';
import { NODETYPE } from '../util/constants';
import Cell from '../view/cell/Cell';
import MaxLog from '../gui/MaxLog';
import { getFunctionName } from '../util/stringUtils';
import { importNode, isNode } from '../util/domUtils';
import CellCodec from 'src/view/cell/CellCodec';
import ObjectCodec from './ObjectCodec';

const createXmlDocument = () => {
  return document.implementation.createDocument('', '', null);
};

/**
 * XML codec for JavaScript object graphs. See {@link ObjectCodec} for a
 * description of the general encoding/decoding scheme. This class uses the
 * codecs registered in {@link CodecRegistry} for encoding/decoding each object.
 *
 * ### References
 *
 * In order to resolve references, especially forward references, the Codec
 * constructor must be given the document that contains the referenced
 * elements.
 *
 * ### Examples
 *
 * The following code is used to encode a graph model.
 *
 * ```javascript
 * var encoder = new Codec();
 * var result = encoder.encode(graph.getModel());
 * var xml = mxUtils.getXml(result);
 * ```
 *
 * #### Example
 *
 * Using the code below, an XML document is decoded into an existing model. The
 * document may be obtained using one of the functions in mxUtils for loading
 * an XML file, eg. {@link mxUtils.get}, or using {@link mxUtils.parseXml} for parsing an
 * XML string.
 *
 * ```javascript
 * var doc = mxUtils.parseXml(xmlString);
 * var codec = new Codec(doc);
 * codec.decode(doc.documentElement, graph.getModel());
 * ```
 *
 * #### Example
 *
 * This example demonstrates parsing a list of isolated cells into an existing
 * graph model. Note that the cells do not have a parent reference so they can
 * be added anywhere in the cell hierarchy after parsing.
 *
 * ```javascript
 * var xml = '<root><mxCell id="2" value="Hello," vertex="1"><mxGeometry x="20" y="20" width="80" height="30" as="geometry"/></mxCell><mxCell id="3" value="World!" vertex="1"><mxGeometry x="200" y="150" width="80" height="30" as="geometry"/></mxCell><mxCell id="4" value="" edge="1" source="2" target="3"><mxGeometry relative="1" as="geometry"/></mxCell></root>';
 * var doc = mxUtils.parseXml(xml);
 * var codec = new Codec(doc);
 * var elt = doc.documentElement.firstChild;
 * var cells = [];
 *
 * while (elt != null)
 * {
 *   cells.push(codec.decode(elt));
 *   elt = elt.nextSibling;
 * }
 *
 * graph.addCells(cells);
 * ```
 *
 * #### Example
 *
 * Using the following code, the selection cells of a graph are encoded and the
 * output is displayed in a dialog box.
 *
 * ```javascript
 * var enc = new Codec();
 * var cells = graph.getSelectionCells();
 * mxUtils.alert(mxUtils.getPrettyXml(enc.encode(cells)));
 * ```
 *
 * Newlines in the XML can be converted to <br>, in which case a '<br>' argument
 * must be passed to {@link mxUtils.getXml} as the second argument.
 *
 * ### Debugging
 *
 * For debugging I/O you can use the following code to get the sequence of
 * encoded objects:
 *
 * ```javascript
 * var oldEncode = encode;
 * encode(obj)
 * {
 *   MaxLog.show();
 *   MaxLog.debug('Codec.encode: obj='+mxUtils.getFunctionName(obj.constructor));
 *
 *   return oldEncode.apply(this, arguments);
 * };
 * ```
 *
 * Note that the I/O system adds object codecs for new object automatically. For
 * decoding those objects, the constructor should be written as follows:
 *
 * ```javascript
 * var MyObj(name)
 * {
 *   // ...
 * };
 * ```
 *
 * @class Codec
 */
class Codec {
  constructor(document: XMLDocument=createXmlDocument()) {
    this.document = document;
    this.objects = {};
  }

  /**
   * The owner document of the codec.
   */
  document: XMLDocument;

  /**
   * Maps from IDs to objects.
   */
  objects: { [key: string]: Element };

  /**
   * Lookup table for resolving IDs to elements.
   */
  elements: any = null;  // { [key: string]: Element } | null

  /**
   * Specifies if default values should be encoded. Default is false.
   */
  encodeDefaults: boolean = false;

  /**
   * Assoiates the given object with the given ID and returns the given object.
   *
   * @param id ID for the object to be associated with.
   * @param obj Object to be associated with the ID.
   */
  putObject(id: string, obj: any): any {
    this.objects[id] = obj;
    return obj;
  }

  /**
   * Returns the decoded object for the element with the specified ID in
   * {@link document}. If the object is not known then {@link lookup} is used to find an
   * object. If no object is found, then the element with the respective ID
   * from the document is parsed using {@link decode}.
   */
  getObject(id: string): any {
    let obj = null;

    if (id != null) {
      obj = this.objects[id];

      if (obj == null) {
        obj = this.lookup(id);

        if (obj == null) {
          const node = this.getElementById(id);

          if (node != null) {
            obj = this.decode(node);
          }
        }
      }
    }

    return obj;
  }

  /**
   * Hook for subclassers to implement a custom lookup mechanism for cell IDs.
   * This implementation always returns null.
   *
   * Example:
   *
   * ```javascript
   * var codec = new Codec();
   * codec.lookup(id)
   * {
   *   return model.getCell(id);
   * };
   * ```
   *
   * @param id ID of the object to be returned.
   */
  lookup(id: string): any {
    return null;
  }

  /**
   * Returns the element with the given ID from {@link document}.
   *
   * @param id String that contains the ID.
   */
  getElementById(id: string): Element {
    this.updateElements();
    return this.elements[id];
  }

  /**
   * Returns the element with the given ID from {@link document}.
   *
   * @param id String that contains the ID.
   */
  updateElements(): void {
    if (this.elements == null) {
      this.elements = {};

      if (this.document.documentElement != null) {
        this.addElement(this.document.documentElement);
      }
    }
  }

  /**
   * Adds the given element to {@link elements} if it has an ID.
   */
  addElement(node: Element): void {
    if (node.nodeType === NODETYPE.ELEMENT) {
      const id = node.getAttribute('id');

      if (id != null) {
        if (this.elements[id] == null) {
          this.elements[id] = node;
        } else if (this.elements[id] !== node) {
          throw new Error(`${id}: Duplicate ID`);
        }
      }
    }

    let nodeChild = node.firstChild;
    while (nodeChild != null) {
      this.addElement(<Element>nodeChild);
      nodeChild = nodeChild.nextSibling;
    }
  }

  /**
   * Returns the ID of the specified object. This implementation
   * calls {@link reference} first and if that returns null handles
   * the object as an {@link Cell} by returning their IDs using
   * {@link Cell.getId}. If no ID exists for the given cell, then
   * an on-the-fly ID is generated using {@link CellPath.create}.
   *
   * @param obj Object to return the ID for.
   */
  getId(obj: any): string {
    let id = null;

    if (obj != null) {
      id = this.reference(obj);

      if (id == null && obj instanceof Cell) {
        id = obj.getId();

        if (id == null) {
          // Uses an on-the-fly Id
          id = CellPath.create(obj);

          if (id.length === 0) {
            id = 'root';
          }
        }
      }
    }
    return id;
  }

  /**
   * Hook for subclassers to implement a custom method
   * for retrieving IDs from objects. This implementation
   * always returns null.
   *
   * Example:
   *
   * ```javascript
   * var codec = new Codec();
   * codec.reference(obj)
   * {
   *   return obj.getCustomId();
   * };
   * ```
   *
   * @param obj Object whose ID should be returned.
   */
  reference(obj: any): any {
    return null;
  }

  /**
   * Encodes the specified object and returns the resulting
   * XML node.
   *
   * @param obj Object to be encoded.
   */
  encode(obj: any): Element {
    let node = null;

    if (obj != null && obj.constructor != null) {
      const enc = CodecRegistry.getCodec(obj.constructor);

      if (enc != null) {
        node = enc.encode(this, obj);
      } else if (isNode(obj)) {
        node = importNode(this.document, obj, true);
      } else {
        MaxLog.warn(
          `Codec.encode: No codec for ${getFunctionName(obj.constructor)}`
        );
      }
    }
    return node;
  }

  /**
   * Decodes the given XML node. The optional "into"
   * argument specifies an existing object to be
   * used. If no object is given, then a new instance
   * is created using the constructor from the codec.
   *
   * The function returns the passed in object or
   * the new instance if no object was given.
   *
   * @param node XML node to be decoded.
   * @param into Optional object to be decodec into.
   */
  decode(node: Element, into?: any): any {
    this.updateElements();
    let obj = null;

    if (node != null && node.nodeType === NODETYPE.ELEMENT) {
      let ctor: any = null;

      try {
        // @ts-ignore
        ctor = window[node.nodeName];
      } catch (err) {
        // ignore
      }

      const dec = CodecRegistry.getCodec(ctor);

      if (dec != null) {
        obj = dec.decode(this, node, into);
      } else {
        obj = <Element>node.cloneNode(true);
        obj.removeAttribute('as');
      }
    }
    return obj;
  }

  /**
   * Encoding of cell hierarchies is built-into the core, but
   * is a higher-level function that needs to be explicitely
   * used by the respective object encoders (eg. {@link ModelCodec},
   * {@link ChildChangeCodec} and {@link RootChangeCodec}). This
   * implementation writes the given cell and its children as a
   * (flat) sequence into the given node. The children are not
   * encoded if the optional includeChildren is false. The
   * function is in charge of adding the result into the
   * given node and has no return value.
   *
   * @param cell {@link mxCell} to be encoded.
   * @param node Parent XML node to add the encoded cell into.
   * @param includeChildren Optional boolean indicating if the
   * function should include all descendents. Default is true.
   */
  encodeCell(cell: Cell, node: Node, includeChildren?: boolean): void {
    node.appendChild(this.encode(cell));

    if (includeChildren == null || includeChildren) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        this.encodeCell(cell.getChildAt(i), node);
      }
    }
  }

  /**
   * Returns true if the given codec is a cell codec. This uses
   * {@link CellCodec.isCellCodec} to check if the codec is of the
   * given type.
   */
  isCellCodec(codec: any): boolean {
    if (codec != null && 'isCellCodec' in codec) {
      return codec.isCellCodec();
    }
    return false;
  }

  /**
   * Decodes cells that have been encoded using inversion, ie.
   * where the user object is the enclosing node in the XML,
   * and restores the group and graph structure in the cells.
   * Returns a new {@link Cell} instance that represents the
   * given node.
   *
   * @param node XML node that contains the cell data.
   * @param restoreStructures Optional boolean indicating whether
   * the graph structure should be restored by calling insert
   * and insertEdge on the parent and terminals, respectively.
   * Default is true.
   */
  decodeCell(node: Element, restoreStructures?: boolean): Cell {
    restoreStructures = restoreStructures != null ? restoreStructures : true;
    let cell = null;

    if (node != null && node.nodeType === NODETYPE.ELEMENT) {
      // Tries to find a codec for the given node name. If that does
      // not return a codec then the node is the user object (an XML node
      // that contains the mxCell, aka inversion).
      let decoder = CodecRegistry.getCodec(node.nodeName);

      // Tries to find the codec for the cell inside the user object.
      // This assumes all node names inside the user object are either
      // not registered or they correspond to a class for cells.
      if (!this.isCellCodec(decoder)) {
        let child = node.firstChild;

        while (child != null && !this.isCellCodec(decoder)) {
          decoder = CodecRegistry.getCodec(child.nodeName);
          child = child.nextSibling;
        }
      }

      if (!this.isCellCodec(decoder)) {
        decoder = CodecRegistry.getCodec(Cell);
      }
      cell = (<ObjectCodec>decoder).decode(this, node);

      if (restoreStructures) {
        this.insertIntoGraph(cell);
      }
    }
    return cell;
  }

  /**
   * Inserts the given cell into its parent and terminal cells.
   */
  insertIntoGraph(cell: Cell): void {
    const { parent } = cell;
    const source = cell.getTerminal(true);
    const target = cell.getTerminal(false);

    // Fixes possible inconsistencies during insert into graph
    cell.setTerminal(null, false);
    cell.setTerminal(null, true);
    cell.parent = null;

    if (parent != null) {
      if (parent === cell) {
        throw new Error(`${parent.id}: Self Reference`);
      } else {
        parent.insert(cell);
      }
    }

    if (source != null) {
      source.insertEdge(cell, true);
    }

    if (target != null) {
      target.insertEdge(cell, false);
    }
  }

  /**
   * Sets the attribute on the specified node to value. This is a
   * helper method that makes sure the attribute and value arguments
   * are not null.
   *
   * @param node XML node to set the attribute for.
   * @param attributes Attributename to be set.
   * @param value New value of the attribute.
   */
  setAttribute(node: Element, attribute: string, value: any): void {
    if (attribute != null && value != null) {
      node.setAttribute(attribute, value);
    }
  }
}

export default Codec;
