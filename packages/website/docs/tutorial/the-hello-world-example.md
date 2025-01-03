---
sidebar_position: 1
description: XXXX.
---

# The Hello World Example


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
<pre>
const model = new GraphDataModel();
const graph = new Graph(container, model);
</pre>
<p>
	If you want the graph to be read-only you can use <code>graph.setEnabled(false)</code>.
</p>
