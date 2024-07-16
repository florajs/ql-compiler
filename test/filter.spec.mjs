import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import compile from '../index.js';

describe('filter compiler', () => {
    it('should be a function', () => {
        assert.equal(typeof compile.filter, 'function');
    });

    it('should generate a function', () => {
        const fn = compile.filter('id=123');
        assert.equal(typeof fn, 'function');
    });

    describe('NOT terms', () => {
        it('should compile NOT terms', () => {
            const fn = compile.filter('id!=123');
            assert.equal(fn({ id: 123 }), false);
            assert.equal(fn({ id: 456 }), true);
        });
    });

    describe('AND terms', () => {
        const input = 'id=321 AND userId=109369';

        it('should compile AND terms', () => {
            const fn = compile.filter(input);
            assert.equal(fn({ id: 321, userId: 109369 }), true);
            assert.equal(fn({ id: 321, userId: 109368 }), false);
            assert.equal(fn({ id: 320, userId: 109369 }), false);
            assert.equal(fn({ id: 320, userId: 109368 }), false);
        });

        it('should return false on incomplete inputs', () => {
            const fn = compile.filter(input);
            assert.equal(fn({ id: 321 }), false);
            assert.equal(fn({ userId: 109368 }), false);
        });

        it('should return false on empty inputs', () => {
            const fn = compile.filter(input);
            assert.equal(fn({}), false);
        });
    });

    describe('OR terms', () => {
        const input = 'id=321 OR userId=109369';

        it('should compile OR terms', () => {
            const fn = compile.filter(input);
            assert.equal(fn({ id: 321, userId: 109369 }), true);
            assert.equal(fn({ id: 321, userId: 109368 }), true);
            assert.equal(fn({ id: 320, userId: 109369 }), true);
            assert.equal(fn({ id: 320, userId: 109368 }), false);
        });

        it('should work on incomplete (but satisfying) inputs', () => {
            const fn = compile.filter(input);
            assert.equal(fn({ id: 321 }), true);
        });

        it('should return false on empty inputs', () => {
            const fn = compile.filter(input);
            assert.equal(fn({}), false);
        });
    });

    describe('list values', () => {
        it('should compile list values to OR', () => {
            const fn = compile.filter('id=23,42');
            assert.equal(fn({ id: 23 }), true);
            assert.equal(fn({ id: 42 }), true);
            assert.equal(fn({ id: 123 }), false);
        });

        it('should compile negated list values to OR', () => {
            const fn = compile.filter('id!=23,42');
            assert.equal(fn({ id: 23 }), false);
            assert.equal(fn({ id: 42 }), false);
            assert.equal(fn({ id: 123 }), true);
        });
    });

    describe('nested attributes', () => {
        const input = 'user.id=42';

        it('should be resolved', () => {
            const fn = compile.filter(input);
            assert.equal(fn({ user: { id: 42 } }), true);
            assert.equal(fn({ user: { id: 43 } }), false);
            assert.equal(fn({ user: {} }), false);
            assert.equal(fn({ user: 42 }), false);
        });

        it('should support arrays in value', () => {
            const fn = compile.filter(input);
            assert.equal(fn({ user: [{ id: 42 }] }), true);
            assert.equal(fn({ user: [{ id: 43 }] }), false);
            assert.equal(fn({ user: [] }), false);
            assert.equal(fn({ user: {} }), false);
        });

        it('should apply NOT to all items in arrays', () => {
            const fn = compile.filter('foo.id!=13');
            assert.equal(fn({ foo: { id: 13 } }), false);
            assert.equal(fn({ foo: { id: 42 } }), true);
            assert.equal(fn({ foo: [{ id: 13 }] }), false);
            assert.equal(fn({ foo: [{ id: 42 }, { id: 11 }] }), true);
            assert.equal(fn({ foo: [{ id: 42 }, { id: 13 }] }), false);
        });

        it('should apply NOT to all items in arrays (array values)', () => {
            const fn = compile.filter('foo.id!=13,14');
            assert.equal(fn({ foo: { id: 13 } }), false);
            assert.equal(fn({ foo: { id: 14 } }), false);
            assert.equal(fn({ foo: { id: 42 } }), true);
            assert.equal(fn({ foo: [{ id: 13 }] }), false);
            assert.equal(fn({ foo: [{ id: 14 }] }), false);
            assert.equal(fn({ foo: [{ id: 15 }] }), true);
            assert.equal(fn({ foo: [{ id: 42 }, { id: 11 }] }), true);
            assert.equal(fn({ foo: [{ id: 42 }, { id: 13 }] }), false);
            assert.equal(fn({ foo: [{ id: 13 }, { id: 14 }] }), false);
        });
    });
});
