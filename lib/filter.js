'use strict';

var filterParser = require('flora-request-parser').filter;

var operators = {
    'notEqual': function (a, b) {
        return a !== b;
    },
    'lessOrEqual': function (a, b) {
        return a <= b;
    },
    'greaterOrEqual': function (a, b) {
        return a >= b;
    },
    'equal': function (a, b) {
        return a === b;
    },
    'less': function (a, b) {
        return a < b;
    },
    'greater': function (a, b) {
        return a > b;
    }
};

/**
 * Compiles a flora-ql filter to a function
 *
 * @param {Object} unparsed flora-ql object
 * @return {Function}
 */
module.exports = function compile(filter) {
    var parsed = filterParser(filter);

    return genOrFn(
        parsed.map(function (orTerm) {
            return genAndFn(orTerm.map(function (andTerm) {
                var opFn = operators[andTerm.operator];
                return function (input) {
                    return compareValue(input, andTerm.attribute, andTerm.value, opFn);
                };
            }));
        })
    );
};

function genAndFn(fns) {
    return function (input) {
        for (var i = 0; i < fns.length; i++) {
            if (!fns[i](input)) return false;
        }
        return true;
    };
}

function genOrFn(fns) {
    return function (input) {
        for (var i = 0; i < fns.length; i++) {
            if (fns[i](input)) return true;
        }
        return false;
    };
}

function compareValue(obj, key, value, compareFunction) {
    compareFunction = compareFunction || function (a, b) {
        return a === b;
    };

    if (Array.isArray(obj)) {
        for (var i = 0; i <= obj.length; i++) {
            if (i in obj) {
                if (compareValue(obj[i], key, value, compareFunction)) return true;
            }
        }
        return false;
    }

    if (Array.isArray(key)) {
        if (key.length === 1) return compareValue(obj, key[0], value, compareFunction);
        if (key.length === 0) return false;
        if (!obj[key[0]]) return false;
        return compareValue(obj[key[0]], key.slice(1), value, compareFunction);
    }

    return compareFunction(obj[key], value);
}
