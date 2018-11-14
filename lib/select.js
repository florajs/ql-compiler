'use strict';

const selectParser = require('flora-request-parser').select;

function filter(attrs, input) {
    if (Array.isArray(input)) {
        return input.map(inputPart => filter(attrs, inputPart));
    }

    const output = {};

    if (attrs.select) {
        Object.keys(attrs.select).forEach(attr => {
            if (attr in input) {
                if (Object.keys(attrs.select[attr]).length === 0) {
                    const isObj = typeof input[attr] === 'object' && input[attr] !== null && !Array.isArray(input[attr]);
                    output[attr] = isObj ? {} : input[attr];
                } else {
                    output[attr] = filter(attrs.select[attr], input[attr]);
                }
            }
        });
    }

    return output;
}

module.exports = function select(input) {
    const parsed = selectParser(input);

    return value => filter({ select: parsed }, value);
};
