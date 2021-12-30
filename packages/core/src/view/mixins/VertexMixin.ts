import Cell from '../cell/Cell';
import Geometry from '../geometry/Geometry';
import { Graph } from '../Graph';
import CellArray from '../cell/CellArray';
import { mixInto } from '../../util/utils';

declare module '../Graph' {
  interface Graph {
    vertexLabelsMovable: boolean;
    allowNegativeCoordinates: boolean;

    isAllowNegativeCoordinates: () => boolean;
    setAllowNegativeCoordinates: (value: boolean) => void;
    insertVertex: (...args: any[]) => Cell;
    createVertex: (
      parent: Cell,
      id: string,
      value: any,
      x: number,
      y: number,
      width: number,
      height: number,
      style: any,
      relative: boolean,
      geometryClass: typeof Geometry
    ) => Cell;
    getChildVertices: (parent?: Cell | null) => CellArray;
    isVertexLabelsMovable: () => boolean;
    setVertexLabelsMovable: (value: boolean) => void;
  }
}

type PartialGraph = Pick<Graph, 'addCell' | 'getChildCells'>;
type PartialVertex = Pick<
  Graph,
  | 'vertexLabelsMovable'
  | 'allowNegativeCoordinates'
  | 'isAllowNegativeCoordinates'
  | 'setAllowNegativeCoordinates'
  | 'insertVertex'
  | 'createVertex'
  | 'getChildVertices'
  | 'isVertexLabelsMovable'
  | 'setVertexLabelsMovable'
>;
type PartialType = PartialGraph & PartialVertex;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const VertexMixin: PartialType = {
  /**
   * Specifies the return value for vertices in {@link isLabelMovable}.
   * @default false
   */
  vertexLabelsMovable: false,

  /**
   * Specifies if negative coordinates for vertices are allowed.
   * @default true
   */
  allowNegativeCoordinates: true,

  /**
   * Returns {@link allowNegativeCoordinates}.
   */
  isAllowNegativeCoordinates() {
    return this.allowNegativeCoordinates;
  },

  /**
   * Sets {@link allowNegativeCoordinates}.
   */
  setAllowNegativeCoordinates(value: boolean) {
    this.allowNegativeCoordinates = value;
  },

  /**
   * Adds a new vertex into the given parent <Cell> using value as the user
   * object and the given coordinates as the {@link Geometry} of the new vertex.
   * The id and style are used for the respective properties of the new
   * <Cell>, which is returned.
   *
   * When adding new vertices from a mouse event, one should take into
   * account the offset of the graph container and the scale and translation
   * of the view in order to find the correct unscaled, untranslated
   * coordinates using {@link Graph#getPointForEvent} as follows:
   *
   * ```javascript
   * let pt = graph.getPointForEvent(evt);
   * let parent = graph.getDefaultParent();
   * graph.insertVertex(parent, null,
   *       'Hello, World!', x, y, 220, 30);
   * ```
   *
   * For adding image cells, the style parameter can be assigned as
   *
   * ```javascript
   * stylename;image=imageUrl
   * ```
   *
   * See {@link Graph} for more information on using images.
   *
   * @param parent <Cell> that specifies the parent of the new vertex.
   * @param id Optional string that defines the Id of the new vertex.
   * @param value Object to be used as the user object.
   * @param x Integer that defines the x coordinate of the vertex.
   * @param y Integer that defines the y coordinate of the vertex.
   * @param width Integer that defines the width of the vertex.
   * @param height Integer that defines the height of the vertex.
   * @param style Optional string that defines the cell style.
   * @param relative Optional boolean that specifies if the geometry is relative.
   * Default is false.
   * @param geometryClass Optional class reference to a class derived from mxGeometry.
   *                 This can be useful for defining custom constraints.
   */
  insertVertex(...args) {
    let parent;
    let id;
    let value;
    let x;
    let y;
    let width;
    let height;
    let style;
    let relative;
    let geometryClass;

    if (args.length === 1) {
      // If only a single parameter, treat as an object
      // This syntax can be more readable
      const params = args[0];
      parent = params.parent;
      id = params.id;
      value = params.value;

      x = 'x' in params ? params.x : params.position[0];
      y = 'y' in params ? params.y : params.position[1];
      width = 'width' in params ? params.width : params.size[0];
      height = 'height' in params ? params.height : params.size[1];

      style = params.style;
      relative = params.relative;
      geometryClass = params.geometryClass;
    } else {
      // Otherwise treat as arguments
      [parent, id, value, x, y, width, height, style, relative, geometryClass] = args;
    }

    const vertex = this.createVertex(
      parent,
      id,
      value,
      x,
      y,
      width,
      height,
      style,
      relative,
      geometryClass
    );

    return this.addCell(vertex, parent);
  },

  /**
   * Hook method that creates the new vertex for <insertVertex>.
   */
  createVertex(
    parent,
    id,
    value,
    x,
    y,
    width,
    height,
    style,
    relative = false,
    geometryClass = Geometry
  ) {
    // Creates the geometry for the vertex
    const geometry = new geometryClass(x, y, width, height);
    geometry.relative = relative != null ? relative : false;

    // Creates the vertex
    const vertex = new Cell(value, geometry, style);
    vertex.setId(id);
    vertex.setVertex(true);
    vertex.setConnectable(true);

    return vertex;
  },

  /**
   * Returns the visible child vertices of the given parent.
   *
   * @param parent {@link mxCell} whose children should be returned.
   */
  getChildVertices(parent) {
    return this.getChildCells(parent, true, false);
  },

  /*****************************************************************************
   * Group: Graph Behaviour
   *****************************************************************************/

  /**
   * Returns {@link vertexLabelsMovable}.
   */
  isVertexLabelsMovable() {
    return this.vertexLabelsMovable;
  },

  /**
   * Sets {@link vertexLabelsMovable}.
   */
  setVertexLabelsMovable(value: boolean) {
    this.vertexLabelsMovable = value;
  },
};

mixInto(Graph)(VertexMixin);
