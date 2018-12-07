"use strict";

const {promisify} = require('util');
const AWS = require('aws-sdk');

const PolicySynchronisation = require('./policy/PolicySynchronisation');

module.exports = class AwsIAMSynchronisation {

    get configurationDefaults() {
        return {
            "globOptions": undefined,
            "policyPath": "/policy/**/**",
            "policyExtention": "json",
            "jsonSpacing": 2,
            "cleanupUnusedPolicies": false,
            "cleanupUnusedGroups": false
        };
    }

    static prepareIAM(iam) {
        iam.createPolicyAsync = promisify(iam.createPolicy);
        iam.getPolicyAsync = promisify(iam.getPolicy);
        iam.getPolicyVersionAsync = promisify(iam.getPolicyVersion);
        iam.createPolicyVersionAsync = promisify(iam.createPolicyVersion);
        iam.listPoliciesAsync = promisify(iam.listPolicies);
        iam.deletePolicyAsync = promisify(iam.deletePolicy);
        iam.listPolicyVersionsAsync = promisify(iam.listPolicyVersions);
        iam.deletePolicyVersionAsync = promisify(iam.deletePolicyVersion);
        return iam;
    }

    constructor(configuration) {
        this.configuration = Object.assign(this.configurationDefaults, configuration);
        const apiVersion = configuration ? configuration.apiVersion : undefined;

        this.iam = AwsIAMSynchronisation.prepareIAM(new AWS.IAM(apiVersion));
    }

    isValidConfiguration() {
        if(!this.configuration.basePath) {
            throw new Error("Expected configuration to contain a /basePath key.");
        }

        return true;
    }

    async sync() {
        if(! this.isValidConfiguration()) {
            return;
        }
        const fullPolicyPath = this.configuration.basePath + this.configuration.policyPath;
        const policySynchronisation = new PolicySynchronisation(this.iam, this.configuration);
        const policyOperations = await policySynchronisation.gatherPolicyOperations(fullPolicyPath);

        // const fullPolicyPath = this.configuration.basePath + this.configuration.groupPath;
        // const groupOperations = await this.gatherPolcyOperations(fullPolicyPath);
        
        policyOperations.map((_) => {_.run()});
    }
}