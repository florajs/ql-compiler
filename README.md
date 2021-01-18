# flora-ql-compile

![](https://github.com/godmodelabs/flora-ql-compile/workflows/ci/badge.svg)
[![NPM version](https://img.shields.io/npm/v/flora-ql-compile.svg?style=flat)](https://www.npmjs.com/package/flora-ql-compile)
[![NPM downloads](https://img.shields.io/npm/dm/flora-ql-compile.svg?style=flat)](https://www.npmjs.com/package/flora-ql-compile)

Compiles a Flora Query Language statement into a function.

## Examples

```js
const compile = require('flora-ql-compile');

// Use a Flora filter as function
const filterFn = compile.filter('id=321 AND userId=109369');
filterFn({ id: 321, userId: 109369 }) // => true
filterFn({ id: 321, userId: 109368 }) // => false

// Use a Flora select statment as function
const selectFn = compile.select('foo,bar[baz]');
selectFn({ foo: 42, bar: { baz: 23, id: 1337 }, bla: 'blubb' })
// => { foo: 42, bar: { baz: 23 } }
```

## License

[MIT](LICENSE)
