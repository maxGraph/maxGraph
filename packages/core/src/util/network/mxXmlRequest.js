/**
 * Copyright (c) 2006-2020, JGraph Ltd
 * Copyright (c) 2006-2020, draw.io AG
 */
import { write } from '../DomUtils';
import { parseXml } from '../XmlUtils';

/**
 * XML HTTP request wrapper. See also: {@link mxUtils.get}, {@link mxUtils.post} and
 * {@link mxUtils.load}. This class provides a cross-browser abstraction for Ajax
 * requests.
 *
 * ### Encoding:
 *
 * For encoding parameter values, the built-in encodeURIComponent JavaScript
 * method must be used. For automatic encoding of post data in {@link mxEditor} the
 * {@link mxEditor.escapePostData} switch can be set to true (default). The encoding
 * will be carried out using the conte type of the page. That is, the page
 * containting the editor should contain a meta tag in the header, eg.
 * <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
 *
 * @example
 * ```JavaScript
 * var onload = function(req)
 * {
 *   mxUtils.alert(req.getDocumentElement());
 * }
 *
 * var onerror = function(req)
 * {
 *   mxUtils.alert('Error');
 * }
 * new mxXmlRequest(url, 'key=value').send(onload, onerror);
 * ```
 *
 * Sends an asynchronous POST request to the specified URL.
 *
 * @example
 * ```JavaScript
 * var req = new mxXmlRequest(url, 'key=value', 'POST', false);
 * req.send();
 * mxUtils.alert(req.getDocumentElement());
 * ```
 *
 * Sends a synchronous POST request to the specified URL.
 *
 * @example
 * ```JavaScript
 * var encoder = new mxCodec();
 * var result = encoder.encode(graph.getModel());
 * var xml = encodeURIComponent(mxUtils.getXml(result));
 * new mxXmlRequest(url, 'xml='+xml).send();
 * ```
 *
 * Sends an encoded graph model to the specified URL using xml as the
 * parameter name. The parameter can then be retrieved in C# as follows:
 *
 * (code)
 * string xml = HttpUtility.UrlDecode(context.Request.Params["xml"]);
 * (end)
 *
 * Or in Java as follows:
 *
 * (code)
 * String xml = URLDecoder.decode(request.getParameter("xml"), "UTF-8").replace("
", "&#xa;");
 * (end)
 *
 * Note that the linefeeds should only be replaced if the XML is
 * processed in Java, for example when creating an image.
 */
class mxXmlRequest {
  constructor(url, params, method, async, username, password) {
    this.url = url;
    this.params = params;
    this.method = method || 'POST';
    this.async = async != null ? async : true;
    this.username = username;
    this.password = password;
  }

  /**
   * Variable: url
   *
   * Holds the target URL of the request.
   */
  url = null;

  /**
   * Variable: params
   *
   * Holds the form encoded data for the POST request.
   */
  params = null;

  /**
   * Variable: method
   *
   * Specifies the request method. Possible values are POST and GET. Default
   * is POST.
   */
  method = null;

  /**
   * Variable: async
   *
   * Boolean indicating if the request is asynchronous.
   */
  async = null;

  /**
   * Boolean indicating if the request is binary. This option is ignored in IE.
   * In all other browsers the requested mime type is set to
   * text/plain; charset=x-user-defined. Default is false.
   *
   * @default false
   */
  // binary: boolean;
  binary = false;

  /**
   * Specifies if withCredentials should be used in HTML5-compliant browsers. Default is false.
   *
   * @default false
   */
  // withCredentials: boolean;
  withCredentials = false;

  /**
   * Variable: username
   *
   * Specifies the username to be used for authentication.
   */
  username = null;

  /**
   * Variable: password
   *
   * Specifies the password to be used for authentication.
   */
  password = null;

  /**
   * Holds the inner, browser-specific request object.
   */
  // request: any;
  request = null;

  /**
   * Specifies if request values should be decoded as URIs before setting the
   * textarea value in {@link simulate}. Defaults to false for backwards compatibility,
   * to avoid another decode on the server this should be set to true.
   */
  // decodeSimulateValues: boolean;
  decodeSimulateValues = false;

  /**
   * Returns {@link binary}.
   */
  // isBinary(): boolean;
  isBinary() {
    return this.binary;
  }

  /**
   * Sets {@link binary}.
   *
   * @param value
   */
  // setBinary(value: boolean): void;
  setBinary(value) {
    this.binary = value;
  }

  /**
   * Returns the response as a string.
   */
  // getText(): string;
  getText() {
    return this.request.responseText;
  }

  /**
   * Returns true if the response is ready.
   */
  // isReady(): boolean;
  isReady() {
    return this.request.readyState === 4;
  }

  /**
   * Returns the document element of the response XML document.
   */
  // getDocumentElement(): XMLDocument;
  getDocumentElement() {
    const doc = this.getXml();

    if (doc != null) {
      return doc.documentElement;
    }

    return null;
  }

