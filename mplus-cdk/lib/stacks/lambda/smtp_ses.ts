import * as cdk from "aws-cdk-lib";
import {aws_iam as iam, aws_lambda as lambda} from "aws-cdk-lib";
import {LambdaCreateFunctionProps, LambdaStack, LambdaStackProps} from "../lambda";
import path = require('path');

/** Class SmtpSesLambdaStack **/
export interface SmtpSesStackProps extends LambdaStackProps {
    readonly sesRegion: string
    readonly verifiedIdentities: string[] // validated sources in SES
    readonly runtime?: lambda.Runtime   // python version
    readonly code?: lambda.Code         // path to python handler file (handler.py)
    readonly timeout?: cdk.Duration     // max execution time
}

const SMTP_SES_DEFAULTS = {
    runtime: lambda.Runtime.PYTHON_3_9,
    code: lambda.Code.fromAsset(path.join(__dirname, '../../../dram/lambda/smtp_ses')),
    timeout: cdk.Duration.seconds(30),
};

/** Class SmtpSesLambdaStack **/
export class SmtpSesLambdaStack extends LambdaStack {
    constructor(scope: cdk.App, props: SmtpSesStackProps) {
        super(scope, props);

        const createProps: LambdaCreateFunctionProps = {
            vpc: props.vpc,
            runtime: props.runtime || SMTP_SES_DEFAULTS.runtime,
            code: props.code || SMTP_SES_DEFAULTS.code,
            environment: {
                AWS_LAMBDA_SES_REGION: props.sesRegion
            },
            timeout: props.timeout || SMTP_SES_DEFAULTS.timeout,
            timeoutAlarm: true,
            handler: 'handler.send_email',
            funcName: props.deployEnv + 'SendEmail',
            invocationUser: 'fn-smtp-ses' // IAM user created manually in the aws console
        };

        // Function for sending emails via SES
        const sendEmail = this.createFunction(createProps);
        this.createRole(sendEmail, props.verifiedIdentities, props.sesRegion);
    }

    private createRole(fn: lambda.Function, verifiedIdentities: string[], region: string) {
        // Add permissions to the Lambda function to send Emails
        const verifiedSenderResources = [];
        for (const source of verifiedIdentities) {
            verifiedSenderResources.push(`arn:aws:ses:${region}:${cdk.Stack.of(this).account}:identity/${source}`);
        }

        const role = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
                'ses:SendTemplatedEmail',
            ],
            resources: verifiedSenderResources,
        });
        fn.addToRolePolicy(role);
    }
}
