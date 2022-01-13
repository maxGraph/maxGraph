/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { NODETYPE } from '../../util/Constants';
import Geometry from '../geometry/Geometry';
import CellOverlay from './CellOverlay';
import { clone } from '../../util/cloneUtils';
import Point from '../geometry/Point';
import CellPath from './CellPath';
import CellArray from './CellArray';
import { isNotNullish } from '../../util/Utils';
import ObjectCodec from '../../serialization/ObjectCodec';
import CodecRegistry from '../../serialization/CodecRegistry';
import { removeWhitespace } from '../../util/StringUtils';
import { importNode } from '../../util/domUtils';
import Codec from '../../serialization/Codec';

import type { FilterFunction } from '../../types';

/**
 * Cells are the elements of the graph model. They represent the state
 * of the groups, vertices and edges in a graph.
 *
 * ### Custom attributes
 * For custom attributes we recommend using an XML node as the value of a cell.
 * The following code can be used to create a cell with an XML node as the value:
 * ```javascript
 * var doc = mxUtils.createXmlDocument();
 * var node = doc.createElement('MyNode')
 * node.setAttribute('label', 'MyLabel');
 * node.setAttribute('attribute1', 'value1');
 * graph.insertVertex(graph.getDefaultParent(), null, node, 40, 40, 80, 30);
 * ```
 *
 * For the label to work, {@link graph.convertValueToString} and
 * {@link graph.cellLabelChanged} should be overridden as follows:
 *
 * ```javascript
 * graph.convertValueToString(cell)
 * {
 *   if (mxUtils.isNode(cell.value))
 *   {
 *     return cell.getAttribute('label', '')
 *   }
 * };
 *
 * var cellLabelChanged = graph.cellLabelChanged;
 * graph.cellLabelChanged(cell, newValue, autoSize)
 * {
 *   if (mxUtils.isNode(cell.value))
 *   {
 *     // Clones the value for correct undo/redo
 *     var elt = cell.value.cloneNode(true);
 *     elt.setAttribute('label', newValue);
 *     newValue = elt;
 *   }
 *
 *   cellLabelChanged.apply(this, arguments);
 * };
 * ```
 * @class Cell
 */
export class Cell {
  constructor(
    value: any = null,
    geometry: Geometry | null = null,
    style: string | null = null
  ) {
    this.value = value;
    this.setGeometry(geometry);
    this.setStyle(style);

    if (this.onInit) {
      this.onInit();
    }
  }

  // TODO: Document me!!!
  getChildren(): CellArray {
    return this.children || new CellArray();
  }

  // TODO: Document me!
  // used by invalidate() of mxGraphView
  invalidating: boolean = false;

  onInit: (() => void) | null = null;

  // used by addCellOverlay() of mxGraph
  overlays: CellOverlay[] = [];

  /**
   * Holds the Id. Default is null.
   */
  id: string | null = null;

  /**
   * Holds the user object. Default is null.
   */
  value: any = null;

  /**
   * Holds the {@link Geometry}. Default is null.
   */
  geometry: Geometry | null = null;

  /**
   * Holds the style as a string of the form [(stylename|key=value);]. Default is
   * null.
   */
  style: string | null = null;

  /**
   * Specifies whether the cell is a vertex. Default is false.
   */
  vertex: boolean = false;

  /**
   * Specifies whether the cell is an edge. Default is false.
   */
  edge: boolean = false;

  /**
   * Specifies whether the cell is connectable. Default is true.
   */
  connectable: boolean = true;

  /**
   * Specifies whether the cell is visible. Default is true.
   */
  visible: boolean = true;

  /**
   * Specifies whether the cell is collapsed. Default is false.
   */
  collapsed: boolean = false;

  /**
   * Reference to the parent cell.
   */
  parent: Cell | null = null;

  /**
   * Reference to the source terminal.
   */
  source: Cell | null = null;

  /**
   * Reference to the target terminal.
   */
  target: Cell | null = null;

  /**
   * Holds the child cells.
   */
  children: CellArray = new CellArray();

  /**
   * Holds the edges.
   */
  edges: CellArray = new CellArray();

