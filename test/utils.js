"use strict";
const sinon = require('sinon');
const mock = require('mock-require');
const AWS = require('aws-sdk');

async function withIAMStub() {
    let body, fakeIAMInstance;
    if(arguments.length === 1) {
        body = arguments[0];
        fakeIAMInstance = {
            putParameter: function () {}
        };
    } else if(arguments.length === 2) {
        fakeIAMInstance = arguments[0];
        body = arguments[1];
    }

    mock('aws-sdk',)
    const stub = AWS.IAM = sinon.stub(AWS.IAM, 'constructor').returns(fakeIAMInstance);
    
    if (body[Symbol.toStringTag] === 'AsyncFunction') {
        await body(stub, fakeIAMInstance);
    } else {
        body(stub, fakeIAMInstance);
    }
};


module.exports = {
    withIAMStub
};