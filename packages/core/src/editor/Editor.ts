/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2019, JGraph Ltd
Copyright (c) 2006-2019, draw.io AG

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

import EditorPopupMenu from './EditorPopupMenu.js';
import UndoManager from '../view/undoable-change/UndoManager.js';
import EditorKeyHandler from './EditorKeyHandler.js';
import EventSource from '../view/event/EventSource.js';
import Client from '../Client.js';
import CompactTreeLayout from '../view/layout/CompactTreeLayout.js';
import { EditorToolbar } from './EditorToolbar.js';
import StackLayout from '../view/layout/StackLayout.js';
import EventObject from '../view/event/EventObject.js';
import { getOffset } from '../util/styleUtils.js';
import Codec from '../serialization/Codec.js';
import { ModelXmlSerializer } from '../serialization/ModelXmlSerializer.js';
import MaxWindow from '../gui/MaxWindow.js';
import MaxForm from '../gui/MaxForm.js';
import Outline from '../view/other/Outline.js';
import Cell from '../view/cell/Cell.js';
import Geometry from '../view/geometry/Geometry.js';
import { FONT_STYLE_MASK } from '../util/Constants.js';
import type { AbstractGraph } from '../view/AbstractGraph.js';
import { Graph } from '../view/Graph.js';
import SwimlaneManager from '../view/layout/SwimlaneManager.js';
import LayoutManager from '../view/layout/LayoutManager.js';
import RootChange from '../view/undoable-change/RootChange.js';
import ValueChange from '../view/undoable-change/ValueChange.js';
import CellAttributeChange from '../view/undoable-change/CellAttributeChange.js';
import PrintPreview from '../view/other/PrintPreview.js';
import Clipboard from '../util/Clipboard.js';
import MaxLog from '../gui/MaxLog.js';
import { isNode } from '../util/domUtils.js';
import { getViewXml, getXml } from '../util/xmlUtils.js';
import { load, post, submit } from '../util/requestUtils.js';
import type PopupMenuHandler from '../view/plugin/PopupMenuHandler.js';
import RubberBandHandler from '../view/plugin/RubberBandHandler.js';
import InternalEvent from '../view/event/InternalEvent.js';
import InternalMouseEvent from '../view/event/InternalMouseEvent.js';
import { CellStateStyle, MouseListenerSet } from '../types.js';
import type ConnectionHandler from '../view/plugin/ConnectionHandler.js';
import { show } from '../util/printUtils.js';
import type PanningHandler from '../view/plugin/PanningHandler.js';
import { cloneCell } from '../util/cellArrayUtils.js';
import type MaxPopupMenu from '../gui/MaxPopupMenu.js';
import { isNullish } from '../internal/utils.js';
import { isI18nEnabled, translate } from '../internal/i18n-utils.js';
import { error } from '../gui/guiUtils.js';
import type { FitPlugin } from '../view/plugin/index.js';

/**
 * Extends {@link EventSource} to implement an application wrapper for a graph that
 * adds {@link actions}, I/O using {@link Codec}, auto-layout using {@link LayoutManager},
 * command history using {@link undoManager}, and standard dialogs and widgets, e.g.
 * properties, help, outline, toolbar, and popupmenu. It also adds {@link templates}
 * to be used as cells in toolbars, auto-validation using the {@link installChangeHandler}
 * flag, attribute cycling using {@link cycleAttributeValues}, higher-level events
 * such as {@link root}, and backend integration using <urlPost> and {@link urlImage}.
 *
 * ### Actions
 *
 * Actions are functions stored in the <actions> array under their names. The
 * functions take the {@link Editor} as the first, and an optional {@link Cell} as the
 * second argument and are invoked using <execute>. Any additional arguments
 * passed to execute are passed on to the action as-is.
 *
 * A list of built-in actions is available in the <addActions> description.
 *
 * ### Read/write Diagrams
 *
 * To read a diagram from an XML string, for example from a text field within the
 * page, the following code is used:
 *
 * ```javascript
 * const doc = xmlUtils.parseXML(xmlString);
 * const node = doc.documentElement;
 * editor.readGraphModel(node);
 * ```
 *
 * For reading a diagram from a remote location, use the {@link open} method.
 *
 * To save diagrams in XML on a server, you can set the {@link urlPost} variable.
 * This variable will be used in {@link getUrlPost} to construct a URL for the post
 * request that is issued in the {@link save} method. The post request contains the
 * XML representation of the diagram as returned by {@link writeGraphModel} in the
 * xml parameter.
 *
 * On the server side, the post request is processed using standard
 * technologies such as Java Servlets, CGI, .NET or ASP.
 *
 * Here are some examples of processing a post request in various languages.
 *
 * - Java: URLDecoder.decode(request.getParameter("xml"), "UTF-8").replace("
", "&#xa;")
 *
 * Note that the linefeed should only be replaced if the XML is
 * processed in Java, for example when creating an image, but not
 * if the XML is passed back to the client-side.
 *
 * - .NET: HttpUtility.UrlDecode(context.Request.Params["xml"])
 * - PHP: urldecode($_POST["xml"])
 *
 * ### Creating images
 *
 * A backend (Java, PHP or C#) is required for creating images. The
 * distribution contains an example for each backend (ImageHandler.java,
 * ImageHandler.cs and graph.php). More information about using a backend
 * to create images can be found in the readme.html files. Note that the
 * preview is implemented using VML/SVG in the browser and does not require
 * a backend. The backend is only required to creates images (bitmaps).
 *
 * ### Special characters
 *
 * Note There are five characters that should always appear in XML content as
 * escapes, so that they do not interact with the syntax of the markup. These
 * are part of the language for all documents based on XML and for HTML.
 *
 * - &lt; (<)
 * - &gt; (>)
 * - &amp; (&)
 * - &quot; (")
 * - &apos; (')
 *
 * Although it is part of the XML language, &apos; is not defined in HTML.
 * For this reason the XHTML specification recommends instead the use of
 * &#39; if text may be passed to an HTML user agent.
 *
 * If you are having problems with special characters on the server-side then
 * you may want to try the {@link escapePostData} flag.
 *
 * For converting decimal escape sequences inside strings, a user has provided us with the following function:
 *
 * ```javascript
 * function html2js(text) {
 *   const entitySearch = /&#[0-9]+;/;
 *   let entity;
 *
 *   while (entity = entitySearch.exec(text)) {
 *     const charCode = entity[0].substring(2, entity[0].length -1);
 *     text = text.substring(0, entity.index)
 *            + String.fromCharCode(charCode)
 *            + text.substring(entity.index + entity[0].length);
 *   }
 *
 *   return text;
 * }
 * ```
 *
 * Otherwise, try using hex escape sequences and the built-in unescape function for converting such strings.
 *
 * ### Local Files
 *
 * For saving and opening local files, no standardized method exists that
 * works across all browsers. The recommended way of dealing with local files
 * is to create a backend that streams the XML data back to the browser (echo)
 * as an attachment so that a Save-dialog is displayed on the client-side and
 * the file can be saved to the local disk.
 *
 * For example, in PHP the code that does this looks as follows.
 *
 * ```javascript
 * $xml = stripslashes($_POST["xml"]);
 * header("Content-Disposition: attachment; filename=\"diagram.xml\"");
 * echo($xml);
 * ```
 *
 * To open a local file, the file should be uploaded via a form in the browser
 * and then opened from the server in the editor.
 *
 * ### Cell Properties
 *
 * The properties displayed in the properties dialog are the attributes and
 * values of the cell's user object, which is an XML node. The XML node is
 * defined in the templates section of the config file.
 *
 * The templates are stored in {@link Editor.templates} and contain cells which
 * are cloned at insertion time to create new vertices by use of drag and
 * drop from the toolbar. Each entry in the toolbar for adding a new vertex
 * must refer to an existing template.
 *
 * In the following example, the task node is a business object and only the
 * Cell node and its Geometry child contain graph information:
 *
 * ```javascript
 * <Task label="Task" description="">
 *   <Cell vertex="true">
 *     <Geometry as="geometry" width="72" height="32"/>
 *   </Cell>
 * </Task>
 * ```
 *
 * The idea is that the XML representation is inverse from the in-memory
 * representation: The outer XML node is the user object and the inner node is
 * the cell. This means the user object of the cell is the Task node with no
 * children for the above example:
 *
 * ```javascript
 * <Task label="Task" description=""/>
 * ```
 *
 * The Task node can have any tag name, attributes and child nodes. The
 * {@link Codec} will use the XML hierarchy as the user object, while removing the
 * "known annotations", such as the Cell node. At save-time the cell data
 * will be "merged" back into the user object. The user object is only modified
 * via the properties dialog during the lifecycle of the cell.
 *
 * In the default implementation of {@link createProperties}, the user object's
 * attributes are put into a form for editing. Attributes are changed using
 * the {@link CellAttributeChange} action in the model. The dialog can be replaced
 * by overriding the {@link createProperties} hook or by replacing the showProperties
 * action in {@link action}. Alternatively, the entry in the config file's popupmenu
 * section can be modified to invoke a different action.
 *
 * If you want to display the properties dialog on a double click, you can set
 * {@link Editor.dblClickAction} to showProperties as follows:
 *
 * ```javascript
 * editor.dblClickAction = 'showProperties';
 * ```
 *
 * ### Popupmenu and Toolbar
 *
 * The toolbar and popupmenu are typically configured using the respective
 * sections in the config file, that is, the popupmenu is defined as follows:
 *
 * ```javascript
 * <Editor>
 *   <EditorPopupMenu as="popupHandler">
 * 		<add as="cut" action="cut" icon="images/cut.gif"/>
 *      ...
 * ```
 *
 * New entries can be added to the toolbar by inserting an add-node into the
 * above configuration. Existing entries may be removed and changed by
 * modifying or removing the respective entries in the configuration.
 * The configuration is read by the {@link EditorPopupMenuCodec}, the format of the
 * configuration is explained in {@link EditorPopupMenu.decode}.
 *
 * The toolbar is defined in the EditorToolbar section. Items can be added
 * and removed in this section.
 *
 * ```javascript
 * <Editor>
 *   <EditorToolbar>
 *     <add as="save" action="save" icon="images/save.gif"/>
 *     <add as="Swimlane" template="swimlane" icon="images/swimlane.gif"/>
 *     ...
 * ```
 *
 * The format of the configuration is described in {@link EditorToolbarCodec.decode}.
 *
 * Ids:
 *
 * For the IDs, there is an implicit behaviour in {@link Codec}: It moves the Id
 * from the cell to the user object at encoding time and vice versa at decoding
 * time. For example, if the Task node from above has an id attribute, then
 * the {@link Cell.id} of the corresponding cell will have this value. If there
 * is no Id collision in the model, then the cell may be retrieved using this
 * Id with the {@link GraphDataModel.getCell} function. If there is a collision, a new
 * Id will be created for the cell using {@link GraphDataModel.createId}. At encoding
 * time, this new Id will replace the value previously stored under the id
 * attribute in the Task node.
 *
 * See {@link EditorCodec}, {@link EditorToolbarCodec} and {@link EditorPopupMenuCodec}
 * for information about configuring the editor and user interface.
 *
 * ### Programmatically inserting cells
 *
 * For inserting a new cell, say, by clicking a button in the document,
 * the following code can be used. This requires an reference to the editor.
 *
 * ```javascript
 * const userObject = new Object();
 * const model = editor.graph.model;
 * model.beginUpdate();
 * try {
 *   editor.graph.insertVertex({value: userObject, position: [20, 20], size: [80, 30]});
 * } finally
 *   model.endUpdate();
 * }
 * ```
 *
 * If a template cell from the config file should be inserted, then a clone
 * of the template can be created as follows. The clone is then inserted using
 * the add function instead of addVertex.
 *
 * ```javascript
 * const template = editor.templates['task'];
 * cont clone = cloneCell(template);
 * ```
 *
 * ### Translations
 *
 * resources/editor - Language resources for Editor
 *
 * To load the resources for the Editor, the following code should be used:
 * ```javascript
 * // Load maxGraph builtin resources
 * Translations.loadResources();
 * // Load resources for the Editor
 * Translations.add(`${Client.basePath}/resources/editor`);
 * ```
 *
 * ### Callback: onInit
 *
 * Called from within the constructor. In the callback, "this" refers to the editor instance.
 *
 * ### Cookie: mxgraph=seen
 *
 * Set when the editor is started. Never expires. Use
 * {@link resetFirstTime} to reset this cookie. This cookie
 * only exists if {@link onInit} is implemented.
 *
 * ### Events
 *
 * #### Event: mxEvent.OPEN
 *
 * Fires after a file was opened in {@link open}. The <code>filename</code> property
 * contains the filename that was used. The same value is also available in
 * {@link filename}.
 *
 * #### Event: mxEvent.SAVE
 *
 * Fires after the current file was saved in {@link save}. The <code>url</code>
 * property contains the URL that was used for saving.
 *
 * #### Event: mxEvent.POST
 *
 * Fires if a successful response was received in {@link postDiagram}. The
 * <code>request</code> property contains the <MaxXmlRequest>, the
 * <code>url</code> and <code>data</code> properties contain the URL and the
 * data that were used in the post request.
 *
 * #### Event: mxEvent.ROOT
 *
 * Fires when the current root has changed, or when the title of the current
 * root has changed. This event has no properties.
 *
 * #### Event: mxEvent.BEFORE_ADD_VERTEX
 *
 * Fires before a vertex is added in {@link addVertex}. The <code>vertex</code>
 * property contains the new vertex and the <code>parent</code> property
 * contains its parent.
 *
 * #### Event: mxEvent.ADD_VERTEX
 *
 * Fires between begin- and endUpdate in <addVertex>. The <code>vertex</code>
 * property contains the vertex that is being inserted.
 *
 * #### Event: mxEvent.AFTER_ADD_VERTEX
 *
 * Fires after a vertex was inserted and selected in <addVertex>. The
 * <code>vertex</code> property contains the new vertex.
 *
 * **Example**
 *
 * For starting an in-place edit after a new vertex has been added to the
 * graph, the following code can be used.
 *
 * ```javascript
 * editor.addListener(mxEvent.AFTER_ADD_VERTEX, function(sender, evt) {
 *   const vertex = evt.getProperty('vertex');
 *   if (editor.graph.isCellEditable(vertex)) {
 *   	editor.graph.startEditingAtCell(vertex);
 *   }
 * });
 * ```
 *
 * #### Event: mxEvent.ESCAPE
 *
 * Fires when the escape key is pressed. The <code>event</code> property
 * contains the key event.
 *
 * @category Editor
 */