  /**
   * Returns the response as an XML document. Use {@link getDocumentElement} to get
   * the document element of the XML document.
   */
  // getXml(): XMLDocument;
  getXml() {
    let xml = this.request.responseXML;

    // Handles missing response headers in IE, the first condition handles
    // the case where responseXML is there, but using its nodes leads to
    // type errors in the mxCellCodec when putting the nodes into a new
    // document. This happens in IE9 standards mode and with XML user
    // objects only, as they are used directly as values in cells.
    if (xml == null || xml.documentElement == null) {
      xml = parseXml(this.request.responseText);
    }

    return xml;
  }

  /**
   * Returns the status as a number, eg. 404 for "Not found" or 200 for "OK".
   * Note: The NS_ERROR_NOT_AVAILABLE for invalid responses cannot be cought.
   */
  // getStatus(): number;
  getStatus() {
    return this.request != null ? this.request.status : null;
  }

  /**
   * Creates and returns the inner {@link request} object.
   */
  // create(): any;
  create() {
    const req = new XMLHttpRequest();

    // TODO: Check for overrideMimeType required here?
    if (this.isBinary() && req.overrideMimeType) {
      req.overrideMimeType('text/plain; charset=x-user-defined');
    }

    return req;
  }

  /**
   * Send the <request> to the target URL using the specified functions to
   * process the response asychronously.
   *
   * Note: Due to technical limitations, onerror is currently ignored.
   *
   * @param onload Function to be invoked if a successful response was received.
   * @param onerror Function to be called on any error. Unused in this implementation, intended for overriden function.
   * @param timeout Optional timeout in ms before calling ontimeout.
   * @param ontimeout Optional function to execute on timeout.
   */
  // send(onload: Function, onerror: Function, timeout?: number, ontimeout?: Function): void;
  send(onload, onerror, timeout, ontimeout) {
    this.request = this.create();

    if (this.request != null) {
      if (onload != null) {
        this.request.onreadystatechange = () => {
          if (this.isReady()) {
            onload(this);
            this.request.onreadystatechange = null;
          }
        };
      }

      this.request.open(
        this.method,
        this.url,
        this.async,
        this.username,
        this.password
      );
      this.setRequestHeaders(this.request, this.params);

      if (window.XMLHttpRequest && this.withCredentials) {
        this.request.withCredentials = 'true';
      }

      if (
        document.documentMode == null &&
        window.XMLHttpRequest &&
        timeout != null &&
        ontimeout != null
      ) {
        this.request.timeout = timeout;
        this.request.ontimeout = ontimeout;
      }

      this.request.send(this.params);
    }
  }

  /**
   * Sets the headers for the given request and parameters. This sets the
   * content-type to application/x-www-form-urlencoded if any params exist.
   *
   * @example
   * ```JavaScript
   * request.setRequestHeaders = function(request, params)
   * {
   *   if (params != null)
   *   {
   *     request.setRequestHeader('Content-Type',
   *             'multipart/form-data');
   *     request.setRequestHeader('Content-Length',
   *             params.length);
   *   }
   * };
   * ```
   *
   * Use the code above before calling {@link send} if you require a
   * multipart/form-data request.
   *
   * @param request
   * @param params
   */
  // setRequestHeaders(request: any, params: any): void;
  setRequestHeaders(request, params) {
    if (params != null) {
      request.setRequestHeader(
        'Content-Type',
        'application/x-www-form-urlencoded'
      );
    }
  }

  /**
   * Creates and posts a request to the given target URL using a dynamically
   * created form inside the given document.
   *
   * @param doc Document that contains the form element.
   * @param target Target to send the form result to.
   */
  // simulate(doc: any, target: any): void;
  simulate(doc, target) {
    doc = doc || document;
    let old = null;

    if (doc === document) {
      old = window.onbeforeunload;
      window.onbeforeunload = null;
    }

    const form = doc.createElement('form');
    form.setAttribute('method', this.method);
    form.setAttribute('action', this.url);

    if (target != null) {
      form.setAttribute('target', target);
    }

    form.style.display = 'none';
    form.style.visibility = 'hidden';

    const pars =
      this.params.indexOf('&') > 0
        ? this.params.split('&')
        : this.params.split();

    // Adds the parameters as textareas to the form
    for (let i = 0; i < pars.length; i += 1) {
      const pos = pars[i].indexOf('=');

      if (pos > 0) {
        const name = pars[i].substring(0, pos);
        let value = pars[i].substring(pos + 1);

        if (this.decodeSimulateValues) {
          value = decodeURIComponent(value);
        }

        const textarea = doc.createElement('textarea');
        textarea.setAttribute('wrap', 'off');
        textarea.setAttribute('name', name);
        write(textarea, value);
        form.appendChild(textarea);
      }
    }

    doc.body.appendChild(form);
    form.submit();

    if (form.parentNode != null) {
      form.parentNode.removeChild(form);
    }

    if (old != null) {
      window.onbeforeunload = old;
    }
  }
}

