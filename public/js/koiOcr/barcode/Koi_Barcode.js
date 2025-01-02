var CreateKoder = (() => {
  var _scriptDir =
    typeof document !== "undefined" && document.currentScript
      ? document.currentScript.src
      : undefined;
  if (typeof __filename !== "undefined") _scriptDir = _scriptDir || __filename;
  return function (CreateKoder) {
    CreateKoder = CreateKoder || {};

    var c;
    c || (c = typeof CreateKoder !== "undefined" ? CreateKoder : {});
    var aa = Object.assign,
      ba,
      k;
    c.ready = new Promise(function (a, b) {
      ba = a;
      k = b;
    });
    var ca = aa({}, c),
      u = [],
      v = "./this.program",
      w = (a, b) => {
        throw b;
      },
      da = "object" === typeof window,
      x = "function" === typeof importScripts,
      ea =
        "object" === typeof process &&
        "object" === typeof process.versions &&
        "string" === typeof process.versions.node,
      y = "",
      fa,
      z,
      A,
      fs,
      C,
      ha;
    if (ea)
      (y = x ? require("path").dirname(y) + "/" : __dirname + "/"),
        (ha = function () {
          C || ((fs = require("fs")), (C = require("path")));
        }),
        (fa = function (a, b) {
          ha();
          a = C.normalize(a);
          return fs.readFileSync(a, b ? null : "utf8");
        }),
        (A = function (a) {
          a = fa(a, !0);
          a.buffer || (a = new Uint8Array(a));
          return a;
        }),
        (z = function (a, b, d) {
          ha();
          a = C.normalize(a);
          fs.readFile(a, function (f, h) {
            f ? d(f) : b(h.buffer);
          });
        }),
        1 < process.argv.length && (v = process.argv[1].replace(/\\/g, "/")),
        (u = process.argv.slice(2)),
        process.on("uncaughtException", function (a) {
          if (!(a instanceof D)) throw a;
        }),
        process.on("unhandledRejection", function (a) {
          throw a;
        }),
        (w = (a, b) => {
          if (noExitRuntime || 0 < ia) throw ((process.exitCode = a), b);
          b instanceof D || E("exiting due to exception: " + b);
          process.exit(a);
        }),
        (c.inspect = function () {
          return "[Emscripten Module object]";
        });
    else if (da || x)
      x
        ? (y = self.location.href)
        : "undefined" !== typeof document &&
          document.currentScript &&
          (y = document.currentScript.src),
        _scriptDir && (y = _scriptDir),
        0 !== y.indexOf("blob:")
          ? (y = y.substr(0, y.replace(/[?#].*/, "").lastIndexOf("/") + 1))
          : (y = ""),
        (fa = function (a) {
          var b = new XMLHttpRequest();
          b.open("GET", a, !1);
          b.send(null);
          return b.responseText;
        }),
        x &&
          (A = function (a) {
            var b = new XMLHttpRequest();
            b.open("GET", a, !1);
            b.responseType = "arraybuffer";
            b.send(null);
            return new Uint8Array(b.response);
          }),
        (z = function (a, b, d) {
          var f = new XMLHttpRequest();
          f.open("GET", a, !0);
          f.responseType = "arraybuffer";
          f.onload = function () {
            200 == f.status || (0 == f.status && f.response)
              ? b(f.response)
              : d();
          };
          f.onerror = d;
          f.send(null);
        });
    var ja = c.print || console.log.bind(console),
      E = c.printErr || console.warn.bind(console);
    aa(c, ca);
    ca = null;
    c.arguments && (u = c.arguments);
    c.thisProgram && (v = c.thisProgram);
    c.quit && (w = c.quit);
    var F;
    c.wasmBinary && (F = c.wasmBinary);
    var noExitRuntime = c.noExitRuntime || !0;
    "object" !== typeof WebAssembly && G("no native wasm support detected");
    var ka,
      la = !1;
    function ma(a, b, d, f) {
      var h = {
        string: function (n) {
          var p = 0;
          if (null !== n && void 0 !== n && 0 !== n) {
            var H = (n.length << 2) + 1;
            p = I(H);
            J(n, K, p, H);
          }
          return p;
        },
        array: function (n) {
          var p = I(n.length);
          L.set(n, p);
          return p;
        },
      };
      a = c["_" + a];
      var g = [],
        m = 0;
      if (f)
        for (var r = 0; r < f.length; r++) {
          var t = h[d[r]];
          t ? (0 === m && (m = na()), (g[r] = t(f[r]))) : (g[r] = f[r]);
        }
      d = a.apply(null, g);
      return (d = (function (n) {
        0 !== m && oa(m);
        return "string" === b ? M(n) : "boolean" === b ? !!n : n;
      })(d));
    }
    var pa =
      "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0;
    function qa(a, b, d) {
      var f = b + d;
      for (d = b; a[d] && !(d >= f); ) ++d;
      if (16 < d - b && a.subarray && pa) return pa.decode(a.subarray(b, d));
      for (f = ""; b < d; ) {
        var h = a[b++];
        if (h & 128) {
          var g = a[b++] & 63;
          if (192 == (h & 224)) f += String.fromCharCode(((h & 31) << 6) | g);
          else {
            var m = a[b++] & 63;
            h =
              224 == (h & 240)
                ? ((h & 15) << 12) | (g << 6) | m
                : ((h & 7) << 18) | (g << 12) | (m << 6) | (a[b++] & 63);
            65536 > h
              ? (f += String.fromCharCode(h))
              : ((h -= 65536),
                (f += String.fromCharCode(
                  55296 | (h >> 10),
                  56320 | (h & 1023)
                )));
          }
        } else f += String.fromCharCode(h);
      }
      return f;
    }
    function M(a, b) {
      return a ? qa(K, a, b) : "";
    }
    function J(a, b, d, f) {
      if (0 < f) {
        f = d + f - 1;
        for (var h = 0; h < a.length; ++h) {
          var g = a.charCodeAt(h);
          if (55296 <= g && 57343 >= g) {
            var m = a.charCodeAt(++h);
            g = (65536 + ((g & 1023) << 10)) | (m & 1023);
          }
          if (127 >= g) {
            if (d >= f) break;
            b[d++] = g;
          } else {
            if (2047 >= g) {
              if (d + 1 >= f) break;
              b[d++] = 192 | (g >> 6);
            } else {
              if (65535 >= g) {
                if (d + 2 >= f) break;
                b[d++] = 224 | (g >> 12);
              } else {
                if (d + 3 >= f) break;
                b[d++] = 240 | (g >> 18);
                b[d++] = 128 | ((g >> 12) & 63);
              }
              b[d++] = 128 | ((g >> 6) & 63);
            }
            b[d++] = 128 | (g & 63);
          }
        }
        b[d] = 0;
      }
    }
    function N(a) {
      for (var b = 0, d = 0; d < a.length; ++d) {
        var f = a.charCodeAt(d);
        55296 <= f &&
          57343 >= f &&
          (f = (65536 + ((f & 1023) << 10)) | (a.charCodeAt(++d) & 1023));
        127 >= f ? ++b : (b = 2047 >= f ? b + 2 : 65535 >= f ? b + 3 : b + 4);
      }
      return b;
    }
    function ra(a) {
      var b = N(a) + 1,
        d = sa(b);
      d && J(a, L, d, b);
      return d;
    }
    function ta(a) {
      var b = N(a) + 1,
        d = I(b);
      J(a, L, d, b);
      return d;
    }
    var ua, L, K, O;
    function va() {
      var a = ka.buffer;
      ua = a;
      c.HEAP8 = L = new Int8Array(a);
      c.HEAP16 = new Int16Array(a);
      c.HEAP32 = O = new Int32Array(a);
      c.HEAPU8 = K = new Uint8Array(a);
      c.HEAPU16 = new Uint16Array(a);
      c.HEAPU32 = new Uint32Array(a);
      c.HEAPF32 = new Float32Array(a);
      c.HEAPF64 = new Float64Array(a);
    }
    var wa,
      xa = [],
      ya = [],
      za = [],
      Aa = [],
      ia = 0;
    function Ba() {
      var a = c.preRun.shift();
      xa.unshift(a);
    }
    var P = 0,
      Ca = null,
      Q = null;
    c.preloadedImages = {};
    c.preloadedAudios = {};
    function G(a) {
      if (c.onAbort) c.onAbort(a);
      a = "Aborted(" + a + ")";
      E(a);
      la = !0;
      a = new WebAssembly.RuntimeError(
        a + ". Build with -s ASSERTIONS=1 for more info."
      );
      k(a);
      throw a;
    }
    function Da() {
      return R.startsWith("data:application/octet-stream;base64,");
    }
    var R;
    R = "Koi_Barcode.wasm";
    if (!Da()) {
      var Ea = R;
      R = c.locateFile ? c.locateFile(Ea, y) : y + Ea;
    }
    function Fa() {
      var a = R;
      try {
        if (a == R && F) return new Uint8Array(F);
        if (A) return A(a);
        throw "both async and sync fetching of the wasm failed";
      } catch (b) {
        G(b);
      }
    }
    function Ga() {
      if (!F && (da || x)) {
        if ("function" === typeof fetch && !R.startsWith("file://"))
          return fetch(R, { credentials: "same-origin" })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + R + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Fa();
            });
        if (z)
          return new Promise(function (a, b) {
            z(
              R,
              function (d) {
                a(new Uint8Array(d));
              },
              b
            );
          });
      }
      return Promise.resolve().then(function () {
        return Fa();
      });
    }
    function S(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ("function" == typeof b) b(c);
        else {
          var d = b.ea;
          "number" === typeof d
            ? void 0 === b.S
              ? wa.get(d)()
              : wa.get(d)(b.S)
            : d(void 0 === b.S ? null : b.S);
        }
      }
    }
    function Ha(a) {
      this.M = a - 16;
      this.Y = function (b) {
        O[(this.M + 4) >> 2] = b;
      };
      this.V = function (b) {
        O[(this.M + 8) >> 2] = b;
      };
      this.W = function () {
        O[this.M >> 2] = 0;
      };
      this.U = function () {
        L[(this.M + 12) >> 0] = 0;
      };
      this.X = function () {
        L[(this.M + 13) >> 0] = 0;
      };
      this.T = function (b, d) {
        this.Y(b);
        this.V(d);
        this.W();
        this.U();
        this.X();
      };
    }
    var Ia = 0;
    function Ja() {
      function a(m) {
        return (m = m.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? m[1] : "GMT";
      }
      var b = new Date().getFullYear(),
        d = new Date(b, 0, 1),
        f = new Date(b, 6, 1);
      b = d.getTimezoneOffset();
      var h = f.getTimezoneOffset(),
        g = Math.max(b, h);
      O[Ka() >> 2] = 60 * g;
      O[La() >> 2] = Number(b != h);
      d = a(d);
      f = a(f);
      d = ra(d);
      f = ra(f);
      h < b
        ? ((O[T() >> 2] = d), (O[(T() + 4) >> 2] = f))
        : ((O[T() >> 2] = f), (O[(T() + 4) >> 2] = d));
    }
    var Ma, Na;
    Na = ea
      ? () => {
          var a = process.hrtime();
          return 1e3 * a[0] + a[1] / 1e6;
        }
      : () => performance.now();
    function U(a) {
      a = eval(M(a));
      if (null == a) return 0;
      var b = N(a);
      if (!U.bufferSize || U.bufferSize < b + 1)
        U.bufferSize && Qa(U.buffer),
          (U.bufferSize = b + 1),
          (U.buffer = Ra(U.bufferSize));
      J(a, K, U.buffer, U.bufferSize);
      return U.buffer;
    }
    var Sa = {};
    function Ta() {
      if (!Ua) {
        var a = {
            USER: "web_user",
            LOGNAME: "web_user",
            PATH: "/",
            PWD: "/",
            HOME: "/home/web_user",
            LANG:
              (
                ("object" === typeof navigator &&
                  navigator.languages &&
                  navigator.languages[0]) ||
                "C"
              ).replace("-", "_") + ".UTF-8",
            _: v || "./this.program",
          },
          b;
        for (b in Sa) void 0 === Sa[b] ? delete a[b] : (a[b] = Sa[b]);
        var d = [];
        for (b in a) d.push(b + "=" + a[b]);
        Ua = d;
      }
      return Ua;
    }
    var Ua,
      Va = [null, [], []],
      Wa = {};
    function V(a) {
      return 0 === a % 4 && (0 !== a % 100 || 0 === a % 400);
    }
    function Xa(a, b) {
      for (var d = 0, f = 0; f <= b; d += a[f++]);
      return d;
    }
    var W = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      X = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function Y(a, b) {
      for (a = new Date(a.getTime()); 0 < b; ) {
        var d = a.getMonth(),
          f = (V(a.getFullYear()) ? W : X)[d];
        if (b > f - a.getDate())
          (b -= f - a.getDate() + 1),
            a.setDate(1),
            11 > d
              ? a.setMonth(d + 1)
              : (a.setMonth(0), a.setFullYear(a.getFullYear() + 1));
        else {
          a.setDate(a.getDate() + b);
          break;
        }
      }
      return a;
    }
    function Ya(a, b, d, f) {
      function h(e, l, q) {
        for (e = "number" === typeof e ? e.toString() : e || ""; e.length < l; )
          e = q[0] + e;
        return e;
      }
      function g(e, l) {
        return h(e, l, "0");
      }
      function m(e, l) {
        function q(Oa) {
          return 0 > Oa ? -1 : 0 < Oa ? 1 : 0;
        }
        var B;
        0 === (B = q(e.getFullYear() - l.getFullYear())) &&
          0 === (B = q(e.getMonth() - l.getMonth())) &&
          (B = q(e.getDate() - l.getDate()));
        return B;
      }
      function r(e) {
        switch (e.getDay()) {
          case 0:
            return new Date(e.getFullYear() - 1, 11, 29);
          case 1:
            return e;
          case 2:
            return new Date(e.getFullYear(), 0, 3);
          case 3:
            return new Date(e.getFullYear(), 0, 2);
          case 4:
            return new Date(e.getFullYear(), 0, 1);
          case 5:
            return new Date(e.getFullYear() - 1, 11, 31);
          case 6:
            return new Date(e.getFullYear() - 1, 11, 30);
        }
      }
      function t(e) {
        e = Y(new Date(e.K + 1900, 0, 1), e.R);
        var l = new Date(e.getFullYear() + 1, 0, 4),
          q = r(new Date(e.getFullYear(), 0, 4));
        l = r(l);
        return 0 >= m(q, e)
          ? 0 >= m(l, e)
            ? e.getFullYear() + 1
            : e.getFullYear()
          : e.getFullYear() - 1;
      }
      var n = O[(f + 40) >> 2];
      f = {
        aa: O[f >> 2],
        $: O[(f + 4) >> 2],
        O: O[(f + 8) >> 2],
        N: O[(f + 12) >> 2],
        L: O[(f + 16) >> 2],
        K: O[(f + 20) >> 2],
        P: O[(f + 24) >> 2],
        R: O[(f + 28) >> 2],
        ga: O[(f + 32) >> 2],
        Z: O[(f + 36) >> 2],
        ba: n ? M(n) : "",
      };
      d = M(d);
      n = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y",
      };
      for (var p in n) d = d.replace(new RegExp(p, "g"), n[p]);
      var H = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(
          " "
        ),
        Pa =
          "January February March April May June July August September October November December".split(
            " "
          );
      n = {
        "%a": function (e) {
          return H[e.P].substring(0, 3);
        },
        "%A": function (e) {
          return H[e.P];
        },
        "%b": function (e) {
          return Pa[e.L].substring(0, 3);
        },
        "%B": function (e) {
          return Pa[e.L];
        },
        "%C": function (e) {
          return g(((e.K + 1900) / 100) | 0, 2);
        },
        "%d": function (e) {
          return g(e.N, 2);
        },
        "%e": function (e) {
          return h(e.N, 2, " ");
        },
        "%g": function (e) {
          return t(e).toString().substring(2);
        },
        "%G": function (e) {
          return t(e);
        },
        "%H": function (e) {
          return g(e.O, 2);
        },
        "%I": function (e) {
          e = e.O;
          0 == e ? (e = 12) : 12 < e && (e -= 12);
          return g(e, 2);
        },
        "%j": function (e) {
          return g(e.N + Xa(V(e.K + 1900) ? W : X, e.L - 1), 3);
        },
        "%m": function (e) {
          return g(e.L + 1, 2);
        },
        "%M": function (e) {
          return g(e.$, 2);
        },
        "%n": function () {
          return "\n";
        },
        "%p": function (e) {
          return 0 <= e.O && 12 > e.O ? "AM" : "PM";
        },
        "%S": function (e) {
          return g(e.aa, 2);
        },
        "%t": function () {
          return "\t";
        },
        "%u": function (e) {
          return e.P || 7;
        },
        "%U": function (e) {
          var l = new Date(e.K + 1900, 0, 1),
            q = 0 === l.getDay() ? l : Y(l, 7 - l.getDay());
          e = new Date(e.K + 1900, e.L, e.N);
          return 0 > m(q, e)
            ? g(
                Math.ceil(
                  (31 -
                    q.getDate() +
                    (Xa(V(e.getFullYear()) ? W : X, e.getMonth() - 1) - 31) +
                    e.getDate()) /
                    7
                ),
                2
              )
            : 0 === m(q, l)
            ? "01"
            : "00";
        },
        "%V": function (e) {
          var l = new Date(e.K + 1901, 0, 4),
            q = r(new Date(e.K + 1900, 0, 4));
          l = r(l);
          var B = Y(new Date(e.K + 1900, 0, 1), e.R);
          return 0 > m(B, q)
            ? "53"
            : 0 >= m(l, B)
            ? "01"
            : g(
                Math.ceil(
                  (q.getFullYear() < e.K + 1900
                    ? e.R + 32 - q.getDate()
                    : e.R + 1 - q.getDate()) / 7
                ),
                2
              );
        },
        "%w": function (e) {
          return e.P;
        },
        "%W": function (e) {
          var l = new Date(e.K, 0, 1),
            q =
              1 === l.getDay()
                ? l
                : Y(l, 0 === l.getDay() ? 1 : 7 - l.getDay() + 1);
          e = new Date(e.K + 1900, e.L, e.N);
          return 0 > m(q, e)
            ? g(
                Math.ceil(
                  (31 -
                    q.getDate() +
                    (Xa(V(e.getFullYear()) ? W : X, e.getMonth() - 1) - 31) +
                    e.getDate()) /
                    7
                ),
                2
              )
            : 0 === m(q, l)
            ? "01"
            : "00";
        },
        "%y": function (e) {
          return (e.K + 1900).toString().substring(2);
        },
        "%Y": function (e) {
          return e.K + 1900;
        },
        "%z": function (e) {
          e = e.Z;
          var l = 0 <= e;
          e = Math.abs(e) / 60;
          return (
            (l ? "+" : "-") +
            String("0000" + ((e / 60) * 100 + (e % 60))).slice(-4)
          );
        },
        "%Z": function (e) {
          return e.ba;
        },
        "%%": function () {
          return "%";
        },
      };
      for (p in n)
        d.includes(p) && (d = d.replace(new RegExp(p, "g"), n[p](f)));
      p = Za(d);
      if (p.length > b) return 0;
      L.set(p, a);
      return p.length - 1;
    }
    function Za(a) {
      var b = Array(N(a) + 1);
      J(a, b, 0, b.length);
      return b;
    }
    var ab = {
      i: function (a, b, d, f) {
        G(
          "Assertion failed: " +
            M(a) +
            ", at: " +
            [b ? M(b) : "unknown filename", d, f ? M(f) : "unknown function"]
        );
      },
      h: function (a) {
        return sa(a + 16) + 16;
      },
      g: function (a, b, d) {
        new Ha(a).T(b, d);
        Ia++;
        throw a;
      },
      c: function (a, b) {
        Ma || ((Ma = !0), Ja());
        a = new Date(1e3 * O[a >> 2]);
        O[b >> 2] = a.getSeconds();
        O[(b + 4) >> 2] = a.getMinutes();
        O[(b + 8) >> 2] = a.getHours();
        O[(b + 12) >> 2] = a.getDate();
        O[(b + 16) >> 2] = a.getMonth();
        O[(b + 20) >> 2] = a.getFullYear() - 1900;
        O[(b + 24) >> 2] = a.getDay();
        var d = new Date(a.getFullYear(), 0, 1);
        O[(b + 28) >> 2] = ((a.getTime() - d.getTime()) / 864e5) | 0;
        O[(b + 36) >> 2] = -(60 * a.getTimezoneOffset());
        var f = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
        d = d.getTimezoneOffset();
        a = (f != d && a.getTimezoneOffset() == Math.min(d, f)) | 0;
        O[(b + 32) >> 2] = a;
        a = O[(T() + (a ? 4 : 0)) >> 2];
        O[(b + 40) >> 2] = a;
        return b;
      },
      b: function () {
        G("");
      },
      f: function (a, b) {
        if (0 === a) a = Date.now();
        else if (1 === a || 4 === a) a = Na();
        else return (O[$a() >> 2] = 28), -1;
        O[b >> 2] = (a / 1e3) | 0;
        O[(b + 4) >> 2] = ((a % 1e3) * 1e6) | 0;
        return 0;
      },
      k: function (a) {
        var b = K.length;
        a >>>= 0;
        if (2147483648 < a) return !1;
        for (var d = 1; 4 >= d; d *= 2) {
          var f = b * (1 + 0.2 / d);
          f = Math.min(f, a + 100663296);
          f = Math.max(a, f);
          0 < f % 65536 && (f += 65536 - (f % 65536));
          a: {
            try {
              ka.grow((Math.min(2147483648, f) - ua.byteLength + 65535) >>> 16);
              va();
              var h = 1;
              break a;
            } catch (g) {}
            h = void 0;
          }
          if (h) return !0;
        }
        return !1;
      },
      o: U,
      m: function (a, b) {
        var d = 0;
        Ta().forEach(function (f, h) {
          var g = b + d;
          h = O[(a + 4 * h) >> 2] = g;
          for (g = 0; g < f.length; ++g) L[h++ >> 0] = f.charCodeAt(g);
          L[h >> 0] = 0;
          d += f.length + 1;
        });
        return 0;
      },
      n: function (a, b) {
        var d = Ta();
        O[a >> 2] = d.length;
        var f = 0;
        d.forEach(function (h) {
          f += h.length + 1;
        });
        O[b >> 2] = f;
        return 0;
      },
      e: function () {
        return 0;
      },
      d: function (a, b, d, f) {
        a = Wa.fa(a);
        b = Wa.da(a, b, d);
        O[f >> 2] = b;
        return 0;
      },
      j: function () {},
      a: function (a, b, d, f) {
        for (var h = 0, g = 0; g < d; g++) {
          var m = O[b >> 2],
            r = O[(b + 4) >> 2];
          b += 8;
          for (var t = 0; t < r; t++) {
            var n = K[m + t],
              p = Va[a];
            0 === n || 10 === n
              ? ((1 === a ? ja : E)(qa(p, 0)), (p.length = 0))
              : p.push(n);
          }
          h += r;
        }
        O[f >> 2] = h;
        return 0;
      },
      l: function (a, b, d, f) {
        return Ya(a, b, d, f);
      },
      p: function (a) {
        var b = (Date.now() / 1e3) | 0;
        a && (O[a >> 2] = b);
        return b;
      },
    };
    (function () {
      function a(h) {
        c.asm = h.exports;
        ka = c.asm.q;
        va();
        wa = c.asm.A;
        ya.unshift(c.asm.r);
        P--;
        c.monitorRunDependencies && c.monitorRunDependencies(P);
        0 == P &&
          (null !== Ca && (clearInterval(Ca), (Ca = null)),
          Q && ((h = Q), (Q = null), h()));
      }
      function b(h) {
        a(h.instance);
      }
      function d(h) {
        return Ga()
          .then(function (g) {
            return WebAssembly.instantiate(g, f);
          })
          .then(function (g) {
            return g;
          })
          .then(h, function (g) {
            E("failed to asynchronously prepare wasm: " + g);
            G(g);
          });
      }
      var f = { a: ab };
      P++;
      c.monitorRunDependencies && c.monitorRunDependencies(P);
      if (c.instantiateWasm)
        try {
          return c.instantiateWasm(f, a);
        } catch (h) {
          return (
            E("Module.instantiateWasm callback failed with error: " + h), !1
          );
        }
      (function () {
        return F ||
          "function" !== typeof WebAssembly.instantiateStreaming ||
          Da() ||
          R.startsWith("file://") ||
          "function" !== typeof fetch
          ? d(b)
          : fetch(R, { credentials: "same-origin" }).then(function (h) {
              return WebAssembly.instantiateStreaming(h, f).then(
                b,
                function (g) {
                  E("wasm streaming compile failed: " + g);
                  E("falling back to ArrayBuffer instantiation");
                  return d(b);
                }
              );
            });
      })().catch(k);
      return {};
    })();
    c.___wasm_call_ctors = function () {
      return (c.___wasm_call_ctors = c.asm.r).apply(null, arguments);
    };
    c._createBuffer = function () {
      return (c._createBuffer = c.asm.s).apply(null, arguments);
    };
    var sa = (c._malloc = function () {
      return (sa = c._malloc = c.asm.t).apply(null, arguments);
    });
    c._deleteBuffer = function () {
      return (c._deleteBuffer = c.asm.u).apply(null, arguments);
    };
    c._licenseCheck = function () {
      return (c._licenseCheck = c.asm.v).apply(null, arguments);
    };
    c._triggerDecode = function () {
      return (c._triggerDecode = c.asm.w).apply(null, arguments);
    };
    c._getScanResults = function () {
      return (c._getScanResults = c.asm.x).apply(null, arguments);
    };
    c._getResultType = function () {
      return (c._getResultType = c.asm.y).apply(null, arguments);
    };
    c._main = function () {
      return (c._main = c.asm.z).apply(null, arguments);
    };
    var $a = (c.___errno_location = function () {
        return ($a = c.___errno_location = c.asm.B).apply(null, arguments);
      }),
      T = (c.__get_tzname = function () {
        return (T = c.__get_tzname = c.asm.C).apply(null, arguments);
      }),
      La = (c.__get_daylight = function () {
        return (La = c.__get_daylight = c.asm.D).apply(null, arguments);
      }),
      Ka = (c.__get_timezone = function () {
        return (Ka = c.__get_timezone = c.asm.E).apply(null, arguments);
      }),
      na = (c.stackSave = function () {
        return (na = c.stackSave = c.asm.F).apply(null, arguments);
      }),
      oa = (c.stackRestore = function () {
        return (oa = c.stackRestore = c.asm.G).apply(null, arguments);
      }),
      I = (c.stackAlloc = function () {
        return (I = c.stackAlloc = c.asm.H).apply(null, arguments);
      }),
      Ra = (c._emscripten_builtin_malloc = function () {
        return (Ra = c._emscripten_builtin_malloc = c.asm.I).apply(
          null,
          arguments
        );
      }),
      Qa = (c._emscripten_builtin_free = function () {
        return (Qa = c._emscripten_builtin_free = c.asm.J).apply(
          null,
          arguments
        );
      });
    c.cwrap = function (a, b, d, f) {
      d = d || [];
      var h = d.every(function (g) {
        return "number" === g;
      });
      return "string" !== b && h && !f
        ? c["_" + a]
        : function () {
            return ma(a, b, d, arguments);
          };
    };
    c.UTF8ToString = M;
    var Z;
    function D(a) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + a + ")";
      this.status = a;
    }
    Q = function bb() {
      Z || cb();
      Z || (Q = bb);
    };
    function cb(a) {
      function b() {
        if (!Z && ((Z = !0), (c.calledRun = !0), !la)) {
          S(ya);
          S(za);
          ba(c);
          if (c.onRuntimeInitialized) c.onRuntimeInitialized();
          if (db) {
            var d = a,
              f = c._main;
            d = d || [];
            var h = d.length + 1,
              g = I(4 * (h + 1));
            O[g >> 2] = ta(v);
            for (var m = 1; m < h; m++) O[(g >> 2) + m] = ta(d[m - 1]);
            O[(g >> 2) + h] = 0;
            try {
              var r = f(h, g);
              if (!(noExitRuntime || 0 < ia)) {
                if (c.onExit) c.onExit(r);
                la = !0;
              }
              w(r, new D(r));
            } catch (t) {
              t instanceof D || "unwind" == t || w(1, t);
            } finally {
            }
          }
          if (c.postRun)
            for (
              "function" == typeof c.postRun && (c.postRun = [c.postRun]);
              c.postRun.length;

            )
              (d = c.postRun.shift()), Aa.unshift(d);
          S(Aa);
        }
      }
      a = a || u;
      if (!(0 < P)) {
        if (c.preRun)
          for (
            "function" == typeof c.preRun && (c.preRun = [c.preRun]);
            c.preRun.length;

          )
            Ba();
        S(xa);
        0 < P ||
          (c.setStatus
            ? (c.setStatus("Running..."),
              setTimeout(function () {
                setTimeout(function () {
                  c.setStatus("");
                }, 1);
                b();
              }, 1))
            : b());
      }
    }
    c.run = cb;
    if (c.preInit)
      for (
        "function" == typeof c.preInit && (c.preInit = [c.preInit]);
        0 < c.preInit.length;

      )
        c.preInit.pop()();
    var db = !0;
    c.noInitialRun && (db = !1);
    cb();

    return CreateKoder.ready;
  };
})();
if (typeof exports === "object" && typeof module === "object")
  module.exports = CreateKoder;
else if (typeof define === "function" && define["amd"])
  define([], function () {
    return CreateKoder;
  });
else if (typeof exports === "object") exports["CreateKoder"] = CreateKoder;
