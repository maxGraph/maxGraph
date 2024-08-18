---
sidebar_position: 1
description: maxGraph at a glance.
---

# Introduction

:::warning

The content of this page is a work in progress. The original `mxGraph` manual is progressively migrated here.

Original documentation: [Introduction (mxGraph)](https://jgraph.github.io/mxgraph/docs/manual.html#1)

:::


:::note

This manual is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). \
It is adapted from the original [mxGraph manual](https://github.com/jgraph/mxgraph/blob/v4.2.2/docs/manual.html).

> Copyright 2021-present The maxGraph project Contributors \
Copyright (c) JGraph Ltd 2006-2020

:::


## Product Introduction

`maxGraph` is a JavaScript component that provides features aimed at applications that display
interactive <a href="http://en.wikipedia.org/wiki/Diagram">diagrams</a>
and graphs. Note by graphs we mean <a
	href="http://en.wikipedia.org/wiki/Graph_(mathematics)">mathematical
graphs</a>, not necessarily <a href="http://en.wikipedia.org/wiki/Charts">charts</a>
(although some charts are graphs). See later section &ldquo;What is a
Graph?&rdquo; for more details.

Being a developer library, `maxGraph` is not designed specifically
to provide a ready to use application, although many of the examples are
close to being usable applications. `maxGraph` provides all the commonly
required functionality to draw, interact with and associate a context
with a diagram. `maxGraph` comes with a number of examples that help explain how a
basic application is put together and showcases
individual features of the library.

[//]: # (TODO link for bellow)
Developers integrating the library in their application should
read the section
&ldquo;Pre-requisites&rdquo; below. Given that `maxGraph` is a component
part of your application, you must understand how JavaScript web
applications are constructed at an architectural level, and how to program
both in JavaScript, as well as any server-side languages used.

[//]: # (TODO review this paragraph)
`maxGraph` mainly comprises one JavaScript
file that contains all the `maxGraph` functionality. This is loaded into
a HTML web page in a JavaScript section and executes in an HTML
container in the browser. This is an incredibly simple architecture that
only requires a web server capable of serving html pages and a
JavaScript enabled web browser.

The key advantages of this technology are:
- That no third-party plug-ins are required. This removes
plug-in vendor dependence.
- The technologies involved are open and there are many open
implementations, no one vendor can remove a product or technology that
leaves your application unworkable in practise.
- Standardized technologies, meaning your application is
deployable to the maximum number of browser users without need for
additional configuration or installation at the client computer. Large
corporate environments often dislike allowing individuals to install
browser plug-ins and do not like to change the standard build rolled
out to all machines.

<a id="mxgraph_applications"></a>
## What Applications can `maxGraph` be used for?

Example applications for a graph visualization library include:
process diagrams, workflow and BPM visualization, flowcharts, traffic or
water flow, database and WWW visualization, networks and
telecommunications displays, mapping applications and GIS, UML diagrams,
electronic circuits, VLSI, CAD, financial and social networks, data
mining, biochemistry, ecological cycles, entity and cause-effect
relationships and organisational charts.

[//]: # ()
[//]: # (<h2><a id="mxgraph_deployment"></a>How is `maxGraph` deployed?</h2>)

[//]: # ()
[//]: # (<p>In the typical thin-client environment, `maxGraph` is split into the)

[//]: # (client-side JavaScript library and a server-side library in one of the)

[//]: # (two supported languages, .NET and Java. The JavaScript library is)

[//]: # (contained as part of a larger web application that is delivered to the)

[//]: # (browser using a standard web server. All the browser needs is the)

[//]: # (ability to run JavaScript to be enabled.</p>)

[//]: # ()
[//]: # (<p>In the third part of this manual, you will see an example of an)

[//]: # (html page that embeds the `maxGraph` library, as well as a simple)

[//]: # (application to invoke the library's functionality.</p>)


## `maxGraph` Technologies


`maxGraph` uses JavaScript for the client-side functionality on the 
browser. The JavaScript code in turn uses the underlying vector graphics
language on the active browser to render the displayed diagram, currently SVG
for all supported browsers.

[//]: # (`maxGraph` also includes the feature to render entirely)

[//]: # (using html, this limits the range of functionality available, but is)

[//]: # (suitable for more simple diagrams.</p>)


As a developer you are not exposed to browser specific features.
As mentioned, the vector graphics language varies by browser, so `maxGraph`
abstracts their features into a common class. Similarly, for event
handling and DOMs. Browsers differ in their implementation of these two
major browser functionalities, `maxGraph` exposes a constant API over all
browsers and adapts to the inconsistencies behind the scenes.

## Licensing

`maxGraph` is licensed under the 
<a href="https://www.apache.org/licenses/LICENSE-2.0"> Apache
2.0 license</a>. For detailed licensing questions you are always advised to
consult a legal professional.


## What is a Graph?


Graph visualization is based on the mathematical theory of
networks, graph theory. If you're seeking JavaScript bar <em>charts</em>,
pie <em>charts</em>, Gantt <em>charts</em>, have a look at the <a
	href="http://code.google.com/apis/chart/">Google Charts</a> project
instead, or similar.

A graph consists of vertices, also called nodes, and of edges
(the connecting lines between the nodes). Exactly how a graph appears
visually is not defined in graph theory. The term <em>cell</em> will be
used throughout this manual to describe an element of a graph, either
edges, vertices or groups.

![image](assets/intro/graph_simple.png)

_A simple Graph_

<br/>


[//]: # (TODO need to add a link to appendices)
There are additional definitions in graph theory that provide
useful background when dealing with graphs, they are listed in the
Appendices if of interest to you.

### Graph Visualization


Visualization is the process of creating a useful visual
representation of a graph. The scope of visualization functionality is
one of `maxGraph`s' main strength. `maxGraph` supports a wide range of
features to enable the display of cells to only be limited by the skill
of the developer and the platform functionality available. Vertices may
be shapes, images, vector drawing, animations, virtually any graphical
operations available in browsers. You can also use HTML mark-up in both
vertices and edges.

![Graph Visualization](assets/intro/graph_visualization.png)

_Graph Visualization of a transport system. (c) Tourizm Maps 2003, http://www.world-maps.co.uk_

### Graph Interaction

Interaction is the way in which an application using `maxGraph` can
alter the graph model through the web application GUI. `maxGraph` supports
dragging and cloning cells, re-sizing and re-shaping, connecting and
disconnecting, dragging and dropping from external sources, editing cell
labels in-place and more. One of the key benefits of `maxGraph` is the
flexibility of how interaction can be programmed.

Many complex graphical web applications rely on a round-trip to
the server in order to form the display, not only the base display but
also the interaction events. Although this is often given the title of
AJAX functionality, such server reliance is not appropriate for
interaction events. Visual feedback taking longer than about 0.2 seconds
in an application generally seriously impacts the usability. By placing
all of the interaction on the client, `maxGraph` provides the true feel of
an application, rather than seeming like a dumb remote terminal. It also
allows the possibility of off-line use.

![Graph Interaction](assets/intro/graph_interaction.png)

_Selection shading while selecting an area through mouse drag_



### Graph Layouts

Graph cells can be drawn anywhere in a simple application,
including on top of one another. Certain applications need to present
their information in a generally ordered, or specifically ordered
structure. This might involve ensuring cells do not overlap and stay at
least a certain distance from one another, or that cells appear in
specific positions relative to other cells, usually the cells they are
connected to by edges. This activity, called the layout application, can
be used in a number of ways to assist users in setting out their graph.
For non-editable graphs, layout application is the process of applying a
layout algorithm to the cells. For interactive graphs, meaning those
that can be edited through the UI, layout application might involve only
allowing users to make changes to certain cells in certain positions, to
re-apply the layout algorithm after each change to the graph, or to
apply the layout when editing is complete.

![Graph Layout](assets/intro/graph_layout.png)

_Layout of a workflow using a horizontal hierarchical layout_


`maxGraph` supports a range of tree, force-directed and hierarchical
layouts which will fit most layout needs. See the later section on using
the layouts for more information.


[//]: # (TODO decide if we need to keep this section)
[//]: # (<p>In a client-server architecture there are two options for how)

[//]: # (layouts can be run. The Javascript versions provide the ability to run)

[//]: # (the layouting entirely on the client, while the same layout)

[//]: # (implementation in Java on the server-side enables the option to offload)

[//]: # (some processing to the server, if required.</p>)


### Graph Analysis

Analysis of graphs involves the application of algorithms
determining certain details about the graph structure, for example,
determining all routes or the shortest path between two cells. There are
more complex graph analysis algorithms, these being often applied in
domain specific tasks. Techniques such as clustering, decomposition, and
optimization tend to be targeted at certain fields of science and have
not been implemented in the core `maxGraph` packages at the current time of
writing.

![Graph Analysis: shortest path analysis](assets/intro/graph_analysis.jpg)

_Shortest Path Analysis_


## About this Manual

### Pre-requisites for `maxGraph`

To benefit fully from this manual you will need to have a
reasonable understanding of web applications and of the server
technology you wish to deploy using. Deployment examples are available
for each of the server technologies supported, some familiarity with
that server technology is obviously required.

Basic XML knowledge is useful for changing the editor
configuration files that describe the visual and behavioural aspects of
the editor. You will need to understand and implement Javascript coding
and be familiar with object orientated programming principles and modern
software design.

You do not need knowledge of the underlying vector graphics
language that the browser uses, such as SVG or HTML canvas. `maxGraph`
abstracts the description of the visual component into one API.
