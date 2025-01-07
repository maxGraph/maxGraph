---
sidebar_position: 3
description: An overview of the maxGraph model and transactions.
toc_max_heading_level: 6
# TODO rename the file and add redirect if possible
---

# Model and Transactions

:::note

This manual is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). \
It is adapted from the original [mxGraph manual](https://github.com/jgraph/mxgraph/blob/v4.2.2/docs/manual.html).

> Copyright 2021-present The maxGraph project Contributors \
Copyright (c) JGraph Ltd 2006-2020

:::


## The `maxGraph` Model

The `maxGraph` model is the core model that describes the structure of the graph, the class is called GraphModel and is found within the model package.
Additions, changes and removals to and from the graph structure take place through the graph model API.
The model also provides methods to determine the structure of the graph, as well as offering methods to set visual states such as visibility, grouping and style.

However, although the transactions to the model are stored on the model, `maxGraph` is designed in such a way that the main public API is through the `maxGraph` class. 
The concept of "add this cell to the graph" is a more natural description of the action than "add this cell to the model of the graph".
Where it is intuitive, functions available on the model and cells are duplicated on the graph and those methods on the graph class are considered the main public API.

So, though many of the main API calls are through the `maxGraph` class, keep in mind that `GraphDataModel` is the underlying object that stores the data structure of your graph.

`maxGraph` uses a transactional system for making changes to the model. In the [HelloWorld example](../tutorials/the-hello-world-example.md) we saw this code that performs the insertion of the 2 vertices and 1 edge:

```javascript
// Adds cells to the model in a single step
graph.getModel().beginUpdate();
try {
   const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
   const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
   graph.insertEdge(parent, null, '', v1, v2);
}
finally {
   // Updates the display
   graph.getModel().endUpdate();
}
```

For each change to the model you make a call to `beginUpdate()`, make the appropriate calls to change the model, then call `endUpdate()` to finalize the changes and have the change event notifications sent out.

**Key API Methods:**
  - **GraphModel.beginUpdate()** - starts a new transaction or a sub-transaction.
  - **GraphModel.endUpdate()** - completes a transaction or a sub-transaction.
  - **Graph.addVertex()** - Adds a new vertex to the specified parent cell.
  - **Graph.addEdge()** - Adds a new edge to the specified parent cell.


:::note

Technically you do not have to surround your changes with the _begin_ and _end_ update calls.
Changes made outside of this update scope take immediate effect and send out the notifications immediately.

In fact, changes within the update scope enact on the model straight away, the update scope is there to control the timing and concatenation of event notifications.
Unless the update wrapping causes code aesthetic issues, it is worth using it by habit to avoid possible problems with event and undo granularity.
:::


Note the way in which the model changes are wrapped in a try block and the `endUpdate()` in a "finally" block.
This ensures the update is completed, even if there is an error in the model changes.
You should use this pattern wherever you perform model changes for ease of debugging.

Ignore the reference to the `parent` cell for now, that will be explained later in this chapter.


## The Transaction Model

The sub-transaction in the blue block above refers to the fact that transactions can be nested.
That is, there is a counter in the model that increments for every `beginUpdate` call and decrements for every `endUpdate` call.
After increasing to at least 1, when this count reaches 0 again, the model transaction is considered complete and the event notifications of the model change are fired.

This means that every sub-contained section of code can (and should) be surrounded by the begin/end combination.
This provides the ability in `maxGraph` to create separate transactions that be used as "library transactions",
the ability to create compound changes and for one set of events to be fired for all the changes and only one undo created.
Automatic layouting is a good example of where the functionality is required.

In automatic layouting, the user makes changes to the graph, usually through the user interface, and the application automatically positions the result according to some rules.
The automatic positioning, the layouting, is a self-contained algorithm between begin/end update calls that has no knowledge of the specifics of the change.
Because all changes within the begin/end update are made directly to the graph model, the layout can act upon the state of the model as the change is in progress.

It is important to distinguish between functionality that acts on the graph model as part of a compound change and functionality that reacts to atomic graph change events.
In the first case, such as for automatic layouting, the functionality takes the model as-is and acts upon it.
This method should only be used for parts of compound model changes.
All other parts of the application should only react to model change events.

Model change events are fired when the last endUpdate call reduces the counter back down to 0 and indicate that at least one atomic graph change has occurred.
The change event contains complete information as to what has altered (see later section on **Events** for more details).


## The Model Change Methods

Below is a list of the methods that alter the graph model and should be placed, directly or indirectly, with the scope of an update:

- add(parent, child, index)
- remove(cell)
- setCollapsed(cell, collapsed)
- setGeometry(cell, geometry)
- setRoot(root)
- setStyle(cell, style)
- setTerminal(cell, terminal, isSource)
- setTerminals(edge,source,target)
- setValue(cell, value)
- setVisible(cell, visible)

Initially, we will just concern ourselves with the add and remove, as well as the geometry and style editing methods.
Note that these are not core API methods, as usual these methods are on the `maxGraph` class, where appropriate, and they perform the update encapsulation for you.

:::info

**Design Background** \
Some people are confused by the presence of visual information being stored by the model.
These attributes comprise cell positioning, visibility and collapsed state.
The model stores the default state of these attributes, providing a common place to set them on a per-cell basis, whereas, views can override the values on a per-view basis.

The model is simply the first common place in the architecture where these attributes can be set on a global basis.
Remember, this is a graph <em>visualization</em> library, the visualization part is the core functionality
:::


## Inserting Cells

The three graph cells created in the [HelloWorld example](../tutorials/the-hello-world-example.md) are two vertices and one edge connecting the vertices.
If you are not familiar with basic graph theory and its terminology, please see the [Graph Theory wikipedia entry](http://en.wikipedia.org/wiki/Graph_theory).

You can add vertices and edges using the `add()` method on the model.
However, for the purposes of general usage of this library, learn that `Graph.insertVertex()` and `Graph.insertEdge()` are the core public API for adding cells.
The function of the model requires that the cell to be added is already created, whereas the `Graph.insertVertex()` creates the cell for you.

**Core API functions:**

- **Graph.insertVertex(parent, id, value, x, y, width, height, style)** - creates and inserts a new vertex into the model, within a begin/end update call.
- **Graph.insertEdge(parent, id, value, source, target, style)** - creates and inserts a new edge into the model, within a begin/end update call.


`Graph.insertVertex()` will create an `Cell` object and return it from the method used. The parameters of the function are:
- `parent`: the cell which is the immediate parent of the new cell in the group structure.
We will address the group structure shortly, but for now use `graph.getDefaultParent()` as your default parent, as used in the HelloWorld example.
- `id`: this is a global unique identifier that describes the cell, it is always a string. This is primarily for referencing the cells in the persistent output externally.
If you do not wish to maintain ids yourself, pass null into this parameter and ensure that GraphDataModel.isCreateIds() returns true. This way the model will manage the ids and ensure they are unique.
- `value`: this is the user object of the cell. User object are simply that, just objects, but form the objects that allow you to associate the business logic of an application with the visual representation of `maxGraph`.
They will be described in more detail later in this manual, however, to start with if you use a string as the user object, this will be displayed as the label on the vertex or edge.
- `x, y, width, height`: as the names suggest, these are the x and y position of the top left corner of the vertex and its width and height.
- `style`: the style description to be applied to this vertex. Styles will be described in more detail shortly, but at a simple level this parameter is a string that follows a particular format.
In the string appears zero or more style names and some number of key/value pairs that override the global style or set a  new style.
Until we create custom styles, we will just use those currently available.

With the edge addition method, the identically named parameters perform the same function as in the vertex addition method.
The source and target parameters define the vertices to which the edge is connected.
Note that the source and target vertices should already have been inserted into the model.
