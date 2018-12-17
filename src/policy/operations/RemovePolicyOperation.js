"use strict";

module.exports = class RemovePolicyOperation {

    get type() {
        return "REMOVE_POLICY";
    }

    constructor(iam, configuration, Arn) {
        this.iam = iam;
        this.configuration = configuration;
        this.Arn = Arn;
    }

    async run() {
        const {Arn} = this;
        console.log(`    [POLICY] Removing Policy Arn(${Arn})`);
        if(this.configuration.isDryRun) return;

        await this.iam.deletePolicyAsync({PolicyArn:Arn});
    }

    async rollback() {

    }
}