"use strict";

const {promisify} = require('util');
const fs = require('fs');
fs.readFileAsync = promisify(fs.readFile);
fs.writeFileAsync = promisify(fs.writeFile);
const glob = promisify(require('glob'));

const GroupSynchronizer = require('./GroupSynchronizer');

module.exports = class GroupSynchronisation {
    
    constructor(iam, configuration) {
        this.iam = iam;
        this.configuration = configuration;
    }

    async gatherGroupOperations(groupPath) {
        console.log(`> Gathering Groups from path(${groupPath})`);
        const unusedPolcyOperations = this.configuration.cleanupUnusedGroups ? await this.cleanupUnusedGroups() : [];

        // list all groups in the path
        const globPath = `${groupPath}.${this.configuration.extention}`;
        const groupFiles = await glob(globPath, this.configuration.globOptions);
        
        const syncOperations = await Promise.all(groupFiles.map(async (groupFilePath) => { return await this.syncGroup(groupFilePath) }));
        const flattenedSyncOperations = [].concat.apply([], syncOperations);
        return this.tidyGroupOperations(unusedPolcyOperations, flattenedSyncOperations);
    }

    tidyGroupOperations(unusedGroupOperations, flattenedSyncOperations) {
        const affectedArns = flattenedSyncOperations.map(_ => _.Arn);
        // remove unusedPolcyOperations that are specified in flattenedSyncOperations
        const strippedUnusedGroupOperations = unusedGroupOperations.filter((op1) => {
            return affectedArns.indexOf(op1.Arn) === -1;
        });

        return strippedUnusedGroupOperations.concat(flattenedSyncOperations);
    }

    async syncGroup(groupFilePath) {
        const groupString = await fs.readFileAsync(groupFilePath, 'utf8');
        const groupJson = JSON.parse(groupString);
        groupJson.FilePath = groupFilePath;
        const groupSynchronizer = new GroupSynchronizer(this.iam, this.configuration, groupJson);

        return await groupSynchronizer.updateOrCreate();
    }

    // TODO: This now seems weird with this new structure
    // Should probably be refactored so it's part of groupSynchronizer (goes for PolicySynch too)
    async cleanupUnusedGroups() {
        const groupSynchronizer = new GroupSynchronizer(this.iam, this.configuration);
        const groups = await groupSynchronizer.findUnusedGroups();

        const allOperations = await Promise.all(groups.map(async (group) => { return await groupSynchronizer.removeGroup(group); }));
        return [].concat.apply([], allOperations);
    }

}