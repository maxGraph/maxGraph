/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import { convertPoint, getValue } from '../../packages/core/src/util/Utils';

class MYNAMEHERE extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>mxGraph using Server-side Image</h1>
        This example demonstrates using
        a server-side image of the graph as the diagram in the client. This
        may be used to improve drawing-speed in older browser and on devices
        with slower processors.

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


    // Makes the background of the in-place editor non-transparent
    let previousStartEditing = CellEditor.prototype.startEditing;
    CellEditor.prototype.startEditing = (cell, trigger) =>
    {
      previousStartEditing.apply(this, arguments);

      let state = this.graph.getView().getState(cell);

      if (state != null)
      {
        let color = getValue(state.style, 'fillColor', 'white');
        this.textarea.style.background = color;
      }
    };

    // Replaces the event firing mechanism in the graph view since there are
    // no longer any DOM elements that fire events for the actual states we
    // have to find the state under the mouse using graph.getCellAt and then
    // fire the event for the state from here instead.
    // FIXME: Since we do not render the label we don't have the label bounds
    // here which means hit detection will only work for the vertex bounds,
    // the edge but not for overlapping labels or most part of the edge labels.
    GraphView.prototype.installListeners = function()
    {
      let graph = this.graph;
      let container = graph.container;

      if (container != null)
      {
        mxEvent.addGestureListeners(container,
          (evt) =>
          {
            let pt = convertPoint(graph.container,
              mxEvent.getClientX(evt), mxEvent.getClientY(evt));
            let cell = graph.getCellAt(pt.x, pt.y);
            let state = this.getState(cell);

            if (state != null)
            {
              graph.fireMouseEvent(mxEvent.MOUSE_DOWN,
                  new InternalMouseEvent(evt, state));
            }
            // Condition to avoid scrollbar events starting a rubberband
            // selection
            else if (this.isContainerEvent(evt) &&
              ((!mxClient.IS_GC && !mxClient.IS_SF) ||
              !this.isScrollEvent(evt)))
            {
              graph.fireMouseEvent(mxEvent.MOUSE_DOWN,
                new InternalMouseEvent(evt));
            }
          }),
          ((evt) =>
          {
            let pt = convertPoint(graph.container,
              mxEvent.getClientX(evt), mxEvent.getClientY(evt));
            let cell = graph.getCellAt(pt.x, pt.y);
            let state = this.getState(cell);

            if (state != null)
            {
              graph.fireMouseEvent(mxEvent.MOUSE_MOVE,
                  new InternalMouseEvent(evt, state));
            }
            else if (this.isContainerEvent(evt))
            {
              graph.fireMouseEvent(mxEvent.MOUSE_MOVE,
                new InternalMouseEvent(evt));
            }
          }),
          ((evt) =>
          {
            let pt = convertPoint(graph.container,
              mxEvent.getClientX(evt), mxEvent.getClientY(evt));
            let cell = graph.getCellAt(pt.x, pt.y);
            let state = this.getState(cell);

            if (state != null)
            {
              graph.fireMouseEvent(mxEvent.MOUSE_UP,
                  new InternalMouseEvent(evt, state));
            }
            else if (this.isContainerEvent(evt))
            {
              graph.fireMouseEvent(mxEvent.MOUSE_UP,
                new InternalMouseEvent(evt));
            }
          }));

        // Adds listener for double click handling on background
        mxEvent.addListener(container, 'dblclick',
          ((evt) =>
          {
            let pt = convertPoint(graph.container,
              mxEvent.getClientX(evt), mxEvent.getClientY(evt));
            let cell = graph.getCellAt(pt.x, pt.y);

            graph.dblClick(evt, cell);
          })
        );

        // Adds basic listeners for graph event dispatching outside of the
        // container and finishing the handling of a single gesture
        mxEvent.addGestureListeners(document,
          ((evt) =>
          {
            if (this.isContainerEvent(evt))
            {
              graph.popupMenuHandler.hideMenu();
            }
          }),
          ((evt) =>
          {
            // Hides the tooltip if mouse is outside container
            if (graph.tooltipHandler != null &&
              graph.tooltipHandler.isHideOnHover())
            {
              graph.tooltipHandler.hide();
            }

            if (this.captureDocumentGesture &&
              graph.isMouseDown &&
              !mxEvent.isConsumed(evt))
            {
              graph.fireMouseEvent(mxEvent.MOUSE_MOVE,
                new InternalMouseEvent(evt));
            }
          }),
          ((evt) =>
          {
            if (this.captureDocumentGesture)
            {
              graph.fireMouseEvent(mxEvent.MOUSE_UP,
                new InternalMouseEvent(evt));
            }
          })
        );
      }
    };
  </script>

  <!-- Example code -->
  <script type="text/javascript">
    // Program starts here. Creates a sample graph in the
    // DOM node with the specified ID. This function is invoked
    // from the onLoad event handler of the document (see below).
    function main(container)
    {
      // Checks if the browser is supported
      if (!mxClient.isBrowserSupported())
      {
        // Displays an error message if the browser is not supported.
        mxUtils.error('Browser is not supported!', 200, false);
      }
      else
      {
        // Creates the graph inside the given container
        let graph = new mxGraph(container);

        // Holds the current image
        let img = null;
        let loader = new Image();
        loader.src = 'images/loading.gif';
        loader.style.zIndex = 1;
        loader.style.visibility = 'hidden';
        loader.style.position = 'absolute';

        graph.container.insertBefore(loader, graph.container.firstChild);

        // Disables the DOM-based rendering in the graph and updates the
        // display image on each validation step using the Export servlet
        // on the graph
        graph.view.rendering = false;

        // Installs a post-validation repaint of the complete graph
        graph.view.validate = function()
        {
          loader.style.left = graph.container.scrollLeft + graph.container.clientWidth / 2 - 32;
          loader.style.top = graph.container.scrollTop + graph.container.clientHeight / 2 - 32;
          loader.style.visibility = 'visible';
          mxGraphView.prototype.validate.apply(this, arguments);

          var t0 = new Date().getTime();
          let bounds = graph.getGraphBounds();

          // Note that we send out an XML version of the view which
          // allows us to keep most customizations on the client-side.
          // No deltas are used here, the complete view is sent to the
          // server on each update.
          let node = mxUtils.getViewXml(graph, 1);
          let xml = encodeURIComponent(mxUtils.getXml(node));

          let onload = function(req)
          {
            let dt = (new Date().getTime() - t0) / 1000;
            //mxLog.debug('post returned after '+dt+' secs');

            if (req.getStatus() == 200)
            {
              let image =new Image();

              // Less flickering if the old image is removed after
              // the new image was received from the server
              image.onload = function()
              {
                if (img != null)
                {
                  img.parentNode.removeChild(img);
                }

                img = image;
                graph.container.insertBefore(img, graph.container.firstChild);
                loader.style.visibility = 'hidden';

                let dt = (new Date().getTime() - t0) / 1000;
                //mxLog.debug('received '+img.clientWidth+'x'+img.clientHeight+' pixels in '+dt+' secs');
                graph.setEnabled(true);
              };

              // URL contains timestamp to avoid caching in the browser
              image.src = '/ServerView?'+new Date().getTime();
              image.style.position = 'absolute';
              image.style.left = bounds.x - 4;
              image.style.top = bounds.y - 4;
              image.style.zIndex = -1;
            }
          };

          let onerror = function(req)
          {
            //mxLog.debug('error: '+req.getStatus());
          }

          //mxLog.debug('sent '+(xml.length/1024)+' KB');
          graph.setEnabled(false);
          new mxXmlRequest('/ServerView', 'xml='+xml).send(onload, onerror);
        };

        // Uncomment the following if you want the container
        // to fit the size of the graph
        //graph.setResizeContainer(true);

        // Enables rubberband selection
        new mxRubberband(graph);
        graph.setConnectable(true);
        graph.setPanning(true);
        graph.setTooltips(true);

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        let parent = graph.getDefaultParent();
        //mxLog.show();

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
  style="overflow:auto;width:500px;height:500px;border: black solid 1px;cursor:default;">
</div>
<br>
<strong>Important:</strong>
<p>
  To use this example, start com.mxgraph.examples.web.Main in Java
  and point your<br>browser to:
  <a href="http://localhost:8080/mxgraph/javascript/examples/serverview.html">http://localhost:8080/mxgraph/javascript/examples/serverview.html</a>
</p>
</body>
</html>