export class Editor extends EventSource {
  /**
   * Constructs a new editor. This function invokes the {@link onInit} callback upon completion.
   *
   * ```javascript
   * const config = load('config/diagram-editor.xml').getDocumentElement();
   * const editor = new Editor(config);
   * ```
   *
   * @param config The configuration element that contains the editor configuration.
   */
  constructor(config: Element) {
    super();

    this.actions = {};
    this.addActions();

    // Executes the following only if a document has been instantiated.
    // That is, don't execute when the {@link EditorCodec} is set up.
    if (document.body) {
      // Defines instance fields
      this.cycleAttributeValues = [];
      this.popupHandler = new EditorPopupMenu();
      this.undoManager = new UndoManager();

      // Creates the graph and toolbar without the containers
      this.graph = this.createGraph();
      this.toolbar = this.createToolbar();

      // Creates the global key handler (requires graph instance)
      this.keyHandler = new EditorKeyHandler(this);

      // Configures the editor using the URI
      // which was passed to the ctor
      this.configure(config);

      // Assigns the swimlaneIndicatorColorAttribute on the graph
      this.graph.swimlaneIndicatorColorAttribute = this.cycleAttributeName;

      // Invokes the 'onInit' hook
      this.onInit?.();
    }
  }

  onInit: Function | null = null;
  lastSnapshot: number | null = null;
  ignoredChanges: number | null = null;
  swimlaneLayout: any;
  diagramLayout: any;
  rubberband: RubberBandHandler | null = null;
  isActive: boolean | null = null;
  properties: any;
  destroyed = false;

  /**
   * Specifies the resource key for the zoom dialog. If the resource for this
   * key does not exist then the value is used as the error message. Default is 'askZoom'.
   * @default 'askZoom'
   */
  askZoomResource = isI18nEnabled() ? 'askZoom' : '';

  // =====================================================================================
  // Group: Controls and Handlers
  // =====================================================================================

  /**
   * Specifies the resource key for the last saved info. If the resource for
   * this key does not exist then the value is used as the error message. Default is 'lastSaved'.
   * @default 'lastSaved'.
   */
  lastSavedResource = isI18nEnabled() ? 'lastSaved' : '';

  /**
   * Specifies the resource key for the current file info. If the resource for
   * this key does not exist then the value is used as the error message. Default is 'currentFile'.
   * @default 'currentFile'
   */
  currentFileResource = isI18nEnabled() ? 'currentFile' : '';

  /**
   * Specifies the resource key for the properties window title. If the
   * resource for this key does not exist then the value is used as the
   * error message. Default is 'properties'.
   * @default 'properties'
   */
  propertiesResource = isI18nEnabled() ? 'properties' : '';

  /**
   * Specifies the resource key for the tasks window title. If the
   * resource for this key does not exist then the value is used as the
   * error message. Default is 'tasks'.
   * @default 'tasks'
   */
  tasksResource = isI18nEnabled() ? 'tasks' : '';

  /**
   * Specifies the resource key for the help window title. If the
   * resource for this key does not exist then the value is used as the
   * error message. Default is 'help'.
   * @default 'help'
   */
  helpResource = isI18nEnabled() ? 'help' : '';

  /**
   * Specifies the resource key for the outline window title. If the
   * resource for this key does not exist then the value is used as the
   * error message. Default is 'outline'.
   * @default 'outline'
   */
  outlineResource = isI18nEnabled() ? 'outline' : '';

  /**
   * Reference to the {@link MaxWindow} that contains the outline.
   * The {@link outline} is stored in outline.outline.
   */
  // TODO should be CustomMaxWindow | null, CustomMaxWindow having a outline property
  outline: any = null;

  /**
   * Holds a {@link AbstractGraph} for displaying the diagram. The graph is created in {@link setGraphContainer}.
   */
  // @ts-ignore
  graph: AbstractGraph;

