"use strict";


const fs = require('fs');

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
        const {FilePath, Arn, GroupName, NewGroupName, Path, Policies} = this.targetGroup;
        console.log(`    [GROUP] Updating Group with Name(${GroupName})`);
        if(this.configuration.isDryRun) return;
        
        const params = {
            GroupName: GroupName,
            NewGroupName: NewGroupName,
            NewPath: Path
        };

        const response = await this.iam.updateGroupAsync(params);

        let {Group} = await this.iam.getGroupAsync({GroupName: NewGroupName});

        const updatedGroup = {
            Arn: Group.Arn,
            GroupName: Group.GroupName,
            Path: Group.Path,
            Policies
        };

        const updatedGroupString = JSON.stringify(updatedGroup, null, this.configuration.jsonSpacing);
        await fs.writeFileAsync(FilePath, updatedGroupString, 'utf8');
    }

    async rollback() {

    }
}