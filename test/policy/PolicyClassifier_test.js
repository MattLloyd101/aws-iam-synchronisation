const chai = require('chai')
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const PolicyClassifier = require('../../src/policy/PolicyClassifier');

const policyA = require('../stubs/example-policy.json');

describe('PolicyClassifier', () => {

    describe('constructor()', () => {

        it('should assign policyA and B', () => {
            const policyB = Object.assign({}, policyA);
            const policyClassifier = new PolicyClassifier(policyA, policyB);  
            expect(policyClassifier).to.not.be.null;
            expect(policyClassifier.localPolicy).to.be.equal(policyA);
            expect(policyClassifier.remotePolicy).to.be.equal(policyB);
        });
    });

    describe('isEqual()', () => {

        it('should return NONE if they are identical', () => {
            const policyB = Object.assign({}, policyA);
            const policyClassifier = new PolicyClassifier(policyA, policyB); 

            expect(policyClassifier.classify()).to.be.equal(PolicyClassifier.NONE);
        });

        it('should return UPDATE if they are identical apart from PolicyDocument', () => {
            const policyB = Object.assign({}, policyA, { PolicyDocument: "some other document" });
            const policyClassifier = new PolicyClassifier(policyA, policyB); 

            expect(policyClassifier.classify()).to.be.equal(PolicyClassifier.UPDATE);
        }); 

        it('should return DESTRUCTIVE_UPDATE if the PolicyName is different', () => {
            const policyB = Object.assign({}, policyA, { PolicyName: "NewPolicyName" });
            const policyClassifier = new PolicyClassifier(policyA, policyB); 

            expect(policyClassifier.classify()).to.be.equal(PolicyClassifier.DESTRUCTIVE_UPDATE);
        }); 

        it('should return DESTRUCTIVE_UPDATE if the Description is different', () => {
            const policyB = Object.assign({}, policyA, { Description: "NewDescription" });
            const policyClassifier = new PolicyClassifier(policyA, policyB); 

            expect(policyClassifier.classify()).to.be.equal(PolicyClassifier.DESTRUCTIVE_UPDATE);
        }); 

        it('should return DESTRUCTIVE_UPDATE if the Path is different', () => {
            const policyB = Object.assign({}, policyA, { Path: "/new/path" });
            const policyClassifier = new PolicyClassifier(policyA, policyB); 

            expect(policyClassifier.classify()).to.be.equal(PolicyClassifier.DESTRUCTIVE_UPDATE);
        }); 
    });

});