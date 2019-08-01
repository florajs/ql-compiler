/* global describe, it */

'use strict';

const { expect } = require('chai');

const compile = require('../');

describe('select compiler', () => {
    it('should be a function', () => {
        expect(compile.select).to.be.a('function');
    });

    it('should generate a function', () => {
        const fn = compile.select('foo,bar');
        expect(fn).to.be.a('function');
    });

    describe('single attribute', () => {
        const select = 'id';

        it('single attributes with scalar input', () => {
            const fn = compile.select(select);
            expect(fn({ id: 321 })).to.eql({ id: 321 });
            expect(fn({ id: 0 })).to.eql({ id: 0 });
            expect(fn({ id: 321, userId: 109369 })).to.eql({ id: 321 });
        });

        it('single attributes with null input', () => {
            const fn = compile.select(select);
            expect(fn({ id: null })).to.eql({ id: null });
        });

        it('single attributes with object input (no sub-properties)', () => {
            const fn = compile.select(select);
            expect(fn({ id: { foo: 'bar' } })).to.eql({ id: {} });
        });

        it('single attributes with array input', () => {
            const fn = compile.select(select);
            expect(fn({ id: [1, 2, 3] })).to.eql({ id: [1, 2, 3] });
        });

        it('single attributes with empty input', () => {
            const fn = compile.select(select);
            expect(fn({})).to.eql({});
        });

        it('single attributes with unknown input', () => {
            const fn = compile.select(select);
            expect(fn({ foo: 42 })).to.eql({});
        });

        it('input array', () => {
            const fn = compile.select(select);
            expect(fn([{ id: 1 }, { id: 2 }])).to.eql([{ id: 1 }, { id: 2 }]);
            expect(fn([{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }])).to.eql([{ id: 1 }, { id: 2 }]);
        });
    });

    describe('flat list', () => {
        const select = 'id,name';

        it('list with scalar values', () => {
            const fn = compile.select(select);
            expect(fn({ id: 321 })).to.eql({ id: 321 });
            expect(fn({ id: 321, name: 'Bob' })).to.eql({ id: 321, name: 'Bob' });
            expect(fn({ id: 321, userId: 109369 })).to.eql({ id: 321 });
        });

        it('list with empty input', () => {
            const fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({ foo: 42 })).to.eql({});
        });
    });

    describe('empty nested attribute', () => {
        const select = 'instrument(filter=a=1)';

        it('with scalar input', () => {
            const fn = compile.select(select);
            expect(fn({ instrument: { id: 42 } })).to.eql({ instrument: {} });
            expect(fn({ instrument: { id: 42 }, name: 'foo' })).to.eql({ instrument: {} });
            expect(fn({ instrument: { id: 42, name: 'foo' } })).to.eql({ instrument: {} });
        });

        it('with empty input', () => {
            const fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({ instrument: {} })).to.eql({ instrument: {} });
        });
    });

    describe('single nested attribute', () => {
        const select = 'instrument[id]';

        it('with scalar input', () => {
            const fn = compile.select(select);
            expect(fn({ instrument: { id: 42 } })).to.eql({ instrument: { id: 42 } });
            expect(fn({ instrument: { id: 42 }, name: 'foo' })).to.eql({ instrument: { id: 42 } });
            expect(fn({ instrument: { id: 42, name: 'foo' } })).to.eql({ instrument: { id: 42 } });
        });

        it('with empty input', () => {
            const fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({ instrument: {} })).to.eql({ instrument: {} });
        });
    });

    describe('single deep nested attribute', () => {
        const select = 'instrument[underlying[id]]';

        it('with scalar input', () => {
            const fn = compile.select(select);
            expect(fn({ instrument: { underlying: { id: 42 } } })).to.eql({ instrument: { underlying: { id: 42 } } });
            expect(fn({ instrument: { underlying: { id: 42 } }, name: 'foo' })).to.eql({ instrument: { underlying: { id: 42 } } });
            expect(fn({ instrument: { underlying: { id: 42, name: 'foo' } } })).to.eql({ instrument: { underlying: { id: 42 } } });
        });

        it('with empty input', () => {
            const fn = compile.select(select);
            expect(fn({})).to.eql({});
            expect(fn({ instrument: {} })).to.eql({ instrument: {} });
            expect(fn({ instrument: { underlying: {} } })).to.eql({ instrument: { underlying: {} } });
        });
    });

    describe('nested attributes (dot notation)', () => {
        const select = 'quote.bid.value';
        const fn = compile.select(select);

        it('with single value present', () => {
            expect(fn({ quote: { bid: { value: 42 } } })).to.eql({ quote: { bid: { value: 42 } } });
        });

        it('with multiple values present', () => {
            expect(fn({ quote: { bid: { value: 42 }, ask: { value: 23 } } })).to.eql({ quote: { bid: { value: 42 } } });
        });

        it('with parent null value', () => {
            expect(fn({ quote: { bid: null, ask: { value: 23 } } })).to.eql({ quote: { bid: null } });
            expect(fn({ quote: null })).to.eql({ quote: null });
        });

        it('with parent non-object value', () => {
            expect(fn({ quote: 123 })).to.eql({ quote: null });
        });
    });

    describe('nested attributes (mixed notation)', () => {
        const select = 'instrument[quote.bid].value';
        const fn = compile.select(select);

        it('with single value present', () => {
            expect(fn({ instrument: { quote: { bid: { value: 42 } } } })).to.eql({ instrument: { quote: { bid: { value: 42 } } } });
            expect(fn({ instrument: { quote: { bid: { value: 42, name: 'xy' } } } })).to.eql({
                instrument: { quote: { bid: { value: 42 } } }
            });
            expect(fn({ instrument: { quote: { bid: { value: 42 }, ask: { value: 23 } } } })).to.eql({
                instrument: { quote: { bid: { value: 42 } } }
            });
            expect(fn({ instrument: { quote: { bid: { value: 42 } } }, name: 'DAX' })).to.eql({
                instrument: { quote: { bid: { value: 42 } } }
            });
        });
    });

    describe('mixed attributes', () => {
        const select = 'instrument[underlying[id,title]],teaser';
        const fn = compile.select(select);

        it('with scalar input', () => {
            expect(fn({ instrument: { underlying: { id: 42 } } })).to.eql({ instrument: { underlying: { id: 42 } } });
            expect(fn({ instrument: { underlying: { id: 42 } }, name: 'foo' })).to.eql({ instrument: { underlying: { id: 42 } } });
            expect(fn({ instrument: { underlying: { id: 42, name: 'foo' } } })).to.eql({ instrument: { underlying: { id: 42 } } });
            expect(fn({ instrument: { underlying: { id: 42, name: 'foo' } }, teaser: 'bla' })).to.eql({
                instrument: { underlying: { id: 42 } },
                teaser: 'bla'
            });
            expect(fn({ instrument: { underlying: { id: 42, title: 'foo' } } })).to.eql({
                instrument: { underlying: { id: 42, title: 'foo' } }
            });
            expect(fn({ instrument: { underlying: { id: 42, title: 'foo' } }, teaser: 'bla' })).to.eql({
                instrument: { underlying: { id: 42, title: 'foo' } },
                teaser: 'bla'
            });
        });
    });

    describe('multiplied attributes', () => {
        const select = 'quote[bid,ask].value';
        const fn = compile.select(select);

        it('with single value present', () => {
            expect(fn({ quote: { bid: { value: 42 } } })).to.eql({ quote: { bid: { value: 42 } } });
            expect(fn({ quote: { ask: { value: 23 } } })).to.eql({ quote: { ask: { value: 23 } } });
        });

        it('with multiple values present', () => {
            expect(fn({ quote: { bid: { value: 42 }, ask: { value: 23 } } })).to.eql({ quote: { bid: { value: 42 }, ask: { value: 23 } } });
        });
    });

    describe('nested multiplied attributes', () => {
        const select = 'instrument.quote[bid,ask][value,date]';
        const fn = compile.select(select);

        it('with single value present', () => {
            expect(fn({ instrument: { quote: { bid: { value: 42 } } } })).to.eql({ instrument: { quote: { bid: { value: 42 } } } });
            expect(fn({ instrument: { quote: { bid: { date: '2016-01-01' } } } })).to.eql({
                instrument: { quote: { bid: { date: '2016-01-01' } } }
            });
            expect(fn({ instrument: { quote: { bid: { value: 42, date: '2016-01-01' } } } })).to.eql({
                instrument: { quote: { bid: { value: 42, date: '2016-01-01' } } }
            });
            expect(fn({ instrument: { quote: { bid: { value: 42 }, ask: { value: 23 } } } })).to.eql({
                instrument: { quote: { bid: { value: 42 }, ask: { value: 23 } } }
            });
            expect(
                fn({ instrument: { quote: { bid: { value: 42, date: '2016-01-01' }, ask: { value: 23, date: '2016-01-02' } } } })
            ).to.eql({ instrument: { quote: { bid: { value: 42, date: '2016-01-01' }, ask: { value: 23, date: '2016-01-02' } } } });
        });
    });
});
