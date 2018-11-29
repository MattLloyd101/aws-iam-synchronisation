const chai = require('chai')
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const requireIntercept = require('require-intercept');
chai.use(sinonChai);

const AWS = require('aws-sdk');
const {module: PolicySynchronisation, mockAround} = requireIntercept('../../src/policy/PolicySynchronisation');
// const {withIAMStub} = require('./utils');


describe('PolicySynchronisation', () => {

    const configuration = {
        "apiVersion": '2014-11-06',
        "baseDirectory": "."
    };

    describe('constructor()', () => {

        it('should not return null', () => {
            expect(PolicySynchronisation).to.not.be.null;
            const policySynchronisation = new PolicySynchronisation();
            expect(policySynchronisation).to.not.be.null; 
        });
        it('should assign iam and targetPolicy', () => {
            const targetPolicy = "targetPolicy"
            const policySynchronisation = new PolicySynchronisation(targetPolicy);  
            expect(policySynchronisation.targetPolicy).to.equal(targetPolicy);
        });

    });

    describe('updateOrCreate()', () => {
        it('should create a new Policy if the ARN does not exist.', async () => {
            const policy = {};
            const PolicyCreator = sinon.stub();

            await mockAround("./PolicyCreator", PolicyCreator, async () => {
               const policySynchronisation = new PolicySynchronisation(policy);
               await policySynchronisation.updateOrCreate();
            });

            expect(PolicyCreator).to.be.calledWithNew;
            expect(PolicyCreator.getCall(0).args[0]).to.be.equal(policy);
        });
        it('should update an existing Policy if the ARN does not exist.', async () => {
            const policy = {
                "arn": "arn:aws:iam::123456789012:policy/UsersManageOwnCredentials"
            };
            const PolicyUpdater = sinon.stub();

            await mockAround("./PolicyUpdater", PolicyUpdater, async () => {
               const policySynchronisation = new PolicySynchronisation(policy);
               await policySynchronisation.updateOrCreate();
            });

            expect(PolicyUpdater).to.be.calledWithNew;
            expect(PolicyUpdater.getCall(0).args[0]).to.be.equal(policy);
        });
    });

});