/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import ObjectIdentity from '../util/ObjectIdentity';
import MaxLog from '../gui/MaxLog';
import Geometry from '../view/geometry/Geometry';
import Point from '../view/geometry/Point';
import { NODETYPE } from '../util/Constants';
import { isInteger, isNumeric } from '../util/mathUtils';
import { getTextContent } from '../util/domUtils';
import { load } from '../util/MaxXmlRequest';
import type Codec from './Codec';

/**
 * Generic codec for JavaScript objects that implements a mapping between
 * JavaScript objects and XML nodes that maps each field or element to an
 * attribute or child node, and vice versa.
 *
 * ### Atomic Values
 *
 * Consider the following example.
 *
 * ```javascript
 * const obj = new Object();
 * obj.foo = "Foo";
 * obj.bar = "Bar";
 * ```
 *
 * This object is encoded into an XML node using the following.
 *
 * ```javascript
 * const enc = new Codec();
 * const node = enc.encode(obj);
 * ```
 *
 * The output of the encoding may be viewed using {@link MaxLog} as follows.
 *
 * ```javascript
 * MaxLog.show();
 * MaxLog.debug(mxUtils.getPrettyXml(node));
 * ```
 *
 * Finally, the result of the encoding looks as follows.
 *
 * ```javascript
 * <Object foo="Foo" bar="Bar"/>
 * ```
 *
 * In the above output, the foo and bar fields have been mapped to attributes
 * with the same names, and the name of the constructor was used for the
 * node name.
 *
 * ### Booleans
 *
 * Since booleans are numbers in JavaScript, all boolean values are encoded
 * into 1 for true and 0 for false. The decoder also accepts the string true
 * and false for boolean values.
 *
 * ### Objects
 *
 * The above scheme is applied to all atomic fields, that is, to all non-object
 * fields of an object. For object fields, a child node is created with a
 * special attribute that contains the field name. This special attribute is
 * called "as" and hence, as is a reserved word that should not be used for a
 * field name.
 *
 * Consider the following example where foo is an object and bar is an atomic
 * property of foo.
 *
 * ```javascript
 * const obj = {foo: {bar: "Bar"}};
 * ```
 *
 * This will be mapped to the following XML structure by ObjectCodec.
 *
 * ```javascript
 * <Object>
 *   <Object bar="Bar" as="foo"/>
 * </Object>
 * ```
 *
 * In the above output, the inner Object node contains the as-attribute that
 * specifies the field name in the enclosing object. That is, the field foo was
 * mapped to a child node with an as-attribute that has the value foo.
 *
 * ### Arrays
 *
 * Arrays are special objects that are either associative, in which case each
 * key, value pair is treated like a field where the key is the field name, or
 * they are a sequence of atomic values and objects, which is mapped to a
 * sequence of child nodes. For object elements, the above scheme is applied
 * without the use of the special as-attribute for creating each child. For
 * atomic elements, a special add-node is created with the value stored in the
 * value-attribute.
 *
 * For example, the following array contains one atomic value and one object
 * with a field called bar. Furthermore it contains two associative entries
 * called bar with an atomic value, and foo with an object value.
 *
 * ```javascript
 * const obj = ["Bar", {bar: "Bar"}];
 * obj["bar"] = "Bar";
 * obj["foo"] = {bar: "Bar"};
 * ```
 *
 * This array is represented by the following XML nodes.
 *
 * ```javascript
 * <Array bar="Bar">
 *   <add value="Bar"/>
 *   <Object bar="Bar"/>
 *   <Object bar="Bar" as="foo"/>
 * </Array>
 * ```
 *
 * The Array node name is the name of the constructor. The additional
 * as-attribute in the last child contains the key of the associative entry,
 * whereas the second last child is part of the array sequence and does not
 * have an as-attribute.
 *
 * ### References
 *
 * Objects may be represented as child nodes or attributes with ID values,
 * which are used to lookup the object in a table within {@link Codec}. The
 * {@link isReference} function is in charge of deciding if a specific field should
 * be encoded as a reference or not. Its default implementation returns true if
 * the field name is in {@link idrefs}, an array of strings that is used to configure
 * the {@link ObjectCodec}.
 *
 * Using this approach, the mapping does not guarantee that the referenced
 * object itself exists in the document. The fields that are encoded as
 * references must be carefully chosen to make sure all referenced objects
 * exist in the document, or may be resolved by some other means if necessary.
 *
 * For example, in the case of the graph model all cells are stored in a tree
 * whose root is referenced by the model's root field. A tree is a structure
 * that is well suited for an XML representation, however, the additional edges
 * in the graph model have a reference to a source and target cell, which are
 * also contained in the tree. To handle this case, the source and target cell
 * of an edge are treated as references, whereas the children are treated as
 * objects. Since all cells are contained in the tree and no edge references a
 * source or target outside the tree, this setup makes sure all referenced
 * objects are contained in the document.
 *
 * In the case of a tree structure we must further avoid infinite recursion by
 * ignoring the parent reference of each child. This is done by returning true
 * in {@link isExcluded}, whose default implementation uses the array of excluded
 * fieldnames passed to the ObjectCodec constructor.
 *
 * References are only used for cells in mxGraph. For defining other
 * referencable object types, the codec must be able to work out the ID of an
 * object. This is done by implementing {@link Codec.reference}. For decoding a
 * reference, the XML node with the respective id-attribute is fetched from the
 * document, decoded, and stored in a lookup table for later reference. For
 * looking up external objects, {@link Codec.lookup} may be implemented.
 *
 * ### Expressions
 *
 * For decoding JavaScript expressions, the add-node may be used with a text
 * content that contains the JavaScript expression. For example, the following
 * creates a field called foo in the enclosing object and assigns it the value
 * of {@link Constants.ALIGN.LEFT}.
 *
 * ```javascript
 * <Object>
 *   <add as="foo">Constants.ALIGN.LEFT</add>
 * </Object>
 * ```
 *
 * The resulting object has a field called foo with the value "left". Its XML
 * representation looks as follows.
 *
 * ```javascript
 * <Object foo="left"/>
 * ```
 *
 * This means the expression is evaluated at decoding time and the result of
 * the evaluation is stored in the respective field. Valid expressions are all
 * JavaScript expressions, including function definitions, which are mapped to
 * functions on the resulting object.
 *
 * Expressions are only evaluated if {@link allowEval} is true.
 */
