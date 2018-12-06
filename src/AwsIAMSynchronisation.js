"use strict";

const {promisify} = require('util');
const fs = require('fs');
const AWS = require('aws-sdk');
const glob = promisify(require('glob'));
fs.readFileAsync = promisify(fs.readFile);
fs.writeFileAsync = promisify(fs.writeFile);

const PolicySynchronisation = require('./policy/PolicySynchronisation');

module.exports = class AwsIAMSynchronisation {

    get configurationDefaults() {
        return {
            "globOptions": undefined,
            "policyPath": "/policy/**/**",
            "policyExtention": "json",
            "jsonSpacing": 2,
            "cleanupUnusedPolicies": false
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
        const policyOperations = await this.gatherPolcyOperations(fullPolicyPath);

        
        policyOperations.map((_) => {_.run()});
    }

    async gatherPolcyOperations(policyPath) {
        console.log(`> Gathering Policies from path(${policyPath})`);
        const unusedPolcyOperations = this.configuration.cleanupUnusedPolicies ? await this.cleanupUnusedPolicies() : [];

        // list all policies in the path
        const globPath = `${policyPath}.${this.configuration.policyExtention}`;
        const policyFiles = await glob(globPath, this.configuration.globOptions);
        
        const syncOperations = await Promise.all(policyFiles.map(async (policyFilePath) => { return await this.syncPolicy(policyFilePath) }));
        const flattenedSyncOperations = [].concat.apply([], syncOperations);
        return this.tidyPolicyOperations(unusedPolcyOperations, flattenedSyncOperations);
    }

    tidyPolicyOperations(unusedPolicyOperations, flattenedSyncOperations) {
        const affectedArns = flattenedSyncOperations.map(_ => _.Arn);
        // remove unusedPolcyOperations that are specified in flattenedSyncOperations
        const strippedUnusedPolicyOperations = unusedPolicyOperations.filter((op1) => {
            return affectedArns.indexOf(op1.Arn) === -1;
        });

        return strippedUnusedPolicyOperations.concat(flattenedSyncOperations);
    }

    async syncPolicy(policyFilePath) {
        const policyString = await fs.readFileAsync(policyFilePath, 'utf8');
        const policyJson = JSON.parse(policyString);
        policyJson.FilePath = policyFilePath;
        const policySynchroniser = new PolicySynchronisation(this.iam, this.configuration, policyJson);

        return await policySynchroniser.updateOrCreate();
    }

    async cleanupUnusedPolicies() {
        const policySynchroniser = new PolicySynchronisation(this.iam, this.configuration);
        const policies = await policySynchroniser.findUnusedPolicies();

        const allOperations = await Promise.all(policies.map(async (policy) => { return await policySynchroniser.removePolicy(policy); }));
        return [].concat.apply([], allOperations);
    }
}