import { c as createMastraProxy } from './core.mjs';
import { M as MastraBase, c as context, t as trace } from './trace-api.mjs';
import EventEmitter from 'node:events';
import './tools.mjs';
import 'crypto';
import './_virtual__virtual-zod.mjs';
import './logger.mjs';
import 'stream';
import 'pino';
import 'pino-pretty';

const get = (value, path, defaultValue) => {
  const segments = path.split(/[\.\[\]]/g);
  let current = value;
  for (const key of segments) {
    if (current === null)
      return defaultValue;
    if (current === void 0)
      return defaultValue;
    const dequoted = key.replace(/['"]/g, "");
    if (dequoted.trim() === "")
      continue;
    current = current[dequoted];
  }
  if (current === void 0)
    return defaultValue;
  return current;
};

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var typeChecker = function (type) {
    var typeString = "[object " + type + "]";
    return function (value) {
        return getClassName(value) === typeString;
    };
};
var getClassName = function (value) { return Object.prototype.toString.call(value); };
var comparable = function (value) {
    if (value instanceof Date) {
        return value.getTime();
    }
    else if (isArray$1(value)) {
        return value.map(comparable);
    }
    else if (value && typeof value.toJSON === "function") {
        return value.toJSON();
    }
    return value;
};
var coercePotentiallyNull = function (value) {
    return value == null ? null : value;
};
var isArray$1 = typeChecker("Array");
var isObject = typeChecker("Object");
var isFunction = typeChecker("Function");
var isProperty = function (item, key) {
    return item.hasOwnProperty(key) && !isFunction(item[key]);
};
var isVanillaObject = function (value) {
    return (value &&
        (value.constructor === Object ||
            value.constructor === Array ||
            value.constructor.toString() === "function Object() { [native code] }" ||
            value.constructor.toString() === "function Array() { [native code] }") &&
        !value.toJSON);
};
var equals = function (a, b) {
    if (a == null && a == b) {
        return true;
    }
    if (a === b) {
        return true;
    }
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
        return false;
    }
    if (isArray$1(a)) {
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0, length_1 = a.length; i < length_1; i++) {
            if (!equals(a[i], b[i]))
                return false;
        }
        return true;
    }
    else if (isObject(a)) {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
        for (var key in a) {
            if (!equals(a[key], b[key]))
                return false;
        }
        return true;
    }
    return false;
};

/**
 * Walks through each value given the context - used for nested operations. E.g:
 * { "person.address": { $eq: "blarg" }}
 */
var walkKeyPathValues = function (item, keyPath, next, depth, key, owner) {
    var currentKey = keyPath[depth];
    // if array, then try matching. Might fall through for cases like:
    // { $eq: [1, 2, 3] }, [ 1, 2, 3 ].
    if (isArray$1(item) &&
        isNaN(Number(currentKey)) &&
        !isProperty(item, currentKey)) {
        for (var i = 0, length_1 = item.length; i < length_1; i++) {
            // if FALSE is returned, then terminate walker. For operations, this simply
            // means that the search critera was met.
            if (!walkKeyPathValues(item[i], keyPath, next, depth, i, item)) {
                return false;
            }
        }
    }
    if (depth === keyPath.length || item == null) {
        return next(item, key, owner, depth === 0, depth === keyPath.length);
    }
    return walkKeyPathValues(item[currentKey], keyPath, next, depth + 1, currentKey, item);
};
var BaseOperation = /** @class */ (function () {
    function BaseOperation(params, owneryQuery, options, name) {
        this.params = params;
        this.owneryQuery = owneryQuery;
        this.options = options;
        this.name = name;
        this.init();
    }
    BaseOperation.prototype.init = function () { };
    BaseOperation.prototype.reset = function () {
        this.done = false;
        this.keep = false;
    };
    return BaseOperation;
}());
var GroupOperation = /** @class */ (function (_super) {
    __extends(GroupOperation, _super);
    function GroupOperation(params, owneryQuery, options, children) {
        var _this = _super.call(this, params, owneryQuery, options) || this;
        _this.children = children;
        return _this;
    }
    /**
     */
    GroupOperation.prototype.reset = function () {
        this.keep = false;
        this.done = false;
        for (var i = 0, length_2 = this.children.length; i < length_2; i++) {
            this.children[i].reset();
        }
    };
    /**
     */
    GroupOperation.prototype.childrenNext = function (item, key, owner, root, leaf) {
        var done = true;
        var keep = true;
        for (var i = 0, length_3 = this.children.length; i < length_3; i++) {
            var childOperation = this.children[i];
            if (!childOperation.done) {
                childOperation.next(item, key, owner, root, leaf);
            }
            if (!childOperation.keep) {
                keep = false;
            }
            if (childOperation.done) {
                if (!childOperation.keep) {
                    break;
                }
            }
            else {
                done = false;
            }
        }
        this.done = done;
        this.keep = keep;
    };
    return GroupOperation;
}(BaseOperation));
var NamedGroupOperation = /** @class */ (function (_super) {
    __extends(NamedGroupOperation, _super);
    function NamedGroupOperation(params, owneryQuery, options, children, name) {
        var _this = _super.call(this, params, owneryQuery, options, children) || this;
        _this.name = name;
        return _this;
    }
    return NamedGroupOperation;
}(GroupOperation));
var QueryOperation = /** @class */ (function (_super) {
    __extends(QueryOperation, _super);
    function QueryOperation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    /**
     */
    QueryOperation.prototype.next = function (item, key, parent, root) {
        this.childrenNext(item, key, parent, root);
    };
    return QueryOperation;
}(GroupOperation));
var NestedOperation = /** @class */ (function (_super) {
    __extends(NestedOperation, _super);
    function NestedOperation(keyPath, params, owneryQuery, options, children) {
        var _this = _super.call(this, params, owneryQuery, options, children) || this;
        _this.keyPath = keyPath;
        _this.propop = true;
        /**
         */
        _this._nextNestedValue = function (value, key, owner, root, leaf) {
            _this.childrenNext(value, key, owner, root, leaf);
            return !_this.done;
        };
        return _this;
    }
    /**
     */
    NestedOperation.prototype.next = function (item, key, parent) {
        walkKeyPathValues(item, this.keyPath, this._nextNestedValue, 0, key, parent);
    };
    return NestedOperation;
}(GroupOperation));
var createTester = function (a, compare) {
    if (a instanceof Function) {
        return a;
    }
    if (a instanceof RegExp) {
        return function (b) {
            var result = typeof b === "string" && a.test(b);
            a.lastIndex = 0;
            return result;
        };
    }
    var comparableA = comparable(a);
    return function (b) { return compare(comparableA, comparable(b)); };
};
var EqualsOperation = /** @class */ (function (_super) {
    __extends(EqualsOperation, _super);
    function EqualsOperation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    EqualsOperation.prototype.init = function () {
        this._test = createTester(this.params, this.options.compare);
    };
    EqualsOperation.prototype.next = function (item, key, parent) {
        if (!Array.isArray(parent) || parent.hasOwnProperty(key)) {
            if (this._test(item, key, parent)) {
                this.done = true;
                this.keep = true;
            }
        }
    };
    return EqualsOperation;
}(BaseOperation));
var numericalOperationCreator = function (createNumericalOperation) {
    return function (params, owneryQuery, options, name) {
        return createNumericalOperation(params, owneryQuery, options, name);
    };
};
var numericalOperation = function (createTester) {
    return numericalOperationCreator(function (params, owneryQuery, options, name) {
        var typeofParams = typeof comparable(params);
        var test = createTester(params);
        return new EqualsOperation(function (b) {
            var actualValue = coercePotentiallyNull(b);
            return (typeof comparable(actualValue) === typeofParams && test(actualValue));
        }, owneryQuery, options, name);
    });
};
var createNamedOperation = function (name, params, parentQuery, options) {
    var operationCreator = options.operations[name];
    if (!operationCreator) {
        throwUnsupportedOperation(name);
    }
    return operationCreator(params, parentQuery, options, name);
};
var throwUnsupportedOperation = function (name) {
    throw new Error("Unsupported operation: ".concat(name));
};
var containsOperation = function (query, options) {
    for (var key in query) {
        if (options.operations.hasOwnProperty(key) || key.charAt(0) === "$")
            return true;
    }
    return false;
};
var createNestedOperation = function (keyPath, nestedQuery, parentKey, owneryQuery, options) {
    if (containsOperation(nestedQuery, options)) {
        var _a = createQueryOperations(nestedQuery, parentKey, options), selfOperations = _a[0], nestedOperations = _a[1];
        if (nestedOperations.length) {
            throw new Error("Property queries must contain only operations, or exact objects.");
        }
        return new NestedOperation(keyPath, nestedQuery, owneryQuery, options, selfOperations);
    }
    return new NestedOperation(keyPath, nestedQuery, owneryQuery, options, [
        new EqualsOperation(nestedQuery, owneryQuery, options),
    ]);
};
var createQueryOperation = function (query, owneryQuery, _a) {
    if (owneryQuery === void 0) { owneryQuery = null; }
    var _b = _a === void 0 ? {} : _a, compare = _b.compare, operations = _b.operations;
    var options = {
        compare: compare || equals,
        operations: Object.assign({}, operations || {}),
    };
    var _c = createQueryOperations(query, null, options), selfOperations = _c[0], nestedOperations = _c[1];
    var ops = [];
    if (selfOperations.length) {
        ops.push(new NestedOperation([], query, owneryQuery, options, selfOperations));
    }
    ops.push.apply(ops, nestedOperations);
    if (ops.length === 1) {
        return ops[0];
    }
    return new QueryOperation(query, owneryQuery, options, ops);
};
var createQueryOperations = function (query, parentKey, options) {
    var selfOperations = [];
    var nestedOperations = [];
    if (!isVanillaObject(query)) {
        selfOperations.push(new EqualsOperation(query, query, options));
        return [selfOperations, nestedOperations];
    }
    for (var key in query) {
        if (options.operations.hasOwnProperty(key)) {
            var op = createNamedOperation(key, query[key], query, options);
            if (op) {
                if (!op.propop && parentKey && !options.operations[parentKey]) {
                    throw new Error("Malformed query. ".concat(key, " cannot be matched against property."));
                }
            }
            // probably just a flag for another operation (like $options)
            if (op != null) {
                selfOperations.push(op);
            }
        }
        else if (key.charAt(0) === "$") {
            throwUnsupportedOperation(key);
        }
        else {
            nestedOperations.push(createNestedOperation(key.split("."), query[key], key, query, options));
        }
    }
    return [selfOperations, nestedOperations];
};
var createOperationTester = function (operation) {
    return function (item, key, owner) {
        operation.reset();
        operation.next(item, key, owner);
        return operation.keep;
    };
};

var $Ne = /** @class */ (function (_super) {
    __extends($Ne, _super);
    function $Ne() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    $Ne.prototype.init = function () {
        this._test = createTester(this.params, this.options.compare);
    };
    $Ne.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this.keep = true;
    };
    $Ne.prototype.next = function (item) {
        if (this._test(item)) {
            this.done = true;
            this.keep = false;
        }
    };
    return $Ne;
}(BaseOperation));
// https://docs.mongodb.com/manual/reference/operator/query/elemMatch/
var $ElemMatch = /** @class */ (function (_super) {
    __extends($ElemMatch, _super);
    function $ElemMatch() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    $ElemMatch.prototype.init = function () {
        if (!this.params || typeof this.params !== "object") {
            throw new Error("Malformed query. $elemMatch must by an object.");
        }
        this._queryOperation = createQueryOperation(this.params, this.owneryQuery, this.options);
    };
    $ElemMatch.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this._queryOperation.reset();
    };
    $ElemMatch.prototype.next = function (item) {
        if (isArray$1(item)) {
            for (var i = 0, length_1 = item.length; i < length_1; i++) {
                // reset query operation since item being tested needs to pass _all_ query
                // operations for it to be a success
                this._queryOperation.reset();
                var child = item[i];
                this._queryOperation.next(child, i, item, false);
                this.keep = this.keep || this._queryOperation.keep;
            }
            this.done = true;
        }
        else {
            this.done = false;
            this.keep = false;
        }
    };
    return $ElemMatch;
}(BaseOperation));
var $Not = /** @class */ (function (_super) {
    __extends($Not, _super);
    function $Not() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    $Not.prototype.init = function () {
        this._queryOperation = createQueryOperation(this.params, this.owneryQuery, this.options);
    };
    $Not.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this._queryOperation.reset();
    };
    $Not.prototype.next = function (item, key, owner, root) {
        this._queryOperation.next(item, key, owner, root);
        this.done = this._queryOperation.done;
        this.keep = !this._queryOperation.keep;
    };
    return $Not;
}(BaseOperation));
var $Size = /** @class */ (function (_super) {
    __extends($Size, _super);
    function $Size() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    $Size.prototype.init = function () { };
    $Size.prototype.next = function (item) {
        if (isArray$1(item) && item.length === this.params) {
            this.done = true;
            this.keep = true;
        }
        // if (parent && parent.length === this.params) {
        //   this.done = true;
        //   this.keep = true;
        // }
    };
    return $Size;
}(BaseOperation));
var assertGroupNotEmpty = function (values) {
    if (values.length === 0) {
        throw new Error("$and/$or/$nor must be a nonempty array");
    }
};
var $Or = /** @class */ (function (_super) {
    __extends($Or, _super);
    function $Or() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = false;
        return _this;
    }
    $Or.prototype.init = function () {
        var _this = this;
        assertGroupNotEmpty(this.params);
        this._ops = this.params.map(function (op) {
            return createQueryOperation(op, null, _this.options);
        });
    };
    $Or.prototype.reset = function () {
        this.done = false;
        this.keep = false;
        for (var i = 0, length_2 = this._ops.length; i < length_2; i++) {
            this._ops[i].reset();
        }
    };
    $Or.prototype.next = function (item, key, owner) {
        var done = false;
        var success = false;
        for (var i = 0, length_3 = this._ops.length; i < length_3; i++) {
            var op = this._ops[i];
            op.next(item, key, owner);
            if (op.keep) {
                done = true;
                success = op.keep;
                break;
            }
        }
        this.keep = success;
        this.done = done;
    };
    return $Or;
}(BaseOperation));
var $Nor = /** @class */ (function (_super) {
    __extends($Nor, _super);
    function $Nor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = false;
        return _this;
    }
    $Nor.prototype.next = function (item, key, owner) {
        _super.prototype.next.call(this, item, key, owner);
        this.keep = !this.keep;
    };
    return $Nor;
}($Or));
var $In = /** @class */ (function (_super) {
    __extends($In, _super);
    function $In() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    $In.prototype.init = function () {
        var _this = this;
        var params = Array.isArray(this.params) ? this.params : [this.params];
        this._testers = params.map(function (value) {
            if (containsOperation(value, _this.options)) {
                throw new Error("cannot nest $ under ".concat(_this.name.toLowerCase()));
            }
            return createTester(value, _this.options.compare);
        });
    };
    $In.prototype.next = function (item, key, owner) {
        var done = false;
        var success = false;
        for (var i = 0, length_4 = this._testers.length; i < length_4; i++) {
            var test = this._testers[i];
            if (test(item)) {
                done = true;
                success = true;
                break;
            }
        }
        this.keep = success;
        this.done = done;
    };
    return $In;
}(BaseOperation));
var $Nin = /** @class */ (function (_super) {
    __extends($Nin, _super);
    function $Nin(params, ownerQuery, options, name) {
        var _this = _super.call(this, params, ownerQuery, options, name) || this;
        _this.propop = true;
        _this._in = new $In(params, ownerQuery, options, name);
        return _this;
    }
    $Nin.prototype.next = function (item, key, owner, root) {
        this._in.next(item, key, owner);
        if (isArray$1(owner) && !root) {
            if (this._in.keep) {
                this.keep = false;
                this.done = true;
            }
            else if (key == owner.length - 1) {
                this.keep = true;
                this.done = true;
            }
        }
        else {
            this.keep = !this._in.keep;
            this.done = true;
        }
    };
    $Nin.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this._in.reset();
    };
    return $Nin;
}(BaseOperation));
var $Exists = /** @class */ (function (_super) {
    __extends($Exists, _super);
    function $Exists() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.propop = true;
        return _this;
    }
    $Exists.prototype.next = function (item, key, owner, root, leaf) {
        if (!leaf) {
            this.done = true;
            this.keep = !this.params;
        }
        else if (owner.hasOwnProperty(key) === this.params) {
            this.done = true;
            this.keep = true;
        }
    };
    return $Exists;
}(BaseOperation));
var $And = /** @class */ (function (_super) {
    __extends($And, _super);
    function $And(params, owneryQuery, options, name) {
        var _this = _super.call(this, params, owneryQuery, options, params.map(function (query) { return createQueryOperation(query, owneryQuery, options); }), name) || this;
        _this.propop = false;
        assertGroupNotEmpty(params);
        return _this;
    }
    $And.prototype.next = function (item, key, owner, root) {
        this.childrenNext(item, key, owner, root);
    };
    return $And;
}(NamedGroupOperation));
var $All = /** @class */ (function (_super) {
    __extends($All, _super);
    function $All(params, owneryQuery, options, name) {
        var _this = _super.call(this, params, owneryQuery, options, params.map(function (query) { return createQueryOperation(query, owneryQuery, options); }), name) || this;
        _this.propop = true;
        return _this;
    }
    $All.prototype.next = function (item, key, owner, root) {
        this.childrenNext(item, key, owner, root);
    };
    return $All;
}(NamedGroupOperation));
var $eq = function (params, owneryQuery, options) {
    return new EqualsOperation(params, owneryQuery, options);
};
var $ne = function (params, owneryQuery, options, name) { return new $Ne(params, owneryQuery, options, name); };
var $or = function (params, owneryQuery, options, name) { return new $Or(params, owneryQuery, options, name); };
var $nor = function (params, owneryQuery, options, name) { return new $Nor(params, owneryQuery, options, name); };
var $elemMatch = function (params, owneryQuery, options, name) { return new $ElemMatch(params, owneryQuery, options, name); };
var $nin = function (params, owneryQuery, options, name) { return new $Nin(params, owneryQuery, options, name); };
var $in = function (params, owneryQuery, options, name) {
    return new $In(params, owneryQuery, options, name);
};
var $lt = numericalOperation(function (params) { return function (b) {
    return b != null && b < params;
}; });
var $lte = numericalOperation(function (params) { return function (b) {
    return b === params || b <= params;
}; });
var $gt = numericalOperation(function (params) { return function (b) {
    return b != null && b > params;
}; });
var $gte = numericalOperation(function (params) { return function (b) {
    return b === params || b >= params;
}; });
var $mod = function (_a, owneryQuery, options) {
    var mod = _a[0], equalsValue = _a[1];
    return new EqualsOperation(function (b) { return comparable(b) % mod === equalsValue; }, owneryQuery, options);
};
var $exists = function (params, owneryQuery, options, name) { return new $Exists(params, owneryQuery, options, name); };
var $regex = function (pattern, owneryQuery, options) {
    return new EqualsOperation(new RegExp(pattern, owneryQuery.$options), owneryQuery, options);
};
var $not = function (params, owneryQuery, options, name) { return new $Not(params, owneryQuery, options, name); };
var typeAliases = {
    number: function (v) { return typeof v === "number"; },
    string: function (v) { return typeof v === "string"; },
    bool: function (v) { return typeof v === "boolean"; },
    array: function (v) { return Array.isArray(v); },
    null: function (v) { return v === null; },
    timestamp: function (v) { return v instanceof Date; },
};
var $type = function (clazz, owneryQuery, options) {
    return new EqualsOperation(function (b) {
        if (typeof clazz === "string") {
            if (!typeAliases[clazz]) {
                throw new Error("Type alias does not exist");
            }
            return typeAliases[clazz](b);
        }
        return b != null ? b instanceof clazz || b.constructor === clazz : false;
    }, owneryQuery, options);
};
var $and = function (params, ownerQuery, options, name) { return new $And(params, ownerQuery, options, name); };
var $all = function (params, ownerQuery, options, name) { return new $All(params, ownerQuery, options, name); };
var $size = function (params, ownerQuery, options) { return new $Size(params, ownerQuery, options, "$size"); };
var $options = function () { return null; };
var $where = function (params, ownerQuery, options) {
    var test;
    if (isFunction(params)) {
        test = params;
    }
    else if (!process.env.CSP_ENABLED) {
        test = new Function("obj", "return " + params);
    }
    else {
        throw new Error("In CSP mode, sift does not support strings in \"$where\" condition");
    }
    return new EqualsOperation(function (b) { return test.bind(b)(b); }, ownerQuery, options);
};

var defaultOperations = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $Size: $Size,
    $all: $all,
    $and: $and,
    $elemMatch: $elemMatch,
    $eq: $eq,
    $exists: $exists,
    $gt: $gt,
    $gte: $gte,
    $in: $in,
    $lt: $lt,
    $lte: $lte,
    $mod: $mod,
    $ne: $ne,
    $nin: $nin,
    $nor: $nor,
    $not: $not,
    $options: $options,
    $or: $or,
    $regex: $regex,
    $size: $size,
    $type: $type,
    $where: $where
});