class ObjectCodec {
  constructor(
    template: any,
    exclude: string[] = [],
    idrefs: string[] = [],
    mapping: { [key: string]: string } = {}
  ) {
    this.template = template;

    this.exclude = exclude;
    this.idrefs = idrefs;
    this.mapping = mapping;

    this.reverse = {};

    for (const i in this.mapping) {
      this.reverse[this.mapping[i]] = i;
    }
  }

  /**
   * Static global switch that specifies if expressions in arrays are allowed.
   *
   * **NOTE**: Enabling this carries a possible security risk.
   * @default false
   */
  static allowEval = false;

  /**
   * Holds the template object associated with this codec.
   */
  template: any;

  /**
   * Array containing the variable names that should be ignored by the codec.
   */
  exclude: string[];

  /**
   * Array containing the variable names that should be
   * turned into or converted from references. See
   * {@link Codec.getId} and {@link Codec.getObject}.
   */
  idrefs: string[];

  /**
   * Maps from field names to XML attribute names.
   */
  mapping: { [key: string]: string };

  /**
   * Maps from XML attribute names to fieldnames.
   */
  reverse: { [key: string]: string };

  /**
   * Returns the name used for the node names and lookup of the codec when
   * classes are encoded and nodes are decoded. For classes to work with
   * this the codec registry automatically adds an alias for the classname
   * if that is different from what this returns.
   *
   * The default implementation returns the classname of the template class.
   */
  getName(): string {
    return this.template.constructor.name;
  }

  /**
   * Returns a new instance of the template for this codec.
   */
  cloneTemplate(): any {
    return new this.template.constructor();
  }

  /**
   * Returns the field name for the given attribute name.
   * Looks up the value in the {@link reverse} mapping or returns
   * the input if there is no reverse mapping for the
   * given name.
   */
  getFieldName(attributename: string): string {
    if (attributename != null) {
      const mapped = this.reverse[attributename];

      if (mapped != null) {
        attributename = mapped;
      }
    }

    return attributename;
  }

  /**
   * Returns the attribute name for the given field name.
   * Looks up the value in the {@link mapping} or returns
   * the input if there is no mapping for the
   * given name.
   */
  getAttributeName(fieldname: string | null): string | null {
    if (fieldname != null) {
      const mapped = this.mapping[fieldname];

      if (mapped != null) {
        fieldname = mapped;
      }
    }
    return fieldname;
  }

