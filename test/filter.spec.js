'use strict';

var expect = require('chai').expect;

var compile = require('../');

describe('filter compiler', function () {
    it('should be a function', function () {
        expect(compile.filter).to.be.a('function');
    });

    it('should generate a function', function () {
        var fn = compile.filter('id=123');
        expect(fn).to.be.a.function;
    });

    describe('AND terms', function () {
        var input = 'id=321 AND userId=109369';

        it('should compile AND terms', function () {
            var fn = compile.filter(input);
            expect(fn({id: 321, userId: 109369})).to.be.true;
            expect(fn({id: 321, userId: 109368})).to.be.false;
            expect(fn({id: 320, userId: 109369})).to.be.false;
            expect(fn({id: 320, userId: 109368})).to.be.false;
        });

        it('should return false on incomplete inputs', function () {
            var fn = compile.filter(input);
            expect(fn({id: 321})).to.be.false;
            expect(fn({userId: 109368})).to.be.false;
        });

        it('should return false on empty inputs', function () {
            var fn = compile.filter(input);
            expect(fn({})).to.be.false;
        });
    });

    describe('OR terms', function () {
        var input = 'id=321 OR userId=109369';

        it('should compile OR terms', function () {
            var fn = compile.filter(input);
            expect(fn({id: 321, userId: 109369})).to.be.true;
            expect(fn({id: 321, userId: 109368})).to.be.true;
            expect(fn({id: 320, userId: 109369})).to.be.true;
            expect(fn({id: 320, userId: 109368})).to.be.false;
        });

        it('should work on incomplete (but satisfying) inputs', function () {
            var fn = compile.filter(input);
            expect(fn({id: 321})).to.be.true;
        });

        it('should return false on empty inputs', function () {
            var fn = compile.filter(input);
            expect(fn({})).to.be.false;
        });
    });

    describe('nested attributes', function () {
        var input = 'user.id=42';

        it('should be resolved', function () {
            var fn = compile.filter(input);
            expect(fn({user: {id: 42}})).to.be.true;
            expect(fn({user: {id: 43}})).to.be.false;
            expect(fn({user: {}})).to.be.false;
            expect(fn({user: 42})).to.be.false;
        });

        it('should support arrays in value', function () {
            var fn = compile.filter(input);
            expect(fn({user: [{id: 42}]})).to.be.true;
            expect(fn({user: [{id: 43}]})).to.be.false;
            expect(fn({user: []})).to.be.false;
            expect(fn({user: {}})).to.be.false;
        });
    });
});