var createDefaultQueryOperation = function (query, ownerQuery, _a) {
    var _b = _a === void 0 ? {} : _a, compare = _b.compare, operations = _b.operations;
    return createQueryOperation(query, ownerQuery, {
        compare: compare,
        operations: Object.assign({}, defaultOperations, operations || {}),
    });
};
var createDefaultQueryTester = function (query, options) {
    if (options === void 0) { options = {}; }
    var op = createDefaultQueryOperation(query, null, options);
    return createOperationTester(op);
};

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
function getGlobal() {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
}
function getDevTools() {
  const w = getGlobal();
  if (w.__xstate__) {
    return w.__xstate__;
  }
  return undefined;
}
const devToolsAdapter = service => {
  if (typeof window === 'undefined') {
    return;
  }
  const devTools = getDevTools();
  if (devTools) {
    devTools.register(service);
  }
};

class Mailbox {
  constructor(_process) {
    this._process = _process;
    this._active = false;
    this._current = null;
    this._last = null;
  }
  start() {
    this._active = true;
    this.flush();
  }
  clear() {
    // we can't set _current to null because we might be currently processing
    // and enqueue following clear shouldnt start processing the enqueued item immediately
    if (this._current) {
      this._current.next = null;
      this._last = this._current;
    }
  }
  enqueue(event) {
    const enqueued = {
      value: event,
      next: null
    };
    if (this._current) {
      this._last.next = enqueued;
      this._last = enqueued;
      return;
    }
    this._current = enqueued;
    this._last = enqueued;
    if (this._active) {
      this.flush();
    }
  }
  flush() {
    while (this._current) {
      // atm the given _process is responsible for implementing proper try/catch handling
      // we assume here that this won't throw in a way that can affect this mailbox
      const consumed = this._current;
      this._process(consumed.value);
      this._current = consumed.next;
    }
    this._last = null;
  }
}

const STATE_DELIMITER = '.';
const TARGETLESS_KEY = '';
const NULL_EVENT = '';
const STATE_IDENTIFIER$1 = '#';
const WILDCARD = '*';
const XSTATE_INIT = 'xstate.init';
const XSTATE_STOP = 'xstate.stop';

/**
 * Returns an event that represents an implicit event that is sent after the
 * specified `delay`.
 *
 * @param delayRef The delay in milliseconds
 * @param id The state node ID where this event is handled
 */
function createAfterEvent(delayRef, id) {
  return {
    type: `xstate.after.${delayRef}.${id}`
  };
}

/**
 * Returns an event that represents that a final state node has been reached in
 * the parent state node.
 *
 * @param id The final state node's parent state node `id`
 * @param output The data to pass into the event
 */
function createDoneStateEvent(id, output) {
  return {
    type: `xstate.done.state.${id}`,
    output
  };
}

/**
 * Returns an event that represents that an invoked service has terminated.
 *
 * An invoked service is terminated when it has reached a top-level final state
 * node, but not when it is canceled.
 *
 * @param invokeId The invoked service ID
 * @param output The data to pass into the event
 */
function createDoneActorEvent(invokeId, output) {
  return {
    type: `xstate.done.actor.${invokeId}`,
    output,
    actorId: invokeId
  };
}
function createErrorActorEvent(id, error) {
  return {
    type: `xstate.error.actor.${id}`,
    error,
    actorId: id
  };
}
function createInitEvent(input) {
  return {
    type: XSTATE_INIT,
    input
  };
}

/**
 * This function makes sure that unhandled errors are thrown in a separate
 * macrotask. It allows those errors to be detected by global error handlers and
 * reported to bug tracking services without interrupting our own stack of
 * execution.
 *
 * @param err Error to be thrown
 */
function reportUnhandledError(err) {
  setTimeout(() => {
    throw err;
  });
}

const symbolObservable = (() => typeof Symbol === 'function' && Symbol.observable || '@@observable')();

function matchesState(parentStateId, childStateId) {
  const parentStateValue = toStateValue(parentStateId);
  const childStateValue = toStateValue(childStateId);
  if (typeof childStateValue === 'string') {
    if (typeof parentStateValue === 'string') {
      return childStateValue === parentStateValue;
    }

    // Parent more specific than child
    return false;
  }
  if (typeof parentStateValue === 'string') {
    return parentStateValue in childStateValue;
  }
  return Object.keys(parentStateValue).every(key => {
    if (!(key in childStateValue)) {
      return false;
    }
    return matchesState(parentStateValue[key], childStateValue[key]);
  });
}
function toStatePath(stateId) {
  if (isArray(stateId)) {
    return stateId;
  }
  const result = [];
  let segment = '';
  for (let i = 0; i < stateId.length; i++) {
    const char = stateId.charCodeAt(i);
    switch (char) {
      // \
      case 92:
        // consume the next character
        segment += stateId[i + 1];
        // and skip over it
        i++;
        continue;
      // .
      case 46:
        result.push(segment);
        segment = '';
        continue;
    }
    segment += stateId[i];
  }
  result.push(segment);
  return result;
}
function toStateValue(stateValue) {
  if (isMachineSnapshot(stateValue)) {
    return stateValue.value;
  }
  if (typeof stateValue !== 'string') {
    return stateValue;
  }
  const statePath = toStatePath(stateValue);
  return pathToStateValue(statePath);
}
function pathToStateValue(statePath) {
  if (statePath.length === 1) {
    return statePath[0];
  }
  const value = {};
  let marker = value;
  for (let i = 0; i < statePath.length - 1; i++) {
    if (i === statePath.length - 2) {
      marker[statePath[i]] = statePath[i + 1];
    } else {
      const previous = marker;
      marker = {};
      previous[statePath[i]] = marker;
    }
  }
  return value;
}
function mapValues(collection, iteratee) {
  const result = {};
  const collectionKeys = Object.keys(collection);
  for (let i = 0; i < collectionKeys.length; i++) {
    const key = collectionKeys[i];
    result[key] = iteratee(collection[key], key, collection, i);
  }
  return result;
}
function toArrayStrict(value) {
  if (isArray(value)) {
    return value;
  }
  return [value];
}
function toArray(value) {
  if (value === undefined) {
    return [];
  }
  return toArrayStrict(value);
}
function resolveOutput(mapper, context, event, self) {
  if (typeof mapper === 'function') {
    return mapper({
      context,
      event,
      self
    });
  }
  return mapper;
}
function isArray(value) {
  return Array.isArray(value);
}
function isErrorActorEvent(event) {
  return event.type.startsWith('xstate.error.actor');
}
function toTransitionConfigArray(configLike) {
  return toArrayStrict(configLike).map(transitionLike => {
    if (typeof transitionLike === 'undefined' || typeof transitionLike === 'string') {
      return {
        target: transitionLike
      };
    }
    return transitionLike;
  });
}
function normalizeTarget(target) {
  if (target === undefined || target === TARGETLESS_KEY) {
    return undefined;
  }
  return toArray(target);
}
function toObserver(nextHandler, errorHandler, completionHandler) {
  const isObserver = typeof nextHandler === 'object';
  const self = isObserver ? nextHandler : undefined;
  return {
    next: (isObserver ? nextHandler.next : nextHandler)?.bind(self),
    error: (isObserver ? nextHandler.error : errorHandler)?.bind(self),
    complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self)
  };
}
function createInvokeId(stateNodeId, index) {
  return `${index}.${stateNodeId}`;
}
function resolveReferencedActor(machine, src) {
  const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
  if (!match) {
    return machine.implementations.actors[src];
  }
  const [, indexStr, nodeId] = match;
  const node = machine.getStateNodeById(nodeId);
  const invokeConfig = node.config.invoke;
  return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
}

function createScheduledEventId(actorRef, id) {
  return `${actorRef.sessionId}.${id}`;
}
let idCounter = 0;
function createSystem(rootActor, options) {
  const children = new Map();
  const keyedActors = new Map();
  const reverseKeyedActors = new WeakMap();
  const inspectionObservers = new Set();
  const timerMap = {};
  const {
    clock,
    logger
  } = options;
  const scheduler = {
    schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
      const scheduledEvent = {
        source,
        target,
        event,
        delay,
        id,
        startedAt: Date.now()
      };
      const scheduledEventId = createScheduledEventId(source, id);
      system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
      const timeout = clock.setTimeout(() => {
        delete timerMap[scheduledEventId];
        delete system._snapshot._scheduledEvents[scheduledEventId];
        system._relay(source, target, event);
      }, delay);
      timerMap[scheduledEventId] = timeout;
    },
    cancel: (source, id) => {
      const scheduledEventId = createScheduledEventId(source, id);
      const timeout = timerMap[scheduledEventId];
      delete timerMap[scheduledEventId];
      delete system._snapshot._scheduledEvents[scheduledEventId];
      if (timeout !== undefined) {
        clock.clearTimeout(timeout);
      }
    },
    cancelAll: actorRef => {
      for (const scheduledEventId in system._snapshot._scheduledEvents) {
        const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
        if (scheduledEvent.source === actorRef) {
          scheduler.cancel(actorRef, scheduledEvent.id);
        }
      }
    }
  };
  const sendInspectionEvent = event => {
    if (!inspectionObservers.size) {
      return;
    }
    const resolvedInspectionEvent = {
      ...event,
      rootId: rootActor.sessionId
    };
    inspectionObservers.forEach(observer => observer.next?.(resolvedInspectionEvent));
  };
  const system = {
    _snapshot: {
      _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {}
    },
    _bookId: () => `x:${idCounter++}`,
    _register: (sessionId, actorRef) => {
      children.set(sessionId, actorRef);
      return sessionId;
    },
    _unregister: actorRef => {
      children.delete(actorRef.sessionId);
      const systemId = reverseKeyedActors.get(actorRef);
      if (systemId !== undefined) {
        keyedActors.delete(systemId);
        reverseKeyedActors.delete(actorRef);
      }
    },
    get: systemId => {
      return keyedActors.get(systemId);
    },
    _set: (systemId, actorRef) => {
      const existing = keyedActors.get(systemId);
      if (existing && existing !== actorRef) {
        throw new Error(`Actor with system ID '${systemId}' already exists.`);
      }
      keyedActors.set(systemId, actorRef);
      reverseKeyedActors.set(actorRef, systemId);
    },
    inspect: observerOrFn => {
      const observer = toObserver(observerOrFn);
      inspectionObservers.add(observer);
      return {
        unsubscribe() {
          inspectionObservers.delete(observer);
        }
      };
    },
    _sendInspectionEvent: sendInspectionEvent,
    _relay: (source, target, event) => {
      system._sendInspectionEvent({
        type: '@xstate.event',
        sourceRef: source,
        actorRef: target,
        event
      });
      target._send(event);
    },
    scheduler,
    getSnapshot: () => {
      return {
        _scheduledEvents: {
          ...system._snapshot._scheduledEvents
        }
      };
    },
    start: () => {
      const scheduledEvents = system._snapshot._scheduledEvents;
      system._snapshot._scheduledEvents = {};
      for (const scheduledId in scheduledEvents) {
        const {
          source,
          target,
          event,
          delay,
          id
        } = scheduledEvents[scheduledId];
        scheduler.schedule(source, target, event, delay, id);
      }
    },
    _clock: clock,
    _logger: logger
  };
  return system;
}
const $$ACTOR_TYPE = 1;

// those values are currently used by @xstate/react directly so it's important to keep the assigned values in sync
let ProcessingStatus = /*#__PURE__*/function (ProcessingStatus) {
  ProcessingStatus[ProcessingStatus["NotStarted"] = 0] = "NotStarted";
  ProcessingStatus[ProcessingStatus["Running"] = 1] = "Running";
  ProcessingStatus[ProcessingStatus["Stopped"] = 2] = "Stopped";
  return ProcessingStatus;
}({});
const defaultOptions = {
  clock: {
    setTimeout: (fn, ms) => {
      return setTimeout(fn, ms);
    },
    clearTimeout: id => {
      return clearTimeout(id);
    }
  },
  logger: console.log.bind(console),
  devTools: false
};

/**
 * An Actor is a running process that can receive events, send events and change
 * its behavior based on the events it receives, which can cause effects outside
 * of the actor. When you run a state machine, it becomes an actor.
 */
