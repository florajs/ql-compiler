import { filter as filterParser } from 'flora-request-parser';

const operators = {
    notEqual: (a, b) => (a !== b),
    lessOrEqual: (a, b) => (a <= b),
    greaterOrEqual: (a, b) => (a >= b),
    equal: (a, b) => (a === b),
    less: (a, b) => (a < b),
    greater: (a, b) => (a > b),
};

function genAndFn(fns) {
    return (input => fns.every(fn => fn(input)));
}

function genOrFn(fns) {
    return (input => fns.some(fn => fn(input)));
}

function compareValue(obj, key, value, fn) {
    const compareFunction = fn || ((a, b) => (a === b));

    if (Array.isArray(obj)) {
        return obj.some(element => compareValue(element, key, value, compareFunction));
    }

    if (Array.isArray(key)) {
        if (key.length === 1) return compareValue(obj, key[0], value, compareFunction);
        if (key.length === 0) return false;
        if (!obj[key[0]]) return false;
        return compareValue(obj[key[0]], key.slice(1), value, compareFunction);
    }

    return compareFunction(obj[key], value);
}

export default function (filter) {
    const parsed = filterParser(filter);

    return genOrFn(
        parsed.map(orTerm => genAndFn(orTerm.map((andTerm) => {
            const opFn = operators[andTerm.operator];
            return (input => compareValue(input, andTerm.attribute, andTerm.value, opFn));
        })))
    );
}
