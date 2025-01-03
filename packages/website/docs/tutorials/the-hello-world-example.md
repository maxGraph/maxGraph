---
sidebar_position: 1
description: XXXX.
---

# The Hello World Example

:::note

This tutorial is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). \
It is adapted from the original [mxGraph tutorial](https://github.com/jgraph/mxgraph/blob/v4.2.2/docs/tutorial.html).

> Copyright 2021-present The maxGraph project Contributors \
Copyright (c) JGraph Ltd 2006-2017

:::


<h2><a id="HelloWorld"></a>Hello, World!</h2>
<p>
  The Hello, World! example of maxGraph ships in a
  single <a href="../javascript/examples/helloworld.html">HTML file</a>,
  which contains the required namespaces, the mxGraph library script
  and the example code. The example can be viewed by pointing Firefox or
  Internet Explorer to the link above either on the local
  filesystem or on a webserver. To display the source of the example
  press Control-U in Firefox or click Page, View Source in Internet Explorer.
</p>


## Container

<p>
  For the JavaScript to actually render the graph, the page
  contains an DOM node which will display the graph. This
  DOM node is either dynamically created or it is obtained via
  an ID using <code>document.getElementById</code> as in the
  Hello, World! example. The DOM node is passed to the main
  function and is used to construct the graph instance as shown
  below.
</p>
<p>
  If you want the container to have scrollbars, use the `overflow:auto` CSS
  directive instead of overflow:hidden in the style of the container.
</p>
<h2><a id="Graph"></a>Graph</h2>
<p>
  The code constructs an empty graph model and passes the container
  and the empty model to the graph constructor. For this example,
  all default event handling is disabled in the last line.
</p>

```javascript
const model = new GraphDataModel();
const graph = new Graph(container, model);
```

<p>
	If you want the graph to be read-only you can use <code>graph.setEnabled(false)</code>.
</p>

<h2><a id="VerticesAndEdges"></a>Vertices and Edges</h2>
<p>
  To insert vertices and edges, <code>beginUpdate</code> and <code>endUpdate</code>
  are used to create a transaction. The <code>endUpdate</code> should always go
  into a finally-block to make sure it is always executed if the <code>beginUpdate</code>
  was executed. However, the <code>beginUpdate</code> should not be part of the
  try-block to make sure <code>endUpdate</code> is never executed if <code>beginUpdate</code>
  fails. This is required for the model to remain in a consistent state, that is, for
  each call to <code>beginUpdate</code> there should always be exactly one call to
  <code>endUpdate</code>.
</p>
<p>
  The part within the try-block creates the vertices and edges for the graph.
  The default parent is obtained from the graph and is typically the first
  child of the root cell in the model, which is created automatically when
  using the graph model constructor with no arguments.
</p>

```javascript
// Gets the default parent for inserting new cells. This
// is normally the first child of the root (ie. layer 0).
let parent = graph.getDefaultParent();

// Adds cells to the model in a single step
model.beginUpdate();
try  {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    graph.insertEdge(parent, null, '', v1, v2);
}
finally {
    // Updates the display
    model.endUpdate();
}
```

<p>
  The use of <code>beginUpdate</code> and <code>endUpdate</code> does not
  only improve the display performance, but it is also used to mark the
  boundaries for undoable changes when undo/redo is used.
</p>
