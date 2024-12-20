---
sidebar_position: 10
description: How-to use codecs.
---

# Codecs

## Introduction

The `Codec` feature is used for serialization and deserialization of objects in XML format.
It can be used to export/encode and import/decode `maxGraph` data, for example to save and load the state of graphs or the configuration of a graph.
- export/encode: convert a `maxGraph` object to an XML string
- import/decode: convert an XML string to a `maxGraph` object

The serialization/deserialization process is based on `Codec` classes that maps the maxGraph objects to XML nodes and attributes.
The codecs are registered in the `CodecRegistry` to let `maxGraph` knows how to map a class to its related `Codec`.


## Codecs registration

The use of codecs requires to register the codecs for the classes you want to encode/decode prior using a `Codec`.

`maxGraph` provides several functions to register the codecs provided out of the box:
- [registerAllCodecs](https://maxgraph.github.io/maxGraph/api-docs/functions/registerAllCodecs.html)
- [registerCoreCodecs](https://maxgraph.github.io/maxGraph/api-docs/functions/registerCoreCodecs.html)
- [registerEditorCodecs](https://maxgraph.github.io/maxGraph/api-docs/functions/registerEditorCodecs.html)
- [registerModelCodecs](https://maxgraph.github.io/maxGraph/api-docs/functions/registerModelCodecs.html)

:::warning

From [version 0.6.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.6.0) of `maxGraph`, codecs supplied by `maxGraph` are no longer registered by default, they **MUST** be registered before performing an `encode` or `decode`

Registering codecs has an impact on the tree-shaking, so, only register the codecs you need to reduce the size of the final bundle.
:::


## Encoding/Export and Decoding/Import

To encode and decode data, you can use the `encode` and `decode` functions.

```typescript
import { Codec, popup, xmlUtils } from '@mxgraph/core';

// encode/export
const object = ....; // your object
const encoder = new Codec();
const node = encoder.encode(object);
const encodedXml = xmlUtils.getPrettyXml(result);

// decode/import
const xml = ...; // your XML string
const decoder = new Codec();
const doc = xmlUtils.parseXml(input);
new Codec(doc).decode(doc.documentElement, object);
```


## Special support of the GraphDataModel

### `ModelXmlSerializer`

As explained above, the typical usage of the `Codec` class requires
- to register the codecs for the classes you want to encode/decode, here with `registerModelCodecs`
- to call the `encode` or `decode` method

To simplify the process of encoding and decoding the `GraphDataModel`, the `ModelXmlSerializer` class is provided.
It registers codecs under the hood and provide a simpler syntax.

The code becomes:

```typescript
import { GraphDataModel, ModelXmlSerializer } from '@mxgraph/core';

const model = new GraphDataModel();
const serializer = new ModelXmlSerializer(model);

// import/decode
const xml = ...; // your XML string
serializer.import(xml);

// export/encode
const exportedXml = serializer.export();
```


### import/decode mxGraph models

`maxGraph` provides a special support to import `mxGraph` models which you a different XML structure (mainly because the name of the class are prefixed by `mx` in `mxGraph`).

This allows interoperability with `draw.io/diagrams.net` and ease the migration from `mxGraph`.

Here is an example of how to import an `mxGraph` model:

```typescript
    const mxGraphModelAsXml = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" vertex="1" parent="1" value="Vertex #2">
      <mxGeometry x="380" y="20" width="140" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" vertex="1" parent="1" value="Vertex #3">
      <mxGeometry x="200" y="80" width="380" height="30" as="geometry">
        <mxPoint x="1" y="1" as="offset"/>
      </mxGeometry>
    </mxCell>
    <mxCell id="7" edge="1" source="2" target="3" parent="1" value="Edge #7">
      <mxGeometry as="geometry">
        <Array as="points">
          <Object x="420" y="60"/>
        </Array>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>
  `;

const model = new GraphDataModel();
new ModelXmlSerializer(model).import(mxGraphModelAsXml);
````

:::info
There is no support for export/encode mxGraph models
:::


## Troubleshooting

The most common error you may encounter when using Codecs is the "maximum call stack trace" error. It occurs when a class that you are trying to encode doesn't have a codec registered.

```
Uncaught RangeError: Maximum call stack size exceeded
    at ObjectCodec.writeAttribute (ObjectCodec.js:384:19)
    at ObjectCodec.encodeValue (ObjectCodec.js:376:22)
    at ObjectCodec.encodeObject (ObjectCodec.js:346:22)
    at ObjectCodec.encode (ObjectCodec.js:326:14)
    at Codec.encode (Codec.js:285:28)
    at ObjectCodec.writeComplexAttribute (ObjectCodec.js:415:27)
    at ObjectCodec.writeAttribute (ObjectCodec.js:389:18)
    at ObjectCodec.encodeValue (ObjectCodec.js:376:22)
    at ObjectCodec.encodeObject (ObjectCodec.js:346:22)
    at ObjectCodec.encode (ObjectCodec.js:326:14)
```

Generally, this error is thrown when you try to encode a class that is not registered in the `CodecRegistry`. To fix this error, you need to register the codec for the class.
Start by using one of the [_register_ functions](xx) provided by `maxGraph`.


## Using custom object and custom Codec

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
popup(xmlUtils.getXml(node));
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


## Other serialization methods

XmlCanvas2D 

purpose ImageExport, ....


## Examples and Demos

More complex examples and demos involving Codecs are available in the `maxGraph` repository.

Load a data model from an XML file using ModelXmlSerializer or from a custom text file with custom parsing (no Codecs involved)
- live demo: [FileIO](https://maxgraph.github.io/maxGraph/demo/?path=/story/xml-json-fileio--default)
- source code: [FileIO.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/FileIO.stories.ts)

Import mxGraph data model
- live demo: [CodecImport_mxGraph](https://maxgraph.github.io/maxGraph/demo/?path=/story/misc-codecimport-mxgraph--default)
- source code: [Codec.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Codec.stories.ts)

Import vertex including custom XML data in the Cell value, with ModelXmlSerializer and a Custom Codec to handle the custom XML data
- live demo: [JsonData](https://maxgraph.github.io/maxGraph/demo/?path=/story/xml-json-jsondata--default)
- source code: [JsonData.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/JsonData.stories.ts)

Export the data model to an XML file using ModelXmlSerializer, custom data in the Cell value?
- live demo: [UserObject](https://maxgraph.github.io/maxGraph/demo/?path=/story/xml-json-userobject--default)
- source code: [UserObject.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/UserObject.stories.ts)

In addition, the `js-example` package in this repository is importing an maxGraph model stored as XML string. This is a vanilla JS project built with Webpack.
So, it should contain everything you need for your use case. See https://github.com/maxGraph/maxGraph/blob/v0.14.0/packages/js-example/src/index.js
