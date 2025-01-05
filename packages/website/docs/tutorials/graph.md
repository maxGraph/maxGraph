---
sidebar_position: 2
description: XXXX.
---

# Graph

:::note

This tutorial is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). \
It is adapted from the original [mxGraph tutorial](https://github.com/jgraph/mxgraph/blob/v4.2.2/docs/tutorial.html).

> Copyright 2021-present The maxGraph project Contributors \
Copyright (c) JGraph Ltd 2006-2017

:::


<p>
  Instantiate <a href="js-api/files/view/mxGraph-js.html">mxGraph</a>
  in order to create a graph. This is the central class in the API.
  Everything else is auxiliary.
</p>

![](assets/graphs/graph.png)

<p>
  To create a new graph instance, a DOM node (typically a DIV) is
  required:
</p>


```javascript
const node = document.getElementById('id-of-graph-container');
const graph = new mxGraph(node);
```

<h2><a id="Model"></a>Model</h2>
<p>
  <a href="js-api/files/model/mxCell-js.html">mxCell</a> defines the
  elements of the graph model, which is implemented by
  <a href="js-api/files/model/mxGraphModel-js.html">mxGraphModel</a>.
</p>

![](assets/graphs/model.png)



<p>
  The graph model has the following properties:
</p>
<ul>
  <li>
    The root element of the graph contains the layers.
    The parent of each layer is the root element.
  </li>
  <li>
    A layer may contain elements of the graph model,
    namely vertices, edges and groups.
  </li>
  <li>
    Groups may contain elements of the graph model,
    recursively.
  </li>
</ul>
<p>
  The graph and structural information is stored in the cells, as well as the
  <i>user objects</i>, which are used to store the <i>value</i> associated with
  the cells (aka business objects).
</p>
<p>
  To create a new graph model with a root cell and a default layer (first child):
</p>

```javascript
const root = new Cell();
root.insert(new Cell());
const model = new GraphDataModel(root);
```


<h2><a id="Stylesheet"></a>Stylesheet</h2>
<p>
  The appearance of the cells in a graph is defined by the
  stylesheet, which is an instance of
  <a href="js-api/files/view/mxStylesheet-js.html">mxStylesheet</a>.
  The stylesheet maps from stylenames to styles.
  A style is an array of key, value pairs to be
  used with the cells. The keys are defined in
  <a href="js-api/files/util/mxConstants-js.html">mxConstants</a> and the values may be
  strings and numbers or JavaScript objects or functions.
</p>
<p>
  To modify the default styles for vertices and edges in an existing graph:
</p>

```javascript
let vertexStyle = graph.getStylesheet().getDefaultVertexStyle();
vertexStyle[mxConstants.STYLE_ROUNDED] = true;

let edgeStyle = graph.getStylesheet().getDefaultEdgeStyle();
edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
```


<h2><a id="Styles"></a>Styles</h2>
<p>
  The style information for a cell is stored in <code>cell.style</code>.
  The style is part of the cell's state and is normally changed via
  <code>mxGraphModel.setStyle</code>, which will update all views.
  The cell style is a string of the form
</p>
<pre>
[stylename;|key=value;]
</pre>
<p>
  which tells the graph to use the given named styles and override the
  specified key, value pairs in the given order. For example, to use the
  <a href="js-api/files/view/mxStylesheet-js.html#mxStylesheet.putCellStyle">rounded</a>
  style and override the stroke- and fillColor, the style would be defined as:
</p>
<pre>
rounded;strokeColor=red;fillColor=green
</pre>
<p>
  To use the above in Hello, World!, the stylename would be passed to the
  insertVertex method as follows:
</p>
<pre>
var v1 = graph.insertVertex(parent, null, 'Hello',
  20, 20, 80, 30, 'rounded;strokeColor=red;fillColor=green');
</pre>
<h2><a id="Appearance"></a>Appearance</h2>
<p>
  In certain cases you may want to override specific attributes based on
  dynamic properties of a cell (ie. it's value, aka. userobject), such as
  the image, indicator shape, -image, -color or -gradient color), in
  which case you can override <code>getImage</code>,
  <code>getIndicatorShape</code>, <code>getIndicatorImage</code>,
  <code>getIndicatorColor</code> and <code>getIndicatorGradientColor</code>
  respectively. Note that these methods take a cell state as an argument,
  which points to a "resolved" (that is, an array) version of the
  cell's style. Hence, the default implementation for <code>getImage</code>
  looks as follows:
</p>

```javascript
mxGraph.prototype.getImage = function(state)
{
  if (state != null &amp;&amp; state.style != null)
  {
    return state.style[mxConstants.STYLE_IMAGE];
  }
  return null;
}
```

<p>
  This method may be overridden to return any image for the given state.
  Typically, the image is defined by either <code>state.cell</code>,
  which points to the graph cell associated with the state, or by
  <code>state.cell.value</code>, which refers to the cell's user object.
</p>
<p>
  Due to the nature of the display, where all cells are created once and
  updated only if the model fires a notification for a change, you must
  invoke <code>view.invalidate(cell)</code> for each cell whose image
  has changed, and call <code>view.validate</code> to update the display.
</p>

