'use strict';

var selectParser = require('flora-request-parser').select;

/**
 * Compiles a flora-ql select to a function
 *
 * @param {Object} unparsed flora-ql select
 * @return {Function}
 */
module.exports = function compile(select) {
    var parsed = selectParser(select);

    return function (input) {
        return filter({select: parsed}, input);
    };
};

function filter(attrs, input) {
    if (Array.isArray(input)) {
        return input.map(function (inputPart) {
            return filter(attrs, inputPart);
        });
    }

    var output = {};

    if (attrs.select) {
        for (var attr in attrs.select) {
            if (!(attr in input)) continue;
            if (Object.keys(attrs.select[attr]).length === 0) {
                output[attr] = 
                    (typeof input[attr] === 'object' && input[attr] !== null && !Array.isArray(input[attr])) 
                        ? {}
                        : input[attr];
            } else {
                output[attr] = filter(attrs.select[attr], input[attr]);
            }
        }
    }

    return output;
}
