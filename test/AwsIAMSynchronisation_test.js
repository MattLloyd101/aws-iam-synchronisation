const chai = require('chai')
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const AWS = require('aws-sdk');
const AwsIAMSynchronisation = require('../src/AwsIAMSynchronisation');

async function withIAMStub() {
    let body, fakeIAMInstance;
    if(arguments.length === 1) {
        body = arguments[0];
        fakeIAMInstance = {
            putParameter: function () {}
        };
    } else if(arguments.length === 2) {
        fakeIAMInstance = arguments[0];
        body = arguments[1];
    }

    const stub = AWS.IAM = sinon.stub(AWS.IAM, 'constructor').returns(fakeIAMInstance);
    
    if (body[Symbol.toStringTag] === 'AsyncFunction') {
        await body(stub, fakeIAMInstance);
    } else {
        body(stub, fakeIAMInstance);
    }
};

describe('AwsIAMSynchronisation', () => {

    const configuration = {
        "apiVersion": '2014-11-06',
        "baseDirectory": "."
    };

    describe('constructor()', () => {

        it('should not return null', () => {
            expect(AwsIAMSynchronisation).to.not.be.null;

            const iamSynchronisation = new AwsIAMSynchronisation();

            expect(iamSynchronisation).to.not.be.null; 
        });
        it('should assign the configuration', () => {
            const iamSynchronisation = new AwsIAMSynchronisation(configuration);
            expect(iamSynchronisation.configuration).to.equal(configuration);
        });
        it('should instanciate an AWS IAM instance with config', async () => {
            await withIAMStub((stub, iam) => {

                const iamSynchronisation = new AwsIAMSynchronisation(configuration);

                expect(stub).to.have.been.calledWithNew;
                expect(stub.getCall(0).args[0]).to.be.equal(configuration.apiVersion);
                expect(iamSynchronisation.iam).to.be.equal(iam);
            });
        });
        it('should instanciate an AWS IAM instance without config', async () => {
            await withIAMStub((stub, iam) => {
                const iamSynchronisation = new AwsIAMSynchronisation();

                expect(stub).to.have.been.calledWithNew;
                expect(stub.getCall(0).args[0]).to.be.undefined;
                expect(iamSynchronisation.iam).to.be.equal(iam);
            });
        });
    });

});