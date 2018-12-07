"use strict";

module.exports = class GroupSynchronisation {
    
    constructor(iam, configuration, group) {
        this.iam = iam;
        this.configuration = configuration;
        this.targetGroupgroup = group;
    }

    async updateOrCreate() {
        if(this.targetPolicy.Arn) {
            return await this.update();
        } else {
            return this.create();
        }
    }

    async update() {

    }

    async create() {
        
    }

}