Flora QL Compile
================

Examples
--------

```js
var ql = require('flora-ql');
var compile = require('./compile');

ql.setConfig('api');

var fn = compile(ql.parse('id=321 AND userId=109369'));

fn({id: 321, userId: 109369}) // true
fn({id: 321, userId: 109368}) // false
```

License
-------

[MIT](LICENSE)