class Actor {
  /**
   * Creates a new actor instance for the given logic with the provided options,
   * if any.
   *
   * @param logic The logic to create an actor from
   * @param options Actor options
   */
  constructor(logic, options) {
    this.logic = logic;
    /** The current internal state of the actor. */
    this._snapshot = void 0;
    /**
     * The clock that is responsible for setting and clearing timeouts, such as
     * delayed events and transitions.
     */
    this.clock = void 0;
    this.options = void 0;
    /** The unique identifier for this actor relative to its parent. */
    this.id = void 0;
    this.mailbox = new Mailbox(this._process.bind(this));
    this.observers = new Set();
    this.eventListeners = new Map();
    this.logger = void 0;
    /** @internal */
    this._processingStatus = ProcessingStatus.NotStarted;
    // Actor Ref
    this._parent = void 0;
    /** @internal */
    this._syncSnapshot = void 0;
    this.ref = void 0;
    // TODO: add typings for system
    this._actorScope = void 0;
    this._systemId = void 0;
    /** The globally unique process ID for this invocation. */
    this.sessionId = void 0;
    /** The system to which this actor belongs. */
    this.system = void 0;
    this._doneEvent = void 0;
    this.src = void 0;
    // array of functions to defer
    this._deferred = [];
    const resolvedOptions = {
      ...defaultOptions,
      ...options
    };
    const {
      clock,
      logger,
      parent,
      syncSnapshot,
      id,
      systemId,
      inspect
    } = resolvedOptions;
    this.system = parent ? parent.system : createSystem(this, {
      clock,
      logger
    });
    if (inspect && !parent) {
      // Always inspect at the system-level
      this.system.inspect(toObserver(inspect));
    }
    this.sessionId = this.system._bookId();
    this.id = id ?? this.sessionId;
    this.logger = options?.logger ?? this.system._logger;
    this.clock = options?.clock ?? this.system._clock;
    this._parent = parent;
    this._syncSnapshot = syncSnapshot;
    this.options = resolvedOptions;
    this.src = resolvedOptions.src ?? logic;
    this.ref = this;
    this._actorScope = {
      self: this,
      id: this.id,
      sessionId: this.sessionId,
      logger: this.logger,
      defer: fn => {
        this._deferred.push(fn);
      },
      system: this.system,
      stopChild: child => {
        if (child._parent !== this) {
          throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
        }
        child._stop();
      },
      emit: emittedEvent => {
        const listeners = this.eventListeners.get(emittedEvent.type);
        const wildcardListener = this.eventListeners.get('*');
        if (!listeners && !wildcardListener) {
          return;
        }
        const allListeners = [...(listeners ? listeners.values() : []), ...(wildcardListener ? wildcardListener.values() : [])];
        for (const handler of allListeners) {
          handler(emittedEvent);
        }
      },
      actionExecutor: action => {
        const exec = () => {
          this._actorScope.system._sendInspectionEvent({
            type: '@xstate.action',
            actorRef: this,
            action: {
              type: action.type,
              params: action.params
            }
          });
          if (!action.exec) {
            return;
          }
          try {
            action.exec(action.info, action.params);
          } finally {
          }
        };
        if (this._processingStatus === ProcessingStatus.Running) {
          exec();
        } else {
          this._deferred.push(exec);
        }
      }
    };

    // Ensure that the send method is bound to this Actor instance
    // if destructured
    this.send = this.send.bind(this);
    this.system._sendInspectionEvent({
      type: '@xstate.actor',
      actorRef: this
    });
    if (systemId) {
      this._systemId = systemId;
      this.system._set(systemId, this);
    }
    this._initState(options?.snapshot ?? options?.state);
    if (systemId && this._snapshot.status !== 'active') {
      this.system._unregister(this);
    }
  }
  _initState(persistedState) {
    try {
      this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
    } catch (err) {
      // if we get here then it means that we assign a value to this._snapshot that is not of the correct type
      // we can't get the true `TSnapshot & { status: 'error'; }`, it's impossible
      // so right now this is a lie of sorts
      this._snapshot = {
        status: 'error',
        output: undefined,
        error: err
      };
    }
  }
  update(snapshot, event) {
    // Update state
    this._snapshot = snapshot;

    // Execute deferred effects
    let deferredFn;
    while (deferredFn = this._deferred.shift()) {
      try {
        deferredFn();
      } catch (err) {
        // this error can only be caught when executing *initial* actions
        // it's the only time when we call actions provided by the user through those deferreds
        // when the actor is already running we always execute them synchronously while transitioning
        // no "builtin deferred" should actually throw an error since they are either safe
        // or the control flow is passed through the mailbox and errors should be caught by the `_process` used by the mailbox
        this._deferred.length = 0;
        this._snapshot = {
          ...snapshot,
          status: 'error',
          error: err
        };
      }
    }
    switch (this._snapshot.status) {
      case 'active':
        for (const observer of this.observers) {
          try {
            observer.next?.(snapshot);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
        break;
      case 'done':
        // next observers are meant to be notified about done snapshots
        // this can be seen as something that is different from how observable work
        // but with observables `complete` callback is called without any arguments
        // it's more ergonomic for XState to treat a done snapshot as a "next" value
        // and the completion event as something that is separate,
        // something that merely follows emitting that done snapshot
        for (const observer of this.observers) {
          try {
            observer.next?.(snapshot);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
        this._stopProcedure();
        this._complete();
        this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
        if (this._parent) {
          this.system._relay(this, this._parent, this._doneEvent);
        }
        break;
      case 'error':
        this._error(this._snapshot.error);
        break;
    }
    this.system._sendInspectionEvent({
      type: '@xstate.snapshot',
      actorRef: this,
      event,
      snapshot
    });
  }

  /**
   * Subscribe an observer to an actor’s snapshot values.
   *
   * @remarks
   * The observer will receive the actor’s snapshot value when it is emitted.
   * The observer can be:
   *
   * - A plain function that receives the latest snapshot, or
   * - An observer object whose `.next(snapshot)` method receives the latest
   *   snapshot
   *
   * @example
   *
   * ```ts
   * // Observer as a plain function
   * const subscription = actor.subscribe((snapshot) => {
   *   console.log(snapshot);
   * });
   * ```
   *
   * @example
   *
   * ```ts
   * // Observer as an object
   * const subscription = actor.subscribe({
   *   next(snapshot) {
   *     console.log(snapshot);
   *   },
   *   error(err) {
   *     // ...
   *   },
   *   complete() {
   *     // ...
   *   }
   * });
   * ```
   *
   * The return value of `actor.subscribe(observer)` is a subscription object
   * that has an `.unsubscribe()` method. You can call
   * `subscription.unsubscribe()` to unsubscribe the observer:
   *
   * @example
   *
   * ```ts
   * const subscription = actor.subscribe((snapshot) => {
   *   // ...
   * });
   *
   * // Unsubscribe the observer
   * subscription.unsubscribe();
   * ```
   *
   * When the actor is stopped, all of its observers will automatically be
   * unsubscribed.
   *
   * @param observer - Either a plain function that receives the latest
   *   snapshot, or an observer object whose `.next(snapshot)` method receives
   *   the latest snapshot
   */

  subscribe(nextListenerOrObserver, errorListener, completeListener) {
    const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
    if (this._processingStatus !== ProcessingStatus.Stopped) {
      this.observers.add(observer);
    } else {
      switch (this._snapshot.status) {
        case 'done':
          try {
            observer.complete?.();
          } catch (err) {
            reportUnhandledError(err);
          }
          break;
        case 'error':
          {
            const err = this._snapshot.error;
            if (!observer.error) {
              reportUnhandledError(err);
            } else {
              try {
                observer.error(err);
              } catch (err) {
                reportUnhandledError(err);
              }
            }
            break;
          }
      }
    }
    return {
      unsubscribe: () => {
        this.observers.delete(observer);
      }
    };
  }
  on(type, handler) {
    let listeners = this.eventListeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(type, listeners);
    }
    const wrappedHandler = handler.bind(undefined);
    listeners.add(wrappedHandler);
    return {
      unsubscribe: () => {
        listeners.delete(wrappedHandler);
      }
    };
  }

  /** Starts the Actor from the initial state */
  start() {
    if (this._processingStatus === ProcessingStatus.Running) {
      // Do not restart the service if it is already started
      return this;
    }
    if (this._syncSnapshot) {
      this.subscribe({
        next: snapshot => {
          if (snapshot.status === 'active') {
            this.system._relay(this, this._parent, {
              type: `xstate.snapshot.${this.id}`,
              snapshot
            });
          }
        },
        error: () => {}
      });
    }
    this.system._register(this.sessionId, this);
    if (this._systemId) {
      this.system._set(this._systemId, this);
    }
    this._processingStatus = ProcessingStatus.Running;

    // TODO: this isn't correct when rehydrating
    const initEvent = createInitEvent(this.options.input);
    this.system._sendInspectionEvent({
      type: '@xstate.event',
      sourceRef: this._parent,
      actorRef: this,
      event: initEvent
    });
    const status = this._snapshot.status;
    switch (status) {
      case 'done':
        // a state machine can be "done" upon initialization (it could reach a final state using initial microsteps)
        // we still need to complete observers, flush deferreds etc
        this.update(this._snapshot, initEvent);
        // TODO: rethink cleanup of observers, mailbox, etc
        return this;
      case 'error':
        this._error(this._snapshot.error);
        return this;
    }
    if (!this._parent) {
      this.system.start();
    }
    if (this.logic.start) {
      try {
        this.logic.start(this._snapshot, this._actorScope);
      } catch (err) {
        this._snapshot = {
          ...this._snapshot,
          status: 'error',
          error: err
        };
        this._error(err);
        return this;
      }
    }

    // TODO: this notifies all subscribers but usually this is redundant
    // there is no real change happening here
    // we need to rethink if this needs to be refactored
    this.update(this._snapshot, initEvent);
    if (this.options.devTools) {
      this.attachDevTools();
    }
    this.mailbox.start();
    return this;
  }
  _process(event) {
    let nextState;
    let caughtError;
    try {
      nextState = this.logic.transition(this._snapshot, event, this._actorScope);
    } catch (err) {
      // we wrap it in a box so we can rethrow it later even if falsy value gets caught here
      caughtError = {
        err
      };
    }
    if (caughtError) {
      const {
        err
      } = caughtError;
      this._snapshot = {
        ...this._snapshot,
        status: 'error',
        error: err
      };
      this._error(err);
      return;
    }
    this.update(nextState, event);
    if (event.type === XSTATE_STOP) {
      this._stopProcedure();
      this._complete();
    }
  }
  _stop() {
    if (this._processingStatus === ProcessingStatus.Stopped) {
      return this;
    }
    this.mailbox.clear();
    if (this._processingStatus === ProcessingStatus.NotStarted) {
      this._processingStatus = ProcessingStatus.Stopped;
      return this;
    }
    this.mailbox.enqueue({
      type: XSTATE_STOP
    });
    return this;
  }

  /** Stops the Actor and unsubscribe all listeners. */
  stop() {
    if (this._parent) {
      throw new Error('A non-root actor cannot be stopped directly.');
    }
    return this._stop();
  }
  _complete() {
    for (const observer of this.observers) {
      try {
        observer.complete?.();
      } catch (err) {
        reportUnhandledError(err);
      }
    }
    this.observers.clear();
  }
  _reportError(err) {
    if (!this.observers.size) {
      if (!this._parent) {
        reportUnhandledError(err);
      }
      return;
    }
    let reportError = false;
    for (const observer of this.observers) {
      const errorListener = observer.error;
      reportError ||= !errorListener;
      try {
        errorListener?.(err);
      } catch (err2) {
        reportUnhandledError(err2);
      }
    }
    this.observers.clear();
    if (reportError) {
      reportUnhandledError(err);
    }
  }
  _error(err) {
    this._stopProcedure();
    this._reportError(err);
    if (this._parent) {
      this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
    }
  }
  // TODO: atm children don't belong entirely to the actor so
  // in a way - it's not even super aware of them
  // so we can't stop them from here but we really should!
  // right now, they are being stopped within the machine's transition
  // but that could throw and leave us with "orphaned" active actors
  _stopProcedure() {
    if (this._processingStatus !== ProcessingStatus.Running) {
      // Actor already stopped; do nothing
      return this;
    }

    // Cancel all delayed events
    this.system.scheduler.cancelAll(this);

    // TODO: mailbox.reset
    this.mailbox.clear();
    // TODO: after `stop` we must prepare ourselves for receiving events again
    // events sent *after* stop signal must be queued
    // it seems like this should be the common behavior for all of our consumers
    // so perhaps this should be unified somehow for all of them
    this.mailbox = new Mailbox(this._process.bind(this));
    this._processingStatus = ProcessingStatus.Stopped;
    this.system._unregister(this);
    return this;
  }

  /** @internal */
  _send(event) {
    if (this._processingStatus === ProcessingStatus.Stopped) {
      return;
    }
    this.mailbox.enqueue(event);
  }

  /**
   * Sends an event to the running Actor to trigger a transition.
   *
   * @param event The event to send
   */
  send(event) {
    this.system._relay(undefined, this, event);
  }
  attachDevTools() {
    const {
      devTools
    } = this.options;
    if (devTools) {
      const resolvedDevToolsAdapter = typeof devTools === 'function' ? devTools : devToolsAdapter;
      resolvedDevToolsAdapter(this);
    }
  }
  toJSON() {
    return {
      xstate$$type: $$ACTOR_TYPE,
      id: this.id
    };
  }

  /**
   * Obtain the internal state of the actor, which can be persisted.
   *
   * @remarks
   * The internal state can be persisted from any actor, not only machines.
   *
   * Note that the persisted state is not the same as the snapshot from
   * {@link Actor.getSnapshot}. Persisted state represents the internal state of
   * the actor, while snapshots represent the actor's last emitted value.
   *
   * Can be restored with {@link ActorOptions.state}
   * @see https://stately.ai/docs/persistence
   */

  getPersistedSnapshot(options) {
    return this.logic.getPersistedSnapshot(this._snapshot, options);
  }
  [symbolObservable]() {
    return this;
  }

  /**
   * Read an actor’s snapshot synchronously.
   *
   * @remarks
   * The snapshot represent an actor's last emitted value.
   *
   * When an actor receives an event, its internal state may change. An actor
   * may emit a snapshot when a state transition occurs.
   *
   * Note that some actors, such as callback actors generated with
   * `fromCallback`, will not emit snapshots.
   * @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
   * @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
   */
  getSnapshot() {
    return this._snapshot;
  }
}
/**
 * Creates a new actor instance for the given actor logic with the provided
 * options, if any.
 *
 * @remarks
 * When you create an actor from actor logic via `createActor(logic)`, you
 * implicitly create an actor system where the created actor is the root actor.
 * Any actors spawned from this root actor and its descendants are part of that
 * actor system.
 * @example
 *
 * ```ts
 * import { createActor } from 'xstate';
 * import { someActorLogic } from './someActorLogic.ts';
 *
 * // Creating the actor, which implicitly creates an actor system with itself as the root actor
 * const actor = createActor(someActorLogic);
 *
 * actor.subscribe((snapshot) => {
 *   console.log(snapshot);
 * });
 *
 * // Actors must be started by calling `actor.start()`, which will also start the actor system.
 * actor.start();
 *
 * // Actors can receive events
 * actor.send({ type: 'someEvent' });
 *
 * // You can stop root actors by calling `actor.stop()`, which will also stop the actor system and all actors in that system.
 * actor.stop();
 * ```
 *
 * @param logic - The actor logic to create an actor from. For a state machine
 *   actor logic creator, see {@link createMachine}. Other actor logic creators
 *   include {@link fromCallback}, {@link fromEventObservable},
 *   {@link fromObservable}, {@link fromPromise}, and {@link fromTransition}.
 * @param options - Actor options
 */
function createActor(logic, ...[options]) {
  return new Actor(logic, options);
}

/**
 * @deprecated Use `Actor` instead.
 * @alias
 */

function resolveCancel(_, snapshot, actionArgs, actionParams, {
  sendId
}) {
  const resolvedSendId = typeof sendId === 'function' ? sendId(actionArgs, actionParams) : sendId;
  return [snapshot, {
    sendId: resolvedSendId
  }, undefined];
}
function executeCancel(actorScope, params) {
  actorScope.defer(() => {
    actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
  });
}
/**
 * Cancels a delayed `sendTo(...)` action that is waiting to be executed. The
 * canceled `sendTo(...)` action will not send its event or execute, unless the
 * `delay` has already elapsed before `cancel(...)` is called.
 *
 * @example
 *
 * ```ts
 * import { createMachine, sendTo, cancel } from 'xstate';
 *
 * const machine = createMachine({
 *   // ...
 *   on: {
 *     sendEvent: {
 *       actions: sendTo(
 *         'some-actor',
 *         { type: 'someEvent' },
 *         {
 *           id: 'some-id',
 *           delay: 1000
 *         }
 *       )
 *     },
 *     cancelEvent: {
 *       actions: cancel('some-id')
 *     }
 *   }
 * });
 * ```
 *
 * @param sendId The `id` of the `sendTo(...)` action to cancel.
 */
function cancel(sendId) {
  function cancel(_args, _params) {
  }
  cancel.type = 'xstate.cancel';
  cancel.sendId = sendId;
  cancel.resolve = resolveCancel;
  cancel.execute = executeCancel;
  return cancel;
}

function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, {
  id,
  systemId,
  src,
  input,
  syncSnapshot
}) {
  const logic = typeof src === 'string' ? resolveReferencedActor(snapshot.machine, src) : src;
  const resolvedId = typeof id === 'function' ? id(actionArgs) : id;
  let actorRef;
  let resolvedInput = undefined;
  if (logic) {
    resolvedInput = typeof input === 'function' ? input({
      context: snapshot.context,
      event: actionArgs.event,
      self: actorScope.self
    }) : input;
    actorRef = createActor(logic, {
      id: resolvedId,
      src,
      parent: actorScope.self,
      syncSnapshot,
      systemId,
      input: resolvedInput
    });
  }
  return [cloneMachineSnapshot(snapshot, {
    children: {
      ...snapshot.children,
      [resolvedId]: actorRef
    }
  }), {
    id,
    systemId,
    actorRef,
    src,
    input: resolvedInput
  }, undefined];
}
function executeSpawn(actorScope, {
  actorRef
}) {
  if (!actorRef) {
    return;
  }
  actorScope.defer(() => {
    if (actorRef._processingStatus === ProcessingStatus.Stopped) {
      return;
    }
    actorRef.start();
  });
}
function spawnChild(...[src, {
  id,
  systemId,
  input,
  syncSnapshot = false
} = {}]) {
  function spawnChild(_args, _params) {
  }
  spawnChild.type = 'xstate.spawnChild';
  spawnChild.id = id;
  spawnChild.systemId = systemId;
  spawnChild.src = src;
  spawnChild.input = input;
  spawnChild.syncSnapshot = syncSnapshot;
  spawnChild.resolve = resolveSpawn;
  spawnChild.execute = executeSpawn;
  return spawnChild;
}

function resolveStop(_, snapshot, args, actionParams, {
  actorRef
}) {
  const actorRefOrString = typeof actorRef === 'function' ? actorRef(args, actionParams) : actorRef;
  const resolvedActorRef = typeof actorRefOrString === 'string' ? snapshot.children[actorRefOrString] : actorRefOrString;
  let children = snapshot.children;
  if (resolvedActorRef) {
    children = {
      ...children
    };
    delete children[resolvedActorRef.id];
  }
  return [cloneMachineSnapshot(snapshot, {
    children
  }), resolvedActorRef, undefined];
}
function executeStop(actorScope, actorRef) {
  if (!actorRef) {
    return;
  }

  // we need to eagerly unregister it here so a new actor with the same systemId can be registered immediately
  // since we defer actual stopping of the actor but we don't defer actor creations (and we can't do that)
  // this could throw on `systemId` collision, for example, when dealing with reentering transitions
  actorScope.system._unregister(actorRef);

  // this allows us to prevent an actor from being started if it gets stopped within the same macrostep
  // this can happen, for example, when the invoking state is being exited immediately by an always transition
  if (actorRef._processingStatus !== ProcessingStatus.Running) {
    actorScope.stopChild(actorRef);
    return;
  }
  // stopping a child enqueues a stop event in the child actor's mailbox
  // we need for all of the already enqueued events to be processed before we stop the child
  // the parent itself might want to send some events to a child (for example from exit actions on the invoking state)
  // and we don't want to ignore those events
  actorScope.defer(() => {
    actorScope.stopChild(actorRef);
  });
}
/**
 * Stops a child actor.
 *
 * @param actorRef The actor to stop.
 */
function stopChild(actorRef) {
  function stop(_args, _params) {
  }
  stop.type = 'xstate.stopChild';
  stop.actorRef = actorRef;
  stop.resolve = resolveStop;
  stop.execute = executeStop;
  return stop;
}

// TODO: throw on cycles (depth check should be enough)
function evaluateGuard(guard, context, event, snapshot) {
  const {
    machine
  } = snapshot;
  const isInline = typeof guard === 'function';
  const resolved = isInline ? guard : machine.implementations.guards[typeof guard === 'string' ? guard : guard.type];
  if (!isInline && !resolved) {
    throw new Error(`Guard '${typeof guard === 'string' ? guard : guard.type}' is not implemented.'.`);
  }
  if (typeof resolved !== 'function') {
    return evaluateGuard(resolved, context, event, snapshot);
  }
  const guardArgs = {
    context,
    event
  };
  const guardParams = isInline || typeof guard === 'string' ? undefined : 'params' in guard ? typeof guard.params === 'function' ? guard.params({
    context,
    event
  }) : guard.params : undefined;
  if (!('check' in resolved)) {
    // the existing type of `.guards` assumes non-nullable `TExpressionGuard`
    // inline guards expect `TExpressionGuard` to be set to `undefined`
    // it's fine to cast this here, our logic makes sure that we call those 2 "variants" correctly
    return resolved(guardArgs, guardParams);
  }
  const builtinGuard = resolved;
  return builtinGuard.check(snapshot, guardArgs, resolved // this holds all params
  );
}

const isAtomicStateNode = stateNode => stateNode.type === 'atomic' || stateNode.type === 'final';
function getChildren(stateNode) {
  return Object.values(stateNode.states).filter(sn => sn.type !== 'history');
}
function getProperAncestors(stateNode, toStateNode) {
  const ancestors = [];
  if (toStateNode === stateNode) {
    return ancestors;
  }

  // add all ancestors
  let m = stateNode.parent;
  while (m && m !== toStateNode) {
    ancestors.push(m);
    m = m.parent;
  }
  return ancestors;
}
function getAllStateNodes(stateNodes) {
  const nodeSet = new Set(stateNodes);
  const adjList = getAdjList(nodeSet);

  // add descendants
  for (const s of nodeSet) {
    // if previously active, add existing child nodes
    if (s.type === 'compound' && (!adjList.get(s) || !adjList.get(s).length)) {
      getInitialStateNodesWithTheirAncestors(s).forEach(sn => nodeSet.add(sn));
    } else {
      if (s.type === 'parallel') {
        for (const child of getChildren(s)) {
          if (child.type === 'history') {
            continue;
          }
          if (!nodeSet.has(child)) {
            const initialStates = getInitialStateNodesWithTheirAncestors(child);
            for (const initialStateNode of initialStates) {
              nodeSet.add(initialStateNode);
            }
          }
        }
      }
    }
  }

  // add all ancestors
  for (const s of nodeSet) {
    let m = s.parent;
    while (m) {
      nodeSet.add(m);
      m = m.parent;
    }
  }
  return nodeSet;
}
function getValueFromAdj(baseNode, adjList) {
  const childStateNodes = adjList.get(baseNode);
  if (!childStateNodes) {
    return {}; // todo: fix?
  }
  if (baseNode.type === 'compound') {
    const childStateNode = childStateNodes[0];
    if (childStateNode) {
      if (isAtomicStateNode(childStateNode)) {
        return childStateNode.key;
      }
    } else {
      return {};
    }
  }
  const stateValue = {};
  for (const childStateNode of childStateNodes) {
    stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
  }
  return stateValue;
}
function getAdjList(stateNodes) {
  const adjList = new Map();
  for (const s of stateNodes) {
    if (!adjList.has(s)) {
      adjList.set(s, []);
    }
    if (s.parent) {
      if (!adjList.has(s.parent)) {
        adjList.set(s.parent, []);
      }
      adjList.get(s.parent).push(s);
    }
  }
  return adjList;
}
function getStateValue(rootNode, stateNodes) {
  const config = getAllStateNodes(stateNodes);
  return getValueFromAdj(rootNode, getAdjList(config));
}
function isInFinalState(stateNodeSet, stateNode) {
  if (stateNode.type === 'compound') {
    return getChildren(stateNode).some(s => s.type === 'final' && stateNodeSet.has(s));
  }
  if (stateNode.type === 'parallel') {
    return getChildren(stateNode).every(sn => isInFinalState(stateNodeSet, sn));
  }
  return stateNode.type === 'final';
}
const isStateId = str => str[0] === STATE_IDENTIFIER$1;
function getCandidates(stateNode, receivedEventType) {
  const candidates = stateNode.transitions.get(receivedEventType) || [...stateNode.transitions.keys()].filter(eventDescriptor => {
    // check if transition is a wildcard transition,
    // which matches any non-transient events
    if (eventDescriptor === WILDCARD) {
      return true;
    }
    if (!eventDescriptor.endsWith('.*')) {
      return false;
    }
    const partialEventTokens = eventDescriptor.split('.');
    const eventTokens = receivedEventType.split('.');
    for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
      const partialEventToken = partialEventTokens[tokenIndex];
      const eventToken = eventTokens[tokenIndex];
      if (partialEventToken === '*') {
        const isLastToken = tokenIndex === partialEventTokens.length - 1;
        return isLastToken;
      }
      if (partialEventToken !== eventToken) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => b.length - a.length).flatMap(key => stateNode.transitions.get(key));
  return candidates;
}

/** All delayed transitions from the config. */
function getDelayedTransitions(stateNode) {
  const afterConfig = stateNode.config.after;
  if (!afterConfig) {
    return [];
  }
  const mutateEntryExit = delay => {
    const afterEvent = createAfterEvent(delay, stateNode.id);
    const eventType = afterEvent.type;
    stateNode.entry.push(raise(afterEvent, {
      id: eventType,
      delay
    }));
    stateNode.exit.push(cancel(eventType));
    return eventType;
  };
  const delayedTransitions = Object.keys(afterConfig).flatMap(delay => {
    const configTransition = afterConfig[delay];
    const resolvedTransition = typeof configTransition === 'string' ? {
      target: configTransition
    } : configTransition;
    const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
    const eventType = mutateEntryExit(resolvedDelay);
    return toArray(resolvedTransition).map(transition => ({
      ...transition,
      event: eventType,
      delay: resolvedDelay
    }));
  });
  return delayedTransitions.map(delayedTransition => {
    const {
      delay
    } = delayedTransition;
    return {
      ...formatTransition(stateNode, delayedTransition.event, delayedTransition),
      delay
    };
  });
}
function formatTransition(stateNode, descriptor, transitionConfig) {
  const normalizedTarget = normalizeTarget(transitionConfig.target);
  const reenter = transitionConfig.reenter ?? false;
  const target = resolveTarget(stateNode, normalizedTarget);
  const transition = {
    ...transitionConfig,
    actions: toArray(transitionConfig.actions),
    guard: transitionConfig.guard,
    target,
    source: stateNode,
    reenter,
    eventType: descriptor,
    toJSON: () => ({
      ...transition,
      source: `#${stateNode.id}`,
      target: target ? target.map(t => `#${t.id}`) : undefined
    })
  };
  return transition;
}
function formatTransitions(stateNode) {
  const transitions = new Map();
  if (stateNode.config.on) {
    for (const descriptor of Object.keys(stateNode.config.on)) {
      if (descriptor === NULL_EVENT) {
        throw new Error('Null events ("") cannot be specified as a transition key. Use `always: { ... }` instead.');
      }
      const transitionsConfig = stateNode.config.on[descriptor];
      transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map(t => formatTransition(stateNode, descriptor, t)));
    }
  }
  if (stateNode.config.onDone) {
    const descriptor = `xstate.done.state.${stateNode.id}`;
    transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map(t => formatTransition(stateNode, descriptor, t)));
  }
  for (const invokeDef of stateNode.invoke) {
    if (invokeDef.onDone) {
      const descriptor = `xstate.done.actor.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map(t => formatTransition(stateNode, descriptor, t)));
    }
    if (invokeDef.onError) {
      const descriptor = `xstate.error.actor.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map(t => formatTransition(stateNode, descriptor, t)));
    }
    if (invokeDef.onSnapshot) {
      const descriptor = `xstate.snapshot.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map(t => formatTransition(stateNode, descriptor, t)));
    }
  }
  for (const delayedTransition of stateNode.after) {
    let existing = transitions.get(delayedTransition.eventType);
    if (!existing) {
      existing = [];
      transitions.set(delayedTransition.eventType, existing);
    }
    existing.push(delayedTransition);
  }
  return transitions;
}
function formatInitialTransition(stateNode, _target) {
  const resolvedTarget = typeof _target === 'string' ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : undefined;
  if (!resolvedTarget && _target) {
    throw new Error(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
    `Initial state node "${_target}" not found on parent state node #${stateNode.id}`);
  }
  const transition = {
    source: stateNode,
    actions: !_target || typeof _target === 'string' ? [] : toArray(_target.actions),
    eventType: null,
    reenter: false,
    target: resolvedTarget ? [resolvedTarget] : [],
    toJSON: () => ({
      ...transition,
      source: `#${stateNode.id}`,
      target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
    })
  };
  return transition;
}
function resolveTarget(stateNode, targets) {
  if (targets === undefined) {
    // an undefined target signals that the state node should not transition from that state when receiving that event
    return undefined;
  }
  return targets.map(target => {
    if (typeof target !== 'string') {
      return target;
    }
    if (isStateId(target)) {
      return stateNode.machine.getStateNodeById(target);
    }
    const isInternalTarget = target[0] === STATE_DELIMITER;
    // If internal target is defined on machine,
    // do not include machine key on target
    if (isInternalTarget && !stateNode.parent) {
      return getStateNodeByPath(stateNode, target.slice(1));
    }
    const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
    if (stateNode.parent) {
      try {
        const targetStateNode = getStateNodeByPath(stateNode.parent, resolvedTarget);
        return targetStateNode;
      } catch (err) {
        throw new Error(`Invalid transition definition for state node '${stateNode.id}':\n${err.message}`);
      }
    } else {
      throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
    }
  });
}
function resolveHistoryDefaultTransition(stateNode) {
  const normalizedTarget = normalizeTarget(stateNode.config.target);
  if (!normalizedTarget) {
    return stateNode.parent.initial;
  }
  return {
    target: normalizedTarget.map(t => typeof t === 'string' ? getStateNodeByPath(stateNode.parent, t) : t)
  };
}
function isHistoryNode(stateNode) {
  return stateNode.type === 'history';
}
function getInitialStateNodesWithTheirAncestors(stateNode) {
  const states = getInitialStateNodes(stateNode);
  for (const initialState of states) {
    for (const ancestor of getProperAncestors(initialState, stateNode)) {
      states.add(ancestor);
    }
  }
  return states;
}
function getInitialStateNodes(stateNode) {
  const set = new Set();
  function iter(descStateNode) {
    if (set.has(descStateNode)) {
      return;
    }
    set.add(descStateNode);
    if (descStateNode.type === 'compound') {
      iter(descStateNode.initial.target[0]);
    } else if (descStateNode.type === 'parallel') {
      for (const child of getChildren(descStateNode)) {
        iter(child);
      }
    }
  }
  iter(stateNode);
  return set;
}
/** Returns the child state node from its relative `stateKey`, or throws. */
function getStateNode(stateNode, stateKey) {
  if (isStateId(stateKey)) {
    return stateNode.machine.getStateNodeById(stateKey);
  }
  if (!stateNode.states) {
    throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
  }
  const result = stateNode.states[stateKey];
  if (!result) {
    throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
  }
  return result;
}

/**
 * Returns the relative state node from the given `statePath`, or throws.
 *
 * @param statePath The string or string array relative path to the state node.
 */
function getStateNodeByPath(stateNode, statePath) {
  if (typeof statePath === 'string' && isStateId(statePath)) {
    try {
      return stateNode.machine.getStateNodeById(statePath);
    } catch {
      // try individual paths
      // throw e;
    }
  }
  const arrayStatePath = toStatePath(statePath).slice();
  let currentStateNode = stateNode;
  while (arrayStatePath.length) {
    const key = arrayStatePath.shift();
    if (!key.length) {
      break;
    }
    currentStateNode = getStateNode(currentStateNode, key);
  }
  return currentStateNode;
}

/**
 * Returns the state nodes represented by the current state value.
 *
 * @param stateValue The state value or State instance
 */
function getStateNodes(stateNode, stateValue) {
  if (typeof stateValue === 'string') {
    const childStateNode = stateNode.states[stateValue];
    if (!childStateNode) {
      throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
    }
    return [stateNode, childStateNode];
  }
  const childStateKeys = Object.keys(stateValue);
  const childStateNodes = childStateKeys.map(subStateKey => getStateNode(stateNode, subStateKey)).filter(Boolean);
  return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
    const subStateNode = getStateNode(stateNode, subStateKey);
    if (!subStateNode) {
      return allSubStateNodes;
    }
    const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
    return allSubStateNodes.concat(subStateNodes);
  }, []));
}
function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
  const childStateNode = getStateNode(stateNode, stateValue);
  const next = childStateNode.next(snapshot, event);
  if (!next || !next.length) {
    return stateNode.next(snapshot, event);
  }
  return next;
}
function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
  const subStateKeys = Object.keys(stateValue);
  const childStateNode = getStateNode(stateNode, subStateKeys[0]);
  const next = transitionNode(childStateNode, stateValue[subStateKeys[0]], snapshot, event);
  if (!next || !next.length) {
    return stateNode.next(snapshot, event);
  }
  return next;
}
function transitionParallelNode(stateNode, stateValue, snapshot, event) {
  const allInnerTransitions = [];
  for (const subStateKey of Object.keys(stateValue)) {
    const subStateValue = stateValue[subStateKey];
    if (!subStateValue) {
      continue;
    }
    const subStateNode = getStateNode(stateNode, subStateKey);
    const innerTransitions = transitionNode(subStateNode, subStateValue, snapshot, event);
    if (innerTransitions) {
      allInnerTransitions.push(...innerTransitions);
    }
  }
  if (!allInnerTransitions.length) {
    return stateNode.next(snapshot, event);
  }
  return allInnerTransitions;
}
function transitionNode(stateNode, stateValue, snapshot, event) {
  // leaf node
  if (typeof stateValue === 'string') {
    return transitionAtomicNode(stateNode, stateValue, snapshot, event);
  }

  // compound node
  if (Object.keys(stateValue).length === 1) {
    return transitionCompoundNode(stateNode, stateValue, snapshot, event);
  }

  // parallel node
  return transitionParallelNode(stateNode, stateValue, snapshot, event);
}
function getHistoryNodes(stateNode) {
  return Object.keys(stateNode.states).map(key => stateNode.states[key]).filter(sn => sn.type === 'history');
}
function isDescendant(childStateNode, parentStateNode) {
  let marker = childStateNode;
  while (marker.parent && marker.parent !== parentStateNode) {
    marker = marker.parent;
  }
  return marker.parent === parentStateNode;
}
function hasIntersection(s1, s2) {
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  for (const item of set1) {
    if (set2.has(item)) {
      return true;
    }
  }
  for (const item of set2) {
    if (set1.has(item)) {
      return true;
    }
  }
  return false;
}
function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
  const filteredTransitions = new Set();
  for (const t1 of enabledTransitions) {
    let t1Preempted = false;
    const transitionsToRemove = new Set();
    for (const t2 of filteredTransitions) {
      if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
        if (isDescendant(t1.source, t2.source)) {
          transitionsToRemove.add(t2);
        } else {
          t1Preempted = true;
          break;
        }
      }
    }
    if (!t1Preempted) {
      for (const t3 of transitionsToRemove) {
        filteredTransitions.delete(t3);
      }
      filteredTransitions.add(t1);
    }
  }
  return Array.from(filteredTransitions);
}
function findLeastCommonAncestor(stateNodes) {
  const [head, ...tail] = stateNodes;
  for (const ancestor of getProperAncestors(head, undefined)) {
    if (tail.every(sn => isDescendant(sn, ancestor))) {
      return ancestor;
    }
  }
}
function getEffectiveTargetStates(transition, historyValue) {
  if (!transition.target) {
    return [];
  }
  const targets = new Set();
  for (const targetNode of transition.target) {
    if (isHistoryNode(targetNode)) {
      if (historyValue[targetNode.id]) {
        for (const node of historyValue[targetNode.id]) {
          targets.add(node);
        }
      } else {
        for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) {
          targets.add(node);
        }
      }
    } else {
      targets.add(targetNode);
    }
  }
  return [...targets];
}
function getTransitionDomain(transition, historyValue) {
  const targetStates = getEffectiveTargetStates(transition, historyValue);
  if (!targetStates) {
    return;
  }
  if (!transition.reenter && targetStates.every(target => target === transition.source || isDescendant(target, transition.source))) {
    return transition.source;
  }
  const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
  if (lca) {
    return lca;
  }

  // at this point we know that it's a root transition since LCA couldn't be found
  if (transition.reenter) {
    return;
  }
  return transition.source.machine.root;
}
function computeExitSet(transitions, stateNodeSet, historyValue) {
  const statesToExit = new Set();
  for (const t of transitions) {
    if (t.target?.length) {
      const domain = getTransitionDomain(t, historyValue);
      if (t.reenter && t.source === domain) {
        statesToExit.add(domain);
      }
      for (const stateNode of stateNodeSet) {
        if (isDescendant(stateNode, domain)) {
          statesToExit.add(stateNode);
        }
      }
    }
  }
  return [...statesToExit];
}
function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
  if (prevStateNodes.length !== nextStateNodeSet.size) {
    return false;
  }
  for (const node of prevStateNodes) {
    if (!nextStateNodeSet.has(node)) {
      return false;
    }
  }
  return true;
}

