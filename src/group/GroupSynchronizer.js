"use strict";

const CreateGroupOperation = require('./operations/CreateGroupOperation');
const UpdateGroupOperation = require('./operations/UpdateGroupOperation');
const AttachGroupPolicyOperation = require('./operations/AttachGroupPolicyOperation');
const DetachGroupPolicyOperation = require('./operations/DetachGroupPolicyOperation');

module.exports = class GroupSynchronizer {

    constructor(iam, configuration, group) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetGroup = group;
    }

    async updateOrCreate() {
        if(this.targetGroup.Arn) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async findUnusedGroups() {
        const {Groups} = await this.iam.listGroupsAsync({});
        // TODO: Need to look up each group and filter by their user count.
        console.log(Groups);
        return Groups.filter(_ => _.Users.length() === 0);
    }

    async update() {
        const {GroupName, Path, NewGroupName} = this.targetGroup;

        let Group;

        try {
            let response = await this.iam.getGroupAsync({GroupName});
            Group = response.Group;
        } catch(e) {
            if (e.code === "NoSuchEntity") {
                e.message = `${e.message} If you are trying to rename your group, keep GroupName the same, but add a new key NewGroupName instead.`;
            }
            throw e;
        }

        let updateOperation = [];
        
        
        if(NewGroupName !== undefined || Group.Path !== Path) {
            updateOperation = [new UpdateGroupOperation(this.iam, this.configuration, this.targetGroup, Group.GroupName)];
        }

        const attachDetachOperations = await this.updatePolicies();
        return updateOperation.concat(attachDetachOperations);
    }

    async create() {
        const {GroupName, Path} = this.targetGroup;
        // create the group
        const params = { GroupName, Path };
        const createOperation = [new CreateGroupOperation(this.iam, this.configuration, this.targetGroup)];
        const attachDetachOperations = await this.updatePolicies();

        return createOperation.concat(attachDetachOperations);
    }

    async currentAttachedPolicies(GroupName) {
        try {
            const {AttachedPolicies} = await this.iam.listAttachedGroupPoliciesAsync({GroupName});
            return AttachedPolicies.map(_ => _.PolicyArn);
        } catch(e) {
            if(e.code === "NoSuchEntity") {
                return [];
            } else {
                throw e;
            }
        }
    }

    async updatePolicies() {
        const {GroupName, Policies} = this.targetGroup;
        const attachedArns = await this.currentAttachedPolicies(GroupName);
        
        const attachments = Policies.filter(policyArn => attachedArns.indexOf(policyArn) === -1);
        const attachmentOps = attachments.map(policyArn => new AttachGroupPolicyOperation(this.iam, this.configuration, GroupName, policyArn));

        const detatchments = attachedArns.filter(policyArn => Policies.indexOf(policyArn) === -1);
        const detatchmentOps = detatchments.map(policyArn => new DetachGroupPolicyOperation(this.iam, this.configuration, GroupName, policyArn));

        return attachmentOps.concat(detatchmentOps);
    }
}