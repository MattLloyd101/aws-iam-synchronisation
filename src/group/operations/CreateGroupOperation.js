"use strict";

const fs = require('fs');

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
        console.log(`    [GROUP] Creating Group with Name(${this.targetGroup.GroupName})`);
        if (this.configuration.isDryRun) return;

        const {FilePath, GroupName, Path, Policies} = this.targetGroup;
        const params = { GroupName, Path };
        const {Group: {Arn}} = await this.iam.createGroupAsync(params);

        const updatedGroup = {
            Arn,
            GroupName,
            Path,
            Policies
        };

        const updatedGroupString = JSON.stringify(updatedGroup, null, this.configuration.jsonSpacing);
        await fs.writeFileAsync(FilePath, updatedGroupString, 'utf8');
    }

    async rollback() {

    }
}