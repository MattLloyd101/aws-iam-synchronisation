"use strict";

module.exports = class PolicyClassifier {

    static get UPDATE() {
        return "UPDATE";
    }

    static get DESTRUCTIVE_UPDATE() {
        return "DESTRUCTIVE_UPDATE";
    }

    static get NONE() {
        return "NONE";
    }

    constructor(localPolicy, remotePolicy) {
        this.localPolicy = localPolicy;
        this.remotePolicy = remotePolicy;
    }

    classify() {
        const diffPath = this.localPolicy.Path != this.remotePolicy.Path;
        const diffDescription = this.localPolicy.Description != this.remotePolicy.Description;
        const diffPolicyName = this.localPolicy.PolicyName != this.remotePolicy.PolicyName;

        if(diffPath || diffDescription || diffPolicyName) {
            return PolicyClassifier.DESTRUCTIVE_UPDATE;
        }

        const diffPolicyDocument = this.localPolicy.PolicyDocument != this.remotePolicy.PolicyDocument;
        if(diffPolicyDocument) {
            return PolicyClassifier.UPDATE;
        }

        return PolicyClassifier.NONE;
    }
}