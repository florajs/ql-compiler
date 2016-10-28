'use strict';

var expect = require('chai').expect;

var compile = require('../');

describe('select compiler', function () {
    it('should be a function', function () {
        expect(compile.select).to.be.a('function');
    });

    it('should generate a function', function () {
        var fn = compile.select('foo,bar');
        expect(fn).to.be.a.function;
    });

    describe('single attribute', function () {
        var select = 'id';

        it('single attributes with scalar input', function () {
            var fn = compile.select(select);
            expect(fn({id: 321})).to.eql({id: 321});
            expect(fn({id: 0})).to.eql({id: 0});
            expect(fn({id: 321, userId: 109369})).to.eql({id: 321});
        });

        it('single attributes with null input', function () {
            var fn = compile.select(select);
            expect(fn({id: null})).to.eql({id: null});
        });

        it('single attributes with object input (no sub-properties)', function () {
            var fn = compile.select(select);
            expect(fn({id: {foo: 'bar'}})).to.eql({id: {}});
        });

        it('single attributes with array input', function () {
            var fn = compile.select(select);
            expect(fn({id: [1, 2, 3]})).to.eql({id: [1, 2, 3]});
        });

        it('single attributes with empty input', function () {
            var fn = compile.select(select);
            expect(fn({})).to.eql({});
        });

        it('single attributes with unknown input', function () {
            var fn = compile.select(select);
            expect(fn({foo: 42})).to.eql({});
        });
    });

    describe('flat list', function () {
        var select = 'id,name';

        it('list with scalar values', function () {
            var fn = compile.select(select);
            expect(fn({id: 321})).to.eql({id: 321});
            expect(fn({id: 321, name: 'Bob'})).to.eql({id: 321, name: 'Bob'});
            expect(fn({id: 321, userId: 109369})).to.eql({id: 321});
        });

        it('list with empty input', function () {
            var fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({foo: 42})).to.eql({});
        });
    });

    describe('single nested attribute', function () {
        var select = 'instrument[id]';

        it('with scalar input', function () {
            var fn = compile.select(select);
            expect(fn({instrument: {id: 42}})).to.eql({instrument: {id: 42}});
            expect(fn({instrument: {id: 42}, name: 'foo'})).to.eql({instrument: {id: 42}});
            expect(fn({instrument: {id: 42, name: 'foo'}})).to.eql({instrument: {id: 42}});
        });

        it('with empty input', function () {
            var fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({instrument: {}})).to.eql({instrument: {}});
        });
    });

    describe('single deep nested attribute', function () {
        var select = 'instrument[underlying[id]]';

        it('with scalar input', function () {
            var fn = compile.select(select);
            expect(fn({instrument: {underlying: {id: 42}}})).to.eql({instrument: {underlying: {id: 42}}});
            expect(fn({instrument: {underlying: {id: 42}}, name: 'foo'})).to.eql({instrument: {underlying: {id: 42}}});
            expect(fn({instrument: {underlying: {id: 42, name: 'foo'}}})).to.eql({instrument: {underlying: {id: 42}}});
        });

        it('with empty input', function () {
            var fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({instrument: {}})).to.eql({instrument: {}});
            expect(fn({instrument: {underlying: {}}})).to.eql({instrument: {underlying: {}}});
        });
    });

    describe('nested attributes (dot notation)', function () {
        var select = 'quote.bid.value';
        var fn = compile.select(select);

        it('with single value present', function () {
            expect(fn({quote: {bid: {value: 42}}})).to.eql({quote: {bid: {value: 42}}});
        });

        it('with multiple values present', function () {
            expect(fn({quote: {bid: {value: 42}, ask: {value: 23}}})).to.eql({quote: {bid: {value: 42}}});
        });
    });

    describe('nested attributes (mixed notation)', function () {
        var select = 'instrument[quote.bid].value';
        var fn = compile.select(select);

        xit('with single value present', function () {
            expect(fn({instrument: {quote: {bid: {value: 42}}}})).to.eql({instrument: {quote: {bid: {value: 42}}}});
            expect(fn({instrument: {quote: {bid: {value: 42, name: 'xy'}}}})).to.eql({instrument: {quote: {bid: {value: 42}}}});
            expect(fn({instrument: {quote: {bid: {value: 42}, ask: {value: 23}}}})).to.eql({instrument: {quote: {bid: {value: 42}}}});
            expect(fn({instrument: {quote: {bid: {value: 42}}}, name: 'DAX'})).to.eql({instrument: {quote: {bid: {value: 42}}}});
        });
    });

    describe('mixed attributes', function () {
        var select = 'instrument[underlying[id,title]],teaser';
        var fn = compile.select(select);

        it('with scalar input', function () {
            expect(fn({instrument: {underlying: {id: 42}}})).to.eql({instrument: {underlying: {id: 42}}});
            expect(fn({instrument: {underlying: {id: 42}}, name: 'foo'})).to.eql({instrument: {underlying: {id: 42}}});
            expect(fn({instrument: {underlying: {id: 42, name: 'foo'}}})).to.eql({instrument: {underlying: {id: 42}}});
            expect(fn({instrument: {underlying: {id: 42, name: 'foo'}}, 'teaser': 'bla'})).to.eql({instrument: {underlying: {id: 42}}, 'teaser': 'bla'});
            expect(fn({instrument: {underlying: {id: 42, title: 'foo'}}})).to.eql({instrument: {underlying: {id: 42, 'title': 'foo'}}});
            expect(fn({instrument: {underlying: {id: 42, title: 'foo'}}, 'teaser': 'bla'})).to.eql({instrument: {underlying: {id: 42, 'title': 'foo'}}, 'teaser': 'bla'});
        });
    });

    describe('multiplied attributes', function () {
        var select = 'quote[bid,ask].value';
        var fn = compile.select(select);

        it('with single value present', function () {
            expect(fn({quote: {bid: {value: 42}}})).to.eql({quote: {bid: {value: 42}}});
            expect(fn({quote: {ask: {value: 23}}})).to.eql({quote: {ask: {value: 23}}});
        });

        it('with multiple values present', function () {
            expect(fn({quote: {bid: {value: 42}, ask: {value: 23}}})).to.eql({quote: {bid: {value: 42}, ask: {value: 23}}});
        });
    });

    describe('nested multiplied attributes', function () {
        var select = 'instrument.quote[bid,ask][value,date]';
        var fn = compile.select(select);

        it('with single value present', function () {
            expect(fn({instrument: {quote: {bid: {value: 42}}}})).to.eql({instrument: {quote: {bid: {value: 42}}}});
            expect(fn({instrument: {quote: {bid: {date: '2016-01-01'}}}})).to.eql({instrument: {quote: {bid: {date: '2016-01-01'}}}});
            expect(fn({instrument: {quote: {bid: {value: 42, date: '2016-01-01'}}}})).to.eql({instrument: {quote: {bid: {value: 42, date: '2016-01-01'}}}});
            expect(fn({instrument: {quote: {bid: {value: 42}, ask: {value: 23}}}})).to.eql({instrument: {quote: {bid: {value: 42}, ask: {value: 23}}}});
            expect(fn({instrument: {quote: {bid: {value: 42, date: '2016-01-01'}, ask: {value: 23, date: '2016-01-02'}}}})).to.eql({instrument: {quote: {bid: {value: 42, date: '2016-01-01'}, ask: {value: 23, date: '2016-01-02'}}}});
        });
    });
});