/**
 * Function: load
 *
 * Loads the specified URL *synchronously* and returns the <mxXmlRequest>.
 * Throws an exception if the file cannot be loaded. See <mxUtils.get> for
 * an asynchronous implementation.
 *
 * Example:
 *
 * (code)
 * try
 * {
 *   let req = mxUtils.load(filename);
 *   let root = req.getDocumentElement();
 *   // Process XML DOM...
 * }
 * catch (ex)
 * {
 *   mxUtils.alert('Cannot load '+filename+': '+ex);
 * }
 * (end)
 *
 * Parameters:
 *
 * url - URL to get the data from.
 */
export const load = url => {
  const req = new mxXmlRequest(url, null, 'GET', false);
  req.send();

  return req;
}

/**
 * Function: get
 *
 * Loads the specified URL *asynchronously* and invokes the given functions
 * depending on the request status. Returns the <mxXmlRequest> in use. Both
 * functions take the <mxXmlRequest> as the only parameter. See
 * <mxUtils.load> for a synchronous implementation.
 *
 * Example:
 *
 * (code)
 * mxUtils.get(url, (req)=>
 * {
 *    let node = req.getDocumentElement();
 *    // Process XML DOM...
 * });
 * (end)
 *
 * So for example, to load a diagram into an existing graph model, the
 * following code is used.
 *
 * (code)
 * mxUtils.get(url, (req)=>
 * {
 *   let node = req.getDocumentElement();
 *   let dec = new mxCodec(node.ownerDocument);
 *   dec.decode(node, graph.getModel());
 * });
 * (end)
 *
 * Parameters:
 *
 * url - URL to get the data from.
 * onload - Optional function to execute for a successful response.
 * onerror - Optional function to execute on error.
 * binary - Optional boolean parameter that specifies if the request is
 * binary.
 * timeout - Optional timeout in ms before calling ontimeout.
 * ontimeout - Optional function to execute on timeout.
 * headers - Optional with headers, eg. {'Authorization': 'token xyz'}
 */
export const get = (url, onload, onerror, binary, timeout, ontimeout, headers) => {
  const req = new mxXmlRequest(url, null, 'GET');
  const { setRequestHeaders } = req;

  if (headers) {
    req.setRequestHeaders = (request, params) => {
      setRequestHeaders.apply(this, [
        url,
        onload,
        onerror,
        binary,
        timeout,
        ontimeout,
        headers,
      ]);

      for (const key in headers) {
        request.setRequestHeader(key, headers[key]);
      }
    };
  }

  if (binary != null) {
    req.setBinary(binary);
  }

  req.send(onload, onerror, timeout, ontimeout);

  return req;
}

/**
 * Function: getAll
 *
 * Loads the URLs in the given array *asynchronously* and invokes the given function
 * if all requests returned with a valid 2xx status. The error handler is invoked
 * once on the first error or invalid response.
 *
 * Parameters:
 *
 * urls - Array of URLs to be loaded.
 * onload - Callback with array of <mxXmlRequests>.
 * onerror - Optional function to execute on error.
 */
export const getAll = (urls, onload, onerror) => {
  let remain = urls.length;
  const result = [];
  let errors = 0;
  const err = () => {
    if (errors == 0 && onerror != null) {
      onerror();
    }

    errors++;
  };

  for (let i = 0; i < urls.length; i += 1) {
    ((url, index) => {
      get(
        url,
        req => {
          const status = req.getStatus();

          if (status < 200 || status > 299) {
            err();
          } else {
            result[index] = req;
            remain--;

            if (remain == 0) {
              onload(result);
            }
          }
        },
        err
      );
    })(urls[i], i);
  }

  if (remain == 0) {
    onload(result);
  }
}

/**
 * Function: post
 *
 * Posts the specified params to the given URL *asynchronously* and invokes
 * the given functions depending on the request status. Returns the
 * <mxXmlRequest> in use. Both functions take the <mxXmlRequest> as the
 * only parameter. Make sure to use encodeURIComponent for the parameter
 * values.
 *
 * Example:
 *
 * (code)
 * mxUtils.post(url, 'key=value', (req)=>
 * {
 *   mxUtils.alert('Ready: '+req.isReady()+' Status: '+req.getStatus());
 *  // Process req.getDocumentElement() using DOM API if OK...
 * });
 * (end)
 *
 * Parameters:
 *
 * url - URL to get the data from.
 * params - Parameters for the post request.
 * onload - Optional function to execute for a successful response.
 * onerror - Optional function to execute on error.
 */
export const post = (url, params, onload, onerror) => {
  return new mxXmlRequest(url, params).send(onload, onerror);
}

/**
 * Function: submit
 *
 * Submits the given parameters to the specified URL using
 * <mxXmlRequest.simulate> and returns the <mxXmlRequest>.
 * Make sure to use encodeURIComponent for the parameter
 * values.
 *
 * Parameters:
 *
 * url - URL to get the data from.
 * params - Parameters for the form.
 * doc - Document to create the form in.
 * target - Target to send the form result to.
 */
export const submit = (url, params, doc, target) => {
  return new mxXmlRequest(url, params).simulate(doc, target);
};

export default mxXmlRequest;
