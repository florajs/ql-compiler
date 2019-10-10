/* global describe, it */

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
        const input = 'id=23,42';
        it('should compile list values to OR', () => {
            const fn = compile.filter(input);
            expect(fn({ id: 23 })).to.equal(true);
            expect(fn({ id: 42 })).to.equal(true);
            expect(fn({ id: 123 })).to.equal(false);
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
    });
});
