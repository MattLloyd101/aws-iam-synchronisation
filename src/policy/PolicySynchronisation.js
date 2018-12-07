"use strict";

const {promisify} = require('util');

const PolicyClassifier = require('./PolicyClassifier');

const NoOpPolicyOperation = require('./operations/NoOpPolicyOperation');
const CreatePolicyOperation = require('./operations/CreatePolicyOperation');
const UpdatePolicyOperation = require('./operations/UpdatePolicyOperation');
const DestructiveUpdatePolicyOperation = require('./operations/DestructiveUpdatePolicyOperation');
const RemovePolicyOperation = require('./operations/RemovePolicyOperation');
const RemovePolicyVersionOperation = require('./operations/RemovePolicyVersionOperation');

module.exports = class PolicySynchronisation {

    static preparePolicy(policy) {

        // if there's a policy, and the policy has a PolicyDocument that's not a string...
        // NOTE: use of deliberate weakening.
        if(policy && policy.PolicyDocument != null && !(typeof policy.PolicyDocument === 'string' || policy.PolicyDocument instanceof String)) {
            policy.PolicyDocumentJson = policy.PolicyDocument;
            policy.PolicyDocument = JSON.stringify(policy.PolicyDocument);
        }
        return policy;
    }

    static rebuildPolicyDoc({ Policy: {Arn, PolicyName, Description, Path}}, { PolicyVersion: { Document } }) {
        const decodedPolicyDocument = decodeURIComponent(Document);
        return {
            "Arn": Arn,
            "PolicyName": PolicyName,
            "Description": Description,
            "Path": Path,
            "PolicyDocument": decodedPolicyDocument
        };
    }

    constructor(iam, configuration, policy) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetPolicy = PolicySynchronisation.preparePolicy(Object.assign({}, policy));
    }

    async findUnusedPolicies() {
        const {Policies} = await this.iam.listPoliciesAsync({ "Scope": "Local" });
        return Policies.filter(_ => _.AttachmentCount === 0 && _.PermissionsBoundaryUsageCount === 0);
    }

    async getPolicy(arn) {
        return await this.iam.getPolicyAsync({ "PolicyArn": arn });
    }

    async getPolicyVersion(arn, versionId) {
        return await this.iam.getPolicyVersionAsync({ "PolicyArn": arn, "VersionId": versionId });
    }

    async removePolicy(policy) {
        const {Arn} = policy;
        
        const {Versions} = await this.iam.listPolicyVersionsAsync({PolicyArn:Arn});
        const allNonDefaultVersions = Versions.filter(version => !version.IsDefaultVersion);

        const removeVersionOperations = allNonDefaultVersions.map(({VersionId}) => new RemovePolicyVersionOperation(this.iam, this.configuration, Arn, VersionId));
        const removeOperation = new RemovePolicyOperation(this.iam, this.configuration, Arn);
        return removeVersionOperations.concat([removeOperation]);
    }

    create() {
        return [ new CreatePolicyOperation(this.iam, this.configuration, this.targetPolicy) ];
    }

    async updateOrCreate() {
        if(this.targetPolicy.Arn) {
            return await this.update();
        } else {
            return this.create();
        }
    }

    async update() {
        const arn = this.targetPolicy.Arn;
        const remotePolicy = await this.getPolicy(arn);
        const policyVersion = await this.getPolicyVersion(arn, remotePolicy.Policy.DefaultVersionId);
        const rebuiltPolicyDoc = PolicySynchronisation.rebuildPolicyDoc(remotePolicy, policyVersion);
        const policyClassifier = new PolicyClassifier(this.targetPolicy, rebuiltPolicyDoc);
        
        switch(policyClassifier.classify()) {
            case PolicyClassifier.UPDATE:
                return [ new UpdatePolicyOperation(this.iam, this.configuration, this.targetPolicy) ];
            case PolicyClassifier.DESTRUCTIVE_UPDATE:
                return [ new DestructiveUpdatePolicyOperation(this.iam, this.configuration, this.targetPolicy) ];
            default:
            case PolicyClassifier.NONE:
                return [ new NoOpPolicyOperation(arn) ];
        }
    }

}