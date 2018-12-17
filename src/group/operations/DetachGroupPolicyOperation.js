"use strict";

module.exports = class DetatchGroupPolicyOperation {

    get type() {
        return "DETATCH_GROUP_POLICY";
    }

    constructor(iam, configuration, groupName, policyArn) {
        this.iam = iam;
        this.configuration = configuration;
        this.groupName = groupName;
        this.policyArn = policyArn;
    }

    async run() {
        console.log(`    [GROUP] Detatching Policy with ARN(${this.policyArn}) from Group with Name(${this.groupName})`)
        if(this.configuration.isDryRun) return;

        const params = {
          GroupName: this.groupName,
          PolicyArn: this.policyArn
        };

        await this.iam.detachGroupPolicyAsync(params);
    }

    async rollback() {

    }
}