/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import mxConstants from "../mxgraph/util/mxConstants";
import mxPopupMenu from "../mxgraph/util/mxPopupMenu";
import mxRectangle from "../mxgraph/util/mxRectangle";
import mxUtils from "../mxgraph/util/mxUtils";

class ShowRegion extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Showregion</h1>
        This example demonstrates using a custom
        rubberband handler to show the selected region in a new window.

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

export default ShowRegion;

  <style type="text/css">
    body div.mxPopupMenu {
      -webkit-box-shadow: 3px 3px 6px #C0C0C0;
      -moz-box-shadow: 3px 3px 6px #C0C0C0;
      box-shadow: 3px 3px 6px #C0C0C0;
      background: white;
      position: absolute;
      border: 3px solid #e7e7e7;
      padding: 3px;
    }
    body table.mxPopupMenu {
      border-collapse: collapse;
      margin: 0px;
    }
    body tr.mxPopupMenuItem {
      color: black;
      cursor: default;
    }
    body td.mxPopupMenuItem {
      padding: 6px 60px 6px 30px;
      font-family: Arial;
      font-size: 10pt;
    }
    body td.mxPopupMenuIcon {
      background-color: white;
      padding: 0px;
    }
    body tr.mxPopupMenuItemHover {
      background-color: #eeeeee;
      color: black;
    }
    table.mxPopupMenu hr {
      border-top: solid 1px #cccccc;
    }
    table.mxPopupMenu tr {
      font-size: 4pt;
    }
  </style>

    function main(container)
    {
      // Checks if the browser is supported
      if (!Client.isBrowserSupported())
      {
        // Displays an error message if the browser is not supported.
        mxUtils.error('Browser is not supported!', 200, false);
      }
      else
      {
        // Disables built-in context menu
        mxEvent.disableContextMenu(this.el);

        // Changes some default colors
        mxConstants.HANDLE_FILLCOLOR = '#99ccff';
        mxConstants.HANDLE_STROKECOLOR = '#0088cf';
        mxConstants.VERTEX_SELECTION_COLOR = '#00a8ff';

        // Creates the graph inside the given container
        let graph = new mxGraph(container);

        // Enables rubberband selection
        let rubberband = new mxRubberband(graph);

        rubberband.isForceRubberbandEvent = function(me)
        {
          return mxRubberband.prototype.isForceRubberbandEvent.apply(this, arguments) || mxEvent.isPopupTrigger(me.getEvent());
        }

        // Defines a new popup menu for region selection in the rubberband handler
        rubberband.popupMenu = new mxPopupMenu(function(menu, cell, evt)
        {
          let rect = new mxRectangle(rubberband.x, rubberband.y, rubberband.width, rubberband.height);

          menu.addItem('Show this', null, function()
            {
            rubberband.popupMenu.hideMenu();
            let bounds = graph.getGraphBounds();
            mxUtils.show(graph, null, bounds.x - rubberband.x, bounds.y - rubberband.y, rubberband.width, rubberband.height);
            });
        });

        let rubberbandMouseDown = rubberband.mouseDown;
        rubberband.mouseDown = function(sender, me)
        {
          this.popupMenu.hideMenu();
          rubberbandMouseDown.apply(this, arguments);
        };

        let rubberbandMouseUp = rubberband.mouseUp;
        rubberband.mouseUp = function(sender, me)
        {
          if (this.div != null && mxEvent.isPopupTrigger(me.getEvent()))
          {
            if (!graph.getPlugin('PopupMenuHandler').isMenuShowing())
            {
              let origin = mxUtils.getScrollOrigin();
              this.popupMenu.popup(me.getX() + origin.x + 1, me.getY() + origin.y + 1, null, me.getEvent());
              this.reset();
            }
          }
          else
          {
            rubberbandMouseUp.apply(this, arguments);
          }
        };

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        let parent = graph.getDefaultParent();

        // Adds cells to the model in a single step
        graph.getModel().beginUpdate();
        try
        {
          var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
          var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
          var e1 = graph.insertEdge(parent, null, '', v1, v2);
        }
        finally
        {
          // Updates the display
          graph.getModel().endUpdate();
        }
      }
    };
  </script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper -->
  <div id="graphContainer"
    style="overflow:hidden;width:321px;height:241px;background:url('editors/images/grid.gif');cursor:default;">
  </div>
  Use the right mouse button to select a region of the diagram and select <i>Show this</i>.
</body>
</html>
