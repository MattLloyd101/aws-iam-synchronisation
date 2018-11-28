"use strict";

const AWS = require('aws-sdk');

module.exports = class AwsIAMSynchronisation {

    constructor(configuration) {
        this.configuration = configuration;
        const apiVersion = configuration ? configuration.apiVersion : undefined;

        this.iam = new AWS.IAM(apiVersion);
    }
}