  /**
   * Returns true if the given attribute is to be ignored by the codec. This
   * implementation returns true if the given field name is in {@link exclude} or
   * if the field name equals {@link ObjectIdentity.FIELD_NAME}.
   *
   * @param obj Object instance that contains the field.
   * @param attr Fieldname of the field.
   * @param value Value of the field.
   * @param write Boolean indicating if the field is being encoded or decoded.
   * Write is true if the field is being encoded, else it is being decoded.
   */
  isExcluded(obj: any, attr: string, value: any, write?: boolean): boolean {
    return attr == ObjectIdentity.FIELD_NAME || this.exclude.indexOf(attr) >= 0;
  }

  /**
   * Returns true if the given field name is to be treated
   * as a textual reference (ID). This implementation returns
   * true if the given field name is in {@link idrefs}.
   *
   * @param obj Object instance that contains the field.
   * @param attr Field name of the field.
   * @param value Value of the field.
   * @param write Boolean indicating if the field is being encoded or decoded.
   * Write is true if the field is being encoded, else it is being decoded.
   */
  isReference(obj: any, attr: string, value: any, write?: boolean): boolean {
    return this.idrefs.indexOf(attr) >= 0;
  }

  /**
   * Encodes the specified object and returns a node
   * representing then given object. Calls {@link beforeEncode}
   * after creating the node and {@link afterEncode} with the
   * resulting node after processing.
   *
   * Enc is a reference to the calling encoder. It is used
   * to encode complex objects and create references.
   *
   * This implementation encodes all variables of an
   * object according to the following rules:
   *
   * - If the variable name is in {@link exclude} then it is ignored.
   * - If the variable name is in {@link idrefs} then {@link Codec.getId}
   * is used to replace the object with its ID.
   * - The variable name is mapped using {@link mapping}.
   * - If obj is an array and the variable name is numeric
   * (ie. an index) then it is not encoded.
   * - If the value is an object, then the codec is used to
   * create a child node with the variable name encoded into
   * the "as" attribute.
   * - Else, if {@link encodeDefaults} is true or the value differs
   * from the template value, then ...
   * - ... if obj is not an array, then the value is mapped to
   * an attribute.
   * - ... else if obj is an array, the value is mapped to an
   * add child with a value attribute or a text child node,
   * if the value is a function.
   *
   * If no ID exists for a variable in {@link idrefs} or if an object
   * cannot be encoded, a warning is issued using {@link MaxLog.warn}.
   *
   * Returns the resulting XML node that represents the given
   * object.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Object to be encoded.
   */
  encode(enc: Codec, obj: any): Element | null {
    const node = enc.document.createElement(this.getName());

    obj = this.beforeEncode(enc, obj, node);
    this.encodeObject(enc, obj, node);

    return this.afterEncode(enc, obj, node);
  }

  /**
   * Encodes the value of each member in then given obj into the given node using
   * {@link encodeValue}.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Object to be encoded.
   * @param node XML node that contains the encoded object.
   */
  encodeObject(enc: Codec, obj: any, node: Element): void {
    enc.setAttribute(node, 'id', enc.getId(obj));

    for (const i in obj) {
      let name: string | null = i;
      const value = obj[name];

      if (value != null && !this.isExcluded(obj, name, value, true)) {
        if (isInteger(name)) {
          name = null;
        }

        this.encodeValue(enc, obj, name, value, node);
      }
    }
  }

  /**
   * Converts the given value according to the mappings
   * and id-refs in this codec and uses {@link writeAttribute}
   * to write the attribute into the given node.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Object whose property is going to be encoded.
   * @param name XML node that contains the encoded object.
   * @param value Value of the property to be encoded.
   * @param node XML node that contains the encoded object.
   */
  encodeValue(
    enc: Codec,
    obj: any,
    name: string | null,
    value: any,
    node: Element
  ): void {
    if (value != null) {
      // TODO: What is the case where `name` can be `null`? =========================================================================
      if (name != null && this.isReference(obj, name, value, true)) {
        const tmp = enc.getId(value);

        if (tmp == null) {
          MaxLog.warn(`ObjectCodec.encode: No ID for ${this.getName()}.${name}=${value}`);
          return; // exit
        }

        value = tmp;
      }

      // Checks if the value is a default value and
      // the name is correct
      if (name == null || enc.encodeDefaults || this.template[name] != value) {
        name = this.getAttributeName(name);
        this.writeAttribute(enc, obj, name, value, node);
      }
    }
  }

