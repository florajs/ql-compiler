Flora QL Compile
================

Compiles a Flora Query Language statement into a function.

Examples
--------

```js
const ql = require('flora-ql');
const compile = require('./compile');

ql.setConfig('api');

// Use a Flora filter as function
const filterFn = compile.filter(ql.parse('id=321 AND userId=109369'));

filterFn({ id: 321, userId: 109369 }) // => true
filterFn({ id: 321, userId: 109368 }) // => false

// Use a Flora select statment as function
const selectFn = compile.select('foo,bar[baz]');

selectFn({ foo: 42, bar: { baz: 23, id: 1337 }, bla: 'blubb' });
// => { foo: 42, bar: { baz: 23 } }
```

License
-------

[MIT](LICENSE)
