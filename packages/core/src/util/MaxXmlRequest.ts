/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2020, JGraph Ltd
Copyright (c) 2006-2020, draw.io AG

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

import { write } from './domUtils';

/**
 * XML HTTP request wrapper. See also: {@link mxUtils.get}, {@link mxUtils.post} and
 * {@link mxUtils.load}. This class provides a cross-browser abstraction for Ajax
 * requests.
 *
 * ### Encoding:
 *
 * For encoding parameter values, the built-in encodeURIComponent JavaScript
 * method must be used. For automatic encoding of post data in {@link Editor} the
 * {@link Editor.escapePostData} switch can be set to true (default). The encoding
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
 * new MaxXmlRequest(url, 'key=value').send(onload, onerror);
 * ```
 *
 * Sends an asynchronous POST request to the specified URL.
 *
 * @example
 * ```JavaScript
 * var req = new MaxXmlRequest(url, 'key=value', 'POST', false);
 * req.send();
 * mxUtils.alert(req.getDocumentElement());
 * ```
 *
 * Sends a synchronous POST request to the specified URL.
 *
 * @example
 * ```JavaScript
 * var encoder = new Codec();
 * var result = encoder.encode(graph.getDataModel());
 * var xml = encodeURIComponent(mxUtils.getXml(result));
 * new MaxXmlRequest(url, 'xml='+xml).send();
 * ```
 *
 * Sends an encoded graph model to the specified URL using xml as the
 * parameter name. The parameter can then be retrieved in C# as follows:
 *
 * ```javascript
 * string xml = HttpUtility.UrlDecode(context.Request.Params["xml"]);
 * ```
 *
 * Or in Java as follows:
 *
 * ```javascript
 * String xml = URLDecoder.decode(request.getParameter("xml"), "UTF-8").replace("
", "&#xa;");
 * ```
 *
 * Note that the linefeeds should only be replaced if the XML is
 * processed in Java, for example when creating an image.
 */
class MaxXmlRequest {
  constructor(
    url: string,
    params: string | null = null,
    method: 'GET' | 'POST' = 'POST',
    async = true,
    username: string | null = null,
    password: string | null = null
  ) {
    this.url = url;
    this.params = params;
    this.method = method || 'POST';
    this.async = async;
    this.username = username;
    this.password = password;
  }

  /**
   * Holds the target URL of the request.
   */
  url: string;

  /**
   * Holds the form encoded data for the POST request.
   */
  params: string | null;

  /**
   * Specifies the request method. Possible values are POST and GET. Default
   * is POST.
   */
  method: 'GET' | 'POST';

  /**
   * Boolean indicating if the request is asynchronous.
   */
  async: boolean;

  /**
   * Boolean indicating if the request is binary. This option is ignored in IE.
   * In all other browsers the requested mime type is set to
   * text/plain; charset=x-user-defined. Default is false.
   *
   * @default false
   */
  binary = false;

  /**
   * Specifies if withCredentials should be used in HTML5-compliant browsers. Default is false.
   *
   * @default false
   */
  withCredentials = false;

  /**
   * Specifies the username to be used for authentication.
   */
  username: string | null;

  /**
   * Specifies the password to be used for authentication.
   */
  password: string | null;

  /**
   * Holds the inner, browser-specific request object.
   */
  request: any = null;

  /**
   * Specifies if request values should be decoded as URIs before setting the
   * textarea value in {@link simulate}. Defaults to false for backwards compatibility,
   * to avoid another decode on the server this should be set to true.
   */
  decodeSimulateValues = false;

  /**
   * Returns {@link binary}.
   */
  isBinary(): boolean {
    return this.binary;
  }

  /**
   * Sets {@link binary}.
   *
   * @param value
   */
  setBinary(value: boolean): void {
    this.binary = value;
  }

  /**
   * Returns the response as a string.
   */
  getText(): string {
    return this.request.responseText;
  }

  /**
   * Returns true if the response is ready.
   */
  isReady(): boolean {
    return this.request.readyState === 4;
  }

