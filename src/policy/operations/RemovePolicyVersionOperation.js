"use strict";

module.exports = class RemovePolicyVersionOperation {

    get type() {
        return "REMOVE_POLICY_VERSION";
    }

    constructor(iam, configuration, Arn, VersionId) {
        this.iam = iam;
        this.configuration = configuration;
        this.Arn = Arn;
        this.VersionId = VersionId;
    }

    async run() {
        const {Arn, VersionId} = this;
        console.log(`        - Removing Policy Version Arn(${Arn})`);
        return await this.iam.deletePolicyVersionAsync({PolicyArn: Arn, VersionId});
    }

    async rollback() {

    }
}