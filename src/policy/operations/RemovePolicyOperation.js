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
        console.log(`    - Removing Policy Arn(${Arn})`);
        await this.iam.deletePolicyAsync({PolicyArn:Arn});
    }

    async rollback() {

    }
}