  /**
   * Writes the given value into node using {@link writePrimitiveAttribute}
   * or {@link writeComplexAttribute} depending on the type of the value.
   */
  writeAttribute(
    enc: Codec,
    obj: any,
    name: string | null,
    value: any,
    node: Element
  ): void {
    if (typeof value !== 'object' /* primitive type */) {
      this.writePrimitiveAttribute(enc, obj, name, value, node);
    } /* complex type */ else {
      this.writeComplexAttribute(enc, obj, name, value, node);
    }
  }

  /**
   * Writes the given value as an attribute of the given node.
   */
  writePrimitiveAttribute(
    enc: Codec,
    obj: any,
    name: string | null,
    value: any,
    node: Element
  ): void {
    value = this.convertAttributeToXml(enc, obj, name, value, node); // TODO: params don't seem to match - is this a bug? ===================================

    if (name == null) {
      const child = enc.document.createElement('add');

      if (typeof value === 'function') {
        child.appendChild(enc.document.createTextNode(value));
      } else {
        enc.setAttribute(child, 'value', value);
      }

      node.appendChild(child);
    } else if (typeof value !== 'function') {
      enc.setAttribute(node, name, value);
    }
  }

  /**
   * Writes the given value as a child node of the given node.
   */
  writeComplexAttribute(
    enc: Codec,
    obj: any,
    name: string | null,
    value: any,
    node: Element
  ): void {
    const child = enc.encode(value);

    if (child != null) {
      if (name != null) {
        child.setAttribute('as', name);
      }

      node.appendChild(child);
    } else {
      MaxLog.warn(`ObjectCodec.encode: No node for ${this.getName()}.${name}: ${value}`);
    }
  }

  /**
   * Converts true to "1" and false to "0" is {@link isBooleanAttribute} returns true.
   * All other values are not converted.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Objec to convert the attribute for.
   * @param name Name of the attribute to be converted.
   * @param value Value to be converted.
   */
  convertAttributeToXml(
    enc: Codec,
    obj: any,
    name: string | null,
    value: any,
    node: Element
  ): any {
    // Makes sure to encode boolean values as numeric values
    if (this.isBooleanAttribute(enc, obj, name, value)) {
      // Checks if the value is true (do not use the value as is, because
      // this would check if the value is not null, so 0 would be true)
      value = value == true ? '1' : '0';
    }
    return value;
  }

  /**
   * Returns true if the given object attribute is a boolean value.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Object to convert the attribute for.
   * @param name Name of the attribute to be converted.
   * @param value Value of the attribute to be converted.
   */
  isBooleanAttribute(enc: Codec, obj: any, name: string | null, value: any): boolean {
    return typeof value.length === 'undefined' && (value == true || value == false);
  }

  /**
   * Converts booleans and numeric values to the respective types. Values are
   * numeric if {@link isNumericAttribute} returns true.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param attr XML attribute to be converted.
   * @param obj Objec to convert the attribute for.
   */
  convertAttributeFromXml(dec: Codec, attr: any, obj: any): any {
    let { value } = attr;

    if (this.isNumericAttribute(dec, attr, obj)) {
      value = parseFloat(value);

      if (Number.isNaN(value) || !Number.isFinite(value)) {
        value = 0;
      }
    }

    return value;
  }

  /**
   * Returns true if the given XML attribute is or should be a numeric value.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param attr XML attribute to be converted.
   * @param obj Object to convert the attribute for.
   */
  isNumericAttribute(dec: Codec, attr: any, obj: any): boolean {
    // Handles known numeric attributes for generic objects
    return (
      (obj.constructor === Geometry &&
        (attr.name === 'x' ||
          attr.name === 'y' ||
          attr.name === 'width' ||
          attr.name === 'height')) ||
      (obj.constructor === Point && (attr.name === 'x' || attr.name === 'y')) ||
      isNumeric(attr.value)
    );
  }

  /**
   * Hook for subclassers to pre-process the object before
   * encoding. This returns the input object. The return
   * value of this function is used in {@link encode} to perform
   * the default encoding into the given node.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Object to be encoded.
   * @param node XML node to encode the object into.
   */
  beforeEncode(enc: Codec, obj: any, node?: Element): any {
    return obj;
  }

  /**
   * Hook for subclassers to post-process the node
   * for the given object after encoding and return the
   * post-processed node. This implementation returns
   * the input node. The return value of this method
   * is returned to the encoder from {@link encode}.
   *
   * @param enc {@link Codec} that controls the encoding process.
   * @param obj Object to be encoded.
   * @param node XML node that represents the default encoding.
   */
  afterEncode(enc: Codec, obj: any, node: Element): Element {
    return node;
  }

