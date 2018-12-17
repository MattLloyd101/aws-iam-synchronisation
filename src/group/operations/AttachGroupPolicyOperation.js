"use strict";

module.exports = class AttachGroupPolicyOperation {

    get type() {
        return "ATTACH_GROUP_POLICY";
    }

    constructor(iam, configuration, groupName, policyArn) {
        this.iam = iam;
        this.configuration = configuration;
        this.groupName = groupName;
        this.policyArn = policyArn;
    }

    async run() {
        console.log(`    [GROUP] Attaching Policy with ARN(${this.policyArn}) to Group with Name(${this.groupName})`)
        if(this.configuration.isDryRun) return;

        const params = {
          GroupName: this.groupName,
          PolicyArn: this.policyArn
        };

        await this.iam.attachGroupPolicyAsync(params);
    }

    async rollback() {

    }
}