/** https://www.w3.org/TR/scxml/#microstepProcedure */
function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
  if (!transitions.length) {
    return currentSnapshot;
  }
  const mutStateNodeSet = new Set(currentSnapshot._nodes);
  let historyValue = currentSnapshot.historyValue;
  const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
  let nextState = currentSnapshot;

  // Exit states
  if (!isInitial) {
    [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue);
  }

  // Execute transition content
  nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap(t => t.actions), internalQueue, undefined);

  // Enter states
  nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
  const nextStateNodes = [...mutStateNodeSet];
  if (nextState.status === 'done') {
    nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a, b) => b.order - a.order).flatMap(state => state.exit), internalQueue, undefined);
  }

  // eslint-disable-next-line no-useless-catch
  try {
    if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) {
      return nextState;
    }
    return cloneMachineSnapshot(nextState, {
      _nodes: nextStateNodes,
      historyValue
    });
  } catch (e) {
    // TODO: Refactor this once proper error handling is implemented.
    // See https://github.com/statelyai/rfcs/pull/4
    throw e;
  }
}
function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
  if (rootNode.output === undefined) {
    return;
  }
  const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== undefined && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : undefined);
  return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
}
function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
  let nextSnapshot = currentSnapshot;
  const statesToEnter = new Set();
  // those are states that were directly targeted or indirectly targeted by the explicit target
  // in other words, those are states for which initial actions should be executed
  // when we target `#deep_child` initial actions of its ancestors shouldn't be executed
  const statesForDefaultEntry = new Set();
  computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);

  // In the initial state, the root state node is "entered".
  if (isInitial) {
    statesForDefaultEntry.add(currentSnapshot.machine.root);
  }
  const completedNodes = new Set();
  for (const stateNodeToEnter of [...statesToEnter].sort((a, b) => a.order - b.order)) {
    mutStateNodeSet.add(stateNodeToEnter);
    const actions = [];

    // Add entry actions
    actions.push(...stateNodeToEnter.entry);
    for (const invokeDef of stateNodeToEnter.invoke) {
      actions.push(spawnChild(invokeDef.src, {
        ...invokeDef,
        syncSnapshot: !!invokeDef.onSnapshot
      }));
    }
    if (statesForDefaultEntry.has(stateNodeToEnter)) {
      const initialActions = stateNodeToEnter.initial.actions;
      actions.push(...initialActions);
    }
    nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions, internalQueue, stateNodeToEnter.invoke.map(invokeDef => invokeDef.id));
    if (stateNodeToEnter.type === 'final') {
      const parent = stateNodeToEnter.parent;
      let ancestorMarker = parent?.type === 'parallel' ? parent : parent?.parent;
      let rootCompletionNode = ancestorMarker || stateNodeToEnter;
      if (parent?.type === 'compound') {
        internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== undefined ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : undefined));
      }
      while (ancestorMarker?.type === 'parallel' && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
        completedNodes.add(ancestorMarker);
        internalQueue.push(createDoneStateEvent(ancestorMarker.id));
        rootCompletionNode = ancestorMarker;
        ancestorMarker = ancestorMarker.parent;
      }
      if (ancestorMarker) {
        continue;
      }
      nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
        status: 'done',
        output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
      });
    }
  }
  return nextSnapshot;
}
function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
  for (const t of transitions) {
    const domain = getTransitionDomain(t, historyValue);
    for (const s of t.target || []) {
      if (!isHistoryNode(s) && (
      // if the target is different than the source then it will *definitely* be entered
      t.source !== s ||
      // we know that the domain can't lie within the source
      // if it's different than the source then it's outside of it and it means that the target has to be entered as well
      t.source !== domain ||
      // reentering transitions always enter the target, even if it's the source itself
      t.reenter)) {
        statesToEnter.add(s);
        statesForDefaultEntry.add(s);
      }
      addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
    }
    const targetStates = getEffectiveTargetStates(t, historyValue);
    for (const s of targetStates) {
      const ancestors = getProperAncestors(s, domain);
      if (domain?.type === 'parallel') {
        ancestors.push(domain);
      }
      addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t.source.parent && t.reenter ? undefined : domain);
    }
  }
}
function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
  if (isHistoryNode(stateNode)) {
    if (historyValue[stateNode.id]) {
      const historyStateNodes = historyValue[stateNode.id];
      for (const s of historyStateNodes) {
        statesToEnter.add(s);
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      for (const s of historyStateNodes) {
        addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
      }
    } else {
      const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
      for (const s of historyDefaultTransition.target) {
        statesToEnter.add(s);
        if (historyDefaultTransition === stateNode.parent?.initial) {
          statesForDefaultEntry.add(stateNode.parent);
        }
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      for (const s of historyDefaultTransition.target) {
        addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
      }
    }
  } else {
    if (stateNode.type === 'compound') {
      const [initialState] = stateNode.initial.target;
      if (!isHistoryNode(initialState)) {
        statesToEnter.add(initialState);
        statesForDefaultEntry.add(initialState);
      }
      addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
      addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
    } else {
      if (stateNode.type === 'parallel') {
        for (const child of getChildren(stateNode).filter(sn => !isHistoryNode(sn))) {
          if (![...statesToEnter].some(s => isDescendant(s, child))) {
            if (!isHistoryNode(child)) {
              statesToEnter.add(child);
              statesForDefaultEntry.add(child);
            }
            addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
          }
        }
      }
    }
  }
}
function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
  for (const anc of ancestors) {
    if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) {
      statesToEnter.add(anc);
    }
    if (anc.type === 'parallel') {
      for (const child of getChildren(anc).filter(sn => !isHistoryNode(sn))) {
        if (![...statesToEnter].some(s => isDescendant(s, child))) {
          statesToEnter.add(child);
          addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
        }
      }
    }
  }
}
function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
  addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
}
function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
  let nextSnapshot = currentSnapshot;
  const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
  statesToExit.sort((a, b) => b.order - a.order);
  let changedHistory;

  // From SCXML algorithm: https://www.w3.org/TR/scxml/#exitStates
  for (const exitStateNode of statesToExit) {
    for (const historyNode of getHistoryNodes(exitStateNode)) {
      let predicate;
      if (historyNode.history === 'deep') {
        predicate = sn => isAtomicStateNode(sn) && isDescendant(sn, exitStateNode);
      } else {
        predicate = sn => {
          return sn.parent === exitStateNode;
        };
      }
      changedHistory ??= {
        ...historyValue
      };
      changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
    }
  }
  for (const s of statesToExit) {
    nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s.exit, ...s.invoke.map(def => stopChild(def.id))], internalQueue, undefined);
    mutStateNodeSet.delete(s);
  }
  return [nextSnapshot, changedHistory || historyValue];
}
function getAction(machine, actionType) {
  return machine.implementations.actions[actionType];
}
function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, extra, retries) {
  const {
    machine
  } = currentSnapshot;
  let intermediateSnapshot = currentSnapshot;
  for (const action of actions) {
    const isInline = typeof action === 'function';
    const resolvedAction = isInline ? action :
    // the existing type of `.actions` assumes non-nullable `TExpressionAction`
    // it's fine to cast this here to get a common type and lack of errors in the rest of the code
    // our logic below makes sure that we call those 2 "variants" correctly

    getAction(machine, typeof action === 'string' ? action : action.type);
    const actionArgs = {
      context: intermediateSnapshot.context,
      event,
      self: actorScope.self,
      system: actorScope.system
    };
    const actionParams = isInline || typeof action === 'string' ? undefined : 'params' in action ? typeof action.params === 'function' ? action.params({
      context: intermediateSnapshot.context,
      event
    }) : action.params : undefined;
    if (!resolvedAction || !('resolve' in resolvedAction)) {
      actorScope.actionExecutor({
        type: typeof action === 'string' ? action : typeof action === 'object' ? action.type : action.name || '(anonymous)',
        info: actionArgs,
        params: actionParams,
        exec: resolvedAction
      });
      continue;
    }
    const builtinAction = resolvedAction;
    const [nextState, params, actions] = builtinAction.resolve(actorScope, intermediateSnapshot, actionArgs, actionParams, resolvedAction,
    // this holds all params
    extra);
    intermediateSnapshot = nextState;
    if ('retryResolve' in builtinAction) {
      retries?.push([builtinAction, params]);
    }
    if ('execute' in builtinAction) {
      actorScope.actionExecutor({
        type: builtinAction.type,
        info: actionArgs,
        params,
        exec: builtinAction.execute.bind(null, actorScope, params)
      });
    }
    if (actions) {
      intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions, extra, retries);
    }
  }
  return intermediateSnapshot;
}
function resolveActionsAndContext(currentSnapshot, event, actorScope, actions, internalQueue, deferredActorIds) {
  const retries = deferredActorIds ? [] : undefined;
  const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, {
    internalQueue,
    deferredActorIds
  }, retries);
  retries?.forEach(([builtinAction, params]) => {
    builtinAction.retryResolve(actorScope, nextState, params);
  });
  return nextState;
}
function macrostep(snapshot, event, actorScope, internalQueue) {
  let nextSnapshot = snapshot;
  const microstates = [];
  function addMicrostate(microstate, event, transitions) {
    actorScope.system._sendInspectionEvent({
      type: '@xstate.microstep',
      actorRef: actorScope.self,
      event,
      snapshot: microstate,
      _transitions: transitions
    });
    microstates.push(microstate);
  }

  // Handle stop event
  if (event.type === XSTATE_STOP) {
    nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), {
      status: 'stopped'
    });
    addMicrostate(nextSnapshot, event, []);
    return {
      snapshot: nextSnapshot,
      microstates
    };
  }
  let nextEvent = event;

  // Assume the state is at rest (no raised events)
  // Determine the next state based on the next microstep
  if (nextEvent.type !== XSTATE_INIT) {
    const currentEvent = nextEvent;
    const isErr = isErrorActorEvent(currentEvent);
    const transitions = selectTransitions(currentEvent, nextSnapshot);
    if (isErr && !transitions.length) {
      // TODO: we should likely only allow transitions selected by very explicit descriptors
      // `*` shouldn't be matched, likely `xstate.error.*` shouldnt be either
      // similarly `xstate.error.actor.*` and `xstate.error.actor.todo.*` have to be considered too
      nextSnapshot = cloneMachineSnapshot(snapshot, {
        status: 'error',
        error: currentEvent.error
      });
      addMicrostate(nextSnapshot, currentEvent, []);
      return {
        snapshot: nextSnapshot,
        microstates
      };
    }
    nextSnapshot = microstep(transitions, snapshot, actorScope, nextEvent, false,
    // isInitial
    internalQueue);
    addMicrostate(nextSnapshot, currentEvent, transitions);
  }
  let shouldSelectEventlessTransitions = true;
  while (nextSnapshot.status === 'active') {
    let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];

    // eventless transitions should always be selected after selecting *regular* transitions
    // by assigning `undefined` to `previousState` we ensure that `shouldSelectEventlessTransitions` gets always computed to true in such a case
    const previousState = enabledTransitions.length ? nextSnapshot : undefined;
    if (!enabledTransitions.length) {
      if (!internalQueue.length) {
        break;
      }
      nextEvent = internalQueue.shift();
      enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
    }
    nextSnapshot = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
    shouldSelectEventlessTransitions = nextSnapshot !== previousState;
    addMicrostate(nextSnapshot, nextEvent, enabledTransitions);
  }
  if (nextSnapshot.status !== 'active') {
    stopChildren(nextSnapshot, nextEvent, actorScope);
  }
  return {
    snapshot: nextSnapshot,
    microstates
  };
}
function stopChildren(nextState, event, actorScope) {
  return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map(child => stopChild(child)), [], undefined);
}
function selectTransitions(event, nextState) {
  return nextState.machine.getTransitionData(nextState, event);
}
function selectEventlessTransitions(nextState, event) {
  const enabledTransitionSet = new Set();
  const atomicStates = nextState._nodes.filter(isAtomicStateNode);
  for (const stateNode of atomicStates) {
    loop: for (const s of [stateNode].concat(getProperAncestors(stateNode, undefined))) {
      if (!s.always) {
        continue;
      }
      for (const transition of s.always) {
        if (transition.guard === undefined || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
          enabledTransitionSet.add(transition);
          break loop;
        }
      }
    }
  }
  return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
}

/**
 * Resolves a partial state value with its full representation in the state
 * node's machine.
 *
 * @param stateValue The partial state value to resolve.
 */
function resolveStateValue(rootNode, stateValue) {
  const allStateNodes = getAllStateNodes(getStateNodes(rootNode, stateValue));
  return getStateValue(rootNode, [...allStateNodes]);
}

function isMachineSnapshot(value) {
  return !!value && typeof value === 'object' && 'machine' in value && 'value' in value;
}
const machineSnapshotMatches = function matches(testValue) {
  return matchesState(testValue, this.value);
};
const machineSnapshotHasTag = function hasTag(tag) {
  return this.tags.has(tag);
};
const machineSnapshotCan = function can(event) {
  const transitionData = this.machine.getTransitionData(this, event);
  return !!transitionData?.length &&
  // Check that at least one transition is not forbidden
  transitionData.some(t => t.target !== undefined || t.actions.length);
};
const machineSnapshotToJSON = function toJSON() {
  const {
    _nodes: nodes,
    tags,
    machine,
    getMeta,
    toJSON,
    can,
    hasTag,
    matches,
    ...jsonValues
  } = this;
  return {
    ...jsonValues,
    tags: Array.from(tags)
  };
};
const machineSnapshotGetMeta = function getMeta() {
  return this._nodes.reduce((acc, stateNode) => {
    if (stateNode.meta !== undefined) {
      acc[stateNode.id] = stateNode.meta;
    }
    return acc;
  }, {});
};
function createMachineSnapshot(config, machine) {
  return {
    status: config.status,
    output: config.output,
    error: config.error,
    machine,
    context: config.context,
    _nodes: config._nodes,
    value: getStateValue(machine.root, config._nodes),
    tags: new Set(config._nodes.flatMap(sn => sn.tags)),
    children: config.children,
    historyValue: config.historyValue || {},
    matches: machineSnapshotMatches,
    hasTag: machineSnapshotHasTag,
    can: machineSnapshotCan,
    getMeta: machineSnapshotGetMeta,
    toJSON: machineSnapshotToJSON
  };
}
function cloneMachineSnapshot(snapshot, config = {}) {
  return createMachineSnapshot({
    ...snapshot,
    ...config
  }, snapshot.machine);
}
function getPersistedSnapshot(snapshot, options) {
  const {
    _nodes: nodes,
    tags,
    machine,
    children,
    context,
    can,
    hasTag,
    matches,
    getMeta,
    toJSON,
    ...jsonValues
  } = snapshot;
  const childrenJson = {};
  for (const id in children) {
    const child = children[id];
    childrenJson[id] = {
      snapshot: child.getPersistedSnapshot(options),
      src: child.src,
      systemId: child._systemId,
      syncSnapshot: child._syncSnapshot
    };
  }
  const persisted = {
    ...jsonValues,
    context: persistContext(context),
    children: childrenJson
  };
  return persisted;
}
function persistContext(contextPart) {
  let copy;
  for (const key in contextPart) {
    const value = contextPart[key];
    if (value && typeof value === 'object') {
      if ('sessionId' in value && 'send' in value && 'ref' in value) {
        copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
          ...contextPart
        };
        copy[key] = {
          xstate$$type: $$ACTOR_TYPE,
          id: value.id
        };
      } else {
        const result = persistContext(value);
        if (result !== value) {
          copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
            ...contextPart
          };
          copy[key] = result;
        }
      }
    }
  }
  return copy ?? contextPart;
}

