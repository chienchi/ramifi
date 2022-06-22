(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.igv_webapp = {}));
})(this, (function (exports) { 'use strict';

    function offset$1(elem) {
      // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
      // Support: IE <=11 only
      // Running getBoundingClientRect on a
      // disconnected node in IE throws an error
      if (!elem.getClientRects().length) {
        return {
          top: 0,
          left: 0
        };
      } // Get document-relative position by adding viewport scroll to viewport-relative gBCR


      const rect = elem.getBoundingClientRect();
      const win = elem.ownerDocument.defaultView;
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
      };
    }

    function guid$1() {
      return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
    }

    function isGoogleURL$2(url) {
      return url.includes("googleapis") && !url.includes("urlshortener") || isGoogleStorageURL$2(url) || isGoogleDriveURL$2(url);
    }

    function isGoogleStorageURL$2(url) {
      return url.startsWith("gs://") || url.startsWith("https://www.googleapis.com/storage") || url.startsWith("https://storage.cloud.google.com") || url.startsWith("https://storage.googleapis.com");
    }

    function isGoogleDriveURL$2(url) {
      return url.indexOf("drive.google.com") >= 0 || url.indexOf("www.googleapis.com/drive") > 0;
    }
    /**
     * Translate gs:// urls to https
     * See https://cloud.google.com/storage/docs/json_api/v1
     * @param gsUrl
     * @returns {string|*}
     */


    function translateGoogleCloudURL$2(gsUrl) {
      let {
        bucket,
        object
      } = parseBucketName$2(gsUrl);
      object = encode$2(object);
      const qIdx = gsUrl.indexOf('?');
      const paramString = qIdx > 0 ? gsUrl.substring(qIdx) + "&alt=media" : "?alt=media";
      return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}${paramString}`;
    }
    /**
     * Parse a google bucket and object name from a google storage URL.  Known forms include
     *
     * gs://BUCKET_NAME/OBJECT_NAME
     * https://storage.googleapis.com/BUCKET_NAME/OBJECT_NAME
     * https://storage.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
     * https://www.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME"
     * https://storage.googleapis.com/download/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
     *
     * @param url
     */


    function parseBucketName$2(url) {
      let bucket;
      let object;

      if (url.startsWith("gs://")) {
        const i = url.indexOf('/', 5);

        if (i >= 0) {
          bucket = url.substring(5, i);
          const qIdx = url.indexOf('?');
          object = qIdx < 0 ? url.substring(i + 1) : url.substring(i + 1, qIdx);
        }
      } else if (url.startsWith("https://storage.googleapis.com") || url.startsWith("https://storage.cloud.google.com")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);

        if (bucketIdx > 0) {
          const objIdx = url.indexOf("/o/", bucketIdx);

          if (objIdx > 0) {
            const queryIdx = url.indexOf("?", objIdx);
            bucket = url.substring(bucketIdx + 6, objIdx);
            object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
          }
        } else {
          const idx1 = url.indexOf("/", 8);
          const idx2 = url.indexOf("/", idx1 + 1);
          const idx3 = url.indexOf("?", idx2);

          if (idx2 > 0) {
            bucket = url.substring(idx1 + 1, idx2);
            object = idx3 < 0 ? url.substring(idx2 + 1) : url.substring(idx2 + 1, idx3);
          }
        }
      } else if (url.startsWith("https://www.googleapis.com/storage/v1/b")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);
        const objIdx = url.indexOf("/o/", bucketIdx);

        if (objIdx > 0) {
          const queryIdx = url.indexOf("?", objIdx);
          bucket = url.substring(bucketIdx + 6, objIdx);
          object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
        }
      }

      if (bucket && object) {
        return {
          bucket,
          object
        };
      } else {
        throw Error(`Unrecognized Google Storage URI: ${url}`);
      }
    }

    function driveDownloadURL$2(link) {
      // Return a google drive download url for the sharable link
      //https://drive.google.com/open?id=0B-lleX9c2pZFbDJ4VVRxakJzVGM
      //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
      var id = getGoogleDriveFileID$2(link);
      return id ? "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media&supportsTeamDrives=true" : link;
    }

    function getGoogleDriveFileID$2(link) {
      //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
      //https://www.googleapis.com/drive/v3/files/1w-tvo6p1SH4p1OaQSVxpkV_EJgGIstWF?alt=media&supportsTeamDrives=true"
      if (link.includes("/open?id=")) {
        const i1 = link.indexOf("/open?id=") + 9;
        const i2 = link.indexOf("&");

        if (i1 > 0 && i2 > i1) {
          return link.substring(i1, i2);
        } else if (i1 > 0) {
          return link.substring(i1);
        }
      } else if (link.includes("/file/d/")) {
        const i1 = link.indexOf("/file/d/") + 8;
        const i2 = link.lastIndexOf("/");
        return link.substring(i1, i2);
      } else if (link.startsWith("https://www.googleapis.com/drive")) {
        let i1 = link.indexOf("/files/");
        const i2 = link.indexOf("?");

        if (i1 > 0) {
          i1 += 7;
          return i2 > 0 ? link.substring(i1, i2) : link.substring(i1);
        }
      }

      throw Error("Unknown Google Drive url format: " + link);
    }
    /**
     * Percent a GCS object name.  See https://cloud.google.com/storage/docs/request-endpoints
     * Specific characters to encode:
     *   !, #, $, &, ', (, ), *, +, ,, /, :, ;, =, ?, @, [, ], and space characters.
     * @param obj
     */


    function encode$2(objectName) {
      let result = '';
      objectName.split('').forEach(function (letter) {
        if (encodings$2.has(letter)) {
          result += encodings$2.get(letter);
        } else {
          result += letter;
        }
      });
      return result;
    } //	%23	%24	%25	%26	%27	%28	%29	%2A	%2B	%2C	%2F	%3A	%3B	%3D	%3F	%40	%5B	%5D


    const encodings$2 = new Map();
    encodings$2.set("!", "%21");
    encodings$2.set("#", "%23");
    encodings$2.set("$", "%24");
    encodings$2.set("%", "%25");
    encodings$2.set("&", "%26");
    encodings$2.set("'", "%27");
    encodings$2.set("(", "%28");
    encodings$2.set(")", "%29");
    encodings$2.set("*", "%2A");
    encodings$2.set("+", "%2B");
    encodings$2.set(",", "%2C");
    encodings$2.set("/", "%2F");
    encodings$2.set(":", "%3A");
    encodings$2.set(";", "%3B");
    encodings$2.set("=", "%3D");
    encodings$2.set("?", "%3F");
    encodings$2.set("@", "%40");
    encodings$2.set("[", "%5B");
    encodings$2.set("]", "%5D");
    encodings$2.set(" ", "%20"); // For testing

    // Convenience functions for the gapi oAuth library.
    const FIVE_MINUTES$2 = 5 * 60 * 1000;

    async function load$3(library) {
      return new Promise(function (resolve, reject) {
        gapi.load(library, {
          callback: resolve,
          onerror: reject
        });
      });
    }

    async function init$1(config) {
      if (isInitialized$2()) {
        console.warn("oAuth has already been initialized");
        return;
      }

      gapi.apiKey = config.apiKey; // copy config, gapi will modify it

      const configCopy = Object.assign({}, config);

      if (!configCopy.scope) {
        configCopy.scope = 'profile';
      }

      if (!config.client_id) {
        config.client_id = config.clientId;
      }

      await load$3("auth2");
      return new Promise(function (resolve, reject) {
        gapi.auth2.init(configCopy).then(resolve, reject);
      });
    }

    function isInitialized$2() {
      return typeof gapi !== "undefined" && gapi.auth2 && gapi.auth2.getAuthInstance();
    }

    let inProgress$2 = false;

    async function getAccessToken$2(scope) {
      if (typeof gapi === "undefined") {
        throw Error("Google authentication requires the 'gapi' library");
      }

      if (!gapi.auth2) {
        throw Error("Google 'auth2' has not been initialized");
      }

      if (inProgress$2) {
        return new Promise(function (resolve, reject) {
          let intervalID;

          const checkForToken = () => {
            // Wait for inProgress to equal "false"
            try {
              if (inProgress$2 === false) {
                //console.log("Delayed resolution for " + scope);
                resolve(getAccessToken$2(scope));
                clearInterval(intervalID);
              }
            } catch (e) {
              clearInterval(intervalID);
              reject(e);
            }
          };

          intervalID = setInterval(checkForToken, 100);
        });
      } else {
        inProgress$2 = true;

        try {
          let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
          let token;

          if (currentUser.isSignedIn()) {
            if (!currentUser.hasGrantedScopes(scope)) {
              await currentUser.grant({
                scope
              });
            }

            const {
              access_token,
              expires_at
            } = currentUser.getAuthResponse();

            if (Date.now() < expires_at - FIVE_MINUTES$2) {
              token = {
                access_token,
                expires_at
              };
            } else {
              const {
                access_token,
                expires_at
              } = currentUser.reloadAuthResponse();
              token = {
                access_token,
                expires_at
              };
            }
          } else {
            currentUser = await signIn$2(scope);
            const {
              access_token,
              expires_at
            } = currentUser.getAuthResponse();
            token = {
              access_token,
              expires_at
            };
          }

          return token;
        } finally {
          inProgress$2 = false;
        }
      }
    }
    /**
     * Return the current access token if the user is signed in, or undefined otherwise.  This function does not
     * attempt a signIn or request any specfic scopes.
     *
     * @returns access_token || undefined
     */


    function getCurrentAccessToken$2() {
      let currentUser = gapi.auth2.getAuthInstance().currentUser.get();

      if (currentUser && currentUser.isSignedIn()) {
        const {
          access_token,
          expires_at
        } = currentUser.getAuthResponse();
        return {
          access_token,
          expires_at
        };
      } else {
        return undefined;
      }
    }

    async function signIn$2(scope) {
      const options = new gapi.auth2.SigninOptionsBuilder();
      options.setPrompt('select_account');
      options.setScope(scope);
      return gapi.auth2.getAuthInstance().signIn(options);
    }

    async function signOut() {
      return gapi.auth2.getAuthInstance().signOut();
    }

    function getScopeForURL$2(url) {
      if (isGoogleDriveURL$2(url)) {
        return "https://www.googleapis.com/auth/drive.file";
      } else if (isGoogleStorageURL$2(url)) {
        return "https://www.googleapis.com/auth/devstorage.read_only";
      } else {
        return 'https://www.googleapis.com/auth/userinfo.profile';
      }
    }

    if (typeof process === 'object' && typeof window === 'undefined') {
      global.atob = function (str) {
        return Buffer.from(str, 'base64').toString('binary');
      };
    }

    function parseUri$2(str) {
      var o = options$2,
          m = o.parser["loose"].exec(str),
          uri = {},
          i = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });
      return uri;
    }

    const options$2 = {
      strictMode: false,
      key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
      q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };

    /**
     * Test if object is a File or File-like object.
     *
     * @param object
     */


    function isFile(object) {
      if (!object) {
        return false;
      }

      return typeof object !== 'function' && (object instanceof File || object.hasOwnProperty("name") && typeof object.slice === 'function' && typeof object.arrayBuffer === 'function');
    }

    const isFilePath$1 = isFile; // deprecated

    // Ths file is a modification of the pako distribution https://github.com/nodeca/pako.   The modifications
    // consists of simple changes to create an ES6 module, specifically commenting out the function wrapper and
    // adding an ES6 export statement.
    // **************  COMMENTED OUT BY JTR ******************//

    /*! pako 2.0.4 https://github.com/nodeca/pako @license (MIT AND Zlib) */
    // (function (global, factory) {
    //   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    //   typeof define === 'function' && define.amd ? define(['exports'], factory) :
    //   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.pako = {}));
    // }(this, (function (exports) { 'use strict';
    // **************  COMMENTED OUT BY JTR ******************//
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    /* eslint-disable space-unary-ops */

    /* Public constants ==========================================================*/

    /* ===========================================================================*/
    //const Z_FILTERED          = 1;
    //const Z_HUFFMAN_ONLY      = 2;
    //const Z_RLE               = 3;
    const Z_FIXED$1 = 4; //const Z_DEFAULT_STRATEGY  = 0;

    /* Possible values of the data_type field (though see inflate()) */

    const Z_BINARY = 0;
    const Z_TEXT = 1; //const Z_ASCII             = 1; // = Z_TEXT

    const Z_UNKNOWN$1 = 2;
    /*============================================================================*/

    function zero$1(buf) {
      let len = buf.length;

      while (--len >= 0) {
        buf[len] = 0;
      }
    } // From zutil.h


    const STORED_BLOCK = 0;
    const STATIC_TREES = 1;
    const DYN_TREES = 2;
    /* The three kinds of block type */

    const MIN_MATCH$1 = 3;
    const MAX_MATCH$1 = 258;
    /* The minimum and maximum match lengths */
    // From deflate.h

    /* ===========================================================================
     * Internal compression state.
     */

    const LENGTH_CODES$1 = 29;
    /* number of length codes, not counting the special END_BLOCK code */

    const LITERALS$1 = 256;
    /* number of literal bytes 0..255 */

    const L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
    /* number of Literal or Length codes, including the END_BLOCK code */

    const D_CODES$1 = 30;
    /* number of distance codes */

    const BL_CODES$1 = 19;
    /* number of codes used to transfer the bit lengths */

    const HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
    /* maximum heap size */

    const MAX_BITS$1 = 15;
    /* All codes must not exceed MAX_BITS bits */

    const Buf_size = 16;
    /* size of bit buffer in bi_buf */

    /* ===========================================================================
     * Constants
     */

    const MAX_BL_BITS = 7;
    /* Bit length codes must not exceed MAX_BL_BITS bits */

    const END_BLOCK = 256;
    /* end of block literal code */

    const REP_3_6 = 16;
    /* repeat previous bit length 3-6 times (2 bits of repeat count) */

    const REPZ_3_10 = 17;
    /* repeat a zero length 3-10 times  (3 bits of repeat count) */

    const REPZ_11_138 = 18;
    /* repeat a zero length 11-138 times  (7 bits of repeat count) */

    /* eslint-disable comma-spacing,array-bracket-spacing */

    const extra_lbits =
    /* extra bits for each length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]);
    const extra_dbits =
    /* extra bits for each distance code */
    new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
    const extra_blbits =
    /* extra bits for each bit length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]);
    const bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    /* eslint-enable comma-spacing,array-bracket-spacing */

    /* The lengths of the bit length codes are sent in order of decreasing
     * probability, to avoid transmitting the lengths for unused bit length codes.
     */

    /* ===========================================================================
     * Local data. These are initialized only once.
     */
    // We pre-fill arrays with 0 to avoid uninitialized gaps

    const DIST_CODE_LEN = 512;
    /* see definition of array dist_code below */
    // !!!! Use flat array instead of structure, Freq = i*2, Len = i*2+1

    const static_ltree = new Array((L_CODES$1 + 2) * 2);
    zero$1(static_ltree);
    /* The static literal tree. Since the bit lengths are imposed, there is no
     * need for the L_CODES extra codes used during heap construction. However
     * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
     * below).
     */

    const static_dtree = new Array(D_CODES$1 * 2);
    zero$1(static_dtree);
    /* The static distance tree. (Actually a trivial tree since all codes use
     * 5 bits.)
     */

    const _dist_code = new Array(DIST_CODE_LEN);

    zero$1(_dist_code);
    /* Distance codes. The first 256 values correspond to the distances
     * 3 .. 258, the last 256 values correspond to the top 8 bits of
     * the 15 bit distances.
     */

    const _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);

    zero$1(_length_code);
    /* length code for each normalized match length (0 == MIN_MATCH) */

    const base_length = new Array(LENGTH_CODES$1);
    zero$1(base_length);
    /* First normalized length for each code (0 = MIN_MATCH) */

    const base_dist = new Array(D_CODES$1);
    zero$1(base_dist);
    /* First normalized distance for each code (0 = distance of 1) */

    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
      this.static_tree = static_tree;
      /* static tree or NULL */

      this.extra_bits = extra_bits;
      /* extra bits for each code or NULL */

      this.extra_base = extra_base;
      /* base index for extra_bits */

      this.elems = elems;
      /* max number of elements in the tree */

      this.max_length = max_length;
      /* max bit length for the codes */
      // show if `static_tree` has data or dummy - needed for monomorphic objects

      this.has_stree = static_tree && static_tree.length;
    }

    let static_l_desc;
    let static_d_desc;
    let static_bl_desc;

    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;
      /* the dynamic tree */

      this.max_code = 0;
      /* largest code with non zero frequency */

      this.stat_desc = stat_desc;
      /* the corresponding static tree */
    }

    const d_code = dist => {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    };
    /* ===========================================================================
     * Output a short LSB first on the stream.
     * IN assertion: there is enough room in pendingBuf.
     */


    const put_short = (s, w) => {
      //    put_byte(s, (uch)((w) & 0xff));
      //    put_byte(s, (uch)((ush)(w) >> 8));
      s.pending_buf[s.pending++] = w & 0xff;
      s.pending_buf[s.pending++] = w >>> 8 & 0xff;
    };
    /* ===========================================================================
     * Send a value on a given number of bits.
     * IN assertion: length <= 16 and value fits in length bits.
     */


    const send_bits = (s, value, length) => {
      if (s.bi_valid > Buf_size - length) {
        s.bi_buf |= value << s.bi_valid & 0xffff;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> Buf_size - s.bi_valid;
        s.bi_valid += length - Buf_size;
      } else {
        s.bi_buf |= value << s.bi_valid & 0xffff;
        s.bi_valid += length;
      }
    };

    const send_code = (s, c, tree) => {
      send_bits(s, tree[c * 2]
      /*.Code*/
      , tree[c * 2 + 1]
      /*.Len*/
      );
    };
    /* ===========================================================================
     * Reverse the first len bits of a code, using straightforward code (a faster
     * method would use a table)
     * IN assertion: 1 <= len <= 15
     */


    const bi_reverse = (code, len) => {
      let res = 0;

      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);

      return res >>> 1;
    };
    /* ===========================================================================
     * Flush the bit buffer, keeping at most 7 bits in it.
     */


    const bi_flush = s => {
      if (s.bi_valid === 16) {
        put_short(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;
      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 0xff;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    };
    /* ===========================================================================
     * Compute the optimal bit lengths for a tree and update the total bit length
     * for the current block.
     * IN assertion: the fields freq and dad are set, heap[heap_max] and
     *    above are the tree nodes sorted by increasing frequency.
     * OUT assertions: the field len is set to the optimal bit length, the
     *     array bl_count contains the frequencies for each bit length.
     *     The length opt_len is updated; static_len is also updated if stree is
     *     not null.
     */


    const gen_bitlen = (s, desc) => //    deflate_state *s;
    //    tree_desc *desc;    /* the tree descriptor */
    {
      const tree = desc.dyn_tree;
      const max_code = desc.max_code;
      const stree = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const extra = desc.stat_desc.extra_bits;
      const base = desc.stat_desc.extra_base;
      const max_length = desc.stat_desc.max_length;
      let h;
      /* heap index */

      let n, m;
      /* iterate over the tree elements */

      let bits;
      /* bit length */

      let xbits;
      /* extra bits */

      let f;
      /* frequency */

      let overflow = 0;
      /* number of elements with bit length too large */

      for (bits = 0; bits <= MAX_BITS$1; bits++) {
        s.bl_count[bits] = 0;
      }
      /* In a first pass, compute the optimal bit lengths (which may
       * overflow in the case of the bit length tree).
       */


      tree[s.heap[s.heap_max] * 2 + 1]
      /*.Len*/
      = 0;
      /* root of the heap */

      for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1]
        /*.Dad*/
        * 2 + 1]
        /*.Len*/
        + 1;

        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }

        tree[n * 2 + 1]
        /*.Len*/
        = bits;
        /* We overwrite tree[n].Dad which is no longer needed */

        if (n > max_code) {
          continue;
        }
        /* not a leaf node */


        s.bl_count[bits]++;
        xbits = 0;

        if (n >= base) {
          xbits = extra[n - base];
        }

        f = tree[n * 2]
        /*.Freq*/
        ;
        s.opt_len += f * (bits + xbits);

        if (has_stree) {
          s.static_len += f * (stree[n * 2 + 1]
          /*.Len*/
          + xbits);
        }
      }

      if (overflow === 0) {
        return;
      } // Trace((stderr,"\nbit length overflow\n"));

      /* This happens for example on obj2 and pic of the Calgary corpus */

      /* Find the first bit length which could increase: */


      do {
        bits = max_length - 1;

        while (s.bl_count[bits] === 0) {
          bits--;
        }

        s.bl_count[bits]--;
        /* move one leaf down the tree */

        s.bl_count[bits + 1] += 2;
        /* move one overflow item as its brother */

        s.bl_count[max_length]--;
        /* The brother of the overflow item also moves one step up,
         * but this does not affect bl_count[max_length]
         */

        overflow -= 2;
      } while (overflow > 0);
      /* Now recompute all bit lengths, scanning in increasing frequency.
       * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
       * lengths instead of fixing only the wrong ones. This idea is taken
       * from 'ar' written by Haruhiko Okumura.)
       */


      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];

        while (n !== 0) {
          m = s.heap[--h];

          if (m > max_code) {
            continue;
          }

          if (tree[m * 2 + 1]
          /*.Len*/
          !== bits) {
            // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
            s.opt_len += (bits - tree[m * 2 + 1]
            /*.Len*/
            ) * tree[m * 2]
            /*.Freq*/
            ;
            tree[m * 2 + 1]
            /*.Len*/
            = bits;
          }

          n--;
        }
      }
    };
    /* ===========================================================================
     * Generate the codes for a given tree and bit counts (which need not be
     * optimal).
     * IN assertion: the array bl_count contains the bit length statistics for
     * the given tree and the field len is set for all tree elements.
     * OUT assertion: the field code is set for all tree elements of non
     *     zero code length.
     */


    const gen_codes = (tree, max_code, bl_count) => //    ct_data *tree;             /* the tree to decorate */
    //    int max_code;              /* largest code with non zero frequency */
    //    ushf *bl_count;            /* number of codes at each bit length */
    {
      const next_code = new Array(MAX_BITS$1 + 1);
      /* next code value for each bit length */

      let code = 0;
      /* running code value */

      let bits;
      /* bit index */

      let n;
      /* code index */

      /* The distribution counts are first used to generate the code values
       * without bit reversal.
       */

      for (bits = 1; bits <= MAX_BITS$1; bits++) {
        next_code[bits] = code = code + bl_count[bits - 1] << 1;
      }
      /* Check that the bit counts in bl_count are consistent. The last code
       * must be all ones.
       */
      //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
      //        "inconsistent bit counts");
      //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));


      for (n = 0; n <= max_code; n++) {
        let len = tree[n * 2 + 1]
        /*.Len*/
        ;

        if (len === 0) {
          continue;
        }
        /* Now reverse the bits */


        tree[n * 2]
        /*.Code*/
        = bi_reverse(next_code[len]++, len); //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
        //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
      }
    };
    /* ===========================================================================
     * Initialize the various 'constant' tables.
     */


    const tr_static_init = () => {
      let n;
      /* iterates over tree elements */

      let bits;
      /* bit counter */

      let length;
      /* length value */

      let code;
      /* code value */

      let dist;
      /* distance index */

      const bl_count = new Array(MAX_BITS$1 + 1);
      /* number of codes at each bit length for an optimal tree */
      // do check in _tr_init()
      //if (static_init_done) return;

      /* For some embedded targets, global variables are not initialized: */

      /*#ifdef NO_INIT_GLOBAL_POINTERS
        static_l_desc.static_tree = static_ltree;
        static_l_desc.extra_bits = extra_lbits;
        static_d_desc.static_tree = static_dtree;
        static_d_desc.extra_bits = extra_dbits;
        static_bl_desc.extra_bits = extra_blbits;
      #endif*/

      /* Initialize the mapping length (0..255) -> length code (0..28) */

      length = 0;

      for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
        base_length[code] = length;

        for (n = 0; n < 1 << extra_lbits[code]; n++) {
          _length_code[length++] = code;
        }
      } //Assert (length == 256, "tr_static_init: length != 256");

      /* Note that the length 255 (match length 258) can be represented
       * in two different ways: code 284 + 5 bits or code 285, so we
       * overwrite length_code[255] to use the best encoding:
       */


      _length_code[length - 1] = code;
      /* Initialize the mapping dist (0..32K) -> dist code (0..29) */

      dist = 0;

      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;

        for (n = 0; n < 1 << extra_dbits[code]; n++) {
          _dist_code[dist++] = code;
        }
      } //Assert (dist == 256, "tr_static_init: dist != 256");


      dist >>= 7;
      /* from now on, all distances are divided by 128 */

      for (; code < D_CODES$1; code++) {
        base_dist[code] = dist << 7;

        for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
          _dist_code[256 + dist++] = code;
        }
      } //Assert (dist == 256, "tr_static_init: 256+dist != 512");

      /* Construct the codes of the static literal tree */


      for (bits = 0; bits <= MAX_BITS$1; bits++) {
        bl_count[bits] = 0;
      }

      n = 0;

      while (n <= 143) {
        static_ltree[n * 2 + 1]
        /*.Len*/
        = 8;
        n++;
        bl_count[8]++;
      }

      while (n <= 255) {
        static_ltree[n * 2 + 1]
        /*.Len*/
        = 9;
        n++;
        bl_count[9]++;
      }

      while (n <= 279) {
        static_ltree[n * 2 + 1]
        /*.Len*/
        = 7;
        n++;
        bl_count[7]++;
      }

      while (n <= 287) {
        static_ltree[n * 2 + 1]
        /*.Len*/
        = 8;
        n++;
        bl_count[8]++;
      }
      /* Codes 286 and 287 do not exist, but we must include them in the
       * tree construction to get a canonical Huffman tree (longest code
       * all ones)
       */


      gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
      /* The static distance tree is trivial: */

      for (n = 0; n < D_CODES$1; n++) {
        static_dtree[n * 2 + 1]
        /*.Len*/
        = 5;
        static_dtree[n * 2]
        /*.Code*/
        = bi_reverse(n, 5);
      } // Now data ready and we can init static trees


      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS); //static_init_done = true;
    };
    /* ===========================================================================
     * Initialize a new block.
     */


    const init_block = s => {
      let n;
      /* iterates over tree elements */

      /* Initialize the trees. */

      for (n = 0; n < L_CODES$1; n++) {
        s.dyn_ltree[n * 2]
        /*.Freq*/
        = 0;
      }

      for (n = 0; n < D_CODES$1; n++) {
        s.dyn_dtree[n * 2]
        /*.Freq*/
        = 0;
      }

      for (n = 0; n < BL_CODES$1; n++) {
        s.bl_tree[n * 2]
        /*.Freq*/
        = 0;
      }

      s.dyn_ltree[END_BLOCK * 2]
      /*.Freq*/
      = 1;
      s.opt_len = s.static_len = 0;
      s.last_lit = s.matches = 0;
    };
    /* ===========================================================================
     * Flush the bit buffer and align the output on a byte boundary
     */


    const bi_windup = s => {
      if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        //put_byte(s, (Byte)s->bi_buf);
        s.pending_buf[s.pending++] = s.bi_buf;
      }

      s.bi_buf = 0;
      s.bi_valid = 0;
    };
    /* ===========================================================================
     * Copy a stored block, storing first the length and its
     * one's complement if requested.
     */


    const copy_block = (s, buf, len, header) => //DeflateState *s;
    //charf    *buf;    /* the input data */
    //unsigned len;     /* its length */
    //int      header;  /* true if block header must be written */
    {
      bi_windup(s);
      /* align on byte boundary */

      if (header) {
        put_short(s, len);
        put_short(s, ~len);
      } //  while (len--) {
      //    put_byte(s, *buf++);
      //  }


      s.pending_buf.set(s.window.subarray(buf, buf + len), s.pending);
      s.pending += len;
    };
    /* ===========================================================================
     * Compares to subtrees, using the tree depth as tie breaker when
     * the subtrees have equal frequency. This minimizes the worst case length.
     */


    const smaller = (tree, n, m, depth) => {
      const _n2 = n * 2;

      const _m2 = m * 2;

      return tree[_n2]
      /*.Freq*/
      < tree[_m2]
      /*.Freq*/
      || tree[_n2]
      /*.Freq*/
      === tree[_m2]
      /*.Freq*/
      && depth[n] <= depth[m];
    };
    /* ===========================================================================
     * Restore the heap property by moving down the tree starting at node k,
     * exchanging a node with the smallest of its two sons if necessary, stopping
     * when the heap property is re-established (each father smaller than its
     * two sons).
     */


    const pqdownheap = (s, tree, k) => //    deflate_state *s;
    //    ct_data *tree;  /* the tree to restore */
    //    int k;               /* node to move down */
    {
      const v = s.heap[k];
      let j = k << 1;
      /* left son of k */

      while (j <= s.heap_len) {
        /* Set j to the smallest of the two sons: */
        if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        /* Exit if v is smaller than both sons */


        if (smaller(tree, v, s.heap[j], s.depth)) {
          break;
        }
        /* Exchange v with the smallest son */


        s.heap[k] = s.heap[j];
        k = j;
        /* And continue down the tree, setting j to the left son of k */

        j <<= 1;
      }

      s.heap[k] = v;
    }; // inlined manually
    // const SMALLEST = 1;

    /* ===========================================================================
     * Send the block data compressed using the given Huffman trees
     */


    const compress_block = (s, ltree, dtree) => //    deflate_state *s;
    //    const ct_data *ltree; /* literal tree */
    //    const ct_data *dtree; /* distance tree */
    {
      let dist;
      /* distance of matched string */

      let lc;
      /* match length or unmatched char (if dist == 0) */

      let lx = 0;
      /* running index in l_buf */

      let code;
      /* the code to send */

      let extra;
      /* number of extra bits to send */

      if (s.last_lit !== 0) {
        do {
          dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
          lc = s.pending_buf[s.l_buf + lx];
          lx++;

          if (dist === 0) {
            send_code(s, lc, ltree);
            /* send a literal byte */
            //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
          } else {
            /* Here, lc is the match length - MIN_MATCH */
            code = _length_code[lc];
            send_code(s, code + LITERALS$1 + 1, ltree);
            /* send the length code */

            extra = extra_lbits[code];

            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s, lc, extra);
              /* send the extra length bits */
            }

            dist--;
            /* dist is now the match distance - 1 */

            code = d_code(dist); //Assert (code < D_CODES, "bad d_code");

            send_code(s, code, dtree);
            /* send the distance code */

            extra = extra_dbits[code];

            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s, dist, extra);
              /* send the extra distance bits */
            }
          }
          /* literal or match pair ? */

          /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
          //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
          //       "pendingBuf overflow");

        } while (lx < s.last_lit);
      }

      send_code(s, END_BLOCK, ltree);
    };
    /* ===========================================================================
     * Construct one Huffman tree and assigns the code bit strings and lengths.
     * Update the total bit length for the current block.
     * IN assertion: the field freq is set for all tree elements.
     * OUT assertions: the fields len and code are set to the optimal bit length
     *     and corresponding code. The length opt_len is updated; static_len is
     *     also updated if stree is not null. The field max_code is set.
     */


    const build_tree = (s, desc) => //    deflate_state *s;
    //    tree_desc *desc; /* the tree descriptor */
    {
      const tree = desc.dyn_tree;
      const stree = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const elems = desc.stat_desc.elems;
      let n, m;
      /* iterate over heap elements */

      let max_code = -1;
      /* largest code with non zero frequency */

      let node;
      /* new node being created */

      /* Construct the initial heap, with least frequent element in
       * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
       * heap[0] is not used.
       */

      s.heap_len = 0;
      s.heap_max = HEAP_SIZE$1;

      for (n = 0; n < elems; n++) {
        if (tree[n * 2]
        /*.Freq*/
        !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;
        } else {
          tree[n * 2 + 1]
          /*.Len*/
          = 0;
        }
      }
      /* The pkzip format requires that at least one distance code exists,
       * and that at least one bit should be sent even if there is only one
       * possible code. So to avoid special checks later on we force at least
       * two codes of non zero frequency.
       */


      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2]
        /*.Freq*/
        = 1;
        s.depth[node] = 0;
        s.opt_len--;

        if (has_stree) {
          s.static_len -= stree[node * 2 + 1]
          /*.Len*/
          ;
        }
        /* node is 0 or 1 so it does not have extra bits */

      }

      desc.max_code = max_code;
      /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
       * establish sub-heaps of increasing lengths:
       */

      for (n = s.heap_len >> 1
      /*int /2*/
      ; n >= 1; n--) {
        pqdownheap(s, tree, n);
      }
      /* Construct the Huffman tree by repeatedly combining the least two
       * frequent nodes.
       */


      node = elems;
      /* next internal node of the tree */

      do {
        //pqremove(s, tree, n);  /* n = node of least frequency */

        /*** pqremove ***/
        n = s.heap[1
        /*SMALLEST*/
        ];
        s.heap[1
        /*SMALLEST*/
        ] = s.heap[s.heap_len--];
        pqdownheap(s, tree, 1
        /*SMALLEST*/
        );
        /***/

        m = s.heap[1
        /*SMALLEST*/
        ];
        /* m = node of next least frequency */

        s.heap[--s.heap_max] = n;
        /* keep the nodes sorted by frequency */

        s.heap[--s.heap_max] = m;
        /* Create a new node father of n and m */

        tree[node * 2]
        /*.Freq*/
        = tree[n * 2]
        /*.Freq*/
        + tree[m * 2]
        /*.Freq*/
        ;
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1]
        /*.Dad*/
        = tree[m * 2 + 1]
        /*.Dad*/
        = node;
        /* and insert the new node in the heap */

        s.heap[1
        /*SMALLEST*/
        ] = node++;
        pqdownheap(s, tree, 1
        /*SMALLEST*/
        );
      } while (s.heap_len >= 2);

      s.heap[--s.heap_max] = s.heap[1
      /*SMALLEST*/
      ];
      /* At this point, the fields freq and dad are set. We can now
       * generate the bit lengths.
       */

      gen_bitlen(s, desc);
      /* The field len is now set, we can generate the bit codes */

      gen_codes(tree, max_code, s.bl_count);
    };
    /* ===========================================================================
     * Scan a literal or distance tree to determine the frequencies of the codes
     * in the bit length tree.
     */


    const scan_tree = (s, tree, max_code) => //    deflate_state *s;
    //    ct_data *tree;   /* the tree to be scanned */
    //    int max_code;    /* and its largest code of non zero frequency */
    {
      let n;
      /* iterates over all tree elements */

      let prevlen = -1;
      /* last emitted length */

      let curlen;
      /* length of current code */

      let nextlen = tree[0 * 2 + 1]
      /*.Len*/
      ;
      /* length of next code */

      let count = 0;
      /* repeat count of the current code */

      let max_count = 7;
      /* max repeat count */

      let min_count = 4;
      /* min repeat count */

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }

      tree[(max_code + 1) * 2 + 1]
      /*.Len*/
      = 0xffff;
      /* guard */

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1]
        /*.Len*/
        ;

        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s.bl_tree[curlen * 2]
          /*.Freq*/
          += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s.bl_tree[curlen * 2] /*.Freq*/++;
          }

          s.bl_tree[REP_3_6 * 2] /*.Freq*/++;
        } else if (count <= 10) {
          s.bl_tree[REPZ_3_10 * 2] /*.Freq*/++;
        } else {
          s.bl_tree[REPZ_11_138 * 2] /*.Freq*/++;
        }

        count = 0;
        prevlen = curlen;

        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };
    /* ===========================================================================
     * Send a literal or distance tree in compressed form, using the codes in
     * bl_tree.
     */


    const send_tree = (s, tree, max_code) => //    deflate_state *s;
    //    ct_data *tree; /* the tree to be scanned */
    //    int max_code;       /* and its largest code of non zero frequency */
    {
      let n;
      /* iterates over all tree elements */

      let prevlen = -1;
      /* last emitted length */

      let curlen;
      /* length of current code */

      let nextlen = tree[0 * 2 + 1]
      /*.Len*/
      ;
      /* length of next code */

      let count = 0;
      /* repeat count of the current code */

      let max_count = 7;
      /* max repeat count */

      let min_count = 4;
      /* min repeat count */

      /* tree[max_code+1].Len = -1; */

      /* guard already set */

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1]
        /*.Len*/
        ;

        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(s, curlen, s.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s, curlen, s.bl_tree);
            count--;
          } //Assert(count >= 3 && count <= 6, " 3_6?");


          send_code(s, REP_3_6, s.bl_tree);
          send_bits(s, count - 3, 2);
        } else if (count <= 10) {
          send_code(s, REPZ_3_10, s.bl_tree);
          send_bits(s, count - 3, 3);
        } else {
          send_code(s, REPZ_11_138, s.bl_tree);
          send_bits(s, count - 11, 7);
        }

        count = 0;
        prevlen = curlen;

        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };
    /* ===========================================================================
     * Construct the Huffman tree for the bit lengths and return the index in
     * bl_order of the last bit length code to send.
     */


    const build_bl_tree = s => {
      let max_blindex;
      /* index of last bit length code of non zero freq */

      /* Determine the bit length frequencies for literal and distance trees */

      scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
      /* Build the bit length tree: */

      build_tree(s, s.bl_desc);
      /* opt_len now includes the length of the tree representations, except
       * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
       */

      /* Determine the number of bit length codes to send. The pkzip format
       * requires that at least 4 bit length codes be sent. (appnote.txt says
       * 3 but the actual value used is 4.)
       */

      for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1]
        /*.Len*/
        !== 0) {
          break;
        }
      }
      /* Update opt_len to include the bit length tree and counts */


      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4; //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
      //        s->opt_len, s->static_len));

      return max_blindex;
    };
    /* ===========================================================================
     * Send the header for a block using dynamic Huffman trees: the counts, the
     * lengths of the bit length codes, the literal tree and the distance tree.
     * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
     */


    const send_all_trees = (s, lcodes, dcodes, blcodes) => //    deflate_state *s;
    //    int lcodes, dcodes, blcodes; /* number of codes for each tree */
    {
      let rank;
      /* index in bl_order */
      //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
      //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
      //        "too many codes");
      //Tracev((stderr, "\nbl counts: "));

      send_bits(s, lcodes - 257, 5);
      /* not +255 as stated in appnote.txt */

      send_bits(s, dcodes - 1, 5);
      send_bits(s, blcodes - 4, 4);
      /* not -3 as stated in appnote.txt */

      for (rank = 0; rank < blcodes; rank++) {
        //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
        send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]
        /*.Len*/
        , 3);
      } //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));


      send_tree(s, s.dyn_ltree, lcodes - 1);
      /* literal tree */
      //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

      send_tree(s, s.dyn_dtree, dcodes - 1);
      /* distance tree */
      //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
    };
    /* ===========================================================================
     * Check if the data type is TEXT or BINARY, using the following algorithm:
     * - TEXT if the two conditions below are satisfied:
     *    a) There are no non-portable control characters belonging to the
     *       "black list" (0..6, 14..25, 28..31).
     *    b) There is at least one printable character belonging to the
     *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
     * - BINARY otherwise.
     * - The following partially-portable control characters form a
     *   "gray list" that is ignored in this detection algorithm:
     *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
     * IN assertion: the fields Freq of dyn_ltree are set.
     */


    const detect_data_type = s => {
      /* black_mask is the bit mask of black-listed bytes
       * set bits 0..6, 14..25, and 28..31
       * 0xf3ffc07f = binary 11110011111111111100000001111111
       */
      let black_mask = 0xf3ffc07f;
      let n;
      /* Check for non-textual ("black-listed") bytes. */

      for (n = 0; n <= 31; n++, black_mask >>>= 1) {
        if (black_mask & 1 && s.dyn_ltree[n * 2]
        /*.Freq*/
        !== 0) {
          return Z_BINARY;
        }
      }
      /* Check for textual ("white-listed") bytes. */


      if (s.dyn_ltree[9 * 2]
      /*.Freq*/
      !== 0 || s.dyn_ltree[10 * 2]
      /*.Freq*/
      !== 0 || s.dyn_ltree[13 * 2]
      /*.Freq*/
      !== 0) {
        return Z_TEXT;
      }

      for (n = 32; n < LITERALS$1; n++) {
        if (s.dyn_ltree[n * 2]
        /*.Freq*/
        !== 0) {
          return Z_TEXT;
        }
      }
      /* There are no "black-listed" or "white-listed" bytes:
       * this stream either is empty or has tolerated ("gray-listed") bytes only.
       */


      return Z_BINARY;
    };

    let static_init_done = false;
    /* ===========================================================================
     * Initialize the tree data structures for a new zlib stream.
     */

    const _tr_init$1 = s => {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }

      s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
      s.bi_buf = 0;
      s.bi_valid = 0;
      /* Initialize the first block of the first file: */

      init_block(s);
    };
    /* ===========================================================================
     * Send a stored block
     */


    const _tr_stored_block$1 = (s, buf, stored_len, last) => //DeflateState *s;
    //charf *buf;       /* input block */
    //ulg stored_len;   /* length of input block */
    //int last;         /* one if this is the last block for a file */
    {
      send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
      /* send block type */

      copy_block(s, buf, stored_len, true);
      /* with header */
    };
    /* ===========================================================================
     * Send one empty static block to give enough lookahead for inflate.
     * This takes 10 bits, of which 7 may remain in the bit buffer.
     */


    const _tr_align$1 = s => {
      send_bits(s, STATIC_TREES << 1, 3);
      send_code(s, END_BLOCK, static_ltree);
      bi_flush(s);
    };
    /* ===========================================================================
     * Determine the best encoding for the current block: dynamic trees, static
     * trees or store, and output the encoded block to the zip file.
     */


    const _tr_flush_block$1 = (s, buf, stored_len, last) => //DeflateState *s;
    //charf *buf;       /* input block, or NULL if too old */
    //ulg stored_len;   /* length of input block */
    //int last;         /* one if this is the last block for a file */
    {
      let opt_lenb, static_lenb;
      /* opt_len and static_len in bytes */

      let max_blindex = 0;
      /* index of last bit length code of non zero freq */

      /* Build the Huffman trees unless a stored block is forced */

      if (s.level > 0) {
        /* Check if the file is binary or text */
        if (s.strm.data_type === Z_UNKNOWN$1) {
          s.strm.data_type = detect_data_type(s);
        }
        /* Construct the literal and distance trees */


        build_tree(s, s.l_desc); // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
        //        s->static_len));

        build_tree(s, s.d_desc); // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
        //        s->static_len));

        /* At this point, opt_len and static_len are the total bit lengths of
         * the compressed block data, excluding the tree representations.
         */

        /* Build the bit length tree for the above two trees, and get the index
         * in bl_order of the last bit length code to send.
         */

        max_blindex = build_bl_tree(s);
        /* Determine the best encoding. Compute the block lengths in bytes. */

        opt_lenb = s.opt_len + 3 + 7 >>> 3;
        static_lenb = s.static_len + 3 + 7 >>> 3; // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
        //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
        //        s->last_lit));

        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        // Assert(buf != (char*)0, "lost buf");
        opt_lenb = static_lenb = stored_len + 5;
        /* force a stored block */
      }

      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        /* 4: two words for the lengths */

        /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
         * Otherwise we can't have processed more than WSIZE input bytes since
         * the last block flush, because compression would have been
         * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
         * transform a block into a stored block.
         */
        _tr_stored_block$1(s, buf, stored_len, last);
      } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
        send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);
      } else {
        send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
      } // Assert (s->compressed_len == s->bits_sent, "bad compressed size");

      /* The above check is made mod 2^32, for files larger than 512 MB
       * and uLong implemented on 32 bits.
       */


      init_block(s);

      if (last) {
        bi_windup(s);
      } // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
      //       s->compressed_len-7*last));

    };
    /* ===========================================================================
     * Save the match info and tally the frequency counts. Return true if
     * the current block must be flushed.
     */


    const _tr_tally$1 = (s, dist, lc) => //    deflate_state *s;
    //    unsigned dist;  /* distance of matched string */
    //    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
    {
      //let out_length, in_length, dcode;
      s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 0xff;
      s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;
      s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
      s.last_lit++;

      if (dist === 0) {
        /* lc is the unmatched char */
        s.dyn_ltree[lc * 2] /*.Freq*/++;
      } else {
        s.matches++;
        /* Here, lc is the match length - MIN_MATCH */

        dist--;
        /* dist = match distance - 1 */
        //Assert((ush)dist < (ush)MAX_DIST(s) &&
        //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
        //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

        s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2] /*.Freq*/++;
        s.dyn_dtree[d_code(dist) * 2] /*.Freq*/++;
      } // (!) This block is disabled in zlib defaults,
      // don't enable it for binary compatibility
      //#ifdef TRUNCATE_BLOCK
      //  /* Try to guess if it is profitable to stop the current block here */
      //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
      //    /* Compute an upper bound for the compressed length */
      //    out_length = s.last_lit*8;
      //    in_length = s.strstart - s.block_start;
      //
      //    for (dcode = 0; dcode < D_CODES; dcode++) {
      //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
      //    }
      //    out_length >>>= 3;
      //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
      //    //       s->last_lit, in_length, out_length,
      //    //       100L - out_length*100L/in_length));
      //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
      //      return true;
      //    }
      //  }
      //#endif


      return s.last_lit === s.lit_bufsize - 1;
      /* We avoid equality with lit_bufsize because of wraparound at 64K
       * on 16 bit machines and because stored blocks are restricted to
       * 64K-1 bytes.
       */
    };

    var _tr_init_1 = _tr_init$1;
    var _tr_stored_block_1 = _tr_stored_block$1;
    var _tr_flush_block_1 = _tr_flush_block$1;
    var _tr_tally_1 = _tr_tally$1;
    var _tr_align_1 = _tr_align$1;
    var trees = {
      _tr_init: _tr_init_1,
      _tr_stored_block: _tr_stored_block_1,
      _tr_flush_block: _tr_flush_block_1,
      _tr_tally: _tr_tally_1,
      _tr_align: _tr_align_1
    }; // Note: adler32 takes 12% for level 0 and 2% for level 6.
    // It isn't worth it to make additional optimizations as in original.
    // Small size is preferable.
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    const adler32 = (adler, buf, len, pos) => {
      let s1 = adler & 0xffff | 0,
          s2 = adler >>> 16 & 0xffff | 0,
          n = 0;

      while (len !== 0) {
        // Set limit ~ twice less than 5552, to keep
        // s2 in 31-bits, because we force signed ints.
        // in other case %= will fail.
        n = len > 2000 ? 2000 : len;
        len -= n;

        do {
          s1 = s1 + buf[pos++] | 0;
          s2 = s2 + s1 | 0;
        } while (--n);

        s1 %= 65521;
        s2 %= 65521;
      }

      return s1 | s2 << 16 | 0;
    };

    var adler32_1 = adler32; // Note: we can't get significant speed boost here.
    // So write code to minimize size - no pregenerated tables
    // and array tools dependencies.
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.
    // Use ordinary array, since untyped makes no boost here

    const makeTable = () => {
      let c,
          table = [];

      for (var n = 0; n < 256; n++) {
        c = n;

        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
        }

        table[n] = c;
      }

      return table;
    }; // Create table on load. Just 255 signed longs. Not a problem.


    const crcTable = new Uint32Array(makeTable());

    const crc32 = (crc, buf, len, pos) => {
      const t = crcTable;
      const end = pos + len;
      crc ^= -1;

      for (let i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 0xFF];
      }

      return crc ^ -1; // >>> 0;
    };

    var crc32_1 = crc32; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var messages = {
      2: 'need dictionary',

      /* Z_NEED_DICT       2  */
      1: 'stream end',

      /* Z_STREAM_END      1  */
      0: '',

      /* Z_OK              0  */
      '-1': 'file error',

      /* Z_ERRNO         (-1) */
      '-2': 'stream error',

      /* Z_STREAM_ERROR  (-2) */
      '-3': 'data error',

      /* Z_DATA_ERROR    (-3) */
      '-4': 'insufficient memory',

      /* Z_MEM_ERROR     (-4) */
      '-5': 'buffer error',

      /* Z_BUF_ERROR     (-5) */
      '-6': 'incompatible version'
      /* Z_VERSION_ERROR (-6) */

    }; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    var constants$2 = {
      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,

      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      Z_MEM_ERROR: -4,
      Z_BUF_ERROR: -5,
      //Z_VERSION_ERROR: -6,

      /* compression levels */
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,

      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY: 0,
      Z_TEXT: 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN: 2,

      /* The deflate compression method */
      Z_DEFLATED: 8 //Z_NULL:                 null // Use -1 or null inline, depending on var type

    }; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    const {
      _tr_init,
      _tr_stored_block,
      _tr_flush_block,
      _tr_tally,
      _tr_align
    } = trees;
    /* Public constants ==========================================================*/

    /* ===========================================================================*/

    const {
      Z_NO_FLUSH: Z_NO_FLUSH$2,
      Z_PARTIAL_FLUSH,
      Z_FULL_FLUSH: Z_FULL_FLUSH$1,
      Z_FINISH: Z_FINISH$3,
      Z_BLOCK: Z_BLOCK$1,
      Z_OK: Z_OK$3,
      Z_STREAM_END: Z_STREAM_END$3,
      Z_STREAM_ERROR: Z_STREAM_ERROR$2,
      Z_DATA_ERROR: Z_DATA_ERROR$2,
      Z_BUF_ERROR: Z_BUF_ERROR$1,
      Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
      Z_FILTERED,
      Z_HUFFMAN_ONLY,
      Z_RLE,
      Z_FIXED,
      Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
      Z_UNKNOWN,
      Z_DEFLATED: Z_DEFLATED$2
    } = constants$2;
    /*============================================================================*/

    const MAX_MEM_LEVEL = 9;
    /* Maximum value for memLevel in deflateInit2 */

    const MAX_WBITS$1 = 15;
    /* 32K LZ77 window */

    const DEF_MEM_LEVEL = 8;
    const LENGTH_CODES = 29;
    /* number of length codes, not counting the special END_BLOCK code */

    const LITERALS = 256;
    /* number of literal bytes 0..255 */

    const L_CODES = LITERALS + 1 + LENGTH_CODES;
    /* number of Literal or Length codes, including the END_BLOCK code */

    const D_CODES = 30;
    /* number of distance codes */

    const BL_CODES = 19;
    /* number of codes used to transfer the bit lengths */

    const HEAP_SIZE = 2 * L_CODES + 1;
    /* maximum heap size */

    const MAX_BITS = 15;
    /* All codes must not exceed MAX_BITS bits */

    const MIN_MATCH = 3;
    const MAX_MATCH = 258;
    const MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    const PRESET_DICT = 0x20;
    const INIT_STATE = 42;
    const EXTRA_STATE = 69;
    const NAME_STATE = 73;
    const COMMENT_STATE = 91;
    const HCRC_STATE = 103;
    const BUSY_STATE = 113;
    const FINISH_STATE = 666;
    const BS_NEED_MORE = 1;
    /* block not completed, need more input or more output */

    const BS_BLOCK_DONE = 2;
    /* block flush performed */

    const BS_FINISH_STARTED = 3;
    /* finish started, need only more output at next deflate */

    const BS_FINISH_DONE = 4;
    /* finish done, accept no more input or output */

    const OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

    const err = (strm, errorCode) => {
      strm.msg = messages[errorCode];
      return errorCode;
    };

    const rank = f => {
      return (f << 1) - (f > 4 ? 9 : 0);
    };

    const zero = buf => {
      let len = buf.length;

      while (--len >= 0) {
        buf[len] = 0;
      }
    };
    /* eslint-disable new-cap */


    let HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask; // This hash causes less collisions, https://github.com/nodeca/pako/issues/135
    // But breaks binary compatibility
    //let HASH_FAST = (s, prev, data) => ((prev << 8) + (prev >> 8) + (data << 4)) & s.hash_mask;


    let HASH = HASH_ZLIB;
    /* =========================================================================
     * Flush as much pending output as possible. All deflate() output goes
     * through this function so some applications may wish to modify it
     * to avoid allocating a large strm->output buffer and copying into it.
     * (See also read_buf()).
     */

    const flush_pending = strm => {
      const s = strm.state; //_tr_flush_bits(s);

      let len = s.pending;

      if (len > strm.avail_out) {
        len = strm.avail_out;
      }

      if (len === 0) {
        return;
      }

      strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;

      if (s.pending === 0) {
        s.pending_out = 0;
      }
    };

    const flush_block_only = (s, last) => {
      _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);

      s.block_start = s.strstart;
      flush_pending(s.strm);
    };

    const put_byte = (s, b) => {
      s.pending_buf[s.pending++] = b;
    };
    /* =========================================================================
     * Put a short in the pending buffer. The 16-bit value is put in MSB order.
     * IN assertion: the stream state is correct and there is enough room in
     * pending_buf.
     */


    const putShortMSB = (s, b) => {
      //  put_byte(s, (Byte)(b >> 8));
      //  put_byte(s, (Byte)(b & 0xff));
      s.pending_buf[s.pending++] = b >>> 8 & 0xff;
      s.pending_buf[s.pending++] = b & 0xff;
    };
    /* ===========================================================================
     * Read a new buffer from the current input stream, update the adler32
     * and total number of bytes read.  All deflate() input goes through
     * this function so some applications may wish to modify it to avoid
     * allocating a large strm->input buffer and copying from it.
     * (See also flush_pending()).
     */


    const read_buf = (strm, buf, start, size) => {
      let len = strm.avail_in;

      if (len > size) {
        len = size;
      }

      if (len === 0) {
        return 0;
      }

      strm.avail_in -= len; // zmemcpy(buf, strm->next_in, len);

      buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);

      if (strm.state.wrap === 1) {
        strm.adler = adler32_1(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc32_1(strm.adler, buf, len, start);
      }

      strm.next_in += len;
      strm.total_in += len;
      return len;
    };
    /* ===========================================================================
     * Set match_start to the longest match starting at the given string and
     * return its length. Matches shorter or equal to prev_length are discarded,
     * in which case the result is equal to prev_length and match_start is
     * garbage.
     * IN assertions: cur_match is the head of the hash chain for the current
     *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
     * OUT assertion: the match length is not greater than s->lookahead.
     */


    const longest_match = (s, cur_match) => {
      let chain_length = s.max_chain_length;
      /* max hash chain length */

      let scan = s.strstart;
      /* current string */

      let match;
      /* matched string */

      let len;
      /* length of current match */

      let best_len = s.prev_length;
      /* best match length so far */

      let nice_match = s.nice_match;
      /* stop if match long enough */

      const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0
      /*NIL*/
      ;
      const _win = s.window; // shortcut

      const wmask = s.w_mask;
      const prev = s.prev;
      /* Stop when cur_match becomes <= limit. To simplify the code,
       * we prevent matches with the string of window index 0.
       */

      const strend = s.strstart + MAX_MATCH;
      let scan_end1 = _win[scan + best_len - 1];
      let scan_end = _win[scan + best_len];
      /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
       * It is easy to get rid of this optimization if necessary.
       */
      // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

      /* Do not waste too much time if we already have a good match: */

      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      /* Do not look for matches beyond the end of the input. This is necessary
       * to make deflate deterministic.
       */


      if (nice_match > s.lookahead) {
        nice_match = s.lookahead;
      } // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");


      do {
        // Assert(cur_match < s->strstart, "no future");
        match = cur_match;
        /* Skip to next match if the match length cannot increase
         * or if the match length is less than 2.  Note that the checks below
         * for insufficient lookahead only occur occasionally for performance
         * reasons.  Therefore uninitialized memory will be accessed, and
         * conditional jumps will be made that depend on those values.
         * However the length of the match is limited to the lookahead, so
         * the output of deflate is not affected by the uninitialized values.
         */

        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        /* The check at best_len-1 can be removed because it will be made
         * again later. (This heuristic is not always a win.)
         * It is not necessary to compare scan[2] and match[2] since they
         * are always equal when the other bytes match, given that
         * the hash keys are equal and that HASH_BITS >= 8.
         */


        scan += 2;
        match++; // Assert(*scan == *match, "match[2]?");

        /* We check for insufficient lookahead only every 8th comparison;
         * the 256th check will be made at strstart+258.
         */

        do {
          /*jshint noempty:false*/
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend); // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");


        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;

        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;

          if (len >= nice_match) {
            break;
          }

          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

      if (best_len <= s.lookahead) {
        return best_len;
      }

      return s.lookahead;
    };
    /* ===========================================================================
     * Fill the window when the lookahead becomes insufficient.
     * Updates strstart and lookahead.
     *
     * IN assertion: lookahead < MIN_LOOKAHEAD
     * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
     *    At least one byte has been read, or avail_in == 0; reads are
     *    performed for at least two bytes (required for the zip translate_eol
     *    option -- not supported here).
     */


    const fill_window = s => {
      const _w_size = s.w_size;
      let p, n, m, more, str; //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

      do {
        more = s.window_size - s.lookahead - s.strstart; // JS ints have 32 bit, block below not needed

        /* Deal with !@#$% 64K limit: */
        //if (sizeof(int) <= 2) {
        //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
        //        more = wsize;
        //
        //  } else if (more == (unsigned)(-1)) {
        //        /* Very unlikely, but possible on 16 bit machine if
        //         * strstart == 0 && lookahead == 1 (input done a byte at time)
        //         */
        //        more--;
        //    }
        //}

        /* If the window is almost full and there is insufficient lookahead,
         * move the upper half to the lower one to make room in the upper half.
         */

        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
          s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          /* we now have strstart >= MAX_DIST */

          s.block_start -= _w_size;
          /* Slide the hash table (could be avoided with 32 bit values
           at the expense of memory usage). We slide even when level == 0
           to keep the hash table consistent if we switch back to level > 0
           later. (Using level 0 permanently is not an optimal usage of
           zlib, so we don't care about this pathological case.)
           */

          n = s.hash_size;
          p = n;

          do {
            m = s.head[--p];
            s.head[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);

          n = _w_size;
          p = n;

          do {
            m = s.prev[--p];
            s.prev[p] = m >= _w_size ? m - _w_size : 0;
            /* If n is not on any hash chain, prev[n] is garbage but
             * its value will never be used.
             */
          } while (--n);

          more += _w_size;
        }

        if (s.strm.avail_in === 0) {
          break;
        }
        /* If there was no sliding:
         *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
         *    more == window_size - lookahead - strstart
         * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
         * => more >= window_size - 2*WSIZE + 2
         * In the BIG_MEM or MMAP case (not yet supported),
         *   window_size == input_size + MIN_LOOKAHEAD  &&
         *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
         * Otherwise, window_size == 2*WSIZE so more >= 2.
         * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
         */
        //Assert(more >= 2, "more < 2");


        n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;
        /* Initialize the hash value now that we have some input: */

        if (s.lookahead + s.insert >= MIN_MATCH) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];
          /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */

          s.ins_h = HASH(s, s.ins_h, s.window[str + 1]); //#if MIN_MATCH != 3
          //        Call update_hash() MIN_MATCH-3 more times
          //#endif

          while (s.insert) {
            /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
            s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
            s.insert--;

            if (s.lookahead + s.insert < MIN_MATCH) {
              break;
            }
          }
        }
        /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
         * but this is not important since only literal bytes will be emitted.
         */

      } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
      /* If the WIN_INIT bytes after the end of the current data have never been
       * written, then zero those bytes in order to avoid memory check reports of
       * the use of uninitialized (or uninitialised as Julian writes) bytes by
       * the longest match routines.  Update the high water mark for the next
       * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
       * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
       */
      //  if (s.high_water < s.window_size) {
      //    const curr = s.strstart + s.lookahead;
      //    let init = 0;
      //
      //    if (s.high_water < curr) {
      //      /* Previous high water mark below current data -- zero WIN_INIT
      //       * bytes or up to end of window, whichever is less.
      //       */
      //      init = s.window_size - curr;
      //      if (init > WIN_INIT)
      //        init = WIN_INIT;
      //      zmemzero(s->window + curr, (unsigned)init);
      //      s->high_water = curr + init;
      //    }
      //    else if (s->high_water < (ulg)curr + WIN_INIT) {
      //      /* High water mark at or above current data, but below current data
      //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
      //       * to end of window, whichever is less.
      //       */
      //      init = (ulg)curr + WIN_INIT - s->high_water;
      //      if (init > s->window_size - s->high_water)
      //        init = s->window_size - s->high_water;
      //      zmemzero(s->window + s->high_water, (unsigned)init);
      //      s->high_water += init;
      //    }
      //  }
      //
      //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
      //    "not enough room for search");

    };
    /* ===========================================================================
     * Copy without compression as much as possible from the input stream, return
     * the current block state.
     * This function does not insert new strings in the dictionary since
     * uncompressible data is probably not useful. This function is used
     * only for the level=0 compression option.
     * NOTE: this function should be optimized to avoid extra copying from
     * window to pending_buf.
     */


    const deflate_stored = (s, flush) => {
      /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
       * to pending_buf_size, and each stored block has a 5 byte header:
       */
      let max_block_size = 0xffff;

      if (max_block_size > s.pending_buf_size - 5) {
        max_block_size = s.pending_buf_size - 5;
      }
      /* Copy as much as possible from input to output: */


      for (;;) {
        /* Fill the window as much as possible: */
        if (s.lookahead <= 1) {
          //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
          //  s->block_start >= (long)s->w_size, "slide too late");
          //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
          //        s.block_start >= s.w_size)) {
          //        throw  new Error("slide too late");
          //      }
          fill_window(s);

          if (s.lookahead === 0 && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }

          if (s.lookahead === 0) {
            break;
          }
          /* flush the current block */

        } //Assert(s->block_start >= 0L, "block gone");
        //    if (s.block_start < 0) throw new Error("block gone");


        s.strstart += s.lookahead;
        s.lookahead = 0;
        /* Emit a stored block if pending_buf will be full: */

        const max_start = s.block_start + max_block_size;

        if (s.strstart === 0 || s.strstart >= max_start) {
          /* strstart == 0 is possible when wraparound on 16-bit machine */
          s.lookahead = s.strstart - max_start;
          s.strstart = max_start;
          /*** FLUSH_BLOCK(s, 0); ***/

          flush_block_only(s, false);

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/

        }
        /* Flush if we may have to slide, otherwise block_start may become
         * negative and the data will be gone:
         */


        if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/

        }
      }

      s.insert = 0;

      if (flush === Z_FINISH$3) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);

        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/


        return BS_FINISH_DONE;
      }

      if (s.strstart > s.block_start) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }

      return BS_NEED_MORE;
    };
    /* ===========================================================================
     * Compress as much as possible from the input stream, return the current
     * block state.
     * This function does not perform lazy evaluation of matches and inserts
     * new strings in the dictionary only for unmatched strings or for short
     * matches. It is used only for the fast compression options.
     */


    const deflate_fast = (s, flush) => {
      let hash_head;
      /* head of the hash chain */

      let bflush;
      /* set if current block must be flushed */

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the next match, plus MIN_MATCH bytes to insert the
         * string following the next match.
         */
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);

          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }

          if (s.lookahead === 0) {
            break;
            /* flush the current block */
          }
        }
        /* Insert the string window[strstart .. strstart+2] in the
         * dictionary, and set hash_head to the head of the hash chain:
         */


        hash_head = 0
        /*NIL*/
        ;

        if (s.lookahead >= MIN_MATCH) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
        /* Find the longest match, discarding those <= prev_length.
         * At this point we have always match_length < MIN_MATCH
         */


        if (hash_head !== 0
        /*NIL*/
        && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */
        }

        if (s.match_length >= MIN_MATCH) {
          // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

          /*** _tr_tally_dist(s, s.strstart - s.match_start,
                         s.match_length - MIN_MATCH, bflush); ***/
          bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          /* Insert new strings in the hash table only if the match length
           * is not too large. This saves time but degrades compression.
           */

          if (s.match_length <= s.max_lazy_match
          /*max_insert_length*/
          && s.lookahead >= MIN_MATCH) {
            s.match_length--;
            /* string at strstart already in table */

            do {
              s.strstart++;
              /*** INSERT_STRING(s, s.strstart, hash_head); ***/

              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
              /***/

              /* strstart never exceeds WSIZE-MAX_MATCH, so there are
               * always MIN_MATCH bytes ahead.
               */
            } while (--s.match_length !== 0);

            s.strstart++;
          } else {
            s.strstart += s.match_length;
            s.match_length = 0;
            s.ins_h = s.window[s.strstart];
            /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */

            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]); //#if MIN_MATCH != 3
            //                Call UPDATE_HASH() MIN_MATCH-3 more times
            //#endif

            /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
             * matter since it will be recomputed at next deflate call.
             */
          }
        } else {
          /* No match, output a literal byte */
          //Tracevv((stderr,"%c", s.window[s.strstart]));

          /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }

        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/

        }
      }

      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;

      if (flush === Z_FINISH$3) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);

        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/


        return BS_FINISH_DONE;
      }

      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }

      return BS_BLOCK_DONE;
    };
    /* ===========================================================================
     * Same as above, but achieves better compression. We use a lazy
     * evaluation for matches: a match is finally adopted only if there is
     * no better match at the next window position.
     */


    const deflate_slow = (s, flush) => {
      let hash_head;
      /* head of hash chain */

      let bflush;
      /* set if current block must be flushed */

      let max_insert;
      /* Process the input block. */

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the next match, plus MIN_MATCH bytes to insert the
         * string following the next match.
         */
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);

          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }

          if (s.lookahead === 0) {
            break;
          }
          /* flush the current block */

        }
        /* Insert the string window[strstart .. strstart+2] in the
         * dictionary, and set hash_head to the head of the hash chain:
         */


        hash_head = 0
        /*NIL*/
        ;

        if (s.lookahead >= MIN_MATCH) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
        /* Find the longest match, discarding those <= prev_length.
         */


        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;

        if (hash_head !== 0
        /*NIL*/
        && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD
        /*MAX_DIST(s)*/
        ) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */

          if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096
          /*TOO_FAR*/
          )) {
            /* If prev_match is also MIN_MATCH, match_start is garbage
             * but we will ignore the current match anyway.
             */
            s.match_length = MIN_MATCH - 1;
          }
        }
        /* If there was a match at the previous step and the current
         * match is not better, output the previous match:
         */


        if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH;
          /* Do not insert strings in hash table beyond this. */
          //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

          /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                         s.prev_length - MIN_MATCH, bflush);***/

          bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
          /* Insert in hash table all strings up to the end of the match.
           * strstart-1 and strstart are already inserted. If there is not
           * enough lookahead, the last two strings are not inserted in
           * the hash table.
           */

          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;

          do {
            if (++s.strstart <= max_insert) {
              /*** INSERT_STRING(s, s.strstart, hash_head); ***/
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
              /***/
            }
          } while (--s.prev_length !== 0);

          s.match_available = 0;
          s.match_length = MIN_MATCH - 1;
          s.strstart++;

          if (bflush) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);

            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
            /***/

          }
        } else if (s.match_available) {
          /* If there was no match at the previous position, output a
           * single literal. If there was a match but the current match
           * is longer, truncate the previous match to a single literal.
           */
          //Tracevv((stderr,"%c", s->window[s->strstart-1]));

          /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
          bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

          if (bflush) {
            /*** FLUSH_BLOCK_ONLY(s, 0) ***/
            flush_block_only(s, false);
            /***/
          }

          s.strstart++;
          s.lookahead--;

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          /* There is no previous match to compare with, wait for
           * the next step to decide.
           */
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      } //Assert (flush != Z_NO_FLUSH, "no flush?");


      if (s.match_available) {
        //Tracevv((stderr,"%c", s->window[s->strstart-1]));

        /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        s.match_available = 0;
      }

      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;

      if (flush === Z_FINISH$3) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);

        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/


        return BS_FINISH_DONE;
      }

      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }

      return BS_BLOCK_DONE;
    };
    /* ===========================================================================
     * For Z_RLE, simply look for runs of bytes, generate matches only of distance
     * one.  Do not maintain a hash table.  (It will be regenerated if this run of
     * deflate switches away from Z_RLE.)
     */


    const deflate_rle = (s, flush) => {
      let bflush;
      /* set if current block must be flushed */

      let prev;
      /* byte at distance one to match */

      let scan, strend;
      /* scan goes up to strend for length of run */

      const _win = s.window;

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the longest run, plus one for the unrolled loop.
         */
        if (s.lookahead <= MAX_MATCH) {
          fill_window(s);

          if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }

          if (s.lookahead === 0) {
            break;
          }
          /* flush the current block */

        }
        /* See how many times the previous byte repeats */


        s.match_length = 0;

        if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];

          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH;

            do {
              /*jshint noempty:false*/
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);

            s.match_length = MAX_MATCH - (strend - scan);

            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          } //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");

        }
        /* Emit match if have run of MIN_MATCH or longer, else emit literal */


        if (s.match_length >= MIN_MATCH) {
          //check_match(s, s.strstart, s.strstart - 1, s.match_length);

          /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
          bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          /* No match, output a literal byte */
          //Tracevv((stderr,"%c", s->window[s->strstart]));

          /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }

        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/

        }
      }

      s.insert = 0;

      if (flush === Z_FINISH$3) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);

        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/


        return BS_FINISH_DONE;
      }

      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }

      return BS_BLOCK_DONE;
    };
    /* ===========================================================================
     * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
     * (It will be regenerated if this run of deflate switches away from Huffman.)
     */


    const deflate_huff = (s, flush) => {
      let bflush;
      /* set if current block must be flushed */

      for (;;) {
        /* Make sure that we have a literal to write. */
        if (s.lookahead === 0) {
          fill_window(s);

          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH$2) {
              return BS_NEED_MORE;
            }

            break;
            /* flush the current block */
          }
        }
        /* Output a literal byte */


        s.match_length = 0; //Tracevv((stderr,"%c", s->window[s->strstart]));

        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/

        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;

        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);

          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/

        }
      }

      s.insert = 0;

      if (flush === Z_FINISH$3) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);

        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/


        return BS_FINISH_DONE;
      }

      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);

        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/

      }

      return BS_BLOCK_DONE;
    };
    /* Values for max_lazy_match, good_match and max_chain_length, depending on
     * the desired pack level (0..9). The values given below have been tuned to
     * exclude worst case performance for pathological files. Better values may be
     * found for specific files.
     */


    function Config(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }

    const configuration_table = [
    /*      good lazy nice chain */
    new Config(0, 0, 0, 0, deflate_stored),
    /* 0 store only */
    new Config(4, 4, 8, 4, deflate_fast),
    /* 1 max speed, no lazy matches */
    new Config(4, 5, 16, 8, deflate_fast),
    /* 2 */
    new Config(4, 6, 32, 32, deflate_fast),
    /* 3 */
    new Config(4, 4, 16, 16, deflate_slow),
    /* 4 lazy matches */
    new Config(8, 16, 32, 32, deflate_slow),
    /* 5 */
    new Config(8, 16, 128, 128, deflate_slow),
    /* 6 */
    new Config(8, 32, 128, 256, deflate_slow),
    /* 7 */
    new Config(32, 128, 258, 1024, deflate_slow),
    /* 8 */
    new Config(32, 258, 258, 4096, deflate_slow)
    /* 9 max compression */
    ];
    /* ===========================================================================
     * Initialize the "longest match" routines for a new zlib stream
     */

    const lm_init = s => {
      s.window_size = 2 * s.w_size;
      /*** CLEAR_HASH(s); ***/

      zero(s.head); // Fill with NIL (= 0);

      /* Set the default configuration parameters:
       */

      s.max_lazy_match = configuration_table[s.level].max_lazy;
      s.good_match = configuration_table[s.level].good_length;
      s.nice_match = configuration_table[s.level].nice_length;
      s.max_chain_length = configuration_table[s.level].max_chain;
      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      s.ins_h = 0;
    };

    function DeflateState() {
      this.strm = null;
      /* pointer back to this zlib stream */

      this.status = 0;
      /* as the name implies */

      this.pending_buf = null;
      /* output still pending */

      this.pending_buf_size = 0;
      /* size of pending_buf */

      this.pending_out = 0;
      /* next pending byte to output to the stream */

      this.pending = 0;
      /* nb of bytes in the pending buffer */

      this.wrap = 0;
      /* bit 0 true for zlib, bit 1 true for gzip */

      this.gzhead = null;
      /* gzip header information to write */

      this.gzindex = 0;
      /* where in extra, name, or comment */

      this.method = Z_DEFLATED$2;
      /* can only be DEFLATED */

      this.last_flush = -1;
      /* value of flush param for previous deflate call */

      this.w_size = 0;
      /* LZ77 window size (32K by default) */

      this.w_bits = 0;
      /* log2(w_size)  (8..16) */

      this.w_mask = 0;
      /* w_size - 1 */

      this.window = null;
      /* Sliding window. Input bytes are read into the second half of the window,
       * and move to the first half later to keep a dictionary of at least wSize
       * bytes. With this organization, matches are limited to a distance of
       * wSize-MAX_MATCH bytes, but this ensures that IO is always
       * performed with a length multiple of the block size.
       */

      this.window_size = 0;
      /* Actual size of window: 2*wSize, except when the user input buffer
       * is directly used as sliding window.
       */

      this.prev = null;
      /* Link to older string with same hash index. To limit the size of this
       * array to 64K, this link is maintained only for the last 32K strings.
       * An index in this array is thus a window index modulo 32K.
       */

      this.head = null;
      /* Heads of the hash chains or NIL. */

      this.ins_h = 0;
      /* hash index of string to be inserted */

      this.hash_size = 0;
      /* number of elements in hash table */

      this.hash_bits = 0;
      /* log2(hash_size) */

      this.hash_mask = 0;
      /* hash_size-1 */

      this.hash_shift = 0;
      /* Number of bits by which ins_h must be shifted at each input
       * step. It must be such that after MIN_MATCH steps, the oldest
       * byte no longer takes part in the hash key, that is:
       *   hash_shift * MIN_MATCH >= hash_bits
       */

      this.block_start = 0;
      /* Window position at the beginning of the current output block. Gets
       * negative when the window is moved backwards.
       */

      this.match_length = 0;
      /* length of best match */

      this.prev_match = 0;
      /* previous match */

      this.match_available = 0;
      /* set if previous match exists */

      this.strstart = 0;
      /* start of string to insert */

      this.match_start = 0;
      /* start of matching string */

      this.lookahead = 0;
      /* number of valid bytes ahead in window */

      this.prev_length = 0;
      /* Length of the best match at previous step. Matches not greater than this
       * are discarded. This is used in the lazy match evaluation.
       */

      this.max_chain_length = 0;
      /* To speed up deflation, hash chains are never searched beyond this
       * length.  A higher limit improves compression ratio but degrades the
       * speed.
       */

      this.max_lazy_match = 0;
      /* Attempt to find a better match only when the current match is strictly
       * smaller than this value. This mechanism is used only for compression
       * levels >= 4.
       */
      // That's alias to max_lazy_match, don't use directly
      //this.max_insert_length = 0;

      /* Insert new strings in the hash table only if the match length is not
       * greater than this length. This saves time but degrades compression.
       * max_insert_length is used only for compression levels <= 3.
       */

      this.level = 0;
      /* compression level (1..9) */

      this.strategy = 0;
      /* favor or force Huffman coding*/

      this.good_match = 0;
      /* Use a faster search when the previous match is longer than this */

      this.nice_match = 0;
      /* Stop searching when current match exceeds this */

      /* used by trees.c: */

      /* Didn't use ct_data typedef below to suppress compiler warning */
      // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
      // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
      // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */
      // Use flat array of DOUBLE size, with interleaved fata,
      // because JS does not support effective

      this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
      this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
      this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);
      this.l_desc = null;
      /* desc. for literal tree */

      this.d_desc = null;
      /* desc. for distance tree */

      this.bl_desc = null;
      /* desc. for bit length tree */
      //ush bl_count[MAX_BITS+1];

      this.bl_count = new Uint16Array(MAX_BITS + 1);
      /* number of codes at each bit length for an optimal tree */
      //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */

      this.heap = new Uint16Array(2 * L_CODES + 1);
      /* heap used to build the Huffman trees */

      zero(this.heap);
      this.heap_len = 0;
      /* number of elements in the heap */

      this.heap_max = 0;
      /* element of largest frequency */

      /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
       * The same heap array is used to build all trees.
       */

      this.depth = new Uint16Array(2 * L_CODES + 1); //uch depth[2*L_CODES+1];

      zero(this.depth);
      /* Depth of each subtree used as tie breaker for trees of equal frequency
       */

      this.l_buf = 0;
      /* buffer index for literals or lengths */

      this.lit_bufsize = 0;
      /* Size of match buffer for literals/lengths.  There are 4 reasons for
       * limiting lit_bufsize to 64K:
       *   - frequencies can be kept in 16 bit counters
       *   - if compression is not successful for the first block, all input
       *     data is still in the window so we can still emit a stored block even
       *     when input comes from standard input.  (This can also be done for
       *     all blocks if lit_bufsize is not greater than 32K.)
       *   - if compression is not successful for a file smaller than 64K, we can
       *     even emit a stored file instead of a stored block (saving 5 bytes).
       *     This is applicable only for zip (not gzip or zlib).
       *   - creating new Huffman trees less frequently may not provide fast
       *     adaptation to changes in the input data statistics. (Take for
       *     example a binary file with poorly compressible code followed by
       *     a highly compressible string table.) Smaller buffer sizes give
       *     fast adaptation but have of course the overhead of transmitting
       *     trees more frequently.
       *   - I can't count above 4
       */

      this.last_lit = 0;
      /* running index in l_buf */

      this.d_buf = 0;
      /* Buffer index for distances. To simplify the code, d_buf and l_buf have
       * the same number of elements. To use different lengths, an extra flag
       * array would be necessary.
       */

      this.opt_len = 0;
      /* bit length of current block with optimal trees */

      this.static_len = 0;
      /* bit length of current block with static trees */

      this.matches = 0;
      /* number of string matches in current block */

      this.insert = 0;
      /* bytes at end of window left to insert */

      this.bi_buf = 0;
      /* Output buffer. bits are inserted starting at the bottom (least
       * significant bits).
       */

      this.bi_valid = 0;
      /* Number of valid bits in bi_buf.  All bits above the last valid bit
       * are always zero.
       */
      // Used for window memory init. We safely ignore it for JS. That makes
      // sense only for pointers and memory check tools.
      //this.high_water = 0;

      /* High water mark offset in window for initialized bytes -- bytes above
       * this are set to zero in order to avoid memory check warnings when
       * longest match routines access bytes past the input.  This is then
       * updated to the new high water mark.
       */
    }

    const deflateResetKeep = strm => {
      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR$2);
      }

      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;
      const s = strm.state;
      s.pending = 0;
      s.pending_out = 0;

      if (s.wrap < 0) {
        s.wrap = -s.wrap;
        /* was made negative by deflate(..., Z_FINISH); */
      }

      s.status = s.wrap ? INIT_STATE : BUSY_STATE;
      strm.adler = s.wrap === 2 ? 0 // crc32(0, Z_NULL, 0)
      : 1; // adler32(0, Z_NULL, 0)

      s.last_flush = Z_NO_FLUSH$2;

      _tr_init(s);

      return Z_OK$3;
    };

    const deflateReset = strm => {
      const ret = deflateResetKeep(strm);

      if (ret === Z_OK$3) {
        lm_init(strm.state);
      }

      return ret;
    };

    const deflateSetHeader = (strm, head) => {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR$2;
      }

      if (strm.state.wrap !== 2) {
        return Z_STREAM_ERROR$2;
      }

      strm.state.gzhead = head;
      return Z_OK$3;
    };

    const deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
      if (!strm) {
        // === Z_NULL
        return Z_STREAM_ERROR$2;
      }

      let wrap = 1;

      if (level === Z_DEFAULT_COMPRESSION$1) {
        level = 6;
      }

      if (windowBits < 0) {
        /* suppress zlib wrapper */
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        /* write gzip wrapper instead */

        windowBits -= 16;
      }

      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
        return err(strm, Z_STREAM_ERROR$2);
      }

      if (windowBits === 8) {
        windowBits = 9;
      }
      /* until 256-byte window bug fixed */


      const s = new DeflateState();
      strm.state = s;
      s.strm = strm;
      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;
      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
      s.window = new Uint8Array(s.w_size * 2);
      s.head = new Uint16Array(s.hash_size);
      s.prev = new Uint16Array(s.w_size); // Don't need mem init magic for JS.
      //s.high_water = 0;  /* nothing written to s->window yet */

      s.lit_bufsize = 1 << memLevel + 6;
      /* 16K elements by default */

      s.pending_buf_size = s.lit_bufsize * 4; //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
      //s->pending_buf = (uchf *) overlay;

      s.pending_buf = new Uint8Array(s.pending_buf_size); // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
      //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);

      s.d_buf = 1 * s.lit_bufsize; //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;

      s.l_buf = (1 + 2) * s.lit_bufsize;
      s.level = level;
      s.strategy = strategy;
      s.method = method;
      return deflateReset(strm);
    };

    const deflateInit = (strm, level) => {
      return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
    };

    const deflate$2 = (strm, flush) => {
      let beg, val; // for gzip header write only

      if (!strm || !strm.state || flush > Z_BLOCK$1 || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
      }

      const s = strm.state;

      if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
      }

      s.strm = strm;
      /* just in case */

      const old_flush = s.last_flush;
      s.last_flush = flush;
      /* Write the header */

      if (s.status === INIT_STATE) {
        if (s.wrap === 2) {
          // GZIP header
          strm.adler = 0; //crc32(0L, Z_NULL, 0);

          put_byte(s, 31);
          put_byte(s, 139);
          put_byte(s, 8);

          if (!s.gzhead) {
            // s->gzhead == Z_NULL
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, OS_CODE);
            s.status = BUSY_STATE;
          } else {
            put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
            put_byte(s, s.gzhead.time & 0xff);
            put_byte(s, s.gzhead.time >> 8 & 0xff);
            put_byte(s, s.gzhead.time >> 16 & 0xff);
            put_byte(s, s.gzhead.time >> 24 & 0xff);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, s.gzhead.os & 0xff);

            if (s.gzhead.extra && s.gzhead.extra.length) {
              put_byte(s, s.gzhead.extra.length & 0xff);
              put_byte(s, s.gzhead.extra.length >> 8 & 0xff);
            }

            if (s.gzhead.hcrc) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
            }

            s.gzindex = 0;
            s.status = EXTRA_STATE;
          }
        } else // DEFLATE header
          {
            let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
            let level_flags = -1;

            if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
              level_flags = 0;
            } else if (s.level < 6) {
              level_flags = 1;
            } else if (s.level === 6) {
              level_flags = 2;
            } else {
              level_flags = 3;
            }

            header |= level_flags << 6;

            if (s.strstart !== 0) {
              header |= PRESET_DICT;
            }

            header += 31 - header % 31;
            s.status = BUSY_STATE;
            putShortMSB(s, header);
            /* Save the adler32 of the preset dictionary: */

            if (s.strstart !== 0) {
              putShortMSB(s, strm.adler >>> 16);
              putShortMSB(s, strm.adler & 0xffff);
            }

            strm.adler = 1; // adler32(0L, Z_NULL, 0);
          }
      } //#ifdef GZIP


      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra
        /* != Z_NULL*/
        ) {
          beg = s.pending;
          /* start of bytes to update crc */

          while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
              }

              flush_pending(strm);
              beg = s.pending;

              if (s.pending === s.pending_buf_size) {
                break;
              }
            }

            put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
            s.gzindex++;
          }

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }

          if (s.gzindex === s.gzhead.extra.length) {
            s.gzindex = 0;
            s.status = NAME_STATE;
          }
        } else {
          s.status = NAME_STATE;
        }
      }

      if (s.status === NAME_STATE) {
        if (s.gzhead.name
        /* != Z_NULL*/
        ) {
          beg = s.pending;
          /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
              }

              flush_pending(strm);
              beg = s.pending;

              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            } // JS specific: little magic to add zero terminator to end of string


            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }

            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }

          if (val === 0) {
            s.gzindex = 0;
            s.status = COMMENT_STATE;
          }
        } else {
          s.status = COMMENT_STATE;
        }
      }

      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment
        /* != Z_NULL*/
        ) {
          beg = s.pending;
          /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
              }

              flush_pending(strm);
              beg = s.pending;

              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            } // JS specific: little magic to add zero terminator to end of string


            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }

            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }

          if (val === 0) {
            s.status = HCRC_STATE;
          }
        } else {
          s.status = HCRC_STATE;
        }
      }

      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending(strm);
          }

          if (s.pending + 2 <= s.pending_buf_size) {
            put_byte(s, strm.adler & 0xff);
            put_byte(s, strm.adler >> 8 & 0xff);
            strm.adler = 0; //crc32(0L, Z_NULL, 0);

            s.status = BUSY_STATE;
          }
        } else {
          s.status = BUSY_STATE;
        }
      } //#endif

      /* Flush as much pending output as possible */


      if (s.pending !== 0) {
        flush_pending(strm);

        if (strm.avail_out === 0) {
          /* Since avail_out is 0, deflate will be called again with
           * more output space, but possibly with both pending and
           * avail_in equal to zero. There won't be anything to do,
           * but this is not an error situation so make sure we
           * return OK instead of BUF_ERROR at next call of deflate:
           */
          s.last_flush = -1;
          return Z_OK$3;
        }
        /* Make sure there is something to do and avoid duplicate consecutive
         * flushes. For repeated and useless calls with Z_FINISH, we keep
         * returning Z_STREAM_END instead of Z_BUF_ERROR.
         */

      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
        return err(strm, Z_BUF_ERROR$1);
      }
      /* User must not provide more input after the first FINISH: */


      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR$1);
      }
      /* Start a new block or continue the current one.
       */


      if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
        let bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);

        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s.status = FINISH_STATE;
        }

        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            /* avoid BUF_ERROR next call, see above */
          }

          return Z_OK$3;
          /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
           * of deflate should use the same flush parameter to make sure
           * that the flush is complete. So we don't have to output an
           * empty block here, this will be done at next call. This also
           * ensures that for a very small output buffer, we emit at most
           * one empty block.
           */
        }

        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            _tr_align(s);
          } else if (flush !== Z_BLOCK$1) {
            /* FULL_FLUSH or SYNC_FLUSH */
            _tr_stored_block(s, 0, 0, false);
            /* For a full flush, this empty block will be recognized
             * as a special marker by inflate_sync().
             */


            if (flush === Z_FULL_FLUSH$1) {
              /*** CLEAR_HASH(s); ***/

              /* forget history */
              zero(s.head); // Fill with NIL (= 0);

              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }

          flush_pending(strm);

          if (strm.avail_out === 0) {
            s.last_flush = -1;
            /* avoid BUF_ERROR at next call, see above */

            return Z_OK$3;
          }
        }
      } //Assert(strm->avail_out > 0, "bug2");
      //if (strm.avail_out <= 0) { throw new Error("bug2");}


      if (flush !== Z_FINISH$3) {
        return Z_OK$3;
      }

      if (s.wrap <= 0) {
        return Z_STREAM_END$3;
      }
      /* Write the trailer */


      if (s.wrap === 2) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, strm.adler >> 8 & 0xff);
        put_byte(s, strm.adler >> 16 & 0xff);
        put_byte(s, strm.adler >> 24 & 0xff);
        put_byte(s, strm.total_in & 0xff);
        put_byte(s, strm.total_in >> 8 & 0xff);
        put_byte(s, strm.total_in >> 16 & 0xff);
        put_byte(s, strm.total_in >> 24 & 0xff);
      } else {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }

      flush_pending(strm);
      /* If avail_out is zero, the application will call deflate again
       * to flush the rest.
       */

      if (s.wrap > 0) {
        s.wrap = -s.wrap;
      }
      /* write the trailer only once! */


      return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
    };

    const deflateEnd = strm => {
      if (!strm
      /*== Z_NULL*/
      || !strm.state
      /*== Z_NULL*/
      ) {
        return Z_STREAM_ERROR$2;
      }

      const status = strm.state.status;

      if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
        return err(strm, Z_STREAM_ERROR$2);
      }

      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
    };
    /* =========================================================================
     * Initializes the compression dictionary from the given byte
     * sequence without producing any compressed output.
     */


    const deflateSetDictionary = (strm, dictionary) => {
      let dictLength = dictionary.length;

      if (!strm
      /*== Z_NULL*/
      || !strm.state
      /*== Z_NULL*/
      ) {
        return Z_STREAM_ERROR$2;
      }

      const s = strm.state;
      const wrap = s.wrap;

      if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
        return Z_STREAM_ERROR$2;
      }
      /* when using zlib wrappers, compute Adler-32 for provided dictionary */


      if (wrap === 1) {
        /* adler32(strm->adler, dictionary, dictLength); */
        strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
      }

      s.wrap = 0;
      /* avoid computing Adler-32 in read_buf */

      /* if dictionary would fill window, just replace the history */

      if (dictLength >= s.w_size) {
        if (wrap === 0) {
          /* already empty otherwise */

          /*** CLEAR_HASH(s); ***/
          zero(s.head); // Fill with NIL (= 0);

          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        /* use the tail */
        // dictionary = dictionary.slice(dictLength - s.w_size);


        let tmpDict = new Uint8Array(s.w_size);
        tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      /* insert dictionary into window and hash */


      const avail = strm.avail_in;
      const next = strm.next_in;
      const input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s);

      while (s.lookahead >= MIN_MATCH) {
        let str = s.strstart;
        let n = s.lookahead - (MIN_MATCH - 1);

        do {
          /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
          s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
        } while (--n);

        s.strstart = str;
        s.lookahead = MIN_MATCH - 1;
        fill_window(s);
      }

      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK$3;
    };

    var deflateInit_1 = deflateInit;
    var deflateInit2_1 = deflateInit2;
    var deflateReset_1 = deflateReset;
    var deflateResetKeep_1 = deflateResetKeep;
    var deflateSetHeader_1 = deflateSetHeader;
    var deflate_2$1 = deflate$2;
    var deflateEnd_1 = deflateEnd;
    var deflateSetDictionary_1 = deflateSetDictionary;
    var deflateInfo = 'pako deflate (from Nodeca project)';
    /* Not implemented
    module.exports.deflateBound = deflateBound;
    module.exports.deflateCopy = deflateCopy;
    module.exports.deflateParams = deflateParams;
    module.exports.deflatePending = deflatePending;
    module.exports.deflatePrime = deflatePrime;
    module.exports.deflateTune = deflateTune;
    */

    var deflate_1$2 = {
      deflateInit: deflateInit_1,
      deflateInit2: deflateInit2_1,
      deflateReset: deflateReset_1,
      deflateResetKeep: deflateResetKeep_1,
      deflateSetHeader: deflateSetHeader_1,
      deflate: deflate_2$1,
      deflateEnd: deflateEnd_1,
      deflateSetDictionary: deflateSetDictionary_1,
      deflateInfo: deflateInfo
    };

    const _has = (obj, key) => {
      return Object.prototype.hasOwnProperty.call(obj, key);
    };

    var assign = function (obj
    /*from1, from2, from3, ...*/
    ) {
      const sources = Array.prototype.slice.call(arguments, 1);

      while (sources.length) {
        const source = sources.shift();

        if (!source) {
          continue;
        }

        if (typeof source !== 'object') {
          throw new TypeError(source + 'must be non-object');
        }

        for (const p in source) {
          if (_has(source, p)) {
            obj[p] = source[p];
          }
        }
      }

      return obj;
    }; // Join array of chunks to single array.


    var flattenChunks = chunks => {
      // calculate data length
      let len = 0;

      for (let i = 0, l = chunks.length; i < l; i++) {
        len += chunks[i].length;
      } // join chunks


      const result = new Uint8Array(len);

      for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
        let chunk = chunks[i];
        result.set(chunk, pos);
        pos += chunk.length;
      }

      return result;
    };

    var common = {
      assign: assign,
      flattenChunks: flattenChunks
    }; // String encode/decode helpers
    // Quick check if we can use fast array to bin string conversion
    //
    // - apply(Array) can fail on Android 2.2
    // - apply(Uint8Array) can fail on iOS 5.1 Safari
    //

    let STR_APPLY_UIA_OK = true;

    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    } // Table with utf8 lengths (calculated by first byte of sequence)
    // Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
    // because max possible codepoint is 0x10ffff


    const _utf8len = new Uint8Array(256);

    for (let q = 0; q < 256; q++) {
      _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }

    _utf8len[254] = _utf8len[254] = 1; // Invalid sequence start
    // convert string to array (typed, when possible)

    var string2buf = str => {
      if (typeof TextEncoder === 'function' && TextEncoder.prototype.encode) {
        return new TextEncoder().encode(str);
      }

      let buf,
          c,
          c2,
          m_pos,
          i,
          str_len = str.length,
          buf_len = 0; // count binary size

      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);

        if ((c & 0xfc00) === 0xd800 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);

          if ((c2 & 0xfc00) === 0xdc00) {
            c = 0x10000 + (c - 0xd800 << 10) + (c2 - 0xdc00);
            m_pos++;
          }
        }

        buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
      } // allocate buffer


      buf = new Uint8Array(buf_len); // convert

      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);

        if ((c & 0xfc00) === 0xd800 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);

          if ((c2 & 0xfc00) === 0xdc00) {
            c = 0x10000 + (c - 0xd800 << 10) + (c2 - 0xdc00);
            m_pos++;
          }
        }

        if (c < 0x80) {
          /* one byte */
          buf[i++] = c;
        } else if (c < 0x800) {
          /* two bytes */
          buf[i++] = 0xC0 | c >>> 6;
          buf[i++] = 0x80 | c & 0x3f;
        } else if (c < 0x10000) {
          /* three bytes */
          buf[i++] = 0xE0 | c >>> 12;
          buf[i++] = 0x80 | c >>> 6 & 0x3f;
          buf[i++] = 0x80 | c & 0x3f;
        } else {
          /* four bytes */
          buf[i++] = 0xf0 | c >>> 18;
          buf[i++] = 0x80 | c >>> 12 & 0x3f;
          buf[i++] = 0x80 | c >>> 6 & 0x3f;
          buf[i++] = 0x80 | c & 0x3f;
        }
      }

      return buf;
    }; // Helper


    const buf2binstring = (buf, len) => {
      // On Chrome, the arguments in a function call that are allowed is `65534`.
      // If the length of the buffer is smaller than that, we can use this optimization,
      // otherwise we will take a slower path.
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK) {
          return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
        }
      }

      let result = '';

      for (let i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }

      return result;
    }; // convert array to string


    var buf2string = (buf, max) => {
      const len = max || buf.length;

      if (typeof TextDecoder === 'function' && TextDecoder.prototype.decode) {
        return new TextDecoder().decode(buf.subarray(0, max));
      }

      let i, out; // Reserve max possible length (2 words per char)
      // NB: by unknown reasons, Array is significantly faster for
      //     String.fromCharCode.apply than Uint16Array.

      const utf16buf = new Array(len * 2);

      for (out = 0, i = 0; i < len;) {
        let c = buf[i++]; // quick process ascii

        if (c < 0x80) {
          utf16buf[out++] = c;
          continue;
        }

        let c_len = _utf8len[c]; // skip 5 & 6 byte codes

        if (c_len > 4) {
          utf16buf[out++] = 0xfffd;
          i += c_len - 1;
          continue;
        } // apply mask on first byte


        c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07; // join the rest

        while (c_len > 1 && i < len) {
          c = c << 6 | buf[i++] & 0x3f;
          c_len--;
        } // terminated by end of string?


        if (c_len > 1) {
          utf16buf[out++] = 0xfffd;
          continue;
        }

        if (c < 0x10000) {
          utf16buf[out++] = c;
        } else {
          c -= 0x10000;
          utf16buf[out++] = 0xd800 | c >> 10 & 0x3ff;
          utf16buf[out++] = 0xdc00 | c & 0x3ff;
        }
      }

      return buf2binstring(utf16buf, out);
    }; // Calculate max possible position in utf8 buffer,
    // that will not break sequence. If that's not possible
    // - (very small limits) return max size as is.
    //
    // buf[] - utf8 bytes array
    // max   - length limit (mandatory);


    var utf8border = (buf, max) => {
      max = max || buf.length;

      if (max > buf.length) {
        max = buf.length;
      } // go back from last position, until start of sequence found


      let pos = max - 1;

      while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) {
        pos--;
      } // Very small and broken sequence,
      // return max, because we should return something anyway.


      if (pos < 0) {
        return max;
      } // If we came to start of buffer - that means buffer is too small,
      // return max too.


      if (pos === 0) {
        return max;
      }

      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };

    var strings = {
      string2buf: string2buf,
      buf2string: buf2string,
      utf8border: utf8border
    }; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    function ZStream() {
      /* next input byte */
      this.input = null; // JS specific, because we have no pointers

      this.next_in = 0;
      /* number of bytes available at input */

      this.avail_in = 0;
      /* total number of input bytes read so far */

      this.total_in = 0;
      /* next output byte should be put there */

      this.output = null; // JS specific, because we have no pointers

      this.next_out = 0;
      /* remaining free space at output */

      this.avail_out = 0;
      /* total number of bytes output so far */

      this.total_out = 0;
      /* last error message, NULL if no error */

      this.msg = ''
      /*Z_NULL*/
      ;
      /* not visible by applications */

      this.state = null;
      /* best guess about the data type: binary or text */

      this.data_type = 2
      /*Z_UNKNOWN*/
      ;
      /* adler32 value of the uncompressed data */

      this.adler = 0;
    }

    var zstream = ZStream;
    const toString$1 = Object.prototype.toString;
    /* Public constants ==========================================================*/

    /* ===========================================================================*/

    const {
      Z_NO_FLUSH: Z_NO_FLUSH$1,
      Z_SYNC_FLUSH,
      Z_FULL_FLUSH,
      Z_FINISH: Z_FINISH$2,
      Z_OK: Z_OK$2,
      Z_STREAM_END: Z_STREAM_END$2,
      Z_DEFAULT_COMPRESSION,
      Z_DEFAULT_STRATEGY,
      Z_DEFLATED: Z_DEFLATED$1
    } = constants$2;
    /* ===========================================================================*/

    /**
     * class Deflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[deflate]],
     * [[deflateRaw]] and [[gzip]].
     **/

    /* internal
     * Deflate.chunks -> Array
     *
     * Chunks of output data, if [[Deflate#onData]] not overridden.
     **/

    /**
     * Deflate.result -> Uint8Array
     *
     * Compressed result, generated by default [[Deflate#onData]]
     * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Deflate#push]] with `Z_FINISH` / `true` param).
     **/

    /**
     * Deflate.err -> Number
     *
     * Error code after deflate finished. 0 (Z_OK) on success.
     * You will not need it in real life, because deflate errors
     * are possible only on wrong options or bad `onData` / `onEnd`
     * custom handlers.
     **/

    /**
     * Deflate.msg -> String
     *
     * Error message, if [[Deflate.err]] != 0
     **/

    /**
     * new Deflate(options)
     * - options (Object): zlib deflate options.
     *
     * Creates new deflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `level`
     * - `windowBits`
     * - `memLevel`
     * - `strategy`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw deflate
     * - `gzip` (Boolean) - create gzip wrapper
     * - `header` (Object) - custom header for gzip
     *   - `text` (Boolean) - true if compressed data believed to be text
     *   - `time` (Number) - modification time, unix timestamp
     *   - `os` (Number) - operation system code
     *   - `extra` (Array) - array of bytes with extra data (max 65536)
     *   - `name` (String) - file name (binary string)
     *   - `comment` (String) - comment (binary string)
     *   - `hcrc` (Boolean) - true if header crc should be added
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako')
     *   , chunk1 = new Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = new Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * const deflate = new pako.Deflate({ level: 3});
     *
     * deflate.push(chunk1, false);
     * deflate.push(chunk2, true);  // true -> last chunk
     *
     * if (deflate.err) { throw new Error(deflate.err); }
     *
     * console.log(deflate.result);
     * ```
     **/

    function Deflate$1(options) {
      this.options = common.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED$1,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY
      }, options || {});
      let opt = this.options;

      if (opt.raw && opt.windowBits > 0) {
        opt.windowBits = -opt.windowBits;
      } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
        opt.windowBits += 16;
      }

      this.err = 0; // error code, if happens (0 = Z_OK)

      this.msg = ''; // error message

      this.ended = false; // used to avoid multiple onEnd() calls

      this.chunks = []; // chunks of compressed data

      this.strm = new zstream();
      this.strm.avail_out = 0;
      let status = deflate_1$2.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);

      if (status !== Z_OK$2) {
        throw new Error(messages[status]);
      }

      if (opt.header) {
        deflate_1$2.deflateSetHeader(this.strm, opt.header);
      }

      if (opt.dictionary) {
        let dict; // Convert data if needed

        if (typeof opt.dictionary === 'string') {
          // If we need to compress text, change encoding to utf8.
          dict = strings.string2buf(opt.dictionary);
        } else if (toString$1.call(opt.dictionary) === '[object ArrayBuffer]') {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }

        status = deflate_1$2.deflateSetDictionary(this.strm, dict);

        if (status !== Z_OK$2) {
          throw new Error(messages[status]);
        }

        this._dict_set = true;
      }
    }
    /**
     * Deflate#push(data[, flush_mode]) -> Boolean
     * - data (Uint8Array|ArrayBuffer|String): input data. Strings will be
     *   converted to utf8 byte sequence.
     * - flush_mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
     *
     * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
     * new compressed chunks. Returns `true` on success. The last data block must
     * have `flush_mode` Z_FINISH (or `true`). That will flush internal pending
     * buffers and call [[Deflate#onEnd]].
     *
     * On fail call [[Deflate#onEnd]] with error code and return false.
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/


    Deflate$1.prototype.push = function (data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;

      let status, _flush_mode;

      if (this.ended) {
        return false;
      }

      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1; // Convert data if needed

      if (typeof data === 'string') {
        // If we need to compress text, change encoding to utf8.
        strm.input = strings.string2buf(data);
      } else if (toString$1.call(data) === '[object ArrayBuffer]') {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }

      strm.next_in = 0;
      strm.avail_in = strm.input.length;

      for (;;) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        } // Make sure avail_out > 6 to avoid repeating markers


        if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }

        status = deflate_1$2.deflate(strm, _flush_mode); // Ended => flush and finish

        if (status === Z_STREAM_END$2) {
          if (strm.next_out > 0) {
            this.onData(strm.output.subarray(0, strm.next_out));
          }

          status = deflate_1$2.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK$2;
        } // Flush if out buffer full


        if (strm.avail_out === 0) {
          this.onData(strm.output);
          continue;
        } // Flush if requested and has data


        if (_flush_mode > 0 && strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }

        if (strm.avail_in === 0) break;
      }

      return true;
    };
    /**
     * Deflate#onData(chunk) -> Void
     * - chunk (Uint8Array): output data.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/


    Deflate$1.prototype.onData = function (chunk) {
      this.chunks.push(chunk);
    };
    /**
     * Deflate#onEnd(status) -> Void
     * - status (Number): deflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called once after you tell deflate that the input stream is
     * complete (Z_FINISH). By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/


    Deflate$1.prototype.onEnd = function (status) {
      // On success - join
      if (status === Z_OK$2) {
        this.result = common.flattenChunks(this.chunks);
      }

      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    /**
     * deflate(data[, options]) -> Uint8Array
     * - data (Uint8Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * Compress `data` with deflate algorithm and `options`.
     *
     * Supported options are:
     *
     * - level
     * - windowBits
     * - memLevel
     * - strategy
     * - dictionary
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako')
     * const data = new Uint8Array([1,2,3,4,5,6,7,8,9]);
     *
     * console.log(pako.deflate(data));
     * ```
     **/


    function deflate$1(input, options) {
      const deflator = new Deflate$1(options);
      deflator.push(input, true); // That will never happens, if you don't cheat with options :)

      if (deflator.err) {
        throw deflator.msg || messages[deflator.err];
      }

      return deflator.result;
    }
    /**
     * deflateRaw(data[, options]) -> Uint8Array
     * - data (Uint8Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/


    function deflateRaw$1(input, options) {
      options = options || {};
      options.raw = true;
      return deflate$1(input, options);
    }
    /**
     * gzip(data[, options]) -> Uint8Array
     * - data (Uint8Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but create gzip wrapper instead of
     * deflate one.
     **/


    function gzip$1(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate$1(input, options);
    }

    var Deflate_1$1 = Deflate$1;
    var deflate_2 = deflate$1;
    var deflateRaw_1$1 = deflateRaw$1;
    var gzip_1$1 = gzip$1;
    var constants$1 = constants$2;
    var deflate_1$1 = {
      Deflate: Deflate_1$1,
      deflate: deflate_2,
      deflateRaw: deflateRaw_1$1,
      gzip: gzip_1$1,
      constants: constants$1
    }; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.
    // See state defs from inflate.js

    const BAD$1 = 30;
    /* got a data error -- remain here until reset */

    const TYPE$1 = 12;
    /* i: waiting for type bits, including last-flag bit */

    /*
       Decode literal, length, and distance codes and write out the resulting
       literal and match bytes until either not enough input or output is
       available, an end-of-block is encountered, or a data error is encountered.
       When large enough input and output buffers are supplied to inflate(), for
       example, a 16K input buffer and a 64K output buffer, more than 95% of the
       inflate execution time is spent in this routine.
        Entry assumptions:
             state.mode === LEN
            strm.avail_in >= 6
            strm.avail_out >= 258
            start >= strm.avail_out
            state.bits < 8
        On return, state.mode is one of:
             LEN -- ran out of enough output space or enough available input
            TYPE -- reached end of block code, inflate() to interpret next block
            BAD -- error in block data
        Notes:
         - The maximum input bits used by a length/distance pair is 15 bits for the
          length code, 5 bits for the length extra, 15 bits for the distance code,
          and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
          Therefore if strm.avail_in >= 6, then there is enough input to avoid
          checking for available input while decoding.
         - The maximum bytes that a single length/distance pair can output is 258
          bytes, which is the maximum length that can be coded.  inflate_fast()
          requires strm.avail_out >= 258 for each loop to avoid checking for
          output space.
     */

    var inffast = function inflate_fast(strm, start) {
      let _in;
      /* local strm.input */


      let last;
      /* have enough input while in < last */

      let _out;
      /* local strm.output */


      let beg;
      /* inflate()'s initial strm.output */

      let end;
      /* while out < end, enough space available */
      //#ifdef INFLATE_STRICT

      let dmax;
      /* maximum distance from zlib header */
      //#endif

      let wsize;
      /* window size or zero if not using window */

      let whave;
      /* valid bytes in the window */

      let wnext;
      /* window write index */
      // Use `s_window` instead `window`, avoid conflict with instrumentation tools

      let s_window;
      /* allocated sliding window, if wsize != 0 */

      let hold;
      /* local strm.hold */

      let bits;
      /* local strm.bits */

      let lcode;
      /* local strm.lencode */

      let dcode;
      /* local strm.distcode */

      let lmask;
      /* mask for first level of length codes */

      let dmask;
      /* mask for first level of distance codes */

      let here;
      /* retrieved table entry */

      let op;
      /* code bits, operation, extra bits, or */

      /*  window position, window bytes to copy */

      let len;
      /* match length, unused bytes */

      let dist;
      /* match distance */

      let from;
      /* where to copy match from */

      let from_source;
      let input, output; // JS specific, because we have no pointers

      /* copy state to local variables */

      const state = strm.state; //here = state.here;

      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257); //#ifdef INFLATE_STRICT

      dmax = state.dmax; //#endif

      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;
      /* decode literals and length/distances until end-of-block or not enough
         input data or output space */

      top: do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }

        here = lcode[hold & lmask];

        dolen: for (;;) {
          // Goto emulation
          op = here >>> 24
          /*here.bits*/
          ;
          hold >>>= op;
          bits -= op;
          op = here >>> 16 & 0xff
          /*here.op*/
          ;

          if (op === 0) {
            /* literal */
            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
            //        "inflate:         literal '%c'\n" :
            //        "inflate:         literal 0x%02x\n", here.val));
            output[_out++] = here & 0xffff
            /*here.val*/
            ;
          } else if (op & 16) {
            /* length base */
            len = here & 0xffff
            /*here.val*/
            ;
            op &= 15;
            /* number of extra bits */

            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }

              len += hold & (1 << op) - 1;
              hold >>>= op;
              bits -= op;
            } //Tracevv((stderr, "inflate:         length %u\n", len));


            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }

            here = dcode[hold & dmask];

            dodist: for (;;) {
              // goto emulation
              op = here >>> 24
              /*here.bits*/
              ;
              hold >>>= op;
              bits -= op;
              op = here >>> 16 & 0xff
              /*here.op*/
              ;

              if (op & 16) {
                /* distance base */
                dist = here & 0xffff
                /*here.val*/
                ;
                op &= 15;
                /* number of extra bits */

                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;

                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                }

                dist += hold & (1 << op) - 1; //#ifdef INFLATE_STRICT

                if (dist > dmax) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD$1;
                  break top;
                } //#endif


                hold >>>= op;
                bits -= op; //Tracevv((stderr, "inflate:         distance %u\n", dist));

                op = _out - beg;
                /* max distance in output */

                if (dist > op) {
                  /* see if copy from window */
                  op = dist - op;
                  /* distance back in window */

                  if (op > whave) {
                    if (state.sane) {
                      strm.msg = 'invalid distance too far back';
                      state.mode = BAD$1;
                      break top;
                    } // (!) This block is disabled in zlib defaults,
                    // don't enable it for binary compatibility
                    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                    //                if (len <= op - whave) {
                    //                  do {
                    //                    output[_out++] = 0;
                    //                  } while (--len);
                    //                  continue top;
                    //                }
                    //                len -= op - whave;
                    //                do {
                    //                  output[_out++] = 0;
                    //                } while (--op > whave);
                    //                if (op === 0) {
                    //                  from = _out - dist;
                    //                  do {
                    //                    output[_out++] = output[from++];
                    //                  } while (--len);
                    //                  continue top;
                    //                }
                    //#endif

                  }

                  from = 0; // window index

                  from_source = s_window;

                  if (wnext === 0) {
                    /* very common case */
                    from += wsize - op;

                    if (op < len) {
                      /* some from window */
                      len -= op;

                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);

                      from = _out - dist;
                      /* rest from output */

                      from_source = output;
                    }
                  } else if (wnext < op) {
                    /* wrap around window */
                    from += wsize + wnext - op;
                    op -= wnext;

                    if (op < len) {
                      /* some from end of window */
                      len -= op;

                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);

                      from = 0;

                      if (wnext < len) {
                        /* some from start of window */
                        op = wnext;
                        len -= op;

                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);

                        from = _out - dist;
                        /* rest from output */

                        from_source = output;
                      }
                    }
                  } else {
                    /* contiguous in window */
                    from += wnext - op;

                    if (op < len) {
                      /* some from window */
                      len -= op;

                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);

                      from = _out - dist;
                      /* rest from output */

                      from_source = output;
                    }
                  }

                  while (len > 2) {
                    output[_out++] = from_source[from++];
                    output[_out++] = from_source[from++];
                    output[_out++] = from_source[from++];
                    len -= 3;
                  }

                  if (len) {
                    output[_out++] = from_source[from++];

                    if (len > 1) {
                      output[_out++] = from_source[from++];
                    }
                  }
                } else {
                  from = _out - dist;
                  /* copy direct from output */

                  do {
                    /* minimum length is three */
                    output[_out++] = output[from++];
                    output[_out++] = output[from++];
                    output[_out++] = output[from++];
                    len -= 3;
                  } while (len > 2);

                  if (len) {
                    output[_out++] = output[from++];

                    if (len > 1) {
                      output[_out++] = output[from++];
                    }
                  }
                }
              } else if ((op & 64) === 0) {
                /* 2nd level distance code */
                here = dcode[(here & 0xffff
                /*here.val*/
                ) + (hold & (1 << op) - 1)];
                continue dodist;
              } else {
                strm.msg = 'invalid distance code';
                state.mode = BAD$1;
                break top;
              }

              break; // need to emulate goto via "continue"
            }
          } else if ((op & 64) === 0) {
            /* 2nd level length code */
            here = lcode[(here & 0xffff
            /*here.val*/
            ) + (hold & (1 << op) - 1)];
            continue dolen;
          } else if (op & 32) {
            /* end-of-block */
            //Tracevv((stderr, "inflate:         end of block\n"));
            state.mode = TYPE$1;
            break top;
          } else {
            strm.msg = 'invalid literal/length code';
            state.mode = BAD$1;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      } while (_in < last && _out < end);
      /* return unused bytes (on entry, bits < 8, so in won't go too far back) */


      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;
      /* update state and return */

      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
      strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
      state.hold = hold;
      state.bits = bits;
      return;
    }; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.


    const MAXBITS = 15;
    const ENOUGH_LENS$1 = 852;
    const ENOUGH_DISTS$1 = 592; //const ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

    const CODES$1 = 0;
    const LENS$1 = 1;
    const DISTS$1 = 2;
    const lbase = new Uint16Array([
    /* Length codes 257..285 base */
    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]);
    const lext = new Uint8Array([
    /* Length codes 257..285 extra */
    16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78]);
    const dbase = new Uint16Array([
    /* Distance codes 0..29 base */
    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]);
    const dext = new Uint8Array([
    /* Distance codes 0..29 extra */
    16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]);

    const inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
      const bits = opts.bits; //here = opts.here; /* table entry for duplication */

      let len = 0;
      /* a code's length in bits */

      let sym = 0;
      /* index of code symbols */

      let min = 0,
          max = 0;
      /* minimum and maximum code lengths */

      let root = 0;
      /* number of index bits for root table */

      let curr = 0;
      /* number of index bits for current table */

      let drop = 0;
      /* code bits to drop for sub-table */

      let left = 0;
      /* number of prefix codes available */

      let used = 0;
      /* code entries in table used */

      let huff = 0;
      /* Huffman code */

      let incr;
      /* for incrementing code, index */

      let fill;
      /* index for replicating entries */

      let low;
      /* low bits for current root entry */

      let mask;
      /* mask for low root bits */

      let next;
      /* next available space in table */

      let base = null;
      /* base value table to use */

      let base_index = 0; //  let shoextra;    /* extra bits table to use */

      let end;
      /* use base and extra for symbol > end */

      const count = new Uint16Array(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */

      const offs = new Uint16Array(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */

      let extra = null;
      let extra_index = 0;
      let here_bits, here_op, here_val;
      /*
       Process a set of code lengths to create a canonical Huffman code.  The
       code lengths are lens[0..codes-1].  Each length corresponds to the
       symbols 0..codes-1.  The Huffman code is generated by first sorting the
       symbols by length from short to long, and retaining the symbol order
       for codes with equal lengths.  Then the code starts with all zero bits
       for the first code of the shortest length, and the codes are integer
       increments for the same length, and zeros are appended as the length
       increases.  For the deflate format, these bits are stored backwards
       from their more natural integer increment ordering, and so when the
       decoding tables are built in the large loop below, the integer codes
       are incremented backwards.
        This routine assumes, but does not check, that all of the entries in
       lens[] are in the range 0..MAXBITS.  The caller must assure this.
       1..MAXBITS is interpreted as that code length.  zero means that that
       symbol does not occur in this code.
        The codes are sorted by computing a count of codes for each length,
       creating from that a table of starting indices for each length in the
       sorted table, and then entering the symbols in order in the sorted
       table.  The sorted table is work[], with that space being provided by
       the caller.
        The length counts are used for other purposes as well, i.e. finding
       the minimum and maximum length codes, determining if there are any
       codes at all, checking for a valid set of lengths, and looking ahead
       at length counts to determine sub-table sizes when building the
       decoding tables.
       */

      /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */

      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }

      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      /* bound code lengths, force root to be within code lengths */


      root = bits;

      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }

      if (root > max) {
        root = max;
      }

      if (max === 0) {
        /* no symbols to code at all */
        //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
        //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
        //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0; //table.op[opts.table_index] = 64;
        //table.bits[opts.table_index] = 1;
        //table.val[opts.table_index++] = 0;

        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
        /* no symbols, but wait for decoding to report error */
      }

      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }

      if (root < min) {
        root = min;
      }
      /* check for an over-subscribed or incomplete set of lengths */


      left = 1;

      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];

        if (left < 0) {
          return -1;
        }
        /* over-subscribed */

      }

      if (left > 0 && (type === CODES$1 || max !== 1)) {
        return -1;
        /* incomplete set */
      }
      /* generate offsets into symbol table for each length for sorting */


      offs[1] = 0;

      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      /* sort symbols by length, by symbol order within each length */


      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      /*
       Create and fill in decoding tables.  In this loop, the table being
       filled is at next and has curr index bits.  The code being used is huff
       with length len.  That code is converted to an index by dropping drop
       bits off of the bottom.  For codes where len is less than drop + curr,
       those top drop + curr - len bits are incremented through all values to
       fill the table with replicated entries.
        root is the number of index bits for the root table.  When len exceeds
       root, sub-tables are created pointed to by the root entry with an index
       of the low root bits of huff.  This is saved in low to check for when a
       new sub-table should be started.  drop is zero when the root table is
       being filled, and drop is root when sub-tables are being filled.
        When a new sub-table is needed, it is necessary to look ahead in the
       code lengths to determine what size sub-table is needed.  The length
       counts are used for this, and so count[] is decremented as codes are
       entered in the tables.
        used keeps track of how many table entries have been allocated from the
       provided *table space.  It is checked for LENS and DIST tables against
       the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
       the initial root table size constants.  See the comments in inftrees.h
       for more information.
        sym increments through all symbols, and the loop terminates when
       all codes of length max, i.e. all codes, have been processed.  This
       routine permits incomplete codes, so another loop after this one fills
       in the rest of the decoding tables with invalid code markers.
       */

      /* set up for code type */
      // poor man optimization - use if-else instead of switch,
      // to avoid deopts in old v8


      if (type === CODES$1) {
        base = extra = work;
        /* dummy value--not used */

        end = 19;
      } else if (type === LENS$1) {
        base = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;
      } else {
        /* DISTS */
        base = dbase;
        extra = dext;
        end = -1;
      }
      /* initialize opts for loop */


      huff = 0;
      /* starting code */

      sym = 0;
      /* starting code symbol */

      len = min;
      /* starting code length */

      next = table_index;
      /* current table to fill in */

      curr = root;
      /* current table index bits */

      drop = 0;
      /* current bits to drop from code for index */

      low = -1;
      /* trigger new sub-table when len > root */

      used = 1 << root;
      /* use root table entries */

      mask = used - 1;
      /* mask for comparing low */

      /* check available table space */

      if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
        return 1;
      }
      /* process all codes and make table entries */


      for (;;) {
        /* create table entry */
        here_bits = len - drop;

        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base[base_index + work[sym]];
        } else {
          here_op = 32 + 64;
          /* end of block */

          here_val = 0;
        }
        /* replicate for those indices with low len bits equal to huff */


        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        /* save offset to next table */

        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill !== 0);
        /* backwards increment the len-bit code huff */


        incr = 1 << len - 1;

        while (huff & incr) {
          incr >>= 1;
        }

        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        /* go to next symbol, update count, len */


        sym++;

        if (--count[len] === 0) {
          if (len === max) {
            break;
          }

          len = lens[lens_index + work[sym]];
        }
        /* create new sub-table if needed */


        if (len > root && (huff & mask) !== low) {
          /* if first time, transition to sub-tables */
          if (drop === 0) {
            drop = root;
          }
          /* increment past last table */


          next += min;
          /* here min is 1 << curr */

          /* determine length of next table */

          curr = len - drop;
          left = 1 << curr;

          while (curr + drop < max) {
            left -= count[curr + drop];

            if (left <= 0) {
              break;
            }

            curr++;
            left <<= 1;
          }
          /* check for enough space */


          used += 1 << curr;

          if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
            return 1;
          }
          /* point entry in root table to sub-table */


          low = huff & mask;
          /*table.op[low] = curr;
          table.bits[low] = root;
          table.val[low] = next - opts.table_index;*/

          table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
      }
      /* fill in remaining table entry if code is incomplete (guaranteed to have
       at most one remaining entry, since if the code is incomplete, the
       maximum code length that was allowed to get this far is one bit) */


      if (huff !== 0) {
        //table.op[next + huff] = 64;            /* invalid code marker */
        //table.bits[next + huff] = len - drop;
        //table.val[next + huff] = 0;
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      /* set return parameters */
      //opts.table_index += used;


      opts.bits = root;
      return 0;
    };

    var inftrees = inflate_table; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    const CODES = 0;
    const LENS = 1;
    const DISTS = 2;
    /* Public constants ==========================================================*/

    /* ===========================================================================*/

    const {
      Z_FINISH: Z_FINISH$1,
      Z_BLOCK,
      Z_TREES,
      Z_OK: Z_OK$1,
      Z_STREAM_END: Z_STREAM_END$1,
      Z_NEED_DICT: Z_NEED_DICT$1,
      Z_STREAM_ERROR: Z_STREAM_ERROR$1,
      Z_DATA_ERROR: Z_DATA_ERROR$1,
      Z_MEM_ERROR: Z_MEM_ERROR$1,
      Z_BUF_ERROR,
      Z_DEFLATED
    } = constants$2;
    /* STATES ====================================================================*/

    /* ===========================================================================*/

    const HEAD = 1;
    /* i: waiting for magic header */

    const FLAGS = 2;
    /* i: waiting for method and flags (gzip) */

    const TIME = 3;
    /* i: waiting for modification time (gzip) */

    const OS = 4;
    /* i: waiting for extra flags and operating system (gzip) */

    const EXLEN = 5;
    /* i: waiting for extra length (gzip) */

    const EXTRA = 6;
    /* i: waiting for extra bytes (gzip) */

    const NAME = 7;
    /* i: waiting for end of file name (gzip) */

    const COMMENT = 8;
    /* i: waiting for end of comment (gzip) */

    const HCRC = 9;
    /* i: waiting for header crc (gzip) */

    const DICTID = 10;
    /* i: waiting for dictionary check value */

    const DICT = 11;
    /* waiting for inflateSetDictionary() call */

    const TYPE = 12;
    /* i: waiting for type bits, including last-flag bit */

    const TYPEDO = 13;
    /* i: same, but skip check to exit inflate on new block */

    const STORED = 14;
    /* i: waiting for stored size (length and complement) */

    const COPY_ = 15;
    /* i/o: same as COPY below, but only first time in */

    const COPY = 16;
    /* i/o: waiting for input or output to copy stored block */

    const TABLE = 17;
    /* i: waiting for dynamic block table lengths */

    const LENLENS = 18;
    /* i: waiting for code length code lengths */

    const CODELENS = 19;
    /* i: waiting for length/lit and distance code lengths */

    const LEN_ = 20;
    /* i: same as LEN below, but only first time in */

    const LEN = 21;
    /* i: waiting for length/lit/eob code */

    const LENEXT = 22;
    /* i: waiting for length extra bits */

    const DIST = 23;
    /* i: waiting for distance code */

    const DISTEXT = 24;
    /* i: waiting for distance extra bits */

    const MATCH = 25;
    /* o: waiting for output space to copy string */

    const LIT = 26;
    /* o: waiting for output space to write literal */

    const CHECK = 27;
    /* i: waiting for 32-bit check value */

    const LENGTH = 28;
    /* i: waiting for 32-bit length (gzip) */

    const DONE = 29;
    /* finished check, done -- remain here until reset */

    const BAD = 30;
    /* got a data error -- remain here until reset */

    const MEM = 31;
    /* got an inflate() memory error -- remain here until reset */

    const SYNC = 32;
    /* looking for synchronization bytes to restart inflate() */

    /* ===========================================================================*/

    const ENOUGH_LENS = 852;
    const ENOUGH_DISTS = 592; //const ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

    const MAX_WBITS = 15;
    /* 32K LZ77 window */

    const DEF_WBITS = MAX_WBITS;

    const zswap32 = q => {
      return (q >>> 24 & 0xff) + (q >>> 8 & 0xff00) + ((q & 0xff00) << 8) + ((q & 0xff) << 24);
    };

    function InflateState() {
      this.mode = 0;
      /* current inflate mode */

      this.last = false;
      /* true if processing last block */

      this.wrap = 0;
      /* bit 0 true for zlib, bit 1 true for gzip */

      this.havedict = false;
      /* true if dictionary provided */

      this.flags = 0;
      /* gzip header method and flags (0 if zlib) */

      this.dmax = 0;
      /* zlib header max distance (INFLATE_STRICT) */

      this.check = 0;
      /* protected copy of check value */

      this.total = 0;
      /* protected copy of output count */
      // TODO: may be {}

      this.head = null;
      /* where to save gzip header information */

      /* sliding window */

      this.wbits = 0;
      /* log base 2 of requested window size */

      this.wsize = 0;
      /* window size or zero if not using window */

      this.whave = 0;
      /* valid bytes in the window */

      this.wnext = 0;
      /* window write index */

      this.window = null;
      /* allocated sliding window, if needed */

      /* bit accumulator */

      this.hold = 0;
      /* input bit accumulator */

      this.bits = 0;
      /* number of bits in "in" */

      /* for string and stored block copying */

      this.length = 0;
      /* literal or length of data to copy */

      this.offset = 0;
      /* distance back to copy string from */

      /* for table and code decoding */

      this.extra = 0;
      /* extra bits needed */

      /* fixed and dynamic code tables */

      this.lencode = null;
      /* starting table for length/literal codes */

      this.distcode = null;
      /* starting table for distance codes */

      this.lenbits = 0;
      /* index bits for lencode */

      this.distbits = 0;
      /* index bits for distcode */

      /* dynamic table building */

      this.ncode = 0;
      /* number of code length code lengths */

      this.nlen = 0;
      /* number of length code lengths */

      this.ndist = 0;
      /* number of distance code lengths */

      this.have = 0;
      /* number of code lengths in lens[] */

      this.next = null;
      /* next available space in codes[] */

      this.lens = new Uint16Array(320);
      /* temporary storage for code lengths */

      this.work = new Uint16Array(288);
      /* work area for code table building */

      /*
       because we don't have pointers in js, we use lencode and distcode directly
       as buffers so we don't need codes
      */
      //this.codes = new Int32Array(ENOUGH);       /* space for code tables */

      this.lendyn = null;
      /* dynamic table for length/literal codes (JS specific) */

      this.distdyn = null;
      /* dynamic table for distance codes (JS specific) */

      this.sane = 0;
      /* if false, allow invalid distance too far */

      this.back = 0;
      /* bits back of last unprocessed length/lit */

      this.was = 0;
      /* initial length of match */
    }

    const inflateResetKeep = strm => {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR$1;
      }

      const state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = '';
      /*Z_NULL*/

      if (state.wrap) {
        /* to support ill-conceived Java test suite */
        strm.adler = state.wrap & 1;
      }

      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null
      /*Z_NULL*/
      ;
      state.hold = 0;
      state.bits = 0; //state.lencode = state.distcode = state.next = state.codes;

      state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
      state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
      state.sane = 1;
      state.back = -1; //Tracev((stderr, "inflate: reset\n"));

      return Z_OK$1;
    };

    const inflateReset = strm => {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR$1;
      }

      const state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);
    };

    const inflateReset2 = (strm, windowBits) => {
      let wrap;
      /* get the state */

      if (!strm || !strm.state) {
        return Z_STREAM_ERROR$1;
      }

      const state = strm.state;
      /* extract wrap request from windowBits parameter */

      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 1;

        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      /* set number of window bits, free window if different */


      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR$1;
      }

      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      /* update state and reset the rest of it */


      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    };

    const inflateInit2 = (strm, windowBits) => {
      if (!strm) {
        return Z_STREAM_ERROR$1;
      } //strm.msg = Z_NULL;                 /* in case we return an error */


      const state = new InflateState(); //if (state === Z_NULL) return Z_MEM_ERROR;
      //Tracev((stderr, "inflate: allocated\n"));

      strm.state = state;
      state.window = null
      /*Z_NULL*/
      ;
      const ret = inflateReset2(strm, windowBits);

      if (ret !== Z_OK$1) {
        strm.state = null
        /*Z_NULL*/
        ;
      }

      return ret;
    };

    const inflateInit = strm => {
      return inflateInit2(strm, DEF_WBITS);
    };
    /*
     Return state with length and distance decoding tables and index sizes set to
     fixed code decoding.  Normally this returns fixed tables from inffixed.h.
     If BUILDFIXED is defined, then instead this routine builds the tables the
     first time it's called, and returns those tables the first time and
     thereafter.  This reduces the size of the code by about 2K bytes, in
     exchange for a little execution time.  However, BUILDFIXED should not be
     used for threaded applications, since the rewriting of the tables and virgin
     may not be thread-safe.
     */


    let virgin = true;
    let lenfix, distfix; // We have no pointers in JS, so keep tables separate

    const fixedtables = state => {
      /* build fixed huffman tables if first call (may not be thread safe) */
      if (virgin) {
        lenfix = new Int32Array(512);
        distfix = new Int32Array(32);
        /* literal/length table */

        let sym = 0;

        while (sym < 144) {
          state.lens[sym++] = 8;
        }

        while (sym < 256) {
          state.lens[sym++] = 9;
        }

        while (sym < 280) {
          state.lens[sym++] = 7;
        }

        while (sym < 288) {
          state.lens[sym++] = 8;
        }

        inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, {
          bits: 9
        });
        /* distance table */

        sym = 0;

        while (sym < 32) {
          state.lens[sym++] = 5;
        }

        inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, {
          bits: 5
        });
        /* do this just once */

        virgin = false;
      }

      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    };
    /*
     Update the window with the last wsize (normally 32K) bytes written before
     returning.  If window does not exist yet, create it.  This is only called
     when a window is already in use, or when output has been written during this
     inflate call, but the end of the deflate stream has not been reached yet.
     It is also called to create a window for dictionary data when a dictionary
     is loaded.
      Providing output buffers larger than 32K to inflate() should provide a speed
     advantage, since only the last 32K of output is copied to the sliding window
     upon return from inflate(), and since all distances after the first 32K of
     output will fall in the output data, making match copies simpler and faster.
     The advantage may be dependent on the size of the processor's data caches.
     */


    const updatewindow = (strm, src, end, copy) => {
      let dist;
      const state = strm.state;
      /* if it hasn't been done already, allocate space for the window */

      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new Uint8Array(state.wsize);
      }
      /* copy state->wsize or less output bytes into the circular window */


      if (copy >= state.wsize) {
        state.window.set(src.subarray(end - state.wsize, end), 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;

        if (dist > copy) {
          dist = copy;
        } //zmemcpy(state->window + state->wnext, end - copy, dist);


        state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
        copy -= dist;

        if (copy) {
          //zmemcpy(state->window, end - copy, copy);
          state.window.set(src.subarray(end - copy, end), 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;

          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }

          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }

      return 0;
    };

    const inflate$2 = (strm, flush) => {
      let state;
      let input, output; // input/output buffers

      let next;
      /* next input INDEX */

      let put;
      /* next output INDEX */

      let have, left;
      /* available input and output */

      let hold;
      /* bit buffer */

      let bits;
      /* bits in bit buffer */

      let _in, _out;
      /* save starting available input and output */


      let copy;
      /* number of stored or match bytes to copy */

      let from;
      /* where to copy match bytes from */

      let from_source;
      let here = 0;
      /* current decoding table entry */

      let here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
      //let last;                   /* parent table entry */

      let last_bits, last_op, last_val; // paked "last" denormalized (JS specific)

      let len;
      /* length to copy for repeats, bits to drop */

      let ret;
      /* return code */

      const hbuf = new Uint8Array(4);
      /* buffer for gzip header crc calculation */

      let opts;
      let n; // temporary variable for NEED_BITS

      const order =
      /* permutation of code lengths */
      new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

      if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR$1;
      }

      state = strm.state;

      if (state.mode === TYPE) {
        state.mode = TYPEDO;
      }
      /* skip check */
      //--- LOAD() ---


      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits; //---

      _in = have;
      _out = left;
      ret = Z_OK$1;

      inf_leave: // goto emulation
      for (;;) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            } //=== NEEDBITS(16);


            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            if (state.wrap & 2 && hold === 0x8b1f) {
              /* gzip header */
              state.check = 0
              /*crc32(0L, Z_NULL, 0)*/
              ; //=== CRC2(state.check, hold);

              hbuf[0] = hold & 0xff;
              hbuf[1] = hold >>> 8 & 0xff;
              state.check = crc32_1(state.check, hbuf, 2, 0); //===//
              //=== INITBITS();

              hold = 0;
              bits = 0; //===//

              state.mode = FLAGS;
              break;
            }

            state.flags = 0;
            /* expect zlib header */

            if (state.head) {
              state.head.done = false;
            }

            if (!(state.wrap & 1) ||
            /* check if zlib header allowed */
            (((hold & 0xff
            /*BITS(8)*/
            ) << 8) + (hold >> 8)) % 31) {
              strm.msg = 'incorrect header check';
              state.mode = BAD;
              break;
            }

            if ((hold & 0x0f
            /*BITS(4)*/
            ) !== Z_DEFLATED) {
              strm.msg = 'unknown compression method';
              state.mode = BAD;
              break;
            } //--- DROPBITS(4) ---//


            hold >>>= 4;
            bits -= 4; //---//

            len = (hold & 0x0f
            /*BITS(4)*/
            ) + 8;

            if (state.wbits === 0) {
              state.wbits = len;
            } else if (len > state.wbits) {
              strm.msg = 'invalid window size';
              state.mode = BAD;
              break;
            } // !!! pako patch. Force use `options.windowBits` if passed.
            // Required to always use max window size by default.


            state.dmax = 1 << state.wbits; //state.dmax = 1 << len;
            //Tracev((stderr, "inflate:   zlib header ok\n"));

            strm.adler = state.check = 1
            /*adler32(0L, Z_NULL, 0)*/
            ;
            state.mode = hold & 0x200 ? DICTID : TYPE; //=== INITBITS();

            hold = 0;
            bits = 0; //===//

            break;

          case FLAGS:
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.flags = hold;

            if ((state.flags & 0xff) !== Z_DEFLATED) {
              strm.msg = 'unknown compression method';
              state.mode = BAD;
              break;
            }

            if (state.flags & 0xe000) {
              strm.msg = 'unknown header flags set';
              state.mode = BAD;
              break;
            }

            if (state.head) {
              state.head.text = hold >> 8 & 1;
            }

            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = hold >>> 8 & 0xff;
              state.check = crc32_1(state.check, hbuf, 2, 0); //===//
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//

            state.mode = TIME;

          /* falls through */

          case TIME:
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            if (state.head) {
              state.head.time = hold;
            }

            if (state.flags & 0x0200) {
              //=== CRC4(state.check, hold)
              hbuf[0] = hold & 0xff;
              hbuf[1] = hold >>> 8 & 0xff;
              hbuf[2] = hold >>> 16 & 0xff;
              hbuf[3] = hold >>> 24 & 0xff;
              state.check = crc32_1(state.check, hbuf, 4, 0); //===
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//

            state.mode = OS;

          /* falls through */

          case OS:
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            if (state.head) {
              state.head.xflags = hold & 0xff;
              state.head.os = hold >> 8;
            }

            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = hold >>> 8 & 0xff;
              state.check = crc32_1(state.check, hbuf, 2, 0); //===//
            } //=== INITBITS();


            hold = 0;
            bits = 0; //===//

            state.mode = EXLEN;

          /* falls through */

          case EXLEN:
            if (state.flags & 0x0400) {
              //=== NEEDBITS(16); */
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8;
              } //===//


              state.length = hold;

              if (state.head) {
                state.head.extra_len = hold;
              }

              if (state.flags & 0x0200) {
                //=== CRC2(state.check, hold);
                hbuf[0] = hold & 0xff;
                hbuf[1] = hold >>> 8 & 0xff;
                state.check = crc32_1(state.check, hbuf, 2, 0); //===//
              } //=== INITBITS();


              hold = 0;
              bits = 0; //===//
            } else if (state.head) {
              state.head.extra = null
              /*Z_NULL*/
              ;
            }

            state.mode = EXTRA;

          /* falls through */

          case EXTRA:
            if (state.flags & 0x0400) {
              copy = state.length;

              if (copy > have) {
                copy = have;
              }

              if (copy) {
                if (state.head) {
                  len = state.head.extra_len - state.length;

                  if (!state.head.extra) {
                    // Use untyped array for more convenient processing later
                    state.head.extra = new Uint8Array(state.head.extra_len);
                  }

                  state.head.extra.set(input.subarray(next, // extra field is limited to 65536 bytes
                  // - no need for additional size check
                  next + copy),
                  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                  len); //zmemcpy(state.head.extra + len, next,
                  //        len + copy > state.head.extra_max ?
                  //        state.head.extra_max - len : copy);
                }

                if (state.flags & 0x0200) {
                  state.check = crc32_1(state.check, input, copy, next);
                }

                have -= copy;
                next += copy;
                state.length -= copy;
              }

              if (state.length) {
                break inf_leave;
              }
            }

            state.length = 0;
            state.mode = NAME;

          /* falls through */

          case NAME:
            if (state.flags & 0x0800) {
              if (have === 0) {
                break inf_leave;
              }

              copy = 0;

              do {
                // TODO: 2 or 1 bytes?
                len = input[next + copy++];
                /* use constant limit because in js we should not preallocate memory */

                if (state.head && len && state.length < 65536
                /*state.head.name_max*/
                ) {
                  state.head.name += String.fromCharCode(len);
                }
              } while (len && copy < have);

              if (state.flags & 0x0200) {
                state.check = crc32_1(state.check, input, copy, next);
              }

              have -= copy;
              next += copy;

              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.name = null;
            }

            state.length = 0;
            state.mode = COMMENT;

          /* falls through */

          case COMMENT:
            if (state.flags & 0x1000) {
              if (have === 0) {
                break inf_leave;
              }

              copy = 0;

              do {
                len = input[next + copy++];
                /* use constant limit because in js we should not preallocate memory */

                if (state.head && len && state.length < 65536
                /*state.head.comm_max*/
                ) {
                  state.head.comment += String.fromCharCode(len);
                }
              } while (len && copy < have);

              if (state.flags & 0x0200) {
                state.check = crc32_1(state.check, input, copy, next);
              }

              have -= copy;
              next += copy;

              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.comment = null;
            }

            state.mode = HCRC;

          /* falls through */

          case HCRC:
            if (state.flags & 0x0200) {
              //=== NEEDBITS(16); */
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8;
              } //===//


              if (hold !== (state.check & 0xffff)) {
                strm.msg = 'header crc mismatch';
                state.mode = BAD;
                break;
              } //=== INITBITS();


              hold = 0;
              bits = 0; //===//
            }

            if (state.head) {
              state.head.hcrc = state.flags >> 9 & 1;
              state.head.done = true;
            }

            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;

          case DICTID:
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            strm.adler = state.check = zswap32(hold); //=== INITBITS();

            hold = 0;
            bits = 0; //===//

            state.mode = DICT;

          /* falls through */

          case DICT:
            if (state.havedict === 0) {
              //--- RESTORE() ---
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits; //---

              return Z_NEED_DICT$1;
            }

            strm.adler = state.check = 1
            /*adler32(0L, Z_NULL, 0)*/
            ;
            state.mode = TYPE;

          /* falls through */

          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) {
              break inf_leave;
            }

          /* falls through */

          case TYPEDO:
            if (state.last) {
              //--- BYTEBITS() ---//
              hold >>>= bits & 7;
              bits -= bits & 7; //---//

              state.mode = CHECK;
              break;
            } //=== NEEDBITS(3); */


            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.last = hold & 0x01
            /*BITS(1)*/
            ; //--- DROPBITS(1) ---//

            hold >>>= 1;
            bits -= 1; //---//

            switch (hold & 0x03
            /*BITS(2)*/
            ) {
              case 0:
                /* stored block */
                //Tracev((stderr, "inflate:     stored block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = STORED;
                break;

              case 1:
                /* fixed block */
                fixedtables(state); //Tracev((stderr, "inflate:     fixed codes block%s\n",
                //        state.last ? " (last)" : ""));

                state.mode = LEN_;
                /* decode codes */

                if (flush === Z_TREES) {
                  //--- DROPBITS(2) ---//
                  hold >>>= 2;
                  bits -= 2; //---//

                  break inf_leave;
                }

                break;

              case 2:
                /* dynamic block */
                //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = TABLE;
                break;

              case 3:
                strm.msg = 'invalid block type';
                state.mode = BAD;
            } //--- DROPBITS(2) ---//


            hold >>>= 2;
            bits -= 2; //---//

            break;

          case STORED:
            //--- BYTEBITS() ---// /* go to byte boundary */
            hold >>>= bits & 7;
            bits -= bits & 7; //---//
            //=== NEEDBITS(32); */

            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            if ((hold & 0xffff) !== (hold >>> 16 ^ 0xffff)) {
              strm.msg = 'invalid stored block lengths';
              state.mode = BAD;
              break;
            }

            state.length = hold & 0xffff; //Tracev((stderr, "inflate:       stored length %u\n",
            //        state.length));
            //=== INITBITS();

            hold = 0;
            bits = 0; //===//

            state.mode = COPY_;

            if (flush === Z_TREES) {
              break inf_leave;
            }

          /* falls through */

          case COPY_:
            state.mode = COPY;

          /* falls through */

          case COPY:
            copy = state.length;

            if (copy) {
              if (copy > have) {
                copy = have;
              }

              if (copy > left) {
                copy = left;
              }

              if (copy === 0) {
                break inf_leave;
              } //--- zmemcpy(put, next, copy); ---


              output.set(input.subarray(next, next + copy), put); //---//

              have -= copy;
              next += copy;
              left -= copy;
              put += copy;
              state.length -= copy;
              break;
            } //Tracev((stderr, "inflate:       stored end\n"));


            state.mode = TYPE;
            break;

          case TABLE:
            //=== NEEDBITS(14); */
            while (bits < 14) {
              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8;
            } //===//


            state.nlen = (hold & 0x1f
            /*BITS(5)*/
            ) + 257; //--- DROPBITS(5) ---//

            hold >>>= 5;
            bits -= 5; //---//

            state.ndist = (hold & 0x1f
            /*BITS(5)*/
            ) + 1; //--- DROPBITS(5) ---//

            hold >>>= 5;
            bits -= 5; //---//

            state.ncode = (hold & 0x0f
            /*BITS(4)*/
            ) + 4; //--- DROPBITS(4) ---//

            hold >>>= 4;
            bits -= 4; //---//
            //#ifndef PKZIP_BUG_WORKAROUND

            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = 'too many length or distance symbols';
              state.mode = BAD;
              break;
            } //#endif
            //Tracev((stderr, "inflate:       table sizes ok\n"));


            state.have = 0;
            state.mode = LENLENS;

          /* falls through */

          case LENLENS:
            while (state.have < state.ncode) {
              //=== NEEDBITS(3);
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8;
              } //===//


              state.lens[order[state.have++]] = hold & 0x07; //BITS(3);
              //--- DROPBITS(3) ---//

              hold >>>= 3;
              bits -= 3; //---//
            }

            while (state.have < 19) {
              state.lens[order[state.have++]] = 0;
            } // We have separate tables & no pointers. 2 commented lines below not needed.
            //state.next = state.codes;
            //state.lencode = state.next;
            // Switch to use dynamic table


            state.lencode = state.lendyn;
            state.lenbits = 7;
            opts = {
              bits: state.lenbits
            };
            ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;

            if (ret) {
              strm.msg = 'invalid code lengths set';
              state.mode = BAD;
              break;
            } //Tracev((stderr, "inflate:       code lengths ok\n"));


            state.have = 0;
            state.mode = CODELENS;

          /* falls through */

          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (;;) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                /*BITS(state.lenbits)*/

                here_bits = here >>> 24;
                here_op = here >>> 16 & 0xff;
                here_val = here & 0xffff;

                if (here_bits <= bits) {
                  break;
                } //--- PULLBYTE() ---//


                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8; //---//
              }

              if (here_val < 16) {
                //--- DROPBITS(here.bits) ---//
                hold >>>= here_bits;
                bits -= here_bits; //---//

                state.lens[state.have++] = here_val;
              } else {
                if (here_val === 16) {
                  //=== NEEDBITS(here.bits + 2);
                  n = here_bits + 2;

                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }

                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  } //===//
                  //--- DROPBITS(here.bits) ---//


                  hold >>>= here_bits;
                  bits -= here_bits; //---//

                  if (state.have === 0) {
                    strm.msg = 'invalid bit length repeat';
                    state.mode = BAD;
                    break;
                  }

                  len = state.lens[state.have - 1];
                  copy = 3 + (hold & 0x03); //BITS(2);
                  //--- DROPBITS(2) ---//

                  hold >>>= 2;
                  bits -= 2; //---//
                } else if (here_val === 17) {
                  //=== NEEDBITS(here.bits + 3);
                  n = here_bits + 3;

                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }

                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  } //===//
                  //--- DROPBITS(here.bits) ---//


                  hold >>>= here_bits;
                  bits -= here_bits; //---//

                  len = 0;
                  copy = 3 + (hold & 0x07); //BITS(3);
                  //--- DROPBITS(3) ---//

                  hold >>>= 3;
                  bits -= 3; //---//
                } else {
                  //=== NEEDBITS(here.bits + 7);
                  n = here_bits + 7;

                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }

                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  } //===//
                  //--- DROPBITS(here.bits) ---//


                  hold >>>= here_bits;
                  bits -= here_bits; //---//

                  len = 0;
                  copy = 11 + (hold & 0x7f); //BITS(7);
                  //--- DROPBITS(7) ---//

                  hold >>>= 7;
                  bits -= 7; //---//
                }

                if (state.have + copy > state.nlen + state.ndist) {
                  strm.msg = 'invalid bit length repeat';
                  state.mode = BAD;
                  break;
                }

                while (copy--) {
                  state.lens[state.have++] = len;
                }
              }
            }
            /* handle error breaks in while */


            if (state.mode === BAD) {
              break;
            }
            /* check for end-of-block code (better have one) */


            if (state.lens[256] === 0) {
              strm.msg = 'invalid code -- missing end-of-block';
              state.mode = BAD;
              break;
            }
            /* build code tables -- note: do not change the lenbits or distbits
               values here (9 and 6) without reading the comments in inftrees.h
               concerning the ENOUGH constants, which depend on those values */


            state.lenbits = 9;
            opts = {
              bits: state.lenbits
            };
            ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts); // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;

            state.lenbits = opts.bits; // state.lencode = state.next;

            if (ret) {
              strm.msg = 'invalid literal/lengths set';
              state.mode = BAD;
              break;
            }

            state.distbits = 6; //state.distcode.copy(state.codes);
            // Switch to use dynamic table

            state.distcode = state.distdyn;
            opts = {
              bits: state.distbits
            };
            ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts); // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;

            state.distbits = opts.bits; // state.distcode = state.next;

            if (ret) {
              strm.msg = 'invalid distances set';
              state.mode = BAD;
              break;
            } //Tracev((stderr, 'inflate:       codes ok\n'));


            state.mode = LEN_;

            if (flush === Z_TREES) {
              break inf_leave;
            }

          /* falls through */

          case LEN_:
            state.mode = LEN;

          /* falls through */

          case LEN:
            if (have >= 6 && left >= 258) {
              //--- RESTORE() ---
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits; //---

              inffast(strm, _out); //--- LOAD() ---

              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits; //---

              if (state.mode === TYPE) {
                state.back = -1;
              }

              break;
            }

            state.back = 0;

            for (;;) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              /*BITS(state.lenbits)*/

              here_bits = here >>> 24;
              here_op = here >>> 16 & 0xff;
              here_val = here & 0xffff;

              if (here_bits <= bits) {
                break;
              } //--- PULLBYTE() ---//


              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8; //---//
            }

            if (here_op && (here_op & 0xf0) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;

              for (;;) {
                here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1
                /*BITS(last.bits + last.op)*/
                ) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 0xff;
                here_val = here & 0xffff;

                if (last_bits + here_bits <= bits) {
                  break;
                } //--- PULLBYTE() ---//


                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8; //---//
              } //--- DROPBITS(last.bits) ---//


              hold >>>= last_bits;
              bits -= last_bits; //---//

              state.back += last_bits;
            } //--- DROPBITS(here.bits) ---//


            hold >>>= here_bits;
            bits -= here_bits; //---//

            state.back += here_bits;
            state.length = here_val;

            if (here_op === 0) {
              //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
              //        "inflate:         literal '%c'\n" :
              //        "inflate:         literal 0x%02x\n", here.val));
              state.mode = LIT;
              break;
            }

            if (here_op & 32) {
              //Tracevv((stderr, "inflate:         end of block\n"));
              state.back = -1;
              state.mode = TYPE;
              break;
            }

            if (here_op & 64) {
              strm.msg = 'invalid literal/length code';
              state.mode = BAD;
              break;
            }

            state.extra = here_op & 15;
            state.mode = LENEXT;

          /* falls through */

          case LENEXT:
            if (state.extra) {
              //=== NEEDBITS(state.extra);
              n = state.extra;

              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8;
              } //===//


              state.length += hold & (1 << state.extra) - 1
              /*BITS(state.extra)*/
              ; //--- DROPBITS(state.extra) ---//

              hold >>>= state.extra;
              bits -= state.extra; //---//

              state.back += state.extra;
            } //Tracevv((stderr, "inflate:         length %u\n", state.length));


            state.was = state.length;
            state.mode = DIST;

          /* falls through */

          case DIST:
            for (;;) {
              here = state.distcode[hold & (1 << state.distbits) - 1];
              /*BITS(state.distbits)*/

              here_bits = here >>> 24;
              here_op = here >>> 16 & 0xff;
              here_val = here & 0xffff;

              if (here_bits <= bits) {
                break;
              } //--- PULLBYTE() ---//


              if (have === 0) {
                break inf_leave;
              }

              have--;
              hold += input[next++] << bits;
              bits += 8; //---//
            }

            if ((here_op & 0xf0) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;

              for (;;) {
                here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1
                /*BITS(last.bits + last.op)*/
                ) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 0xff;
                here_val = here & 0xffff;

                if (last_bits + here_bits <= bits) {
                  break;
                } //--- PULLBYTE() ---//


                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8; //---//
              } //--- DROPBITS(last.bits) ---//


              hold >>>= last_bits;
              bits -= last_bits; //---//

              state.back += last_bits;
            } //--- DROPBITS(here.bits) ---//


            hold >>>= here_bits;
            bits -= here_bits; //---//

            state.back += here_bits;

            if (here_op & 64) {
              strm.msg = 'invalid distance code';
              state.mode = BAD;
              break;
            }

            state.offset = here_val;
            state.extra = here_op & 15;
            state.mode = DISTEXT;

          /* falls through */

          case DISTEXT:
            if (state.extra) {
              //=== NEEDBITS(state.extra);
              n = state.extra;

              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8;
              } //===//


              state.offset += hold & (1 << state.extra) - 1
              /*BITS(state.extra)*/
              ; //--- DROPBITS(state.extra) ---//

              hold >>>= state.extra;
              bits -= state.extra; //---//

              state.back += state.extra;
            } //#ifdef INFLATE_STRICT


            if (state.offset > state.dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break;
            } //#endif
            //Tracevv((stderr, "inflate:         distance %u\n", state.offset));


            state.mode = MATCH;

          /* falls through */

          case MATCH:
            if (left === 0) {
              break inf_leave;
            }

            copy = _out - left;

            if (state.offset > copy) {
              /* copy from window */
              copy = state.offset - copy;

              if (copy > state.whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break;
                } // (!) This block is disabled in zlib defaults,
                // don't enable it for binary compatibility
                //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                //          Trace((stderr, "inflate.c too far\n"));
                //          copy -= state.whave;
                //          if (copy > state.length) { copy = state.length; }
                //          if (copy > left) { copy = left; }
                //          left -= copy;
                //          state.length -= copy;
                //          do {
                //            output[put++] = 0;
                //          } while (--copy);
                //          if (state.length === 0) { state.mode = LEN; }
                //          break;
                //#endif

              }

              if (copy > state.wnext) {
                copy -= state.wnext;
                from = state.wsize - copy;
              } else {
                from = state.wnext - copy;
              }

              if (copy > state.length) {
                copy = state.length;
              }

              from_source = state.window;
            } else {
              /* copy from output */
              from_source = output;
              from = put - state.offset;
              copy = state.length;
            }

            if (copy > left) {
              copy = left;
            }

            left -= copy;
            state.length -= copy;

            do {
              output[put++] = from_source[from++];
            } while (--copy);

            if (state.length === 0) {
              state.mode = LEN;
            }

            break;

          case LIT:
            if (left === 0) {
              break inf_leave;
            }

            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;

          case CHECK:
            if (state.wrap) {
              //=== NEEDBITS(32);
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }

                have--; // Use '|' instead of '+' to make sure that result is signed

                hold |= input[next++] << bits;
                bits += 8;
              } //===//


              _out -= left;
              strm.total_out += _out;
              state.total += _out;

              if (_out) {
                strm.adler = state.check =
                /*UPDATE(state.check, put - _out, _out);*/
                state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
              }

              _out = left; // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too

              if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = 'incorrect data check';
                state.mode = BAD;
                break;
              } //=== INITBITS();


              hold = 0;
              bits = 0; //===//
              //Tracev((stderr, "inflate:   check matches trailer\n"));
            }

            state.mode = LENGTH;

          /* falls through */

          case LENGTH:
            if (state.wrap && state.flags) {
              //=== NEEDBITS(32);
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }

                have--;
                hold += input[next++] << bits;
                bits += 8;
              } //===//


              if (hold !== (state.total & 0xffffffff)) {
                strm.msg = 'incorrect length check';
                state.mode = BAD;
                break;
              } //=== INITBITS();


              hold = 0;
              bits = 0; //===//
              //Tracev((stderr, "inflate:   length matches trailer\n"));
            }

            state.mode = DONE;

          /* falls through */

          case DONE:
            ret = Z_STREAM_END$1;
            break inf_leave;

          case BAD:
            ret = Z_DATA_ERROR$1;
            break inf_leave;

          case MEM:
            return Z_MEM_ERROR$1;

          case SYNC:
          /* falls through */

          default:
            return Z_STREAM_ERROR$1;
        }
      } // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

      /*
         Return from inflate(), updating the total counts and the check value.
         If there was no progress during the inflate() call, return a buffer
         error.  Call updatewindow() to create and/or update the window state.
         Note: a memory error from inflate() is non-recoverable.
       */
      //--- RESTORE() ---


      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits; //---

      if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
      }

      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;

      if (state.wrap && _out) {
        strm.adler = state.check =
        /*UPDATE(state.check, strm.next_out - _out, _out);*/
        state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
      }

      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);

      if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
        ret = Z_BUF_ERROR;
      }

      return ret;
    };

    const inflateEnd = strm => {
      if (!strm || !strm.state
      /*|| strm->zfree == (free_func)0*/
      ) {
        return Z_STREAM_ERROR$1;
      }

      let state = strm.state;

      if (state.window) {
        state.window = null;
      }

      strm.state = null;
      return Z_OK$1;
    };

    const inflateGetHeader = (strm, head) => {
      /* check state */
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR$1;
      }

      const state = strm.state;

      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR$1;
      }
      /* save header structure */


      state.head = head;
      head.done = false;
      return Z_OK$1;
    };

    const inflateSetDictionary = (strm, dictionary) => {
      const dictLength = dictionary.length;
      let state;
      let dictid;
      let ret;
      /* check state */

      if (!strm
      /* == Z_NULL */
      || !strm.state
      /* == Z_NULL */
      ) {
        return Z_STREAM_ERROR$1;
      }

      state = strm.state;

      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR$1;
      }
      /* check for correct dictionary identifier */


      if (state.mode === DICT) {
        dictid = 1;
        /* adler32(0, null, 0)*/

        /* dictid = adler32(dictid, dictionary, dictLength); */

        dictid = adler32_1(dictid, dictionary, dictLength, 0);

        if (dictid !== state.check) {
          return Z_DATA_ERROR$1;
        }
      }
      /* copy dictionary to window using updatewindow(), which will amend the
       existing dictionary if appropriate */


      ret = updatewindow(strm, dictionary, dictLength, dictLength);

      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR$1;
      }

      state.havedict = 1; // Tracev((stderr, "inflate:   dictionary set\n"));

      return Z_OK$1;
    };

    var inflateReset_1 = inflateReset;
    var inflateReset2_1 = inflateReset2;
    var inflateResetKeep_1 = inflateResetKeep;
    var inflateInit_1 = inflateInit;
    var inflateInit2_1 = inflateInit2;
    var inflate_2$1 = inflate$2;
    var inflateEnd_1 = inflateEnd;
    var inflateGetHeader_1 = inflateGetHeader;
    var inflateSetDictionary_1 = inflateSetDictionary;
    var inflateInfo = 'pako inflate (from Nodeca project)';
    /* Not implemented
    module.exports.inflateCopy = inflateCopy;
    module.exports.inflateGetDictionary = inflateGetDictionary;
    module.exports.inflateMark = inflateMark;
    module.exports.inflatePrime = inflatePrime;
    module.exports.inflateSync = inflateSync;
    module.exports.inflateSyncPoint = inflateSyncPoint;
    module.exports.inflateUndermine = inflateUndermine;
    */

    var inflate_1$2 = {
      inflateReset: inflateReset_1,
      inflateReset2: inflateReset2_1,
      inflateResetKeep: inflateResetKeep_1,
      inflateInit: inflateInit_1,
      inflateInit2: inflateInit2_1,
      inflate: inflate_2$1,
      inflateEnd: inflateEnd_1,
      inflateGetHeader: inflateGetHeader_1,
      inflateSetDictionary: inflateSetDictionary_1,
      inflateInfo: inflateInfo
    }; // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
    //
    // This software is provided 'as-is', without any express or implied
    // warranty. In no event will the authors be held liable for any damages
    // arising from the use of this software.
    //
    // Permission is granted to anyone to use this software for any purpose,
    // including commercial applications, and to alter it and redistribute it
    // freely, subject to the following restrictions:
    //
    // 1. The origin of this software must not be misrepresented; you must not
    //   claim that you wrote the original software. If you use this software
    //   in a product, an acknowledgment in the product documentation would be
    //   appreciated but is not required.
    // 2. Altered source versions must be plainly marked as such, and must not be
    //   misrepresented as being the original software.
    // 3. This notice may not be removed or altered from any source distribution.

    function GZheader() {
      /* true if compressed data believed to be text */
      this.text = 0;
      /* modification time */

      this.time = 0;
      /* extra flags (not used when writing a gzip file) */

      this.xflags = 0;
      /* operating system */

      this.os = 0;
      /* pointer to extra field or Z_NULL if none */

      this.extra = null;
      /* extra field length (valid if extra != Z_NULL) */

      this.extra_len = 0; // Actually, we don't need it in JS,
      // but leave for few code modifications
      //
      // Setup limits is not necessary because in js we should not preallocate memory
      // for inflate use constant limit in 65536 bytes
      //

      /* space at extra (only when reading header) */
      // this.extra_max  = 0;

      /* pointer to zero-terminated file name or Z_NULL */

      this.name = '';
      /* space at name (only when reading header) */
      // this.name_max   = 0;

      /* pointer to zero-terminated comment or Z_NULL */

      this.comment = '';
      /* space at comment (only when reading header) */
      // this.comm_max   = 0;

      /* true if there was or will be a header crc */

      this.hcrc = 0;
      /* true when done reading gzip header (not used when writing a gzip file) */

      this.done = false;
    }

    var gzheader = GZheader;
    const toString = Object.prototype.toString;
    /* Public constants ==========================================================*/

    /* ===========================================================================*/

    const {
      Z_NO_FLUSH,
      Z_FINISH,
      Z_OK,
      Z_STREAM_END,
      Z_NEED_DICT,
      Z_STREAM_ERROR,
      Z_DATA_ERROR,
      Z_MEM_ERROR
    } = constants$2;
    /* ===========================================================================*/

    /**
     * class Inflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[inflate]]
     * and [[inflateRaw]].
     **/

    /* internal
     * inflate.chunks -> Array
     *
     * Chunks of output data, if [[Inflate#onData]] not overridden.
     **/

    /**
     * Inflate.result -> Uint8Array|String
     *
     * Uncompressed result, generated by default [[Inflate#onData]]
     * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Inflate#push]] with `Z_FINISH` / `true` param).
     **/

    /**
     * Inflate.err -> Number
     *
     * Error code after inflate finished. 0 (Z_OK) on success.
     * Should be checked if broken data possible.
     **/

    /**
     * Inflate.msg -> String
     *
     * Error message, if [[Inflate.err]] != 0
     **/

    /**
     * new Inflate(options)
     * - options (Object): zlib inflate options.
     *
     * Creates new inflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `windowBits`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw inflate
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     * By default, when no options set, autodetect deflate/gzip data format via
     * wrapper header.
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako')
     * const chunk1 = new Uint8Array([1,2,3,4,5,6,7,8,9])
     * const chunk2 = new Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * const inflate = new pako.Inflate({ level: 3});
     *
     * inflate.push(chunk1, false);
     * inflate.push(chunk2, true);  // true -> last chunk
     *
     * if (inflate.err) { throw new Error(inflate.err); }
     *
     * console.log(inflate.result);
     * ```
     **/

    function Inflate$1(options) {
      this.options = common.assign({
        chunkSize: 1024 * 64,
        windowBits: 15,
        to: ''
      }, options || {});
      const opt = this.options; // Force window size for `raw` data, if not set directly,
      // because we have no header for autodetect.

      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;

        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      } // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate


      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
        opt.windowBits += 32;
      } // Gzip header has no info about windows size, we can do autodetect only
      // for deflate. So, if window size not set, force it to max when gzip possible


      if (opt.windowBits > 15 && opt.windowBits < 48) {
        // bit 3 (16) -> gzipped data
        // bit 4 (32) -> autodetect gzip/deflate
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }

      this.err = 0; // error code, if happens (0 = Z_OK)

      this.msg = ''; // error message

      this.ended = false; // used to avoid multiple onEnd() calls

      this.chunks = []; // chunks of compressed data

      this.strm = new zstream();
      this.strm.avail_out = 0;
      let status = inflate_1$2.inflateInit2(this.strm, opt.windowBits);

      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }

      this.header = new gzheader();
      inflate_1$2.inflateGetHeader(this.strm, this.header); // Setup dictionary

      if (opt.dictionary) {
        // Convert data if needed
        if (typeof opt.dictionary === 'string') {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }

        if (opt.raw) {
          //In raw mode we need to set the dictionary early
          status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);

          if (status !== Z_OK) {
            throw new Error(messages[status]);
          }
        }
      }
    }
    /**
     * Inflate#push(data[, flush_mode]) -> Boolean
     * - data (Uint8Array|ArrayBuffer): input data
     * - flush_mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE
     *   flush modes. See constants. Skipped or `false` means Z_NO_FLUSH,
     *   `true` means Z_FINISH.
     *
     * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
     * new output chunks. Returns `true` on success. If end of stream detected,
     * [[Inflate#onEnd]] will be called.
     *
     * `flush_mode` is not needed for normal operation, because end of stream
     * detected automatically. You may try to use it for advanced things, but
     * this functionality was not tested.
     *
     * On fail call [[Inflate#onEnd]] with error code and return false.
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/


    Inflate$1.prototype.push = function (data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      const dictionary = this.options.dictionary;

      let status, _flush_mode, last_avail_out;

      if (this.ended) return false;
      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH; // Convert data if needed

      if (toString.call(data) === '[object ArrayBuffer]') {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }

      strm.next_in = 0;
      strm.avail_in = strm.input.length;

      for (;;) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }

        status = inflate_1$2.inflate(strm, _flush_mode);

        if (status === Z_NEED_DICT && dictionary) {
          status = inflate_1$2.inflateSetDictionary(strm, dictionary);

          if (status === Z_OK) {
            status = inflate_1$2.inflate(strm, _flush_mode);
          } else if (status === Z_DATA_ERROR) {
            // Replace code with more verbose
            status = Z_NEED_DICT;
          }
        } // Skip snyc markers if more data follows and not raw mode


        while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
          inflate_1$2.inflateReset(strm);
          status = inflate_1$2.inflate(strm, _flush_mode);
        }

        switch (status) {
          case Z_STREAM_ERROR:
          case Z_DATA_ERROR:
          case Z_NEED_DICT:
          case Z_MEM_ERROR:
            this.onEnd(status);
            this.ended = true;
            return false;
        } // Remember real `avail_out` value, because we may patch out buffer content
        // to align utf8 strings boundaries.


        last_avail_out = strm.avail_out;

        if (strm.next_out) {
          if (strm.avail_out === 0 || status === Z_STREAM_END) {
            if (this.options.to === 'string') {
              let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              let tail = strm.next_out - next_out_utf8;
              let utf8str = strings.buf2string(strm.output, next_out_utf8); // move tail & realign counters

              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
              this.onData(utf8str);
            } else {
              this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
            }
          }
        } // Must repeat iteration if out buffer is full


        if (status === Z_OK && last_avail_out === 0) continue; // Finalize if end of stream reached.

        if (status === Z_STREAM_END) {
          status = inflate_1$2.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return true;
        }

        if (strm.avail_in === 0) break;
      }

      return true;
    };
    /**
     * Inflate#onData(chunk) -> Void
     * - chunk (Uint8Array|String): output data. When string output requested,
     *   each chunk will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/


    Inflate$1.prototype.onData = function (chunk) {
      this.chunks.push(chunk);
    };
    /**
     * Inflate#onEnd(status) -> Void
     * - status (Number): inflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called either after you tell inflate that the input stream is
     * complete (Z_FINISH). By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/


    Inflate$1.prototype.onEnd = function (status) {
      // On success - join
      if (status === Z_OK) {
        if (this.options.to === 'string') {
          this.result = this.chunks.join('');
        } else {
          this.result = common.flattenChunks(this.chunks);
        }
      }

      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    /**
     * inflate(data[, options]) -> Uint8Array|String
     * - data (Uint8Array): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Decompress `data` with inflate/ungzip and `options`. Autodetect
     * format via wrapper header by default. That's why we don't provide
     * separate `ungzip` method.
     *
     * Supported options are:
     *
     * - windowBits
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako');
     * const input = pako.deflate(new Uint8Array([1,2,3,4,5,6,7,8,9]));
     * let output;
     *
     * try {
     *   output = pako.inflate(input);
     * } catch (err) {
     *   console.log(err);
     * }
     * ```
     **/


    function inflate$1(input, options) {
      const inflator = new Inflate$1(options);
      inflator.push(input); // That will never happens, if you don't cheat with options :)

      if (inflator.err) throw inflator.msg || messages[inflator.err];
      return inflator.result;
    }
    /**
     * inflateRaw(data[, options]) -> Uint8Array|String
     * - data (Uint8Array): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * The same as [[inflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/


    function inflateRaw$1(input, options) {
      options = options || {};
      options.raw = true;
      return inflate$1(input, options);
    }
    /**
     * ungzip(data[, options]) -> Uint8Array|String
     * - data (Uint8Array): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Just shortcut to [[inflate]], because it autodetects format
     * by header.content. Done for convenience.
     **/


    var Inflate_1$1 = Inflate$1;
    var inflate_2 = inflate$1;
    var inflateRaw_1$1 = inflateRaw$1;
    var ungzip$1 = inflate$1;
    var constants = constants$2;
    var inflate_1$1 = {
      Inflate: Inflate_1$1,
      inflate: inflate_2,
      inflateRaw: inflateRaw_1$1,
      ungzip: ungzip$1,
      constants: constants
    };
    const {
      Deflate,
      deflate,
      deflateRaw,
      gzip
    } = deflate_1$1;
    const {
      Inflate,
      inflate,
      inflateRaw,
      ungzip: ungzip$2
    } = inflate_1$1;
    var Deflate_1 = Deflate;
    var deflate_1 = deflate;
    var deflateRaw_1 = deflateRaw;
    var gzip_1 = gzip;
    var Inflate_1 = Inflate;
    var inflate_1 = inflate;
    var inflateRaw_1 = inflateRaw;
    var ungzip_1 = ungzip$2;
    var constants_1 = constants$2;
    var pako = {
      Deflate: Deflate_1,
      deflate: deflate_1,
      deflateRaw: deflateRaw_1,
      gzip: gzip_1,
      Inflate: Inflate_1,
      inflate: inflate_1,
      inflateRaw: inflateRaw_1,
      ungzip: ungzip_1,
      constants: constants_1
    }; // Added by JTR
    // exports.Deflate = Deflate_1;
    // exports.Inflate = Inflate_1;
    // exports.constants = constants_1;
    // exports['default'] = pako;
    // exports.deflate = deflate_1;
    // exports.deflateRaw = deflateRaw_1;
    // exports.gzip = gzip_1;
    // exports.inflate = inflate_1;
    // exports.inflateRaw = inflateRaw_1;
    // exports.ungzip = ungzip_1;
    //   Object.defineProperty(exports, '__esModule', { value: true });
    //
    // })));

    pako.deflateRaw;
    pako.deflate;
    pako.inflateRaw;
    pako.inflate;
    pako.gzip;
    const FEXTRA = 4; // gzip spec F.EXTRA flag

    function isgzipped(data) {
      const b = ArrayBuffer.isView(data) ? data : new Uint8Array(data);
      return b[0] === 31 && b[1] === 139;
    }
    /**
     * Pako does not properly ungzip block compressed files if > 1 block is present.  Test for bgzip and use wrapper.
     */


    function ungzip(data) {
      const ba = ArrayBuffer.isView(data) ? data : new Uint8Array(data);
      const b = ba[3] & FEXTRA;

      if (b !== 0 && ba[12] === 66 && ba[13] === 67) {
        return unbgzf$2(ba.buffer);
      } else {
        return pako.ungzip(ba);
      }
    } // Uncompress data,  assumed to be series of bgzipped blocks


    function unbgzf$2(data, lim) {
      const oBlockList = [];
      let ptr = 0;
      let totalSize = 0;
      lim = lim || data.byteLength - 18;

      while (ptr < lim) {
        try {
          const ba = ArrayBuffer.isView(data) ? data : new Uint8Array(data, ptr, 18);
          const xlen = ba[11] << 8 | ba[10];
          const flg = ba[3];
          const fextra = flg & FEXTRA;
          const si1 = ba[12];
          const si2 = ba[13];
          const slen = ba[15] << 8 | ba[14];
          const bsize = (ba[17] << 8 | ba[16]) + 1;
          const start = 12 + xlen + ptr; // Start of CDATA

          const bytesLeft = data.byteLength - start;
          const cDataSize = bsize - xlen - 19;
          if (bytesLeft < cDataSize || cDataSize <= 0) break;
          const a = new Uint8Array(data, start, cDataSize);
          const unc = pako.inflateRaw(a); // const inflate = new Zlib.RawInflate(a);
          // const unc = inflate.decompress();

          ptr += cDataSize - 1 + 26; //inflate.ip + 26

          totalSize += unc.byteLength;
          oBlockList.push(unc);
        } catch (e) {
          console.error(e);
          break;
        }
      } // Concatenate decompressed blocks


      if (oBlockList.length === 1) {
        return oBlockList[0];
      } else {
        const out = new Uint8Array(totalSize);
        let cursor = 0;

        for (let i = 0; i < oBlockList.length; ++i) {
          var b = new Uint8Array(oBlockList[i]);
          arrayCopy$2(b, 0, out, cursor, b.length);
          cursor += b.length;
        }

        return out;
      }
    }


    const testArray$2 = new Uint8Array(1);
    const hasSubarray$2 = typeof testArray$2.subarray === 'function';
    /* (typeof testArray.slice === 'function'); */
    // Chrome slice performance is so dire that we're currently not using it...

    function arrayCopy$2(src, srcOffset, dest, destOffset, count) {
      if (count === 0) {
        return;
      }

      if (!src) {
        throw "Undef src";
      } else if (!dest) {
        throw "Undef dest";
      }

      if (srcOffset === 0 && count === src.length) {
        arrayCopy_fast$2(src, dest, destOffset);
      } else if (hasSubarray$2) {
        arrayCopy_fast$2(src.subarray(srcOffset, srcOffset + count), dest, destOffset);
      } else if (src.BYTES_PER_ELEMENT === 1 && count > 100) {
        arrayCopy_fast$2(new Uint8Array(src.buffer, src.byteOffset + srcOffset, count), dest, destOffset);
      } else {
        arrayCopy_slow$2(src, srcOffset, dest, destOffset, count);
      }
    }

    function arrayCopy_slow$2(src, srcOffset, dest, destOffset, count) {
      for (let i = 0; i < count; ++i) {
        dest[destOffset + i] = src[srcOffset + i];
      }
    }

    function arrayCopy_fast$2(src, dest, destOffset) {
      dest.set(src, destOffset);
    }
    /**
     * @param dataURI
     * @returns {Array<number>|Uint8Array}
     */


    function decodeDataURI$2(dataURI, gzip) {
      const split = dataURI.split(',');
      const info = split[0].split(':')[1];
      let dataString = split[1];

      if (info.indexOf('base64') >= 0) {
        dataString = atob(dataString);
        const bytes = new Uint8Array(dataString.length);

        for (let i = 0; i < dataString.length; i++) {
          bytes[i] = dataString.charCodeAt(i);
        }

        let plain;

        if (gzip || info.indexOf('gzip') > 0) {
          plain = pako.ungzip(bytes);
        } else {
          plain = bytes;
        }

        return plain;
      } else {
        return decodeURIComponent(dataString); // URL encoded string -- not currently used or tested
      }
    }

    /**
     * Make the target element movable by clicking and dragging on the handle.  This is not a general purprose function,
     * it makes several options specific to igv dialogs, the primary one being that the
     * target is absolutely positioned in pixel coordinates

     */
    let dragData$1; // Its assumed we are only dragging one element at a time.

    let bbox = undefined;

    function makeDraggable$1(target, handle, constraint) {
      if (constraint) {
        bbox = Object.assign({}, constraint);
      }

      handle.addEventListener('mousedown', dragStart$1.bind(target));
    }

    function dragStart$1(event) {
      event.stopPropagation();
      event.preventDefault();
      offset$1(this);
      const dragFunction = drag$1.bind(this);
      const dragEndFunction = dragEnd$1.bind(this);
      const computedStyle = getComputedStyle(this);
      const top = parseInt(computedStyle.top.replace("px", ""));
      const left = parseInt(computedStyle.left.replace("px", ""));
      dragData$1 = {
        dragFunction: dragFunction,
        dragEndFunction: dragEndFunction,
        screenX: event.screenX,
        screenY: event.screenY,
        top: top,
        left: left
      };
      document.addEventListener('mousemove', dragFunction);
      document.addEventListener('mouseup', dragEndFunction);
      document.addEventListener('mouseleave', dragEndFunction);
      document.addEventListener('mouseexit', dragEndFunction);
    }

    function drag$1(event) {
      if (!dragData$1) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      const dx = event.screenX - dragData$1.screenX;
      const dy = event.screenY - dragData$1.screenY; // const left = bbox ? Math.max(bbox.minX, dragData.left + dx) : dragData.left + dx

      const left = dragData$1.left + dx;
      const top = bbox ? Math.max(bbox.minY, dragData$1.top + dy) : dragData$1.top + dy;
      this.style.left = `${left}px`;
      this.style.top = `${top}px`;
    }

    function dragEnd$1(event) {
      if (!dragData$1) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      const dragFunction = dragData$1.dragFunction;
      const dragEndFunction = dragData$1.dragEndFunction;
      document.removeEventListener('mousemove', dragFunction);
      document.removeEventListener('mouseup', dragEndFunction);
      document.removeEventListener('mouseleave', dragEndFunction);
      document.removeEventListener('mouseexit', dragEndFunction);
      dragData$1 = undefined;
    }

    // Support for oauth token based authorization
    // This class supports explicit setting of an oauth token either globally or for specific hosts.
    //
    // The variable oauth.google.access_token, which becomes igv.oauth.google.access_token on ES5 conversion is
    // supported for backward compatibility
    const DEFAULT_HOST$2 = "googleapis";
    const oauth$2 = {
      oauthTokens: {},
      setToken: function (token, host) {
        host = host || DEFAULT_HOST$2;
        this.oauthTokens[host] = token;

        if (host === DEFAULT_HOST$2) {
          this.google.access_token = token; // legacy support
        }
      },
      getToken: function (host) {
        host = host || DEFAULT_HOST$2;
        let token;

        for (let key of Object.keys(this.oauthTokens)) {
          const regex = wildcardToRegExp$2(key);

          if (regex.test(host)) {
            token = this.oauthTokens[key];
            break;
          }
        }

        return token;
      },
      removeToken: function (host) {
        host = host || DEFAULT_HOST$2;

        for (let key of Object.keys(this.oauthTokens)) {
          const regex = wildcardToRegExp$2(key);

          if (regex.test(host)) {
            this.oauthTokens[key] = undefined;
          }
        }

        if (host === DEFAULT_HOST$2) {
          this.google.access_token = undefined; // legacy support
        }
      },
      // Special object for google -- legacy support
      google: {
        setToken: function (token) {
          oauth$2.setToken(token);
        }
      }
    };
    /**
     * Creates a RegExp from the given string, converting asterisks to .* expressions,
     * and escaping all other characters.
     *
     * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
     */

    function wildcardToRegExp$2(s) {
      return new RegExp('^' + s.split(/\*+/).map(regExpEscape$2).join('.*') + '$');
    }
    /**
     * RegExp-escapes all characters in the given string.
     *
     * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
     */


    function regExpEscape$2(s) {
      return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    }

    // The MIT License (MIT)
    /**
     * @constructor
     * @param {Object} options A set op options to pass to the throttle function
     *        @param {number} requestsPerSecond The amount of requests per second
     *                                          the library will limit to
     */

    class Throttle$2 {
      constructor(options) {
        this.requestsPerSecond = options.requestsPerSecond || 10;
        this.lastStartTime = 0;
        this.queued = [];
      }
      /**
       * Adds a promise
       * @param {Function} async function to be executed
       * @param {Object} options A set of options.
       * @return {Promise} A promise
       */


      add(asyncFunction, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
          self.queued.push({
            resolve: resolve,
            reject: reject,
            asyncFunction: asyncFunction
          });
          self.dequeue();
        });
      }
      /**
       * Adds all the promises passed as parameters
       * @param {Function} promises An array of functions that return a promise
       * @param {Object} options A set of options.
       * @param {number} options.signal An AbortSignal object that can be used to abort the returned promise
       * @param {number} options.weight A "weight" of each operation resolving by array of promises
       * @return {Promise} A promise that succeeds when all the promises passed as options do
       */


      addAll(promises, options) {
        var addedPromises = promises.map(function (promise) {
          return this.add(promise, options);
        }.bind(this));
        return Promise.all(addedPromises);
      }

      /**
       * Dequeues a promise
       * @return {void}
       */
      dequeue() {
        if (this.queued.length > 0) {
          var now = new Date(),
              inc = 1000 / this.requestsPerSecond + 1,
              elapsed = now - this.lastStartTime;

          if (elapsed >= inc) {
            this._execute();
          } else {
            // we have reached the limit, schedule a dequeue operation
            setTimeout(function () {
              this.dequeue();
            }.bind(this), inc - elapsed);
          }
        }
      }
      /**
       * Executes the promise
       * @private
       * @return {void}
       */


      async _execute() {
        this.lastStartTime = new Date();
        var candidate = this.queued.shift();
        const f = candidate.asyncFunction;

        try {
          const r = await f();
          candidate.resolve(r);
        } catch (e) {
          candidate.reject(e);
        }
      }

    }

    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Broad Institute
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    let RANGE_WARNING_GIVEN$2 = false;
    const googleThrottle$2 = new Throttle$2({
      requestsPerSecond: 8
    });
    const igvxhr$2 = {
      apiKey: undefined,
      setApiKey: function (key) {
        this.apiKey = key;
      },
      load: load$2,
      loadArrayBuffer: async function (url, options) {
        options = options || {};

        if (!options.responseType) {
          options.responseType = "arraybuffer";
        }

        if (isFile(url)) {
          return loadFileSlice$2(url, options);
        } else {
          return load$2(url, options);
        }
      },
      loadJson: async function (url, options) {
        options = options || {};
        const method = options.method || (options.sendData ? "POST" : "GET");

        if (method === "POST") {
          options.contentType = "application/json";
        }

        const result = await this.loadString(url, options);

        if (result) {
          return JSON.parse(result);
        } else {
          return result;
        }
      },
      loadString: async function (path, options) {
        options = options || {};

        if (path instanceof File) {
          return loadStringFromFile$2(path, options);
        } else {
          return loadStringFromUrl$2(path, options);
        }
      }
    };

    async function load$2(url, options) {
      options = options || {};
      const urlType = typeof url; // Resolve functions, promises, and functions that return promises

      url = await (typeof url === 'function' ? url() : url);

      if (isFile(url)) {
        return loadFileSlice$2(url, options);
      } else if (typeof url.startsWith === 'function') {
        // Test for string
        if (url.startsWith("data:")) {
          const buffer = decodeDataURI$2(url).buffer;

          if (options.range) {
            const rangeEnd = options.range.size ? options.range.start + options.range.size : buffer.byteLength;
            return buffer.slice(options.range.start, rangeEnd);
          } else {
            return buffer;
          }
        } else {
          if (url.startsWith("https://drive.google.com")) {
            url = driveDownloadURL$2(url);
          }

          if (isGoogleDriveURL$2(url) || url.startsWith("https://www.dropbox.com")) {
            return googleThrottle$2.add(async function () {
              return loadURL$2(url, options);
            });
          } else {
            return loadURL$2(url, options);
          }
        }
      } else {
        throw Error(`url must be either a 'File', 'string', 'function', or 'Promise'.  Actual type: ${urlType}`);
      }
    }

    async function loadURL$2(url, options) {
      //console.log(`${Date.now()}   ${url}`)
      url = mapUrl$2(url);
      options = options || {};
      let oauthToken = options.oauthToken || getOauthToken$2(url);

      if (oauthToken) {
        oauthToken = await (typeof oauthToken === 'function' ? oauthToken() : oauthToken);
      }

      return new Promise(function (resolve, reject) {
        // Various Google tansformations
        if (isGoogleURL$2(url) && !isGoogleStorageSigned(url)) {
          if (isGoogleStorageURL$2(url)) {
            url = translateGoogleCloudURL$2(url);
          }

          url = addApiKey$2(url);

          if (isGoogleDriveURL$2(url)) {
            addTeamDrive$2(url);
          } // If we have an access token try it, but don't force a signIn or request for scopes yet


          if (!oauthToken) {
            oauthToken = getCurrentGoogleAccessToken$2();
          }
        }

        const headers = options.headers || {};

        if (oauthToken) {
          addOauthHeaders$2(headers, oauthToken);
        }

        const range = options.range;
        const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
        navigator.vendor.indexOf("Apple") === 0 && /\sSafari\//.test(navigator.userAgent);

        if (range && isChrome && !isAmazonV4Signed$2(url) && !isGoogleStorageSigned(url)) {
          // Hack to prevent caching for byte-ranges. Attempt to fix net:err-cache errors in Chrome
          url += url.includes("?") ? "&" : "?";
          url += "someRandomSeed=" + Math.random().toString(36);
        }

        const xhr = new XMLHttpRequest();
        const sendData = options.sendData || options.body;
        const method = options.method || (sendData ? "POST" : "GET");
        const responseType = options.responseType;
        const contentType = options.contentType;
        const mimeType = options.mimeType;
        xhr.open(method, url);

        if (options.timeout) {
          xhr.timeout = options.timeout;
        }

        if (range) {
          var rangeEnd = range.size ? range.start + range.size - 1 : "";
          xhr.setRequestHeader("Range", "bytes=" + range.start + "-" + rangeEnd); //      xhr.setRequestHeader("Cache-Control", "no-cache");    <= This can cause CORS issues, disabled for now
        }

        if (contentType) {
          xhr.setRequestHeader("Content-Type", contentType);
        }

        if (mimeType) {
          xhr.overrideMimeType(mimeType);
        }

        if (responseType) {
          xhr.responseType = responseType;
        }

        if (headers) {
          for (let key of Object.keys(headers)) {
            const value = headers[key];
            xhr.setRequestHeader(key, value);
          }
        } // NOTE: using withCredentials with servers that return "*" for access-allowed-origin will fail


        if (options.withCredentials === true) {
          xhr.withCredentials = true;
        }

        xhr.onload = async function (event) {
          // when the url points to a local file, the status is 0 but that is not an error
          if (xhr.status === 0 || xhr.status >= 200 && xhr.status <= 300) {
            if (range && xhr.status !== 206 && range.start !== 0) {
              // For small files a range starting at 0 can return the whole file => 200
              // Provide just the slice we asked for, throw out the rest quietly
              // If file is large warn user
              if (xhr.response.length > 100000 && !RANGE_WARNING_GIVEN$2) {
                alert(`Warning: Range header ignored for URL: ${url}.  This can have performance impacts.`);
              }

              resolve(xhr.response.slice(range.start, range.start + range.size));
            } else {
              resolve(xhr.response);
            }
          } else if (typeof gapi !== "undefined" && (xhr.status === 404 || xhr.status === 401 || xhr.status === 403) && isGoogleURL$2(url) && !options.retries) {
            tryGoogleAuth();
          } else {
            if (xhr.status === 403) {
              handleError("Access forbidden: " + url);
            } else if (xhr.status === 416) {
              //  Tried to read off the end of the file.   This shouldn't happen, but if it does return an
              handleError("Unsatisfiable range");
            } else {
              handleError(xhr.status);
            }
          }
        };

        xhr.onerror = function (event) {
          if (isGoogleURL$2(url) && !options.retries) {
            tryGoogleAuth();
          }

          handleError("Error accessing resource: " + url + " Status: " + xhr.status);
        };

        xhr.ontimeout = function (event) {
          handleError("Timed out");
        };

        xhr.onabort = function (event) {
          reject(event);
        };

        try {
          xhr.send(sendData);
        } catch (e) {
          reject(e);
        }

        function handleError(error) {
          if (reject) {
            reject(error);
          } else {
            throw error;
          }
        }

        async function tryGoogleAuth() {
          try {
            const accessToken = await fetchGoogleAccessToken$2(url);
            options.retries = 1;
            options.oauthToken = accessToken;
            const response = await load$2(url, options);
            resolve(response);
          } catch (e) {
            if (e.error) {
              const msg = e.error.startsWith("popup_blocked") ? "Google login popup blocked by browser." : e.error;
              alert(msg);
            } else {
              handleError(e);
            }
          }
        }
      });
    }

    async function loadFileSlice$2(localfile, options) {
      let blob = options && options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile;
      const arrayBuffer = await blob.arrayBuffer();

      if ("arraybuffer" === options.responseType) {
        return arrayBuffer;
      } else {
        return arrayBufferToString$2(arrayBuffer);
      }
    }

    async function loadStringFromFile$2(localfile, options) {
      const blob = options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile;
      const arrayBuffer = await blob.arrayBuffer();
      return arrayBufferToString$2(arrayBuffer);
    }

    async function loadStringFromUrl$2(url, options) {
      options = options || {};
      options.responseType = "arraybuffer";
      const data = await igvxhr$2.load(url, options);
      return arrayBufferToString$2(data);
    }

    function isAmazonV4Signed$2(url) {
      return url.indexOf("X-Amz-Signature") > -1;
    }

    function isGoogleStorageSigned(url) {
      return url.indexOf("X-Goog-Signature") > -1;
    }

    function getOauthToken$2(url) {
      // Google is the default provider, don't try to parse host for google URLs
      const host = isGoogleURL$2(url) ? undefined : parseUri$2(url).host;
      let token = oauth$2.getToken(host);

      if (token) {
        return token;
      } else if (host === undefined) {
        const googleToken = getCurrentGoogleAccessToken$2();

        if (googleToken && googleToken.expires_at > Date.now()) {
          return googleToken.access_token;
        }
      }
    }
    /**
     * Return a Google oAuth token, triggering a sign in if required.   This method should not be called until we know
     * a token is required, that is until we've tried the url and received a 401, 403, or 404.
     *
     * @param url
     * @returns the oauth token
     */


    async function fetchGoogleAccessToken$2(url) {
      if (isInitialized$2()) {
        const scope = getScopeForURL$2(url);
        const googleToken = await getAccessToken$2(scope);
        return googleToken ? googleToken.access_token : undefined;
      } else {
        throw Error(`Authorization is required, but Google oAuth has not been initalized. Contact your site administrator for assistance.`);
      }
    }
    /**
     * Return the current google access token, if one exists.  Do not triger signOn or request additional scopes.
     * @returns {undefined|access_token}
     */


    function getCurrentGoogleAccessToken$2() {
      if (isInitialized$2()) {
        const googleToken = getCurrentAccessToken$2();
        return googleToken ? googleToken.access_token : undefined;
      } else {
        return undefined;
      }
    }

    function addOauthHeaders$2(headers, acToken) {
      if (acToken) {
        headers["Cache-Control"] = "no-cache";
        headers["Authorization"] = "Bearer " + acToken;
      }

      return headers;
    }

    function addApiKey$2(url) {
      let apiKey = igvxhr$2.apiKey;

      if (!apiKey && typeof gapi !== "undefined") {
        apiKey = gapi.apiKey;
      }

      if (apiKey !== undefined && !url.includes("key=")) {
        const paramSeparator = url.includes("?") ? "&" : "?";
        url = url + paramSeparator + "key=" + apiKey;
      }

      return url;
    }

    function addTeamDrive$2(url) {
      if (url.includes("supportsTeamDrive")) {
        return url;
      } else {
        const paramSeparator = url.includes("?") ? "&" : "?";
        url = url + paramSeparator + "supportsTeamDrive=true";
      }
    }
    /**
     * Perform some well-known url mappings.
     * @param url
     */


    function mapUrl$2(url) {
      if (url.includes("//www.dropbox.com")) {
        return url.replace("//www.dropbox.com", "//dl.dropboxusercontent.com");
      } else if (url.includes("//drive.google.com")) {
        return driveDownloadURL$2(url);
      } else if (url.includes("//www.broadinstitute.org/igvdata")) {
        return url.replace("//www.broadinstitute.org/igvdata", "//data.broadinstitute.org/igvdata");
      } else if (url.includes("//igvdata.broadinstitute.org")) {
        return url.replace("//igvdata.broadinstitute.org", "https://dn7ywbm9isq8j.cloudfront.net");
      } else if (url.startsWith("ftp://ftp.ncbi.nlm.nih.gov/geo")) {
        return url.replace("ftp://", "https://");
      } else {
        return url;
      }
    }

    function arrayBufferToString$2(arraybuffer) {
      let plain;

      if (isgzipped(arraybuffer)) {
        plain = ungzip(arraybuffer);
      } else {
        plain = new Uint8Array(arraybuffer);
      }

      if ('TextDecoder' in getGlobalObject$2()) {
        return new TextDecoder().decode(plain);
      } else {
        return decodeUTF8$2(plain);
      }
    }
    /**
     * Use when TextDecoder is not available (primarily IE).
     *
     * From: https://gist.github.com/Yaffle/5458286
     *
     * @param octets
     * @returns {string}
     */


    function decodeUTF8$2(octets) {
      var string = "";
      var i = 0;

      while (i < octets.length) {
        var octet = octets[i];
        var bytesNeeded = 0;
        var codePoint = 0;

        if (octet <= 0x7F) {
          bytesNeeded = 0;
          codePoint = octet & 0xFF;
        } else if (octet <= 0xDF) {
          bytesNeeded = 1;
          codePoint = octet & 0x1F;
        } else if (octet <= 0xEF) {
          bytesNeeded = 2;
          codePoint = octet & 0x0F;
        } else if (octet <= 0xF4) {
          bytesNeeded = 3;
          codePoint = octet & 0x07;
        }

        if (octets.length - i - bytesNeeded > 0) {
          var k = 0;

          while (k < bytesNeeded) {
            octet = octets[i + k + 1];
            codePoint = codePoint << 6 | octet & 0x3F;
            k += 1;
          }
        } else {
          codePoint = 0xFFFD;
          bytesNeeded = octets.length - i;
        }

        string += String.fromCodePoint(codePoint);
        i += bytesNeeded + 1;
      }

      return string;
    }

    function getGlobalObject$2() {
      if (typeof self !== 'undefined') {
        return self;
      }

      if (typeof global !== 'undefined') {
        return global;
      } else {
        return window;
      }
    }

    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Broad Institute
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    /** An implementation of an interval tree, following the explanation.
     * from CLR.
     *
     * Public interface:
     *   Constructor  IntervalTree
     *   Insertion    insert
     *   Search       findOverlapping
     */
    var BLACK$2 = 1;
    var NIL$2 = {};
    NIL$2.color = BLACK$2;
    NIL$2.parent = NIL$2;
    NIL$2.left = NIL$2;
    NIL$2.right = NIL$2;

    let subscribers = {};

    class EventBus {
      constructor() {}

      subscribe(eventType, object) {
        let subscriberList = subscribers[eventType];

        if (undefined === subscriberList) {
          subscriberList = [];
          subscribers[eventType] = subscriberList;
        }

        subscriberList.push(object);
      }

      post(event) {
        const subscriberList = subscribers[event.type];

        if (subscriberList) {
          for (let subscriber of subscriberList) {
            if ("function" === typeof subscriber.receiveEvent) {
              subscriber.receiveEvent(event);
            } else if ("function" === typeof subscriber) {
              subscriber(event);
            }
          }
        }
      }

      static createEvent(type, data, propogate) {
        return {
          type: type,
          data: data || {},
          propogate: propogate !== undefined ? propogate : true
        };
      }

    } // Global event bus


    EventBus.globalBus = new EventBus();
    /**
     * @fileoverview
     * - Using the 'QRCode for Javascript library'
     * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
     * - this library has no dependencies.
     *
     * @author davidshimjs
     * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
     * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
     */
    //---------------------------------------------------------------------
    // QRCode for JavaScript
    //
    // Copyright (c) 2009 Kazuhiko Arase
    //
    // URL: http://www.d-project.com/
    //
    // Licensed under the MIT license:
    //   http://www.opensource.org/licenses/mit-license.php
    //
    // The word "QR Code" is registered trademark of
    // DENSO WAVE INCORPORATED
    //   http://www.denso-wave.com/qrcode/faqpatent-e.html
    //
    //---------------------------------------------------------------------

    function QR8bitByte(data) {
      this.mode = QRMode.MODE_8BIT_BYTE;
      this.data = data;
      this.parsedData = []; // Added to support UTF-8 Characters

      for (var i = 0, l = this.data.length; i < l; i++) {
        var byteArray = [];
        var code = this.data.charCodeAt(i);

        if (code > 0x10000) {
          byteArray[0] = 0xF0 | (code & 0x1C0000) >>> 18;
          byteArray[1] = 0x80 | (code & 0x3F000) >>> 12;
          byteArray[2] = 0x80 | (code & 0xFC0) >>> 6;
          byteArray[3] = 0x80 | code & 0x3F;
        } else if (code > 0x800) {
          byteArray[0] = 0xE0 | (code & 0xF000) >>> 12;
          byteArray[1] = 0x80 | (code & 0xFC0) >>> 6;
          byteArray[2] = 0x80 | code & 0x3F;
        } else if (code > 0x80) {
          byteArray[0] = 0xC0 | (code & 0x7C0) >>> 6;
          byteArray[1] = 0x80 | code & 0x3F;
        } else {
          byteArray[0] = code;
        }

        this.parsedData.push(byteArray);
      }

      this.parsedData = Array.prototype.concat.apply([], this.parsedData);

      if (this.parsedData.length != this.data.length) {
        this.parsedData.unshift(191);
        this.parsedData.unshift(187);
        this.parsedData.unshift(239);
      }
    }

    QR8bitByte.prototype = {
      getLength: function (buffer) {
        return this.parsedData.length;
      },
      write: function (buffer) {
        for (var i = 0, l = this.parsedData.length; i < l; i++) {
          buffer.put(this.parsedData[i], 8);
        }
      }
    };

    function QRCodeModel(typeNumber, errorCorrectLevel) {
      this.typeNumber = typeNumber;
      this.errorCorrectLevel = errorCorrectLevel;
      this.modules = null;
      this.moduleCount = 0;
      this.dataCache = null;
      this.dataList = [];
    }

    QRCodeModel.prototype = {
      addData: function (data) {
        var newData = new QR8bitByte(data);
        this.dataList.push(newData);
        this.dataCache = null;
      },
      isDark: function (row, col) {
        if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
          throw new Error(row + "," + col);
        }

        return this.modules[row][col];
      },
      getModuleCount: function () {
        return this.moduleCount;
      },
      make: function () {
        this.makeImpl(false, this.getBestMaskPattern());
      },
      makeImpl: function (test, maskPattern) {
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);

        for (var row = 0; row < this.moduleCount; row++) {
          this.modules[row] = new Array(this.moduleCount);

          for (var col = 0; col < this.moduleCount; col++) {
            this.modules[row][col] = null;
          }
        }

        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(test, maskPattern);

        if (this.typeNumber >= 7) {
          this.setupTypeNumber(test);
        }

        if (this.dataCache == null) {
          this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
        }

        this.mapData(this.dataCache, maskPattern);
      },
      setupPositionProbePattern: function (row, col) {
        for (var r = -1; r <= 7; r++) {
          if (row + r <= -1 || this.moduleCount <= row + r) continue;

          for (var c = -1; c <= 7; c++) {
            if (col + c <= -1 || this.moduleCount <= col + c) continue;

            if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      },
      getBestMaskPattern: function () {
        var minLostPoint = 0;
        var pattern = 0;

        for (var i = 0; i < 8; i++) {
          this.makeImpl(true, i);
          var lostPoint = QRUtil.getLostPoint(this);

          if (i == 0 || minLostPoint > lostPoint) {
            minLostPoint = lostPoint;
            pattern = i;
          }
        }

        return pattern;
      },
      createMovieClip: function (target_mc, instance_name, depth) {
        var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
        var cs = 1;
        this.make();

        for (var row = 0; row < this.modules.length; row++) {
          var y = row * cs;

          for (var col = 0; col < this.modules[row].length; col++) {
            var x = col * cs;
            var dark = this.modules[row][col];

            if (dark) {
              qr_mc.beginFill(0, 100);
              qr_mc.moveTo(x, y);
              qr_mc.lineTo(x + cs, y);
              qr_mc.lineTo(x + cs, y + cs);
              qr_mc.lineTo(x, y + cs);
              qr_mc.endFill();
            }
          }
        }

        return qr_mc;
      },
      setupTimingPattern: function () {
        for (var r = 8; r < this.moduleCount - 8; r++) {
          if (this.modules[r][6] != null) {
            continue;
          }

          this.modules[r][6] = r % 2 == 0;
        }

        for (var c = 8; c < this.moduleCount - 8; c++) {
          if (this.modules[6][c] != null) {
            continue;
          }

          this.modules[6][c] = c % 2 == 0;
        }
      },
      setupPositionAdjustPattern: function () {
        var pos = QRUtil.getPatternPosition(this.typeNumber);

        for (var i = 0; i < pos.length; i++) {
          for (var j = 0; j < pos.length; j++) {
            var row = pos[i];
            var col = pos[j];

            if (this.modules[row][col] != null) {
              continue;
            }

            for (var r = -2; r <= 2; r++) {
              for (var c = -2; c <= 2; c++) {
                if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) {
                  this.modules[row + r][col + c] = true;
                } else {
                  this.modules[row + r][col + c] = false;
                }
              }
            }
          }
        }
      },
      setupTypeNumber: function (test) {
        var bits = QRUtil.getBCHTypeNumber(this.typeNumber);

        for (var i = 0; i < 18; i++) {
          var mod = !test && (bits >> i & 1) == 1;
          this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
        }

        for (var i = 0; i < 18; i++) {
          var mod = !test && (bits >> i & 1) == 1;
          this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
        }
      },
      setupTypeInfo: function (test, maskPattern) {
        var data = this.errorCorrectLevel << 3 | maskPattern;
        var bits = QRUtil.getBCHTypeInfo(data);

        for (var i = 0; i < 15; i++) {
          var mod = !test && (bits >> i & 1) == 1;

          if (i < 6) {
            this.modules[i][8] = mod;
          } else if (i < 8) {
            this.modules[i + 1][8] = mod;
          } else {
            this.modules[this.moduleCount - 15 + i][8] = mod;
          }
        }

        for (var i = 0; i < 15; i++) {
          var mod = !test && (bits >> i & 1) == 1;

          if (i < 8) {
            this.modules[8][this.moduleCount - i - 1] = mod;
          } else if (i < 9) {
            this.modules[8][15 - i - 1 + 1] = mod;
          } else {
            this.modules[8][15 - i - 1] = mod;
          }
        }

        this.modules[this.moduleCount - 8][8] = !test;
      },
      mapData: function (data, maskPattern) {
        var inc = -1;
        var row = this.moduleCount - 1;
        var bitIndex = 7;
        var byteIndex = 0;

        for (var col = this.moduleCount - 1; col > 0; col -= 2) {
          if (col == 6) col--;

          while (true) {
            for (var c = 0; c < 2; c++) {
              if (this.modules[row][col - c] == null) {
                var dark = false;

                if (byteIndex < data.length) {
                  dark = (data[byteIndex] >>> bitIndex & 1) == 1;
                }

                var mask = QRUtil.getMask(maskPattern, row, col - c);

                if (mask) {
                  dark = !dark;
                }

                this.modules[row][col - c] = dark;
                bitIndex--;

                if (bitIndex == -1) {
                  byteIndex++;
                  bitIndex = 7;
                }
              }
            }

            row += inc;

            if (row < 0 || this.moduleCount <= row) {
              row -= inc;
              inc = -inc;
              break;
            }
          }
        }
      }
    };
    QRCodeModel.PAD0 = 0xEC;
    QRCodeModel.PAD1 = 0x11;

    QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
      var buffer = new QRBitBuffer();

      for (var i = 0; i < dataList.length; i++) {
        var data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
        data.write(buffer);
      }

      var totalDataCount = 0;

      for (var i = 0; i < rsBlocks.length; i++) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
      }

      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }

        buffer.put(QRCodeModel.PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }

        buffer.put(QRCodeModel.PAD1, 8);
      }

      return QRCodeModel.createBytes(buffer, rsBlocks);
    };

    QRCodeModel.createBytes = function (buffer, rsBlocks) {
      var offset = 0;
      var maxDcCount = 0;
      var maxEcCount = 0;
      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r++) {
        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);
        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i++) {
          dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        }

        offset += dcCount;
        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);

        for (var i = 0; i < ecdata[r].length; i++) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;

      for (var i = 0; i < rsBlocks.length; i++) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) {
            data[index++] = dcdata[r][i];
          }
        }
      }

      for (var i = 0; i < maxEcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) {
            data[index++] = ecdata[r][i];
          }
        }
      }

      return data;
    };

    var QRMode = {
      MODE_NUMBER: 1 << 0,
      MODE_ALPHA_NUM: 1 << 1,
      MODE_8BIT_BYTE: 1 << 2,
      MODE_KANJI: 1 << 3
    };
    var QRErrorCorrectLevel = {
      L: 1,
      M: 0,
      Q: 3,
      H: 2
    };
    var QRMaskPattern = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var QRUtil = {
      PATTERN_POSITION_TABLE: [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]],
      G15: 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0,
      G18: 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0,
      G15_MASK: 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1,
      getBCHTypeInfo: function (data) {
        var d = data << 10;

        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
          d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
        }

        return (data << 10 | d) ^ QRUtil.G15_MASK;
      },
      getBCHTypeNumber: function (data) {
        var d = data << 12;

        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
          d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
        }

        return data << 12 | d;
      },
      getBCHDigit: function (data) {
        var digit = 0;

        while (data != 0) {
          digit++;
          data >>>= 1;
        }

        return digit;
      },
      getPatternPosition: function (typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
      },
      getMask: function (maskPattern, i, j) {
        switch (maskPattern) {
          case QRMaskPattern.PATTERN000:
            return (i + j) % 2 == 0;

          case QRMaskPattern.PATTERN001:
            return i % 2 == 0;

          case QRMaskPattern.PATTERN010:
            return j % 3 == 0;

          case QRMaskPattern.PATTERN011:
            return (i + j) % 3 == 0;

          case QRMaskPattern.PATTERN100:
            return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;

          case QRMaskPattern.PATTERN101:
            return i * j % 2 + i * j % 3 == 0;

          case QRMaskPattern.PATTERN110:
            return (i * j % 2 + i * j % 3) % 2 == 0;

          case QRMaskPattern.PATTERN111:
            return (i * j % 3 + (i + j) % 2) % 2 == 0;

          default:
            throw new Error("bad maskPattern:" + maskPattern);
        }
      },
      getErrorCorrectPolynomial: function (errorCorrectLength) {
        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
          a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
        }

        return a;
      },
      getLengthInBits: function (mode, type) {
        if (1 <= type && type < 10) {
          switch (mode) {
            case QRMode.MODE_NUMBER:
              return 10;

            case QRMode.MODE_ALPHA_NUM:
              return 9;

            case QRMode.MODE_8BIT_BYTE:
              return 8;

            case QRMode.MODE_KANJI:
              return 8;

            default:
              throw new Error("mode:" + mode);
          }
        } else if (type < 27) {
          switch (mode) {
            case QRMode.MODE_NUMBER:
              return 12;

            case QRMode.MODE_ALPHA_NUM:
              return 11;

            case QRMode.MODE_8BIT_BYTE:
              return 16;

            case QRMode.MODE_KANJI:
              return 10;

            default:
              throw new Error("mode:" + mode);
          }
        } else if (type < 41) {
          switch (mode) {
            case QRMode.MODE_NUMBER:
              return 14;

            case QRMode.MODE_ALPHA_NUM:
              return 13;

            case QRMode.MODE_8BIT_BYTE:
              return 16;

            case QRMode.MODE_KANJI:
              return 12;

            default:
              throw new Error("mode:" + mode);
          }
        } else {
          throw new Error("type:" + type);
        }
      },
      getLostPoint: function (qrCode) {
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;

        for (var row = 0; row < moduleCount; row++) {
          for (var col = 0; col < moduleCount; col++) {
            var sameCount = 0;
            var dark = qrCode.isDark(row, col);

            for (var r = -1; r <= 1; r++) {
              if (row + r < 0 || moduleCount <= row + r) {
                continue;
              }

              for (var c = -1; c <= 1; c++) {
                if (col + c < 0 || moduleCount <= col + c) {
                  continue;
                }

                if (r == 0 && c == 0) {
                  continue;
                }

                if (dark == qrCode.isDark(row + r, col + c)) {
                  sameCount++;
                }
              }
            }

            if (sameCount > 5) {
              lostPoint += 3 + sameCount - 5;
            }
          }
        }

        for (var row = 0; row < moduleCount - 1; row++) {
          for (var col = 0; col < moduleCount - 1; col++) {
            var count = 0;
            if (qrCode.isDark(row, col)) count++;
            if (qrCode.isDark(row + 1, col)) count++;
            if (qrCode.isDark(row, col + 1)) count++;
            if (qrCode.isDark(row + 1, col + 1)) count++;

            if (count == 0 || count == 4) {
              lostPoint += 3;
            }
          }
        }

        for (var row = 0; row < moduleCount; row++) {
          for (var col = 0; col < moduleCount - 6; col++) {
            if (qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6)) {
              lostPoint += 40;
            }
          }
        }

        for (var col = 0; col < moduleCount; col++) {
          for (var row = 0; row < moduleCount - 6; row++) {
            if (qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col)) {
              lostPoint += 40;
            }
          }
        }

        var darkCount = 0;

        for (var col = 0; col < moduleCount; col++) {
          for (var row = 0; row < moduleCount; row++) {
            if (qrCode.isDark(row, col)) {
              darkCount++;
            }
          }
        }

        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;
        return lostPoint;
      }
    };
    var QRMath = {
      glog: function (n) {
        if (n < 1) {
          throw new Error("glog(" + n + ")");
        }

        return QRMath.LOG_TABLE[n];
      },
      gexp: function (n) {
        while (n < 0) {
          n += 255;
        }

        while (n >= 256) {
          n -= 255;
        }

        return QRMath.EXP_TABLE[n];
      },
      EXP_TABLE: new Array(256),
      LOG_TABLE: new Array(256)
    };

    for (var i = 0; i < 8; i++) {
      QRMath.EXP_TABLE[i] = 1 << i;
    }

    for (var i = 8; i < 256; i++) {
      QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    }

    for (var i = 0; i < 255; i++) {
      QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
    }

    function QRPolynomial(num, shift) {
      if (num.length == undefined) {
        throw new Error(num.length + "/" + shift);
      }

      var offset = 0;

      while (offset < num.length && num[offset] == 0) {
        offset++;
      }

      this.num = new Array(num.length - offset + shift);

      for (var i = 0; i < num.length - offset; i++) {
        this.num[i] = num[i + offset];
      }
    }

    QRPolynomial.prototype = {
      get: function (index) {
        return this.num[index];
      },
      getLength: function () {
        return this.num.length;
      },
      multiply: function (e) {
        var num = new Array(this.getLength() + e.getLength() - 1);

        for (var i = 0; i < this.getLength(); i++) {
          for (var j = 0; j < e.getLength(); j++) {
            num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
          }
        }

        return new QRPolynomial(num, 0);
      },
      mod: function (e) {
        if (this.getLength() - e.getLength() < 0) {
          return this;
        }

        var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
        var num = new Array(this.getLength());

        for (var i = 0; i < this.getLength(); i++) {
          num[i] = this.get(i);
        }

        for (var i = 0; i < e.getLength(); i++) {
          num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
        }

        return new QRPolynomial(num, 0).mod(e);
      }
    };

    function QRRSBlock(totalCount, dataCount) {
      this.totalCount = totalCount;
      this.dataCount = dataCount;
    }

    QRRSBlock.RS_BLOCK_TABLE = [[1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16], [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12], [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15], [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16], [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]];

    QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
      var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);

      if (rsBlock == undefined) {
        throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
      }

      var length = rsBlock.length / 3;
      var list = [];

      for (var i = 0; i < length; i++) {
        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j++) {
          list.push(new QRRSBlock(totalCount, dataCount));
        }
      }

      return list;
    };

    QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
      switch (errorCorrectLevel) {
        case QRErrorCorrectLevel.L:
          return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];

        case QRErrorCorrectLevel.M:
          return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];

        case QRErrorCorrectLevel.Q:
          return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];

        case QRErrorCorrectLevel.H:
          return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];

        default:
          return undefined;
      }
    };

    function QRBitBuffer() {
      this.buffer = [];
      this.length = 0;
    }

    QRBitBuffer.prototype = {
      get: function (index) {
        var bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
      },
      put: function (num, length) {
        for (var i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) == 1);
        }
      },
      getLengthInBits: function () {
        return this.length;
      },
      putBit: function (bit) {
        var bufIndex = Math.floor(this.length / 8);

        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }

        if (bit) {
          this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
        }

        this.length++;
      }
    };
    var QRCodeLimitLength = [[17, 14, 11, 7], [32, 26, 20, 14], [53, 42, 32, 24], [78, 62, 46, 34], [106, 84, 60, 44], [134, 106, 74, 58], [154, 122, 86, 64], [192, 152, 108, 84], [230, 180, 130, 98], [271, 213, 151, 119], [321, 251, 177, 137], [367, 287, 203, 155], [425, 331, 241, 177], [458, 362, 258, 194], [520, 412, 292, 220], [586, 450, 322, 250], [644, 504, 364, 280], [718, 560, 394, 310], [792, 624, 442, 338], [858, 666, 482, 382], [929, 711, 509, 403], [1003, 779, 565, 439], [1091, 857, 611, 461], [1171, 911, 661, 511], [1273, 997, 715, 535], [1367, 1059, 751, 593], [1465, 1125, 805, 625], [1528, 1190, 868, 658], [1628, 1264, 908, 698], [1732, 1370, 982, 742], [1840, 1452, 1030, 790], [1952, 1538, 1112, 842], [2068, 1628, 1168, 898], [2188, 1722, 1228, 958], [2303, 1809, 1283, 983], [2431, 1911, 1351, 1051], [2563, 1989, 1423, 1093], [2699, 2099, 1499, 1139], [2809, 2213, 1579, 1219], [2953, 2331, 1663, 1273]];
    var useSVG = document.documentElement.tagName.toLowerCase() === "svg";
    let Drawing;

    if (useSVG) {
      Drawing = function (el, htOption) {
        this._el = el;
        this._htOption = htOption;
      };

      Drawing.prototype.draw = function (oQRCode) {
        var _htOption = this._htOption;
        var _el = this._el;
        var nCount = oQRCode.getModuleCount();
        Math.floor(_htOption.width / nCount);
        Math.floor(_htOption.height / nCount);
        this.clear();

        function makeSVG(tag, attrs) {
          var el = document.createElementNS('http://www.w3.org/2000/svg', tag);

          for (var k in attrs) if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);

          return el;
        }

        var svg = makeSVG("svg", {
          'viewBox': '0 0 ' + String(nCount) + " " + String(nCount),
          'width': '100%',
          'height': '100%',
          'fill': _htOption.colorLight
        });
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

        _el.appendChild(svg);

        svg.appendChild(makeSVG("rect", {
          "fill": _htOption.colorLight,
          "width": "100%",
          "height": "100%"
        }));
        svg.appendChild(makeSVG("rect", {
          "fill": _htOption.colorDark,
          "width": "1",
          "height": "1",
          "id": "template"
        }));

        for (var row = 0; row < nCount; row++) {
          for (var col = 0; col < nCount; col++) {
            if (oQRCode.isDark(row, col)) {
              var child = makeSVG("use", {
                "x": String(col),
                "y": String(row)
              });
              child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template");
              svg.appendChild(child);
            }
          }
        }
      };

      Drawing.prototype.clear = function () {
        while (this._el.hasChildNodes()) this._el.removeChild(this._el.lastChild);
      };
    } else {
      /**
       * Drawing QRCode by using canvas
       *
       * @constructor
       * @param {HTMLElement} el
       * @param {Object} htOption QRCode Options
       */
      Drawing = function (el, htOption) {
        this._bIsPainted = false;
        this._htOption = htOption;
        this._elCanvas = document.createElement("canvas");
        this._elCanvas.width = htOption.width;
        this._elCanvas.height = htOption.height;
        el.appendChild(this._elCanvas);
        this._el = el;
        this._oContext = this._elCanvas.getContext("2d");
        this._bIsPainted = false;
        this._elImage = document.createElement("img");
        this._elImage.alt = "Scan me!";
        this._elImage.style.display = "none";

        this._el.appendChild(this._elImage);

        this._bSupportDataURI = null;
      };
      /**
       * Draw the QRCode
       *
       * @param {QRCode} oQRCode
       */


      Drawing.prototype.draw = function (oQRCode) {
        var _elImage = this._elImage;
        var _oContext = this._oContext;
        var _htOption = this._htOption;
        var nCount = oQRCode.getModuleCount();
        var nWidth = _htOption.width / nCount;
        var nHeight = _htOption.height / nCount;
        var nRoundedWidth = Math.round(nWidth);
        var nRoundedHeight = Math.round(nHeight);
        _elImage.style.display = "none";
        this.clear();

        for (var row = 0; row < nCount; row++) {
          for (var col = 0; col < nCount; col++) {
            var bIsDark = oQRCode.isDark(row, col);
            var nLeft = col * nWidth;
            var nTop = row * nHeight;
            _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
            _oContext.lineWidth = 1;
            _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;

            _oContext.fillRect(nLeft, nTop, nWidth, nHeight); // 안티 앨리어싱 방지 처리


            _oContext.strokeRect(Math.floor(nLeft) + 0.5, Math.floor(nTop) + 0.5, nRoundedWidth, nRoundedHeight);

            _oContext.strokeRect(Math.ceil(nLeft) - 0.5, Math.ceil(nTop) - 0.5, nRoundedWidth, nRoundedHeight);
          }
        }

        this._bIsPainted = true;
      };
      /**
       * Make the image from Canvas if the browser supports Data URI.
       */


      Drawing.prototype.makeImage = function () {
        if (this._bIsPainted) {
          this._elImage.src = this._elCanvas.toDataURL("image/png");
          this._elImage.style.display = "block";
          this._elCanvas.style.display = "none";
        }
      };
      /**
       * Return whether the QRCode is painted or not
       *
       * @return {Boolean}
       */


      Drawing.prototype.isPainted = function () {
        return this._bIsPainted;
      };
      /**
       * Clear the QRCode
       */


      Drawing.prototype.clear = function () {
        this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);

        this._bIsPainted = false;
      };
      /**
       * @private
       * @param {Number} nNumber
       */


      Drawing.prototype.round = function (nNumber) {
        if (!nNumber) {
          return nNumber;
        }

        return Math.floor(nNumber * 1000) / 1000;
      };
    }
    /**
     * Get the type by string length
     *
     * @private
     * @param {String} sText
     * @param {Number} nCorrectLevel
     * @return {Number} type
     */


    function _getTypeNumber(sText, nCorrectLevel) {
      var nType = 1;

      var length = _getUTF8Length(sText);

      for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
        var nLimit = 0;

        switch (nCorrectLevel) {
          case QRErrorCorrectLevel.L:
            nLimit = QRCodeLimitLength[i][0];
            break;

          case QRErrorCorrectLevel.M:
            nLimit = QRCodeLimitLength[i][1];
            break;

          case QRErrorCorrectLevel.Q:
            nLimit = QRCodeLimitLength[i][2];
            break;

          case QRErrorCorrectLevel.H:
            nLimit = QRCodeLimitLength[i][3];
            break;
        }

        if (length <= nLimit) {
          break;
        } else {
          nType++;
        }
      }

      if (nType > QRCodeLimitLength.length) {
        throw new Error("Too long data");
      }

      return nType;
    }

    function _getUTF8Length(sText) {
      var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
      return replacedText.length + (replacedText.length != sText ? 3 : 0);
    }
    /**
     * @class QRCode
     * @constructor
     * @example
     * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
     *
     * @example
     * var oQRCode = new QRCode("test", {
     *    text : "http://naver.com",
     *    width : 128,
     *    height : 128
     * });
     *
     * oQRCode.clear(); // Clear the QRCode.
     * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode.
     *
     * @param {HTMLElement|String} el target element or 'id' attribute of element.
     * @param {Object|String} vOption
     * @param {String} vOption.text QRCode link data
     * @param {Number} [vOption.width=256]
     * @param {Number} [vOption.height=256]
     * @param {String} [vOption.colorDark="#000000"]
     * @param {String} [vOption.colorLight="#ffffff"]
     * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H]
     */


    const QRCode = function (el, vOption) {
      this._htOption = {
        width: 256,
        height: 256,
        typeNumber: 4,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRErrorCorrectLevel.H
      };

      if (typeof vOption === 'string') {
        vOption = {
          text: vOption
        };
      } // Overwrites options


      if (vOption) {
        for (var i in vOption) {
          this._htOption[i] = vOption[i];
        }
      }

      if (typeof el == "string") {
        el = document.getElementById(el);
      }

      if (this._htOption.useSVG) {
        Drawing = svgDrawer;
      }

      this._el = el;
      this._oQRCode = null;
      this._oDrawing = new Drawing(this._el, this._htOption);

      if (this._htOption.text) {
        this.makeCode(this._htOption.text);
      }
    };
    /**
     * Make the QRCode
     *
     * @param {String} sText link data
     */


    QRCode.prototype.makeCode = function (sText) {
      this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);

      this._oQRCode.addData(sText);

      this._oQRCode.make();

      this._el.title = sText;

      this._oDrawing.draw(this._oQRCode);

      this.makeImage();
    };
    /**
     * Make the Image from Canvas element
     * - It occurs automatically
     * - Android below 3 doesn't support Data-URI spec.
     *
     * @private
     */


    QRCode.prototype.makeImage = function () {
      if (typeof this._oDrawing.makeImage == "function") {
        this._oDrawing.makeImage();
      }
    };
    /**
     * Clear the QRCode
     */


    QRCode.prototype.clear = function () {
      this._oDrawing.clear();
    };
    /**
     * @name QRCode.CorrectLevel
     */


    QRCode.CorrectLevel = QRErrorCorrectLevel;

    function div(options) {
      return create("div", options);
    }

    function create(tag, options) {
      const elem = document.createElement(tag);

      if (options) {
        if (options.class) {
          elem.classList.add(options.class);
        }

        if (options.id) {
          elem.id = options.id;
        }

        if (options.style) {
          applyStyle(elem, options.style);
        }
      }

      return elem;
    }

    function hide(elem) {
      const cssStyle = getComputedStyle(elem);

      if (cssStyle.display !== "none") {
        elem._initialDisplay = cssStyle.display;
      }

      elem.style.display = "none";
    }

    function show(elem) {
      const currentDisplay = getComputedStyle(elem).display;

      if (currentDisplay === "none") {
        const d = elem._initialDisplay || "block";
        elem.style.display = d;
      }
    }

    function offset(elem) {
      // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
      // Support: IE <=11 only
      // Running getBoundingClientRect on a
      // disconnected node in IE throws an error
      if (!elem.getClientRects().length) {
        return {
          top: 0,
          left: 0
        };
      } // Get document-relative position by adding viewport scroll to viewport-relative gBCR


      const rect = elem.getBoundingClientRect();
      const win = elem.ownerDocument.defaultView;
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
      };
    }

    function applyStyle(elem, style) {
      for (let key of Object.keys(style)) {
        elem.style[key] = style[key];
      }
    }

    function guid() {
      return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
    }

    function createIcon(name, color) {
      return iconMarkup(name, color);
    }

    function iconMarkup(name, color) {
      color = color || "currentColor";
      let icon = icons[name];

      if (!icon) {
        console.error(`No icon named: ${name}`);
        icon = icons["question"];
      }

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttributeNS(null, 'viewBox', '0 0 ' + icon[0] + ' ' + icon[1]);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttributeNS(null, 'fill', color);
      path.setAttributeNS(null, 'd', icon[4]);
      svg.appendChild(path);
      return svg;
    }

    const icons = {
      "check": [512, 512, [], "f00c", "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"],
      "cog": [512, 512, [], "f013", "M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"],
      "exclamation": [192, 512, [], "f12a", "M176 432c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80zM25.26 25.199l13.6 272C39.499 309.972 50.041 320 62.83 320h66.34c12.789 0 23.331-10.028 23.97-22.801l13.6-272C167.425 11.49 156.496 0 142.77 0H49.23C35.504 0 24.575 11.49 25.26 25.199z"],
      "exclamation-circle": [512, 512, [], "f06a", "M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"],
      "exclamation-triangle": [576, 512, [], "f071", "M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"],
      "minus": [448, 512, [], "f068", "M424 318.2c13.3 0 24-10.7 24-24v-76.4c0-13.3-10.7-24-24-24H24c-13.3 0-24 10.7-24 24v76.4c0 13.3 10.7 24 24 24h400z"],
      "minus-circle": [512, 512, [], "f056", "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zM124 296c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h264c6.6 0 12 5.4 12 12v56c0 6.6-5.4 12-12 12H124z"],
      "minus-square": [448, 512, [], "f146", "M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM92 296c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h264c6.6 0 12 5.4 12 12v56c0 6.6-5.4 12-12 12H92z"],
      "plus": [448, 512, [], "f067", "M448 294.2v-76.4c0-13.3-10.7-24-24-24H286.2V56c0-13.3-10.7-24-24-24h-76.4c-13.3 0-24 10.7-24 24v137.8H24c-13.3 0-24 10.7-24 24v76.4c0 13.3 10.7 24 24 24h137.8V456c0 13.3 10.7 24 24 24h76.4c13.3 0 24-10.7 24-24V318.2H424c13.3 0 24-10.7 24-24z"],
      "plus-circle": [512, 512, [], "f055", "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"],
      "plus-square": [448, 512, [], "f0fe", "M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-32 252c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92H92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"],
      "question": [384, 512, [], "f128", "M202.021 0C122.202 0 70.503 32.703 29.914 91.026c-7.363 10.58-5.093 25.086 5.178 32.874l43.138 32.709c10.373 7.865 25.132 6.026 33.253-4.148 25.049-31.381 43.63-49.449 82.757-49.449 30.764 0 68.816 19.799 68.816 49.631 0 22.552-18.617 34.134-48.993 51.164-35.423 19.86-82.299 44.576-82.299 106.405V320c0 13.255 10.745 24 24 24h72.471c13.255 0 24-10.745 24-24v-5.773c0-42.86 125.268-44.645 125.268-160.627C377.504 66.256 286.902 0 202.021 0zM192 373.459c-38.196 0-69.271 31.075-69.271 69.271 0 38.195 31.075 69.27 69.271 69.27s69.271-31.075 69.271-69.271-31.075-69.27-69.271-69.27z"],
      "save": [448, 512, [], "f0c7", "M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"],
      "search": [512, 512, [], "f002", "M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"],
      "share": [512, 512, [], "f064", "M503.691 189.836L327.687 37.851C312.281 24.546 288 35.347 288 56.015v80.053C127.371 137.907 0 170.1 0 322.326c0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631C66.066 312.814 132.917 274.316 288 272.085V360c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z"],
      "spinner": [512, 512, [], "f110", "M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"],
      "square": [448, 512, [], "f0c8", "M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"],
      "square-full": [512, 512, [], "f45c", "M512 512H0V0h512v512z"],
      "times": [384, 512, [], "f00d", "M323.1 441l53.9-53.9c9.4-9.4 9.4-24.5 0-33.9L279.8 256l97.2-97.2c9.4-9.4 9.4-24.5 0-33.9L323.1 71c-9.4-9.4-24.5-9.4-33.9 0L192 168.2 94.8 71c-9.4-9.4-24.5-9.4-33.9 0L7 124.9c-9.4 9.4-9.4 24.5 0 33.9l97.2 97.2L7 353.2c-9.4 9.4-9.4 24.5 0 33.9L60.9 441c9.4 9.4 24.5 9.4 33.9 0l97.2-97.2 97.2 97.2c9.3 9.3 24.5 9.3 33.9 0z"],
      "times-circle": [512, 512, [], "f057", "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"],
      "wrench": [512, 512, [], "f0ad", "M481.156 200c9.3 0 15.12 10.155 10.325 18.124C466.295 259.992 420.419 288 368 288c-79.222 0-143.501-63.974-143.997-143.079C223.505 65.469 288.548-.001 368.002 0c52.362.001 98.196 27.949 123.4 69.743C496.24 77.766 490.523 88 481.154 88H376l-40 56 40 56h105.156zm-171.649 93.003L109.255 493.255c-24.994 24.993-65.515 24.994-90.51 0-24.993-24.994-24.993-65.516 0-90.51L218.991 202.5c16.16 41.197 49.303 74.335 90.516 90.503zM104 432c0-13.255-10.745-24-24-24s-24 10.745-24 24 10.745 24 24 24 24-10.745 24-24z"]
    };

    function attachDialogCloseHandlerWithParent(parent, closeHandler) {
      var container = document.createElement("div");
      parent.appendChild(container);
      container.appendChild(createIcon("times"));
      container.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeHandler();
      });
    }
    /**
     * @fileoverview Zlib namespace. Zlib の仕様に準拠した圧縮は Zlib.Deflate で実装
     * されている. これは Inflate との共存を考慮している為.
     */


    const ZLIB_STREAM_RAW_INFLATE_BUFFER_SIZE$1 = 65000;
    var Zlib$1 = {
      Huffman: {},
      Util: {},
      CRC32: {}
    };
    /**
     * Compression Method
     * @enum {number}
     */

    Zlib$1.CompressionMethod = {
      DEFLATE: 8,
      RESERVED: 15
    };
    /**
     * @param {Object=} opt_params options.
     * @constructor
     */

    Zlib$1.Zip = function (opt_params) {
      opt_params = opt_params || {};
      /** @type {Array.<{
       *   buffer: !(Array.<number>|Uint8Array),
       *   option: Object,
       *   compressed: boolean,
       *   encrypted: boolean,
       *   size: number,
       *   crc32: number
       * }>} */

      this.files = [];
      /** @type {(Array.<number>|Uint8Array)} */

      this.comment = opt_params['comment'];
      /** @type {(Array.<number>|Uint8Array)} */

      this.password;
    };
    /**
     * @enum {number}
     */


    Zlib$1.Zip.CompressionMethod = {
      STORE: 0,
      DEFLATE: 8
    };
    /**
     * @enum {number}
     */

    Zlib$1.Zip.OperatingSystem = {
      MSDOS: 0,
      UNIX: 3,
      MACINTOSH: 7
    };
    /**
     * @enum {number}
     */

    Zlib$1.Zip.Flags = {
      ENCRYPT: 0x0001,
      DESCRIPTOR: 0x0008,
      UTF8: 0x0800
    };
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib$1.Zip.FileHeaderSignature = [0x50, 0x4b, 0x01, 0x02];
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib$1.Zip.LocalFileHeaderSignature = [0x50, 0x4b, 0x03, 0x04];
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib$1.Zip.CentralDirectorySignature = [0x50, 0x4b, 0x05, 0x06];
    /**
     * @param {Array.<number>|Uint8Array} input
     * @param {Object=} opt_params options.
     */

    Zlib$1.Zip.prototype.addFile = function (input, opt_params) {
      opt_params = opt_params || {};
      /** @type {string} */

      opt_params['filename'];
      /** @type {boolean} */

      var compressed;
      /** @type {number} */

      var size = input.length;
      /** @type {number} */

      var crc32 = 0;

      if (input instanceof Array) {
        input = new Uint8Array(input);
      } // default


      if (typeof opt_params['compressionMethod'] !== 'number') {
        opt_params['compressionMethod'] = Zlib$1.Zip.CompressionMethod.DEFLATE;
      } // その場で圧縮する場合


      if (opt_params['compress']) {
        switch (opt_params['compressionMethod']) {
          case Zlib$1.Zip.CompressionMethod.STORE:
            break;

          case Zlib$1.Zip.CompressionMethod.DEFLATE:
            crc32 = Zlib$1.CRC32.calc(input);
            input = this.deflateWithOption(input, opt_params);
            compressed = true;
            break;

          default:
            throw new Error('unknown compression method:' + opt_params['compressionMethod']);
        }
      }

      this.files.push({
        buffer: input,
        option: opt_params,
        compressed: compressed,
        encrypted: false,
        size: size,
        crc32: crc32
      });
    };
    /**
     * @param {(Array.<number>|Uint8Array)} password
     */


    Zlib$1.Zip.prototype.setPassword = function (password) {
      this.password = password;
    };

    Zlib$1.Zip.prototype.compress = function () {
      /** @type {Array.<{
       *   buffer: !(Array.<number>|Uint8Array),
       *   option: Object,
       *   compressed: boolean,
       *   encrypted: boolean,
       *   size: number,
       *   crc32: number
       * }>} */
      var files = this.files;
      /** @type {{
       *   buffer: !(Array.<number>|Uint8Array),
       *   option: Object,
       *   compressed: boolean,
       *   encrypted: boolean,
       *   size: number,
       *   crc32: number
       * }} */

      var file;
      /** @type {!(Array.<number>|Uint8Array)} */

      var output;
      /** @type {number} */

      var op1;
      /** @type {number} */

      var op2;
      /** @type {number} */

      var op3;
      /** @type {number} */

      var localFileSize = 0;
      /** @type {number} */

      var centralDirectorySize = 0;
      /** @type {number} */

      var endOfCentralDirectorySize;
      /** @type {number} */

      var offset;
      /** @type {number} */

      var needVersion;
      /** @type {number} */

      var flags;
      /** @type {Zlib.Zip.CompressionMethod} */

      var compressionMethod;
      /** @type {Date} */

      var date;
      /** @type {number} */

      var crc32;
      /** @type {number} */

      var size;
      /** @type {number} */

      var plainSize;
      /** @type {number} */

      var filenameLength;
      /** @type {number} */

      var extraFieldLength;
      /** @type {number} */

      var commentLength;
      /** @type {(Array.<number>|Uint8Array)} */

      var filename;
      /** @type {(Array.<number>|Uint8Array)} */

      var extraField;
      /** @type {(Array.<number>|Uint8Array)} */

      var comment;
      /** @type {(Array.<number>|Uint8Array)} */

      var buffer;
      /** @type {*} */

      var tmp;
      /** @type {Array.<number>|Uint32Array|Object} */

      var key;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      /** @type {number} */

      var j;
      /** @type {number} */

      var jl; // ファイルの圧縮

      for (i = 0, il = files.length; i < il; ++i) {
        file = files[i];
        filenameLength = file.option['filename'] ? file.option['filename'].length : 0;
        extraFieldLength = file.option['extraField'] ? file.option['extraField'].length : 0;
        commentLength = file.option['comment'] ? file.option['comment'].length : 0; // 圧縮されていなかったら圧縮

        if (!file.compressed) {
          // 圧縮前に CRC32 の計算をしておく
          file.crc32 = Zlib$1.CRC32.calc(file.buffer);

          switch (file.option['compressionMethod']) {
            case Zlib$1.Zip.CompressionMethod.STORE:
              break;

            case Zlib$1.Zip.CompressionMethod.DEFLATE:
              file.buffer = this.deflateWithOption(file.buffer, file.option);
              file.compressed = true;
              break;

            default:
              throw new Error('unknown compression method:' + file.option['compressionMethod']);
          }
        } // encryption


        if (file.option['password'] !== void 0 || this.password !== void 0) {
          // init encryption
          key = this.createEncryptionKey(file.option['password'] || this.password); // add header

          buffer = file.buffer;
          {
            tmp = new Uint8Array(buffer.length + 12);
            tmp.set(buffer, 12);
            buffer = tmp;
          }

          for (j = 0; j < 12; ++j) {
            buffer[j] = this.encode(key, i === 11 ? file.crc32 & 0xff : Math.random() * 256 | 0);
          } // data encryption


          for (jl = buffer.length; j < jl; ++j) {
            buffer[j] = this.encode(key, buffer[j]);
          }

          file.buffer = buffer;
        } // 必要バッファサイズの計算


        localFileSize += // local file header
        30 + filenameLength + // file data
        file.buffer.length;
        centralDirectorySize += // file header
        46 + filenameLength + commentLength;
      } // end of central directory


      endOfCentralDirectorySize = 22 + (this.comment ? this.comment.length : 0);
      output = new Uint8Array(localFileSize + centralDirectorySize + endOfCentralDirectorySize);
      op1 = 0;
      op2 = localFileSize;
      op3 = op2 + centralDirectorySize; // ファイルの圧縮

      for (i = 0, il = files.length; i < il; ++i) {
        file = files[i];
        filenameLength = file.option['filename'] ? file.option['filename'].length : 0;
        extraFieldLength = 0; // TODO

        commentLength = file.option['comment'] ? file.option['comment'].length : 0; //-------------------------------------------------------------------------
        // local file header & file header
        //-------------------------------------------------------------------------

        offset = op1; // signature
        // local file header

        output[op1++] = Zlib$1.Zip.LocalFileHeaderSignature[0];
        output[op1++] = Zlib$1.Zip.LocalFileHeaderSignature[1];
        output[op1++] = Zlib$1.Zip.LocalFileHeaderSignature[2];
        output[op1++] = Zlib$1.Zip.LocalFileHeaderSignature[3]; // file header

        output[op2++] = Zlib$1.Zip.FileHeaderSignature[0];
        output[op2++] = Zlib$1.Zip.FileHeaderSignature[1];
        output[op2++] = Zlib$1.Zip.FileHeaderSignature[2];
        output[op2++] = Zlib$1.Zip.FileHeaderSignature[3]; // compressor info

        needVersion = 20;
        output[op2++] = needVersion & 0xff;
        output[op2++] =
        /** @type {Zlib.Zip.OperatingSystem} */
        file.option['os'] || Zlib$1.Zip.OperatingSystem.MSDOS; // need version

        output[op1++] = output[op2++] = needVersion & 0xff;
        output[op1++] = output[op2++] = needVersion >> 8 & 0xff; // general purpose bit flag

        flags = 0;

        if (file.option['password'] || this.password) {
          flags |= Zlib$1.Zip.Flags.ENCRYPT;
        }

        output[op1++] = output[op2++] = flags & 0xff;
        output[op1++] = output[op2++] = flags >> 8 & 0xff; // compression method

        compressionMethod =
        /** @type {Zlib.Zip.CompressionMethod} */
        file.option['compressionMethod'];
        output[op1++] = output[op2++] = compressionMethod & 0xff;
        output[op1++] = output[op2++] = compressionMethod >> 8 & 0xff; // date

        date =
        /** @type {(Date|undefined)} */
        file.option['date'] || new Date();
        output[op1++] = output[op2++] = (date.getMinutes() & 0x7) << 5 | (date.getSeconds() / 2 | 0);
        output[op1++] = output[op2++] = date.getHours() << 3 | date.getMinutes() >> 3; //

        output[op1++] = output[op2++] = (date.getMonth() + 1 & 0x7) << 5 | date.getDate();
        output[op1++] = output[op2++] = (date.getFullYear() - 1980 & 0x7f) << 1 | date.getMonth() + 1 >> 3; // CRC-32

        crc32 = file.crc32;
        output[op1++] = output[op2++] = crc32 & 0xff;
        output[op1++] = output[op2++] = crc32 >> 8 & 0xff;
        output[op1++] = output[op2++] = crc32 >> 16 & 0xff;
        output[op1++] = output[op2++] = crc32 >> 24 & 0xff; // compressed size

        size = file.buffer.length;
        output[op1++] = output[op2++] = size & 0xff;
        output[op1++] = output[op2++] = size >> 8 & 0xff;
        output[op1++] = output[op2++] = size >> 16 & 0xff;
        output[op1++] = output[op2++] = size >> 24 & 0xff; // uncompressed size

        plainSize = file.size;
        output[op1++] = output[op2++] = plainSize & 0xff;
        output[op1++] = output[op2++] = plainSize >> 8 & 0xff;
        output[op1++] = output[op2++] = plainSize >> 16 & 0xff;
        output[op1++] = output[op2++] = plainSize >> 24 & 0xff; // filename length

        output[op1++] = output[op2++] = filenameLength & 0xff;
        output[op1++] = output[op2++] = filenameLength >> 8 & 0xff; // extra field length

        output[op1++] = output[op2++] = extraFieldLength & 0xff;
        output[op1++] = output[op2++] = extraFieldLength >> 8 & 0xff; // file comment length

        output[op2++] = commentLength & 0xff;
        output[op2++] = commentLength >> 8 & 0xff; // disk number start

        output[op2++] = 0;
        output[op2++] = 0; // internal file attributes

        output[op2++] = 0;
        output[op2++] = 0; // external file attributes

        output[op2++] = 0;
        output[op2++] = 0;
        output[op2++] = 0;
        output[op2++] = 0; // relative offset of local header

        output[op2++] = offset & 0xff;
        output[op2++] = offset >> 8 & 0xff;
        output[op2++] = offset >> 16 & 0xff;
        output[op2++] = offset >> 24 & 0xff; // filename

        filename = file.option['filename'];

        if (filename) {
          {
            output.set(filename, op1);
            output.set(filename, op2);
            op1 += filenameLength;
            op2 += filenameLength;
          }
        } // extra field


        extraField = file.option['extraField'];

        if (extraField) {
          {
            output.set(extraField, op1);
            output.set(extraField, op2);
            op1 += extraFieldLength;
            op2 += extraFieldLength;
          }
        } // comment


        comment = file.option['comment'];

        if (comment) {
          {
            output.set(comment, op2);
            op2 += commentLength;
          }
        } //-------------------------------------------------------------------------
        // file data
        //-------------------------------------------------------------------------


        {
          output.set(file.buffer, op1);
          op1 += file.buffer.length;
        }
      } //-------------------------------------------------------------------------
      // end of central directory
      //-------------------------------------------------------------------------
      // signature


      output[op3++] = Zlib$1.Zip.CentralDirectorySignature[0];
      output[op3++] = Zlib$1.Zip.CentralDirectorySignature[1];
      output[op3++] = Zlib$1.Zip.CentralDirectorySignature[2];
      output[op3++] = Zlib$1.Zip.CentralDirectorySignature[3]; // number of this disk

      output[op3++] = 0;
      output[op3++] = 0; // number of the disk with the start of the central directory

      output[op3++] = 0;
      output[op3++] = 0; // total number of entries in the central directory on this disk

      output[op3++] = il & 0xff;
      output[op3++] = il >> 8 & 0xff; // total number of entries in the central directory

      output[op3++] = il & 0xff;
      output[op3++] = il >> 8 & 0xff; // size of the central directory

      output[op3++] = centralDirectorySize & 0xff;
      output[op3++] = centralDirectorySize >> 8 & 0xff;
      output[op3++] = centralDirectorySize >> 16 & 0xff;
      output[op3++] = centralDirectorySize >> 24 & 0xff; // offset of start of central directory with respect to the starting disk number

      output[op3++] = localFileSize & 0xff;
      output[op3++] = localFileSize >> 8 & 0xff;
      output[op3++] = localFileSize >> 16 & 0xff;
      output[op3++] = localFileSize >> 24 & 0xff; // .ZIP file comment length

      commentLength = this.comment ? this.comment.length : 0;
      output[op3++] = commentLength & 0xff;
      output[op3++] = commentLength >> 8 & 0xff; // .ZIP file comment

      if (this.comment) {
        {
          output.set(this.comment, op3);
          op3 += commentLength;
        }
      }

      return output;
    };
    /**
     * @param {!(Array.<number>|Uint8Array)} input
     * @param {Object=} opt_params options.
     * @return {!(Array.<number>|Uint8Array)}
     */


    Zlib$1.Zip.prototype.deflateWithOption = function (input, opt_params) {
      /** @type {Zlib.RawDeflate} */
      var deflator = new Zlib$1.RawDeflate(input, opt_params['deflateOption']);
      return deflator.compress();
    };
    /**
     * @param {(Array.<number>|Uint32Array)} key
     * @return {number}
     */


    Zlib$1.Zip.prototype.getByte = function (key) {
      /** @type {number} */
      var tmp = key[2] & 0xffff | 2;
      return tmp * (tmp ^ 1) >> 8 & 0xff;
    };
    /**
     * @param {(Array.<number>|Uint32Array|Object)} key
     * @param {number} n
     * @return {number}
     */


    Zlib$1.Zip.prototype.encode = function (key, n) {
      /** @type {number} */
      var tmp = this.getByte(
      /** @type {(Array.<number>|Uint32Array)} */
      key);
      this.updateKeys(
      /** @type {(Array.<number>|Uint32Array)} */
      key, n);
      return tmp ^ n;
    };
    /**
     * @param {(Array.<number>|Uint32Array)} key
     * @param {number} n
     */


    Zlib$1.Zip.prototype.updateKeys = function (key, n) {
      key[0] = Zlib$1.CRC32.single(key[0], n);
      key[1] = (((key[1] + (key[0] & 0xff)) * 20173 >>> 0) * 6681 >>> 0) + 1 >>> 0;
      key[2] = Zlib$1.CRC32.single(key[2], key[1] >>> 24);
    };
    /**
     * @param {(Array.<number>|Uint8Array)} password
     * @return {!(Array.<number>|Uint32Array|Object)}
     */


    Zlib$1.Zip.prototype.createEncryptionKey = function (password) {
      /** @type {!(Array.<number>|Uint32Array)} */
      var key = [305419896, 591751049, 878082192];
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      {
        key = new Uint32Array(key);
      }

      for (i = 0, il = password.length; i < il; ++i) {
        this.updateKeys(key, password[i] & 0xff);
      }

      return key;
    };
    /**
     * build huffman table from length list.
     * @param {!(Array.<number>|Uint8Array)} lengths length list.
     * @return {!Array} huffman table.
     */


    Zlib$1.Huffman.buildHuffmanTable = function (lengths) {
      /** @type {number} length list size. */
      var listSize = lengths.length;
      /** @type {number} max code length for table size. */

      var maxCodeLength = 0;
      /** @type {number} min code length for table size. */

      var minCodeLength = Number.POSITIVE_INFINITY;
      /** @type {number} table size. */

      var size;
      /** @type {!(Array|Uint8Array)} huffman code table. */

      var table;
      /** @type {number} bit length. */

      var bitLength;
      /** @type {number} huffman code. */

      var code;
      /**
       * サイズが 2^maxlength 個のテーブルを埋めるためのスキップ長.
       * @type {number} skip length for table filling.
       */

      var skip;
      /** @type {number} reversed code. */

      var reversed;
      /** @type {number} reverse temp. */

      var rtemp;
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limit. */

      var il;
      /** @type {number} loop counter. */

      var j;
      /** @type {number} table value. */

      var value; // Math.max は遅いので最長の値は for-loop で取得する

      for (i = 0, il = listSize; i < il; ++i) {
        if (lengths[i] > maxCodeLength) {
          maxCodeLength = lengths[i];
        }

        if (lengths[i] < minCodeLength) {
          minCodeLength = lengths[i];
        }
      }

      size = 1 << maxCodeLength;
      table = new Uint32Array(size); // ビット長の短い順からハフマン符号を割り当てる

      for (bitLength = 1, code = 0, skip = 2; bitLength <= maxCodeLength;) {
        for (i = 0; i < listSize; ++i) {
          if (lengths[i] === bitLength) {
            // ビットオーダーが逆になるためビット長分並びを反転する
            for (reversed = 0, rtemp = code, j = 0; j < bitLength; ++j) {
              reversed = reversed << 1 | rtemp & 1;
              rtemp >>= 1;
            } // 最大ビット長をもとにテーブルを作るため、
            // 最大ビット長以外では 0 / 1 どちらでも良い箇所ができる
            // そのどちらでも良い場所は同じ値で埋めることで
            // 本来のビット長以上のビット数取得しても問題が起こらないようにする


            value = bitLength << 16 | i;

            for (j = reversed; j < size; j += skip) {
              table[j] = value;
            }

            ++code;
          }
        } // 次のビット長へ


        ++bitLength;
        code <<= 1;
        skip <<= 1;
      }

      return [table, maxCodeLength, minCodeLength];
    }; //-----------------------------------------------------------------------------

    /** @define {number} buffer block size. */


    var ZLIB_RAW_INFLATE_BUFFER_SIZE$1 = 0x8000; // [ 0x8000 >= ZLIB_BUFFER_BLOCK_SIZE ]
    //-----------------------------------------------------------------------------

    var buildHuffmanTable$1 = Zlib$1.Huffman.buildHuffmanTable;
    /**
     * @constructor
     * @param {!(Uint8Array|Array.<number>)} input input buffer.
     * @param {Object} opt_params option parameter.
     *
     * opt_params は以下のプロパティを指定する事ができます。
     *   - index: input buffer の deflate コンテナの開始位置.
     *   - blockSize: バッファのブロックサイズ.
     *   - bufferType: Zlib.RawInflate.BufferType の値によってバッファの管理方法を指定する.
     *   - resize: 確保したバッファが実際の大きさより大きかった場合に切り詰める.
     */

    Zlib$1.RawInflate = function (input, opt_params) {
      /** @type {!(Array.<number>|Uint8Array)} inflated buffer */
      this.buffer;
      /** @type {!Array.<(Array.<number>|Uint8Array)>} */

      this.blocks = [];
      /** @type {number} block size. */

      this.bufferSize = ZLIB_RAW_INFLATE_BUFFER_SIZE$1;
      /** @type {!number} total output buffer pointer. */

      this.totalpos = 0;
      /** @type {!number} input buffer pointer. */

      this.ip = 0;
      /** @type {!number} bit stream reader buffer. */

      this.bitsbuf = 0;
      /** @type {!number} bit stream reader buffer size. */

      this.bitsbuflen = 0;
      /** @type {!(Array.<number>|Uint8Array)} input buffer. */

      this.input = new Uint8Array(input);
      /** @type {!(Uint8Array|Array.<number>)} output buffer. */

      this.output;
      /** @type {!number} output buffer pointer. */

      this.op;
      /** @type {boolean} is final block flag. */

      this.bfinal = false;
      /** @type {Zlib.RawInflate.BufferType} buffer management. */

      this.bufferType = Zlib$1.RawInflate.BufferType.ADAPTIVE;
      /** @type {boolean} resize flag for memory size optimization. */

      this.resize = false; // option parameters

      if (opt_params || !(opt_params = {})) {
        if (opt_params['index']) {
          this.ip = opt_params['index'];
        }

        if (opt_params['bufferSize']) {
          this.bufferSize = opt_params['bufferSize'];
        }

        if (opt_params['bufferType']) {
          this.bufferType = opt_params['bufferType'];
        }

        if (opt_params['resize']) {
          this.resize = opt_params['resize'];
        }
      } // initialize


      switch (this.bufferType) {
        case Zlib$1.RawInflate.BufferType.BLOCK:
          this.op = Zlib$1.RawInflate.MaxBackwardLength;
          this.output = new Uint8Array(Zlib$1.RawInflate.MaxBackwardLength + this.bufferSize + Zlib$1.RawInflate.MaxCopyLength);
          break;

        case Zlib$1.RawInflate.BufferType.ADAPTIVE:
          this.op = 0;
          this.output = new Uint8Array(this.bufferSize);
          break;

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * @enum {number}
     */


    Zlib$1.RawInflate.BufferType = {
      BLOCK: 0,
      ADAPTIVE: 1
    };
    /**
     * decompress.
     * @return {!(Uint8Array|Array.<number>)} inflated buffer.
     */

    Zlib$1.RawInflate.prototype.decompress = function () {
      while (!this.bfinal) {
        this.parseBlock();
      }

      switch (this.bufferType) {
        case Zlib$1.RawInflate.BufferType.BLOCK:
          return this.concatBufferBlock();

        case Zlib$1.RawInflate.BufferType.ADAPTIVE:
          return this.concatBufferDynamic();

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * @const
     * @type {number} max backward length for LZ77.
     */


    Zlib$1.RawInflate.MaxBackwardLength = 32768;
    /**
     * @const
     * @type {number} max copy length for LZ77.
     */

    Zlib$1.RawInflate.MaxCopyLength = 258;
    /**
     * huffman order
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */

    Zlib$1.RawInflate.Order = function (table) {
      return new Uint16Array(table);
    }([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    /**
     * huffman length code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib$1.RawInflate.LengthCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000a, 0x000b, 0x000d, 0x000f, 0x0011, 0x0013, 0x0017, 0x001b, 0x001f, 0x0023, 0x002b, 0x0033, 0x003b, 0x0043, 0x0053, 0x0063, 0x0073, 0x0083, 0x00a3, 0x00c3, 0x00e3, 0x0102, 0x0102, 0x0102]);
    /**
     * huffman length extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib$1.RawInflate.LengthExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0]);
    /**
     * huffman dist code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib$1.RawInflate.DistCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d, 0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1, 0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01, 0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001]);
    /**
     * huffman dist extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib$1.RawInflate.DistExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
    /**
     * fixed huffman length code table
     * @const
     * @type {!Array}
     */


    Zlib$1.RawInflate.FixedLiteralLengthTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(288);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = i <= 143 ? 8 : i <= 255 ? 9 : i <= 279 ? 7 : 8;
      }

      return buildHuffmanTable$1(lengths);
    }());
    /**
     * fixed huffman distance code table
     * @const
     * @type {!Array}
     */


    Zlib$1.RawInflate.FixedDistanceTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(30);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = 5;
      }

      return buildHuffmanTable$1(lengths);
    }());
    /**
     * parse deflated block.
     */


    Zlib$1.RawInflate.prototype.parseBlock = function () {
      /** @type {number} header */
      var hdr = this.readBits(3); // BFINAL

      if (hdr & 0x1) {
        this.bfinal = true;
      } // BTYPE


      hdr >>>= 1;

      switch (hdr) {
        // uncompressed
        case 0:
          this.parseUncompressedBlock();
          break;
        // fixed huffman

        case 1:
          this.parseFixedHuffmanBlock();
          break;
        // dynamic huffman

        case 2:
          this.parseDynamicHuffmanBlock();
          break;
        // reserved or other

        default:
          throw new Error('unknown BTYPE: ' + hdr);
      }
    };
    /**
     * read inflate bits
     * @param {number} length bits length.
     * @return {number} read bits.
     */


    Zlib$1.RawInflate.prototype.readBits = function (length) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {number} */

      var inputLength = input.length;
      /** @type {number} input and output byte. */

      var octet; // input byte

      if (ip + (length - bitsbuflen + 7 >> 3) >= inputLength) {
        throw new Error('input buffer is broken');
      } // not enough buffer


      while (bitsbuflen < length) {
        bitsbuf |= input[ip++] << bitsbuflen;
        bitsbuflen += 8;
      } // output byte


      octet = bitsbuf &
      /* MASK */
      (1 << length) - 1;
      bitsbuf >>>= length;
      bitsbuflen -= length;
      this.bitsbuf = bitsbuf;
      this.bitsbuflen = bitsbuflen;
      this.ip = ip;
      return octet;
    };
    /**
     * read huffman code using table
     * @param {!(Array.<number>|Uint8Array|Uint16Array)} table huffman code table.
     * @return {number} huffman code.
     */


    Zlib$1.RawInflate.prototype.readCodeByTable = function (table) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {number} */

      var inputLength = input.length;
      /** @type {!(Array.<number>|Uint8Array)} huffman code table */

      var codeTable = table[0];
      /** @type {number} */

      var maxCodeLength = table[1];
      /** @type {number} code length & code (16bit, 16bit) */

      var codeWithLength;
      /** @type {number} code bits length */

      var codeLength; // not enough buffer

      while (bitsbuflen < maxCodeLength) {
        if (ip >= inputLength) {
          break;
        }

        bitsbuf |= input[ip++] << bitsbuflen;
        bitsbuflen += 8;
      } // read max length


      codeWithLength = codeTable[bitsbuf & (1 << maxCodeLength) - 1];
      codeLength = codeWithLength >>> 16;

      if (codeLength > bitsbuflen) {
        throw new Error('invalid code length: ' + codeLength);
      }

      this.bitsbuf = bitsbuf >> codeLength;
      this.bitsbuflen = bitsbuflen - codeLength;
      this.ip = ip;
      return codeWithLength & 0xffff;
    };
    /**
     * parse uncompressed block.
     */


    Zlib$1.RawInflate.prototype.parseUncompressedBlock = function () {
      var input = this.input;
      var ip = this.ip;
      var output = this.output;
      var op = this.op;
      /** @type {number} */

      var inputLength = input.length;
      /** @type {number} block length */

      var len;
      /** @type {number} number for check block length */

      var nlen;
      /** @type {number} output buffer length */

      var olength = output.length;
      /** @type {number} copy counter */

      var preCopy; // skip buffered header bits

      this.bitsbuf = 0;
      this.bitsbuflen = 0; // len

      if (ip + 1 >= inputLength) {
        throw new Error('invalid uncompressed block header: LEN');
      }

      len = input[ip++] | input[ip++] << 8; // nlen

      if (ip + 1 >= inputLength) {
        throw new Error('invalid uncompressed block header: NLEN');
      }

      nlen = input[ip++] | input[ip++] << 8; // check len & nlen

      if (len === ~nlen) {
        throw new Error('invalid uncompressed block header: length verify');
      } // check size


      if (ip + len > input.length) {
        throw new Error('input buffer is broken');
      } // expand buffer


      switch (this.bufferType) {
        case Zlib$1.RawInflate.BufferType.BLOCK:
          // pre copy
          while (op + len > output.length) {
            preCopy = olength - op;
            len -= preCopy;
            {
              output.set(input.subarray(ip, ip + preCopy), op);
              op += preCopy;
              ip += preCopy;
            }
            this.op = op;
            output = this.expandBufferBlock();
            op = this.op;
          }

          break;

        case Zlib$1.RawInflate.BufferType.ADAPTIVE:
          while (op + len > output.length) {
            output = this.expandBufferAdaptive({
              fixRatio: 2
            });
          }

          break;

        default:
          throw new Error('invalid inflate mode');
      } // copy


      {
        output.set(input.subarray(ip, ip + len), op);
        op += len;
        ip += len;
      }
      this.ip = ip;
      this.op = op;
      this.output = output;
    };
    /**
     * parse fixed huffman block.
     */


    Zlib$1.RawInflate.prototype.parseFixedHuffmanBlock = function () {
      switch (this.bufferType) {
        case Zlib$1.RawInflate.BufferType.ADAPTIVE:
          this.decodeHuffmanAdaptive(Zlib$1.RawInflate.FixedLiteralLengthTable, Zlib$1.RawInflate.FixedDistanceTable);
          break;

        case Zlib$1.RawInflate.BufferType.BLOCK:
          this.decodeHuffmanBlock(Zlib$1.RawInflate.FixedLiteralLengthTable, Zlib$1.RawInflate.FixedDistanceTable);
          break;

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * parse dynamic huffman block.
     */


    Zlib$1.RawInflate.prototype.parseDynamicHuffmanBlock = function () {
      /** @type {number} number of literal and length codes. */
      var hlit = this.readBits(5) + 257;
      /** @type {number} number of distance codes. */

      var hdist = this.readBits(5) + 1;
      /** @type {number} number of code lengths. */

      var hclen = this.readBits(4) + 4;
      /** @type {!(Uint8Array|Array.<number>)} code lengths. */

      var codeLengths = new Uint8Array(Zlib$1.RawInflate.Order.length);
      /** @type {!Array} code lengths table. */

      var codeLengthsTable;
      /** @type {!(Uint8Array|Array.<number>)} literal and length code table. */

      var litlenTable;
      /** @type {!(Uint8Array|Array.<number>)} distance code table. */

      var distTable;
      /** @type {!(Uint8Array|Array.<number>)} code length table. */

      var lengthTable;
      /** @type {number} */

      var code;
      /** @type {number} */

      var prev;
      /** @type {number} */

      var repeat;
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limit. */

      var il; // decode code lengths

      for (i = 0; i < hclen; ++i) {
        codeLengths[Zlib$1.RawInflate.Order[i]] = this.readBits(3);
      } // decode length table


      codeLengthsTable = buildHuffmanTable$1(codeLengths);
      lengthTable = new Uint8Array(hlit + hdist);

      for (i = 0, il = hlit + hdist; i < il;) {
        code = this.readCodeByTable(codeLengthsTable);

        switch (code) {
          case 16:
            repeat = 3 + this.readBits(2);

            while (repeat--) {
              lengthTable[i++] = prev;
            }

            break;

          case 17:
            repeat = 3 + this.readBits(3);

            while (repeat--) {
              lengthTable[i++] = 0;
            }

            prev = 0;
            break;

          case 18:
            repeat = 11 + this.readBits(7);

            while (repeat--) {
              lengthTable[i++] = 0;
            }

            prev = 0;
            break;

          default:
            lengthTable[i++] = code;
            prev = code;
            break;
        }
      }

      litlenTable = buildHuffmanTable$1(lengthTable.subarray(0, hlit));
      distTable = buildHuffmanTable$1(lengthTable.subarray(hlit));

      switch (this.bufferType) {
        case Zlib$1.RawInflate.BufferType.ADAPTIVE:
          this.decodeHuffmanAdaptive(litlenTable, distTable);
          break;

        case Zlib$1.RawInflate.BufferType.BLOCK:
          this.decodeHuffmanBlock(litlenTable, distTable);
          break;

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * decode huffman code
     * @param {!(Array.<number>|Uint16Array)} litlen literal and length code table.
     * @param {!(Array.<number>|Uint8Array)} dist distination code table.
     */


    Zlib$1.RawInflate.prototype.decodeHuffmanBlock = function (litlen, dist) {
      var output = this.output;
      var op = this.op;
      this.currentLitlenTable = litlen;
      /** @type {number} output position limit. */

      var olength = output.length - Zlib$1.RawInflate.MaxCopyLength;
      /** @type {number} huffman code. */

      var code;
      /** @type {number} table index. */

      var ti;
      /** @type {number} huffman code distination. */

      var codeDist;
      /** @type {number} huffman code length. */

      var codeLength;
      var lengthCodeTable = Zlib$1.RawInflate.LengthCodeTable;
      var lengthExtraTable = Zlib$1.RawInflate.LengthExtraTable;
      var distCodeTable = Zlib$1.RawInflate.DistCodeTable;
      var distExtraTable = Zlib$1.RawInflate.DistExtraTable;

      while ((code = this.readCodeByTable(litlen)) !== 256) {
        // literal
        if (code < 256) {
          if (op >= olength) {
            this.op = op;
            output = this.expandBufferBlock();
            op = this.op;
          }

          output[op++] = code;
          continue;
        } // length code


        ti = code - 257;
        codeLength = lengthCodeTable[ti];

        if (lengthExtraTable[ti] > 0) {
          codeLength += this.readBits(lengthExtraTable[ti]);
        } // dist code


        code = this.readCodeByTable(dist);
        codeDist = distCodeTable[code];

        if (distExtraTable[code] > 0) {
          codeDist += this.readBits(distExtraTable[code]);
        } // lz77 decode


        if (op >= olength) {
          this.op = op;
          output = this.expandBufferBlock();
          op = this.op;
        }

        while (codeLength--) {
          output[op] = output[op++ - codeDist];
        }
      }

      while (this.bitsbuflen >= 8) {
        this.bitsbuflen -= 8;
        this.ip--;
      }

      this.op = op;
    };
    /**
     * decode huffman code (adaptive)
     * @param {!(Array.<number>|Uint16Array)} litlen literal and length code table.
     * @param {!(Array.<number>|Uint8Array)} dist distination code table.
     */


    Zlib$1.RawInflate.prototype.decodeHuffmanAdaptive = function (litlen, dist) {
      var output = this.output;
      var op = this.op;
      this.currentLitlenTable = litlen;
      /** @type {number} output position limit. */

      var olength = output.length;
      /** @type {number} huffman code. */

      var code;
      /** @type {number} table index. */

      var ti;
      /** @type {number} huffman code distination. */

      var codeDist;
      /** @type {number} huffman code length. */

      var codeLength;
      var lengthCodeTable = Zlib$1.RawInflate.LengthCodeTable;
      var lengthExtraTable = Zlib$1.RawInflate.LengthExtraTable;
      var distCodeTable = Zlib$1.RawInflate.DistCodeTable;
      var distExtraTable = Zlib$1.RawInflate.DistExtraTable;

      while ((code = this.readCodeByTable(litlen)) !== 256) {
        // literal
        if (code < 256) {
          if (op >= olength) {
            output = this.expandBufferAdaptive();
            olength = output.length;
          }

          output[op++] = code;
          continue;
        } // length code


        ti = code - 257;
        codeLength = lengthCodeTable[ti];

        if (lengthExtraTable[ti] > 0) {
          codeLength += this.readBits(lengthExtraTable[ti]);
        } // dist code


        code = this.readCodeByTable(dist);
        codeDist = distCodeTable[code];

        if (distExtraTable[code] > 0) {
          codeDist += this.readBits(distExtraTable[code]);
        } // lz77 decode


        if (op + codeLength > olength) {
          output = this.expandBufferAdaptive();
          olength = output.length;
        }

        while (codeLength--) {
          output[op] = output[op++ - codeDist];
        }
      }

      while (this.bitsbuflen >= 8) {
        this.bitsbuflen -= 8;
        this.ip--;
      }

      this.op = op;
    };
    /**
     * expand output buffer.
     * @param {Object=} opt_param option parameters.
     * @return {!(Array.<number>|Uint8Array)} output buffer.
     */


    Zlib$1.RawInflate.prototype.expandBufferBlock = function (opt_param) {
      /** @type {!(Array.<number>|Uint8Array)} store buffer. */
      var buffer = new Uint8Array(this.op - Zlib$1.RawInflate.MaxBackwardLength);
      /** @type {number} backward base point */

      var backward = this.op - Zlib$1.RawInflate.MaxBackwardLength;
      var output = this.output; // copy to output buffer

      {
        buffer.set(output.subarray(Zlib$1.RawInflate.MaxBackwardLength, buffer.length));
      }
      this.blocks.push(buffer);
      this.totalpos += buffer.length; // copy to backward buffer

      {
        output.set(output.subarray(backward, backward + Zlib$1.RawInflate.MaxBackwardLength));
      }
      this.op = Zlib$1.RawInflate.MaxBackwardLength;
      return output;
    };
    /**
     * expand output buffer. (adaptive)
     * @param {Object=} opt_param option parameters.
     * @return {!(Array.<number>|Uint8Array)} output buffer pointer.
     */


    Zlib$1.RawInflate.prototype.expandBufferAdaptive = function (opt_param) {
      /** @type {!(Array.<number>|Uint8Array)} store buffer. */
      var buffer;
      /** @type {number} expantion ratio. */

      var ratio = this.input.length / this.ip + 1 | 0;
      /** @type {number} maximum number of huffman code. */

      var maxHuffCode;
      /** @type {number} new output buffer size. */

      var newSize;
      /** @type {number} max inflate size. */

      var maxInflateSize;
      var input = this.input;
      var output = this.output;

      if (opt_param) {
        if (typeof opt_param.fixRatio === 'number') {
          ratio = opt_param.fixRatio;
        }

        if (typeof opt_param.addRatio === 'number') {
          ratio += opt_param.addRatio;
        }
      } // calculate new buffer size


      if (ratio < 2) {
        maxHuffCode = (input.length - this.ip) / this.currentLitlenTable[2];
        maxInflateSize = maxHuffCode / 2 * 258 | 0;
        newSize = maxInflateSize < output.length ? output.length + maxInflateSize : output.length << 1;
      } else {
        newSize = output.length * ratio;
      } // buffer expantion


      {
        buffer = new Uint8Array(newSize);
        buffer.set(output);
      }
      this.output = buffer;
      return this.output;
    };
    /**
     * concat output buffer.
     * @return {!(Array.<number>|Uint8Array)} output buffer.
     */


    Zlib$1.RawInflate.prototype.concatBufferBlock = function () {
      /** @type {number} buffer pointer. */
      var pos = 0;
      /** @type {number} buffer pointer. */

      var limit = this.totalpos + (this.op - Zlib$1.RawInflate.MaxBackwardLength);
      /** @type {!(Array.<number>|Uint8Array)} output block array. */

      var output = this.output;
      /** @type {!Array} blocks array. */

      var blocks = this.blocks;
      /** @type {!(Array.<number>|Uint8Array)} output block array. */

      var block;
      /** @type {!(Array.<number>|Uint8Array)} output buffer. */

      var buffer = new Uint8Array(limit);
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limiter. */

      var il;
      /** @type {number} loop counter. */

      var j;
      /** @type {number} loop limiter. */

      var jl; // single buffer

      if (blocks.length === 0) {
        return this.output.subarray(Zlib$1.RawInflate.MaxBackwardLength, this.op);
      } // copy to buffer


      for (i = 0, il = blocks.length; i < il; ++i) {
        block = blocks[i];

        for (j = 0, jl = block.length; j < jl; ++j) {
          buffer[pos++] = block[j];
        }
      } // current buffer


      for (i = Zlib$1.RawInflate.MaxBackwardLength, il = this.op; i < il; ++i) {
        buffer[pos++] = output[i];
      }

      this.blocks = [];
      this.buffer = buffer;
      return this.buffer;
    };
    /**
     * concat output buffer. (dynamic)
     * @return {!(Array.<number>|Uint8Array)} output buffer.
     */


    Zlib$1.RawInflate.prototype.concatBufferDynamic = function () {
      /** @type {Array.<number>|Uint8Array} output buffer. */
      var buffer;
      var op = this.op;
      {
        if (this.resize) {
          buffer = new Uint8Array(op);
          buffer.set(this.output.subarray(0, op));
        } else {
          buffer = this.output.subarray(0, op);
        }
      }
      this.buffer = buffer;
      return this.buffer;
    };

    var buildHuffmanTable$1 = Zlib$1.Huffman.buildHuffmanTable;
    /**
     * @param {!(Uint8Array|Array.<number>)} input input buffer.
     * @param {number} ip input buffer pointer.
     * @param {number=} opt_buffersize buffer block size.
     * @constructor
     */

    Zlib$1.RawInflateStream = function (input, ip, opt_buffersize) {
      /** @type {!Array.<(Array|Uint8Array)>} */
      this.blocks = [];
      /** @type {number} block size. */

      this.bufferSize = opt_buffersize ? opt_buffersize : ZLIB_STREAM_RAW_INFLATE_BUFFER_SIZE$1;
      /** @type {!number} total output buffer pointer. */

      this.totalpos = 0;
      /** @type {!number} input buffer pointer. */

      this.ip = ip === void 0 ? 0 : ip;
      /** @type {!number} bit stream reader buffer. */

      this.bitsbuf = 0;
      /** @type {!number} bit stream reader buffer size. */

      this.bitsbuflen = 0;
      /** @type {!(Array|Uint8Array)} input buffer. */

      this.input = new Uint8Array(input);
      /** @type {!(Uint8Array|Array)} output buffer. */

      this.output = new Uint8Array(this.bufferSize);
      /** @type {!number} output buffer pointer. */

      this.op = 0;
      /** @type {boolean} is final block flag. */

      this.bfinal = false;
      /** @type {number} uncompressed block length. */

      this.blockLength;
      /** @type {boolean} resize flag for memory size optimization. */

      this.resize = false;
      /** @type {Array} */

      this.litlenTable;
      /** @type {Array} */

      this.distTable;
      /** @type {number} */

      this.sp = 0; // stream pointer

      /** @type {Zlib.RawInflateStream.Status} */

      this.status = Zlib$1.RawInflateStream.Status.INITIALIZED; //
      // backup
      //

      /** @type {!number} */

      this.ip_;
      /** @type {!number} */

      this.bitsbuflen_;
      /** @type {!number} */

      this.bitsbuf_;
    };
    /**
     * @enum {number}
     */


    Zlib$1.RawInflateStream.BlockType = {
      UNCOMPRESSED: 0,
      FIXED: 1,
      DYNAMIC: 2
    };
    /**
     * @enum {number}
     */

    Zlib$1.RawInflateStream.Status = {
      INITIALIZED: 0,
      BLOCK_HEADER_START: 1,
      BLOCK_HEADER_END: 2,
      BLOCK_BODY_START: 3,
      BLOCK_BODY_END: 4,
      DECODE_BLOCK_START: 5,
      DECODE_BLOCK_END: 6
    };
    /**
     * decompress.
     * @return {!(Uint8Array|Array)} inflated buffer.
     */

    Zlib$1.RawInflateStream.prototype.decompress = function (newInput, ip) {
      /** @type {boolean} */
      var stop = false;

      if (newInput !== void 0) {
        this.input = newInput;
      }

      if (ip !== void 0) {
        this.ip = ip;
      } // decompress


      while (!stop) {
        switch (this.status) {
          // block header
          case Zlib$1.RawInflateStream.Status.INITIALIZED:
          case Zlib$1.RawInflateStream.Status.BLOCK_HEADER_START:
            if (this.readBlockHeader() < 0) {
              stop = true;
            }

            break;
          // block body

          case Zlib$1.RawInflateStream.Status.BLOCK_HEADER_END:
          /* FALLTHROUGH */

          case Zlib$1.RawInflateStream.Status.BLOCK_BODY_START:
            switch (this.currentBlockType) {
              case Zlib$1.RawInflateStream.BlockType.UNCOMPRESSED:
                if (this.readUncompressedBlockHeader() < 0) {
                  stop = true;
                }

                break;

              case Zlib$1.RawInflateStream.BlockType.FIXED:
                if (this.parseFixedHuffmanBlock() < 0) {
                  stop = true;
                }

                break;

              case Zlib$1.RawInflateStream.BlockType.DYNAMIC:
                if (this.parseDynamicHuffmanBlock() < 0) {
                  stop = true;
                }

                break;
            }

            break;
          // decode data

          case Zlib$1.RawInflateStream.Status.BLOCK_BODY_END:
          case Zlib$1.RawInflateStream.Status.DECODE_BLOCK_START:
            switch (this.currentBlockType) {
              case Zlib$1.RawInflateStream.BlockType.UNCOMPRESSED:
                if (this.parseUncompressedBlock() < 0) {
                  stop = true;
                }

                break;

              case Zlib$1.RawInflateStream.BlockType.FIXED:
              /* FALLTHROUGH */

              case Zlib$1.RawInflateStream.BlockType.DYNAMIC:
                if (this.decodeHuffman() < 0) {
                  stop = true;
                }

                break;
            }

            break;

          case Zlib$1.RawInflateStream.Status.DECODE_BLOCK_END:
            if (this.bfinal) {
              stop = true;
            } else {
              this.status = Zlib$1.RawInflateStream.Status.INITIALIZED;
            }

            break;
        }
      }

      return this.concatBuffer();
    };
    /**
     * @const
     * @type {number} max backward length for LZ77.
     */


    Zlib$1.RawInflateStream.MaxBackwardLength = 32768;
    /**
     * @const
     * @type {number} max copy length for LZ77.
     */

    Zlib$1.RawInflateStream.MaxCopyLength = 258;
    /**
     * huffman order
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */

    Zlib$1.RawInflateStream.Order = function (table) {
      return new Uint16Array(table);
    }([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    /**
     * huffman length code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib$1.RawInflateStream.LengthCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000a, 0x000b, 0x000d, 0x000f, 0x0011, 0x0013, 0x0017, 0x001b, 0x001f, 0x0023, 0x002b, 0x0033, 0x003b, 0x0043, 0x0053, 0x0063, 0x0073, 0x0083, 0x00a3, 0x00c3, 0x00e3, 0x0102, 0x0102, 0x0102]);
    /**
     * huffman length extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib$1.RawInflateStream.LengthExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0]);
    /**
     * huffman dist code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib$1.RawInflateStream.DistCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d, 0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1, 0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01, 0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001]);
    /**
     * huffman dist extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib$1.RawInflateStream.DistExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
    /**
     * fixed huffman length code table
     * @const
     * @type {!Array}
     */


    Zlib$1.RawInflateStream.FixedLiteralLengthTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(288);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = i <= 143 ? 8 : i <= 255 ? 9 : i <= 279 ? 7 : 8;
      }

      return buildHuffmanTable$1(lengths);
    }());
    /**
     * fixed huffman distance code table
     * @const
     * @type {!Array}
     */


    Zlib$1.RawInflateStream.FixedDistanceTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(30);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = 5;
      }

      return buildHuffmanTable$1(lengths);
    }());
    /**
     * parse deflated block.
     */


    Zlib$1.RawInflateStream.prototype.readBlockHeader = function () {
      /** @type {number} header */
      var hdr;
      this.status = Zlib$1.RawInflateStream.Status.BLOCK_HEADER_START;
      this.save_();

      if ((hdr = this.readBits(3)) < 0) {
        this.restore_();
        return -1;
      } // BFINAL


      if (hdr & 0x1) {
        this.bfinal = true;
      } // BTYPE


      hdr >>>= 1;

      switch (hdr) {
        case 0:
          // uncompressed
          this.currentBlockType = Zlib$1.RawInflateStream.BlockType.UNCOMPRESSED;
          break;

        case 1:
          // fixed huffman
          this.currentBlockType = Zlib$1.RawInflateStream.BlockType.FIXED;
          break;

        case 2:
          // dynamic huffman
          this.currentBlockType = Zlib$1.RawInflateStream.BlockType.DYNAMIC;
          break;

        default:
          // reserved or other
          throw new Error('unknown BTYPE: ' + hdr);
      }

      this.status = Zlib$1.RawInflateStream.Status.BLOCK_HEADER_END;
    };
    /**
     * read inflate bits
     * @param {number} length bits length.
     * @return {number} read bits.
     */


    Zlib$1.RawInflateStream.prototype.readBits = function (length) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {number} input and output byte. */

      var octet; // not enough buffer

      while (bitsbuflen < length) {
        // input byte
        if (input.length <= ip) {
          return -1;
        }

        octet = input[ip++]; // concat octet

        bitsbuf |= octet << bitsbuflen;
        bitsbuflen += 8;
      } // output byte


      octet = bitsbuf &
      /* MASK */
      (1 << length) - 1;
      bitsbuf >>>= length;
      bitsbuflen -= length;
      this.bitsbuf = bitsbuf;
      this.bitsbuflen = bitsbuflen;
      this.ip = ip;
      return octet;
    };
    /**
     * read huffman code using table
     * @param {Array} table huffman code table.
     * @return {number} huffman code.
     */


    Zlib$1.RawInflateStream.prototype.readCodeByTable = function (table) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {!(Array|Uint8Array)} huffman code table */

      var codeTable = table[0];
      /** @type {number} */

      var maxCodeLength = table[1];
      /** @type {number} input byte */

      var octet;
      /** @type {number} code length & code (16bit, 16bit) */

      var codeWithLength;
      /** @type {number} code bits length */

      var codeLength; // not enough buffer

      while (bitsbuflen < maxCodeLength) {
        if (input.length <= ip) {
          return -1;
        }

        octet = input[ip++];
        bitsbuf |= octet << bitsbuflen;
        bitsbuflen += 8;
      } // read max length


      codeWithLength = codeTable[bitsbuf & (1 << maxCodeLength) - 1];
      codeLength = codeWithLength >>> 16;

      if (codeLength > bitsbuflen) {
        throw new Error('invalid code length: ' + codeLength);
      }

      this.bitsbuf = bitsbuf >> codeLength;
      this.bitsbuflen = bitsbuflen - codeLength;
      this.ip = ip;
      return codeWithLength & 0xffff;
    };
    /**
     * read uncompressed block header
     */


    Zlib$1.RawInflateStream.prototype.readUncompressedBlockHeader = function () {
      /** @type {number} block length */
      var len;
      /** @type {number} number for check block length */

      var nlen;
      var input = this.input;
      var ip = this.ip;
      this.status = Zlib$1.RawInflateStream.Status.BLOCK_BODY_START;

      if (ip + 4 >= input.length) {
        return -1;
      }

      len = input[ip++] | input[ip++] << 8;
      nlen = input[ip++] | input[ip++] << 8; // check len & nlen

      if (len === ~nlen) {
        throw new Error('invalid uncompressed block header: length verify');
      } // skip buffered header bits


      this.bitsbuf = 0;
      this.bitsbuflen = 0;
      this.ip = ip;
      this.blockLength = len;
      this.status = Zlib$1.RawInflateStream.Status.BLOCK_BODY_END;
    };
    /**
     * parse uncompressed block.
     */


    Zlib$1.RawInflateStream.prototype.parseUncompressedBlock = function () {
      var input = this.input;
      var ip = this.ip;
      var output = this.output;
      var op = this.op;
      var len = this.blockLength;
      this.status = Zlib$1.RawInflateStream.Status.DECODE_BLOCK_START; // copy
      // XXX: とりあえず素直にコピー

      while (len--) {
        if (op === output.length) {
          output = this.expandBuffer({
            fixRatio: 2
          });
        } // not enough input buffer


        if (ip >= input.length) {
          this.ip = ip;
          this.op = op;
          this.blockLength = len + 1; // コピーしてないので戻す

          return -1;
        }

        output[op++] = input[ip++];
      }

      if (len < 0) {
        this.status = Zlib$1.RawInflateStream.Status.DECODE_BLOCK_END;
      }

      this.ip = ip;
      this.op = op;
      return 0;
    };
    /**
     * parse fixed huffman block.
     */


    Zlib$1.RawInflateStream.prototype.parseFixedHuffmanBlock = function () {
      this.status = Zlib$1.RawInflateStream.Status.BLOCK_BODY_START;
      this.litlenTable = Zlib$1.RawInflateStream.FixedLiteralLengthTable;
      this.distTable = Zlib$1.RawInflateStream.FixedDistanceTable;
      this.status = Zlib$1.RawInflateStream.Status.BLOCK_BODY_END;
      return 0;
    };
    /**
     * オブジェクトのコンテキストを別のプロパティに退避する.
     * @private
     */


    Zlib$1.RawInflateStream.prototype.save_ = function () {
      this.ip_ = this.ip;
      this.bitsbuflen_ = this.bitsbuflen;
      this.bitsbuf_ = this.bitsbuf;
    };
    /**
     * 別のプロパティに退避したコンテキストを復元する.
     * @private
     */


    Zlib$1.RawInflateStream.prototype.restore_ = function () {
      this.ip = this.ip_;
      this.bitsbuflen = this.bitsbuflen_;
      this.bitsbuf = this.bitsbuf_;
    };
    /**
     * parse dynamic huffman block.
     */


    Zlib$1.RawInflateStream.prototype.parseDynamicHuffmanBlock = function () {
      /** @type {number} number of literal and length codes. */
      var hlit;
      /** @type {number} number of distance codes. */

      var hdist;
      /** @type {number} number of code lengths. */

      var hclen;
      /** @type {!(Uint8Array|Array)} code lengths. */

      var codeLengths = new Uint8Array(Zlib$1.RawInflateStream.Order.length);
      /** @type {!Array} code lengths table. */

      var codeLengthsTable;
      this.status = Zlib$1.RawInflateStream.Status.BLOCK_BODY_START;
      this.save_();
      hlit = this.readBits(5) + 257;
      hdist = this.readBits(5) + 1;
      hclen = this.readBits(4) + 4;

      if (hlit < 0 || hdist < 0 || hclen < 0) {
        this.restore_();
        return -1;
      }

      try {
        parseDynamicHuffmanBlockImpl.call(this);
      } catch (e) {
        this.restore_();
        return -1;
      }

      function parseDynamicHuffmanBlockImpl() {
        /** @type {number} */
        var bits;
        var code;
        var prev = 0;
        var repeat;
        /** @type {!(Uint8Array|Array.<number>)} code length table. */

        var lengthTable;
        /** @type {number} loop counter. */

        var i;
        /** @type {number} loop limit. */

        var il; // decode code lengths

        for (i = 0; i < hclen; ++i) {
          if ((bits = this.readBits(3)) < 0) {
            throw new Error('not enough input');
          }

          codeLengths[Zlib$1.RawInflateStream.Order[i]] = bits;
        } // decode length table


        codeLengthsTable = buildHuffmanTable$1(codeLengths);
        lengthTable = new Uint8Array(hlit + hdist);

        for (i = 0, il = hlit + hdist; i < il;) {
          code = this.readCodeByTable(codeLengthsTable);

          if (code < 0) {
            throw new Error('not enough input');
          }

          switch (code) {
            case 16:
              if ((bits = this.readBits(2)) < 0) {
                throw new Error('not enough input');
              }

              repeat = 3 + bits;

              while (repeat--) {
                lengthTable[i++] = prev;
              }

              break;

            case 17:
              if ((bits = this.readBits(3)) < 0) {
                throw new Error('not enough input');
              }

              repeat = 3 + bits;

              while (repeat--) {
                lengthTable[i++] = 0;
              }

              prev = 0;
              break;

            case 18:
              if ((bits = this.readBits(7)) < 0) {
                throw new Error('not enough input');
              }

              repeat = 11 + bits;

              while (repeat--) {
                lengthTable[i++] = 0;
              }

              prev = 0;
              break;

            default:
              lengthTable[i++] = code;
              prev = code;
              break;
          }
        }

        this.litlenTable = buildHuffmanTable$1(lengthTable.subarray(0, hlit));
        this.distTable = buildHuffmanTable$1(lengthTable.subarray(hlit));
      }

      this.status = Zlib$1.RawInflateStream.Status.BLOCK_BODY_END;
      return 0;
    };
    /**
     * decode huffman code (dynamic)
     * @return {(number|undefined)} -1 is error.
     */


    Zlib$1.RawInflateStream.prototype.decodeHuffman = function () {
      var output = this.output;
      var op = this.op;
      /** @type {number} huffman code. */

      var code;
      /** @type {number} table index. */

      var ti;
      /** @type {number} huffman code distination. */

      var codeDist;
      /** @type {number} huffman code length. */

      var codeLength;
      var litlen = this.litlenTable;
      var dist = this.distTable;
      var olength = output.length;
      var bits;
      this.status = Zlib$1.RawInflateStream.Status.DECODE_BLOCK_START;

      while (true) {
        this.save_();
        code = this.readCodeByTable(litlen);

        if (code < 0) {
          this.op = op;
          this.restore_();
          return -1;
        }

        if (code === 256) {
          break;
        } // literal


        if (code < 256) {
          if (op === olength) {
            output = this.expandBuffer();
            olength = output.length;
          }

          output[op++] = code;
          continue;
        } // length code


        ti = code - 257;
        codeLength = Zlib$1.RawInflateStream.LengthCodeTable[ti];

        if (Zlib$1.RawInflateStream.LengthExtraTable[ti] > 0) {
          bits = this.readBits(Zlib$1.RawInflateStream.LengthExtraTable[ti]);

          if (bits < 0) {
            this.op = op;
            this.restore_();
            return -1;
          }

          codeLength += bits;
        } // dist code


        code = this.readCodeByTable(dist);

        if (code < 0) {
          this.op = op;
          this.restore_();
          return -1;
        }

        codeDist = Zlib$1.RawInflateStream.DistCodeTable[code];

        if (Zlib$1.RawInflateStream.DistExtraTable[code] > 0) {
          bits = this.readBits(Zlib$1.RawInflateStream.DistExtraTable[code]);

          if (bits < 0) {
            this.op = op;
            this.restore_();
            return -1;
          }

          codeDist += bits;
        } // lz77 decode


        if (op + codeLength >= olength) {
          output = this.expandBuffer();
          olength = output.length;
        }

        while (codeLength--) {
          output[op] = output[op++ - codeDist];
        } // break


        if (this.ip === this.input.length) {
          this.op = op;
          return -1;
        }
      }

      while (this.bitsbuflen >= 8) {
        this.bitsbuflen -= 8;
        this.ip--;
      }

      this.op = op;
      this.status = Zlib$1.RawInflateStream.Status.DECODE_BLOCK_END;
    };
    /**
     * expand output buffer. (dynamic)
     * @param {Object=} opt_param option parameters.
     * @return {!(Array|Uint8Array)} output buffer pointer.
     */


    Zlib$1.RawInflateStream.prototype.expandBuffer = function (opt_param) {
      /** @type {!(Array|Uint8Array)} store buffer. */
      var buffer;
      /** @type {number} expantion ratio. */

      var ratio = this.input.length / this.ip + 1 | 0;
      /** @type {number} maximum number of huffman code. */

      var maxHuffCode;
      /** @type {number} new output buffer size. */

      var newSize;
      /** @type {number} max inflate size. */

      var maxInflateSize;
      var input = this.input;
      var output = this.output;

      if (opt_param) {
        if (typeof opt_param.fixRatio === 'number') {
          ratio = opt_param.fixRatio;
        }

        if (typeof opt_param.addRatio === 'number') {
          ratio += opt_param.addRatio;
        }
      } // calculate new buffer size


      if (ratio < 2) {
        maxHuffCode = (input.length - this.ip) / this.litlenTable[2];
        maxInflateSize = maxHuffCode / 2 * 258 | 0;
        newSize = maxInflateSize < output.length ? output.length + maxInflateSize : output.length << 1;
      } else {
        newSize = output.length * ratio;
      } // buffer expantion


      {
        buffer = new Uint8Array(newSize);
        buffer.set(output);
      }
      this.output = buffer;
      return this.output;
    };
    /**
     * concat output buffer. (dynamic)
     * @return {!(Array|Uint8Array)} output buffer.
     */


    Zlib$1.RawInflateStream.prototype.concatBuffer = function () {
      /** @type {!(Array|Uint8Array)} output buffer. */
      var buffer;
      /** @type {number} */

      var op = this.op;
      /** @type {Uint8Array} */

      var tmp;

      if (this.resize) {
        {
          buffer = new Uint8Array(this.output.subarray(this.sp, op));
        }
      } else {
        buffer = this.output.subarray(this.sp, op);
      }

      this.sp = op; // compaction

      if (op > Zlib$1.RawInflateStream.MaxBackwardLength + this.bufferSize) {
        this.op = this.sp = Zlib$1.RawInflateStream.MaxBackwardLength;
        {
          tmp =
          /** @type {Uint8Array} */
          this.output;
          this.output = new Uint8Array(this.bufferSize + Zlib$1.RawInflateStream.MaxBackwardLength);
          this.output.set(tmp.subarray(op - Zlib$1.RawInflateStream.MaxBackwardLength, op));
        }
      }

      return buffer;
    };
    /**
     * @constructor
     * @param {!(Uint8Array|Array)} input deflated buffer.
     * @param {Object=} opt_params option parameters.
     *
     * opt_params は以下のプロパティを指定する事ができます。
     *   - index: input buffer の deflate コンテナの開始位置.
     *   - blockSize: バッファのブロックサイズ.
     *   - verify: 伸張が終わった後 adler-32 checksum の検証を行うか.
     *   - bufferType: Zlib.Inflate.BufferType の値によってバッファの管理方法を指定する.
     *       Zlib.Inflate.BufferType は Zlib.RawInflate.BufferType のエイリアス.
     */


    Zlib$1.Inflate = function (input, opt_params) {
      /** @type {number} */
      var cmf;
      /** @type {number} */

      var flg;
      /** @type {!(Uint8Array|Array)} */

      this.input = input;
      /** @type {number} */

      this.ip = 0;
      /** @type {Zlib.RawInflate} */

      this.rawinflate;
      /** @type {(boolean|undefined)} verify flag. */

      this.verify; // option parameters

      if (opt_params || !(opt_params = {})) {
        if (opt_params['index']) {
          this.ip = opt_params['index'];
        }

        if (opt_params['verify']) {
          this.verify = opt_params['verify'];
        }
      } // Compression Method and Flags


      cmf = input[this.ip++];
      flg = input[this.ip++]; // compression method

      switch (cmf & 0x0f) {
        case Zlib$1.CompressionMethod.DEFLATE:
          this.method = Zlib$1.CompressionMethod.DEFLATE;
          break;

        default:
          throw new Error('unsupported compression method');
      } // fcheck


      if (((cmf << 8) + flg) % 31 !== 0) {
        throw new Error('invalid fcheck flag:' + ((cmf << 8) + flg) % 31);
      } // fdict (not supported)


      if (flg & 0x20) {
        throw new Error('fdict flag is not supported');
      } // RawInflate


      this.rawinflate = new Zlib$1.RawInflate(input, {
        'index': this.ip,
        'bufferSize': opt_params['bufferSize'],
        'bufferType': opt_params['bufferType'],
        'resize': opt_params['resize']
      });
    };
    /**
     * @enum {number}
     */


    Zlib$1.Inflate.BufferType = Zlib$1.RawInflate.BufferType;
    /**
     * decompress.
     * @return {!(Uint8Array|Array)} inflated buffer.
     */

    Zlib$1.Inflate.prototype.decompress = function () {
      /** @type {!(Array|Uint8Array)} input buffer. */
      var input = this.input;
      /** @type {!(Uint8Array|Array)} inflated buffer. */

      var buffer;
      /** @type {number} adler-32 checksum */

      var adler32;
      buffer = this.rawinflate.decompress();
      this.ip = this.rawinflate.ip; // verify adler-32

      if (this.verify) {
        adler32 = (input[this.ip++] << 24 | input[this.ip++] << 16 | input[this.ip++] << 8 | input[this.ip++]) >>> 0;

        if (adler32 !== Zlib$1.Adler32(buffer)) {
          throw new Error('invalid adler-32 checksum');
        }
      }

      return buffer;
    };
    /* vim:set expandtab ts=2 sw=2 tw=80: */

    /**
     * @param {!(Uint8Array|Array)} input deflated buffer.
     * @constructor
     */


    Zlib$1.InflateStream = function (input) {
      /** @type {!(Uint8Array|Array)} */
      this.input = input === void 0 ? new Uint8Array() : input;
      /** @type {number} */

      this.ip = 0;
      /** @type {Zlib.RawInflateStream} */

      this.rawinflate = new Zlib$1.RawInflateStream(this.input, this.ip);
      /** @type {Zlib.CompressionMethod} */

      this.method;
      /** @type {!(Array|Uint8Array)} */

      this.output = this.rawinflate.output;
    };
    /**
     * decompress.
     * @return {!(Uint8Array|Array)} inflated buffer.
     */


    Zlib$1.InflateStream.prototype.decompress = function (input) {
      /** @type {!(Uint8Array|Array)} inflated buffer. */
      var buffer; // 新しい入力を入力バッファに結合する
      // XXX Array, Uint8Array のチェックを行うか確認する

      if (input !== void 0) {
        {
          var tmp = new Uint8Array(this.input.length + input.length);
          tmp.set(this.input, 0);
          tmp.set(input, this.input.length);
          this.input = tmp;
        }
      }

      if (this.method === void 0) {
        if (this.readHeader() < 0) {
          return new Uint8Array();
        }
      }

      buffer = this.rawinflate.decompress(this.input, this.ip);

      if (this.rawinflate.ip !== 0) {
        this.input = this.input.subarray(this.rawinflate.ip);
        this.ip = 0;
      } // verify adler-32

      /*
      if (this.verify) {
        adler32 =
          input[this.ip++] << 24 | input[this.ip++] << 16 |
          input[this.ip++] << 8 | input[this.ip++];
         if (adler32 !== Zlib.Adler32(buffer)) {
          throw new Error('invalid adler-32 checksum');
        }
      }
      */


      return buffer;
    };

    Zlib$1.InflateStream.prototype.readHeader = function () {
      var ip = this.ip;
      var input = this.input; // Compression Method and Flags

      var cmf = input[ip++];
      var flg = input[ip++];

      if (cmf === void 0 || flg === void 0) {
        return -1;
      } // compression method


      switch (cmf & 0x0f) {
        case Zlib$1.CompressionMethod.DEFLATE:
          this.method = Zlib$1.CompressionMethod.DEFLATE;
          break;

        default:
          throw new Error('unsupported compression method');
      } // fcheck


      if (((cmf << 8) + flg) % 31 !== 0) {
        throw new Error('invalid fcheck flag:' + ((cmf << 8) + flg) % 31);
      } // fdict (not supported)


      if (flg & 0x20) {
        throw new Error('fdict flag is not supported');
      }

      this.ip = ip;
    };
    /**
     * @fileoverview GZIP (RFC1952) 展開コンテナ実装.
     */

    /**
     * @constructor
     * @param {!(Array|Uint8Array)} input input buffer.
     * @param {Object=} opt_params option parameters.
     */


    Zlib$1.Gunzip = function (input, opt_params) {
      /** @type {!(Array.<number>|Uint8Array)} input buffer. */
      this.input = input;
      /** @type {number} input buffer pointer. */

      this.ip = 0;
      /** @type {Array.<Zlib.GunzipMember>} */

      this.member = [];
      /** @type {boolean} */

      this.decompressed = false;
    };
    /**
     * @return {Array.<Zlib.GunzipMember>}
     */


    Zlib$1.Gunzip.prototype.getMembers = function () {
      if (!this.decompressed) {
        this.decompress();
      }

      return this.member.slice();
    };
    /**
     * inflate gzip data.
     * @return {!(Array.<number>|Uint8Array)} inflated buffer.
     */


    Zlib$1.Gunzip.prototype.decompress = function () {
      /** @type {number} input length. */
      var il = this.input.length;

      while (this.ip < il) {
        this.decodeMember();
      }

      this.decompressed = true;
      return this.concatMember();
    };
    /**
     * decode gzip member.
     */


    Zlib$1.Gunzip.prototype.decodeMember = function () {
      /** @type {Zlib.GunzipMember} */
      var member = new Zlib$1.GunzipMember();
      /** @type {number} */

      var isize;
      /** @type {Zlib.RawInflate} RawInflate implementation. */

      var rawinflate;
      /** @type {!(Array.<number>|Uint8Array)} inflated data. */

      var inflated;
      /** @type {number} inflate size */

      var inflen;
      /** @type {number} character code */

      var c;
      /** @type {number} character index in string. */

      var ci;
      /** @type {Array.<string>} character array. */

      var str;
      /** @type {number} modification time. */

      var mtime;
      /** @type {number} */

      var crc32;
      var input = this.input;
      var ip = this.ip;
      member.id1 = input[ip++];
      member.id2 = input[ip++]; // check signature

      if (member.id1 !== 0x1f || member.id2 !== 0x8b) {
        throw new Error('invalid file signature:' + member.id1 + ',' + member.id2);
      } // check compression method


      member.cm = input[ip++];

      switch (member.cm) {
        case 8:
          /* XXX: use Zlib const */
          break;

        default:
          throw new Error('unknown compression method: ' + member.cm);
      } // flags


      member.flg = input[ip++]; // modification time

      mtime = input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24;
      member.mtime = new Date(mtime * 1000); // extra flags

      member.xfl = input[ip++]; // operating system

      member.os = input[ip++]; // extra

      if ((member.flg & Zlib$1.Gzip.FlagsMask.FEXTRA) > 0) {
        member.xlen = input[ip++] | input[ip++] << 8;
        ip = this.decodeSubField(ip, member.xlen);
      } // fname


      if ((member.flg & Zlib$1.Gzip.FlagsMask.FNAME) > 0) {
        for (str = [], ci = 0; (c = input[ip++]) > 0;) {
          str[ci++] = String.fromCharCode(c);
        }

        member.name = str.join('');
      } // fcomment


      if ((member.flg & Zlib$1.Gzip.FlagsMask.FCOMMENT) > 0) {
        for (str = [], ci = 0; (c = input[ip++]) > 0;) {
          str[ci++] = String.fromCharCode(c);
        }

        member.comment = str.join('');
      } // fhcrc


      if ((member.flg & Zlib$1.Gzip.FlagsMask.FHCRC) > 0) {
        member.crc16 = Zlib$1.CRC32.calc(input, 0, ip) & 0xffff;

        if (member.crc16 !== (input[ip++] | input[ip++] << 8)) {
          throw new Error('invalid header crc16');
        }
      } // isize を事前に取得すると展開後のサイズが分かるため、
      // inflate処理のバッファサイズが事前に分かり、高速になる


      isize = input[input.length - 4] | input[input.length - 3] << 8 | input[input.length - 2] << 16 | input[input.length - 1] << 24; // isize の妥当性チェック
      // ハフマン符号では最小 2-bit のため、最大で 1/4 になる
      // LZ77 符号では 長さと距離 2-Byte で最大 258-Byte を表現できるため、
      // 1/128 になるとする
      // ここから入力バッファの残りが isize の 512 倍以上だったら
      // サイズ指定のバッファ確保は行わない事とする

      if (input.length - ip -
      /* CRC-32 */
      4 -
      /* ISIZE */
      4 < isize * 512) {
        inflen = isize;
      } // compressed block


      rawinflate = new Zlib$1.RawInflate(input, {
        'index': ip,
        'bufferSize': inflen
      });
      member.data = inflated = rawinflate.decompress();
      ip = rawinflate.ip; // crc32

      member.crc32 = crc32 = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0;

      if (Zlib$1.CRC32.calc(inflated) !== crc32) {
        throw new Error('invalid CRC-32 checksum: 0x' + Zlib$1.CRC32.calc(inflated).toString(16) + ' / 0x' + crc32.toString(16));
      } // input size


      member.isize = isize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0;

      if ((inflated.length & 0xffffffff) !== isize) {
        throw new Error('invalid input size: ' + (inflated.length & 0xffffffff) + ' / ' + isize);
      }

      this.member.push(member);
      this.ip = ip;
    };
    /**
     * サブフィールドのデコード
     * XXX: 現在は何もせずスキップする
     */


    Zlib$1.Gunzip.prototype.decodeSubField = function (ip, length) {
      return ip + length;
    };
    /**
     * @return {!(Array.<number>|Uint8Array)}
     */


    Zlib$1.Gunzip.prototype.concatMember = function () {
      /** @type {Array.<Zlib.GunzipMember>} */
      var member = this.member;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      /** @type {number} */

      var p = 0;
      /** @type {number} */

      var size = 0;
      /** @type {!(Array.<number>|Uint8Array)} */

      var buffer;

      for (i = 0, il = member.length; i < il; ++i) {
        size += member[i].data.length;
      }

      {
        buffer = new Uint8Array(size);

        for (i = 0; i < il; ++i) {
          buffer.set(member[i].data, p);
          p += member[i].data.length;
        }
      }
      return buffer;
    };
    /**
     * @constructor
     */


    Zlib$1.GunzipMember = function () {
      /** @type {number} signature first byte. */
      this.id1;
      /** @type {number} signature second byte. */

      this.id2;
      /** @type {number} compression method. */

      this.cm;
      /** @type {number} flags. */

      this.flg;
      /** @type {Date} modification time. */

      this.mtime;
      /** @type {number} extra flags. */

      this.xfl;
      /** @type {number} operating system number. */

      this.os;
      /** @type {number} CRC-16 value for FHCRC flag. */

      this.crc16;
      /** @type {number} extra length. */

      this.xlen;
      /** @type {number} CRC-32 value for verification. */

      this.crc32;
      /** @type {number} input size modulo 32 value. */

      this.isize;
      /** @type {string} filename. */

      this.name;
      /** @type {string} comment. */

      this.comment;
      /** @type {!(Uint8Array|Array.<number>)} */

      this.data;
    };

    Zlib$1.GunzipMember.prototype.getName = function () {
      return this.name;
    };

    Zlib$1.GunzipMember.prototype.getData = function () {
      return this.data;
    };

    Zlib$1.GunzipMember.prototype.getMtime = function () {
      return this.mtime;
    };
    /**
     * @fileoverview GZIP (RFC1952) 実装.
     */

    /**
     * @constructor
     * @param {!(Array|Uint8Array)} input input buffer.
     * @param {Object=} opt_params option parameters.
     */


    Zlib$1.Gzip = function (input, opt_params) {
      /** @type {!(Array.<number>|Uint8Array)} input buffer. */
      this.input = input;
      /** @type {number} input buffer pointer. */

      this.ip = 0;
      /** @type {!(Array.<number>|Uint8Array)} output buffer. */

      this.output;
      /** @type {number} output buffer. */

      this.op = 0;
      /** @type {!Object} flags option flags. */

      this.flags = {};
      /** @type {!string} filename. */

      this.filename;
      /** @type {!string} comment. */

      this.comment;
      /** @type {!Object} deflate options. */

      this.deflateOptions; // option parameters

      if (opt_params) {
        if (opt_params['flags']) {
          this.flags = opt_params['flags'];
        }

        if (typeof opt_params['filename'] === 'string') {
          this.filename = opt_params['filename'];
        }

        if (typeof opt_params['comment'] === 'string') {
          this.comment = opt_params['comment'];
        }

        if (opt_params['deflateOptions']) {
          this.deflateOptions = opt_params['deflateOptions'];
        }
      }

      if (!this.deflateOptions) {
        this.deflateOptions = {};
      }
    };
    /**
     * @type {number}
     * @const
     */


    Zlib$1.Gzip.DefaultBufferSize = 0x8000;
    /**
     * encode gzip members.
     * @return {!(Array|Uint8Array)} gzip binary array.
     */

    Zlib$1.Gzip.prototype.compress = function () {
      /** @type {number} flags. */
      var flg;
      /** @type {number} modification time. */

      var mtime;
      /** @type {number} CRC-16 value for FHCRC flag. */

      var crc16;
      /** @type {number} CRC-32 value for verification. */

      var crc32;
      /** @type {!Zlib.RawDeflate} raw deflate object. */

      var rawdeflate;
      /** @type {number} character code */

      var c;
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limiter. */

      var il;
      /** @type {!(Array|Uint8Array)} output buffer. */

      var output = new Uint8Array(Zlib$1.Gzip.DefaultBufferSize);
      /** @type {number} output buffer pointer. */

      var op = 0;
      var input = this.input;
      var ip = this.ip;
      var filename = this.filename;
      var comment = this.comment; // check signature

      output[op++] = 0x1f;
      output[op++] = 0x8b; // check compression method

      output[op++] = 8;
      /* XXX: use Zlib const */
      // flags

      flg = 0;
      if (this.flags['fname']) flg |= Zlib$1.Gzip.FlagsMask.FNAME;
      if (this.flags['fcomment']) flg |= Zlib$1.Gzip.FlagsMask.FCOMMENT;
      if (this.flags['fhcrc']) flg |= Zlib$1.Gzip.FlagsMask.FHCRC; // XXX: FTEXT
      // XXX: FEXTRA

      output[op++] = flg; // modification time

      mtime = (Date.now ? Date.now() : +new Date()) / 1000 | 0;
      output[op++] = mtime & 0xff;
      output[op++] = mtime >>> 8 & 0xff;
      output[op++] = mtime >>> 16 & 0xff;
      output[op++] = mtime >>> 24 & 0xff; // extra flags

      output[op++] = 0; // operating system

      output[op++] = Zlib$1.Gzip.OperatingSystem.UNKNOWN; // extra

      /* NOP */
      // fname

      if (this.flags['fname'] !== void 0) {
        for (i = 0, il = filename.length; i < il; ++i) {
          c = filename.charCodeAt(i);

          if (c > 0xff) {
            output[op++] = c >>> 8 & 0xff;
          }

          output[op++] = c & 0xff;
        }

        output[op++] = 0; // null termination
      } // fcomment


      if (this.flags['comment']) {
        for (i = 0, il = comment.length; i < il; ++i) {
          c = comment.charCodeAt(i);

          if (c > 0xff) {
            output[op++] = c >>> 8 & 0xff;
          }

          output[op++] = c & 0xff;
        }

        output[op++] = 0; // null termination
      } // fhcrc


      if (this.flags['fhcrc']) {
        crc16 = Zlib$1.CRC32.calc(output, 0, op) & 0xffff;
        output[op++] = crc16 & 0xff;
        output[op++] = crc16 >>> 8 & 0xff;
      } // add compress option


      this.deflateOptions['outputBuffer'] = output;
      this.deflateOptions['outputIndex'] = op; // compress

      rawdeflate = new Zlib$1.RawDeflate(input, this.deflateOptions);
      output = rawdeflate.compress();
      op = rawdeflate.op; // expand buffer

      {
        if (op + 8 > output.buffer.byteLength) {
          this.output = new Uint8Array(op + 8);
          this.output.set(new Uint8Array(output.buffer));
          output = this.output;
        } else {
          output = new Uint8Array(output.buffer);
        }
      } // crc32

      crc32 = Zlib$1.CRC32.calc(input);
      output[op++] = crc32 & 0xff;
      output[op++] = crc32 >>> 8 & 0xff;
      output[op++] = crc32 >>> 16 & 0xff;
      output[op++] = crc32 >>> 24 & 0xff; // input size

      il = input.length;
      output[op++] = il & 0xff;
      output[op++] = il >>> 8 & 0xff;
      output[op++] = il >>> 16 & 0xff;
      output[op++] = il >>> 24 & 0xff;
      this.ip = ip;

      if (op < output.length) {
        this.output = output = output.subarray(0, op);
      }

      return output;
    };
    /** @enum {number} */


    Zlib$1.Gzip.OperatingSystem = {
      FAT: 0,
      AMIGA: 1,
      VMS: 2,
      UNIX: 3,
      VM_CMS: 4,
      ATARI_TOS: 5,
      HPFS: 6,
      MACINTOSH: 7,
      Z_SYSTEM: 8,
      CP_M: 9,
      TOPS_20: 10,
      NTFS: 11,
      QDOS: 12,
      ACORN_RISCOS: 13,
      UNKNOWN: 255
    };
    /** @enum {number} */

    Zlib$1.Gzip.FlagsMask = {
      FTEXT: 0x01,
      FHCRC: 0x02,
      FEXTRA: 0x04,
      FNAME: 0x08,
      FCOMMENT: 0x10
    };
    /**
     * @fileoverview Heap Sort 実装. ハフマン符号化で使用する.
     */

    /**
     * カスタムハフマン符号で使用するヒープ実装
     * @param {number} length ヒープサイズ.
     * @constructor
     */

    Zlib$1.Heap = function (length) {
      this.buffer = new Uint16Array(length * 2);
      this.length = 0;
    };
    /**
     * 親ノードの index 取得
     * @param {number} index 子ノードの index.
     * @return {number} 親ノードの index.
     *
     */


    Zlib$1.Heap.prototype.getParent = function (index) {
      return ((index - 2) / 4 | 0) * 2;
    };
    /**
     * 子ノードの index 取得
     * @param {number} index 親ノードの index.
     * @return {number} 子ノードの index.
     */


    Zlib$1.Heap.prototype.getChild = function (index) {
      return 2 * index + 2;
    };
    /**
     * Heap に値を追加する
     * @param {number} index キー index.
     * @param {number} value 値.
     * @return {number} 現在のヒープ長.
     */


    Zlib$1.Heap.prototype.push = function (index, value) {
      var current,
          parent,
          heap = this.buffer,
          swap;
      current = this.length;
      heap[this.length++] = value;
      heap[this.length++] = index; // ルートノードにたどり着くまで入れ替えを試みる

      while (current > 0) {
        parent = this.getParent(current); // 親ノードと比較して親の方が小さければ入れ替える

        if (heap[current] > heap[parent]) {
          swap = heap[current];
          heap[current] = heap[parent];
          heap[parent] = swap;
          swap = heap[current + 1];
          heap[current + 1] = heap[parent + 1];
          heap[parent + 1] = swap;
          current = parent; // 入れ替えが必要なくなったらそこで抜ける
        } else {
          break;
        }
      }

      return this.length;
    };
    /**
     * Heapから一番大きい値を返す
     * @return {{index: number, value: number, length: number}} {index: キーindex,
     *     value: 値, length: ヒープ長} の Object.
     */


    Zlib$1.Heap.prototype.pop = function () {
      var index,
          value,
          heap = this.buffer,
          swap,
          current,
          parent;
      value = heap[0];
      index = heap[1]; // 後ろから値を取る

      this.length -= 2;
      heap[0] = heap[this.length];
      heap[1] = heap[this.length + 1];
      parent = 0; // ルートノードから下がっていく

      while (true) {
        current = this.getChild(parent); // 範囲チェック

        if (current >= this.length) {
          break;
        } // 隣のノードと比較して、隣の方が値が大きければ隣を現在ノードとして選択


        if (current + 2 < this.length && heap[current + 2] > heap[current]) {
          current += 2;
        } // 親ノードと比較して親の方が小さい場合は入れ替える


        if (heap[current] > heap[parent]) {
          swap = heap[parent];
          heap[parent] = heap[current];
          heap[current] = swap;
          swap = heap[parent + 1];
          heap[parent + 1] = heap[current + 1];
          heap[current + 1] = swap;
        } else {
          break;
        }

        parent = current;
      }

      return {
        index: index,
        value: value,
        length: this.length
      };
    };
    /* vim:set expandtab ts=2 sw=2 tw=80: */

    /**
     * @fileoverview Deflate (RFC1951) 符号化アルゴリズム実装.
     */

    /**
     * Raw Deflate 実装
     *
     * @constructor
     * @param {!(Array.<number>|Uint8Array)} input 符号化する対象のバッファ.
     * @param {Object=} opt_params option parameters.
     *
     * typed array が使用可能なとき、outputBuffer が Array は自動的に Uint8Array に
     * 変換されます.
     * 別のオブジェクトになるため出力バッファを参照している変数などは
     * 更新する必要があります.
     */


    Zlib$1.RawDeflate = function (input, opt_params) {
      /** @type {Zlib.RawDeflate.CompressionType} */
      this.compressionType = Zlib$1.RawDeflate.CompressionType.DYNAMIC;
      /** @type {number} */

      this.lazy = 0;
      /** @type {!(Array.<number>|Uint32Array)} */

      this.freqsLitLen;
      /** @type {!(Array.<number>|Uint32Array)} */

      this.freqsDist;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.input = input instanceof Array ? new Uint8Array(input) : input;
      /** @type {!(Array.<number>|Uint8Array)} output output buffer. */

      this.output;
      /** @type {number} pos output buffer position. */

      this.op = 0; // option parameters

      if (opt_params) {
        if (opt_params['lazy']) {
          this.lazy = opt_params['lazy'];
        }

        if (typeof opt_params['compressionType'] === 'number') {
          this.compressionType = opt_params['compressionType'];
        }

        if (opt_params['outputBuffer']) {
          this.output = opt_params['outputBuffer'] instanceof Array ? new Uint8Array(opt_params['outputBuffer']) : opt_params['outputBuffer'];
        }

        if (typeof opt_params['outputIndex'] === 'number') {
          this.op = opt_params['outputIndex'];
        }
      }

      if (!this.output) {
        this.output = new Uint8Array(0x8000);
      }
    };
    /**
     * @enum {number}
     */


    Zlib$1.RawDeflate.CompressionType = {
      NONE: 0,
      FIXED: 1,
      DYNAMIC: 2,
      RESERVED: 3
    };
    /**
     * LZ77 の最小マッチ長
     * @const
     * @type {number}
     */

    Zlib$1.RawDeflate.Lz77MinLength = 3;
    /**
     * LZ77 の最大マッチ長
     * @const
     * @type {number}
     */

    Zlib$1.RawDeflate.Lz77MaxLength = 258;
    /**
     * LZ77 のウィンドウサイズ
     * @const
     * @type {number}
     */

    Zlib$1.RawDeflate.WindowSize = 0x8000;
    /**
     * 最長の符号長
     * @const
     * @type {number}
     */

    Zlib$1.RawDeflate.MaxCodeLength = 16;
    /**
     * ハフマン符号の最大数値
     * @const
     * @type {number}
     */

    Zlib$1.RawDeflate.HUFMAX = 286;
    /**
     * 固定ハフマン符号の符号化テーブル
     * @const
     * @type {Array.<Array.<number, number>>}
     */

    Zlib$1.RawDeflate.FixedHuffmanTable = function () {
      var table = [],
          i;

      for (i = 0; i < 288; i++) {
        switch (true) {
          case i <= 143:
            table.push([i + 0x030, 8]);
            break;

          case i <= 255:
            table.push([i - 144 + 0x190, 9]);
            break;

          case i <= 279:
            table.push([i - 256 + 0x000, 7]);
            break;

          case i <= 287:
            table.push([i - 280 + 0x0C0, 8]);
            break;

          default:
            throw 'invalid literal: ' + i;
        }
      }

      return table;
    }();
    /**
     * DEFLATE ブロックの作成
     * @return {!(Array.<number>|Uint8Array)} 圧縮済み byte array.
     */


    Zlib$1.RawDeflate.prototype.compress = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var blockArray;
      /** @type {number} */

      var position;
      /** @type {number} */

      var length;
      var input = this.input; // compression

      switch (this.compressionType) {
        case Zlib$1.RawDeflate.CompressionType.NONE:
          // each 65535-Byte (length header: 16-bit)
          for (position = 0, length = input.length; position < length;) {
            blockArray = input.subarray(position, position + 0xffff);
            position += blockArray.length;
            this.makeNocompressBlock(blockArray, position === length);
          }

          break;

        case Zlib$1.RawDeflate.CompressionType.FIXED:
          this.output = this.makeFixedHuffmanBlock(input, true);
          this.op = this.output.length;
          break;

        case Zlib$1.RawDeflate.CompressionType.DYNAMIC:
          this.output = this.makeDynamicHuffmanBlock(input, true);
          this.op = this.output.length;
          break;

        default:
          throw 'invalid compression type';
      }

      return this.output;
    };
    /**
     * 非圧縮ブロックの作成
     * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
     * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
     * @return {!(Array.<number>|Uint8Array)} 非圧縮ブロック byte array.
     */


    Zlib$1.RawDeflate.prototype.makeNocompressBlock = function (blockArray, isFinalBlock) {
      /** @type {number} */
      var bfinal;
      /** @type {Zlib.RawDeflate.CompressionType} */

      var btype;
      /** @type {number} */

      var len;
      /** @type {number} */

      var nlen;
      var output = this.output;
      var op = this.op; // expand buffer

      {
        output = new Uint8Array(this.output.buffer);

        while (output.length <= op + blockArray.length + 5) {
          output = new Uint8Array(output.length << 1);
        }

        output.set(this.output);
      } // header

      bfinal = isFinalBlock ? 1 : 0;
      btype = Zlib$1.RawDeflate.CompressionType.NONE;
      output[op++] = bfinal | btype << 1; // length

      len = blockArray.length;
      nlen = ~len + 0x10000 & 0xffff;
      output[op++] = len & 0xff;
      output[op++] = len >>> 8 & 0xff;
      output[op++] = nlen & 0xff;
      output[op++] = nlen >>> 8 & 0xff; // copy buffer

      {
        output.set(blockArray, op);
        op += blockArray.length;
        output = output.subarray(0, op);
      }
      this.op = op;
      this.output = output;
      return output;
    };
    /**
     * 固定ハフマンブロックの作成
     * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
     * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
     * @return {!(Array.<number>|Uint8Array)} 固定ハフマン符号化ブロック byte array.
     */


    Zlib$1.RawDeflate.prototype.makeFixedHuffmanBlock = function (blockArray, isFinalBlock) {
      /** @type {Zlib.BitStream} */
      var stream = new Zlib$1.BitStream(new Uint8Array(this.output.buffer), this.op);
      /** @type {number} */

      var bfinal;
      /** @type {Zlib.RawDeflate.CompressionType} */

      var btype;
      /** @type {!(Array.<number>|Uint16Array)} */

      var data; // header

      bfinal = isFinalBlock ? 1 : 0;
      btype = Zlib$1.RawDeflate.CompressionType.FIXED;
      stream.writeBits(bfinal, 1, true);
      stream.writeBits(btype, 2, true);
      data = this.lz77(blockArray);
      this.fixedHuffman(data, stream);
      return stream.finish();
    };
    /**
     * 動的ハフマンブロックの作成
     * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
     * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
     * @return {!(Array.<number>|Uint8Array)} 動的ハフマン符号ブロック byte array.
     */


    Zlib$1.RawDeflate.prototype.makeDynamicHuffmanBlock = function (blockArray, isFinalBlock) {
      /** @type {Zlib.BitStream} */
      var stream = new Zlib$1.BitStream(new Uint8Array(this.output.buffer), this.op);
      /** @type {number} */

      var bfinal;
      /** @type {Zlib.RawDeflate.CompressionType} */

      var btype;
      /** @type {!(Array.<number>|Uint16Array)} */

      var data;
      /** @type {number} */

      var hlit;
      /** @type {number} */

      var hdist;
      /** @type {number} */

      var hclen;
      /** @const @type {Array.<number>} */

      var hclenOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      /** @type {!(Array.<number>|Uint8Array)} */

      var litLenLengths;
      /** @type {!(Array.<number>|Uint16Array)} */

      var litLenCodes;
      /** @type {!(Array.<number>|Uint8Array)} */

      var distLengths;
      /** @type {!(Array.<number>|Uint16Array)} */

      var distCodes;
      /** @type {{
       *   codes: !(Array.<number>|Uint32Array),
       *   freqs: !(Array.<number>|Uint8Array)
       * }} */

      var treeSymbols;
      /** @type {!(Array.<number>|Uint8Array)} */

      var treeLengths;
      /** @type {Array} */

      var transLengths = new Array(19);
      /** @type {!(Array.<number>|Uint16Array)} */

      var treeCodes;
      /** @type {number} */

      var code;
      /** @type {number} */

      var bitlen;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il; // header

      bfinal = isFinalBlock ? 1 : 0;
      btype = Zlib$1.RawDeflate.CompressionType.DYNAMIC;
      stream.writeBits(bfinal, 1, true);
      stream.writeBits(btype, 2, true);
      data = this.lz77(blockArray); // リテラル・長さ, 距離のハフマン符号と符号長の算出

      litLenLengths = this.getLengths_(this.freqsLitLen, 15);
      litLenCodes = this.getCodesFromLengths_(litLenLengths);
      distLengths = this.getLengths_(this.freqsDist, 7);
      distCodes = this.getCodesFromLengths_(distLengths); // HLIT, HDIST の決定

      for (hlit = 286; hlit > 257 && litLenLengths[hlit - 1] === 0; hlit--) {}

      for (hdist = 30; hdist > 1 && distLengths[hdist - 1] === 0; hdist--) {} // HCLEN


      treeSymbols = this.getTreeSymbols_(hlit, litLenLengths, hdist, distLengths);
      treeLengths = this.getLengths_(treeSymbols.freqs, 7);

      for (i = 0; i < 19; i++) {
        transLengths[i] = treeLengths[hclenOrder[i]];
      }

      for (hclen = 19; hclen > 4 && transLengths[hclen - 1] === 0; hclen--) {}

      treeCodes = this.getCodesFromLengths_(treeLengths); // 出力

      stream.writeBits(hlit - 257, 5, true);
      stream.writeBits(hdist - 1, 5, true);
      stream.writeBits(hclen - 4, 4, true);

      for (i = 0; i < hclen; i++) {
        stream.writeBits(transLengths[i], 3, true);
      } // ツリーの出力


      for (i = 0, il = treeSymbols.codes.length; i < il; i++) {
        code = treeSymbols.codes[i];
        stream.writeBits(treeCodes[code], treeLengths[code], true); // extra bits

        if (code >= 16) {
          i++;

          switch (code) {
            case 16:
              bitlen = 2;
              break;

            case 17:
              bitlen = 3;
              break;

            case 18:
              bitlen = 7;
              break;

            default:
              throw 'invalid code: ' + code;
          }

          stream.writeBits(treeSymbols.codes[i], bitlen, true);
        }
      }

      this.dynamicHuffman(data, [litLenCodes, litLenLengths], [distCodes, distLengths], stream);
      return stream.finish();
    };
    /**
     * 動的ハフマン符号化(カスタムハフマンテーブル)
     * @param {!(Array.<number>|Uint16Array)} dataArray LZ77 符号化済み byte array.
     * @param {!Zlib.BitStream} stream 書き込み用ビットストリーム.
     * @return {!Zlib.BitStream} ハフマン符号化済みビットストリームオブジェクト.
     */


    Zlib$1.RawDeflate.prototype.dynamicHuffman = function (dataArray, litLen, dist, stream) {
      /** @type {number} */
      var index;
      /** @type {number} */

      var length;
      /** @type {number} */

      var literal;
      /** @type {number} */

      var code;
      /** @type {number} */

      var litLenCodes;
      /** @type {number} */

      var litLenLengths;
      /** @type {number} */

      var distCodes;
      /** @type {number} */

      var distLengths;
      litLenCodes = litLen[0];
      litLenLengths = litLen[1];
      distCodes = dist[0];
      distLengths = dist[1]; // 符号を BitStream に書き込んでいく

      for (index = 0, length = dataArray.length; index < length; ++index) {
        literal = dataArray[index]; // literal or length

        stream.writeBits(litLenCodes[literal], litLenLengths[literal], true); // 長さ・距離符号

        if (literal > 256) {
          // length extra
          stream.writeBits(dataArray[++index], dataArray[++index], true); // distance

          code = dataArray[++index];
          stream.writeBits(distCodes[code], distLengths[code], true); // distance extra

          stream.writeBits(dataArray[++index], dataArray[++index], true); // 終端
        } else if (literal === 256) {
          break;
        }
      }

      return stream;
    };
    /**
     * 固定ハフマン符号化
     * @param {!(Array.<number>|Uint16Array)} dataArray LZ77 符号化済み byte array.
     * @param {!Zlib.BitStream} stream 書き込み用ビットストリーム.
     * @return {!Zlib.BitStream} ハフマン符号化済みビットストリームオブジェクト.
     */


    Zlib$1.RawDeflate.prototype.fixedHuffman = function (dataArray, stream) {
      /** @type {number} */
      var index;
      /** @type {number} */

      var length;
      /** @type {number} */

      var literal; // 符号を BitStream に書き込んでいく

      for (index = 0, length = dataArray.length; index < length; index++) {
        literal = dataArray[index]; // 符号の書き込み

        Zlib$1.BitStream.prototype.writeBits.apply(stream, Zlib$1.RawDeflate.FixedHuffmanTable[literal]); // 長さ・距離符号

        if (literal > 0x100) {
          // length extra
          stream.writeBits(dataArray[++index], dataArray[++index], true); // distance

          stream.writeBits(dataArray[++index], 5); // distance extra

          stream.writeBits(dataArray[++index], dataArray[++index], true); // 終端
        } else if (literal === 0x100) {
          break;
        }
      }

      return stream;
    };
    /**
     * マッチ情報
     * @param {!number} length マッチした長さ.
     * @param {!number} backwardDistance マッチ位置との距離.
     * @constructor
     */


    Zlib$1.RawDeflate.Lz77Match = function (length, backwardDistance) {
      /** @type {number} match length. */
      this.length = length;
      /** @type {number} backward distance. */

      this.backwardDistance = backwardDistance;
    };
    /**
     * 長さ符号テーブル.
     * [コード, 拡張ビット, 拡張ビット長] の配列となっている.
     * @const
     * @type {!(Array.<number>|Uint32Array)}
     */


    Zlib$1.RawDeflate.Lz77Match.LengthCodeTable = function (table) {
      return new Uint32Array(table);
    }(function () {
      /** @type {!Array} */
      var table = [];
      /** @type {number} */

      var i;
      /** @type {!Array.<number>} */

      var c;

      for (i = 3; i <= 258; i++) {
        c = code(i);
        table[i] = c[2] << 24 | c[1] << 16 | c[0];
      }
      /**
       * @param {number} length lz77 length.
       * @return {!Array.<number>} lz77 codes.
       */


      function code(length) {
        switch (true) {
          case length === 3:
            return [257, length - 3, 0];

          case length === 4:
            return [258, length - 4, 0];

          case length === 5:
            return [259, length - 5, 0];

          case length === 6:
            return [260, length - 6, 0];

          case length === 7:
            return [261, length - 7, 0];

          case length === 8:
            return [262, length - 8, 0];

          case length === 9:
            return [263, length - 9, 0];

          case length === 10:
            return [264, length - 10, 0];

          case length <= 12:
            return [265, length - 11, 1];

          case length <= 14:
            return [266, length - 13, 1];

          case length <= 16:
            return [267, length - 15, 1];

          case length <= 18:
            return [268, length - 17, 1];

          case length <= 22:
            return [269, length - 19, 2];

          case length <= 26:
            return [270, length - 23, 2];

          case length <= 30:
            return [271, length - 27, 2];

          case length <= 34:
            return [272, length - 31, 2];

          case length <= 42:
            return [273, length - 35, 3];

          case length <= 50:
            return [274, length - 43, 3];

          case length <= 58:
            return [275, length - 51, 3];

          case length <= 66:
            return [276, length - 59, 3];

          case length <= 82:
            return [277, length - 67, 4];

          case length <= 98:
            return [278, length - 83, 4];

          case length <= 114:
            return [279, length - 99, 4];

          case length <= 130:
            return [280, length - 115, 4];

          case length <= 162:
            return [281, length - 131, 5];

          case length <= 194:
            return [282, length - 163, 5];

          case length <= 226:
            return [283, length - 195, 5];

          case length <= 257:
            return [284, length - 227, 5];

          case length === 258:
            return [285, length - 258, 0];

          default:
            throw 'invalid length: ' + length;
        }
      }

      return table;
    }());
    /**
     * 距離符号テーブル
     * @param {!number} dist 距離.
     * @return {!Array.<number>} コード、拡張ビット、拡張ビット長の配列.
     * @private
     */


    Zlib$1.RawDeflate.Lz77Match.prototype.getDistanceCode_ = function (dist) {
      /** @type {!Array.<number>} distance code table. */
      var r;

      switch (true) {
        case dist === 1:
          r = [0, dist - 1, 0];
          break;

        case dist === 2:
          r = [1, dist - 2, 0];
          break;

        case dist === 3:
          r = [2, dist - 3, 0];
          break;

        case dist === 4:
          r = [3, dist - 4, 0];
          break;

        case dist <= 6:
          r = [4, dist - 5, 1];
          break;

        case dist <= 8:
          r = [5, dist - 7, 1];
          break;

        case dist <= 12:
          r = [6, dist - 9, 2];
          break;

        case dist <= 16:
          r = [7, dist - 13, 2];
          break;

        case dist <= 24:
          r = [8, dist - 17, 3];
          break;

        case dist <= 32:
          r = [9, dist - 25, 3];
          break;

        case dist <= 48:
          r = [10, dist - 33, 4];
          break;

        case dist <= 64:
          r = [11, dist - 49, 4];
          break;

        case dist <= 96:
          r = [12, dist - 65, 5];
          break;

        case dist <= 128:
          r = [13, dist - 97, 5];
          break;

        case dist <= 192:
          r = [14, dist - 129, 6];
          break;

        case dist <= 256:
          r = [15, dist - 193, 6];
          break;

        case dist <= 384:
          r = [16, dist - 257, 7];
          break;

        case dist <= 512:
          r = [17, dist - 385, 7];
          break;

        case dist <= 768:
          r = [18, dist - 513, 8];
          break;

        case dist <= 1024:
          r = [19, dist - 769, 8];
          break;

        case dist <= 1536:
          r = [20, dist - 1025, 9];
          break;

        case dist <= 2048:
          r = [21, dist - 1537, 9];
          break;

        case dist <= 3072:
          r = [22, dist - 2049, 10];
          break;

        case dist <= 4096:
          r = [23, dist - 3073, 10];
          break;

        case dist <= 6144:
          r = [24, dist - 4097, 11];
          break;

        case dist <= 8192:
          r = [25, dist - 6145, 11];
          break;

        case dist <= 12288:
          r = [26, dist - 8193, 12];
          break;

        case dist <= 16384:
          r = [27, dist - 12289, 12];
          break;

        case dist <= 24576:
          r = [28, dist - 16385, 13];
          break;

        case dist <= 32768:
          r = [29, dist - 24577, 13];
          break;

        default:
          throw 'invalid distance';
      }

      return r;
    };
    /**
     * マッチ情報を LZ77 符号化配列で返す.
     * なお、ここでは以下の内部仕様で符号化している
     * [ CODE, EXTRA-BIT-LEN, EXTRA, CODE, EXTRA-BIT-LEN, EXTRA ]
     * @return {!Array.<number>} LZ77 符号化 byte array.
     */


    Zlib$1.RawDeflate.Lz77Match.prototype.toLz77Array = function () {
      /** @type {number} */
      var length = this.length;
      /** @type {number} */

      var dist = this.backwardDistance;
      /** @type {Array} */

      var codeArray = [];
      /** @type {number} */

      var pos = 0;
      /** @type {!Array.<number>} */

      var code; // length

      code = Zlib$1.RawDeflate.Lz77Match.LengthCodeTable[length];
      codeArray[pos++] = code & 0xffff;
      codeArray[pos++] = code >> 16 & 0xff;
      codeArray[pos++] = code >> 24; // distance

      code = this.getDistanceCode_(dist);
      codeArray[pos++] = code[0];
      codeArray[pos++] = code[1];
      codeArray[pos++] = code[2];
      return codeArray;
    };
    /**
     * LZ77 実装
     * @param {!(Array.<number>|Uint8Array)} dataArray LZ77 符号化するバイト配列.
     * @return {!(Array.<number>|Uint16Array)} LZ77 符号化した配列.
     */


    Zlib$1.RawDeflate.prototype.lz77 = function (dataArray) {
      /** @type {number} input position */
      var position;
      /** @type {number} input length */

      var length;
      /** @type {number} loop counter */

      var i;
      /** @type {number} loop limiter */

      var il;
      /** @type {number} chained-hash-table key */

      var matchKey;
      /** @type {Object.<number, Array.<number>>} chained-hash-table */

      var table = {};
      /** @const @type {number} */

      var windowSize = Zlib$1.RawDeflate.WindowSize;
      /** @type {Array.<number>} match list */

      var matchList;
      /** @type {Zlib.RawDeflate.Lz77Match} longest match */

      var longestMatch;
      /** @type {Zlib.RawDeflate.Lz77Match} previous longest match */

      var prevMatch;
      /** @type {!(Array.<number>|Uint16Array)} lz77 buffer */

      var lz77buf = new Uint16Array(dataArray.length * 2);
      /** @type {number} lz77 output buffer pointer */

      var pos = 0;
      /** @type {number} lz77 skip length */

      var skipLength = 0;
      /** @type {!(Array.<number>|Uint32Array)} */

      var freqsLitLen = new Uint32Array(286);
      /** @type {!(Array.<number>|Uint32Array)} */

      var freqsDist = new Uint32Array(30);
      /** @type {number} */

      var lazy = this.lazy;
      /** @type {*} temporary variable */

      var tmp;
      freqsLitLen[256] = 1; // EOB の最低出現回数は 1

      /**
       * マッチデータの書き込み
       * @param {Zlib.RawDeflate.Lz77Match} match LZ77 Match data.
       * @param {!number} offset スキップ開始位置(相対指定).
       * @private
       */

      function writeMatch(match, offset) {
        /** @type {Array.<number>} */
        var lz77Array = match.toLz77Array();
        /** @type {number} */

        var i;
        /** @type {number} */

        var il;

        for (i = 0, il = lz77Array.length; i < il; ++i) {
          lz77buf[pos++] = lz77Array[i];
        }

        freqsLitLen[lz77Array[0]]++;
        freqsDist[lz77Array[3]]++;
        skipLength = match.length + offset - 1;
        prevMatch = null;
      } // LZ77 符号化


      for (position = 0, length = dataArray.length; position < length; ++position) {
        // ハッシュキーの作成
        for (matchKey = 0, i = 0, il = Zlib$1.RawDeflate.Lz77MinLength; i < il; ++i) {
          if (position + i === length) {
            break;
          }

          matchKey = matchKey << 8 | dataArray[position + i];
        } // テーブルが未定義だったら作成する


        if (table[matchKey] === void 0) {
          table[matchKey] = [];
        }

        matchList = table[matchKey]; // skip

        if (skipLength-- > 0) {
          matchList.push(position);
          continue;
        } // マッチテーブルの更新 (最大戻り距離を超えているものを削除する)


        while (matchList.length > 0 && position - matchList[0] > windowSize) {
          matchList.shift();
        } // データ末尾でマッチしようがない場合はそのまま流しこむ


        if (position + Zlib$1.RawDeflate.Lz77MinLength >= length) {
          if (prevMatch) {
            writeMatch(prevMatch, -1);
          }

          for (i = 0, il = length - position; i < il; ++i) {
            tmp = dataArray[position + i];
            lz77buf[pos++] = tmp;
            ++freqsLitLen[tmp];
          }

          break;
        } // マッチ候補から最長のものを探す


        if (matchList.length > 0) {
          longestMatch = this.searchLongestMatch_(dataArray, position, matchList);

          if (prevMatch) {
            // 現在のマッチの方が前回のマッチよりも長い
            if (prevMatch.length < longestMatch.length) {
              // write previous literal
              tmp = dataArray[position - 1];
              lz77buf[pos++] = tmp;
              ++freqsLitLen[tmp]; // write current match

              writeMatch(longestMatch, 0);
            } else {
              // write previous match
              writeMatch(prevMatch, -1);
            }
          } else if (longestMatch.length < lazy) {
            prevMatch = longestMatch;
          } else {
            writeMatch(longestMatch, 0);
          } // 前回マッチしていて今回マッチがなかったら前回のを採用

        } else if (prevMatch) {
          writeMatch(prevMatch, -1);
        } else {
          tmp = dataArray[position];
          lz77buf[pos++] = tmp;
          ++freqsLitLen[tmp];
        }

        matchList.push(position); // マッチテーブルに現在の位置を保存
      } // 終端処理


      lz77buf[pos++] = 256;
      freqsLitLen[256]++;
      this.freqsLitLen = freqsLitLen;
      this.freqsDist = freqsDist;
      return (
        /** @type {!(Uint16Array|Array.<number>)} */
        lz77buf.subarray(0, pos)
      );
    };
    /**
     * マッチした候補の中から最長一致を探す
     * @param {!Object} data plain data byte array.
     * @param {!number} position plain data byte array position.
     * @param {!Array.<number>} matchList 候補となる位置の配列.
     * @return {!Zlib.RawDeflate.Lz77Match} 最長かつ最短距離のマッチオブジェクト.
     * @private
     */


    Zlib$1.RawDeflate.prototype.searchLongestMatch_ = function (data, position, matchList) {
      var match,
          currentMatch,
          matchMax = 0,
          matchLength,
          i,
          j,
          l,
          dl = data.length; // 候補を後ろから 1 つずつ絞り込んでゆく

      permatch: for (i = 0, l = matchList.length; i < l; i++) {
        match = matchList[l - i - 1];
        matchLength = Zlib$1.RawDeflate.Lz77MinLength; // 前回までの最長一致を末尾から一致検索する

        if (matchMax > Zlib$1.RawDeflate.Lz77MinLength) {
          for (j = matchMax; j > Zlib$1.RawDeflate.Lz77MinLength; j--) {
            if (data[match + j - 1] !== data[position + j - 1]) {
              continue permatch;
            }
          }

          matchLength = matchMax;
        } // 最長一致探索


        while (matchLength < Zlib$1.RawDeflate.Lz77MaxLength && position + matchLength < dl && data[match + matchLength] === data[position + matchLength]) {
          ++matchLength;
        } // マッチ長が同じ場合は後方を優先


        if (matchLength > matchMax) {
          currentMatch = match;
          matchMax = matchLength;
        } // 最長が確定したら後の処理は省略


        if (matchLength === Zlib$1.RawDeflate.Lz77MaxLength) {
          break;
        }
      }

      return new Zlib$1.RawDeflate.Lz77Match(matchMax, position - currentMatch);
    };
    /**
     * Tree-Transmit Symbols の算出
     * reference: PuTTY Deflate implementation
     * @param {number} hlit HLIT.
     * @param {!(Array.<number>|Uint8Array)} litlenLengths リテラルと長さ符号の符号長配列.
     * @param {number} hdist HDIST.
     * @param {!(Array.<number>|Uint8Array)} distLengths 距離符号の符号長配列.
     * @return {{
     *   codes: !(Array.<number>|Uint32Array),
     *   freqs: !(Array.<number>|Uint8Array)
     * }} Tree-Transmit Symbols.
     */


    Zlib$1.RawDeflate.prototype.getTreeSymbols_ = function (hlit, litlenLengths, hdist, distLengths) {
      var src = new Uint32Array(hlit + hdist),
          i,
          j,
          runLength,
          l,
          result = new Uint32Array(286 + 30),
          nResult,
          rpt,
          freqs = new Uint8Array(19);
      j = 0;

      for (i = 0; i < hlit; i++) {
        src[j++] = litlenLengths[i];
      }

      for (i = 0; i < hdist; i++) {
        src[j++] = distLengths[i];
      } // 符号化


      nResult = 0;

      for (i = 0, l = src.length; i < l; i += j) {
        // Run Length Encoding
        for (j = 1; i + j < l && src[i + j] === src[i]; ++j) {}

        runLength = j;

        if (src[i] === 0) {
          // 0 の繰り返しが 3 回未満ならばそのまま
          if (runLength < 3) {
            while (runLength-- > 0) {
              result[nResult++] = 0;
              freqs[0]++;
            }
          } else {
            while (runLength > 0) {
              // 繰り返しは最大 138 までなので切り詰める
              rpt = runLength < 138 ? runLength : 138;

              if (rpt > runLength - 3 && rpt < runLength) {
                rpt = runLength - 3;
              } // 3-10 回 -> 17


              if (rpt <= 10) {
                result[nResult++] = 17;
                result[nResult++] = rpt - 3;
                freqs[17]++; // 11-138 回 -> 18
              } else {
                result[nResult++] = 18;
                result[nResult++] = rpt - 11;
                freqs[18]++;
              }

              runLength -= rpt;
            }
          }
        } else {
          result[nResult++] = src[i];
          freqs[src[i]]++;
          runLength--; // 繰り返し回数が3回未満ならばランレングス符号は要らない

          if (runLength < 3) {
            while (runLength-- > 0) {
              result[nResult++] = src[i];
              freqs[src[i]]++;
            } // 3 回以上ならばランレングス符号化

          } else {
            while (runLength > 0) {
              // runLengthを 3-6 で分割
              rpt = runLength < 6 ? runLength : 6;

              if (rpt > runLength - 3 && rpt < runLength) {
                rpt = runLength - 3;
              }

              result[nResult++] = 16;
              result[nResult++] = rpt - 3;
              freqs[16]++;
              runLength -= rpt;
            }
          }
        }
      }

      return {
        codes: result.subarray(0, nResult),
        freqs: freqs
      };
    };
    /**
     * ハフマン符号の長さを取得する
     * @param {!(Array.<number>|Uint8Array|Uint32Array)} freqs 出現カウント.
     * @param {number} limit 符号長の制限.
     * @return {!(Array.<number>|Uint8Array)} 符号長配列.
     * @private
     */


    Zlib$1.RawDeflate.prototype.getLengths_ = function (freqs, limit) {
      /** @type {number} */
      var nSymbols = freqs.length;
      /** @type {Zlib.Heap} */

      var heap = new Zlib$1.Heap(2 * Zlib$1.RawDeflate.HUFMAX);
      /** @type {!(Array.<number>|Uint8Array)} */

      var length = new Uint8Array(nSymbols);
      /** @type {Array} */

      var nodes;
      /** @type {!(Array.<number>|Uint32Array)} */

      var values;
      /** @type {!(Array.<number>|Uint8Array)} */

      var codeLength;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il; // ヒープの構築

      for (i = 0; i < nSymbols; ++i) {
        if (freqs[i] > 0) {
          heap.push(i, freqs[i]);
        }
      }

      nodes = new Array(heap.length / 2);
      values = new Uint32Array(heap.length / 2); // 非 0 の要素が一つだけだった場合は、そのシンボルに符号長 1 を割り当てて終了

      if (nodes.length === 1) {
        length[heap.pop().index] = 1;
        return length;
      } // Reverse Package Merge Algorithm による Canonical Huffman Code の符号長決定


      for (i = 0, il = heap.length / 2; i < il; ++i) {
        nodes[i] = heap.pop();
        values[i] = nodes[i].value;
      }

      codeLength = this.reversePackageMerge_(values, values.length, limit);

      for (i = 0, il = nodes.length; i < il; ++i) {
        length[nodes[i].index] = codeLength[i];
      }

      return length;
    };
    /**
     * Reverse Package Merge Algorithm.
     * @param {!(Array.<number>|Uint32Array)} freqs sorted probability.
     * @param {number} symbols number of symbols.
     * @param {number} limit code length limit.
     * @return {!(Array.<number>|Uint8Array)} code lengths.
     */


    Zlib$1.RawDeflate.prototype.reversePackageMerge_ = function (freqs, symbols, limit) {
      /** @type {!(Array.<number>|Uint16Array)} */
      var minimumCost = new Uint16Array(limit);
      /** @type {!(Array.<number>|Uint8Array)} */

      var flag = new Uint8Array(limit);
      /** @type {!(Array.<number>|Uint8Array)} */

      var codeLength = new Uint8Array(symbols);
      /** @type {Array} */

      var value = new Array(limit);
      /** @type {Array} */

      var type = new Array(limit);
      /** @type {Array.<number>} */

      var currentPosition = new Array(limit);
      /** @type {number} */

      var excess = (1 << limit) - symbols;
      /** @type {number} */

      var half = 1 << limit - 1;
      /** @type {number} */

      var i;
      /** @type {number} */

      var j;
      /** @type {number} */

      var t;
      /** @type {number} */

      var weight;
      /** @type {number} */

      var next;
      /**
       * @param {number} j
       */

      function takePackage(j) {
        /** @type {number} */
        var x = type[j][currentPosition[j]];

        if (x === symbols) {
          takePackage(j + 1);
          takePackage(j + 1);
        } else {
          --codeLength[x];
        }

        ++currentPosition[j];
      }

      minimumCost[limit - 1] = symbols;

      for (j = 0; j < limit; ++j) {
        if (excess < half) {
          flag[j] = 0;
        } else {
          flag[j] = 1;
          excess -= half;
        }

        excess <<= 1;
        minimumCost[limit - 2 - j] = (minimumCost[limit - 1 - j] / 2 | 0) + symbols;
      }

      minimumCost[0] = flag[0];
      value[0] = new Array(minimumCost[0]);
      type[0] = new Array(minimumCost[0]);

      for (j = 1; j < limit; ++j) {
        if (minimumCost[j] > 2 * minimumCost[j - 1] + flag[j]) {
          minimumCost[j] = 2 * minimumCost[j - 1] + flag[j];
        }

        value[j] = new Array(minimumCost[j]);
        type[j] = new Array(minimumCost[j]);
      }

      for (i = 0; i < symbols; ++i) {
        codeLength[i] = limit;
      }

      for (t = 0; t < minimumCost[limit - 1]; ++t) {
        value[limit - 1][t] = freqs[t];
        type[limit - 1][t] = t;
      }

      for (i = 0; i < limit; ++i) {
        currentPosition[i] = 0;
      }

      if (flag[limit - 1] === 1) {
        --codeLength[0];
        ++currentPosition[limit - 1];
      }

      for (j = limit - 2; j >= 0; --j) {
        i = 0;
        weight = 0;
        next = currentPosition[j + 1];

        for (t = 0; t < minimumCost[j]; t++) {
          weight = value[j + 1][next] + value[j + 1][next + 1];

          if (weight > freqs[i]) {
            value[j][t] = weight;
            type[j][t] = symbols;
            next += 2;
          } else {
            value[j][t] = freqs[i];
            type[j][t] = i;
            ++i;
          }
        }

        currentPosition[j] = 0;

        if (flag[j] === 1) {
          takePackage(j);
        }
      }

      return codeLength;
    };
    /**
     * 符号長配列からハフマン符号を取得する
     * reference: PuTTY Deflate implementation
     * @param {!(Array.<number>|Uint8Array)} lengths 符号長配列.
     * @return {!(Array.<number>|Uint16Array)} ハフマン符号配列.
     * @private
     */


    Zlib$1.RawDeflate.prototype.getCodesFromLengths_ = function (lengths) {
      var codes = new Uint16Array(lengths.length),
          count = [],
          startCode = [],
          code = 0,
          i,
          il,
          j,
          m; // Count the codes of each length.

      for (i = 0, il = lengths.length; i < il; i++) {
        count[lengths[i]] = (count[lengths[i]] | 0) + 1;
      } // Determine the starting code for each length block.


      for (i = 1, il = Zlib$1.RawDeflate.MaxCodeLength; i <= il; i++) {
        startCode[i] = code;
        code += count[i] | 0;
        code <<= 1;
      } // Determine the code for each symbol. Mirrored, of course.


      for (i = 0, il = lengths.length; i < il; i++) {
        code = startCode[lengths[i]];
        startCode[lengths[i]] += 1;
        codes[i] = 0;

        for (j = 0, m = lengths[i]; j < m; j++) {
          codes[i] = codes[i] << 1 | code & 1;
          code >>>= 1;
        }
      }

      return codes;
    };
    /**
     * @param {!(Array.<number>|Uint8Array)} input input buffer.
     * @param {Object=} opt_params options.
     * @constructor
     */


    Zlib$1.Unzip = function (input, opt_params) {
      opt_params = opt_params || {};
      /** @type {!(Array.<number>|Uint8Array)} */

      this.input = input instanceof Array ? new Uint8Array(input) : input;
      /** @type {number} */

      this.ip = 0;
      /** @type {number} */

      this.eocdrOffset;
      /** @type {number} */

      this.numberOfThisDisk;
      /** @type {number} */

      this.startDisk;
      /** @type {number} */

      this.totalEntriesThisDisk;
      /** @type {number} */

      this.totalEntries;
      /** @type {number} */

      this.centralDirectorySize;
      /** @type {number} */

      this.centralDirectoryOffset;
      /** @type {number} */

      this.commentLength;
      /** @type {(Array.<number>|Uint8Array)} */

      this.comment;
      /** @type {Array.<Zlib.Unzip.FileHeader>} */

      this.fileHeaderList;
      /** @type {Object.<string, number>} */

      this.filenameToIndex;
      /** @type {boolean} */

      this.verify = opt_params['verify'] || false;
      /** @type {(Array.<number>|Uint8Array)} */

      this.password = opt_params['password'];
    };

    Zlib$1.Unzip.CompressionMethod = Zlib$1.Zip.CompressionMethod;
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib$1.Unzip.FileHeaderSignature = Zlib$1.Zip.FileHeaderSignature;
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib$1.Unzip.LocalFileHeaderSignature = Zlib$1.Zip.LocalFileHeaderSignature;
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib$1.Unzip.CentralDirectorySignature = Zlib$1.Zip.CentralDirectorySignature;
    /**
     * @param {!(Array.<number>|Uint8Array)} input input buffer.
     * @param {number} ip input position.
     * @constructor
     */

    Zlib$1.Unzip.FileHeader = function (input, ip) {
      /** @type {!(Array.<number>|Uint8Array)} */
      this.input = input;
      /** @type {number} */

      this.offset = ip;
      /** @type {number} */

      this.length;
      /** @type {number} */

      this.version;
      /** @type {number} */

      this.os;
      /** @type {number} */

      this.needVersion;
      /** @type {number} */

      this.flags;
      /** @type {number} */

      this.compression;
      /** @type {number} */

      this.time;
      /** @type {number} */

      this.date;
      /** @type {number} */

      this.crc32;
      /** @type {number} */

      this.compressedSize;
      /** @type {number} */

      this.plainSize;
      /** @type {number} */

      this.fileNameLength;
      /** @type {number} */

      this.extraFieldLength;
      /** @type {number} */

      this.fileCommentLength;
      /** @type {number} */

      this.diskNumberStart;
      /** @type {number} */

      this.internalFileAttributes;
      /** @type {number} */

      this.externalFileAttributes;
      /** @type {number} */

      this.relativeOffset;
      /** @type {string} */

      this.filename;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.extraField;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.comment;
    };

    Zlib$1.Unzip.FileHeader.prototype.parse = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip = this.offset; // central file header signature

      if (input[ip++] !== Zlib$1.Unzip.FileHeaderSignature[0] || input[ip++] !== Zlib$1.Unzip.FileHeaderSignature[1] || input[ip++] !== Zlib$1.Unzip.FileHeaderSignature[2] || input[ip++] !== Zlib$1.Unzip.FileHeaderSignature[3]) {
        throw new Error('invalid file header signature');
      } // version made by


      this.version = input[ip++];
      this.os = input[ip++]; // version needed to extract

      this.needVersion = input[ip++] | input[ip++] << 8; // general purpose bit flag

      this.flags = input[ip++] | input[ip++] << 8; // compression method

      this.compression = input[ip++] | input[ip++] << 8; // last mod file time

      this.time = input[ip++] | input[ip++] << 8; //last mod file date

      this.date = input[ip++] | input[ip++] << 8; // crc-32

      this.crc32 = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // compressed size

      this.compressedSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // uncompressed size

      this.plainSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // file name length

      this.fileNameLength = input[ip++] | input[ip++] << 8; // extra field length

      this.extraFieldLength = input[ip++] | input[ip++] << 8; // file comment length

      this.fileCommentLength = input[ip++] | input[ip++] << 8; // disk number start

      this.diskNumberStart = input[ip++] | input[ip++] << 8; // internal file attributes

      this.internalFileAttributes = input[ip++] | input[ip++] << 8; // external file attributes

      this.externalFileAttributes = input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24; // relative offset of local header

      this.relativeOffset = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // file name

      this.filename = String.fromCharCode.apply(null, input.subarray(ip, ip += this.fileNameLength)); // extra field

      this.extraField = input.subarray(ip, ip += this.extraFieldLength); // file comment

      this.comment = input.subarray(ip, ip + this.fileCommentLength);
      this.length = ip - this.offset;
    };
    /**
     * @param {!(Array.<number>|Uint8Array)} input input buffer.
     * @param {number} ip input position.
     * @constructor
     */


    Zlib$1.Unzip.LocalFileHeader = function (input, ip) {
      /** @type {!(Array.<number>|Uint8Array)} */
      this.input = input;
      /** @type {number} */

      this.offset = ip;
      /** @type {number} */

      this.length;
      /** @type {number} */

      this.needVersion;
      /** @type {number} */

      this.flags;
      /** @type {number} */

      this.compression;
      /** @type {number} */

      this.time;
      /** @type {number} */

      this.date;
      /** @type {number} */

      this.crc32;
      /** @type {number} */

      this.compressedSize;
      /** @type {number} */

      this.plainSize;
      /** @type {number} */

      this.fileNameLength;
      /** @type {number} */

      this.extraFieldLength;
      /** @type {string} */

      this.filename;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.extraField;
    };

    Zlib$1.Unzip.LocalFileHeader.Flags = Zlib$1.Zip.Flags;

    Zlib$1.Unzip.LocalFileHeader.prototype.parse = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip = this.offset; // local file header signature

      if (input[ip++] !== Zlib$1.Unzip.LocalFileHeaderSignature[0] || input[ip++] !== Zlib$1.Unzip.LocalFileHeaderSignature[1] || input[ip++] !== Zlib$1.Unzip.LocalFileHeaderSignature[2] || input[ip++] !== Zlib$1.Unzip.LocalFileHeaderSignature[3]) {
        throw new Error('invalid local file header signature');
      } // version needed to extract


      this.needVersion = input[ip++] | input[ip++] << 8; // general purpose bit flag

      this.flags = input[ip++] | input[ip++] << 8; // compression method

      this.compression = input[ip++] | input[ip++] << 8; // last mod file time

      this.time = input[ip++] | input[ip++] << 8; //last mod file date

      this.date = input[ip++] | input[ip++] << 8; // crc-32

      this.crc32 = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // compressed size

      this.compressedSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // uncompressed size

      this.plainSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // file name length

      this.fileNameLength = input[ip++] | input[ip++] << 8; // extra field length

      this.extraFieldLength = input[ip++] | input[ip++] << 8; // file name

      this.filename = String.fromCharCode.apply(null, input.subarray(ip, ip += this.fileNameLength)); // extra field

      this.extraField = input.subarray(ip, ip += this.extraFieldLength);
      this.length = ip - this.offset;
    };

    Zlib$1.Unzip.prototype.searchEndOfCentralDirectoryRecord = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip;

      for (ip = input.length - 12; ip > 0; --ip) {
        if (input[ip] === Zlib$1.Unzip.CentralDirectorySignature[0] && input[ip + 1] === Zlib$1.Unzip.CentralDirectorySignature[1] && input[ip + 2] === Zlib$1.Unzip.CentralDirectorySignature[2] && input[ip + 3] === Zlib$1.Unzip.CentralDirectorySignature[3]) {
          this.eocdrOffset = ip;
          return;
        }
      }

      throw new Error('End of Central Directory Record not found');
    };

    Zlib$1.Unzip.prototype.parseEndOfCentralDirectoryRecord = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip;

      if (!this.eocdrOffset) {
        this.searchEndOfCentralDirectoryRecord();
      }

      ip = this.eocdrOffset; // signature

      if (input[ip++] !== Zlib$1.Unzip.CentralDirectorySignature[0] || input[ip++] !== Zlib$1.Unzip.CentralDirectorySignature[1] || input[ip++] !== Zlib$1.Unzip.CentralDirectorySignature[2] || input[ip++] !== Zlib$1.Unzip.CentralDirectorySignature[3]) {
        throw new Error('invalid signature');
      } // number of this disk


      this.numberOfThisDisk = input[ip++] | input[ip++] << 8; // number of the disk with the start of the central directory

      this.startDisk = input[ip++] | input[ip++] << 8; // total number of entries in the central directory on this disk

      this.totalEntriesThisDisk = input[ip++] | input[ip++] << 8; // total number of entries in the central directory

      this.totalEntries = input[ip++] | input[ip++] << 8; // size of the central directory

      this.centralDirectorySize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // offset of start of central directory with respect to the starting disk number

      this.centralDirectoryOffset = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // .ZIP file comment length

      this.commentLength = input[ip++] | input[ip++] << 8; // .ZIP file comment

      this.comment = input.subarray(ip, ip + this.commentLength);
    };

    Zlib$1.Unzip.prototype.parseFileHeader = function () {
      /** @type {Array.<Zlib.Unzip.FileHeader>} */
      var filelist = [];
      /** @type {Object.<string, number>} */

      var filetable = {};
      /** @type {number} */

      var ip;
      /** @type {Zlib.Unzip.FileHeader} */

      var fileHeader;
      /*: @type {number} */

      var i;
      /*: @type {number} */

      var il;

      if (this.fileHeaderList) {
        return;
      }

      if (this.centralDirectoryOffset === void 0) {
        this.parseEndOfCentralDirectoryRecord();
      }

      ip = this.centralDirectoryOffset;

      for (i = 0, il = this.totalEntries; i < il; ++i) {
        fileHeader = new Zlib$1.Unzip.FileHeader(this.input, ip);
        fileHeader.parse();
        ip += fileHeader.length;
        filelist[i] = fileHeader;
        filetable[fileHeader.filename] = i;
      }

      if (this.centralDirectorySize < ip - this.centralDirectoryOffset) {
        throw new Error('invalid file header size');
      }

      this.fileHeaderList = filelist;
      this.filenameToIndex = filetable;
    };
    /**
     * @param {number} index file header index.
     * @param {Object=} opt_params
     * @return {!(Array.<number>|Uint8Array)} file data.
     */


    Zlib$1.Unzip.prototype.getFileData = function (index, opt_params) {
      opt_params = opt_params || {};
      /** @type {!(Array.<number>|Uint8Array)} */

      var input = this.input;
      /** @type {Array.<Zlib.Unzip.FileHeader>} */

      var fileHeaderList = this.fileHeaderList;
      /** @type {Zlib.Unzip.LocalFileHeader} */

      var localFileHeader;
      /** @type {number} */

      var offset;
      /** @type {number} */

      var length;
      /** @type {!(Array.<number>|Uint8Array)} */

      var buffer;
      /** @type {number} */

      var crc32;
      /** @type {Array.<number>|Uint32Array|Object} */

      var key;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;

      if (!fileHeaderList) {
        this.parseFileHeader();
      }

      if (fileHeaderList[index] === void 0) {
        throw new Error('wrong index');
      }

      offset = fileHeaderList[index].relativeOffset;
      localFileHeader = new Zlib$1.Unzip.LocalFileHeader(this.input, offset);
      localFileHeader.parse();
      offset += localFileHeader.length;
      length = localFileHeader.compressedSize; // decryption

      if ((localFileHeader.flags & Zlib$1.Unzip.LocalFileHeader.Flags.ENCRYPT) !== 0) {
        if (!(opt_params['password'] || this.password)) {
          throw new Error('please set password');
        }

        key = this.createDecryptionKey(opt_params['password'] || this.password); // encryption header

        for (i = offset, il = offset + 12; i < il; ++i) {
          this.decode(key, input[i]);
        }

        offset += 12;
        length -= 12; // decryption

        for (i = offset, il = offset + length; i < il; ++i) {
          input[i] = this.decode(key, input[i]);
        }
      }

      switch (localFileHeader.compression) {
        case Zlib$1.Unzip.CompressionMethod.STORE:
          buffer = this.input.subarray(offset, offset + length);
          break;

        case Zlib$1.Unzip.CompressionMethod.DEFLATE:
          buffer = new Zlib$1.RawInflate(this.input, {
            'index': offset,
            'bufferSize': localFileHeader.plainSize
          }).decompress();
          break;

        default:
          throw new Error('unknown compression type');
      }

      if (this.verify) {
        crc32 = Zlib$1.CRC32.calc(buffer);

        if (localFileHeader.crc32 !== crc32) {
          throw new Error('wrong crc: file=0x' + localFileHeader.crc32.toString(16) + ', data=0x' + crc32.toString(16));
        }
      }

      return buffer;
    };
    /**
     * @return {Array.<string>}
     */


    Zlib$1.Unzip.prototype.getFilenames = function () {
      /** @type {Array.<string>} */
      var filenameList = [];
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      /** @type {Array.<Zlib.Unzip.FileHeader>} */

      var fileHeaderList;

      if (!this.fileHeaderList) {
        this.parseFileHeader();
      }

      fileHeaderList = this.fileHeaderList;

      for (i = 0, il = fileHeaderList.length; i < il; ++i) {
        filenameList[i] = fileHeaderList[i].filename;
      }

      return filenameList;
    };
    /**
     * @param {string} filename extract filename.
     * @param {Object=} opt_params
     * @return {!(Array.<number>|Uint8Array)} decompressed data.
     */


    Zlib$1.Unzip.prototype.decompress = function (filename, opt_params) {
      /** @type {number} */
      var index;

      if (!this.filenameToIndex) {
        this.parseFileHeader();
      }

      index = this.filenameToIndex[filename];

      if (index === void 0) {
        throw new Error(filename + ' not found');
      }

      return this.getFileData(index, opt_params);
    };
    /**
     * @param {(Array.<number>|Uint8Array)} password
     */


    Zlib$1.Unzip.prototype.setPassword = function (password) {
      this.password = password;
    };
    /**
     * @param {(Array.<number>|Uint32Array|Object)} key
     * @param {number} n
     * @return {number}
     */


    Zlib$1.Unzip.prototype.decode = function (key, n) {
      n ^= this.getByte(
      /** @type {(Array.<number>|Uint32Array)} */
      key);
      this.updateKeys(
      /** @type {(Array.<number>|Uint32Array)} */
      key, n);
      return n;
    }; // common method


    Zlib$1.Unzip.prototype.updateKeys = Zlib$1.Zip.prototype.updateKeys;
    Zlib$1.Unzip.prototype.createDecryptionKey = Zlib$1.Zip.prototype.createEncryptionKey;
    Zlib$1.Unzip.prototype.getByte = Zlib$1.Zip.prototype.getByte;
    /**
     * @fileoverview 雑多な関数群をまとめたモジュール実装.
     */

    /**
     * Byte String から Byte Array に変換.
     * @param {!string} str byte string.
     * @return {!Array.<number>} byte array.
     */

    Zlib$1.Util.stringToByteArray = function (str) {
      /** @type {!Array.<(string|number)>} */
      var tmp = str.split('');
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;

      for (i = 0, il = tmp.length; i < il; i++) {
        tmp[i] = (tmp[i].charCodeAt(0) & 0xff) >>> 0;
      }

      return tmp;
    };
    /**
     * @fileoverview Adler32 checksum 実装.
     */

    /**
     * Adler32 ハッシュ値の作成
     * @param {!(Array|Uint8Array|string)} array 算出に使用する byte array.
     * @return {number} Adler32 ハッシュ値.
     */


    Zlib$1.Adler32 = function (array) {
      if (typeof array === 'string') {
        array = Zlib$1.Util.stringToByteArray(array);
      }

      return Zlib$1.Adler32.update(1, array);
    };
    /**
     * Adler32 ハッシュ値の更新
     * @param {number} adler 現在のハッシュ値.
     * @param {!(Array|Uint8Array)} array 更新に使用する byte array.
     * @return {number} Adler32 ハッシュ値.
     */


    Zlib$1.Adler32.update = function (adler, array) {
      /** @type {number} */
      var s1 = adler & 0xffff;
      /** @type {number} */

      var s2 = adler >>> 16 & 0xffff;
      /** @type {number} array length */

      var len = array.length;
      /** @type {number} loop length (don't overflow) */

      var tlen;
      /** @type {number} array index */

      var i = 0;

      while (len > 0) {
        tlen = len > Zlib$1.Adler32.OptimizationParameter ? Zlib$1.Adler32.OptimizationParameter : len;
        len -= tlen;

        do {
          s1 += array[i++];
          s2 += s1;
        } while (--tlen);

        s1 %= 65521;
        s2 %= 65521;
      }

      return (s2 << 16 | s1) >>> 0;
    };
    /**
     * Adler32 最適化パラメータ
     * 現状では 1024 程度が最適.
     * @see http://jsperf.com/adler-32-simple-vs-optimized/3
     * @define {number}
     */


    Zlib$1.Adler32.OptimizationParameter = 1024;
    /**
     * ビットストリーム
     * @constructor
     * @param {!(Array|Uint8Array)=} buffer output buffer.
     * @param {number=} bufferPosition start buffer pointer.
     */

    Zlib$1.BitStream = function (buffer, bufferPosition) {
      /** @type {number} buffer index. */
      this.index = typeof bufferPosition === 'number' ? bufferPosition : 0;
      /** @type {number} bit index. */

      this.bitindex = 0;
      /** @type {!(Array|Uint8Array)} bit-stream output buffer. */

      this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(Zlib$1.BitStream.DefaultBlockSize); // 入力された index が足りなかったら拡張するが、倍にしてもダメなら不正とする

      if (this.buffer.length * 2 <= this.index) {
        throw new Error("invalid index");
      } else if (this.buffer.length <= this.index) {
        this.expandBuffer();
      }
    };
    /**
     * デフォルトブロックサイズ.
     * @const
     * @type {number}
     */


    Zlib$1.BitStream.DefaultBlockSize = 0x8000;
    /**
     * expand buffer.
     * @return {!(Array|Uint8Array)} new buffer.
     */

    Zlib$1.BitStream.prototype.expandBuffer = function () {
      /** @type {!(Array|Uint8Array)} old buffer. */
      var oldbuf = this.buffer;
      /** @type {number} loop limiter. */

      var il = oldbuf.length;
      /** @type {!(Array|Uint8Array)} new buffer. */

      var buffer = new Uint8Array(il << 1); // copy buffer

      {
        buffer.set(oldbuf);
      }
      return this.buffer = buffer;
    };
    /**
     * 数値をビットで指定した数だけ書き込む.
     * @param {number} number 書き込む数値.
     * @param {number} n 書き込むビット数.
     * @param {boolean=} reverse 逆順に書き込むならば true.
     */


    Zlib$1.BitStream.prototype.writeBits = function (number, n, reverse) {
      var buffer = this.buffer;
      var index = this.index;
      var bitindex = this.bitindex;
      /** @type {number} current octet. */

      var current = buffer[index];
      /** @type {number} loop counter. */

      var i;
      /**
       * 32-bit 整数のビット順を逆にする
       * @param {number} n 32-bit integer.
       * @return {number} reversed 32-bit integer.
       * @private
       */

      function rev32_(n) {
        return Zlib$1.BitStream.ReverseTable[n & 0xFF] << 24 | Zlib$1.BitStream.ReverseTable[n >>> 8 & 0xFF] << 16 | Zlib$1.BitStream.ReverseTable[n >>> 16 & 0xFF] << 8 | Zlib$1.BitStream.ReverseTable[n >>> 24 & 0xFF];
      }

      if (reverse && n > 1) {
        number = n > 8 ? rev32_(number) >> 32 - n : Zlib$1.BitStream.ReverseTable[number] >> 8 - n;
      } // Byte 境界を超えないとき


      if (n + bitindex < 8) {
        current = current << n | number;
        bitindex += n; // Byte 境界を超えるとき
      } else {
        for (i = 0; i < n; ++i) {
          current = current << 1 | number >> n - i - 1 & 1; // next byte

          if (++bitindex === 8) {
            bitindex = 0;
            buffer[index++] = Zlib$1.BitStream.ReverseTable[current];
            current = 0; // expand

            if (index === buffer.length) {
              buffer = this.expandBuffer();
            }
          }
        }
      }

      buffer[index] = current;
      this.buffer = buffer;
      this.bitindex = bitindex;
      this.index = index;
    };
    /**
     * ストリームの終端処理を行う
     * @return {!(Array|Uint8Array)} 終端処理後のバッファを byte array で返す.
     */


    Zlib$1.BitStream.prototype.finish = function () {
      var buffer = this.buffer;
      var index = this.index;
      /** @type {!(Array|Uint8Array)} output buffer. */

      var output; // bitindex が 0 の時は余分に index が進んでいる状態

      if (this.bitindex > 0) {
        buffer[index] <<= 8 - this.bitindex;
        buffer[index] = Zlib$1.BitStream.ReverseTable[buffer[index]];
        index++;
      } // array truncation


      {
        output = buffer.subarray(0, index);
      }
      return output;
    };
    /**
     * 0-255 のビット順を反転したテーブル
     * @const
     * @type {!(Uint8Array|Array.<number>)}
     */


    Zlib$1.BitStream.ReverseTable = function (table) {
      return table;
    }(function () {
      /** @type {!(Array|Uint8Array)} reverse table. */
      var table = new Uint8Array(256);
      /** @type {number} loop counter. */

      var i; // generate

      for (i = 0; i < 256; ++i) {
        table[i] = function (n) {
          var r = n;
          var s = 7;

          for (n >>>= 1; n; n >>>= 1) {
            r <<= 1;
            r |= n & 1;
            --s;
          }

          return (r << s & 0xff) >>> 0;
        }(i);
      }

      return table;
    }());
    /**
     * CRC32 ハッシュ値を取得
     * @param {!(Array.<number>|Uint8Array)} data data byte array.
     * @param {number=} pos data position.
     * @param {number=} length data length.
     * @return {number} CRC32.
     */


    Zlib$1.CRC32.calc = function (data, pos, length) {
      return Zlib$1.CRC32.update(data, 0, pos, length);
    };
    /**
     * CRC32ハッシュ値を更新
     * @param {!(Array.<number>|Uint8Array)} data data byte array.
     * @param {number} crc CRC32.
     * @param {number=} pos data position.
     * @param {number=} length data length.
     * @return {number} CRC32.
     */


    Zlib$1.CRC32.update = function (data, crc, pos, length) {
      var table = Zlib$1.CRC32.Table;
      var i = typeof pos === 'number' ? pos : pos = 0;
      var il = typeof length === 'number' ? length : data.length;
      crc ^= 0xffffffff; // loop unrolling for performance

      for (i = il & 7; i--; ++pos) {
        crc = crc >>> 8 ^ table[(crc ^ data[pos]) & 0xff];
      }

      for (i = il >> 3; i--; pos += 8) {
        crc = crc >>> 8 ^ table[(crc ^ data[pos]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 1]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 2]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 3]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 4]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 5]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 6]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 7]) & 0xff];
      }

      return (crc ^ 0xffffffff) >>> 0;
    };
    /**
     * @param {number} num
     * @param {number} crc
     * @returns {number}
     */


    Zlib$1.CRC32.single = function (num, crc) {
      return (Zlib$1.CRC32.Table[(num ^ crc) & 0xff] ^ num >>> 8) >>> 0;
    };
    /**
     * @type {Array.<number>}
     * @const
     * @private
     */


    Zlib$1.CRC32.Table_ = [0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f, 0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9, 0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d];
    /**
     * @type {!(Array.<number>|Uint32Array)} CRC-32 Table.
     * @const
     */

    Zlib$1.CRC32.Table = new Uint32Array(Zlib$1.CRC32.Table_);
    /**
     * @fileoverview Deflate (RFC1951) 実装.
     * Deflateアルゴリズム本体は Zlib.RawDeflate で実装されている.
     */

    /**
     * Zlib Deflate
     * @constructor
     * @param {!(Array|Uint8Array)} input 符号化する対象の byte array.
     * @param {Object=} opt_params option parameters.
     */

    Zlib$1.Deflate = function (input, opt_params) {
      /** @type {!(Array|Uint8Array)} */
      this.input = input;
      /** @type {!(Array|Uint8Array)} */

      this.output = new Uint8Array(Zlib$1.Deflate.DefaultBufferSize);
      /** @type {Zlib.Deflate.CompressionType} */

      this.compressionType = Zlib$1.Deflate.CompressionType.DYNAMIC;
      /** @type {Zlib.RawDeflate} */

      this.rawDeflate;
      /** @type {Object} */

      var rawDeflateOption = {};
      /** @type {string} */

      var prop; // option parameters

      if (opt_params || !(opt_params = {})) {
        if (typeof opt_params['compressionType'] === 'number') {
          this.compressionType = opt_params['compressionType'];
        }
      } // copy options


      for (prop in opt_params) {
        rawDeflateOption[prop] = opt_params[prop];
      } // set raw-deflate output buffer


      rawDeflateOption['outputBuffer'] = this.output;
      this.rawDeflate = new Zlib$1.RawDeflate(this.input, rawDeflateOption);
    };
    /**
     * @const
     * @type {number} デフォルトバッファサイズ.
     */


    Zlib$1.Deflate.DefaultBufferSize = 0x8000;
    /**
     * @enum {number}
     */

    Zlib$1.Deflate.CompressionType = Zlib$1.RawDeflate.CompressionType;
    /**
     * 直接圧縮に掛ける.
     * @param {!(Array|Uint8Array)} input target buffer.
     * @param {Object=} opt_params option parameters.
     * @return {!(Array|Uint8Array)} compressed data byte array.
     */

    Zlib$1.Deflate.compress = function (input, opt_params) {
      return new Zlib$1.Deflate(input, opt_params).compress();
    };
    /**
     * Deflate Compression.
     * @return {!(Array|Uint8Array)} compressed data byte array.
     */


    Zlib$1.Deflate.prototype.compress = function () {
      /** @type {Zlib.CompressionMethod} */
      var cm;
      /** @type {number} */

      var cinfo;
      /** @type {number} */

      var cmf;
      /** @type {number} */

      var flg;
      /** @type {number} */

      var fcheck;
      /** @type {number} */

      var fdict;
      /** @type {number} */

      var flevel;
      /** @type {number} */

      var adler;
      /** @type {!(Array|Uint8Array)} */

      var output;
      /** @type {number} */

      var pos = 0;
      output = this.output; // Compression Method and Flags

      cm = Zlib$1.CompressionMethod.DEFLATE;

      switch (cm) {
        case Zlib$1.CompressionMethod.DEFLATE:
          cinfo = Math.LOG2E * Math.log(Zlib$1.RawDeflate.WindowSize) - 8;
          break;

        default:
          throw new Error('invalid compression method');
      }

      cmf = cinfo << 4 | cm;
      output[pos++] = cmf; // Flags

      fdict = 0;

      switch (cm) {
        case Zlib$1.CompressionMethod.DEFLATE:
          switch (this.compressionType) {
            case Zlib$1.Deflate.CompressionType.NONE:
              flevel = 0;
              break;

            case Zlib$1.Deflate.CompressionType.FIXED:
              flevel = 1;
              break;

            case Zlib$1.Deflate.CompressionType.DYNAMIC:
              flevel = 2;
              break;

            default:
              throw new Error('unsupported compression type');
          }

          break;

        default:
          throw new Error('invalid compression method');
      }

      flg = flevel << 6 | fdict << 5;
      fcheck = 31 - (cmf * 256 + flg) % 31;
      flg |= fcheck;
      output[pos++] = flg; // Adler-32 checksum

      adler = Zlib$1.Adler32(this.input);
      this.rawDeflate.op = pos;
      output = this.rawDeflate.compress();
      pos = output.length;
      {
        // subarray 分を元にもどす
        output = new Uint8Array(output.buffer); // expand buffer

        if (output.length <= pos + 4) {
          this.output = new Uint8Array(output.length + 4);
          this.output.set(output);
          output = this.output;
        }

        output = output.subarray(0, pos + 4);
      } // adler32

      output[pos++] = adler >> 24 & 0xff;
      output[pos++] = adler >> 16 & 0xff;
      output[pos++] = adler >> 8 & 0xff;
      output[pos++] = adler & 0xff;
      return output;
    };
    /**
     * Covers string literals and String objects
     * @param x
     * @returns {boolean}
     */


    function isString$1(x) {
      return typeof x === "string" || x instanceof String;
    }

    function isGoogleURL$1(url) {
      return url.includes("googleapis") && !url.includes("urlshortener") || isGoogleStorageURL$1(url) || isGoogleDriveURL$1(url);
    }

    function isGoogleStorageURL$1(url) {
      return url.startsWith("gs://") || url.startsWith("https://www.googleapis.com/storage") || url.startsWith("https://storage.cloud.google.com") || url.startsWith("https://storage.googleapis.com");
    }

    function isGoogleDriveURL$1(url) {
      return url.indexOf("drive.google.com") >= 0 || url.indexOf("www.googleapis.com/drive") > 0;
    }
    /**
     * Translate gs:// urls to https
     * See https://cloud.google.com/storage/docs/json_api/v1
     * @param gsUrl
     * @returns {string|*}
     */


    function translateGoogleCloudURL$1(gsUrl) {
      let {
        bucket,
        object
      } = parseBucketName$1(gsUrl);
      object = encode$1(object);
      const qIdx = gsUrl.indexOf('?');
      const paramString = qIdx > 0 ? gsUrl.substring(qIdx) + "&alt=media" : "?alt=media";
      return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}${paramString}`;
    }
    /**
     * Parse a google bucket and object name from a google storage URL.  Known forms include
     *
     * gs://BUCKET_NAME/OBJECT_NAME
     * https://storage.googleapis.com/BUCKET_NAME/OBJECT_NAME
     * https://storage.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
     * https://www.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME"
     * https://storage.googleapis.com/download/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
     *
     * @param url
     */


    function parseBucketName$1(url) {
      let bucket;
      let object;

      if (url.startsWith("gs://")) {
        const i = url.indexOf('/', 5);

        if (i >= 0) {
          bucket = url.substring(5, i);
          const qIdx = url.indexOf('?');
          object = qIdx < 0 ? url.substring(i + 1) : url.substring(i + 1, qIdx);
        }
      } else if (url.startsWith("https://storage.googleapis.com") || url.startsWith("https://storage.cloud.google.com")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);

        if (bucketIdx > 0) {
          const objIdx = url.indexOf("/o/", bucketIdx);

          if (objIdx > 0) {
            const queryIdx = url.indexOf("?", objIdx);
            bucket = url.substring(bucketIdx + 6, objIdx);
            object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
          }
        } else {
          const idx1 = url.indexOf("/", 8);
          const idx2 = url.indexOf("/", idx1 + 1);
          const idx3 = url.indexOf("?", idx2);

          if (idx2 > 0) {
            bucket = url.substring(idx1 + 1, idx2);
            object = idx3 < 0 ? url.substring(idx2 + 1) : url.substring(idx2 + 1, idx3);
          }
        }
      } else if (url.startsWith("https://www.googleapis.com/storage/v1/b")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);
        const objIdx = url.indexOf("/o/", bucketIdx);

        if (objIdx > 0) {
          const queryIdx = url.indexOf("?", objIdx);
          bucket = url.substring(bucketIdx + 6, objIdx);
          object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
        }
      }

      if (bucket && object) {
        return {
          bucket,
          object
        };
      } else {
        throw Error(`Unrecognized Google Storage URI: ${url}`);
      }
    }

    function driveDownloadURL$1(link) {
      // Return a google drive download url for the sharable link
      //https://drive.google.com/open?id=0B-lleX9c2pZFbDJ4VVRxakJzVGM
      //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
      var id = getGoogleDriveFileID$1(link);
      return id ? "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media&supportsTeamDrives=true" : link;
    }

    function getGoogleDriveFileID$1(link) {
      //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
      //https://www.googleapis.com/drive/v3/files/1w-tvo6p1SH4p1OaQSVxpkV_EJgGIstWF?alt=media&supportsTeamDrives=true"
      if (link.includes("/open?id=")) {
        const i1 = link.indexOf("/open?id=") + 9;
        const i2 = link.indexOf("&");

        if (i1 > 0 && i2 > i1) {
          return link.substring(i1, i2);
        } else if (i1 > 0) {
          return link.substring(i1);
        }
      } else if (link.includes("/file/d/")) {
        const i1 = link.indexOf("/file/d/") + 8;
        const i2 = link.lastIndexOf("/");
        return link.substring(i1, i2);
      } else if (link.startsWith("https://www.googleapis.com/drive")) {
        let i1 = link.indexOf("/files/");
        const i2 = link.indexOf("?");

        if (i1 > 0) {
          i1 += 7;
          return i2 > 0 ? link.substring(i1, i2) : link.substring(i1);
        }
      }

      throw Error("Unknown Google Drive url format: " + link);
    }
    /**
     * Percent a GCS object name.  See https://cloud.google.com/storage/docs/request-endpoints
     * Specific characters to encode:
     *   !, #, $, &, ', (, ), *, +, ,, /, :, ;, =, ?, @, [, ], and space characters.
     * @param obj
     */


    function encode$1(objectName) {
      let result = '';
      objectName.split('').forEach(function (letter) {
        if (encodings$1.has(letter)) {
          result += encodings$1.get(letter);
        } else {
          result += letter;
        }
      });
      return result;
    } //	%23	%24	%25	%26	%27	%28	%29	%2A	%2B	%2C	%2F	%3A	%3B	%3D	%3F	%40	%5B	%5D


    const encodings$1 = new Map();
    encodings$1.set("!", "%21");
    encodings$1.set("#", "%23");
    encodings$1.set("$", "%24");
    encodings$1.set("%", "%25");
    encodings$1.set("&", "%26");
    encodings$1.set("'", "%27");
    encodings$1.set("(", "%28");
    encodings$1.set(")", "%29");
    encodings$1.set("*", "%2A");
    encodings$1.set("+", "%2B");
    encodings$1.set(",", "%2C");
    encodings$1.set("/", "%2F");
    encodings$1.set(":", "%3A");
    encodings$1.set(";", "%3B");
    encodings$1.set("=", "%3D");
    encodings$1.set("?", "%3F");
    encodings$1.set("@", "%40");
    encodings$1.set("[", "%5B");
    encodings$1.set("]", "%5D");
    encodings$1.set(" ", "%20"); // Convenience functions for the gapi oAuth library.

    const FIVE_MINUTES$1 = 5 * 60 * 1000;

    function isInitialized$1() {
      return typeof gapi !== "undefined" && gapi.auth2 && gapi.auth2.getAuthInstance();
    }

    let inProgress$1 = false;

    async function getAccessToken$1(scope) {
      if (typeof gapi === "undefined") {
        throw Error("Google authentication requires the 'gapi' library");
      }

      if (!gapi.auth2) {
        throw Error("Google 'auth2' has not been initialized");
      }

      if (inProgress$1) {
        return new Promise(function (resolve, reject) {
          let intervalID;

          const checkForToken = () => {
            // Wait for inProgress to equal "false"
            try {
              if (inProgress$1 === false) {
                //console.log("Delayed resolution for " + scope);
                resolve(getAccessToken$1(scope));
                clearInterval(intervalID);
              }
            } catch (e) {
              clearInterval(intervalID);
              reject(e);
            }
          };

          intervalID = setInterval(checkForToken, 100);
        });
      } else {
        inProgress$1 = true;

        try {
          let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
          let token;

          if (currentUser.isSignedIn()) {
            if (!currentUser.hasGrantedScopes(scope)) {
              await currentUser.grant({
                scope
              });
            }

            const {
              access_token,
              expires_at
            } = currentUser.getAuthResponse();

            if (Date.now() < expires_at - FIVE_MINUTES$1) {
              token = {
                access_token,
                expires_at
              };
            } else {
              const {
                access_token,
                expires_at
              } = currentUser.reloadAuthResponse();
              token = {
                access_token,
                expires_at
              };
            }
          } else {
            currentUser = await signIn$1(scope);
            const {
              access_token,
              expires_at
            } = currentUser.getAuthResponse();
            token = {
              access_token,
              expires_at
            };
          }

          return token;
        } finally {
          inProgress$1 = false;
        }
      }
    }
    /**
     * Return the current access token if the user is signed in, or undefined otherwise.  This function does not
     * attempt a signIn or request any specfic scopes.
     *
     * @returns access_token || undefined
     */


    function getCurrentAccessToken$1() {
      let currentUser = gapi.auth2.getAuthInstance().currentUser.get();

      if (currentUser && currentUser.isSignedIn()) {
        const {
          access_token,
          expires_at
        } = currentUser.getAuthResponse();
        return {
          access_token,
          expires_at
        };
      } else {
        return undefined;
      }
    }

    async function signIn$1(scope) {
      const options = new gapi.auth2.SigninOptionsBuilder();
      options.setPrompt('select_account');
      options.setScope(scope);
      return gapi.auth2.getAuthInstance().signIn(options);
    }

    function getScopeForURL$1(url) {
      if (isGoogleDriveURL$1(url)) {
        return "https://www.googleapis.com/auth/drive.file";
      } else if (isGoogleStorageURL$1(url)) {
        return "https://www.googleapis.com/auth/devstorage.read_only";
      } else {
        return 'https://www.googleapis.com/auth/userinfo.profile';
      }
    }

    function getApiKey$1() {
      return gapi.apiKey;
    }

    async function getDriveFileInfo$1(googleDriveURL) {
      const id = getGoogleDriveFileID$1(googleDriveURL);
      let endPoint = "https://www.googleapis.com/drive/v3/files/" + id + "?supportsTeamDrives=true";
      const apiKey = getApiKey$1();

      if (apiKey) {
        endPoint += "&key=" + apiKey;
      }

      const response = await fetch(endPoint);
      let json = await response.json();

      if (json.error && json.error.code === 404) {
        const {
          access_token
        } = await getAccessToken$1("https://www.googleapis.com/auth/drive.readonly");

        if (access_token) {
          const response = await fetch(endPoint, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });
          json = await response.json();

          if (json.error) {
            throw Error(json.error);
          }
        } else {
          throw Error(json.error);
        }
      }

      return json;
    }

    if (typeof process === 'object' && typeof window === 'undefined') {
      global.atob = function (str) {
        return Buffer.from(str, 'base64').toString('binary');
      };
    }
    /**
     * @param dataURI
     * @returns {Array<number>|Uint8Array}
     */


    function decodeDataURI$1(dataURI) {
      const split = dataURI.split(',');
      const info = split[0].split(':')[1];
      let dataString = split[1];

      if (info.indexOf('base64') >= 0) {
        dataString = atob(dataString);
      } else {
        dataString = decodeURI(dataString); // URL encoded string -- not currently used of tested
      }

      const bytes = new Uint8Array(dataString.length);

      for (let i = 0; i < dataString.length; i++) {
        bytes[i] = dataString.charCodeAt(i);
      }

      let plain;

      if (info.indexOf('gzip') > 0) {
        const inflate = new Zlib$1.Gunzip(bytes);
        plain = inflate.decompress();
      } else {
        plain = bytes;
      }

      return plain;
    }

    function parseUri$1(str) {
      var o = options$1,
          m = o.parser["loose"].exec(str),
          uri = {},
          i = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });
      return uri;
    }

    const options$1 = {
      strictMode: false,
      key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
      q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };

    function getExtension(url) {
      if (undefined === url) {
        return undefined;
      }

      let path = isFilePath(url) || url.google_url ? url.name : url;
      let filename = path.toLowerCase(); //Strip parameters -- handle local files later

      let index = filename.indexOf("?");

      if (index > 0) {
        filename = filename.substr(0, index);
      } //Strip aux extensions .gz, .tab, and .txt


      if (filename.endsWith(".gz")) {
        filename = filename.substr(0, filename.length - 3);
      } else if (filename.endsWith(".txt") || filename.endsWith(".tab") || filename.endsWith(".bgz")) {
        filename = filename.substr(0, filename.length - 4);
      }

      index = filename.lastIndexOf(".");
      return index < 0 ? filename : filename.substr(1 + index);
    }
    /**
     * Return the filename from the path.   Example
     *   https://foo.com/bar.bed?param=2   => bar.bed
     * @param urlOrFile
     */


    function getFilename$3(urlOrFile) {
      if (urlOrFile instanceof File) {
        return urlOrFile.name;
      } else if (isString$1(urlOrFile)) {
        let index = urlOrFile.lastIndexOf("/");
        let filename = index < 0 ? urlOrFile : urlOrFile.substr(index + 1); //Strip parameters -- handle local files later

        index = filename.indexOf("?");

        if (index > 0) {
          filename = filename.substr(0, index);
        }

        return filename;
      } else {
        throw Error(`Expected File or string, got ${typeof urlOrFile}`);
      }
    }

    function isFilePath(path) {
      return path instanceof File;
    }

    function download(filename, data) {
      const element = document.createElement('a');
      element.setAttribute('href', data);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
    /*
     *  Author: Jim Robinson, 2020
     *
     * Wrapper functions for the Google picker API
     *
     * PREQUISITES
     *    gapi loaded
     *    oauth2 loaded and initialized
     *
     * This wrapper is stateless -- this is important as multiple copies of igv-utils might be present
     * in an application.  All state is held in the gapi library itself.
     */


    async function init() {
      return new Promise(function (resolve, reject) {
        gapi.load("picker", {
          callback: resolve,
          onerror: reject
        });
      });
    }

    async function createDropdownButtonPicker(multipleFileSelection, filePickerHandler) {
      if (typeof gapi === "undefined") {
        throw Error("Google authentication requires the 'gapi' library");
      }

      if (typeof google === "undefined" || !google.picker) {
        await init();
      }

      const {
        access_token
      } = await getAccessToken$1('https://www.googleapis.com/auth/drive.file');

      if (access_token) {
        const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
        view.setIncludeFolders(true);
        const teamView = new google.picker.DocsView(google.picker.ViewId.DOCS);
        teamView.setEnableTeamDrives(true);
        teamView.setIncludeFolders(true);
        let picker;

        if (multipleFileSelection) {
          picker = new google.picker.PickerBuilder().enableFeature(google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(access_token).addView(view).addView(teamView).enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES).setCallback(function (data) {
            if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
              filePickerHandler(data[google.picker.Response.DOCUMENTS]);
            }
          }).build();
        } else {
          picker = new google.picker.PickerBuilder().disableFeature(google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(access_token).addView(view).addView(teamView).enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES).setCallback(function (data) {
            if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
              filePickerHandler(data[google.picker.Response.DOCUMENTS]);
            }
          }).build();
        }

        picker.setVisible(true);
      } else {
        throw Error("Sign into Google before using picker");
      }
    } // Uncompress data,  assumed to be series of bgzipped blocks


    function unbgzf$1(data, lim) {
      const oBlockList = [];
      let ptr = 0;
      let totalSize = 0;
      lim = lim || data.byteLength - 18;

      while (ptr < lim) {
        try {
          const ba = new Uint8Array(data, ptr, 18);
          const xlen = ba[11] << 8 | ba[10];
          const si1 = ba[12];
          const si2 = ba[13];
          const slen = ba[15] << 8 | ba[14];
          const bsize = (ba[17] << 8 | ba[16]) + 1;
          const start = 12 + xlen + ptr; // Start of CDATA

          const bytesLeft = data.byteLength - start;
          const cDataSize = bsize - xlen - 19;
          if (bytesLeft < cDataSize || cDataSize <= 0) break;
          const a = new Uint8Array(data, start, cDataSize);
          const inflate = new Zlib$1.RawInflate(a);
          const unc = inflate.decompress();
          ptr += inflate.ip + 26;
          totalSize += unc.byteLength;
          oBlockList.push(unc);
        } catch (e) {
          console.error(e);
          break;
        }
      } // Concatenate decompressed blocks


      if (oBlockList.length === 1) {
        return oBlockList[0];
      } else {
        const out = new Uint8Array(totalSize);
        let cursor = 0;

        for (let i = 0; i < oBlockList.length; ++i) {
          var b = new Uint8Array(oBlockList[i]);
          arrayCopy$1(b, 0, out, cursor, b.length);
          cursor += b.length;
        }

        return out;
      }
    } // From Thomas Down's zlib implementation


    const testArray$1 = new Uint8Array(1);
    const hasSubarray$1 = typeof testArray$1.subarray === 'function';

    function arrayCopy$1(src, srcOffset, dest, destOffset, count) {
      if (count === 0) {
        return;
      }

      if (!src) {
        throw "Undef src";
      } else if (!dest) {
        throw "Undef dest";
      }

      if (srcOffset === 0 && count === src.length) {
        arrayCopy_fast$1(src, dest, destOffset);
      } else if (hasSubarray$1) {
        arrayCopy_fast$1(src.subarray(srcOffset, srcOffset + count), dest, destOffset);
      } else if (src.BYTES_PER_ELEMENT === 1 && count > 100) {
        arrayCopy_fast$1(new Uint8Array(src.buffer, src.byteOffset + srcOffset, count), dest, destOffset);
      } else {
        arrayCopy_slow$1(src, srcOffset, dest, destOffset, count);
      }
    }

    function arrayCopy_slow$1(src, srcOffset, dest, destOffset, count) {
      for (let i = 0; i < count; ++i) {
        dest[destOffset + i] = src[srcOffset + i];
      }
    }

    function arrayCopy_fast$1(src, dest, destOffset) {
      dest.set(src, destOffset);
    }
    /**
     * Make the target element movable by clicking and dragging on the handle.  This is not a general purprose function,
     * it makes several options specific to igv dialogs, the primary one being that the
     * target is absolutely positioned in pixel coordinates

     */


    let dragData; // Its assumed we are only dragging one element at a time.

    function makeDraggable(target, handle) {
      handle.addEventListener('mousedown', dragStart.bind(target));
    }

    function dragStart(event) {
      event.stopPropagation();
      event.preventDefault();
      offset(this);
      const dragFunction = drag.bind(this);
      const dragEndFunction = dragEnd.bind(this);
      const computedStyle = getComputedStyle(this);
      const top = parseInt(computedStyle.top.replace("px", ""));
      const left = parseInt(computedStyle.left.replace("px", ""));
      dragData = {
        dragFunction: dragFunction,
        dragEndFunction: dragEndFunction,
        screenX: event.screenX,
        screenY: event.screenY,
        top: top,
        left: left
      };
      document.addEventListener('mousemove', dragFunction);
      document.addEventListener('mouseup', dragEndFunction);
      document.addEventListener('mouseleave', dragEndFunction);
      document.addEventListener('mouseexit', dragEndFunction);
    }

    function drag(event) {
      if (!dragData) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      const dx = event.screenX - dragData.screenX;
      const dy = event.screenY - dragData.screenY;
      this.style.left = `${dragData.left + dx}px`;
      this.style.top = `${dragData.top + dy}px`;
    }

    function dragEnd(event) {
      if (!dragData) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
      const dragFunction = dragData.dragFunction;
      const dragEndFunction = dragData.dragEndFunction;
      document.removeEventListener('mousemove', dragFunction);
      document.removeEventListener('mouseup', dragEndFunction);
      document.removeEventListener('mouseleave', dragEndFunction);
      document.removeEventListener('mouseexit', dragEndFunction);
      dragData = undefined;
    } // Support for oauth token based authorization
    // This class supports explicit setting of an oauth token either globally or for specific hosts.
    //
    // The variable oauth.google.access_token, which becomes igv.oauth.google.access_token on ES5 conversion is
    // supported for backward compatibility


    const DEFAULT_HOST$1 = "googleapis";
    const oauth$1 = {
      oauthTokens: {},
      setToken: function (token, host) {
        host = host || DEFAULT_HOST$1;
        this.oauthTokens[host] = token;

        if (host === DEFAULT_HOST$1) {
          this.google.access_token = token; // legacy support
        }
      },
      getToken: function (host) {
        host = host || DEFAULT_HOST$1;
        let token;

        for (let key of Object.keys(this.oauthTokens)) {
          const regex = wildcardToRegExp$1(key);

          if (regex.test(host)) {
            token = this.oauthTokens[key];
            break;
          }
        }

        return token;
      },
      removeToken: function (host) {
        host = host || DEFAULT_HOST$1;

        for (let key of Object.keys(this.oauthTokens)) {
          const regex = wildcardToRegExp$1(key);

          if (regex.test(host)) {
            this.oauthTokens[key] = undefined;
          }
        }

        if (host === DEFAULT_HOST$1) {
          this.google.access_token = undefined; // legacy support
        }
      },
      // Special object for google -- legacy support
      google: {
        setToken: function (token) {
          oauth$1.setToken(token);
        }
      }
    };
    /**
     * Creates a RegExp from the given string, converting asterisks to .* expressions,
     * and escaping all other characters.
     *
     * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
     */

    function wildcardToRegExp$1(s) {
      return new RegExp('^' + s.split(/\*+/).map(regExpEscape$1).join('.*') + '$');
    }
    /**
     * RegExp-escapes all characters in the given string.
     *
     * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
     */


    function regExpEscape$1(s) {
      return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    } // The MIT License (MIT)

    /**
     * @constructor
     * @param {Object} options A set op options to pass to the throttle function
     *        @param {number} requestsPerSecond The amount of requests per second
     *                                          the library will limit to
     */


    class Throttle$1 {
      constructor(options) {
        this.requestsPerSecond = options.requestsPerSecond || 10;
        this.lastStartTime = 0;
        this.queued = [];
      }
      /**
       * Adds a promise
       * @param {Function} async function to be executed
       * @param {Object} options A set of options.
       * @return {Promise} A promise
       */


      add(asyncFunction, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
          self.queued.push({
            resolve: resolve,
            reject: reject,
            asyncFunction: asyncFunction
          });
          self.dequeue();
        });
      }
      /**
       * Adds all the promises passed as parameters
       * @param {Function} promises An array of functions that return a promise
       * @param {Object} options A set of options.
       * @param {number} options.signal An AbortSignal object that can be used to abort the returned promise
       * @param {number} options.weight A "weight" of each operation resolving by array of promises
       * @return {Promise} A promise that succeeds when all the promises passed as options do
       */


      addAll(promises, options) {
        var addedPromises = promises.map(function (promise) {
          return this.add(promise, options);
        }.bind(this));
        return Promise.all(addedPromises);
      }

      /**
       * Dequeues a promise
       * @return {void}
       */
      dequeue() {
        if (this.queued.length > 0) {
          var now = new Date(),
              inc = 1000 / this.requestsPerSecond + 1,
              elapsed = now - this.lastStartTime;

          if (elapsed >= inc) {
            this._execute();
          } else {
            // we have reached the limit, schedule a dequeue operation
            setTimeout(function () {
              this.dequeue();
            }.bind(this), inc - elapsed);
          }
        }
      }
      /**
       * Executes the promise
       * @private
       * @return {void}
       */


      async _execute() {
        this.lastStartTime = new Date();
        var candidate = this.queued.shift();
        const f = candidate.asyncFunction;

        try {
          const r = await f();
          candidate.resolve(r);
        } catch (e) {
          candidate.reject(e);
        }
      }

    }
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Broad Institute
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */


    var NONE$1 = 0;
    var GZIP$1 = 1;
    var BGZF$1 = 2;
    var UNKNOWN$1 = 3;
    let RANGE_WARNING_GIVEN$1 = false;
    const googleThrottle$1 = new Throttle$1({
      requestsPerSecond: 8
    });
    const igvxhr$1 = {
      apiKey: undefined,
      setApiKey: function (key) {
        this.apiKey = key;
      },
      load: load$1,
      loadArrayBuffer: async function (url, options) {
        options = options || {};

        if (!options.responseType) {
          options.responseType = "arraybuffer";
        }

        if (url instanceof File) {
          return loadFileSlice$1(url, options);
        } else {
          return load$1(url, options);
        }
      },
      loadJson: async function (url, options) {
        options = options || {};
        const method = options.method || (options.sendData ? "POST" : "GET");

        if (method === "POST") {
          options.contentType = "application/json";
        }

        const result = await this.loadString(url, options);

        if (result) {
          return JSON.parse(result);
        } else {
          return result;
        }
      },
      loadString: async function (path, options) {
        options = options || {};

        if (path instanceof File) {
          return loadStringFromFile$1(path, options);
        } else {
          return loadStringFromUrl$1(path, options);
        }
      }
    };

    async function load$1(url, options) {
      options = options || {};
      const urlType = typeof url; // Resolve functions, promises, and functions that return promises

      url = await (typeof url === 'function' ? url() : url);

      if (url instanceof File) {
        return loadFileSlice$1(url, options);
      } else if (typeof url.startsWith === 'function') {
        // Test for string
        if (url.startsWith("data:")) {
          return decodeDataURI$1(url);
        } else {
          if (url.startsWith("https://drive.google.com")) {
            url = driveDownloadURL$1(url);
          }

          if (isGoogleDriveURL$1(url) || url.startsWith("https://www.dropbox.com")) {
            return googleThrottle$1.add(async function () {
              return loadURL$1(url, options);
            });
          } else {
            return loadURL$1(url, options);
          }
        }
      } else {
        throw Error(`url must be either a 'File', 'string', 'function', or 'Promise'.  Actual type: ${urlType}`);
      }
    }

    async function loadURL$1(url, options) {
      //console.log(`${Date.now()}   ${url}`)
      url = mapUrl$1(url);
      options = options || {};
      let oauthToken = options.oauthToken || getOauthToken$1(url);

      if (oauthToken) {
        oauthToken = await (typeof oauthToken === 'function' ? oauthToken() : oauthToken);
      }

      return new Promise(function (resolve, reject) {
        // Various Google tansformations
        if (isGoogleURL$1(url)) {
          if (isGoogleStorageURL$1(url)) {
            url = translateGoogleCloudURL$1(url);
          }

          url = addApiKey$1(url);

          if (isGoogleDriveURL$1(url)) {
            addTeamDrive$1(url);
          } // If we have an access token try it, but don't force a signIn or request for scopes yet


          if (!oauthToken) {
            oauthToken = getCurrentGoogleAccessToken$1();
          }
        }

        const headers = options.headers || {};

        if (oauthToken) {
          addOauthHeaders$1(headers, oauthToken);
        }

        const range = options.range;
        const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
        navigator.vendor.indexOf("Apple") === 0 && /\sSafari\//.test(navigator.userAgent);

        if (range && isChrome && !isAmazonV4Signed$1(url)) {
          // Hack to prevent caching for byte-ranges. Attempt to fix net:err-cache errors in Chrome
          url += url.includes("?") ? "&" : "?";
          url += "someRandomSeed=" + Math.random().toString(36);
        }

        const xhr = new XMLHttpRequest();
        const sendData = options.sendData || options.body;
        const method = options.method || (sendData ? "POST" : "GET");
        const responseType = options.responseType;
        const contentType = options.contentType;
        const mimeType = options.mimeType;
        xhr.open(method, url);

        if (options.timeout) {
          xhr.timeout = options.timeout;
        }

        if (range) {
          var rangeEnd = range.size ? range.start + range.size - 1 : "";
          xhr.setRequestHeader("Range", "bytes=" + range.start + "-" + rangeEnd); //      xhr.setRequestHeader("Cache-Control", "no-cache");    <= This can cause CORS issues, disabled for now
        }

        if (contentType) {
          xhr.setRequestHeader("Content-Type", contentType);
        }

        if (mimeType) {
          xhr.overrideMimeType(mimeType);
        }

        if (responseType) {
          xhr.responseType = responseType;
        }

        if (headers) {
          for (let key of Object.keys(headers)) {
            const value = headers[key];
            xhr.setRequestHeader(key, value);
          }
        } // NOTE: using withCredentials with servers that return "*" for access-allowed-origin will fail


        if (options.withCredentials === true) {
          xhr.withCredentials = true;
        }

        xhr.onload = async function (event) {
          // when the url points to a local file, the status is 0 but that is not an error
          if (xhr.status === 0 || xhr.status >= 200 && xhr.status <= 300) {
            if (range && xhr.status !== 206 && range.start !== 0) {
              // For small files a range starting at 0 can return the whole file => 200
              // Provide just the slice we asked for, throw out the rest quietly
              // If file is large warn user
              if (xhr.response.length > 100000 && !RANGE_WARNING_GIVEN$1) {
                alert(`Warning: Range header ignored for URL: ${url}.  This can have performance impacts.`);
              }

              resolve(xhr.response.slice(range.start, range.start + range.size));
            } else {
              resolve(xhr.response);
            }
          } else if (typeof gapi !== "undefined" && (xhr.status === 404 || xhr.status === 401 || xhr.status === 403) && isGoogleURL$1(url) && !options.retries) {
            tryGoogleAuth();
          } else {
            if (xhr.status === 403) {
              handleError("Access forbidden: " + url);
            } else if (xhr.status === 416) {
              //  Tried to read off the end of the file.   This shouldn't happen, but if it does return an
              handleError("Unsatisfiable range");
            } else {
              handleError(xhr.status);
            }
          }
        };

        xhr.onerror = function (event) {
          if (isGoogleURL$1(url) && !options.retries) {
            tryGoogleAuth();
          }

          handleError("Error accessing resource: " + url + " Status: " + xhr.status);
        };

        xhr.ontimeout = function (event) {
          handleError("Timed out");
        };

        xhr.onabort = function (event) {
          reject(event);
        };

        try {
          xhr.send(sendData);
        } catch (e) {
          reject(e);
        }

        function handleError(error) {
          if (reject) {
            reject(error);
          } else {
            throw error;
          }
        }

        async function tryGoogleAuth() {
          try {
            const accessToken = await fetchGoogleAccessToken$1(url);
            options.retries = 1;
            options.oauthToken = accessToken;
            const response = await load$1(url, options);
            resolve(response);
          } catch (e) {
            if (e.error) {
              const msg = e.error.startsWith("popup_blocked") ? "Google login popup blocked by browser." : e.error;
              alert(msg);
            } else {
              handleError(e);
            }
          }
        }
      });
    }

    async function loadFileSlice$1(localfile, options) {
      let blob = options && options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile;

      if ("arraybuffer" === options.responseType) {
        return blobToArrayBuffer$1(blob);
      } else {
        // binary string format, shouldn't be used anymore
        return new Promise(function (resolve, reject) {
          const fileReader = new FileReader();

          fileReader.onload = function (e) {
            resolve(fileReader.result);
          };

          fileReader.onerror = function (e) {
            console.error("reject uploading local file " + localfile.name);
            reject(null, fileReader);
          };

          fileReader.readAsBinaryString(blob);
          console.warn("Deprecated method used: readAsBinaryString");
        });
      }
    }

    async function loadStringFromFile$1(localfile, options) {
      const blob = options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile;
      let compression = NONE$1;

      if (options && options.bgz || localfile.name.endsWith(".bgz")) {
        compression = BGZF$1;
      } else if (localfile.name.endsWith(".gz")) {
        compression = GZIP$1;
      }

      if (compression === NONE$1) {
        return blobToText$1(blob);
      } else {
        const arrayBuffer = await blobToArrayBuffer$1(blob);
        return arrayBufferToString$1(arrayBuffer, compression);
      }
    }

    async function blobToArrayBuffer$1(blob) {
      if (typeof blob.arrayBuffer === 'function') {
        return blob.arrayBuffer();
      }

      return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();

        fileReader.onload = function (e) {
          resolve(fileReader.result);
        };

        fileReader.onerror = function (e) {
          console.error("reject uploading local file " + localfile.name);
          reject(null, fileReader);
        };

        fileReader.readAsArrayBuffer(blob);
      });
    }

    async function blobToText$1(blob) {
      if (typeof blob.text === 'function') {
        return blob.text();
      }

      return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();

        fileReader.onload = function (e) {
          resolve(fileReader.result);
        };

        fileReader.onerror = function (e) {
          console.error("reject uploading local file " + localfile.name);
          reject(null, fileReader);
        };

        fileReader.readAsText(blob);
      });
    }

    async function loadStringFromUrl$1(url, options) {
      options = options || {};
      const fn = options.filename || (await getFilename$2(url));
      let compression = UNKNOWN$1;

      if (options.bgz) {
        compression = BGZF$1;
      } else if (fn.endsWith(".gz")) {
        compression = GZIP$1;
      }

      options.responseType = "arraybuffer";
      const data = await igvxhr$1.load(url, options);
      return arrayBufferToString$1(data, compression);
    }

    function isAmazonV4Signed$1(url) {
      return url.indexOf("X-Amz-Signature") > -1;
    }

    function getOauthToken$1(url) {
      // Google is the default provider, don't try to parse host for google URLs
      const host = isGoogleURL$1(url) ? undefined : parseUri$1(url).host;
      let token = oauth$1.getToken(host);

      if (token) {
        return token;
      } else if (host === undefined) {
        const googleToken = getCurrentGoogleAccessToken$1();

        if (googleToken && googleToken.expires_at > Date.now()) {
          return googleToken.access_token;
        }
      }
    }
    /**
     * Return a Google oAuth token, triggering a sign in if required.   This method should not be called until we know
     * a token is required, that is until we've tried the url and received a 401, 403, or 404.
     *
     * @param url
     * @returns the oauth token
     */


    async function fetchGoogleAccessToken$1(url) {
      if (isInitialized$1()) {
        const scope = getScopeForURL$1(url);
        const googleToken = await getAccessToken$1(scope);
        return googleToken ? googleToken.access_token : undefined;
      } else {
        throw Error(`Authorization is required, but Google oAuth has not been initalized. Contact your site administrator for assistance.`);
      }
    }
    /**
     * Return the current google access token, if one exists.  Do not triger signOn or request additional scopes.
     * @returns {undefined|access_token}
     */


    function getCurrentGoogleAccessToken$1() {
      if (isInitialized$1()) {
        const googleToken = getCurrentAccessToken$1();
        return googleToken ? googleToken.access_token : undefined;
      } else {
        return undefined;
      }
    }

    function addOauthHeaders$1(headers, acToken) {
      if (acToken) {
        headers["Cache-Control"] = "no-cache";
        headers["Authorization"] = "Bearer " + acToken;
      }

      return headers;
    }

    function addApiKey$1(url) {
      let apiKey = igvxhr$1.apiKey;

      if (!apiKey && typeof gapi !== "undefined") {
        apiKey = gapi.apiKey;
      }

      if (apiKey !== undefined && !url.includes("key=")) {
        const paramSeparator = url.includes("?") ? "&" : "?";
        url = url + paramSeparator + "key=" + apiKey;
      }

      return url;
    }

    function addTeamDrive$1(url) {
      if (url.includes("supportsTeamDrive")) {
        return url;
      } else {
        const paramSeparator = url.includes("?") ? "&" : "?";
        url = url + paramSeparator + "supportsTeamDrive=true";
      }
    }
    /**
     * Perform some well-known url mappings.
     * @param url
     */


    function mapUrl$1(url) {
      if (url.includes("//www.dropbox.com")) {
        return url.replace("//www.dropbox.com", "//dl.dropboxusercontent.com");
      } else if (url.includes("//drive.google.com")) {
        return driveDownloadURL$1(url);
      } else if (url.includes("//www.broadinstitute.org/igvdata")) {
        return url.replace("//www.broadinstitute.org/igvdata", "//data.broadinstitute.org/igvdata");
      } else if (url.includes("//igvdata.broadinstitute.org")) {
        return url.replace("//igvdata.broadinstitute.org", "https://dn7ywbm9isq8j.cloudfront.net");
      } else if (url.startsWith("ftp://ftp.ncbi.nlm.nih.gov/geo")) {
        return url.replace("ftp://", "https://");
      } else {
        return url;
      }
    }

    function arrayBufferToString$1(arraybuffer, compression) {
      if (compression === UNKNOWN$1 && arraybuffer.byteLength > 2) {
        const m = new Uint8Array(arraybuffer, 0, 2);

        if (m[0] === 31 && m[1] === 139) {
          compression = GZIP$1;
        }
      }

      let plain;

      if (compression === GZIP$1) {
        const inflate = new Zlib$1.Gunzip(new Uint8Array(arraybuffer));
        plain = inflate.decompress();
      } else if (compression === BGZF$1) {
        plain = unbgzf$1(arraybuffer);
      } else {
        plain = new Uint8Array(arraybuffer);
      }

      if ('TextDecoder' in getGlobalObject$1()) {
        return new TextDecoder().decode(plain);
      } else {
        return decodeUTF8$1(plain);
      }
    }
    /**
     * Use when TextDecoder is not available (primarily IE).
     *
     * From: https://gist.github.com/Yaffle/5458286
     *
     * @param octets
     * @returns {string}
     */


    function decodeUTF8$1(octets) {
      var string = "";
      var i = 0;

      while (i < octets.length) {
        var octet = octets[i];
        var bytesNeeded = 0;
        var codePoint = 0;

        if (octet <= 0x7F) {
          bytesNeeded = 0;
          codePoint = octet & 0xFF;
        } else if (octet <= 0xDF) {
          bytesNeeded = 1;
          codePoint = octet & 0x1F;
        } else if (octet <= 0xEF) {
          bytesNeeded = 2;
          codePoint = octet & 0x0F;
        } else if (octet <= 0xF4) {
          bytesNeeded = 3;
          codePoint = octet & 0x07;
        }

        if (octets.length - i - bytesNeeded > 0) {
          var k = 0;

          while (k < bytesNeeded) {
            octet = octets[i + k + 1];
            codePoint = codePoint << 6 | octet & 0x3F;
            k += 1;
          }
        } else {
          codePoint = 0xFFFD;
          bytesNeeded = octets.length - i;
        }

        string += String.fromCodePoint(codePoint);
        i += bytesNeeded + 1;
      }

      return string;
    }

    function getGlobalObject$1() {
      if (typeof self !== 'undefined') {
        return self;
      }

      if (typeof global !== 'undefined') {
        return global;
      } else {
        return window;
      }
    }

    async function getFilename$2(url) {
      if (isString$1(url) && url.startsWith("https://drive.google.com")) {
        // This will fail if Google API key is not defined
        if (getApiKey$1() === undefined) {
          throw Error("Google drive is referenced, but API key is not defined.  An API key is required for Google Drive access");
        }

        const json = await getDriveFileInfo$1(url);
        return json.originalFileName || json.name;
      } else {
        return getFilename$3(url);
      }
    }
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Broad Institute
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    /** An implementation of an interval tree, following the explanation.
     * from CLR.
     *
     * Public interface:
     *   Constructor  IntervalTree
     *   Insertion    insert
     *   Search       findOverlapping
     */


    var BLACK$1 = 1;
    var NIL$1 = {};
    NIL$1.color = BLACK$1;
    NIL$1.parent = NIL$1;
    NIL$1.left = NIL$1;
    NIL$1.right = NIL$1;
    const httpMessages = {
      "401": "Access unauthorized",
      "403": "Access forbidden",
      "404": "Not found"
    };

    class AlertDialog {
      constructor(parent) {
        // container
        this.container = div({
          class: "igv-ui-alert-dialog-container"
        });
        parent.appendChild(this.container);
        this.container.setAttribute('tabIndex', '-1'); // header

        const header = div();
        this.container.appendChild(header);
        this.errorHeadline = div();
        header.appendChild(this.errorHeadline);
        this.errorHeadline.textContent = ''; // body container

        let bodyContainer = div({
          id: 'igv-ui-alert-dialog-body'
        });
        this.container.appendChild(bodyContainer); // body copy

        this.body = div({
          id: 'igv-ui-alert-dialog-body-copy'
        });
        bodyContainer.appendChild(this.body); // ok container

        let ok_container = div();
        this.container.appendChild(ok_container); // ok

        this.ok = div();
        ok_container.appendChild(this.ok);
        this.ok.textContent = 'OK';

        const okHandler = () => {
          if (typeof this.callback === 'function') {
            this.callback("OK");
            this.callback = undefined;
          }

          this.body.innerHTML = '';
          hide(this.container);
        };

        this.ok.addEventListener('click', event => {
          event.stopPropagation();
          okHandler();
        });
        this.container.addEventListener('keypress', event => {
          event.stopPropagation();

          if ('Enter' === event.key) {
            okHandler();
          }
        });
        makeDraggable(this.container, header);
        hide(this.container);
      }

      present(alert, callback) {
        this.errorHeadline.textContent = alert.message ? 'ERROR' : '';
        let string = alert.message || alert;

        if (httpMessages.hasOwnProperty(string)) {
          string = httpMessages[string];
        }

        this.body.innerHTML = string;
        this.callback = callback;
        show(this.container);
        this.container.focus();
      }

    }

    class AlertSingleton {
      constructor(root) {
        if (root) {
          this.alertDialog = undefined;
        }
      }

      init(root) {
        this.alertDialog = new AlertDialog(root);
      }

      present(alert, callback) {
        this.alertDialog.present(alert, callback);
      }

    }

    var AlertSingleton$1 = new AlertSingleton();
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     * Author: Jim Robinson
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    class FileLoadManager {
      constructor() {
        this.dictionary = {};
      }

      inputHandler(path, isIndexFile) {
        this.ingestPath(path, isIndexFile);
      }

      ingestPath(path, isIndexFile) {
        let key = true === isIndexFile ? 'index' : 'data';
        this.dictionary[key] = path.trim();
      }

      didDragDrop(dataTransfer) {
        var files;
        files = dataTransfer.files;
        return files && files.length > 0;
      }

      dragDropHandler(dataTransfer, isIndexFile) {
        var url, files;
        url = dataTransfer.getData('text/uri-list');
        files = dataTransfer.files;

        if (files && files.length > 0) {
          this.ingestPath(files[0], isIndexFile);
        } else if (url && '' !== url) {
          this.ingestPath(url, isIndexFile);
        }
      }

      indexName() {
        return itemName(this.dictionary.index);
      }

      dataName() {
        return itemName(this.dictionary.data);
      }

      reset() {
        this.dictionary = {};
      }

    }

    function itemName(item) {
      return isFilePath(item) ? item.name : item;
    }
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     * Author: Jim Robinson
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */


    class FileLoadWidget {
      constructor({
        widgetParent,
        dataTitle,
        indexTitle,
        mode,
        fileLoadManager,
        dataOnly,
        doURL
      }) {
        dataTitle = dataTitle || 'Data';
        indexTitle = indexTitle || 'Index';
        this.fileLoadManager = fileLoadManager;
        dataOnly = dataOnly || false; // TODO: Remove?

        doURL = doURL || false; // file load widget

        this.container = div({
          class: 'igv-file-load-widget-container'
        });
        widgetParent.appendChild(this.container);
        let config;

        if ('localFile' === mode) {
          // local data/index
          config = {
            parent: this.container,
            doURL: false,
            dataTitle: dataTitle + ' file',
            indexTitle: indexTitle + ' file',
            dataOnly
          };
        } else {
          // url data/index
          config = {
            parent: this.container,
            doURL: true,
            dataTitle: dataTitle + ' URL',
            indexTitle: indexTitle + ' URL',
            dataOnly
          };
        }

        this.createInputContainer(config); // error message container

        this.error_message = div({
          class: 'igv-flw-error-message-container'
        });
        this.container.appendChild(this.error_message); // error message

        this.error_message.appendChild(div({
          class: 'igv-flw-error-message'
        })); // error dismiss button

        attachDialogCloseHandlerWithParent(this.error_message, () => {
          this.dismissErrorMessage();
        });
        this.dismissErrorMessage();
      }

      retrievePaths() {
        this.fileLoadManager.ingestPath(this.inputData.value, false);

        if (this.inputIndex) {
          this.fileLoadManager.ingestPath(this.inputIndex.value, true);
        }

        let paths = [];

        if (this.fileLoadManager.dictionary) {
          if (this.fileLoadManager.dictionary.data) {
            paths.push(this.fileLoadManager.dictionary.data);
          }

          if (this.fileLoadManager.dictionary.index) {
            paths.push(this.fileLoadManager.dictionary.index);
          }
        } // clear input elements


        this.container.querySelectorAll('.igv-flw-input-row').forEach(div => {
          div.querySelector('input').value = '';
        });
        return paths;
      }

      presentErrorMessage(message) {
        this.error_message.querySelector('.igv-flw-error-message').textContent = message;
        show(this.error_message);
      }

      dismissErrorMessage() {
        hide(this.error_message);
        this.error_message.querySelector('.igv-flw-error-message').textContent = '';
      }

      present() {
        show(this.container);
      }

      dismiss() {
        this.dismissErrorMessage(); // const e = this.container.querySelector('.igv-flw-local-file-name-container');
        // if (e) {
        //     DOMUtils.hide(e);
        // }
        // clear input elements

        this.container.querySelectorAll('.igv-flw-input-row').forEach(div => {
          div.querySelector('input').value = '';
        });
        this.fileLoadManager.reset();
      }

      createInputContainer({
        parent,
        doURL,
        dataTitle,
        indexTitle,
        dataOnly
      }) {
        // container
        const container = div({
          class: 'igv-flw-input-container'
        });
        parent.appendChild(container); // data

        const input_data_row = div({
          class: 'igv-flw-input-row'
        });
        container.appendChild(input_data_row);
        let label; // label

        label = div({
          class: 'igv-flw-input-label'
        });
        input_data_row.appendChild(label);
        label.textContent = dataTitle;

        if (true === doURL) {
          this.createURLContainer(input_data_row, 'igv-flw-data-url', false);
        } else {
          this.createLocalFileContainer(input_data_row, 'igv-flw-local-data-file', false);
        }

        if (true === dataOnly) {
          return;
        } // index


        const input_index_row = div({
          class: 'igv-flw-input-row'
        });
        container.appendChild(input_index_row); // label

        label = div({
          class: 'igv-flw-input-label'
        });
        input_index_row.appendChild(label);
        label.textContent = indexTitle;

        if (true === doURL) {
          this.createURLContainer(input_index_row, 'igv-flw-index-url', true);
        } else {
          this.createLocalFileContainer(input_index_row, 'igv-flw-local-index-file', true);
        }
      }

      createURLContainer(parent, id, isIndexFile) {
        const input = create('input');
        input.setAttribute('type', 'text'); // input.setAttribute('placeholder', (true === isIndexFile ? 'Enter index URL' : 'Enter data URL'));

        parent.appendChild(input);

        if (isIndexFile) {
          this.inputIndex = input;
        } else {
          this.inputData = input;
        }
      }

      createLocalFileContainer(parent, id, isIndexFile) {
        const file_chooser_container = div({
          class: 'igv-flw-file-chooser-container'
        });
        parent.appendChild(file_chooser_container);
        const str = `${id}${guid()}`;
        const label = create('label');
        label.setAttribute('for', str);
        file_chooser_container.appendChild(label);
        label.textContent = 'Choose file';
        const input = create('input', {
          class: 'igv-flw-file-chooser-input'
        });
        input.setAttribute('id', str);
        input.setAttribute('name', str);
        input.setAttribute('type', 'file');
        file_chooser_container.appendChild(input);
        const file_name = div({
          class: 'igv-flw-local-file-name-container'
        });
        parent.appendChild(file_name);
        hide(file_name);
        input.addEventListener('change', e => {
          this.dismissErrorMessage();
          const file = e.target.files[0];
          this.fileLoadManager.inputHandler(file, isIndexFile);
          const {
            name
          } = file;
          file_name.textContent = name;
          file_name.setAttribute('title', name);
          show(file_name);
        });
      }

    }

    class FileLoad {
      constructor({
        localFileInput,
        initializeDropbox,
        dropboxButton,
        googleEnabled,
        googleDriveButton
      }) {
        localFileInput.addEventListener('change', async () => {
          if (true === FileLoad.isValidLocalFileInput(localFileInput)) {
            try {
              await this.loadPaths(Array.from(localFileInput.files));
            } catch (e) {
              console.error(e);
              AlertSingleton$1.present(e);
            }

            localFileInput.value = '';
          }
        });
        if (dropboxButton) dropboxButton.addEventListener('click', async () => {
          const result = await initializeDropbox();

          if (true === result) {
            const config = {
              success: async dbFiles => {
                try {
                  await this.loadPaths(dbFiles.map(dbFile => dbFile.link));
                } catch (e) {
                  console.error(e);
                  AlertSingleton$1.present(e);
                }
              },
              cancel: () => {},
              linkType: 'preview',
              multiselect: true,
              folderselect: false
            };
            Dropbox.choose(config);
          } else {
            AlertSingleton$1.present('Cannot connect to Dropbox');
          }
        });

        if (false === googleEnabled) {
          hide(googleDriveButton.parentElement);
        }

        if (true === googleEnabled && googleDriveButton) {
          googleDriveButton.addEventListener('click', () => {
            createDropdownButtonPicker(true, async responses => {
              try {
                await this.loadPaths(responses.map(({
                  url
                }) => url));
              } catch (e) {
                console.error(e);
                AlertSingleton$1.present(e);
              }
            });
          });
        }
      }

      async loadPaths(paths) {//console.log('FileLoad: loadPaths(...)');
      }

      static isValidLocalFileInput(input) {
        return input.files && input.files.length > 0;
      }

    }
    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */


    class MultipleTrackFileLoad {
      constructor({
        $localFileInput,
        initializeDropbox,
        $dropboxButton,
        $googleDriveButton,
        fileLoadHandler,
        multipleFileSelection
      }) {
        this.fileLoadHandler = fileLoadHandler;
        const localFileInput = $localFileInput.get(0);
        const dropboxButton = $dropboxButton ? $dropboxButton.get(0) : undefined;
        const googleDriveButton = $googleDriveButton ? $googleDriveButton.get(0) : undefined;
        localFileInput.addEventListener('change', async () => {
          if (true === MultipleTrackFileLoad.isValidLocalFileInput(localFileInput)) {
            const {
              files
            } = localFileInput;
            const paths = Array.from(files);
            localFileInput.value = '';
            await this.loadPaths(paths);
          }
        });
        if (dropboxButton) dropboxButton.addEventListener('click', async () => {
          const result = await initializeDropbox();

          if (true === result) {
            const obj = {
              success: dbFiles => this.loadPaths(dbFiles.map(({
                link
              }) => link)),
              cancel: () => {},
              linkType: "preview",
              multiselect: multipleFileSelection,
              folderselect: false
            };
            Dropbox.choose(obj);
          } else {
            AlertSingleton$1.present('Cannot connect to Dropbox');
          }
        });

        if (googleDriveButton) {
          googleDriveButton.addEventListener('click', () => {
            createDropdownButtonPicker(multipleFileSelection, async responses => await this.loadPaths(responses.map(({
              name,
              url
            }) => url)));
          });
        }
      }

      async loadPaths(paths) {
        await ingestPaths({
          paths,
          fileLoadHandler: this.fileLoadHandler
        });
      }

      static isValidLocalFileInput(input) {
        return input.files && input.files.length > 0;
      }

      static async getFilename(path) {
        if (path instanceof File) {
          return path.name;
        } else if (isGoogleDriveURL$1(path)) {
          const info = await getDriveFileInfo$1(path);
          return info.name || info.originalFileName;
        } else {
          const result = parseUri$1(path);
          return result.file;
        }
      }

      static isGoogleDrivePath(path) {
        return path instanceof File ? false : isGoogleDriveURL$1(path);
      }

    }

    async function ingestPaths({
      paths,
      fileLoadHandler
    }) {
      try {
        await doIngestPaths({
          paths,
          fileLoadHandler
        });
      } catch (e) {
        console.error(e);
        AlertSingleton$1.present(e.message);
      }
    }

    const indexExtensions = new Set(['bai', 'csi', 'tbi', 'idx', 'crai']);
    const requireIndex = new Set(['bam', 'cram']);

    async function doIngestPaths({
      paths,
      fileLoadHandler
    }) {
      // Search for index files  (.bai, .csi, .tbi, .idx)
      const indexLUT = new Map();
      const dataPaths = [];

      for (let path of paths) {
        const name = await MultipleTrackFileLoad.getFilename(path);
        const extension = getExtension(name);

        if (indexExtensions.has(extension)) {
          // key is the data file name
          const key = createIndexLUTKey(name, extension);
          indexLUT.set(key, {
            indexURL: path,
            indexFilename: MultipleTrackFileLoad.isGoogleDrivePath(path) ? name : undefined
          });
        } else {
          dataPaths.push(path);
        }
      }

      const configurations = [];

      for (let dataPath of dataPaths) {
        const name = await MultipleTrackFileLoad.getFilename(dataPath);

        if (indexLUT.has(name)) {
          const {
            indexURL,
            indexFilename
          } = indexLUT.get(name);
          configurations.push({
            url: dataPath,
            name,
            indexURL,
            indexFilename,
            derivedName: true
          });
        } else if (requireIndex.has(getExtension(name))) {
          throw new Error(`Unable to load track file ${name} - you must select both ${name} and its corresponding index file`);
        } else {
          configurations.push({
            url: dataPath,
            name,
            derivedName: true
          });
        }
      }

      if (configurations) {
        fileLoadHandler(configurations);
      }
    }

    const createIndexLUTKey = (name, extension) => {
      let key = name.substring(0, name.length - (extension.length + 1)); // bam and cram files (.bai, .crai) have 2 conventions:
      // <data>.bam.bai
      // <data>.bai - we will support this one

      if ('bai' === extension && !key.endsWith('bam')) {
        return `${key}.bam`;
      } else if ('crai' === extension && !key.endsWith('cram')) {
        return `${key}.cram`;
      } else {
        return key;
      }
    };

    const singleSet = new Set(['json']);
    const indexSet = new Set(['fai']);

    class GenomeFileLoad extends FileLoad {
      constructor({
        localFileInput,
        initializeDropbox,
        dropboxButton,
        googleEnabled,
        googleDriveButton,
        loadHandler
      }) {
        super({
          localFileInput,
          initializeDropbox,
          dropboxButton,
          googleEnabled,
          googleDriveButton
        });
        this.loadHandler = loadHandler;
      }

      async loadPaths(paths) {
        const status = await GenomeFileLoad.isGZip(paths);

        if (true === status) {
          throw new Error('Genome did not load - gzip file is not allowed');
        } else {
          // If one of the paths is .json, unpack and send to loader
          const single = paths.filter(path => singleSet.has(getExtension(path)));
          let configuration = undefined;

          if (single.length >= 1) {
            configuration = await igvxhr$1.loadJson(single[0]);
          } else if (2 === paths.length) {
            const [_0, _1] = await GenomeFileLoad.getExtension(paths);

            if (indexSet.has(_0)) {
              configuration = {
                fastaURL: paths[1],
                indexURL: paths[0]
              };
            } else if (indexSet.has(_1)) {
              configuration = {
                fastaURL: paths[0],
                indexURL: paths[1]
              };
            }
          }

          if (undefined === configuration) {
            throw new Error('Genome requires either a single JSON file or a FASTA file & index file');
          } else {
            this.loadHandler(configuration);
          }
        }
      }

      static async isGZip(paths) {
        for (let path of paths) {
          const filename = await MultipleTrackFileLoad.getFilename(path);

          if (true === filename.endsWith('.gz')) {
            return true;
          }
        }

        return false;
      }

      static async getExtension(paths) {
        const a = await MultipleTrackFileLoad.getFilename(paths[0]);
        const b = await MultipleTrackFileLoad.getFilename(paths[1]);
        return [a, b].map(name => getExtension(name));
      }

    }

    class SessionFileLoad extends FileLoad {
      constructor({
        localFileInput,
        initializeDropbox,
        dropboxButton,
        googleEnabled,
        googleDriveButton,
        loadHandler
      }) {
        super({
          localFileInput,
          initializeDropbox,
          dropboxButton,
          googleEnabled,
          googleDriveButton
        });
        this.loadHandler = loadHandler;
      }

      async loadPaths(paths) {
        const path = paths[0];

        if ('json' === getExtension(path)) {
          const json = await igvxhr$1.loadJson(path.google_url || path);
          this.loadHandler(json);
        } else if ('xml' === getExtension(path)) {
          const key = true === isFilePath(path) ? 'file' : 'url';
          const o = {};
          o[key] = path;
          this.loadHandler(o);
        } else {
          throw new Error('Session file did not load - invalid format');
        }
      }

    }
    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */


    function configureModal(fileLoadWidget, modal, okHandler) {
      const doDismiss = () => {
        fileLoadWidget.dismiss();
        $(modal).modal('hide');
      };

      const doOK = async () => {
        const result = await okHandler(fileLoadWidget);

        if (true === result) {
          fileLoadWidget.dismiss();
          $(modal).modal('hide');
        }
      };

      let dismiss; // upper dismiss - x - button

      dismiss = modal.querySelector('.modal-header button');
      dismiss.addEventListener('click', doDismiss); // lower dismiss - close - button

      dismiss = modal.querySelector('.modal-footer button:nth-child(1)');
      dismiss.addEventListener('click', doDismiss); // ok - button

      const ok = modal.querySelector('.modal-footer button:nth-child(2)');
      ok.addEventListener('click', doOK);
      modal.addEventListener('keypress', event => {
        if ('Enter' === event.key) {
          doOK();
        }
      });
    }

    var utils = /*#__PURE__*/Object.freeze({
      __proto__: null,
      configureModal: configureModal
    });

    function createURLModal(id, title) {
      const html = `<div id="${id}" class="modal">

            <div class="modal-dialog modal-lg">
    
                <div class="modal-content">
    
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
    
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
    
                    </div>
    
                    <div class="modal-body">
                    </div>
    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal">OK</button>
                    </div>
    
                </div>
    
            </div>

        </div>`;
      const fragment = document.createRange().createContextualFragment(html);
      return fragment.firstChild;
    }

    let fileLoadWidget$1;

    function createSessionWidgets($rootContainer, prefix, localFileInputId, initializeDropbox, dropboxButtonId, googleDriveButtonId, urlModalId, sessionSaveModalId, googleEnabled, loadHandler, JSONProvider) {
      const urlModal = createURLModal(urlModalId, 'Session URL');
      $rootContainer.get(0).appendChild(urlModal);

      if (!googleEnabled) {
        $(`#${googleDriveButtonId}`).parent().hide();
      }

      const fileLoadWidgetConfig = {
        widgetParent: urlModal.querySelector('.modal-body'),
        dataTitle: 'Session',
        indexTitle: undefined,
        mode: 'url',
        fileLoadManager: new FileLoadManager(),
        dataOnly: true,
        doURL: undefined
      };
      fileLoadWidget$1 = new FileLoadWidget(fileLoadWidgetConfig);
      const sessionFileLoadConfig = {
        localFileInput: document.querySelector(`#${localFileInputId}`),
        initializeDropbox,
        dropboxButton: dropboxButtonId ? document.querySelector(`#${dropboxButtonId}`) : undefined,
        googleEnabled,
        googleDriveButton: document.querySelector(`#${googleDriveButtonId}`),
        loadHandler
      };
      const sessionFileLoad = new SessionFileLoad(sessionFileLoadConfig);
      configureModal(fileLoadWidget$1, urlModal, async fileLoadWidget => {
        await sessionFileLoad.loadPaths(fileLoadWidget.retrievePaths());
        return true;
      });
      configureSaveSessionModal($rootContainer, prefix, JSONProvider, sessionSaveModalId);
    }

    function configureSaveSessionModal($rootContainer, prefix, JSONProvider, sessionSaveModalId) {
      const modal = `<div id="${sessionSaveModalId}" class="modal fade igv-app-file-save-modal">

            <div class="modal-dialog modal-lg">
    
                <div class="modal-content">
    
                    <div class="modal-header">
    
                        <div class="modal-title">
                            <div>
                                Save Session File
                            </div>
                        </div>
    
                        <button type="button" class="close" data-dismiss="modal">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
    
                    <div class="modal-body">
                        <input class="form-control" type="text" placeholder="igv-app-session.json">
    
                        <div>
                            Enter session filename with .json suffix
                        </div>
    
                    </div>
    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-sm btn-secondary">OK</button>
                    </div>
    
                </div>
    
            </div>
    
        </div>`;
      const $modal = $(modal);
      $rootContainer.append($modal);
      let $input = $modal.find('input');

      let okHandler = () => {
        const extensions = new Set(['json', 'xml']);
        let filename = $input.val();

        if (undefined === filename || '' === filename) {
          filename = $input.attr('placeholder');
        } else if (false === extensions.has(getExtension(filename))) {
          filename = filename + '.json';
        }

        const json = JSONProvider();

        if (json) {
          const jsonString = JSON.stringify(json, null, '\t');
          const data = URL.createObjectURL(new Blob([jsonString], {
            type: "application/octet-stream"
          }));
          download(filename, data);
        }

        $modal.modal('hide');
      };

      const $ok = $modal.find('.modal-footer button:nth-child(2)');
      $ok.on('click', okHandler);
      $modal.on('show.bs.modal', e => {
        $input.val(`${prefix}-session.json`);
      });
      $input.on('keyup', e => {
        // enter key
        if (13 === e.keyCode) {
          okHandler();
        }
      });
    }
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     * Author: Jim Robinson
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */


    const getDataWrapper = function (data) {
      if (typeof data == 'string' || data instanceof String) {
        return new StringDataWrapper(data);
      } else {
        return new ByteArrayDataWrapper(data);
      }
    }; // Data might be a string, or an UInt8Array


    var StringDataWrapper = function (string) {
      this.data = string;
      this.ptr = 0;
    };

    StringDataWrapper.prototype.nextLine = function () {
      //return this.split(/\r\n|\n|\r/gm);
      var start = this.ptr,
          idx = this.data.indexOf('\n', start);

      if (idx > 0) {
        this.ptr = idx + 1; // Advance pointer for next line

        return idx === start ? undefined : this.data.substring(start, idx).trim();
      } else {
        // Last line
        this.ptr = this.data.length;
        return start >= this.data.length ? undefined : this.data.substring(start).trim();
      }
    }; // For use in applications where whitespace carries meaning
    // Returns "" for an empty row (not undefined like nextLine), since this is needed in AED


    StringDataWrapper.prototype.nextLineNoTrim = function () {
      var start = this.ptr,
          idx = this.data.indexOf('\n', start),
          data = this.data;

      if (idx > 0) {
        this.ptr = idx + 1; // Advance pointer for next line

        if (idx > start && data.charAt(idx - 1) === '\r') {
          // Trim CR manually in CR/LF sequence
          return data.substring(start, idx - 1);
        }

        return data.substring(start, idx);
      } else {
        var length = data.length;
        this.ptr = length; // Return undefined only at the very end of the data

        return start >= length ? undefined : data.substring(start);
      }
    };

    var ByteArrayDataWrapper = function (array) {
      this.data = array;
      this.length = this.data.length;
      this.ptr = 0;
    };

    ByteArrayDataWrapper.prototype.nextLine = function () {
      var c, result;
      result = "";
      if (this.ptr >= this.length) return undefined;

      for (var i = this.ptr; i < this.length; i++) {
        c = String.fromCharCode(this.data[i]);
        if (c === '\r') continue;
        if (c === '\n') break;
        result = result + c;
      }

      this.ptr = i + 1;
      return result;
    }; // The ByteArrayDataWrapper does not do any trimming by default, can reuse the function


    ByteArrayDataWrapper.prototype.nextLineNoTrim = ByteArrayDataWrapper.prototype.nextLine;
    /**
     * @fileoverview Zlib namespace. Zlib の仕様に準拠した圧縮は Zlib.Deflate で実装
     * されている. これは Inflate との共存を考慮している為.
     */

    const ZLIB_STREAM_RAW_INFLATE_BUFFER_SIZE = 65000;
    var Zlib = {
      Huffman: {},
      Util: {},
      CRC32: {}
    };
    /**
     * Compression Method
     * @enum {number}
     */

    Zlib.CompressionMethod = {
      DEFLATE: 8,
      RESERVED: 15
    };
    /**
     * @param {Object=} opt_params options.
     * @constructor
     */

    Zlib.Zip = function (opt_params) {
      opt_params = opt_params || {};
      /** @type {Array.<{
       *   buffer: !(Array.<number>|Uint8Array),
       *   option: Object,
       *   compressed: boolean,
       *   encrypted: boolean,
       *   size: number,
       *   crc32: number
       * }>} */

      this.files = [];
      /** @type {(Array.<number>|Uint8Array)} */

      this.comment = opt_params['comment'];
      /** @type {(Array.<number>|Uint8Array)} */

      this.password;
    };
    /**
     * @enum {number}
     */


    Zlib.Zip.CompressionMethod = {
      STORE: 0,
      DEFLATE: 8
    };
    /**
     * @enum {number}
     */

    Zlib.Zip.OperatingSystem = {
      MSDOS: 0,
      UNIX: 3,
      MACINTOSH: 7
    };
    /**
     * @enum {number}
     */

    Zlib.Zip.Flags = {
      ENCRYPT: 0x0001,
      DESCRIPTOR: 0x0008,
      UTF8: 0x0800
    };
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib.Zip.FileHeaderSignature = [0x50, 0x4b, 0x01, 0x02];
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib.Zip.LocalFileHeaderSignature = [0x50, 0x4b, 0x03, 0x04];
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib.Zip.CentralDirectorySignature = [0x50, 0x4b, 0x05, 0x06];
    /**
     * @param {Array.<number>|Uint8Array} input
     * @param {Object=} opt_params options.
     */

    Zlib.Zip.prototype.addFile = function (input, opt_params) {
      opt_params = opt_params || {};
      /** @type {string} */

      opt_params['filename'];
      /** @type {boolean} */

      var compressed;
      /** @type {number} */

      var size = input.length;
      /** @type {number} */

      var crc32 = 0;

      if (input instanceof Array) {
        input = new Uint8Array(input);
      } // default


      if (typeof opt_params['compressionMethod'] !== 'number') {
        opt_params['compressionMethod'] = Zlib.Zip.CompressionMethod.DEFLATE;
      } // その場で圧縮する場合


      if (opt_params['compress']) {
        switch (opt_params['compressionMethod']) {
          case Zlib.Zip.CompressionMethod.STORE:
            break;

          case Zlib.Zip.CompressionMethod.DEFLATE:
            crc32 = Zlib.CRC32.calc(input);
            input = this.deflateWithOption(input, opt_params);
            compressed = true;
            break;

          default:
            throw new Error('unknown compression method:' + opt_params['compressionMethod']);
        }
      }

      this.files.push({
        buffer: input,
        option: opt_params,
        compressed: compressed,
        encrypted: false,
        size: size,
        crc32: crc32
      });
    };
    /**
     * @param {(Array.<number>|Uint8Array)} password
     */


    Zlib.Zip.prototype.setPassword = function (password) {
      this.password = password;
    };

    Zlib.Zip.prototype.compress = function () {
      /** @type {Array.<{
       *   buffer: !(Array.<number>|Uint8Array),
       *   option: Object,
       *   compressed: boolean,
       *   encrypted: boolean,
       *   size: number,
       *   crc32: number
       * }>} */
      var files = this.files;
      /** @type {{
       *   buffer: !(Array.<number>|Uint8Array),
       *   option: Object,
       *   compressed: boolean,
       *   encrypted: boolean,
       *   size: number,
       *   crc32: number
       * }} */

      var file;
      /** @type {!(Array.<number>|Uint8Array)} */

      var output;
      /** @type {number} */

      var op1;
      /** @type {number} */

      var op2;
      /** @type {number} */

      var op3;
      /** @type {number} */

      var localFileSize = 0;
      /** @type {number} */

      var centralDirectorySize = 0;
      /** @type {number} */

      var endOfCentralDirectorySize;
      /** @type {number} */

      var offset;
      /** @type {number} */

      var needVersion;
      /** @type {number} */

      var flags;
      /** @type {Zlib.Zip.CompressionMethod} */

      var compressionMethod;
      /** @type {Date} */

      var date;
      /** @type {number} */

      var crc32;
      /** @type {number} */

      var size;
      /** @type {number} */

      var plainSize;
      /** @type {number} */

      var filenameLength;
      /** @type {number} */

      var extraFieldLength;
      /** @type {number} */

      var commentLength;
      /** @type {(Array.<number>|Uint8Array)} */

      var filename;
      /** @type {(Array.<number>|Uint8Array)} */

      var extraField;
      /** @type {(Array.<number>|Uint8Array)} */

      var comment;
      /** @type {(Array.<number>|Uint8Array)} */

      var buffer;
      /** @type {*} */

      var tmp;
      /** @type {Array.<number>|Uint32Array|Object} */

      var key;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      /** @type {number} */

      var j;
      /** @type {number} */

      var jl; // ファイルの圧縮

      for (i = 0, il = files.length; i < il; ++i) {
        file = files[i];
        filenameLength = file.option['filename'] ? file.option['filename'].length : 0;
        extraFieldLength = file.option['extraField'] ? file.option['extraField'].length : 0;
        commentLength = file.option['comment'] ? file.option['comment'].length : 0; // 圧縮されていなかったら圧縮

        if (!file.compressed) {
          // 圧縮前に CRC32 の計算をしておく
          file.crc32 = Zlib.CRC32.calc(file.buffer);

          switch (file.option['compressionMethod']) {
            case Zlib.Zip.CompressionMethod.STORE:
              break;

            case Zlib.Zip.CompressionMethod.DEFLATE:
              file.buffer = this.deflateWithOption(file.buffer, file.option);
              file.compressed = true;
              break;

            default:
              throw new Error('unknown compression method:' + file.option['compressionMethod']);
          }
        } // encryption


        if (file.option['password'] !== void 0 || this.password !== void 0) {
          // init encryption
          key = this.createEncryptionKey(file.option['password'] || this.password); // add header

          buffer = file.buffer;
          {
            tmp = new Uint8Array(buffer.length + 12);
            tmp.set(buffer, 12);
            buffer = tmp;
          }

          for (j = 0; j < 12; ++j) {
            buffer[j] = this.encode(key, i === 11 ? file.crc32 & 0xff : Math.random() * 256 | 0);
          } // data encryption


          for (jl = buffer.length; j < jl; ++j) {
            buffer[j] = this.encode(key, buffer[j]);
          }

          file.buffer = buffer;
        } // 必要バッファサイズの計算


        localFileSize += // local file header
        30 + filenameLength + // file data
        file.buffer.length;
        centralDirectorySize += // file header
        46 + filenameLength + commentLength;
      } // end of central directory


      endOfCentralDirectorySize = 22 + (this.comment ? this.comment.length : 0);
      output = new Uint8Array(localFileSize + centralDirectorySize + endOfCentralDirectorySize);
      op1 = 0;
      op2 = localFileSize;
      op3 = op2 + centralDirectorySize; // ファイルの圧縮

      for (i = 0, il = files.length; i < il; ++i) {
        file = files[i];
        filenameLength = file.option['filename'] ? file.option['filename'].length : 0;
        extraFieldLength = 0; // TODO

        commentLength = file.option['comment'] ? file.option['comment'].length : 0; //-------------------------------------------------------------------------
        // local file header & file header
        //-------------------------------------------------------------------------

        offset = op1; // signature
        // local file header

        output[op1++] = Zlib.Zip.LocalFileHeaderSignature[0];
        output[op1++] = Zlib.Zip.LocalFileHeaderSignature[1];
        output[op1++] = Zlib.Zip.LocalFileHeaderSignature[2];
        output[op1++] = Zlib.Zip.LocalFileHeaderSignature[3]; // file header

        output[op2++] = Zlib.Zip.FileHeaderSignature[0];
        output[op2++] = Zlib.Zip.FileHeaderSignature[1];
        output[op2++] = Zlib.Zip.FileHeaderSignature[2];
        output[op2++] = Zlib.Zip.FileHeaderSignature[3]; // compressor info

        needVersion = 20;
        output[op2++] = needVersion & 0xff;
        output[op2++] =
        /** @type {Zlib.Zip.OperatingSystem} */
        file.option['os'] || Zlib.Zip.OperatingSystem.MSDOS; // need version

        output[op1++] = output[op2++] = needVersion & 0xff;
        output[op1++] = output[op2++] = needVersion >> 8 & 0xff; // general purpose bit flag

        flags = 0;

        if (file.option['password'] || this.password) {
          flags |= Zlib.Zip.Flags.ENCRYPT;
        }

        output[op1++] = output[op2++] = flags & 0xff;
        output[op1++] = output[op2++] = flags >> 8 & 0xff; // compression method

        compressionMethod =
        /** @type {Zlib.Zip.CompressionMethod} */
        file.option['compressionMethod'];
        output[op1++] = output[op2++] = compressionMethod & 0xff;
        output[op1++] = output[op2++] = compressionMethod >> 8 & 0xff; // date

        date =
        /** @type {(Date|undefined)} */
        file.option['date'] || new Date();
        output[op1++] = output[op2++] = (date.getMinutes() & 0x7) << 5 | (date.getSeconds() / 2 | 0);
        output[op1++] = output[op2++] = date.getHours() << 3 | date.getMinutes() >> 3; //

        output[op1++] = output[op2++] = (date.getMonth() + 1 & 0x7) << 5 | date.getDate();
        output[op1++] = output[op2++] = (date.getFullYear() - 1980 & 0x7f) << 1 | date.getMonth() + 1 >> 3; // CRC-32

        crc32 = file.crc32;
        output[op1++] = output[op2++] = crc32 & 0xff;
        output[op1++] = output[op2++] = crc32 >> 8 & 0xff;
        output[op1++] = output[op2++] = crc32 >> 16 & 0xff;
        output[op1++] = output[op2++] = crc32 >> 24 & 0xff; // compressed size

        size = file.buffer.length;
        output[op1++] = output[op2++] = size & 0xff;
        output[op1++] = output[op2++] = size >> 8 & 0xff;
        output[op1++] = output[op2++] = size >> 16 & 0xff;
        output[op1++] = output[op2++] = size >> 24 & 0xff; // uncompressed size

        plainSize = file.size;
        output[op1++] = output[op2++] = plainSize & 0xff;
        output[op1++] = output[op2++] = plainSize >> 8 & 0xff;
        output[op1++] = output[op2++] = plainSize >> 16 & 0xff;
        output[op1++] = output[op2++] = plainSize >> 24 & 0xff; // filename length

        output[op1++] = output[op2++] = filenameLength & 0xff;
        output[op1++] = output[op2++] = filenameLength >> 8 & 0xff; // extra field length

        output[op1++] = output[op2++] = extraFieldLength & 0xff;
        output[op1++] = output[op2++] = extraFieldLength >> 8 & 0xff; // file comment length

        output[op2++] = commentLength & 0xff;
        output[op2++] = commentLength >> 8 & 0xff; // disk number start

        output[op2++] = 0;
        output[op2++] = 0; // internal file attributes

        output[op2++] = 0;
        output[op2++] = 0; // external file attributes

        output[op2++] = 0;
        output[op2++] = 0;
        output[op2++] = 0;
        output[op2++] = 0; // relative offset of local header

        output[op2++] = offset & 0xff;
        output[op2++] = offset >> 8 & 0xff;
        output[op2++] = offset >> 16 & 0xff;
        output[op2++] = offset >> 24 & 0xff; // filename

        filename = file.option['filename'];

        if (filename) {
          {
            output.set(filename, op1);
            output.set(filename, op2);
            op1 += filenameLength;
            op2 += filenameLength;
          }
        } // extra field


        extraField = file.option['extraField'];

        if (extraField) {
          {
            output.set(extraField, op1);
            output.set(extraField, op2);
            op1 += extraFieldLength;
            op2 += extraFieldLength;
          }
        } // comment


        comment = file.option['comment'];

        if (comment) {
          {
            output.set(comment, op2);
            op2 += commentLength;
          }
        } //-------------------------------------------------------------------------
        // file data
        //-------------------------------------------------------------------------


        {
          output.set(file.buffer, op1);
          op1 += file.buffer.length;
        }
      } //-------------------------------------------------------------------------
      // end of central directory
      //-------------------------------------------------------------------------
      // signature


      output[op3++] = Zlib.Zip.CentralDirectorySignature[0];
      output[op3++] = Zlib.Zip.CentralDirectorySignature[1];
      output[op3++] = Zlib.Zip.CentralDirectorySignature[2];
      output[op3++] = Zlib.Zip.CentralDirectorySignature[3]; // number of this disk

      output[op3++] = 0;
      output[op3++] = 0; // number of the disk with the start of the central directory

      output[op3++] = 0;
      output[op3++] = 0; // total number of entries in the central directory on this disk

      output[op3++] = il & 0xff;
      output[op3++] = il >> 8 & 0xff; // total number of entries in the central directory

      output[op3++] = il & 0xff;
      output[op3++] = il >> 8 & 0xff; // size of the central directory

      output[op3++] = centralDirectorySize & 0xff;
      output[op3++] = centralDirectorySize >> 8 & 0xff;
      output[op3++] = centralDirectorySize >> 16 & 0xff;
      output[op3++] = centralDirectorySize >> 24 & 0xff; // offset of start of central directory with respect to the starting disk number

      output[op3++] = localFileSize & 0xff;
      output[op3++] = localFileSize >> 8 & 0xff;
      output[op3++] = localFileSize >> 16 & 0xff;
      output[op3++] = localFileSize >> 24 & 0xff; // .ZIP file comment length

      commentLength = this.comment ? this.comment.length : 0;
      output[op3++] = commentLength & 0xff;
      output[op3++] = commentLength >> 8 & 0xff; // .ZIP file comment

      if (this.comment) {
        {
          output.set(this.comment, op3);
          op3 += commentLength;
        }
      }

      return output;
    };
    /**
     * @param {!(Array.<number>|Uint8Array)} input
     * @param {Object=} opt_params options.
     * @return {!(Array.<number>|Uint8Array)}
     */


    Zlib.Zip.prototype.deflateWithOption = function (input, opt_params) {
      /** @type {Zlib.RawDeflate} */
      var deflator = new Zlib.RawDeflate(input, opt_params['deflateOption']);
      return deflator.compress();
    };
    /**
     * @param {(Array.<number>|Uint32Array)} key
     * @return {number}
     */


    Zlib.Zip.prototype.getByte = function (key) {
      /** @type {number} */
      var tmp = key[2] & 0xffff | 2;
      return tmp * (tmp ^ 1) >> 8 & 0xff;
    };
    /**
     * @param {(Array.<number>|Uint32Array|Object)} key
     * @param {number} n
     * @return {number}
     */


    Zlib.Zip.prototype.encode = function (key, n) {
      /** @type {number} */
      var tmp = this.getByte(
      /** @type {(Array.<number>|Uint32Array)} */
      key);
      this.updateKeys(
      /** @type {(Array.<number>|Uint32Array)} */
      key, n);
      return tmp ^ n;
    };
    /**
     * @param {(Array.<number>|Uint32Array)} key
     * @param {number} n
     */


    Zlib.Zip.prototype.updateKeys = function (key, n) {
      key[0] = Zlib.CRC32.single(key[0], n);
      key[1] = (((key[1] + (key[0] & 0xff)) * 20173 >>> 0) * 6681 >>> 0) + 1 >>> 0;
      key[2] = Zlib.CRC32.single(key[2], key[1] >>> 24);
    };
    /**
     * @param {(Array.<number>|Uint8Array)} password
     * @return {!(Array.<number>|Uint32Array|Object)}
     */


    Zlib.Zip.prototype.createEncryptionKey = function (password) {
      /** @type {!(Array.<number>|Uint32Array)} */
      var key = [305419896, 591751049, 878082192];
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      {
        key = new Uint32Array(key);
      }

      for (i = 0, il = password.length; i < il; ++i) {
        this.updateKeys(key, password[i] & 0xff);
      }

      return key;
    };
    /**
     * build huffman table from length list.
     * @param {!(Array.<number>|Uint8Array)} lengths length list.
     * @return {!Array} huffman table.
     */


    Zlib.Huffman.buildHuffmanTable = function (lengths) {
      /** @type {number} length list size. */
      var listSize = lengths.length;
      /** @type {number} max code length for table size. */

      var maxCodeLength = 0;
      /** @type {number} min code length for table size. */

      var minCodeLength = Number.POSITIVE_INFINITY;
      /** @type {number} table size. */

      var size;
      /** @type {!(Array|Uint8Array)} huffman code table. */

      var table;
      /** @type {number} bit length. */

      var bitLength;
      /** @type {number} huffman code. */

      var code;
      /**
       * サイズが 2^maxlength 個のテーブルを埋めるためのスキップ長.
       * @type {number} skip length for table filling.
       */

      var skip;
      /** @type {number} reversed code. */

      var reversed;
      /** @type {number} reverse temp. */

      var rtemp;
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limit. */

      var il;
      /** @type {number} loop counter. */

      var j;
      /** @type {number} table value. */

      var value; // Math.max は遅いので最長の値は for-loop で取得する

      for (i = 0, il = listSize; i < il; ++i) {
        if (lengths[i] > maxCodeLength) {
          maxCodeLength = lengths[i];
        }

        if (lengths[i] < minCodeLength) {
          minCodeLength = lengths[i];
        }
      }

      size = 1 << maxCodeLength;
      table = new Uint32Array(size); // ビット長の短い順からハフマン符号を割り当てる

      for (bitLength = 1, code = 0, skip = 2; bitLength <= maxCodeLength;) {
        for (i = 0; i < listSize; ++i) {
          if (lengths[i] === bitLength) {
            // ビットオーダーが逆になるためビット長分並びを反転する
            for (reversed = 0, rtemp = code, j = 0; j < bitLength; ++j) {
              reversed = reversed << 1 | rtemp & 1;
              rtemp >>= 1;
            } // 最大ビット長をもとにテーブルを作るため、
            // 最大ビット長以外では 0 / 1 どちらでも良い箇所ができる
            // そのどちらでも良い場所は同じ値で埋めることで
            // 本来のビット長以上のビット数取得しても問題が起こらないようにする


            value = bitLength << 16 | i;

            for (j = reversed; j < size; j += skip) {
              table[j] = value;
            }

            ++code;
          }
        } // 次のビット長へ


        ++bitLength;
        code <<= 1;
        skip <<= 1;
      }

      return [table, maxCodeLength, minCodeLength];
    }; //-----------------------------------------------------------------------------

    /** @define {number} buffer block size. */


    var ZLIB_RAW_INFLATE_BUFFER_SIZE = 0x8000; // [ 0x8000 >= ZLIB_BUFFER_BLOCK_SIZE ]
    //-----------------------------------------------------------------------------

    var buildHuffmanTable = Zlib.Huffman.buildHuffmanTable;
    /**
     * @constructor
     * @param {!(Uint8Array|Array.<number>)} input input buffer.
     * @param {Object} opt_params option parameter.
     *
     * opt_params は以下のプロパティを指定する事ができます。
     *   - index: input buffer の deflate コンテナの開始位置.
     *   - blockSize: バッファのブロックサイズ.
     *   - bufferType: Zlib.RawInflate.BufferType の値によってバッファの管理方法を指定する.
     *   - resize: 確保したバッファが実際の大きさより大きかった場合に切り詰める.
     */

    Zlib.RawInflate = function (input, opt_params) {
      /** @type {!(Array.<number>|Uint8Array)} inflated buffer */
      this.buffer;
      /** @type {!Array.<(Array.<number>|Uint8Array)>} */

      this.blocks = [];
      /** @type {number} block size. */

      this.bufferSize = ZLIB_RAW_INFLATE_BUFFER_SIZE;
      /** @type {!number} total output buffer pointer. */

      this.totalpos = 0;
      /** @type {!number} input buffer pointer. */

      this.ip = 0;
      /** @type {!number} bit stream reader buffer. */

      this.bitsbuf = 0;
      /** @type {!number} bit stream reader buffer size. */

      this.bitsbuflen = 0;
      /** @type {!(Array.<number>|Uint8Array)} input buffer. */

      this.input = new Uint8Array(input);
      /** @type {!(Uint8Array|Array.<number>)} output buffer. */

      this.output;
      /** @type {!number} output buffer pointer. */

      this.op;
      /** @type {boolean} is final block flag. */

      this.bfinal = false;
      /** @type {Zlib.RawInflate.BufferType} buffer management. */

      this.bufferType = Zlib.RawInflate.BufferType.ADAPTIVE;
      /** @type {boolean} resize flag for memory size optimization. */

      this.resize = false; // option parameters

      if (opt_params || !(opt_params = {})) {
        if (opt_params['index']) {
          this.ip = opt_params['index'];
        }

        if (opt_params['bufferSize']) {
          this.bufferSize = opt_params['bufferSize'];
        }

        if (opt_params['bufferType']) {
          this.bufferType = opt_params['bufferType'];
        }

        if (opt_params['resize']) {
          this.resize = opt_params['resize'];
        }
      } // initialize


      switch (this.bufferType) {
        case Zlib.RawInflate.BufferType.BLOCK:
          this.op = Zlib.RawInflate.MaxBackwardLength;
          this.output = new Uint8Array(Zlib.RawInflate.MaxBackwardLength + this.bufferSize + Zlib.RawInflate.MaxCopyLength);
          break;

        case Zlib.RawInflate.BufferType.ADAPTIVE:
          this.op = 0;
          this.output = new Uint8Array(this.bufferSize);
          break;

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * @enum {number}
     */


    Zlib.RawInflate.BufferType = {
      BLOCK: 0,
      ADAPTIVE: 1
    };
    /**
     * decompress.
     * @return {!(Uint8Array|Array.<number>)} inflated buffer.
     */

    Zlib.RawInflate.prototype.decompress = function () {
      while (!this.bfinal) {
        this.parseBlock();
      }

      switch (this.bufferType) {
        case Zlib.RawInflate.BufferType.BLOCK:
          return this.concatBufferBlock();

        case Zlib.RawInflate.BufferType.ADAPTIVE:
          return this.concatBufferDynamic();

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * @const
     * @type {number} max backward length for LZ77.
     */


    Zlib.RawInflate.MaxBackwardLength = 32768;
    /**
     * @const
     * @type {number} max copy length for LZ77.
     */

    Zlib.RawInflate.MaxCopyLength = 258;
    /**
     * huffman order
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */

    Zlib.RawInflate.Order = function (table) {
      return new Uint16Array(table);
    }([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    /**
     * huffman length code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib.RawInflate.LengthCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000a, 0x000b, 0x000d, 0x000f, 0x0011, 0x0013, 0x0017, 0x001b, 0x001f, 0x0023, 0x002b, 0x0033, 0x003b, 0x0043, 0x0053, 0x0063, 0x0073, 0x0083, 0x00a3, 0x00c3, 0x00e3, 0x0102, 0x0102, 0x0102]);
    /**
     * huffman length extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib.RawInflate.LengthExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0]);
    /**
     * huffman dist code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib.RawInflate.DistCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d, 0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1, 0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01, 0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001]);
    /**
     * huffman dist extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib.RawInflate.DistExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
    /**
     * fixed huffman length code table
     * @const
     * @type {!Array}
     */


    Zlib.RawInflate.FixedLiteralLengthTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(288);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = i <= 143 ? 8 : i <= 255 ? 9 : i <= 279 ? 7 : 8;
      }

      return buildHuffmanTable(lengths);
    }());
    /**
     * fixed huffman distance code table
     * @const
     * @type {!Array}
     */


    Zlib.RawInflate.FixedDistanceTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(30);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = 5;
      }

      return buildHuffmanTable(lengths);
    }());
    /**
     * parse deflated block.
     */


    Zlib.RawInflate.prototype.parseBlock = function () {
      /** @type {number} header */
      var hdr = this.readBits(3); // BFINAL

      if (hdr & 0x1) {
        this.bfinal = true;
      } // BTYPE


      hdr >>>= 1;

      switch (hdr) {
        // uncompressed
        case 0:
          this.parseUncompressedBlock();
          break;
        // fixed huffman

        case 1:
          this.parseFixedHuffmanBlock();
          break;
        // dynamic huffman

        case 2:
          this.parseDynamicHuffmanBlock();
          break;
        // reserved or other

        default:
          throw new Error('unknown BTYPE: ' + hdr);
      }
    };
    /**
     * read inflate bits
     * @param {number} length bits length.
     * @return {number} read bits.
     */


    Zlib.RawInflate.prototype.readBits = function (length) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {number} */

      var inputLength = input.length;
      /** @type {number} input and output byte. */

      var octet; // input byte

      if (ip + (length - bitsbuflen + 7 >> 3) >= inputLength) {
        throw new Error('input buffer is broken');
      } // not enough buffer


      while (bitsbuflen < length) {
        bitsbuf |= input[ip++] << bitsbuflen;
        bitsbuflen += 8;
      } // output byte


      octet = bitsbuf &
      /* MASK */
      (1 << length) - 1;
      bitsbuf >>>= length;
      bitsbuflen -= length;
      this.bitsbuf = bitsbuf;
      this.bitsbuflen = bitsbuflen;
      this.ip = ip;
      return octet;
    };
    /**
     * read huffman code using table
     * @param {!(Array.<number>|Uint8Array|Uint16Array)} table huffman code table.
     * @return {number} huffman code.
     */


    Zlib.RawInflate.prototype.readCodeByTable = function (table) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {number} */

      var inputLength = input.length;
      /** @type {!(Array.<number>|Uint8Array)} huffman code table */

      var codeTable = table[0];
      /** @type {number} */

      var maxCodeLength = table[1];
      /** @type {number} code length & code (16bit, 16bit) */

      var codeWithLength;
      /** @type {number} code bits length */

      var codeLength; // not enough buffer

      while (bitsbuflen < maxCodeLength) {
        if (ip >= inputLength) {
          break;
        }

        bitsbuf |= input[ip++] << bitsbuflen;
        bitsbuflen += 8;
      } // read max length


      codeWithLength = codeTable[bitsbuf & (1 << maxCodeLength) - 1];
      codeLength = codeWithLength >>> 16;

      if (codeLength > bitsbuflen) {
        throw new Error('invalid code length: ' + codeLength);
      }

      this.bitsbuf = bitsbuf >> codeLength;
      this.bitsbuflen = bitsbuflen - codeLength;
      this.ip = ip;
      return codeWithLength & 0xffff;
    };
    /**
     * parse uncompressed block.
     */


    Zlib.RawInflate.prototype.parseUncompressedBlock = function () {
      var input = this.input;
      var ip = this.ip;
      var output = this.output;
      var op = this.op;
      /** @type {number} */

      var inputLength = input.length;
      /** @type {number} block length */

      var len;
      /** @type {number} number for check block length */

      var nlen;
      /** @type {number} output buffer length */

      var olength = output.length;
      /** @type {number} copy counter */

      var preCopy; // skip buffered header bits

      this.bitsbuf = 0;
      this.bitsbuflen = 0; // len

      if (ip + 1 >= inputLength) {
        throw new Error('invalid uncompressed block header: LEN');
      }

      len = input[ip++] | input[ip++] << 8; // nlen

      if (ip + 1 >= inputLength) {
        throw new Error('invalid uncompressed block header: NLEN');
      }

      nlen = input[ip++] | input[ip++] << 8; // check len & nlen

      if (len === ~nlen) {
        throw new Error('invalid uncompressed block header: length verify');
      } // check size


      if (ip + len > input.length) {
        throw new Error('input buffer is broken');
      } // expand buffer


      switch (this.bufferType) {
        case Zlib.RawInflate.BufferType.BLOCK:
          // pre copy
          while (op + len > output.length) {
            preCopy = olength - op;
            len -= preCopy;
            {
              output.set(input.subarray(ip, ip + preCopy), op);
              op += preCopy;
              ip += preCopy;
            }
            this.op = op;
            output = this.expandBufferBlock();
            op = this.op;
          }

          break;

        case Zlib.RawInflate.BufferType.ADAPTIVE:
          while (op + len > output.length) {
            output = this.expandBufferAdaptive({
              fixRatio: 2
            });
          }

          break;

        default:
          throw new Error('invalid inflate mode');
      } // copy


      {
        output.set(input.subarray(ip, ip + len), op);
        op += len;
        ip += len;
      }
      this.ip = ip;
      this.op = op;
      this.output = output;
    };
    /**
     * parse fixed huffman block.
     */


    Zlib.RawInflate.prototype.parseFixedHuffmanBlock = function () {
      switch (this.bufferType) {
        case Zlib.RawInflate.BufferType.ADAPTIVE:
          this.decodeHuffmanAdaptive(Zlib.RawInflate.FixedLiteralLengthTable, Zlib.RawInflate.FixedDistanceTable);
          break;

        case Zlib.RawInflate.BufferType.BLOCK:
          this.decodeHuffmanBlock(Zlib.RawInflate.FixedLiteralLengthTable, Zlib.RawInflate.FixedDistanceTable);
          break;

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * parse dynamic huffman block.
     */


    Zlib.RawInflate.prototype.parseDynamicHuffmanBlock = function () {
      /** @type {number} number of literal and length codes. */
      var hlit = this.readBits(5) + 257;
      /** @type {number} number of distance codes. */

      var hdist = this.readBits(5) + 1;
      /** @type {number} number of code lengths. */

      var hclen = this.readBits(4) + 4;
      /** @type {!(Uint8Array|Array.<number>)} code lengths. */

      var codeLengths = new Uint8Array(Zlib.RawInflate.Order.length);
      /** @type {!Array} code lengths table. */

      var codeLengthsTable;
      /** @type {!(Uint8Array|Array.<number>)} literal and length code table. */

      var litlenTable;
      /** @type {!(Uint8Array|Array.<number>)} distance code table. */

      var distTable;
      /** @type {!(Uint8Array|Array.<number>)} code length table. */

      var lengthTable;
      /** @type {number} */

      var code;
      /** @type {number} */

      var prev;
      /** @type {number} */

      var repeat;
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limit. */

      var il; // decode code lengths

      for (i = 0; i < hclen; ++i) {
        codeLengths[Zlib.RawInflate.Order[i]] = this.readBits(3);
      } // decode length table


      codeLengthsTable = buildHuffmanTable(codeLengths);
      lengthTable = new Uint8Array(hlit + hdist);

      for (i = 0, il = hlit + hdist; i < il;) {
        code = this.readCodeByTable(codeLengthsTable);

        switch (code) {
          case 16:
            repeat = 3 + this.readBits(2);

            while (repeat--) {
              lengthTable[i++] = prev;
            }

            break;

          case 17:
            repeat = 3 + this.readBits(3);

            while (repeat--) {
              lengthTable[i++] = 0;
            }

            prev = 0;
            break;

          case 18:
            repeat = 11 + this.readBits(7);

            while (repeat--) {
              lengthTable[i++] = 0;
            }

            prev = 0;
            break;

          default:
            lengthTable[i++] = code;
            prev = code;
            break;
        }
      }

      litlenTable = buildHuffmanTable(lengthTable.subarray(0, hlit));
      distTable = buildHuffmanTable(lengthTable.subarray(hlit));

      switch (this.bufferType) {
        case Zlib.RawInflate.BufferType.ADAPTIVE:
          this.decodeHuffmanAdaptive(litlenTable, distTable);
          break;

        case Zlib.RawInflate.BufferType.BLOCK:
          this.decodeHuffmanBlock(litlenTable, distTable);
          break;

        default:
          throw new Error('invalid inflate mode');
      }
    };
    /**
     * decode huffman code
     * @param {!(Array.<number>|Uint16Array)} litlen literal and length code table.
     * @param {!(Array.<number>|Uint8Array)} dist distination code table.
     */


    Zlib.RawInflate.prototype.decodeHuffmanBlock = function (litlen, dist) {
      var output = this.output;
      var op = this.op;
      this.currentLitlenTable = litlen;
      /** @type {number} output position limit. */

      var olength = output.length - Zlib.RawInflate.MaxCopyLength;
      /** @type {number} huffman code. */

      var code;
      /** @type {number} table index. */

      var ti;
      /** @type {number} huffman code distination. */

      var codeDist;
      /** @type {number} huffman code length. */

      var codeLength;
      var lengthCodeTable = Zlib.RawInflate.LengthCodeTable;
      var lengthExtraTable = Zlib.RawInflate.LengthExtraTable;
      var distCodeTable = Zlib.RawInflate.DistCodeTable;
      var distExtraTable = Zlib.RawInflate.DistExtraTable;

      while ((code = this.readCodeByTable(litlen)) !== 256) {
        // literal
        if (code < 256) {
          if (op >= olength) {
            this.op = op;
            output = this.expandBufferBlock();
            op = this.op;
          }

          output[op++] = code;
          continue;
        } // length code


        ti = code - 257;
        codeLength = lengthCodeTable[ti];

        if (lengthExtraTable[ti] > 0) {
          codeLength += this.readBits(lengthExtraTable[ti]);
        } // dist code


        code = this.readCodeByTable(dist);
        codeDist = distCodeTable[code];

        if (distExtraTable[code] > 0) {
          codeDist += this.readBits(distExtraTable[code]);
        } // lz77 decode


        if (op >= olength) {
          this.op = op;
          output = this.expandBufferBlock();
          op = this.op;
        }

        while (codeLength--) {
          output[op] = output[op++ - codeDist];
        }
      }

      while (this.bitsbuflen >= 8) {
        this.bitsbuflen -= 8;
        this.ip--;
      }

      this.op = op;
    };
    /**
     * decode huffman code (adaptive)
     * @param {!(Array.<number>|Uint16Array)} litlen literal and length code table.
     * @param {!(Array.<number>|Uint8Array)} dist distination code table.
     */


    Zlib.RawInflate.prototype.decodeHuffmanAdaptive = function (litlen, dist) {
      var output = this.output;
      var op = this.op;
      this.currentLitlenTable = litlen;
      /** @type {number} output position limit. */

      var olength = output.length;
      /** @type {number} huffman code. */

      var code;
      /** @type {number} table index. */

      var ti;
      /** @type {number} huffman code distination. */

      var codeDist;
      /** @type {number} huffman code length. */

      var codeLength;
      var lengthCodeTable = Zlib.RawInflate.LengthCodeTable;
      var lengthExtraTable = Zlib.RawInflate.LengthExtraTable;
      var distCodeTable = Zlib.RawInflate.DistCodeTable;
      var distExtraTable = Zlib.RawInflate.DistExtraTable;

      while ((code = this.readCodeByTable(litlen)) !== 256) {
        // literal
        if (code < 256) {
          if (op >= olength) {
            output = this.expandBufferAdaptive();
            olength = output.length;
          }

          output[op++] = code;
          continue;
        } // length code


        ti = code - 257;
        codeLength = lengthCodeTable[ti];

        if (lengthExtraTable[ti] > 0) {
          codeLength += this.readBits(lengthExtraTable[ti]);
        } // dist code


        code = this.readCodeByTable(dist);
        codeDist = distCodeTable[code];

        if (distExtraTable[code] > 0) {
          codeDist += this.readBits(distExtraTable[code]);
        } // lz77 decode


        if (op + codeLength > olength) {
          output = this.expandBufferAdaptive();
          olength = output.length;
        }

        while (codeLength--) {
          output[op] = output[op++ - codeDist];
        }
      }

      while (this.bitsbuflen >= 8) {
        this.bitsbuflen -= 8;
        this.ip--;
      }

      this.op = op;
    };
    /**
     * expand output buffer.
     * @param {Object=} opt_param option parameters.
     * @return {!(Array.<number>|Uint8Array)} output buffer.
     */


    Zlib.RawInflate.prototype.expandBufferBlock = function (opt_param) {
      /** @type {!(Array.<number>|Uint8Array)} store buffer. */
      var buffer = new Uint8Array(this.op - Zlib.RawInflate.MaxBackwardLength);
      /** @type {number} backward base point */

      var backward = this.op - Zlib.RawInflate.MaxBackwardLength;
      var output = this.output; // copy to output buffer

      {
        buffer.set(output.subarray(Zlib.RawInflate.MaxBackwardLength, buffer.length));
      }
      this.blocks.push(buffer);
      this.totalpos += buffer.length; // copy to backward buffer

      {
        output.set(output.subarray(backward, backward + Zlib.RawInflate.MaxBackwardLength));
      }
      this.op = Zlib.RawInflate.MaxBackwardLength;
      return output;
    };
    /**
     * expand output buffer. (adaptive)
     * @param {Object=} opt_param option parameters.
     * @return {!(Array.<number>|Uint8Array)} output buffer pointer.
     */


    Zlib.RawInflate.prototype.expandBufferAdaptive = function (opt_param) {
      /** @type {!(Array.<number>|Uint8Array)} store buffer. */
      var buffer;
      /** @type {number} expantion ratio. */

      var ratio = this.input.length / this.ip + 1 | 0;
      /** @type {number} maximum number of huffman code. */

      var maxHuffCode;
      /** @type {number} new output buffer size. */

      var newSize;
      /** @type {number} max inflate size. */

      var maxInflateSize;
      var input = this.input;
      var output = this.output;

      if (opt_param) {
        if (typeof opt_param.fixRatio === 'number') {
          ratio = opt_param.fixRatio;
        }

        if (typeof opt_param.addRatio === 'number') {
          ratio += opt_param.addRatio;
        }
      } // calculate new buffer size


      if (ratio < 2) {
        maxHuffCode = (input.length - this.ip) / this.currentLitlenTable[2];
        maxInflateSize = maxHuffCode / 2 * 258 | 0;
        newSize = maxInflateSize < output.length ? output.length + maxInflateSize : output.length << 1;
      } else {
        newSize = output.length * ratio;
      } // buffer expantion


      {
        buffer = new Uint8Array(newSize);
        buffer.set(output);
      }
      this.output = buffer;
      return this.output;
    };
    /**
     * concat output buffer.
     * @return {!(Array.<number>|Uint8Array)} output buffer.
     */


    Zlib.RawInflate.prototype.concatBufferBlock = function () {
      /** @type {number} buffer pointer. */
      var pos = 0;
      /** @type {number} buffer pointer. */

      var limit = this.totalpos + (this.op - Zlib.RawInflate.MaxBackwardLength);
      /** @type {!(Array.<number>|Uint8Array)} output block array. */

      var output = this.output;
      /** @type {!Array} blocks array. */

      var blocks = this.blocks;
      /** @type {!(Array.<number>|Uint8Array)} output block array. */

      var block;
      /** @type {!(Array.<number>|Uint8Array)} output buffer. */

      var buffer = new Uint8Array(limit);
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limiter. */

      var il;
      /** @type {number} loop counter. */

      var j;
      /** @type {number} loop limiter. */

      var jl; // single buffer

      if (blocks.length === 0) {
        return this.output.subarray(Zlib.RawInflate.MaxBackwardLength, this.op);
      } // copy to buffer


      for (i = 0, il = blocks.length; i < il; ++i) {
        block = blocks[i];

        for (j = 0, jl = block.length; j < jl; ++j) {
          buffer[pos++] = block[j];
        }
      } // current buffer


      for (i = Zlib.RawInflate.MaxBackwardLength, il = this.op; i < il; ++i) {
        buffer[pos++] = output[i];
      }

      this.blocks = [];
      this.buffer = buffer;
      return this.buffer;
    };
    /**
     * concat output buffer. (dynamic)
     * @return {!(Array.<number>|Uint8Array)} output buffer.
     */


    Zlib.RawInflate.prototype.concatBufferDynamic = function () {
      /** @type {Array.<number>|Uint8Array} output buffer. */
      var buffer;
      var op = this.op;
      {
        if (this.resize) {
          buffer = new Uint8Array(op);
          buffer.set(this.output.subarray(0, op));
        } else {
          buffer = this.output.subarray(0, op);
        }
      }
      this.buffer = buffer;
      return this.buffer;
    };

    var buildHuffmanTable = Zlib.Huffman.buildHuffmanTable;
    /**
     * @param {!(Uint8Array|Array.<number>)} input input buffer.
     * @param {number} ip input buffer pointer.
     * @param {number=} opt_buffersize buffer block size.
     * @constructor
     */

    Zlib.RawInflateStream = function (input, ip, opt_buffersize) {
      /** @type {!Array.<(Array|Uint8Array)>} */
      this.blocks = [];
      /** @type {number} block size. */

      this.bufferSize = opt_buffersize ? opt_buffersize : ZLIB_STREAM_RAW_INFLATE_BUFFER_SIZE;
      /** @type {!number} total output buffer pointer. */

      this.totalpos = 0;
      /** @type {!number} input buffer pointer. */

      this.ip = ip === void 0 ? 0 : ip;
      /** @type {!number} bit stream reader buffer. */

      this.bitsbuf = 0;
      /** @type {!number} bit stream reader buffer size. */

      this.bitsbuflen = 0;
      /** @type {!(Array|Uint8Array)} input buffer. */

      this.input = new Uint8Array(input);
      /** @type {!(Uint8Array|Array)} output buffer. */

      this.output = new Uint8Array(this.bufferSize);
      /** @type {!number} output buffer pointer. */

      this.op = 0;
      /** @type {boolean} is final block flag. */

      this.bfinal = false;
      /** @type {number} uncompressed block length. */

      this.blockLength;
      /** @type {boolean} resize flag for memory size optimization. */

      this.resize = false;
      /** @type {Array} */

      this.litlenTable;
      /** @type {Array} */

      this.distTable;
      /** @type {number} */

      this.sp = 0; // stream pointer

      /** @type {Zlib.RawInflateStream.Status} */

      this.status = Zlib.RawInflateStream.Status.INITIALIZED; //
      // backup
      //

      /** @type {!number} */

      this.ip_;
      /** @type {!number} */

      this.bitsbuflen_;
      /** @type {!number} */

      this.bitsbuf_;
    };
    /**
     * @enum {number}
     */


    Zlib.RawInflateStream.BlockType = {
      UNCOMPRESSED: 0,
      FIXED: 1,
      DYNAMIC: 2
    };
    /**
     * @enum {number}
     */

    Zlib.RawInflateStream.Status = {
      INITIALIZED: 0,
      BLOCK_HEADER_START: 1,
      BLOCK_HEADER_END: 2,
      BLOCK_BODY_START: 3,
      BLOCK_BODY_END: 4,
      DECODE_BLOCK_START: 5,
      DECODE_BLOCK_END: 6
    };
    /**
     * decompress.
     * @return {!(Uint8Array|Array)} inflated buffer.
     */

    Zlib.RawInflateStream.prototype.decompress = function (newInput, ip) {
      /** @type {boolean} */
      var stop = false;

      if (newInput !== void 0) {
        this.input = newInput;
      }

      if (ip !== void 0) {
        this.ip = ip;
      } // decompress


      while (!stop) {
        switch (this.status) {
          // block header
          case Zlib.RawInflateStream.Status.INITIALIZED:
          case Zlib.RawInflateStream.Status.BLOCK_HEADER_START:
            if (this.readBlockHeader() < 0) {
              stop = true;
            }

            break;
          // block body

          case Zlib.RawInflateStream.Status.BLOCK_HEADER_END:
          /* FALLTHROUGH */

          case Zlib.RawInflateStream.Status.BLOCK_BODY_START:
            switch (this.currentBlockType) {
              case Zlib.RawInflateStream.BlockType.UNCOMPRESSED:
                if (this.readUncompressedBlockHeader() < 0) {
                  stop = true;
                }

                break;

              case Zlib.RawInflateStream.BlockType.FIXED:
                if (this.parseFixedHuffmanBlock() < 0) {
                  stop = true;
                }

                break;

              case Zlib.RawInflateStream.BlockType.DYNAMIC:
                if (this.parseDynamicHuffmanBlock() < 0) {
                  stop = true;
                }

                break;
            }

            break;
          // decode data

          case Zlib.RawInflateStream.Status.BLOCK_BODY_END:
          case Zlib.RawInflateStream.Status.DECODE_BLOCK_START:
            switch (this.currentBlockType) {
              case Zlib.RawInflateStream.BlockType.UNCOMPRESSED:
                if (this.parseUncompressedBlock() < 0) {
                  stop = true;
                }

                break;

              case Zlib.RawInflateStream.BlockType.FIXED:
              /* FALLTHROUGH */

              case Zlib.RawInflateStream.BlockType.DYNAMIC:
                if (this.decodeHuffman() < 0) {
                  stop = true;
                }

                break;
            }

            break;

          case Zlib.RawInflateStream.Status.DECODE_BLOCK_END:
            if (this.bfinal) {
              stop = true;
            } else {
              this.status = Zlib.RawInflateStream.Status.INITIALIZED;
            }

            break;
        }
      }

      return this.concatBuffer();
    };
    /**
     * @const
     * @type {number} max backward length for LZ77.
     */


    Zlib.RawInflateStream.MaxBackwardLength = 32768;
    /**
     * @const
     * @type {number} max copy length for LZ77.
     */

    Zlib.RawInflateStream.MaxCopyLength = 258;
    /**
     * huffman order
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */

    Zlib.RawInflateStream.Order = function (table) {
      return new Uint16Array(table);
    }([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    /**
     * huffman length code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib.RawInflateStream.LengthCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000a, 0x000b, 0x000d, 0x000f, 0x0011, 0x0013, 0x0017, 0x001b, 0x001f, 0x0023, 0x002b, 0x0033, 0x003b, 0x0043, 0x0053, 0x0063, 0x0073, 0x0083, 0x00a3, 0x00c3, 0x00e3, 0x0102, 0x0102, 0x0102]);
    /**
     * huffman length extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib.RawInflateStream.LengthExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0]);
    /**
     * huffman dist code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */


    Zlib.RawInflateStream.DistCodeTable = function (table) {
      return new Uint16Array(table);
    }([0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d, 0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1, 0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01, 0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001]);
    /**
     * huffman dist extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */


    Zlib.RawInflateStream.DistExtraTable = function (table) {
      return new Uint8Array(table);
    }([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
    /**
     * fixed huffman length code table
     * @const
     * @type {!Array}
     */


    Zlib.RawInflateStream.FixedLiteralLengthTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(288);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = i <= 143 ? 8 : i <= 255 ? 9 : i <= 279 ? 7 : 8;
      }

      return buildHuffmanTable(lengths);
    }());
    /**
     * fixed huffman distance code table
     * @const
     * @type {!Array}
     */


    Zlib.RawInflateStream.FixedDistanceTable = function (table) {
      return table;
    }(function () {
      var lengths = new Uint8Array(30);
      var i, il;

      for (i = 0, il = lengths.length; i < il; ++i) {
        lengths[i] = 5;
      }

      return buildHuffmanTable(lengths);
    }());
    /**
     * parse deflated block.
     */


    Zlib.RawInflateStream.prototype.readBlockHeader = function () {
      /** @type {number} header */
      var hdr;
      this.status = Zlib.RawInflateStream.Status.BLOCK_HEADER_START;
      this.save_();

      if ((hdr = this.readBits(3)) < 0) {
        this.restore_();
        return -1;
      } // BFINAL


      if (hdr & 0x1) {
        this.bfinal = true;
      } // BTYPE


      hdr >>>= 1;

      switch (hdr) {
        case 0:
          // uncompressed
          this.currentBlockType = Zlib.RawInflateStream.BlockType.UNCOMPRESSED;
          break;

        case 1:
          // fixed huffman
          this.currentBlockType = Zlib.RawInflateStream.BlockType.FIXED;
          break;

        case 2:
          // dynamic huffman
          this.currentBlockType = Zlib.RawInflateStream.BlockType.DYNAMIC;
          break;

        default:
          // reserved or other
          throw new Error('unknown BTYPE: ' + hdr);
      }

      this.status = Zlib.RawInflateStream.Status.BLOCK_HEADER_END;
    };
    /**
     * read inflate bits
     * @param {number} length bits length.
     * @return {number} read bits.
     */


    Zlib.RawInflateStream.prototype.readBits = function (length) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {number} input and output byte. */

      var octet; // not enough buffer

      while (bitsbuflen < length) {
        // input byte
        if (input.length <= ip) {
          return -1;
        }

        octet = input[ip++]; // concat octet

        bitsbuf |= octet << bitsbuflen;
        bitsbuflen += 8;
      } // output byte


      octet = bitsbuf &
      /* MASK */
      (1 << length) - 1;
      bitsbuf >>>= length;
      bitsbuflen -= length;
      this.bitsbuf = bitsbuf;
      this.bitsbuflen = bitsbuflen;
      this.ip = ip;
      return octet;
    };
    /**
     * read huffman code using table
     * @param {Array} table huffman code table.
     * @return {number} huffman code.
     */


    Zlib.RawInflateStream.prototype.readCodeByTable = function (table) {
      var bitsbuf = this.bitsbuf;
      var bitsbuflen = this.bitsbuflen;
      var input = this.input;
      var ip = this.ip;
      /** @type {!(Array|Uint8Array)} huffman code table */

      var codeTable = table[0];
      /** @type {number} */

      var maxCodeLength = table[1];
      /** @type {number} input byte */

      var octet;
      /** @type {number} code length & code (16bit, 16bit) */

      var codeWithLength;
      /** @type {number} code bits length */

      var codeLength; // not enough buffer

      while (bitsbuflen < maxCodeLength) {
        if (input.length <= ip) {
          return -1;
        }

        octet = input[ip++];
        bitsbuf |= octet << bitsbuflen;
        bitsbuflen += 8;
      } // read max length


      codeWithLength = codeTable[bitsbuf & (1 << maxCodeLength) - 1];
      codeLength = codeWithLength >>> 16;

      if (codeLength > bitsbuflen) {
        throw new Error('invalid code length: ' + codeLength);
      }

      this.bitsbuf = bitsbuf >> codeLength;
      this.bitsbuflen = bitsbuflen - codeLength;
      this.ip = ip;
      return codeWithLength & 0xffff;
    };
    /**
     * read uncompressed block header
     */


    Zlib.RawInflateStream.prototype.readUncompressedBlockHeader = function () {
      /** @type {number} block length */
      var len;
      /** @type {number} number for check block length */

      var nlen;
      var input = this.input;
      var ip = this.ip;
      this.status = Zlib.RawInflateStream.Status.BLOCK_BODY_START;

      if (ip + 4 >= input.length) {
        return -1;
      }

      len = input[ip++] | input[ip++] << 8;
      nlen = input[ip++] | input[ip++] << 8; // check len & nlen

      if (len === ~nlen) {
        throw new Error('invalid uncompressed block header: length verify');
      } // skip buffered header bits


      this.bitsbuf = 0;
      this.bitsbuflen = 0;
      this.ip = ip;
      this.blockLength = len;
      this.status = Zlib.RawInflateStream.Status.BLOCK_BODY_END;
    };
    /**
     * parse uncompressed block.
     */


    Zlib.RawInflateStream.prototype.parseUncompressedBlock = function () {
      var input = this.input;
      var ip = this.ip;
      var output = this.output;
      var op = this.op;
      var len = this.blockLength;
      this.status = Zlib.RawInflateStream.Status.DECODE_BLOCK_START; // copy
      // XXX: とりあえず素直にコピー

      while (len--) {
        if (op === output.length) {
          output = this.expandBuffer({
            fixRatio: 2
          });
        } // not enough input buffer


        if (ip >= input.length) {
          this.ip = ip;
          this.op = op;
          this.blockLength = len + 1; // コピーしてないので戻す

          return -1;
        }

        output[op++] = input[ip++];
      }

      if (len < 0) {
        this.status = Zlib.RawInflateStream.Status.DECODE_BLOCK_END;
      }

      this.ip = ip;
      this.op = op;
      return 0;
    };
    /**
     * parse fixed huffman block.
     */


    Zlib.RawInflateStream.prototype.parseFixedHuffmanBlock = function () {
      this.status = Zlib.RawInflateStream.Status.BLOCK_BODY_START;
      this.litlenTable = Zlib.RawInflateStream.FixedLiteralLengthTable;
      this.distTable = Zlib.RawInflateStream.FixedDistanceTable;
      this.status = Zlib.RawInflateStream.Status.BLOCK_BODY_END;
      return 0;
    };
    /**
     * オブジェクトのコンテキストを別のプロパティに退避する.
     * @private
     */


    Zlib.RawInflateStream.prototype.save_ = function () {
      this.ip_ = this.ip;
      this.bitsbuflen_ = this.bitsbuflen;
      this.bitsbuf_ = this.bitsbuf;
    };
    /**
     * 別のプロパティに退避したコンテキストを復元する.
     * @private
     */


    Zlib.RawInflateStream.prototype.restore_ = function () {
      this.ip = this.ip_;
      this.bitsbuflen = this.bitsbuflen_;
      this.bitsbuf = this.bitsbuf_;
    };
    /**
     * parse dynamic huffman block.
     */


    Zlib.RawInflateStream.prototype.parseDynamicHuffmanBlock = function () {
      /** @type {number} number of literal and length codes. */
      var hlit;
      /** @type {number} number of distance codes. */

      var hdist;
      /** @type {number} number of code lengths. */

      var hclen;
      /** @type {!(Uint8Array|Array)} code lengths. */

      var codeLengths = new Uint8Array(Zlib.RawInflateStream.Order.length);
      /** @type {!Array} code lengths table. */

      var codeLengthsTable;
      this.status = Zlib.RawInflateStream.Status.BLOCK_BODY_START;
      this.save_();
      hlit = this.readBits(5) + 257;
      hdist = this.readBits(5) + 1;
      hclen = this.readBits(4) + 4;

      if (hlit < 0 || hdist < 0 || hclen < 0) {
        this.restore_();
        return -1;
      }

      try {
        parseDynamicHuffmanBlockImpl.call(this);
      } catch (e) {
        this.restore_();
        return -1;
      }

      function parseDynamicHuffmanBlockImpl() {
        /** @type {number} */
        var bits;
        var code;
        var prev = 0;
        var repeat;
        /** @type {!(Uint8Array|Array.<number>)} code length table. */

        var lengthTable;
        /** @type {number} loop counter. */

        var i;
        /** @type {number} loop limit. */

        var il; // decode code lengths

        for (i = 0; i < hclen; ++i) {
          if ((bits = this.readBits(3)) < 0) {
            throw new Error('not enough input');
          }

          codeLengths[Zlib.RawInflateStream.Order[i]] = bits;
        } // decode length table


        codeLengthsTable = buildHuffmanTable(codeLengths);
        lengthTable = new Uint8Array(hlit + hdist);

        for (i = 0, il = hlit + hdist; i < il;) {
          code = this.readCodeByTable(codeLengthsTable);

          if (code < 0) {
            throw new Error('not enough input');
          }

          switch (code) {
            case 16:
              if ((bits = this.readBits(2)) < 0) {
                throw new Error('not enough input');
              }

              repeat = 3 + bits;

              while (repeat--) {
                lengthTable[i++] = prev;
              }

              break;

            case 17:
              if ((bits = this.readBits(3)) < 0) {
                throw new Error('not enough input');
              }

              repeat = 3 + bits;

              while (repeat--) {
                lengthTable[i++] = 0;
              }

              prev = 0;
              break;

            case 18:
              if ((bits = this.readBits(7)) < 0) {
                throw new Error('not enough input');
              }

              repeat = 11 + bits;

              while (repeat--) {
                lengthTable[i++] = 0;
              }

              prev = 0;
              break;

            default:
              lengthTable[i++] = code;
              prev = code;
              break;
          }
        }

        this.litlenTable = buildHuffmanTable(lengthTable.subarray(0, hlit));
        this.distTable = buildHuffmanTable(lengthTable.subarray(hlit));
      }

      this.status = Zlib.RawInflateStream.Status.BLOCK_BODY_END;
      return 0;
    };
    /**
     * decode huffman code (dynamic)
     * @return {(number|undefined)} -1 is error.
     */


    Zlib.RawInflateStream.prototype.decodeHuffman = function () {
      var output = this.output;
      var op = this.op;
      /** @type {number} huffman code. */

      var code;
      /** @type {number} table index. */

      var ti;
      /** @type {number} huffman code distination. */

      var codeDist;
      /** @type {number} huffman code length. */

      var codeLength;
      var litlen = this.litlenTable;
      var dist = this.distTable;
      var olength = output.length;
      var bits;
      this.status = Zlib.RawInflateStream.Status.DECODE_BLOCK_START;

      while (true) {
        this.save_();
        code = this.readCodeByTable(litlen);

        if (code < 0) {
          this.op = op;
          this.restore_();
          return -1;
        }

        if (code === 256) {
          break;
        } // literal


        if (code < 256) {
          if (op === olength) {
            output = this.expandBuffer();
            olength = output.length;
          }

          output[op++] = code;
          continue;
        } // length code


        ti = code - 257;
        codeLength = Zlib.RawInflateStream.LengthCodeTable[ti];

        if (Zlib.RawInflateStream.LengthExtraTable[ti] > 0) {
          bits = this.readBits(Zlib.RawInflateStream.LengthExtraTable[ti]);

          if (bits < 0) {
            this.op = op;
            this.restore_();
            return -1;
          }

          codeLength += bits;
        } // dist code


        code = this.readCodeByTable(dist);

        if (code < 0) {
          this.op = op;
          this.restore_();
          return -1;
        }

        codeDist = Zlib.RawInflateStream.DistCodeTable[code];

        if (Zlib.RawInflateStream.DistExtraTable[code] > 0) {
          bits = this.readBits(Zlib.RawInflateStream.DistExtraTable[code]);

          if (bits < 0) {
            this.op = op;
            this.restore_();
            return -1;
          }

          codeDist += bits;
        } // lz77 decode


        if (op + codeLength >= olength) {
          output = this.expandBuffer();
          olength = output.length;
        }

        while (codeLength--) {
          output[op] = output[op++ - codeDist];
        } // break


        if (this.ip === this.input.length) {
          this.op = op;
          return -1;
        }
      }

      while (this.bitsbuflen >= 8) {
        this.bitsbuflen -= 8;
        this.ip--;
      }

      this.op = op;
      this.status = Zlib.RawInflateStream.Status.DECODE_BLOCK_END;
    };
    /**
     * expand output buffer. (dynamic)
     * @param {Object=} opt_param option parameters.
     * @return {!(Array|Uint8Array)} output buffer pointer.
     */


    Zlib.RawInflateStream.prototype.expandBuffer = function (opt_param) {
      /** @type {!(Array|Uint8Array)} store buffer. */
      var buffer;
      /** @type {number} expantion ratio. */

      var ratio = this.input.length / this.ip + 1 | 0;
      /** @type {number} maximum number of huffman code. */

      var maxHuffCode;
      /** @type {number} new output buffer size. */

      var newSize;
      /** @type {number} max inflate size. */

      var maxInflateSize;
      var input = this.input;
      var output = this.output;

      if (opt_param) {
        if (typeof opt_param.fixRatio === 'number') {
          ratio = opt_param.fixRatio;
        }

        if (typeof opt_param.addRatio === 'number') {
          ratio += opt_param.addRatio;
        }
      } // calculate new buffer size


      if (ratio < 2) {
        maxHuffCode = (input.length - this.ip) / this.litlenTable[2];
        maxInflateSize = maxHuffCode / 2 * 258 | 0;
        newSize = maxInflateSize < output.length ? output.length + maxInflateSize : output.length << 1;
      } else {
        newSize = output.length * ratio;
      } // buffer expantion


      {
        buffer = new Uint8Array(newSize);
        buffer.set(output);
      }
      this.output = buffer;
      return this.output;
    };
    /**
     * concat output buffer. (dynamic)
     * @return {!(Array|Uint8Array)} output buffer.
     */


    Zlib.RawInflateStream.prototype.concatBuffer = function () {
      /** @type {!(Array|Uint8Array)} output buffer. */
      var buffer;
      /** @type {number} */

      var op = this.op;
      /** @type {Uint8Array} */

      var tmp;

      if (this.resize) {
        {
          buffer = new Uint8Array(this.output.subarray(this.sp, op));
        }
      } else {
        buffer = this.output.subarray(this.sp, op);
      }

      this.sp = op; // compaction

      if (op > Zlib.RawInflateStream.MaxBackwardLength + this.bufferSize) {
        this.op = this.sp = Zlib.RawInflateStream.MaxBackwardLength;
        {
          tmp =
          /** @type {Uint8Array} */
          this.output;
          this.output = new Uint8Array(this.bufferSize + Zlib.RawInflateStream.MaxBackwardLength);
          this.output.set(tmp.subarray(op - Zlib.RawInflateStream.MaxBackwardLength, op));
        }
      }

      return buffer;
    };
    /**
     * @constructor
     * @param {!(Uint8Array|Array)} input deflated buffer.
     * @param {Object=} opt_params option parameters.
     *
     * opt_params は以下のプロパティを指定する事ができます。
     *   - index: input buffer の deflate コンテナの開始位置.
     *   - blockSize: バッファのブロックサイズ.
     *   - verify: 伸張が終わった後 adler-32 checksum の検証を行うか.
     *   - bufferType: Zlib.Inflate.BufferType の値によってバッファの管理方法を指定する.
     *       Zlib.Inflate.BufferType は Zlib.RawInflate.BufferType のエイリアス.
     */


    Zlib.Inflate = function (input, opt_params) {
      /** @type {number} */
      var cmf;
      /** @type {number} */

      var flg;
      /** @type {!(Uint8Array|Array)} */

      this.input = input;
      /** @type {number} */

      this.ip = 0;
      /** @type {Zlib.RawInflate} */

      this.rawinflate;
      /** @type {(boolean|undefined)} verify flag. */

      this.verify; // option parameters

      if (opt_params || !(opt_params = {})) {
        if (opt_params['index']) {
          this.ip = opt_params['index'];
        }

        if (opt_params['verify']) {
          this.verify = opt_params['verify'];
        }
      } // Compression Method and Flags


      cmf = input[this.ip++];
      flg = input[this.ip++]; // compression method

      switch (cmf & 0x0f) {
        case Zlib.CompressionMethod.DEFLATE:
          this.method = Zlib.CompressionMethod.DEFLATE;
          break;

        default:
          throw new Error('unsupported compression method');
      } // fcheck


      if (((cmf << 8) + flg) % 31 !== 0) {
        throw new Error('invalid fcheck flag:' + ((cmf << 8) + flg) % 31);
      } // fdict (not supported)


      if (flg & 0x20) {
        throw new Error('fdict flag is not supported');
      } // RawInflate


      this.rawinflate = new Zlib.RawInflate(input, {
        'index': this.ip,
        'bufferSize': opt_params['bufferSize'],
        'bufferType': opt_params['bufferType'],
        'resize': opt_params['resize']
      });
    };
    /**
     * @enum {number}
     */


    Zlib.Inflate.BufferType = Zlib.RawInflate.BufferType;
    /**
     * decompress.
     * @return {!(Uint8Array|Array)} inflated buffer.
     */

    Zlib.Inflate.prototype.decompress = function () {
      /** @type {!(Array|Uint8Array)} input buffer. */
      var input = this.input;
      /** @type {!(Uint8Array|Array)} inflated buffer. */

      var buffer;
      /** @type {number} adler-32 checksum */

      var adler32;
      buffer = this.rawinflate.decompress();
      this.ip = this.rawinflate.ip; // verify adler-32

      if (this.verify) {
        adler32 = (input[this.ip++] << 24 | input[this.ip++] << 16 | input[this.ip++] << 8 | input[this.ip++]) >>> 0;

        if (adler32 !== Zlib.Adler32(buffer)) {
          throw new Error('invalid adler-32 checksum');
        }
      }

      return buffer;
    };
    /* vim:set expandtab ts=2 sw=2 tw=80: */

    /**
     * @param {!(Uint8Array|Array)} input deflated buffer.
     * @constructor
     */


    Zlib.InflateStream = function (input) {
      /** @type {!(Uint8Array|Array)} */
      this.input = input === void 0 ? new Uint8Array() : input;
      /** @type {number} */

      this.ip = 0;
      /** @type {Zlib.RawInflateStream} */

      this.rawinflate = new Zlib.RawInflateStream(this.input, this.ip);
      /** @type {Zlib.CompressionMethod} */

      this.method;
      /** @type {!(Array|Uint8Array)} */

      this.output = this.rawinflate.output;
    };
    /**
     * decompress.
     * @return {!(Uint8Array|Array)} inflated buffer.
     */


    Zlib.InflateStream.prototype.decompress = function (input) {
      /** @type {!(Uint8Array|Array)} inflated buffer. */
      var buffer; // 新しい入力を入力バッファに結合する
      // XXX Array, Uint8Array のチェックを行うか確認する

      if (input !== void 0) {
        {
          var tmp = new Uint8Array(this.input.length + input.length);
          tmp.set(this.input, 0);
          tmp.set(input, this.input.length);
          this.input = tmp;
        }
      }

      if (this.method === void 0) {
        if (this.readHeader() < 0) {
          return new Uint8Array();
        }
      }

      buffer = this.rawinflate.decompress(this.input, this.ip);

      if (this.rawinflate.ip !== 0) {
        this.input = this.input.subarray(this.rawinflate.ip);
        this.ip = 0;
      } // verify adler-32

      /*
      if (this.verify) {
        adler32 =
          input[this.ip++] << 24 | input[this.ip++] << 16 |
          input[this.ip++] << 8 | input[this.ip++];
         if (adler32 !== Zlib.Adler32(buffer)) {
          throw new Error('invalid adler-32 checksum');
        }
      }
      */


      return buffer;
    };

    Zlib.InflateStream.prototype.readHeader = function () {
      var ip = this.ip;
      var input = this.input; // Compression Method and Flags

      var cmf = input[ip++];
      var flg = input[ip++];

      if (cmf === void 0 || flg === void 0) {
        return -1;
      } // compression method


      switch (cmf & 0x0f) {
        case Zlib.CompressionMethod.DEFLATE:
          this.method = Zlib.CompressionMethod.DEFLATE;
          break;

        default:
          throw new Error('unsupported compression method');
      } // fcheck


      if (((cmf << 8) + flg) % 31 !== 0) {
        throw new Error('invalid fcheck flag:' + ((cmf << 8) + flg) % 31);
      } // fdict (not supported)


      if (flg & 0x20) {
        throw new Error('fdict flag is not supported');
      }

      this.ip = ip;
    };
    /**
     * @fileoverview GZIP (RFC1952) 展開コンテナ実装.
     */

    /**
     * @constructor
     * @param {!(Array|Uint8Array)} input input buffer.
     * @param {Object=} opt_params option parameters.
     */


    Zlib.Gunzip = function (input, opt_params) {
      /** @type {!(Array.<number>|Uint8Array)} input buffer. */
      this.input = input;
      /** @type {number} input buffer pointer. */

      this.ip = 0;
      /** @type {Array.<Zlib.GunzipMember>} */

      this.member = [];
      /** @type {boolean} */

      this.decompressed = false;
    };
    /**
     * @return {Array.<Zlib.GunzipMember>}
     */


    Zlib.Gunzip.prototype.getMembers = function () {
      if (!this.decompressed) {
        this.decompress();
      }

      return this.member.slice();
    };
    /**
     * inflate gzip data.
     * @return {!(Array.<number>|Uint8Array)} inflated buffer.
     */


    Zlib.Gunzip.prototype.decompress = function () {
      /** @type {number} input length. */
      var il = this.input.length;

      while (this.ip < il) {
        this.decodeMember();
      }

      this.decompressed = true;
      return this.concatMember();
    };
    /**
     * decode gzip member.
     */


    Zlib.Gunzip.prototype.decodeMember = function () {
      /** @type {Zlib.GunzipMember} */
      var member = new Zlib.GunzipMember();
      /** @type {number} */

      var isize;
      /** @type {Zlib.RawInflate} RawInflate implementation. */

      var rawinflate;
      /** @type {!(Array.<number>|Uint8Array)} inflated data. */

      var inflated;
      /** @type {number} inflate size */

      var inflen;
      /** @type {number} character code */

      var c;
      /** @type {number} character index in string. */

      var ci;
      /** @type {Array.<string>} character array. */

      var str;
      /** @type {number} modification time. */

      var mtime;
      /** @type {number} */

      var crc32;
      var input = this.input;
      var ip = this.ip;
      member.id1 = input[ip++];
      member.id2 = input[ip++]; // check signature

      if (member.id1 !== 0x1f || member.id2 !== 0x8b) {
        throw new Error('invalid file signature:' + member.id1 + ',' + member.id2);
      } // check compression method


      member.cm = input[ip++];

      switch (member.cm) {
        case 8:
          /* XXX: use Zlib const */
          break;

        default:
          throw new Error('unknown compression method: ' + member.cm);
      } // flags


      member.flg = input[ip++]; // modification time

      mtime = input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24;
      member.mtime = new Date(mtime * 1000); // extra flags

      member.xfl = input[ip++]; // operating system

      member.os = input[ip++]; // extra

      if ((member.flg & Zlib.Gzip.FlagsMask.FEXTRA) > 0) {
        member.xlen = input[ip++] | input[ip++] << 8;
        ip = this.decodeSubField(ip, member.xlen);
      } // fname


      if ((member.flg & Zlib.Gzip.FlagsMask.FNAME) > 0) {
        for (str = [], ci = 0; (c = input[ip++]) > 0;) {
          str[ci++] = String.fromCharCode(c);
        }

        member.name = str.join('');
      } // fcomment


      if ((member.flg & Zlib.Gzip.FlagsMask.FCOMMENT) > 0) {
        for (str = [], ci = 0; (c = input[ip++]) > 0;) {
          str[ci++] = String.fromCharCode(c);
        }

        member.comment = str.join('');
      } // fhcrc


      if ((member.flg & Zlib.Gzip.FlagsMask.FHCRC) > 0) {
        member.crc16 = Zlib.CRC32.calc(input, 0, ip) & 0xffff;

        if (member.crc16 !== (input[ip++] | input[ip++] << 8)) {
          throw new Error('invalid header crc16');
        }
      } // isize を事前に取得すると展開後のサイズが分かるため、
      // inflate処理のバッファサイズが事前に分かり、高速になる


      isize = input[input.length - 4] | input[input.length - 3] << 8 | input[input.length - 2] << 16 | input[input.length - 1] << 24; // isize の妥当性チェック
      // ハフマン符号では最小 2-bit のため、最大で 1/4 になる
      // LZ77 符号では 長さと距離 2-Byte で最大 258-Byte を表現できるため、
      // 1/128 になるとする
      // ここから入力バッファの残りが isize の 512 倍以上だったら
      // サイズ指定のバッファ確保は行わない事とする

      if (input.length - ip -
      /* CRC-32 */
      4 -
      /* ISIZE */
      4 < isize * 512) {
        inflen = isize;
      } // compressed block


      rawinflate = new Zlib.RawInflate(input, {
        'index': ip,
        'bufferSize': inflen
      });
      member.data = inflated = rawinflate.decompress();
      ip = rawinflate.ip; // crc32

      member.crc32 = crc32 = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0;

      if (Zlib.CRC32.calc(inflated) !== crc32) {
        throw new Error('invalid CRC-32 checksum: 0x' + Zlib.CRC32.calc(inflated).toString(16) + ' / 0x' + crc32.toString(16));
      } // input size


      member.isize = isize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0;

      if ((inflated.length & 0xffffffff) !== isize) {
        throw new Error('invalid input size: ' + (inflated.length & 0xffffffff) + ' / ' + isize);
      }

      this.member.push(member);
      this.ip = ip;
    };
    /**
     * サブフィールドのデコード
     * XXX: 現在は何もせずスキップする
     */


    Zlib.Gunzip.prototype.decodeSubField = function (ip, length) {
      return ip + length;
    };
    /**
     * @return {!(Array.<number>|Uint8Array)}
     */


    Zlib.Gunzip.prototype.concatMember = function () {
      /** @type {Array.<Zlib.GunzipMember>} */
      var member = this.member;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      /** @type {number} */

      var p = 0;
      /** @type {number} */

      var size = 0;
      /** @type {!(Array.<number>|Uint8Array)} */

      var buffer;

      for (i = 0, il = member.length; i < il; ++i) {
        size += member[i].data.length;
      }

      {
        buffer = new Uint8Array(size);

        for (i = 0; i < il; ++i) {
          buffer.set(member[i].data, p);
          p += member[i].data.length;
        }
      }
      return buffer;
    };
    /**
     * @constructor
     */


    Zlib.GunzipMember = function () {
      /** @type {number} signature first byte. */
      this.id1;
      /** @type {number} signature second byte. */

      this.id2;
      /** @type {number} compression method. */

      this.cm;
      /** @type {number} flags. */

      this.flg;
      /** @type {Date} modification time. */

      this.mtime;
      /** @type {number} extra flags. */

      this.xfl;
      /** @type {number} operating system number. */

      this.os;
      /** @type {number} CRC-16 value for FHCRC flag. */

      this.crc16;
      /** @type {number} extra length. */

      this.xlen;
      /** @type {number} CRC-32 value for verification. */

      this.crc32;
      /** @type {number} input size modulo 32 value. */

      this.isize;
      /** @type {string} filename. */

      this.name;
      /** @type {string} comment. */

      this.comment;
      /** @type {!(Uint8Array|Array.<number>)} */

      this.data;
    };

    Zlib.GunzipMember.prototype.getName = function () {
      return this.name;
    };

    Zlib.GunzipMember.prototype.getData = function () {
      return this.data;
    };

    Zlib.GunzipMember.prototype.getMtime = function () {
      return this.mtime;
    };
    /**
     * @fileoverview GZIP (RFC1952) 実装.
     */

    /**
     * @constructor
     * @param {!(Array|Uint8Array)} input input buffer.
     * @param {Object=} opt_params option parameters.
     */


    Zlib.Gzip = function (input, opt_params) {
      /** @type {!(Array.<number>|Uint8Array)} input buffer. */
      this.input = input;
      /** @type {number} input buffer pointer. */

      this.ip = 0;
      /** @type {!(Array.<number>|Uint8Array)} output buffer. */

      this.output;
      /** @type {number} output buffer. */

      this.op = 0;
      /** @type {!Object} flags option flags. */

      this.flags = {};
      /** @type {!string} filename. */

      this.filename;
      /** @type {!string} comment. */

      this.comment;
      /** @type {!Object} deflate options. */

      this.deflateOptions; // option parameters

      if (opt_params) {
        if (opt_params['flags']) {
          this.flags = opt_params['flags'];
        }

        if (typeof opt_params['filename'] === 'string') {
          this.filename = opt_params['filename'];
        }

        if (typeof opt_params['comment'] === 'string') {
          this.comment = opt_params['comment'];
        }

        if (opt_params['deflateOptions']) {
          this.deflateOptions = opt_params['deflateOptions'];
        }
      }

      if (!this.deflateOptions) {
        this.deflateOptions = {};
      }
    };
    /**
     * @type {number}
     * @const
     */


    Zlib.Gzip.DefaultBufferSize = 0x8000;
    /**
     * encode gzip members.
     * @return {!(Array|Uint8Array)} gzip binary array.
     */

    Zlib.Gzip.prototype.compress = function () {
      /** @type {number} flags. */
      var flg;
      /** @type {number} modification time. */

      var mtime;
      /** @type {number} CRC-16 value for FHCRC flag. */

      var crc16;
      /** @type {number} CRC-32 value for verification. */

      var crc32;
      /** @type {!Zlib.RawDeflate} raw deflate object. */

      var rawdeflate;
      /** @type {number} character code */

      var c;
      /** @type {number} loop counter. */

      var i;
      /** @type {number} loop limiter. */

      var il;
      /** @type {!(Array|Uint8Array)} output buffer. */

      var output = new Uint8Array(Zlib.Gzip.DefaultBufferSize);
      /** @type {number} output buffer pointer. */

      var op = 0;
      var input = this.input;
      var ip = this.ip;
      var filename = this.filename;
      var comment = this.comment; // check signature

      output[op++] = 0x1f;
      output[op++] = 0x8b; // check compression method

      output[op++] = 8;
      /* XXX: use Zlib const */
      // flags

      flg = 0;
      if (this.flags['fname']) flg |= Zlib.Gzip.FlagsMask.FNAME;
      if (this.flags['fcomment']) flg |= Zlib.Gzip.FlagsMask.FCOMMENT;
      if (this.flags['fhcrc']) flg |= Zlib.Gzip.FlagsMask.FHCRC; // XXX: FTEXT
      // XXX: FEXTRA

      output[op++] = flg; // modification time

      mtime = (Date.now ? Date.now() : +new Date()) / 1000 | 0;
      output[op++] = mtime & 0xff;
      output[op++] = mtime >>> 8 & 0xff;
      output[op++] = mtime >>> 16 & 0xff;
      output[op++] = mtime >>> 24 & 0xff; // extra flags

      output[op++] = 0; // operating system

      output[op++] = Zlib.Gzip.OperatingSystem.UNKNOWN; // extra

      /* NOP */
      // fname

      if (this.flags['fname'] !== void 0) {
        for (i = 0, il = filename.length; i < il; ++i) {
          c = filename.charCodeAt(i);

          if (c > 0xff) {
            output[op++] = c >>> 8 & 0xff;
          }

          output[op++] = c & 0xff;
        }

        output[op++] = 0; // null termination
      } // fcomment


      if (this.flags['comment']) {
        for (i = 0, il = comment.length; i < il; ++i) {
          c = comment.charCodeAt(i);

          if (c > 0xff) {
            output[op++] = c >>> 8 & 0xff;
          }

          output[op++] = c & 0xff;
        }

        output[op++] = 0; // null termination
      } // fhcrc


      if (this.flags['fhcrc']) {
        crc16 = Zlib.CRC32.calc(output, 0, op) & 0xffff;
        output[op++] = crc16 & 0xff;
        output[op++] = crc16 >>> 8 & 0xff;
      } // add compress option


      this.deflateOptions['outputBuffer'] = output;
      this.deflateOptions['outputIndex'] = op; // compress

      rawdeflate = new Zlib.RawDeflate(input, this.deflateOptions);
      output = rawdeflate.compress();
      op = rawdeflate.op; // expand buffer

      {
        if (op + 8 > output.buffer.byteLength) {
          this.output = new Uint8Array(op + 8);
          this.output.set(new Uint8Array(output.buffer));
          output = this.output;
        } else {
          output = new Uint8Array(output.buffer);
        }
      } // crc32

      crc32 = Zlib.CRC32.calc(input);
      output[op++] = crc32 & 0xff;
      output[op++] = crc32 >>> 8 & 0xff;
      output[op++] = crc32 >>> 16 & 0xff;
      output[op++] = crc32 >>> 24 & 0xff; // input size

      il = input.length;
      output[op++] = il & 0xff;
      output[op++] = il >>> 8 & 0xff;
      output[op++] = il >>> 16 & 0xff;
      output[op++] = il >>> 24 & 0xff;
      this.ip = ip;

      if (op < output.length) {
        this.output = output = output.subarray(0, op);
      }

      return output;
    };
    /** @enum {number} */


    Zlib.Gzip.OperatingSystem = {
      FAT: 0,
      AMIGA: 1,
      VMS: 2,
      UNIX: 3,
      VM_CMS: 4,
      ATARI_TOS: 5,
      HPFS: 6,
      MACINTOSH: 7,
      Z_SYSTEM: 8,
      CP_M: 9,
      TOPS_20: 10,
      NTFS: 11,
      QDOS: 12,
      ACORN_RISCOS: 13,
      UNKNOWN: 255
    };
    /** @enum {number} */

    Zlib.Gzip.FlagsMask = {
      FTEXT: 0x01,
      FHCRC: 0x02,
      FEXTRA: 0x04,
      FNAME: 0x08,
      FCOMMENT: 0x10
    };
    /**
     * @fileoverview Heap Sort 実装. ハフマン符号化で使用する.
     */

    /**
     * カスタムハフマン符号で使用するヒープ実装
     * @param {number} length ヒープサイズ.
     * @constructor
     */

    Zlib.Heap = function (length) {
      this.buffer = new Uint16Array(length * 2);
      this.length = 0;
    };
    /**
     * 親ノードの index 取得
     * @param {number} index 子ノードの index.
     * @return {number} 親ノードの index.
     *
     */


    Zlib.Heap.prototype.getParent = function (index) {
      return ((index - 2) / 4 | 0) * 2;
    };
    /**
     * 子ノードの index 取得
     * @param {number} index 親ノードの index.
     * @return {number} 子ノードの index.
     */


    Zlib.Heap.prototype.getChild = function (index) {
      return 2 * index + 2;
    };
    /**
     * Heap に値を追加する
     * @param {number} index キー index.
     * @param {number} value 値.
     * @return {number} 現在のヒープ長.
     */


    Zlib.Heap.prototype.push = function (index, value) {
      var current,
          parent,
          heap = this.buffer,
          swap;
      current = this.length;
      heap[this.length++] = value;
      heap[this.length++] = index; // ルートノードにたどり着くまで入れ替えを試みる

      while (current > 0) {
        parent = this.getParent(current); // 親ノードと比較して親の方が小さければ入れ替える

        if (heap[current] > heap[parent]) {
          swap = heap[current];
          heap[current] = heap[parent];
          heap[parent] = swap;
          swap = heap[current + 1];
          heap[current + 1] = heap[parent + 1];
          heap[parent + 1] = swap;
          current = parent; // 入れ替えが必要なくなったらそこで抜ける
        } else {
          break;
        }
      }

      return this.length;
    };
    /**
     * Heapから一番大きい値を返す
     * @return {{index: number, value: number, length: number}} {index: キーindex,
     *     value: 値, length: ヒープ長} の Object.
     */


    Zlib.Heap.prototype.pop = function () {
      var index,
          value,
          heap = this.buffer,
          swap,
          current,
          parent;
      value = heap[0];
      index = heap[1]; // 後ろから値を取る

      this.length -= 2;
      heap[0] = heap[this.length];
      heap[1] = heap[this.length + 1];
      parent = 0; // ルートノードから下がっていく

      while (true) {
        current = this.getChild(parent); // 範囲チェック

        if (current >= this.length) {
          break;
        } // 隣のノードと比較して、隣の方が値が大きければ隣を現在ノードとして選択


        if (current + 2 < this.length && heap[current + 2] > heap[current]) {
          current += 2;
        } // 親ノードと比較して親の方が小さい場合は入れ替える


        if (heap[current] > heap[parent]) {
          swap = heap[parent];
          heap[parent] = heap[current];
          heap[current] = swap;
          swap = heap[parent + 1];
          heap[parent + 1] = heap[current + 1];
          heap[current + 1] = swap;
        } else {
          break;
        }

        parent = current;
      }

      return {
        index: index,
        value: value,
        length: this.length
      };
    };
    /* vim:set expandtab ts=2 sw=2 tw=80: */

    /**
     * @fileoverview Deflate (RFC1951) 符号化アルゴリズム実装.
     */

    /**
     * Raw Deflate 実装
     *
     * @constructor
     * @param {!(Array.<number>|Uint8Array)} input 符号化する対象のバッファ.
     * @param {Object=} opt_params option parameters.
     *
     * typed array が使用可能なとき、outputBuffer が Array は自動的に Uint8Array に
     * 変換されます.
     * 別のオブジェクトになるため出力バッファを参照している変数などは
     * 更新する必要があります.
     */


    Zlib.RawDeflate = function (input, opt_params) {
      /** @type {Zlib.RawDeflate.CompressionType} */
      this.compressionType = Zlib.RawDeflate.CompressionType.DYNAMIC;
      /** @type {number} */

      this.lazy = 0;
      /** @type {!(Array.<number>|Uint32Array)} */

      this.freqsLitLen;
      /** @type {!(Array.<number>|Uint32Array)} */

      this.freqsDist;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.input = input instanceof Array ? new Uint8Array(input) : input;
      /** @type {!(Array.<number>|Uint8Array)} output output buffer. */

      this.output;
      /** @type {number} pos output buffer position. */

      this.op = 0; // option parameters

      if (opt_params) {
        if (opt_params['lazy']) {
          this.lazy = opt_params['lazy'];
        }

        if (typeof opt_params['compressionType'] === 'number') {
          this.compressionType = opt_params['compressionType'];
        }

        if (opt_params['outputBuffer']) {
          this.output = opt_params['outputBuffer'] instanceof Array ? new Uint8Array(opt_params['outputBuffer']) : opt_params['outputBuffer'];
        }

        if (typeof opt_params['outputIndex'] === 'number') {
          this.op = opt_params['outputIndex'];
        }
      }

      if (!this.output) {
        this.output = new Uint8Array(0x8000);
      }
    };
    /**
     * @enum {number}
     */


    Zlib.RawDeflate.CompressionType = {
      NONE: 0,
      FIXED: 1,
      DYNAMIC: 2,
      RESERVED: 3
    };
    /**
     * LZ77 の最小マッチ長
     * @const
     * @type {number}
     */

    Zlib.RawDeflate.Lz77MinLength = 3;
    /**
     * LZ77 の最大マッチ長
     * @const
     * @type {number}
     */

    Zlib.RawDeflate.Lz77MaxLength = 258;
    /**
     * LZ77 のウィンドウサイズ
     * @const
     * @type {number}
     */

    Zlib.RawDeflate.WindowSize = 0x8000;
    /**
     * 最長の符号長
     * @const
     * @type {number}
     */

    Zlib.RawDeflate.MaxCodeLength = 16;
    /**
     * ハフマン符号の最大数値
     * @const
     * @type {number}
     */

    Zlib.RawDeflate.HUFMAX = 286;
    /**
     * 固定ハフマン符号の符号化テーブル
     * @const
     * @type {Array.<Array.<number, number>>}
     */

    Zlib.RawDeflate.FixedHuffmanTable = function () {
      var table = [],
          i;

      for (i = 0; i < 288; i++) {
        switch (true) {
          case i <= 143:
            table.push([i + 0x030, 8]);
            break;

          case i <= 255:
            table.push([i - 144 + 0x190, 9]);
            break;

          case i <= 279:
            table.push([i - 256 + 0x000, 7]);
            break;

          case i <= 287:
            table.push([i - 280 + 0x0C0, 8]);
            break;

          default:
            throw 'invalid literal: ' + i;
        }
      }

      return table;
    }();
    /**
     * DEFLATE ブロックの作成
     * @return {!(Array.<number>|Uint8Array)} 圧縮済み byte array.
     */


    Zlib.RawDeflate.prototype.compress = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var blockArray;
      /** @type {number} */

      var position;
      /** @type {number} */

      var length;
      var input = this.input; // compression

      switch (this.compressionType) {
        case Zlib.RawDeflate.CompressionType.NONE:
          // each 65535-Byte (length header: 16-bit)
          for (position = 0, length = input.length; position < length;) {
            blockArray = input.subarray(position, position + 0xffff);
            position += blockArray.length;
            this.makeNocompressBlock(blockArray, position === length);
          }

          break;

        case Zlib.RawDeflate.CompressionType.FIXED:
          this.output = this.makeFixedHuffmanBlock(input, true);
          this.op = this.output.length;
          break;

        case Zlib.RawDeflate.CompressionType.DYNAMIC:
          this.output = this.makeDynamicHuffmanBlock(input, true);
          this.op = this.output.length;
          break;

        default:
          throw 'invalid compression type';
      }

      return this.output;
    };
    /**
     * 非圧縮ブロックの作成
     * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
     * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
     * @return {!(Array.<number>|Uint8Array)} 非圧縮ブロック byte array.
     */


    Zlib.RawDeflate.prototype.makeNocompressBlock = function (blockArray, isFinalBlock) {
      /** @type {number} */
      var bfinal;
      /** @type {Zlib.RawDeflate.CompressionType} */

      var btype;
      /** @type {number} */

      var len;
      /** @type {number} */

      var nlen;
      var output = this.output;
      var op = this.op; // expand buffer

      {
        output = new Uint8Array(this.output.buffer);

        while (output.length <= op + blockArray.length + 5) {
          output = new Uint8Array(output.length << 1);
        }

        output.set(this.output);
      } // header

      bfinal = isFinalBlock ? 1 : 0;
      btype = Zlib.RawDeflate.CompressionType.NONE;
      output[op++] = bfinal | btype << 1; // length

      len = blockArray.length;
      nlen = ~len + 0x10000 & 0xffff;
      output[op++] = len & 0xff;
      output[op++] = len >>> 8 & 0xff;
      output[op++] = nlen & 0xff;
      output[op++] = nlen >>> 8 & 0xff; // copy buffer

      {
        output.set(blockArray, op);
        op += blockArray.length;
        output = output.subarray(0, op);
      }
      this.op = op;
      this.output = output;
      return output;
    };
    /**
     * 固定ハフマンブロックの作成
     * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
     * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
     * @return {!(Array.<number>|Uint8Array)} 固定ハフマン符号化ブロック byte array.
     */


    Zlib.RawDeflate.prototype.makeFixedHuffmanBlock = function (blockArray, isFinalBlock) {
      /** @type {Zlib.BitStream} */
      var stream = new Zlib.BitStream(new Uint8Array(this.output.buffer), this.op);
      /** @type {number} */

      var bfinal;
      /** @type {Zlib.RawDeflate.CompressionType} */

      var btype;
      /** @type {!(Array.<number>|Uint16Array)} */

      var data; // header

      bfinal = isFinalBlock ? 1 : 0;
      btype = Zlib.RawDeflate.CompressionType.FIXED;
      stream.writeBits(bfinal, 1, true);
      stream.writeBits(btype, 2, true);
      data = this.lz77(blockArray);
      this.fixedHuffman(data, stream);
      return stream.finish();
    };
    /**
     * 動的ハフマンブロックの作成
     * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
     * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
     * @return {!(Array.<number>|Uint8Array)} 動的ハフマン符号ブロック byte array.
     */


    Zlib.RawDeflate.prototype.makeDynamicHuffmanBlock = function (blockArray, isFinalBlock) {
      /** @type {Zlib.BitStream} */
      var stream = new Zlib.BitStream(new Uint8Array(this.output.buffer), this.op);
      /** @type {number} */

      var bfinal;
      /** @type {Zlib.RawDeflate.CompressionType} */

      var btype;
      /** @type {!(Array.<number>|Uint16Array)} */

      var data;
      /** @type {number} */

      var hlit;
      /** @type {number} */

      var hdist;
      /** @type {number} */

      var hclen;
      /** @const @type {Array.<number>} */

      var hclenOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      /** @type {!(Array.<number>|Uint8Array)} */

      var litLenLengths;
      /** @type {!(Array.<number>|Uint16Array)} */

      var litLenCodes;
      /** @type {!(Array.<number>|Uint8Array)} */

      var distLengths;
      /** @type {!(Array.<number>|Uint16Array)} */

      var distCodes;
      /** @type {{
       *   codes: !(Array.<number>|Uint32Array),
       *   freqs: !(Array.<number>|Uint8Array)
       * }} */

      var treeSymbols;
      /** @type {!(Array.<number>|Uint8Array)} */

      var treeLengths;
      /** @type {Array} */

      var transLengths = new Array(19);
      /** @type {!(Array.<number>|Uint16Array)} */

      var treeCodes;
      /** @type {number} */

      var code;
      /** @type {number} */

      var bitlen;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il; // header

      bfinal = isFinalBlock ? 1 : 0;
      btype = Zlib.RawDeflate.CompressionType.DYNAMIC;
      stream.writeBits(bfinal, 1, true);
      stream.writeBits(btype, 2, true);
      data = this.lz77(blockArray); // リテラル・長さ, 距離のハフマン符号と符号長の算出

      litLenLengths = this.getLengths_(this.freqsLitLen, 15);
      litLenCodes = this.getCodesFromLengths_(litLenLengths);
      distLengths = this.getLengths_(this.freqsDist, 7);
      distCodes = this.getCodesFromLengths_(distLengths); // HLIT, HDIST の決定

      for (hlit = 286; hlit > 257 && litLenLengths[hlit - 1] === 0; hlit--) {}

      for (hdist = 30; hdist > 1 && distLengths[hdist - 1] === 0; hdist--) {} // HCLEN


      treeSymbols = this.getTreeSymbols_(hlit, litLenLengths, hdist, distLengths);
      treeLengths = this.getLengths_(treeSymbols.freqs, 7);

      for (i = 0; i < 19; i++) {
        transLengths[i] = treeLengths[hclenOrder[i]];
      }

      for (hclen = 19; hclen > 4 && transLengths[hclen - 1] === 0; hclen--) {}

      treeCodes = this.getCodesFromLengths_(treeLengths); // 出力

      stream.writeBits(hlit - 257, 5, true);
      stream.writeBits(hdist - 1, 5, true);
      stream.writeBits(hclen - 4, 4, true);

      for (i = 0; i < hclen; i++) {
        stream.writeBits(transLengths[i], 3, true);
      } // ツリーの出力


      for (i = 0, il = treeSymbols.codes.length; i < il; i++) {
        code = treeSymbols.codes[i];
        stream.writeBits(treeCodes[code], treeLengths[code], true); // extra bits

        if (code >= 16) {
          i++;

          switch (code) {
            case 16:
              bitlen = 2;
              break;

            case 17:
              bitlen = 3;
              break;

            case 18:
              bitlen = 7;
              break;

            default:
              throw 'invalid code: ' + code;
          }

          stream.writeBits(treeSymbols.codes[i], bitlen, true);
        }
      }

      this.dynamicHuffman(data, [litLenCodes, litLenLengths], [distCodes, distLengths], stream);
      return stream.finish();
    };
    /**
     * 動的ハフマン符号化(カスタムハフマンテーブル)
     * @param {!(Array.<number>|Uint16Array)} dataArray LZ77 符号化済み byte array.
     * @param {!Zlib.BitStream} stream 書き込み用ビットストリーム.
     * @return {!Zlib.BitStream} ハフマン符号化済みビットストリームオブジェクト.
     */


    Zlib.RawDeflate.prototype.dynamicHuffman = function (dataArray, litLen, dist, stream) {
      /** @type {number} */
      var index;
      /** @type {number} */

      var length;
      /** @type {number} */

      var literal;
      /** @type {number} */

      var code;
      /** @type {number} */

      var litLenCodes;
      /** @type {number} */

      var litLenLengths;
      /** @type {number} */

      var distCodes;
      /** @type {number} */

      var distLengths;
      litLenCodes = litLen[0];
      litLenLengths = litLen[1];
      distCodes = dist[0];
      distLengths = dist[1]; // 符号を BitStream に書き込んでいく

      for (index = 0, length = dataArray.length; index < length; ++index) {
        literal = dataArray[index]; // literal or length

        stream.writeBits(litLenCodes[literal], litLenLengths[literal], true); // 長さ・距離符号

        if (literal > 256) {
          // length extra
          stream.writeBits(dataArray[++index], dataArray[++index], true); // distance

          code = dataArray[++index];
          stream.writeBits(distCodes[code], distLengths[code], true); // distance extra

          stream.writeBits(dataArray[++index], dataArray[++index], true); // 終端
        } else if (literal === 256) {
          break;
        }
      }

      return stream;
    };
    /**
     * 固定ハフマン符号化
     * @param {!(Array.<number>|Uint16Array)} dataArray LZ77 符号化済み byte array.
     * @param {!Zlib.BitStream} stream 書き込み用ビットストリーム.
     * @return {!Zlib.BitStream} ハフマン符号化済みビットストリームオブジェクト.
     */


    Zlib.RawDeflate.prototype.fixedHuffman = function (dataArray, stream) {
      /** @type {number} */
      var index;
      /** @type {number} */

      var length;
      /** @type {number} */

      var literal; // 符号を BitStream に書き込んでいく

      for (index = 0, length = dataArray.length; index < length; index++) {
        literal = dataArray[index]; // 符号の書き込み

        Zlib.BitStream.prototype.writeBits.apply(stream, Zlib.RawDeflate.FixedHuffmanTable[literal]); // 長さ・距離符号

        if (literal > 0x100) {
          // length extra
          stream.writeBits(dataArray[++index], dataArray[++index], true); // distance

          stream.writeBits(dataArray[++index], 5); // distance extra

          stream.writeBits(dataArray[++index], dataArray[++index], true); // 終端
        } else if (literal === 0x100) {
          break;
        }
      }

      return stream;
    };
    /**
     * マッチ情報
     * @param {!number} length マッチした長さ.
     * @param {!number} backwardDistance マッチ位置との距離.
     * @constructor
     */


    Zlib.RawDeflate.Lz77Match = function (length, backwardDistance) {
      /** @type {number} match length. */
      this.length = length;
      /** @type {number} backward distance. */

      this.backwardDistance = backwardDistance;
    };
    /**
     * 長さ符号テーブル.
     * [コード, 拡張ビット, 拡張ビット長] の配列となっている.
     * @const
     * @type {!(Array.<number>|Uint32Array)}
     */


    Zlib.RawDeflate.Lz77Match.LengthCodeTable = function (table) {
      return new Uint32Array(table);
    }(function () {
      /** @type {!Array} */
      var table = [];
      /** @type {number} */

      var i;
      /** @type {!Array.<number>} */

      var c;

      for (i = 3; i <= 258; i++) {
        c = code(i);
        table[i] = c[2] << 24 | c[1] << 16 | c[0];
      }
      /**
       * @param {number} length lz77 length.
       * @return {!Array.<number>} lz77 codes.
       */


      function code(length) {
        switch (true) {
          case length === 3:
            return [257, length - 3, 0];

          case length === 4:
            return [258, length - 4, 0];

          case length === 5:
            return [259, length - 5, 0];

          case length === 6:
            return [260, length - 6, 0];

          case length === 7:
            return [261, length - 7, 0];

          case length === 8:
            return [262, length - 8, 0];

          case length === 9:
            return [263, length - 9, 0];

          case length === 10:
            return [264, length - 10, 0];

          case length <= 12:
            return [265, length - 11, 1];

          case length <= 14:
            return [266, length - 13, 1];

          case length <= 16:
            return [267, length - 15, 1];

          case length <= 18:
            return [268, length - 17, 1];

          case length <= 22:
            return [269, length - 19, 2];

          case length <= 26:
            return [270, length - 23, 2];

          case length <= 30:
            return [271, length - 27, 2];

          case length <= 34:
            return [272, length - 31, 2];

          case length <= 42:
            return [273, length - 35, 3];

          case length <= 50:
            return [274, length - 43, 3];

          case length <= 58:
            return [275, length - 51, 3];

          case length <= 66:
            return [276, length - 59, 3];

          case length <= 82:
            return [277, length - 67, 4];

          case length <= 98:
            return [278, length - 83, 4];

          case length <= 114:
            return [279, length - 99, 4];

          case length <= 130:
            return [280, length - 115, 4];

          case length <= 162:
            return [281, length - 131, 5];

          case length <= 194:
            return [282, length - 163, 5];

          case length <= 226:
            return [283, length - 195, 5];

          case length <= 257:
            return [284, length - 227, 5];

          case length === 258:
            return [285, length - 258, 0];

          default:
            throw 'invalid length: ' + length;
        }
      }

      return table;
    }());
    /**
     * 距離符号テーブル
     * @param {!number} dist 距離.
     * @return {!Array.<number>} コード、拡張ビット、拡張ビット長の配列.
     * @private
     */


    Zlib.RawDeflate.Lz77Match.prototype.getDistanceCode_ = function (dist) {
      /** @type {!Array.<number>} distance code table. */
      var r;

      switch (true) {
        case dist === 1:
          r = [0, dist - 1, 0];
          break;

        case dist === 2:
          r = [1, dist - 2, 0];
          break;

        case dist === 3:
          r = [2, dist - 3, 0];
          break;

        case dist === 4:
          r = [3, dist - 4, 0];
          break;

        case dist <= 6:
          r = [4, dist - 5, 1];
          break;

        case dist <= 8:
          r = [5, dist - 7, 1];
          break;

        case dist <= 12:
          r = [6, dist - 9, 2];
          break;

        case dist <= 16:
          r = [7, dist - 13, 2];
          break;

        case dist <= 24:
          r = [8, dist - 17, 3];
          break;

        case dist <= 32:
          r = [9, dist - 25, 3];
          break;

        case dist <= 48:
          r = [10, dist - 33, 4];
          break;

        case dist <= 64:
          r = [11, dist - 49, 4];
          break;

        case dist <= 96:
          r = [12, dist - 65, 5];
          break;

        case dist <= 128:
          r = [13, dist - 97, 5];
          break;

        case dist <= 192:
          r = [14, dist - 129, 6];
          break;

        case dist <= 256:
          r = [15, dist - 193, 6];
          break;

        case dist <= 384:
          r = [16, dist - 257, 7];
          break;

        case dist <= 512:
          r = [17, dist - 385, 7];
          break;

        case dist <= 768:
          r = [18, dist - 513, 8];
          break;

        case dist <= 1024:
          r = [19, dist - 769, 8];
          break;

        case dist <= 1536:
          r = [20, dist - 1025, 9];
          break;

        case dist <= 2048:
          r = [21, dist - 1537, 9];
          break;

        case dist <= 3072:
          r = [22, dist - 2049, 10];
          break;

        case dist <= 4096:
          r = [23, dist - 3073, 10];
          break;

        case dist <= 6144:
          r = [24, dist - 4097, 11];
          break;

        case dist <= 8192:
          r = [25, dist - 6145, 11];
          break;

        case dist <= 12288:
          r = [26, dist - 8193, 12];
          break;

        case dist <= 16384:
          r = [27, dist - 12289, 12];
          break;

        case dist <= 24576:
          r = [28, dist - 16385, 13];
          break;

        case dist <= 32768:
          r = [29, dist - 24577, 13];
          break;

        default:
          throw 'invalid distance';
      }

      return r;
    };
    /**
     * マッチ情報を LZ77 符号化配列で返す.
     * なお、ここでは以下の内部仕様で符号化している
     * [ CODE, EXTRA-BIT-LEN, EXTRA, CODE, EXTRA-BIT-LEN, EXTRA ]
     * @return {!Array.<number>} LZ77 符号化 byte array.
     */


    Zlib.RawDeflate.Lz77Match.prototype.toLz77Array = function () {
      /** @type {number} */
      var length = this.length;
      /** @type {number} */

      var dist = this.backwardDistance;
      /** @type {Array} */

      var codeArray = [];
      /** @type {number} */

      var pos = 0;
      /** @type {!Array.<number>} */

      var code; // length

      code = Zlib.RawDeflate.Lz77Match.LengthCodeTable[length];
      codeArray[pos++] = code & 0xffff;
      codeArray[pos++] = code >> 16 & 0xff;
      codeArray[pos++] = code >> 24; // distance

      code = this.getDistanceCode_(dist);
      codeArray[pos++] = code[0];
      codeArray[pos++] = code[1];
      codeArray[pos++] = code[2];
      return codeArray;
    };
    /**
     * LZ77 実装
     * @param {!(Array.<number>|Uint8Array)} dataArray LZ77 符号化するバイト配列.
     * @return {!(Array.<number>|Uint16Array)} LZ77 符号化した配列.
     */


    Zlib.RawDeflate.prototype.lz77 = function (dataArray) {
      /** @type {number} input position */
      var position;
      /** @type {number} input length */

      var length;
      /** @type {number} loop counter */

      var i;
      /** @type {number} loop limiter */

      var il;
      /** @type {number} chained-hash-table key */

      var matchKey;
      /** @type {Object.<number, Array.<number>>} chained-hash-table */

      var table = {};
      /** @const @type {number} */

      var windowSize = Zlib.RawDeflate.WindowSize;
      /** @type {Array.<number>} match list */

      var matchList;
      /** @type {Zlib.RawDeflate.Lz77Match} longest match */

      var longestMatch;
      /** @type {Zlib.RawDeflate.Lz77Match} previous longest match */

      var prevMatch;
      /** @type {!(Array.<number>|Uint16Array)} lz77 buffer */

      var lz77buf = new Uint16Array(dataArray.length * 2);
      /** @type {number} lz77 output buffer pointer */

      var pos = 0;
      /** @type {number} lz77 skip length */

      var skipLength = 0;
      /** @type {!(Array.<number>|Uint32Array)} */

      var freqsLitLen = new Uint32Array(286);
      /** @type {!(Array.<number>|Uint32Array)} */

      var freqsDist = new Uint32Array(30);
      /** @type {number} */

      var lazy = this.lazy;
      /** @type {*} temporary variable */

      var tmp;
      freqsLitLen[256] = 1; // EOB の最低出現回数は 1

      /**
       * マッチデータの書き込み
       * @param {Zlib.RawDeflate.Lz77Match} match LZ77 Match data.
       * @param {!number} offset スキップ開始位置(相対指定).
       * @private
       */

      function writeMatch(match, offset) {
        /** @type {Array.<number>} */
        var lz77Array = match.toLz77Array();
        /** @type {number} */

        var i;
        /** @type {number} */

        var il;

        for (i = 0, il = lz77Array.length; i < il; ++i) {
          lz77buf[pos++] = lz77Array[i];
        }

        freqsLitLen[lz77Array[0]]++;
        freqsDist[lz77Array[3]]++;
        skipLength = match.length + offset - 1;
        prevMatch = null;
      } // LZ77 符号化


      for (position = 0, length = dataArray.length; position < length; ++position) {
        // ハッシュキーの作成
        for (matchKey = 0, i = 0, il = Zlib.RawDeflate.Lz77MinLength; i < il; ++i) {
          if (position + i === length) {
            break;
          }

          matchKey = matchKey << 8 | dataArray[position + i];
        } // テーブルが未定義だったら作成する


        if (table[matchKey] === void 0) {
          table[matchKey] = [];
        }

        matchList = table[matchKey]; // skip

        if (skipLength-- > 0) {
          matchList.push(position);
          continue;
        } // マッチテーブルの更新 (最大戻り距離を超えているものを削除する)


        while (matchList.length > 0 && position - matchList[0] > windowSize) {
          matchList.shift();
        } // データ末尾でマッチしようがない場合はそのまま流しこむ


        if (position + Zlib.RawDeflate.Lz77MinLength >= length) {
          if (prevMatch) {
            writeMatch(prevMatch, -1);
          }

          for (i = 0, il = length - position; i < il; ++i) {
            tmp = dataArray[position + i];
            lz77buf[pos++] = tmp;
            ++freqsLitLen[tmp];
          }

          break;
        } // マッチ候補から最長のものを探す


        if (matchList.length > 0) {
          longestMatch = this.searchLongestMatch_(dataArray, position, matchList);

          if (prevMatch) {
            // 現在のマッチの方が前回のマッチよりも長い
            if (prevMatch.length < longestMatch.length) {
              // write previous literal
              tmp = dataArray[position - 1];
              lz77buf[pos++] = tmp;
              ++freqsLitLen[tmp]; // write current match

              writeMatch(longestMatch, 0);
            } else {
              // write previous match
              writeMatch(prevMatch, -1);
            }
          } else if (longestMatch.length < lazy) {
            prevMatch = longestMatch;
          } else {
            writeMatch(longestMatch, 0);
          } // 前回マッチしていて今回マッチがなかったら前回のを採用

        } else if (prevMatch) {
          writeMatch(prevMatch, -1);
        } else {
          tmp = dataArray[position];
          lz77buf[pos++] = tmp;
          ++freqsLitLen[tmp];
        }

        matchList.push(position); // マッチテーブルに現在の位置を保存
      } // 終端処理


      lz77buf[pos++] = 256;
      freqsLitLen[256]++;
      this.freqsLitLen = freqsLitLen;
      this.freqsDist = freqsDist;
      return (
        /** @type {!(Uint16Array|Array.<number>)} */
        lz77buf.subarray(0, pos)
      );
    };
    /**
     * マッチした候補の中から最長一致を探す
     * @param {!Object} data plain data byte array.
     * @param {!number} position plain data byte array position.
     * @param {!Array.<number>} matchList 候補となる位置の配列.
     * @return {!Zlib.RawDeflate.Lz77Match} 最長かつ最短距離のマッチオブジェクト.
     * @private
     */


    Zlib.RawDeflate.prototype.searchLongestMatch_ = function (data, position, matchList) {
      var match,
          currentMatch,
          matchMax = 0,
          matchLength,
          i,
          j,
          l,
          dl = data.length; // 候補を後ろから 1 つずつ絞り込んでゆく

      permatch: for (i = 0, l = matchList.length; i < l; i++) {
        match = matchList[l - i - 1];
        matchLength = Zlib.RawDeflate.Lz77MinLength; // 前回までの最長一致を末尾から一致検索する

        if (matchMax > Zlib.RawDeflate.Lz77MinLength) {
          for (j = matchMax; j > Zlib.RawDeflate.Lz77MinLength; j--) {
            if (data[match + j - 1] !== data[position + j - 1]) {
              continue permatch;
            }
          }

          matchLength = matchMax;
        } // 最長一致探索


        while (matchLength < Zlib.RawDeflate.Lz77MaxLength && position + matchLength < dl && data[match + matchLength] === data[position + matchLength]) {
          ++matchLength;
        } // マッチ長が同じ場合は後方を優先


        if (matchLength > matchMax) {
          currentMatch = match;
          matchMax = matchLength;
        } // 最長が確定したら後の処理は省略


        if (matchLength === Zlib.RawDeflate.Lz77MaxLength) {
          break;
        }
      }

      return new Zlib.RawDeflate.Lz77Match(matchMax, position - currentMatch);
    };
    /**
     * Tree-Transmit Symbols の算出
     * reference: PuTTY Deflate implementation
     * @param {number} hlit HLIT.
     * @param {!(Array.<number>|Uint8Array)} litlenLengths リテラルと長さ符号の符号長配列.
     * @param {number} hdist HDIST.
     * @param {!(Array.<number>|Uint8Array)} distLengths 距離符号の符号長配列.
     * @return {{
     *   codes: !(Array.<number>|Uint32Array),
     *   freqs: !(Array.<number>|Uint8Array)
     * }} Tree-Transmit Symbols.
     */


    Zlib.RawDeflate.prototype.getTreeSymbols_ = function (hlit, litlenLengths, hdist, distLengths) {
      var src = new Uint32Array(hlit + hdist),
          i,
          j,
          runLength,
          l,
          result = new Uint32Array(286 + 30),
          nResult,
          rpt,
          freqs = new Uint8Array(19);
      j = 0;

      for (i = 0; i < hlit; i++) {
        src[j++] = litlenLengths[i];
      }

      for (i = 0; i < hdist; i++) {
        src[j++] = distLengths[i];
      } // 符号化


      nResult = 0;

      for (i = 0, l = src.length; i < l; i += j) {
        // Run Length Encoding
        for (j = 1; i + j < l && src[i + j] === src[i]; ++j) {}

        runLength = j;

        if (src[i] === 0) {
          // 0 の繰り返しが 3 回未満ならばそのまま
          if (runLength < 3) {
            while (runLength-- > 0) {
              result[nResult++] = 0;
              freqs[0]++;
            }
          } else {
            while (runLength > 0) {
              // 繰り返しは最大 138 までなので切り詰める
              rpt = runLength < 138 ? runLength : 138;

              if (rpt > runLength - 3 && rpt < runLength) {
                rpt = runLength - 3;
              } // 3-10 回 -> 17


              if (rpt <= 10) {
                result[nResult++] = 17;
                result[nResult++] = rpt - 3;
                freqs[17]++; // 11-138 回 -> 18
              } else {
                result[nResult++] = 18;
                result[nResult++] = rpt - 11;
                freqs[18]++;
              }

              runLength -= rpt;
            }
          }
        } else {
          result[nResult++] = src[i];
          freqs[src[i]]++;
          runLength--; // 繰り返し回数が3回未満ならばランレングス符号は要らない

          if (runLength < 3) {
            while (runLength-- > 0) {
              result[nResult++] = src[i];
              freqs[src[i]]++;
            } // 3 回以上ならばランレングス符号化

          } else {
            while (runLength > 0) {
              // runLengthを 3-6 で分割
              rpt = runLength < 6 ? runLength : 6;

              if (rpt > runLength - 3 && rpt < runLength) {
                rpt = runLength - 3;
              }

              result[nResult++] = 16;
              result[nResult++] = rpt - 3;
              freqs[16]++;
              runLength -= rpt;
            }
          }
        }
      }

      return {
        codes: result.subarray(0, nResult),
        freqs: freqs
      };
    };
    /**
     * ハフマン符号の長さを取得する
     * @param {!(Array.<number>|Uint8Array|Uint32Array)} freqs 出現カウント.
     * @param {number} limit 符号長の制限.
     * @return {!(Array.<number>|Uint8Array)} 符号長配列.
     * @private
     */


    Zlib.RawDeflate.prototype.getLengths_ = function (freqs, limit) {
      /** @type {number} */
      var nSymbols = freqs.length;
      /** @type {Zlib.Heap} */

      var heap = new Zlib.Heap(2 * Zlib.RawDeflate.HUFMAX);
      /** @type {!(Array.<number>|Uint8Array)} */

      var length = new Uint8Array(nSymbols);
      /** @type {Array} */

      var nodes;
      /** @type {!(Array.<number>|Uint32Array)} */

      var values;
      /** @type {!(Array.<number>|Uint8Array)} */

      var codeLength;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il; // ヒープの構築

      for (i = 0; i < nSymbols; ++i) {
        if (freqs[i] > 0) {
          heap.push(i, freqs[i]);
        }
      }

      nodes = new Array(heap.length / 2);
      values = new Uint32Array(heap.length / 2); // 非 0 の要素が一つだけだった場合は、そのシンボルに符号長 1 を割り当てて終了

      if (nodes.length === 1) {
        length[heap.pop().index] = 1;
        return length;
      } // Reverse Package Merge Algorithm による Canonical Huffman Code の符号長決定


      for (i = 0, il = heap.length / 2; i < il; ++i) {
        nodes[i] = heap.pop();
        values[i] = nodes[i].value;
      }

      codeLength = this.reversePackageMerge_(values, values.length, limit);

      for (i = 0, il = nodes.length; i < il; ++i) {
        length[nodes[i].index] = codeLength[i];
      }

      return length;
    };
    /**
     * Reverse Package Merge Algorithm.
     * @param {!(Array.<number>|Uint32Array)} freqs sorted probability.
     * @param {number} symbols number of symbols.
     * @param {number} limit code length limit.
     * @return {!(Array.<number>|Uint8Array)} code lengths.
     */


    Zlib.RawDeflate.prototype.reversePackageMerge_ = function (freqs, symbols, limit) {
      /** @type {!(Array.<number>|Uint16Array)} */
      var minimumCost = new Uint16Array(limit);
      /** @type {!(Array.<number>|Uint8Array)} */

      var flag = new Uint8Array(limit);
      /** @type {!(Array.<number>|Uint8Array)} */

      var codeLength = new Uint8Array(symbols);
      /** @type {Array} */

      var value = new Array(limit);
      /** @type {Array} */

      var type = new Array(limit);
      /** @type {Array.<number>} */

      var currentPosition = new Array(limit);
      /** @type {number} */

      var excess = (1 << limit) - symbols;
      /** @type {number} */

      var half = 1 << limit - 1;
      /** @type {number} */

      var i;
      /** @type {number} */

      var j;
      /** @type {number} */

      var t;
      /** @type {number} */

      var weight;
      /** @type {number} */

      var next;
      /**
       * @param {number} j
       */

      function takePackage(j) {
        /** @type {number} */
        var x = type[j][currentPosition[j]];

        if (x === symbols) {
          takePackage(j + 1);
          takePackage(j + 1);
        } else {
          --codeLength[x];
        }

        ++currentPosition[j];
      }

      minimumCost[limit - 1] = symbols;

      for (j = 0; j < limit; ++j) {
        if (excess < half) {
          flag[j] = 0;
        } else {
          flag[j] = 1;
          excess -= half;
        }

        excess <<= 1;
        minimumCost[limit - 2 - j] = (minimumCost[limit - 1 - j] / 2 | 0) + symbols;
      }

      minimumCost[0] = flag[0];
      value[0] = new Array(minimumCost[0]);
      type[0] = new Array(minimumCost[0]);

      for (j = 1; j < limit; ++j) {
        if (minimumCost[j] > 2 * minimumCost[j - 1] + flag[j]) {
          minimumCost[j] = 2 * minimumCost[j - 1] + flag[j];
        }

        value[j] = new Array(minimumCost[j]);
        type[j] = new Array(minimumCost[j]);
      }

      for (i = 0; i < symbols; ++i) {
        codeLength[i] = limit;
      }

      for (t = 0; t < minimumCost[limit - 1]; ++t) {
        value[limit - 1][t] = freqs[t];
        type[limit - 1][t] = t;
      }

      for (i = 0; i < limit; ++i) {
        currentPosition[i] = 0;
      }

      if (flag[limit - 1] === 1) {
        --codeLength[0];
        ++currentPosition[limit - 1];
      }

      for (j = limit - 2; j >= 0; --j) {
        i = 0;
        weight = 0;
        next = currentPosition[j + 1];

        for (t = 0; t < minimumCost[j]; t++) {
          weight = value[j + 1][next] + value[j + 1][next + 1];

          if (weight > freqs[i]) {
            value[j][t] = weight;
            type[j][t] = symbols;
            next += 2;
          } else {
            value[j][t] = freqs[i];
            type[j][t] = i;
            ++i;
          }
        }

        currentPosition[j] = 0;

        if (flag[j] === 1) {
          takePackage(j);
        }
      }

      return codeLength;
    };
    /**
     * 符号長配列からハフマン符号を取得する
     * reference: PuTTY Deflate implementation
     * @param {!(Array.<number>|Uint8Array)} lengths 符号長配列.
     * @return {!(Array.<number>|Uint16Array)} ハフマン符号配列.
     * @private
     */


    Zlib.RawDeflate.prototype.getCodesFromLengths_ = function (lengths) {
      var codes = new Uint16Array(lengths.length),
          count = [],
          startCode = [],
          code = 0,
          i,
          il,
          j,
          m; // Count the codes of each length.

      for (i = 0, il = lengths.length; i < il; i++) {
        count[lengths[i]] = (count[lengths[i]] | 0) + 1;
      } // Determine the starting code for each length block.


      for (i = 1, il = Zlib.RawDeflate.MaxCodeLength; i <= il; i++) {
        startCode[i] = code;
        code += count[i] | 0;
        code <<= 1;
      } // Determine the code for each symbol. Mirrored, of course.


      for (i = 0, il = lengths.length; i < il; i++) {
        code = startCode[lengths[i]];
        startCode[lengths[i]] += 1;
        codes[i] = 0;

        for (j = 0, m = lengths[i]; j < m; j++) {
          codes[i] = codes[i] << 1 | code & 1;
          code >>>= 1;
        }
      }

      return codes;
    };
    /**
     * @param {!(Array.<number>|Uint8Array)} input input buffer.
     * @param {Object=} opt_params options.
     * @constructor
     */


    Zlib.Unzip = function (input, opt_params) {
      opt_params = opt_params || {};
      /** @type {!(Array.<number>|Uint8Array)} */

      this.input = input instanceof Array ? new Uint8Array(input) : input;
      /** @type {number} */

      this.ip = 0;
      /** @type {number} */

      this.eocdrOffset;
      /** @type {number} */

      this.numberOfThisDisk;
      /** @type {number} */

      this.startDisk;
      /** @type {number} */

      this.totalEntriesThisDisk;
      /** @type {number} */

      this.totalEntries;
      /** @type {number} */

      this.centralDirectorySize;
      /** @type {number} */

      this.centralDirectoryOffset;
      /** @type {number} */

      this.commentLength;
      /** @type {(Array.<number>|Uint8Array)} */

      this.comment;
      /** @type {Array.<Zlib.Unzip.FileHeader>} */

      this.fileHeaderList;
      /** @type {Object.<string, number>} */

      this.filenameToIndex;
      /** @type {boolean} */

      this.verify = opt_params['verify'] || false;
      /** @type {(Array.<number>|Uint8Array)} */

      this.password = opt_params['password'];
    };

    Zlib.Unzip.CompressionMethod = Zlib.Zip.CompressionMethod;
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib.Unzip.FileHeaderSignature = Zlib.Zip.FileHeaderSignature;
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib.Unzip.LocalFileHeaderSignature = Zlib.Zip.LocalFileHeaderSignature;
    /**
     * @type {Array.<number>}
     * @const
     */

    Zlib.Unzip.CentralDirectorySignature = Zlib.Zip.CentralDirectorySignature;
    /**
     * @param {!(Array.<number>|Uint8Array)} input input buffer.
     * @param {number} ip input position.
     * @constructor
     */

    Zlib.Unzip.FileHeader = function (input, ip) {
      /** @type {!(Array.<number>|Uint8Array)} */
      this.input = input;
      /** @type {number} */

      this.offset = ip;
      /** @type {number} */

      this.length;
      /** @type {number} */

      this.version;
      /** @type {number} */

      this.os;
      /** @type {number} */

      this.needVersion;
      /** @type {number} */

      this.flags;
      /** @type {number} */

      this.compression;
      /** @type {number} */

      this.time;
      /** @type {number} */

      this.date;
      /** @type {number} */

      this.crc32;
      /** @type {number} */

      this.compressedSize;
      /** @type {number} */

      this.plainSize;
      /** @type {number} */

      this.fileNameLength;
      /** @type {number} */

      this.extraFieldLength;
      /** @type {number} */

      this.fileCommentLength;
      /** @type {number} */

      this.diskNumberStart;
      /** @type {number} */

      this.internalFileAttributes;
      /** @type {number} */

      this.externalFileAttributes;
      /** @type {number} */

      this.relativeOffset;
      /** @type {string} */

      this.filename;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.extraField;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.comment;
    };

    Zlib.Unzip.FileHeader.prototype.parse = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip = this.offset; // central file header signature

      if (input[ip++] !== Zlib.Unzip.FileHeaderSignature[0] || input[ip++] !== Zlib.Unzip.FileHeaderSignature[1] || input[ip++] !== Zlib.Unzip.FileHeaderSignature[2] || input[ip++] !== Zlib.Unzip.FileHeaderSignature[3]) {
        throw new Error('invalid file header signature');
      } // version made by


      this.version = input[ip++];
      this.os = input[ip++]; // version needed to extract

      this.needVersion = input[ip++] | input[ip++] << 8; // general purpose bit flag

      this.flags = input[ip++] | input[ip++] << 8; // compression method

      this.compression = input[ip++] | input[ip++] << 8; // last mod file time

      this.time = input[ip++] | input[ip++] << 8; //last mod file date

      this.date = input[ip++] | input[ip++] << 8; // crc-32

      this.crc32 = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // compressed size

      this.compressedSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // uncompressed size

      this.plainSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // file name length

      this.fileNameLength = input[ip++] | input[ip++] << 8; // extra field length

      this.extraFieldLength = input[ip++] | input[ip++] << 8; // file comment length

      this.fileCommentLength = input[ip++] | input[ip++] << 8; // disk number start

      this.diskNumberStart = input[ip++] | input[ip++] << 8; // internal file attributes

      this.internalFileAttributes = input[ip++] | input[ip++] << 8; // external file attributes

      this.externalFileAttributes = input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24; // relative offset of local header

      this.relativeOffset = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // file name

      this.filename = String.fromCharCode.apply(null, input.subarray(ip, ip += this.fileNameLength)); // extra field

      this.extraField = input.subarray(ip, ip += this.extraFieldLength); // file comment

      this.comment = input.subarray(ip, ip + this.fileCommentLength);
      this.length = ip - this.offset;
    };
    /**
     * @param {!(Array.<number>|Uint8Array)} input input buffer.
     * @param {number} ip input position.
     * @constructor
     */


    Zlib.Unzip.LocalFileHeader = function (input, ip) {
      /** @type {!(Array.<number>|Uint8Array)} */
      this.input = input;
      /** @type {number} */

      this.offset = ip;
      /** @type {number} */

      this.length;
      /** @type {number} */

      this.needVersion;
      /** @type {number} */

      this.flags;
      /** @type {number} */

      this.compression;
      /** @type {number} */

      this.time;
      /** @type {number} */

      this.date;
      /** @type {number} */

      this.crc32;
      /** @type {number} */

      this.compressedSize;
      /** @type {number} */

      this.plainSize;
      /** @type {number} */

      this.fileNameLength;
      /** @type {number} */

      this.extraFieldLength;
      /** @type {string} */

      this.filename;
      /** @type {!(Array.<number>|Uint8Array)} */

      this.extraField;
    };

    Zlib.Unzip.LocalFileHeader.Flags = Zlib.Zip.Flags;

    Zlib.Unzip.LocalFileHeader.prototype.parse = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip = this.offset; // local file header signature

      if (input[ip++] !== Zlib.Unzip.LocalFileHeaderSignature[0] || input[ip++] !== Zlib.Unzip.LocalFileHeaderSignature[1] || input[ip++] !== Zlib.Unzip.LocalFileHeaderSignature[2] || input[ip++] !== Zlib.Unzip.LocalFileHeaderSignature[3]) {
        throw new Error('invalid local file header signature');
      } // version needed to extract


      this.needVersion = input[ip++] | input[ip++] << 8; // general purpose bit flag

      this.flags = input[ip++] | input[ip++] << 8; // compression method

      this.compression = input[ip++] | input[ip++] << 8; // last mod file time

      this.time = input[ip++] | input[ip++] << 8; //last mod file date

      this.date = input[ip++] | input[ip++] << 8; // crc-32

      this.crc32 = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // compressed size

      this.compressedSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // uncompressed size

      this.plainSize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // file name length

      this.fileNameLength = input[ip++] | input[ip++] << 8; // extra field length

      this.extraFieldLength = input[ip++] | input[ip++] << 8; // file name

      this.filename = String.fromCharCode.apply(null, input.subarray(ip, ip += this.fileNameLength)); // extra field

      this.extraField = input.subarray(ip, ip += this.extraFieldLength);
      this.length = ip - this.offset;
    };

    Zlib.Unzip.prototype.searchEndOfCentralDirectoryRecord = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip;

      for (ip = input.length - 12; ip > 0; --ip) {
        if (input[ip] === Zlib.Unzip.CentralDirectorySignature[0] && input[ip + 1] === Zlib.Unzip.CentralDirectorySignature[1] && input[ip + 2] === Zlib.Unzip.CentralDirectorySignature[2] && input[ip + 3] === Zlib.Unzip.CentralDirectorySignature[3]) {
          this.eocdrOffset = ip;
          return;
        }
      }

      throw new Error('End of Central Directory Record not found');
    };

    Zlib.Unzip.prototype.parseEndOfCentralDirectoryRecord = function () {
      /** @type {!(Array.<number>|Uint8Array)} */
      var input = this.input;
      /** @type {number} */

      var ip;

      if (!this.eocdrOffset) {
        this.searchEndOfCentralDirectoryRecord();
      }

      ip = this.eocdrOffset; // signature

      if (input[ip++] !== Zlib.Unzip.CentralDirectorySignature[0] || input[ip++] !== Zlib.Unzip.CentralDirectorySignature[1] || input[ip++] !== Zlib.Unzip.CentralDirectorySignature[2] || input[ip++] !== Zlib.Unzip.CentralDirectorySignature[3]) {
        throw new Error('invalid signature');
      } // number of this disk


      this.numberOfThisDisk = input[ip++] | input[ip++] << 8; // number of the disk with the start of the central directory

      this.startDisk = input[ip++] | input[ip++] << 8; // total number of entries in the central directory on this disk

      this.totalEntriesThisDisk = input[ip++] | input[ip++] << 8; // total number of entries in the central directory

      this.totalEntries = input[ip++] | input[ip++] << 8; // size of the central directory

      this.centralDirectorySize = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // offset of start of central directory with respect to the starting disk number

      this.centralDirectoryOffset = (input[ip++] | input[ip++] << 8 | input[ip++] << 16 | input[ip++] << 24) >>> 0; // .ZIP file comment length

      this.commentLength = input[ip++] | input[ip++] << 8; // .ZIP file comment

      this.comment = input.subarray(ip, ip + this.commentLength);
    };

    Zlib.Unzip.prototype.parseFileHeader = function () {
      /** @type {Array.<Zlib.Unzip.FileHeader>} */
      var filelist = [];
      /** @type {Object.<string, number>} */

      var filetable = {};
      /** @type {number} */

      var ip;
      /** @type {Zlib.Unzip.FileHeader} */

      var fileHeader;
      /*: @type {number} */

      var i;
      /*: @type {number} */

      var il;

      if (this.fileHeaderList) {
        return;
      }

      if (this.centralDirectoryOffset === void 0) {
        this.parseEndOfCentralDirectoryRecord();
      }

      ip = this.centralDirectoryOffset;

      for (i = 0, il = this.totalEntries; i < il; ++i) {
        fileHeader = new Zlib.Unzip.FileHeader(this.input, ip);
        fileHeader.parse();
        ip += fileHeader.length;
        filelist[i] = fileHeader;
        filetable[fileHeader.filename] = i;
      }

      if (this.centralDirectorySize < ip - this.centralDirectoryOffset) {
        throw new Error('invalid file header size');
      }

      this.fileHeaderList = filelist;
      this.filenameToIndex = filetable;
    };
    /**
     * @param {number} index file header index.
     * @param {Object=} opt_params
     * @return {!(Array.<number>|Uint8Array)} file data.
     */


    Zlib.Unzip.prototype.getFileData = function (index, opt_params) {
      opt_params = opt_params || {};
      /** @type {!(Array.<number>|Uint8Array)} */

      var input = this.input;
      /** @type {Array.<Zlib.Unzip.FileHeader>} */

      var fileHeaderList = this.fileHeaderList;
      /** @type {Zlib.Unzip.LocalFileHeader} */

      var localFileHeader;
      /** @type {number} */

      var offset;
      /** @type {number} */

      var length;
      /** @type {!(Array.<number>|Uint8Array)} */

      var buffer;
      /** @type {number} */

      var crc32;
      /** @type {Array.<number>|Uint32Array|Object} */

      var key;
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;

      if (!fileHeaderList) {
        this.parseFileHeader();
      }

      if (fileHeaderList[index] === void 0) {
        throw new Error('wrong index');
      }

      offset = fileHeaderList[index].relativeOffset;
      localFileHeader = new Zlib.Unzip.LocalFileHeader(this.input, offset);
      localFileHeader.parse();
      offset += localFileHeader.length;
      length = localFileHeader.compressedSize; // decryption

      if ((localFileHeader.flags & Zlib.Unzip.LocalFileHeader.Flags.ENCRYPT) !== 0) {
        if (!(opt_params['password'] || this.password)) {
          throw new Error('please set password');
        }

        key = this.createDecryptionKey(opt_params['password'] || this.password); // encryption header

        for (i = offset, il = offset + 12; i < il; ++i) {
          this.decode(key, input[i]);
        }

        offset += 12;
        length -= 12; // decryption

        for (i = offset, il = offset + length; i < il; ++i) {
          input[i] = this.decode(key, input[i]);
        }
      }

      switch (localFileHeader.compression) {
        case Zlib.Unzip.CompressionMethod.STORE:
          buffer = this.input.subarray(offset, offset + length);
          break;

        case Zlib.Unzip.CompressionMethod.DEFLATE:
          buffer = new Zlib.RawInflate(this.input, {
            'index': offset,
            'bufferSize': localFileHeader.plainSize
          }).decompress();
          break;

        default:
          throw new Error('unknown compression type');
      }

      if (this.verify) {
        crc32 = Zlib.CRC32.calc(buffer);

        if (localFileHeader.crc32 !== crc32) {
          throw new Error('wrong crc: file=0x' + localFileHeader.crc32.toString(16) + ', data=0x' + crc32.toString(16));
        }
      }

      return buffer;
    };
    /**
     * @return {Array.<string>}
     */


    Zlib.Unzip.prototype.getFilenames = function () {
      /** @type {Array.<string>} */
      var filenameList = [];
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;
      /** @type {Array.<Zlib.Unzip.FileHeader>} */

      var fileHeaderList;

      if (!this.fileHeaderList) {
        this.parseFileHeader();
      }

      fileHeaderList = this.fileHeaderList;

      for (i = 0, il = fileHeaderList.length; i < il; ++i) {
        filenameList[i] = fileHeaderList[i].filename;
      }

      return filenameList;
    };
    /**
     * @param {string} filename extract filename.
     * @param {Object=} opt_params
     * @return {!(Array.<number>|Uint8Array)} decompressed data.
     */


    Zlib.Unzip.prototype.decompress = function (filename, opt_params) {
      /** @type {number} */
      var index;

      if (!this.filenameToIndex) {
        this.parseFileHeader();
      }

      index = this.filenameToIndex[filename];

      if (index === void 0) {
        throw new Error(filename + ' not found');
      }

      return this.getFileData(index, opt_params);
    };
    /**
     * @param {(Array.<number>|Uint8Array)} password
     */


    Zlib.Unzip.prototype.setPassword = function (password) {
      this.password = password;
    };
    /**
     * @param {(Array.<number>|Uint32Array|Object)} key
     * @param {number} n
     * @return {number}
     */


    Zlib.Unzip.prototype.decode = function (key, n) {
      n ^= this.getByte(
      /** @type {(Array.<number>|Uint32Array)} */
      key);
      this.updateKeys(
      /** @type {(Array.<number>|Uint32Array)} */
      key, n);
      return n;
    }; // common method


    Zlib.Unzip.prototype.updateKeys = Zlib.Zip.prototype.updateKeys;
    Zlib.Unzip.prototype.createDecryptionKey = Zlib.Zip.prototype.createEncryptionKey;
    Zlib.Unzip.prototype.getByte = Zlib.Zip.prototype.getByte;
    /**
     * @fileoverview 雑多な関数群をまとめたモジュール実装.
     */

    /**
     * Byte String から Byte Array に変換.
     * @param {!string} str byte string.
     * @return {!Array.<number>} byte array.
     */

    Zlib.Util.stringToByteArray = function (str) {
      /** @type {!Array.<(string|number)>} */
      var tmp = str.split('');
      /** @type {number} */

      var i;
      /** @type {number} */

      var il;

      for (i = 0, il = tmp.length; i < il; i++) {
        tmp[i] = (tmp[i].charCodeAt(0) & 0xff) >>> 0;
      }

      return tmp;
    };
    /**
     * @fileoverview Adler32 checksum 実装.
     */

    /**
     * Adler32 ハッシュ値の作成
     * @param {!(Array|Uint8Array|string)} array 算出に使用する byte array.
     * @return {number} Adler32 ハッシュ値.
     */


    Zlib.Adler32 = function (array) {
      if (typeof array === 'string') {
        array = Zlib.Util.stringToByteArray(array);
      }

      return Zlib.Adler32.update(1, array);
    };
    /**
     * Adler32 ハッシュ値の更新
     * @param {number} adler 現在のハッシュ値.
     * @param {!(Array|Uint8Array)} array 更新に使用する byte array.
     * @return {number} Adler32 ハッシュ値.
     */


    Zlib.Adler32.update = function (adler, array) {
      /** @type {number} */
      var s1 = adler & 0xffff;
      /** @type {number} */

      var s2 = adler >>> 16 & 0xffff;
      /** @type {number} array length */

      var len = array.length;
      /** @type {number} loop length (don't overflow) */

      var tlen;
      /** @type {number} array index */

      var i = 0;

      while (len > 0) {
        tlen = len > Zlib.Adler32.OptimizationParameter ? Zlib.Adler32.OptimizationParameter : len;
        len -= tlen;

        do {
          s1 += array[i++];
          s2 += s1;
        } while (--tlen);

        s1 %= 65521;
        s2 %= 65521;
      }

      return (s2 << 16 | s1) >>> 0;
    };
    /**
     * Adler32 最適化パラメータ
     * 現状では 1024 程度が最適.
     * @see http://jsperf.com/adler-32-simple-vs-optimized/3
     * @define {number}
     */


    Zlib.Adler32.OptimizationParameter = 1024;
    /**
     * ビットストリーム
     * @constructor
     * @param {!(Array|Uint8Array)=} buffer output buffer.
     * @param {number=} bufferPosition start buffer pointer.
     */

    Zlib.BitStream = function (buffer, bufferPosition) {
      /** @type {number} buffer index. */
      this.index = typeof bufferPosition === 'number' ? bufferPosition : 0;
      /** @type {number} bit index. */

      this.bitindex = 0;
      /** @type {!(Array|Uint8Array)} bit-stream output buffer. */

      this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(Zlib.BitStream.DefaultBlockSize); // 入力された index が足りなかったら拡張するが、倍にしてもダメなら不正とする

      if (this.buffer.length * 2 <= this.index) {
        throw new Error("invalid index");
      } else if (this.buffer.length <= this.index) {
        this.expandBuffer();
      }
    };
    /**
     * デフォルトブロックサイズ.
     * @const
     * @type {number}
     */


    Zlib.BitStream.DefaultBlockSize = 0x8000;
    /**
     * expand buffer.
     * @return {!(Array|Uint8Array)} new buffer.
     */

    Zlib.BitStream.prototype.expandBuffer = function () {
      /** @type {!(Array|Uint8Array)} old buffer. */
      var oldbuf = this.buffer;
      /** @type {number} loop limiter. */

      var il = oldbuf.length;
      /** @type {!(Array|Uint8Array)} new buffer. */

      var buffer = new Uint8Array(il << 1); // copy buffer

      {
        buffer.set(oldbuf);
      }
      return this.buffer = buffer;
    };
    /**
     * 数値をビットで指定した数だけ書き込む.
     * @param {number} number 書き込む数値.
     * @param {number} n 書き込むビット数.
     * @param {boolean=} reverse 逆順に書き込むならば true.
     */


    Zlib.BitStream.prototype.writeBits = function (number, n, reverse) {
      var buffer = this.buffer;
      var index = this.index;
      var bitindex = this.bitindex;
      /** @type {number} current octet. */

      var current = buffer[index];
      /** @type {number} loop counter. */

      var i;
      /**
       * 32-bit 整数のビット順を逆にする
       * @param {number} n 32-bit integer.
       * @return {number} reversed 32-bit integer.
       * @private
       */

      function rev32_(n) {
        return Zlib.BitStream.ReverseTable[n & 0xFF] << 24 | Zlib.BitStream.ReverseTable[n >>> 8 & 0xFF] << 16 | Zlib.BitStream.ReverseTable[n >>> 16 & 0xFF] << 8 | Zlib.BitStream.ReverseTable[n >>> 24 & 0xFF];
      }

      if (reverse && n > 1) {
        number = n > 8 ? rev32_(number) >> 32 - n : Zlib.BitStream.ReverseTable[number] >> 8 - n;
      } // Byte 境界を超えないとき


      if (n + bitindex < 8) {
        current = current << n | number;
        bitindex += n; // Byte 境界を超えるとき
      } else {
        for (i = 0; i < n; ++i) {
          current = current << 1 | number >> n - i - 1 & 1; // next byte

          if (++bitindex === 8) {
            bitindex = 0;
            buffer[index++] = Zlib.BitStream.ReverseTable[current];
            current = 0; // expand

            if (index === buffer.length) {
              buffer = this.expandBuffer();
            }
          }
        }
      }

      buffer[index] = current;
      this.buffer = buffer;
      this.bitindex = bitindex;
      this.index = index;
    };
    /**
     * ストリームの終端処理を行う
     * @return {!(Array|Uint8Array)} 終端処理後のバッファを byte array で返す.
     */


    Zlib.BitStream.prototype.finish = function () {
      var buffer = this.buffer;
      var index = this.index;
      /** @type {!(Array|Uint8Array)} output buffer. */

      var output; // bitindex が 0 の時は余分に index が進んでいる状態

      if (this.bitindex > 0) {
        buffer[index] <<= 8 - this.bitindex;
        buffer[index] = Zlib.BitStream.ReverseTable[buffer[index]];
        index++;
      } // array truncation


      {
        output = buffer.subarray(0, index);
      }
      return output;
    };
    /**
     * 0-255 のビット順を反転したテーブル
     * @const
     * @type {!(Uint8Array|Array.<number>)}
     */


    Zlib.BitStream.ReverseTable = function (table) {
      return table;
    }(function () {
      /** @type {!(Array|Uint8Array)} reverse table. */
      var table = new Uint8Array(256);
      /** @type {number} loop counter. */

      var i; // generate

      for (i = 0; i < 256; ++i) {
        table[i] = function (n) {
          var r = n;
          var s = 7;

          for (n >>>= 1; n; n >>>= 1) {
            r <<= 1;
            r |= n & 1;
            --s;
          }

          return (r << s & 0xff) >>> 0;
        }(i);
      }

      return table;
    }());
    /**
     * CRC32 ハッシュ値を取得
     * @param {!(Array.<number>|Uint8Array)} data data byte array.
     * @param {number=} pos data position.
     * @param {number=} length data length.
     * @return {number} CRC32.
     */


    Zlib.CRC32.calc = function (data, pos, length) {
      return Zlib.CRC32.update(data, 0, pos, length);
    };
    /**
     * CRC32ハッシュ値を更新
     * @param {!(Array.<number>|Uint8Array)} data data byte array.
     * @param {number} crc CRC32.
     * @param {number=} pos data position.
     * @param {number=} length data length.
     * @return {number} CRC32.
     */


    Zlib.CRC32.update = function (data, crc, pos, length) {
      var table = Zlib.CRC32.Table;
      var i = typeof pos === 'number' ? pos : pos = 0;
      var il = typeof length === 'number' ? length : data.length;
      crc ^= 0xffffffff; // loop unrolling for performance

      for (i = il & 7; i--; ++pos) {
        crc = crc >>> 8 ^ table[(crc ^ data[pos]) & 0xff];
      }

      for (i = il >> 3; i--; pos += 8) {
        crc = crc >>> 8 ^ table[(crc ^ data[pos]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 1]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 2]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 3]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 4]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 5]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 6]) & 0xff];
        crc = crc >>> 8 ^ table[(crc ^ data[pos + 7]) & 0xff];
      }

      return (crc ^ 0xffffffff) >>> 0;
    };
    /**
     * @param {number} num
     * @param {number} crc
     * @returns {number}
     */


    Zlib.CRC32.single = function (num, crc) {
      return (Zlib.CRC32.Table[(num ^ crc) & 0xff] ^ num >>> 8) >>> 0;
    };
    /**
     * @type {Array.<number>}
     * @const
     * @private
     */


    Zlib.CRC32.Table_ = [0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f, 0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9, 0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d];
    /**
     * @type {!(Array.<number>|Uint32Array)} CRC-32 Table.
     * @const
     */

    Zlib.CRC32.Table = new Uint32Array(Zlib.CRC32.Table_);
    /**
     * @fileoverview Deflate (RFC1951) 実装.
     * Deflateアルゴリズム本体は Zlib.RawDeflate で実装されている.
     */

    /**
     * Zlib Deflate
     * @constructor
     * @param {!(Array|Uint8Array)} input 符号化する対象の byte array.
     * @param {Object=} opt_params option parameters.
     */

    Zlib.Deflate = function (input, opt_params) {
      /** @type {!(Array|Uint8Array)} */
      this.input = input;
      /** @type {!(Array|Uint8Array)} */

      this.output = new Uint8Array(Zlib.Deflate.DefaultBufferSize);
      /** @type {Zlib.Deflate.CompressionType} */

      this.compressionType = Zlib.Deflate.CompressionType.DYNAMIC;
      /** @type {Zlib.RawDeflate} */

      this.rawDeflate;
      /** @type {Object} */

      var rawDeflateOption = {};
      /** @type {string} */

      var prop; // option parameters

      if (opt_params || !(opt_params = {})) {
        if (typeof opt_params['compressionType'] === 'number') {
          this.compressionType = opt_params['compressionType'];
        }
      } // copy options


      for (prop in opt_params) {
        rawDeflateOption[prop] = opt_params[prop];
      } // set raw-deflate output buffer


      rawDeflateOption['outputBuffer'] = this.output;
      this.rawDeflate = new Zlib.RawDeflate(this.input, rawDeflateOption);
    };
    /**
     * @const
     * @type {number} デフォルトバッファサイズ.
     */


    Zlib.Deflate.DefaultBufferSize = 0x8000;
    /**
     * @enum {number}
     */

    Zlib.Deflate.CompressionType = Zlib.RawDeflate.CompressionType;
    /**
     * 直接圧縮に掛ける.
     * @param {!(Array|Uint8Array)} input target buffer.
     * @param {Object=} opt_params option parameters.
     * @return {!(Array|Uint8Array)} compressed data byte array.
     */

    Zlib.Deflate.compress = function (input, opt_params) {
      return new Zlib.Deflate(input, opt_params).compress();
    };
    /**
     * Deflate Compression.
     * @return {!(Array|Uint8Array)} compressed data byte array.
     */


    Zlib.Deflate.prototype.compress = function () {
      /** @type {Zlib.CompressionMethod} */
      var cm;
      /** @type {number} */

      var cinfo;
      /** @type {number} */

      var cmf;
      /** @type {number} */

      var flg;
      /** @type {number} */

      var fcheck;
      /** @type {number} */

      var fdict;
      /** @type {number} */

      var flevel;
      /** @type {number} */

      var adler;
      /** @type {!(Array|Uint8Array)} */

      var output;
      /** @type {number} */

      var pos = 0;
      output = this.output; // Compression Method and Flags

      cm = Zlib.CompressionMethod.DEFLATE;

      switch (cm) {
        case Zlib.CompressionMethod.DEFLATE:
          cinfo = Math.LOG2E * Math.log(Zlib.RawDeflate.WindowSize) - 8;
          break;

        default:
          throw new Error('invalid compression method');
      }

      cmf = cinfo << 4 | cm;
      output[pos++] = cmf; // Flags

      fdict = 0;

      switch (cm) {
        case Zlib.CompressionMethod.DEFLATE:
          switch (this.compressionType) {
            case Zlib.Deflate.CompressionType.NONE:
              flevel = 0;
              break;

            case Zlib.Deflate.CompressionType.FIXED:
              flevel = 1;
              break;

            case Zlib.Deflate.CompressionType.DYNAMIC:
              flevel = 2;
              break;

            default:
              throw new Error('unsupported compression type');
          }

          break;

        default:
          throw new Error('invalid compression method');
      }

      flg = flevel << 6 | fdict << 5;
      fcheck = 31 - (cmf * 256 + flg) % 31;
      flg |= fcheck;
      output[pos++] = flg; // Adler-32 checksum

      adler = Zlib.Adler32(this.input);
      this.rawDeflate.op = pos;
      output = this.rawDeflate.compress();
      pos = output.length;
      {
        // subarray 分を元にもどす
        output = new Uint8Array(output.buffer); // expand buffer

        if (output.length <= pos + 4) {
          this.output = new Uint8Array(output.length + 4);
          this.output.set(output);
          output = this.output;
        }

        output = output.subarray(0, pos + 4);
      } // adler32

      output[pos++] = adler >> 24 & 0xff;
      output[pos++] = adler >> 16 & 0xff;
      output[pos++] = adler >> 8 & 0xff;
      output[pos++] = adler & 0xff;
      return output;
    };
    /**
     * Covers string literals and String objects
     * @param x
     * @returns {boolean}
     */


    function isString(x) {
      return typeof x === "string" || x instanceof String;
    }

    function isGoogleURL(url) {
      return url.includes("googleapis") && !url.includes("urlshortener") || isGoogleStorageURL(url) || isGoogleDriveURL(url);
    }

    function isGoogleStorageURL(url) {
      return url.startsWith("gs://") || url.startsWith("https://www.googleapis.com/storage") || url.startsWith("https://storage.cloud.google.com") || url.startsWith("https://storage.googleapis.com");
    }

    function isGoogleDriveURL(url) {
      return url.indexOf("drive.google.com") >= 0 || url.indexOf("www.googleapis.com/drive") > 0;
    }
    /**
     * Translate gs:// urls to https
     * See https://cloud.google.com/storage/docs/json_api/v1
     * @param gsUrl
     * @returns {string|*}
     */


    function translateGoogleCloudURL(gsUrl) {
      let {
        bucket,
        object
      } = parseBucketName(gsUrl);
      object = encode(object);
      const qIdx = gsUrl.indexOf('?');
      const paramString = qIdx > 0 ? gsUrl.substring(qIdx) + "&alt=media" : "?alt=media";
      return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}${paramString}`;
    }
    /**
     * Parse a google bucket and object name from a google storage URL.  Known forms include
     *
     * gs://BUCKET_NAME/OBJECT_NAME
     * https://storage.googleapis.com/BUCKET_NAME/OBJECT_NAME
     * https://storage.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
     * https://www.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME"
     * https://storage.googleapis.com/download/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
     *
     * @param url
     */


    function parseBucketName(url) {
      let bucket;
      let object;

      if (url.startsWith("gs://")) {
        const i = url.indexOf('/', 5);

        if (i >= 0) {
          bucket = url.substring(5, i);
          const qIdx = url.indexOf('?');
          object = qIdx < 0 ? url.substring(i + 1) : url.substring(i + 1, qIdx);
        }
      } else if (url.startsWith("https://storage.googleapis.com") || url.startsWith("https://storage.cloud.google.com")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);

        if (bucketIdx > 0) {
          const objIdx = url.indexOf("/o/", bucketIdx);

          if (objIdx > 0) {
            const queryIdx = url.indexOf("?", objIdx);
            bucket = url.substring(bucketIdx + 6, objIdx);
            object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
          }
        } else {
          const idx1 = url.indexOf("/", 8);
          const idx2 = url.indexOf("/", idx1 + 1);
          const idx3 = url.indexOf("?", idx2);

          if (idx2 > 0) {
            bucket = url.substring(idx1 + 1, idx2);
            object = idx3 < 0 ? url.substring(idx2 + 1) : url.substring(idx2 + 1, idx3);
          }
        }
      } else if (url.startsWith("https://www.googleapis.com/storage/v1/b")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);
        const objIdx = url.indexOf("/o/", bucketIdx);

        if (objIdx > 0) {
          const queryIdx = url.indexOf("?", objIdx);
          bucket = url.substring(bucketIdx + 6, objIdx);
          object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
        }
      }

      if (bucket && object) {
        return {
          bucket,
          object
        };
      } else {
        throw Error(`Unrecognized Google Storage URI: ${url}`);
      }
    }

    function driveDownloadURL(link) {
      // Return a google drive download url for the sharable link
      //https://drive.google.com/open?id=0B-lleX9c2pZFbDJ4VVRxakJzVGM
      //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
      var id = getGoogleDriveFileID(link);
      return id ? "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media&supportsTeamDrives=true" : link;
    }

    function getGoogleDriveFileID(link) {
      //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
      //https://www.googleapis.com/drive/v3/files/1w-tvo6p1SH4p1OaQSVxpkV_EJgGIstWF?alt=media&supportsTeamDrives=true"
      if (link.includes("/open?id=")) {
        const i1 = link.indexOf("/open?id=") + 9;
        const i2 = link.indexOf("&");

        if (i1 > 0 && i2 > i1) {
          return link.substring(i1, i2);
        } else if (i1 > 0) {
          return link.substring(i1);
        }
      } else if (link.includes("/file/d/")) {
        const i1 = link.indexOf("/file/d/") + 8;
        const i2 = link.lastIndexOf("/");
        return link.substring(i1, i2);
      } else if (link.startsWith("https://www.googleapis.com/drive")) {
        let i1 = link.indexOf("/files/");
        const i2 = link.indexOf("?");

        if (i1 > 0) {
          i1 += 7;
          return i2 > 0 ? link.substring(i1, i2) : link.substring(i1);
        }
      }

      throw Error("Unknown Google Drive url format: " + link);
    }
    /**
     * Percent a GCS object name.  See https://cloud.google.com/storage/docs/request-endpoints
     * Specific characters to encode:
     *   !, #, $, &, ', (, ), *, +, ,, /, :, ;, =, ?, @, [, ], and space characters.
     * @param obj
     */


    function encode(objectName) {
      let result = '';
      objectName.split('').forEach(function (letter) {
        if (encodings.has(letter)) {
          result += encodings.get(letter);
        } else {
          result += letter;
        }
      });
      return result;
    } //	%23	%24	%25	%26	%27	%28	%29	%2A	%2B	%2C	%2F	%3A	%3B	%3D	%3F	%40	%5B	%5D


    const encodings = new Map();
    encodings.set("!", "%21");
    encodings.set("#", "%23");
    encodings.set("$", "%24");
    encodings.set("%", "%25");
    encodings.set("&", "%26");
    encodings.set("'", "%27");
    encodings.set("(", "%28");
    encodings.set(")", "%29");
    encodings.set("*", "%2A");
    encodings.set("+", "%2B");
    encodings.set(",", "%2C");
    encodings.set("/", "%2F");
    encodings.set(":", "%3A");
    encodings.set(";", "%3B");
    encodings.set("=", "%3D");
    encodings.set("?", "%3F");
    encodings.set("@", "%40");
    encodings.set("[", "%5B");
    encodings.set("]", "%5D");
    encodings.set(" ", "%20"); // Convenience functions for the gapi oAuth library.

    const FIVE_MINUTES = 5 * 60 * 1000;

    function isInitialized() {
      return typeof gapi !== "undefined" && gapi.auth2 && gapi.auth2.getAuthInstance();
    }

    let inProgress = false;

    async function getAccessToken(scope) {
      if (typeof gapi === "undefined") {
        throw Error("Google authentication requires the 'gapi' library");
      }

      if (!gapi.auth2) {
        throw Error("Google 'auth2' has not been initialized");
      }

      if (inProgress) {
        return new Promise(function (resolve, reject) {
          let intervalID;

          const checkForToken = () => {
            // Wait for inProgress to equal "false"
            try {
              if (inProgress === false) {
                //console.log("Delayed resolution for " + scope);
                resolve(getAccessToken(scope));
                clearInterval(intervalID);
              }
            } catch (e) {
              clearInterval(intervalID);
              reject(e);
            }
          };

          intervalID = setInterval(checkForToken, 100);
        });
      } else {
        inProgress = true;

        try {
          let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
          let token;

          if (currentUser.isSignedIn()) {
            if (!currentUser.hasGrantedScopes(scope)) {
              await currentUser.grant({
                scope
              });
            }

            const {
              access_token,
              expires_at
            } = currentUser.getAuthResponse();

            if (Date.now() < expires_at - FIVE_MINUTES) {
              token = {
                access_token,
                expires_at
              };
            } else {
              const {
                access_token,
                expires_at
              } = currentUser.reloadAuthResponse();
              token = {
                access_token,
                expires_at
              };
            }
          } else {
            currentUser = await signIn(scope);
            const {
              access_token,
              expires_at
            } = currentUser.getAuthResponse();
            token = {
              access_token,
              expires_at
            };
          }

          return token;
        } finally {
          inProgress = false;
        }
      }
    }
    /**
     * Return the current access token if the user is signed in, or undefined otherwise.  This function does not
     * attempt a signIn or request any specfic scopes.
     *
     * @returns access_token || undefined
     */


    function getCurrentAccessToken() {
      let currentUser = gapi.auth2.getAuthInstance().currentUser.get();

      if (currentUser && currentUser.isSignedIn()) {
        const {
          access_token,
          expires_at
        } = currentUser.getAuthResponse();
        return {
          access_token,
          expires_at
        };
      } else {
        return undefined;
      }
    }

    async function signIn(scope) {
      const options = new gapi.auth2.SigninOptionsBuilder();
      options.setPrompt('select_account');
      options.setScope(scope);
      return gapi.auth2.getAuthInstance().signIn(options);
    }

    function getScopeForURL(url) {
      if (isGoogleDriveURL(url)) {
        return "https://www.googleapis.com/auth/drive.file";
      } else if (isGoogleStorageURL(url)) {
        return "https://www.googleapis.com/auth/devstorage.read_only";
      } else {
        return 'https://www.googleapis.com/auth/userinfo.profile';
      }
    }

    function getApiKey() {
      return gapi.apiKey;
    }

    async function getDriveFileInfo(googleDriveURL) {
      const id = getGoogleDriveFileID(googleDriveURL);
      let endPoint = "https://www.googleapis.com/drive/v3/files/" + id + "?supportsTeamDrives=true";
      const apiKey = getApiKey();

      if (apiKey) {
        endPoint += "&key=" + apiKey;
      }

      const response = await fetch(endPoint);
      let json = await response.json();

      if (json.error && json.error.code === 404) {
        const {
          access_token
        } = await getAccessToken("https://www.googleapis.com/auth/drive.readonly");

        if (access_token) {
          const response = await fetch(endPoint, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });
          json = await response.json();

          if (json.error) {
            throw Error(json.error);
          }
        } else {
          throw Error(json.error);
        }
      }

      return json;
    }

    if (typeof process === 'object' && typeof window === 'undefined') {
      global.atob = function (str) {
        return Buffer.from(str, 'base64').toString('binary');
      };
    }
    /**
     * @param dataURI
     * @returns {Array<number>|Uint8Array}
     */


    function decodeDataURI(dataURI) {
      const split = dataURI.split(',');
      const info = split[0].split(':')[1];
      let dataString = split[1];

      if (info.indexOf('base64') >= 0) {
        dataString = atob(dataString);
      } else {
        dataString = decodeURI(dataString); // URL encoded string -- not currently used of tested
      }

      const bytes = new Uint8Array(dataString.length);

      for (let i = 0; i < dataString.length; i++) {
        bytes[i] = dataString.charCodeAt(i);
      }

      let plain;

      if (info.indexOf('gzip') > 0) {
        const inflate = new Zlib.Gunzip(bytes);
        plain = inflate.decompress();
      } else {
        plain = bytes;
      }

      return plain;
    }

    function parseUri(str) {
      var o = options,
          m = o.parser["loose"].exec(str),
          uri = {},
          i = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });
      return uri;
    }

    const options = {
      strictMode: false,
      key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
      q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };
    /**
     * Return the filename from the path.   Example
     *   https://foo.com/bar.bed?param=2   => bar.bed
     * @param urlOrFile
     */

    function getFilename$1(urlOrFile) {
      if (urlOrFile instanceof File) {
        return urlOrFile.name;
      } else if (isString(urlOrFile)) {
        let index = urlOrFile.lastIndexOf("/");
        let filename = index < 0 ? urlOrFile : urlOrFile.substr(index + 1); //Strip parameters -- handle local files later

        index = filename.indexOf("?");

        if (index > 0) {
          filename = filename.substr(0, index);
        }

        return filename;
      } else {
        throw Error(`Expected File or string, got ${typeof urlOrFile}`);
      }
    } // Uncompress data,  assumed to be series of bgzipped blocks


    function unbgzf(data, lim) {
      const oBlockList = [];
      let ptr = 0;
      let totalSize = 0;
      lim = lim || data.byteLength - 18;

      while (ptr < lim) {
        try {
          const ba = new Uint8Array(data, ptr, 18);
          const xlen = ba[11] << 8 | ba[10];
          const si1 = ba[12];
          const si2 = ba[13];
          const slen = ba[15] << 8 | ba[14];
          const bsize = (ba[17] << 8 | ba[16]) + 1;
          const start = 12 + xlen + ptr; // Start of CDATA

          const bytesLeft = data.byteLength - start;
          const cDataSize = bsize - xlen - 19;
          if (bytesLeft < cDataSize || cDataSize <= 0) break;
          const a = new Uint8Array(data, start, cDataSize);
          const inflate = new Zlib.RawInflate(a);
          const unc = inflate.decompress();
          ptr += inflate.ip + 26;
          totalSize += unc.byteLength;
          oBlockList.push(unc);
        } catch (e) {
          console.error(e);
          break;
        }
      } // Concatenate decompressed blocks


      if (oBlockList.length === 1) {
        return oBlockList[0];
      } else {
        const out = new Uint8Array(totalSize);
        let cursor = 0;

        for (let i = 0; i < oBlockList.length; ++i) {
          var b = new Uint8Array(oBlockList[i]);
          arrayCopy(b, 0, out, cursor, b.length);
          cursor += b.length;
        }

        return out;
      }
    } // From Thomas Down's zlib implementation


    const testArray = new Uint8Array(1);
    const hasSubarray = typeof testArray.subarray === 'function';

    function arrayCopy(src, srcOffset, dest, destOffset, count) {
      if (count === 0) {
        return;
      }

      if (!src) {
        throw "Undef src";
      } else if (!dest) {
        throw "Undef dest";
      }

      if (srcOffset === 0 && count === src.length) {
        arrayCopy_fast(src, dest, destOffset);
      } else if (hasSubarray) {
        arrayCopy_fast(src.subarray(srcOffset, srcOffset + count), dest, destOffset);
      } else if (src.BYTES_PER_ELEMENT === 1 && count > 100) {
        arrayCopy_fast(new Uint8Array(src.buffer, src.byteOffset + srcOffset, count), dest, destOffset);
      } else {
        arrayCopy_slow(src, srcOffset, dest, destOffset, count);
      }
    }

    function arrayCopy_slow(src, srcOffset, dest, destOffset, count) {
      for (let i = 0; i < count; ++i) {
        dest[destOffset + i] = src[srcOffset + i];
      }
    }

    function arrayCopy_fast(src, dest, destOffset) {
      dest.set(src, destOffset);
    } // Support for oauth token based authorization
    // This class supports explicit setting of an oauth token either globally or for specific hosts.
    //
    // The variable oauth.google.access_token, which becomes igv.oauth.google.access_token on ES5 conversion is
    // supported for backward compatibility


    const DEFAULT_HOST = "googleapis";
    const oauth = {
      oauthTokens: {},
      setToken: function (token, host) {
        host = host || DEFAULT_HOST;
        this.oauthTokens[host] = token;

        if (host === DEFAULT_HOST) {
          this.google.access_token = token; // legacy support
        }
      },
      getToken: function (host) {
        host = host || DEFAULT_HOST;
        let token;

        for (let key of Object.keys(this.oauthTokens)) {
          const regex = wildcardToRegExp(key);

          if (regex.test(host)) {
            token = this.oauthTokens[key];
            break;
          }
        }

        return token;
      },
      removeToken: function (host) {
        host = host || DEFAULT_HOST;

        for (let key of Object.keys(this.oauthTokens)) {
          const regex = wildcardToRegExp(key);

          if (regex.test(host)) {
            this.oauthTokens[key] = undefined;
          }
        }

        if (host === DEFAULT_HOST) {
          this.google.access_token = undefined; // legacy support
        }
      },
      // Special object for google -- legacy support
      google: {
        setToken: function (token) {
          oauth.setToken(token);
        }
      }
    };
    /**
     * Creates a RegExp from the given string, converting asterisks to .* expressions,
     * and escaping all other characters.
     *
     * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
     */

    function wildcardToRegExp(s) {
      return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$');
    }
    /**
     * RegExp-escapes all characters in the given string.
     *
     * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
     */


    function regExpEscape(s) {
      return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    } // The MIT License (MIT)

    /**
     * @constructor
     * @param {Object} options A set op options to pass to the throttle function
     *        @param {number} requestsPerSecond The amount of requests per second
     *                                          the library will limit to
     */


    class Throttle {
      constructor(options) {
        this.requestsPerSecond = options.requestsPerSecond || 10;
        this.lastStartTime = 0;
        this.queued = [];
      }
      /**
       * Adds a promise
       * @param {Function} async function to be executed
       * @param {Object} options A set of options.
       * @return {Promise} A promise
       */


      add(asyncFunction, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
          self.queued.push({
            resolve: resolve,
            reject: reject,
            asyncFunction: asyncFunction
          });
          self.dequeue();
        });
      }
      /**
       * Adds all the promises passed as parameters
       * @param {Function} promises An array of functions that return a promise
       * @param {Object} options A set of options.
       * @param {number} options.signal An AbortSignal object that can be used to abort the returned promise
       * @param {number} options.weight A "weight" of each operation resolving by array of promises
       * @return {Promise} A promise that succeeds when all the promises passed as options do
       */


      addAll(promises, options) {
        var addedPromises = promises.map(function (promise) {
          return this.add(promise, options);
        }.bind(this));
        return Promise.all(addedPromises);
      }

      /**
       * Dequeues a promise
       * @return {void}
       */
      dequeue() {
        if (this.queued.length > 0) {
          var now = new Date(),
              inc = 1000 / this.requestsPerSecond + 1,
              elapsed = now - this.lastStartTime;

          if (elapsed >= inc) {
            this._execute();
          } else {
            // we have reached the limit, schedule a dequeue operation
            setTimeout(function () {
              this.dequeue();
            }.bind(this), inc - elapsed);
          }
        }
      }
      /**
       * Executes the promise
       * @private
       * @return {void}
       */


      async _execute() {
        this.lastStartTime = new Date();
        var candidate = this.queued.shift();
        const f = candidate.asyncFunction;

        try {
          const r = await f();
          candidate.resolve(r);
        } catch (e) {
          candidate.reject(e);
        }
      }

    }
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Broad Institute
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */


    var NONE = 0;
    var GZIP = 1;
    var BGZF = 2;
    var UNKNOWN = 3;
    let RANGE_WARNING_GIVEN = false;
    const googleThrottle = new Throttle({
      requestsPerSecond: 8
    });
    const igvxhr = {
      apiKey: undefined,
      setApiKey: function (key) {
        this.apiKey = key;
      },
      load: load,
      loadArrayBuffer: async function (url, options) {
        options = options || {};

        if (!options.responseType) {
          options.responseType = "arraybuffer";
        }

        if (url instanceof File) {
          return loadFileSlice(url, options);
        } else {
          return load(url, options);
        }
      },
      loadJson: async function (url, options) {
        options = options || {};
        const method = options.method || (options.sendData ? "POST" : "GET");

        if (method === "POST") {
          options.contentType = "application/json";
        }

        const result = await this.loadString(url, options);

        if (result) {
          return JSON.parse(result);
        } else {
          return result;
        }
      },
      loadString: async function (path, options) {
        options = options || {};

        if (path instanceof File) {
          return loadStringFromFile(path, options);
        } else {
          return loadStringFromUrl(path, options);
        }
      }
    };

    async function load(url, options) {
      options = options || {};
      const urlType = typeof url; // Resolve functions, promises, and functions that return promises

      url = await (typeof url === 'function' ? url() : url);

      if (url instanceof File) {
        return loadFileSlice(url, options);
      } else if (typeof url.startsWith === 'function') {
        // Test for string
        if (url.startsWith("data:")) {
          return decodeDataURI(url);
        } else {
          if (url.startsWith("https://drive.google.com")) {
            url = driveDownloadURL(url);
          }

          if (isGoogleDriveURL(url) || url.startsWith("https://www.dropbox.com")) {
            return googleThrottle.add(async function () {
              return loadURL(url, options);
            });
          } else {
            return loadURL(url, options);
          }
        }
      } else {
        throw Error(`url must be either a 'File', 'string', 'function', or 'Promise'.  Actual type: ${urlType}`);
      }
    }

    async function loadURL(url, options) {
      //console.log(`${Date.now()}   ${url}`)
      url = mapUrl(url);
      options = options || {};
      let oauthToken = options.oauthToken || getOauthToken(url);

      if (oauthToken) {
        oauthToken = await (typeof oauthToken === 'function' ? oauthToken() : oauthToken);
      }

      return new Promise(function (resolve, reject) {
        // Various Google tansformations
        if (isGoogleURL(url)) {
          if (isGoogleStorageURL(url)) {
            url = translateGoogleCloudURL(url);
          }

          url = addApiKey(url);

          if (isGoogleDriveURL(url)) {
            addTeamDrive(url);
          } // If we have an access token try it, but don't force a signIn or request for scopes yet


          if (!oauthToken) {
            oauthToken = getCurrentGoogleAccessToken();
          }
        }

        const headers = options.headers || {};

        if (oauthToken) {
          addOauthHeaders(headers, oauthToken);
        }

        const range = options.range;
        const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
        navigator.vendor.indexOf("Apple") === 0 && /\sSafari\//.test(navigator.userAgent);

        if (range && isChrome && !isAmazonV4Signed(url)) {
          // Hack to prevent caching for byte-ranges. Attempt to fix net:err-cache errors in Chrome
          url += url.includes("?") ? "&" : "?";
          url += "someRandomSeed=" + Math.random().toString(36);
        }

        const xhr = new XMLHttpRequest();
        const sendData = options.sendData || options.body;
        const method = options.method || (sendData ? "POST" : "GET");
        const responseType = options.responseType;
        const contentType = options.contentType;
        const mimeType = options.mimeType;
        xhr.open(method, url);

        if (options.timeout) {
          xhr.timeout = options.timeout;
        }

        if (range) {
          var rangeEnd = range.size ? range.start + range.size - 1 : "";
          xhr.setRequestHeader("Range", "bytes=" + range.start + "-" + rangeEnd); //      xhr.setRequestHeader("Cache-Control", "no-cache");    <= This can cause CORS issues, disabled for now
        }

        if (contentType) {
          xhr.setRequestHeader("Content-Type", contentType);
        }

        if (mimeType) {
          xhr.overrideMimeType(mimeType);
        }

        if (responseType) {
          xhr.responseType = responseType;
        }

        if (headers) {
          for (let key of Object.keys(headers)) {
            const value = headers[key];
            xhr.setRequestHeader(key, value);
          }
        } // NOTE: using withCredentials with servers that return "*" for access-allowed-origin will fail


        if (options.withCredentials === true) {
          xhr.withCredentials = true;
        }

        xhr.onload = async function (event) {
          // when the url points to a local file, the status is 0 but that is not an error
          if (xhr.status === 0 || xhr.status >= 200 && xhr.status <= 300) {
            if (range && xhr.status !== 206 && range.start !== 0) {
              // For small files a range starting at 0 can return the whole file => 200
              // Provide just the slice we asked for, throw out the rest quietly
              // If file is large warn user
              if (xhr.response.length > 100000 && !RANGE_WARNING_GIVEN) {
                alert(`Warning: Range header ignored for URL: ${url}.  This can have performance impacts.`);
              }

              resolve(xhr.response.slice(range.start, range.start + range.size));
            } else {
              resolve(xhr.response);
            }
          } else if (typeof gapi !== "undefined" && (xhr.status === 404 || xhr.status === 401 || xhr.status === 403) && isGoogleURL(url) && !options.retries) {
            tryGoogleAuth();
          } else {
            if (xhr.status === 403) {
              handleError("Access forbidden: " + url);
            } else if (xhr.status === 416) {
              //  Tried to read off the end of the file.   This shouldn't happen, but if it does return an
              handleError("Unsatisfiable range");
            } else {
              handleError(xhr.status);
            }
          }
        };

        xhr.onerror = function (event) {
          if (isGoogleURL(url) && !options.retries) {
            tryGoogleAuth();
          }

          handleError("Error accessing resource: " + url + " Status: " + xhr.status);
        };

        xhr.ontimeout = function (event) {
          handleError("Timed out");
        };

        xhr.onabort = function (event) {
          reject(event);
        };

        try {
          xhr.send(sendData);
        } catch (e) {
          reject(e);
        }

        function handleError(error) {
          if (reject) {
            reject(error);
          } else {
            throw error;
          }
        }

        async function tryGoogleAuth() {
          try {
            const accessToken = await fetchGoogleAccessToken(url);
            options.retries = 1;
            options.oauthToken = accessToken;
            const response = await load(url, options);
            resolve(response);
          } catch (e) {
            if (e.error) {
              const msg = e.error.startsWith("popup_blocked") ? "Google login popup blocked by browser." : e.error;
              alert(msg);
            } else {
              handleError(e);
            }
          }
        }
      });
    }

    async function loadFileSlice(localfile, options) {
      let blob = options && options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile;

      if ("arraybuffer" === options.responseType) {
        return blobToArrayBuffer(blob);
      } else {
        // binary string format, shouldn't be used anymore
        return new Promise(function (resolve, reject) {
          const fileReader = new FileReader();

          fileReader.onload = function (e) {
            resolve(fileReader.result);
          };

          fileReader.onerror = function (e) {
            console.error("reject uploading local file " + localfile.name);
            reject(null, fileReader);
          };

          fileReader.readAsBinaryString(blob);
          console.warn("Deprecated method used: readAsBinaryString");
        });
      }
    }

    async function loadStringFromFile(localfile, options) {
      const blob = options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile;
      let compression = NONE;

      if (options && options.bgz || localfile.name.endsWith(".bgz")) {
        compression = BGZF;
      } else if (localfile.name.endsWith(".gz")) {
        compression = GZIP;
      }

      if (compression === NONE) {
        return blobToText(blob);
      } else {
        const arrayBuffer = await blobToArrayBuffer(blob);
        return arrayBufferToString(arrayBuffer, compression);
      }
    }

    async function blobToArrayBuffer(blob) {
      if (typeof blob.arrayBuffer === 'function') {
        return blob.arrayBuffer();
      }

      return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();

        fileReader.onload = function (e) {
          resolve(fileReader.result);
        };

        fileReader.onerror = function (e) {
          console.error("reject uploading local file " + localfile.name);
          reject(null, fileReader);
        };

        fileReader.readAsArrayBuffer(blob);
      });
    }

    async function blobToText(blob) {
      if (typeof blob.text === 'function') {
        return blob.text();
      }

      return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();

        fileReader.onload = function (e) {
          resolve(fileReader.result);
        };

        fileReader.onerror = function (e) {
          console.error("reject uploading local file " + localfile.name);
          reject(null, fileReader);
        };

        fileReader.readAsText(blob);
      });
    }

    async function loadStringFromUrl(url, options) {
      options = options || {};
      const fn = options.filename || (await getFilename(url));
      let compression = UNKNOWN;

      if (options.bgz) {
        compression = BGZF;
      } else if (fn.endsWith(".gz")) {
        compression = GZIP;
      }

      options.responseType = "arraybuffer";
      const data = await igvxhr.load(url, options);
      return arrayBufferToString(data, compression);
    }

    function isAmazonV4Signed(url) {
      return url.indexOf("X-Amz-Signature") > -1;
    }

    function getOauthToken(url) {
      // Google is the default provider, don't try to parse host for google URLs
      const host = isGoogleURL(url) ? undefined : parseUri(url).host;
      let token = oauth.getToken(host);

      if (token) {
        return token;
      } else if (host === undefined) {
        const googleToken = getCurrentGoogleAccessToken();

        if (googleToken && googleToken.expires_at > Date.now()) {
          return googleToken.access_token;
        }
      }
    }
    /**
     * Return a Google oAuth token, triggering a sign in if required.   This method should not be called until we know
     * a token is required, that is until we've tried the url and received a 401, 403, or 404.
     *
     * @param url
     * @returns the oauth token
     */


    async function fetchGoogleAccessToken(url) {
      if (isInitialized()) {
        const scope = getScopeForURL(url);
        const googleToken = await getAccessToken(scope);
        return googleToken ? googleToken.access_token : undefined;
      } else {
        throw Error(`Authorization is required, but Google oAuth has not been initalized. Contact your site administrator for assistance.`);
      }
    }
    /**
     * Return the current google access token, if one exists.  Do not triger signOn or request additional scopes.
     * @returns {undefined|access_token}
     */


    function getCurrentGoogleAccessToken() {
      if (isInitialized()) {
        const googleToken = getCurrentAccessToken();
        return googleToken ? googleToken.access_token : undefined;
      } else {
        return undefined;
      }
    }

    function addOauthHeaders(headers, acToken) {
      if (acToken) {
        headers["Cache-Control"] = "no-cache";
        headers["Authorization"] = "Bearer " + acToken;
      }

      return headers;
    }

    function addApiKey(url) {
      let apiKey = igvxhr.apiKey;

      if (!apiKey && typeof gapi !== "undefined") {
        apiKey = gapi.apiKey;
      }

      if (apiKey !== undefined && !url.includes("key=")) {
        const paramSeparator = url.includes("?") ? "&" : "?";
        url = url + paramSeparator + "key=" + apiKey;
      }

      return url;
    }

    function addTeamDrive(url) {
      if (url.includes("supportsTeamDrive")) {
        return url;
      } else {
        const paramSeparator = url.includes("?") ? "&" : "?";
        url = url + paramSeparator + "supportsTeamDrive=true";
      }
    }
    /**
     * Perform some well-known url mappings.
     * @param url
     */


    function mapUrl(url) {
      if (url.includes("//www.dropbox.com")) {
        return url.replace("//www.dropbox.com", "//dl.dropboxusercontent.com");
      } else if (url.includes("//drive.google.com")) {
        return driveDownloadURL(url);
      } else if (url.includes("//www.broadinstitute.org/igvdata")) {
        return url.replace("//www.broadinstitute.org/igvdata", "//data.broadinstitute.org/igvdata");
      } else if (url.includes("//igvdata.broadinstitute.org")) {
        return url.replace("//igvdata.broadinstitute.org", "https://dn7ywbm9isq8j.cloudfront.net");
      } else if (url.startsWith("ftp://ftp.ncbi.nlm.nih.gov/geo")) {
        return url.replace("ftp://", "https://");
      } else {
        return url;
      }
    }

    function arrayBufferToString(arraybuffer, compression) {
      if (compression === UNKNOWN && arraybuffer.byteLength > 2) {
        const m = new Uint8Array(arraybuffer, 0, 2);

        if (m[0] === 31 && m[1] === 139) {
          compression = GZIP;
        }
      }

      let plain;

      if (compression === GZIP) {
        const inflate = new Zlib.Gunzip(new Uint8Array(arraybuffer));
        plain = inflate.decompress();
      } else if (compression === BGZF) {
        plain = unbgzf(arraybuffer);
      } else {
        plain = new Uint8Array(arraybuffer);
      }

      if ('TextDecoder' in getGlobalObject()) {
        return new TextDecoder().decode(plain);
      } else {
        return decodeUTF8(plain);
      }
    }
    /**
     * Use when TextDecoder is not available (primarily IE).
     *
     * From: https://gist.github.com/Yaffle/5458286
     *
     * @param octets
     * @returns {string}
     */


    function decodeUTF8(octets) {
      var string = "";
      var i = 0;

      while (i < octets.length) {
        var octet = octets[i];
        var bytesNeeded = 0;
        var codePoint = 0;

        if (octet <= 0x7F) {
          bytesNeeded = 0;
          codePoint = octet & 0xFF;
        } else if (octet <= 0xDF) {
          bytesNeeded = 1;
          codePoint = octet & 0x1F;
        } else if (octet <= 0xEF) {
          bytesNeeded = 2;
          codePoint = octet & 0x0F;
        } else if (octet <= 0xF4) {
          bytesNeeded = 3;
          codePoint = octet & 0x07;
        }

        if (octets.length - i - bytesNeeded > 0) {
          var k = 0;

          while (k < bytesNeeded) {
            octet = octets[i + k + 1];
            codePoint = codePoint << 6 | octet & 0x3F;
            k += 1;
          }
        } else {
          codePoint = 0xFFFD;
          bytesNeeded = octets.length - i;
        }

        string += String.fromCodePoint(codePoint);
        i += bytesNeeded + 1;
      }

      return string;
    }

    function getGlobalObject() {
      if (typeof self !== 'undefined') {
        return self;
      }

      if (typeof global !== 'undefined') {
        return global;
      } else {
        return window;
      }
    }

    async function getFilename(url) {
      if (isString(url) && url.startsWith("https://drive.google.com")) {
        // This will fail if Google API key is not defined
        if (getApiKey() === undefined) {
          throw Error("Google drive is referenced, but API key is not defined.  An API key is required for Google Drive access");
        }

        const json = await getDriveFileInfo(url);
        return json.originalFileName || json.name;
      } else {
        return getFilename$1(url);
      }
    }
    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2014 Broad Institute
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    /** An implementation of an interval tree, following the explanation.
     * from CLR.
     *
     * Public interface:
     *   Constructor  IntervalTree
     *   Insertion    insert
     *   Search       findOverlapping
     */


    var BLACK = 1;
    var NIL = {};
    NIL.color = BLACK;
    NIL.parent = NIL;
    NIL.left = NIL;
    NIL.right = NIL;
    const delimiters = new Set(['\t', ',']);

    class GenericDataSource {
      constructor(config) {
        this.columns = config.columns; // Required for now, could default to all columns

        this.columnDefs = config.columnDefs; // optional

        this.rowHandler = config.rowHandler; // optional

        this.delimiter = undefined;

        if (config.delimiter) {
          this.delimiter = config.delimiter;
        }

        if (config.data) {
          this.data = config.data; // Explcitly set table rows as array of json objects
        } else {
          this.url = config.url; // URL to data source -- required

          this.isJSON = config.isJSON || false; // optional, defaults to false (tab delimited)

          this.parser = config.parser; // optional

          this.filter = config.filter; // optional

          this.sort = config.sort; // optional
        }
      }

      async tableColumns() {
        return this.columns;
      }

      async tableData() {
        if (undefined === this.data) {
          let str = undefined;

          try {
            str = await igvxhr.loadString(this.url);
          } catch (e) {
            console.error(e);
            return undefined;
          }

          if (str) {
            let records;

            if (this.parser) {
              records = this.parser.parse(str);
            } else if (this.isJSON) {
              records = JSON.parse(str);

              if (typeof this.filter === 'function') {
                records = records.filter(this.filter);
              }
            } else {
              records = this.parseTabData(str, this.filter);
            }

            if (typeof this.sort === 'function') {
              records.sort(this.sort);
            } // this.data = records


            return records;
          }
        } else if (Array.isArray(this.data)) {
          return this.data;
        } else if ('json' === GenericDataSource.getExtension(this.data) || delimiters.has(getDelimiter(this.data, this.delimiter))) {
          const extension = GenericDataSource.getExtension(this.data);
          const delimiter = getDelimiter(this.data, this.delimiter);
          let result;

          try {
            result = 'json' === extension ? await igvxhr.loadJson(this.data) : await igvxhr.loadString(this.data);
          } catch (e) {
            console.error(e);
            return undefined;
          }

          if (result) {
            if ('json' === extension) {
              return result;
            } else if (delimiter) {
              switch (delimiter) {
                case '\t':
                  return this.parseTabData(result);

                case ',':
                  return parseCSV(result);
              }
            }
          }
        }

        return undefined;
      }

      parseTabData(str, filter) {
        const dataWrapper = getDataWrapper(str);
        const headerLine = dataWrapper.nextLine(); // Skip header

        const headers = headerLine.split('\t');
        const records = [];
        let line;

        while (line = dataWrapper.nextLine()) {
          const record = {};
          const tokens = line.split(`\t`);

          if (tokens.length !== headers.length) {
            throw Error("Number of values must equal number of headers in file " + this.url);
          }

          for (let i = 0; i < headers.length; i++) {
            record[headers[i]] = tokens[i];
          }

          if (undefined === filter || filter(record)) {
            records.push(record);
          }
        } // while(line)


        return records;
      }

      static getExtension(url) {
        const path = url instanceof File ? url.name : url; // Strip parameters (handles Dropbox URLs)

        let filename = path.toLowerCase();
        let index;
        index = filename.indexOf('?');

        if (index > 0) {
          filename = filename.substr(0, index);
        }

        index = filename.lastIndexOf(".");
        return index < 0 ? filename : filename.substr(1 + index);
      }

    }

    function getDelimiter(data, delimiter) {
      return delimiter || getDelimiterForExtension(GenericDataSource.getExtension(data));
    }

    function getDelimiterForExtension(extension) {
      switch (extension) {
        case 'tab':
          return '\t';

        case 'csv':
          return ',';

        default:
          return undefined;
      }
    }

    function parseCSV(str) {
      const list = str.split('\n');
      const keys = list.shift().split(',').map(key => key.trim());
      return list.map(line => {
        const keyValues = line.split(',').map((value, index) => [keys[index], value.trim()]);
        return Object.fromEntries(new Map(keyValues));
      });
    }

    class ModalTable {
      constructor(args) {
        this.datasource = args.datasource;
        this.okHandler = args.okHandler;
        this.pageLength = args.pageLength || 10;

        if (args.selectionStyle) {
          this.select = {
            style: args.selectionStyle
          };
        } else {
          this.select = true;
        }

        const id = args.id;
        const title = args.title || '';
        const parent = args.parent ? $(args.parent) : $('body');
        const html = `
        <div id="${id}" class="modal fade">
        
            <div class="modal-dialog modal-xl">
        
                <div class="modal-content">
        
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
        
                    <div class="modal-body">
        
                        <div id="${id}-spinner" class="spinner-border" style="display: none;">
                            <!-- spinner -->
                        </div>
        
                        <div id="${id}-datatable-container">
        
                        </div>
                        
                        <!-- description -->
                        <div>
                        </div>
                    </div>
        
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal">OK</button>
                    </div>
        
                </div>
        
            </div>
        
        </div>
    `;
        const $m = $(html);
        parent.append($m);
        this.$modal = $m;
        this.$datatableContainer = $m.find(`#${id}-datatable-container`);
        this.$spinner = $m.find(`#${id}-spinner`);
        const $okButton = $m.find('.modal-footer button:nth-child(2)');
        $m.on('shown.bs.modal', e => {
          this.buildTable();
        });
        $m.on('hidden.bs.modal', e => {
          $(e.relatedTarget).find('tr.selected').removeClass('selected');
        });
        $okButton.on('click', e => {
          const selected = this.getSelectedTableRowsData.call(this, this.$dataTable.$('tr.selected'));

          if (selected && this.okHandler) {
            this.okHandler(selected);
          }
        });
      }

      setTitle(title) {
        this.$modal.find('.modal-title').text(`${title}`);
      }

      setDescription(description) {
        this.$modal.find('.modal-body').children().last().html(`${description}`);
      }

      remove() {
        this.$modal.remove();
      }

      setDatasource(datasource) {
        this.datasource = datasource;
        this.$datatableContainer.empty();
        this.$table = undefined;
      }

      async buildTable() {
        if (!this.$table && this.datasource) {
          this.$table = $('<table class="display"></table>');
          this.$datatableContainer.append(this.$table);

          try {
            this.startSpinner();
            const tableData = await this.datasource.tableData();
            const tableColumns = await this.datasource.tableColumns();
            const columnDefs = this.datasource.columnDefs;
            const config = {
              data: tableData,
              columns: tableColumns.map(c => {
                if (columnDefs && columnDefs[c]) {
                  return Object.assign({}, columnDefs[c], {
                    data: c
                  });
                } else {
                  return {
                    title: c,
                    data: c
                  };
                }
              }),
              pageLength: this.pageLength,
              select: this.select,
              autoWidth: false,
              paging: true,
              scrollX: true,
              scrollY: '400px'
            }; // API object

            this.api = this.$table.DataTable(config); // Preserve sort order. For some reason it gets garbled by default
            // this.api.column( 0 ).data().sort().draw();
            // Adjust column widths

            this.api.columns.adjust().draw(); // jQuery object

            this.$dataTable = this.$table.dataTable();
            this.tableData = tableData;
          } catch (e) {} finally {
            this.stopSpinner();
          }
        }
      }

      getSelectedTableRowsData($rows) {
        const tableData = this.tableData;
        const result = [];

        if ($rows.length > 0) {
          $rows.removeClass('selected');
          const api = this.$table.api();
          $rows.each(function () {
            const index = api.row(this).index();
            result.push(tableData[index]);
          });

          if (typeof this.datasource.rowHandler === 'function') {
            const config = result.map(row => {
              const thang = this.datasource.rowHandler(row);
              const filteredKeys = Object.keys(row).filter(key => this.datasource.columns.includes(key));
              thang.metadata = {};

              for (let key of filteredKeys) {
                thang.metadata[key] = row[key];
              }

              return thang;
            });
            return config;
          } else {
            return result;
          }
        } else {
          return undefined;
        }
      }

      startSpinner() {
        if (this.$spinner) this.$spinner.show();
      }

      stopSpinner() {
        if (this.$spinner) this.$spinner.hide();
      }

    }
    /**
     * Factory function to create a configuration object for the EncodeTrackDatasource given a genomicId and type
     * @param genomeId
     * @param type - 'signals' | 'other
     * @returns {{genomeId: *, selectionHandler: (function(*): *|Uint8Array|BigInt64Array|{color, name, url}[]|Float64Array|Int8Array|Float32Array|Int32Array|Uint32Array|Uint8ClampedArray|BigUint64Array|Int16Array|Uint16Array), hiddenColumns: [string, string, string], addIndexColumn: boolean, parser: undefined, isJSON: boolean, urlPrefix: string, columns: string[], dataSetPath: undefined, titles: {AssayType: string, BioRep: string, OutputType: string, TechRep: string}, suffix: *, dataSetPathPrefix: string}}
     */


    function encodeTrackDatasourceConfigurator(genomeId, type) {
      const suffix = 'other' === type ? '.other.txt.gz' : 'signals' === type ? '.signals.txt.gz' : undefined;
      return {
        isJSON: false,
        url: `https://s3.amazonaws.com/igv.org.app/encode/${canonicalId(genomeId)}${suffix}`,
        sort: encodeSort,
        columns: [//'ID',           // hide
        //'Assembly',     // hide
        'Biosample', 'AssayType', 'Target', 'BioRep', 'TechRep', 'OutputType', 'Format', 'Lab', //'HREF',         // hide
        'Accession', 'Experiment'],
        columnDefs: {
          AssayType: {
            title: 'Assay Type'
          },
          OutputType: {
            title: 'Output Type'
          },
          BioRep: {
            title: 'Bio Rep'
          },
          TechRep: {
            title: 'Tech Rep'
          }
        },
        rowHandler: row => {
          const name = constructName(row);
          const url = `https://www.encodeproject.org${row['HREF']}`;
          const color = colorForTarget(row['Target']);
          return {
            name,
            url,
            color
          };
        }
      };
    }

    function supportsGenome(genomeId) {
      const knownGenomes = new Set(["ce10", "ce11", "dm3", "dm6", "GRCh38", "hg19", "mm9", "mm10"]);
      const id = canonicalId(genomeId);
      return knownGenomes.has(id);
    }

    function canonicalId(genomeId) {
      switch (genomeId) {
        case "hg38":
          return "GRCh38";

        case "CRCh37":
          return "hg19";

        case "GRCm38":
          return "mm10";

        case "NCBI37":
          return "mm9";

        case "WBcel235":
          return "ce11";

        case "WS220":
          return "ce10";

        default:
          return genomeId;
      }
    }

    function constructName(record) {
      let name = record["Biosample"] || "";

      if (record["Target"]) {
        name += " " + record["Target"];
      }

      if (record["AssayType"].toLowerCase() !== "chip-seq") {
        name += " " + record["AssayType"];
      }

      return name;
    }

    function encodeSort(a, b) {
      var aa1, aa2, cc1, cc2, tt1, tt2;
      aa1 = a['Assay Type'];
      aa2 = b['Assay Type'];
      cc1 = a['Biosample'];
      cc2 = b['Biosample'];
      tt1 = a['Target'];
      tt2 = b['Target'];

      if (aa1 === aa2) {
        if (cc1 === cc2) {
          if (tt1 === tt2) {
            return 0;
          } else if (tt1 < tt2) {
            return -1;
          } else {
            return 1;
          }
        } else if (cc1 < cc2) {
          return -1;
        } else {
          return 1;
        }
      } else {
        if (aa1 < aa2) {
          return -1;
        } else {
          return 1;
        }
      }
    }

    function colorForTarget(target) {
      const t = target.toLowerCase();

      if (t.startsWith("h3k4")) {
        return "rgb(0,150,0)";
      } else if (t.startsWith("h3k27")) {
        return "rgb(200,0,0)";
      } else if (t.startsWith("h3k36")) {
        return "rgb(0,0,150)";
      } else if (t.startsWith("h3k9")) {
        return "rgb(100,0,0)";
      } else if (t === "ctcf") {
        return "black";
      } else {
        return undefined;
      }
    }

    function createGenericSelectModal(id, select_id) {
      return `<div id="${id}" class="modal">

                <div class="modal-dialog modal-lg">
    
                    <div class="modal-content">
    
                        <div class="modal-header">
                            <div class="modal-title"></div>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
            
                        <div class="modal-body">
                            <div class="form-group">
                                <select id="${select_id}" class="form-control" multiple></select>
                            </div>
                            <div id="igv-widgets-generic-select-modal-footnotes"></div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal">OK</button>
                        </div>
    
                    </div>
    
                </div>

            </div>`;
    }

    const createTrackURLModal = id => {
      const html = `<div id="${id}" class="modal">

            <div class="modal-dialog modal-lg">
    
                <div class="modal-content">
    
                    <div class="modal-header">
                        <div class="modal-title">Track URL</div>
    
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
    
                    </div>
    
                    <div class="modal-body">
                    </div>
    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal">OK</button>
                    </div>
    
                </div>
    
            </div>

        </div>`;
      const fragment = document.createRange().createContextualFragment(html);
      return fragment.firstChild;
    };

    let fileLoadWidget$2;
    let multipleTrackFileLoad;
    let encodeModalTables = [];
    let customModalTable;
    let $genericSelectModal = undefined;
    const defaultCustomModalTableConfig = {
      // id: modalID,
      // title: 'ENCODE',
      selectionStyle: 'multi',
      pageLength: 100
    };

    function createTrackWidgetsWithTrackRegistry($igvMain, $dropdownMenu, $localFileInput, initializeDropbox, $dropboxButton, googleEnabled, $googleDriveButton, encodeTrackModalIds, urlModalId, selectModalIdOrUndefined, GtexUtilsOrUndefined, trackRegistryFile, trackLoadHandler) {
      const urlModal = createTrackURLModal(urlModalId);
      $igvMain.get(0).appendChild(urlModal);
      let fileLoadWidgetConfig = {
        widgetParent: urlModal.querySelector('.modal-body'),
        dataTitle: 'Track',
        indexTitle: 'Index',
        mode: 'url',
        fileLoadManager: new FileLoadManager(),
        dataOnly: false,
        doURL: true
      };
      fileLoadWidget$2 = new FileLoadWidget(fileLoadWidgetConfig);
      configureModal(fileLoadWidget$2, urlModal, async fileLoadWidget => {
        const paths = fileLoadWidget.retrievePaths();
        await multipleTrackFileLoad.loadPaths(paths);
        return true;
      });

      if (!googleEnabled) {
        $googleDriveButton.parent().hide();
      }

      const multipleTrackFileLoadConfig = {
        $localFileInput,
        initializeDropbox,
        $dropboxButton,
        $googleDriveButton: googleEnabled ? $googleDriveButton : undefined,
        fileLoadHandler: trackLoadHandler,
        multipleFileSelection: true
      };
      multipleTrackFileLoad = new MultipleTrackFileLoad(multipleTrackFileLoadConfig);

      for (let modalID of encodeTrackModalIds) {
        const encodeModalTableConfig = {
          id: modalID,
          title: 'ENCODE',
          selectionStyle: 'multi',
          pageLength: 100,
          okHandler: trackLoadHandler
        };
        encodeModalTables.push(new ModalTable(encodeModalTableConfig));
      }

      customModalTable = new ModalTable({
        id: 'igv-custom-modal',
        title: 'UNTITLED',
        okHandler: trackLoadHandler,
        ...defaultCustomModalTableConfig
      });

      if (selectModalIdOrUndefined) {
        $genericSelectModal = $(createGenericSelectModal(selectModalIdOrUndefined, `${selectModalIdOrUndefined}-select`));
        $igvMain.append($genericSelectModal);
        const $select = $genericSelectModal.find('select');
        const $dismiss = $genericSelectModal.find('.modal-footer button:nth-child(1)');
        $dismiss.on('click', () => $genericSelectModal.modal('hide'));
        const $ok = $genericSelectModal.find('.modal-footer button:nth-child(2)');

        const okHandler = () => {
          const configurations = [];
          const $selectedOptions = $select.find('option:selected');
          $selectedOptions.each(function () {
            //console.log(`You selected ${$(this).val()}`);
            configurations.push($(this).data('track'));
            $(this).removeAttr('selected');
          });

          if (configurations.length > 0) {
            trackLoadHandler(configurations);
          }

          $genericSelectModal.modal('hide');
        };

        $ok.on('click', okHandler);
        $genericSelectModal.get(0).addEventListener('keypress', event => {
          if ('Enter' === event.key) {
            okHandler();
          }
        });
      }
    }

    async function updateTrackMenus(genomeID, GtexUtilsOrUndefined, trackRegistryFile, $dropdownMenu) {
      const id_prefix = 'genome_specific_';
      const $divider = $dropdownMenu.find('.dropdown-divider');
      const searchString = '[id^=' + id_prefix + ']';
      const $found = $dropdownMenu.find(searchString);
      $found.remove();
      const paths = await getPathsWithTrackRegistryFile(genomeID, trackRegistryFile);

      if (undefined === paths) {
        console.warn(`There are no tracks in the track registryy for genome ${genomeID}`);
        return;
      }

      let responses = [];

      try {
        responses = await Promise.all(paths.map(path => fetch(path)));
      } catch (e) {
        AlertSingleton$1.present(e.message);
      }

      let jsons = [];

      try {
        jsons = await Promise.all(responses.map(response => response.json()));
      } catch (e) {
        AlertSingleton$1.present(e.message);
      }

      let buttonConfigurations = [];

      for (let json of jsons) {
        if (true === supportsGenome(genomeID) && 'ENCODE' === json.type) {
          encodeModalTables[0].setDatasource(new GenericDataSource(encodeTrackDatasourceConfigurator(genomeID, 'signals')));
          encodeModalTables[1].setDatasource(new GenericDataSource(encodeTrackDatasourceConfigurator(genomeID, 'other')));
        } else if (GtexUtilsOrUndefined && 'GTEX' === json.type) {
          let info = undefined;

          try {
            info = await GtexUtilsOrUndefined.getTissueInfo(json.datasetId);
          } catch (e) {
            AlertSingleton$1.present(e.message);
          }

          if (info) {
            json.tracks = info.tissueInfo.map(tissue => GtexUtilsOrUndefined.trackConfiguration(tissue));
          }
        }

        buttonConfigurations.push(json);
      } // for(jsons)


      for (let buttonConfiguration of buttonConfigurations.reverse()) {
        if (buttonConfiguration.type && 'custom-data-modal' === buttonConfiguration.type) {
          if (buttonConfiguration.description) {
            customModalTable.setDescription(buttonConfiguration.description);
          }

          createDropdownButton($divider, buttonConfiguration.label, id_prefix).on('click', () => {
            customModalTable.setDatasource(new GenericDataSource(buttonConfiguration));
            customModalTable.setTitle(buttonConfiguration.label);
            customModalTable.$modal.modal('show');
          });
        } else if (buttonConfiguration.type && 'ENCODE' === buttonConfiguration.type) {
          if (true === supportsGenome(genomeID)) {
            if (buttonConfiguration.description) {
              encodeModalTables[0].setDescription(buttonConfiguration.description);
              encodeModalTables[1].setDescription(buttonConfiguration.description);
            }

            createDropdownButton($divider, 'ENCODE Other', id_prefix).on('click', () => {
              encodeModalTables[1].$modal.modal('show');
            });
            createDropdownButton($divider, 'ENCODE Signals', id_prefix).on('click', () => {
              encodeModalTables[0].$modal.modal('show');
            });
          }
        } else if ($genericSelectModal) {
          createDropdownButton($divider, buttonConfiguration.label, id_prefix).on('click', () => {
            configureSelectModal($genericSelectModal, buttonConfiguration);
            $genericSelectModal.modal('show');
          });
        }
      } // for (buttonConfigurations)

    }

    function createDropdownButton($divider, buttonText, id_prefix) {
      const $button = $('<button>', {
        class: 'dropdown-item',
        type: 'button'
      });
      $button.text(`${buttonText} ...`);
      $button.attr('id', `${id_prefix}${buttonText.toLowerCase().split(' ').join('_')}`);
      $button.insertAfter($divider);
      return $button;
    }

    function configureSelectModal($genericSelectModal, buttonConfiguration) {
      $genericSelectModal.find('.modal-title').text(`${buttonConfiguration.label}`);
      let $select = $genericSelectModal.find('select');
      $select.empty();
      buttonConfiguration.tracks.reduce(($accumulator, configuration) => {
        const $option = $('<option>', {
          value: configuration.name,
          text: configuration.name
        });
        $select.append($option);
        $option.data('track', configuration);
        $accumulator.append($option);
        return $accumulator;
      }, $select);

      if (buttonConfiguration.description) {
        $genericSelectModal.find('#igv-widgets-generic-select-modal-footnotes').html(buttonConfiguration.description);
      }
    }

    async function getPathsWithTrackRegistryFile(genomeID, trackRegistryFile) {
      let response = undefined;

      try {
        response = await fetch(trackRegistryFile);
      } catch (e) {
        console.error(e);
      }

      let trackRegistry = undefined;

      if (response) {
        trackRegistry = await response.json();
      } else {
        const e = new Error("Error retrieving registry via getPathsWithTrackRegistryFile()");
        AlertSingleton$1.present(e.message);
        throw e;
      }

      return trackRegistry[genomeID];
    }

    const dropboxButtonImageLiteral = `<svg width="75px" height="64px" viewBox="0 0 75 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <title>Shape</title>
        <desc>Created with Sketch.</desc>
        <defs></defs>
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="dropbox" fill="#0061FF" fill-rule="nonzero">
                <path d="M37.6,12 L18.8,24 L37.6,36 L18.8,48 L1.42108547e-14,35.9 L18.8,23.9 L1.42108547e-14,12 L18.8,0 L37.6,12 Z M18.7,51.8 L37.5,39.8 L56.3,51.8 L37.5,63.8 L18.7,51.8 Z M37.6,35.9 L56.4,23.9 L37.6,12 L56.3,0 L75.1,12 L56.3,24 L75.1,36 L56.3,48 L37.6,35.9 Z" id="Shape"></path>
            </g>
        </g>
    </svg>`;
    const googleDriveImageLiteral = `<svg viewBox="0 0 139 120.4" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><radialGradient id="a" cx="-254.81979" cy="705.83588" gradientTransform="matrix(2.827 1.6322 -1.6322 2.827 2092.1199 -1494.5786)" gradientUnits="userSpaceOnUse" r="82.978401"><stop offset="0" stop-color="#4387fd"/><stop offset=".65" stop-color="#3078f0"/><stop offset=".9099" stop-color="#2b72ea"/><stop offset="1" stop-color="#286ee6"/></radialGradient><radialGradient id="b" cx="-254.8174" cy="705.83691" gradientTransform="matrix(2.827 1.6322 -1.6322 2.827 2092.1199 -1494.5786)" gradientUnits="userSpaceOnUse" r="82.973"><stop offset="0" stop-color="#ffd24d"/><stop offset="1" stop-color="#f6c338"/></radialGradient><path d="m24.2 120.4-24.2-41.9 45.3-78.5 24.2 41.9z" fill="#0da960"/><path d="m24.2 120.4 24.2-41.9h90.6l-24.2 41.9z" fill="url(#a)"/><path d="m139 78.5h-48.4l-45.3-78.5h48.4z" fill="url(#b)"/><path d="m69.5 78.5h-21.1l10.5-18.3-34.7 60.2z" fill="#2d6fdd"/><path d="m90.6 78.5h48.4l-58.9-18.3z" fill="#e5b93c"/><path d="m58.9 60.2 10.6-18.3-24.2-41.9z" fill="#0c9b57"/></svg>`;

    const dropboxButtonImageBase64 = () => window.btoa(dropboxButtonImageLiteral);

    const googleDriveButtonImageBase64 = () => window.btoa(googleDriveImageLiteral);

    const dropboxDropdownItem = id => {
      return `<div class="dropdown-item">
                <div id="${id}" class="igv-app-dropdown-item-cloud-storage">
                    <div>Dropbox File</div>
                    <div>
                        <img src="data:image/svg+xml;base64,${dropboxButtonImageBase64()}" width="18" height="18">
                    </div>
                </div>
            </div>`;
    };

    const googleDriveDropdownItem = id => {
      return `<div class="dropdown-item">
                <div id="${id}" class="igv-app-dropdown-item-cloud-storage">
                    <div>Google Drive File</div>
                    <div>
                        <img src="data:image/svg+xml;base64,${googleDriveButtonImageBase64()}" width="18" height="18">
                    </div>
                </div>
            </div>`;
    };

    function embedCSS() {
      var css = '.igv-widgets-alert-dialog-container {\n  box-sizing: content-box;\n  position: absolute;\n  z-index: 2048;\n  top: 50%;\n  left: 50%;\n  width: 400px;\n  height: 200px;\n  border-color: #7F7F7F;\n  border-radius: 4px;\n  border-style: solid;\n  border-width: thin;\n  outline: none;\n  font-family: \"Open Sans\", sans-serif;\n  font-size: 15px;\n  font-weight: 400;\n  background-color: white;\n  display: flex;\n  flex-flow: column;\n  flex-wrap: nowrap;\n  justify-content: space-between;\n  align-items: center; }\n  .igv-widgets-alert-dialog-container > div:first-child {\n    display: flex;\n    flex-flow: row;\n    flex-wrap: nowrap;\n    justify-content: flex-start;\n    align-items: center;\n    width: 100%;\n    height: 24px;\n    cursor: move;\n    border-top-left-radius: 4px;\n    border-top-right-radius: 4px;\n    border-bottom-color: #7F7F7F;\n    border-bottom-style: solid;\n    border-bottom-width: thin;\n    background-color: #eee; }\n    .igv-widgets-alert-dialog-container > div:first-child div:first-child {\n      padding-left: 8px; }\n  .igv-widgets-alert-dialog-container #igv-widgets-alert-dialog-body {\n    color: #373737;\n    width: 100%;\n    height: calc(100% - 24px - 64px);\n    overflow-y: scroll; }\n    .igv-widgets-alert-dialog-container #igv-widgets-alert-dialog-body #igv-widgets-alert-dialog-body-copy {\n      cursor: pointer;\n      margin: 16px;\n      width: auto;\n      height: auto;\n      overflow-wrap: break-word;\n      word-break: break-word;\n      background-color: white;\n      border: unset; }\n  .igv-widgets-alert-dialog-container > div:last-child {\n    width: 100%;\n    margin-bottom: 10px;\n    background-color: white;\n    display: flex;\n    flex-flow: row;\n    flex-wrap: nowrap;\n    justify-content: center;\n    align-items: center; }\n    .igv-widgets-alert-dialog-container > div:last-child div {\n      margin: unset;\n      width: 40px;\n      height: 30px;\n      line-height: 30px;\n      text-align: center;\n      color: white;\n      font-family: \"Open Sans\", sans-serif;\n      font-size: small;\n      font-weight: 400;\n      border-color: #2B81AF;\n      border-style: solid;\n      border-width: thin;\n      border-radius: 4px;\n      background-color: #2B81AF; }\n    .igv-widgets-alert-dialog-container > div:last-child div:hover {\n      cursor: pointer;\n      border-color: #25597f;\n      background-color: #25597f; }\n\n.igv-file-load-widget-container {\n  position: relative;\n  border-color: transparent;\n  width: 100%;\n  color: #7F7F7F;\n  font-family: \"Open Sans\", sans-serif;\n  font-size: 0.875rem;\n  font-weight: 200;\n  border-style: solid;\n  border-width: thin;\n  background-color: white;\n  display: flex;\n  flex-flow: column;\n  flex-wrap: nowrap;\n  justify-content: flex-start;\n  align-items: center; }\n  .igv-file-load-widget-container .igv-file-load-widget-header {\n    width: 100%;\n    height: 24px;\n    background-color: #bfbfbf;\n    display: flex;\n    flex-flow: row;\n    flex-wrap: nowrap;\n    justify-content: flex-end;\n    align-items: center; }\n    .igv-file-load-widget-container .igv-file-load-widget-header div {\n      height: 24px;\n      width: 16px;\n      margin-right: 6px;\n      text-align: center;\n      line-height: 24px;\n      color: #373737; }\n    .igv-file-load-widget-container .igv-file-load-widget-header div:hover {\n      cursor: pointer; }\n  .igv-file-load-widget-container .igv-flw-input-container {\n    width: 95%;\n    margin-top: 24px;\n    margin-bottom: 0;\n    display: flex;\n    flex-flow: column;\n    flex-wrap: nowrap;\n    justify-content: flex-start;\n    align-items: center; }\n    .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row {\n      height: 36px;\n      width: 100%;\n      margin-top: 8px;\n      padding-top: 4px;\n      padding-bottom: 4px;\n      display: flex;\n      flex-flow: row;\n      flex-wrap: nowrap;\n      justify-content: flex-start;\n      align-items: center;\n      border-color: white;\n      border-style: solid;\n      border-width: thin;\n      border-radius: calc(2 * 2px); }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-input-label {\n        color: #6c757c;\n        font-weight: 400;\n        width: 136px;\n        height: 36px;\n        line-height: 36px;\n        text-align: left; }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row input {\n        display: block;\n        height: 100%;\n        width: 100%;\n        padding-left: 4px;\n        color: #373737;\n        font-size: 0.875rem;\n        font-family: \"Open Sans\", sans-serif;\n        font-weight: 400;\n        text-align: left;\n        outline: none;\n        border-style: solid;\n        border-width: thin;\n        border-color: #dee2e6;\n        border-radius: .25rem;\n        background-color: white; }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row input {\n        height: calc(36px - 12px); }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-file-chooser-container {\n        display: flex;\n        flex-flow: row;\n        justify-content: center;\n        align-items: center;\n        width: 130px;\n        height: calc(36px - 8px);\n        border-color: #6c757c;\n        border-style: solid;\n        border-width: thin;\n        border-radius: calc(2 * 2px);\n        background-color: white; }\n        .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-file-chooser-container label {\n          display: block;\n          margin: unset; }\n        .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-file-chooser-container label.igv-flw-label-color {\n          color: #6c757c; }\n        .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-file-chooser-container label.igv-flw-label-color-hover {\n          cursor: pointer; }\n        .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-file-chooser-container input.igv-flw-file-chooser-input {\n          width: 0.1px;\n          height: 0.1px;\n          opacity: 0;\n          overflow: hidden;\n          position: absolute;\n          z-index: -1; }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-file-chooser-container:hover {\n        cursor: pointer;\n        background-color: #6c757c; }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-drag-drop-target {\n        cursor: default;\n        margin-left: 8px;\n        width: 120px;\n        height: calc(36px - 8px);\n        line-height: calc(36px - 8px);\n        text-align: center;\n        border-color: #7F7F7F;\n        border-style: dashed;\n        border-width: thin;\n        border-radius: calc(2 * 2px); }\n      .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row .igv-flw-local-file-name-container {\n        max-width: 400px;\n        height: 36px;\n        color: #373737;\n        line-height: 36px;\n        text-align: left;\n        font-weight: 400;\n        margin-left: 8px;\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis; }\n    .igv-file-load-widget-container .igv-flw-input-container .igv-flw-input-row-hover-state {\n      background-color: #efefef;\n      border-color: #7F7F7F; }\n  .igv-file-load-widget-container .igv-flw-error-message-container {\n    margin-top: 8px;\n    width: 95%;\n    height: 24px;\n    padding-left: 8px;\n    color: white;\n    font-size: 0.875rem;\n    background-color: rgba(59, 92, 127, 0.5);\n    display: flex;\n    flex-flow: row;\n    flex-wrap: nowrap;\n    justify-content: space-between;\n    align-items: center; }\n    .igv-file-load-widget-container .igv-flw-error-message-container div:first-child.igv-flw-error-message {\n      height: 24px;\n      width: 600px;\n      font-style: italic;\n      line-height: 24px;\n      text-align: left; }\n    .igv-file-load-widget-container .igv-flw-error-message-container div:last-child {\n      height: 24px;\n      width: 16px;\n      margin-right: 6px;\n      text-align: center;\n      line-height: 24px;\n      color: #373737; }\n    .igv-file-load-widget-container .igv-flw-error-message-container div:hover {\n      cursor: pointer; }\n  .igv-file-load-widget-container .igv-file-load-widget-ok-cancel {\n    width: 100%;\n    height: 28px;\n    margin-top: 32px;\n    color: white;\n    font-size: 0.875rem;\n    display: flex;\n    flex-flow: row;\n    flex-wrap: nowrap;\n    justify-content: flex-end;\n    align-items: center; }\n    .igv-file-load-widget-container .igv-file-load-widget-ok-cancel div {\n      width: 75px;\n      height: 28px;\n      line-height: 28px;\n      text-align: center;\n      border-color: transparent;\n      border-style: solid;\n      border-width: thin;\n      border-radius: 2px;\n      margin-right: 16px; }\n    .igv-file-load-widget-container .igv-file-load-widget-ok-cancel div:first-child {\n      margin-right: 22px;\n      background-color: #c4c4c4; }\n    .igv-file-load-widget-container .igv-file-load-widget-ok-cancel div:first-child:hover {\n      cursor: pointer;\n      background-color: #7f7f7f; }\n    .igv-file-load-widget-container .igv-file-load-widget-ok-cancel div:last-child {\n      background-color: #5ea4e0; }\n    .igv-file-load-widget-container .igv-file-load-widget-ok-cancel div:last-child:hover {\n      cursor: pointer;\n      background-color: #3b5c7f; }\n\n/*# sourceMappingURL=igv-widgets.css.map */\n';
      var style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.innerHTML = css;
      document.head.insertBefore(style, document.head.childNodes[document.head.childNodes.length - 1]);
    }

    if (typeof document !== 'undefined') {
      if (!stylesheetExists("igv-widgets.css")) {
        //console.log('igv-widgets. will call embedCSS(igv-widgets.css) ...');
        embedCSS(); //console.log('... done.');
      }

      function stylesheetExists(stylesheetName) {
        for (let ss of document.styleSheets) {
          ss = ss.href ? ss.href.replace(/^.*[\\\/]/, '') : '';

          if (ss === stylesheetName) {
            return true;
          }
        }

        return false;
      }
    }

    const Globals = {};

    /*
     * The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     * Author: Jim Robinson
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    let fileLoadWidget;

    function createGenomeWidgets(_ref) {
      let {
        $igvMain,
        urlModalId,
        genomeFileLoad
      } = _ref;
      const $urlModal = $(createURLModal(urlModalId, 'Genome URL'));
      $igvMain.append($urlModal);
      let config = {
        widgetParent: $urlModal.find('.modal-body').get(0),
        dataTitle: 'Genome',
        indexTitle: 'Index',
        mode: 'url',
        fileLoadManager: new FileLoadManager(),
        dataOnly: false,
        doURL: true
      };
      fileLoadWidget = new FileLoadWidget(config);
      utils.configureModal(fileLoadWidget, $urlModal.get(0), async fileLoadWidget => {
        try {
          await genomeFileLoad.loadPaths(fileLoadWidget.retrievePaths());
        } catch (e) {
          console.error(e);
          AlertSingleton$1.present(e);
        }
      });
    }

    async function initializeGenomeWidgets(browser, genomes, $dropdown_menu) {
      try {
        const genomeMap = await getAppLaunchGenomes(genomes);

        if (genomeMap) {
          genomeDropdownLayout({
            browser,
            genomeMap,
            $dropdown_menu
          });
        }
      } catch (e) {
        AlertSingleton$1.present(e.message);
      }
    }

    async function getAppLaunchGenomes(genomes) {
      if (undefined === genomes) {
        return undefined;
      }

      if (Array.isArray(genomes)) {
        return buildMap(genomes);
      } else {
        let response = undefined;

        try {
          response = await fetch(genomes);
        } catch (e) {
          AlertSingleton$1.present(e.message);
        }

        if (response) {
          let json = await response.json();
          return buildMap(json);
        }
      }
    }

    function buildMap(arrayOrJson) {
      const map = new Map();

      if (true === Array.isArray(arrayOrJson)) {
        for (let json of arrayOrJson.reverse()) {
          map.set(json.id, json);
        }
      } else {
        map.set(arrayOrJson.id, arrayOrJson);
      }

      return map;
    }

    function genomeDropdownLayout(_ref2) {
      let {
        browser,
        genomeMap,
        $dropdown_menu
      } = _ref2;
      // discard all buttons preceeding the divider div
      let $divider = $dropdown_menu.find('.dropdown-divider');
      $divider.nextAll().remove();

      for (let [key, value] of genomeMap) {
        const $button = createButton(value.name);
        $button.insertAfter($divider);
        $button.data('id', key);
        const str = `click.genome-dropdown.${key}`;
        $button.on(str, async () => {
          const id = $button.data('id');

          if (id !== browser.genome.id) {
            await loadGenome(value);
          }
        });
      } // for (...)


      function createButton(title) {
        let $button = $('<button>', {
          class: 'dropdown-item',
          type: 'button'
        });
        $button.text(title);
        return $button;
      }
    }

    async function loadGenome(genomeConfiguration) {
      let g = undefined;

      try {
        g = await Globals.browser.loadGenome(genomeConfiguration);

        if (g.id) {
          try {
            localStorage.setItem("genomeID", g.id);
          } catch (e) {
            console.error(e);
          }
        }
      } catch (e) {
        console.error(e);
        AlertSingleton$1.present(e);
      }

      if (g) {
        EventBus.globalBus.post({
          type: "DidChangeGenome",
          data: g.id
        });
      }
    }

    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */

    function bitlyShortener(accessToken) {
      if (!accessToken || accessToken === "BITLY_TOKEN") {
        return undefined;
      } else {
        return async function (url) {
          const api = "https://api-ssl.bitly.com/v3/shorten";
          const devIP = "192.168.1.11";

          if (url.startsWith("http://localhost")) {
            url = url.replace("localhost", devIP);
          } // Dev hack


          let endpoint = api + "?access_token=" + accessToken + "&longUrl=" + encodeURIComponent(url);
          return igvxhr$2.loadJson(endpoint, {}).then(function (json) {
            return json.data.url;
          });
        };
      }
    }

    function googleShortener(apiKey) {
      if (!apiKey || apiKey === "API_KEY") {
        return undefined;
      } else {
        return async function (url) {
          const api = "https://www.googleapis.com/urlshortener/v1/url";
          const endpoint = api + "?key=" + apiKey;
          return igvxhr$2.loadJson(endpoint, {
            sendData: JSON.stringify({
              "longUrl": url
            }),
            contentType: "application/json"
          }).then(function (json) {
            return json.id;
          });
        };
      }
    }

    function tinyURLShortener(_ref) {
      let {
        endpoint
      } = _ref;
      endpoint = endpoint || "https://2et6uxfezb.execute-api.us-east-1.amazonaws.com/dev/tinyurl/";
      return async function (url) {
        const enc = encodeURIComponent(url);
        const response = await fetch(`${endpoint}${enc}`);

        if (response.ok) {
          return response.text();
        } else {
          throw new Error(response.statusText);
        }
      };
    }

    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */
    let urlShortener;
    function setURLShortener(obj) {
      let fn;

      if (typeof obj === "function") {
        fn = obj;
      } else if (obj.provider) {
        if ("tinyURL" === obj.provider) {
          fn = tinyURLShortener(obj);
        } else if ("bitly" === obj.provider && obj.apiKey) {
          fn = bitlyShortener(obj.apiKey);
        } else if ("google" === obj.provider && obj.apiKey) {
          fn = googleShortener(obj.apiKey);
        } else {
          AlertSingleton$1.present(new Error(`Unknown URL shortener provider: ${obj.provider}`));
        }
      } else {
        AlertSingleton$1.present(new Error('URL shortener object must either be an object specifying a provider and apiKey, or a function'));
      }

      if (fn) {
        urlShortener = {
          shortenURL: fn
        };
      }

      return fn;
    }
    function sessionURL() {
      let surl, path, idx;
      path = window.location.href.slice();
      idx = path.indexOf("?");
      surl = (idx > 0 ? path.substring(0, idx) : path) + "?sessionURL=blob:" + Globals.browser.compressedSession();
      return surl;
    }
    function shortSessionURL(base, session) {
      const url = base + "?sessionURL=blob:" + session;
      return shortenURL(url);
    }

    function shortenURL(url) {
      if (urlShortener) {
        return urlShortener.shortenURL(url);
      } else {
        return Promise.resolve(url);
      }
    }

    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */

    function createShareWidgets(_ref) {
      let {
        browser,
        container,
        modal,
        share_input,
        copy_link_button,
        tweet_button_container,
        email_button,
        qrcode_button,
        qrcode_image,
        embed_container,
        embed_button,
        embedTarget
      } = _ref;

      if (undefined === embedTarget) {
        embedTarget = `https://igv.org/web/release/${igv.version()}/embed.html`;
      }

      $(modal).on('shown.bs.modal', async () => {
        let href = window.location.href.slice();
        const idx = href.indexOf("?");

        if (idx > 0) {
          href = href.substring(0, idx);
        }

        let session = undefined;

        try {
          session = browser.compressedSession();
        } catch (e) {
          AlertSingleton$1.present(e.message);
        }

        if (session) {
          if (embedTarget) {
            const snippet = getEmbeddableSnippet(container, embedTarget, session);
            const textArea = embed_container.querySelector('textarea');
            textArea.value = snippet;
            textArea.select();
          }

          const shortURL = await shortSessionURL(href, session);
          share_input.value = shortURL;
          share_input.select();
          email_button.setAttribute('href', `mailto:?body=${shortURL}`);
          qrcode_image.innerHTML = '';
          const qrcode = new QRCode(qrcode_image, {
            width: 128,
            height: 128,
            correctLevel: QRCode.CorrectLevel.H
          });
          qrcode.makeCode(shortURL);

          if (tweet_button_container) {
            tweet_button_container.innerHTML = '';
            window.twttr.widgets.createShareButton(shortURL, tweet_button_container, {
              text: ''
            });
          }
        } else {
          $(modal).modal('hide');
        }
      });
      $(modal).on('hidden.bs.modal', () => {
        embed_container.style.display = 'none';
        qrcode_image.style.display = 'none';
      });
      copy_link_button.addEventListener('click', () => {
        share_input.select();
        const success = document.execCommand('copy');

        if (success) {
          $(modal).modal('hide');
        } else {
          console.error('fail!');
        }
      });

      if (undefined === embedTarget) {
        embed_button.style.display = 'none';
      } else {
        const button = embed_container.querySelector('button');
        button.addEventListener('click', () => {
          const textArea = embed_container.querySelector('textarea');
          textArea.select();
          const success = document.execCommand('copy');

          if (success) {
            $(modal).modal('hide');
          } else {
            console.error('fail!');
          }
        });
        embed_button.addEventListener('click', () => {
          qrcode_image.style.display = 'none';

          if ('block' === embed_container.style.display) {
            embed_container.style.display = 'none';
          } else {
            embed_container.style.display = 'block';
          }
        });
      }

      qrcode_button.addEventListener('click', () => {
        embed_container.style.display = 'none';

        if ('block' === qrcode_image.style.display) {
          qrcode_image.style.display = 'none';
        } else {
          qrcode_image.style.display = 'block';
        }
      });
    }

    function getEmbeddableSnippet(container, embedTarget, session) {
      const embedUrl = `${embedTarget}?sessionURL=blob:${session}`;
      const height = container.clientHeight + 50;
      return '<iframe src="' + embedUrl + '" style="width:100%; height:' + height + 'px"  allowfullscreen></iframe>';
    }

    function shareWidgetConfigurator(browser, container, _ref2) {
      let {
        urlShortener,
        embedTarget
      } = _ref2;
      let urlShortenerFn;

      if (urlShortener) {
        urlShortenerFn = setURLShortener(urlShortener) !== undefined;
      }

      let igv_app_tweet_button_container = document.getElementById('igv-app-tweet-button-container');

      if (!urlShortenerFn) {
        igv_app_tweet_button_container.style.display = 'none';
      }

      return {
        browser,
        container,
        modal: document.getElementById('igv-app-share-modal'),
        share_input: document.getElementById('igv-app-share-input'),
        copy_link_button: document.getElementById('igv-app-copy-link-button'),
        tweet_button_container: urlShortenerFn ? igv_app_tweet_button_container : undefined,
        email_button: document.getElementById('igv-app-email-button'),
        qrcode_button: document.getElementById('igv-app-qrcode-button'),
        qrcode_image: document.getElementById('igv-app-qrcode-image'),
        embed_container: document.getElementById('igv-app-embed-container'),
        embed_button: document.getElementById('igv-app-embed-button'),
        embedTarget
      };
    }

    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */
    function createSVGWidget(_ref) {
      let {
        browser,
        saveModal
      } = _ref;
      const input_default_value = 'igv-app.svg';
      const input = saveModal.querySelector('input');
      $(saveModal).on('show.bs.modal', () => input.value = input_default_value);
      $(saveModal).on('hidden.bs.modal', () => input.value = input_default_value);

      const okHandler = () => {
        let filename = input.value;

        if (undefined === filename || '' === filename) {
          filename = input.getAttribute('placeholder');
        } else if (!filename.endsWith(".svg")) {
          filename = filename + '.svg';
        } // dismiss modal


        $(saveModal).modal('hide');
        browser.saveSVGtoFile({
          filename
        });
      }; // ok - button


      const ok = saveModal.querySelector('.modal-footer button:nth-child(2)');
      ok.addEventListener('click', okHandler);
      input.addEventListener('keyup', e => {
        if (13 === e.keyCode) {
          okHandler();
        }
      }); // upper dismiss - x - button

      let dismiss = saveModal.querySelector('.modal-header button');
      dismiss.addEventListener('click', () => $(saveModal).modal('hide')); // lower dismiss - close - button

      dismiss = saveModal.querySelector('.modal-footer button:nth-child(1)');
      dismiss.addEventListener('click', () => $(saveModal).modal('hide'));
    }

    const GtexUtils = {
      getTissueInfo: function (datasetId, baseURL) {
        datasetId = datasetId || 'gtex_v8';
        baseURL = baseURL || 'https://gtexportal.org/rest/v1';
        let url = baseURL + '/dataset/tissueInfo?datasetId=' + datasetId;
        return igvxhr$2.loadJson(url, {});
      },
      //https://gtexportal.org/rest/v1/association/singleTissueEqtlByLocation?chromosome=7&start=98358766&end=101523798&tissueName=Liver&datasetId=gtex_v7
      //https://gtexportal.org/rest/v1/association/singleTissueEqtlByLocation?chromosome=7&start=98358766&end=101523798&tissueSiteDetailId=Liver&datasetId=gtex_v8
      trackConfiguration: function (tissueSummary, baseURL) {
        baseURL = baseURL || 'https://gtexportal.org/rest/v1';
        return {
          type: "eqtl",
          sourceType: "gtex-ws",
          url: baseURL + '/association/singleTissueEqtlByLocation',
          tissueSiteDetailId: tissueSummary.tissueSiteDetailId,
          name: tissueSummary.tissueSiteDetailId.split('_').join(' '),
          visibilityWindow: 250000
        };
      }
    };

    const _version = "1.11.0";

    function version() {
      return _version;
    }

    function createCircularViewResizeModal(id, title) {
      const str = 'igv-app-circular-view-resize-modal';
      const html = `<div id="${id}" class="modal">

            <div class="modal-dialog modal-sm">
    
                <div class="modal-content">
    
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
    
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
    
                    </div>
    
                    <div class="modal-body">
                          <div class="form-group">
                            <input id="${str}-input" type="text" class="form-control">
                          </div>
                    </div>
        
                </div>
    
            </div>

        </div>`;
      const fragment = document.createRange().createContextualFragment(html);
      return fragment.firstChild;
    }

    /*
     *  The MIT License (MIT)
     *
     * Copyright (c) 2016-2017 The Regents of the University of California
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
     * associated documentation files (the "Software"), to deal in the Software without restriction, including
     * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
     * following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial
     * portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
     * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
     * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *
     */
    document.addEventListener("DOMContentLoaded", async event => await main(document.getElementById('igv-app-container'), igvwebConfig));
    let dropboxEnabled = false;
    let googleEnabled = false;
    let currentGenomeId;

    async function main(container, config) {
      AlertSingleton$1.init(container);
      $('#igv-app-version').text(`IGV-Web app version ${version()}`);
      $('#igv-igvjs-version').text(`igv.js version ${igv.version()}`);

      if (config.enableCircularView) {
        await initializeCircularView();
      }

      const enableGoogle = (config.clientId || config.apiKey) && (window.location.protocol === "https:" || window.location.host.startsWith("localhost"));

      if (enableGoogle) {
        try {
          await init$1({
            client_id: config.clientId,
            apiKey: config.apiKey,
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
          });
          googleEnabled = true;
        } catch (e) {
          const str = `Error initializing Google Drive: ${e.message || e.details}`;
          console.error(str); //AlertSingleton.present(str)
        }

        const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

        if (true === isSignedIn) {
          const user = gapi.auth2.getAuthInstance().currentUser.get();
          queryGoogleAuthenticationStatus(user, isSignedIn);
        }

        gapi.auth2.getAuthInstance().isSignedIn.listen(status => {
          const user = gapi.auth2.getAuthInstance().currentUser.get();
          queryGoogleAuthenticationStatus(user, status);
        });
      } // Load genomes for use by igv.js and webapp


      if (config.genomes) {
        config.genomes = await getGenomesArray(config.genomes);
        config.igvConfig.genomes = config.genomes;
      }

      const igvConfig = config.igvConfig;

      if (config.restoreLastGenome) {
        try {
          const lastGenomeId = localStorage.getItem("genomeID");

          if (lastGenomeId && lastGenomeId !== igvConfig.genome && config.genomes.find(elem => elem.id === lastGenomeId)) {
            igvConfig.genome = lastGenomeId;
            igvConfig.tracks = [];
          }
        } catch (e) {
          console.error(e);
        }
      }

      const browser = await igv.createBrowser(container, igvConfig);

      if (browser) {
        Globals.browser = browser;
        await initializationHelper(browser, container, config);
      }
    }

    async function initializationHelper(browser, container, options) {
      if (true === googleEnabled) {
        const toggle = document.querySelector('#igv-google-drive-dropdown-toggle');
        const button = document.querySelector('#igv-google-drive-sign-out-button');
        button.addEventListener('click', async () => {
          await signOut();
          toggle.style.display = 'none';
        });
      }

      ['track', 'genome'].forEach(str => {
        let imgElement;
        imgElement = document.querySelector(`img#igv-app-${str}-dropbox-button-image`);

        if (options.dropboxAPIKey) {
          imgElement.src = `data:image/svg+xml;base64,${dropboxButtonImageBase64()}`;
        } else {
          imgElement = document.querySelector(`#igv-app-dropdown-dropbox-${str}-file-button`);
          imgElement.parentElement.style.display = 'none';
        }

        imgElement = document.querySelector(`img#igv-app-${str}-google-drive-button-image`);
        imgElement.src = `data:image/svg+xml;base64,${googleDriveButtonImageBase64()}`;
      });

      if (options.dropboxAPIKey) {
        $('div#igv-session-dropdown-menu > :nth-child(1)').after(dropboxDropdownItem('igv-app-dropdown-dropbox-session-file-button'));
      }

      $('div#igv-session-dropdown-menu > :nth-child(2)').after(googleDriveDropdownItem('igv-app-dropdown-google-drive-session-file-button'));
      const $igvMain = $('#igv-main');
      const genomeFileLoadConfig = {
        localFileInput: document.getElementById('igv-app-dropdown-local-genome-file-input'),
        initializeDropbox,
        dropboxButton: options.dropboxAPIKey ? document.getElementById('igv-app-dropdown-dropbox-genome-file-button') : undefined,
        googleEnabled,
        googleDriveButton: document.getElementById('igv-app-dropdown-google-drive-genome-file-button'),
        loadHandler: async configuration => {
          if (configuration.id !== browser.genome.id) {
            await loadGenome(configuration);
          }
        },
        igvxhr: igvxhr$2
      };
      createGenomeWidgets({
        $igvMain,
        urlModalId: 'igv-app-genome-from-url-modal',
        genomeFileLoad: new GenomeFileLoad(genomeFileLoadConfig)
      });
      await initializeGenomeWidgets(browser, options.genomes, $('#igv-app-genome-dropdown-menu'));

      const trackLoader = async configurations => {
        try {
          await browser.loadTrackList(configurations);
        } catch (e) {
          console.error(e);
          AlertSingleton$1.present(e);
        }
      };

      createTrackWidgetsWithTrackRegistry($igvMain, $('#igv-app-track-dropdown-menu'), $('#igv-app-dropdown-local-track-file-input'), initializeDropbox, options.dropboxAPIKey ? $('#igv-app-dropdown-dropbox-track-file-button') : undefined, googleEnabled, $('#igv-app-dropdown-google-drive-track-file-button'), ['igv-app-encode-signal-modal', 'igv-app-encode-others-modal'], 'igv-app-track-from-url-modal', 'igv-app-track-select-modal', GtexUtils, options.trackRegistryFile, trackLoader);

      const sessionSaver = () => {
        try {
          return browser.toJSON();
        } catch (e) {
          console.error(e);
          AlertSingleton$1.present(e);
          return undefined;
        }
      };

      const sessionLoader = async config => {
        try {
          await browser.loadSession(config);
        } catch (e) {
          console.error(e);
          AlertSingleton$1.present(e);
        }
      };

      createSessionWidgets($igvMain, 'igv-webapp', 'igv-app-dropdown-local-session-file-input', initializeDropbox, options.dropboxAPIKey ? 'igv-app-dropdown-dropbox-session-file-button' : undefined, 'igv-app-dropdown-google-drive-session-file-button', 'igv-app-session-url-modal', 'igv-app-session-save-modal', googleEnabled, sessionLoader, sessionSaver);

      if (options.sessionRegistryFile) {
        await createSessionMenu('igv-session-list-divider', options.sessionRegistryFile, sessionLoader);
      } else {
        document.querySelector('#igv-session-list-divider').style.display = 'none';
      }

      createSVGWidget({
        browser,
        saveModal: document.getElementById('igv-app-svg-save-modal')
      });
      createShareWidgets(shareWidgetConfigurator(browser, container, options));
      createAppBookmarkHandler($('#igv-app-bookmark-button'));

      const genomeChangeListener = async event => {
        const {
          data: genomeID
        } = event;

        if (currentGenomeId !== genomeID) {
          currentGenomeId = genomeID;
          await updateTrackMenus(genomeID, undefined, options.trackRegistryFile, $('#igv-app-track-dropdown-menu'));
        }
      };

      if (true === options.enableCircularView) {
        const {
          x: minX,
          y: minY
        } = document.querySelector('#igv-main').getBoundingClientRect();
        const circularViewContainer = document.getElementById('igv-circular-view-container');
        browser.createCircularView(circularViewContainer, false);
        makeDraggable$1(circularViewContainer, browser.circularView.toolbar, {
          minX,
          minY
        });
        browser.circularView.setSize(512);
        document.getElementById('igv-app-circular-view-nav-item').style.display = 'block';
        const dropdownButton = document.getElementById('igv-app-circular-view-dropdown-button');
        dropdownButton.addEventListener('click', e => {
          document.getElementById('igv-app-circular-view-presentation-button').innerText = browser.circularViewVisible ? 'Hide' : 'Show';

          if (browser.circularViewVisible) {
            document.getElementById('igv-app-circular-view-resize-button').removeAttribute('disabled');
            document.getElementById('igv-app-circular-view-clear-chords-button').removeAttribute('disabled');
          } else {
            document.getElementById('igv-app-circular-view-resize-button').setAttribute('disabled', '');
            document.getElementById('igv-app-circular-view-clear-chords-button').setAttribute('disabled', '');
          }
        });
        document.getElementById('igv-app-circular-view-presentation-button').addEventListener('click', e => {
          browser.circularViewVisible = !browser.circularViewVisible;
          const str = e.target.innerText;
          e.target.innerText = 'Show' === str ? 'Hide' : 'Show';
        });
        document.getElementById('igv-app-circular-view-clear-chords-button').addEventListener('click', () => browser.circularView.clearChords());
        document.getElementById('igv-main').appendChild(createCircularViewResizeModal('igv-app-circular-view-resize-modal', 'Resize Circular View'));
        document.getElementById('igv-app-circular-view-resize-modal-input').addEventListener('keyup', event => {
          event.preventDefault();
          event.stopPropagation();

          if (13 === event.keyCode) {
            browser.circularView.setSize(Number.parseInt(event.target.value));
          }
        });
        $('#igv-app-circular-view-resize-modal').on('shown.bs.modal', () => document.getElementById('igv-app-circular-view-resize-modal-input').value = circularViewContainer.clientWidth.toString());
      }

      EventBus.globalBus.subscribe("DidChangeGenome", genomeChangeListener);
      EventBus.globalBus.post({
        type: "DidChangeGenome",
        data: browser.genome.id
      });
    }

    function queryGoogleAuthenticationStatus(user, isSignedIn) {
      if (true === isSignedIn) {
        const profile = user.getBasicProfile();
        const emailAddress = profile.getEmail();
        const toggle = document.querySelector('#igv-google-drive-dropdown-toggle');
        toggle.style.display = 'block';
        const button = document.querySelector('#igv-google-drive-sign-out-button');
        button.innerHTML = `Sign Out ${emailAddress}`;
      }
    }

    async function createSessionMenu(sessionListDivider, sessionRegistryFile, sessionLoader) {
      let response = undefined;

      try {
        response = await fetch(sessionRegistryFile);
      } catch (e) {
        console.error(e);
      }

      let sessionJSON = undefined;

      if (response) {
        sessionJSON = await response.json();
      } else {
        const e = new Error("Error retrieving session registry");
        AlertSingleton$1.present(e.message);
        throw e;
      }

      const id_prefix = 'session_file';
      const searchString = `[id^=${id_prefix}]`;
      const elements = document.querySelectorAll(searchString);

      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          elements[i].remove();
        }
      }

      if (sessionJSON) {
        const sessions = sessionJSON['sessions'];

        for (let {
          name,
          url
        } of sessions.reverse()) {
          const referenceNode = document.getElementById(sessionListDivider);
          const button_id = `${id_prefix}_${guid$1()}`;
          const html = `<button id="${button_id}" class="dropdown-item" type="button">${name}</button>`;
          const fragment = document.createRange().createContextualFragment(html);
          referenceNode.after(fragment.firstChild);
          const button = document.getElementById(button_id);
          button.addEventListener('click', () => {
            const config = {};
            const key = true === isFilePath$1(url) ? 'file' : 'url';
            config[key] = url;
            sessionLoader(config);
          });
        }
      }
    }

    function createAppBookmarkHandler($bookmark_button) {
      $bookmark_button.on('click', e => {
        let url = undefined;

        try {
          url = sessionURL();
        } catch (e) {
          AlertSingleton$1.present(e.message);
        }

        if (url) {
          window.history.pushState({}, "IGV", url);
          const str = /Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl';
          const blurb = 'A bookmark URL has been created. Press ' + str + '+D to save.';
          alert(blurb);
        }
      });
    }

    async function getGenomesArray(genomes) {
      if (undefined === genomes) {
        return undefined;
      }

      if (Array.isArray(genomes)) {
        return genomes;
      } else {
        let response = undefined;

        try {
          response = await fetch(genomes);
          return response.json();
        } catch (e) {
          AlertSingleton$1.present(e.message);
        }
      }
    }

    let didCompleteOneAttempt = false;

    async function initializeDropbox() {
      if (true === didCompleteOneAttempt && false === dropboxEnabled) {
        return Promise.resolve(false);
      } else if (true === dropboxEnabled) {
        return Promise.resolve(true);
      } else {
        return new Promise((resolve, reject) => {
          didCompleteOneAttempt = true;
          const dropbox = document.createElement('script'); // dropbox.setAttribute('src', 'http://localhost:9999');

          dropbox.setAttribute('src', 'https://www.dropbox.com/static/api/2/dropins.js');
          dropbox.setAttribute('id', 'dropboxjs');
          dropbox.dataset.appKey = igvwebConfig.dropboxAPIKey;
          dropbox.setAttribute('type', "text/javascript");
          document.head.appendChild(dropbox);
          dropbox.addEventListener('load', () => {
            dropboxEnabled = true;
            resolve(true);
          });
        });
      }
    }

    async function initializeCircularView() {
      return new Promise((resolve, reject) => {
        const react = document.createElement('script');
        react.setAttribute('src', 'https://unpkg.com/react@16/umd/react.production.min.js');
        const reactDom = document.createElement('script');
        reactDom.setAttribute('src', 'https://unpkg.com/react-dom@16/umd/react-dom.production.min.js');
        const circView = document.createElement('script');
        circView.setAttribute('src', 'https://unpkg.com/@jbrowse/react-circular-genome-view@1.6.9/dist/react-circular-genome-view.umd.production.min.js');
        react.addEventListener('load', () => {
          document.head.appendChild(reactDom);
        });
        reactDom.addEventListener('load', () => {
          document.head.appendChild(circView);
        });
        circView.addEventListener('load', () => {
          resolve(true);
        });
        document.head.appendChild(react);
      });
    }

    exports.main = main;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