  /**
   * Holds the render hint used for creating the {@link graph} in {@link setGraphContainer}.
   * @default null
   */
  graphRenderHint: any = null;

  /**
   * Holds a {@link EditorToolbar} for displaying the toolbar.
   * The toolbar is created in {@link setToolbarContainer}.
   */
  toolbar: EditorToolbar | null = null;

  /**
   * DOM container that holds the statusbar.
   * Use {@link setStatusContainer} to set this value.
   */
  status: HTMLElement | null = null;

  /**
   * Holds a {@link EditorPopupMenu} for displaying popupmenus.
   */
  popupHandler: EditorPopupMenu | null = null;

  /**
   * Holds an {@link UndoManager} for the command history.
   */
  undoManager: UndoManager | null = null;

  /**
   * Holds a {@link EditorKeyHandler} for handling keyboard events.
   * The handler is created in {@link setGraphContainer}.
   */
  keyHandler: EditorKeyHandler | null = null;

  /**
   * Maps from actionnames to actions, which are functions taking
   * the editor and the cell as arguments. Use {@link addAction}
   * to add or replace an action and {@link execute} to execute an action
   * by name, passing the cell to be operated upon as the second
   * argument.
   */
  actions: { [key: string]: Function } = {};

  // =====================================================================================
  // Group: Actions and Options
  // =====================================================================================

  /**
   * Specifies the name of the action to be executed
   * when a cell is double-clicked. Default is 'edit'.
   *
   * To handle a single-click, use the following code.
   *
   * @example
   * ```javascript
   * editor.graph.addListener(mxEvent.CLICK, function(sender, evt) {
   *   const e = evt.getProperty('event');
   *   const cell = evt.getProperty('cell');
   *
   *   if (cell && !e.isConsumed()) {
   *     // Do something useful with cell...
   *     e.consume();
   *   }
   * });
   * ```
   * @default 'edit'
   */
  dblClickAction = 'edit';

  /**
   * Specifies if new cells must be inserted
   * into an existing swimlane. Otherwise, cells
   * that are not swimlanes can be inserted as
   * top-level cells.
   * @default false
   */
  swimlaneRequired = false;

  /**
   * Specifies if the context menu should be disabled in the graph container.
   * @default true
   */
  disableContextMenu = true;

  /**
   * Specifies the function to be used for inserting new
   * cells into the graph. This is assigned from the
   * {@link EditorToolbar} if a vertex-tool is clicked.
   */
  insertFunction: Function | null = null;

  // =====================================================================================
  // Group: Templates
  // =====================================================================================

  /**
   * Specifies if a new cell should be inserted on a single
   * click even using {@link insertFunction} if there is a cell
   * under the mouse pointer, otherwise the cell under the
   * mouse pointer is selected. Default is false.
   * @default false
   */
  forcedInserting = false;

  /**
   * Maps from names to prototype cells to be used
   * in the toolbar for inserting new cells into
   * the diagram.
   */
  templates: any = null;

  /**
   * Prototype edge cell that is used for creating new edges.
   */
  defaultEdge: any = null;

  /**
   * Specifies the edge style to be returned in {@link getEdgeStyle}.
   * @default null
   */
  defaultEdgeStyle: any = null;

  /**
   * Prototype group cell that is used for creating new groups.
   */
  defaultGroup: any = null;

  /**
   * Default size for the border of new groups. If `null`, then {@link AbstractGraph.gridSize} is used.
   * @default null
   */
  groupBorderSize: number | null = null;

  /**
   * Contains the URL of the last opened file as a string.
   * @default null
   */
  filename: string | null = null;

  // =====================================================================================
  // Group: Backend Integration
  // =====================================================================================

  /**
   * Character to be used for encoding linefeed in {@link save}.
   * @default '&#xa;'
   */
  linefeed = '&#xa;';

  /**
   * Specifies if the name of the post parameter that contains the diagram data in a post request to the server.
   * @default 'xml'
   */
  postParameterName = 'xml';

  /**
   * Specifies if the data in the post request for saving a diagram should be converted using encodeURIComponent.
   * @default true
   */
  escapePostData = true;

  /**
   * Specifies the URL to be used for posting the diagram to a backend in {@link save}.
   * @default null
   */
  urlPost: string | null = null;

  /**
   * Specifies the URL to be used for creating a bitmap of the graph in the image action.
   * @default null
   */
  urlImage: string | null = null;

  /**
   * Specifies the direction of the flow in the diagram.
   * This is used in the layout algorithms. Default is vertical flow.
   * @default false
   */
  horizontalFlow = false;

  // =====================================================================================
  // Group: Autolayout
  // =====================================================================================

  /**
   * Specifies if the top-level elements in the
   * diagram should be layed out using a vertical
   * or horizontal stack depending on the setting
   * of {@link horizontalFlow}. The spacing between the
   * swimlanes is specified by {@link swimlaneSpacing}.
   * Default is false.
   *
   * If the top-level elements are swimlanes, then
   * the intra-swimlane layout is activated by
   * the {@link layoutSwimlanes} switch.
   * @default false
   */
  layoutDiagram = false;

  /**
   * Specifies the spacing between swimlanes if
   * automatic layout is turned on in
   * {@link layoutDiagram}. Default is 0.
   * @default 0
   */
  swimlaneSpacing = 0;

  /**
   * Specifies if the swimlanes should be kept at the same
   * width or height depending on the setting of
   * {@link horizontalFlow}. Default is false.
   *
   * For horizontal flows, all swimlanes
   * have the same height and for vertical flows, all swimlanes
   * have the same width. Furthermore, the swimlanes are
   * automatically "stacked" if {@link layoutDiagram} is true.
   * @default false
   */
  maintainSwimlanes = false;

  /**
   * Specifies if the children of swimlanes should be layed out, either vertically or horizontally depending on {@link horizontalFlow}.
   * @default false
   */
  layoutSwimlanes = false;

  /**
   * Specifies the attribute values to be cycled when inserting new swimlanes.
   * @default []
   */
  cycleAttributeValues: any[] = [];

  // =====================================================================================
  // Group: Attribute Cycling
  // =====================================================================================

  /**
   * Index of the last consumed attribute index.
   * If a new swimlane is inserted, then the {@link cycleAttributeValues} at this index will be used as the value for {@link cycleAttributeName}.
   * @default 0
   */
  cycleAttributeIndex = 0;

  /**
   * Name of the attribute to be assigned a {@link cycleAttributeValues} when inserting new swimlanes.
   * @default 'fillColor'
   */
  cycleAttributeName: keyof CellStateStyle | (string & Record<never, never>) =
    'fillColor';

  /**
   * Holds the {@link MaxWindow} created in {@link showTasks}.
   */
  tasks: any = null;

  // =====================================================================================
  // Group: Windows
  // =====================================================================================

  /**
   * Icon for the tasks window.
   */
  tasksWindowImage: any = null;

  /**
   * Specifies the top coordinate of the tasks window in pixels. Default is 20.
   * @default 20
   */
  tasksTop = 20;

  /**
   * Holds the {@link MaxWindow} created in {@link showHelp}
   */
  help: any = null;

  /**
   * Icon for the help window.
   */
  helpWindowImage: any = null;

  /**
   * Specifies the URL to be used for the contents of the
   * Online Help window. This is usually specified in the
   * resources file under urlHelp for language-specific
   * online help support.
   */
  urlHelp: string | null = null;

  /**
   * Specifies the width of the help window in pixels. Default is 300.
   * @default 300
   */
  helpWidth = 300;

  /**
   * Specifies the height of the help window in pixels. Default is 260.
   * @default 260
   */
  // helpHeight: number;
  helpHeight = 260;

  /**
   * Specifies the width of the properties window in pixels. Default is 240.
   * @default 240
   */
  propertiesWidth = 240;

  /**
   * Specifies the height of the properties window in pixels.
   * If no height is specified then the window will be automatically
   * sized to fit its contents. Default is null.
   * @default null
   */
  propertiesHeight: number | null = null;

  /**
   * Specifies if the properties dialog should be automatically
   * moved near the cell it is displayed for, otherwise the
   * dialog is not moved. This value is only taken into
   * account if the dialog is already visible. Default is false.
   * @default false
   */
  movePropertiesDialog = false;

  /**
   * Specifies if {@link AbstractGraph.validateGraph} should automatically be invoked after
   * each change. Default is false.
   * @default false
   */
  validating = false;

  /**
   * True if the graph has been modified since it was last saved.
   */
  modified = false;

  /**
   * Returns {@link modified}.
   */
  isModified(): boolean {
    return this.modified;
  }

  /**
   * Sets {@link modified} to the specified boolean value.
   * @param value
   */
  setModified(value: boolean): void {
    this.modified = value;
  }

