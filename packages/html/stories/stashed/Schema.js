/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import { error } from '../../packages/core/src/util/gui/MaxWindow';
import { load } from '../../packages/core/src/util/network/MaxXmlRequest';
import { htmlEntities } from '../../packages/core/src/util/stringUtils';
import { setOpacity } from '../../packages/core/src/util/utils';
import { write, writeln } from '../../packages/core/src/util/domUtils';
import { createXmlDocument, getPrettyXml } from '../../packages/core/src/util/xmlUtils';
import { makeDraggable } from '../../packages/core/src/util/gestureUtils';
import { clone } from '../../packages/core/src/util/cloneUtils';

class Schema extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Schema example</h1>
        This example demonstrates implementing
        a SQL schema editor.

        <div
          ref={el => {
            this.el = el;
          }}
          style={{

          }}
        />
      </>
    );
  };

  componentDidMount() {

  };
}

export default MYNAMEHERE;


    function main(container, outline, toolbar, sidebar, status)
    {
      // Checks if the browser is supported
      if (!Client.isBrowserSupported())
      {
        // Displays an error message if the browser is not supported.
        error('Browser is not supported!', 200, false);
      }
      else
      {
        // Specifies shadow opacity, color and offset
        mxConstants.SHADOW_OPACITY = 0.5;
        mxConstants.SHADOWCOLOR = '#C0C0C0';
        mxConstants.SHADOW_OFFSET_X = 5;
        mxConstants.SHADOW_OFFSET_Y = 6;

        // Table icon dimensions and position
        SwimlaneShape.prototype.imageSize = 20;
        SwimlaneShape.prototype.imageDx = 16;
        SwimlaneShape.prototype.imageDy = 4;

        // Changes swimlane icon bounds
        SwimlaneShape.prototype.getImageBounds = function(x, y, w, h)
        {
          return new Rectangle(x + this.imageDx, y + this.imageDy, this.imageSize, this.imageSize);
        };

        // Defines an icon for creating new connections in the connection handler.
        // This will automatically disable the highlighting of the source vertex.
        ConnectionHandler.prototype.connectImage = new Image('images/connector.gif', 16, 16);

        // Prefetches all images that appear in colums
        // to avoid problems with the auto-layout
        let keyImage = new Image();
        keyImage.src = "images/key.png";

        let plusImage = new Image();
        plusImage.src = "images/plus.png";

        let checkImage = new Image();
        checkImage.src = "images/check.png";

        // Creates the graph inside the given container. The
        // editor is used to create certain functionality for the
        // graph, such as the rubberband selection, but most parts
        // of the UI are custom in this example.
        let editor = new Editor();
        let graph = editor.graph;
        let model = graph.model;

        // Disables some global features
        graph.setConnectable(true);
        graph.setCellsDisconnectable(false);
        graph.setCellsCloneable(false);
        graph.swimlaneNesting = false;
        graph.dropEnabled = true;

        // Does not allow dangling edges
        graph.setAllowDanglingEdges(false);

        // Forces use of default edge in mxConnectionHandler
        graph.getPlugin('ConnectionHandler').factoryMethod = null;

        // Only tables are resizable
        graph.isCellResizable = function(cell)
        {
          return this.isSwimlane(cell);
        };

        // Only tables are movable
        graph.isCellMovable = function(cell)
        {
          return this.isSwimlane(cell);
        };

        // Sets the graph container and configures the editor
        editor.setGraphContainer(container);
        let config = load(
          'editors/config/keyhandler-minimal.xml').
            getDocumentElement();
        editor.configure(config);

        // Configures the automatic layout for the table columns
        editor.layoutSwimlanes = true;
        editor.createSwimlaneLayout = () =>
        {
          let layout = new StackLayout(this.graph, false);
          layout.fill = true;
          layout.resizeParent = true;

          // Overrides the function to always return true
          layout.isVertexMovable = function(cell)
          {
            return true;
          };

          return layout;
        };

        // Text label changes will go into the name field of the user object
        graph.model.valueForCellChanged = function(cell, value)
        {
          if (value.name != null)
          {
            return GraphModel.prototype.valueForCellChanged.apply(this, arguments);
          }
          else
          {
            let old = cell.value.name;
            cell.value.name = value;
            return old;
          }
        };

        // Columns are dynamically created HTML labels
        graph.isHtmlLabel = function(cell)
        {
          return !this.isSwimlane(cell) &&
            !cell.isEdge();
        };

        // Edges are not editable
        graph.isCellEditable = function(cell)
        {
          return !cell.isEdge();
        };

        // Returns the name field of the user object for the label
        graph.convertValueToString = function(cell)
        {
          if (cell.value != null && cell.value.name != null)
          {
            return cell.value.name;
          }

          return mxGraph.prototype.convertValueToString.apply(this, arguments); // "supercall"
        };

        // Returns the type as the tooltip for column cells
        graph.getTooltip = function(state)
        {
          if (this.isHtmlLabel(state.cell))
          {
            return 'Type: '+state.cell.value.type;
          }
          else if (state.cell.isEdge())
          {
            let source = state.cell.getTerminal(true);
            let parent = source.getParent();

            return parent.value.name+'.'+source.value.name;
          }

          return mxGraph.prototype.getTooltip.apply(this, arguments); // "supercall"
        };

        // Creates a dynamic HTML label for column fields
        graph.getLabel = function(cell)
        {
          if (this.isHtmlLabel(cell))
          {
            let label = '';

            if (cell.value.primaryKey)
            {
              label += '<img title="Primary Key" src="images/key.png" width="16" height="16" align="top">&nbsp;';
            }
            else
            {
              label += '<img src="images/spacer.gif" width="16" height="1">&nbsp;';
            }

            if (cell.value.autoIncrement)
            {
              label += '<img title="Auto Increment" src="images/plus.png" width="16" height="16" align="top">&nbsp;';
            }
            else if (cell.value.unique)
            {
              label += '<img title="Unique" src="images/check.png" width="16" height="16" align="top">&nbsp;';
            }
            else
            {
              label += '<img src="images/spacer.gif" width="16" height="1">&nbsp;';
            }

            return label + htmlEntities(cell.value.name, false) + ': ' +
              htmlEntities(cell.value.type, false);
          }

          return mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
        };

        // Removes the source vertex if edges are removed
        graph.addListener(mxEvent.REMOVE_CELLS, function(sender, evt)
        {
          let cells = evt.getProperty('cells');

          for (let i = 0; i < cells.length; i++)
          {
            let cell = cells[i];

            if (cell.isEdge())
            {
              let terminal = cell.getTerminal(true);
              let parent = terminal.getParent();
              this.model.remove(terminal);
            }
          }
        });

        // Disables drag-and-drop into non-swimlanes.
        graph.isValidDropTarget = function(cell, cells, evt)
        {
          return this.isSwimlane(cell);
        };

        // Installs a popupmenu handler using local function (see below).
        graph.getPlugin('PopupMenuHandler').factoryMethod = function(menu, cell, evt)
        {
          createPopupMenu(editor, graph, menu, cell, evt);
        };

        // Adds all required styles to the graph (see below)
        configureStylesheet(graph);

        // Adds sidebar icon for the table object
        let tableObject = new Table('TABLENAME');
        let table = new Cell(tableObject, new Geometry(0, 0, 200, 28), 'table');

        table.setVertex(true);
        addSidebarIcon(graph, sidebar,   table, 'images/icons48/table.png');

        // Adds sidebar icon for the column object
        let columnObject = new Column('COLUMNNAME');
        let column = new Cell(columnObject, new Geometry(0, 0, 0, 26));

        column.setVertex(true);
        column.setConnectable(false);

        addSidebarIcon(graph, sidebar,   column, 'images/icons48/column.png');

        // Adds primary key field into table
        let firstColumn = column.clone();

        firstColumn.value.name = 'TABLENAME_ID';
        firstColumn.value.type = 'INTEGER';
        firstColumn.value.primaryKey = true;
        firstColumn.value.autoIncrement = true;

        table.insert(firstColumn);

        // Adds child columns for new connections between tables
        graph.addEdge = function(edge, parent, source, target, index)
        {
          // Finds the primary key child of the target table
          let primaryKey = null;
          let childCount = target.getChildCount();

          for (var i=0; i < childCount; i++)
          {
            let child = target.getChildAt(i);

            if (child.value.primaryKey)
            {
              primaryKey = child;
              break;
            }
          }

          if (primaryKey == null)
          {
            alert('Target table must have a primary key');
            return;
          }

          this.model.beginUpdate();
          try
          {
            var col1 = this.model.cloneCell(column);
            col1.value.name = primaryKey.value.name;
            col1.value.type = primaryKey.value.type;

            this.addCell(col1, source);
            source = col1;
            target = primaryKey;

            return mxGraph.prototype.addEdge.apply(this, arguments); // "supercall"
          }
          finally
          {
            this.model.endUpdate();
          }

          return null;
        };

        // Displays useful hints in a small semi-transparent box.
        let hints = document.createElement('div');
        hints.style.position = 'absolute';
        hints.style.overflow = 'hidden';
        hints.style.width = '230px';
        hints.style.bottom = '56px';
        hints.style.height = '86px';
        hints.style.right = '20px';

        hints.style.background = 'black';
        hints.style.color = 'white';
        hints.style.fontFamily = 'Arial';
        hints.style.fontSize = '10px';
        hints.style.padding = '4px';

        setOpacity(hints, 50);

        writeln(hints, '- Drag an image from the sidebar to the graph');
        writeln(hints, '- Doubleclick on a table or column to edit');
        writeln(hints, '- Shift- or Rightclick and drag for panning');
        writeln(hints, '- Move the mouse over a cell to see a tooltip');
        writeln(hints, '- Click and drag a table to move and connect');
        writeln(hints, '- Shift- or Rightclick to show a popup menu');
        document.body.appendChild(hints);

        // Creates a new DIV that is used as a toolbar and adds
        // toolbar buttons.
        let spacer = document.createElement('div');
        spacer.style.display = 'inline';
        spacer.style.padding = '8px';

        addToolbarButton(editor, toolbar, 'properties', 'Properties', 'editors/images/properties.gif');

        // Defines a new export action
        editor.addAction('properties', function(editor, cell)
        {
          if (cell == null)
          {
            cell = graph.getSelectionCell();
          }

          if (graph.isHtmlLabel(cell))
          {
            showProperties(graph, cell);
          }
        });

        addToolbarButton(editor, toolbar, 'delete', 'Delete', 'images/delete2.png');

        toolbar.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, toolbar, 'undo', '', 'images/undo.png');
        addToolbarButton(editor, toolbar, 'redo', '', 'images/redo.png');

        toolbar.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, toolbar, 'show', 'Show', 'images/camera.png');
        addToolbarButton(editor, toolbar, 'print', 'Print', 'images/printer.png');

        toolbar.appendChild(spacer.cloneNode(true));

        // Defines a create SQK action
        editor.addAction('showSql', function(editor, cell)
        {
          let sql = createSql(graph);

          if (sql.length > 0)
          {
            let textarea = document.createElement('textarea');
            textarea.style.width = '400px';
            textarea.style.height = '400px';

            textarea.value = sql;
            showModalWindow('SQL', textarea, 410, 440);
          }
          else
          {
            alert('Schema is empty');
          }
        });

        addToolbarButton(editor, toolbar, 'showSql', 'Show SQL', 'images/export1.png');

        // Defines export XML action
        editor.addAction('export', function(editor, cell)
        {
          let textarea = document.createElement('textarea');
          textarea.style.width = '400px';
          textarea.style.height = '400px';
          let enc = new Codec(createXmlDocument());
          let node = enc.encode(editor.graph.getModel());
          textarea.value = getPrettyXml(node);
          showModalWindow('XML', textarea, 410, 440);
        });

        addToolbarButton(editor, toolbar, 'export', 'Export XML', 'images/export1.png');

        // Adds toolbar buttons into the status bar at the bottom
        // of the window.
        addToolbarButton(editor, status, 'collapseAll', 'Collapse All', 'images/navigate_minus.png', true);
        addToolbarButton(editor, status, 'expandAll', 'Expand All', 'images/navigate_plus.png', true);

        status.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, status, 'zoomIn', '', 'images/zoom_in.png', true);
        addToolbarButton(editor, status, 'zoomOut', '', 'images/zoom_out.png', true);
        addToolbarButton(editor, status, 'actualSize', '', 'images/view_1_1.png', true);
        addToolbarButton(editor, status, 'fit', '', 'images/fit_to_size.png', true);

        // Creates the outline (navigator, overview) for moving
        // around the graph in the top, right corner of the window.
        let outln = new outline(graph, outline);

        // Fades-out the splash screen after the UI has been loaded.
        let splash = document.getElementById('splash');
        if (splash != null)
        {
          try
          {
            mxEvent.release(splash);
            Effects.fadeOut(splash, 100, true);
          }
          catch (e)
          {

            // mxUtils is not available (library not loaded)
            splash.parentNode.removeChild(splash);
          }
        }
      }
    }

    function addToolbarButton(editor, toolbar, action, label, image, isTransparent)
    {
      let button = document.createElement('button');
      button.style.fontSize = '10';
      if (image != null)
      {
        let img = document.createElement('img');
        img.setAttribute('src', image);
        img.style.width = '16px';
        img.style.height = '16px';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '2px';
        button.appendChild(img);
      }
      if (isTransparent)
      {
        button.style.background = 'transparent';
        button.style.color = '#FFFFFF';
        button.style.border = 'none';
      }
      mxEvent.addListener(button, 'click', function(evt)
      {
        editor.execute(action);
      });
      write(button, label);
      toolbar.appendChild(button);
    };

    function showModalWindow(title, content, width, height)
    {
      let background = document.createElement('div');
      background.style.position = 'absolute';
      background.style.left = '0px';
      background.style.top = '0px';
      background.style.right = '0px';
      background.style.bottom = '0px';
      background.style.background = 'black';
      setOpacity(background, 50);
      document.body.appendChild(background);

      let x = Math.max(0, document.body.scrollWidth/2-width/2);
      let y = Math.max(10, (document.body.scrollHeight ||
            document.documentElement.scrollHeight)/2-height*2/3);
      let wnd = new MaxWindow(title, content, x, y, width, height, false, true);
      wnd.setClosable(true);

      // Fades the background out after after the window has been closed
      wnd.addListener(mxEvent.DESTROY, function(evt)
      {
        Effects.fadeOut(background, 50, true,
          10, 30, true);
      });

      wnd.setVisible(true);

      return wnd;
    };

    function addSidebarIcon(graph, sidebar, prototype, image)
    {
      // Function that is executed when the image is dropped on
      // the graph. The cell argument points to the cell under
      // the mousepointer if there is one.
      let funct = function(graph, evt, cell)
      {
        graph.stopEditing(false);

        let pt = graph.getPointForEvent(evt);

        let parent = graph.getDefaultParent();
        let model = graph.getModel();

        let isTable = graph.isSwimlane(prototype);
        let name = null;

        if (!isTable)
        {
          parent = cell;
          let pstate = graph.getView().getState(parent);

          if (parent == null || pstate == null)
          {
            alert('Drop target must be a table');
            return;
          }

          pt.x -= pstate.x;
          pt.y -= pstate.y;

          let columnCount = parent.getChildCount()+1;
          name = prompt('Enter name for new column', 'COLUMN'+columnCount);
        }
        else
        {
          let tableCount = 0;
          let childCount = parent.getChildCount();

          for (var i=0; i<childCount; i++)
          {
            if (!parent.getChildAt(i).isEdge())
            {
              tableCount++;
            }
          }

          let name = prompt('Enter name for new table', 'TABLE'+(tableCount+1));
        }

        if (name != null)
        {
          var v1 = model.cloneCell(prototype);

          model.beginUpdate();
          try
          {
            v1.value.name = name;
            v1.geometry.x = pt.x;
            v1.geometry.y = pt.y;

            graph.addCell(v1, parent);

            if (isTable)
            {
              v1.geometry.alternateBounds = new Rectangle(0, 0, v1.geometry.width, v1.geometry.height);
              v1.children[0].value.name = name + '_ID';
            }
          }
          finally
          {
            model.endUpdate();
          }

          graph.setSelectionCell(v1);
        }
      }

      // Creates the image which is used as the sidebar icon (drag source)
      let img = document.createElement('img');
      img.setAttribute('src', image);
      img.style.width = '48px';
      img.style.height = '48px';
      img.title = 'Drag this to the diagram to create a new vertex';
      sidebar.appendChild(img);

      // Creates the image which is used as the drag icon (preview)
      let dragImage = img.cloneNode(true);
      let ds = makeDraggable(img, graph, funct, dragImage);

      // Adds highlight of target tables for columns
      ds.highlightDropTargets = true;
      ds.getDropTarget = function(graph, x, y)
      {
        if (graph.isSwimlane(prototype))
        {
          return null;
        }
        else
        {
          let cell = graph.getCellAt(x, y);

          if (graph.isSwimlane(cell))
          {
            return cell;
          }
          else
          {
            let parent = cell.getParent();

            if (graph.isSwimlane(parent))
            {
              return parent;
            }
          }
        }
      };
    };

    function configureStylesheet(graph)
    {
      let style = {};
      style.shape = mxConstants.SHAPE_RECTANGLE;
      style.perimiter = Perimeter.RectanglePerimeter;
      style.align = mxConstants.ALIGN_LEFT;
      style.verticalAlign = mxConstants.ALIGN_MIDDLE;
      style.fontColor = '#000000';
      style.fontSize = '11';
      style.fontStyle = 0;
      style.spacingLeft = '4';
      style.imageWidth = '48';
      style.imageHeight = '48';
      graph.getStylesheet().putDefaultVertexStyle(style);

      style = {};
      style.shape = mxConstants.SHAPE_SWIMLANE;
      style.perimiter = Perimeter.RectanglePerimeter;
      style.align = mxConstants.ALIGN_CENTER;
      style.verticalAlign = mxConstants.ALIGN_TOP;
      style.gradientColor = '#41B9F5';
      style.fillColor = '#8CCDF5';
      style.swimlaneFillColor = '#ffffff';
      style.strokeColor = '#1B78C8';
      style.fontColor = '#000000';
      style.strokeWidth = '2';
      style.startSize = '28';
      style.verticalAlign = 'middle';
      style.fontSize = '12';
      style.fontStyle = 1;
      style.image = 'images/icons48/table.png';
      // Looks better without opacity if shadow is enabled
      //style.opacity = '80';
      style.shadow = 1;
      graph.getStylesheet().putCellStyle('table', style);

      style = graph.stylesheet.getDefaultEdgeStyle();
      style.labelBackgroundColor = '#FFFFFF';
      style.strokeWidth = '2';
      style.rounded = true;
      style.edge = EdgeStyle.EntityRelation;
    };

    // Function to create the entries in the popupmenu
    function createPopupMenu(editor, graph, menu, cell, evt)
    {
      if (cell != null)
      {
        if (graph.isHtmlLabel(cell))
        {
          menu.addItem('Properties', 'editors/images/properties.gif', function()
          {
            editor.execute('properties', cell);
          });

          menu.addSeparator();
        }

        menu.addItem('Delete', 'images/delete2.png', function()
        {
          editor.execute('delete', cell);
        });

        menu.addSeparator();
      }

      menu.addItem('Undo', 'images/undo.png', function()
      {
        editor.execute('undo', cell);
      });

      menu.addItem('Redo', 'images/redo.png', function()
      {
        editor.execute('redo', cell);
      });

      menu.addSeparator();


      menu.addItem('Show SQL', 'images/export1.png', function()
      {
        editor.execute('showSql', cell);
      });
    };

    function showProperties(graph, cell)
    {
      // Creates a form for the user object inside
      // the cell
      let form = new MaxForm('properties');

      // Adds a field for the columnname
      let nameField = form.addText('Name', cell.value.name);
      let typeField = form.addText('Type', cell.value.type);

      let primaryKeyField = form.addCheckbox('Primary Key', cell.value.primaryKey);
      let autoIncrementField = form.addCheckbox('Auto Increment', cell.value.autoIncrement);
      let notNullField = form.addCheckbox('Not Null', cell.value.notNull);
      let uniqueField = form.addCheckbox('Unique', cell.value.unique);

      let defaultField = form.addText('Default', cell.value.defaultValue || '');
      let useDefaultField = form.addCheckbox('Use Default', (cell.value.defaultValue != null));

      let wnd = null;

      // Defines the function to be executed when the
      // OK button is pressed in the dialog
      let okFunction = function()
      {
        let clone = cell.value.clone();

        clone.name = nameField.value;
        clone.type = typeField.value;

        if (useDefaultField.checked)
        {
          clone.defaultValue = defaultField.value;
        }
        else
        {
          clone.defaultValue = null;
        }

        clone.primaryKey = primaryKeyField.checked;
        clone.autoIncrement = autoIncrementField.checked;
        clone.notNull = notNullField.checked;
        clone.unique = uniqueField.checked;

        graph.model.setValue(cell, clone);

        wnd.destroy();
      }

      // Defines the function to be executed when the
      // Cancel button is pressed in the dialog
      let cancelFunction = function()
      {
        wnd.destroy();
      }
      form.addButtons(okFunction, cancelFunction);

      let parent = cell.getParent();
      let name = parent.value.name + '.' + cell.value.name;
      wnd = showModalWindow(name, form.table, 240, 240);
    };

    function createSql(graph)
    {
      let sql = [];
      let parent = graph.getDefaultParent();
      let childCount = parent.getChildCount();

      for (var i=0; i<childCount; i++)
      {
        let child = parent.getChildAt(i);

        if (!child.isEdge())
        {
          sql.push('CREATE TABLE IF NOT EXISTS '+child.value.name+' (');

          let columnCount = child.getChildCount();

          if (columnCount > 0)
          {
            for (var j=0; j<columnCount; j++)
            {
              let column = child.getChildAt(j).value;

              sql.push('\n    '+column.name+' '+column.type);

              if (column.notNull)
              {
                sql.push(' NOT NULL');
              }

              if (column.primaryKey)
              {
                sql.push(' PRIMARY KEY');
              }

              if (column.autoIncrement)
              {
                sql.push(' AUTOINCREMENT');
              }

              if (column.unique)
              {
                sql.push(' UNIQUE');
              }

              if (column.defaultValue != null)
              {
                sql.push(' DEFAULT '+column.defaultValue);
              }

              sql.push(',');
            }

            sql.splice(sql.length-1, 1);
            sql.push('\n);');
          }

          sql.push('\n');
        }
      }

      return sql.join('');
    };

    // Defines the column user object
    function Column(name)
    {
      this.name = name;
    };

    Column.prototype.type = 'TEXT';

    Column.prototype.defaultValue = null;

    Column.prototype.primaryKey = false;

    Column.prototype.autoIncrement = false;

    Column.prototype.notNull = false;

    Column.prototype.unique = false;

    Column.prototype.clone = function()
    {
      return clone(this);
    };

    // Defines the table user object
    function Table(name)
    {
      this.name = name;
    };

    Table.prototype.clone = function()
    {
      return clone(this);
    };
  </script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'),
      document.getElementById('outlineContainer'),
       document.getElementById('toolbarContainer'),
      document.getElementById('sidebarContainer'),
      document.getElementById('statusContainer'));">

  <!-- Creates a container for the splash screen -->
  <div id="splash"
    style="position:absolute;top:0px;left:0px;width:100%;height:100%;background:white;z-index:1;">
    <center id="splash" style="padding-top:230px;">
      <img src="editors/images/loading.gif">
    </center>
  </div>

  <!-- Creates a container for the sidebar -->
  <div id="toolbarContainer"
    style="position:absolute;white-space:nowrap;overflow:hidden;top:0px;left:0px;max-height:24px;height:36px;right:0px;padding:6px;background-image:url('images/toolbar_bg.gif');">
  </div>

  <!-- Creates a container for the toolboox -->
  <div id="sidebarContainer"
    style="position:absolute;overflow:hidden;top:36px;left:0px;bottom:36px;max-width:52px;width:56px;padding-top:10px;padding-left:4px;background-image:url('images/sidebar_bg.gif');">
  </div>

  <!-- Creates a container for the graph -->
  <div id="graphContainer"
    style="position:absolute;overflow:hidden;top:36px;left:60px;bottom:36px;right:0px;">
  </div>

  <!-- Creates a container for the outline -->
  <div id="outlineContainer"
    style="position:absolute;overflow:hidden;top:36px;right:0px;width:200px;height:140px;background:transparent;border-style:solid;border-color:black;">
  </div>

  <!-- Creates a container for the sidebar -->
  <div id="statusContainer"
    style="text-align:right;position:absolute;overflow:hidden;bottom:0px;left:0px;max-height:24px;height:36px;right:0px;color:white;padding:6px;background-image:url('images/toolbar_bg.gif');">
    <div style="font-size:10pt;float:left;">
      Created with <a href="http://www.jgraph.com" target="_blank">mxGraph</a>
    </div>
  </div>
</body>
</html>