function resolveRaise(_, snapshot, args, actionParams, {
  event: eventOrExpr,
  id,
  delay
}, {
  internalQueue
}) {
  const delaysMap = snapshot.machine.implementations.delays;
  if (typeof eventOrExpr === 'string') {
    throw new Error(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`);
  }
  const resolvedEvent = typeof eventOrExpr === 'function' ? eventOrExpr(args, actionParams) : eventOrExpr;
  let resolvedDelay;
  if (typeof delay === 'string') {
    const configDelay = delaysMap && delaysMap[delay];
    resolvedDelay = typeof configDelay === 'function' ? configDelay(args, actionParams) : configDelay;
  } else {
    resolvedDelay = typeof delay === 'function' ? delay(args, actionParams) : delay;
  }
  if (typeof resolvedDelay !== 'number') {
    internalQueue.push(resolvedEvent);
  }
  return [snapshot, {
    event: resolvedEvent,
    id,
    delay: resolvedDelay
  }, undefined];
}
function executeRaise(actorScope, params) {
  const {
    event,
    delay,
    id
  } = params;
  if (typeof delay === 'number') {
    actorScope.defer(() => {
      const self = actorScope.self;
      actorScope.system.scheduler.schedule(self, self, event, delay, id);
    });
    return;
  }
}
/**
 * Raises an event. This places the event in the internal event queue, so that
 * the event is immediately consumed by the machine in the current step.
 *
 * @param eventType The event to raise.
 */
function raise(eventOrExpr, options) {
  function raise(_args, _params) {
  }
  raise.type = 'xstate.raise';
  raise.event = eventOrExpr;
  raise.id = options?.id;
  raise.delay = options?.delay;
  raise.resolve = resolveRaise;
  raise.execute = executeRaise;
  return raise;
}

const XSTATE_PROMISE_RESOLVE = 'xstate.promise.resolve';
const XSTATE_PROMISE_REJECT = 'xstate.promise.reject';

/**
 * Represents an actor created by `fromPromise`.
 *
 * The type of `self` within the actor's logic.
 *
 * @example
 *
 * ```ts
 * import { fromPromise, createActor } from 'xstate';
 *
 * // The actor's resolved output
 * type Output = string;
 * // The actor's input.
 * type Input = { message: string };
 *
 * // Actor logic that fetches the url of an image of a cat saying `input.message`.
 * const logic = fromPromise<Output, Input>(async ({ input, self }) => {
 *   self;
 *   // ^? PromiseActorRef<Output, Input>
 *
 *   const data = await fetch(
 *     `https://cataas.com/cat/says/${input.message}`
 *   );
 *   const url = await data.json();
 *   return url;
 * });
 *
 * const actor = createActor(logic, { input: { message: 'hello world' } });
 * //    ^? PromiseActorRef<Output, Input>
 * ```
 *
 * @see {@link fromPromise}
 */

const controllerMap = new WeakMap();

/**
 * An actor logic creator which returns promise logic as defined by an async
 * process that resolves or rejects after some time.
 *
 * Actors created from promise actor logic (“promise actors”) can:
 *
 * - Emit the resolved value of the promise
 * - Output the resolved value of the promise
 *
 * Sending events to promise actors will have no effect.
 *
 * @example
 *
 * ```ts
 * const promiseLogic = fromPromise(async () => {
 *   const result = await fetch('https://example.com/...').then((data) =>
 *     data.json()
 *   );
 *
 *   return result;
 * });
 *
 * const promiseActor = createActor(promiseLogic);
 * promiseActor.subscribe((snapshot) => {
 *   console.log(snapshot);
 * });
 * promiseActor.start();
 * // => {
 * //   output: undefined,
 * //   status: 'active'
 * //   ...
 * // }
 *
 * // After promise resolves
 * // => {
 * //   output: { ... },
 * //   status: 'done',
 * //   ...
 * // }
 * ```
 *
 * @param promiseCreator A function which returns a Promise, and accepts an
 *   object with the following properties:
 *
 *   - `input` - Data that was provided to the promise actor
 *   - `self` - The parent actor of the promise actor
 *   - `system` - The actor system to which the promise actor belongs
 *
 * @see {@link https://stately.ai/docs/input | Input docs} for more information about how input is passed
 */
function fromPromise(promiseCreator) {
  const logic = {
    config: promiseCreator,
    transition: (state, event, scope) => {
      if (state.status !== 'active') {
        return state;
      }
      switch (event.type) {
        case XSTATE_PROMISE_RESOLVE:
          {
            const resolvedValue = event.data;
            return {
              ...state,
              status: 'done',
              output: resolvedValue,
              input: undefined
            };
          }
        case XSTATE_PROMISE_REJECT:
          return {
            ...state,
            status: 'error',
            error: event.data,
            input: undefined
          };
        case XSTATE_STOP:
          {
            controllerMap.get(scope.self)?.abort();
            return {
              ...state,
              status: 'stopped',
              input: undefined
            };
          }
        default:
          return state;
      }
    },
    start: (state, {
      self,
      system,
      emit
    }) => {
      // TODO: determine how to allow customizing this so that promises
      // can be restarted if necessary
      if (state.status !== 'active') {
        return;
      }
      const controller = new AbortController();
      controllerMap.set(self, controller);
      const resolvedPromise = Promise.resolve(promiseCreator({
        input: state.input,
        system,
        self,
        signal: controller.signal,
        emit
      }));
      resolvedPromise.then(response => {
        if (self.getSnapshot().status !== 'active') {
          return;
        }
        controllerMap.delete(self);
        system._relay(self, self, {
          type: XSTATE_PROMISE_RESOLVE,
          data: response
        });
      }, errorData => {
        if (self.getSnapshot().status !== 'active') {
          return;
        }
        controllerMap.delete(self);
        system._relay(self, self, {
          type: XSTATE_PROMISE_REJECT,
          data: errorData
        });
      });
    },
    getInitialSnapshot: (_, input) => {
      return {
        status: 'active',
        output: undefined,
        error: undefined,
        input
      };
    },
    getPersistedSnapshot: snapshot => snapshot,
    restoreSnapshot: snapshot => snapshot
  };
  return logic;
}

function createSpawner(actorScope, {
  machine,
  context
}, event, spawnedChildren) {
  const spawn = (src, options) => {
    if (typeof src === 'string') {
      const logic = resolveReferencedActor(machine, src);
      if (!logic) {
        throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
      }
      const actorRef = createActor(logic, {
        id: options?.id,
        parent: actorScope.self,
        syncSnapshot: options?.syncSnapshot,
        input: typeof options?.input === 'function' ? options.input({
          context,
          event,
          self: actorScope.self
        }) : options?.input,
        src,
        systemId: options?.systemId
      });
      spawnedChildren[actorRef.id] = actorRef;
      return actorRef;
    } else {
      const actorRef = createActor(src, {
        id: options?.id,
        parent: actorScope.self,
        syncSnapshot: options?.syncSnapshot,
        input: options?.input,
        src,
        systemId: options?.systemId
      });
      return actorRef;
    }
  };
  return (src, options) => {
    const actorRef = spawn(src, options); // TODO: fix types
    spawnedChildren[actorRef.id] = actorRef;
    actorScope.defer(() => {
      if (actorRef._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      actorRef.start();
    });
    return actorRef;
  };
}

function resolveAssign(actorScope, snapshot, actionArgs, actionParams, {
  assignment
}) {
  if (!snapshot.context) {
    throw new Error('Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.');
  }
  const spawnedChildren = {};
  const assignArgs = {
    context: snapshot.context,
    event: actionArgs.event,
    spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
    self: actorScope.self,
    system: actorScope.system
  };
  let partialUpdate = {};
  if (typeof assignment === 'function') {
    partialUpdate = assignment(assignArgs, actionParams);
  } else {
    for (const key of Object.keys(assignment)) {
      const propAssignment = assignment[key];
      partialUpdate[key] = typeof propAssignment === 'function' ? propAssignment(assignArgs, actionParams) : propAssignment;
    }
  }
  const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
  return [cloneMachineSnapshot(snapshot, {
    context: updatedContext,
    children: Object.keys(spawnedChildren).length ? {
      ...snapshot.children,
      ...spawnedChildren
    } : snapshot.children
  }), undefined, undefined];
}
/**
 * Updates the current context of the machine.
 *
 * @example
 *
 * ```ts
 * import { createMachine, assign } from 'xstate';
 *
 * const countMachine = createMachine({
 *   context: {
 *     count: 0,
 *     message: ''
 *   },
 *   on: {
 *     inc: {
 *       actions: assign({
 *         count: ({ context }) => context.count + 1
 *       })
 *     },
 *     updateMessage: {
 *       actions: assign(({ context, event }) => {
 *         return {
 *           message: event.message.trim()
 *         };
 *       })
 *     }
 *   }
 * });
 * ```
 *
 * @param assignment An object that represents the partial context to update, or
 *   a function that returns an object that represents the partial context to
 *   update.
 */
function assign(assignment) {
  function assign(_args, _params) {
  }
  assign.type = 'xstate.assign';
  assign.assignment = assignment;
  assign.resolve = resolveAssign;
  return assign;
}

const cache = new WeakMap();
function memo(object, key, fn) {
  let memoizedData = cache.get(object);
  if (!memoizedData) {
    memoizedData = {
      [key]: fn()
    };
    cache.set(object, memoizedData);
  } else if (!(key in memoizedData)) {
    memoizedData[key] = fn();
  }
  return memoizedData[key];
}

const EMPTY_OBJECT = {};
const toSerializableAction = action => {
  if (typeof action === 'string') {
    return {
      type: action
    };
  }
  if (typeof action === 'function') {
    if ('resolve' in action) {
      return {
        type: action.type
      };
    }
    return {
      type: action.name
    };
  }
  return action;
};
class StateNode {
  constructor(/** The raw config used to create the machine. */
  config, options) {
    this.config = config;
    /**
     * The relative key of the state node, which represents its location in the
     * overall state value.
     */
    this.key = void 0;
    /** The unique ID of the state node. */
    this.id = void 0;
    /**
     * The type of this state node:
     *
     * - `'atomic'` - no child state nodes
     * - `'compound'` - nested child state nodes (XOR)
     * - `'parallel'` - orthogonal nested child state nodes (AND)
     * - `'history'` - history state node
     * - `'final'` - final state node
     */
    this.type = void 0;
    /** The string path from the root machine node to this node. */
    this.path = void 0;
    /** The child state nodes. */
    this.states = void 0;
    /**
     * The type of history on this state node. Can be:
     *
     * - `'shallow'` - recalls only top-level historical state value
     * - `'deep'` - recalls historical state value at all levels
     */
    this.history = void 0;
    /** The action(s) to be executed upon entering the state node. */
    this.entry = void 0;
    /** The action(s) to be executed upon exiting the state node. */
    this.exit = void 0;
    /** The parent state node. */
    this.parent = void 0;
    /** The root machine node. */
    this.machine = void 0;
    /**
     * The meta data associated with this state node, which will be returned in
     * State instances.
     */
    this.meta = void 0;
    /**
     * The output data sent with the "xstate.done.state._id_" event if this is a
     * final state node.
     */
    this.output = void 0;
    /**
     * The order this state node appears. Corresponds to the implicit document
     * order.
     */
    this.order = -1;
    this.description = void 0;
    this.tags = [];
    this.transitions = void 0;
    this.always = void 0;
    this.parent = options._parent;
    this.key = options._key;
    this.machine = options._machine;
    this.path = this.parent ? this.parent.path.concat(this.key) : [];
    this.id = this.config.id || [this.machine.id, ...this.path].join(STATE_DELIMITER);
    this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? 'compound' : this.config.history ? 'history' : 'atomic');
    this.description = this.config.description;
    this.order = this.machine.idMap.size;
    this.machine.idMap.set(this.id, this);
    this.states = this.config.states ? mapValues(this.config.states, (stateConfig, key) => {
      const stateNode = new StateNode(stateConfig, {
        _parent: this,
        _key: key,
        _machine: this.machine
      });
      return stateNode;
    }) : EMPTY_OBJECT;
    if (this.type === 'compound' && !this.config.initial) {
      throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
    }

    // History config
    this.history = this.config.history === true ? 'shallow' : this.config.history || false;
    this.entry = toArray(this.config.entry).slice();
    this.exit = toArray(this.config.exit).slice();
    this.meta = this.config.meta;
    this.output = this.type === 'final' || !this.parent ? this.config.output : undefined;
    this.tags = toArray(config.tags).slice();
  }

  /** @internal */
  _initialize() {
    this.transitions = formatTransitions(this);
    if (this.config.always) {
      this.always = toTransitionConfigArray(this.config.always).map(t => formatTransition(this, NULL_EVENT, t));
    }
    Object.keys(this.states).forEach(key => {
      this.states[key]._initialize();
    });
  }

  /** The well-structured state node definition. */
  get definition() {
    return {
      id: this.id,
      key: this.key,
      version: this.machine.version,
      type: this.type,
      initial: this.initial ? {
        target: this.initial.target,
        source: this,
        actions: this.initial.actions.map(toSerializableAction),
        eventType: null,
        reenter: false,
        toJSON: () => ({
          target: this.initial.target.map(t => `#${t.id}`),
          source: `#${this.id}`,
          actions: this.initial.actions.map(toSerializableAction),
          eventType: null
        })
      } : undefined,
      history: this.history,
      states: mapValues(this.states, state => {
        return state.definition;
      }),
      on: this.on,
      transitions: [...this.transitions.values()].flat().map(t => ({
        ...t,
        actions: t.actions.map(toSerializableAction)
      })),
      entry: this.entry.map(toSerializableAction),
      exit: this.exit.map(toSerializableAction),
      meta: this.meta,
      order: this.order || -1,
      output: this.output,
      invoke: this.invoke,
      description: this.description,
      tags: this.tags
    };
  }

  /** @internal */
  toJSON() {
    return this.definition;
  }

  /** The logic invoked as actors by this state node. */
  get invoke() {
    return memo(this, 'invoke', () => toArray(this.config.invoke).map((invokeConfig, i) => {
      const {
        src,
        systemId
      } = invokeConfig;
      const resolvedId = invokeConfig.id ?? createInvokeId(this.id, i);
      const sourceName = typeof src === 'string' ? src : `xstate.invoke.${createInvokeId(this.id, i)}`;
      return {
        ...invokeConfig,
        src: sourceName,
        id: resolvedId,
        systemId: systemId,
        toJSON() {
          const {
            onDone,
            onError,
            ...invokeDefValues
          } = invokeConfig;
          return {
            ...invokeDefValues,
            type: 'xstate.invoke',
            src: sourceName,
            id: resolvedId
          };
        }
      };
    }));
  }

  /** The mapping of events to transitions. */
  get on() {
    return memo(this, 'on', () => {
      const transitions = this.transitions;
      return [...transitions].flatMap(([descriptor, t]) => t.map(t => [descriptor, t])).reduce((map, [descriptor, transition]) => {
        map[descriptor] = map[descriptor] || [];
        map[descriptor].push(transition);
        return map;
      }, {});
    });
  }
  get after() {
    return memo(this, 'delayedTransitions', () => getDelayedTransitions(this));
  }
  get initial() {
    return memo(this, 'initial', () => formatInitialTransition(this, this.config.initial));
  }

  /** @internal */
  next(snapshot, event) {
    const eventType = event.type;
    let selectedTransition;
    const candidates = memo(this, `candidates-${eventType}`, () => getCandidates(this, eventType));
    for (const candidate of candidates) {
      const {
        guard
      } = candidate;
      const resolvedContext = snapshot.context;
      let guardPassed = false;
      try {
        guardPassed = !guard || evaluateGuard(guard, resolvedContext, event, snapshot);
      } catch (err) {
        const guardType = typeof guard === 'string' ? guard : typeof guard === 'object' ? guard.type : undefined;
        throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ''}in transition for event '${eventType}' in state node '${this.id}':\n${err.message}`);
      }
      if (guardPassed) {
        selectedTransition = candidate;
        break;
      }
    }
    return selectedTransition ? [selectedTransition] : undefined;
  }

  /** All the event types accepted by this state node and its descendants. */
  get events() {
    return memo(this, 'events', () => {
      const {
        states
      } = this;
      const events = new Set(this.ownEvents);
      if (states) {
        for (const stateId of Object.keys(states)) {
          const state = states[stateId];
          if (state.states) {
            for (const event of state.events) {
              events.add(`${event}`);
            }
          }
        }
      }
      return Array.from(events);
    });
  }

  /**
   * All the events that have transitions directly from this state node.
   *
   * Excludes any inert events.
   */
  get ownEvents() {
    const events = new Set([...this.transitions.keys()].filter(descriptor => {
      return this.transitions.get(descriptor).some(transition => !(!transition.target && !transition.actions.length && !transition.reenter));
    }));
    return Array.from(events);
  }
}

const STATE_IDENTIFIER = '#';
class StateMachine {
  constructor(/** The raw config used to create the machine. */
  config, implementations) {
    this.config = config;
    /** The machine's own version. */
    this.version = void 0;
    this.schemas = void 0;
    this.implementations = void 0;
    /** @internal */
    this.__xstatenode = true;
    /** @internal */
    this.idMap = new Map();
    this.root = void 0;
    this.id = void 0;
    this.states = void 0;
    this.events = void 0;
    this.id = config.id || '(machine)';
    this.implementations = {
      actors: implementations?.actors ?? {},
      actions: implementations?.actions ?? {},
      delays: implementations?.delays ?? {},
      guards: implementations?.guards ?? {}
    };
    this.version = this.config.version;
    this.schemas = this.config.schemas;
    this.transition = this.transition.bind(this);
    this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
    this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
    this.restoreSnapshot = this.restoreSnapshot.bind(this);
    this.start = this.start.bind(this);
    this.root = new StateNode(config, {
      _key: this.id,
      _machine: this
    });
    this.root._initialize();
    this.states = this.root.states; // TODO: remove!
    this.events = this.root.events;
  }

  /**
   * Clones this state machine with the provided implementations and merges the
   * `context` (if provided).
   *
   * @param implementations Options (`actions`, `guards`, `actors`, `delays`,
   *   `context`) to recursively merge with the existing options.
   * @returns A new `StateMachine` instance with the provided implementations.
   */
  provide(implementations) {
    const {
      actions,
      guards,
      actors,
      delays
    } = this.implementations;
    return new StateMachine(this.config, {
      actions: {
        ...actions,
        ...implementations.actions
      },
      guards: {
        ...guards,
        ...implementations.guards
      },
      actors: {
        ...actors,
        ...implementations.actors
      },
      delays: {
        ...delays,
        ...implementations.delays
      }
    });
  }
  resolveState(config) {
    const resolvedStateValue = resolveStateValue(this.root, config.value);
    const nodeSet = getAllStateNodes(getStateNodes(this.root, resolvedStateValue));
    return createMachineSnapshot({
      _nodes: [...nodeSet],
      context: config.context || {},
      children: {},
      status: isInFinalState(nodeSet, this.root) ? 'done' : config.status || 'active',
      output: config.output,
      error: config.error,
      historyValue: config.historyValue
    }, this);
  }

  /**
   * Determines the next snapshot given the current `snapshot` and received
   * `event`. Calculates a full macrostep from all microsteps.
   *
   * @param snapshot The current snapshot
   * @param event The received event
   */
  transition(snapshot, event, actorScope) {
    return macrostep(snapshot, event, actorScope, []).snapshot;
  }

  /**
   * Determines the next state given the current `state` and `event`. Calculates
   * a microstep.
   *
   * @param state The current state
   * @param event The received event
   */
  microstep(snapshot, event, actorScope) {
    return macrostep(snapshot, event, actorScope, []).microstates;
  }
  getTransitionData(snapshot, event) {
    return transitionNode(this.root, snapshot.value, snapshot, event) || [];
  }

  /**
   * The initial state _before_ evaluating any microsteps. This "pre-initial"
   * state is provided to initial actions executed in the initial state.
   */
  getPreInitialState(actorScope, initEvent, internalQueue) {
    const {
      context
    } = this.config;
    const preInitial = createMachineSnapshot({
      context: typeof context !== 'function' && context ? context : {},
      _nodes: [this.root],
      children: {},
      status: 'active'
    }, this);
    if (typeof context === 'function') {
      const assignment = ({
        spawn,
        event,
        self
      }) => context({
        spawn,
        input: event.input,
        self
      });
      return resolveActionsAndContext(preInitial, initEvent, actorScope, [assign(assignment)], internalQueue, undefined);
    }
    return preInitial;
  }

  /**
   * Returns the initial `State` instance, with reference to `self` as an
   * `ActorRef`.
   */
  getInitialSnapshot(actorScope, input) {
    const initEvent = createInitEvent(input); // TODO: fix;
    const internalQueue = [];
    const preInitialState = this.getPreInitialState(actorScope, initEvent, internalQueue);
    const nextState = microstep([{
      target: [...getInitialStateNodes(this.root)],
      source: this.root,
      reenter: true,
      actions: [],
      eventType: null,
      toJSON: null // TODO: fix
    }], preInitialState, actorScope, initEvent, true, internalQueue);
    const {
      snapshot: macroState
    } = macrostep(nextState, initEvent, actorScope, internalQueue);
    return macroState;
  }
  start(snapshot) {
    Object.values(snapshot.children).forEach(child => {
      if (child.getSnapshot().status === 'active') {
        child.start();
      }
    });
  }
  getStateNodeById(stateId) {
    const fullPath = toStatePath(stateId);
    const relativePath = fullPath.slice(1);
    const resolvedStateId = isStateId(fullPath[0]) ? fullPath[0].slice(STATE_IDENTIFIER.length) : fullPath[0];
    const stateNode = this.idMap.get(resolvedStateId);
    if (!stateNode) {
      throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
    }
    return getStateNodeByPath(stateNode, relativePath);
  }
  get definition() {
    return this.root.definition;
  }
  toJSON() {
    return this.definition;
  }
  getPersistedSnapshot(snapshot, options) {
    return getPersistedSnapshot(snapshot, options);
  }
  restoreSnapshot(snapshot, _actorScope) {
    const children = {};
    const snapshotChildren = snapshot.children;
    Object.keys(snapshotChildren).forEach(actorId => {
      const actorData = snapshotChildren[actorId];
      const childState = actorData.snapshot;
      const src = actorData.src;
      const logic = typeof src === 'string' ? resolveReferencedActor(this, src) : src;
      if (!logic) {
        return;
      }
      const actorRef = createActor(logic, {
        id: actorId,
        parent: _actorScope.self,
        syncSnapshot: actorData.syncSnapshot,
        snapshot: childState,
        src,
        systemId: actorData.systemId
      });
      children[actorId] = actorRef;
    });
    const restoredSnapshot = createMachineSnapshot({
      ...snapshot,
      children,
      _nodes: Array.from(getAllStateNodes(getStateNodes(this.root, snapshot.value)))
    }, this);
    const seen = new Set();
    function reviveContext(contextPart, children) {
      if (seen.has(contextPart)) {
        return;
      }
      seen.add(contextPart);
      for (const key in contextPart) {
        const value = contextPart[key];
        if (value && typeof value === 'object') {
          if ('xstate$$type' in value && value.xstate$$type === $$ACTOR_TYPE) {
            contextPart[key] = children[value.id];
            continue;
          }
          reviveContext(value, children);
        }
      }
    }
    reviveContext(restoredSnapshot.context, children);
    return restoredSnapshot;
  }
}

/**
 * Creates a state machine (statechart) with the given configuration.
 *
 * The state machine represents the pure logic of a state machine actor.
 *
 * @example
 *
 * ```ts
 * import { createMachine } from 'xstate';
 *
 * const lightMachine = createMachine({
 *   id: 'light',
 *   initial: 'green',
 *   states: {
 *     green: {
 *       on: {
 *         TIMER: { target: 'yellow' }
 *       }
 *     },
 *     yellow: {
 *       on: {
 *         TIMER: { target: 'red' }
 *       }
 *     },
 *     red: {
 *       on: {
 *         TIMER: { target: 'green' }
 *       }
 *     }
 *   }
 * });
 *
 * const lightActor = createActor(lightMachine);
 * lightActor.start();
 *
 * lightActor.send({ type: 'TIMER' });
 * ```
 *
 * @param config The state machine configuration.
 * @param options DEPRECATED: use `setup({ ... })` or `machine.provide({ ... })`
 *   to provide machine implementations instead.
 */
function createMachine(config, implementations) {
  return new StateMachine(config, implementations);
}

// at the moment we allow extra actors - ones that are not specified by `children`
// this could be reconsidered in the future

function setup({
  schemas,
  actors,
  actions,
  guards,
  delays
}) {
  return {
    createMachine: config => createMachine({
      ...config,
      schemas
    }, {
      actors,
      actions,
      guards,
      delays
    })
  };
}

// src/workflows/step.ts
var Step = class {
  id;
  description;
  inputSchema;
  outputSchema;
  payload;
  execute;
  retryConfig;
  mastra;
  constructor({
    id,
    description,
    execute,
    payload,
    outputSchema,
    inputSchema,
    retryConfig
  }) {
    this.id = id;
    this.description = description ?? "";
    this.inputSchema = inputSchema;
    this.payload = payload;
    this.outputSchema = outputSchema;
    this.execute = execute;
    this.retryConfig = retryConfig;
  }
};

// src/workflows/utils.ts
function isErrorEvent(stateEvent) {
  return stateEvent.type.startsWith("xstate.error.actor.");
}
function isTransitionEvent(stateEvent) {
  return stateEvent.type.startsWith("xstate.done.actor.");
}
function isVariableReference(value) {
  return typeof value === "object" && "step" in value && "path" in value;
}
function getStepResult(result) {
  if (result?.status === "success") return result.output;
  return void 0;
}
function getSuspendedPaths({
  value,
  path,
  suspendedPaths
}) {
  if (typeof value === "string") {
    if (value === "suspended") {
      suspendedPaths.add(path);
    }
  } else {
    Object.keys(value).forEach(
      (key) => getSuspendedPaths({ value: value[key], path: path ? `${path}.${key}` : key, suspendedPaths })
    );
  }
}
function isFinalState(status) {
  return ["completed", "failed"].includes(status);
}
function isLimboState(status) {
  return status === "limbo";
}
function recursivelyCheckForFinalState({
  value,
  suspendedPaths,
  path
}) {
  if (typeof value === "string") {
    return isFinalState(value) || isLimboState(value) || suspendedPaths.has(path);
  }
  return Object.keys(value).every(
    (key) => recursivelyCheckForFinalState({ value: value[key], suspendedPaths, path: path ? `${path}.${key}` : key })
  );
}
function getActivePathsAndStatus(value) {
  const paths = [];
  const traverse = (current, path = []) => {
    for (const [key, value2] of Object.entries(current)) {
      const currentPath = [...path, key];
      if (typeof value2 === "string") {
        paths.push({
          stepPath: currentPath,
          stepId: key,
          status: value2
        });
      } else if (typeof value2 === "object" && value2 !== null) {
        traverse(value2, currentPath);
      }
    }
  };
  traverse(value);
  return paths;
}
function mergeChildValue(startStepId, parent, child) {
  const traverse = (current) => {
    const obj = {};
    for (const [key, value] of Object.entries(current)) {
      if (key === startStepId) {
        obj[key] = { ...child };
      } else if (typeof value === "string") {
        obj[key] = value;
      } else if (typeof value === "object" && value !== null) {
        obj[key] = traverse(value);
      }
    }
    return obj;
  };
  return traverse(parent);
}
var updateStepInHierarchy = (value, targetStepId) => {
  const result = {};
  for (const key of Object.keys(value)) {
    const currentValue = value[key];
    if (key === targetStepId) {
      result[key] = "pending";
    } else if (typeof currentValue === "object" && currentValue !== null) {
      result[key] = updateStepInHierarchy(currentValue, targetStepId);
    } else {
      result[key] = currentValue;
    }
  }
  return result;
};
function getResultActivePaths(state) {
  return getActivePathsAndStatus(state.value).reduce((acc, curr) => {
    const entry = { status: curr.status };
    if (curr.status === "suspended") {
      entry.suspendPayload = state.context.steps[curr.stepId].suspendPayload;
    }
    acc.set(curr.stepId, entry);
    return acc;
  }, /* @__PURE__ */ new Map());
}
var Machine = class extends EventEmitter {
  logger;
  #mastra;
  #workflowInstance;
  #executionSpan;
  #stepGraph;
  #machine;
  #runId;
  #startStepId;
  name;
  #actor = null;
  #steps = {};
  #retryConfig;
  constructor({
    logger,
    mastra,
    workflowInstance,
    executionSpan,
    name,
    runId,
    steps,
    stepGraph,
    retryConfig,
    startStepId
  }) {
    super();
    this.#mastra = mastra;
    this.#workflowInstance = workflowInstance;
    this.#executionSpan = executionSpan;
    this.logger = logger;
    this.#runId = runId;
    this.#startStepId = startStepId;
    this.name = name;
    this.#stepGraph = stepGraph;
    this.#steps = steps;
    this.#retryConfig = retryConfig;
    this.initializeMachine();
  }
  get startStepId() {
    return this.#startStepId;
  }
  async execute({
    stepId,
    input,
    snapshot,
    resumeData
  } = {}) {
    if (snapshot) {
      this.logger.debug(`Workflow snapshot received`, { runId: this.#runId, snapshot });
    }
    const origSteps = input.steps;
    const isResumedInitialStep = this.#stepGraph?.initial[0]?.step?.id === stepId;
    if (isResumedInitialStep) {
      snapshot = void 0;
      input.steps = {};
    }
    this.logger.debug(`Machine input prepared`, { runId: this.#runId, input });
    const actorSnapshot = snapshot ? {
      ...snapshot,
      context: { ...input, inputData: { ...snapshot?.context?.inputData || {}, ...resumeData } }
    } : void 0;
    this.logger.debug(`Creating actor with configuration`, {
      input,
      actorSnapshot,
      runId: this.#runId,
      machineStates: this.#machine.config.states
    });
    this.#actor = createActor(this.#machine, {
      inspect: (inspectionEvent) => {
        this.logger.debug("XState inspection event", {
          type: inspectionEvent.type,
          event: inspectionEvent.event,
          runId: this.#runId
        });
      },
      input: {
        ...input,
        inputData: { ...snapshot?.context?.inputData || {}, ...resumeData }
      },
      snapshot: actorSnapshot
    });
    this.#actor.start();
    if (stepId) {
      this.#actor.send({ type: "RESET_TO_PENDING", stepId });
    }
    this.logger.debug("Actor started", { runId: this.#runId });
    return new Promise((resolve, reject) => {
      if (!this.#actor) {
        this.logger.error("Actor not initialized", { runId: this.#runId });
        const e = new Error("Actor not initialized");
        this.#executionSpan?.recordException(e);
        this.#executionSpan?.end();
        reject(e);
        return;
      }
      const suspendedPaths = /* @__PURE__ */ new Set();
      this.#actor.subscribe(async (state) => {
        this.emit("state-update", this.#startStepId, state.value, state.context);
        getSuspendedPaths({
          value: state.value,
          path: "",
          suspendedPaths
        });
        const allStatesValue = state.value;
        const allStatesComplete = recursivelyCheckForFinalState({
          value: allStatesValue,
          suspendedPaths,
          path: ""
        });
        this.logger.debug("State completion check", {
          allStatesComplete,
          suspendedPaths: Array.from(suspendedPaths),
          runId: this.#runId
        });
        if (!allStatesComplete) {
          this.logger.debug("Not all states complete", {
            allStatesComplete,
            suspendedPaths: Array.from(suspendedPaths),
            runId: this.#runId
          });
          return;
        }
        try {
          this.logger.debug("All states complete", { runId: this.#runId });
          await this.#workflowInstance.persistWorkflowSnapshot();
          this.#cleanup();
          this.#executionSpan?.end();
          resolve({
            results: isResumedInitialStep ? { ...origSteps, ...state.context.steps } : state.context.steps,
            activePaths: getResultActivePaths(
              state
            )
          });
        } catch (error) {
          this.logger.debug("Failed to persist final snapshot", { error });
          this.#cleanup();
          this.#executionSpan?.end();
          resolve({
            results: isResumedInitialStep ? { ...origSteps, ...state.context.steps } : state.context.steps,
            activePaths: getResultActivePaths(
              state
            )
          });
        }
      });
    });
  }
  #cleanup() {
    if (this.#actor) {
      this.#actor.stop();
      this.#actor = null;
    }
    this.removeAllListeners();
  }
  #makeDelayMap() {
    const delayMap = {};
    Object.keys(this.#steps).forEach((stepId) => {
      delayMap[stepId] = this.#steps[stepId]?.retryConfig?.delay || this.#retryConfig?.delay || 1e3;
    });
    return delayMap;
  }
  #getDefaultActions() {
    return {
      updateStepResult: assign({
        steps: ({ context, event }) => {
          if (!isTransitionEvent(event)) return context.steps;
          const { stepId, result } = event.output;
          return {
            ...context.steps,
            [stepId]: {
              status: "success",
              output: result
            }
          };
        }
      }),
      setStepError: assign({
        steps: ({ context, event }, params) => {
          if (!isErrorEvent(event)) return context.steps;
          const { stepId } = params;
          if (!stepId) return context.steps;
          return {
            ...context.steps,
            [stepId]: {
              status: "failed",
              error: event.error.message
            }
          };
        }
      }),
      notifyStepCompletion: async (_, params) => {
        const { stepId } = params;
        this.logger.debug(`Step ${stepId} completed`);
      },
      snapshotStep: assign({
        _snapshot: ({}, params) => {
          const { stepId } = params;
          return { stepId };
        }
      }),
      persistSnapshot: async ({ context }) => {
        if (context._snapshot) {
          await this.#workflowInstance.persistWorkflowSnapshot();
        }
        return;
      },
      decrementAttemptCount: assign({
        attempts: ({ context, event }, params) => {
          if (!isTransitionEvent(event)) return context.attempts;
          const { stepId } = params;
          const attemptCount = context.attempts[stepId];
          if (attemptCount === void 0) return context.attempts;
          return { ...context.attempts, [stepId]: attemptCount - 1 };
        }
      })
    };
  }
  #getDefaultActors() {
    return {
      resolverFunction: fromPromise(async ({ input }) => {
        const { stepNode, context } = input;
        const attemptCount = context.attempts[stepNode.step.id];
        const resolvedData = this.#resolveVariables({
          stepConfig: stepNode.config,
          context,
          stepId: stepNode.step.id
        });
        this.logger.debug(`Resolved variables for ${stepNode.step.id}`, {
          resolvedData,
          runId: this.#runId
        });
        const logger = this.logger;
        let mastraProxy = void 0;
        if (this.#mastra) {
          mastraProxy = createMastraProxy({ mastra: this.#mastra, logger });
        }
        let result = void 0;
        try {
          result = await stepNode.config.handler({
            context: {
              ...context,
              inputData: { ...context?.inputData || {}, ...resolvedData },
              getStepResult: (stepId) => {
                const resolvedStepId = typeof stepId === "string" ? stepId : stepId.id;
                if (resolvedStepId === "trigger") {
                  return context.triggerData;
                }
                const result2 = context.steps[resolvedStepId];
                if (result2 && result2.status === "success") {
                  return result2.output;
                }
                return void 0;
              }
            },
            suspend: async (payload) => {
              await this.#workflowInstance.suspend(stepNode.step.id, this);
              if (this.#actor) {
                context.steps[stepNode.step.id] = {
                  status: "suspended",
                  suspendPayload: payload
                };
                this.logger.debug(`Sending SUSPENDED event for step ${stepNode.step.id}`);
                this.#actor?.send({ type: "SUSPENDED", suspendPayload: payload, stepId: stepNode.step.id });
              } else {
                this.logger.debug(`Actor not available for step ${stepNode.step.id}`);
              }
            },
            runId: this.#runId,
            mastra: mastraProxy
          });
        } catch (error) {
          this.logger.debug(`Step ${stepNode.step.id} failed`, {
            stepId: stepNode.step.id,
            error,
            runId: this.#runId
          });
          this.logger.debug(`Attempt count for step ${stepNode.step.id}`, {
            attemptCount,
            attempts: context.attempts,
            runId: this.#runId,
            stepId: stepNode.step.id
          });
          if (!attemptCount || attemptCount < 0) {
            return {
              type: "STEP_FAILED",
              error: error instanceof Error ? error.message : `Step:${stepNode.step.id} failed with error: ${error}`,
              stepId: stepNode.step.id
            };
          }
          return { type: "STEP_WAITING", stepId: stepNode.step.id };
        }
        this.logger.debug(`Step ${stepNode.step.id} result`, {
          stepId: stepNode.step.id,
          result,
          runId: this.#runId
        });
        return {
          type: "STEP_SUCCESS",
          result,
          stepId: stepNode.step.id
        };
      }),
      conditionCheck: fromPromise(async ({ input }) => {
        const { context, stepNode } = input;
        const stepConfig = stepNode.config;
        this.logger.debug(`Checking conditions for step ${stepNode.step.id}`, {
          stepId: stepNode.step.id,
          runId: this.#runId
        });
        if (!stepConfig?.when) {
          return { type: "CONDITIONS_MET" };
        }
        this.logger.debug(`Checking conditions for step ${stepNode.step.id}`, {
          stepId: stepNode.step.id,
          runId: this.#runId
        });
        if (typeof stepConfig?.when === "function") {
          let conditionMet = await stepConfig.when({
            context: {
              ...context,
              getStepResult: (stepId) => {
                const resolvedStepId = typeof stepId === "string" ? stepId : stepId.id;
                if (resolvedStepId === "trigger") {
                  return context.triggerData;
                }
                const result = context.steps[resolvedStepId];
                if (result && result.status === "success") {
                  return result.output;
                }
                return void 0;
              }
            },
            mastra: this.#mastra
          });
          if (conditionMet === "abort" /* ABORT */) {
            conditionMet = false;
          } else if (conditionMet === "continue_failed" /* CONTINUE_FAILED */) {
            return { type: "CONDITIONS_SKIP_TO_COMPLETED" };
          } else if (conditionMet === "limbo" /* LIMBO */) {
            return { type: "CONDITIONS_LIMBO" };
          } else if (conditionMet) {
            this.logger.debug(`Condition met for step ${stepNode.step.id}`, {
              stepId: stepNode.step.id,
              runId: this.#runId
            });
            return { type: "CONDITIONS_MET" };
          }
          return this.#workflowInstance.hasSubscribers(stepNode.step.id) ? { type: "CONDITIONS_SKIPPED" } : { type: "CONDITIONS_LIMBO" };
        } else {
          const conditionMet = this.#evaluateCondition(stepConfig.when, context);
          if (!conditionMet) {
            return {
              type: "CONDITION_FAILED",
              error: `Step:${stepNode.step.id} condition check failed`
            };
          }
        }
        return { type: "CONDITIONS_MET" };
      }),
      spawnSubscriberFunction: fromPromise(
        async ({
          input
        }) => {
          const { parentStepId, context } = input;
          const result = await this.#workflowInstance.runMachine(parentStepId, context);
          return Promise.resolve({
            steps: result.reduce((acc, r) => {
              return { ...acc, ...r?.results };
            }, {})
          });
        }
      )
    };
  }
  #resolveVariables({
    stepConfig,
    context,
    stepId
  }) {
    this.logger.debug(`Resolving variables for step ${stepId}`, {
      stepId,
      runId: this.#runId
    });
    const resolvedData = {};
    for (const [key, variable] of Object.entries(stepConfig.data)) {
      const sourceData = variable.step === "trigger" ? context.triggerData : getStepResult(context.steps[variable.step.id]);
      this.logger.debug(
        `Got source data for ${key} variable from ${variable.step === "trigger" ? "trigger" : variable.step.id}`,
        {
          sourceData,
          path: variable.path,
          runId: this.#runId
        }
      );
      if (!sourceData && variable.step !== "trigger") {
        resolvedData[key] = void 0;
        continue;
      }
      const value = variable.path === "" || variable.path === "." ? sourceData : get(sourceData, variable.path);
      this.logger.debug(`Resolved variable ${key}`, {
        value,
        runId: this.#runId
      });
      resolvedData[key] = value;
    }
    return resolvedData;
  }
  initializeMachine() {
    const machine = setup({
      delays: this.#makeDelayMap(),
      actions: this.#getDefaultActions(),
      actors: this.#getDefaultActors()
    }).createMachine({
      id: this.name,
      type: "parallel",
      context: ({ input }) => ({
        ...input
      }),
      states: this.#buildStateHierarchy(this.#stepGraph)
    });
    this.#machine = machine;
    return machine;
  }
  #buildStateHierarchy(stepGraph) {
    const states = {};
    stepGraph.initial.forEach((stepNode) => {
      const nextSteps = [...stepGraph[stepNode.step.id] || []];
      states[stepNode.step.id] = {
        ...this.#buildBaseState(stepNode, nextSteps)
      };
    });
    return states;
  }
  #buildBaseState(stepNode, nextSteps = []) {
    const nextStep = nextSteps.shift();
    return {
      initial: "pending",
      on: {
        RESET_TO_PENDING: {
          target: ".pending"
          // Note the dot to target child state
        }
      },
      states: {
        pending: {
          entry: () => {
            this.logger.debug(`Step ${stepNode.step.id} pending`, {
              stepId: stepNode.step.id,
              runId: this.#runId
            });
          },
          exit: () => {
            this.logger.debug(`Step ${stepNode.step.id} finished pending`, {
              stepId: stepNode.step.id,
              runId: this.#runId
            });
          },
          invoke: {
            src: "conditionCheck",
            input: ({ context }) => {
              return {
                context,
                stepNode
              };
            },
            onDone: [
              {
                guard: ({ event }) => {
                  return event.output.type === "SUSPENDED";
                },
                target: "suspended",
                actions: [
                  assign({
                    steps: ({ context, event }) => {
                      if (event.output.type !== "SUSPENDED") return context.steps;
                      return {
                        ...context.steps,
                        [stepNode.step.id]: {
                          status: "suspended",
                          ...context.steps?.[stepNode.step.id] || {}
                        }
                      };
                    },
                    attempts: ({ context, event }) => {
                      if (event.output.type !== "SUSPENDED") return context.attempts;
                      return { ...context.attempts, [stepNode.step.id]: stepNode.step.retryConfig?.attempts || 0 };
                    }
                  })
                ]
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "WAITING";
                },
                target: "waiting",
                actions: [
                  { type: "decrementAttemptCount", params: { stepId: stepNode.step.id } },
                  assign({
                    steps: ({ context, event }) => {
                      if (event.output.type !== "WAITING") return context.steps;
                      return {
                        ...context.steps,
                        [stepNode.step.id]: {
                          status: "waiting"
                        }
                      };
                    }
                  })
                ]
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "CONDITIONS_MET";
                },
                target: "executing"
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "CONDITIONS_SKIP_TO_COMPLETED";
                },
                target: "completed"
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "CONDITIONS_SKIPPED";
                },
                actions: assign({
                  steps: ({ context }) => {
                    const newStep = {
                      ...context.steps,
                      [stepNode.step.id]: {
                        status: "skipped"
                      }
                    };
                    this.logger.debug(`Step ${stepNode.step.id} skipped`, {
                      stepId: stepNode.step.id,
                      runId: this.#runId
                    });
                    return newStep;
                  }
                }),
                target: "runningSubscribers"
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "CONDITIONS_LIMBO";
                },
                target: "limbo",
                actions: assign({
                  steps: ({ context }) => {
                    const newStep = {
                      ...context.steps,
                      [stepNode.step.id]: {
                        status: "skipped"
                      }
                    };
                    this.logger.debug(`Step ${stepNode.step.id} skipped`, {
                      stepId: stepNode.step.id,
                      runId: this.#runId
                    });
                    return newStep;
                  }
                })
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "CONDITION_FAILED";
                },
                target: "failed",
                actions: assign({
                  steps: ({ context, event }) => {
                    if (event.output.type !== "CONDITION_FAILED") return context.steps;
                    this.logger.debug(`Workflow condition check failed`, {
                      error: event.output.error,
                      stepId: stepNode.step.id
                    });
                    return {
                      ...context.steps,
                      [stepNode.step.id]: {
                        status: "failed",
                        error: event.output.error
                      }
                    };
                  }
                })
              }
            ]
          }
        },
        waiting: {
          entry: () => {
            this.logger.debug(`Step ${stepNode.step.id} waiting`, {
              stepId: stepNode.step.id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              runId: this.#runId
            });
          },
          exit: () => {
            this.logger.debug(`Step ${stepNode.step.id} finished waiting`, {
              stepId: stepNode.step.id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              runId: this.#runId
            });
          },
          after: {
            [stepNode.step.id]: {
              target: "pending"
            }
          }
        },
        limbo: {
          // no target, will stay in limbo indefinitely
          entry: () => {
            this.logger.debug(`Step ${stepNode.step.id} limbo`, {
              stepId: stepNode.step.id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              runId: this.#runId
            });
          },
          exit: () => {
            this.logger.debug(`Step ${stepNode.step.id} finished limbo`, {
              stepId: stepNode.step.id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              runId: this.#runId
            });
          }
        },
        suspended: {
          type: "final",
          entry: [
            () => {
              this.logger.debug(`Step ${stepNode.step.id} suspended`, {
                stepId: stepNode.step.id,
                runId: this.#runId
              });
            },
            assign({
              steps: ({ context, event }) => {
                return {
                  ...context.steps,
                  [stepNode.step.id]: {
                    ...context?.steps?.[stepNode.step.id] || {},
                    status: "suspended",
                    suspendPayload: event.type === "SUSPENDED" ? event.suspendPayload : void 0
                  }
                };
              }
            })
          ]
        },
        executing: {
          entry: () => {
            this.logger.debug(`Step ${stepNode.step.id} executing`, {
              stepId: stepNode.step.id,
              runId: this.#runId
            });
          },
          on: {
            SUSPENDED: {
              target: "suspended",
              actions: [
                assign({
                  steps: ({ context, event }) => {
                    return {
                      ...context.steps,
                      [stepNode.step.id]: {
                        status: "suspended",
                        suspendPayload: event.type === "SUSPENDED" ? event.suspendPayload : void 0
                      }
                    };
                  }
                })
              ]
            }
          },
          invoke: {
            src: "resolverFunction",
            input: ({ context }) => ({
              context,
              stepNode
            }),
            onDone: [
              {
                guard: ({ event }) => {
                  return event.output.type === "STEP_FAILED";
                },
                target: "failed",
                actions: assign({
                  steps: ({ context, event }) => {
                    if (event.output.type !== "STEP_FAILED") return context.steps;
                    const newStep = {
                      ...context.steps,
                      [stepNode.step.id]: {
                        status: "failed",
                        error: event.output.error
                      }
                    };
                    this.logger.debug(`Step ${stepNode.step.id} failed`, {
                      error: event.output.error,
                      stepId: stepNode.step.id
                    });
                    return newStep;
                  }
                })
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "STEP_SUCCESS";
                },
                actions: [
                  ({ event }) => {
                    this.logger.debug(`Step ${stepNode.step.id} finished executing`, {
                      stepId: stepNode.step.id,
                      output: event.output,
                      runId: this.#runId
                    });
                  },
                  { type: "updateStepResult", params: { stepId: stepNode.step.id } },
                  { type: "spawnSubscribers", params: { stepId: stepNode.step.id } }
                ],
                target: "runningSubscribers"
              },
              {
                guard: ({ event }) => {
                  return event.output.type === "STEP_WAITING";
                },
                target: "waiting",
                actions: [
                  { type: "decrementAttemptCount", params: { stepId: stepNode.step.id } },
                  assign({
                    steps: ({ context, event }) => {
                      if (event.output.type !== "STEP_WAITING") return context.steps;
                      return {
                        ...context.steps,
                        [stepNode.step.id]: {
                          status: "waiting"
                        }
                      };
                    }
                  })
                ]
              }
            ],
            onError: {
              target: "failed",
              actions: [{ type: "setStepError", params: { stepId: stepNode.step.id } }]
            }
          }
        },
        runningSubscribers: {
          entry: () => {
            this.logger.debug(`Step ${stepNode.step.id} running subscribers`, {
              stepId: stepNode.step.id,
              runId: this.#runId
            });
          },
          exit: () => {
            this.logger.debug(`Step ${stepNode.step.id} finished running subscribers`, {
              stepId: stepNode.step.id,
              runId: this.#runId
            });
          },
          invoke: {
            src: "spawnSubscriberFunction",
            input: ({ context }) => ({
              parentStepId: stepNode.step.id,
              context
            }),
            onDone: {
              target: nextStep ? nextStep.step.id : "completed",
              actions: [
                assign({
                  steps: ({ context, event }) => ({
                    ...context.steps,
                    ...event.output.steps
                  })
                }),
                () => this.logger.debug(`Subscriber execution completed`, { stepId: stepNode.step.id })
              ]
            },
            onError: {
              target: nextStep ? nextStep.step.id : "completed",
              actions: ({ event }) => {
                this.logger.debug(`Subscriber execution failed`, {
                  error: event.error,
                  stepId: stepNode.step.id
                });
              }
            }
          }
        },
        completed: {
          type: "final",
          entry: [
            { type: "notifyStepCompletion", params: { stepId: stepNode.step.id } },
            { type: "snapshotStep", params: { stepId: stepNode.step.id } },
            { type: "persistSnapshot" }
          ]
        },
        failed: {
          type: "final",
          entry: [
            { type: "notifyStepCompletion", params: { stepId: stepNode.step.id } },
            { type: "snapshotStep", params: { stepId: stepNode.step.id } },
            { type: "persistSnapshot" }
          ]
        },
        // build chain of next steps recursively
        ...nextStep ? { [nextStep.step.id]: { ...this.#buildBaseState(nextStep, nextSteps) } } : {}
      }
    };
  }
  #evaluateCondition(condition, context) {
    let andBranchResult = true;
    let baseResult = true;
    let orBranchResult = true;
    const simpleCondition = Object.entries(condition).find(([key]) => key.includes("."));
    if (simpleCondition) {
      const [key, queryValue] = simpleCondition;
      const [stepId, ...pathParts] = key.split(".");
      const path = pathParts.join(".");
      const sourceData = stepId === "trigger" ? context.triggerData : getStepResult(context.steps[stepId]);
      this.logger.debug(`Got condition data from step ${stepId}`, {
        stepId,
        sourceData,
        runId: this.#runId
      });
      if (!sourceData) {
        return false;
      }
      let value = get(sourceData, path);
      if (stepId !== "trigger" && path === "status" && !value) {
        value = "success";
      }
      if (typeof queryValue === "object" && queryValue !== null) {
        baseResult = createDefaultQueryTester(queryValue)(value);
      } else {
        baseResult = value === queryValue;
      }
    }
    if ("ref" in condition) {
      const { ref, query } = condition;
      const sourceData = ref.step === "trigger" ? context.triggerData : getStepResult(context.steps[ref.step.id]);
      this.logger.debug(`Got condition data from ${ref.step === "trigger" ? "trigger" : ref.step.id}`, {
        sourceData,
        runId: this.#runId
      });
      if (!sourceData) {
        return false;
      }
      let value = get(sourceData, ref.path);
      if (ref.step !== "trigger" && ref.path === "status" && !value) {
        value = "success";
      }
      baseResult = createDefaultQueryTester(query)(value);
    }
    if ("and" in condition) {
      andBranchResult = condition.and.every((cond) => this.#evaluateCondition(cond, context));
      this.logger.debug(`Evaluated AND condition`, {
        andBranchResult,
        runId: this.#runId
      });
    }
    if ("or" in condition) {
      orBranchResult = condition.or.some((cond) => this.#evaluateCondition(cond, context));
      this.logger.debug(`Evaluated OR condition`, {
        orBranchResult,
        runId: this.#runId
      });
    }
    if ("not" in condition) {
      baseResult = !this.#evaluateCondition(condition.not, context);
      this.logger.debug(`Evaluated NOT condition`, {
        baseResult,
        runId: this.#runId
      });
    }
    const finalResult = baseResult && andBranchResult && orBranchResult;
    this.logger.debug(`Evaluated condition`, {
      finalResult,
      runId: this.#runId
    });
    return finalResult;
  }
  getSnapshot() {
    const snapshot = this.#actor?.getSnapshot();
    return snapshot;
  }
};

// src/workflows/workflow-instance.ts
var WorkflowInstance = class {
  name;
  #mastra;
  #machines = {};
  logger;
  #steps = {};
  #stepGraph;
  #stepSubscriberGraph = {};
  #retryConfig;
  events;
  #runId;
  #state = null;
  #executionSpan;
  #onStepTransition = /* @__PURE__ */ new Set();
  #onFinish;
  // indexed by stepId
  #suspendedMachines = {};
  // {step1&&step2: {step1: true, step2: true}}
  #compoundDependencies = {};
  constructor({
    name,
    logger,
    steps,
    runId,
    retryConfig,
    mastra,
    stepGraph,
    stepSubscriberGraph,
    onFinish,
    onStepTransition,
    events
  }) {
    this.name = name;
    this.logger = logger;
    this.#steps = steps;
    this.#stepGraph = stepGraph;
    this.#stepSubscriberGraph = stepSubscriberGraph;
    this.#retryConfig = retryConfig;
    this.#mastra = mastra;
    this.#runId = runId ?? crypto.randomUUID();
    this.#onFinish = onFinish;
    this.events = events;
    onStepTransition?.forEach((handler) => this.#onStepTransition.add(handler));
    this.#initializeCompoundDependencies();
  }
  setState(state) {
    this.#state = state;
  }
  get runId() {
    return this.#runId;
  }
  get executionSpan() {
    return this.#executionSpan;
  }
  watch(onTransition) {
    this.#onStepTransition.add(onTransition);
    return () => {
      this.#onStepTransition.delete(onTransition);
    };
  }
  async start({ triggerData } = {}) {
    const results = await this.execute({ triggerData });
    if (this.#onFinish) {
      this.#onFinish();
    }
    return {
      ...results,
      runId: this.runId
    };
  }
  isCompoundDependencyMet(stepKey) {
    if (!this.#isCompoundKey(stepKey)) return true;
    const dependencies = this.#compoundDependencies[stepKey];
    return dependencies ? Object.values(dependencies).every((status) => status === true) : true;
  }
  async execute({
    triggerData,
    snapshot,
    stepId,
    resumeData
  } = {}) {
    this.#executionSpan = this.#mastra?.getTelemetry()?.tracer.startSpan(`workflow.${this.name}.execute`, {
      attributes: { componentName: this.name, runId: this.runId }
    });
    let machineInput = {
      // Maintain the original step results and their output
      steps: {},
      triggerData: triggerData || {},
      attempts: Object.keys(this.#steps).reduce(
        (acc, stepKey) => {
          acc[stepKey] = this.#steps[stepKey]?.retryConfig?.attempts || this.#retryConfig?.attempts || 0;
          return acc;
        },
        {}
      )
    };
    let stepGraph = this.#stepGraph;
    let startStepId = "trigger";
    if (snapshot) {
      const runState = snapshot;
      if (stepId && runState?.suspendedSteps?.[stepId]) {
        startStepId = runState.suspendedSteps[stepId];
        stepGraph = this.#stepSubscriberGraph[startStepId] ?? this.#stepGraph;
        machineInput = runState.context;
      }
    }
    const defaultMachine = new Machine({
      logger: this.logger,
      mastra: this.#mastra,
      workflowInstance: this,
      name: this.name,
      runId: this.runId,
      steps: this.#steps,
      stepGraph,
      executionSpan: this.#executionSpan,
      startStepId,
      retryConfig: this.#retryConfig
    });
    this.#machines[startStepId] = defaultMachine;
    const stateUpdateHandler = (startStepId2, state, context) => {
      if (startStepId2 === "trigger") {
        this.#state = state;
      } else {
        this.#state = mergeChildValue(startStepId2, this.#state, state);
      }
      const now = Date.now();
      if (this.#onStepTransition) {
        this.#onStepTransition.forEach((onTransition) => {
          void onTransition({
            runId: this.#runId,
            value: this.#state,
            context,
            activePaths: getActivePathsAndStatus(this.#state),
            timestamp: now
          });
        });
      }
    };
    defaultMachine.on("state-update", stateUpdateHandler);
    const { results, activePaths } = await defaultMachine.execute({
      snapshot,
      stepId,
      input: machineInput,
      resumeData
    });
    await this.persistWorkflowSnapshot();
    return { results, activePaths };
  }
  hasSubscribers(stepId) {
    return Object.keys(this.#stepSubscriberGraph).some((key) => key.split("&&").includes(stepId));
  }
  async runMachine(parentStepId, input) {
    const stepStatus = input.steps[parentStepId]?.status;
    const subscriberKeys = Object.keys(this.#stepSubscriberGraph).filter((key) => key.split("&&").includes(parentStepId));
    subscriberKeys.forEach((key) => {
      if (["success", "failure", "skipped"].includes(stepStatus) && this.#isCompoundKey(key)) {
        this.#compoundDependencies[key][parentStepId] = true;
      }
    });
    const stateUpdateHandler = (startStepId, state, context) => {
      if (startStepId === "trigger") {
        this.#state = state;
      } else {
        this.#state = mergeChildValue(startStepId, this.#state, state);
      }
      const now = Date.now();
      if (this.#onStepTransition) {
        this.#onStepTransition.forEach((onTransition) => {
          void onTransition({
            runId: this.#runId,
            value: this.#state,
            context,
            activePaths: getActivePathsAndStatus(this.#state),
            timestamp: now
          });
        });
      }
    };
    const results = await Promise.all(
      subscriberKeys.map(async (key) => {
        if (!this.#stepSubscriberGraph[key] || !this.isCompoundDependencyMet(key)) {
          return;
        }
        this.#initializeCompoundDependencies();
        const machine = new Machine({
          logger: this.logger,
          mastra: this.#mastra,
          workflowInstance: this,
          name: parentStepId === "trigger" ? this.name : `${this.name}-${parentStepId}`,
          runId: this.runId,
          steps: this.#steps,
          stepGraph: this.#stepSubscriberGraph[key],
          executionSpan: this.#executionSpan,
          startStepId: parentStepId
        });
        machine.on("state-update", stateUpdateHandler);
        this.#machines[parentStepId] = machine;
        return machine.execute({ input });
      })
    );
    return results;
  }
  async suspend(stepId, machine) {
    this.#suspendedMachines[stepId] = machine;
  }
  /**
   * Persists the workflow state to the database
   */
  async persistWorkflowSnapshot() {
    const existingSnapshot = await this.#mastra?.storage?.loadWorkflowSnapshot({
      workflowName: this.name,
      runId: this.#runId
    });
    const machineSnapshots = {};
    for (const [stepId, machine] of Object.entries(this.#machines)) {
      const machineSnapshot = machine?.getSnapshot();
      if (machineSnapshot) {
        machineSnapshots[stepId] = { ...machineSnapshot };
      }
    }
    let snapshot = machineSnapshots["trigger"];
    delete machineSnapshots["trigger"];
    const suspendedSteps = Object.entries(this.#suspendedMachines).reduce(
      (acc, [stepId, machine]) => {
        acc[stepId] = machine.startStepId;
        return acc;
      },
      {}
    );
    if (!snapshot && existingSnapshot) {
      existingSnapshot.childStates = { ...existingSnapshot.childStates, ...machineSnapshots };
      existingSnapshot.suspendedSteps = { ...existingSnapshot.suspendedSteps, ...suspendedSteps };
      await this.#mastra?.storage?.persistWorkflowSnapshot({
        workflowName: this.name,
        runId: this.#runId,
        snapshot: existingSnapshot
      });
      return;
    } else if (snapshot && !existingSnapshot) {
      snapshot.suspendedSteps = suspendedSteps;
      snapshot.childStates = { ...machineSnapshots };
      await this.#mastra?.storage?.persistWorkflowSnapshot({
        workflowName: this.name,
        runId: this.#runId,
        snapshot
      });
      return;
    } else if (!snapshot) {
      this.logger.debug("Snapshot cannot be persisted. No snapshot received.", { runId: this.#runId });
      return;
    }
    snapshot.suspendedSteps = { ...existingSnapshot.suspendedSteps, ...suspendedSteps };
    if (!existingSnapshot || snapshot === existingSnapshot) {
      await this.#mastra?.storage?.persistWorkflowSnapshot({
        workflowName: this.name,
        runId: this.#runId,
        snapshot
      });
      return;
    }
    if (existingSnapshot?.childStates) {
      snapshot.childStates = { ...existingSnapshot.childStates, ...machineSnapshots };
    } else {
      snapshot.childStates = machineSnapshots;
    }
    await this.#mastra?.storage?.persistWorkflowSnapshot({
      workflowName: this.name,
      runId: this.#runId,
      snapshot
    });
  }
  async getState() {
    const storedSnapshot = await this.#mastra?.storage?.loadWorkflowSnapshot({
      workflowName: this.name,
      runId: this.runId
    });
    const prevSnapshot = storedSnapshot ? {
      trigger: storedSnapshot,
      ...Object.entries(storedSnapshot?.childStates ?? {}).reduce(
        (acc, [stepId, snapshot2]) => ({ ...acc, [stepId]: snapshot2 }),
        {}
      )
    } : {};
    const currentSnapshot = Object.entries(this.#machines).reduce(
      (acc, [stepId, machine]) => {
        const snapshot2 = machine.getSnapshot();
        if (!snapshot2) {
          return acc;
        }
        return {
          ...acc,
          [stepId]: snapshot2
        };
      },
      {}
    );
    Object.assign(prevSnapshot, currentSnapshot);
    const trigger = prevSnapshot.trigger;
    delete prevSnapshot.trigger;
    const snapshot = { ...trigger};
    const m = getActivePathsAndStatus(prevSnapshot.value);
    return {
      runId: this.runId,
      value: snapshot.value,
      context: snapshot.context,
      activePaths: m,
      timestamp: Date.now()
    };
  }
  async resumeWithEvent(eventName, data) {
    const event = this.events?.[eventName];
    if (!event) {
      throw new Error(`Event ${eventName} not found`);
    }
    const results = await this.resume({ stepId: `__${eventName}_event`, context: { resumedEvent: data } });
    return results;
  }
  async resume({ stepId, context: resumeContext }) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return this._resume({ stepId, context: resumeContext });
  }
  async #loadWorkflowSnapshot(runId) {
    if (!this.#mastra?.storage) {
      this.logger.debug("Snapshot cannot be loaded. Mastra engine is not initialized", { runId });
      return;
    }
    await this.persistWorkflowSnapshot();
    return this.#mastra.getStorage()?.loadWorkflowSnapshot({ runId, workflowName: this.name });
  }
  async _resume({ stepId, context: resumeContext }) {
    const snapshot = await this.#loadWorkflowSnapshot(this.runId);
    if (!snapshot) {
      throw new Error(`No snapshot found for workflow run ${this.runId}`);
    }
    let parsedSnapshot;
    try {
      parsedSnapshot = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
    } catch (error) {
      this.logger.debug("Failed to parse workflow snapshot for resume", { error, runId: this.runId });
      throw new Error("Failed to parse workflow snapshot");
    }
    const startStepId = parsedSnapshot.suspendedSteps?.[stepId];
    if (!startStepId) {
      return;
    }
    parsedSnapshot = startStepId === "trigger" ? parsedSnapshot : { ...parsedSnapshot?.childStates?.[startStepId], ...{ suspendedSteps: parsedSnapshot.suspendedSteps } };
    if (!parsedSnapshot) {
      throw new Error(`No snapshot found for step: ${stepId} starting at ${startStepId}`);
    }
    if (resumeContext) {
      parsedSnapshot.context.steps[stepId] = {
        status: "success",
        output: {
          ...parsedSnapshot?.context?.steps?.[stepId]?.output || {},
          ...resumeContext
        }
      };
    }
    if (parsedSnapshot.children) {
      Object.entries(parsedSnapshot.children).forEach(([_childId, child]) => {
        if (child.snapshot?.input?.stepNode) {
          const stepDef = this.#makeStepDef(child.snapshot.input.stepNode.step.id);
          child.snapshot.input.stepNode.config = {
            ...child.snapshot.input.stepNode.config,
            ...stepDef
          };
          child.snapshot.input.context = parsedSnapshot.context;
        }
      });
    }
    parsedSnapshot.value = updateStepInHierarchy(parsedSnapshot.value, stepId);
    if (parsedSnapshot.context?.attempts) {
      parsedSnapshot.context.attempts[stepId] = this.#steps[stepId]?.retryConfig?.attempts || this.#retryConfig?.attempts || 0;
    }
    this.logger.debug("Resuming workflow with updated snapshot", {
      updatedSnapshot: parsedSnapshot,
      runId: this.runId,
      stepId
    });
    return this.execute({
      snapshot: parsedSnapshot,
      stepId,
      resumeData: resumeContext
    });
  }
  #initializeCompoundDependencies() {
    Object.keys(this.#stepSubscriberGraph).forEach((stepKey) => {
      if (this.#isCompoundKey(stepKey)) {
        const requiredSteps = stepKey.split("&&");
        this.#compoundDependencies[stepKey] = requiredSteps.reduce(
          (acc, step) => {
            acc[step] = false;
            return acc;
          },
          {}
        );
      }
    });
  }
  #makeStepDef(stepId) {
    const executeStep = (handler2, spanName, attributes) => {
      return async (data) => {
        return await context.with(trace.setSpan(context.active(), this.#executionSpan), async () => {
          if (this.#mastra?.getTelemetry()) {
            return this.#mastra.getTelemetry()?.traceMethod(handler2, {
              spanName,
              attributes
            })(data);
          } else {
            return handler2(data);
          }
        });
      };
    };
    const handler = async ({ context, ...rest }) => {
      const targetStep = this.#steps[stepId];
      if (!targetStep) throw new Error(`Step not found`);
      const { payload = {}, execute = async () => {
      } } = targetStep;
      const mergedData = {
        ...payload,
        ...context
      };
      const finalAction = this.#mastra?.getTelemetry() ? executeStep(execute, `workflow.${this.name}.action.${stepId}`, {
        componentName: this.name,
        runId: rest.runId
      }) : execute;
      return finalAction ? await finalAction({ context: mergedData, ...rest }) : {};
    };
    const finalHandler = ({ context, ...rest }) => {
      if (this.#executionSpan) {
        return executeStep(handler, `workflow.${this.name}.step.${stepId}`, {
          componentName: this.name,
          runId: rest?.runId
        })({ context, ...rest });
      }
      return handler({ context, ...rest });
    };
    return {
      handler: finalHandler,
      data: {}
    };
  }
  #isCompoundKey(key) {
    return key.includes("&&");
  }
};

// src/workflows/workflow.ts
var Workflow = class extends MastraBase {
  name;
  triggerSchema;
  events;
  #retryConfig;
  #mastra;
  #runs = /* @__PURE__ */ new Map();
  #onStepTransition = /* @__PURE__ */ new Set();
  // registers stepIds on `after` calls
  #afterStepStack = [];
  #lastStepStack = [];
  #ifStack = [];
  #stepGraph = { initial: [] };
  #serializedStepGraph = { initial: [] };
  #stepSubscriberGraph = {};
  #serializedStepSubscriberGraph = {};
  #steps = {};
  /**
   * Creates a new Workflow instance
   * @param name - Identifier for the workflow (not necessarily unique)
   * @param logger - Optional logger instance
   */
  constructor({ name, triggerSchema, retryConfig, mastra, events }) {
    super({ component: "WORKFLOW", name });
    this.name = name;
    this.#retryConfig = retryConfig;
    this.triggerSchema = triggerSchema;
    this.events = events;
    if (mastra) {
      this.__registerPrimitives({
        telemetry: mastra.getTelemetry(),
        logger: mastra.getLogger()
      });
      this.#mastra = mastra;
    }
  }
  step(step, config) {
    const { variables = {} } = config || {};
    const requiredData = {};
    for (const [key, variable] of Object.entries(variables)) {
      if (variable && isVariableReference(variable)) {
        requiredData[key] = variable;
      }
    }
    const stepKey = this.#makeStepKey(step);
    const when = config?.["#internal"]?.when || config?.when;
    const graphEntry = {
      step,
      config: {
        ...this.#makeStepDef(stepKey),
        ...config,
        loopLabel: config?.["#internal"]?.loopLabel,
        loopType: config?.["#internal"]?.loopType,
        serializedWhen: typeof when === "function" ? when.toString() : when,
        data: requiredData
      }
    };
    this.#steps[stepKey] = step;
    const parentStepKey = this.#afterStepStack[this.#afterStepStack.length - 1];
    const stepGraph = this.#stepSubscriberGraph[parentStepKey || ""];
    const serializedStepGraph = this.#serializedStepSubscriberGraph[parentStepKey || ""];
    if (parentStepKey && stepGraph) {
      if (!stepGraph.initial.some((step2) => step2.step.id === stepKey)) {
        stepGraph.initial.push(graphEntry);
        if (serializedStepGraph) serializedStepGraph.initial.push(graphEntry);
      }
      stepGraph[stepKey] = [];
      if (serializedStepGraph) serializedStepGraph[stepKey] = [];
    } else {
      if (!this.#stepGraph[stepKey]) this.#stepGraph[stepKey] = [];
      this.#stepGraph.initial.push(graphEntry);
      this.#serializedStepGraph.initial.push(graphEntry);
    }
    this.#lastStepStack.push(stepKey);
    return this;
  }
  #makeStepKey(step) {
    return `${step.id}`;
  }
  then(step, config) {
    const { variables = {} } = config || {};
    const requiredData = {};
    for (const [key, variable] of Object.entries(variables)) {
      if (variable && isVariableReference(variable)) {
        requiredData[key] = variable;
      }
    }
    const lastStepKey = this.#lastStepStack[this.#lastStepStack.length - 1];
    const stepKey = this.#makeStepKey(step);
    const when = config?.["#internal"]?.when || config?.when;
    const graphEntry = {
      step,
      config: {
        ...this.#makeStepDef(stepKey),
        ...config,
        loopLabel: config?.["#internal"]?.loopLabel,
        loopType: config?.["#internal"]?.loopType,
        serializedWhen: typeof when === "function" ? when.toString() : when,
        data: requiredData
      }
    };
    this.#steps[stepKey] = step;
    if (!lastStepKey) return this;
    const parentStepKey = this.#afterStepStack[this.#afterStepStack.length - 1];
    const stepGraph = this.#stepSubscriberGraph[parentStepKey || ""];
    const serializedStepGraph = this.#serializedStepSubscriberGraph[parentStepKey || ""];
    if (parentStepKey && stepGraph && stepGraph[lastStepKey]) {
      stepGraph[lastStepKey].push(graphEntry);
      if (serializedStepGraph && serializedStepGraph[lastStepKey]) serializedStepGraph[lastStepKey].push(graphEntry);
    } else {
      if (!this.#stepGraph[lastStepKey]) this.#stepGraph[lastStepKey] = [];
      if (!this.#serializedStepGraph[lastStepKey]) this.#serializedStepGraph[lastStepKey] = [];
      this.#stepGraph[lastStepKey].push(graphEntry);
      this.#serializedStepGraph[lastStepKey].push(graphEntry);
    }
    return this;
  }
  loop(applyOperator, condition, fallbackStep, loopType) {
    const lastStepKey = this.#lastStepStack[this.#lastStepStack.length - 1];
    if (!lastStepKey) return this;
    const fallbackStepKey = this.#makeStepKey(fallbackStep);
    this.#steps[fallbackStepKey] = fallbackStep;
    const checkStepKey = `__${fallbackStepKey}_${loopType}_loop_check`;
    const checkStep = {
      id: checkStepKey,
      execute: async ({ context }) => {
        if (typeof condition === "function") {
          const result = await condition({ context });
          if (loopType === "while") {
            return { status: result ? "continue" : "complete" };
          } else {
            return { status: result ? "complete" : "continue" };
          }
        }
        if (condition && "ref" in condition) {
          const { ref, query } = condition;
          const stepId = typeof ref.step === "string" ? ref.step : "id" in ref.step ? ref.step.id : null;
          if (!stepId) {
            return { status: "continue" };
          }
          const stepOutput = context.steps?.[stepId]?.output;
          if (!stepOutput) {
            return { status: "continue" };
          }
          const value = ref.path.split(".").reduce((obj, key) => obj?.[key], stepOutput);
          const operator = Object.keys(query)[0];
          const target = query[operator];
          return applyOperator(operator, value, target);
        }
        return { status: "continue" };
      }
    };
    this.#steps[checkStepKey] = checkStep;
    const loopFinishedStepKey = `__${fallbackStepKey}_${loopType}_loop_finished`;
    const loopFinishedStep = {
      id: loopFinishedStepKey,
      execute: async ({ context }) => {
        return { success: true };
      }
    };
    this.#steps[checkStepKey] = checkStep;
    this.then(checkStep, {
      "#internal": {
        loopLabel: `${fallbackStepKey} ${loopType} loop check`
      }
    });
    this.after(checkStep).step(fallbackStep, {
      when: async ({ context }) => {
        const checkStepResult = context.steps?.[checkStepKey];
        if (checkStepResult?.status !== "success") {
          return "abort" /* ABORT */;
        }
        const status = checkStepResult?.output?.status;
        return status === "continue" ? "continue" /* CONTINUE */ : "continue_failed" /* CONTINUE_FAILED */;
      },
      "#internal": {
        //@ts-ignore
        when: condition,
        //@ts-ignore
        loopType
      }
    }).then(checkStep, {
      "#internal": {
        loopLabel: `${fallbackStepKey} ${loopType} loop check`
      }
    }).step(loopFinishedStep, {
      when: async ({ context }) => {
        const checkStepResult = context.steps?.[checkStepKey];
        if (checkStepResult?.status !== "success") {
          return "continue_failed" /* CONTINUE_FAILED */;
        }
        const status = checkStepResult?.output?.status;
        return status === "complete" ? "continue" /* CONTINUE */ : "continue_failed" /* CONTINUE_FAILED */;
      },
      "#internal": {
        loopLabel: `${fallbackStepKey} ${loopType} loop finished`,
        //@ts-ignore
        loopType
      }
    });
    return this;
  }
  while(condition, fallbackStep) {
    const applyOperator = (operator, value, target) => {
      switch (operator) {
        case "$eq":
          return { status: value !== target ? "complete" : "continue" };
        case "$ne":
          return { status: value === target ? "complete" : "continue" };
        case "$gt":
          return { status: value <= target ? "complete" : "continue" };
        case "$gte":
          return { status: value < target ? "complete" : "continue" };
        case "$lt":
          return { status: value >= target ? "complete" : "continue" };
        case "$lte":
          return { status: value > target ? "complete" : "continue" };
        default:
          return { status: "continue" };
      }
    };
    return this.loop(applyOperator, condition, fallbackStep, "while");
  }
  until(condition, fallbackStep) {
    const applyOperator = (operator, value, target) => {
      switch (operator) {
        case "$eq":
          return { status: value === target ? "complete" : "continue" };
        case "$ne":
          return { status: value !== target ? "complete" : "continue" };
        case "$gt":
          return { status: value > target ? "complete" : "continue" };
        case "$gte":
          return { status: value >= target ? "complete" : "continue" };
        case "$lt":
          return { status: value < target ? "complete" : "continue" };
        case "$lte":
          return { status: value <= target ? "complete" : "continue" };
        default:
          return { status: "continue" };
      }
    };
    return this.loop(applyOperator, condition, fallbackStep, "until");
  }
  if(condition) {
    const lastStep = this.#steps[this.#lastStepStack[this.#lastStepStack.length - 1] ?? ""];
    if (!lastStep) {
      throw new Error("Condition requires a step to be executed after");
    }
    this.after(lastStep);
    const ifStepKey = `__${lastStep.id}_if`;
    this.step(
      {
        id: ifStepKey,
        execute: async ({ context }) => {
          return { executed: true };
        }
      },
      {
        when: condition
      }
    );
    const elseStepKey = `__${lastStep.id}_else`;
    this.#ifStack.push({ condition, elseStepKey, condStep: lastStep });
    return this;
  }
  else() {
    const activeCondition = this.#ifStack.pop();
    if (!activeCondition) {
      throw new Error("No active condition found");
    }
    this.after(activeCondition.condStep).step(
      {
        id: activeCondition.elseStepKey,
        execute: async ({ context }) => {
          return { executed: true };
        }
      },
      {
        when: typeof activeCondition.condition === "function" ? async (payload) => {
          const result = await activeCondition.condition(payload);
          return !result;
        } : { not: activeCondition.condition }
      }
    );
    return this;
  }
  after(steps) {
    const stepsArray = Array.isArray(steps) ? steps : [steps];
    const stepKeys = stepsArray.map((step) => this.#makeStepKey(step));
    const compoundKey = stepKeys.join("&&");
    this.#afterStepStack.push(compoundKey);
    if (!this.#stepSubscriberGraph[compoundKey]) {
      this.#stepSubscriberGraph[compoundKey] = { initial: [] };
      this.#serializedStepSubscriberGraph[compoundKey] = { initial: [] };
    }
    return this;
  }
  afterEvent(eventName) {
    const event = this.events?.[eventName];
    if (!event) {
      throw new Error(`Event ${eventName} not found`);
    }
    const lastStep = this.#steps[this.#lastStepStack[this.#lastStepStack.length - 1] ?? ""];
    if (!lastStep) {
      throw new Error("Condition requires a step to be executed after");
    }
    const eventStepKey = `__${eventName}_event`;
    const eventStep = new Step({
      id: eventStepKey,
      execute: async ({ context, suspend }) => {
        if (context.inputData?.resumedEvent) {
          return { executed: true, resumedEvent: context.inputData?.resumedEvent };
        }
        await suspend();
        return { executed: false };
      }
    });
    this.after(lastStep).step(eventStep).after(eventStep);
    return this;
  }
  /**
   * Executes the workflow with the given trigger data
   * @param triggerData - Initial data to start the workflow with
   * @returns Promise resolving to workflow results or rejecting with error
   * @throws Error if trigger schema validation fails
   */
  createRun({
    runId,
    events
  } = {}) {
    const run = new WorkflowInstance({
      logger: this.logger,
      name: this.name,
      mastra: this.#mastra,
      retryConfig: this.#retryConfig,
      steps: this.#steps,
      runId,
      stepGraph: this.#stepGraph,
      stepSubscriberGraph: this.#stepSubscriberGraph,
      onStepTransition: this.#onStepTransition,
      onFinish: () => {
        this.#runs.delete(run.runId);
      },
      events
    });
    this.#runs.set(run.runId, run);
    return {
      start: run.start.bind(run),
      runId: run.runId,
      watch: run.watch.bind(run),
      resume: run.resume.bind(run),
      resumeWithEvent: run.resumeWithEvent.bind(run)
    };
  }
  /**
   * Gets a workflow run instance by ID
   * @param runId - ID of the run to retrieve
   * @returns The workflow run instance if found, undefined otherwise
   */
  getRun(runId) {
    return this.#runs.get(runId);
  }
  /**
   * Rebuilds the machine with the current steps configuration and validates the workflow
   *
   * This is the last step of a workflow builder method chain
   * @throws Error if validation fails
   *
   * @returns this instance for method chaining
   */
  commit() {
    return this;
  }
  // record all object paths that leads to a suspended state
  #getSuspendedPaths({
    value,
    path,
    suspendedPaths
  }) {
    if (typeof value === "string") {
      if (value === "suspended") {
        suspendedPaths.add(path);
      }
    } else {
      Object.keys(value).forEach(
        (key) => this.#getSuspendedPaths({ value: value[key], path: path ? `${path}.${key}` : key, suspendedPaths })
      );
    }
  }
  async #loadWorkflowSnapshot(runId) {
    if (!this.#mastra?.storage) {
      this.logger.debug("Snapshot cannot be loaded. Mastra engine is not initialized", { runId });
      return;
    }
    const activeRun = this.#runs.get(runId);
    if (activeRun) {
      await activeRun.persistWorkflowSnapshot();
    }
    return this.#mastra.storage.loadWorkflowSnapshot({ runId, workflowName: this.name });
  }
  getExecutionSpan(runId) {
    return this.#runs.get(runId)?.executionSpan;
  }
  #makeStepDef(stepId) {
    const executeStep = (handler2, spanName, attributes) => {
      return async (data) => {
        return await context.with(
          trace.setSpan(context.active(), this.getExecutionSpan(attributes?.runId ?? data?.runId)),
          async () => {
            if (this?.telemetry) {
              return this.telemetry.traceMethod(handler2, {
                spanName,
                attributes
              })(data);
            } else {
              return handler2(data);
            }
          }
        );
      };
    };
    const handler = async ({ context, ...rest }) => {
      const targetStep = this.#steps[stepId];
      if (!targetStep) throw new Error(`Step not found`);
      const { payload = {}, execute = async () => {
      } } = targetStep;
      const finalAction = this.telemetry ? executeStep(execute, `workflow.${this.name}.action.${stepId}`, {
        componentName: this.name,
        runId: rest.runId
      }) : execute;
      return finalAction ? await finalAction({
        context: { ...context, inputData: { ...context?.inputData || {}, ...payload } },
        ...rest
      }) : {};
    };
    const finalHandler = ({ context, ...rest }) => {
      if (this.getExecutionSpan(rest?.runId)) {
        return executeStep(handler, `workflow.${this.name}.step.${stepId}`, {
          componentName: this.name,
          runId: rest?.runId
        })({ context, ...rest });
      }
      return handler({ context, ...rest });
    };
    return {
      handler: finalHandler,
      data: {}
    };
  }
  #getActivePathsAndStatus(value) {
    const paths = [];
    const traverse = (current, path = []) => {
      for (const [key, value2] of Object.entries(current)) {
        const currentPath = [...path, key];
        if (typeof value2 === "string") {
          paths.push({
            stepPath: currentPath,
            stepId: key,
            status: value2
          });
        } else if (typeof value2 === "object" && value2 !== null) {
          traverse(value2, currentPath);
        }
      }
    };
    traverse(value);
    return paths;
  }
  async getState(runId) {
    const run = this.#runs.get(runId);
    if (run) {
      return run.getState();
    }
    const storedSnapshot = await this.#mastra?.storage?.loadWorkflowSnapshot({
      runId,
      workflowName: this.name
    });
    if (storedSnapshot) {
      const parsed = storedSnapshot;
      const m = this.#getActivePathsAndStatus(parsed.value);
      return {
        runId,
        value: parsed.value,
        context: parsed.context,
        activePaths: m,
        timestamp: Date.now()
      };
    }
    return null;
  }
  async resume({
    runId,
    stepId,
    context: resumeContext
  }) {
    this.logger.warn(`Please use 'resume' on the 'createRun' call instead, resume is deprecated`);
    const activeRun = this.#runs.get(runId);
    if (activeRun) {
      return activeRun.resume({ stepId, context: resumeContext });
    }
    throw new Error(`Workflow run ${runId} not found`);
  }
  watch(onTransition) {
    this.logger.warn(`Please use 'watch' on the 'createRun' call instead, watch is deprecated`);
    this.#onStepTransition.add(onTransition);
    return () => {
      this.#onStepTransition.delete(onTransition);
    };
  }
  async resumeWithEvent(runId, eventName, data) {
    this.logger.warn(`Please use 'resumeWithEvent' on the 'createRun' call instead, resumeWithEvent is deprecated`);
    const event = this.events?.[eventName];
    if (!event) {
      throw new Error(`Event ${eventName} not found`);
    }
    const results = await this.resume({ runId, stepId: `__${eventName}_event`, context: { resumedEvent: data } });
    return results;
  }
  __registerMastra(mastra) {
    this.#mastra = mastra;
  }
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
  }
  get stepGraph() {
    return this.#stepGraph;
  }
  get stepSubscriberGraph() {
    return this.#stepSubscriberGraph;
  }
  get serializedStepGraph() {
    return this.#serializedStepGraph;
  }
  get serializedStepSubscriberGraph() {
    return this.#serializedStepSubscriberGraph;
  }
  get steps() {
    return this.#steps;
  }
};

export { Step, Workflow };