  /**
   * Adds the built-in actions to the editor instance.
   * save - Saves the graph using <urlPost>.
   * print - Shows the graph in a new print preview window.
   * show - Shows the graph in a new window.
   * exportImage - Shows the graph as a bitmap image using <getUrlImage>.
   * refresh - Refreshes the graph's display.
   * cut - Copies the current selection into the clipboard
   * and removes it from the graph.
   * copy - Copies the current selection into the clipboard.
   * paste - Pastes the clipboard into the graph.
   * delete - Removes the current selection from the graph.
   * group - Puts the current selection into a new group.
   * ungroup - Removes the selected groups and selects the children.
   * undo - Undoes the last change on the graph model.
   * redo - Redoes the last change on the graph model.
   * zoom - Sets the zoom via a dialog.
   * zoomIn - Zooms into the graph.
   * zoomOut - Zooms out of the graph
   * actualSize - Resets the scale and translation on the graph.
   * fit - Changes the scale so that the graph fits into the window.
   * showProperties - Shows the properties dialog.
   * selectAll - Selects all cells.
   * selectNone - Clears the selection.
   * selectVertices - Selects all vertices.
   * selectEdges = Selects all edges.
   * edit - Starts editing the current selection cell.
   * enterGroup - Drills down into the current selection cell.
   * exitGroup - Moves up in the drilling hierachy
   * home - Moves to the topmost parent in the drilling hierarchy
   * selectPrevious - Selects the previous cell.
   * selectNext - Selects the next cell.
   * selectParent - Selects the parent of the selection cell.
   * selectChild - Selects the first child of the selection cell.
   * collapse - Collapses the currently selected cells.
   * expand - Expands the currently selected cells.
   * bold - Toggle bold text style.
   * italic - Toggle italic text style.
   * underline - Toggle underline text style.
   * alignCellsLeft - Aligns the selection cells at the left.
   * alignCellsCenter - Aligns the selection cells in the center.
   * alignCellsRight - Aligns the selection cells at the right.
   * alignCellsTop - Aligns the selection cells at the top.
   * alignCellsMiddle - Aligns the selection cells in the middle.
   * alignCellsBottom - Aligns the selection cells at the bottom.
   * alignFontLeft - Sets the horizontal text alignment to left.
   * alignFontCenter - Sets the horizontal text alignment to center.
   * alignFontRight - Sets the horizontal text alignment to right.
   * alignFontTop - Sets the vertical text alignment to top.
   * alignFontMiddle - Sets the vertical text alignment to middle.
   * alignFontBottom - Sets the vertical text alignment to bottom.
   * toggleTasks - Shows or hides the tasks window.
   * toggleHelp - Shows or hides the help window.
   * toggleOutline - Shows or hides the outline window.
   * toggleConsole - Shows or hides the console window.
   */
  addActions(): void {
    this.addAction('save', (editor: Editor) => {
      editor.save();
    });

    this.addAction('print', (editor: Editor) => {
      const preview = new PrintPreview(editor.graph, 1);
      preview.open();
    });

    this.addAction('show', (editor: Editor) => {
      show(editor.graph, null, 10, 10);
    });

    this.addAction('exportImage', (editor: Editor) => {
      const url = editor.getUrlImage();

      if (url == null || Client.IS_LOCAL) {
        editor.execute('show');
      } else {
        const node = <Element>getViewXml(editor.graph, 1);
        const xml = getXml(node, '\n');

        submit(
          url,
          `${editor.postParameterName}=${encodeURIComponent(xml)}`,
          document,
          '_blank'
        );
      }
    });

    this.addAction('refresh', (editor: Editor) => {
      editor.graph.refresh();
    });

    this.addAction('cut', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        Clipboard.cut(editor.graph);
      }
    });

    this.addAction('copy', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        Clipboard.copy(editor.graph);
      }
    });

    this.addAction('paste', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        Clipboard.paste(editor.graph);
      }
    });

    this.addAction('delete', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.removeCells();
      }
    });

    this.addAction('group', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setSelectionCell(editor.groupCells());
      }
    });

    this.addAction('ungroup', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setSelectionCells(editor.graph.ungroupCells());
      }
    });

    this.addAction('removeFromParent', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.removeCellsFromParent();
      }
    });

    this.addAction('undo', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.undo();
      }
    });

    this.addAction('redo', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.redo();
      }
    });

    this.addAction('zoomIn', (editor: Editor) => {
      editor.graph.zoomIn();
    });

    this.addAction('zoomOut', (editor: Editor) => {
      editor.graph.zoomOut();
    });

    this.addAction('actualSize', (editor: Editor) => {
      editor.graph.zoomActual();
    });

    this.addAction('fit', (editor: Editor) => {
      editor.graph.getPlugin<FitPlugin>('fit')?.fit();
    });

    this.addAction('showProperties', (editor: Editor, cell: Cell) => {
      editor.showProperties(cell);
    });

    this.addAction('selectAll', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectAll();
      }
    });

    this.addAction('selectNone', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.clearSelection();
      }
    });

    this.addAction('selectVertices', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectVertices();
      }
    });

    this.addAction('selectEdges', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectEdges();
      }
    });

    this.addAction('edit', (editor: Editor, cell: Cell) => {
      if (editor.graph.isEnabled() && editor.graph.isCellEditable(cell)) {
        editor.graph.startEditingAtCell(cell);
      }
    });

    this.addAction('toBack', (editor: Editor, cell: Cell) => {
      if (editor.graph.isEnabled()) {
        editor.graph.orderCells(true);
      }
    });

    this.addAction('toFront', (editor: Editor, cell: Cell) => {
      if (editor.graph.isEnabled()) {
        editor.graph.orderCells(false);
      }
    });

    this.addAction('enterGroup', (editor: Editor, cell: Cell) => {
      editor.graph.enterGroup(cell);
    });

    this.addAction('exitGroup', (editor: Editor) => {
      editor.graph.exitGroup();
    });

    this.addAction('home', (editor: Editor) => {
      editor.graph.home();
    });

    this.addAction('selectPrevious', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectPreviousCell();
      }
    });

    this.addAction('selectNext', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectNextCell();
      }
    });

    this.addAction('selectParent', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectParentCell();
      }
    });

    this.addAction('selectChild', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.selectChildCell();
      }
    });

    this.addAction('collapse', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.foldCells(true);
      }
    });

    this.addAction('collapseAll', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        const cells = editor.graph.getChildVertices();
        editor.graph.foldCells(true, false, cells);
      }
    });

    this.addAction('expand', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.foldCells(false);
      }
    });

    this.addAction('expandAll', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        const cells = editor.graph.getChildVertices();
        editor.graph.foldCells(false, false, cells);
      }
    });

    this.addAction('bold', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.toggleCellStyleFlags('fontStyle', FONT_STYLE_MASK.BOLD);
      }
    });

    this.addAction('italic', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.toggleCellStyleFlags('fontStyle', FONT_STYLE_MASK.ITALIC);
      }
    });

    this.addAction('underline', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.toggleCellStyleFlags('fontStyle', FONT_STYLE_MASK.UNDERLINE);
      }
    });

    this.addAction('alignCellsLeft', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.alignCells('left');
      }
    });

    this.addAction('alignCellsCenter', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.alignCells('center');
      }
    });

    this.addAction('alignCellsRight', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.alignCells('right');
      }
    });

    this.addAction('alignCellsTop', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.alignCells('top');
      }
    });

    this.addAction('alignCellsMiddle', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.alignCells('middle');
      }
    });

    this.addAction('alignCellsBottom', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.alignCells('bottom');
      }
    });

    this.addAction('alignFontLeft', (editor: Editor) => {
      editor.graph.setCellStyles('align', 'left');
    });

    this.addAction('alignFontCenter', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setCellStyles('align', 'center');
      }
    });

    this.addAction('alignFontRight', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setCellStyles('align', 'right');
      }
    });

    this.addAction('alignFontTop', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setCellStyles('verticalAlign', 'top');
      }
    });

    this.addAction('alignFontMiddle', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setCellStyles('verticalAlign', 'middle');
      }
    });

    this.addAction('alignFontBottom', (editor: Editor) => {
      if (editor.graph.isEnabled()) {
        editor.graph.setCellStyles('verticalAlign', 'bottom');
      }
    });

    this.addAction('zoom', (editor: Editor) => {
      const current = editor.graph.getView().scale * 100;
      const preInput = prompt(
        translate(editor.askZoomResource) || editor.askZoomResource,
        String(current)
      );

      if (preInput) {
        const scale = Number.parseFloat(preInput) / 100;

        if (!Number.isNaN(scale)) {
          editor.graph.getView().setScale(scale);
        }
      }
    });

    this.addAction('toggleTasks', (editor: Editor) => {
      if (!isNullish(editor.tasks)) {
        editor.tasks.setVisible(!editor.tasks.isVisible());
      } else {
        editor.showTasks();
      }
    });

    this.addAction('toggleHelp', (editor: Editor) => {
      if (!isNullish(editor.help)) {
        editor.help.setVisible(!editor.help.isVisible());
      } else {
        editor.showHelp();
      }
    });

    this.addAction('toggleOutline', (editor: Editor) => {
      if (isNullish(editor.outline)) {
        editor.showOutline();
      } else {
        editor.outline.setVisible(!editor.outline.isVisible());
      }
    });

    this.addAction('toggleConsole', (editor: Editor) => {
      MaxLog.setVisible(!MaxLog.isVisible());
    });
  }

  /**
   * Configures the editor using the specified node. To load the
   * configuration from a given URL the following code can be used to obtain
   * the XML node.
   *
   * @example
   * ```javascript
   * var node = mxUtils.load(url).getDocumentElement();
   * ```
   * @param node XML node that contains the configuration.
   */
  configure(node: Element): void {
    if (node) {
      // Creates a decoder for the XML data
      // and uses it to configure the editor
      const dec = new Codec(node.ownerDocument);
      dec.decode(node, this);

      // Resets the counters, modified state and
      // command history
      this.resetHistory();
    }
  }

  /**
   * Resets the cookie that is used to remember if the editor has already been used.
   */
  resetFirstTime(): void {
    document.cookie = 'mxgraph=seen; expires=Fri, 27 Jul 2001 02:47:11 UTC; path=/';
  }

  /**
   * Resets the command history, modified state and counters.
   */
  resetHistory(): void {
    this.lastSnapshot = new Date().getTime();
    (<UndoManager>this.undoManager).clear();
    this.ignoredChanges = 0;
    this.setModified(false);
  }

  /**
   * Binds the specified actionname to the specified function.
   *
   * @example
   * ```javascript
   * editor.addAction('test', function(editor: Editor, cell: Cell)
   * {
   * 		mxUtils.alert("test "+cell);
   * });
   * ```
   * @param actionname String that specifies the name of the action to be added.
   * @param funct Function that implements the new action. The first argument
   * of the function is the editor it is used with,
   * the second argument is the cell it operates upon.
   */
  addAction(actionname: string, funct: Function): void {
    this.actions[actionname] = funct;
  }

  /**
   * Executes the function with the given name in {@link actions} passing the
   * editor instance and given cell as the first and second argument. All
   * additional arguments are passed to the action as well. This method
   * contains a try-catch block and displays an error message if an action
   * causes an exception. The exception is re-thrown after the error
   * message was displayed.
   *
   * @example
   * ```javascript
   * editor.execute("showProperties", cell);
   * ```
   * @param actionname
   * @param cell
   * @param evt
   */
  execute(actionname: string, cell: Cell | null = null, evt: Event | null = null): void {
    const action = this.actions[actionname];

    if (action) {
      try {
        // Creates the array of arguments by replacing the actionname
        // with the editor instance in the args of this function
        const args = [this, cell, evt];

        // Invokes the function on the editor using the args
        action.apply(this, args);
      } catch (e: any) {
        error(`Cannot execute ${actionname}: ${e.message}`, 280, true);

        throw e;
      }
    } else {
      error(`Cannot find action ${actionname}`, 280, true);
    }
  }

  /**
   * Adds the specified template under the given name in {@link templates}.
   * @param name
   * @param template
   */
  addTemplate(name: string, template: any): void {
    this.templates[name] = template;
  }

  /**
   * Returns the template for the given name.
   * @param name
   */
  getTemplate(name: string): any {
    return this.templates[name];
  }

  /**
   * Creates the {@link AbstractGraph} for the editor.
   *
   * The AbstractGraph is created with no container and is initialized from {@link setGraphContainer}.
   *
   * @returns the AbstractGraph instance used by the Editor
   */
  createGraph(): AbstractGraph {
    const graph = new Graph();

    // Enables rubberband, tooltips, panning
    graph.setTooltips(true);
    graph.setPanning(true);

    // Overrides the dblclick method on the graph to
    // invoke the dblClickAction for a cell and reset
    // the selection tool in the toolbar
    this.installDblClickHandler(graph);

    // Installs the command history
    this.installUndoHandler(graph);

    // Installs the handlers for the root event
    this.installDrillHandler(graph);

    // Installs the handler for validation
    this.installChangeHandler(graph);

    // Installs the handler for calling the
    // insert function and consume the
    // event if an insert function is defined
    this.installInsertHandler(graph);

    // Redirects the function for creating the popupmenu items
    const popupMenuHandler = graph.getPlugin<PopupMenuHandler>('PopupMenuHandler');
    if (popupMenuHandler) {
      popupMenuHandler.factoryMethod = (menu: any, cell: Cell | null, evt: any): void => {
        return this.createPopupMenu(menu, cell, evt);
      };
    }

    // Redirects the function for creating new connections in the diagram
    const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler');
    if (connectionHandler) {
      connectionHandler.factoryMethod = (
        source: Cell | null,
        target: Cell | null
      ): Cell => {
        return this.createEdge(source, target);
      };
    }

    // Maintains swimlanes and installs auto-layout
    this.createSwimlaneManager(graph);
    this.createLayoutManager(graph);

    return graph;
  }

  /**
   * Sets the graph's container using {@link AbstractGraph.init}.
   * @param graph
   * @returns SwimlaneManager instance
   */
  createSwimlaneManager(graph: AbstractGraph): SwimlaneManager {
    const swimlaneMgr = new SwimlaneManager(graph, false);

    swimlaneMgr.isHorizontal = () => {
      return this.horizontalFlow;
    };

    swimlaneMgr.isEnabled = () => {
      return this.maintainSwimlanes;
    };

    return swimlaneMgr;
  }

  /**
   * Creates a layout manager for the swimlane and diagram layouts, that
   * is, the locally defined inter and intra swimlane layouts.
   * @param graph
   * @returns LayoutManager instance
   */
  createLayoutManager(graph: AbstractGraph): LayoutManager {
    const layoutMgr = new LayoutManager(graph);

    layoutMgr.getLayout = (cell: Cell) => {
      let layout = null;
      const model = this.graph.getDataModel();

      if (cell.getParent()) {
        // Executes the swimlane layout if a child of
        // a swimlane has been changed. The layout is
        // lazy created in createSwimlaneLayout.
        if (this.layoutSwimlanes && graph.isSwimlane(cell)) {
          if (this.swimlaneLayout == null) {
            this.swimlaneLayout = this.createSwimlaneLayout();
          }

          layout = this.swimlaneLayout;
        }

        // Executes the diagram layout if the modified
        // cell is a top-level cell. The layout is
        // lazy created in createDiagramLayout.
        else if (
          this.layoutDiagram &&
          (graph.isValidRoot(cell) || !cell?.getParent()?.getParent())
        ) {
          if (this.diagramLayout == null) {
            this.diagramLayout = this.createDiagramLayout();
          }

          layout = this.diagramLayout;
        }
      }

      return layout;
    };

    return layoutMgr;
  }

  /**
   * Sets the graph's container using {@link AbstractGraph.init}.
   * @param container
   */
  setGraphContainer(container?: HTMLElement | null): void {
    if (!this.graph.container && container) {
      // Creates the graph instance inside the given container and render hint
      // this.graph = new Graph(container, null, this.graphRenderHint);

      // @ts-ignore  TODO: FIXME!! ==============================================================================================
      this.graph.init(container);

      // Install rubberband selection as the last
      // action handler in the chain
      this.rubberband = new RubberBandHandler(this.graph);

      // Disables the context menu
      if (this.disableContextMenu) {
        InternalEvent.disableContextMenu(container);
      }
    }
  }

  /**
   * Overrides {@link AbstractGraph.dblClick} to invoke {@link dblClickAction}
   * on a cell and reset the selection tool in the toolbar.
   * @param graph
   */
  installDblClickHandler(graph: AbstractGraph): void {
    // Installs a listener for double click events
    graph.addListener(InternalEvent.DOUBLE_CLICK, (_sender: any, evt: EventObject) => {
      const cell = evt.getProperty('cell');

      if (cell && graph.isEnabled() && this.dblClickAction) {
        this.execute(this.dblClickAction, cell);
        evt.consume();
      }
    });
  }

  /**
   * Adds the {@link undoManager} to the graph model and the view.
   * @param graph
   */
  installUndoHandler(graph: AbstractGraph): void {
    const listener = (sender: any, evt: EventObject) => {
      const edit = evt.getProperty('edit');
      (<UndoManager>this.undoManager).undoableEditHappened(edit);
    };

    graph.getDataModel().addListener(InternalEvent.UNDO, listener);
    graph.getView().addListener(InternalEvent.UNDO, listener);

    // Keeps the selection state in sync
    const undoHandler = (sender: any, evt: EventObject) => {
      const { changes } = evt.getProperty('edit');
      graph.setSelectionCells(graph.getSelectionCellsForChanges(changes));
    };

    (<UndoManager>this.undoManager).addListener(InternalEvent.UNDO, undoHandler);
    (<UndoManager>this.undoManager).addListener(InternalEvent.REDO, undoHandler);
  }

  /**
   * Installs listeners for dispatching the {@link root} event.
   * @param graph
   */
  installDrillHandler(graph: AbstractGraph): void {
    const listener = (sender: any) => {
      this.fireEvent(new EventObject(InternalEvent.ROOT));
    };

    graph.getView().addListener(InternalEvent.DOWN, listener);
    graph.getView().addListener(InternalEvent.UP, listener);
  }

  /**
   * Installs the listeners required to automatically validate
   * the graph. On each change of the root, this implementation
   * fires a {@link root} event.
   * @param graph
   */
  installChangeHandler(graph: AbstractGraph): void {
    const listener = (sender: any, evt: EventObject) => {
      // Updates the modified state
      this.setModified(true);

      // Automatically validates the graph
      // after each change
      if (this.validating) {
        graph.validateGraph();
      }

      // Checks if the root has been changed
      const { changes } = evt.getProperty('edit');

      for (const change of changes) {
        if (
          change instanceof RootChange ||
          (change instanceof ValueChange && change.cell === this.graph.model.root) ||
          (change instanceof CellAttributeChange && change.cell === this.graph.model.root)
        ) {
          this.fireEvent(new EventObject(InternalEvent.ROOT));
          break;
        }
      }
    };

    graph.getDataModel().addListener(InternalEvent.CHANGE, listener);
  }

  /**
   * Installs the handler for invoking {@link insertFunction} if one is defined.
   * @param graph
   */
  installInsertHandler(graph: AbstractGraph): void {
    const insertHandler: MouseListenerSet = {
      mouseDown: (_sender: EventSource, me: InternalMouseEvent) => {
        if (
          this.insertFunction &&
          !me.isPopupTrigger() &&
          (this.forcedInserting || me.getState() == null)
        ) {
          this.graph.clearSelection();
          this.insertFunction(me.getEvent(), me.getCell());

          // Consumes the rest of the events for this gesture (down, move, up)
          this.isActive = true;
          me.consume();
        }
      },

      mouseMove: (_sender: EventSource, me: InternalMouseEvent) => {
        if (this.isActive) {
          me.consume();
        }
      },

      mouseUp: (_sender: EventSource, me: InternalMouseEvent) => {
        if (this.isActive) {
          this.isActive = false;
          me.consume();
        }
      },
    };

    graph.addMouseListener(insertHandler);
  }

  /**
   * Creates the layout instance used to layout the swimlanes in the diagram.
   * @returns StackLayout instance
   */
  createDiagramLayout(): StackLayout {
    const gs = this.graph.gridSize;
    const layout = new StackLayout(
      this.graph,
      !this.horizontalFlow,
      this.swimlaneSpacing,
      2 * gs,
      2 * gs
    );

    // Overrides isIgnored to only take into account swimlanes
    layout.isVertexIgnored = (cell: Cell) => {
      return !layout.graph.isSwimlane(cell);
    };

    return layout;
  }

  /**
   * Creates the layout instance used to layout the children of each swimlane.
   * @returns CompactTreeLayout instance
   */
  createSwimlaneLayout(): CompactTreeLayout {
    return new CompactTreeLayout(this.graph, this.horizontalFlow);
  }

  /**
   * Creates the {@link toolbar} with no container.
   * @returns EditorToolbar instance
   */
  createToolbar(): EditorToolbar {
    return new EditorToolbar(null, this);
  }

  /**
   * Initializes the toolbar for the given container.
   * @param container
   */
  setToolbarContainer(container: any): void {
    this.toolbar?.init(container);
  }

  /**
   * Creates the {@link status} using the specified container.
   * This implementation adds listeners in the editor to display the last saved time and the current filename in the status bar.
   * @param container DOM node that will contain the statusbar.
   */
  setStatusContainer(container: HTMLElement | null): void {
    if (!this.status && container) {
      this.status = container;

      // Prints the last saved time in the status bar when files are saved
      this.addListener(InternalEvent.SAVE, () => {
        const timestamp = new Date().toLocaleString();
        this.setStatus(
          `${translate(this.lastSavedResource) || this.lastSavedResource}: ${timestamp}`
        );
      });

      // Updates the statusbar to display the filename when new files are opened
      this.addListener(InternalEvent.OPEN, () => {
        this.setStatus(
          `${translate(this.currentFileResource) || this.currentFileResource}: ${
            this.filename
          }`
        );
      });
    }
  }

  /**
   * Display the specified message in the status bar.
   * @param message String the specified the message to be displayed.
   */
  setStatus(message: string): void {
    if (this.status && !isNullish(message)) {
      this.status.innerHTML = message;
    }
  }

  /**
   * Creates a listener to update the inner HTML of the
   * specified DOM node with the value of {@link getTitle}.
   * @param container DOM node that will contain the title.
   */
  setTitleContainer(container: any): void {
    this.addListener(InternalEvent.ROOT, (sender: any) => {
      container.innerHTML = this.getTitle();
    });
  }

  /**
   * Executes a vertical or horizontal compact tree layout using the specified cell as an argument.
   * The cell may either be a group or the root of a tree.
   *
   * @param cell {@link Cell} to use in the compact tree layout.
   * @param horizontal Optional boolean to specify the tree's
   * orientation. Default is true.
   */
  treeLayout(cell: Cell, horizontal: boolean): void {
    if (cell) {
      const layout = new CompactTreeLayout(this.graph, horizontal);
      layout.execute(cell);
    }
  }

  /**
   * Returns the string value for the current root of the diagram.
   */
  getTitle(): string {
    let title = '';
    const { graph } = this;
    let cell = graph.getCurrentRoot();

    while (cell?.getParent()?.getParent()) {
      // Append each label of a valid root
      if (graph.isValidRoot(cell)) {
        title = ` > ${graph.convertValueToString(cell)}${title}`;
      }

      cell = cell.getParent();
    }

    const prefix = this.getRootTitle();

    return prefix + title;
  }

  /**
   * Returns the string value of the root cell in {@link AbstractGraph.model}.
   */
  getRootTitle(): string {
    const root = this.graph.getDataModel().getRoot()!;
    return this.graph.convertValueToString(root);
  }

  /**
   * Undo the last change in {@link graph}.
   */
  undo(): void {
    (<UndoManager>this.undoManager).undo();
  }

  /**
   * Redo the last change in {@link graph}.
   */
  redo(): void {
    (<UndoManager>this.undoManager).redo();
  }

  /**
   * Invokes {@link createGroup} to create a new group cell and the invokes
   * {@link AbstractGraph.groupCells}, using the grid size of the graph as the spacing
   * in the group's content area.
   */
  groupCells(): any {
    const border = this.groupBorderSize ?? this.graph.gridSize;
    return this.graph.groupCells(this.createGroup(), border);
  }

  /**
   * Creates and returns a clone of {@link defaultGroup} to be used as a new group cell in {@link group}.
   * @returns Cell
   */
  createGroup(): Cell {
    return <Cell>cloneCell(this.defaultGroup);
  }

  /**
   * Opens the specified file synchronously and parses it using {@link readGraphModel}.
   * It updates {@link filename} and fires an <open>-event after the file has been opened.
   *
   * Exceptions should be handled as follows:
   *
   * ```javascript
   * try {
   *   editor.open(filename);
   * } catch (e) {
   *   GlobalConfig.logger.error(`Cannot open ${filename}: ${e.message}`);
   * }
   * ```
   *
   * @param filename URL of the file to be opened.
   */
  open(filename: string): void {
    if (!isNullish(filename)) {
      const xml = load(filename).getXml();
      this.readGraphModel(xml.documentElement);
      this.filename = filename;

      this.fireEvent(new EventObject(InternalEvent.OPEN, { filename }));
    }
  }

  /**
   * Reads the specified XML node into the existing graph model and resets the command history and modified state.
   * @param node the XML node to be read into the graph model.
   */
  readGraphModel(node: Element): void {
    new ModelXmlSerializer(this.graph.getDataModel()).import(node);
    this.resetHistory();
  }

  /**
   * Posts the string returned by {@link writeGraphModel} to the given URL or the URL returned by {@link getUrlPost}.
   *
   * The actual posting is carried out by {@link postDiagram}.
   * If the URL is null then the resulting XML will be displayed using {@link popup}.
   *
   * Exceptions should be handled as follows:
   *
   * ```javascript
   * try {
   *   editor.open(filename);
   * } catch (e) {
   *   GlobalConfig.logger.error(`Cannot save: ${e.message}`);
   * }
   * ```
   *
   * @param url
   * @param linefeed
   */
  save(url: string | null = null, linefeed: string = this.linefeed): void {
    // Gets the URL to post the data to
    url = url || this.getUrlPost();

    // Posts the data if the URL is not empty
    if (url) {
      const data = this.writeGraphModel(linefeed);
      this.postDiagram(url, data);

      // Resets the modified flag
      this.setModified(false);
    }

    // Dispatches a save event
    this.fireEvent(new EventObject(InternalEvent.SAVE, { url }));
  }

  /**
   * Hook for subclassers to override the posting of a diagram
   * represented by the given node to the given URL. This fires
   * an asynchronous {@link post} event if the diagram has been posted.
   *
   * ### Example:
   *
   * To replace the diagram with the diagram in the response, use the
   * following code.
   *
   * @example
   * ```javascript
   * editor.addListener(mxEvent.POST, function(sender, evt)
   * {
   *   // Process response (replace diagram)
   *   var req = evt.getProperty('request');
   *   var root = req.getDocumentElement();
   *   editor.graph.readGraphModel(root)
   * });
   * ```
   * @param url
   * @param data
   */
  postDiagram(url: any, data: any): void {
    if (this.escapePostData) {
      data = encodeURIComponent(data);
    }

    post(url, `${this.postParameterName}=${data}`, (req: string) => {
      this.fireEvent(new EventObject(InternalEvent.POST, { request: req, url, data }));
    });
  }

  /**
   * Hook to create the string representation of the diagram.
   *
   * The default implementation uses {@link ModelXmlSerializer} to encode the graph model.
   *
   * @param linefeed Optional character to be used as the linefeed. Default is {@link linefeed}.
   */
  writeGraphModel(linefeed?: string): string {
    return new ModelXmlSerializer(this.graph.getDataModel()).export({ pretty: false });
  }

  /**
   * Returns the URL to post the diagram to. This is used
   * in {@link save}. The default implementation returns {@link urlPost},
   * adding <code>?draft=true</code>.
   */
  getUrlPost(): string | null {
    return this.urlPost;
  }

  /**
   * Returns the URL to create the image width. This is typically
   * the URL of a backend which accepts an XML representation
   * of a graph view to create an image. The function is used
   * in the image action to create an image. This implementation
   * returns {@link urlImage}.
   */
  getUrlImage(): string | null {
    return this.urlImage;
  }

  /**
   * Swaps the styles for the given names in the graph's stylesheet and refreshes the graph.
   * @param first the name of the first style to swap
   * @param second the name of the second style to swap
   */
  swapStyles(first: string, second: string): void {
    // Note that this method is not used in maxGraph and its examples. It wasn't used in the mxGraph repository either.
    const stylesheet = this.graph.getStylesheet();
    const styles = stylesheet.styles; // use internals here as there is no public API to get styles
    const firstStyle = styles.get(first);
    const secondStyle = styles.get(second);
    if (!firstStyle || !secondStyle) {
      return;
    }
    stylesheet.putCellStyle(second, firstStyle);
    stylesheet.putCellStyle(first, secondStyle);
    this.graph.refresh();
  }

  /**
   * Creates and shows the properties dialog for the given
   * cell. The content area of the dialog is created using
   * {@link createProperties}.
   * @param cell
   */
  showProperties(cell: Cell | null = null): void {
    cell = cell || this.graph.getSelectionCell();

    // Uses the root node for the properties dialog
    // if not cell was passed in and no cell is
    // selected
    if (!cell) {
      cell = this.graph.getCurrentRoot();

      if (!cell) {
        cell = this.graph.getDataModel().getRoot();
      }
    }

    if (cell) {
      // Makes sure there is no in-place editor in the
      // graph and computes the location of the dialog
      this.graph.stopEditing(true);

      const offset = getOffset(this.graph.container);
      let x = offset.x + 10;
      let { y } = offset;

      // Avoids moving the dialog if it is already open
      if (this.properties && !this.movePropertiesDialog) {
        x = this.properties.getX();
        y = this.properties.getY();
      }

      // Places the dialog near the cell for which it
      // displays the properties
      else {
        const bounds = this.graph.getCellBounds(cell);

        if (bounds) {
          x += bounds.x + Math.min(200, bounds.width);
          y += bounds.y;
        }
      }

      // Hides the existing properties dialog and creates a new one with the
      // contents created in the hook method
      this.hideProperties();
      const node = this.createProperties(cell);

      if (node) {
        // Displays the contents in a window and stores a reference to the
        // window for later hiding of the window
        this.properties = new MaxWindow(
          translate(this.propertiesResource) || this.propertiesResource,
          node,
          x,
          y,
          this.propertiesWidth,
          this.propertiesHeight,
          false
        );
        this.properties.setVisible(true);
      }
    }
  }

  /**
   * Returns true if the properties dialog is currently visible.
   */
  isPropertiesVisible(): boolean {
    return this.properties != null;
  }

  /**
   * Creates and returns the DOM node that represents the contents
   * of the properties dialog for the given cell. This implementation
   * works for user objects that are XML nodes and display all the
   * node attributes in a form.
   */
  createProperties(cell: Cell): HTMLTableElement | null {
    const model = this.graph.getDataModel();
    const value = cell.getValue();

    if (isNode(value)) {
      // Creates a form for the user object inside
      // the cell
      const form = new MaxForm('properties');

      // Adds a readonly field for the cell id
      const id = form.addText('ID', cell.getId());
      id.setAttribute('readonly', 'true');

      let geo: Geometry | null = null;
      let yField: HTMLInputElement | null = null;
      let xField: HTMLInputElement | null = null;
      let widthField: HTMLInputElement | null = null;
      let heightField: HTMLInputElement | null = null;

      // Adds fields for the location and size
      if (cell.isVertex()) {
        geo = cell.getGeometry();

        if (geo != null) {
          yField = form.addText('top', geo.y);
          xField = form.addText('left', geo.x);
          widthField = form.addText('width', geo.width);
          heightField = form.addText('height', geo.height);
        }
      }

      // Adds a field for the cell style
      const tmp = cell.getStyle();
      const style = form.addText('Style', tmp || '');

      // Creates text areas for each attribute of the user object within the cell
      const attrs = value.attributes;
      const texts: HTMLTextAreaElement[] = [];

      for (let i = 0; i < attrs.length; i += 1) {
        // Creates a textarea with more lines for
        // the cell label
        const val = attrs[i].value;
        texts.push(
          form.addTextarea(attrs[i].nodeName, val, attrs[i].nodeName === 'label' ? 4 : 2)
        );
      }

      // Adds an OK and Cancel button to the dialog
      // contents and implements the respective
      // actions below

      // Defines the function to be executed when the
      // OK button is pressed in the dialog
      const okFunction = () => {
        // Hides the dialog
        this.hideProperties();

        // Supports undo for the changes on the underlying
        // XML structure / XML node attribute changes.
        model.beginUpdate();
        try {
          if (geo && xField && yField && widthField && heightField) {
            geo = geo.clone();

            geo.x = Number.parseFloat(xField.value);
            geo.y = Number.parseFloat(yField.value);
            geo.width = Number.parseFloat(widthField.value);
            geo.height = Number.parseFloat(heightField.value);

            model.setGeometry(cell, geo);
          }

          // Applies the style
          if (style.value.length > 0) {
            // @ts-expect-error FIXME - style is no longer a string
            model.setStyle(cell, style.value);
          } else {
            model.setStyle(cell, {});
          }

          // Creates an undoable change for each
          // attribute and executes it using the
          // model, which will also make the change
          // part of the current transaction
          for (let i = 0; i < attrs.length; i += 1) {
            const edit = new CellAttributeChange(cell, attrs[i].nodeName, texts[i].value);
            model.execute(edit);
          }

          // Checks if the graph wants cells to
          // be automatically sized and updates
          // the size as an undoable step if
          // the feature is enabled
          if (this.graph.isAutoSizeCell(cell)) {
            this.graph.updateCellSize(cell);
          }
        } finally {
          model.endUpdate();
        }
      };

      // Defines the function to be executed when the
      // Cancel button is pressed in the dialog
      const cancelFunction = () => {
        // Hides the dialog
        this.hideProperties();
      };

      form.addButtons(okFunction, cancelFunction);
      return form.table;
    }

    return null;
  }

  /**
   * Hides the properties dialog.
   */
  hideProperties(): void {
    if (this.properties != null) {
      this.properties.destroy();
      this.properties = null;
    }
  }

  /**
   * Shows the tasks window. The tasks window is created using {@link createTasks}. The
   * default width of the window is 200 pixels, the y-coordinate of the location
   * can be specified in {@link tasksTop} and the x-coordinate is right aligned with a
   * 20 pixel offset from the right border. To change the location of the tasks
   * window, the following code can be used:
   *
   * @example
   * ```javascript
   * var oldShowTasks = Editor.prototype.showTasks;
   * Editor.prototype.showTasks = function()
   * {
   *   oldShowTasks.apply(this, arguments); // "supercall"
   *
   *   if (this.tasks != null)
   *   {
   *     this.tasks.setLocation(10, 10);
   *   }
   * };
   * ```
   */
  showTasks(): void {
    if (this.tasks == null) {
      const div = document.createElement('div');
      div.style.padding = '4px';
      div.style.paddingLeft = '20px';
      const w = document.body.clientWidth;
      const wnd = new MaxWindow(
        translate(this.tasksResource) || this.tasksResource,
        div,
        w - 220,
        this.tasksTop,
        200
      );
      wnd.setClosable(true);
      wnd.destroyOnClose = false;

      // Installs a function to update the contents
      // of the tasks window on every change of the
      // model, selection or root.
      const funct = (sender: any) => {
        InternalEvent.release(div);
        div.innerHTML = '';
        this.createTasks(div);
      };

      this.graph.getDataModel().addListener(InternalEvent.CHANGE, funct);
      this.graph.getSelectionModel().addListener(InternalEvent.CHANGE, funct);
      this.graph.addListener(InternalEvent.ROOT, funct);

      // Assigns the icon to the tasks window
      if (this.tasksWindowImage != null) {
        wnd.setImage(this.tasksWindowImage);
      }

      this.tasks = wnd;
      this.createTasks(div);
    }

    this.tasks.setVisible(true);
  }

  /**
   * Updates the contents of the tasks window using {@link createTasks}.
   * @param div
   */
  refreshTasks(div: Element): void {
    if (this.tasks != null) {
      const div = this.tasks.content;
      InternalEvent.release(div);
      div.innerHTML = '';
      this.createTasks(div);
    }
  }

  /**
   * Updates the contents of the given DOM node to
   * display the tasks associated with the current
   * editor state. This is invoked whenever there
   * is a possible change of state in the editor.
   * Default implementation is empty.
   * @param div
   */
  createTasks(div: Element): void {
    // override
  }

  /**
   * Shows the help window. If the help window does not exist
   * then it is created using an iframe pointing to the resource
   * for the `urlHelp` key or {@link urlHelp} if the resource
   * is undefined.
   * @param tasks
   */
  showHelp(tasks: any | null = null): void {
    if (this.help == null) {
      const frame = document.createElement('iframe');
      frame.setAttribute('src', (translate('urlHelp') || this.urlHelp)!);
      frame.setAttribute('height', '100%');
      frame.setAttribute('width', '100%');
      frame.setAttribute('frameBorder', '0');
      frame.style.backgroundColor = 'white';

      const w = document.body.clientWidth;
      const h = document.body.clientHeight || document.documentElement.clientHeight;

      const wnd = new MaxWindow(
        translate(this.helpResource) || this.helpResource,
        frame,
        (w - this.helpWidth) / 2,
        (h - this.helpHeight) / 3,
        this.helpWidth,
        this.helpHeight
      );
      wnd.setMaximizable(true);
      wnd.setClosable(true);
      wnd.destroyOnClose = false;
      wnd.setResizable(true);

      // Assigns the icon to the help window
      if (this.helpWindowImage != null) {
        wnd.setImage(this.helpWindowImage);
      }

      // Workaround for ignored iframe height 100% in FF
      if (Client.IS_NS) {
        const handler = (sender: any) => {
          const h = wnd.div.offsetHeight;
          frame.setAttribute('height', `${h - 26}px`);
        };

        wnd.addListener(InternalEvent.RESIZE_END, handler);
        wnd.addListener(InternalEvent.MAXIMIZE, handler);
        wnd.addListener(InternalEvent.NORMALIZE, handler);
        wnd.addListener(InternalEvent.SHOW, handler);
      }

      this.help = wnd;
    }

    this.help.setVisible(true);
  }

  /**
   * Shows the outline window. If the window does not exist, then it is
   * created using an {@link outline}.
   */
  showOutline(): void {
    const create = this.outline == null;

    if (create) {
      const div = document.createElement('div');

      div.style.overflow = 'hidden';
      div.style.position = 'relative';
      div.style.width = '100%';
      div.style.height = '100%';
      div.style.background = 'white';
      div.style.cursor = 'move';

      const wnd = new MaxWindow(
        translate(this.outlineResource) || this.outlineResource,
        div,
        600,
        480,
        200,
        200,
        false
      );

      // Creates the outline in the specified div
      // and links it to the existing graph
      const outline = new Outline(this.graph, div);
      wnd.setClosable(true);
      wnd.setResizable(true);
      wnd.destroyOnClose = false;

      wnd.addListener(InternalEvent.RESIZE_END, () => {
        outline.update();
      });

      this.outline = wnd;
      this.outline.Outline = outline;
    }

    // Finally shows the outline
    this.outline.setVisible(true);
    this.outline.outline.update(true);
  }

  /**
   * Puts the graph into the specified mode. The following mode names are supported:
   * - select - Selects using the left mouse button, new connections are disabled.
   * - connect - Selects using the left mouse button or creates new connections if mouse over cell hotspot. See {@link ConnectionHandler}.
   * - pan - Pans using the left mouse button, new connections are disabled.
   */
  setMode(modename: any): void {
    const panningHandler = this.graph.getPlugin<PanningHandler>('PanningHandler');
    switch (modename) {
      case 'select': {
        panningHandler && (panningHandler.useLeftButtonForPanning = false);
        this.graph.setConnectable(false);
        break;
      }
      case 'connect': {
        panningHandler && (panningHandler.useLeftButtonForPanning = false);
        this.graph.setConnectable(true);
        break;
      }
      case 'pan': {
        panningHandler && (panningHandler.useLeftButtonForPanning = true);
        this.graph.setConnectable(false);
        break;
      }
      // No default
    }
  }

  /**
   * Uses {@link popupHandler} to create the menu in the graph's
   * panning handler. The redirection is setup in {@link setToolbarContainer}.
   * @param menu
   * @param cell
   * @param evt
   */
  createPopupMenu(menu: MaxPopupMenu, cell: Cell | null, evt: any): void {
    this.popupHandler!.createMenu(this, menu, cell, evt);
  }

  /**
   * Uses {@link defaultEdge} as the prototype for creating new edges
   * in the connection handler of the graph. The style of the
   * edge will be overridden with the value returned by {@link getEdgeStyle}.
   * @param source
   * @param target
   */
  createEdge(source: Cell | null, target: Cell | null): Cell {
    // Clones the default edge prototype
    let e: Cell;

    if (this.defaultEdge != null) {
      e = <Cell>cloneCell(this.defaultEdge);
    } else {
      e = new Cell('');
      e.setEdge(true);

      const geo = new Geometry();
      geo.relative = true;
      e.setGeometry(geo);
    }

    // Overrides the edge style
    const style = this.getEdgeStyle();

    if (style != null) {
      e.setStyle(style);
    }
    return e;
  }

  /**
   * Returns a string identifying the style of new edges.
   * The function is used in {@link createEdge} when new edges
   * are created in the graph.
   */
  getEdgeStyle() {
    return this.defaultEdgeStyle;
  }

  /**
   * Returns the next attribute in {@link cycleAttributeValues}
   * or null, if not attribute should be used in the specified cell.
   * @param cell
   */
  consumeCycleAttribute(cell: Cell): any {
    return this.cycleAttributeValues &&
      this.cycleAttributeValues.length > 0 &&
      this.graph.isSwimlane(cell)
      ? this.cycleAttributeValues[
          this.cycleAttributeIndex++ % this.cycleAttributeValues.length
        ]
      : null;
  }

  /**
   * Uses the returned value from {@link consumeCycleAttribute}
   * as the value for the {@link cycleAttributeName} key in the given cell's style.
   * @param cell
   */
  cycleAttribute(cell: Cell): void {
    if (!isNullish(this.cycleAttributeName)) {
      const value = this.consumeCycleAttribute(cell);

      if (!isNullish(value)) {
        const style = cell.getStyle();
        // @ts-ignore ignore "not an indexed type" error
        style[this.cycleAttributeName] = value;
      }
    }
  }

  /**
   * Adds the given vertex as a child of parent at the specified
   * x and y coordinate and fires an {@link addVertex} event.
   * @param parent
   * @param vertex
   * @param x
   * @param y
   */
  addVertex(parent: Cell | null, vertex: Cell, x: number, y: number): any {
    const model = this.graph.getDataModel();

    while (parent && !this.graph.isValidDropTarget(parent)) {
      parent = parent.getParent();
    }

    parent ??= this.graph.getSwimlaneAt(x, y);
    const { scale } = this.graph.getView();

    let geo = vertex.getGeometry()!;
    const pgeo = parent?.getGeometry();

    if (this.graph.isSwimlane(vertex) && !this.graph.swimlaneNesting) {
      parent = null;
    } else if (!parent && this.swimlaneRequired) {
      return null;
    } else if (parent && pgeo) {
      // Keeps vertex inside parent
      const state = this.graph.getView().getState(parent);

      if (state) {
        x -= state.origin.x * scale;
        y -= state.origin.y * scale;

        if (this.graph.isConstrainedMoving) {
          const { width } = geo;
          const { height } = geo;
          let tmp = state.x + state.width;

          if (x + width > tmp) {
            x -= x + width - tmp;
          }

          tmp = state.y + state.height;

          if (y + height > tmp) {
            y -= y + height - tmp;
          }
        }
      } else {
        x -= pgeo.x * scale;
        y -= pgeo.y * scale;
      }
    }

    geo = geo.clone();
    geo.x = this.graph.snap(
      x / scale - this.graph.getView().translate.x - this.graph.gridSize / 2
    );
    geo.y = this.graph.snap(
      y / scale - this.graph.getView().translate.y - this.graph.gridSize / 2
    );
    vertex.setGeometry(geo);

    if (parent) {
      parent = this.graph.getDefaultParent();
    }

    this.cycleAttribute(vertex);
    this.fireEvent(
      new EventObject(InternalEvent.BEFORE_ADD_VERTEX, { vertex: vertex, parent: parent })
    );

    model.beginUpdate();
    try {
      vertex = this.graph.addCell(vertex, parent);

      if (vertex) {
        this.graph.constrainChild(vertex);

        this.fireEvent(new EventObject(InternalEvent.ADD_VERTEX, { vertex: vertex }));
      }
    } finally {
      model.endUpdate();
    }

    if (vertex != null) {
      this.graph.setSelectionCell(vertex);
      this.graph.scrollCellToVisible(vertex);
      this.fireEvent(new EventObject(InternalEvent.AFTER_ADD_VERTEX, { vertex: vertex }));
    }
    return vertex;
  }

  /**
   * Removes the editor and all its associated resources. This does not
   * normally need to be called, it is called automatically when the window
   * unloads.
   */
  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;

      this.tasks?.destroy();
      this.outline?.destroy();
      this.properties?.destroy();
      this.keyHandler?.destroy();
      this.rubberband?.onDestroy();

      this.toolbar?.destroy();
      this.graph?.destroy();

      this.status = null;
      this.templates = null;
    }
  }
}

export default Editor;