  /**
   * Returns the document element of the response XML document.
   */
  getDocumentElement(): HTMLElement | null {
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
  getXml(): XMLDocument {
    let xml = this.request.responseXML;

    // Handles missing response headers in IE, the first condition handles
    // the case where responseXML is there, but using its nodes leads to
    // type errors in the CellCodec when putting the nodes into a new
    // document. This happens in IE9 standards mode and with XML user
    // objects only, as they are used directly as values in cells.
    if (xml == null || xml.documentElement == null) {
      xml = new DOMParser().parseFromString(this.request.responseText, 'text/xml');
    }
    return xml;
  }

  /**
   * Returns the status as a number, eg. 404 for "Not found" or 200 for "OK".
   * Note: The NS_ERROR_NOT_AVAILABLE for invalid responses cannot be caught.
   */
  getStatus(): number {
    return this.request?.status;
  }

  /**
   * Creates and returns the inner {@link request} object.
   */
  create(): any {
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
  send(
    onload: Function | null = null,
    onerror: Function | null = null,
    timeout: number | null = null,
    ontimeout: Function | null = null
  ): void {
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

      this.request.open(this.method, this.url, this.async, this.username, this.password);
      this.setRequestHeaders(this.request, this.params);

      if (window.XMLHttpRequest && this.withCredentials) {
        this.request.withCredentials = 'true';
      }

      if (window.XMLHttpRequest && timeout != null && ontimeout != null) {
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
  setRequestHeaders(request: any, params: any): void {
    if (params != null) {
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
  }

  /**
   * Creates and posts a request to the given target URL using a dynamically
   * created form inside the given document.
   *
   * @param doc Document that contains the form element.
   * @param target Target to send the form result to.
   */
  simulate(doc: any, target: string | null = null): void {
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

    const params = <string>this.params;
    const pars = params.indexOf('&') > 0 ? params.split('&') : params.split(' ');

    // Adds the parameters as text areas to the form
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
 * Loads the specified URL *synchronously* and returns the {@link MaxXmlRequest}.
 * Throws an exception if the file cannot be loaded.
 * See {@link get} for  an asynchronous implementation.
 *
 * Example:
 *
 * ```javascript
 * try {
 *   const req = load(filename);
 *   cont root = req.getDocumentElement();
 *   // Process XML DOM...
 * } catch (e) {
 *   console.error(`Cannot load $filename`, e);
 * }
 * ```
 *
 * @param url URL to get the data from.
 */
export const load = (url: string): MaxXmlRequest => {
  const req = new MaxXmlRequest(url, null, 'GET', false);
  req.send();
  return req;
};

/**
 * Loads the specified URL *asynchronously* and invokes the given functions depending on the request status.
 * Returns the {@link MaxXmlRequest} in use.
 * Both functions take the {@link MaxXmlRequest} as the only parameter.
 * See {@link load} for a synchronous implementation.
 *
 * Example:
 *
 * ```javascript
 * get(url, (req) => {
 *    const node = req.getDocumentElement();
 *    // Process XML DOM...
 * });
 * ```
 *
 * So for example, to load a diagram into an existing graph model, the following code is used.
 *
 * ```javascript
 * get(url, (req) => {
 *   const node = req.getDocumentElement();
 *   const dec = new Codec(node.ownerDocument);
 *   dec.decode(node, graph.getDataModel());
 * });
 * ```
 *
 * @param url URL to get the data from.
 * @param onload Optional function to execute for a successful response.
 * @param onerror Optional function to execute on error.
 * @param binary Optional boolean parameter that specifies if the request is
 * binary.
 * @param timeout Optional timeout in ms before calling ontimeout.
 * @param ontimeout Optional function to execute on timeout.
 * @param headers Optional with headers, eg. {'Authorization': 'token xyz'}
 */
export const get = (
  url: string,
  onload: Function | null = null,
  onerror: Function | null = null,
  binary = false,
  timeout: number | null = null,
  ontimeout: Function | null = null,
  headers: { [key: string]: string } | null = null
) => {
  const req = new MaxXmlRequest(url, null, 'GET');
  const { setRequestHeaders } = req;

  if (headers) {
    req.setRequestHeaders = (request, params) => {
      setRequestHeaders.apply(this, [request, params]);
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
};

/**
 * Loads the URLs in the given array *asynchronously* and invokes the given function
 * if all requests returned with a valid 2xx status. The error handler is invoked
 * once on the first error or invalid response.
 *
 * @param urls Array of URLs to be loaded.
 * @param onload Callback with array of {@link XmlRequests}.
 * @param onerror Optional function to execute on error.
 */
export const getAll = (
  urls: string[],
  onload: (arg0: any) => void,
  onerror: () => void
) => {
  let remain = urls.length;
  const result: MaxXmlRequest[] = [];
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
        (req: MaxXmlRequest) => {
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
};

/**
 * Posts the specified params to the given URL *asynchronously* and invokes
 * the given functions depending on the request status. Returns the
 * <MaxXmlRequest> in use. Both functions take the <MaxXmlRequest> as the
 * only parameter. Make sure to use encodeURIComponent for the parameter
 * values.
 *
 * Example:
 *
 * ```javascript
 * mxUtils.post(url, 'key=value', (req)=>
 * {
 *   mxUtils.alert('Ready: '+req.isReady()+' Status: '+req.getStatus());
 *  // Process req.getDocumentElement() using DOM API if OK...
 * });
 * ```
 *
 * @param url URL to get the data from.
 * @param params Parameters for the post request.
 * @param onload Optional function to execute for a successful response.
 * @param onerror Optional function to execute on error.
 */
export const post = (
  url: string,
  params: string | null = null,
  onload: Function,
  onerror: Function | null = null
) => {
  return new MaxXmlRequest(url, params).send(onload, onerror);
};

/**
 * Submits the given parameters to the specified URL using
 * <MaxXmlRequest.simulate> and returns the <MaxXmlRequest>.
 * Make sure to use encodeURIComponent for the parameter
 * values.
 *
 * @param url URL to get the data from.
 * @param params Parameters for the form.
 * @param doc Document to create the form in.
 * @param target Target to send the form result to.
 */
export const submit = (url: string, params: string, doc: XMLDocument, target: string) => {
  return new MaxXmlRequest(url, params).simulate(doc, target);
};

export default MaxXmlRequest;
