---
sidebar_position: 6
description: How-to use codecs.
---

# Codecs

TODO
- add an intro
- move the warning to the registering paragraph



:::warning

From [version 0.6.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.6.0) of `maxGraph`, codecs supplied by maxGraph are no longer registered by default, they **MUST** be registered before performing an `encode` or `decode`

For example:
- You can use the `registerModelCodecs` function (or other related functions) to register the Model codecs.
- To serialize the `maxGraph` model, you can use the `ModelXmlSerializer` class, which registers codecs under the hood and provide a simpler syntax.

:::


## Usage

TODO taken from the mxGraph tutorial --> add cc notice

<p>
  The default encoding scheme maps all non-object fields to string
  attributes and all object fields to child nodes, using the constructor
  name of the object as the nodename and the fieldname for the as-attribute
  value. This default encoding scheme may be overridden by custom codecs,
  which are registered in the
  <a href="js-api/files/io/mxCodecRegistry-js.html">mxCodecRegistry</a>.
</p>
<p>
  For example, consider the following JavaScript object definition:
</p>
<pre>
let object = {};
object.myBool = true;
object.myObject = {};
object.myObject.name = 'Test';
object.myArray = ['a', ['b', 'c'], 'd'];
</pre>
<p>
  To encode this object and show the resulting XML in a new window,
  the following code is used:
</p>
<pre>
let encoder = new mxCodec();
let node = encoder.encode(object);
mxUtils.popup(mxUtils.getXml(node));
</pre>
<p>
  And here is the XML structure that represents the object:
</p>
<pre>
&lt;Object myBool="1"&gt;
  &lt;Object name="Test" as="myObject"/&gt;
  &lt;Array as="myArray"&gt;
    &lt;add value="a"/&gt;
    &lt;Array&gt;
      &lt;add value="b"/&gt;
      &lt;add value="c"/&gt;
    &lt;/Array&gt;
    &lt;add value="d"/&gt;
  &lt;/Array&gt;
&lt;/Object&gt;
</pre>
<p>
  Note that the codecs will turn booleans into numeric values, no
  array indices are stored if they are numeric and non-object
  array members are stored inside the value-attribute.
  Furthermore one may include other XML files by
  use of the <code>include</code> directive in the XML structures.
</p>


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
