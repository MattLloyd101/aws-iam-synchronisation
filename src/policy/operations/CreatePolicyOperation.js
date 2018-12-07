"use strict";

const fs = require('fs');

module.exports = class CreatePolicyOperation {

    get type() {
        return "CREATE";
    }
    
    constructor(iam, configuration, newPolicy) {
        this.iam = iam;
        this.configuration = configuration;
        this.newPolicy = newPolicy;
    }

    async run() {
        const {FilePath, PolicyName, Path, Description, PolicyDocument, PolicyDocumentJson} = this.newPolicy;

        console.log(`    - Creating Policy ${PolicyName}`);
        if(this.configuration.isDryRun) return;

        const { Policy: {Arn} } = await this.iam.createPolicyAsync({
            PolicyName,
            Path,
            Description,
            PolicyDocument
        });

        const updatedPolicy = {
            Arn,
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