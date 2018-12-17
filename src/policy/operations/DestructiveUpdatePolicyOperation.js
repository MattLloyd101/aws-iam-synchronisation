"use strict";

module.exports = class DestructiveUpdatePolicyOperation {

    get type() {
        return "DESTRUCTIVE_UPDATE";
    }

    constructor(iam, configuration, targetPolicy) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetPolicy = targetPolicy;
        this.Arn = this.targetPolicy.Arn;
    }

    async run() {
        console.log(`    [POLICY] Destructive Update not implemented. Policy with ARN(${this.Arn}) was not modified`);
        return;
    }

    async rollback() {
        
    }
}