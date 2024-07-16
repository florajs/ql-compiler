import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import compile from '../index.js';

describe('select compiler', () => {
    it('should be a function', () => {
        assert.equal(typeof compile.select, 'function');
    });

    it('should generate a function', () => {
        const fn = compile.select('foo,bar');
        assert.equal(typeof fn, 'function');
    });

    describe('single attribute', () => {
        const select = 'id';

        it('single attributes with scalar input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ id: 321 }), { id: 321 });
            assert.deepEqual(fn({ id: 0 }), { id: 0 });
            assert.deepEqual(fn({ id: 321, userId: 109369 }), { id: 321 });
        });

        it('single attributes with null input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ id: null }), { id: null });
        });

        it('single attributes with object input (no sub-properties)', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ id: { foo: 'bar' } }), { id: {} });
        });

        it('single attributes with array input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ id: [1, 2, 3] }), { id: [1, 2, 3] });
        });

        it('single attributes with empty input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({}), {});
        });

        it('single attributes with unknown input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ foo: 42 }), {});
        });

        it('input array', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn([{ id: 1 }, { id: 2 }]), [{ id: 1 }, { id: 2 }]);
            assert.deepEqual(
                fn([
                    { id: 1, name: 'foo' },
                    { id: 2, name: 'bar' }
                ]),
                [{ id: 1 }, { id: 2 }]
            );
        });
    });

    describe('flat list', () => {
        const select = 'id,name';

        it('list with scalar values', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ id: 321 }), { id: 321 });
            assert.deepEqual(fn({ id: 321, name: 'Bob' }), { id: 321, name: 'Bob' });
            assert.deepEqual(fn({ id: 321, userId: 109369 }), { id: 321 });
        });

        it('list with empty input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({}), {});
            assert.deepEqual(fn({ foo: 42 }), {});
        });
    });

    describe('empty nested attribute', () => {
        const select = 'instrument(filter=a=1)';

        it('with scalar input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ instrument: { id: 42 } }), { instrument: {} });
            assert.deepEqual(fn({ instrument: { id: 42 }, name: 'foo' }), { instrument: {} });
            assert.deepEqual(fn({ instrument: { id: 42, name: 'foo' } }), { instrument: {} });
        });

        it('with empty input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({}), {});
            assert.deepEqual(fn({ instrument: {} }), { instrument: {} });
        });
    });

    describe('single nested attribute', () => {
        const select = 'instrument[id]';

        it('with scalar input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ instrument: { id: 42 } }), { instrument: { id: 42 } });
            assert.deepEqual(fn({ instrument: { id: 42 }, name: 'foo' }), { instrument: { id: 42 } });
            assert.deepEqual(fn({ instrument: { id: 42, name: 'foo' } }), { instrument: { id: 42 } });
        });

        it('with empty input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({}), {});
            assert.deepEqual(fn({ instrument: {} }), { instrument: {} });
        });
    });

    describe('single deep nested attribute', () => {
        const select = 'instrument[underlying[id]]';

        it('with scalar input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({ instrument: { underlying: { id: 42 } } }), {
                instrument: { underlying: { id: 42 } }
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42 } }, name: 'foo' }), {
                instrument: { underlying: { id: 42 } }
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42, name: 'foo' } } }), {
                instrument: { underlying: { id: 42 } }
            });
        });

        it('with empty input', () => {
            const fn = compile.select(select);
            assert.deepEqual(fn({}), {});
            assert.deepEqual(fn({ instrument: {} }), { instrument: {} });
            assert.deepEqual(fn({ instrument: { underlying: {} } }), { instrument: { underlying: {} } });
        });
    });

    describe('nested attributes (dot notation)', () => {
        const select = 'quote.bid.value';
        const fn = compile.select(select);

        it('with single value present', () => {
            assert.deepEqual(fn({ quote: { bid: { value: 42 } } }), { quote: { bid: { value: 42 } } });
        });

        it('with multiple values present', () => {
            assert.deepEqual(fn({ quote: { bid: { value: 42 }, ask: { value: 23 } } }), {
                quote: { bid: { value: 42 } }
            });
        });

        it('with parent null value', () => {
            assert.deepEqual(fn({ quote: { bid: null, ask: { value: 23 } } }), { quote: { bid: null } });
            assert.deepEqual(fn({ quote: null }), { quote: null });
        });

        it('with parent non-object value', () => {
            assert.deepEqual(fn({ quote: 123 }), { quote: null });
        });
    });

    describe('nested attributes (mixed notation)', () => {
        const select = 'instrument[quote.bid].value';
        const fn = compile.select(select);

        it('with single value present', () => {
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42 } } } }), {
                instrument: { quote: { bid: { value: 42 } } }
            });
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42, name: 'xy' } } } }), {
                instrument: { quote: { bid: { value: 42 } } }
            });
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42 }, ask: { value: 23 } } } }), {
                instrument: { quote: { bid: { value: 42 } } }
            });
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42 } } }, name: 'DAX' }), {
                instrument: { quote: { bid: { value: 42 } } }
            });
        });
    });

    describe('mixed attributes', () => {
        const select = 'instrument[underlying[id,title]],teaser';
        const fn = compile.select(select);

        it('with scalar input', () => {
            assert.deepEqual(fn({ instrument: { underlying: { id: 42 } } }), {
                instrument: { underlying: { id: 42 } }
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42 } }, name: 'foo' }), {
                instrument: { underlying: { id: 42 } }
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42, name: 'foo' } } }), {
                instrument: { underlying: { id: 42 } }
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42, name: 'foo' } }, teaser: 'bla' }), {
                instrument: { underlying: { id: 42 } },
                teaser: 'bla'
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42, title: 'foo' } } }), {
                instrument: { underlying: { id: 42, title: 'foo' } }
            });
            assert.deepEqual(fn({ instrument: { underlying: { id: 42, title: 'foo' } }, teaser: 'bla' }), {
                instrument: { underlying: { id: 42, title: 'foo' } },
                teaser: 'bla'
            });
        });
    });

    describe('multiplied attributes', () => {
        const select = 'quote[bid,ask].value';
        const fn = compile.select(select);

        it('with single value present', () => {
            assert.deepEqual(fn({ quote: { bid: { value: 42 } } }), { quote: { bid: { value: 42 } } });
            assert.deepEqual(fn({ quote: { ask: { value: 23 } } }), { quote: { ask: { value: 23 } } });
        });

        it('with multiple values present', () => {
            assert.deepEqual(fn({ quote: { bid: { value: 42 }, ask: { value: 23 } } }), {
                quote: { bid: { value: 42 }, ask: { value: 23 } }
            });
        });
    });

    describe('nested multiplied attributes', () => {
        const select = 'instrument.quote[bid,ask][value,date]';
        const fn = compile.select(select);

        it('with single value present', () => {
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42 } } } }), {
                instrument: { quote: { bid: { value: 42 } } }
            });
            assert.deepEqual(fn({ instrument: { quote: { bid: { date: '2016-01-01' } } } }), {
                instrument: { quote: { bid: { date: '2016-01-01' } } }
            });
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42, date: '2016-01-01' } } } }), {
                instrument: { quote: { bid: { value: 42, date: '2016-01-01' } } }
            });
            assert.deepEqual(fn({ instrument: { quote: { bid: { value: 42 }, ask: { value: 23 } } } }), {
                instrument: { quote: { bid: { value: 42 }, ask: { value: 23 } } }
            });
            assert.deepEqual(
                fn({
                    instrument: {
                        quote: { bid: { value: 42, date: '2016-01-01' }, ask: { value: 23, date: '2016-01-02' } }
                    }
                }),
                {
                    instrument: {
                        quote: { bid: { value: 42, date: '2016-01-01' }, ask: { value: 23, date: '2016-01-02' } }
                    }
                }
            );
        });
    });
});