  /**
   * Parses the given node into the object or returns a new object
   * representing the given node.
   *
   * Dec is a reference to the calling decoder. It is used to decode
   * complex objects and resolve references.
   *
   * If a node has an id attribute then the object cache is checked for the
   * object. If the object is not yet in the cache then it is constructed
   * using the constructor of {@link template} and cached in {@link Codec.objects}.
   *
   * This implementation decodes all attributes and childs of a node
   * according to the following rules:
   *
   * - If the variable name is in {@link exclude} or if the attribute name is "id"
   * or "as" then it is ignored.
   * - If the variable name is in {@link idrefs} then {@link Codec.getObject} is used
   * to replace the reference with an object.
   * - The variable name is mapped using a reverse {@link mapping}.
   * - If the value has a child node, then the codec is used to create a
   * child object with the variable name taken from the "as" attribute.
   * - If the object is an array and the variable name is empty then the
   * value or child object is appended to the array.
   * - If an add child has no value or the object is not an array then
   * the child text content is evaluated using {@link eval}.
   *
   * For add nodes where the object is not an array and the variable name
   * is defined, the default mechanism is used, allowing to override/add
   * methods as follows:
   *
   * ```javascript
   * <Object>
   *   <add as="hello"><![CDATA[
   *     function(arg1) {
   *       mxUtils.alert('Hello '+arg1);
   *     }
   *   ]]></add>
   * </Object>
   * ```
   *
   * If no object exists for an ID in {@link idrefs} a warning is issued
   * using {@link MaxLog.warn}.
   *
   * Returns the resulting object that represents the given XML node
   * or the object given to the method as the into parameter.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param node XML node to be decoded.
   * @param into Optional object to encode the node into.
   */
  decode(dec: Codec, node: Element, into?: any): any {
    const id = <string>node.getAttribute('id');
    console.info('[ObjectCode.decode] start id:', id);
    let obj = dec.objects[id];
    console.info('[ObjectCode.decode] object already registered?', !!obj);

    if (obj == null) {
      obj = into || this.cloneTemplate();

      if (id != null) {
        dec.putObject(id, obj);
      }
    }

    const _node = this.beforeDecode(dec, node, obj);
    this.decodeNode(dec, _node, obj);
    return this.afterDecode(dec, _node, obj);
  }

  /**
   * Calls {@link decodeAttributes} and {@link decodeChildren} for the given node.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param node XML node to be decoded.
   * @param obj Objec to encode the node into.
   */
  decodeNode(dec: Codec, node: Element | null, obj: any): void {
    if (node != null) {
      this.decodeAttributes(dec, node, obj);
      this.decodeChildren(dec, node, obj);
    }
  }

  /**
   * Decodes all attributes of the given node using {@link decodeAttribute}.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param node XML node to be decoded.
   * @param obj Object to encode the node into.
   */
  decodeAttributes(dec: Codec, node: Element, obj: any): void {
    const attrs = node.attributes;

    if (attrs != null) {
      for (let i = 0; i < attrs.length; i += 1) {
        this.decodeAttribute(dec, attrs[i], obj);
      }
    }
  }

  /**
   * Returns true if the given attribute should be ignored. This implementation
   * returns true if the attribute name is "as" or "id".
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param attr XML attribute to be decoded.
   * @param obj Objec to encode the attribute into.
   */
  isIgnoredAttribute(dec: Codec, attr: any, obj?: any): boolean {
    return attr.nodeName === 'as' || attr.nodeName === 'id';
  }

  /**
   * Reads the given attribute into the specified object.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param attr XML attribute to be decoded.
   * @param obj Objec to encode the attribute into.
   */
  decodeAttribute(dec: Codec, attr: any, obj?: any): void {
    if (!this.isIgnoredAttribute(dec, attr, obj)) {
      const name = attr.nodeName;

      // Converts the string true and false to their boolean values.
      // This may require an additional check on the obj to see if
      // the existing field is a boolean value or uninitialized, in
      // which case we may want to convert true and false to a string.
      let value = this.convertAttributeFromXml(dec, attr, obj);
      const fieldname = this.getFieldName(name);

      if (this.isReference(obj, fieldname, value, false)) {
        const tmp = dec.getObject(value);

        if (tmp == null) {
          MaxLog.warn(
            `ObjectCodec.decode: No object for ${this.getName()}.${name}=${value}`
          );
          return; // exit
        }

        value = tmp;
      }

      if (!this.isExcluded(obj, name, value, false)) {
        // MaxLog.debug(mxUtils.getFunctionName(obj.constructor)+'.'+name+'='+value);
        obj[name] = value;
      }
    }
  }

