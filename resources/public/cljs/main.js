var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return Boolean(opt_cancel)
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.getFunctionName = function(fn) {
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.logToSpeedTracer_ = function(msg) {
  if(goog.global["console"] && goog.global["console"]["markTimeline"]) {
    goog.global["console"]["markTimeline"](msg)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  this.logToSpeedTracer_("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.serialize = function(object) {
  return(new goog.json.Serializer).serialize(object)
};
goog.json.Serializer = function() {
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray_(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray_ = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    this.serialize_(arr[i], sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_ = null;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.net.xhrMonitor");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.userAgent");
goog.net.XhrMonitor_ = function() {
  if(!goog.userAgent.GECKO) {
    return
  }
  this.contextsToXhr_ = {};
  this.xhrToContexts_ = {};
  this.stack_ = []
};
goog.net.XhrMonitor_.getKey = function(obj) {
  return goog.isString(obj) ? obj : goog.isObject(obj) ? goog.getUid(obj) : ""
};
goog.net.XhrMonitor_.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.xhrMonitor");
goog.net.XhrMonitor_.prototype.enabled_ = goog.userAgent.GECKO;
goog.net.XhrMonitor_.prototype.setEnabled = function(val) {
  this.enabled_ = goog.userAgent.GECKO && val
};
goog.net.XhrMonitor_.prototype.pushContext = function(context) {
  if(!this.enabled_) {
    return
  }
  var key = goog.net.XhrMonitor_.getKey(context);
  this.logger_.finest("Pushing context: " + context + " (" + key + ")");
  this.stack_.push(key)
};
goog.net.XhrMonitor_.prototype.popContext = function() {
  if(!this.enabled_) {
    return
  }
  var context = this.stack_.pop();
  this.logger_.finest("Popping context: " + context);
  this.updateDependentContexts_(context)
};
goog.net.XhrMonitor_.prototype.isContextSafe = function(context) {
  if(!this.enabled_) {
    return true
  }
  var deps = this.contextsToXhr_[goog.net.XhrMonitor_.getKey(context)];
  this.logger_.fine("Context is safe : " + context + " - " + deps);
  return!deps
};
goog.net.XhrMonitor_.prototype.markXhrOpen = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Opening XHR : " + uid);
  for(var i = 0;i < this.stack_.length;i++) {
    var context = this.stack_[i];
    this.addToMap_(this.contextsToXhr_, context, uid);
    this.addToMap_(this.xhrToContexts_, uid, context)
  }
};
goog.net.XhrMonitor_.prototype.markXhrClosed = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Closing XHR : " + uid);
  delete this.xhrToContexts_[uid];
  for(var context in this.contextsToXhr_) {
    goog.array.remove(this.contextsToXhr_[context], uid);
    if(this.contextsToXhr_[context].length == 0) {
      delete this.contextsToXhr_[context]
    }
  }
};
goog.net.XhrMonitor_.prototype.updateDependentContexts_ = function(xhrUid) {
  var contexts = this.xhrToContexts_[xhrUid];
  var xhrs = this.contextsToXhr_[xhrUid];
  if(contexts && xhrs) {
    this.logger_.finest("Updating dependent contexts");
    goog.array.forEach(contexts, function(context) {
      goog.array.forEach(xhrs, function(xhr) {
        this.addToMap_(this.contextsToXhr_, context, xhr);
        this.addToMap_(this.xhrToContexts_, xhr, context)
      }, this)
    }, this)
  }
};
goog.net.XhrMonitor_.prototype.addToMap_ = function(map, key, value) {
  if(!map[key]) {
    map[key] = []
  }
  if(!goog.array.contains(map[key], value)) {
    map[key].push(value)
  }
};
goog.net.xhrMonitor = new goog.net.XhrMonitor_;
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.require("goog.asserts");
goog.require("goog.string");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    value = value;
    for(var j = 0;j < value.length;j++) {
      pairs.push("&", key);
      if(value[j] !== "") {
        pairs.push("=", goog.string.urlEncode(value[j]))
      }
    }
  }else {
    if(value != null) {
      pairs.push("&", key);
      if(value !== "") {
        pairs.push("=", goog.string.urlEncode(value))
      }
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.net.xhrMonitor");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?:?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method || "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  goog.net.xhrMonitor.markXhrOpen(this.xhr_);
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : new goog.net.XmlHttp
};
goog.net.XhrIo.prototype.dispatchEvent = function(e) {
  if(this.xhr_) {
    goog.net.xhrMonitor.pushContext(this.xhr_);
    try {
      return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
    }finally {
      goog.net.xhrMonitor.popContext()
    }
  }else {
    return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
  }
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        if(this.isSuccess()) {
          this.dispatchEvent(goog.net.EventType.COMPLETE);
          this.dispatchEvent(goog.net.EventType.SUCCESS)
        }else {
          this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
          this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
          this.dispatchErrors_()
        }
        this.cleanUpXhr_()
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      goog.net.xhrMonitor.pushContext(xhr);
      this.dispatchEvent(goog.net.EventType.READY);
      goog.net.xhrMonitor.popContext()
    }
    goog.net.xhrMonitor.markXhrClosed(xhr);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  switch(this.getStatus()) {
    case 0:
      return!this.isLastUriEffectiveSchemeHttp_();
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
      return true;
    default:
      return false
  }
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var lastUriScheme = goog.isString(this.lastUri_) ? goog.uri.utils.getScheme(this.lastUri_) : this.lastUri_.getScheme();
  if(lastUriScheme) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(lastUriScheme)
  }
  if(self.location) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(self.location.protocol)
  }else {
    return true
  }
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    return this.xhr_ && this.xhr_.response
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.events.EventHandler");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.require("goog.events.EventWrapper");
goog.require("goog.object");
goog.require("goog.structs.SimplePool");
goog.events.EventHandler = function(opt_handler) {
  goog.Disposable.call(this);
  this.handler_ = opt_handler
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.KEY_POOL_INITIAL_COUNT = 0;
goog.events.EventHandler.KEY_POOL_MAX_COUNT = 100;
goog.events.EventHandler.keyPool_ = new goog.structs.SimplePool(goog.events.EventHandler.KEY_POOL_INITIAL_COUNT, goog.events.EventHandler.KEY_POOL_MAX_COUNT);
goog.events.EventHandler.keys_ = null;
goog.events.EventHandler.key_ = null;
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(!goog.isArray(type)) {
    goog.events.EventHandler.typeArray_[0] = type;
    type = goog.events.EventHandler.typeArray_
  }
  for(var i = 0;i < type.length;i++) {
    var key = goog.events.listen(src, type[i], opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
    this.recordListenerKey_(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var key = goog.events.listenOnce(src, type, opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
    this.recordListenerKey_(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.recordListenerKey_ = function(key) {
  if(this.keys_) {
    this.keys_[key] = true
  }else {
    if(this.key_) {
      this.keys_ = goog.events.EventHandler.keyPool_.getObject();
      this.keys_[this.key_] = true;
      this.key_ = null;
      this.keys_[key] = true
    }else {
      this.key_ = key
    }
  }
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(this.key_ || this.keys_) {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler)
      }
    }else {
      var listener = goog.events.getListener(src, type, opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
      if(listener) {
        var key = listener.key;
        goog.events.unlistenByKey(key);
        if(this.keys_) {
          goog.object.remove(this.keys_, key)
        }else {
          if(this.key_ == key) {
            this.key_ = null
          }
        }
      }
    }
  }
  return this
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.removeAll = function() {
  if(this.keys_) {
    for(var key in this.keys_) {
      goog.events.unlistenByKey(key);
      delete this.keys_[key]
    }
    goog.events.EventHandler.keyPool_.releaseObject(this.keys_);
    this.keys_ = null
  }else {
    if(this.key_) {
      goog.events.unlistenByKey(this.key_)
    }
  }
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll()
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
};
goog.provide("goog.messaging.MessageChannel");
goog.messaging.MessageChannel = function() {
};
goog.messaging.MessageChannel.prototype.connect = function(opt_connectCb) {
};
goog.messaging.MessageChannel.prototype.isConnected = function() {
};
goog.messaging.MessageChannel.prototype.registerService = function(serviceName, callback, opt_objectPayload) {
};
goog.messaging.MessageChannel.prototype.registerDefaultService = function(callback) {
};
goog.messaging.MessageChannel.prototype.send = function(serviceName, payload) {
};
goog.provide("goog.net.xpc");
goog.provide("goog.net.xpc.CfgFields");
goog.provide("goog.net.xpc.ChannelStates");
goog.provide("goog.net.xpc.TransportNames");
goog.provide("goog.net.xpc.TransportTypes");
goog.provide("goog.net.xpc.UriCfgFields");
goog.require("goog.debug.Logger");
goog.net.xpc.TransportTypes = {NATIVE_MESSAGING:1, FRAME_ELEMENT_METHOD:2, IFRAME_RELAY:3, IFRAME_POLLING:4, FLASH:5, NIX:6};
goog.net.xpc.TransportNames = {1:"NativeMessagingTransport", 2:"FrameElementMethodTransport", 3:"IframeRelayTransport", 4:"IframePollingTransport", 5:"FlashTransport", 6:"NixTransport"};
goog.net.xpc.CfgFields = {CHANNEL_NAME:"cn", AUTH_TOKEN:"at", REMOTE_AUTH_TOKEN:"rat", PEER_URI:"pu", IFRAME_ID:"ifrid", TRANSPORT:"tp", LOCAL_RELAY_URI:"lru", PEER_RELAY_URI:"pru", LOCAL_POLL_URI:"lpu", PEER_POLL_URI:"ppu", PEER_HOSTNAME:"ph"};
goog.net.xpc.UriCfgFields = [goog.net.xpc.CfgFields.PEER_URI, goog.net.xpc.CfgFields.LOCAL_RELAY_URI, goog.net.xpc.CfgFields.PEER_RELAY_URI, goog.net.xpc.CfgFields.LOCAL_POLL_URI, goog.net.xpc.CfgFields.PEER_POLL_URI];
goog.net.xpc.ChannelStates = {NOT_CONNECTED:1, CONNECTED:2, CLOSED:3};
goog.net.xpc.TRANSPORT_SERVICE_ = "tp";
goog.net.xpc.SETUP = "SETUP";
goog.net.xpc.SETUP_ACK_ = "SETUP_ACK";
goog.net.xpc.channels_ = {};
goog.net.xpc.getRandomString = function(length, opt_characters) {
  var chars = opt_characters || goog.net.xpc.randomStringCharacters_;
  var charsLength = chars.length;
  var s = "";
  while(length-- > 0) {
    s += chars.charAt(Math.floor(Math.random() * charsLength))
  }
  return s
};
goog.net.xpc.randomStringCharacters_ = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
goog.net.xpc.logger = goog.debug.Logger.getLogger("goog.net.xpc");
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ? opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_)
    }
  }
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  if(this.cachedToString_) {
    return this.cachedToString_
  }
  var out = [];
  if(this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  if(this.domain_) {
    out.push("//");
    if(this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.Uri.encodeString_(this.domain_));
    if(this.port_ != null) {
      out.push(":", String(this.getPort()))
    }
  }
  if(this.path_) {
    if(this.hasDomain() && this.path_.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(this.path_, goog.Uri.reDisallowedInPath_))
  }
  var query = String(this.queryData_);
  if(query) {
    out.push("?", query)
  }
  if(this.fragment_) {
    out.push("#", goog.Uri.encodeSpecialChars_(this.fragment_, goog.Uri.reDisallowedInFragment_))
  }
  return this.cachedToString_ = out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_, this.port_, this.path_, this.queryData_.clone(), this.fragment_, this.ignoreCase_)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, this, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeString_ = function(unescapedPart) {
  if(goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart)
  }
  return null
};
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if(goog.isString(unescapedPart)) {
    ret = unescapedPart;
    if(!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart)
    }
    if(ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_)
    }
  }
  return ret
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInPath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.uri_ = opt_uri || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  return goog.Uri.QueryData.createFromKeysValues(keys, goog.structs.getValues(map), opt_uri, opt_ignoreCase)
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.decodedQuery_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(!this.containsKey(key)) {
    this.keyMap_.set(key, value)
  }else {
    var current = this.keyMap_.get(key);
    if(goog.isArray(current)) {
      current.push(value)
    }else {
      this.keyMap_.set(key, [current, value])
    }
  }
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if(this.keyMap_) {
    this.keyMap_.clear()
  }
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        rv.push(keys[i])
      }
    }else {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if(opt_key) {
    var key = this.getKeyName_(opt_key);
    if(this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if(goog.isArray(value)) {
        return value
      }else {
        rv = [];
        rv.push(value)
      }
    }else {
      rv = []
    }
  }else {
    var vals = this.keyMap_.getValues();
    rv = [];
    for(var i = 0;i < vals.length;i++) {
      var val = vals[i];
      if(goog.isArray(val)) {
        goog.array.extend(rv, val)
      }else {
        rv.push(val)
      }
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  this.keyMap_.set(key, value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      return val[0]
    }else {
      return val
    }
  }else {
    return opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  if(values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        if(count > 0) {
          sb.push("&")
        }
        sb.push(encodedKey);
        if(val[j] !== "") {
          sb.push("=", goog.string.urlEncode(val[j]))
        }
        count++
      }
    }else {
      if(count > 0) {
        sb.push("&")
      }
      sb.push(encodedKey);
      if(val !== "") {
        sb.push("=", goog.string.urlEncode(val))
      }
      count++
    }
  }
  return this.encodedQuery_ = sb.join("")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if(!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString())
  }
  return this.decodedQuery_
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if(this.uri_) {
    delete this.uri_.cachedToString_
  }
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  if(this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_
  }
  if(this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_
  }
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
  }
};
goog.provide("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyCodes = {MAC_ENTER:3, BACKSPACE:8, TAB:9, NUM_CENTER:12, ENTER:13, SHIFT:16, CTRL:17, ALT:18, PAUSE:19, CAPS_LOCK:20, ESC:27, SPACE:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36, LEFT:37, UP:38, RIGHT:39, DOWN:40, PRINT_SCREEN:44, INSERT:45, DELETE:46, ZERO:48, ONE:49, TWO:50, THREE:51, FOUR:52, FIVE:53, SIX:54, SEVEN:55, EIGHT:56, NINE:57, QUESTION_MARK:63, A:65, B:66, C:67, D:68, E:69, F:70, G:71, H:72, I:73, J:74, K:75, L:76, M:77, N:78, O:79, P:80, Q:81, R:82, S:83, T:84, U:85, 
V:86, W:87, X:88, Y:89, Z:90, META:91, CONTEXT_MENU:93, NUM_ZERO:96, NUM_ONE:97, NUM_TWO:98, NUM_THREE:99, NUM_FOUR:100, NUM_FIVE:101, NUM_SIX:102, NUM_SEVEN:103, NUM_EIGHT:104, NUM_NINE:105, NUM_MULTIPLY:106, NUM_PLUS:107, NUM_MINUS:109, NUM_PERIOD:110, NUM_DIVISION:111, F1:112, F2:113, F3:114, F4:115, F5:116, F6:117, F7:118, F8:119, F9:120, F10:121, F11:122, F12:123, NUMLOCK:144, SEMICOLON:186, DASH:189, EQUALS:187, COMMA:188, PERIOD:190, SLASH:191, APOSTROPHE:192, SINGLE_QUOTE:222, OPEN_SQUARE_BRACKET:219, 
BACKSLASH:220, CLOSE_SQUARE_BRACKET:221, WIN_KEY:224, MAC_FF_META:224, WIN_IME:229, PHANTOM:255};
goog.events.KeyCodes.isTextModifyingKeyEvent = function(e) {
  if(e.altKey && !e.ctrlKey || e.metaKey || e.keyCode >= goog.events.KeyCodes.F1 && e.keyCode <= goog.events.KeyCodes.F12) {
    return false
  }
  switch(e.keyCode) {
    case goog.events.KeyCodes.ALT:
    ;
    case goog.events.KeyCodes.CAPS_LOCK:
    ;
    case goog.events.KeyCodes.CONTEXT_MENU:
    ;
    case goog.events.KeyCodes.CTRL:
    ;
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.END:
    ;
    case goog.events.KeyCodes.ESC:
    ;
    case goog.events.KeyCodes.HOME:
    ;
    case goog.events.KeyCodes.INSERT:
    ;
    case goog.events.KeyCodes.LEFT:
    ;
    case goog.events.KeyCodes.MAC_FF_META:
    ;
    case goog.events.KeyCodes.META:
    ;
    case goog.events.KeyCodes.NUMLOCK:
    ;
    case goog.events.KeyCodes.NUM_CENTER:
    ;
    case goog.events.KeyCodes.PAGE_DOWN:
    ;
    case goog.events.KeyCodes.PAGE_UP:
    ;
    case goog.events.KeyCodes.PAUSE:
    ;
    case goog.events.KeyCodes.PHANTOM:
    ;
    case goog.events.KeyCodes.PRINT_SCREEN:
    ;
    case goog.events.KeyCodes.RIGHT:
    ;
    case goog.events.KeyCodes.SHIFT:
    ;
    case goog.events.KeyCodes.UP:
    ;
    case goog.events.KeyCodes.WIN_KEY:
      return false;
    default:
      return true
  }
};
goog.events.KeyCodes.firesKeyPressEvent = function(keyCode, opt_heldKeyCode, opt_shiftKey, opt_ctrlKey, opt_altKey) {
  if(!goog.userAgent.IE && !(goog.userAgent.WEBKIT && goog.userAgent.isVersion("525"))) {
    return true
  }
  if(goog.userAgent.MAC && opt_altKey) {
    return goog.events.KeyCodes.isCharacterKey(keyCode)
  }
  if(opt_altKey && !opt_ctrlKey) {
    return false
  }
  if(!opt_shiftKey && (opt_heldKeyCode == goog.events.KeyCodes.CTRL || opt_heldKeyCode == goog.events.KeyCodes.ALT)) {
    return false
  }
  if(goog.userAgent.IE && opt_ctrlKey && opt_heldKeyCode == keyCode) {
    return false
  }
  switch(keyCode) {
    case goog.events.KeyCodes.ENTER:
      return true;
    case goog.events.KeyCodes.ESC:
      return!goog.userAgent.WEBKIT
  }
  return goog.events.KeyCodes.isCharacterKey(keyCode)
};
goog.events.KeyCodes.isCharacterKey = function(keyCode) {
  if(keyCode >= goog.events.KeyCodes.ZERO && keyCode <= goog.events.KeyCodes.NINE) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.NUM_ZERO && keyCode <= goog.events.KeyCodes.NUM_MULTIPLY) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.A && keyCode <= goog.events.KeyCodes.Z) {
    return true
  }
  if(goog.userAgent.WEBKIT && keyCode == 0) {
    return true
  }
  switch(keyCode) {
    case goog.events.KeyCodes.SPACE:
    ;
    case goog.events.KeyCodes.QUESTION_MARK:
    ;
    case goog.events.KeyCodes.NUM_PLUS:
    ;
    case goog.events.KeyCodes.NUM_MINUS:
    ;
    case goog.events.KeyCodes.NUM_PERIOD:
    ;
    case goog.events.KeyCodes.NUM_DIVISION:
    ;
    case goog.events.KeyCodes.SEMICOLON:
    ;
    case goog.events.KeyCodes.DASH:
    ;
    case goog.events.KeyCodes.EQUALS:
    ;
    case goog.events.KeyCodes.COMMA:
    ;
    case goog.events.KeyCodes.PERIOD:
    ;
    case goog.events.KeyCodes.SLASH:
    ;
    case goog.events.KeyCodes.APOSTROPHE:
    ;
    case goog.events.KeyCodes.SINGLE_QUOTE:
    ;
    case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
    ;
    case goog.events.KeyCodes.BACKSLASH:
    ;
    case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      return true;
    default:
      return false
  }
};
goog.provide("goog.events.KeyEvent");
goog.provide("goog.events.KeyHandler");
goog.provide("goog.events.KeyHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyHandler = function(opt_element, opt_capture) {
  goog.events.EventTarget.call(this);
  if(opt_element) {
    this.attach(opt_element, opt_capture)
  }
};
goog.inherits(goog.events.KeyHandler, goog.events.EventTarget);
goog.events.KeyHandler.prototype.element_ = null;
goog.events.KeyHandler.prototype.keyPressKey_ = null;
goog.events.KeyHandler.prototype.keyDownKey_ = null;
goog.events.KeyHandler.prototype.keyUpKey_ = null;
goog.events.KeyHandler.prototype.lastKey_ = -1;
goog.events.KeyHandler.prototype.keyCode_ = -1;
goog.events.KeyHandler.EventType = {KEY:"key"};
goog.events.KeyHandler.safariKey_ = {3:goog.events.KeyCodes.ENTER, 12:goog.events.KeyCodes.NUMLOCK, 63232:goog.events.KeyCodes.UP, 63233:goog.events.KeyCodes.DOWN, 63234:goog.events.KeyCodes.LEFT, 63235:goog.events.KeyCodes.RIGHT, 63236:goog.events.KeyCodes.F1, 63237:goog.events.KeyCodes.F2, 63238:goog.events.KeyCodes.F3, 63239:goog.events.KeyCodes.F4, 63240:goog.events.KeyCodes.F5, 63241:goog.events.KeyCodes.F6, 63242:goog.events.KeyCodes.F7, 63243:goog.events.KeyCodes.F8, 63244:goog.events.KeyCodes.F9, 
63245:goog.events.KeyCodes.F10, 63246:goog.events.KeyCodes.F11, 63247:goog.events.KeyCodes.F12, 63248:goog.events.KeyCodes.PRINT_SCREEN, 63272:goog.events.KeyCodes.DELETE, 63273:goog.events.KeyCodes.HOME, 63275:goog.events.KeyCodes.END, 63276:goog.events.KeyCodes.PAGE_UP, 63277:goog.events.KeyCodes.PAGE_DOWN, 63289:goog.events.KeyCodes.NUMLOCK, 63302:goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.keyIdentifier_ = {"Up":goog.events.KeyCodes.UP, "Down":goog.events.KeyCodes.DOWN, "Left":goog.events.KeyCodes.LEFT, "Right":goog.events.KeyCodes.RIGHT, "Enter":goog.events.KeyCodes.ENTER, "F1":goog.events.KeyCodes.F1, "F2":goog.events.KeyCodes.F2, "F3":goog.events.KeyCodes.F3, "F4":goog.events.KeyCodes.F4, "F5":goog.events.KeyCodes.F5, "F6":goog.events.KeyCodes.F6, "F7":goog.events.KeyCodes.F7, "F8":goog.events.KeyCodes.F8, "F9":goog.events.KeyCodes.F9, "F10":goog.events.KeyCodes.F10, 
"F11":goog.events.KeyCodes.F11, "F12":goog.events.KeyCodes.F12, "U+007F":goog.events.KeyCodes.DELETE, "Home":goog.events.KeyCodes.HOME, "End":goog.events.KeyCodes.END, "PageUp":goog.events.KeyCodes.PAGE_UP, "PageDown":goog.events.KeyCodes.PAGE_DOWN, "Insert":goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_ = {61:187, 59:186};
goog.events.KeyHandler.USES_KEYDOWN_ = goog.userAgent.IE || goog.userAgent.WEBKIT && goog.userAgent.isVersion("525");
goog.events.KeyHandler.prototype.handleKeyDown_ = function(e) {
  if(goog.userAgent.WEBKIT && (this.lastKey_ == goog.events.KeyCodes.CTRL && !e.ctrlKey || this.lastKey_ == goog.events.KeyCodes.ALT && !e.altKey)) {
    this.lastKey_ = -1;
    this.keyCode_ = -1
  }
  if(goog.events.KeyHandler.USES_KEYDOWN_ && !goog.events.KeyCodes.firesKeyPressEvent(e.keyCode, this.lastKey_, e.shiftKey, e.ctrlKey, e.altKey)) {
    this.handleEvent(e)
  }else {
    if(goog.userAgent.GECKO && e.keyCode in goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_) {
      this.keyCode_ = goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_[e.keyCode]
    }else {
      this.keyCode_ = e.keyCode
    }
  }
};
goog.events.KeyHandler.prototype.handleKeyup_ = function(e) {
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var keyCode, charCode;
  if(goog.userAgent.IE && e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = keyCode != goog.events.KeyCodes.ENTER && keyCode != goog.events.KeyCodes.ESC ? be.keyCode : 0
  }else {
    if(goog.userAgent.WEBKIT && e.type == goog.events.EventType.KEYPRESS) {
      keyCode = this.keyCode_;
      charCode = be.charCode >= 0 && be.charCode < 63232 && goog.events.KeyCodes.isCharacterKey(keyCode) ? be.charCode : 0
    }else {
      if(goog.userAgent.OPERA) {
        keyCode = this.keyCode_;
        charCode = goog.events.KeyCodes.isCharacterKey(keyCode) ? be.keyCode : 0
      }else {
        keyCode = be.keyCode || this.keyCode_;
        charCode = be.charCode || 0;
        if(goog.userAgent.MAC && charCode == goog.events.KeyCodes.QUESTION_MARK && !keyCode) {
          keyCode = goog.events.KeyCodes.SLASH
        }
      }
    }
  }
  var key = keyCode;
  var keyIdentifier = be.keyIdentifier;
  if(keyCode) {
    if(keyCode >= 63232 && keyCode in goog.events.KeyHandler.safariKey_) {
      key = goog.events.KeyHandler.safariKey_[keyCode]
    }else {
      if(keyCode == 25 && e.shiftKey) {
        key = 9
      }
    }
  }else {
    if(keyIdentifier && keyIdentifier in goog.events.KeyHandler.keyIdentifier_) {
      key = goog.events.KeyHandler.keyIdentifier_[keyIdentifier]
    }
  }
  var repeat = key == this.lastKey_;
  this.lastKey_ = key;
  var event = new goog.events.KeyEvent(key, charCode, repeat, be);
  try {
    this.dispatchEvent(event)
  }finally {
    event.dispose()
  }
};
goog.events.KeyHandler.prototype.getElement = function() {
  return this.element_
};
goog.events.KeyHandler.prototype.attach = function(element, opt_capture) {
  if(this.keyUpKey_) {
    this.detach()
  }
  this.element_ = element;
  this.keyPressKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYPRESS, this, opt_capture);
  this.keyDownKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYDOWN, this.handleKeyDown_, opt_capture, this);
  this.keyUpKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYUP, this.handleKeyup_, opt_capture, this)
};
goog.events.KeyHandler.prototype.detach = function() {
  if(this.keyPressKey_) {
    goog.events.unlistenByKey(this.keyPressKey_);
    goog.events.unlistenByKey(this.keyDownKey_);
    goog.events.unlistenByKey(this.keyUpKey_);
    this.keyPressKey_ = null;
    this.keyDownKey_ = null;
    this.keyUpKey_ = null
  }
  this.element_ = null;
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.disposeInternal = function() {
  goog.events.KeyHandler.superClass_.disposeInternal.call(this);
  this.detach()
};
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyHandler.EventType.KEY;
  this.keyCode = keyCode;
  this.charCode = charCode;
  this.repeat = repeat
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);
goog.provide("goog.net.xpc.Transport");
goog.require("goog.Disposable");
goog.require("goog.net.xpc");
goog.net.xpc.Transport = function(opt_domHelper) {
  goog.Disposable.call(this);
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper()
};
goog.inherits(goog.net.xpc.Transport, goog.Disposable);
goog.net.xpc.Transport.prototype.transportType = 0;
goog.net.xpc.Transport.prototype.getType = function() {
  return this.transportType
};
goog.net.xpc.Transport.prototype.getWindow = function() {
  return this.domHelper_.getWindow()
};
goog.net.xpc.Transport.prototype.getName = function() {
  return goog.net.xpc.TransportNames[this.transportType] || ""
};
goog.net.xpc.Transport.prototype.transportServiceHandler = goog.abstractMethod;
goog.net.xpc.Transport.prototype.connect = goog.abstractMethod;
goog.net.xpc.Transport.prototype.send = goog.abstractMethod;
goog.provide("goog.net.xpc.FrameElementMethodTransport");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.FrameElementMethodTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.queue_ = [];
  this.deliverQueuedCb_ = goog.bind(this.deliverQueued_, this)
};
goog.inherits(goog.net.xpc.FrameElementMethodTransport, goog.net.xpc.Transport);
goog.net.xpc.FrameElementMethodTransport.prototype.transportType = goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD;
goog.net.xpc.FrameElementMethodTransport.prototype.recursive_ = false;
goog.net.xpc.FrameElementMethodTransport.prototype.timer_ = 0;
goog.net.xpc.FrameElementMethodTransport.outgoing_ = null;
goog.net.xpc.FrameElementMethodTransport.prototype.connect = function() {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER) {
    this.iframeElm_ = this.channel_.iframeElement_;
    this.iframeElm_["XPC_toOuter"] = goog.bind(this.incoming_, this)
  }else {
    this.attemptSetup_()
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.attemptSetup_ = function() {
  var retry = true;
  try {
    if(!this.iframeElm_) {
      this.iframeElm_ = this.getWindow().frameElement
    }
    if(this.iframeElm_ && this.iframeElm_["XPC_toOuter"]) {
      this.outgoing_ = this.iframeElm_["XPC_toOuter"];
      this.iframeElm_["XPC_toOuter"]["XPC_toInner"] = goog.bind(this.incoming_, this);
      retry = false;
      this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
      this.channel_.notifyConnected_()
    }
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e)
  }
  if(retry) {
    if(!this.attemptSetupCb_) {
      this.attemptSetupCb_ = goog.bind(this.attemptSetup_, this)
    }
    this.getWindow().setTimeout(this.attemptSetupCb_, 100)
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.transportServiceHandler = function(payload) {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER && !this.channel_.isConnected() && payload == goog.net.xpc.SETUP_ACK_) {
    this.outgoing_ = this.iframeElm_["XPC_toOuter"]["XPC_toInner"];
    this.channel_.notifyConnected_()
  }else {
    throw Error("Got unexpected transport message.");
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.incoming_ = function(serviceName, payload) {
  if(!this.recursive_ && this.queue_.length == 0) {
    this.channel_.deliver_(serviceName, payload)
  }else {
    this.queue_.push({serviceName:serviceName, payload:payload});
    if(this.queue_.length == 1) {
      this.timer_ = this.getWindow().setTimeout(this.deliverQueuedCb_, 1)
    }
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.deliverQueued_ = function() {
  while(this.queue_.length) {
    var msg = this.queue_.shift();
    this.channel_.deliver_(msg.serviceName, msg.payload)
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.send = function(service, payload) {
  this.recursive_ = true;
  this.outgoing_(service, payload);
  this.recursive_ = false
};
goog.net.xpc.FrameElementMethodTransport.prototype.disposeInternal = function() {
  goog.net.xpc.FrameElementMethodTransport.superClass_.disposeInternal.call(this);
  this.outgoing_ = null;
  this.iframeElm_ = null
};
goog.provide("goog.structs.Trie");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Trie = function(opt_trie) {
  this.childNodes_ = {};
  if(opt_trie) {
    this.setAll(opt_trie)
  }
};
goog.structs.Trie.prototype.value_ = undefined;
goog.structs.Trie.prototype.set = function(key, value) {
  this.setOrAdd_(key, value, false)
};
goog.structs.Trie.prototype.add = function(key, value) {
  this.setOrAdd_(key, value, true)
};
goog.structs.Trie.prototype.setOrAdd_ = function(key, value, opt_add) {
  var node = this;
  for(var characterPosition = 0;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!node.childNodes_[currentCharacter]) {
      node.childNodes_[currentCharacter] = new goog.structs.Trie
    }
    node = node.childNodes_[currentCharacter]
  }
  if(opt_add && node.value_ !== undefined) {
    throw Error('The collection already contains the key "' + key + '"');
  }else {
    node.value_ = value
  }
};
goog.structs.Trie.prototype.setAll = function(trie) {
  var keys = goog.structs.getKeys(trie);
  var values = goog.structs.getValues(trie);
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Trie.prototype.get = function(key) {
  var node = this;
  for(var characterPosition = 0;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!node.childNodes_[currentCharacter]) {
      return undefined
    }
    node = node.childNodes_[currentCharacter]
  }
  return node.value_
};
goog.structs.Trie.prototype.getKeyAndPrefixes = function(key, opt_keyStartIndex) {
  var node = this;
  var matches = {};
  var characterPosition = opt_keyStartIndex || 0;
  if(node.value_ !== undefined) {
    matches[characterPosition] = node.value_
  }
  for(;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!(currentCharacter in node.childNodes_)) {
      break
    }
    node = node.childNodes_[currentCharacter];
    if(node.value_ !== undefined) {
      matches[characterPosition] = node.value_
    }
  }
  return matches
};
goog.structs.Trie.prototype.getValues = function() {
  var allValues = [];
  this.getValuesInternal_(allValues);
  return allValues
};
goog.structs.Trie.prototype.getValuesInternal_ = function(allValues) {
  if(this.value_ !== undefined) {
    allValues.push(this.value_)
  }
  for(var childNode in this.childNodes_) {
    this.childNodes_[childNode].getValuesInternal_(allValues)
  }
};
goog.structs.Trie.prototype.getKeys = function(opt_prefix) {
  var allKeys = [];
  if(opt_prefix) {
    var node = this;
    for(var characterPosition = 0;characterPosition < opt_prefix.length;characterPosition++) {
      var currentCharacter = opt_prefix.charAt(characterPosition);
      if(!node.childNodes_[currentCharacter]) {
        return[]
      }
      node = node.childNodes_[currentCharacter]
    }
    node.getKeysInternal_(opt_prefix, allKeys)
  }else {
    this.getKeysInternal_("", allKeys)
  }
  return allKeys
};
goog.structs.Trie.prototype.getKeysInternal_ = function(keySoFar, allKeys) {
  if(this.value_ !== undefined) {
    allKeys.push(keySoFar)
  }
  for(var childNode in this.childNodes_) {
    this.childNodes_[childNode].getKeysInternal_(keySoFar + childNode, allKeys)
  }
};
goog.structs.Trie.prototype.containsKey = function(key) {
  return this.get(key) !== undefined
};
goog.structs.Trie.prototype.containsValue = function(value) {
  if(this.value_ === value) {
    return true
  }
  for(var childNode in this.childNodes_) {
    if(this.childNodes_[childNode].containsValue(value)) {
      return true
    }
  }
  return false
};
goog.structs.Trie.prototype.clear = function() {
  this.childNodes_ = {};
  this.value_ = undefined
};
goog.structs.Trie.prototype.remove = function(key) {
  var node = this;
  var parents = [];
  for(var characterPosition = 0;characterPosition < key.length;characterPosition++) {
    var currentCharacter = key.charAt(characterPosition);
    if(!node.childNodes_[currentCharacter]) {
      throw Error('The collection does not have the key "' + key + '"');
    }
    parents.push([node, currentCharacter]);
    node = node.childNodes_[currentCharacter]
  }
  var oldValue = node.value_;
  delete node.value_;
  while(parents.length > 0) {
    var currentParentAndCharacter = parents.pop();
    var currentParent = currentParentAndCharacter[0];
    var currentCharacter = currentParentAndCharacter[1];
    if(goog.object.isEmpty(currentParent.childNodes_[currentCharacter].childNodes_)) {
      delete currentParent.childNodes_[currentCharacter]
    }else {
      break
    }
  }
  return oldValue
};
goog.structs.Trie.prototype.clone = function() {
  return new goog.structs.Trie(this)
};
goog.structs.Trie.prototype.getCount = function() {
  return goog.structs.getCount(this.getValues())
};
goog.structs.Trie.prototype.isEmpty = function() {
  return this.value_ === undefined && goog.structs.isEmpty(this.childNodes_)
};
goog.provide("goog.ui.tree.TypeAhead");
goog.provide("goog.ui.tree.TypeAhead.Offset");
goog.require("goog.array");
goog.require("goog.events.KeyCodes");
goog.require("goog.string");
goog.require("goog.structs.Trie");
goog.ui.tree.TypeAhead = function() {
  this.nodeMap_ = new goog.structs.Trie
};
goog.ui.tree.TypeAhead.prototype.nodeMap_;
goog.ui.tree.TypeAhead.prototype.buffer_ = "";
goog.ui.tree.TypeAhead.prototype.matchingLabels_ = null;
goog.ui.tree.TypeAhead.prototype.matchingNodes_ = null;
goog.ui.tree.TypeAhead.prototype.matchingLabelIndex_ = 0;
goog.ui.tree.TypeAhead.prototype.matchingNodeIndex_ = 0;
goog.ui.tree.TypeAhead.Offset = {DOWN:1, UP:-1};
goog.ui.tree.TypeAhead.prototype.handleNavigation = function(e) {
  var handled = false;
  switch(e.keyCode) {
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.UP:
      if(e.ctrlKey) {
        this.jumpTo_(e.keyCode == goog.events.KeyCodes.DOWN ? goog.ui.tree.TypeAhead.Offset.DOWN : goog.ui.tree.TypeAhead.Offset.UP);
        handled = true
      }
      break;
    case goog.events.KeyCodes.BACKSPACE:
      var length = this.buffer_.length - 1;
      handled = true;
      if(length > 0) {
        this.buffer_ = this.buffer_.substring(0, length);
        this.jumpToLabel_(this.buffer_)
      }else {
        if(length == 0) {
          this.buffer_ = ""
        }else {
          handled = false
        }
      }
      break;
    case goog.events.KeyCodes.ESC:
      this.buffer_ = "";
      handled = true;
      break
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.handleTypeAheadChar = function(e) {
  var handled = false;
  if(!e.ctrlKey && !e.altKey) {
    var ch = String.fromCharCode(e.charCode || e.keyCode).toLowerCase();
    if(goog.string.isUnicodeChar(ch) && (ch != " " || this.buffer_)) {
      this.buffer_ += ch;
      handled = this.jumpToLabel_(this.buffer_)
    }
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.setNodeInMap = function(node) {
  var labelText = node.getText();
  if(labelText && !goog.string.isEmptySafe(labelText)) {
    labelText = labelText.toLowerCase();
    var previousValue = this.nodeMap_.get(labelText);
    if(previousValue) {
      previousValue.push(node)
    }else {
      var nodeList = [node];
      this.nodeMap_.set(labelText, nodeList)
    }
  }
};
goog.ui.tree.TypeAhead.prototype.removeNodeFromMap = function(node) {
  var labelText = node.getText();
  if(labelText && !goog.string.isEmptySafe(labelText)) {
    labelText = labelText.toLowerCase();
    var nodeList = this.nodeMap_.get(labelText);
    if(nodeList) {
      goog.array.remove(nodeList, node);
      if(!!nodeList.length) {
        this.nodeMap_.remove(labelText)
      }
    }
  }
};
goog.ui.tree.TypeAhead.prototype.jumpToLabel_ = function(typeAhead) {
  var handled = false;
  var labels = this.nodeMap_.getKeys(typeAhead);
  if(labels && labels.length) {
    this.matchingNodeIndex_ = 0;
    this.matchingLabelIndex_ = 0;
    var nodes = this.nodeMap_.get(labels[0]);
    if(handled = this.selectMatchingNode_(nodes)) {
      this.matchingLabels_ = labels
    }
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.jumpTo_ = function(offset) {
  var handled = false;
  var labels = this.matchingLabels_;
  if(labels) {
    var nodes = null;
    var nodeIndexOutOfRange = false;
    if(this.matchingNodes_) {
      var newNodeIndex = this.matchingNodeIndex_ + offset;
      if(newNodeIndex >= 0 && newNodeIndex < this.matchingNodes_.length) {
        this.matchingNodeIndex_ = newNodeIndex;
        nodes = this.matchingNodes_
      }else {
        nodeIndexOutOfRange = true
      }
    }
    if(!nodes) {
      var newLabelIndex = this.matchingLabelIndex_ + offset;
      if(newLabelIndex >= 0 && newLabelIndex < labels.length) {
        this.matchingLabelIndex_ = newLabelIndex
      }
      if(labels.length > this.matchingLabelIndex_) {
        nodes = this.nodeMap_.get(labels[this.matchingLabelIndex_])
      }
      if(nodes && nodes.length && nodeIndexOutOfRange) {
        this.matchingNodeIndex_ = offset == goog.ui.tree.TypeAhead.Offset.UP ? nodes.length - 1 : 0
      }
    }
    if(handled = this.selectMatchingNode_(nodes)) {
      this.matchingLabels_ = labels
    }
  }
  return handled
};
goog.ui.tree.TypeAhead.prototype.selectMatchingNode_ = function(nodes) {
  var node;
  if(nodes) {
    if(this.matchingNodeIndex_ < nodes.length) {
      node = nodes[this.matchingNodeIndex_];
      this.matchingNodes_ = nodes
    }
    if(node) {
      node.reveal();
      node.select()
    }
  }
  return!!node
};
goog.ui.tree.TypeAhead.prototype.clear = function() {
  this.buffer_ = ""
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.dom.a11y");
goog.provide("goog.dom.a11y.Role");
goog.provide("goog.dom.a11y.State");
goog.require("goog.dom");
goog.dom.a11y.State = {ACTIVEDESCENDANT:"activedescendant", ATOMIC:"atomic", AUTOCOMPLETE:"autocomplete", BUSY:"busy", CHECKED:"checked", CONTROLS:"controls", DESCRIBEDBY:"describedby", DISABLED:"disabled", DROPEFFECT:"dropeffect", EXPANDED:"expanded", FLOWTO:"flowto", GRABBED:"grabbed", HASPOPUP:"haspopup", HIDDEN:"hidden", INVALID:"invalid", LABEL:"label", LABELLEDBY:"labelledby", LEVEL:"level", LIVE:"live", MULTILINE:"multiline", MULTISELECTABLE:"multiselectable", ORIENTATION:"orientation", OWNS:"owns", 
POSINSET:"posinset", PRESSED:"pressed", READONLY:"readonly", RELEVANT:"relevant", REQUIRED:"required", SELECTED:"selected", SETSIZE:"setsize", SORT:"sort", VALUEMAX:"valuemax", VALUEMIN:"valuemin", VALUENOW:"valuenow", VALUETEXT:"valuetext"};
goog.dom.a11y.Role = {ALERT:"alert", ALERTDIALOG:"alertdialog", APPLICATION:"application", ARTICLE:"article", BANNER:"banner", BUTTON:"button", CHECKBOX:"checkbox", COLUMNHEADER:"columnheader", COMBOBOX:"combobox", COMPLEMENTARY:"complementary", DIALOG:"dialog", DIRECTORY:"directory", DOCUMENT:"document", FORM:"form", GRID:"grid", GRIDCELL:"gridcell", GROUP:"group", HEADING:"heading", IMG:"img", LINK:"link", LIST:"list", LISTBOX:"listbox", LISTITEM:"listitem", LOG:"log", MAIN:"main", MARQUEE:"marquee", 
MATH:"math", MENU:"menu", MENUBAR:"menubar", MENU_ITEM:"menuitem", MENU_ITEM_CHECKBOX:"menuitemcheckbox", MENU_ITEM_RADIO:"menuitemradio", NAVIGATION:"navigation", NOTE:"note", OPTION:"option", PRESENTATION:"presentation", PROGRESSBAR:"progressbar", RADIO:"radio", RADIOGROUP:"radiogroup", REGION:"region", ROW:"row", ROWGROUP:"rowgroup", ROWHEADER:"rowheader", SCROLLBAR:"scrollbar", SEARCH:"search", SEPARATOR:"separator", SLIDER:"slider", SPINBUTTON:"spinbutton", STATUS:"status", TAB:"tab", TAB_LIST:"tablist", 
TAB_PANEL:"tabpanel", TEXTBOX:"textbox", TIMER:"timer", TOOLBAR:"toolbar", TOOLTIP:"tooltip", TREE:"tree", TREEGRID:"treegrid", TREEITEM:"treeitem"};
goog.dom.a11y.setRole = function(element, roleName) {
  element.setAttribute("role", roleName);
  element.roleName = roleName
};
goog.dom.a11y.getRole = function(element) {
  return element.roleName || ""
};
goog.dom.a11y.setState = function(element, state, value) {
  element.setAttribute("aria-" + state, value)
};
goog.dom.a11y.getState = function(element, stateName) {
  var attrb = element.getAttribute("aria-" + stateName);
  if(attrb === true || attrb === false) {
    return attrb ? "true" : "false"
  }else {
    if(!attrb) {
      return""
    }else {
      return String(attrb)
    }
  }
};
goog.dom.a11y.getActiveDescendant = function(element) {
  var id = goog.dom.a11y.getState(element, goog.dom.a11y.State.ACTIVEDESCENDANT);
  return goog.dom.getOwnerDocument(element).getElementById(id)
};
goog.dom.a11y.setActiveDescendant = function(element, activeElement) {
  goog.dom.a11y.setState(element, goog.dom.a11y.State.ACTIVEDESCENDANT, activeElement ? activeElement.id : "")
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.ui.IdGenerator");
goog.ui.IdGenerator = function() {
};
goog.addSingletonGetter(goog.ui.IdGenerator);
goog.ui.IdGenerator.prototype.nextId_ = 0;
goog.ui.IdGenerator.prototype.getNextUniqueId = function() {
  return":" + (this.nextId_++).toString(36)
};
goog.ui.IdGenerator.instance = goog.ui.IdGenerator.getInstance();
goog.provide("goog.ui.Component");
goog.provide("goog.ui.Component.Error");
goog.provide("goog.ui.Component.EventType");
goog.provide("goog.ui.Component.State");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.DomHelper");
goog.require("goog.events");
goog.require("goog.events.Event");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventTarget");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.ui.IdGenerator");
goog.ui.Component = function(opt_domHelper) {
  goog.events.EventTarget.call(this);
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();
  this.rightToLeft_ = goog.ui.Component.defaultRightToLeft_
};
goog.inherits(goog.ui.Component, goog.events.EventTarget);
goog.ui.Component.prototype.idGenerator_ = goog.ui.IdGenerator.getInstance();
goog.ui.Component.defaultRightToLeft_ = null;
goog.ui.Component.EventType = {BEFORE_SHOW:"beforeshow", SHOW:"show", HIDE:"hide", DISABLE:"disable", ENABLE:"enable", HIGHLIGHT:"highlight", UNHIGHLIGHT:"unhighlight", ACTIVATE:"activate", DEACTIVATE:"deactivate", SELECT:"select", UNSELECT:"unselect", CHECK:"check", UNCHECK:"uncheck", FOCUS:"focus", BLUR:"blur", OPEN:"open", CLOSE:"close", ENTER:"enter", LEAVE:"leave", ACTION:"action", CHANGE:"change"};
goog.ui.Component.Error = {NOT_SUPPORTED:"Method not supported", DECORATE_INVALID:"Invalid element to decorate", ALREADY_RENDERED:"Component already rendered", PARENT_UNABLE_TO_BE_SET:"Unable to set parent component", CHILD_INDEX_OUT_OF_BOUNDS:"Child component index out of bounds", NOT_OUR_CHILD:"Child is not in parent component", NOT_IN_DOCUMENT:"Operation not supported while component is not in document", STATE_INVALID:"Invalid component state"};
goog.ui.Component.State = {ALL:255, DISABLED:1, HOVER:2, ACTIVE:4, SELECTED:8, CHECKED:16, FOCUSED:32, OPENED:64};
goog.ui.Component.getStateTransitionEvent = function(state, isEntering) {
  switch(state) {
    case goog.ui.Component.State.DISABLED:
      return isEntering ? goog.ui.Component.EventType.DISABLE : goog.ui.Component.EventType.ENABLE;
    case goog.ui.Component.State.HOVER:
      return isEntering ? goog.ui.Component.EventType.HIGHLIGHT : goog.ui.Component.EventType.UNHIGHLIGHT;
    case goog.ui.Component.State.ACTIVE:
      return isEntering ? goog.ui.Component.EventType.ACTIVATE : goog.ui.Component.EventType.DEACTIVATE;
    case goog.ui.Component.State.SELECTED:
      return isEntering ? goog.ui.Component.EventType.SELECT : goog.ui.Component.EventType.UNSELECT;
    case goog.ui.Component.State.CHECKED:
      return isEntering ? goog.ui.Component.EventType.CHECK : goog.ui.Component.EventType.UNCHECK;
    case goog.ui.Component.State.FOCUSED:
      return isEntering ? goog.ui.Component.EventType.FOCUS : goog.ui.Component.EventType.BLUR;
    case goog.ui.Component.State.OPENED:
      return isEntering ? goog.ui.Component.EventType.OPEN : goog.ui.Component.EventType.CLOSE;
    default:
  }
  throw Error(goog.ui.Component.Error.STATE_INVALID);
};
goog.ui.Component.setDefaultRightToLeft = function(rightToLeft) {
  goog.ui.Component.defaultRightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.id_ = null;
goog.ui.Component.prototype.dom_;
goog.ui.Component.prototype.inDocument_ = false;
goog.ui.Component.prototype.element_ = null;
goog.ui.Component.prototype.googUiComponentHandler_;
goog.ui.Component.prototype.rightToLeft_ = null;
goog.ui.Component.prototype.model_ = null;
goog.ui.Component.prototype.parent_ = null;
goog.ui.Component.prototype.children_ = null;
goog.ui.Component.prototype.childIndex_ = null;
goog.ui.Component.prototype.wasDecorated_ = false;
goog.ui.Component.prototype.getId = function() {
  return this.id_ || (this.id_ = this.idGenerator_.getNextUniqueId())
};
goog.ui.Component.prototype.setId = function(id) {
  if(this.parent_ && this.parent_.childIndex_) {
    goog.object.remove(this.parent_.childIndex_, this.id_);
    goog.object.add(this.parent_.childIndex_, id, this)
  }
  this.id_ = id
};
goog.ui.Component.prototype.getElement = function() {
  return this.element_
};
goog.ui.Component.prototype.setElementInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.getHandler = function() {
  return this.googUiComponentHandler_ || (this.googUiComponentHandler_ = new goog.events.EventHandler(this))
};
goog.ui.Component.prototype.setParent = function(parent) {
  if(this == parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  if(parent && this.parent_ && this.id_ && this.parent_.getChild(this.id_) && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  this.parent_ = parent;
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getParent = function() {
  return this.parent_
};
goog.ui.Component.prototype.setParentEventTarget = function(parent) {
  if(this.parent_ && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.NOT_SUPPORTED);
  }
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getDomHelper = function() {
  return this.dom_
};
goog.ui.Component.prototype.isInDocument = function() {
  return this.inDocument_
};
goog.ui.Component.prototype.createDom = function() {
  this.element_ = this.dom_.createElement("div")
};
goog.ui.Component.prototype.render = function(opt_parentElement) {
  this.render_(opt_parentElement)
};
goog.ui.Component.prototype.renderBefore = function(siblingElement) {
  this.render_(siblingElement.parentNode, siblingElement)
};
goog.ui.Component.prototype.render_ = function(opt_parentElement, opt_beforeElement) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!this.element_) {
    this.createDom()
  }
  if(opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeElement || null)
  }else {
    this.dom_.getDocument().body.appendChild(this.element_)
  }
  if(!this.parent_ || this.parent_.isInDocument()) {
    this.enterDocument()
  }
};
goog.ui.Component.prototype.decorate = function(element) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }else {
    if(element && this.canDecorate(element)) {
      this.wasDecorated_ = true;
      if(!this.dom_ || this.dom_.getDocument() != goog.dom.getOwnerDocument(element)) {
        this.dom_ = goog.dom.getDomHelper(element)
      }
      this.decorateInternal(element);
      this.enterDocument()
    }else {
      throw Error(goog.ui.Component.Error.DECORATE_INVALID);
    }
  }
};
goog.ui.Component.prototype.canDecorate = function(element) {
  return true
};
goog.ui.Component.prototype.wasDecorated = function() {
  return this.wasDecorated_
};
goog.ui.Component.prototype.decorateInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.enterDocument = function() {
  this.inDocument_ = true;
  this.forEachChild(function(child) {
    if(!child.isInDocument() && child.getElement()) {
      child.enterDocument()
    }
  })
};
goog.ui.Component.prototype.exitDocument = function() {
  this.forEachChild(function(child) {
    if(child.isInDocument()) {
      child.exitDocument()
    }
  });
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.removeAll()
  }
  this.inDocument_ = false
};
goog.ui.Component.prototype.disposeInternal = function() {
  goog.ui.Component.superClass_.disposeInternal.call(this);
  if(this.inDocument_) {
    this.exitDocument()
  }
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.dispose();
    delete this.googUiComponentHandler_
  }
  this.forEachChild(function(child) {
    child.dispose()
  });
  if(!this.wasDecorated_ && this.element_) {
    goog.dom.removeNode(this.element_)
  }
  this.children_ = null;
  this.childIndex_ = null;
  this.element_ = null;
  this.model_ = null;
  this.parent_ = null
};
goog.ui.Component.prototype.makeId = function(idFragment) {
  return this.getId() + "." + idFragment
};
goog.ui.Component.prototype.getModel = function() {
  return this.model_
};
goog.ui.Component.prototype.setModel = function(obj) {
  this.model_ = obj
};
goog.ui.Component.prototype.getFragmentFromId = function(id) {
  return id.substring(this.getId().length + 1)
};
goog.ui.Component.prototype.getElementByFragment = function(idFragment) {
  if(!this.inDocument_) {
    throw Error(goog.ui.Component.Error.NOT_IN_DOCUMENT);
  }
  return this.dom_.getElement(this.makeId(idFragment))
};
goog.ui.Component.prototype.addChild = function(child, opt_render) {
  this.addChildAt(child, this.getChildCount(), opt_render)
};
goog.ui.Component.prototype.addChildAt = function(child, index, opt_render) {
  if(child.inDocument_ && (opt_render || !this.inDocument_)) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(index < 0 || index > this.getChildCount()) {
    throw Error(goog.ui.Component.Error.CHILD_INDEX_OUT_OF_BOUNDS);
  }
  if(!this.childIndex_ || !this.children_) {
    this.childIndex_ = {};
    this.children_ = []
  }
  if(child.getParent() == this) {
    goog.object.set(this.childIndex_, child.getId(), child);
    goog.array.remove(this.children_, child)
  }else {
    goog.object.add(this.childIndex_, child.getId(), child)
  }
  child.setParent(this);
  goog.array.insertAt(this.children_, child, index);
  if(child.inDocument_ && this.inDocument_ && child.getParent() == this) {
    var contentElement = this.getContentElement();
    contentElement.insertBefore(child.getElement(), contentElement.childNodes[index] || null)
  }else {
    if(opt_render) {
      if(!this.element_) {
        this.createDom()
      }
      var sibling = this.getChildAt(index + 1);
      child.render_(this.getContentElement(), sibling ? sibling.element_ : null)
    }else {
      if(this.inDocument_ && !child.inDocument_ && child.element_) {
        child.enterDocument()
      }
    }
  }
};
goog.ui.Component.prototype.getContentElement = function() {
  return this.element_
};
goog.ui.Component.prototype.isRightToLeft = function() {
  if(this.rightToLeft_ == null) {
    this.rightToLeft_ = goog.style.isRightToLeft(this.inDocument_ ? this.element_ : this.dom_.getDocument().body)
  }
  return this.rightToLeft_
};
goog.ui.Component.prototype.setRightToLeft = function(rightToLeft) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.rightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.hasChildren = function() {
  return!!this.children_ && this.children_.length != 0
};
goog.ui.Component.prototype.getChildCount = function() {
  return this.children_ ? this.children_.length : 0
};
goog.ui.Component.prototype.getChildIds = function() {
  var ids = [];
  this.forEachChild(function(child) {
    ids.push(child.getId())
  });
  return ids
};
goog.ui.Component.prototype.getChild = function(id) {
  return this.childIndex_ && id ? goog.object.get(this.childIndex_, id) || null : null
};
goog.ui.Component.prototype.getChildAt = function(index) {
  return this.children_ ? this.children_[index] || null : null
};
goog.ui.Component.prototype.forEachChild = function(f, opt_obj) {
  if(this.children_) {
    goog.array.forEach(this.children_, f, opt_obj)
  }
};
goog.ui.Component.prototype.indexOfChild = function(child) {
  return this.children_ && child ? goog.array.indexOf(this.children_, child) : -1
};
goog.ui.Component.prototype.removeChild = function(child, opt_unrender) {
  if(child) {
    var id = goog.isString(child) ? child : child.getId();
    child = this.getChild(id);
    if(id && child) {
      goog.object.remove(this.childIndex_, id);
      goog.array.remove(this.children_, child);
      if(opt_unrender) {
        child.exitDocument();
        if(child.element_) {
          goog.dom.removeNode(child.element_)
        }
      }
      child.setParent(null)
    }
  }
  if(!child) {
    throw Error(goog.ui.Component.Error.NOT_OUR_CHILD);
  }
  return child
};
goog.ui.Component.prototype.removeChildAt = function(index, opt_unrender) {
  return this.removeChild(this.getChildAt(index), opt_unrender)
};
goog.ui.Component.prototype.removeChildren = function(opt_unrender) {
  while(this.hasChildren()) {
    this.removeChildAt(0, opt_unrender)
  }
};
goog.provide("goog.ui.tree.BaseNode");
goog.provide("goog.ui.tree.BaseNode.EventType");
goog.require("goog.Timer");
goog.require("goog.asserts");
goog.require("goog.dom.a11y");
goog.require("goog.events.KeyCodes");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.style");
goog.require("goog.ui.Component");
goog.require("goog.userAgent");
goog.ui.tree.BaseNode = function(html, opt_config, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.config_ = opt_config || goog.ui.tree.TreeControl.defaultConfig;
  this.html_ = html
};
goog.inherits(goog.ui.tree.BaseNode, goog.ui.Component);
goog.ui.tree.BaseNode.EventType = {BEFORE_EXPAND:"beforeexpand", EXPAND:"expand", BEFORE_COLLAPSE:"beforecollapse", COLLAPSE:"collapse"};
goog.ui.tree.BaseNode.allNodes = {};
goog.ui.tree.BaseNode.prototype.selected_ = false;
goog.ui.tree.BaseNode.prototype.expanded_ = false;
goog.ui.tree.BaseNode.prototype.toolTip_ = null;
goog.ui.tree.BaseNode.prototype.afterLabelHtml_ = "";
goog.ui.tree.BaseNode.prototype.isUserCollapsible_ = true;
goog.ui.tree.BaseNode.prototype.depth_ = -1;
goog.ui.tree.BaseNode.prototype.disposeInternal = function() {
  goog.ui.tree.BaseNode.superClass_.disposeInternal.call(this);
  if(this.tree_) {
    this.tree_.removeNode(this);
    this.tree_ = null
  }
  this.setElementInternal(null)
};
goog.ui.tree.BaseNode.prototype.initAccessibility = function() {
  var el = this.getElement();
  if(el) {
    var label = this.getLabelElement();
    if(label && !label.id) {
      label.id = this.getId() + ".label"
    }
    goog.dom.a11y.setRole(el, "treeitem");
    goog.dom.a11y.setState(el, "selected", false);
    goog.dom.a11y.setState(el, "expanded", false);
    goog.dom.a11y.setState(el, "level", this.getDepth());
    if(label) {
      goog.dom.a11y.setState(el, "labelledby", label.id)
    }
    var img = this.getIconElement();
    if(img) {
      goog.dom.a11y.setRole(img, "presentation")
    }
    var ei = this.getExpandIconElement();
    if(ei) {
      goog.dom.a11y.setRole(ei, "presentation")
    }
    var ce = this.getChildrenElement();
    goog.dom.a11y.setRole(ce, "group");
    if(ce.hasChildNodes()) {
      var count = this.getChildCount();
      for(var i = 1;i <= count;i++) {
        var child = this.getChildAt(i - 1).getElement();
        goog.dom.a11y.setState(child, "setsize", count);
        goog.dom.a11y.setState(child, "posinset", i)
      }
    }
  }
};
goog.ui.tree.BaseNode.prototype.createDom = function() {
  var sb = new goog.string.StringBuffer;
  this.toHtml(sb);
  var element = this.getDomHelper().htmlToDocumentFragment(sb.toString());
  this.setElementInternal(element)
};
goog.ui.tree.BaseNode.prototype.enterDocument = function() {
  goog.ui.tree.BaseNode.superClass_.enterDocument.call(this);
  goog.ui.tree.BaseNode.allNodes[this.getId()] = this;
  this.initAccessibility()
};
goog.ui.tree.BaseNode.prototype.exitDocument = function() {
  goog.ui.tree.BaseNode.superClass_.exitDocument.call(this);
  delete goog.ui.tree.BaseNode.allNodes[this.getId()]
};
goog.ui.tree.BaseNode.prototype.addChildAt = function(child, index, opt_render) {
  goog.asserts.assert(!child.getParent());
  var prevNode = this.getChildAt(index - 1);
  var nextNode = this.getChildAt(index);
  goog.ui.tree.BaseNode.superClass_.addChildAt.call(this, child, index);
  child.previousSibling_ = prevNode;
  child.nextSibling_ = nextNode;
  if(prevNode) {
    prevNode.nextSibling_ = child
  }else {
    this.firstChild_ = child
  }
  if(nextNode) {
    nextNode.previousSibling_ = child
  }else {
    this.lastChild_ = child
  }
  var tree = this.getTree();
  if(tree) {
    child.setTreeInternal(tree)
  }
  child.setDepth_(this.getDepth() + 1);
  if(this.getElement()) {
    this.updateExpandIcon();
    if(this.getExpanded()) {
      var el = this.getChildrenElement();
      if(!child.getElement()) {
        child.createDom()
      }
      var childElement = child.getElement();
      var nextElement = nextNode && nextNode.getElement();
      el.insertBefore(childElement, nextElement);
      if(this.isInDocument()) {
        child.enterDocument()
      }
      if(!nextNode) {
        if(prevNode) {
          prevNode.updateExpandIcon()
        }else {
          goog.style.showElement(el, true);
          this.setExpanded(this.getExpanded())
        }
      }
    }
  }
};
goog.ui.tree.BaseNode.prototype.add = function(child, opt_before) {
  goog.asserts.assert(!opt_before || opt_before.getParent() == this, "Can only add nodes before siblings");
  if(child.getParent()) {
    child.getParent().removeChild(child)
  }
  this.addChildAt(child, opt_before ? this.indexOfChild(opt_before) : this.getChildCount());
  return child
};
goog.ui.tree.BaseNode.prototype.removeChild = function(childNode, opt_unrender) {
  var child = childNode;
  var tree = this.getTree();
  var selectedNode = tree ? tree.getSelectedItem() : null;
  if(selectedNode == child || child.contains(selectedNode)) {
    if(tree.hasFocus()) {
      this.select();
      goog.Timer.callOnce(this.onTimeoutSelect_, 10, this)
    }else {
      this.select()
    }
  }
  goog.ui.tree.BaseNode.superClass_.removeChild.call(this, child);
  if(this.lastChild_ == child) {
    this.lastChild_ = child.previousSibling_
  }
  if(this.firstChild_ == child) {
    this.firstChild_ = child.nextSibling_
  }
  if(child.previousSibling_) {
    child.previousSibling_.nextSibling_ = child.nextSibling_
  }
  if(child.nextSibling_) {
    child.nextSibling_.previousSibling_ = child.previousSibling_
  }
  var wasLast = child.isLastSibling();
  child.tree_ = null;
  child.depth_ = -1;
  if(tree) {
    tree.removeNode(this);
    if(this.isInDocument()) {
      var el = this.getChildrenElement();
      if(child.isInDocument()) {
        var childEl = child.getElement();
        el.removeChild(childEl);
        child.exitDocument()
      }
      if(wasLast) {
        var newLast = this.getLastChild();
        if(newLast) {
          newLast.updateExpandIcon()
        }
      }
      if(!this.hasChildren()) {
        el.style.display = "none";
        this.updateExpandIcon();
        this.updateIcon_()
      }
    }
  }
  return child
};
goog.ui.tree.BaseNode.prototype.remove = goog.ui.tree.BaseNode.prototype.removeChild;
goog.ui.tree.BaseNode.prototype.onTimeoutSelect_ = function() {
  this.select()
};
goog.ui.tree.BaseNode.prototype.getTree = goog.abstractMethod;
goog.ui.tree.BaseNode.prototype.getDepth = function() {
  var depth = this.depth_;
  if(depth < 0) {
    depth = this.computeDepth_();
    this.setDepth_(depth)
  }
  return depth
};
goog.ui.tree.BaseNode.prototype.computeDepth_ = function() {
  var parent = this.getParent();
  if(parent) {
    return parent.getDepth() + 1
  }else {
    return 0
  }
};
goog.ui.tree.BaseNode.prototype.setDepth_ = function(depth) {
  if(depth != this.depth_) {
    this.depth_ = depth;
    var row = this.getRowElement();
    if(row) {
      var indent = this.getPixelIndent_() + "px";
      if(this.isRightToLeft()) {
        row.style.paddingRight = indent
      }else {
        row.style.paddingLeft = indent
      }
    }
    this.forEachChild(function(child) {
      child.setDepth_(depth + 1)
    })
  }
};
goog.ui.tree.BaseNode.prototype.contains = function(node) {
  while(node) {
    if(node == this) {
      return true
    }
    node = node.getParent()
  }
  return false
};
goog.ui.tree.BaseNode.EMPTY_CHILDREN_ = [];
goog.ui.tree.BaseNode.prototype.getChildAt;
goog.ui.tree.BaseNode.prototype.getChildren = function() {
  var children = [];
  this.forEachChild(function(child) {
    children.push(child)
  });
  return children
};
goog.ui.tree.BaseNode.prototype.getFirstChild = function() {
  return this.getChildAt(0)
};
goog.ui.tree.BaseNode.prototype.getLastChild = function() {
  return this.getChildAt(this.getChildCount() - 1)
};
goog.ui.tree.BaseNode.prototype.getPreviousSibling = function() {
  return this.previousSibling_
};
goog.ui.tree.BaseNode.prototype.getNextSibling = function() {
  return this.nextSibling_
};
goog.ui.tree.BaseNode.prototype.isLastSibling = function() {
  return!this.nextSibling_
};
goog.ui.tree.BaseNode.prototype.isSelected = function() {
  return this.selected_
};
goog.ui.tree.BaseNode.prototype.select = function() {
  var tree = this.getTree();
  if(tree) {
    tree.setSelectedItem(this)
  }
};
goog.ui.tree.BaseNode.prototype.deselect = goog.nullFunction;
goog.ui.tree.BaseNode.prototype.setSelectedInternal = function(selected) {
  if(this.selected_ == selected) {
    return
  }
  this.selected_ = selected;
  this.updateRow();
  var el = this.getElement();
  if(el) {
    goog.dom.a11y.setState(el, "selected", selected);
    if(selected) {
      goog.dom.a11y.setState(this.getTree().getElement(), "activedescendant", this.getId())
    }
  }
};
goog.ui.tree.BaseNode.prototype.getExpanded = function() {
  return this.expanded_
};
goog.ui.tree.BaseNode.prototype.setExpandedInternal = function(expanded) {
  this.expanded_ = expanded
};
goog.ui.tree.BaseNode.prototype.setExpanded = function(expanded) {
  var isStateChange = expanded != this.expanded_;
  if(isStateChange) {
    var prevented = !this.dispatchEvent(expanded ? goog.ui.tree.BaseNode.EventType.BEFORE_EXPAND : goog.ui.tree.BaseNode.EventType.BEFORE_COLLAPSE);
    if(prevented) {
      return
    }
  }
  var ce;
  this.expanded_ = expanded;
  var tree = this.getTree();
  var el = this.getElement();
  if(this.hasChildren()) {
    if(!expanded && tree && this.contains(tree.getSelectedItem())) {
      this.select()
    }
    if(el) {
      ce = this.getChildrenElement();
      if(ce) {
        goog.style.showElement(ce, expanded);
        if(expanded && this.isInDocument() && !ce.hasChildNodes()) {
          var sb = new goog.string.StringBuffer;
          this.forEachChild(function(child) {
            child.toHtml(sb)
          });
          ce.innerHTML = sb.toString();
          this.forEachChild(function(child) {
            child.enterDocument()
          })
        }
      }
      this.updateExpandIcon()
    }
  }else {
    ce = this.getChildrenElement();
    if(ce) {
      goog.style.showElement(ce, false)
    }
  }
  if(el) {
    this.updateIcon_();
    goog.dom.a11y.setState(el, "expanded", expanded)
  }
  if(isStateChange) {
    this.dispatchEvent(expanded ? goog.ui.tree.BaseNode.EventType.EXPAND : goog.ui.tree.BaseNode.EventType.COLLAPSE)
  }
};
goog.ui.tree.BaseNode.prototype.toggle = function() {
  this.setExpanded(!this.getExpanded())
};
goog.ui.tree.BaseNode.prototype.expand = function() {
  this.setExpanded(true)
};
goog.ui.tree.BaseNode.prototype.collapse = function() {
  this.setExpanded(false)
};
goog.ui.tree.BaseNode.prototype.collapseChildren = function() {
  this.forEachChild(function(child) {
    child.collapseAll()
  })
};
goog.ui.tree.BaseNode.prototype.collapseAll = function() {
  this.collapseChildren();
  this.collapse()
};
goog.ui.tree.BaseNode.prototype.expandChildren = function() {
  this.forEachChild(function(child) {
    child.expandAll()
  })
};
goog.ui.tree.BaseNode.prototype.expandAll = function() {
  this.expandChildren();
  this.expand()
};
goog.ui.tree.BaseNode.prototype.reveal = function() {
  var parent = this.getParent();
  if(parent) {
    parent.setExpanded(true);
    parent.reveal()
  }
};
goog.ui.tree.BaseNode.prototype.setIsUserCollapsible = function(isCollapsible) {
  this.isUserCollapsible_ = isCollapsible;
  if(!this.isUserCollapsible_) {
    this.expand()
  }
  if(this.getElement()) {
    this.updateExpandIcon()
  }
};
goog.ui.tree.BaseNode.prototype.isUserCollapsible = function() {
  return this.isUserCollapsible_
};
goog.ui.tree.BaseNode.prototype.toHtml = function(sb) {
  var tree = this.getTree();
  var hideLines = !tree.getShowLines() || tree == this.getParent() && !tree.getShowRootLines();
  var childClass = hideLines ? this.config_.cssChildrenNoLines : this.config_.cssChildren;
  var nonEmptyAndExpanded = this.getExpanded() && this.hasChildren();
  sb.append('<div class="', this.config_.cssItem, '" id="', this.getId(), '">', this.getRowHtml(), '<div class="', childClass, '" style="', this.getLineStyle(), nonEmptyAndExpanded ? "" : "display:none;", '">');
  if(nonEmptyAndExpanded) {
    this.forEachChild(function(child) {
      child.toHtml(sb)
    })
  }
  sb.append("</div></div>")
};
goog.ui.tree.BaseNode.prototype.getPixelIndent_ = function() {
  return Math.max(0, (this.getDepth() - 1) * this.config_.indentWidth)
};
goog.ui.tree.BaseNode.prototype.getRowHtml = function() {
  var sb = new goog.string.StringBuffer;
  sb.append('<div class="', this.getRowClassName(), '" style="padding-', this.isRightToLeft() ? "right:" : "left:", this.getPixelIndent_(), 'px">', this.getExpandIconHtml(), this.getIconHtml(), this.getLabelHtml(), "</div>");
  return sb.toString()
};
goog.ui.tree.BaseNode.prototype.getRowClassName = function() {
  var selectedClass;
  if(this.isSelected()) {
    selectedClass = " " + this.config_.cssSelectedRow
  }else {
    selectedClass = ""
  }
  return this.config_.cssTreeRow + selectedClass
};
goog.ui.tree.BaseNode.prototype.getLabelHtml = function() {
  var toolTip = this.getToolTip();
  var sb = new goog.string.StringBuffer;
  sb.append('<span class="', this.config_.cssItemLabel, '"', toolTip ? ' title="' + goog.string.htmlEscape(toolTip) + '"' : "", ">", this.getHtml(), "</span>", "<span>", this.getAfterLabelHtml(), "</span>");
  return sb.toString()
};
goog.ui.tree.BaseNode.prototype.getAfterLabelHtml = function() {
  return this.afterLabelHtml_
};
goog.ui.tree.BaseNode.prototype.setAfterLabelHtml = function(html) {
  this.afterLabelHtml_ = html;
  var el = this.getAfterLabelElement();
  if(el) {
    el.innerHTML = html
  }
};
goog.ui.tree.BaseNode.prototype.getIconHtml = function() {
  var iconClass = this.getCalculatedIconClass();
  if(iconClass) {
    return goog.string.buildString('<img class="', iconClass, '" src="', this.config_.cleardotPath, '">')
  }else {
    return goog.string.buildString('<img style="display:none"', '" src="', this.config_.cleardotPath, '">')
  }
};
goog.ui.tree.BaseNode.prototype.getCalculatedIconClass = goog.abstractMethod;
goog.ui.tree.BaseNode.prototype.getExpandIconHtml = function() {
  return goog.string.buildString('<img type="expand" class="', this.getExpandIconClass(), '" src="', this.config_.cleardotPath + '">')
};
goog.ui.tree.BaseNode.prototype.getExpandIconClass = function() {
  var tree = this.getTree();
  var hideLines = !tree.getShowLines() || tree == this.getParent() && !tree.getShowRootLines();
  var config = this.config_;
  var sb = new goog.string.StringBuffer;
  sb.append(config.cssTreeIcon, " ", config.cssExpandTreeIcon, " ");
  if(this.hasChildren()) {
    var bits = 0;
    if(tree.getShowExpandIcons() && this.isUserCollapsible_) {
      if(this.getExpanded()) {
        bits = 2
      }else {
        bits = 1
      }
    }
    if(!hideLines) {
      if(this.isLastSibling()) {
        bits += 4
      }else {
        bits += 8
      }
    }
    switch(bits) {
      case 1:
        sb.append(config.cssExpandTreeIconPlus);
        break;
      case 2:
        sb.append(config.cssExpandTreeIconMinus);
        break;
      case 4:
        sb.append(config.cssExpandTreeIconL);
        break;
      case 5:
        sb.append(config.cssExpandTreeIconLPlus);
        break;
      case 6:
        sb.append(config.cssExpandTreeIconLMinus);
        break;
      case 8:
        sb.append(config.cssExpandTreeIconT);
        break;
      case 9:
        sb.append(config.cssExpandTreeIconTPlus);
        break;
      case 10:
        sb.append(config.cssExpandTreeIconTMinus);
        break;
      default:
        sb.append(config.cssExpandTreeIconBlank)
    }
  }else {
    if(hideLines) {
      sb.append(config.cssExpandTreeIconBlank)
    }else {
      if(this.isLastSibling()) {
        sb.append(config.cssExpandTreeIconL)
      }else {
        sb.append(config.cssExpandTreeIconT)
      }
    }
  }
  return sb.toString()
};
goog.ui.tree.BaseNode.prototype.getLineStyle = function() {
  return goog.string.buildString("background-position:", this.getLineStyle2(), ";")
};
goog.ui.tree.BaseNode.prototype.getLineStyle2 = function() {
  return(this.isLastSibling() ? "-100" : (this.getDepth() - 1) * this.config_.indentWidth) + "px 0"
};
goog.ui.tree.BaseNode.prototype.getElement = function() {
  var el = goog.ui.tree.BaseNode.superClass_.getElement.call(this);
  if(!el) {
    el = this.getDomHelper().getElement(this.getId());
    this.setElementInternal(el)
  }
  return el
};
goog.ui.tree.BaseNode.prototype.getRowElement = function() {
  var el = this.getElement();
  return el ? el.firstChild : null
};
goog.ui.tree.BaseNode.prototype.getExpandIconElement = function() {
  var el = this.getRowElement();
  return el ? el.firstChild : null
};
goog.ui.tree.BaseNode.prototype.getIconElement = function() {
  var el = this.getRowElement();
  return el ? el.childNodes[1] : null
};
goog.ui.tree.BaseNode.prototype.getLabelElement = function() {
  var el = this.getRowElement();
  return el && el.lastChild ? el.lastChild.previousSibling : null
};
goog.ui.tree.BaseNode.prototype.getAfterLabelElement = function() {
  var el = this.getRowElement();
  return el ? el.lastChild : null
};
goog.ui.tree.BaseNode.prototype.getChildrenElement = function() {
  var el = this.getElement();
  return el ? el.lastChild : null
};
goog.ui.tree.BaseNode.prototype.setIconClass = function(s) {
  this.iconClass_ = s;
  if(this.isInDocument()) {
    this.updateIcon_()
  }
};
goog.ui.tree.BaseNode.prototype.getIconClass = function() {
  return this.iconClass_
};
goog.ui.tree.BaseNode.prototype.setExpandedIconClass = function(s) {
  this.expandedIconClass_ = s;
  if(this.isInDocument()) {
    this.updateIcon_()
  }
};
goog.ui.tree.BaseNode.prototype.getExpandedIconClass = function() {
  return this.expandedIconClass_
};
goog.ui.tree.BaseNode.prototype.setText = function(s) {
  this.setHtml(goog.string.htmlEscape(s))
};
goog.ui.tree.BaseNode.prototype.getText = function() {
  return goog.string.unescapeEntities(this.getHtml())
};
goog.ui.tree.BaseNode.prototype.setHtml = function(s) {
  this.html_ = s;
  var el = this.getLabelElement();
  if(el) {
    el.innerHTML = s
  }
  var tree = this.getTree();
  if(tree) {
    tree.setNode(this)
  }
};
goog.ui.tree.BaseNode.prototype.getHtml = function() {
  return this.html_
};
goog.ui.tree.BaseNode.prototype.setToolTip = function(s) {
  this.toolTip_ = s;
  var el = this.getLabelElement();
  if(el) {
    el.title = s
  }
};
goog.ui.tree.BaseNode.prototype.getToolTip = function() {
  return this.toolTip_
};
goog.ui.tree.BaseNode.prototype.updateRow = function() {
  var rowEl = this.getRowElement();
  if(rowEl) {
    rowEl.className = this.getRowClassName()
  }
};
goog.ui.tree.BaseNode.prototype.updateExpandIcon = function() {
  var img = this.getExpandIconElement();
  if(img) {
    img.className = this.getExpandIconClass()
  }
  var cel = this.getChildrenElement();
  if(cel) {
    cel.style.backgroundPosition = this.getLineStyle2()
  }
};
goog.ui.tree.BaseNode.prototype.updateIcon_ = function() {
  this.getIconElement().className = this.getCalculatedIconClass()
};
goog.ui.tree.BaseNode.prototype.onMouseDown = function(e) {
  var el = e.target;
  var type = el.getAttribute("type");
  if(type == "expand" && this.hasChildren()) {
    if(this.isUserCollapsible_) {
      this.toggle()
    }
    return
  }
  this.select();
  this.updateRow()
};
goog.ui.tree.BaseNode.prototype.onClick_ = goog.events.Event.preventDefault;
goog.ui.tree.BaseNode.prototype.onDoubleClick_ = function(e) {
  var el = e.target;
  var type = el.getAttribute("type");
  if(type == "expand" && this.hasChildren()) {
    return
  }
  if(this.isUserCollapsible_) {
    this.toggle()
  }
};
goog.ui.tree.BaseNode.prototype.onKeyDown = function(e) {
  var handled = true;
  switch(e.keyCode) {
    case goog.events.KeyCodes.RIGHT:
      if(e.altKey) {
        break
      }
      if(this.hasChildren()) {
        if(!this.getExpanded()) {
          this.setExpanded(true)
        }else {
          this.getFirstChild().select()
        }
      }
      break;
    case goog.events.KeyCodes.LEFT:
      if(e.altKey) {
        break
      }
      if(this.hasChildren() && this.getExpanded() && this.isUserCollapsible_) {
        this.setExpanded(false)
      }else {
        var parent = this.getParent();
        var tree = this.getTree();
        if(parent && (tree.getShowRootNode() || parent != tree)) {
          parent.select()
        }
      }
      break;
    case goog.events.KeyCodes.DOWN:
      var nextNode = this.getNextShownNode();
      if(nextNode) {
        nextNode.select()
      }
      break;
    case goog.events.KeyCodes.UP:
      var previousNode = this.getPreviousShownNode();
      if(previousNode) {
        previousNode.select()
      }
      break;
    default:
      handled = false
  }
  if(handled) {
    e.preventDefault();
    var tree = this.getTree();
    if(tree) {
      tree.clearTypeAhead()
    }
  }
  return handled
};
goog.ui.tree.BaseNode.prototype.onKeyPress_ = function(e) {
  if(!e.altKey && e.keyCode >= goog.events.KeyCodes.LEFT && e.keyCode <= goog.events.KeyCodes.DOWN) {
    e.preventDefault()
  }
};
goog.ui.tree.BaseNode.prototype.getLastShownDescendant = function() {
  if(!this.getExpanded() || !this.hasChildren()) {
    return this
  }
  return this.getLastChild().getLastShownDescendant()
};
goog.ui.tree.BaseNode.prototype.getNextShownNode = function() {
  if(this.hasChildren() && this.getExpanded()) {
    return this.getFirstChild()
  }else {
    var parent = this;
    var next;
    while(parent != this.getTree()) {
      next = parent.getNextSibling();
      if(next != null) {
        return next
      }
      parent = parent.getParent()
    }
    return null
  }
};
goog.ui.tree.BaseNode.prototype.getPreviousShownNode = function() {
  var ps = this.getPreviousSibling();
  if(ps != null) {
    return ps.getLastShownDescendant()
  }
  var parent = this.getParent();
  var tree = this.getTree();
  if(!tree.getShowRootNode() && parent == tree) {
    return null
  }
  return parent
};
goog.ui.tree.BaseNode.prototype.getClientData = goog.ui.tree.BaseNode.prototype.getModel;
goog.ui.tree.BaseNode.prototype.setClientData = goog.ui.tree.BaseNode.prototype.setModel;
goog.ui.tree.BaseNode.prototype.getConfig = function() {
  return this.config_
};
goog.ui.tree.BaseNode.prototype.setTreeInternal = function(tree) {
  if(this.tree_ != tree) {
    this.tree_ = tree;
    tree.setNode(this);
    this.forEachChild(function(child) {
      child.setTreeInternal(tree)
    })
  }
};
goog.provide("goog.ui.tree.TreeNode");
goog.require("goog.ui.tree.BaseNode");
goog.ui.tree.TreeNode = function(html, opt_config, opt_domHelper) {
  goog.ui.tree.BaseNode.call(this, html, opt_config, opt_domHelper)
};
goog.inherits(goog.ui.tree.TreeNode, goog.ui.tree.BaseNode);
goog.ui.tree.TreeNode.prototype.tree_ = null;
goog.ui.tree.TreeNode.prototype.getTree = function() {
  if(this.tree_) {
    return this.tree_
  }
  var parent = this.getParent();
  if(parent) {
    var tree = parent.getTree();
    if(tree) {
      this.setTreeInternal(tree);
      return tree
    }
  }
  return null
};
goog.ui.tree.TreeNode.prototype.getCalculatedIconClass = function() {
  var expanded = this.getExpanded();
  if(expanded && this.expandedIconClass_) {
    return this.expandedIconClass_
  }
  if(!expanded && this.iconClass_) {
    return this.iconClass_
  }
  var config = this.getConfig();
  if(this.hasChildren()) {
    if(expanded && config.cssExpandedFolderIcon) {
      return config.cssTreeIcon + " " + config.cssExpandedFolderIcon
    }else {
      if(!expanded && config.cssCollapsedFolderIcon) {
        return config.cssTreeIcon + " " + config.cssCollapsedFolderIcon
      }
    }
  }else {
    if(config.cssFileIcon) {
      return config.cssTreeIcon + " " + config.cssFileIcon
    }
  }
  return""
};
goog.provide("goog.net.xpc.NixTransport");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.NixTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.authToken_ = channel[goog.net.xpc.CfgFields.AUTH_TOKEN] || "";
  this.remoteAuthToken_ = channel[goog.net.xpc.CfgFields.REMOTE_AUTH_TOKEN] || "";
  goog.net.xpc.NixTransport.conductGlobalSetup_(this.getWindow());
  this[goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE] = this.handleMessage_;
  this[goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL] = this.createChannel_
};
goog.inherits(goog.net.xpc.NixTransport, goog.net.xpc.Transport);
goog.net.xpc.NixTransport.NIX_WRAPPER = "GCXPC____NIXVBS_wrapper";
goog.net.xpc.NixTransport.NIX_GET_WRAPPER = "GCXPC____NIXVBS_get_wrapper";
goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE = "GCXPC____NIXJS_handle_message";
goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL = "GCXPC____NIXJS_create_channel";
goog.net.xpc.NixTransport.NIX_ID_FIELD = "GCXPC____NIXVBS_container";
goog.net.xpc.NixTransport.conductGlobalSetup_ = function(listenWindow) {
  if(listenWindow["nix_setup_complete"]) {
    return
  }
  var vbscript = "Class " + goog.net.xpc.NixTransport.NIX_WRAPPER + "\n " + "Private m_Transport\n" + "Private m_Auth\n" + "Public Sub SetTransport(transport)\n" + "If isEmpty(m_Transport) Then\n" + "Set m_Transport = transport\n" + "End If\n" + "End Sub\n" + "Public Sub SetAuth(auth)\n" + "If isEmpty(m_Auth) Then\n" + "m_Auth = auth\n" + "End If\n" + "End Sub\n" + "Public Function GetAuthToken()\n " + "GetAuthToken = m_Auth\n" + "End Function\n" + "Public Sub SendMessage(service, payload)\n " + 
  "Call m_Transport." + goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE + "(service, payload)\n" + "End Sub\n" + "Public Sub CreateChannel(channel)\n " + "Call m_Transport." + goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL + "(channel)\n" + "End Sub\n" + "Public Sub " + goog.net.xpc.NixTransport.NIX_ID_FIELD + "()\n " + "End Sub\n" + "End Class\n " + "Function " + goog.net.xpc.NixTransport.NIX_GET_WRAPPER + "(transport, auth)\n" + "Dim wrap\n" + "Set wrap = New " + goog.net.xpc.NixTransport.NIX_WRAPPER + 
  "\n" + "wrap.SetTransport transport\n" + "wrap.SetAuth auth\n" + "Set " + goog.net.xpc.NixTransport.NIX_GET_WRAPPER + " = wrap\n" + "End Function";
  try {
    listenWindow.execScript(vbscript, "vbscript");
    listenWindow["nix_setup_complete"] = true
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting global setup: " + e)
  }
};
goog.net.xpc.NixTransport.prototype.transportType = goog.net.xpc.TransportTypes.NIX;
goog.net.xpc.NixTransport.prototype.localSetupCompleted_ = false;
goog.net.xpc.NixTransport.prototype.nixChannel_ = null;
goog.net.xpc.NixTransport.prototype.connect = function() {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER) {
    this.attemptOuterSetup_()
  }else {
    this.attemptInnerSetup_()
  }
};
goog.net.xpc.NixTransport.prototype.attemptOuterSetup_ = function() {
  if(this.localSetupCompleted_) {
    return
  }
  var innerFrame = this.channel_.iframeElement_;
  try {
    innerFrame.contentWindow.opener = this.getWindow()[goog.net.xpc.NixTransport.NIX_GET_WRAPPER](this, this.authToken_);
    this.localSetupCompleted_ = true
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e)
  }
  if(!this.localSetupCompleted_) {
    this.getWindow().setTimeout(goog.bind(this.attemptOuterSetup_, this), 100)
  }
};
goog.net.xpc.NixTransport.prototype.attemptInnerSetup_ = function() {
  if(this.localSetupCompleted_) {
    return
  }
  try {
    var opener = this.getWindow().opener;
    if(opener && goog.net.xpc.NixTransport.NIX_ID_FIELD in opener) {
      this.nixChannel_ = opener;
      var remoteAuthToken = this.nixChannel_["GetAuthToken"]();
      if(remoteAuthToken != this.remoteAuthToken_) {
        goog.net.xpc.logger.severe("Invalid auth token from other party");
        return
      }
      this.nixChannel_["CreateChannel"](this.getWindow()[goog.net.xpc.NixTransport.NIX_GET_WRAPPER](this, this.authToken_));
      this.localSetupCompleted_ = true;
      this.channel_.notifyConnected_()
    }
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e);
    return
  }
  if(!this.localSetupCompleted_) {
    this.getWindow().setTimeout(goog.bind(this.attemptInnerSetup_, this), 100)
  }
};
goog.net.xpc.NixTransport.prototype.createChannel_ = function(channel) {
  if(typeof channel != "unknown" || !(goog.net.xpc.NixTransport.NIX_ID_FIELD in channel)) {
    goog.net.xpc.logger.severe("Invalid NIX channel given to createChannel_")
  }
  this.nixChannel_ = channel;
  var remoteAuthToken = this.nixChannel_["GetAuthToken"]();
  if(remoteAuthToken != this.remoteAuthToken_) {
    goog.net.xpc.logger.severe("Invalid auth token from other party");
    return
  }
  this.channel_.notifyConnected_()
};
goog.net.xpc.NixTransport.prototype.handleMessage_ = function(serviceName, payload) {
  function deliveryHandler() {
    this.channel_.deliver_(serviceName, payload)
  }
  this.getWindow().setTimeout(goog.bind(deliveryHandler, this), 1)
};
goog.net.xpc.NixTransport.prototype.send = function(service, payload) {
  if(typeof this.nixChannel_ !== "unknown") {
    goog.net.xpc.logger.severe("NIX channel not connected")
  }
  this.nixChannel_["SendMessage"](service, payload)
};
goog.net.xpc.NixTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  this.nixChannel_ = null
};
goog.provide("goog.net.xpc.IframePollingTransport");
goog.provide("goog.net.xpc.IframePollingTransport.Receiver");
goog.provide("goog.net.xpc.IframePollingTransport.Sender");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.IframePollingTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.sendUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI];
  this.rcvUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI];
  this.sendQueue_ = []
};
goog.inherits(goog.net.xpc.IframePollingTransport, goog.net.xpc.Transport);
goog.net.xpc.IframePollingTransport.prototype.transportType = goog.net.xpc.TransportTypes.IFRAME_POLLING;
goog.net.xpc.IframePollingTransport.prototype.sequence_ = 0;
goog.net.xpc.IframePollingTransport.prototype.waitForAck_ = false;
goog.net.xpc.IframePollingTransport.prototype.initialized_ = false;
goog.net.xpc.IframePollingTransport.IFRAME_PREFIX = "googlexpc";
goog.net.xpc.IframePollingTransport.prototype.getMsgFrameName_ = function() {
  return goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_" + this.channel_.name + "_msg"
};
goog.net.xpc.IframePollingTransport.prototype.getAckFrameName_ = function() {
  return goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_" + this.channel_.name + "_ack"
};
goog.net.xpc.IframePollingTransport.prototype.connect = function() {
  goog.net.xpc.logger.fine("transport connect called");
  if(!this.initialized_) {
    goog.net.xpc.logger.fine("initializing...");
    this.constructSenderFrames_();
    this.initialized_ = true
  }
  this.checkForeignFramesReady_()
};
goog.net.xpc.IframePollingTransport.prototype.constructSenderFrames_ = function() {
  var name = this.getMsgFrameName_();
  this.msgIframeElm_ = this.constructSenderFrame_(name);
  this.msgWinObj_ = this.getWindow().frames[name];
  name = this.getAckFrameName_();
  this.ackIframeElm_ = this.constructSenderFrame_(name);
  this.ackWinObj_ = this.getWindow().frames[name]
};
goog.net.xpc.IframePollingTransport.prototype.constructSenderFrame_ = function(id) {
  goog.net.xpc.logger.finest("constructing sender frame: " + id);
  var ifr = goog.dom.createElement("iframe");
  var s = ifr.style;
  s.position = "absolute";
  s.top = "-10px";
  s.left = "10px";
  s.width = "1px";
  s.height = "1px";
  ifr.id = ifr.name = id;
  ifr.src = this.sendUri_ + "#INITIAL";
  this.getWindow().document.body.appendChild(ifr);
  return ifr
};
goog.net.xpc.IframePollingTransport.prototype.innerPeerReconnect_ = function() {
  goog.net.xpc.logger.finest("innerPeerReconnect called");
  this.channel_.name = goog.net.xpc.getRandomString(10);
  goog.net.xpc.logger.finest("switching channels: " + this.channel_.name);
  this.deconstructSenderFrames_();
  this.initialized_ = false;
  this.reconnectFrame_ = this.constructSenderFrame_(goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_reconnect_" + this.channel_.name)
};
goog.net.xpc.IframePollingTransport.prototype.outerPeerReconnect_ = function() {
  goog.net.xpc.logger.finest("outerPeerReconnect called");
  var frames = this.channel_.peerWindowObject_.frames;
  var length = frames.length;
  for(var i = 0;i < length;i++) {
    var frameName;
    try {
      if(frames[i] && frames[i].name) {
        frameName = frames[i].name
      }
    }catch(e) {
    }
    if(!frameName) {
      continue
    }
    var message = frameName.split("_");
    if(message.length == 3 && message[0] == goog.net.xpc.IframePollingTransport.IFRAME_PREFIX && message[1] == "reconnect") {
      this.channel_.name = message[2];
      this.deconstructSenderFrames_();
      this.initialized_ = false;
      break
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.deconstructSenderFrames_ = function() {
  goog.net.xpc.logger.finest("deconstructSenderFrames called");
  if(this.msgIframeElm_) {
    this.msgIframeElm_.parentNode.removeChild(this.msgIframeElm_);
    this.msgIframeElm_ = null;
    this.msgWinObj_ = null
  }
  if(this.ackIframeElm_) {
    this.ackIframeElm_.parentNode.removeChild(this.ackIframeElm_);
    this.ackIframeElm_ = null;
    this.ackWinObj_ = null
  }
};
goog.net.xpc.IframePollingTransport.prototype.checkForeignFramesReady_ = function() {
  if(!(this.isRcvFrameReady_(this.getMsgFrameName_()) && this.isRcvFrameReady_(this.getAckFrameName_()))) {
    goog.net.xpc.logger.finest("foreign frames not (yet) present");
    if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.INNER && !this.reconnectFrame_) {
      this.innerPeerReconnect_()
    }else {
      if(this.channel_.getRole() == goog.net.xpc.CrossPageChannel.Role.OUTER) {
        this.outerPeerReconnect_()
      }
    }
    this.getWindow().setTimeout(goog.bind(this.connect, this), 100)
  }else {
    goog.net.xpc.logger.fine("foreign frames present");
    this.msgReceiver_ = new goog.net.xpc.IframePollingTransport.Receiver(this, this.channel_.peerWindowObject_.frames[this.getMsgFrameName_()], goog.bind(this.processIncomingMsg, this));
    this.ackReceiver_ = new goog.net.xpc.IframePollingTransport.Receiver(this, this.channel_.peerWindowObject_.frames[this.getAckFrameName_()], goog.bind(this.processIncomingAck, this));
    this.checkLocalFramesPresent_()
  }
};
goog.net.xpc.IframePollingTransport.prototype.isRcvFrameReady_ = function(frameName) {
  goog.net.xpc.logger.finest("checking for receive frame: " + frameName);
  try {
    var winObj = this.channel_.peerWindowObject_.frames[frameName];
    if(!winObj || winObj.location.href.indexOf(this.rcvUri_) != 0) {
      return false
    }
  }catch(e) {
    return false
  }
  return true
};
goog.net.xpc.IframePollingTransport.prototype.checkLocalFramesPresent_ = function() {
  var frames = this.channel_.peerWindowObject_.frames;
  if(!(frames[this.getAckFrameName_()] && frames[this.getMsgFrameName_()])) {
    if(!this.checkLocalFramesPresentCb_) {
      this.checkLocalFramesPresentCb_ = goog.bind(this.checkLocalFramesPresent_, this)
    }
    this.getWindow().setTimeout(this.checkLocalFramesPresentCb_, 100);
    goog.net.xpc.logger.fine("local frames not (yet) present")
  }else {
    this.msgSender_ = new goog.net.xpc.IframePollingTransport.Sender(this.sendUri_, this.msgWinObj_);
    this.ackSender_ = new goog.net.xpc.IframePollingTransport.Sender(this.sendUri_, this.ackWinObj_);
    goog.net.xpc.logger.fine("local frames ready");
    this.getWindow().setTimeout(goog.bind(function() {
      this.msgSender_.send(goog.net.xpc.SETUP);
      this.sentConnectionSetup_ = true;
      this.waitForAck_ = true;
      goog.net.xpc.logger.fine("SETUP sent")
    }, this), 100)
  }
};
goog.net.xpc.IframePollingTransport.prototype.checkIfConnected_ = function() {
  if(this.sentConnectionSetupAck_ && this.rcvdConnectionSetupAck_) {
    this.channel_.notifyConnected_();
    if(this.deliveryQueue_) {
      goog.net.xpc.logger.fine("delivering queued messages " + "(" + this.deliveryQueue_.length + ")");
      for(var i = 0, m;i < this.deliveryQueue_.length;i++) {
        m = this.deliveryQueue_[i];
        this.channel_.deliver_(m.service, m.payload)
      }
      delete this.deliveryQueue_
    }
  }else {
    goog.net.xpc.logger.finest("checking if connected: " + "ack sent:" + this.sentConnectionSetupAck_ + ", ack rcvd: " + this.rcvdConnectionSetupAck_)
  }
};
goog.net.xpc.IframePollingTransport.prototype.processIncomingMsg = function(raw) {
  goog.net.xpc.logger.finest("msg received: " + raw);
  if(raw == goog.net.xpc.SETUP) {
    if(!this.ackSender_) {
      return
    }
    this.ackSender_.send(goog.net.xpc.SETUP_ACK_);
    goog.net.xpc.logger.finest("SETUP_ACK sent");
    this.sentConnectionSetupAck_ = true;
    this.checkIfConnected_()
  }else {
    if(this.channel_.isConnected() || this.sentConnectionSetupAck_) {
      var pos = raw.indexOf("|");
      var head = raw.substring(0, pos);
      var frame = raw.substring(pos + 1);
      pos = head.indexOf(",");
      if(pos == -1) {
        var seq = head;
        this.ackSender_.send("ACK:" + seq);
        this.deliverPayload_(frame)
      }else {
        var seq = head.substring(0, pos);
        this.ackSender_.send("ACK:" + seq);
        var partInfo = head.substring(pos + 1).split("/");
        var part0 = parseInt(partInfo[0], 10);
        var part1 = parseInt(partInfo[1], 10);
        if(part0 == 1) {
          this.parts_ = []
        }
        this.parts_.push(frame);
        if(part0 == part1) {
          this.deliverPayload_(this.parts_.join(""));
          delete this.parts_
        }
      }
    }else {
      goog.net.xpc.logger.warning("received msg, but channel is not connected")
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.processIncomingAck = function(msgStr) {
  goog.net.xpc.logger.finest("ack received: " + msgStr);
  if(msgStr == goog.net.xpc.SETUP_ACK_) {
    this.waitForAck_ = false;
    this.rcvdConnectionSetupAck_ = true;
    this.checkIfConnected_()
  }else {
    if(this.channel_.isConnected()) {
      if(!this.waitForAck_) {
        goog.net.xpc.logger.warning("got unexpected ack");
        return
      }
      var seq = parseInt(msgStr.split(":")[1], 10);
      if(seq == this.sequence_) {
        this.waitForAck_ = false;
        this.sendNextFrame_()
      }else {
        goog.net.xpc.logger.warning("got ack with wrong sequence")
      }
    }else {
      goog.net.xpc.logger.warning("received ack, but channel not connected")
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.sendNextFrame_ = function() {
  if(this.waitForAck_ || !this.sendQueue_.length) {
    return
  }
  var s = this.sendQueue_.shift();
  ++this.sequence_;
  this.msgSender_.send(this.sequence_ + s);
  goog.net.xpc.logger.finest("msg sent: " + this.sequence_ + s);
  this.waitForAck_ = true
};
goog.net.xpc.IframePollingTransport.prototype.deliverPayload_ = function(s) {
  var pos = s.indexOf(":");
  var service = s.substr(0, pos);
  var payload = s.substring(pos + 1);
  if(!this.channel_.isConnected()) {
    (this.deliveryQueue_ || (this.deliveryQueue_ = [])).push({service:service, payload:payload});
    goog.net.xpc.logger.finest("queued delivery")
  }else {
    this.channel_.deliver_(service, payload)
  }
};
goog.net.xpc.IframePollingTransport.prototype.MAX_FRAME_LENGTH_ = 3800;
goog.net.xpc.IframePollingTransport.prototype.send = function(service, payload) {
  var frame = service + ":" + payload;
  if(!goog.userAgent.IE || payload.length <= this.MAX_FRAME_LENGTH_) {
    this.sendQueue_.push("|" + frame)
  }else {
    var l = payload.length;
    var num = Math.ceil(l / this.MAX_FRAME_LENGTH_);
    var pos = 0;
    var i = 1;
    while(pos < l) {
      this.sendQueue_.push("," + i + "/" + num + "|" + frame.substr(pos, this.MAX_FRAME_LENGTH_));
      i++;
      pos += this.MAX_FRAME_LENGTH_
    }
  }
  this.sendNextFrame_()
};
goog.net.xpc.IframePollingTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  var receivers = goog.net.xpc.IframePollingTransport.receivers_;
  goog.array.remove(receivers, this.msgReceiver_);
  goog.array.remove(receivers, this.ackReceiver_);
  this.msgReceiver_ = this.ackReceiver_ = null;
  goog.dom.removeNode(this.msgIframeElm_);
  goog.dom.removeNode(this.ackIframeElm_);
  this.msgIframeElm_ = this.ackIframeElm_ = null;
  this.msgWinObj_ = this.ackWinObj_ = null
};
goog.net.xpc.IframePollingTransport.receivers_ = [];
goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_ = 10;
goog.net.xpc.IframePollingTransport.TIME_POLL_LONG_ = 100;
goog.net.xpc.IframePollingTransport.TIME_SHORT_POLL_AFTER_ACTIVITY_ = 1E3;
goog.net.xpc.IframePollingTransport.receive_ = function() {
  var rcvd = false;
  try {
    for(var i = 0, l = goog.net.xpc.IframePollingTransport.receivers_.length;i < l;i++) {
      rcvd = rcvd || goog.net.xpc.IframePollingTransport.receivers_[i].receive()
    }
  }catch(e) {
    goog.net.xpc.logger.info("receive_() failed: " + e);
    goog.net.xpc.IframePollingTransport.receivers_[i].transport_.channel_.notifyTransportError_();
    if(!goog.net.xpc.IframePollingTransport.receivers_.length) {
      return
    }
  }
  var now = goog.now();
  if(rcvd) {
    goog.net.xpc.IframePollingTransport.lastActivity_ = now
  }
  var t = now - goog.net.xpc.IframePollingTransport.lastActivity_ < goog.net.xpc.IframePollingTransport.TIME_SHORT_POLL_AFTER_ACTIVITY_ ? goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_ : goog.net.xpc.IframePollingTransport.TIME_POLL_LONG_;
  goog.net.xpc.IframePollingTransport.rcvTimer_ = window.setTimeout(goog.net.xpc.IframePollingTransport.receiveCb_, t)
};
goog.net.xpc.IframePollingTransport.receiveCb_ = goog.bind(goog.net.xpc.IframePollingTransport.receive_, goog.net.xpc.IframePollingTransport);
goog.net.xpc.IframePollingTransport.startRcvTimer_ = function() {
  goog.net.xpc.logger.fine("starting receive-timer");
  goog.net.xpc.IframePollingTransport.lastActivity_ = goog.now();
  if(goog.net.xpc.IframePollingTransport.rcvTimer_) {
    window.clearTimeout(goog.net.xpc.IframePollingTransport.rcvTimer_)
  }
  goog.net.xpc.IframePollingTransport.rcvTimer_ = window.setTimeout(goog.net.xpc.IframePollingTransport.receiveCb_, goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_)
};
goog.net.xpc.IframePollingTransport.Sender = function(url, windowObj) {
  this.sendUri_ = url;
  this.sendFrame_ = windowObj;
  this.cycle_ = 0
};
goog.net.xpc.IframePollingTransport.Sender.prototype.send = function(payload) {
  this.cycle_ = ++this.cycle_ % 2;
  var url = this.sendUri_ + "#" + this.cycle_ + encodeURIComponent(payload);
  try {
    if(goog.userAgent.WEBKIT) {
      this.sendFrame_.location.href = url
    }else {
      this.sendFrame_.location.replace(url)
    }
  }catch(e) {
    goog.net.xpc.logger.severe("sending failed", e)
  }
  goog.net.xpc.IframePollingTransport.startRcvTimer_()
};
goog.net.xpc.IframePollingTransport.Receiver = function(transport, windowObj, callback) {
  this.transport_ = transport;
  this.rcvFrame_ = windowObj;
  this.cb_ = callback;
  this.currentLoc_ = this.rcvFrame_.location.href.split("#")[0] + "#INITIAL";
  goog.net.xpc.IframePollingTransport.receivers_.push(this);
  goog.net.xpc.IframePollingTransport.startRcvTimer_()
};
goog.net.xpc.IframePollingTransport.Receiver.prototype.receive = function() {
  var loc = this.rcvFrame_.location.href;
  if(loc != this.currentLoc_) {
    this.currentLoc_ = loc;
    var payload = loc.split("#")[1];
    if(payload) {
      payload = payload.substr(1);
      this.cb_(decodeURIComponent(payload))
    }
    return true
  }else {
    return false
  }
};
goog.provide("goog.messaging.AbstractChannel");
goog.require("goog.Disposable");
goog.require("goog.debug");
goog.require("goog.debug.Logger");
goog.require("goog.json");
goog.require("goog.messaging.MessageChannel");
goog.messaging.AbstractChannel = function() {
  goog.base(this);
  this.services_ = {}
};
goog.inherits(goog.messaging.AbstractChannel, goog.Disposable);
goog.messaging.AbstractChannel.prototype.defaultService_;
goog.messaging.AbstractChannel.prototype.logger = goog.debug.Logger.getLogger("goog.messaging.AbstractChannel");
goog.messaging.AbstractChannel.prototype.connect = function(opt_connectCb) {
  if(opt_connectCb) {
    opt_connectCb()
  }
};
goog.messaging.AbstractChannel.prototype.isConnected = function() {
  return true
};
goog.messaging.AbstractChannel.prototype.registerService = function(serviceName, callback, opt_objectPayload) {
  this.services_[serviceName] = {callback:callback, objectPayload:!!opt_objectPayload}
};
goog.messaging.AbstractChannel.prototype.registerDefaultService = function(callback) {
  this.defaultService_ = callback
};
goog.messaging.AbstractChannel.prototype.send = goog.abstractMethod;
goog.messaging.AbstractChannel.prototype.deliver = function(serviceName, payload) {
  var service = this.getService(serviceName, payload);
  if(!service) {
    return
  }
  payload = this.decodePayload(serviceName, payload, service.objectPayload);
  if(goog.isDefAndNotNull(payload)) {
    service.callback(payload)
  }
};
goog.messaging.AbstractChannel.prototype.getService = function(serviceName, payload) {
  var service = this.services_[serviceName];
  if(service) {
    return service
  }else {
    if(this.defaultService_) {
      var callback = goog.partial(this.defaultService_, serviceName);
      var objectPayload = goog.isObject(payload);
      return{callback:callback, objectPayload:objectPayload}
    }
  }
  this.logger.warning('Unknown service name "' + serviceName + '"');
  return null
};
goog.messaging.AbstractChannel.prototype.decodePayload = function(serviceName, payload, objectPayload) {
  if(objectPayload && goog.isString(payload)) {
    try {
      return goog.json.parse(payload)
    }catch(err) {
      this.logger.warning("Expected JSON payload for " + serviceName + ', was "' + payload + '"');
      return null
    }
  }else {
    if(!objectPayload && !goog.isString(payload)) {
      return goog.json.serialize(payload)
    }
  }
  return payload
};
goog.messaging.AbstractChannel.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  goog.dispose(this.logger);
  delete this.logger;
  delete this.services_;
  delete this.defaultService_
};
goog.provide("goog.net.xpc.IframeRelayTransport");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.IframeRelayTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.peerRelayUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.PEER_RELAY_URI];
  this.peerIframeId_ = this.channel_.cfg_[goog.net.xpc.CfgFields.IFRAME_ID];
  if(goog.userAgent.WEBKIT) {
    goog.net.xpc.IframeRelayTransport.startCleanupTimer_()
  }
};
goog.inherits(goog.net.xpc.IframeRelayTransport, goog.net.xpc.Transport);
if(goog.userAgent.WEBKIT) {
  goog.net.xpc.IframeRelayTransport.iframeRefs_ = [];
  goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_ = 1E3;
  goog.net.xpc.IframeRelayTransport.IFRAME_MAX_AGE_ = 3E3;
  goog.net.xpc.IframeRelayTransport.cleanupTimer_ = 0;
  goog.net.xpc.IframeRelayTransport.startCleanupTimer_ = function() {
    if(!goog.net.xpc.IframeRelayTransport.cleanupTimer_) {
      goog.net.xpc.IframeRelayTransport.cleanupTimer_ = window.setTimeout(function() {
        goog.net.xpc.IframeRelayTransport.cleanup_()
      }, goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_)
    }
  };
  goog.net.xpc.IframeRelayTransport.cleanup_ = function(opt_maxAge) {
    var now = goog.now();
    var maxAge = opt_maxAge || goog.net.xpc.IframeRelayTransport.IFRAME_MAX_AGE_;
    while(goog.net.xpc.IframeRelayTransport.iframeRefs_.length && now - goog.net.xpc.IframeRelayTransport.iframeRefs_[0].timestamp >= maxAge) {
      var ifr = goog.net.xpc.IframeRelayTransport.iframeRefs_.shift().iframeElement;
      goog.dom.removeNode(ifr);
      goog.net.xpc.logger.finest("iframe removed")
    }
    goog.net.xpc.IframeRelayTransport.cleanupTimer_ = window.setTimeout(goog.net.xpc.IframeRelayTransport.cleanupCb_, goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_)
  };
  goog.net.xpc.IframeRelayTransport.cleanupCb_ = function() {
    goog.net.xpc.IframeRelayTransport.cleanup_()
  }
}
goog.net.xpc.IframeRelayTransport.IE_PAYLOAD_MAX_SIZE_ = 1800;
goog.net.xpc.IframeRelayTransport.FragmentInfo;
goog.net.xpc.IframeRelayTransport.fragmentMap_ = {};
goog.net.xpc.IframeRelayTransport.prototype.transportType = goog.net.xpc.TransportTypes.IFRAME_RELAY;
goog.net.xpc.IframeRelayTransport.prototype.connect = function() {
  if(!this.getWindow()["xpcRelay"]) {
    this.getWindow()["xpcRelay"] = goog.net.xpc.IframeRelayTransport.receiveMessage_
  }
  this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP)
};
goog.net.xpc.IframeRelayTransport.receiveMessage_ = function(channelName, frame) {
  var pos = frame.indexOf(":");
  var header = frame.substr(0, pos);
  var payload = frame.substr(pos + 1);
  if(!goog.userAgent.IE || (pos = header.indexOf("|")) == -1) {
    var service = header
  }else {
    var service = header.substr(0, pos);
    var fragmentIdStr = header.substr(pos + 1);
    pos = fragmentIdStr.indexOf("+");
    var messageIdStr = fragmentIdStr.substr(0, pos);
    var fragmentNum = parseInt(fragmentIdStr.substr(pos + 1), 10);
    var fragmentInfo = goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr];
    if(!fragmentInfo) {
      fragmentInfo = goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr] = {fragments:[], received:0, expected:0}
    }
    if(goog.string.contains(fragmentIdStr, "++")) {
      fragmentInfo.expected = fragmentNum + 1
    }
    fragmentInfo.fragments[fragmentNum] = payload;
    fragmentInfo.received++;
    if(fragmentInfo.received != fragmentInfo.expected) {
      return
    }
    payload = fragmentInfo.fragments.join("");
    delete goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr]
  }
  goog.net.xpc.channels_[channelName].deliver_(service, decodeURIComponent(payload))
};
goog.net.xpc.IframeRelayTransport.prototype.transportServiceHandler = function(payload) {
  if(payload == goog.net.xpc.SETUP) {
    this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
    this.channel_.notifyConnected_()
  }else {
    if(payload == goog.net.xpc.SETUP_ACK_) {
      this.channel_.notifyConnected_()
    }
  }
};
goog.net.xpc.IframeRelayTransport.prototype.send = function(service, payload) {
  var encodedPayload = encodeURIComponent(payload);
  var encodedLen = encodedPayload.length;
  var maxSize = goog.net.xpc.IframeRelayTransport.IE_PAYLOAD_MAX_SIZE_;
  if(goog.userAgent.IE && encodedLen > maxSize) {
    var messageIdStr = goog.string.getRandomString();
    for(var startIndex = 0, fragmentNum = 0;startIndex < encodedLen;fragmentNum++) {
      var payloadFragment = encodedPayload.substr(startIndex, maxSize);
      startIndex += maxSize;
      var fragmentIdStr = messageIdStr + (startIndex >= encodedLen ? "++" : "+") + fragmentNum;
      this.send_(service, payloadFragment, fragmentIdStr)
    }
  }else {
    this.send_(service, encodedPayload)
  }
};
goog.net.xpc.IframeRelayTransport.prototype.send_ = function(service, encodedPayload, opt_fragmentIdStr) {
  if(goog.userAgent.IE) {
    var div = this.getWindow().document.createElement("div");
    div.innerHTML = '<iframe onload="this.xpcOnload()"></iframe>';
    var ifr = div.childNodes[0];
    div = null;
    ifr["xpcOnload"] = goog.net.xpc.IframeRelayTransport.iframeLoadHandler_
  }else {
    var ifr = this.getWindow().document.createElement("iframe");
    if(goog.userAgent.WEBKIT) {
      goog.net.xpc.IframeRelayTransport.iframeRefs_.push({timestamp:goog.now(), iframeElement:ifr})
    }else {
      goog.events.listen(ifr, "load", goog.net.xpc.IframeRelayTransport.iframeLoadHandler_)
    }
  }
  var style = ifr.style;
  style.visibility = "hidden";
  style.width = ifr.style.height = "0px";
  style.position = "absolute";
  var url = this.peerRelayUri_;
  url += "#" + this.channel_.name;
  if(this.peerIframeId_) {
    url += "," + this.peerIframeId_
  }
  url += "|" + service;
  if(opt_fragmentIdStr) {
    url += "|" + opt_fragmentIdStr
  }
  url += ":" + encodedPayload;
  ifr.src = url;
  this.getWindow().document.body.appendChild(ifr);
  goog.net.xpc.logger.finest("msg sent: " + url)
};
goog.net.xpc.IframeRelayTransport.iframeLoadHandler_ = function() {
  goog.net.xpc.logger.finest("iframe-load");
  goog.dom.removeNode(this);
  this.xpcOnload = null
};
goog.net.xpc.IframeRelayTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  if(goog.userAgent.WEBKIT) {
    goog.net.xpc.IframeRelayTransport.cleanup_(0)
  }
};
goog.provide("goog.net.xpc.NativeMessagingTransport");
goog.require("goog.events");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.NativeMessagingTransport = function(channel, peerHostname, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.peerHostname_ = peerHostname || "*"
};
goog.inherits(goog.net.xpc.NativeMessagingTransport, goog.net.xpc.Transport);
goog.net.xpc.NativeMessagingTransport.prototype.initialized_ = false;
goog.net.xpc.NativeMessagingTransport.prototype.transportType = goog.net.xpc.TransportTypes.NATIVE_MESSAGING;
goog.net.xpc.NativeMessagingTransport.activeCount_ = {};
goog.net.xpc.NativeMessagingTransport.initialize_ = function(listenWindow) {
  var uid = goog.getUid(listenWindow);
  var value = goog.net.xpc.NativeMessagingTransport.activeCount_[uid];
  if(!goog.isNumber(value)) {
    value = 0
  }
  if(value == 0) {
    goog.events.listen(listenWindow.postMessage ? listenWindow : listenWindow.document, "message", goog.net.xpc.NativeMessagingTransport.messageReceived_, false, goog.net.xpc.NativeMessagingTransport)
  }
  goog.net.xpc.NativeMessagingTransport.activeCount_[uid] = value + 1
};
goog.net.xpc.NativeMessagingTransport.messageReceived_ = function(msgEvt) {
  var data = msgEvt.getBrowserEvent().data;
  var headDelim = data.indexOf("|");
  var serviceDelim = data.indexOf(":");
  if(headDelim == -1 || serviceDelim == -1) {
    return false
  }
  var channelName = data.substring(0, headDelim);
  var service = data.substring(headDelim + 1, serviceDelim);
  var payload = data.substring(serviceDelim + 1);
  goog.net.xpc.logger.fine("messageReceived: channel=" + channelName + ", service=" + service + ", payload=" + payload);
  var channel = goog.net.xpc.channels_[channelName];
  if(channel) {
    channel.deliver_(service, payload, msgEvt.getBrowserEvent().origin);
    return true
  }
  for(var staleChannelName in goog.net.xpc.channels_) {
    var staleChannel = goog.net.xpc.channels_[staleChannelName];
    if(staleChannel.getRole() == goog.net.xpc.CrossPageChannel.Role.INNER && !staleChannel.isConnected() && service == goog.net.xpc.TRANSPORT_SERVICE_ && payload == goog.net.xpc.SETUP) {
      goog.net.xpc.logger.fine("changing channel name to " + channelName);
      staleChannel.name = channelName;
      delete goog.net.xpc.channels_[staleChannelName];
      goog.net.xpc.channels_[channelName] = staleChannel;
      staleChannel.deliver_(service, payload);
      return true
    }
  }
  goog.net.xpc.logger.info('channel name mismatch; message ignored"');
  return false
};
goog.net.xpc.NativeMessagingTransport.prototype.transportServiceHandler = function(payload) {
  switch(payload) {
    case goog.net.xpc.SETUP:
      this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
      break;
    case goog.net.xpc.SETUP_ACK_:
      this.channel_.notifyConnected_();
      break
  }
};
goog.net.xpc.NativeMessagingTransport.prototype.connect = function() {
  goog.net.xpc.NativeMessagingTransport.initialize_(this.getWindow());
  this.initialized_ = true;
  this.connectWithRetries_()
};
goog.net.xpc.NativeMessagingTransport.prototype.connectWithRetries_ = function() {
  if(this.channel_.isConnected() || this.isDisposed()) {
    return
  }
  this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP);
  this.getWindow().setTimeout(goog.bind(this.connectWithRetries_, this), 100)
};
goog.net.xpc.NativeMessagingTransport.prototype.send = function(service, payload) {
  var win = this.channel_.peerWindowObject_;
  if(!win) {
    goog.net.xpc.logger.fine("send(): window not ready");
    return
  }
  var obj = win.postMessage ? win : win.document;
  this.send = function(service, payload) {
    goog.net.xpc.logger.fine("send(): payload=" + payload + " to hostname=" + this.peerHostname_);
    obj.postMessage(this.channel_.name + "|" + service + ":" + payload, this.peerHostname_)
  };
  this.send(service, payload)
};
goog.net.xpc.NativeMessagingTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  if(this.initialized_) {
    var listenWindow = this.getWindow();
    var uid = goog.getUid(listenWindow);
    var value = goog.net.xpc.NativeMessagingTransport.activeCount_[uid];
    goog.net.xpc.NativeMessagingTransport.activeCount_[uid] = value - 1;
    if(value == 1) {
      goog.events.unlisten(listenWindow.postMessage ? listenWindow : listenWindow.document, "message", goog.net.xpc.NativeMessagingTransport.messageReceived_, false, goog.net.xpc.NativeMessagingTransport)
    }
  }
};
goog.provide("goog.net.xpc.CrossPageChannel");
goog.provide("goog.net.xpc.CrossPageChannel.Role");
goog.require("goog.Disposable");
goog.require("goog.Uri");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.json");
goog.require("goog.messaging.AbstractChannel");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.FrameElementMethodTransport");
goog.require("goog.net.xpc.IframePollingTransport");
goog.require("goog.net.xpc.IframeRelayTransport");
goog.require("goog.net.xpc.NativeMessagingTransport");
goog.require("goog.net.xpc.NixTransport");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.CrossPageChannel = function(cfg, opt_domHelper) {
  goog.base(this);
  for(var i = 0, uriField;uriField = goog.net.xpc.UriCfgFields[i];i++) {
    if(uriField in cfg && !/^https?:\/\//.test(cfg[uriField])) {
      throw Error("URI " + cfg[uriField] + " is invalid for field " + uriField);
    }
  }
  this.cfg_ = cfg;
  this.name = this.cfg_[goog.net.xpc.CfgFields.CHANNEL_NAME] || goog.net.xpc.getRandomString(10);
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper();
  goog.net.xpc.channels_[this.name] = this;
  goog.events.listen(window, "unload", goog.net.xpc.CrossPageChannel.disposeAll_);
  goog.net.xpc.logger.info("CrossPageChannel created: " + this.name)
};
goog.inherits(goog.net.xpc.CrossPageChannel, goog.messaging.AbstractChannel);
goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_ESCAPE_RE_ = new RegExp("^%*" + goog.net.xpc.TRANSPORT_SERVICE_ + "$");
goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_UNESCAPE_RE_ = new RegExp("^%+" + goog.net.xpc.TRANSPORT_SERVICE_ + "$");
goog.net.xpc.CrossPageChannel.prototype.transport_ = null;
goog.net.xpc.CrossPageChannel.prototype.state_ = goog.net.xpc.ChannelStates.NOT_CONNECTED;
goog.net.xpc.CrossPageChannel.prototype.isConnected = function() {
  return this.state_ == goog.net.xpc.ChannelStates.CONNECTED
};
goog.net.xpc.CrossPageChannel.prototype.peerWindowObject_ = null;
goog.net.xpc.CrossPageChannel.prototype.iframeElement_ = null;
goog.net.xpc.CrossPageChannel.prototype.setPeerWindowObject = function(peerWindowObject) {
  this.peerWindowObject_ = peerWindowObject
};
goog.net.xpc.CrossPageChannel.prototype.determineTransportType_ = function() {
  var transportType;
  if(goog.isFunction(document.postMessage) || goog.isFunction(window.postMessage) || goog.userAgent.IE && window.postMessage) {
    transportType = goog.net.xpc.TransportTypes.NATIVE_MESSAGING
  }else {
    if(goog.userAgent.GECKO) {
      transportType = goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD
    }else {
      if(goog.userAgent.IE && this.cfg_[goog.net.xpc.CfgFields.PEER_RELAY_URI]) {
        transportType = goog.net.xpc.TransportTypes.IFRAME_RELAY
      }else {
        if(goog.userAgent.IE) {
          transportType = goog.net.xpc.TransportTypes.NIX
        }else {
          if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI] && this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]) {
            transportType = goog.net.xpc.TransportTypes.IFRAME_POLLING
          }
        }
      }
    }
  }
  return transportType
};
goog.net.xpc.CrossPageChannel.prototype.createTransport_ = function() {
  if(this.transport_) {
    return
  }
  if(!this.cfg_[goog.net.xpc.CfgFields.TRANSPORT]) {
    this.cfg_[goog.net.xpc.CfgFields.TRANSPORT] = this.determineTransportType_()
  }
  switch(this.cfg_[goog.net.xpc.CfgFields.TRANSPORT]) {
    case goog.net.xpc.TransportTypes.NATIVE_MESSAGING:
      this.transport_ = new goog.net.xpc.NativeMessagingTransport(this, this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME], this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.NIX:
      this.transport_ = new goog.net.xpc.NixTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD:
      this.transport_ = new goog.net.xpc.FrameElementMethodTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.IFRAME_RELAY:
      this.transport_ = new goog.net.xpc.IframeRelayTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.IFRAME_POLLING:
      this.transport_ = new goog.net.xpc.IframePollingTransport(this, this.domHelper_);
      break
  }
  if(this.transport_) {
    goog.net.xpc.logger.info("Transport created: " + this.transport_.getName())
  }else {
    throw Error("CrossPageChannel: No suitable transport found!");
  }
};
goog.net.xpc.CrossPageChannel.prototype.getTransportType = function() {
  return this.transport_.getType()
};
goog.net.xpc.CrossPageChannel.prototype.getTransportName = function() {
  return this.transport_.getName()
};
goog.net.xpc.CrossPageChannel.prototype.getPeerConfiguration = function() {
  var peerCfg = {};
  peerCfg[goog.net.xpc.CfgFields.CHANNEL_NAME] = this.name;
  peerCfg[goog.net.xpc.CfgFields.TRANSPORT] = this.cfg_[goog.net.xpc.CfgFields.TRANSPORT];
  if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_RELAY_URI]) {
    peerCfg[goog.net.xpc.CfgFields.PEER_RELAY_URI] = this.cfg_[goog.net.xpc.CfgFields.LOCAL_RELAY_URI]
  }
  if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI]) {
    peerCfg[goog.net.xpc.CfgFields.PEER_POLL_URI] = this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI]
  }
  if(this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]) {
    peerCfg[goog.net.xpc.CfgFields.LOCAL_POLL_URI] = this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]
  }
  return peerCfg
};
goog.net.xpc.CrossPageChannel.prototype.createPeerIframe = function(parentElm, opt_configureIframeCb, opt_addCfgParam) {
  var iframeId = this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID];
  if(!iframeId) {
    iframeId = this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID] = "xpcpeer" + goog.net.xpc.getRandomString(4)
  }
  var iframeElm = goog.dom.createElement("IFRAME");
  iframeElm.id = iframeElm.name = iframeId;
  if(opt_configureIframeCb) {
    opt_configureIframeCb(iframeElm)
  }else {
    iframeElm.style.width = iframeElm.style.height = "100%"
  }
  var peerUri = this.cfg_[goog.net.xpc.CfgFields.PEER_URI];
  if(goog.isString(peerUri)) {
    peerUri = this.cfg_[goog.net.xpc.CfgFields.PEER_URI] = new goog.Uri(peerUri)
  }
  if(opt_addCfgParam !== false) {
    peerUri.setParameterValue("xpc", goog.json.serialize(this.getPeerConfiguration()))
  }
  if(goog.userAgent.GECKO || goog.userAgent.WEBKIT) {
    this.deferConnect_ = true;
    window.setTimeout(goog.bind(function() {
      this.deferConnect_ = false;
      parentElm.appendChild(iframeElm);
      iframeElm.src = peerUri.toString();
      goog.net.xpc.logger.info("peer iframe created (" + iframeId + ")");
      if(this.connectDeferred_) {
        this.connect(this.connectCb_)
      }
    }, this), 1)
  }else {
    iframeElm.src = peerUri.toString();
    parentElm.appendChild(iframeElm);
    goog.net.xpc.logger.info("peer iframe created (" + iframeId + ")")
  }
  return iframeElm
};
goog.net.xpc.CrossPageChannel.prototype.deferConnect_ = false;
goog.net.xpc.CrossPageChannel.prototype.connectDeferred_ = false;
goog.net.xpc.CrossPageChannel.prototype.connect = function(opt_connectCb) {
  this.connectCb_ = opt_connectCb || goog.nullFunction;
  if(this.deferConnect_) {
    goog.net.xpc.logger.info("connect() deferred");
    this.connectDeferred_ = true;
    return
  }
  goog.net.xpc.logger.info("connect()");
  if(this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID]) {
    this.iframeElement_ = this.domHelper_.getElement(this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID])
  }
  if(this.iframeElement_) {
    var winObj = this.iframeElement_.contentWindow;
    if(!winObj) {
      winObj = window.frames[this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID]]
    }
    this.setPeerWindowObject(winObj)
  }
  if(!this.peerWindowObject_) {
    if(window == top) {
      throw Error("CrossPageChannel: Can't connect, peer window-object not set.");
    }else {
      this.setPeerWindowObject(window.parent)
    }
  }
  this.createTransport_();
  this.transport_.connect()
};
goog.net.xpc.CrossPageChannel.prototype.close = function() {
  if(!this.isConnected()) {
    return
  }
  this.state_ = goog.net.xpc.ChannelStates.CLOSED;
  this.transport_.dispose();
  this.transport_ = null;
  goog.net.xpc.logger.info('Channel "' + this.name + '" closed')
};
goog.net.xpc.CrossPageChannel.prototype.notifyConnected_ = function() {
  if(this.isConnected()) {
    return
  }
  this.state_ = goog.net.xpc.ChannelStates.CONNECTED;
  goog.net.xpc.logger.info('Channel "' + this.name + '" connected');
  this.connectCb_()
};
goog.net.xpc.CrossPageChannel.prototype.notifyTransportError_ = function() {
  goog.net.xpc.logger.info("Transport Error");
  this.close()
};
goog.net.xpc.CrossPageChannel.prototype.send = function(serviceName, payload) {
  if(!this.isConnected()) {
    goog.net.xpc.logger.severe("Can't send. Channel not connected.");
    return
  }
  if(this.peerWindowObject_.closed) {
    goog.net.xpc.logger.severe("Peer has disappeared.");
    this.close();
    return
  }
  if(goog.isObject(payload)) {
    payload = goog.json.serialize(payload)
  }
  this.transport_.send(this.escapeServiceName_(serviceName), payload)
};
goog.net.xpc.CrossPageChannel.prototype.deliver_ = function(serviceName, payload, opt_origin) {
  if(!this.isMessageOriginAcceptable_(opt_origin)) {
    goog.net.xpc.logger.warning('Message received from unapproved origin "' + opt_origin + '" - rejected.');
    return
  }
  if(this.isDisposed()) {
    goog.net.xpc.logger.warning("CrossPageChannel::deliver_(): Disposed.")
  }else {
    if(!serviceName || serviceName == goog.net.xpc.TRANSPORT_SERVICE_) {
      this.transport_.transportServiceHandler(payload)
    }else {
      if(this.isConnected()) {
        this.deliver(this.unescapeServiceName_(serviceName), payload)
      }else {
        goog.net.xpc.logger.info("CrossPageChannel::deliver_(): Not connected.")
      }
    }
  }
};
goog.net.xpc.CrossPageChannel.prototype.escapeServiceName_ = function(name) {
  if(goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_ESCAPE_RE_.test(name)) {
    name = "%" + name
  }
  return name.replace(/[%:|]/g, encodeURIComponent)
};
goog.net.xpc.CrossPageChannel.prototype.unescapeServiceName_ = function(name) {
  name = name.replace(/%[0-9a-f]{2}/gi, decodeURIComponent);
  if(goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_UNESCAPE_RE_.test(name)) {
    return name.substring(1)
  }else {
    return name
  }
};
goog.net.xpc.CrossPageChannel.Role = {OUTER:0, INNER:1};
goog.net.xpc.CrossPageChannel.prototype.getRole = function() {
  return window.parent == this.peerWindowObject_ ? goog.net.xpc.CrossPageChannel.Role.INNER : goog.net.xpc.CrossPageChannel.Role.OUTER
};
goog.net.xpc.CrossPageChannel.prototype.isMessageOriginAcceptable_ = function(opt_origin) {
  var peerHostname = this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME];
  return goog.string.isEmptySafe(opt_origin) || goog.string.isEmptySafe(peerHostname) || opt_origin == this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME]
};
goog.net.xpc.CrossPageChannel.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  this.close();
  this.peerWindowObject_ = null;
  this.iframeElement_ = null;
  delete goog.net.xpc.channels_[this.name]
};
goog.net.xpc.CrossPageChannel.disposeAll_ = function() {
  for(var name in goog.net.xpc.channels_) {
    var ch = goog.net.xpc.channels_[name];
    if(ch) {
      ch.dispose()
    }
  }
};
goog.provide("goog.events.FocusHandler");
goog.provide("goog.events.FocusHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.userAgent");
goog.events.FocusHandler = function(element) {
  goog.events.EventTarget.call(this);
  this.element_ = element;
  var typeIn = goog.userAgent.IE ? "focusin" : "focus";
  var typeOut = goog.userAgent.IE ? "focusout" : "blur";
  this.listenKeyIn_ = goog.events.listen(this.element_, typeIn, this, !goog.userAgent.IE);
  this.listenKeyOut_ = goog.events.listen(this.element_, typeOut, this, !goog.userAgent.IE)
};
goog.inherits(goog.events.FocusHandler, goog.events.EventTarget);
goog.events.FocusHandler.EventType = {FOCUSIN:"focusin", FOCUSOUT:"focusout"};
goog.events.FocusHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var event = new goog.events.BrowserEvent(be);
  event.type = e.type == "focusin" || e.type == "focus" ? goog.events.FocusHandler.EventType.FOCUSIN : goog.events.FocusHandler.EventType.FOCUSOUT;
  try {
    this.dispatchEvent(event)
  }finally {
    event.dispose()
  }
};
goog.events.FocusHandler.prototype.disposeInternal = function() {
  goog.events.FocusHandler.superClass_.disposeInternal.call(this);
  goog.events.unlistenByKey(this.listenKeyIn_);
  goog.events.unlistenByKey(this.listenKeyOut_);
  delete this.element_
};
goog.provide("goog.ui.tree.TreeControl");
goog.require("goog.debug.Logger");
goog.require("goog.dom.a11y");
goog.require("goog.dom.classes");
goog.require("goog.events.EventType");
goog.require("goog.events.FocusHandler");
goog.require("goog.events.KeyHandler");
goog.require("goog.events.KeyHandler.EventType");
goog.require("goog.ui.tree.BaseNode");
goog.require("goog.ui.tree.TreeNode");
goog.require("goog.ui.tree.TypeAhead");
goog.require("goog.userAgent");
goog.ui.tree.TreeControl = function(html, opt_config, opt_domHelper) {
  goog.ui.tree.BaseNode.call(this, html, opt_config, opt_domHelper);
  this.setExpandedInternal(true);
  this.setSelectedInternal(true);
  this.selectedItem_ = this;
  this.typeAhead_ = new goog.ui.tree.TypeAhead;
  if(goog.userAgent.IE) {
    try {
      document.execCommand("BackgroundImageCache", false, true)
    }catch(e) {
      this.logger_.warning("Failed to enable background image cache")
    }
  }
};
goog.inherits(goog.ui.tree.TreeControl, goog.ui.tree.BaseNode);
goog.ui.tree.TreeControl.prototype.keyHandler_ = null;
goog.ui.tree.TreeControl.prototype.focusHandler_ = null;
goog.ui.tree.TreeControl.prototype.logger_ = goog.debug.Logger.getLogger("goog.ui.tree.TreeControl");
goog.ui.tree.TreeControl.prototype.focused_ = false;
goog.ui.tree.TreeControl.prototype.focusedNode_ = null;
goog.ui.tree.TreeControl.prototype.showLines_ = true;
goog.ui.tree.TreeControl.prototype.showExpandIcons_ = true;
goog.ui.tree.TreeControl.prototype.showRootNode_ = true;
goog.ui.tree.TreeControl.prototype.showRootLines_ = true;
goog.ui.tree.TreeControl.prototype.getTree = function() {
  return this
};
goog.ui.tree.TreeControl.prototype.getDepth = function() {
  return 0
};
goog.ui.tree.TreeControl.prototype.reveal = function() {
};
goog.ui.tree.TreeControl.prototype.handleFocus_ = function(e) {
  this.focused_ = true;
  goog.dom.classes.add(this.getElement(), "focused");
  if(this.selectedItem_) {
    this.selectedItem_.select()
  }
};
goog.ui.tree.TreeControl.prototype.handleBlur_ = function(e) {
  this.focused_ = false;
  goog.dom.classes.remove(this.getElement(), "focused")
};
goog.ui.tree.TreeControl.prototype.hasFocus = function() {
  return this.focused_
};
goog.ui.tree.TreeControl.prototype.getExpanded = function() {
  return!this.showRootNode_ || goog.ui.tree.TreeControl.superClass_.getExpanded.call(this)
};
goog.ui.tree.TreeControl.prototype.setExpanded = function(expanded) {
  if(!this.showRootNode_) {
    this.setExpandedInternal(expanded)
  }else {
    goog.ui.tree.TreeControl.superClass_.setExpanded.call(this, expanded)
  }
};
goog.ui.tree.TreeControl.prototype.getExpandIconHtml = function() {
  return""
};
goog.ui.tree.TreeControl.prototype.getIconElement = function() {
  var el = this.getRowElement();
  return el ? el.firstChild : null
};
goog.ui.tree.TreeControl.prototype.getExpandIconElement = function() {
  return null
};
goog.ui.tree.TreeControl.prototype.updateExpandIcon = function() {
};
goog.ui.tree.TreeControl.prototype.getRowClassName = function() {
  return goog.ui.tree.TreeControl.superClass_.getRowClassName.call(this) + (this.showRootNode_ ? "" : " " + this.getConfig().cssHideRoot)
};
goog.ui.tree.TreeControl.prototype.getCalculatedIconClass = function() {
  var expanded = this.getExpanded();
  if(expanded && this.expandedIconClass_) {
    return this.expandedIconClass_
  }
  if(!expanded && this.iconClass_) {
    return this.iconClass_
  }
  var config = this.getConfig();
  if(expanded && config.cssExpandedRootIcon) {
    return config.cssTreeIcon + " " + config.cssExpandedRootIcon
  }else {
    if(!expanded && config.cssCollapsedRootIcon) {
      return config.cssTreeIcon + " " + config.cssCollapsedRootIcon
    }
  }
  return""
};
goog.ui.tree.TreeControl.prototype.setSelectedItem = function(node) {
  if(this.selectedItem_ == node) {
    return
  }
  var hadFocus = false;
  if(this.selectedItem_) {
    hadFocus = this.selectedItem_ == this.focusedNode_;
    this.selectedItem_.setSelectedInternal(false)
  }
  this.selectedItem_ = node;
  if(node) {
    node.setSelectedInternal(true);
    if(hadFocus) {
      node.select()
    }
  }
  this.dispatchEvent(goog.events.EventType.CHANGE)
};
goog.ui.tree.TreeControl.prototype.getSelectedItem = function() {
  return this.selectedItem_
};
goog.ui.tree.TreeControl.prototype.setShowLines = function(b) {
  if(this.showLines_ != b) {
    this.showLines_ = b;
    if(this.isInDocument()) {
      this.updateLinesAndExpandIcons_()
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowLines = function() {
  return this.showLines_
};
goog.ui.tree.TreeControl.prototype.updateLinesAndExpandIcons_ = function() {
  var tree = this;
  var showLines = tree.getShowLines();
  var showRootLines = tree.getShowRootLines();
  function updateShowLines(node) {
    var childrenEl = node.getChildrenElement();
    if(childrenEl) {
      var hideLines = !showLines || tree == node.getParent() && !showRootLines;
      var childClass = hideLines ? node.getConfig().cssChildrenNoLines : node.getConfig().cssChildren;
      childrenEl.className = childClass;
      var expandIconEl = node.getExpandIconElement();
      if(expandIconEl) {
        expandIconEl.className = node.getExpandIconClass()
      }
    }
    node.forEachChild(updateShowLines)
  }
  updateShowLines(this)
};
goog.ui.tree.TreeControl.prototype.setShowRootLines = function(b) {
  if(this.showRootLines_ != b) {
    this.showRootLines_ = b;
    if(this.isInDocument()) {
      this.updateLinesAndExpandIcons_()
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowRootLines = function() {
  return this.showRootLines_
};
goog.ui.tree.TreeControl.prototype.setShowExpandIcons = function(b) {
  if(this.showExpandIcons_ != b) {
    this.showExpandIcons_ = b;
    if(this.isInDocument()) {
      this.updateLinesAndExpandIcons_()
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowExpandIcons = function() {
  return this.showExpandIcons_
};
goog.ui.tree.TreeControl.prototype.setShowRootNode = function(b) {
  if(this.showRootNode_ != b) {
    this.showRootNode_ = b;
    if(this.isInDocument()) {
      var el = this.getRowElement();
      if(el) {
        el.className = this.getRowClassName()
      }
    }
    if(!b && this.getSelectedItem() == this && this.getFirstChild()) {
      this.setSelectedItem(this.getFirstChild())
    }
  }
};
goog.ui.tree.TreeControl.prototype.getShowRootNode = function() {
  return this.showRootNode_
};
goog.ui.tree.TreeControl.prototype.initAccessibility = function() {
  goog.ui.tree.TreeControl.superClass_.initAccessibility.call(this);
  var elt = this.getElement();
  goog.dom.a11y.setRole(elt, "tree");
  goog.dom.a11y.setState(elt, "labelledby", this.getLabelElement().id)
};
goog.ui.tree.TreeControl.prototype.enterDocument = function() {
  goog.ui.tree.TreeControl.superClass_.enterDocument.call(this);
  var el = this.getElement();
  el.className = this.getConfig().cssRoot;
  el.setAttribute("hideFocus", "true");
  this.attachEvents_();
  this.initAccessibility()
};
goog.ui.tree.TreeControl.prototype.exitDocument = function() {
  goog.ui.tree.TreeControl.superClass_.exitDocument.call(this);
  this.detachEvents_()
};
goog.ui.tree.TreeControl.prototype.attachEvents_ = function() {
  var el = this.getElement();
  el.tabIndex = 0;
  var kh = this.keyHandler_ = new goog.events.KeyHandler(el);
  var fh = this.focusHandler_ = new goog.events.FocusHandler(el);
  this.getHandler().listen(fh, goog.events.FocusHandler.EventType.FOCUSOUT, this.handleBlur_).listen(fh, goog.events.FocusHandler.EventType.FOCUSIN, this.handleFocus_).listen(kh, goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent).listen(el, goog.events.EventType.MOUSEDOWN, this.handleMouseEvent_).listen(el, goog.events.EventType.CLICK, this.handleMouseEvent_).listen(el, goog.events.EventType.DBLCLICK, this.handleMouseEvent_)
};
goog.ui.tree.TreeControl.prototype.detachEvents_ = function() {
  this.keyHandler_.dispose();
  this.keyHandler_ = null;
  this.focusHandler_.dispose();
  this.focusHandler_ = null
};
goog.ui.tree.TreeControl.prototype.handleMouseEvent_ = function(e) {
  this.logger_.fine("Received event " + e.type);
  var node = this.getNodeFromEvent_(e);
  if(node) {
    switch(e.type) {
      case goog.events.EventType.MOUSEDOWN:
        node.onMouseDown(e);
        break;
      case goog.events.EventType.CLICK:
        node.onClick_(e);
        break;
      case goog.events.EventType.DBLCLICK:
        node.onDoubleClick_(e);
        break
    }
  }
};
goog.ui.tree.TreeControl.prototype.handleKeyEvent = function(e) {
  var handled = false;
  handled = this.typeAhead_.handleNavigation(e) || this.selectedItem_ && this.selectedItem_.onKeyDown(e) || this.typeAhead_.handleTypeAheadChar(e);
  if(handled) {
    e.preventDefault()
  }
  return handled
};
goog.ui.tree.TreeControl.prototype.getNodeFromEvent_ = function(e) {
  var node = null;
  var target = e.target;
  while(target != null) {
    var id = target.id;
    node = goog.ui.tree.BaseNode.allNodes[id];
    if(node) {
      return node
    }
    if(target == this.getElement()) {
      break
    }
    target = target.parentNode
  }
  return null
};
goog.ui.tree.TreeControl.prototype.createNode = function(html) {
  return new goog.ui.tree.TreeNode(html || "", this.getConfig(), this.getDomHelper())
};
goog.ui.tree.TreeControl.prototype.setNode = function(node) {
  this.typeAhead_.setNodeInMap(node)
};
goog.ui.tree.TreeControl.prototype.removeNode = function(node) {
  this.typeAhead_.removeNodeFromMap(node)
};
goog.ui.tree.TreeControl.prototype.clearTypeAhead = function() {
  this.typeAhead_.clear()
};
goog.ui.tree.TreeControl.defaultConfig = {cleardotPath:"images/cleardot.gif", indentWidth:19, cssRoot:goog.getCssName("goog-tree-root") + " " + goog.getCssName("goog-tree-item"), cssHideRoot:goog.getCssName("goog-tree-hide-root"), cssItem:goog.getCssName("goog-tree-item"), cssChildren:goog.getCssName("goog-tree-children"), cssChildrenNoLines:goog.getCssName("goog-tree-children-nolines"), cssTreeRow:goog.getCssName("goog-tree-row"), cssItemLabel:goog.getCssName("goog-tree-item-label"), cssTreeIcon:goog.getCssName("goog-tree-icon"), 
cssExpandTreeIcon:goog.getCssName("goog-tree-expand-icon"), cssExpandTreeIconPlus:goog.getCssName("goog-tree-expand-icon-plus"), cssExpandTreeIconMinus:goog.getCssName("goog-tree-expand-icon-minus"), cssExpandTreeIconTPlus:goog.getCssName("goog-tree-expand-icon-tplus"), cssExpandTreeIconTMinus:goog.getCssName("goog-tree-expand-icon-tminus"), cssExpandTreeIconLPlus:goog.getCssName("goog-tree-expand-icon-lplus"), cssExpandTreeIconLMinus:goog.getCssName("goog-tree-expand-icon-lminus"), cssExpandTreeIconT:goog.getCssName("goog-tree-expand-icon-t"), 
cssExpandTreeIconL:goog.getCssName("goog-tree-expand-icon-l"), cssExpandTreeIconBlank:goog.getCssName("goog-tree-expand-icon-blank"), cssExpandedFolderIcon:goog.getCssName("goog-tree-expanded-folder-icon"), cssCollapsedFolderIcon:goog.getCssName("goog-tree-collapsed-folder-icon"), cssFileIcon:goog.getCssName("goog-tree-file-icon"), cssExpandedRootIcon:goog.getCssName("goog-tree-expanded-folder-icon"), cssCollapsedRootIcon:goog.getCssName("goog-tree-collapsed-folder-icon"), cssSelectedRow:goog.getCssName("selected")};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____7235 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____7235)) {
    return or__3548__auto____7235
  }else {
    var or__3548__auto____7236 = p["_"];
    if(cljs.core.truth_(or__3548__auto____7236)) {
      return or__3548__auto____7236
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__7300 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7237 = this$;
      if(cljs.core.truth_(and__3546__auto____7237)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7237
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____7238 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7238)) {
          return or__3548__auto____7238
        }else {
          var or__3548__auto____7239 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7239)) {
            return or__3548__auto____7239
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__7301 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7240 = this$;
      if(cljs.core.truth_(and__3546__auto____7240)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7240
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____7241 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7241)) {
          return or__3548__auto____7241
        }else {
          var or__3548__auto____7242 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7242)) {
            return or__3548__auto____7242
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__7302 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7243 = this$;
      if(cljs.core.truth_(and__3546__auto____7243)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7243
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____7244 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7244)) {
          return or__3548__auto____7244
        }else {
          var or__3548__auto____7245 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7245)) {
            return or__3548__auto____7245
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__7303 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7246 = this$;
      if(cljs.core.truth_(and__3546__auto____7246)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7246
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____7247 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7247)) {
          return or__3548__auto____7247
        }else {
          var or__3548__auto____7248 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7248)) {
            return or__3548__auto____7248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__7304 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7249 = this$;
      if(cljs.core.truth_(and__3546__auto____7249)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7249
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____7250 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7250)) {
          return or__3548__auto____7250
        }else {
          var or__3548__auto____7251 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7251)) {
            return or__3548__auto____7251
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__7305 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7252 = this$;
      if(cljs.core.truth_(and__3546__auto____7252)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7252
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____7253 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7253)) {
          return or__3548__auto____7253
        }else {
          var or__3548__auto____7254 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7254)) {
            return or__3548__auto____7254
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7306 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7255 = this$;
      if(cljs.core.truth_(and__3546__auto____7255)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7255
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____7256 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7256)) {
          return or__3548__auto____7256
        }else {
          var or__3548__auto____7257 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7257)) {
            return or__3548__auto____7257
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__7307 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7258 = this$;
      if(cljs.core.truth_(and__3546__auto____7258)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7258
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____7259 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7259)) {
          return or__3548__auto____7259
        }else {
          var or__3548__auto____7260 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7260)) {
            return or__3548__auto____7260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__7308 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7261 = this$;
      if(cljs.core.truth_(and__3546__auto____7261)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7261
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____7262 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7262)) {
          return or__3548__auto____7262
        }else {
          var or__3548__auto____7263 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7263)) {
            return or__3548__auto____7263
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__7309 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7264 = this$;
      if(cljs.core.truth_(and__3546__auto____7264)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7264
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____7265 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7265)) {
          return or__3548__auto____7265
        }else {
          var or__3548__auto____7266 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7266)) {
            return or__3548__auto____7266
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__7310 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7267 = this$;
      if(cljs.core.truth_(and__3546__auto____7267)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7267
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____7268 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7268)) {
          return or__3548__auto____7268
        }else {
          var or__3548__auto____7269 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7269)) {
            return or__3548__auto____7269
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__7311 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7270 = this$;
      if(cljs.core.truth_(and__3546__auto____7270)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7270
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____7271 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7271)) {
          return or__3548__auto____7271
        }else {
          var or__3548__auto____7272 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7272)) {
            return or__3548__auto____7272
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__7312 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7273 = this$;
      if(cljs.core.truth_(and__3546__auto____7273)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7273
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____7274 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7274)) {
          return or__3548__auto____7274
        }else {
          var or__3548__auto____7275 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7275)) {
            return or__3548__auto____7275
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__7313 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7276 = this$;
      if(cljs.core.truth_(and__3546__auto____7276)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7276
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____7277 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7277)) {
          return or__3548__auto____7277
        }else {
          var or__3548__auto____7278 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7278)) {
            return or__3548__auto____7278
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__7314 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7279 = this$;
      if(cljs.core.truth_(and__3546__auto____7279)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7279
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____7280 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7280)) {
          return or__3548__auto____7280
        }else {
          var or__3548__auto____7281 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7281)) {
            return or__3548__auto____7281
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__7315 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7282 = this$;
      if(cljs.core.truth_(and__3546__auto____7282)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7282
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____7283 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7283)) {
          return or__3548__auto____7283
        }else {
          var or__3548__auto____7284 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7284)) {
            return or__3548__auto____7284
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__7316 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7285 = this$;
      if(cljs.core.truth_(and__3546__auto____7285)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7285
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____7286 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7286)) {
          return or__3548__auto____7286
        }else {
          var or__3548__auto____7287 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7287)) {
            return or__3548__auto____7287
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__7317 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7288 = this$;
      if(cljs.core.truth_(and__3546__auto____7288)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7288
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____7289 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7289)) {
          return or__3548__auto____7289
        }else {
          var or__3548__auto____7290 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7290)) {
            return or__3548__auto____7290
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__7318 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7291 = this$;
      if(cljs.core.truth_(and__3546__auto____7291)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7291
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____7292 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7292)) {
          return or__3548__auto____7292
        }else {
          var or__3548__auto____7293 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7293)) {
            return or__3548__auto____7293
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__7319 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7294 = this$;
      if(cljs.core.truth_(and__3546__auto____7294)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7294
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____7295 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7295)) {
          return or__3548__auto____7295
        }else {
          var or__3548__auto____7296 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7296)) {
            return or__3548__auto____7296
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__7320 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7297 = this$;
      if(cljs.core.truth_(and__3546__auto____7297)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____7297
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____7298 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____7298)) {
          return or__3548__auto____7298
        }else {
          var or__3548__auto____7299 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____7299)) {
            return or__3548__auto____7299
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__7300.call(this, this$);
      case 2:
        return _invoke__7301.call(this, this$, a);
      case 3:
        return _invoke__7302.call(this, this$, a, b);
      case 4:
        return _invoke__7303.call(this, this$, a, b, c);
      case 5:
        return _invoke__7304.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__7305.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7306.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__7307.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__7308.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__7309.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__7310.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__7311.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__7312.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__7313.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__7314.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__7315.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__7316.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__7317.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__7318.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__7319.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__7320.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7322 = coll;
    if(cljs.core.truth_(and__3546__auto____7322)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____7322
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____7323 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7323)) {
        return or__3548__auto____7323
      }else {
        var or__3548__auto____7324 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____7324)) {
          return or__3548__auto____7324
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7325 = coll;
    if(cljs.core.truth_(and__3546__auto____7325)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____7325
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____7326 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7326)) {
        return or__3548__auto____7326
      }else {
        var or__3548__auto____7327 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____7327)) {
          return or__3548__auto____7327
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7328 = coll;
    if(cljs.core.truth_(and__3546__auto____7328)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____7328
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____7329 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7329)) {
        return or__3548__auto____7329
      }else {
        var or__3548__auto____7330 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____7330)) {
          return or__3548__auto____7330
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__7337 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7331 = coll;
      if(cljs.core.truth_(and__3546__auto____7331)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____7331
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____7332 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____7332)) {
          return or__3548__auto____7332
        }else {
          var or__3548__auto____7333 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____7333)) {
            return or__3548__auto____7333
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__7338 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7334 = coll;
      if(cljs.core.truth_(and__3546__auto____7334)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____7334
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____7335 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____7335)) {
          return or__3548__auto____7335
        }else {
          var or__3548__auto____7336 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____7336)) {
            return or__3548__auto____7336
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__7337.call(this, coll, n);
      case 3:
        return _nth__7338.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7340 = coll;
    if(cljs.core.truth_(and__3546__auto____7340)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____7340
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____7341 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7341)) {
        return or__3548__auto____7341
      }else {
        var or__3548__auto____7342 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____7342)) {
          return or__3548__auto____7342
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7343 = coll;
    if(cljs.core.truth_(and__3546__auto____7343)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____7343
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____7344 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7344)) {
        return or__3548__auto____7344
      }else {
        var or__3548__auto____7345 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____7345)) {
          return or__3548__auto____7345
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__7352 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7346 = o;
      if(cljs.core.truth_(and__3546__auto____7346)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____7346
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____7347 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____7347)) {
          return or__3548__auto____7347
        }else {
          var or__3548__auto____7348 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____7348)) {
            return or__3548__auto____7348
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__7353 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7349 = o;
      if(cljs.core.truth_(and__3546__auto____7349)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____7349
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____7350 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____7350)) {
          return or__3548__auto____7350
        }else {
          var or__3548__auto____7351 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____7351)) {
            return or__3548__auto____7351
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__7352.call(this, o, k);
      case 3:
        return _lookup__7353.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7355 = coll;
    if(cljs.core.truth_(and__3546__auto____7355)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____7355
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____7356 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7356)) {
        return or__3548__auto____7356
      }else {
        var or__3548__auto____7357 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____7357)) {
          return or__3548__auto____7357
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7358 = coll;
    if(cljs.core.truth_(and__3546__auto____7358)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____7358
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____7359 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7359)) {
        return or__3548__auto____7359
      }else {
        var or__3548__auto____7360 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____7360)) {
          return or__3548__auto____7360
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7361 = coll;
    if(cljs.core.truth_(and__3546__auto____7361)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____7361
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____7362 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7362)) {
        return or__3548__auto____7362
      }else {
        var or__3548__auto____7363 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____7363)) {
          return or__3548__auto____7363
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7364 = coll;
    if(cljs.core.truth_(and__3546__auto____7364)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____7364
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____7365 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7365)) {
        return or__3548__auto____7365
      }else {
        var or__3548__auto____7366 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____7366)) {
          return or__3548__auto____7366
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7367 = coll;
    if(cljs.core.truth_(and__3546__auto____7367)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____7367
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____7368 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7368)) {
        return or__3548__auto____7368
      }else {
        var or__3548__auto____7369 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____7369)) {
          return or__3548__auto____7369
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7370 = coll;
    if(cljs.core.truth_(and__3546__auto____7370)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____7370
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____7371 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7371)) {
        return or__3548__auto____7371
      }else {
        var or__3548__auto____7372 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____7372)) {
          return or__3548__auto____7372
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7373 = coll;
    if(cljs.core.truth_(and__3546__auto____7373)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____7373
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____7374 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____7374)) {
        return or__3548__auto____7374
      }else {
        var or__3548__auto____7375 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____7375)) {
          return or__3548__auto____7375
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7376 = o;
    if(cljs.core.truth_(and__3546__auto____7376)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____7376
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____7377 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7377)) {
        return or__3548__auto____7377
      }else {
        var or__3548__auto____7378 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____7378)) {
          return or__3548__auto____7378
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7379 = o;
    if(cljs.core.truth_(and__3546__auto____7379)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____7379
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____7380 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7380)) {
        return or__3548__auto____7380
      }else {
        var or__3548__auto____7381 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____7381)) {
          return or__3548__auto____7381
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7382 = o;
    if(cljs.core.truth_(and__3546__auto____7382)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____7382
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____7383 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7383)) {
        return or__3548__auto____7383
      }else {
        var or__3548__auto____7384 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____7384)) {
          return or__3548__auto____7384
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7385 = o;
    if(cljs.core.truth_(and__3546__auto____7385)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____7385
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____7386 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7386)) {
        return or__3548__auto____7386
      }else {
        var or__3548__auto____7387 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____7387)) {
          return or__3548__auto____7387
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__7394 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7388 = coll;
      if(cljs.core.truth_(and__3546__auto____7388)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____7388
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____7389 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____7389)) {
          return or__3548__auto____7389
        }else {
          var or__3548__auto____7390 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____7390)) {
            return or__3548__auto____7390
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__7395 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7391 = coll;
      if(cljs.core.truth_(and__3546__auto____7391)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____7391
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____7392 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____7392)) {
          return or__3548__auto____7392
        }else {
          var or__3548__auto____7393 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____7393)) {
            return or__3548__auto____7393
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__7394.call(this, coll, f);
      case 3:
        return _reduce__7395.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7397 = o;
    if(cljs.core.truth_(and__3546__auto____7397)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____7397
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____7398 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7398)) {
        return or__3548__auto____7398
      }else {
        var or__3548__auto____7399 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____7399)) {
          return or__3548__auto____7399
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7400 = o;
    if(cljs.core.truth_(and__3546__auto____7400)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____7400
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____7401 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7401)) {
        return or__3548__auto____7401
      }else {
        var or__3548__auto____7402 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____7402)) {
          return or__3548__auto____7402
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7403 = o;
    if(cljs.core.truth_(and__3546__auto____7403)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____7403
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____7404 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7404)) {
        return or__3548__auto____7404
      }else {
        var or__3548__auto____7405 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____7405)) {
          return or__3548__auto____7405
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7406 = o;
    if(cljs.core.truth_(and__3546__auto____7406)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____7406
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____7407 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____7407)) {
        return or__3548__auto____7407
      }else {
        var or__3548__auto____7408 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____7408)) {
          return or__3548__auto____7408
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7409 = d;
    if(cljs.core.truth_(and__3546__auto____7409)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____7409
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____7410 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____7410)) {
        return or__3548__auto____7410
      }else {
        var or__3548__auto____7411 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____7411)) {
          return or__3548__auto____7411
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7412 = this$;
    if(cljs.core.truth_(and__3546__auto____7412)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____7412
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____7413 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____7413)) {
        return or__3548__auto____7413
      }else {
        var or__3548__auto____7414 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____7414)) {
          return or__3548__auto____7414
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7415 = this$;
    if(cljs.core.truth_(and__3546__auto____7415)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____7415
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____7416 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____7416)) {
        return or__3548__auto____7416
      }else {
        var or__3548__auto____7417 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____7417)) {
          return or__3548__auto____7417
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7418 = this$;
    if(cljs.core.truth_(and__3546__auto____7418)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____7418
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____7419 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____7419)) {
        return or__3548__auto____7419
      }else {
        var or__3548__auto____7420 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____7420)) {
          return or__3548__auto____7420
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7421 = null;
  var G__7421__7422 = function(o, k) {
    return null
  };
  var G__7421__7423 = function(o, k, not_found) {
    return not_found
  };
  G__7421 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7421__7422.call(this, o, k);
      case 3:
        return G__7421__7423.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7421
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7425 = null;
  var G__7425__7426 = function(_, f) {
    return f.call(null)
  };
  var G__7425__7427 = function(_, f, start) {
    return start
  };
  G__7425 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7425__7426.call(this, _, f);
      case 3:
        return G__7425__7427.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7425
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7429 = null;
  var G__7429__7430 = function(_, n) {
    return null
  };
  var G__7429__7431 = function(_, n, not_found) {
    return not_found
  };
  G__7429 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7429__7430.call(this, _, n);
      case 3:
        return G__7429__7431.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7429
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__7439 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__7433 = cljs.core._nth.call(null, cicoll, 0);
      var n__7434 = 1;
      while(true) {
        if(cljs.core.truth_(n__7434 < cljs.core._count.call(null, cicoll))) {
          var G__7443 = f.call(null, val__7433, cljs.core._nth.call(null, cicoll, n__7434));
          var G__7444 = n__7434 + 1;
          val__7433 = G__7443;
          n__7434 = G__7444;
          continue
        }else {
          return val__7433
        }
        break
      }
    }
  };
  var ci_reduce__7440 = function(cicoll, f, val) {
    var val__7435 = val;
    var n__7436 = 0;
    while(true) {
      if(cljs.core.truth_(n__7436 < cljs.core._count.call(null, cicoll))) {
        var G__7445 = f.call(null, val__7435, cljs.core._nth.call(null, cicoll, n__7436));
        var G__7446 = n__7436 + 1;
        val__7435 = G__7445;
        n__7436 = G__7446;
        continue
      }else {
        return val__7435
      }
      break
    }
  };
  var ci_reduce__7441 = function(cicoll, f, val, idx) {
    var val__7437 = val;
    var n__7438 = idx;
    while(true) {
      if(cljs.core.truth_(n__7438 < cljs.core._count.call(null, cicoll))) {
        var G__7447 = f.call(null, val__7437, cljs.core._nth.call(null, cicoll, n__7438));
        var G__7448 = n__7438 + 1;
        val__7437 = G__7447;
        n__7438 = G__7448;
        continue
      }else {
        return val__7437
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__7439.call(this, cicoll, f);
      case 3:
        return ci_reduce__7440.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__7441.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__7449 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__7462 = null;
  var G__7462__7463 = function(_, f) {
    var this__7450 = this;
    return cljs.core.ci_reduce.call(null, this__7450.a, f, this__7450.a[this__7450.i], this__7450.i + 1)
  };
  var G__7462__7464 = function(_, f, start) {
    var this__7451 = this;
    return cljs.core.ci_reduce.call(null, this__7451.a, f, start, this__7451.i)
  };
  G__7462 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7462__7463.call(this, _, f);
      case 3:
        return G__7462__7464.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7462
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__7452 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__7453 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__7466 = null;
  var G__7466__7467 = function(coll, n) {
    var this__7454 = this;
    var i__7455 = n + this__7454.i;
    if(cljs.core.truth_(i__7455 < this__7454.a.length)) {
      return this__7454.a[i__7455]
    }else {
      return null
    }
  };
  var G__7466__7468 = function(coll, n, not_found) {
    var this__7456 = this;
    var i__7457 = n + this__7456.i;
    if(cljs.core.truth_(i__7457 < this__7456.a.length)) {
      return this__7456.a[i__7457]
    }else {
      return not_found
    }
  };
  G__7466 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7466__7467.call(this, coll, n);
      case 3:
        return G__7466__7468.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7466
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__7458 = this;
  return this__7458.a.length - this__7458.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__7459 = this;
  return this__7459.a[this__7459.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__7460 = this;
  if(cljs.core.truth_(this__7460.i + 1 < this__7460.a.length)) {
    return new cljs.core.IndexedSeq(this__7460.a, this__7460.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__7461 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7470 = null;
  var G__7470__7471 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7470__7472 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7470 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7470__7471.call(this, array, f);
      case 3:
        return G__7470__7472.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7470
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7474 = null;
  var G__7474__7475 = function(array, k) {
    return array[k]
  };
  var G__7474__7476 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7474 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7474__7475.call(this, array, k);
      case 3:
        return G__7474__7476.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7474
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7478 = null;
  var G__7478__7479 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7478__7480 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7478 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7478__7479.call(this, array, n);
      case 3:
        return G__7478__7480.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7478
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____7482 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____7482)) {
    var s__7483 = temp__3698__auto____7482;
    return cljs.core._first.call(null, s__7483)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__7484 = cljs.core.next.call(null, s);
      s = G__7484;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__7485 = cljs.core.seq.call(null, x);
  var n__7486 = 0;
  while(true) {
    if(cljs.core.truth_(s__7485)) {
      var G__7487 = cljs.core.next.call(null, s__7485);
      var G__7488 = n__7486 + 1;
      s__7485 = G__7487;
      n__7486 = G__7488;
      continue
    }else {
      return n__7486
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__7489 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__7490 = function() {
    var G__7492__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7493 = conj.call(null, coll, x);
          var G__7494 = cljs.core.first.call(null, xs);
          var G__7495 = cljs.core.next.call(null, xs);
          coll = G__7493;
          x = G__7494;
          xs = G__7495;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7492 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7492__delegate.call(this, coll, x, xs)
    };
    G__7492.cljs$lang$maxFixedArity = 2;
    G__7492.cljs$lang$applyTo = function(arglist__7496) {
      var coll = cljs.core.first(arglist__7496);
      var x = cljs.core.first(cljs.core.next(arglist__7496));
      var xs = cljs.core.rest(cljs.core.next(arglist__7496));
      return G__7492__delegate.call(this, coll, x, xs)
    };
    return G__7492
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__7489.call(this, coll, x);
      default:
        return conj__7490.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__7490.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__7497 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__7498 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__7497.call(this, coll, n);
      case 3:
        return nth__7498.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__7500 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__7501 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__7500.call(this, o, k);
      case 3:
        return get__7501.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__7504 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__7505 = function() {
    var G__7507__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7503 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7508 = ret__7503;
          var G__7509 = cljs.core.first.call(null, kvs);
          var G__7510 = cljs.core.second.call(null, kvs);
          var G__7511 = cljs.core.nnext.call(null, kvs);
          coll = G__7508;
          k = G__7509;
          v = G__7510;
          kvs = G__7511;
          continue
        }else {
          return ret__7503
        }
        break
      }
    };
    var G__7507 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7507__delegate.call(this, coll, k, v, kvs)
    };
    G__7507.cljs$lang$maxFixedArity = 3;
    G__7507.cljs$lang$applyTo = function(arglist__7512) {
      var coll = cljs.core.first(arglist__7512);
      var k = cljs.core.first(cljs.core.next(arglist__7512));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7512)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7512)));
      return G__7507__delegate.call(this, coll, k, v, kvs)
    };
    return G__7507
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__7504.call(this, coll, k, v);
      default:
        return assoc__7505.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__7505.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__7514 = function(coll) {
    return coll
  };
  var dissoc__7515 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__7516 = function() {
    var G__7518__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7513 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7519 = ret__7513;
          var G__7520 = cljs.core.first.call(null, ks);
          var G__7521 = cljs.core.next.call(null, ks);
          coll = G__7519;
          k = G__7520;
          ks = G__7521;
          continue
        }else {
          return ret__7513
        }
        break
      }
    };
    var G__7518 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7518__delegate.call(this, coll, k, ks)
    };
    G__7518.cljs$lang$maxFixedArity = 2;
    G__7518.cljs$lang$applyTo = function(arglist__7522) {
      var coll = cljs.core.first(arglist__7522);
      var k = cljs.core.first(cljs.core.next(arglist__7522));
      var ks = cljs.core.rest(cljs.core.next(arglist__7522));
      return G__7518__delegate.call(this, coll, k, ks)
    };
    return G__7518
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__7514.call(this, coll);
      case 2:
        return dissoc__7515.call(this, coll, k);
      default:
        return dissoc__7516.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__7516.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____7523 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____7524 = x__450__auto____7523;
      if(cljs.core.truth_(and__3546__auto____7524)) {
        var and__3546__auto____7525 = x__450__auto____7523.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____7525)) {
          return cljs.core.not.call(null, x__450__auto____7523.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____7525
        }
      }else {
        return and__3546__auto____7524
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____7523)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__7527 = function(coll) {
    return coll
  };
  var disj__7528 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__7529 = function() {
    var G__7531__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7526 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7532 = ret__7526;
          var G__7533 = cljs.core.first.call(null, ks);
          var G__7534 = cljs.core.next.call(null, ks);
          coll = G__7532;
          k = G__7533;
          ks = G__7534;
          continue
        }else {
          return ret__7526
        }
        break
      }
    };
    var G__7531 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7531__delegate.call(this, coll, k, ks)
    };
    G__7531.cljs$lang$maxFixedArity = 2;
    G__7531.cljs$lang$applyTo = function(arglist__7535) {
      var coll = cljs.core.first(arglist__7535);
      var k = cljs.core.first(cljs.core.next(arglist__7535));
      var ks = cljs.core.rest(cljs.core.next(arglist__7535));
      return G__7531__delegate.call(this, coll, k, ks)
    };
    return G__7531
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__7527.call(this, coll);
      case 2:
        return disj__7528.call(this, coll, k);
      default:
        return disj__7529.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__7529.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____7536 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____7537 = x__450__auto____7536;
      if(cljs.core.truth_(and__3546__auto____7537)) {
        var and__3546__auto____7538 = x__450__auto____7536.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____7538)) {
          return cljs.core.not.call(null, x__450__auto____7536.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____7538
        }
      }else {
        return and__3546__auto____7537
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____7536)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____7539 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____7540 = x__450__auto____7539;
      if(cljs.core.truth_(and__3546__auto____7540)) {
        var and__3546__auto____7541 = x__450__auto____7539.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____7541)) {
          return cljs.core.not.call(null, x__450__auto____7539.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____7541
        }
      }else {
        return and__3546__auto____7540
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____7539)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____7542 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____7543 = x__450__auto____7542;
    if(cljs.core.truth_(and__3546__auto____7543)) {
      var and__3546__auto____7544 = x__450__auto____7542.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____7544)) {
        return cljs.core.not.call(null, x__450__auto____7542.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____7544
      }
    }else {
      return and__3546__auto____7543
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____7542)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____7545 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____7546 = x__450__auto____7545;
    if(cljs.core.truth_(and__3546__auto____7546)) {
      var and__3546__auto____7547 = x__450__auto____7545.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____7547)) {
        return cljs.core.not.call(null, x__450__auto____7545.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____7547
      }
    }else {
      return and__3546__auto____7546
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____7545)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____7548 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____7549 = x__450__auto____7548;
    if(cljs.core.truth_(and__3546__auto____7549)) {
      var and__3546__auto____7550 = x__450__auto____7548.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____7550)) {
        return cljs.core.not.call(null, x__450__auto____7548.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____7550
      }
    }else {
      return and__3546__auto____7549
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____7548)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____7551 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____7552 = x__450__auto____7551;
      if(cljs.core.truth_(and__3546__auto____7552)) {
        var and__3546__auto____7553 = x__450__auto____7551.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____7553)) {
          return cljs.core.not.call(null, x__450__auto____7551.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____7553
        }
      }else {
        return and__3546__auto____7552
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____7551)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____7554 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____7555 = x__450__auto____7554;
    if(cljs.core.truth_(and__3546__auto____7555)) {
      var and__3546__auto____7556 = x__450__auto____7554.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____7556)) {
        return cljs.core.not.call(null, x__450__auto____7554.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____7556
      }
    }else {
      return and__3546__auto____7555
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____7554)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__7557 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__7557.push(key)
  });
  return keys__7557
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__450__auto____7558 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____7559 = x__450__auto____7558;
      if(cljs.core.truth_(and__3546__auto____7559)) {
        var and__3546__auto____7560 = x__450__auto____7558.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____7560)) {
          return cljs.core.not.call(null, x__450__auto____7558.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____7560
        }
      }else {
        return and__3546__auto____7559
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____7558)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____7561 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____7561)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____7562 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____7562)) {
        return or__3548__auto____7562
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____7561
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____7563 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____7563)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____7563
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____7564 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____7564)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____7564
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____7565 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____7565)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____7565
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____7566 = coll;
    if(cljs.core.truth_(and__3546__auto____7566)) {
      var and__3546__auto____7567 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____7567)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____7567
      }
    }else {
      return and__3546__auto____7566
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___7572 = function(x) {
    return true
  };
  var distinct_QMARK___7573 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___7574 = function() {
    var G__7576__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__7568 = cljs.core.set([y, x]);
        var xs__7569 = more;
        while(true) {
          var x__7570 = cljs.core.first.call(null, xs__7569);
          var etc__7571 = cljs.core.next.call(null, xs__7569);
          if(cljs.core.truth_(xs__7569)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__7568, x__7570))) {
              return false
            }else {
              var G__7577 = cljs.core.conj.call(null, s__7568, x__7570);
              var G__7578 = etc__7571;
              s__7568 = G__7577;
              xs__7569 = G__7578;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7576 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7576__delegate.call(this, x, y, more)
    };
    G__7576.cljs$lang$maxFixedArity = 2;
    G__7576.cljs$lang$applyTo = function(arglist__7579) {
      var x = cljs.core.first(arglist__7579);
      var y = cljs.core.first(cljs.core.next(arglist__7579));
      var more = cljs.core.rest(cljs.core.next(arglist__7579));
      return G__7576__delegate.call(this, x, y, more)
    };
    return G__7576
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___7572.call(this, x);
      case 2:
        return distinct_QMARK___7573.call(this, x, y);
      default:
        return distinct_QMARK___7574.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___7574.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7580 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__7580))) {
        return r__7580
      }else {
        if(cljs.core.truth_(r__7580)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__7582 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__7583 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__7581 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__7581, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7581)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__7582.call(this, comp);
      case 2:
        return sort__7583.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__7585 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__7586 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__7585.call(this, keyfn, comp);
      case 3:
        return sort_by__7586.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__7588 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__7589 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__7588.call(this, f, val);
      case 3:
        return reduce__7589.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__7595 = function(f, coll) {
    var temp__3695__auto____7591 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____7591)) {
      var s__7592 = temp__3695__auto____7591;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7592), cljs.core.next.call(null, s__7592))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__7596 = function(f, val, coll) {
    var val__7593 = val;
    var coll__7594 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__7594)) {
        var G__7598 = f.call(null, val__7593, cljs.core.first.call(null, coll__7594));
        var G__7599 = cljs.core.next.call(null, coll__7594);
        val__7593 = G__7598;
        coll__7594 = G__7599;
        continue
      }else {
        return val__7593
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__7595.call(this, f, val);
      case 3:
        return seq_reduce__7596.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__7600 = null;
  var G__7600__7601 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__7600__7602 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__7600 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7600__7601.call(this, coll, f);
      case 3:
        return G__7600__7602.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7600
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___7604 = function() {
    return 0
  };
  var _PLUS___7605 = function(x) {
    return x
  };
  var _PLUS___7606 = function(x, y) {
    return x + y
  };
  var _PLUS___7607 = function() {
    var G__7609__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7609 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7609__delegate.call(this, x, y, more)
    };
    G__7609.cljs$lang$maxFixedArity = 2;
    G__7609.cljs$lang$applyTo = function(arglist__7610) {
      var x = cljs.core.first(arglist__7610);
      var y = cljs.core.first(cljs.core.next(arglist__7610));
      var more = cljs.core.rest(cljs.core.next(arglist__7610));
      return G__7609__delegate.call(this, x, y, more)
    };
    return G__7609
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___7604.call(this);
      case 1:
        return _PLUS___7605.call(this, x);
      case 2:
        return _PLUS___7606.call(this, x, y);
      default:
        return _PLUS___7607.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___7607.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___7611 = function(x) {
    return-x
  };
  var ___7612 = function(x, y) {
    return x - y
  };
  var ___7613 = function() {
    var G__7615__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7615 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7615__delegate.call(this, x, y, more)
    };
    G__7615.cljs$lang$maxFixedArity = 2;
    G__7615.cljs$lang$applyTo = function(arglist__7616) {
      var x = cljs.core.first(arglist__7616);
      var y = cljs.core.first(cljs.core.next(arglist__7616));
      var more = cljs.core.rest(cljs.core.next(arglist__7616));
      return G__7615__delegate.call(this, x, y, more)
    };
    return G__7615
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___7611.call(this, x);
      case 2:
        return ___7612.call(this, x, y);
      default:
        return ___7613.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___7613.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___7617 = function() {
    return 1
  };
  var _STAR___7618 = function(x) {
    return x
  };
  var _STAR___7619 = function(x, y) {
    return x * y
  };
  var _STAR___7620 = function() {
    var G__7622__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7622 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7622__delegate.call(this, x, y, more)
    };
    G__7622.cljs$lang$maxFixedArity = 2;
    G__7622.cljs$lang$applyTo = function(arglist__7623) {
      var x = cljs.core.first(arglist__7623);
      var y = cljs.core.first(cljs.core.next(arglist__7623));
      var more = cljs.core.rest(cljs.core.next(arglist__7623));
      return G__7622__delegate.call(this, x, y, more)
    };
    return G__7622
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___7617.call(this);
      case 1:
        return _STAR___7618.call(this, x);
      case 2:
        return _STAR___7619.call(this, x, y);
      default:
        return _STAR___7620.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___7620.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___7624 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___7625 = function(x, y) {
    return x / y
  };
  var _SLASH___7626 = function() {
    var G__7628__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7628 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7628__delegate.call(this, x, y, more)
    };
    G__7628.cljs$lang$maxFixedArity = 2;
    G__7628.cljs$lang$applyTo = function(arglist__7629) {
      var x = cljs.core.first(arglist__7629);
      var y = cljs.core.first(cljs.core.next(arglist__7629));
      var more = cljs.core.rest(cljs.core.next(arglist__7629));
      return G__7628__delegate.call(this, x, y, more)
    };
    return G__7628
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___7624.call(this, x);
      case 2:
        return _SLASH___7625.call(this, x, y);
      default:
        return _SLASH___7626.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___7626.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___7630 = function(x) {
    return true
  };
  var _LT___7631 = function(x, y) {
    return x < y
  };
  var _LT___7632 = function() {
    var G__7634__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__7635 = y;
            var G__7636 = cljs.core.first.call(null, more);
            var G__7637 = cljs.core.next.call(null, more);
            x = G__7635;
            y = G__7636;
            more = G__7637;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7634 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7634__delegate.call(this, x, y, more)
    };
    G__7634.cljs$lang$maxFixedArity = 2;
    G__7634.cljs$lang$applyTo = function(arglist__7638) {
      var x = cljs.core.first(arglist__7638);
      var y = cljs.core.first(cljs.core.next(arglist__7638));
      var more = cljs.core.rest(cljs.core.next(arglist__7638));
      return G__7634__delegate.call(this, x, y, more)
    };
    return G__7634
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___7630.call(this, x);
      case 2:
        return _LT___7631.call(this, x, y);
      default:
        return _LT___7632.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___7632.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___7639 = function(x) {
    return true
  };
  var _LT__EQ___7640 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___7641 = function() {
    var G__7643__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__7644 = y;
            var G__7645 = cljs.core.first.call(null, more);
            var G__7646 = cljs.core.next.call(null, more);
            x = G__7644;
            y = G__7645;
            more = G__7646;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7643 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7643__delegate.call(this, x, y, more)
    };
    G__7643.cljs$lang$maxFixedArity = 2;
    G__7643.cljs$lang$applyTo = function(arglist__7647) {
      var x = cljs.core.first(arglist__7647);
      var y = cljs.core.first(cljs.core.next(arglist__7647));
      var more = cljs.core.rest(cljs.core.next(arglist__7647));
      return G__7643__delegate.call(this, x, y, more)
    };
    return G__7643
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___7639.call(this, x);
      case 2:
        return _LT__EQ___7640.call(this, x, y);
      default:
        return _LT__EQ___7641.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___7641.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___7648 = function(x) {
    return true
  };
  var _GT___7649 = function(x, y) {
    return x > y
  };
  var _GT___7650 = function() {
    var G__7652__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__7653 = y;
            var G__7654 = cljs.core.first.call(null, more);
            var G__7655 = cljs.core.next.call(null, more);
            x = G__7653;
            y = G__7654;
            more = G__7655;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7652 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7652__delegate.call(this, x, y, more)
    };
    G__7652.cljs$lang$maxFixedArity = 2;
    G__7652.cljs$lang$applyTo = function(arglist__7656) {
      var x = cljs.core.first(arglist__7656);
      var y = cljs.core.first(cljs.core.next(arglist__7656));
      var more = cljs.core.rest(cljs.core.next(arglist__7656));
      return G__7652__delegate.call(this, x, y, more)
    };
    return G__7652
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___7648.call(this, x);
      case 2:
        return _GT___7649.call(this, x, y);
      default:
        return _GT___7650.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___7650.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___7657 = function(x) {
    return true
  };
  var _GT__EQ___7658 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___7659 = function() {
    var G__7661__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__7662 = y;
            var G__7663 = cljs.core.first.call(null, more);
            var G__7664 = cljs.core.next.call(null, more);
            x = G__7662;
            y = G__7663;
            more = G__7664;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7661 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7661__delegate.call(this, x, y, more)
    };
    G__7661.cljs$lang$maxFixedArity = 2;
    G__7661.cljs$lang$applyTo = function(arglist__7665) {
      var x = cljs.core.first(arglist__7665);
      var y = cljs.core.first(cljs.core.next(arglist__7665));
      var more = cljs.core.rest(cljs.core.next(arglist__7665));
      return G__7661__delegate.call(this, x, y, more)
    };
    return G__7661
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___7657.call(this, x);
      case 2:
        return _GT__EQ___7658.call(this, x, y);
      default:
        return _GT__EQ___7659.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___7659.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__7666 = function(x) {
    return x
  };
  var max__7667 = function(x, y) {
    return x > y ? x : y
  };
  var max__7668 = function() {
    var G__7670__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7670 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7670__delegate.call(this, x, y, more)
    };
    G__7670.cljs$lang$maxFixedArity = 2;
    G__7670.cljs$lang$applyTo = function(arglist__7671) {
      var x = cljs.core.first(arglist__7671);
      var y = cljs.core.first(cljs.core.next(arglist__7671));
      var more = cljs.core.rest(cljs.core.next(arglist__7671));
      return G__7670__delegate.call(this, x, y, more)
    };
    return G__7670
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__7666.call(this, x);
      case 2:
        return max__7667.call(this, x, y);
      default:
        return max__7668.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__7668.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__7672 = function(x) {
    return x
  };
  var min__7673 = function(x, y) {
    return x < y ? x : y
  };
  var min__7674 = function() {
    var G__7676__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7676 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7676__delegate.call(this, x, y, more)
    };
    G__7676.cljs$lang$maxFixedArity = 2;
    G__7676.cljs$lang$applyTo = function(arglist__7677) {
      var x = cljs.core.first(arglist__7677);
      var y = cljs.core.first(cljs.core.next(arglist__7677));
      var more = cljs.core.rest(cljs.core.next(arglist__7677));
      return G__7676__delegate.call(this, x, y, more)
    };
    return G__7676
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__7672.call(this, x);
      case 2:
        return min__7673.call(this, x, y);
      default:
        return min__7674.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__7674.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7678 = n % d;
  return cljs.core.fix.call(null, (n - rem__7678) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7679 = cljs.core.quot.call(null, n, d);
  return n - d * q__7679
};
cljs.core.rand = function() {
  var rand = null;
  var rand__7680 = function() {
    return Math.random.call(null)
  };
  var rand__7681 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__7680.call(this);
      case 1:
        return rand__7681.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___7683 = function(x) {
    return true
  };
  var _EQ__EQ___7684 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___7685 = function() {
    var G__7687__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__7688 = y;
            var G__7689 = cljs.core.first.call(null, more);
            var G__7690 = cljs.core.next.call(null, more);
            x = G__7688;
            y = G__7689;
            more = G__7690;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7687 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7687__delegate.call(this, x, y, more)
    };
    G__7687.cljs$lang$maxFixedArity = 2;
    G__7687.cljs$lang$applyTo = function(arglist__7691) {
      var x = cljs.core.first(arglist__7691);
      var y = cljs.core.first(cljs.core.next(arglist__7691));
      var more = cljs.core.rest(cljs.core.next(arglist__7691));
      return G__7687__delegate.call(this, x, y, more)
    };
    return G__7687
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___7683.call(this, x);
      case 2:
        return _EQ__EQ___7684.call(this, x, y);
      default:
        return _EQ__EQ___7685.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___7685.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7692 = n;
  var xs__7693 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7694 = xs__7693;
      if(cljs.core.truth_(and__3546__auto____7694)) {
        return n__7692 > 0
      }else {
        return and__3546__auto____7694
      }
    }())) {
      var G__7695 = n__7692 - 1;
      var G__7696 = cljs.core.next.call(null, xs__7693);
      n__7692 = G__7695;
      xs__7693 = G__7696;
      continue
    }else {
      return xs__7693
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__7701 = null;
  var G__7701__7702 = function(coll, n) {
    var temp__3695__auto____7697 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____7697)) {
      var xs__7698 = temp__3695__auto____7697;
      return cljs.core.first.call(null, xs__7698)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__7701__7703 = function(coll, n, not_found) {
    var temp__3695__auto____7699 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____7699)) {
      var xs__7700 = temp__3695__auto____7699;
      return cljs.core.first.call(null, xs__7700)
    }else {
      return not_found
    }
  };
  G__7701 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7701__7702.call(this, coll, n);
      case 3:
        return G__7701__7703.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7701
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___7705 = function() {
    return""
  };
  var str_STAR___7706 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___7707 = function() {
    var G__7709__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7710 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7711 = cljs.core.next.call(null, more);
            sb = G__7710;
            more = G__7711;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7709 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7709__delegate.call(this, x, ys)
    };
    G__7709.cljs$lang$maxFixedArity = 1;
    G__7709.cljs$lang$applyTo = function(arglist__7712) {
      var x = cljs.core.first(arglist__7712);
      var ys = cljs.core.rest(arglist__7712);
      return G__7709__delegate.call(this, x, ys)
    };
    return G__7709
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___7705.call(this);
      case 1:
        return str_STAR___7706.call(this, x);
      default:
        return str_STAR___7707.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___7707.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__7713 = function() {
    return""
  };
  var str__7714 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__7715 = function() {
    var G__7717__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__7717 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7717__delegate.call(this, x, ys)
    };
    G__7717.cljs$lang$maxFixedArity = 1;
    G__7717.cljs$lang$applyTo = function(arglist__7718) {
      var x = cljs.core.first(arglist__7718);
      var ys = cljs.core.rest(arglist__7718);
      return G__7717__delegate.call(this, x, ys)
    };
    return G__7717
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__7713.call(this);
      case 1:
        return str__7714.call(this, x);
      default:
        return str__7715.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__7715.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__7719 = function(s, start) {
    return s.substring(start)
  };
  var subs__7720 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__7719.call(this, s, start);
      case 3:
        return subs__7720.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__7722 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__7723 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__7722.call(this, ns);
      case 2:
        return symbol__7723.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__7725 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__7726 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__7725.call(this, ns);
      case 2:
        return keyword__7726.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__7728 = cljs.core.seq.call(null, x);
    var ys__7729 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__7728 === null)) {
        return ys__7729 === null
      }else {
        if(cljs.core.truth_(ys__7729 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7728), cljs.core.first.call(null, ys__7729)))) {
            var G__7730 = cljs.core.next.call(null, xs__7728);
            var G__7731 = cljs.core.next.call(null, ys__7729);
            xs__7728 = G__7730;
            ys__7729 = G__7731;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7732_SHARP_, p2__7733_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7732_SHARP_, cljs.core.hash.call(null, p2__7733_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7734__7735 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__7734__7735)) {
    var G__7737__7739 = cljs.core.first.call(null, G__7734__7735);
    var vec__7738__7740 = G__7737__7739;
    var key_name__7741 = cljs.core.nth.call(null, vec__7738__7740, 0, null);
    var f__7742 = cljs.core.nth.call(null, vec__7738__7740, 1, null);
    var G__7734__7743 = G__7734__7735;
    var G__7737__7744 = G__7737__7739;
    var G__7734__7745 = G__7734__7743;
    while(true) {
      var vec__7746__7747 = G__7737__7744;
      var key_name__7748 = cljs.core.nth.call(null, vec__7746__7747, 0, null);
      var f__7749 = cljs.core.nth.call(null, vec__7746__7747, 1, null);
      var G__7734__7750 = G__7734__7745;
      var str_name__7751 = cljs.core.name.call(null, key_name__7748);
      obj[str_name__7751] = f__7749;
      var temp__3698__auto____7752 = cljs.core.next.call(null, G__7734__7750);
      if(cljs.core.truth_(temp__3698__auto____7752)) {
        var G__7734__7753 = temp__3698__auto____7752;
        var G__7754 = cljs.core.first.call(null, G__7734__7753);
        var G__7755 = G__7734__7753;
        G__7737__7744 = G__7754;
        G__7734__7745 = G__7755;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__7756 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__7757 = this;
  return new cljs.core.List(this__7757.meta, o, coll, this__7757.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__7758 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__7759 = this;
  return this__7759.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__7760 = this;
  return this__7760.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__7761 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__7762 = this;
  return this__7762.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__7763 = this;
  return this__7763.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__7764 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__7765 = this;
  return new cljs.core.List(meta, this__7765.first, this__7765.rest, this__7765.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__7766 = this;
  return this__7766.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__7767 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__7768 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__7769 = this;
  return new cljs.core.List(this__7769.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__7770 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__7771 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__7772 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__7773 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__7774 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__7775 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__7776 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__7777 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__7778 = this;
  return this__7778.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__7779 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__7780) {
    var items = cljs.core.seq(arglist__7780);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__7781 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__7782 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__7783 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__7784 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7784.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__7785 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__7786 = this;
  return this__7786.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__7787 = this;
  if(cljs.core.truth_(this__7787.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__7787.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__7788 = this;
  return this__7788.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__7789 = this;
  return new cljs.core.Cons(meta, this__7789.first, this__7789.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7790 = null;
  var G__7790__7791 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7790__7792 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7790 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7790__7791.call(this, string, f);
      case 3:
        return G__7790__7792.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7790
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7794 = null;
  var G__7794__7795 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7794__7796 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7794 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7794__7795.call(this, string, k);
      case 3:
        return G__7794__7796.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7794
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7798 = null;
  var G__7798__7799 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7798__7800 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7798 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7798__7799.call(this, string, n);
      case 3:
        return G__7798__7800.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7798
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7808 = null;
  var G__7808__7809 = function(tsym7802, coll) {
    var tsym7802__7804 = this;
    var this$__7805 = tsym7802__7804;
    return cljs.core.get.call(null, coll, this$__7805.toString())
  };
  var G__7808__7810 = function(tsym7803, coll, not_found) {
    var tsym7803__7806 = this;
    var this$__7807 = tsym7803__7806;
    return cljs.core.get.call(null, coll, this$__7807.toString(), not_found)
  };
  G__7808 = function(tsym7803, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7808__7809.call(this, tsym7803, coll);
      case 3:
        return G__7808__7810.call(this, tsym7803, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7808
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7812 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__7812
  }else {
    lazy_seq.x = x__7812.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__7813 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__7814 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__7815 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__7816 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7816.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__7817 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__7818 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__7819 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__7820 = this;
  return this__7820.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__7821 = this;
  return new cljs.core.LazySeq(meta, this__7821.realized, this__7821.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__7822 = cljs.core.array.call(null);
  var s__7823 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__7823))) {
      ary__7822.push(cljs.core.first.call(null, s__7823));
      var G__7824 = cljs.core.next.call(null, s__7823);
      s__7823 = G__7824;
      continue
    }else {
      return ary__7822
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__7825 = s;
  var i__7826 = n;
  var sum__7827 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7828 = i__7826 > 0;
      if(cljs.core.truth_(and__3546__auto____7828)) {
        return cljs.core.seq.call(null, s__7825)
      }else {
        return and__3546__auto____7828
      }
    }())) {
      var G__7829 = cljs.core.next.call(null, s__7825);
      var G__7830 = i__7826 - 1;
      var G__7831 = sum__7827 + 1;
      s__7825 = G__7829;
      i__7826 = G__7830;
      sum__7827 = G__7831;
      continue
    }else {
      return sum__7827
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__7835 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__7836 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__7837 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7832 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__7832)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__7832), concat.call(null, cljs.core.rest.call(null, s__7832), y))
      }else {
        return y
      }
    })
  };
  var concat__7838 = function() {
    var G__7840__delegate = function(x, y, zs) {
      var cat__7834 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7833 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__7833)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7833), cat.call(null, cljs.core.rest.call(null, xys__7833), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__7834.call(null, concat.call(null, x, y), zs)
    };
    var G__7840 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7840__delegate.call(this, x, y, zs)
    };
    G__7840.cljs$lang$maxFixedArity = 2;
    G__7840.cljs$lang$applyTo = function(arglist__7841) {
      var x = cljs.core.first(arglist__7841);
      var y = cljs.core.first(cljs.core.next(arglist__7841));
      var zs = cljs.core.rest(cljs.core.next(arglist__7841));
      return G__7840__delegate.call(this, x, y, zs)
    };
    return G__7840
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__7835.call(this);
      case 1:
        return concat__7836.call(this, x);
      case 2:
        return concat__7837.call(this, x, y);
      default:
        return concat__7838.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__7838.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___7842 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___7843 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___7844 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___7845 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___7846 = function() {
    var G__7848__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7848 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7848__delegate.call(this, a, b, c, d, more)
    };
    G__7848.cljs$lang$maxFixedArity = 4;
    G__7848.cljs$lang$applyTo = function(arglist__7849) {
      var a = cljs.core.first(arglist__7849);
      var b = cljs.core.first(cljs.core.next(arglist__7849));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7849)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7849))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7849))));
      return G__7848__delegate.call(this, a, b, c, d, more)
    };
    return G__7848
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___7842.call(this, a);
      case 2:
        return list_STAR___7843.call(this, a, b);
      case 3:
        return list_STAR___7844.call(this, a, b, c);
      case 4:
        return list_STAR___7845.call(this, a, b, c, d);
      default:
        return list_STAR___7846.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___7846.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__7859 = function(f, args) {
    var fixed_arity__7850 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__7850 + 1) <= fixed_arity__7850)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__7860 = function(f, x, args) {
    var arglist__7851 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7852 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__7851, fixed_arity__7852) <= fixed_arity__7852)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7851))
      }else {
        return f.cljs$lang$applyTo(arglist__7851)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7851))
    }
  };
  var apply__7861 = function(f, x, y, args) {
    var arglist__7853 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7854 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__7853, fixed_arity__7854) <= fixed_arity__7854)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7853))
      }else {
        return f.cljs$lang$applyTo(arglist__7853)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7853))
    }
  };
  var apply__7862 = function(f, x, y, z, args) {
    var arglist__7855 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7856 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__7855, fixed_arity__7856) <= fixed_arity__7856)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7855))
      }else {
        return f.cljs$lang$applyTo(arglist__7855)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7855))
    }
  };
  var apply__7863 = function() {
    var G__7865__delegate = function(f, a, b, c, d, args) {
      var arglist__7857 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7858 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__7857, fixed_arity__7858) <= fixed_arity__7858)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__7857))
        }else {
          return f.cljs$lang$applyTo(arglist__7857)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7857))
      }
    };
    var G__7865 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7865__delegate.call(this, f, a, b, c, d, args)
    };
    G__7865.cljs$lang$maxFixedArity = 5;
    G__7865.cljs$lang$applyTo = function(arglist__7866) {
      var f = cljs.core.first(arglist__7866);
      var a = cljs.core.first(cljs.core.next(arglist__7866));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7866)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7866))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7866)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7866)))));
      return G__7865__delegate.call(this, f, a, b, c, d, args)
    };
    return G__7865
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__7859.call(this, f, a);
      case 3:
        return apply__7860.call(this, f, a, b);
      case 4:
        return apply__7861.call(this, f, a, b, c);
      case 5:
        return apply__7862.call(this, f, a, b, c, d);
      default:
        return apply__7863.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__7863.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7867) {
    var obj = cljs.core.first(arglist__7867);
    var f = cljs.core.first(cljs.core.next(arglist__7867));
    var args = cljs.core.rest(cljs.core.next(arglist__7867));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___7868 = function(x) {
    return false
  };
  var not_EQ___7869 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___7870 = function() {
    var G__7872__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7872 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7872__delegate.call(this, x, y, more)
    };
    G__7872.cljs$lang$maxFixedArity = 2;
    G__7872.cljs$lang$applyTo = function(arglist__7873) {
      var x = cljs.core.first(arglist__7873);
      var y = cljs.core.first(cljs.core.next(arglist__7873));
      var more = cljs.core.rest(cljs.core.next(arglist__7873));
      return G__7872__delegate.call(this, x, y, more)
    };
    return G__7872
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___7868.call(this, x);
      case 2:
        return not_EQ___7869.call(this, x, y);
      default:
        return not_EQ___7870.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___7870.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7874 = pred;
        var G__7875 = cljs.core.next.call(null, coll);
        pred = G__7874;
        coll = G__7875;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____7876 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____7876)) {
        return or__3548__auto____7876
      }else {
        var G__7877 = pred;
        var G__7878 = cljs.core.next.call(null, coll);
        pred = G__7877;
        coll = G__7878;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7879 = null;
    var G__7879__7880 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7879__7881 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7879__7882 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7879__7883 = function() {
      var G__7885__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7885 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7885__delegate.call(this, x, y, zs)
      };
      G__7885.cljs$lang$maxFixedArity = 2;
      G__7885.cljs$lang$applyTo = function(arglist__7886) {
        var x = cljs.core.first(arglist__7886);
        var y = cljs.core.first(cljs.core.next(arglist__7886));
        var zs = cljs.core.rest(cljs.core.next(arglist__7886));
        return G__7885__delegate.call(this, x, y, zs)
      };
      return G__7885
    }();
    G__7879 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7879__7880.call(this);
        case 1:
          return G__7879__7881.call(this, x);
        case 2:
          return G__7879__7882.call(this, x, y);
        default:
          return G__7879__7883.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7879.cljs$lang$maxFixedArity = 2;
    G__7879.cljs$lang$applyTo = G__7879__7883.cljs$lang$applyTo;
    return G__7879
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7887__delegate = function(args) {
      return x
    };
    var G__7887 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7887__delegate.call(this, args)
    };
    G__7887.cljs$lang$maxFixedArity = 0;
    G__7887.cljs$lang$applyTo = function(arglist__7888) {
      var args = cljs.core.seq(arglist__7888);
      return G__7887__delegate.call(this, args)
    };
    return G__7887
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__7892 = function() {
    return cljs.core.identity
  };
  var comp__7893 = function(f) {
    return f
  };
  var comp__7894 = function(f, g) {
    return function() {
      var G__7898 = null;
      var G__7898__7899 = function() {
        return f.call(null, g.call(null))
      };
      var G__7898__7900 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7898__7901 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7898__7902 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7898__7903 = function() {
        var G__7905__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7905 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7905__delegate.call(this, x, y, z, args)
        };
        G__7905.cljs$lang$maxFixedArity = 3;
        G__7905.cljs$lang$applyTo = function(arglist__7906) {
          var x = cljs.core.first(arglist__7906);
          var y = cljs.core.first(cljs.core.next(arglist__7906));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7906)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7906)));
          return G__7905__delegate.call(this, x, y, z, args)
        };
        return G__7905
      }();
      G__7898 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7898__7899.call(this);
          case 1:
            return G__7898__7900.call(this, x);
          case 2:
            return G__7898__7901.call(this, x, y);
          case 3:
            return G__7898__7902.call(this, x, y, z);
          default:
            return G__7898__7903.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7898.cljs$lang$maxFixedArity = 3;
      G__7898.cljs$lang$applyTo = G__7898__7903.cljs$lang$applyTo;
      return G__7898
    }()
  };
  var comp__7895 = function(f, g, h) {
    return function() {
      var G__7907 = null;
      var G__7907__7908 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7907__7909 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7907__7910 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7907__7911 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7907__7912 = function() {
        var G__7914__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7914 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7914__delegate.call(this, x, y, z, args)
        };
        G__7914.cljs$lang$maxFixedArity = 3;
        G__7914.cljs$lang$applyTo = function(arglist__7915) {
          var x = cljs.core.first(arglist__7915);
          var y = cljs.core.first(cljs.core.next(arglist__7915));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7915)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7915)));
          return G__7914__delegate.call(this, x, y, z, args)
        };
        return G__7914
      }();
      G__7907 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7907__7908.call(this);
          case 1:
            return G__7907__7909.call(this, x);
          case 2:
            return G__7907__7910.call(this, x, y);
          case 3:
            return G__7907__7911.call(this, x, y, z);
          default:
            return G__7907__7912.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7907.cljs$lang$maxFixedArity = 3;
      G__7907.cljs$lang$applyTo = G__7907__7912.cljs$lang$applyTo;
      return G__7907
    }()
  };
  var comp__7896 = function() {
    var G__7916__delegate = function(f1, f2, f3, fs) {
      var fs__7889 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7917__delegate = function(args) {
          var ret__7890 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7889), args);
          var fs__7891 = cljs.core.next.call(null, fs__7889);
          while(true) {
            if(cljs.core.truth_(fs__7891)) {
              var G__7918 = cljs.core.first.call(null, fs__7891).call(null, ret__7890);
              var G__7919 = cljs.core.next.call(null, fs__7891);
              ret__7890 = G__7918;
              fs__7891 = G__7919;
              continue
            }else {
              return ret__7890
            }
            break
          }
        };
        var G__7917 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7917__delegate.call(this, args)
        };
        G__7917.cljs$lang$maxFixedArity = 0;
        G__7917.cljs$lang$applyTo = function(arglist__7920) {
          var args = cljs.core.seq(arglist__7920);
          return G__7917__delegate.call(this, args)
        };
        return G__7917
      }()
    };
    var G__7916 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7916__delegate.call(this, f1, f2, f3, fs)
    };
    G__7916.cljs$lang$maxFixedArity = 3;
    G__7916.cljs$lang$applyTo = function(arglist__7921) {
      var f1 = cljs.core.first(arglist__7921);
      var f2 = cljs.core.first(cljs.core.next(arglist__7921));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7921)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7921)));
      return G__7916__delegate.call(this, f1, f2, f3, fs)
    };
    return G__7916
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__7892.call(this);
      case 1:
        return comp__7893.call(this, f1);
      case 2:
        return comp__7894.call(this, f1, f2);
      case 3:
        return comp__7895.call(this, f1, f2, f3);
      default:
        return comp__7896.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__7896.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__7922 = function(f, arg1) {
    return function() {
      var G__7927__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7927 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7927__delegate.call(this, args)
      };
      G__7927.cljs$lang$maxFixedArity = 0;
      G__7927.cljs$lang$applyTo = function(arglist__7928) {
        var args = cljs.core.seq(arglist__7928);
        return G__7927__delegate.call(this, args)
      };
      return G__7927
    }()
  };
  var partial__7923 = function(f, arg1, arg2) {
    return function() {
      var G__7929__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7929 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7929__delegate.call(this, args)
      };
      G__7929.cljs$lang$maxFixedArity = 0;
      G__7929.cljs$lang$applyTo = function(arglist__7930) {
        var args = cljs.core.seq(arglist__7930);
        return G__7929__delegate.call(this, args)
      };
      return G__7929
    }()
  };
  var partial__7924 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7931__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7931 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7931__delegate.call(this, args)
      };
      G__7931.cljs$lang$maxFixedArity = 0;
      G__7931.cljs$lang$applyTo = function(arglist__7932) {
        var args = cljs.core.seq(arglist__7932);
        return G__7931__delegate.call(this, args)
      };
      return G__7931
    }()
  };
  var partial__7925 = function() {
    var G__7933__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7934__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7934 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7934__delegate.call(this, args)
        };
        G__7934.cljs$lang$maxFixedArity = 0;
        G__7934.cljs$lang$applyTo = function(arglist__7935) {
          var args = cljs.core.seq(arglist__7935);
          return G__7934__delegate.call(this, args)
        };
        return G__7934
      }()
    };
    var G__7933 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7933__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7933.cljs$lang$maxFixedArity = 4;
    G__7933.cljs$lang$applyTo = function(arglist__7936) {
      var f = cljs.core.first(arglist__7936);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7936));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7936)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7936))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7936))));
      return G__7933__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__7933
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__7922.call(this, f, arg1);
      case 3:
        return partial__7923.call(this, f, arg1, arg2);
      case 4:
        return partial__7924.call(this, f, arg1, arg2, arg3);
      default:
        return partial__7925.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__7925.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__7937 = function(f, x) {
    return function() {
      var G__7941 = null;
      var G__7941__7942 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__7941__7943 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__7941__7944 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__7941__7945 = function() {
        var G__7947__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__7947 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7947__delegate.call(this, a, b, c, ds)
        };
        G__7947.cljs$lang$maxFixedArity = 3;
        G__7947.cljs$lang$applyTo = function(arglist__7948) {
          var a = cljs.core.first(arglist__7948);
          var b = cljs.core.first(cljs.core.next(arglist__7948));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7948)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7948)));
          return G__7947__delegate.call(this, a, b, c, ds)
        };
        return G__7947
      }();
      G__7941 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7941__7942.call(this, a);
          case 2:
            return G__7941__7943.call(this, a, b);
          case 3:
            return G__7941__7944.call(this, a, b, c);
          default:
            return G__7941__7945.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7941.cljs$lang$maxFixedArity = 3;
      G__7941.cljs$lang$applyTo = G__7941__7945.cljs$lang$applyTo;
      return G__7941
    }()
  };
  var fnil__7938 = function(f, x, y) {
    return function() {
      var G__7949 = null;
      var G__7949__7950 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__7949__7951 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__7949__7952 = function() {
        var G__7954__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__7954 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7954__delegate.call(this, a, b, c, ds)
        };
        G__7954.cljs$lang$maxFixedArity = 3;
        G__7954.cljs$lang$applyTo = function(arglist__7955) {
          var a = cljs.core.first(arglist__7955);
          var b = cljs.core.first(cljs.core.next(arglist__7955));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7955)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7955)));
          return G__7954__delegate.call(this, a, b, c, ds)
        };
        return G__7954
      }();
      G__7949 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7949__7950.call(this, a, b);
          case 3:
            return G__7949__7951.call(this, a, b, c);
          default:
            return G__7949__7952.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7949.cljs$lang$maxFixedArity = 3;
      G__7949.cljs$lang$applyTo = G__7949__7952.cljs$lang$applyTo;
      return G__7949
    }()
  };
  var fnil__7939 = function(f, x, y, z) {
    return function() {
      var G__7956 = null;
      var G__7956__7957 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__7956__7958 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__7956__7959 = function() {
        var G__7961__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__7961 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7961__delegate.call(this, a, b, c, ds)
        };
        G__7961.cljs$lang$maxFixedArity = 3;
        G__7961.cljs$lang$applyTo = function(arglist__7962) {
          var a = cljs.core.first(arglist__7962);
          var b = cljs.core.first(cljs.core.next(arglist__7962));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7962)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7962)));
          return G__7961__delegate.call(this, a, b, c, ds)
        };
        return G__7961
      }();
      G__7956 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7956__7957.call(this, a, b);
          case 3:
            return G__7956__7958.call(this, a, b, c);
          default:
            return G__7956__7959.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7956.cljs$lang$maxFixedArity = 3;
      G__7956.cljs$lang$applyTo = G__7956__7959.cljs$lang$applyTo;
      return G__7956
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__7937.call(this, f, x);
      case 3:
        return fnil__7938.call(this, f, x, y);
      case 4:
        return fnil__7939.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7965 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7963 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7963)) {
        var s__7964 = temp__3698__auto____7963;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7964)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__7964)))
      }else {
        return null
      }
    })
  };
  return mapi__7965.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____7966 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____7966)) {
      var s__7967 = temp__3698__auto____7966;
      var x__7968 = f.call(null, cljs.core.first.call(null, s__7967));
      if(cljs.core.truth_(x__7968 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__7967))
      }else {
        return cljs.core.cons.call(null, x__7968, keep.call(null, f, cljs.core.rest.call(null, s__7967)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7978 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7975 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7975)) {
        var s__7976 = temp__3698__auto____7975;
        var x__7977 = f.call(null, idx, cljs.core.first.call(null, s__7976));
        if(cljs.core.truth_(x__7977 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__7976))
        }else {
          return cljs.core.cons.call(null, x__7977, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__7976)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__7978.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__8023 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__8028 = function() {
        return true
      };
      var ep1__8029 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__8030 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7985 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7985)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____7985
          }
        }())
      };
      var ep1__8031 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7986 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7986)) {
            var and__3546__auto____7987 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____7987)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____7987
            }
          }else {
            return and__3546__auto____7986
          }
        }())
      };
      var ep1__8032 = function() {
        var G__8034__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____7988 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____7988)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____7988
            }
          }())
        };
        var G__8034 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8034__delegate.call(this, x, y, z, args)
        };
        G__8034.cljs$lang$maxFixedArity = 3;
        G__8034.cljs$lang$applyTo = function(arglist__8035) {
          var x = cljs.core.first(arglist__8035);
          var y = cljs.core.first(cljs.core.next(arglist__8035));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8035)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8035)));
          return G__8034__delegate.call(this, x, y, z, args)
        };
        return G__8034
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__8028.call(this);
          case 1:
            return ep1__8029.call(this, x);
          case 2:
            return ep1__8030.call(this, x, y);
          case 3:
            return ep1__8031.call(this, x, y, z);
          default:
            return ep1__8032.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__8032.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__8024 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__8036 = function() {
        return true
      };
      var ep2__8037 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7989 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7989)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____7989
          }
        }())
      };
      var ep2__8038 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7990 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7990)) {
            var and__3546__auto____7991 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____7991)) {
              var and__3546__auto____7992 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____7992)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____7992
              }
            }else {
              return and__3546__auto____7991
            }
          }else {
            return and__3546__auto____7990
          }
        }())
      };
      var ep2__8039 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7993 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7993)) {
            var and__3546__auto____7994 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____7994)) {
              var and__3546__auto____7995 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____7995)) {
                var and__3546__auto____7996 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____7996)) {
                  var and__3546__auto____7997 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____7997)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____7997
                  }
                }else {
                  return and__3546__auto____7996
                }
              }else {
                return and__3546__auto____7995
              }
            }else {
              return and__3546__auto____7994
            }
          }else {
            return and__3546__auto____7993
          }
        }())
      };
      var ep2__8040 = function() {
        var G__8042__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____7998 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____7998)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7969_SHARP_) {
                var and__3546__auto____7999 = p1.call(null, p1__7969_SHARP_);
                if(cljs.core.truth_(and__3546__auto____7999)) {
                  return p2.call(null, p1__7969_SHARP_)
                }else {
                  return and__3546__auto____7999
                }
              }, args)
            }else {
              return and__3546__auto____7998
            }
          }())
        };
        var G__8042 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8042__delegate.call(this, x, y, z, args)
        };
        G__8042.cljs$lang$maxFixedArity = 3;
        G__8042.cljs$lang$applyTo = function(arglist__8043) {
          var x = cljs.core.first(arglist__8043);
          var y = cljs.core.first(cljs.core.next(arglist__8043));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8043)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8043)));
          return G__8042__delegate.call(this, x, y, z, args)
        };
        return G__8042
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__8036.call(this);
          case 1:
            return ep2__8037.call(this, x);
          case 2:
            return ep2__8038.call(this, x, y);
          case 3:
            return ep2__8039.call(this, x, y, z);
          default:
            return ep2__8040.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__8040.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__8025 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__8044 = function() {
        return true
      };
      var ep3__8045 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____8000 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____8000)) {
            var and__3546__auto____8001 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____8001)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____8001
            }
          }else {
            return and__3546__auto____8000
          }
        }())
      };
      var ep3__8046 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____8002 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____8002)) {
            var and__3546__auto____8003 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____8003)) {
              var and__3546__auto____8004 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____8004)) {
                var and__3546__auto____8005 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____8005)) {
                  var and__3546__auto____8006 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____8006)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____8006
                  }
                }else {
                  return and__3546__auto____8005
                }
              }else {
                return and__3546__auto____8004
              }
            }else {
              return and__3546__auto____8003
            }
          }else {
            return and__3546__auto____8002
          }
        }())
      };
      var ep3__8047 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____8007 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____8007)) {
            var and__3546__auto____8008 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____8008)) {
              var and__3546__auto____8009 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____8009)) {
                var and__3546__auto____8010 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____8010)) {
                  var and__3546__auto____8011 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____8011)) {
                    var and__3546__auto____8012 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____8012)) {
                      var and__3546__auto____8013 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____8013)) {
                        var and__3546__auto____8014 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____8014)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____8014
                        }
                      }else {
                        return and__3546__auto____8013
                      }
                    }else {
                      return and__3546__auto____8012
                    }
                  }else {
                    return and__3546__auto____8011
                  }
                }else {
                  return and__3546__auto____8010
                }
              }else {
                return and__3546__auto____8009
              }
            }else {
              return and__3546__auto____8008
            }
          }else {
            return and__3546__auto____8007
          }
        }())
      };
      var ep3__8048 = function() {
        var G__8050__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____8015 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____8015)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7970_SHARP_) {
                var and__3546__auto____8016 = p1.call(null, p1__7970_SHARP_);
                if(cljs.core.truth_(and__3546__auto____8016)) {
                  var and__3546__auto____8017 = p2.call(null, p1__7970_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____8017)) {
                    return p3.call(null, p1__7970_SHARP_)
                  }else {
                    return and__3546__auto____8017
                  }
                }else {
                  return and__3546__auto____8016
                }
              }, args)
            }else {
              return and__3546__auto____8015
            }
          }())
        };
        var G__8050 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8050__delegate.call(this, x, y, z, args)
        };
        G__8050.cljs$lang$maxFixedArity = 3;
        G__8050.cljs$lang$applyTo = function(arglist__8051) {
          var x = cljs.core.first(arglist__8051);
          var y = cljs.core.first(cljs.core.next(arglist__8051));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8051)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8051)));
          return G__8050__delegate.call(this, x, y, z, args)
        };
        return G__8050
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__8044.call(this);
          case 1:
            return ep3__8045.call(this, x);
          case 2:
            return ep3__8046.call(this, x, y);
          case 3:
            return ep3__8047.call(this, x, y, z);
          default:
            return ep3__8048.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__8048.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__8026 = function() {
    var G__8052__delegate = function(p1, p2, p3, ps) {
      var ps__8018 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__8053 = function() {
          return true
        };
        var epn__8054 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7971_SHARP_) {
            return p1__7971_SHARP_.call(null, x)
          }, ps__8018)
        };
        var epn__8055 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7972_SHARP_) {
            var and__3546__auto____8019 = p1__7972_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____8019)) {
              return p1__7972_SHARP_.call(null, y)
            }else {
              return and__3546__auto____8019
            }
          }, ps__8018)
        };
        var epn__8056 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7973_SHARP_) {
            var and__3546__auto____8020 = p1__7973_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____8020)) {
              var and__3546__auto____8021 = p1__7973_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____8021)) {
                return p1__7973_SHARP_.call(null, z)
              }else {
                return and__3546__auto____8021
              }
            }else {
              return and__3546__auto____8020
            }
          }, ps__8018)
        };
        var epn__8057 = function() {
          var G__8059__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____8022 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____8022)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7974_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7974_SHARP_, args)
                }, ps__8018)
              }else {
                return and__3546__auto____8022
              }
            }())
          };
          var G__8059 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8059__delegate.call(this, x, y, z, args)
          };
          G__8059.cljs$lang$maxFixedArity = 3;
          G__8059.cljs$lang$applyTo = function(arglist__8060) {
            var x = cljs.core.first(arglist__8060);
            var y = cljs.core.first(cljs.core.next(arglist__8060));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8060)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8060)));
            return G__8059__delegate.call(this, x, y, z, args)
          };
          return G__8059
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__8053.call(this);
            case 1:
              return epn__8054.call(this, x);
            case 2:
              return epn__8055.call(this, x, y);
            case 3:
              return epn__8056.call(this, x, y, z);
            default:
              return epn__8057.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__8057.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__8052 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8052__delegate.call(this, p1, p2, p3, ps)
    };
    G__8052.cljs$lang$maxFixedArity = 3;
    G__8052.cljs$lang$applyTo = function(arglist__8061) {
      var p1 = cljs.core.first(arglist__8061);
      var p2 = cljs.core.first(cljs.core.next(arglist__8061));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8061)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8061)));
      return G__8052__delegate.call(this, p1, p2, p3, ps)
    };
    return G__8052
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__8023.call(this, p1);
      case 2:
        return every_pred__8024.call(this, p1, p2);
      case 3:
        return every_pred__8025.call(this, p1, p2, p3);
      default:
        return every_pred__8026.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__8026.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__8101 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__8106 = function() {
        return null
      };
      var sp1__8107 = function(x) {
        return p.call(null, x)
      };
      var sp1__8108 = function(x, y) {
        var or__3548__auto____8063 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8063)) {
          return or__3548__auto____8063
        }else {
          return p.call(null, y)
        }
      };
      var sp1__8109 = function(x, y, z) {
        var or__3548__auto____8064 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8064)) {
          return or__3548__auto____8064
        }else {
          var or__3548__auto____8065 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____8065)) {
            return or__3548__auto____8065
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__8110 = function() {
        var G__8112__delegate = function(x, y, z, args) {
          var or__3548__auto____8066 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____8066)) {
            return or__3548__auto____8066
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8112 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8112__delegate.call(this, x, y, z, args)
        };
        G__8112.cljs$lang$maxFixedArity = 3;
        G__8112.cljs$lang$applyTo = function(arglist__8113) {
          var x = cljs.core.first(arglist__8113);
          var y = cljs.core.first(cljs.core.next(arglist__8113));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8113)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8113)));
          return G__8112__delegate.call(this, x, y, z, args)
        };
        return G__8112
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__8106.call(this);
          case 1:
            return sp1__8107.call(this, x);
          case 2:
            return sp1__8108.call(this, x, y);
          case 3:
            return sp1__8109.call(this, x, y, z);
          default:
            return sp1__8110.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__8110.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__8102 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__8114 = function() {
        return null
      };
      var sp2__8115 = function(x) {
        var or__3548__auto____8067 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8067)) {
          return or__3548__auto____8067
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__8116 = function(x, y) {
        var or__3548__auto____8068 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8068)) {
          return or__3548__auto____8068
        }else {
          var or__3548__auto____8069 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____8069)) {
            return or__3548__auto____8069
          }else {
            var or__3548__auto____8070 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____8070)) {
              return or__3548__auto____8070
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__8117 = function(x, y, z) {
        var or__3548__auto____8071 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8071)) {
          return or__3548__auto____8071
        }else {
          var or__3548__auto____8072 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____8072)) {
            return or__3548__auto____8072
          }else {
            var or__3548__auto____8073 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____8073)) {
              return or__3548__auto____8073
            }else {
              var or__3548__auto____8074 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____8074)) {
                return or__3548__auto____8074
              }else {
                var or__3548__auto____8075 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____8075)) {
                  return or__3548__auto____8075
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__8118 = function() {
        var G__8120__delegate = function(x, y, z, args) {
          var or__3548__auto____8076 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____8076)) {
            return or__3548__auto____8076
          }else {
            return cljs.core.some.call(null, function(p1__7979_SHARP_) {
              var or__3548__auto____8077 = p1.call(null, p1__7979_SHARP_);
              if(cljs.core.truth_(or__3548__auto____8077)) {
                return or__3548__auto____8077
              }else {
                return p2.call(null, p1__7979_SHARP_)
              }
            }, args)
          }
        };
        var G__8120 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8120__delegate.call(this, x, y, z, args)
        };
        G__8120.cljs$lang$maxFixedArity = 3;
        G__8120.cljs$lang$applyTo = function(arglist__8121) {
          var x = cljs.core.first(arglist__8121);
          var y = cljs.core.first(cljs.core.next(arglist__8121));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8121)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8121)));
          return G__8120__delegate.call(this, x, y, z, args)
        };
        return G__8120
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__8114.call(this);
          case 1:
            return sp2__8115.call(this, x);
          case 2:
            return sp2__8116.call(this, x, y);
          case 3:
            return sp2__8117.call(this, x, y, z);
          default:
            return sp2__8118.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__8118.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__8103 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__8122 = function() {
        return null
      };
      var sp3__8123 = function(x) {
        var or__3548__auto____8078 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8078)) {
          return or__3548__auto____8078
        }else {
          var or__3548__auto____8079 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____8079)) {
            return or__3548__auto____8079
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__8124 = function(x, y) {
        var or__3548__auto____8080 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8080)) {
          return or__3548__auto____8080
        }else {
          var or__3548__auto____8081 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____8081)) {
            return or__3548__auto____8081
          }else {
            var or__3548__auto____8082 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____8082)) {
              return or__3548__auto____8082
            }else {
              var or__3548__auto____8083 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____8083)) {
                return or__3548__auto____8083
              }else {
                var or__3548__auto____8084 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____8084)) {
                  return or__3548__auto____8084
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__8125 = function(x, y, z) {
        var or__3548__auto____8085 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____8085)) {
          return or__3548__auto____8085
        }else {
          var or__3548__auto____8086 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____8086)) {
            return or__3548__auto____8086
          }else {
            var or__3548__auto____8087 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____8087)) {
              return or__3548__auto____8087
            }else {
              var or__3548__auto____8088 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____8088)) {
                return or__3548__auto____8088
              }else {
                var or__3548__auto____8089 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____8089)) {
                  return or__3548__auto____8089
                }else {
                  var or__3548__auto____8090 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____8090)) {
                    return or__3548__auto____8090
                  }else {
                    var or__3548__auto____8091 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____8091)) {
                      return or__3548__auto____8091
                    }else {
                      var or__3548__auto____8092 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____8092)) {
                        return or__3548__auto____8092
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__8126 = function() {
        var G__8128__delegate = function(x, y, z, args) {
          var or__3548__auto____8093 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____8093)) {
            return or__3548__auto____8093
          }else {
            return cljs.core.some.call(null, function(p1__7980_SHARP_) {
              var or__3548__auto____8094 = p1.call(null, p1__7980_SHARP_);
              if(cljs.core.truth_(or__3548__auto____8094)) {
                return or__3548__auto____8094
              }else {
                var or__3548__auto____8095 = p2.call(null, p1__7980_SHARP_);
                if(cljs.core.truth_(or__3548__auto____8095)) {
                  return or__3548__auto____8095
                }else {
                  return p3.call(null, p1__7980_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8128 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8128__delegate.call(this, x, y, z, args)
        };
        G__8128.cljs$lang$maxFixedArity = 3;
        G__8128.cljs$lang$applyTo = function(arglist__8129) {
          var x = cljs.core.first(arglist__8129);
          var y = cljs.core.first(cljs.core.next(arglist__8129));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8129)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8129)));
          return G__8128__delegate.call(this, x, y, z, args)
        };
        return G__8128
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__8122.call(this);
          case 1:
            return sp3__8123.call(this, x);
          case 2:
            return sp3__8124.call(this, x, y);
          case 3:
            return sp3__8125.call(this, x, y, z);
          default:
            return sp3__8126.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__8126.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__8104 = function() {
    var G__8130__delegate = function(p1, p2, p3, ps) {
      var ps__8096 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__8131 = function() {
          return null
        };
        var spn__8132 = function(x) {
          return cljs.core.some.call(null, function(p1__7981_SHARP_) {
            return p1__7981_SHARP_.call(null, x)
          }, ps__8096)
        };
        var spn__8133 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7982_SHARP_) {
            var or__3548__auto____8097 = p1__7982_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____8097)) {
              return or__3548__auto____8097
            }else {
              return p1__7982_SHARP_.call(null, y)
            }
          }, ps__8096)
        };
        var spn__8134 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7983_SHARP_) {
            var or__3548__auto____8098 = p1__7983_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____8098)) {
              return or__3548__auto____8098
            }else {
              var or__3548__auto____8099 = p1__7983_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____8099)) {
                return or__3548__auto____8099
              }else {
                return p1__7983_SHARP_.call(null, z)
              }
            }
          }, ps__8096)
        };
        var spn__8135 = function() {
          var G__8137__delegate = function(x, y, z, args) {
            var or__3548__auto____8100 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____8100)) {
              return or__3548__auto____8100
            }else {
              return cljs.core.some.call(null, function(p1__7984_SHARP_) {
                return cljs.core.some.call(null, p1__7984_SHARP_, args)
              }, ps__8096)
            }
          };
          var G__8137 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8137__delegate.call(this, x, y, z, args)
          };
          G__8137.cljs$lang$maxFixedArity = 3;
          G__8137.cljs$lang$applyTo = function(arglist__8138) {
            var x = cljs.core.first(arglist__8138);
            var y = cljs.core.first(cljs.core.next(arglist__8138));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8138)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8138)));
            return G__8137__delegate.call(this, x, y, z, args)
          };
          return G__8137
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__8131.call(this);
            case 1:
              return spn__8132.call(this, x);
            case 2:
              return spn__8133.call(this, x, y);
            case 3:
              return spn__8134.call(this, x, y, z);
            default:
              return spn__8135.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__8135.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__8130 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8130__delegate.call(this, p1, p2, p3, ps)
    };
    G__8130.cljs$lang$maxFixedArity = 3;
    G__8130.cljs$lang$applyTo = function(arglist__8139) {
      var p1 = cljs.core.first(arglist__8139);
      var p2 = cljs.core.first(cljs.core.next(arglist__8139));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8139)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8139)));
      return G__8130__delegate.call(this, p1, p2, p3, ps)
    };
    return G__8130
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__8101.call(this, p1);
      case 2:
        return some_fn__8102.call(this, p1, p2);
      case 3:
        return some_fn__8103.call(this, p1, p2, p3);
      default:
        return some_fn__8104.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__8104.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__8152 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8140 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8140)) {
        var s__8141 = temp__3698__auto____8140;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8141)), map.call(null, f, cljs.core.rest.call(null, s__8141)))
      }else {
        return null
      }
    })
  };
  var map__8153 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8142 = cljs.core.seq.call(null, c1);
      var s2__8143 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____8144 = s1__8142;
        if(cljs.core.truth_(and__3546__auto____8144)) {
          return s2__8143
        }else {
          return and__3546__auto____8144
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8142), cljs.core.first.call(null, s2__8143)), map.call(null, f, cljs.core.rest.call(null, s1__8142), cljs.core.rest.call(null, s2__8143)))
      }else {
        return null
      }
    })
  };
  var map__8154 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8145 = cljs.core.seq.call(null, c1);
      var s2__8146 = cljs.core.seq.call(null, c2);
      var s3__8147 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____8148 = s1__8145;
        if(cljs.core.truth_(and__3546__auto____8148)) {
          var and__3546__auto____8149 = s2__8146;
          if(cljs.core.truth_(and__3546__auto____8149)) {
            return s3__8147
          }else {
            return and__3546__auto____8149
          }
        }else {
          return and__3546__auto____8148
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8145), cljs.core.first.call(null, s2__8146), cljs.core.first.call(null, s3__8147)), map.call(null, f, cljs.core.rest.call(null, s1__8145), cljs.core.rest.call(null, s2__8146), cljs.core.rest.call(null, s3__8147)))
      }else {
        return null
      }
    })
  };
  var map__8155 = function() {
    var G__8157__delegate = function(f, c1, c2, c3, colls) {
      var step__8151 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8150 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8150))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8150), step.call(null, map.call(null, cljs.core.rest, ss__8150)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__8062_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8062_SHARP_)
      }, step__8151.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8157 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8157__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8157.cljs$lang$maxFixedArity = 4;
    G__8157.cljs$lang$applyTo = function(arglist__8158) {
      var f = cljs.core.first(arglist__8158);
      var c1 = cljs.core.first(cljs.core.next(arglist__8158));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8158)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8158))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8158))));
      return G__8157__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__8157
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__8152.call(this, f, c1);
      case 3:
        return map__8153.call(this, f, c1, c2);
      case 4:
        return map__8154.call(this, f, c1, c2, c3);
      default:
        return map__8155.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__8155.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____8159 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8159)) {
        var s__8160 = temp__3698__auto____8159;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8160), take.call(null, n - 1, cljs.core.rest.call(null, s__8160)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__8163 = function(n, coll) {
    while(true) {
      var s__8161 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____8162 = n > 0;
        if(cljs.core.truth_(and__3546__auto____8162)) {
          return s__8161
        }else {
          return and__3546__auto____8162
        }
      }())) {
        var G__8164 = n - 1;
        var G__8165 = cljs.core.rest.call(null, s__8161);
        n = G__8164;
        coll = G__8165;
        continue
      }else {
        return s__8161
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8163.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__8166 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__8167 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__8166.call(this, n);
      case 2:
        return drop_last__8167.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8169 = cljs.core.seq.call(null, coll);
  var lead__8170 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__8170)) {
      var G__8171 = cljs.core.next.call(null, s__8169);
      var G__8172 = cljs.core.next.call(null, lead__8170);
      s__8169 = G__8171;
      lead__8170 = G__8172;
      continue
    }else {
      return s__8169
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8175 = function(pred, coll) {
    while(true) {
      var s__8173 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____8174 = s__8173;
        if(cljs.core.truth_(and__3546__auto____8174)) {
          return pred.call(null, cljs.core.first.call(null, s__8173))
        }else {
          return and__3546__auto____8174
        }
      }())) {
        var G__8176 = pred;
        var G__8177 = cljs.core.rest.call(null, s__8173);
        pred = G__8176;
        coll = G__8177;
        continue
      }else {
        return s__8173
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8175.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8178 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8178)) {
      var s__8179 = temp__3698__auto____8178;
      return cljs.core.concat.call(null, s__8179, cycle.call(null, s__8179))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__8180 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__8181 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__8180.call(this, n);
      case 2:
        return repeat__8181.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__8183 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__8184 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__8183.call(this, n);
      case 2:
        return repeatedly__8184.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__8190 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8186 = cljs.core.seq.call(null, c1);
      var s2__8187 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____8188 = s1__8186;
        if(cljs.core.truth_(and__3546__auto____8188)) {
          return s2__8187
        }else {
          return and__3546__auto____8188
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8186), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8187), interleave.call(null, cljs.core.rest.call(null, s1__8186), cljs.core.rest.call(null, s2__8187))))
      }else {
        return null
      }
    })
  };
  var interleave__8191 = function() {
    var G__8193__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8189 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8189))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8189), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8189)))
        }else {
          return null
        }
      })
    };
    var G__8193 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8193__delegate.call(this, c1, c2, colls)
    };
    G__8193.cljs$lang$maxFixedArity = 2;
    G__8193.cljs$lang$applyTo = function(arglist__8194) {
      var c1 = cljs.core.first(arglist__8194);
      var c2 = cljs.core.first(cljs.core.next(arglist__8194));
      var colls = cljs.core.rest(cljs.core.next(arglist__8194));
      return G__8193__delegate.call(this, c1, c2, colls)
    };
    return G__8193
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__8190.call(this, c1, c2);
      default:
        return interleave__8191.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__8191.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8197 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____8195 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____8195)) {
        var coll__8196 = temp__3695__auto____8195;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8196), cat.call(null, cljs.core.rest.call(null, coll__8196), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__8197.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__8198 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__8199 = function() {
    var G__8201__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8201 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8201__delegate.call(this, f, coll, colls)
    };
    G__8201.cljs$lang$maxFixedArity = 2;
    G__8201.cljs$lang$applyTo = function(arglist__8202) {
      var f = cljs.core.first(arglist__8202);
      var coll = cljs.core.first(cljs.core.next(arglist__8202));
      var colls = cljs.core.rest(cljs.core.next(arglist__8202));
      return G__8201__delegate.call(this, f, coll, colls)
    };
    return G__8201
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__8198.call(this, f, coll);
      default:
        return mapcat__8199.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__8199.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8203 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8203)) {
      var s__8204 = temp__3698__auto____8203;
      var f__8205 = cljs.core.first.call(null, s__8204);
      var r__8206 = cljs.core.rest.call(null, s__8204);
      if(cljs.core.truth_(pred.call(null, f__8205))) {
        return cljs.core.cons.call(null, f__8205, filter.call(null, pred, r__8206))
      }else {
        return filter.call(null, pred, r__8206)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8208 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__8208.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8207_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__8207_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__8215 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__8216 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8209 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8209)) {
        var s__8210 = temp__3698__auto____8209;
        var p__8211 = cljs.core.take.call(null, n, s__8210);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__8211)))) {
          return cljs.core.cons.call(null, p__8211, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8210)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__8217 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8212 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8212)) {
        var s__8213 = temp__3698__auto____8212;
        var p__8214 = cljs.core.take.call(null, n, s__8213);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__8214)))) {
          return cljs.core.cons.call(null, p__8214, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8213)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8214, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__8215.call(this, n, step);
      case 3:
        return partition__8216.call(this, n, step, pad);
      case 4:
        return partition__8217.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__8223 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__8224 = function(m, ks, not_found) {
    var sentinel__8219 = cljs.core.lookup_sentinel;
    var m__8220 = m;
    var ks__8221 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__8221)) {
        var m__8222 = cljs.core.get.call(null, m__8220, cljs.core.first.call(null, ks__8221), sentinel__8219);
        if(cljs.core.truth_(sentinel__8219 === m__8222)) {
          return not_found
        }else {
          var G__8226 = sentinel__8219;
          var G__8227 = m__8222;
          var G__8228 = cljs.core.next.call(null, ks__8221);
          sentinel__8219 = G__8226;
          m__8220 = G__8227;
          ks__8221 = G__8228;
          continue
        }
      }else {
        return m__8220
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__8223.call(this, m, ks);
      case 3:
        return get_in__8224.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8229, v) {
  var vec__8230__8231 = p__8229;
  var k__8232 = cljs.core.nth.call(null, vec__8230__8231, 0, null);
  var ks__8233 = cljs.core.nthnext.call(null, vec__8230__8231, 1);
  if(cljs.core.truth_(ks__8233)) {
    return cljs.core.assoc.call(null, m, k__8232, assoc_in.call(null, cljs.core.get.call(null, m, k__8232), ks__8233, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8232, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8234, f, args) {
    var vec__8235__8236 = p__8234;
    var k__8237 = cljs.core.nth.call(null, vec__8235__8236, 0, null);
    var ks__8238 = cljs.core.nthnext.call(null, vec__8235__8236, 1);
    if(cljs.core.truth_(ks__8238)) {
      return cljs.core.assoc.call(null, m, k__8237, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__8237), ks__8238, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8237, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__8237), args))
    }
  };
  var update_in = function(m, p__8234, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8234, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8239) {
    var m = cljs.core.first(arglist__8239);
    var p__8234 = cljs.core.first(cljs.core.next(arglist__8239));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8239)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8239)));
    return update_in__delegate.call(this, m, p__8234, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8240 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__8273 = null;
  var G__8273__8274 = function(coll, k) {
    var this__8241 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__8273__8275 = function(coll, k, not_found) {
    var this__8242 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__8273 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8273__8274.call(this, coll, k);
      case 3:
        return G__8273__8275.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8273
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__8243 = this;
  var new_array__8244 = cljs.core.aclone.call(null, this__8243.array);
  new_array__8244[k] = v;
  return new cljs.core.Vector(this__8243.meta, new_array__8244)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__8277 = null;
  var G__8277__8278 = function(tsym8245, k) {
    var this__8247 = this;
    var tsym8245__8248 = this;
    var coll__8249 = tsym8245__8248;
    return cljs.core._lookup.call(null, coll__8249, k)
  };
  var G__8277__8279 = function(tsym8246, k, not_found) {
    var this__8250 = this;
    var tsym8246__8251 = this;
    var coll__8252 = tsym8246__8251;
    return cljs.core._lookup.call(null, coll__8252, k, not_found)
  };
  G__8277 = function(tsym8246, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8277__8278.call(this, tsym8246, k);
      case 3:
        return G__8277__8279.call(this, tsym8246, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8277
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__8253 = this;
  var new_array__8254 = cljs.core.aclone.call(null, this__8253.array);
  new_array__8254.push(o);
  return new cljs.core.Vector(this__8253.meta, new_array__8254)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__8281 = null;
  var G__8281__8282 = function(v, f) {
    var this__8255 = this;
    return cljs.core.ci_reduce.call(null, this__8255.array, f)
  };
  var G__8281__8283 = function(v, f, start) {
    var this__8256 = this;
    return cljs.core.ci_reduce.call(null, this__8256.array, f, start)
  };
  G__8281 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8281__8282.call(this, v, f);
      case 3:
        return G__8281__8283.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8281
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8257 = this;
  if(cljs.core.truth_(this__8257.array.length > 0)) {
    var vector_seq__8258 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__8257.array.length)) {
          return cljs.core.cons.call(null, this__8257.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__8258.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__8259 = this;
  return this__8259.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__8260 = this;
  var count__8261 = this__8260.array.length;
  if(cljs.core.truth_(count__8261 > 0)) {
    return this__8260.array[count__8261 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__8262 = this;
  if(cljs.core.truth_(this__8262.array.length > 0)) {
    var new_array__8263 = cljs.core.aclone.call(null, this__8262.array);
    new_array__8263.pop();
    return new cljs.core.Vector(this__8262.meta, new_array__8263)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__8264 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8265 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8266 = this;
  return new cljs.core.Vector(meta, this__8266.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8267 = this;
  return this__8267.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__8285 = null;
  var G__8285__8286 = function(coll, n) {
    var this__8268 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8269 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____8269)) {
        return n < this__8268.array.length
      }else {
        return and__3546__auto____8269
      }
    }())) {
      return this__8268.array[n]
    }else {
      return null
    }
  };
  var G__8285__8287 = function(coll, n, not_found) {
    var this__8270 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8271 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____8271)) {
        return n < this__8270.array.length
      }else {
        return and__3546__auto____8271
      }
    }())) {
      return this__8270.array[n]
    }else {
      return not_found
    }
  };
  G__8285 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8285__8286.call(this, coll, n);
      case 3:
        return G__8285__8287.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8285
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8272 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8272.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8289) {
    var args = cljs.core.seq(arglist__8289);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8290 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__8318 = null;
  var G__8318__8319 = function(coll, k) {
    var this__8291 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__8318__8320 = function(coll, k, not_found) {
    var this__8292 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__8318 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8318__8319.call(this, coll, k);
      case 3:
        return G__8318__8320.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8318
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__8293 = this;
  var v_pos__8294 = this__8293.start + key;
  return new cljs.core.Subvec(this__8293.meta, cljs.core._assoc.call(null, this__8293.v, v_pos__8294, val), this__8293.start, this__8293.end > v_pos__8294 + 1 ? this__8293.end : v_pos__8294 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__8322 = null;
  var G__8322__8323 = function(tsym8295, k) {
    var this__8297 = this;
    var tsym8295__8298 = this;
    var coll__8299 = tsym8295__8298;
    return cljs.core._lookup.call(null, coll__8299, k)
  };
  var G__8322__8324 = function(tsym8296, k, not_found) {
    var this__8300 = this;
    var tsym8296__8301 = this;
    var coll__8302 = tsym8296__8301;
    return cljs.core._lookup.call(null, coll__8302, k, not_found)
  };
  G__8322 = function(tsym8296, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8322__8323.call(this, tsym8296, k);
      case 3:
        return G__8322__8324.call(this, tsym8296, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8322
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__8303 = this;
  return new cljs.core.Subvec(this__8303.meta, cljs.core._assoc_n.call(null, this__8303.v, this__8303.end, o), this__8303.start, this__8303.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__8326 = null;
  var G__8326__8327 = function(coll, f) {
    var this__8304 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__8326__8328 = function(coll, f, start) {
    var this__8305 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__8326 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8326__8327.call(this, coll, f);
      case 3:
        return G__8326__8328.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8326
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8306 = this;
  var subvec_seq__8307 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__8306.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8306.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__8307.call(null, this__8306.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__8308 = this;
  return this__8308.end - this__8308.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__8309 = this;
  return cljs.core._nth.call(null, this__8309.v, this__8309.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__8310 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__8310.start, this__8310.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8310.meta, this__8310.v, this__8310.start, this__8310.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__8311 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8312 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8313 = this;
  return new cljs.core.Subvec(meta, this__8313.v, this__8313.start, this__8313.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8314 = this;
  return this__8314.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__8330 = null;
  var G__8330__8331 = function(coll, n) {
    var this__8315 = this;
    return cljs.core._nth.call(null, this__8315.v, this__8315.start + n)
  };
  var G__8330__8332 = function(coll, n, not_found) {
    var this__8316 = this;
    return cljs.core._nth.call(null, this__8316.v, this__8316.start + n, not_found)
  };
  G__8330 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8330__8331.call(this, coll, n);
      case 3:
        return G__8330__8332.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8330
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8317 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8317.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__8334 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__8335 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__8334.call(this, v, start);
      case 3:
        return subvec__8335.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8337 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8338 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8339 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8340 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8340.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__8341 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__8342 = this;
  return cljs.core._first.call(null, this__8342.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__8343 = this;
  var temp__3695__auto____8344 = cljs.core.next.call(null, this__8343.front);
  if(cljs.core.truth_(temp__3695__auto____8344)) {
    var f1__8345 = temp__3695__auto____8344;
    return new cljs.core.PersistentQueueSeq(this__8343.meta, f1__8345, this__8343.rear)
  }else {
    if(cljs.core.truth_(this__8343.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8343.meta, this__8343.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8346 = this;
  return this__8346.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8347 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8347.front, this__8347.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8348 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__8349 = this;
  if(cljs.core.truth_(this__8349.front)) {
    return new cljs.core.PersistentQueue(this__8349.meta, this__8349.count + 1, this__8349.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____8350 = this__8349.rear;
      if(cljs.core.truth_(or__3548__auto____8350)) {
        return or__3548__auto____8350
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__8349.meta, this__8349.count + 1, cljs.core.conj.call(null, this__8349.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8351 = this;
  var rear__8352 = cljs.core.seq.call(null, this__8351.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____8353 = this__8351.front;
    if(cljs.core.truth_(or__3548__auto____8353)) {
      return or__3548__auto____8353
    }else {
      return rear__8352
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8351.front, cljs.core.seq.call(null, rear__8352))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__8354 = this;
  return this__8354.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__8355 = this;
  return cljs.core._first.call(null, this__8355.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__8356 = this;
  if(cljs.core.truth_(this__8356.front)) {
    var temp__3695__auto____8357 = cljs.core.next.call(null, this__8356.front);
    if(cljs.core.truth_(temp__3695__auto____8357)) {
      var f1__8358 = temp__3695__auto____8357;
      return new cljs.core.PersistentQueue(this__8356.meta, this__8356.count - 1, f1__8358, this__8356.rear)
    }else {
      return new cljs.core.PersistentQueue(this__8356.meta, this__8356.count - 1, cljs.core.seq.call(null, this__8356.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__8359 = this;
  return cljs.core.first.call(null, this__8359.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__8360 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8361 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8362 = this;
  return new cljs.core.PersistentQueue(meta, this__8362.count, this__8362.front, this__8362.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8363 = this;
  return this__8363.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8364 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__8365 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8366 = array.length;
  var i__8367 = 0;
  while(true) {
    if(cljs.core.truth_(i__8367 < len__8366)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__8367]))) {
        return i__8367
      }else {
        var G__8368 = i__8367 + incr;
        i__8367 = G__8368;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___8370 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___8371 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8369 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____8369)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____8369
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___8370.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___8371.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8374 = cljs.core.hash.call(null, a);
  var b__8375 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__8374 < b__8375)) {
    return-1
  }else {
    if(cljs.core.truth_(a__8374 > b__8375)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8376 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__8403 = null;
  var G__8403__8404 = function(coll, k) {
    var this__8377 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__8403__8405 = function(coll, k, not_found) {
    var this__8378 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__8378.strobj, this__8378.strobj[k], not_found)
  };
  G__8403 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8403__8404.call(this, coll, k);
      case 3:
        return G__8403__8405.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8403
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__8379 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__8380 = goog.object.clone.call(null, this__8379.strobj);
    var overwrite_QMARK___8381 = new_strobj__8380.hasOwnProperty(k);
    new_strobj__8380[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___8381)) {
      return new cljs.core.ObjMap(this__8379.meta, this__8379.keys, new_strobj__8380)
    }else {
      var new_keys__8382 = cljs.core.aclone.call(null, this__8379.keys);
      new_keys__8382.push(k);
      return new cljs.core.ObjMap(this__8379.meta, new_keys__8382, new_strobj__8380)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__8379.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__8383 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__8383.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__8407 = null;
  var G__8407__8408 = function(tsym8384, k) {
    var this__8386 = this;
    var tsym8384__8387 = this;
    var coll__8388 = tsym8384__8387;
    return cljs.core._lookup.call(null, coll__8388, k)
  };
  var G__8407__8409 = function(tsym8385, k, not_found) {
    var this__8389 = this;
    var tsym8385__8390 = this;
    var coll__8391 = tsym8385__8390;
    return cljs.core._lookup.call(null, coll__8391, k, not_found)
  };
  G__8407 = function(tsym8385, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8407__8408.call(this, tsym8385, k);
      case 3:
        return G__8407__8409.call(this, tsym8385, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8407
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__8392 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8393 = this;
  if(cljs.core.truth_(this__8393.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__8373_SHARP_) {
      return cljs.core.vector.call(null, p1__8373_SHARP_, this__8393.strobj[p1__8373_SHARP_])
    }, this__8393.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__8394 = this;
  return this__8394.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8395 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8396 = this;
  return new cljs.core.ObjMap(meta, this__8396.keys, this__8396.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8397 = this;
  return this__8397.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8398 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8398.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__8399 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____8400 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____8400)) {
      return this__8399.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____8400
    }
  }())) {
    var new_keys__8401 = cljs.core.aclone.call(null, this__8399.keys);
    var new_strobj__8402 = goog.object.clone.call(null, this__8399.strobj);
    new_keys__8401.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8401), 1);
    cljs.core.js_delete.call(null, new_strobj__8402, k);
    return new cljs.core.ObjMap(this__8399.meta, new_keys__8401, new_strobj__8402)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8412 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__8450 = null;
  var G__8450__8451 = function(coll, k) {
    var this__8413 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__8450__8452 = function(coll, k, not_found) {
    var this__8414 = this;
    var bucket__8415 = this__8414.hashobj[cljs.core.hash.call(null, k)];
    var i__8416 = cljs.core.truth_(bucket__8415) ? cljs.core.scan_array.call(null, 2, k, bucket__8415) : null;
    if(cljs.core.truth_(i__8416)) {
      return bucket__8415[i__8416 + 1]
    }else {
      return not_found
    }
  };
  G__8450 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8450__8451.call(this, coll, k);
      case 3:
        return G__8450__8452.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8450
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__8417 = this;
  var h__8418 = cljs.core.hash.call(null, k);
  var bucket__8419 = this__8417.hashobj[h__8418];
  if(cljs.core.truth_(bucket__8419)) {
    var new_bucket__8420 = cljs.core.aclone.call(null, bucket__8419);
    var new_hashobj__8421 = goog.object.clone.call(null, this__8417.hashobj);
    new_hashobj__8421[h__8418] = new_bucket__8420;
    var temp__3695__auto____8422 = cljs.core.scan_array.call(null, 2, k, new_bucket__8420);
    if(cljs.core.truth_(temp__3695__auto____8422)) {
      var i__8423 = temp__3695__auto____8422;
      new_bucket__8420[i__8423 + 1] = v;
      return new cljs.core.HashMap(this__8417.meta, this__8417.count, new_hashobj__8421)
    }else {
      new_bucket__8420.push(k, v);
      return new cljs.core.HashMap(this__8417.meta, this__8417.count + 1, new_hashobj__8421)
    }
  }else {
    var new_hashobj__8424 = goog.object.clone.call(null, this__8417.hashobj);
    new_hashobj__8424[h__8418] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__8417.meta, this__8417.count + 1, new_hashobj__8424)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__8425 = this;
  var bucket__8426 = this__8425.hashobj[cljs.core.hash.call(null, k)];
  var i__8427 = cljs.core.truth_(bucket__8426) ? cljs.core.scan_array.call(null, 2, k, bucket__8426) : null;
  if(cljs.core.truth_(i__8427)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__8454 = null;
  var G__8454__8455 = function(tsym8428, k) {
    var this__8430 = this;
    var tsym8428__8431 = this;
    var coll__8432 = tsym8428__8431;
    return cljs.core._lookup.call(null, coll__8432, k)
  };
  var G__8454__8456 = function(tsym8429, k, not_found) {
    var this__8433 = this;
    var tsym8429__8434 = this;
    var coll__8435 = tsym8429__8434;
    return cljs.core._lookup.call(null, coll__8435, k, not_found)
  };
  G__8454 = function(tsym8429, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8454__8455.call(this, tsym8429, k);
      case 3:
        return G__8454__8456.call(this, tsym8429, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8454
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__8436 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8437 = this;
  if(cljs.core.truth_(this__8437.count > 0)) {
    var hashes__8438 = cljs.core.js_keys.call(null, this__8437.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8411_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8437.hashobj[p1__8411_SHARP_]))
    }, hashes__8438)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__8439 = this;
  return this__8439.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8440 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8441 = this;
  return new cljs.core.HashMap(meta, this__8441.count, this__8441.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8442 = this;
  return this__8442.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8443 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8443.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__8444 = this;
  var h__8445 = cljs.core.hash.call(null, k);
  var bucket__8446 = this__8444.hashobj[h__8445];
  var i__8447 = cljs.core.truth_(bucket__8446) ? cljs.core.scan_array.call(null, 2, k, bucket__8446) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__8447))) {
    return coll
  }else {
    var new_hashobj__8448 = goog.object.clone.call(null, this__8444.hashobj);
    if(cljs.core.truth_(3 > bucket__8446.length)) {
      cljs.core.js_delete.call(null, new_hashobj__8448, h__8445)
    }else {
      var new_bucket__8449 = cljs.core.aclone.call(null, bucket__8446);
      new_bucket__8449.splice(i__8447, 2);
      new_hashobj__8448[h__8445] = new_bucket__8449
    }
    return new cljs.core.HashMap(this__8444.meta, this__8444.count - 1, new_hashobj__8448)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8458 = ks.length;
  var i__8459 = 0;
  var out__8460 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__8459 < len__8458)) {
      var G__8461 = i__8459 + 1;
      var G__8462 = cljs.core.assoc.call(null, out__8460, ks[i__8459], vs[i__8459]);
      i__8459 = G__8461;
      out__8460 = G__8462;
      continue
    }else {
      return out__8460
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__8463 = cljs.core.seq.call(null, keyvals);
    var out__8464 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__8463)) {
        var G__8465 = cljs.core.nnext.call(null, in$__8463);
        var G__8466 = cljs.core.assoc.call(null, out__8464, cljs.core.first.call(null, in$__8463), cljs.core.second.call(null, in$__8463));
        in$__8463 = G__8465;
        out__8464 = G__8466;
        continue
      }else {
        return out__8464
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__8467) {
    var keyvals = cljs.core.seq(arglist__8467);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__8468_SHARP_, p2__8469_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____8470 = p1__8468_SHARP_;
          if(cljs.core.truth_(or__3548__auto____8470)) {
            return or__3548__auto____8470
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__8469_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__8471) {
    var maps = cljs.core.seq(arglist__8471);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__8474 = function(m, e) {
        var k__8472 = cljs.core.first.call(null, e);
        var v__8473 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__8472))) {
          return cljs.core.assoc.call(null, m, k__8472, f.call(null, cljs.core.get.call(null, m, k__8472), v__8473))
        }else {
          return cljs.core.assoc.call(null, m, k__8472, v__8473)
        }
      };
      var merge2__8476 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__8474, function() {
          var or__3548__auto____8475 = m1;
          if(cljs.core.truth_(or__3548__auto____8475)) {
            return or__3548__auto____8475
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__8476, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__8477) {
    var f = cljs.core.first(arglist__8477);
    var maps = cljs.core.rest(arglist__8477);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__8479 = cljs.core.ObjMap.fromObject([], {});
  var keys__8480 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__8480)) {
      var key__8481 = cljs.core.first.call(null, keys__8480);
      var entry__8482 = cljs.core.get.call(null, map, key__8481, "\ufdd0'user/not-found");
      var G__8483 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__8482, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__8479, key__8481, entry__8482) : ret__8479;
      var G__8484 = cljs.core.next.call(null, keys__8480);
      ret__8479 = G__8483;
      keys__8480 = G__8484;
      continue
    }else {
      return ret__8479
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__8485 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__8506 = null;
  var G__8506__8507 = function(coll, v) {
    var this__8486 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__8506__8508 = function(coll, v, not_found) {
    var this__8487 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8487.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__8506 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8506__8507.call(this, coll, v);
      case 3:
        return G__8506__8508.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8506
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__8510 = null;
  var G__8510__8511 = function(tsym8488, k) {
    var this__8490 = this;
    var tsym8488__8491 = this;
    var coll__8492 = tsym8488__8491;
    return cljs.core._lookup.call(null, coll__8492, k)
  };
  var G__8510__8512 = function(tsym8489, k, not_found) {
    var this__8493 = this;
    var tsym8489__8494 = this;
    var coll__8495 = tsym8489__8494;
    return cljs.core._lookup.call(null, coll__8495, k, not_found)
  };
  G__8510 = function(tsym8489, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8510__8511.call(this, tsym8489, k);
      case 3:
        return G__8510__8512.call(this, tsym8489, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8510
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__8496 = this;
  return new cljs.core.Set(this__8496.meta, cljs.core.assoc.call(null, this__8496.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__8497 = this;
  return cljs.core.keys.call(null, this__8497.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__8498 = this;
  return new cljs.core.Set(this__8498.meta, cljs.core.dissoc.call(null, this__8498.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__8499 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8500 = this;
  var and__3546__auto____8501 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____8501)) {
    var and__3546__auto____8502 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____8502)) {
      return cljs.core.every_QMARK_.call(null, function(p1__8478_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8478_SHARP_)
      }, other)
    }else {
      return and__3546__auto____8502
    }
  }else {
    return and__3546__auto____8501
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__8503 = this;
  return new cljs.core.Set(meta, this__8503.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__8504 = this;
  return this__8504.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__8505 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__8505.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__8515 = cljs.core.seq.call(null, coll);
  var out__8516 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__8515)))) {
      var G__8517 = cljs.core.rest.call(null, in$__8515);
      var G__8518 = cljs.core.conj.call(null, out__8516, cljs.core.first.call(null, in$__8515));
      in$__8515 = G__8517;
      out__8516 = G__8518;
      continue
    }else {
      return out__8516
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__8519 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____8520 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____8520)) {
        var e__8521 = temp__3695__auto____8520;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__8521))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__8519, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__8514_SHARP_) {
      var temp__3695__auto____8522 = cljs.core.find.call(null, smap, p1__8514_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____8522)) {
        var e__8523 = temp__3695__auto____8522;
        return cljs.core.second.call(null, e__8523)
      }else {
        return p1__8514_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__8531 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__8524, seen) {
        while(true) {
          var vec__8525__8526 = p__8524;
          var f__8527 = cljs.core.nth.call(null, vec__8525__8526, 0, null);
          var xs__8528 = vec__8525__8526;
          var temp__3698__auto____8529 = cljs.core.seq.call(null, xs__8528);
          if(cljs.core.truth_(temp__3698__auto____8529)) {
            var s__8530 = temp__3698__auto____8529;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__8527))) {
              var G__8532 = cljs.core.rest.call(null, s__8530);
              var G__8533 = seen;
              p__8524 = G__8532;
              seen = G__8533;
              continue
            }else {
              return cljs.core.cons.call(null, f__8527, step.call(null, cljs.core.rest.call(null, s__8530), cljs.core.conj.call(null, seen, f__8527)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__8531.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__8534 = cljs.core.Vector.fromArray([]);
  var s__8535 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__8535))) {
      var G__8536 = cljs.core.conj.call(null, ret__8534, cljs.core.first.call(null, s__8535));
      var G__8537 = cljs.core.next.call(null, s__8535);
      ret__8534 = G__8536;
      s__8535 = G__8537;
      continue
    }else {
      return cljs.core.seq.call(null, ret__8534)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____8538 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____8538)) {
        return or__3548__auto____8538
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__8539 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__8539 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__8539 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____8540 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____8540)) {
      return or__3548__auto____8540
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__8541 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__8541 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__8541)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__8544 = cljs.core.ObjMap.fromObject([], {});
  var ks__8545 = cljs.core.seq.call(null, keys);
  var vs__8546 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8547 = ks__8545;
      if(cljs.core.truth_(and__3546__auto____8547)) {
        return vs__8546
      }else {
        return and__3546__auto____8547
      }
    }())) {
      var G__8548 = cljs.core.assoc.call(null, map__8544, cljs.core.first.call(null, ks__8545), cljs.core.first.call(null, vs__8546));
      var G__8549 = cljs.core.next.call(null, ks__8545);
      var G__8550 = cljs.core.next.call(null, vs__8546);
      map__8544 = G__8548;
      ks__8545 = G__8549;
      vs__8546 = G__8550;
      continue
    }else {
      return map__8544
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__8553 = function(k, x) {
    return x
  };
  var max_key__8554 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__8555 = function() {
    var G__8557__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__8542_SHARP_, p2__8543_SHARP_) {
        return max_key.call(null, k, p1__8542_SHARP_, p2__8543_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__8557 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8557__delegate.call(this, k, x, y, more)
    };
    G__8557.cljs$lang$maxFixedArity = 3;
    G__8557.cljs$lang$applyTo = function(arglist__8558) {
      var k = cljs.core.first(arglist__8558);
      var x = cljs.core.first(cljs.core.next(arglist__8558));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8558)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8558)));
      return G__8557__delegate.call(this, k, x, y, more)
    };
    return G__8557
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__8553.call(this, k, x);
      case 3:
        return max_key__8554.call(this, k, x, y);
      default:
        return max_key__8555.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__8555.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__8559 = function(k, x) {
    return x
  };
  var min_key__8560 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__8561 = function() {
    var G__8563__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__8551_SHARP_, p2__8552_SHARP_) {
        return min_key.call(null, k, p1__8551_SHARP_, p2__8552_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__8563 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8563__delegate.call(this, k, x, y, more)
    };
    G__8563.cljs$lang$maxFixedArity = 3;
    G__8563.cljs$lang$applyTo = function(arglist__8564) {
      var k = cljs.core.first(arglist__8564);
      var x = cljs.core.first(cljs.core.next(arglist__8564));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8564)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8564)));
      return G__8563__delegate.call(this, k, x, y, more)
    };
    return G__8563
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__8559.call(this, k, x);
      case 3:
        return min_key__8560.call(this, k, x, y);
      default:
        return min_key__8561.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__8561.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__8567 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__8568 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8565 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8565)) {
        var s__8566 = temp__3698__auto____8565;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__8566), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__8566)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__8567.call(this, n, step);
      case 3:
        return partition_all__8568.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8570 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8570)) {
      var s__8571 = temp__3698__auto____8570;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__8571)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8571), take_while.call(null, pred, cljs.core.rest.call(null, s__8571)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__8572 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__8573 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__8589 = null;
  var G__8589__8590 = function(rng, f) {
    var this__8574 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__8589__8591 = function(rng, f, s) {
    var this__8575 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__8589 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__8589__8590.call(this, rng, f);
      case 3:
        return G__8589__8591.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8589
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__8576 = this;
  var comp__8577 = cljs.core.truth_(this__8576.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__8577.call(null, this__8576.start, this__8576.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__8578 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__8578.end - this__8578.start) / this__8578.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__8579 = this;
  return this__8579.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__8580 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__8580.meta, this__8580.start + this__8580.step, this__8580.end, this__8580.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__8581 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__8582 = this;
  return new cljs.core.Range(meta, this__8582.start, this__8582.end, this__8582.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__8583 = this;
  return this__8583.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__8593 = null;
  var G__8593__8594 = function(rng, n) {
    var this__8584 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__8584.start + n * this__8584.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____8585 = this__8584.start > this__8584.end;
        if(cljs.core.truth_(and__3546__auto____8585)) {
          return cljs.core._EQ_.call(null, this__8584.step, 0)
        }else {
          return and__3546__auto____8585
        }
      }())) {
        return this__8584.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__8593__8595 = function(rng, n, not_found) {
    var this__8586 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__8586.start + n * this__8586.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____8587 = this__8586.start > this__8586.end;
        if(cljs.core.truth_(and__3546__auto____8587)) {
          return cljs.core._EQ_.call(null, this__8586.step, 0)
        }else {
          return and__3546__auto____8587
        }
      }())) {
        return this__8586.start
      }else {
        return not_found
      }
    }
  };
  G__8593 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8593__8594.call(this, rng, n);
      case 3:
        return G__8593__8595.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8593
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__8588 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8588.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__8597 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__8598 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__8599 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__8600 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__8597.call(this);
      case 1:
        return range__8598.call(this, start);
      case 2:
        return range__8599.call(this, start, end);
      case 3:
        return range__8600.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8602 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8602)) {
      var s__8603 = temp__3698__auto____8602;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__8603), take_nth.call(null, n, cljs.core.drop.call(null, n, s__8603)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8605 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8605)) {
      var s__8606 = temp__3698__auto____8605;
      var fst__8607 = cljs.core.first.call(null, s__8606);
      var fv__8608 = f.call(null, fst__8607);
      var run__8609 = cljs.core.cons.call(null, fst__8607, cljs.core.take_while.call(null, function(p1__8604_SHARP_) {
        return cljs.core._EQ_.call(null, fv__8608, f.call(null, p1__8604_SHARP_))
      }, cljs.core.next.call(null, s__8606)));
      return cljs.core.cons.call(null, run__8609, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__8609), s__8606))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__8624 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____8620 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____8620)) {
        var s__8621 = temp__3695__auto____8620;
        return reductions.call(null, f, cljs.core.first.call(null, s__8621), cljs.core.rest.call(null, s__8621))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__8625 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8622 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8622)) {
        var s__8623 = temp__3698__auto____8622;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__8623)), cljs.core.rest.call(null, s__8623))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__8624.call(this, f, init);
      case 3:
        return reductions__8625.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__8628 = function(f) {
    return function() {
      var G__8633 = null;
      var G__8633__8634 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__8633__8635 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__8633__8636 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__8633__8637 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__8633__8638 = function() {
        var G__8640__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__8640 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8640__delegate.call(this, x, y, z, args)
        };
        G__8640.cljs$lang$maxFixedArity = 3;
        G__8640.cljs$lang$applyTo = function(arglist__8641) {
          var x = cljs.core.first(arglist__8641);
          var y = cljs.core.first(cljs.core.next(arglist__8641));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8641)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8641)));
          return G__8640__delegate.call(this, x, y, z, args)
        };
        return G__8640
      }();
      G__8633 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8633__8634.call(this);
          case 1:
            return G__8633__8635.call(this, x);
          case 2:
            return G__8633__8636.call(this, x, y);
          case 3:
            return G__8633__8637.call(this, x, y, z);
          default:
            return G__8633__8638.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8633.cljs$lang$maxFixedArity = 3;
      G__8633.cljs$lang$applyTo = G__8633__8638.cljs$lang$applyTo;
      return G__8633
    }()
  };
  var juxt__8629 = function(f, g) {
    return function() {
      var G__8642 = null;
      var G__8642__8643 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__8642__8644 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__8642__8645 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__8642__8646 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__8642__8647 = function() {
        var G__8649__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8649 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8649__delegate.call(this, x, y, z, args)
        };
        G__8649.cljs$lang$maxFixedArity = 3;
        G__8649.cljs$lang$applyTo = function(arglist__8650) {
          var x = cljs.core.first(arglist__8650);
          var y = cljs.core.first(cljs.core.next(arglist__8650));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8650)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8650)));
          return G__8649__delegate.call(this, x, y, z, args)
        };
        return G__8649
      }();
      G__8642 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8642__8643.call(this);
          case 1:
            return G__8642__8644.call(this, x);
          case 2:
            return G__8642__8645.call(this, x, y);
          case 3:
            return G__8642__8646.call(this, x, y, z);
          default:
            return G__8642__8647.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8642.cljs$lang$maxFixedArity = 3;
      G__8642.cljs$lang$applyTo = G__8642__8647.cljs$lang$applyTo;
      return G__8642
    }()
  };
  var juxt__8630 = function(f, g, h) {
    return function() {
      var G__8651 = null;
      var G__8651__8652 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__8651__8653 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__8651__8654 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__8651__8655 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__8651__8656 = function() {
        var G__8658__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__8658 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8658__delegate.call(this, x, y, z, args)
        };
        G__8658.cljs$lang$maxFixedArity = 3;
        G__8658.cljs$lang$applyTo = function(arglist__8659) {
          var x = cljs.core.first(arglist__8659);
          var y = cljs.core.first(cljs.core.next(arglist__8659));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8659)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8659)));
          return G__8658__delegate.call(this, x, y, z, args)
        };
        return G__8658
      }();
      G__8651 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8651__8652.call(this);
          case 1:
            return G__8651__8653.call(this, x);
          case 2:
            return G__8651__8654.call(this, x, y);
          case 3:
            return G__8651__8655.call(this, x, y, z);
          default:
            return G__8651__8656.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8651.cljs$lang$maxFixedArity = 3;
      G__8651.cljs$lang$applyTo = G__8651__8656.cljs$lang$applyTo;
      return G__8651
    }()
  };
  var juxt__8631 = function() {
    var G__8660__delegate = function(f, g, h, fs) {
      var fs__8627 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__8661 = null;
        var G__8661__8662 = function() {
          return cljs.core.reduce.call(null, function(p1__8610_SHARP_, p2__8611_SHARP_) {
            return cljs.core.conj.call(null, p1__8610_SHARP_, p2__8611_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__8627)
        };
        var G__8661__8663 = function(x) {
          return cljs.core.reduce.call(null, function(p1__8612_SHARP_, p2__8613_SHARP_) {
            return cljs.core.conj.call(null, p1__8612_SHARP_, p2__8613_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__8627)
        };
        var G__8661__8664 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__8614_SHARP_, p2__8615_SHARP_) {
            return cljs.core.conj.call(null, p1__8614_SHARP_, p2__8615_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__8627)
        };
        var G__8661__8665 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__8616_SHARP_, p2__8617_SHARP_) {
            return cljs.core.conj.call(null, p1__8616_SHARP_, p2__8617_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__8627)
        };
        var G__8661__8666 = function() {
          var G__8668__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__8618_SHARP_, p2__8619_SHARP_) {
              return cljs.core.conj.call(null, p1__8618_SHARP_, cljs.core.apply.call(null, p2__8619_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__8627)
          };
          var G__8668 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8668__delegate.call(this, x, y, z, args)
          };
          G__8668.cljs$lang$maxFixedArity = 3;
          G__8668.cljs$lang$applyTo = function(arglist__8669) {
            var x = cljs.core.first(arglist__8669);
            var y = cljs.core.first(cljs.core.next(arglist__8669));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8669)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8669)));
            return G__8668__delegate.call(this, x, y, z, args)
          };
          return G__8668
        }();
        G__8661 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__8661__8662.call(this);
            case 1:
              return G__8661__8663.call(this, x);
            case 2:
              return G__8661__8664.call(this, x, y);
            case 3:
              return G__8661__8665.call(this, x, y, z);
            default:
              return G__8661__8666.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__8661.cljs$lang$maxFixedArity = 3;
        G__8661.cljs$lang$applyTo = G__8661__8666.cljs$lang$applyTo;
        return G__8661
      }()
    };
    var G__8660 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8660__delegate.call(this, f, g, h, fs)
    };
    G__8660.cljs$lang$maxFixedArity = 3;
    G__8660.cljs$lang$applyTo = function(arglist__8670) {
      var f = cljs.core.first(arglist__8670);
      var g = cljs.core.first(cljs.core.next(arglist__8670));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8670)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8670)));
      return G__8660__delegate.call(this, f, g, h, fs)
    };
    return G__8660
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__8628.call(this, f);
      case 2:
        return juxt__8629.call(this, f, g);
      case 3:
        return juxt__8630.call(this, f, g, h);
      default:
        return juxt__8631.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__8631.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__8672 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__8675 = cljs.core.next.call(null, coll);
        coll = G__8675;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__8673 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____8671 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____8671)) {
          return n > 0
        }else {
          return and__3546__auto____8671
        }
      }())) {
        var G__8676 = n - 1;
        var G__8677 = cljs.core.next.call(null, coll);
        n = G__8676;
        coll = G__8677;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__8672.call(this, n);
      case 2:
        return dorun__8673.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__8678 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__8679 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__8678.call(this, n);
      case 2:
        return doall__8679.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__8681 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__8681), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__8681), 1))) {
      return cljs.core.first.call(null, matches__8681)
    }else {
      return cljs.core.vec.call(null, matches__8681)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__8682 = re.exec(s);
  if(cljs.core.truth_(matches__8682 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__8682), 1))) {
      return cljs.core.first.call(null, matches__8682)
    }else {
      return cljs.core.vec.call(null, matches__8682)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__8683 = cljs.core.re_find.call(null, re, s);
  var match_idx__8684 = s.search(re);
  var match_str__8685 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__8683)) ? cljs.core.first.call(null, match_data__8683) : match_data__8683;
  var post_match__8686 = cljs.core.subs.call(null, s, match_idx__8684 + cljs.core.count.call(null, match_str__8685));
  if(cljs.core.truth_(match_data__8683)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__8683, re_seq.call(null, re, post_match__8686))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__8688__8689 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___8690 = cljs.core.nth.call(null, vec__8688__8689, 0, null);
  var flags__8691 = cljs.core.nth.call(null, vec__8688__8689, 1, null);
  var pattern__8692 = cljs.core.nth.call(null, vec__8688__8689, 2, null);
  return new RegExp(pattern__8692, flags__8691)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__8687_SHARP_) {
    return print_one.call(null, p1__8687_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____8693 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____8693)) {
            var and__3546__auto____8697 = function() {
              var x__450__auto____8694 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____8695 = x__450__auto____8694;
                if(cljs.core.truth_(and__3546__auto____8695)) {
                  var and__3546__auto____8696 = x__450__auto____8694.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____8696)) {
                    return cljs.core.not.call(null, x__450__auto____8694.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____8696
                  }
                }else {
                  return and__3546__auto____8695
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____8694)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____8697)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____8697
            }
          }else {
            return and__3546__auto____8693
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____8698 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____8699 = x__450__auto____8698;
            if(cljs.core.truth_(and__3546__auto____8699)) {
              var and__3546__auto____8700 = x__450__auto____8698.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____8700)) {
                return cljs.core.not.call(null, x__450__auto____8698.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____8700
              }
            }else {
              return and__3546__auto____8699
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____8698)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__8701 = cljs.core.first.call(null, objs);
  var sb__8702 = new goog.string.StringBuffer;
  var G__8703__8704 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__8703__8704)) {
    var obj__8705 = cljs.core.first.call(null, G__8703__8704);
    var G__8703__8706 = G__8703__8704;
    while(true) {
      if(cljs.core.truth_(obj__8705 === first_obj__8701)) {
      }else {
        sb__8702.append(" ")
      }
      var G__8707__8708 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__8705, opts));
      if(cljs.core.truth_(G__8707__8708)) {
        var string__8709 = cljs.core.first.call(null, G__8707__8708);
        var G__8707__8710 = G__8707__8708;
        while(true) {
          sb__8702.append(string__8709);
          var temp__3698__auto____8711 = cljs.core.next.call(null, G__8707__8710);
          if(cljs.core.truth_(temp__3698__auto____8711)) {
            var G__8707__8712 = temp__3698__auto____8711;
            var G__8715 = cljs.core.first.call(null, G__8707__8712);
            var G__8716 = G__8707__8712;
            string__8709 = G__8715;
            G__8707__8710 = G__8716;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____8713 = cljs.core.next.call(null, G__8703__8706);
      if(cljs.core.truth_(temp__3698__auto____8713)) {
        var G__8703__8714 = temp__3698__auto____8713;
        var G__8717 = cljs.core.first.call(null, G__8703__8714);
        var G__8718 = G__8703__8714;
        obj__8705 = G__8717;
        G__8703__8706 = G__8718;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__8702)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__8719 = cljs.core.first.call(null, objs);
  var G__8720__8721 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__8720__8721)) {
    var obj__8722 = cljs.core.first.call(null, G__8720__8721);
    var G__8720__8723 = G__8720__8721;
    while(true) {
      if(cljs.core.truth_(obj__8722 === first_obj__8719)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__8724__8725 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__8722, opts));
      if(cljs.core.truth_(G__8724__8725)) {
        var string__8726 = cljs.core.first.call(null, G__8724__8725);
        var G__8724__8727 = G__8724__8725;
        while(true) {
          cljs.core.string_print.call(null, string__8726);
          var temp__3698__auto____8728 = cljs.core.next.call(null, G__8724__8727);
          if(cljs.core.truth_(temp__3698__auto____8728)) {
            var G__8724__8729 = temp__3698__auto____8728;
            var G__8732 = cljs.core.first.call(null, G__8724__8729);
            var G__8733 = G__8724__8729;
            string__8726 = G__8732;
            G__8724__8727 = G__8733;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____8730 = cljs.core.next.call(null, G__8720__8723);
      if(cljs.core.truth_(temp__3698__auto____8730)) {
        var G__8720__8731 = temp__3698__auto____8730;
        var G__8734 = cljs.core.first.call(null, G__8720__8731);
        var G__8735 = G__8720__8731;
        obj__8722 = G__8734;
        G__8720__8723 = G__8735;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__8736) {
    var objs = cljs.core.seq(arglist__8736);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__8737) {
    var objs = cljs.core.seq(arglist__8737);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__8738) {
    var objs = cljs.core.seq(arglist__8738);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__8739) {
    var objs = cljs.core.seq(arglist__8739);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__8740) {
    var objs = cljs.core.seq(arglist__8740);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__8741 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8741, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____8742 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____8742)) {
        var nspc__8743 = temp__3698__auto____8742;
        return cljs.core.str.call(null, nspc__8743, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____8744 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____8744)) {
          var nspc__8745 = temp__3698__auto____8744;
          return cljs.core.str.call(null, nspc__8745, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__8746 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8746, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__8747 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__8748 = this;
  var G__8749__8750 = cljs.core.seq.call(null, this__8748.watches);
  if(cljs.core.truth_(G__8749__8750)) {
    var G__8752__8754 = cljs.core.first.call(null, G__8749__8750);
    var vec__8753__8755 = G__8752__8754;
    var key__8756 = cljs.core.nth.call(null, vec__8753__8755, 0, null);
    var f__8757 = cljs.core.nth.call(null, vec__8753__8755, 1, null);
    var G__8749__8758 = G__8749__8750;
    var G__8752__8759 = G__8752__8754;
    var G__8749__8760 = G__8749__8758;
    while(true) {
      var vec__8761__8762 = G__8752__8759;
      var key__8763 = cljs.core.nth.call(null, vec__8761__8762, 0, null);
      var f__8764 = cljs.core.nth.call(null, vec__8761__8762, 1, null);
      var G__8749__8765 = G__8749__8760;
      f__8764.call(null, key__8763, this$, oldval, newval);
      var temp__3698__auto____8766 = cljs.core.next.call(null, G__8749__8765);
      if(cljs.core.truth_(temp__3698__auto____8766)) {
        var G__8749__8767 = temp__3698__auto____8766;
        var G__8774 = cljs.core.first.call(null, G__8749__8767);
        var G__8775 = G__8749__8767;
        G__8752__8759 = G__8774;
        G__8749__8760 = G__8775;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__8768 = this;
  return this$.watches = cljs.core.assoc.call(null, this__8768.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__8769 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__8769.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__8770 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__8770.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__8771 = this;
  return this__8771.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__8772 = this;
  return this__8772.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__8773 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__8782 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__8783 = function() {
    var G__8785__delegate = function(x, p__8776) {
      var map__8777__8778 = p__8776;
      var map__8777__8779 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__8777__8778)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8777__8778) : map__8777__8778;
      var validator__8780 = cljs.core.get.call(null, map__8777__8779, "\ufdd0'validator");
      var meta__8781 = cljs.core.get.call(null, map__8777__8779, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__8781, validator__8780, null)
    };
    var G__8785 = function(x, var_args) {
      var p__8776 = null;
      if(goog.isDef(var_args)) {
        p__8776 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8785__delegate.call(this, x, p__8776)
    };
    G__8785.cljs$lang$maxFixedArity = 1;
    G__8785.cljs$lang$applyTo = function(arglist__8786) {
      var x = cljs.core.first(arglist__8786);
      var p__8776 = cljs.core.rest(arglist__8786);
      return G__8785__delegate.call(this, x, p__8776)
    };
    return G__8785
  }();
  atom = function(x, var_args) {
    var p__8776 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__8782.call(this, x);
      default:
        return atom__8783.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__8783.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____8787 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____8787)) {
    var validate__8788 = temp__3698__auto____8787;
    if(cljs.core.truth_(validate__8788.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__8789 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__8789, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___8790 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___8791 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___8792 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___8793 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___8794 = function() {
    var G__8796__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__8796 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8796__delegate.call(this, a, f, x, y, z, more)
    };
    G__8796.cljs$lang$maxFixedArity = 5;
    G__8796.cljs$lang$applyTo = function(arglist__8797) {
      var a = cljs.core.first(arglist__8797);
      var f = cljs.core.first(cljs.core.next(arglist__8797));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8797)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8797))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8797)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8797)))));
      return G__8796__delegate.call(this, a, f, x, y, z, more)
    };
    return G__8796
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___8790.call(this, a, f);
      case 3:
        return swap_BANG___8791.call(this, a, f, x);
      case 4:
        return swap_BANG___8792.call(this, a, f, x, y);
      case 5:
        return swap_BANG___8793.call(this, a, f, x, y, z);
      default:
        return swap_BANG___8794.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___8794.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__8798) {
    var iref = cljs.core.first(arglist__8798);
    var f = cljs.core.first(cljs.core.next(arglist__8798));
    var args = cljs.core.rest(cljs.core.next(arglist__8798));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__8799 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__8800 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__8799.call(this);
      case 1:
        return gensym__8800.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__8802 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__8802.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__8803 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__8803.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__8803.state, this__8803.f)
  }
  return cljs.core.deref.call(null, this__8803.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__8804) {
    var body = cljs.core.seq(arglist__8804);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__8805__8806 = options;
    var map__8805__8807 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__8805__8806)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8805__8806) : map__8805__8806;
    var keywordize_keys__8808 = cljs.core.get.call(null, map__8805__8807, "\ufdd0'keywordize-keys");
    var keyfn__8809 = cljs.core.truth_(keywordize_keys__8808) ? cljs.core.keyword : cljs.core.str;
    var f__8815 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__514__auto____8814 = function iter__8810(s__8811) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__8811__8812 = s__8811;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__8811__8812))) {
                        var k__8813 = cljs.core.first.call(null, s__8811__8812);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__8809.call(null, k__8813), thisfn.call(null, x[k__8813])]), iter__8810.call(null, cljs.core.rest.call(null, s__8811__8812)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____8814.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__8815.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__8816) {
    var x = cljs.core.first(arglist__8816);
    var options = cljs.core.rest(arglist__8816);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__8817 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__8821__delegate = function(args) {
      var temp__3695__auto____8818 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__8817), args);
      if(cljs.core.truth_(temp__3695__auto____8818)) {
        var v__8819 = temp__3695__auto____8818;
        return v__8819
      }else {
        var ret__8820 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__8817, cljs.core.assoc, args, ret__8820);
        return ret__8820
      }
    };
    var G__8821 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8821__delegate.call(this, args)
    };
    G__8821.cljs$lang$maxFixedArity = 0;
    G__8821.cljs$lang$applyTo = function(arglist__8822) {
      var args = cljs.core.seq(arglist__8822);
      return G__8821__delegate.call(this, args)
    };
    return G__8821
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__8824 = function(f) {
    while(true) {
      var ret__8823 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__8823))) {
        var G__8827 = ret__8823;
        f = G__8827;
        continue
      }else {
        return ret__8823
      }
      break
    }
  };
  var trampoline__8825 = function() {
    var G__8828__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__8828 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8828__delegate.call(this, f, args)
    };
    G__8828.cljs$lang$maxFixedArity = 1;
    G__8828.cljs$lang$applyTo = function(arglist__8829) {
      var f = cljs.core.first(arglist__8829);
      var args = cljs.core.rest(arglist__8829);
      return G__8828__delegate.call(this, f, args)
    };
    return G__8828
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__8824.call(this, f);
      default:
        return trampoline__8825.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__8825.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__8830 = function() {
    return rand.call(null, 1)
  };
  var rand__8831 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__8830.call(this);
      case 1:
        return rand__8831.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__8833 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__8833, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__8833, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___8842 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___8843 = function(h, child, parent) {
    var or__3548__auto____8834 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____8834)) {
      return or__3548__auto____8834
    }else {
      var or__3548__auto____8835 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____8835)) {
        return or__3548__auto____8835
      }else {
        var and__3546__auto____8836 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____8836)) {
          var and__3546__auto____8837 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____8837)) {
            var and__3546__auto____8838 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____8838)) {
              var ret__8839 = true;
              var i__8840 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____8841 = cljs.core.not.call(null, ret__8839);
                  if(cljs.core.truth_(or__3548__auto____8841)) {
                    return or__3548__auto____8841
                  }else {
                    return cljs.core._EQ_.call(null, i__8840, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__8839
                }else {
                  var G__8845 = isa_QMARK_.call(null, h, child.call(null, i__8840), parent.call(null, i__8840));
                  var G__8846 = i__8840 + 1;
                  ret__8839 = G__8845;
                  i__8840 = G__8846;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____8838
            }
          }else {
            return and__3546__auto____8837
          }
        }else {
          return and__3546__auto____8836
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___8842.call(this, h, child);
      case 3:
        return isa_QMARK___8843.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__8847 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__8848 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__8847.call(this, h);
      case 2:
        return parents__8848.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__8850 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__8851 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__8850.call(this, h);
      case 2:
        return ancestors__8851.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__8853 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__8854 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__8853.call(this, h);
      case 2:
        return descendants__8854.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__8864 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__8865 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__8859 = "\ufdd0'parents".call(null, h);
    var td__8860 = "\ufdd0'descendants".call(null, h);
    var ta__8861 = "\ufdd0'ancestors".call(null, h);
    var tf__8862 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____8863 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__8859.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__8861.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__8861.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__8859, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__8862.call(null, "\ufdd0'ancestors".call(null, h), tag, td__8860, parent, ta__8861), "\ufdd0'descendants":tf__8862.call(null, "\ufdd0'descendants".call(null, h), parent, ta__8861, tag, td__8860)})
    }();
    if(cljs.core.truth_(or__3548__auto____8863)) {
      return or__3548__auto____8863
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__8864.call(this, h, tag);
      case 3:
        return derive__8865.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__8871 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__8872 = function(h, tag, parent) {
    var parentMap__8867 = "\ufdd0'parents".call(null, h);
    var childsParents__8868 = cljs.core.truth_(parentMap__8867.call(null, tag)) ? cljs.core.disj.call(null, parentMap__8867.call(null, tag), parent) : cljs.core.set([]);
    var newParents__8869 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__8868)) ? cljs.core.assoc.call(null, parentMap__8867, tag, childsParents__8868) : cljs.core.dissoc.call(null, parentMap__8867, tag);
    var deriv_seq__8870 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__8856_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__8856_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__8856_SHARP_), cljs.core.second.call(null, p1__8856_SHARP_)))
    }, cljs.core.seq.call(null, newParents__8869)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__8867.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__8857_SHARP_, p2__8858_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__8857_SHARP_, p2__8858_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__8870))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__8871.call(this, h, tag);
      case 3:
        return underive__8872.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__8874 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____8876 = cljs.core.truth_(function() {
    var and__3546__auto____8875 = xprefs__8874;
    if(cljs.core.truth_(and__3546__auto____8875)) {
      return xprefs__8874.call(null, y)
    }else {
      return and__3546__auto____8875
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____8876)) {
    return or__3548__auto____8876
  }else {
    var or__3548__auto____8878 = function() {
      var ps__8877 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__8877) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__8877), prefer_table))) {
          }else {
          }
          var G__8881 = cljs.core.rest.call(null, ps__8877);
          ps__8877 = G__8881;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____8878)) {
      return or__3548__auto____8878
    }else {
      var or__3548__auto____8880 = function() {
        var ps__8879 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__8879) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__8879), y, prefer_table))) {
            }else {
            }
            var G__8882 = cljs.core.rest.call(null, ps__8879);
            ps__8879 = G__8882;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____8880)) {
        return or__3548__auto____8880
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____8883 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____8883)) {
    return or__3548__auto____8883
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__8892 = cljs.core.reduce.call(null, function(be, p__8884) {
    var vec__8885__8886 = p__8884;
    var k__8887 = cljs.core.nth.call(null, vec__8885__8886, 0, null);
    var ___8888 = cljs.core.nth.call(null, vec__8885__8886, 1, null);
    var e__8889 = vec__8885__8886;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__8887))) {
      var be2__8891 = cljs.core.truth_(function() {
        var or__3548__auto____8890 = be === null;
        if(cljs.core.truth_(or__3548__auto____8890)) {
          return or__3548__auto____8890
        }else {
          return cljs.core.dominates.call(null, k__8887, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__8889 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__8891), k__8887, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__8887, " and ", cljs.core.first.call(null, be2__8891), ", and neither is preferred"));
      }
      return be2__8891
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__8892)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__8892));
      return cljs.core.second.call(null, best_entry__8892)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8893 = mf;
    if(cljs.core.truth_(and__3546__auto____8893)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____8893
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____8894 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8894)) {
        return or__3548__auto____8894
      }else {
        var or__3548__auto____8895 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____8895)) {
          return or__3548__auto____8895
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8896 = mf;
    if(cljs.core.truth_(and__3546__auto____8896)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____8896
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____8897 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8897)) {
        return or__3548__auto____8897
      }else {
        var or__3548__auto____8898 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____8898)) {
          return or__3548__auto____8898
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8899 = mf;
    if(cljs.core.truth_(and__3546__auto____8899)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____8899
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____8900 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8900)) {
        return or__3548__auto____8900
      }else {
        var or__3548__auto____8901 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____8901)) {
          return or__3548__auto____8901
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8902 = mf;
    if(cljs.core.truth_(and__3546__auto____8902)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____8902
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____8903 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8903)) {
        return or__3548__auto____8903
      }else {
        var or__3548__auto____8904 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____8904)) {
          return or__3548__auto____8904
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8905 = mf;
    if(cljs.core.truth_(and__3546__auto____8905)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____8905
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____8906 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8906)) {
        return or__3548__auto____8906
      }else {
        var or__3548__auto____8907 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____8907)) {
          return or__3548__auto____8907
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8908 = mf;
    if(cljs.core.truth_(and__3546__auto____8908)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____8908
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____8909 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8909)) {
        return or__3548__auto____8909
      }else {
        var or__3548__auto____8910 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____8910)) {
          return or__3548__auto____8910
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8911 = mf;
    if(cljs.core.truth_(and__3546__auto____8911)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____8911
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____8912 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8912)) {
        return or__3548__auto____8912
      }else {
        var or__3548__auto____8913 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____8913)) {
          return or__3548__auto____8913
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8914 = mf;
    if(cljs.core.truth_(and__3546__auto____8914)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____8914
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____8915 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____8915)) {
        return or__3548__auto____8915
      }else {
        var or__3548__auto____8916 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____8916)) {
          return or__3548__auto____8916
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__8917 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__8918 = cljs.core._get_method.call(null, mf, dispatch_val__8917);
  if(cljs.core.truth_(target_fn__8918)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__8917));
  }
  return cljs.core.apply.call(null, target_fn__8918, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__8919 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__8920 = this;
  cljs.core.swap_BANG_.call(null, this__8920.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__8920.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__8920.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__8920.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__8921 = this;
  cljs.core.swap_BANG_.call(null, this__8921.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__8921.method_cache, this__8921.method_table, this__8921.cached_hierarchy, this__8921.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__8922 = this;
  cljs.core.swap_BANG_.call(null, this__8922.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__8922.method_cache, this__8922.method_table, this__8922.cached_hierarchy, this__8922.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__8923 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__8923.cached_hierarchy), cljs.core.deref.call(null, this__8923.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__8923.method_cache, this__8923.method_table, this__8923.cached_hierarchy, this__8923.hierarchy)
  }
  var temp__3695__auto____8924 = cljs.core.deref.call(null, this__8923.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____8924)) {
    var target_fn__8925 = temp__3695__auto____8924;
    return target_fn__8925
  }else {
    var temp__3695__auto____8926 = cljs.core.find_and_cache_best_method.call(null, this__8923.name, dispatch_val, this__8923.hierarchy, this__8923.method_table, this__8923.prefer_table, this__8923.method_cache, this__8923.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____8926)) {
      var target_fn__8927 = temp__3695__auto____8926;
      return target_fn__8927
    }else {
      return cljs.core.deref.call(null, this__8923.method_table).call(null, this__8923.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__8928 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__8928.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__8928.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__8928.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__8928.method_cache, this__8928.method_table, this__8928.cached_hierarchy, this__8928.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__8929 = this;
  return cljs.core.deref.call(null, this__8929.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__8930 = this;
  return cljs.core.deref.call(null, this__8930.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__8931 = this;
  return cljs.core.do_dispatch.call(null, mf, this__8931.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__8932__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__8932 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__8932__delegate.call(this, _, args)
  };
  G__8932.cljs$lang$maxFixedArity = 1;
  G__8932.cljs$lang$applyTo = function(arglist__8933) {
    var _ = cljs.core.first(arglist__8933);
    var args = cljs.core.rest(arglist__8933);
    return G__8932__delegate.call(this, _, args)
  };
  return G__8932
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, match))) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw cljs.core.str.call(null, "Invalid match arg: ", match);
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__8934 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__8935 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__8934.call(this, separator);
      case 2:
        return join__8935.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.truth_(cljs.core.count.call(null, s) < 2)) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return cljs.core.str.call(null, clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1)), clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))
  }
};
clojure.string.split = function() {
  var split = null;
  var split__8943 = function(s, re) {
    return cljs.core.vec.call(null, cljs.core.str.call(null, s).split(re))
  };
  var split__8944 = function(s, re, limit) {
    if(cljs.core.truth_(limit < 1)) {
      return cljs.core.vec.call(null, cljs.core.str.call(null, s).split(re))
    }else {
      var s__8937 = s;
      var limit__8938 = limit;
      var parts__8939 = cljs.core.Vector.fromArray([]);
      while(true) {
        if(cljs.core.truth_(cljs.core._EQ_.call(null, limit__8938, 1))) {
          return cljs.core.conj.call(null, parts__8939, s__8937)
        }else {
          var temp__3695__auto____8940 = cljs.core.re_find.call(null, re, s__8937);
          if(cljs.core.truth_(temp__3695__auto____8940)) {
            var m__8941 = temp__3695__auto____8940;
            var index__8942 = s__8937.indexOf(m__8941);
            var G__8946 = s__8937.substring(index__8942 + cljs.core.count.call(null, m__8941));
            var G__8947 = limit__8938 - 1;
            var G__8948 = cljs.core.conj.call(null, parts__8939, s__8937.substring(0, index__8942));
            s__8937 = G__8946;
            limit__8938 = G__8947;
            parts__8939 = G__8948;
            continue
          }else {
            return cljs.core.conj.call(null, parts__8939, s__8937)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__8943.call(this, s, re);
      case 3:
        return split__8944.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim.call(null, s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft.call(null, s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight.call(null, s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__8949 = s.length;
  while(true) {
    if(cljs.core.truth_(index__8949 === 0)) {
      return""
    }else {
      var ch__8950 = cljs.core.get.call(null, s, index__8949 - 1);
      if(cljs.core.truth_(function() {
        var or__3548__auto____8951 = cljs.core._EQ_.call(null, ch__8950, "\n");
        if(cljs.core.truth_(or__3548__auto____8951)) {
          return or__3548__auto____8951
        }else {
          return cljs.core._EQ_.call(null, ch__8950, "\r")
        }
      }())) {
        var G__8952 = index__8949 - 1;
        index__8949 = G__8952;
        continue
      }else {
        return s.substring(0, index__8949)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__8953 = cljs.core.str.call(null, s);
  if(cljs.core.truth_(function() {
    var or__3548__auto____8954 = cljs.core.not.call(null, s__8953);
    if(cljs.core.truth_(or__3548__auto____8954)) {
      return or__3548__auto____8954
    }else {
      var or__3548__auto____8955 = cljs.core._EQ_.call(null, "", s__8953);
      if(cljs.core.truth_(or__3548__auto____8955)) {
        return or__3548__auto____8955
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__8953)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__8956 = new goog.string.StringBuffer;
  var length__8957 = s.length;
  var index__8958 = 0;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, length__8957, index__8958))) {
      return buffer__8956.toString()
    }else {
      var ch__8959 = s.charAt(index__8958);
      var temp__3695__auto____8960 = cljs.core.get.call(null, cmap, ch__8959);
      if(cljs.core.truth_(temp__3695__auto____8960)) {
        var replacement__8961 = temp__3695__auto____8960;
        buffer__8956.append(cljs.core.str.call(null, replacement__8961))
      }else {
        buffer__8956.append(ch__8959)
      }
      var G__8962 = index__8958 + 1;
      index__8958 = G__8962;
      continue
    }
    break
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__9167 = cljs.core.js_obj.call(null);
  var G__9168__9169 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__9168__9169)) {
    var G__9171__9173 = cljs.core.first.call(null, G__9168__9169);
    var vec__9172__9174 = G__9171__9173;
    var k__9175 = cljs.core.nth.call(null, vec__9172__9174, 0, null);
    var v__9176 = cljs.core.nth.call(null, vec__9172__9174, 1, null);
    var G__9168__9177 = G__9168__9169;
    var G__9171__9178 = G__9171__9173;
    var G__9168__9179 = G__9168__9177;
    while(true) {
      var vec__9180__9181 = G__9171__9178;
      var k__9182 = cljs.core.nth.call(null, vec__9180__9181, 0, null);
      var v__9183 = cljs.core.nth.call(null, vec__9180__9181, 1, null);
      var G__9168__9184 = G__9168__9179;
      out__9167[cljs.core.name.call(null, k__9182)] = v__9183;
      var temp__3698__auto____9185 = cljs.core.next.call(null, G__9168__9184);
      if(cljs.core.truth_(temp__3698__auto____9185)) {
        var G__9168__9186 = temp__3698__auto____9185;
        var G__9187 = cljs.core.first.call(null, G__9168__9186);
        var G__9188 = G__9168__9186;
        G__9171__9178 = G__9187;
        G__9168__9179 = G__9188;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__9167
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__9189 = cljs.core.truth_(cljs.core.string_QMARK_.call(null, v)) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__9189)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__9190) {
    var v = cljs.core.first(arglist__9190);
    var text = cljs.core.rest(arglist__9190);
    return log__delegate.call(this, v, text)
  };
  return log
}();
goog.provide("jayq.core");
goog.require("cljs.core");
goog.require("jayq.util");
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, sel))) {
    return sel
  }else {
    if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, sel))) {
      return cljs.core.str.call(null, "[crateGroup=", jayq.core.crate_meta.call(null, sel), "]")
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, sel))) {
        return cljs.core.name.call(null, sel)
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__9092) {
    var vec__9093__9094 = p__9092;
    var context__9095 = cljs.core.nth.call(null, vec__9093__9094, 0, null);
    if(cljs.core.truth_(cljs.core.not.call(null, context__9095))) {
      return jQuery.call(null, jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery.call(null, jayq.core.__GT_selector.call(null, sel), context__9095)
    }
  };
  var $ = function(sel, var_args) {
    var p__9092 = null;
    if(goog.isDef(var_args)) {
      p__9092 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__9092)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__9096) {
    var sel = cljs.core.first(arglist__9096);
    var p__9092 = cljs.core.rest(arglist__9096);
    return $__delegate.call(this, sel, p__9092)
  };
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce = function(this$, f) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, cljs.core.first.call(null, this$), cljs.core.count.call(null, this$))
};
jQuery.prototype.cljs$core$IReduce$_reduce = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, start, jayq.core.i)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9098 = null;
  var G__9098__9099 = function(this$, k) {
    var or__3548__auto____9097 = this$.slice(k, k + 1);
    if(cljs.core.truth_(or__3548__auto____9097)) {
      return or__3548__auto____9097
    }else {
      return null
    }
  };
  var G__9098__9100 = function(this$, k, not_found) {
    return cljs.core._nth.call(null, this$, k, not_found)
  };
  G__9098 = function(this$, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9098__9099.call(this, this$, k);
      case 3:
        return G__9098__9100.call(this, this$, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9098
}();
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth = function(this$, n) {
  if(cljs.core.truth_(n < cljs.core.count.call(null, this$))) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth = function(this$, n, not_found) {
  if(cljs.core.truth_(n < cljs.core.count.call(null, this$))) {
    return this$.slice(n, n + 1)
  }else {
    if(cljs.core.truth_(void 0 === not_found)) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first = function(this$) {
  return this$.slice(0, 1)
};
jQuery.prototype.cljs$core$ISeq$_rest = function(this$) {
  if(cljs.core.truth_(cljs.core.count.call(null, this$) > 1)) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__9102 = null;
  var G__9102__9103 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__9102__9104 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__9102 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9102__9103.call(this, _, k);
      case 3:
        return G__9102__9104.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9102
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.map__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, opts))) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.map__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__9106) {
    var vec__9107__9108 = p__9106;
    var v__9109 = cljs.core.nth.call(null, vec__9107__9108, 0, null);
    var a__9110 = cljs.core.name.call(null, a);
    if(cljs.core.truth_(cljs.core.not.call(null, v__9109))) {
      return $elem.attr(a__9110)
    }else {
      return $elem.attr(a__9110, v__9109)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__9106 = null;
    if(goog.isDef(var_args)) {
      p__9106 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__9106)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__9111) {
    var $elem = cljs.core.first(arglist__9111);
    var a = cljs.core.first(cljs.core.next(arglist__9111));
    var p__9106 = cljs.core.rest(cljs.core.next(arglist__9111));
    return attr__delegate.call(this, $elem, a, p__9106)
  };
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__9112) {
    var vec__9113__9114 = p__9112;
    var v__9115 = cljs.core.nth.call(null, vec__9113__9114, 0, null);
    var k__9116 = cljs.core.name.call(null, k);
    if(cljs.core.truth_(cljs.core.not.call(null, v__9115))) {
      return $elem.data(k__9116)
    }else {
      return $elem.data(k__9116, v__9115)
    }
  };
  var data = function($elem, k, var_args) {
    var p__9112 = null;
    if(goog.isDef(var_args)) {
      p__9112 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__9112)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__9117) {
    var $elem = cljs.core.first(arglist__9117);
    var k = cljs.core.first(cljs.core.next(arglist__9117));
    var p__9112 = cljs.core.rest(cljs.core.next(arglist__9117));
    return data__delegate.call(this, $elem, k, p__9112)
  };
  return data
}();
jayq.core.add_class = function add_class($elem, cl) {
  var cl__9118 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__9118)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__9119 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__9119)
};
jayq.core.append = function append($elem, content) {
  return $elem.append(content)
};
jayq.core.prepend = function prepend($elem, content) {
  return $elem.prepend(content)
};
jayq.core.remove = function remove($elem) {
  return $elem.remove()
};
jayq.core.hide = function() {
  var hide__delegate = function($elem, p__9120) {
    var vec__9121__9122 = p__9120;
    var speed__9123 = cljs.core.nth.call(null, vec__9121__9122, 0, null);
    var on_finish__9124 = cljs.core.nth.call(null, vec__9121__9122, 1, null);
    return $elem.hide(speed__9123, on_finish__9124)
  };
  var hide = function($elem, var_args) {
    var p__9120 = null;
    if(goog.isDef(var_args)) {
      p__9120 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__9120)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__9125) {
    var $elem = cljs.core.first(arglist__9125);
    var p__9120 = cljs.core.rest(arglist__9125);
    return hide__delegate.call(this, $elem, p__9120)
  };
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__9126) {
    var vec__9127__9128 = p__9126;
    var speed__9129 = cljs.core.nth.call(null, vec__9127__9128, 0, null);
    var on_finish__9130 = cljs.core.nth.call(null, vec__9127__9128, 1, null);
    return $elem.show(speed__9129, on_finish__9130)
  };
  var show = function($elem, var_args) {
    var p__9126 = null;
    if(goog.isDef(var_args)) {
      p__9126 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__9126)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__9131) {
    var $elem = cljs.core.first(arglist__9131);
    var p__9126 = cljs.core.rest(arglist__9131);
    return show__delegate.call(this, $elem, p__9126)
  };
  return show
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__9132) {
    var vec__9133__9134 = p__9132;
    var speed__9135 = cljs.core.nth.call(null, vec__9133__9134, 0, null);
    var on_finish__9136 = cljs.core.nth.call(null, vec__9133__9134, 1, null);
    return $elem.fadeOut(speed__9135, on_finish__9136)
  };
  var fade_out = function($elem, var_args) {
    var p__9132 = null;
    if(goog.isDef(var_args)) {
      p__9132 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__9132)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__9137) {
    var $elem = cljs.core.first(arglist__9137);
    var p__9132 = cljs.core.rest(arglist__9137);
    return fade_out__delegate.call(this, $elem, p__9132)
  };
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__9138) {
    var vec__9139__9140 = p__9138;
    var speed__9141 = cljs.core.nth.call(null, vec__9139__9140, 0, null);
    var on_finish__9142 = cljs.core.nth.call(null, vec__9139__9140, 1, null);
    return $elem.fadeIn(speed__9141, on_finish__9142)
  };
  var fade_in = function($elem, var_args) {
    var p__9138 = null;
    if(goog.isDef(var_args)) {
      p__9138 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__9138)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__9143) {
    var $elem = cljs.core.first(arglist__9143);
    var p__9138 = cljs.core.rest(arglist__9143);
    return fade_in__delegate.call(this, $elem, p__9138)
  };
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__9144) {
    var vec__9145__9146 = p__9144;
    var speed__9147 = cljs.core.nth.call(null, vec__9145__9146, 0, null);
    var on_finish__9148 = cljs.core.nth.call(null, vec__9145__9146, 1, null);
    return $elem.slideUp(speed__9147, on_finish__9148)
  };
  var slide_up = function($elem, var_args) {
    var p__9144 = null;
    if(goog.isDef(var_args)) {
      p__9144 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__9144)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__9149) {
    var $elem = cljs.core.first(arglist__9149);
    var p__9144 = cljs.core.rest(arglist__9149);
    return slide_up__delegate.call(this, $elem, p__9144)
  };
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__9150) {
    var vec__9151__9152 = p__9150;
    var speed__9153 = cljs.core.nth.call(null, vec__9151__9152, 0, null);
    var on_finish__9154 = cljs.core.nth.call(null, vec__9151__9152, 1, null);
    return $elem.slideDown(speed__9153, on_finish__9154)
  };
  var slide_down = function($elem, var_args) {
    var p__9150 = null;
    if(goog.isDef(var_args)) {
      p__9150 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__9150)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__9155) {
    var $elem = cljs.core.first(arglist__9155);
    var p__9150 = cljs.core.rest(arglist__9155);
    return slide_down__delegate.call(this, $elem, p__9150)
  };
  return slide_down
}();
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__9156) {
    var vec__9157__9158 = p__9156;
    var v__9159 = cljs.core.nth.call(null, vec__9157__9158, 0, null);
    if(cljs.core.truth_(v__9159)) {
      return $elem.val(v__9159)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__9156 = null;
    if(goog.isDef(var_args)) {
      p__9156 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__9156)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__9160) {
    var $elem = cljs.core.first(arglist__9160);
    var p__9156 = cljs.core.rest(arglist__9160);
    return val__delegate.call(this, $elem, p__9156)
  };
  return val
}();
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.xhr = function xhr(p__9161, content, callback) {
  var vec__9162__9163 = p__9161;
  var method__9164 = cljs.core.nth.call(null, vec__9162__9163, 0, null);
  var uri__9165 = cljs.core.nth.call(null, vec__9162__9163, 1, null);
  var params__9166 = jayq.util.map__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__9164)), "\ufdd0'data":jayq.util.map__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__9165, params__9166)
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9070 = this$;
    if(cljs.core.truth_(and__3546__auto____9070)) {
      return this$.clojure$browser$event$EventType$event_types
    }else {
      return and__3546__auto____9070
    }
  }())) {
    return this$.clojure$browser$event$EventType$event_types(this$)
  }else {
    return function() {
      var or__3548__auto____9071 = clojure.browser.event.event_types[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____9071)) {
        return or__3548__auto____9071
      }else {
        var or__3548__auto____9072 = clojure.browser.event.event_types["_"];
        if(cljs.core.truth_(or__3548__auto____9072)) {
          return or__3548__auto____9072
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__9073) {
    var vec__9074__9075 = p__9073;
    var k__9076 = cljs.core.nth.call(null, vec__9074__9075, 0, null);
    var v__9077 = cljs.core.nth.call(null, vec__9074__9075, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__9076.toLowerCase()), v__9077])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__9078) {
    var vec__9079__9080 = p__9078;
    var k__9081 = cljs.core.nth.call(null, vec__9079__9080, 0, null);
    var v__9082 = cljs.core.nth.call(null, vec__9079__9080, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__9081.toLowerCase()), v__9082])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__9083 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__9084 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__9083.call(this, src, type, fn);
      case 4:
        return listen__9084.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__9086 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__9087 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__9086.call(this, src, type, fn);
      case 4:
        return listen_once__9087.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__9089 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__9090 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__9089.call(this, src, type, fn);
      case 4:
        return unlisten__9090.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey.call(null, key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent.call(null, src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose.call(null, e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount.call(null)
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("clojure.browser.net");
goog.require("cljs.core");
goog.require("clojure.browser.event");
goog.require("goog.net.XhrIo");
goog.require("goog.net.EventType");
goog.require("goog.net.xpc.CfgFields");
goog.require("goog.net.xpc.CrossPageChannel");
goog.require("goog.json");
clojure.browser.net._STAR_timeout_STAR_ = 1E4;
clojure.browser.net.event_types = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__8976) {
  var vec__8977__8978 = p__8976;
  var k__8979 = cljs.core.nth.call(null, vec__8977__8978, 0, null);
  var v__8980 = cljs.core.nth.call(null, vec__8977__8978, 1, null);
  return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__8979.toLowerCase()), v__8980])
}, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.net.EventType))));
clojure.browser.net.IConnection = {};
clojure.browser.net.connect = function() {
  var connect = null;
  var connect__9011 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8981 = this$;
      if(cljs.core.truth_(and__3546__auto____8981)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____8981
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$)
    }else {
      return function() {
        var or__3548__auto____8982 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8982)) {
          return or__3548__auto____8982
        }else {
          var or__3548__auto____8983 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____8983)) {
            return or__3548__auto____8983
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var connect__9012 = function(this$, opt1) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8984 = this$;
      if(cljs.core.truth_(and__3546__auto____8984)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____8984
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$, opt1)
    }else {
      return function() {
        var or__3548__auto____8985 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8985)) {
          return or__3548__auto____8985
        }else {
          var or__3548__auto____8986 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____8986)) {
            return or__3548__auto____8986
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1)
    }
  };
  var connect__9013 = function(this$, opt1, opt2) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8987 = this$;
      if(cljs.core.truth_(and__3546__auto____8987)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____8987
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$, opt1, opt2)
    }else {
      return function() {
        var or__3548__auto____8988 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8988)) {
          return or__3548__auto____8988
        }else {
          var or__3548__auto____8989 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____8989)) {
            return or__3548__auto____8989
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1, opt2)
    }
  };
  var connect__9014 = function(this$, opt1, opt2, opt3) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8990 = this$;
      if(cljs.core.truth_(and__3546__auto____8990)) {
        return this$.clojure$browser$net$IConnection$connect
      }else {
        return and__3546__auto____8990
      }
    }())) {
      return this$.clojure$browser$net$IConnection$connect(this$, opt1, opt2, opt3)
    }else {
      return function() {
        var or__3548__auto____8991 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8991)) {
          return or__3548__auto____8991
        }else {
          var or__3548__auto____8992 = clojure.browser.net.connect["_"];
          if(cljs.core.truth_(or__3548__auto____8992)) {
            return or__3548__auto____8992
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1, opt2, opt3)
    }
  };
  connect = function(this$, opt1, opt2, opt3) {
    switch(arguments.length) {
      case 1:
        return connect__9011.call(this, this$);
      case 2:
        return connect__9012.call(this, this$, opt1);
      case 3:
        return connect__9013.call(this, this$, opt1, opt2);
      case 4:
        return connect__9014.call(this, this$, opt1, opt2, opt3)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return connect
}();
clojure.browser.net.transmit = function() {
  var transmit = null;
  var transmit__9016 = function(this$, opt) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8993 = this$;
      if(cljs.core.truth_(and__3546__auto____8993)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____8993
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt)
    }else {
      return function() {
        var or__3548__auto____8994 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8994)) {
          return or__3548__auto____8994
        }else {
          var or__3548__auto____8995 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____8995)) {
            return or__3548__auto____8995
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt)
    }
  };
  var transmit__9017 = function(this$, opt, opt2) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8996 = this$;
      if(cljs.core.truth_(and__3546__auto____8996)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____8996
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2)
    }else {
      return function() {
        var or__3548__auto____8997 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8997)) {
          return or__3548__auto____8997
        }else {
          var or__3548__auto____8998 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____8998)) {
            return or__3548__auto____8998
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2)
    }
  };
  var transmit__9018 = function(this$, opt, opt2, opt3) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8999 = this$;
      if(cljs.core.truth_(and__3546__auto____8999)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____8999
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2, opt3)
    }else {
      return function() {
        var or__3548__auto____9000 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9000)) {
          return or__3548__auto____9000
        }else {
          var or__3548__auto____9001 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____9001)) {
            return or__3548__auto____9001
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3)
    }
  };
  var transmit__9019 = function(this$, opt, opt2, opt3, opt4) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9002 = this$;
      if(cljs.core.truth_(and__3546__auto____9002)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____9002
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2, opt3, opt4)
    }else {
      return function() {
        var or__3548__auto____9003 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9003)) {
          return or__3548__auto____9003
        }else {
          var or__3548__auto____9004 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____9004)) {
            return or__3548__auto____9004
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3, opt4)
    }
  };
  var transmit__9020 = function(this$, opt, opt2, opt3, opt4, opt5) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9005 = this$;
      if(cljs.core.truth_(and__3546__auto____9005)) {
        return this$.clojure$browser$net$IConnection$transmit
      }else {
        return and__3546__auto____9005
      }
    }())) {
      return this$.clojure$browser$net$IConnection$transmit(this$, opt, opt2, opt3, opt4, opt5)
    }else {
      return function() {
        var or__3548__auto____9006 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9006)) {
          return or__3548__auto____9006
        }else {
          var or__3548__auto____9007 = clojure.browser.net.transmit["_"];
          if(cljs.core.truth_(or__3548__auto____9007)) {
            return or__3548__auto____9007
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3, opt4, opt5)
    }
  };
  transmit = function(this$, opt, opt2, opt3, opt4, opt5) {
    switch(arguments.length) {
      case 2:
        return transmit__9016.call(this, this$, opt);
      case 3:
        return transmit__9017.call(this, this$, opt, opt2);
      case 4:
        return transmit__9018.call(this, this$, opt, opt2, opt3);
      case 5:
        return transmit__9019.call(this, this$, opt, opt2, opt3, opt4);
      case 6:
        return transmit__9020.call(this, this$, opt, opt2, opt3, opt4, opt5)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return transmit
}();
clojure.browser.net.close = function close(this$) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9008 = this$;
    if(cljs.core.truth_(and__3546__auto____9008)) {
      return this$.clojure$browser$net$IConnection$close
    }else {
      return and__3546__auto____9008
    }
  }())) {
    return this$.clojure$browser$net$IConnection$close(this$)
  }else {
    return function() {
      var or__3548__auto____9009 = clojure.browser.net.close[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____9009)) {
        return or__3548__auto____9009
      }else {
        var or__3548__auto____9010 = clojure.browser.net.close["_"];
        if(cljs.core.truth_(or__3548__auto____9010)) {
          return or__3548__auto____9010
        }else {
          throw cljs.core.missing_protocol.call(null, "IConnection.close", this$);
        }
      }
    }().call(null, this$)
  }
};
goog.net.XhrIo.prototype.clojure$browser$event$EventType$ = true;
goog.net.XhrIo.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__9022) {
    var vec__9023__9024 = p__9022;
    var k__9025 = cljs.core.nth.call(null, vec__9023__9024, 0, null);
    var v__9026 = cljs.core.nth.call(null, vec__9023__9024, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__9025.toLowerCase()), v__9026])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.net.EventType))))
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$ = true;
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit = function() {
  var G__9027 = null;
  var G__9027__9028 = function(this$, uri) {
    return clojure.browser.net.transmit.call(null, this$, uri, "GET", null, null, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__9027__9029 = function(this$, uri, method) {
    return clojure.browser.net.transmit.call(null, this$, uri, method, null, null, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__9027__9030 = function(this$, uri, method, content) {
    return clojure.browser.net.transmit.call(null, this$, uri, method, content, null, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__9027__9031 = function(this$, uri, method, content, headers) {
    return clojure.browser.net.transmit.call(null, this$, uri, method, content, headers, clojure.browser.net._STAR_timeout_STAR_)
  };
  var G__9027__9032 = function(this$, uri, method, content, headers, timeout) {
    this$.setTimeoutInterval(timeout);
    return this$.send(uri, method, content, headers)
  };
  G__9027 = function(this$, uri, method, content, headers, timeout) {
    switch(arguments.length) {
      case 2:
        return G__9027__9028.call(this, this$, uri);
      case 3:
        return G__9027__9029.call(this, this$, uri, method);
      case 4:
        return G__9027__9030.call(this, this$, uri, method, content);
      case 5:
        return G__9027__9031.call(this, this$, uri, method, content, headers);
      case 6:
        return G__9027__9032.call(this, this$, uri, method, content, headers, timeout)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9027
}();
clojure.browser.net.xpc_config_fields = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__9034) {
  var vec__9035__9036 = p__9034;
  var k__9037 = cljs.core.nth.call(null, vec__9035__9036, 0, null);
  var v__9038 = cljs.core.nth.call(null, vec__9035__9036, 1, null);
  return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__9037.toLowerCase()), v__9038])
}, cljs.core.js__GT_clj.call(null, goog.net.xpc.CfgFields)));
clojure.browser.net.xhr_connection = function xhr_connection() {
  return new goog.net.XhrIo
};
clojure.browser.net.ICrossPageChannel = {};
clojure.browser.net.register_service = function() {
  var register_service = null;
  var register_service__9045 = function(this$, service_name, fn) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9039 = this$;
      if(cljs.core.truth_(and__3546__auto____9039)) {
        return this$.clojure$browser$net$ICrossPageChannel$register_service
      }else {
        return and__3546__auto____9039
      }
    }())) {
      return this$.clojure$browser$net$ICrossPageChannel$register_service(this$, service_name, fn)
    }else {
      return function() {
        var or__3548__auto____9040 = clojure.browser.net.register_service[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9040)) {
          return or__3548__auto____9040
        }else {
          var or__3548__auto____9041 = clojure.browser.net.register_service["_"];
          if(cljs.core.truth_(or__3548__auto____9041)) {
            return or__3548__auto____9041
          }else {
            throw cljs.core.missing_protocol.call(null, "ICrossPageChannel.register-service", this$);
          }
        }
      }().call(null, this$, service_name, fn)
    }
  };
  var register_service__9046 = function(this$, service_name, fn, encode_json_QMARK_) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9042 = this$;
      if(cljs.core.truth_(and__3546__auto____9042)) {
        return this$.clojure$browser$net$ICrossPageChannel$register_service
      }else {
        return and__3546__auto____9042
      }
    }())) {
      return this$.clojure$browser$net$ICrossPageChannel$register_service(this$, service_name, fn, encode_json_QMARK_)
    }else {
      return function() {
        var or__3548__auto____9043 = clojure.browser.net.register_service[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9043)) {
          return or__3548__auto____9043
        }else {
          var or__3548__auto____9044 = clojure.browser.net.register_service["_"];
          if(cljs.core.truth_(or__3548__auto____9044)) {
            return or__3548__auto____9044
          }else {
            throw cljs.core.missing_protocol.call(null, "ICrossPageChannel.register-service", this$);
          }
        }
      }().call(null, this$, service_name, fn, encode_json_QMARK_)
    }
  };
  register_service = function(this$, service_name, fn, encode_json_QMARK_) {
    switch(arguments.length) {
      case 3:
        return register_service__9045.call(this, this$, service_name, fn);
      case 4:
        return register_service__9046.call(this, this$, service_name, fn, encode_json_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return register_service
}();
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$ = true;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$connect = function() {
  var G__9048 = null;
  var G__9048__9049 = function(this$) {
    return clojure.browser.net.connect.call(null, this$, null)
  };
  var G__9048__9050 = function(this$, on_connect_fn) {
    return this$.connect(on_connect_fn)
  };
  var G__9048__9051 = function(this$, on_connect_fn, config_iframe_fn) {
    return clojure.browser.net.connect.call(null, this$, on_connect_fn, config_iframe_fn, document.body)
  };
  var G__9048__9052 = function(this$, on_connect_fn, config_iframe_fn, iframe_parent) {
    this$.createPeerIframe(iframe_parent, config_iframe_fn);
    return this$.connect(on_connect_fn)
  };
  G__9048 = function(this$, on_connect_fn, config_iframe_fn, iframe_parent) {
    switch(arguments.length) {
      case 1:
        return G__9048__9049.call(this, this$);
      case 2:
        return G__9048__9050.call(this, this$, on_connect_fn);
      case 3:
        return G__9048__9051.call(this, this$, on_connect_fn, config_iframe_fn);
      case 4:
        return G__9048__9052.call(this, this$, on_connect_fn, config_iframe_fn, iframe_parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9048
}();
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$transmit = function(this$, service_name, payload) {
  return this$.send(cljs.core.name.call(null, service_name), payload)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$close = function(this$) {
  return this$.close(cljs.core.List.EMPTY)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$ = true;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$register_service = function() {
  var G__9054 = null;
  var G__9054__9055 = function(this$, service_name, fn) {
    return clojure.browser.net.register_service.call(null, this$, service_name, fn, false)
  };
  var G__9054__9056 = function(this$, service_name, fn, encode_json_QMARK_) {
    return this$.registerService(cljs.core.name.call(null, service_name), fn, encode_json_QMARK_)
  };
  G__9054 = function(this$, service_name, fn, encode_json_QMARK_) {
    switch(arguments.length) {
      case 3:
        return G__9054__9055.call(this, this$, service_name, fn);
      case 4:
        return G__9054__9056.call(this, this$, service_name, fn, encode_json_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9054
}();
clojure.browser.net.xpc_connection = function() {
  var xpc_connection = null;
  var xpc_connection__9067 = function() {
    var temp__3698__auto____9058 = (new goog.Uri(window.location.href)).getParameterValue("xpc");
    if(cljs.core.truth_(temp__3698__auto____9058)) {
      var config__9059 = temp__3698__auto____9058;
      return new goog.net.xpc.CrossPageChannel(goog.json.parse.call(null, config__9059))
    }else {
      return null
    }
  };
  var xpc_connection__9068 = function(config) {
    return new goog.net.xpc.CrossPageChannel(cljs.core.reduce.call(null, function(sum, p__9060) {
      var vec__9061__9062 = p__9060;
      var k__9063 = cljs.core.nth.call(null, vec__9061__9062, 0, null);
      var v__9064 = cljs.core.nth.call(null, vec__9061__9062, 1, null);
      var temp__3695__auto____9065 = cljs.core.get.call(null, clojure.browser.net.xpc_config_fields, k__9063);
      if(cljs.core.truth_(temp__3695__auto____9065)) {
        var field__9066 = temp__3695__auto____9065;
        return cljs.core.assoc.call(null, sum, field__9066, v__9064)
      }else {
        return sum
      }
    }, cljs.core.ObjMap.fromObject([], {}), config).strobj)
  };
  xpc_connection = function(config) {
    switch(arguments.length) {
      case 0:
        return xpc_connection__9067.call(this);
      case 1:
        return xpc_connection__9068.call(this, config)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return xpc_connection
}();
goog.provide("clojure.browser.repl");
goog.require("cljs.core");
goog.require("clojure.browser.net");
goog.require("clojure.browser.event");
clojure.browser.repl.xpc_connection = cljs.core.atom.call(null, null);
clojure.browser.repl.repl_print = function repl_print(data) {
  var temp__3695__auto____8963 = cljs.core.deref.call(null, clojure.browser.repl.xpc_connection);
  if(cljs.core.truth_(temp__3695__auto____8963)) {
    var conn__8964 = temp__3695__auto____8963;
    return clojure.browser.net.transmit.call(null, conn__8964, "\ufdd0'print", cljs.core.pr_str.call(null, data))
  }else {
    return null
  }
};
clojure.browser.repl.evaluate_javascript = function evaluate_javascript(conn, block) {
  var result__8967 = function() {
    try {
      return cljs.core.ObjMap.fromObject(["\ufdd0'status", "\ufdd0'value"], {"\ufdd0'status":"\ufdd0'success", "\ufdd0'value":cljs.core.str.call(null, eval(block))})
    }catch(e8965) {
      if(cljs.core.truth_(cljs.core.instance_QMARK_.call(null, Error, e8965))) {
        var e__8966 = e8965;
        return cljs.core.ObjMap.fromObject(["\ufdd0'status", "\ufdd0'value", "\ufdd0'stacktrace"], {"\ufdd0'status":"\ufdd0'exception", "\ufdd0'value":cljs.core.pr_str.call(null, e__8966), "\ufdd0'stacktrace":cljs.core.truth_(e__8966.hasOwnProperty("stack")) ? e__8966.stack : "No stacktrace available."})
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          throw e8965;
        }else {
          return null
        }
      }
    }
  }();
  return cljs.core.pr_str.call(null, result__8967)
};
clojure.browser.repl.send_result = function send_result(connection, url, data) {
  return clojure.browser.net.transmit.call(null, connection, url, "POST", data, null, 0)
};
clojure.browser.repl.send_print = function() {
  var send_print = null;
  var send_print__8969 = function(url, data) {
    return send_print.call(null, url, data, 0)
  };
  var send_print__8970 = function(url, data, n) {
    var conn__8968 = clojure.browser.net.xhr_connection.call(null);
    clojure.browser.event.listen.call(null, conn__8968, "\ufdd0'error", function(_) {
      if(cljs.core.truth_(n < 10)) {
        return send_print.call(null, url, data, n + 1)
      }else {
        return console.log(cljs.core.str.call(null, "Could not send ", data, " after ", n, " attempts."))
      }
    });
    return clojure.browser.net.transmit.call(null, conn__8968, url, "POST", data, null, 0)
  };
  send_print = function(url, data, n) {
    switch(arguments.length) {
      case 2:
        return send_print__8969.call(this, url, data);
      case 3:
        return send_print__8970.call(this, url, data, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return send_print
}();
clojure.browser.repl.order = cljs.core.atom.call(null, 0);
clojure.browser.repl.wrap_message = function wrap_message(t, data) {
  return cljs.core.pr_str.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'content", "\ufdd0'order"], {"\ufdd0'type":t, "\ufdd0'content":data, "\ufdd0'order":cljs.core.swap_BANG_.call(null, clojure.browser.repl.order, cljs.core.inc)}))
};
clojure.browser.repl.start_evaluator = function start_evaluator(url) {
  var temp__3695__auto____8972 = clojure.browser.net.xpc_connection.call(null);
  if(cljs.core.truth_(temp__3695__auto____8972)) {
    var repl_connection__8973 = temp__3695__auto____8972;
    var connection__8974 = clojure.browser.net.xhr_connection.call(null);
    clojure.browser.event.listen.call(null, connection__8974, "\ufdd0'success", function(e) {
      return clojure.browser.net.transmit.call(null, repl_connection__8973, "\ufdd0'evaluate-javascript", e.currentTarget.getResponseText(cljs.core.List.EMPTY))
    });
    clojure.browser.net.register_service.call(null, repl_connection__8973, "\ufdd0'send-result", function(data) {
      return clojure.browser.repl.send_result.call(null, connection__8974, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'result", data))
    });
    clojure.browser.net.register_service.call(null, repl_connection__8973, "\ufdd0'print", function(data) {
      return clojure.browser.repl.send_print.call(null, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'print", data))
    });
    clojure.browser.net.connect.call(null, repl_connection__8973, cljs.core.constantly.call(null, null));
    return setTimeout.call(null, function() {
      return clojure.browser.repl.send_result.call(null, connection__8974, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'ready", "ready"))
    }, 50)
  }else {
    return alert.call(null, "No 'xpc' param provided to child iframe.")
  }
};
clojure.browser.repl.connect = function connect(repl_server_url) {
  var repl_connection__8975 = clojure.browser.net.xpc_connection.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'peer_uri"], {"\ufdd0'peer_uri":repl_server_url}));
  cljs.core.swap_BANG_.call(null, clojure.browser.repl.xpc_connection, cljs.core.constantly.call(null, repl_connection__8975));
  clojure.browser.net.register_service.call(null, repl_connection__8975, "\ufdd0'evaluate-javascript", function(js) {
    return clojure.browser.net.transmit.call(null, repl_connection__8975, "\ufdd0'send-result", clojure.browser.repl.evaluate_javascript.call(null, repl_connection__8975, js))
  });
  return clojure.browser.net.connect.call(null, repl_connection__8975, cljs.core.constantly.call(null, null), function(iframe) {
    return iframe.style.display = "none"
  })
};
goog.provide("net.kolov.jacla.search");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("goog.net");
goog.require("goog.dom");
goog.require("clojure.browser.repl");
goog.require("goog.events");
goog.require("goog.ui.tree.TreeControl");
goog.require("goog.ui.Component");
goog.require("clojure.string");
net.kolov.jacla.search.jquery = $;
net.kolov.jacla.search.json_generate = function json_generate(data) {
  return cljs.core.str.call(null, JSON.stringify.call(null, net.kolov.jacla.search.clj__GT_js.call(null, data)), "\n")
};
net.kolov.jacla.search.json_parse = function json_parse(line) {
  return cljs.core.js__GT_clj.call(null, JSON.parse.call(null, line))
};
net.kolov.jacla.search.search_input = goog.dom.getElement.call(null, "searchInput");
net.kolov.jacla.search.search_status = goog.dom.getElement.call(null, "searchStatus");
net.kolov.jacla.search.classes_tree = goog.dom.getElement.call(null, "classes-tree");
net.kolov.jacla.search.libs_tree = goog.dom.getElement.call(null, "libs-tree");
net.kolov.jacla.search.libs_head = goog.dom.getElement.call(null, "libs-head");
net.kolov.jacla.search.classes_head = goog.dom.getElement.call(null, "classes-head");
net.kolov.jacla.search.query_update = function query_update(q, f) {
  var x__7156 = new goog.net.XhrIo;
  goog.events.listen.call(null, x__7156, goog.net.EventType.COMPLETE, function() {
    return f.call(null, x__7156)
  });
  return x__7156.send(q)
};
net.kolov.jacla.search.dom_ = new goog.dom.DomHelper;
net.kolov.jacla.search.append_div = function append_div(parent, clazz, content) {
  return goog.dom.appendChild.call(null, parent, goog.dom.createDom.call(null, "div", cljs.core.ObjMap.fromObject(["class"], {"class":clazz}), content))
};
net.kolov.jacla.search.set_div_text = function set_div_text(d, t) {
  net.kolov.jacla.search.dom_.removeChildren(d);
  return net.kolov.jacla.search.append_div.call(null, d, "title", t)
};
net.kolov.jacla.search.set_status = function set_status(t) {
  return net.kolov.jacla.search.set_div_text.call(null, net.kolov.jacla.search.search_status, t)
};
net.kolov.jacla.search.set_classes_head = function set_classes_head(t) {
  return net.kolov.jacla.search.set_div_text.call(null, net.kolov.jacla.search.classes_head, t)
};
net.kolov.jacla.search.set_libs_head = function set_libs_head(t) {
  return net.kolov.jacla.search.set_div_text.call(null, net.kolov.jacla.search.libs_head, t)
};
net.kolov.jacla.search.classname = function classname(c) {
  return cljs.core.str.call(null, c.call(null, "packageName"), ".", c.call(null, "className"))
};
net.kolov.jacla.search.libname = function libname(l) {
  return cljs.core.str.call(null, l.call(null, "packageId"), ":", l.call(null, "artifactId"))
};
net.kolov.jacla.search.libid = function libid(l) {
  return cljs.core.str.call(null, l.call(null, "repoType"), "/", l.call(null, "repoId"), "/", net.kolov.jacla.search.libname.call(null, l))
};
net.kolov.jacla.search.tree_config = goog.ui.tree.TreeControl.defaultConfig;
net.kolov.jacla.search.tree_config.cleardotPath = "/closure-library/closure/goog/images/tree/cleardot.gif";
net.kolov.jacla.search.make_lib_query_string = function make_lib_query_string(libnode) {
  return clojure.string.replace.call(null, clojure.string.replace.call(null, cljs.core.str.call(null, "/list/", libnode.getId()), ":", "/"), ".", "/")
};
net.kolov.jacla.search.make_class_query_string = function make_class_query_string(classnode) {
  return cljs.core.str.call(null, "/searchFamilies?class=", classnode.getHtml())
};
net.kolov.jacla.search.make_fam_query_string = function make_fam_query_string(node) {
  return cljs.core.str.call(null, "/searchLibs?", node.getId(), "&class=", node.getParent().getHtml())
};
net.kolov.jacla.search.make_lib_html = function make_lib_html(v) {
  if(cljs.core.truth_(v.call(null, "source"))) {
    return cljs.core.str.call(null, '<a href="#">', v.call(null, "source"), "</a>")
  }else {
    return cljs.core.str.call(null, '<span class="small">no source</span>')
  }
};
net.kolov.jacla.search.make_family_name = function make_family_name(f) {
  if(cljs.core.truth_(f.call(null, "artifactId") === null)) {
    return"JDK"
  }else {
    return cljs.core.str.call(null, f.call(null, "packageId"), ":", f.call(null, "artifactId"))
  }
};
net.kolov.jacla.search.make_family_html = function make_family_html(f) {
  return"_"
};
net.kolov.jacla.search.make_family_id = function make_family_id(f) {
  return cljs.core.str.call(null, "repoType=", f.call(null, "repoType"), "&repoId=", f.call(null, "repoId"), cljs.core.truth_(f.call(null, "artifactId") === null) ? "" : cljs.core.str.call(null, "&packageId=", f.call(null, "packageId"), "&artifactId=", f.call(null, "artifactId")))
};
net.kolov.jacla.search.create_tree_node = function create_tree_node(id, txt, parent) {
  var node__7157 = parent.getTree().createNode(txt);
  node__7157.setHtml(txt);
  node__7157.setId(id);
  parent.add(node__7157);
  node__7157.setExpanded(false);
  node__7157.add(node__7157.getTree().createNode("Loading..."));
  return node__7157
};
net.kolov.jacla.search.libnode_click_handler = function libnode_click_handler(node) {
  return net.kolov.jacla.search.query_update.call(null, net.kolov.jacla.search.make_lib_query_string.call(null, node), function(x) {
    var resp__7158 = x.getResponse();
    var v__7159 = net.kolov.jacla.search.json_parse.call(null, resp__7158);
    var versions__7160 = v__7159.call(null, "versions");
    node.removeChildren();
    var G__7161__7162 = cljs.core.seq.call(null, versions__7160);
    if(cljs.core.truth_(G__7161__7162)) {
      var version__7163 = cljs.core.first.call(null, G__7161__7162);
      var G__7161__7164 = G__7161__7162;
      while(true) {
        var v_string__7165 = version__7163.call(null, "version");
        var newNode__7166 = node.getTree().createNode(v_string__7165);
        newNode__7166.setAfterLabelHtml(net.kolov.jacla.search.make_lib_html.call(null, version__7163));
        node.add(newNode__7166);
        var temp__3698__auto____7167 = cljs.core.next.call(null, G__7161__7164);
        if(cljs.core.truth_(temp__3698__auto____7167)) {
          var G__7161__7168 = temp__3698__auto____7167;
          var G__7169 = cljs.core.first.call(null, G__7161__7168);
          var G__7170 = G__7161__7168;
          version__7163 = G__7169;
          G__7161__7164 = G__7170;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  })
};
net.kolov.jacla.search.class_node_click_handler = function class_node_click_handler(node) {
  return net.kolov.jacla.search.query_update.call(null, net.kolov.jacla.search.make_class_query_string.call(null, node), function(x) {
    var resp__7171 = x.getResponse();
    var families__7172 = net.kolov.jacla.search.json_parse.call(null, resp__7171);
    node.removeChildren();
    var G__7173__7174 = cljs.core.seq.call(null, families__7172);
    if(cljs.core.truth_(G__7173__7174)) {
      var family__7175 = cljs.core.first.call(null, G__7173__7174);
      var G__7173__7176 = G__7173__7174;
      while(true) {
        var fname__7177 = net.kolov.jacla.search.make_family_name.call(null, family__7175);
        var newNode__7178 = net.kolov.jacla.search.create_tree_node.call(null, net.kolov.jacla.search.make_family_id.call(null, family__7175), net.kolov.jacla.search.make_family_name.call(null, family__7175), node);
        goog.events.listenOnce.call(null, newNode__7178.getElement(), goog.events.EventType.CLICK, function(family__7175, G__7173__7176, fname__7177, newNode__7178) {
          return function() {
            return net.kolov.jacla.search.famnode_click_handler.call(null, newNode__7178)
          }
        }(family__7175, G__7173__7176, fname__7177, newNode__7178));
        var temp__3698__auto____7179 = cljs.core.next.call(null, G__7173__7176);
        if(cljs.core.truth_(temp__3698__auto____7179)) {
          var G__7173__7180 = temp__3698__auto____7179;
          var G__7181 = cljs.core.first.call(null, G__7173__7180);
          var G__7182 = G__7173__7180;
          family__7175 = G__7181;
          G__7173__7176 = G__7182;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  })
};
net.kolov.jacla.search.famnode_click_handler = function famnode_click_handler(node) {
  return net.kolov.jacla.search.query_update.call(null, net.kolov.jacla.search.make_fam_query_string.call(null, node), function(x) {
    var resp__7183 = x.getResponse();
    var libraries__7184 = net.kolov.jacla.search.json_parse.call(null, resp__7183);
    node.removeChildren();
    var G__7185__7186 = cljs.core.seq.call(null, libraries__7184);
    if(cljs.core.truth_(G__7185__7186)) {
      var library__7187 = cljs.core.first.call(null, G__7185__7186);
      var G__7185__7188 = G__7185__7186;
      while(true) {
        var newNode__7189 = node.getTree().createNode(library__7187.call(null, "version"));
        newNode__7189.setAfterLabelHtml("hehe");
        node.add(newNode__7189);
        var temp__3698__auto____7190 = cljs.core.next.call(null, G__7185__7188);
        if(cljs.core.truth_(temp__3698__auto____7190)) {
          var G__7185__7191 = temp__3698__auto____7190;
          var G__7192 = cljs.core.first.call(null, G__7185__7191);
          var G__7193 = G__7185__7191;
          library__7187 = G__7192;
          G__7185__7188 = G__7193;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  })
};
net.kolov.jacla.search.make_lib_tree = function make_lib_tree(libs) {
  var treeControl__7194 = new goog.ui.tree.TreeControl("root", net.kolov.jacla.search.tree_config);
  net.kolov.jacla.search.dom_.removeChildren(net.kolov.jacla.search.libs_tree);
  var G__7195__7196 = cljs.core.seq.call(null, libs);
  if(cljs.core.truth_(G__7195__7196)) {
    var lib__7197 = cljs.core.first.call(null, G__7195__7196);
    var G__7195__7198 = G__7195__7196;
    while(true) {
      net.kolov.jacla.search.create_tree_node.call(null, net.kolov.jacla.search.libid.call(null, lib__7197), net.kolov.jacla.search.libname.call(null, lib__7197), treeControl__7194);
      var temp__3698__auto____7199 = cljs.core.next.call(null, G__7195__7198);
      if(cljs.core.truth_(temp__3698__auto____7199)) {
        var G__7195__7200 = temp__3698__auto____7199;
        var G__7207 = cljs.core.first.call(null, G__7195__7200);
        var G__7208 = G__7195__7200;
        lib__7197 = G__7207;
        G__7195__7198 = G__7208;
        continue
      }else {
      }
      break
    }
  }else {
  }
  treeControl__7194.render(net.kolov.jacla.search.libs_tree);
  treeControl__7194.setShowRootNode(false);
  var G__7201__7202 = cljs.core.seq.call(null, treeControl__7194.getChildren());
  if(cljs.core.truth_(G__7201__7202)) {
    var node__7203 = cljs.core.first.call(null, G__7201__7202);
    var G__7201__7204 = G__7201__7202;
    while(true) {
      goog.events.listenOnce.call(null, node__7203.getElement(), goog.events.EventType.CLICK, function(node__7203, G__7201__7204) {
        return function() {
          return net.kolov.jacla.search.libnode_click_handler.call(null, node__7203)
        }
      }(node__7203, G__7201__7204));
      var temp__3698__auto____7205 = cljs.core.next.call(null, G__7201__7204);
      if(cljs.core.truth_(temp__3698__auto____7205)) {
        var G__7201__7206 = temp__3698__auto____7205;
        var G__7209 = cljs.core.first.call(null, G__7201__7206);
        var G__7210 = G__7201__7206;
        node__7203 = G__7209;
        G__7201__7204 = G__7210;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
net.kolov.jacla.search.make_classes_tree = function make_classes_tree(classes) {
  var treeControl__7211 = new goog.ui.tree.TreeControl("root", net.kolov.jacla.search.tree_config);
  net.kolov.jacla.search.dom_.removeChildren(net.kolov.jacla.search.classes_tree);
  var G__7212__7213 = cljs.core.seq.call(null, classes);
  if(cljs.core.truth_(G__7212__7213)) {
    var class$__7214 = cljs.core.first.call(null, G__7212__7213);
    var G__7212__7215 = G__7212__7213;
    while(true) {
      net.kolov.jacla.search.create_tree_node.call(null, cljs.core.str.call(null, "cls/", net.kolov.jacla.search.classname.call(null, class$__7214)), net.kolov.jacla.search.classname.call(null, class$__7214), treeControl__7211);
      var temp__3698__auto____7216 = cljs.core.next.call(null, G__7212__7215);
      if(cljs.core.truth_(temp__3698__auto____7216)) {
        var G__7212__7217 = temp__3698__auto____7216;
        var G__7224 = cljs.core.first.call(null, G__7212__7217);
        var G__7225 = G__7212__7217;
        class$__7214 = G__7224;
        G__7212__7215 = G__7225;
        continue
      }else {
      }
      break
    }
  }else {
  }
  treeControl__7211.render(net.kolov.jacla.search.classes_tree);
  treeControl__7211.setShowRootNode(false);
  var G__7218__7219 = cljs.core.seq.call(null, treeControl__7211.getChildren());
  if(cljs.core.truth_(G__7218__7219)) {
    var node__7220 = cljs.core.first.call(null, G__7218__7219);
    var G__7218__7221 = G__7218__7219;
    while(true) {
      goog.events.listenOnce.call(null, node__7220.getElement(), goog.events.EventType.CLICK, function(node__7220, G__7218__7221) {
        return function() {
          return net.kolov.jacla.search.class_node_click_handler.call(null, node__7220)
        }
      }(node__7220, G__7218__7221));
      var temp__3698__auto____7222 = cljs.core.next.call(null, G__7218__7221);
      if(cljs.core.truth_(temp__3698__auto____7222)) {
        var G__7218__7223 = temp__3698__auto____7222;
        var G__7226 = cljs.core.first.call(null, G__7218__7223);
        var G__7227 = G__7218__7223;
        node__7220 = G__7226;
        G__7218__7221 = G__7227;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
net.kolov.jacla.search.update_result = function update_result(x) {
  var resp__7228 = x.getResponse();
  var v__7229 = net.kolov.jacla.search.json_parse.call(null, resp__7228);
  var totalClasses__7230 = v__7229.call(null, "totalClasses");
  var classes__7231 = v__7229.call(null, "classes");
  var totalLibs__7232 = v__7229.call(null, "totalLibs");
  var libs__7233 = v__7229.call(null, "libs");
  net.kolov.jacla.search.set_classes_head.call(null, cljs.core.str.call(null, "Found ", totalClasses__7230, " classes", cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, cljs.core.count.call(null, classes__7231), totalClasses__7230))) ? cljs.core.str.call(null, " showing first ", cljs.core.count.call(null, classes__7231)) : null));
  net.kolov.jacla.search.make_classes_tree.call(null, classes__7231);
  net.kolov.jacla.search.set_libs_head.call(null, cljs.core.str.call(null, "Found ", totalLibs__7232, " libs", cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, cljs.core.count.call(null, libs__7233), totalLibs__7232))) ? cljs.core.str.call(null, " showing first ", cljs.core.count.call(null, libs__7233)) : null));
  return net.kolov.jacla.search.make_lib_tree.call(null, libs__7233)
};
net.kolov.jacla.search.query = function query(t) {
  net.kolov.jacla.search.set_status.call(null, "Searching...");
  net.kolov.jacla.search.query_update.call(null, cljs.core.str.call(null, "/search?token=", t), net.kolov.jacla.search.update_result);
  return net.kolov.jacla.search.set_status.call(null, "")
};
goog.events.listen.call(null, net.kolov.jacla.search.search_input, goog.events.EventType.KEYUP, function() {
  var txt__7234 = net.kolov.jacla.search.search_input.value;
  if(cljs.core.truth_(cljs.core.count.call(null, txt__7234) > 1)) {
    return net.kolov.jacla.search.query.call(null, txt__7234)
  }else {
    return net.kolov.jacla.search.set_status.call(null, "Type at least 2 characters")
  }
});
net.kolov.jacla.search.initSearchPage = function initSearchPage() {
  return alert.call(null, cljs.core.str.call(null, net.kolov.jacla.search.search_input))
};
goog.exportSymbol("net.kolov.jacla.search.initSearchPage", net.kolov.jacla.search.initSearchPage);
