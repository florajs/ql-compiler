'use strict';

const { expect } = require('chai');

const compile = require('../');

describe('filter compiler', () => {
    it('should be a function', () => {
        expect(compile.filter).to.be.a('function');
    });

    it('should generate a function', () => {
        const fn = compile.filter('id=123');
        expect(fn).to.be.a('function');
    });

    describe('NOT terms', () => {
        it('should compile NOT terms', () => {
            const fn = compile.filter('id!=123');
            expect(fn({ id: 123 })).to.equal(false);
            expect(fn({ id: 456 })).to.equal(true);
        });
    });

    describe('AND terms', () => {
        const input = 'id=321 AND userId=109369';

        it('should compile AND terms', () => {
            const fn = compile.filter(input);
            expect(fn({ id: 321, userId: 109369 })).to.equal(true);
            expect(fn({ id: 321, userId: 109368 })).to.equal(false);
            expect(fn({ id: 320, userId: 109369 })).to.equal(false);
            expect(fn({ id: 320, userId: 109368 })).to.equal(false);
        });

        it('should return false on incomplete inputs', () => {
            const fn = compile.filter(input);
            expect(fn({ id: 321 })).to.equal(false);
            expect(fn({ userId: 109368 })).to.equal(false);
        });

        it('should return false on empty inputs', () => {
            const fn = compile.filter(input);
            expect(fn({})).to.equal(false);
        });
    });

    describe('OR terms', () => {
        const input = 'id=321 OR userId=109369';

        it('should compile OR terms', () => {
            const fn = compile.filter(input);
            expect(fn({ id: 321, userId: 109369 })).to.equal(true);
            expect(fn({ id: 321, userId: 109368 })).to.equal(true);
            expect(fn({ id: 320, userId: 109369 })).to.equal(true);
            expect(fn({ id: 320, userId: 109368 })).to.equal(false);
        });

        it('should work on incomplete (but satisfying) inputs', () => {
            const fn = compile.filter(input);
            expect(fn({ id: 321 })).to.equal(true);
        });

        it('should return false on empty inputs', () => {
            const fn = compile.filter(input);
            expect(fn({})).to.equal(false);
        });
    });

    describe('list values', () => {
        it('should compile list values to OR', () => {
            const fn = compile.filter('id=23,42');
            expect(fn({ id: 23 })).to.equal(true);
            expect(fn({ id: 42 })).to.equal(true);
            expect(fn({ id: 123 })).to.equal(false);
        });

        it('should compile negated list values to OR', () => {
            const fn = compile.filter('id!=23,42');
            expect(fn({ id: 23 })).to.equal(false);
            expect(fn({ id: 42 })).to.equal(false);
            expect(fn({ id: 123 })).to.equal(true);
        });
    });

    describe('nested attributes', () => {
        const input = 'user.id=42';

        it('should be resolved', () => {
            const fn = compile.filter(input);
            expect(fn({ user: { id: 42 } })).to.equal(true);
            expect(fn({ user: { id: 43 } })).to.equal(false);
            expect(fn({ user: {} })).to.equal(false);
            expect(fn({ user: 42 })).to.equal(false);
        });

        it('should support arrays in value', () => {
            const fn = compile.filter(input);
            expect(fn({ user: [{ id: 42 }] })).to.equal(true);
            expect(fn({ user: [{ id: 43 }] })).to.equal(false);
            expect(fn({ user: [] })).to.equal(false);
            expect(fn({ user: {} })).to.equal(false);
        });

        xit('should apply NOT to all items in arrays', () => {
            const fn = compile.filter('foo.id!=13');
            expect(fn({ foo: { id: 13 } })).to.equal(false);
            expect(fn({ foo: { id: 42 } })).to.equal(true);
            expect(fn({ foo: [{ id: 13 }] })).to.equal(false);
            expect(fn({ foo: [{ id: 42 }, { id: 11 }] })).to.equal(true);
            expect(fn({ foo: [{ id: 42 }, { id: 13 }] })).to.equal(false);
        });

        xit('should apply NOT to all items in arrays (array values)', () => {
            const fn = compile.filter('foo.id!=13,14');
            expect(fn({ foo: { id: 13 } })).to.equal(false);
            expect(fn({ foo: { id: 14 } })).to.equal(false);
            expect(fn({ foo: { id: 42 } })).to.equal(true);
            expect(fn({ foo: [{ id: 13 }] })).to.equal(false);
            expect(fn({ foo: [{ id: 14 }] })).to.equal(false);
            expect(fn({ foo: [{ id: 15 }] })).to.equal(true);
            expect(fn({ foo: [{ id: 42 }, { id: 11 }] })).to.equal(true);
            expect(fn({ foo: [{ id: 42 }, { id: 13 }] })).to.equal(false);
            expect(fn({ foo: [{ id: 13 }, { id: 14 }] })).to.equal(false);
        });
    });
});
