"use strict";

const PolicyCreator = require('./PolicyCreator');
const PolicyUpdater = require('./PolicyUpdater');


module.exports = class PolicySynchronisation {

    constructor(targetPolicy) {
        this.targetPolicy = targetPolicy;
    }

    async updateOrCreate() {
        if(this.targetPolicy.arn) {
            const policyUpdater = new PolicyUpdater(this.targetPolicy);
        } else {
            const policyCreator = new PolicyCreator(this.targetPolicy);
        }
    }

}