# High-level API description
TODO find the right title for this document

The following comes from `Graph` and needs to be updated to reflect the current state of `maxGraph`.

From https://github.com/jgraph/graph/blob/v4.2.2/javascript/src/js/index.txt


## Overview

This JavaScript library is divided into 8 packages.

The current version is stored in `Client.VERSION`.

The *editor* folder provides the classes required to implement a diagram editor.
The main class is `Editor`.

The *view* and *model* packages implement the graph component, represented
  by `Graph`. It refers to a `GraphDataModel` which contains `Cell`s and
  caches the state of the cells in a `GraphView`.
   The cells are painted using a `CellRenderer` based on the appearance defined in `Stylesheet`.
  Undo history is implemented in `UndoManager`.

   To display an icon on the graph, `CellOverlay` may be used.
   Validation rules are defined with `Multiplicity`.

  The *handler*, *layout* and *shape* packages contain event listeners,
  layout algorithms and shapes, respectively.

// no longer true, plugins and GraphHandler has been renamed
  The graph event listeners
  include `Rubberband` for rubberband selection, `TooltipHandler`
  for tooltips and `GraphHandler` for  basic cell modifications.


  `CompactTreeLayout` implements a tree layout algorithm, and the
  shape package provides various shapes, which are subclasses of `Shape`.

  The *util* package provides utility classes including `Clipboard` for
  copy-paste, `Datatransfer` for drag-and-drop,

   `Constants` for keys and values of stylesheets,

  `Event` and `Utils` for cross-browser
  event-handling and general purpose functions, `Resources` for
  internationalization and `MaxLog` for console output.

The *serialization* package implements a generic `ObjectCodec` for turning JavaScript objects into XML.
- The main class is `Codec`.
- `CodecRegistry` is the global registry for custom codecs.


## Events

There are three different types of events, namely native DOM events,
`EventObjects` which are fired in an `EventSource`, and `MouseEvents` which are fired in `Graph`.

Some helper methods for handling native events are provided in `Event`.
It  also takes care of resolving cycles between DOM nodes and JavaScript event handlers.

  Most custom events in Graph are implemented using `EventSource`. Its
  listeners are functions that take a sender and `EventObject`. Additionally,
  the `Graph` class fires special `MouseEvents` which are handled using
  mouse listeners, which are objects that provide a mousedown, mousemove and
  mouseup method.

  Events in `EventSource` are fired using `EventSource.fireEvent`.
  Listeners are added and removed using `EventSource.addListener` and
  `EventSource.removeListener`. `MouseEvents` in `Graph` are fired using
  `Graph.fireMouseEvent`. Listeners are added and removed using
  `Graph.addMouseListener` and `Graph.removeMouseListener`, respectively.


## Key bindings

  The following key bindings are defined for mouse events in the client across
  all browsers and platforms:

  - Control-Drag: Duplicates (clones) selected cells
  - Shift-Right-click: Shows the context menu
  - Alt-Click: Forces rubberband (aka. marquee)
  - Control-Select: Toggles the selection state
  - Shift-Drag: Constrains the offset to one direction
  - Shift-Control-Drag: Panning (also Shift-Right-drag)


## Configuration

  The following global variables may be defined before the client is loaded to
  specify its language or base path, respectively.

  - BasePath: Specifies the path in `Client.basePath`.
  - ImageBasePath: Specifies the path in `Client.imageBasePath`.
  - Language: Specifies the language for resources in `Client.language`.
  - DefaultLanguage: Specifies the default language in `Client.defaultLanguage`.
  - LoadResources: Specifies if any resources should be loaded. Default is true.
  - LoadStylesheets: Specifies if any stylesheets should be loaded. Default is true.


## Reserved Words

The __ prefix was used for all classes and objects in Graph. Some remains in some properties of objects and classes defined in `maxGraph`.
The following field names should not be used in objects:

- *ObjectId*: If the object is used with ObjectIdentity
- *as*: If the object is a field of another object
- *id*: If the object is an idref in a codec
- *ListenerList*: Added to DOM nodes when used with `Event`


## Files

The library contains these relative filenames. All filenames are relative to `Client.basePath`.

### Built-in Images

  All images are loaded from the `Client.imageBasePath`,
  which you can change to reflect your environment. The image variables can
  also be changed individually.

  - collapsedImage
  - expandedImage
  - warningImage
  - closeImage
  - minimizeImage
  - normalizeImage
  - maximizeImage
  - resizeImage
  - submenuImage
  - Utils.errorImage
  - pointImage

The basename of the warning image (images/warning without extension) used in `Graph.setCellWarning` is defined in `Graph.warningImage`.


### Translations

The `Editor` and `Graph` classes add the following resources to `Resources` at class loading time:

- resources/editor*.properties
- resources/graph*.properties

By default, the library ships with English and German resource files.


## Images

The following comes from `Graph` and needs to be updated to reflect the current state of `maxGraph`.

### Recommendations for using images

Use GIF images (256 color palette) in HTML elements (such as the toolbar and context menu),
and PNG images (24 bit) for all images which appear inside the graph component.

### Image rendering

For faster image rendering during application runtime, images can be prefetched using the following code:

```javascript
const image = new ImageBox();
image.src = url_to_image;
```
