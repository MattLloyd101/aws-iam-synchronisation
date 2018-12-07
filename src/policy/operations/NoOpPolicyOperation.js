"use strict";

module.exports = class NoOpPolicyOperation {

    get type() {
        return "NOOP";
    }

    constructor(Arn) {
        this.Arn = Arn;
    }

    async run() {
        console.log(`    - Policy with ARN(${this.Arn}) is identical. Not modified.`)
    }

    async rollback() {

    }
}