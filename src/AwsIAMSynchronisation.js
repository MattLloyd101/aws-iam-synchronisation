"use strict";

const {promisify} = require('util');
const AWS = require('aws-sdk');

const PolicySynchronisation = require('./policy/PolicySynchronisation');
const GroupSynchronisation = require('./group/GroupSynchronisation');

module.exports = class AwsIAMSynchronisation {

    get configurationDefaults() {
        return {
            "globOptions": undefined,
            "policyPath": "/policy/**/**",
            "groupPath": "/group/**/**",
            "extention": "json",
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
        iam.listPolicyVersionsAsync = promisify(iam.listPolicyVersions);
        iam.deletePolicyAsync = promisify(iam.deletePolicy);
        iam.deletePolicyVersionAsync = promisify(iam.deletePolicyVersion);
        iam.getGroupAsync = promisify(iam.getGroup);
        iam.listGroupsAsync = promisify(iam.listGroups);
        iam.createGroupAsync = promisify(iam.createGroup);
        iam.updateGroupAsync = promisify(iam.updateGroup);
        iam.deleteGroupAsync = promisify(iam.deleteGroup);
        iam.attachGroupPolicyAsync = promisify(iam.attachGroupPolicy);
        iam.detachGroupPolicyAsync = promisify(iam.detachGroupPolicy);
        iam.listAttachedGroupPoliciesAsync = promisify(iam.listAttachedGroupPolicies);
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

        const fullGroupPath = this.configuration.basePath + this.configuration.groupPath;
        const groupSynchronisation = new GroupSynchronisation(this.iam, this.configuration);
        const groupOperations = await groupSynchronisation.gatherGroupOperations(fullGroupPath);
        
        // This needs to be ordered by type of operation...
        // creates, updates then removes.
        policyOperations.map((_) => {_.run()});
        groupOperations.map((_) => {_.run()});
    }
}