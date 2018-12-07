"use strict";

const {promisify} = require('util');
const fs = require('fs');
fs.readFileAsync = promisify(fs.readFile);
fs.writeFileAsync = promisify(fs.writeFile);
const glob = promisify(require('glob'));

const PolicySynchronizer = require('./PolicySynchronizer');

module.exports = class PolicySynchronisation {
    
    constructor(iam, configuration) {
        this.iam = iam;
        this.configuration = configuration;
    }

    async gatherPolicyOperations(policyPath) {
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
        const policySynchronizer = new PolicySynchronizer(this.iam, this.configuration, policyJson);

        return await policySynchronizer.updateOrCreate();
    }

    async cleanupUnusedPolicies() {
        const policySynchronizer = new PolicySynchronizer(this.iam, this.configuration);
        const policies = await policySynchronizer.findUnusedPolicies();

        const allOperations = await Promise.all(policies.map(async (policy) => { return await policySynchronizer.removePolicy(policy); }));
        return [].concat.apply([], allOperations);
    }

}