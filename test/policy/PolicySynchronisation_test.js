const chai = require('chai')
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const requireIntercept = require('require-intercept');
chai.use(sinonChai);

const {module: PolicySynchronisation, mockAround} = requireIntercept('../../src/policy/PolicySynchronisation');

const policy = require('../stubs/example-policy.json');
const renderedPolicy = require('../stubs/rendered-example-policy.json');

describe('PolicySynchronisation', () => {

    const configuration = {
        "apiVersion": '2014-11-06',
        "baseDirectory": "."
    };

    const arn = { "Arn": "arn:aws:iam::123456789012:policy/ManageCredentialsPermissions" };

    const policyWithARN = (() => {
        return Object.assign({}, policy, arn);
    })();

    const renderedPolicyWithARN = (() => {
        return Object.assign({}, renderedPolicy, arn);
    })();

    const getPolicyResponse = {
        "Policy": {
            "PolicyName": "MyExamplePolicy",
            "PolicyId": "123456789012",
            "Arn": "arn:aws:iam::123456789012:policy/ManageCredentialsPermissions",
            "Path": "policy/ManageCredentialsPermissions",
            "DefaultVersionId": "<VERSION-ID>",
            "AttachmentCount": 3,
            "PermissionsBoundaryUsageCount": 0,
            "IsAttachable": true,
            "Description": "An example policy document",
            "CreateDate": new Date(),
            "UpdateDate": new Date(),
        }
    };

    const getPolicyVersionResponse = {
        "PolicyVersion": {
            "Document": "",
            "VersionId": "<VERSION-ID>",
            "IsDefaultVersion": true,
            "CreateDate": new Date()
        }
    };

    function createIAM({ createPolicyResp=getPolicyVersionResponse, getPolicyResp=getPolicyResponse, getPolicyVersionResp=getPolicyVersionResponse } = {}) {
        const createPolicy = sinon.stub().yields(null, createPolicyResp);
        const createPolicyVersion = sinon.stub().yields(null, null);
        const getPolicy = sinon.stub().yields(null, getPolicyResp);
        const getPolicyVersion = sinon.stub().yields(null, getPolicyVersionResp);
        const iam = { 
            createPolicy, 
            createPolicyVersion,
            getPolicy, 
            getPolicyVersion
        };

        return iam; 
    }

    describe('constructor()', () => {

        it('should assign iam', () => {
            const iam = createIAM();
            const policySynchronisation = new PolicySynchronisation(iam, policyWithARN);  
            expect(policySynchronisation.iam).to.equal(iam);
        });

    });

    describe('update()', () => {

        it('should create a new PolicyVersion if the PolicyDocument is different.', async () => {
            const getPolicyResp = Object.assign({}, getPolicyResponse, {
                "Policy": {
                    "PolicyName": policyWithARN.PolicyName,
                    "Path": policyWithARN.Path,
                    "Description": policyWithARN.Description,
                }
            });
            const iam = createIAM({getPolicyResp});
            const policySynchronisation = new PolicySynchronisation(iam, policyWithARN);  
            const response = await policySynchronisation.update(policyWithARN);

            expect(iam.createPolicyVersion.getCall(0).args[0]).to.eql({
                "Arn": "arn:aws:iam::123456789012:policy/ManageCredentialsPermissions",
                "PolicyDocument": JSON.stringify(policyWithARN.PolicyDocument),
                "SetAsDefault": true
            });
        });

    });

    describe('destructiveUpdate()', () => {

        it('should create a new Policy if the Name, Path or Description change');

        it('should list the attached groups, users and roles to the existing policy');

        it('should detatch the policy from each group, user and role.');

        it('should attach the new policy to each group, user and role.');
    })

    describe('updateOrCreate()', () => {
        it('should create a new Policy if the ARN does not exist.', async () => {
            const iam = createIAM();
            const policySynchronisation = new PolicySynchronisation(iam, policy);
            const returnValue = await policySynchronisation.updateOrCreate();

            expect(iam.createPolicy).to.have.been.calledWith(sinon.match(renderedPolicy));
        });
        it('should check if it needs to update an existing Policy if the ARN is supplied.', async () => {
            const iam = createIAM();
            const classify = sinon.stub().returns("NONE");
            const PolicyClassifier = sinon.stub().returns({ classify });

            const returnValue = await mockAround('./PolicyClassifier', PolicyClassifier, async () => {
                const policySynchronisation = new PolicySynchronisation(iam, policyWithARN);
                return await policySynchronisation.updateOrCreate();
            });

            expect(iam.getPolicy).to.have.been.calledWith(arn);
            expect(iam.getPolicyVersion).to.have.been.calledWith({ "PolicyArn": arn.Arn, "VersionId": "<VERSION-ID>"});

            expect(PolicyClassifier).to.have.been.calledWithNew;
            expect(classify).to.have.been.called;
        });
    });

});