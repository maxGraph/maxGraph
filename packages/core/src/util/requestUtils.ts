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

import MaxXmlRequest from './MaxXmlRequest';

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
 * @param binary Optional boolean parameter that specifies if the request is binary.
 * @param timeout Optional timeout in ms before calling ontimeout.
 * @param ontimeout Optional function to execute on timeout.
 * @param headers Optional with headers, eg. {'Authorization': 'token xyz'}
 */
export const get = (
  url: string,
  onload: ((sender: MaxXmlRequest) => void) | null = null,
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
 * @param onload Callback with array of {@link MaxXmlRequest}s.
 * @param onerror Optional function to execute on error.
 */
export const getAll = (
  urls: string[],
  onload: (requests: MaxXmlRequest[]) => void,
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
 * Posts the specified params to the given URL *asynchronously* and invokes the given functions depending on the request status.
 * Returns the {@link MaxXmlRequest} in use.
 * Both functions take the {@link MaxXmlRequest} as the only parameter.
 * Make sure to use encodeURIComponent for the parameter values.
 *
 * Example:
 *
 * ```javascript
 * post(url, 'key=value', (req) => {
 *   alert('Ready: ' + req.isReady() + ' Status: ' + req.getStatus());
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
 * Submits the given parameters to the specified URL using {@link MaxXmlRequest.simulate} and returns the {@link MaxXmlRequest}.
 * Make sure to use encodeURIComponent for the parameter values.
 *
 * @param url URL to get the data from.
 * @param params Parameters for the form.
 * @param doc Document to create the form in.
 * @param target Target to send the form result to.
 */
export const submit = (url: string, params: string, doc: XMLDocument, target: string) => {
  return new MaxXmlRequest(url, params).simulate(doc, target);
};
