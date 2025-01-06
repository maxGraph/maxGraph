---
sidebar_position: 3
description: Learn how to use the maxGraph Editor.
---

# Editor

:::warning

The content of this page is a **work in progress**.
The original `mxGraph` tutorial was used to create this page which still contains `mxGraph` class diagrams to migrate to the maxGraph API.

:::

:::note

This tutorial is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). \
It is adapted from the original [mxGraph tutorial](https://github.com/jgraph/mxgraph/blob/v4.2.2/docs/tutorial.html).

> Copyright 2021-present The maxGraph project Contributors \
Copyright (c) JGraph Ltd 2006-2017

:::


Instantiate [Editor](https://maxgraph.github.io/maxGraph/api-docs/classes/Editor.html) in order to create an editor.
This is the central class in the editor package. Everything else in this package is auxiliary.

To create a new editor instance and configure it using a config file, you can pass the name of the config file to the
[Editor constructor](https://maxgraph.github.io/maxGraph/api-docs/classes/Editor.html).

![Class diagram showing the Editor class hierarchy and its relationships](assets/graphs/editor.png)

To create a new editor instance and configure it, the following code is used:

```javascript
import { load } from '@maxgraph/core';
const config = load('editors/config/keyhandler-commons.xml').getDocumentElement();
const editor = new Editor(config);
```

The configuration file is an XML file that is passed to [Codec](https://maxgraph.github.io/maxGraph/api-docs/classes/Codec.html),
which in turn uses [EditorCodec](https://maxgraph.github.io/maxGraph/api-docs/classes/EditorCodec.html) and others to read the XML into the editor object hierarchy.

This is normally done at startup time to configure the editor, graph, model, toolbar, popupmenus, etc. using the [I/O subsystem](./editor-input-output.md).


<a id="CSS"></a>
## CSS

The CSS stylesheet contains the style definitions for various elements of the user interface, such as the rubberband selection,
the in-place editor or the popup menu.

Additional stylesheets may either be added via a stylesheet tag of the UI section in the editor configuration, e.g.:


```xml
<Editor>
  <ui>
    <stylesheet name="examples/editors/css/process.css"/>
  </ui>
</Editor>
```


<a id="Templates"></a>
## Templates

To add new cell types, create a template in the templates array section of the model in the config file (Editor/Graph/GraphDataModel/Array[as=templates]) as follows:

```xml
<add as="symbol">
  <Symbol label="Symbol" customAttribute="whatever">
    <Cell vertex="1" connectable="true">
      <Geometry as="geometry" width="32" height="32"/>
      <Object fillColor="green" image="images/event.png" as="style">
        <Array as="baseStyleNames">
          <add value="symbol" />
        </Array>
      </Object>        
    </Cell>
    <CustomChild customAttribute="whatever"/>
  </Symbol>
</add>
```

The `as`-attribute of the `add`-element contains the name under which the template will be accessible for later use.
The `Symbol`-child element is a custom (ie workflow) element, and can have any name and any number of child elements and custom attributes.

The label attribute is a special one that is used for the textual representation of the cell in the graph.
The `Cell` element is another special child node which contains the graphical information for the cell, namely, the cell-type, -style, -size and -position.

See `Graph.convertValueToString` if you would like to use another attribute or a combination of attributes for the textual representation,
and `Cell.valueChanged` to handle in-place editing by storing the new text value in the respective attribute(s).


<a id="Toolbar"></a>
## Toolbar


To use the template in the graph, a toolbar item must be added which refers to the template in the `DefaultToolbar` section
of the config file (Editor/DefaultToolbar[as=toolbar]) as follows:

```xml
<add as="symbolTool" template="symbol"
  style="symbol;image=wf/images/bpmn/special_event.png"
  icon="wf/images/bpmn/small_event.gif"/>
```

The `as` attribute specifies the tooltip to be displayed for the icon in the toolbar, the `template`-attribute refers to the name under which the template was previously added.
The `style`- attribute is optional, and may be used to override the style defined in the template definition.
Finally, the icon specifies the icon to be used for the toolbar item.

Note that the `as` attribute is assumed to be the key for a language resource, in this case `symbolTool`.
If the resource is not defined in [Translations resources](https://maxgraph.github.io/maxGraph/api-docs/classes/Translations.html#resources), then the attribute value is used as the label.