  /**
   * List of members that should not be cloned inside <clone>. This field is
   * passed to {@link Utils#clone} and is not made persistent in <CellCodec>.
   * This is not a convention for all classes, it is only used in this class
   * to mark transient fields since transient modifiers are not supported by
   * the language.
   */
  mxTransient: string[] = [
    'id',
    'value',
    'parent',
    'source',
    'target',
    'children',
    'edges',
  ];

  /**
   * Returns the Id of the cell as a string.
   */
  getId(): string | null {
    return this.id;
  }

  /**
   * Sets the Id of the cell to the given string.
   */
  setId(id: string): void {
    this.id = id;
  }

  /**
   * Returns the user object of the cell. The user
   * object is stored in <value>.
   */
  getValue(): any {
    return this.value;
  }

  /**
   * Sets the user object of the cell. The user object
   * is stored in <value>.
   */
  setValue(value: any): void {
    this.value = value;
  }

  /**
   * Changes the user object after an in-place edit
   * and returns the previous value. This implementation
   * replaces the user object with the given value and
   * returns the old user object.
   */
  valueChanged(newValue: any): any {
    const previous = this.getValue();
    this.setValue(newValue);
    return previous;
  }

  /**
   * Returns the {@link Geometry} that describes the <geometry>.
   */
  getGeometry(): Geometry | null {
    return this.geometry;
  }

  /**
   * Sets the {@link Geometry} to be used as the <geometry>.
   */
  setGeometry(geometry: Geometry | null) {
    this.geometry = geometry;
  }

  /**
   * Returns a string that describes the <style>.
   */
  getStyle(): string | null {
    return this.style;
  }

  /**
   * Sets the string to be used as the <style>.
   */
  setStyle(style: string | null) {
    this.style = style;
  }

  /**
   * Returns true if the cell is a vertex.
   */
  isVertex(): boolean {
    return this.vertex;
  }

  /**
   * Specifies if the cell is a vertex. This should only be assigned at
   * construction of the cell and not be changed during its lifecycle.
   *
   * @param vertex Boolean that specifies if the cell is a vertex.
   */
  setVertex(vertex: boolean): void {
    this.vertex = vertex;
  }

  /**
   * Returns true if the cell is an edge.
   */
  isEdge(): boolean {
    return this.edge;
  }

  /**
   * Specifies if the cell is an edge. This should only be assigned at
   * construction of the cell and not be changed during its lifecycle.
   *
   * @param edge Boolean that specifies if the cell is an edge.
   */
  setEdge(edge: boolean): void {
    this.edge = edge;
  }

  /**
   * Returns true if the cell is connectable.
   */
  isConnectable(): boolean {
    return this.connectable;
  }

  /**
   * Sets the connectable state.
   *
   * @param connectable Boolean that specifies the new connectable state.
   */
  setConnectable(connectable: boolean): void {
    this.connectable = connectable;
  }

  /**
   * Returns true if the cell is visibile.
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Specifies if the cell is visible.
   *
   * @param visible Boolean that specifies the new visible state.
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Returns true if the cell is collapsed.
   */
  isCollapsed(): boolean {
    return this.collapsed;
  }

