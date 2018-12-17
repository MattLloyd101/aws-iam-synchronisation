"use strict";

module.exports = class UpdateGroupOperation {

    get type() {
        return "UPDATE_GROUP";
    }

    constructor(iam, configuration, targetGroup) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetGroup = targetGroup;
    }

    async run() {
        console.log(`    [GROUP ] Updating Group with Name(${this.targetGroup.GroupName})`);
    }

    async rollback() {

    }
}