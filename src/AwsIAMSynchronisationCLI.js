#!/usr/bin/env node

const AwsIAMSynchronisation = require('./AwsIAMSynchronisation');

const synchroniser = new AwsIAMSynchronisation({
    "basePath": "example",
    "cleanupUnusedPolicies": true
});

async function runSynchronisation() {
    try {
        await synchroniser.sync();
    } catch(e) {
        console.log(e);
    }
}

runSynchronisation();