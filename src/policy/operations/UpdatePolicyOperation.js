"use strict";

const fs = require('fs');

module.exports = class UpdatePolicyOperation {

    get type() {
        return "UPDATE_POLICY";
    }

    constructor(iam, configuration, targetPolicy) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetPolicy = targetPolicy;
        this.Arn = this.targetPolicy.Arn;
    }


    async run() {
        const {FilePath, Arn, PolicyName, Path, Description, PolicyDocument, PolicyDocumentJson} = this.targetPolicy;
        console.log(`    [POLICY] Updating Policy ${PolicyName} with ARN(${Arn})`);
        if(this.configuration.isDryRun) return;

        const params = {
            "PolicyArn": Arn,
            PolicyDocument,
            "SetAsDefault": true
        };
        const { PolicyVersion: {VersionId} } = await this.iam.createPolicyVersionAsync(params);
        
        const updatedPolicy = {
            Arn,
            VersionId,
            PolicyName,
            Description,
            Path,
            PolicyDocument: PolicyDocumentJson
        };

        const updatedPolicyString = JSON.stringify(updatedPolicy, null, this.configuration.jsonSpacing);
        await fs.writeFileAsync(FilePath, updatedPolicyString, 'utf8');
    }

    async rollback() {

    }
}