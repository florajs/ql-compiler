'use strict';

const filterParser = require('@florajs/request-parser').filter;

const operators = {
    notEqual: (a, b) => a !== b,
    lessOrEqual: (a, b) => a <= b,
    greaterOrEqual: (a, b) => a >= b,
    equal: (a, b) => a === b,
    less: (a, b) => a < b,
    greater: (a, b) => a > b
};

function genAndFn(fns) {
    return (input) => fns.every((fn) => fn(input));
}

function genOrFn(fns) {
    return (input) => fns.some((fn) => fn(input));
}

function compareValue(obj, key, value, fn) {
    const compareFunction = fn || ((a, b) => a === b);

    if (Array.isArray(obj)) {
        if (compareFunction === operators.notEqual) {
            return obj.every((element) => compareValue(element, key, value, compareFunction));
        }
        return obj.some((element) => compareValue(element, key, value, compareFunction));
    }

    if (Array.isArray(key)) {
        if (key.length === 1) return compareValue(obj, key[0], value, compareFunction);
        if (key.length === 0) return false;
        if (!obj[key[0]]) return false;
        return compareValue(obj[key[0]], key.slice(1), value, compareFunction);
    }

    if (Array.isArray(value)) {
        if (compareFunction === operators.notEqual) {
            return value.every((v, idx) => compareValue(obj, key, value[idx], compareFunction));
        }
        return value.some((v, idx) => compareValue(obj, key, value[idx], compareFunction));
    }

    return compareFunction(obj[key], value);
}

module.exports = function filter(input) {
    const parsed = filterParser(input);

    return genOrFn(
        parsed.map((orTerm) =>
            genAndFn(
                orTerm.map((andTerm) => {
                    const opFn = operators[andTerm.operator];
                    return (value) => compareValue(value, andTerm.attribute, andTerm.value, opFn);
                })
            )
        )
    );
};