  /**
   * Decodes all children of the given node using {@link decodeChild}.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param node XML node to be decoded.
   * @param obj Objec to encode the node into.
   */
  decodeChildren(dec: Codec, node: Element, obj?: any): void {
    let child = <Element>node.firstChild;

    while (child != null) {
      const tmp = <Element>child.nextSibling;

      if (child.nodeType === NODETYPE.ELEMENT && !this.processInclude(dec, child, obj)) {
        this.decodeChild(dec, child, obj);
      }

      child = tmp;
    }
  }

  /**
   * Reads the specified child into the given object.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param child XML child element to be decoded.
   * @param obj Objec to encode the node into.
   */
  decodeChild(dec: Codec, child: Element, obj: any): void {
    const fieldname = this.getFieldName(<string>child.getAttribute('as'));

    if (fieldname == null || !this.isExcluded(obj, fieldname, child, false)) {
      const template = this.getFieldTemplate(obj, fieldname, child);
      let value = null;

      if (child.nodeName === 'add') {
        value = child.getAttribute('value');

        if (value == null && ObjectCodec.allowEval) {
          value = eval(getTextContent(<Text>(<unknown>child)));
        }
      } else {
        value = dec.decode(child, template);
      }

      try {
        this.addObjectValue(obj, fieldname, value, template);
      } catch (e: any) {
        throw new Error(`${e.message} for ${child.nodeName}`);
      }
    }
  }

  /**
   * Returns the template instance for the given field. This returns the
   * value of the field, null if the value is an array or an empty collection
   * if the value is a collection. The value is then used to populate the
   * field for a new instance. For strongly typed languages it may be
   * required to override this to return the correct collection instance
   * based on the encoded child.
   */
  getFieldTemplate(obj: any, fieldname: string, child: Element): any {
    let template = obj[fieldname];

    // Non-empty arrays are replaced completely
    if (template instanceof Array && template.length > 0) {
      template = null;
    }

    return template;
  }

  /**
   * Sets the decoded child node as a value of the given object. If the
   * object is a map, then the value is added with the given field name as a
   * key. If the field name is not empty, then setFieldValue is called or
   * else, if the object is a collection, the value is added to the
   * collection. For strongly typed languages it may be required to
   * override this with the correct code to add an entry to an object.
   */
  addObjectValue(obj: any, fieldname: string, value: any, template: any): void {
    if (value != null && value !== template) {
      if (fieldname != null && fieldname.length > 0) {
        obj[fieldname] = value;
      } else {
        obj.push(value);
      }
      // MaxLog.debug('Decoded '+mxUtils.getFunctionName(obj.constructor)+'.'+fieldname+': '+value);
    }
  }

  /**
   * Returns true if the given node is an include directive and
   * executes the include by decoding the XML document. Returns
   * false if the given node is not an include directive.
   *
   * @param dec {@link Codec} that controls the encoding/decoding process.
   * @param node XML node to be checked.
   * @param into Optional object to pass-thru to the codec.
   */
  processInclude(dec: Codec, node: Element, into?: any): boolean {
    if (node.nodeName === 'include') {
      const name = node.getAttribute('name');
      if (name != null) {
        try {
          const xml = load(name).getDocumentElement();
          if (xml != null) {
            dec.decode(xml, into);
          }
        } catch (e) {
          // ignore
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Hook for subclassers to pre-process the node for
   * the specified object and return the node to be
   * used for further processing by {@link decode}.
   * The object is created based on the template in the
   * calling method and is never null. This implementation
   * returns the input node. The return value of this
   * function is used in {@link decode} to perform
   * the default decoding into the given object.
   *
   * @param dec {@link Codec} that controls the decoding process.
   * @param node XML node to be decoded.
   * @param obj Object to encode the node into.
   */
  beforeDecode(dec: Codec, node: Element, obj: any): Element | null {
    return node;
  }

  /**
   * Hook for subclassers to post-process the object after
   * decoding. This implementation returns the given object
   * without any changes. The return value of this method
   * is returned to the decoder from {@link decode}.
   *
   * @param dec {@link Codec} that controls the encoding process.
   * @param node XML node to be decoded.
   * @param obj Object that represents the default decoding.
   */
  afterDecode(dec: Codec, node: Element | null, obj?: any): any {
    return obj;
  }
}

export default ObjectCodec;
