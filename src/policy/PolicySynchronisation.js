"use strict";

const PolicyClassifier = require('./PolicyClassifier');
const {promisify} = require('util');

module.exports = class PolicySynchronisation {

    static preparePolicy(policy) {

        // if there's a policy, and the policy has a PolicyDocument that's not a string...
        // NOTE: use of deliberate weakening.
        if(policy && policy.PolicyDocument != null && !(typeof policy.PolicyDocument === 'string' || policy.PolicyDocument instanceof String)) {
            policy.PolicyDocument = JSON.stringify(policy.PolicyDocument);
        }
        return policy;
    }

    static rebuildPolicyDoc(policy, policyVersion) {
        return {
            "Arn": policy.Policy.Arn,
            "PolicyName": policy.Policy.PolicyName,
            "Description": policy.Policy.Description,
            "Path": policy.Policy.Path,
            "PolicyDocument": policyVersion.PolicyVersion.Document
        };
    }

    constructor(iam, targetPolicy) {
        this.iam = iam;
        this.iam.createPolicyAsync = promisify(this.iam.createPolicy);
        this.iam.getPolicyAsync = promisify(this.iam.getPolicy);
        this.iam.getPolicyVersionAsync = promisify(this.iam.getPolicyVersion);
        this.iam.createPolicyVersionAsync = promisify(this.iam.createPolicyVersion);
        this.targetPolicy = PolicySynchronisation.preparePolicy(Object.assign({}, targetPolicy));
    }

    async updateOrCreate() {
        if(this.targetPolicy.Arn) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        return await this.iam.createPolicyAsync(this.targetPolicy);
    }

    async getPolicy(arn) {
        return await this.iam.getPolicyAsync({ "Arn": arn });
    }

    async getPolicyVersion(arn, versionId) {
        return await this.iam.getPolicyVersionAsync({ "PolicyArn": arn, "VersionId": versionId });
    }

    async performUpdate() {
        const params = {
            "Arn": this.targetPolicy.Arn,
            "PolicyDocument": this.targetPolicy.PolicyDocument,
            "SetAsDefault": true
        };
        return await this.iam.createPolicyVersionAsync(params);
    }

    async performDestructiveUpdate() {
        console.log("Destructive Update not implemented.");
    }

    async update() {
        const arn = this.targetPolicy.Arn;
        const remotePolicy = await this.getPolicy(arn);
        const policyVersion = await this.getPolicyVersion(arn, remotePolicy.Policy.DefaultVersionId);
        const rebuiltPolicyDoc = PolicySynchronisation.rebuildPolicyDoc(remotePolicy, policyVersion);
        const policyClassifier = new PolicyClassifier(this.targetPolicy, rebuiltPolicyDoc);
        
        switch(policyClassifier.classify()) {
            case PolicyClassifier.UPDATE:
                return await this.performUpdate();
            case PolicyClassifier.DESTRUCTIVE_UPDATE:
                return await this.performDestructiveUpdate();
        }
    }

}