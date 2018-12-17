"use strict";

module.exports = class CreateGroupOperation {

    get type() {
        return "CREATE_GROUP";
    }

    constructor(iam, configuration, targetGroup) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetGroup = targetGroup;
    }

    async run() {
        console.log(`    [GROUP ] Creating Group with Name(${this.targetGroup.GroupName})`);
    }

    async rollback() {

    }
}