  /**
   * Sets the collapsed state.
   *
   * @param collapsed Boolean that specifies the new collapsed state.
   */
  setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
  }

  /**
   * Returns the cell's parent.
   */
  getParent() {
    return this.parent;
  }

  /**
   * Sets the parent cell.
   *
   * @param parent<Cell> that represents the new parent.
   */
  setParent(parent: Cell | null) {
    this.parent = parent;
  }

  /**
   * Returns the source or target terminal.
   *
   * @param source Boolean that specifies if the source terminal should be
   * returned.
   */
  getTerminal(source: boolean = false) {
    return source ? this.source : this.target;
  }

  /**
   * Sets the source or target terminal and returns the new terminal.
   *
   * @param {Cell} terminal     mxCell that represents the new source or target terminal.
   * @param {boolean} isSource  boolean that specifies if the source or target terminal
   * should be set.
   */
  setTerminal(terminal: Cell | null, isSource: boolean) {
    if (isSource) {
      this.source = terminal;
    } else {
      this.target = terminal;
    }

    return terminal;
  }

  /**
   * Returns the number of child cells.
   */
  getChildCount(): number {
    return this.children.length;
  }

  /**
   * Returns the index of the specified child in the child array.
   *
   * @param childChild whose index should be returned.
   */
  getIndex(child: Cell | null) {
    if (child === null) return -1;
    return this.children.indexOf(child);
  }

  /**
   * Returns the child at the specified index.
   *
   * @param indexInteger that specifies the child to be returned.
   */
  getChildAt(index: number): Cell {
    return this.children[index];
  }

  /**
   * Inserts the specified child into the child array at the specified index
   * and updates the parent reference of the child. If not childIndex is
   * specified then the child is appended to the child array. Returns the
   * inserted child.
   *
   * @param child<Cell> to be inserted or appended to the child array.
   * @param indexOptional integer that specifies the index at which the child
   * should be inserted into the child array.
   */
  insert(child: Cell, index?: number): Cell | null {
    if (index === undefined) {
      index = this.getChildCount();

      if (child.getParent() === this) {
        index--;
      }
    }

    child.removeFromParent();
    child.setParent(this);

    this.children.splice(index, 0, child);

    return child;
  }

  /**
   * Removes the child at the specified index from the child array and
   * returns the child that was removed. Will remove the parent reference of
   * the child.
   *
   * @param indexInteger that specifies the index of the child to be
   * removed.
   */
  remove(index: number): Cell | null {
    let child = null;

    if (index >= 0) {
      child = this.getChildAt(index);
      if (child) {
        this.children.splice(index, 1);
        child.setParent(null);
      }
    }

    return child;
  }

  /**
   * Removes the cell from its parent.
   */
  removeFromParent(): void {
    if (this.parent) {
      const index = this.parent.getIndex(this);
      this.parent.remove(index);
    }
  }

  /**
   * Returns the number of edges in the edge array.
   */
  getEdgeCount() {
    return this.edges.length;
  }

  /**
   * Returns the index of the specified edge in <edges>.
   *
   * @param edge<Cell> whose index in <edges> should be returned.
   */
  getEdgeIndex(edge: Cell) {
    return this.edges.indexOf(edge);
  }

  /**
   * Returns the edge at the specified index in <edges>.
   *
   * @param indexInteger that specifies the index of the edge to be returned.
   */
  getEdgeAt(index: number) {
    return this.edges[index];
  }

  /**
   * Inserts the specified edge into the edge array and returns the edge.
   * Will update the respective terminal reference of the edge.
   *
   * @param edge              <Cell> to be inserted into the edge array.
   * @param isOutgoing Boolean that specifies if the edge is outgoing.
   */
  insertEdge(edge: Cell, isOutgoing: boolean = false) {
    edge.removeFromTerminal(isOutgoing);
    edge.setTerminal(this, isOutgoing);

    if (
      this.edges.length === 0 ||
      edge.getTerminal(!isOutgoing) !== this ||
      this.edges.indexOf(edge) < 0
    ) {
      this.edges.push(edge);
    }

    return edge;
  }

  /**
   * Removes the specified edge from the edge array and returns the edge.
   * Will remove the respective terminal reference from the edge.
   *
   * @param edge<Cell> to be removed from the edge array.
   * @param isOutgoing Boolean that specifies if the edge is outgoing.
   */
  removeEdge(edge: Cell | null, isOutgoing: boolean = false): Cell | null {
    if (edge != null) {
      if (edge.getTerminal(!isOutgoing) !== this && this.edges != null) {
        const index = this.getEdgeIndex(edge);

        if (index >= 0) {
          this.edges.splice(index, 1);
        }
      }
      edge.setTerminal(null, isOutgoing);
    }
    return edge;
  }

  /**
   * Removes the edge from its source or target terminal.
   *
   * @param isSource Boolean that specifies if the edge should be removed from its source or target terminal.
   */
  removeFromTerminal(isSource: boolean): void {
    const terminal = this.getTerminal(isSource);

    if (terminal) {
      terminal.removeEdge(this, isSource);
    }
  }

  /**
   * Returns true if the user object is an XML node that contains the given
   * attribute.
   *
   * @param nameName nameName of the attribute.
   */
  hasAttribute(name: string): boolean {
    const userObject = this.getValue();

    return (
      isNotNullish(userObject) &&
      (userObject.nodeType === NODETYPE.ELEMENT && userObject.hasAttribute
        ? userObject.hasAttribute(name)
        : isNotNullish(userObject.getAttribute(name)))
    );
  }

  /**
   * Returns the specified attribute from the user object if it is an XML
   * node.
   *
   * @param nameName              of the attribute whose value should be returned.
   * @param defaultValueOptional  default value to use if the attribute has no
   * value.
   */
  getAttribute(name: string, defaultValue?: any): any {
    const userObject = this.getValue();
    const val =
      isNotNullish(userObject) && userObject.nodeType === NODETYPE.ELEMENT
        ? userObject.getAttribute(name)
        : null;

    return val ? val : defaultValue;
  }

  /**
   * Sets the specified attribute on the user object if it is an XML node.
   *
   * @param nameName    of the attribute whose value should be set.
   * @param valueNew    value of the attribute.
   */
  setAttribute(name: string, value: any): void {
    const userObject = this.getValue();

    if (isNotNullish(userObject) && userObject.nodeType === NODETYPE.ELEMENT) {
      userObject.setAttribute(name, value);
    }
  }

  /**
   * Returns a clone of the cell. Uses <cloneValue> to clone
   * the user object. All fields in {@link Transient} are ignored
   * during the cloning.
   */
  clone(): Cell {
    const c = clone(this, this.mxTransient);
    c.setValue(this.cloneValue());
    return c;
  }

  /**
   * Returns a clone of the cell's user object.
   */
  cloneValue(): any {
    let value = this.getValue();
    if (isNotNullish(value)) {
      if (typeof value.clone === 'function') {
        value = value.clone();
      } else if (isNotNullish(value.nodeType)) {
        value = value.cloneNode(true);
      }
    }
    return value;
  }

  /**
   * Returns the nearest common ancestor for the specified cells to `this`.
   *
   * @param {Cell} cell2  that specifies the second cell in the tree.
   */
  getNearestCommonAncestor(cell2: Cell): Cell | null {
    // Creates the cell path for the second cell
    let path = CellPath.create(cell2);

    if (path.length > 0) {
      // Bubbles through the ancestors of the first
      // cell to find the nearest common ancestor.
      let cell: Cell | null = this;
      let current: string | null = CellPath.create(cell);

      // Inverts arguments
      if (path.length < current.length) {
        cell = cell2;
        const tmp = current;
        current = path;
        path = tmp;
      }

      while (cell && current) {
        const parent: Cell | null = cell.getParent();

        // Checks if the cell path is equal to the beginning of the given cell path
        if (path.indexOf(current + CellPath.PATH_SEPARATOR) === 0 && parent) {
          return cell;
        }

        current = CellPath.getParentPath(current);
        cell = parent;
      }
    }

    return null;
  }

  /**
   * Returns true if the given parent is an ancestor of the given child. Note
   * returns true if child == parent.
   *
   * @param {Cell} child  that specifies the child.
   */
  isAncestor(child: Cell | null) {
    while (child && child !== this) {
      child = child.getParent();
    }

    return child === this;
  }

  /**
   * Returns the child vertices of the given parent.
   */
  getChildVertices(): CellArray {
    return this.getChildCells(true, false);
  }

  /**
   * Returns the child edges of the given parent.
   */
  getChildEdges(): CellArray {
    return this.getChildCells(false, true);
  }

  /**
   * Returns the children of the given cell that are vertices and/or edges
   * depending on the arguments.
   *
   * @param vertices  Boolean indicating if child vertices should be returned.
   * Default is false.
   * @param edges  Boolean indicating if child edges should be returned.
   * Default is false.
   */
  getChildCells(vertices: boolean = false, edges: boolean = false): CellArray {
    const childCount = this.getChildCount();
    const result = new CellArray();

    for (let i = 0; i < childCount; i += 1) {
      const child = this.getChildAt(i);

      if (
        (!edges && !vertices) ||
        (edges && child.isEdge()) ||
        (vertices && child.isVertex())
      ) {
        result.push(child);
      }
    }

    return result;
  }

  /**
   * Returns the number of incoming or outgoing edges, ignoring the given
   * edge.
   *
   * @param outgoing  Boolean that specifies if the number of outgoing or
   * incoming edges should be returned.
   * @param {Cell} ignoredEdge  that represents an edge to be ignored.
   */
  getDirectedEdgeCount(outgoing: boolean, ignoredEdge: Cell | null = null) {
    let count = 0;
    const edgeCount = this.getEdgeCount();

    for (let i = 0; i < edgeCount; i += 1) {
      const edge = this.getEdgeAt(i);
      if (edge !== ignoredEdge && edge && edge.getTerminal(outgoing) === this) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Returns all edges of the given cell without loops.
   */
  getConnections(): CellArray {
    return this.getEdges(true, true, false);
  }

  /**
   * Returns the incoming edges of the given cell without loops.
   */
  getIncomingEdges(): CellArray {
    return this.getEdges(true, false, false);
  }

  /**
   * Returns the outgoing edges of the given cell without loops.
   */
  getOutgoingEdges(): CellArray {
    return this.getEdges(false, true, false);
  }

  /**
   * Returns all distinct edges connected to this cell as a new array of
   * {@link Cell}. If at least one of incoming or outgoing is true, then loops
   * are ignored, otherwise if both are false, then all edges connected to
   * the given cell are returned including loops.
   *
   * @param incoming  Optional boolean that specifies if incoming edges should be
   * returned. Default is true.
   * @param outgoing  Optional boolean that specifies if outgoing edges should be
   * returned. Default is true.
   * @param includeLoops  Optional boolean that specifies if loops should be returned.
   * Default is true.
   */
  getEdges(
    incoming: boolean = true,
    outgoing: boolean = true,
    includeLoops: boolean = true
  ): CellArray {
    const edgeCount = this.getEdgeCount();
    const result = new CellArray();

    for (let i = 0; i < edgeCount; i += 1) {
      const edge = this.getEdgeAt(i);
      const source = edge.getTerminal(true);
      const target = edge.getTerminal(false);

      if (
        (includeLoops && source === target) ||
        (source !== target &&
          ((incoming && target === this) || (outgoing && source === this)))
      ) {
        result.push(edge);
      }
    }

    return result;
  }

  /**
   * Returns the absolute, accumulated origin for the children inside the
   * given parent as an {@link Point}.
   */
  getOrigin(): Point {
    let result = new Point();
    const parent = this.getParent();

    if (parent) {
      result = parent.getOrigin();

      if (!this.isEdge()) {
        const geo = this.getGeometry();

        if (geo) {
          result.x += geo.x;
          result.y += geo.y;
        }
      }
    }

    return result;
  }

  /**
   * Returns all descendants of the given cell and the cell itself in an array.
   */
  getDescendants(): CellArray {
    return this.filterDescendants(null);
  }

  /**
   * Visits all cells recursively and applies the specified filter function
   * to each cell. If the function returns true then the cell is added
   * to the resulting array. The parent and result paramters are optional.
   * If parent is not specified then the recursion starts at {@link root}.
   *
   * Example:
   * The following example extracts all vertices from a given model:
   * ```javascript
   * var filter(cell)
   * {
   * 	return model.isVertex(cell);
   * }
   * var vertices = model.filterDescendants(filter);
   * ```
   *
   * @param filter  JavaScript function that takes an {@link Cell} as an argument
   * and returns a boolean.
   */
  filterDescendants(filter: FilterFunction | null): CellArray {
    // Creates a new array for storing the result
    let result = new CellArray();

    // Checks if the filter returns true for the cell
    // and adds it to the result array
    if (filter === null || filter(this)) {
      result.push(this);
    }

    // Visits the children of the cell
    const childCount = this.getChildCount();
    for (let i = 0; i < childCount; i += 1) {
      const child = this.getChildAt(i);
      result = new CellArray(...result.concat(child.filterDescendants(filter)));
    }

    return result;
  }

  /**
   * Returns the root of the model or the topmost parent of the given cell.
   */
  getRoot() {
    let root: Cell = this;
    let cell: Cell | null = this;

    while (cell) {
      root = cell;
      cell = cell.getParent();
    }

    return root;
  }
}

/**
 * Codec for <Cell>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
 *
 * Transient Fields:
 *
 * - children
 * - edges
 * - overlays
 * - mxTransient
 *
 * Reference Fields:
 *
 * - parent
 * - source
 * - target
 *
 * Transient fields can be added using the following code:
 *
 * CodecRegistry.getCodec(mxCell).exclude.push('name_of_field');
 *
 * To subclass <Cell>, replace the template and add an alias as
 * follows.
 *
 * ```javascript
 * function CustomCell(value, geometry, style)
 * {
 *   mxCell.apply(this, arguments);
 * }
 *
 * mxUtils.extend(CustomCell, mxCell);
 *
 * CodecRegistry.getCodec(mxCell).template = new CustomCell();
 * CodecRegistry.addAlias('CustomCell', 'mxCell');
 * ```
 */
export class CellCodec extends ObjectCodec {
  constructor() {
    super(
      new Cell(),
      ['children', 'edges', 'overlays', 'mxTransient'],
      ['parent', 'source', 'target']
    );
  }

  /**
   * Returns true since this is a cell codec.
   */
  isCellCodec() {
    return true;
  }

  /**
   * Overidden to disable conversion of value to number.
   */
  isNumericAttribute(dec: Codec, attr: Element, obj: any) {
    return (
      attr.nodeName !== 'value' && super.isNumericAttribute(dec, attr, obj)
    );
  }

  /**
   * Excludes user objects that are XML nodes.
   */
  isExcluded(obj: any, attr: string, value: Element, isWrite: boolean) {
    return (
      super.isExcluded(obj, attr, value, isWrite) ||
      (isWrite && attr === 'value' && value.nodeType === NODETYPE.ELEMENT)
    );
  }

  /**
   * Encodes an <Cell> and wraps the XML up inside the
   * XML of the user object (inversion).
   */
  afterEncode(enc: Codec, obj: Cell, node: Element) {
    if (obj.value != null && obj.value.nodeType === NODETYPE.ELEMENT) {
      // Wraps the graphical annotation up in the user object (inversion)
      // by putting the result of the default encoding into a clone of the
      // user object (node type 1) and returning this cloned user object.
      const tmp = node;
      node = importNode(enc.document, obj.value, true);
      node.appendChild(tmp);

      // Moves the id attribute to the outermost XML node, namely the
      // node which denotes the object boundaries in the file.
      const id = tmp.getAttribute('id');
      node.setAttribute('id', String(id));
      tmp.removeAttribute('id');
    }

    return node;
  }

  /**
   * Decodes an <Cell> and uses the enclosing XML node as
   * the user object for the cell (inversion).
   */
  beforeDecode(dec: Codec, node: Element, obj: Cell): Element | null {
    let inner: Element | null = <Element>node.cloneNode(true);
    const classname = this.getName();

    if (node.nodeName !== classname) {
      // Passes the inner graphical annotation node to the
      // object codec for further processing of the cell.
      const tmp = node.getElementsByTagName(classname)[0];

      if (tmp != null && tmp.parentNode === node) {
        removeWhitespace(<HTMLElement>tmp, true);
        removeWhitespace(<HTMLElement>tmp, false);
        tmp.parentNode.removeChild(tmp);
        inner = tmp;
      } else {
        inner = null;
      }

      // Creates the user object out of the XML node
      obj.value = node.cloneNode(true);
      const id = obj.value.getAttribute('id');

      if (id != null) {
        obj.setId(id);
        obj.value.removeAttribute('id');
      }
    } else {
      // Uses ID from XML file as ID for cell in model
      obj.setId(<string>node.getAttribute('id'));
    }

    // Preprocesses and removes all Id-references in order to use the
    // correct encoder (this) for the known references to cells (all).
    if (inner != null) {
      for (let i = 0; i < this.idrefs.length; i += 1) {
        const attr = this.idrefs[i];
        const ref = inner.getAttribute(attr);

        if (ref != null) {
          inner.removeAttribute(attr);
          let object = dec.objects[ref] || dec.lookup(ref);

          if (object == null) {
            // Needs to decode forward reference
            const element = dec.getElementById(ref);

            if (element != null) {
              const decoder = CodecRegistry.codecs[element.nodeName] || this;
              object = decoder.decode(dec, element);
            }
          }

          // @ts-ignore dynamic assignment was in original implementation
          obj[attr] = object;
        }
      }
    }

    return inner;
  }
}

CodecRegistry.register(new CellCodec());
export default Cell;
