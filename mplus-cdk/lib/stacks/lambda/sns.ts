import * as cdk from "aws-cdk-lib";
import {aws_iam as iam, aws_lambda as lambda} from "aws-cdk-lib";
import {LambdaCreateFunctionProps, LambdaStack, LambdaStackProps} from "../lambda";
import path = require('path');

/** Class SnsLambdaStack **/
export interface SnsLambdaStackProps extends LambdaStackProps {
    readonly allowedTopicArns: string[]     // SNS topics allowed by the lambda to publish messages (ex [arn:aws:sns:us-east-1:138405549555:new-orders])
    readonly runtime?: lambda.Runtime       // python version
    readonly code?: lambda.Code             // path to python handler file (handler.py)
    readonly timeout?: cdk.Duration         // max execution time
}

const SNS_DEFAULTS = {
    runtime: lambda.Runtime.PYTHON_3_9,
    code: lambda.Code.fromAsset(path.join(__dirname, '../../../dram/lambda/sns')),
    timeout: cdk.Duration.seconds(30),
};

/** Class SnsLambdaStack **/
export class SnsLambdaStack extends LambdaStack {
    constructor(scope: cdk.App, props: SnsLambdaStackProps) {
        super(scope, props);

        const createProps: LambdaCreateFunctionProps = {
            vpc: props.vpc,
            runtime: props.runtime || SNS_DEFAULTS.runtime,
            code: props.code || SNS_DEFAULTS.code,
            timeout: props.timeout || SNS_DEFAULTS.timeout,
            timeoutAlarm: true,
            handler: 'handler.publish_message',
            funcName: props.deployEnv + 'PublishMessage',
            invocationUser: 'fn-sns' // IAM user created manually in the aws console
        };

        // Function for publishing SNS messages
        const snsPublish = this.createFunction(createProps);
        this.createRole(snsPublish, props.allowedTopicArns);
    }

    private createRole(fn: lambda.Function, allowedTopicArns: string[]) {
        // Add permissions to the Lambda function to publish messages to a specified sns topic
        const allowedTopics = [
            // `arn:aws:sns:${this.region}:${cdk.Stack.of(this).account}:*`,
        ];
        for (const topicArn of allowedTopicArns) {
            allowedTopics.push(topicArn);
        }
        const role = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'sns:Publish',
            ],
            resources: allowedTopics,
        });
        fn.addToRolePolicy(role);
    }
}
