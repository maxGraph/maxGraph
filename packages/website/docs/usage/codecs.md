---
sidebar_position: 6
description: How-to use codecs.
---

# Codecs

TODO
- review the order in the sidebar
- name: XML serialization? Codecs and Serialization?
- add an intro
- move the warning to the registering paragraph
- link to the codec API class provides other examples



:::warning

From [version 0.6.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.6.0) of `maxGraph`, codecs supplied by maxGraph are no longer registered by default, they **MUST** be registered before performing an `encode` or `decode`

For example:
- You can use the `registerModelCodecs` function (or other related functions) to register the Model codecs.
- To serialize the `maxGraph` model, you can use the `ModelXmlSerializer` class, which registers codecs under the hood and provide a simpler syntax.

:::


## Example with a custom object

:::note

This paragraph is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). \
It is adapted from the original [mxGraph tutorial](https://github.com/jgraph/mxgraph/blob/v4.2.2/docs/tutorial.html).

> Copyright 2021-present The maxGraph project Contributors \
Copyright (c) JGraph Ltd 2006-2020

:::


The default encoding scheme maps all non-object fields to string attributes and all object fields to child nodes, using the constructor
name of the object as the node name and the field name for the as-attribute value.
This default encoding scheme may be overridden by custom codecs, which are registered in the `CodecRegistry`.

For example, consider the following JavaScript object definition:
```typescript
const object = {
    myBool: true,
    myObject: {
        name: 'Test'
    },
    myArray: ['a', ['b', 'c'], 'd']
};
```

To encode/export this object and show the resulting XML in a new window, the following code is used:

```typescript
import { Codec, popup } from '@mxgraph/core';

const encoder = new Codec();
const node = encoder.encode(object);
popup(mxUtils.getXml(node));
```


And here is the XML structure that represents the object:
```xml
<Object myBool="1">
  <Object name="Test" as="myObject"/>
  <Array as="myArray">
    <add value="a"/>
    <Array>
      <add value="b"/>
      <add value="c"/>
    </Array>
    <add value="d"/>
  </Array>
</Object>
```

Note that the codecs will turn booleans into numeric values, no array indices are stored if they are numeric and non-object
array members are stored inside the value-attribute.
Furthermore, one may include other XML files by use of the `include` directive in the XML structures.


## Registering Codecs

To register codecs, you can use the `registerModelCodecs` function, which registers the codecs for the `maxGraph` model.

list of function here

### Registering custom codecs


## Encoding and Decoding

also named import/export
To encode and decode data, you can use the `encode` and `decode` functions.

TODO example

### ModelXmlSerializer

TODO rationale (cf PR which introduced it)

## Other serialization methods

XmlCanvas2D 

purpose ImageExport, ....
