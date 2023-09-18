import * as cdk from 'aws-cdk-lib';
import {
    aws_ec2 as ec2,
    aws_lambda as lambda
} from 'aws-cdk-lib';
import {T3Stack, T3StackProps} from "../stack";

/** Interfaces **/
export interface LambdaStackProps extends T3StackProps {
    readonly fnVersion?: string
}

export interface LambdaCreateFunctionProps {
    readonly vpc: ec2.Vpc
    readonly runtime: lambda.Runtime
    readonly code: lambda.Code
    readonly handler: string
    readonly funcName: string
    readonly invocationUser: string
    readonly environment?: { [key: string]: string }
    readonly timeout?: cdk.Duration
    readonly timeoutAlarm?: boolean
}

/** Default Config **/
const LAMBDA_DEFAULTS = {
    timeout: cdk.Duration.seconds(30),
    timeoutAlarm: false,
};


/** Class LambdaStack **/
export class LambdaFunction extends T3Stack {
    declare fnVersion: string

    constructor(scope: cdk.App, props: LambdaStackProps) {
        super(scope, props);
        this.fnVersion = props.fnVersion || this.unique_version();
    }

    protected createFunction(props: LambdaCreateFunctionProps): lambda.Function {
        // Prefix the lambda function name with the deployEnv to avoid naming collisions across deploy environments
        const fnName: string = props.funcName;

        const fn = new lambda.Function(this, fnName, {
            vpc: props.vpc,
            runtime: props.runtime,
            code: props.code,
            timeout: props.timeout || LAMBDA_DEFAULTS.timeout,
            handler: props.handler,
            functionName: fnName,
            environment: {
                ...(props.environment || {}),
                RELEASE_VERSION: this.fnVersion, // REF : https://www.define.run/posts/cdk-not-updating-lambda/
                // AWS_ACCOUNT_ID: cdk.Stack.of(this).account,
                AWS_LAMBDA_SNS_TEST_TOPIC: `arn:aws:sns:${this.region}:${this.account}:devops-test`
            }
        });

        // // Create a CloudWatch alarm to report when the function timed out
        // const timeoutAlarm = 'timeoutAlarm' in props ? props.timeoutAlarm : LAMBDA_DEFAULTS.timeoutAlarm;
        // if (fn.timeout && timeoutAlarm) {
        //     new cloudwatch.Alarm(this, `${fnName}-TimeoutAlarm`, {
        //         metric: fn.metricDuration().with({
        //             statistic: 'Maximum',
        //         }),
        //         evaluationPeriods: 1,
        //         datapointsToAlarm: 1,
        //         threshold: fn.timeout.toMilliseconds(),
        //         treatMissingData: cloudwatch.TreatMissingData.IGNORE,
        //         alarmName: `${fnName} Function Timeout`,
        //     });
        // }

        // // Policy for invocation
        // this.invokePolicy(props.invocationUser);

        return fn;
    }

    protected unique_version(): string {
        const now = new Date();
        return now.getTime().toString();
    }

    // protected invokePolicy(invocationUser: string): void {
    //     new iam.Policy(this, 'LambdaInvokePolicy', {
    //         document: new iam.PolicyDocument({
    //             statements: [
    //                 new iam.PolicyStatement({
    //                     sid: `LambdaRole`,
    //                     resources: [`arn:aws:iam::*:user/${invocationUser}`],
    //                     actions: [
    //                         "lambda:InvokeAsync",
    //                         "lambda:InvokeFunction",
    //                     ]
    //                 }),
    //             ],
    //         }),
    //         users: [
    //             iam.User.fromUserName(this, 'LambdaInvokeUser', invocationUser),
    //         ],
    //     });
    //     return;
    // }
}
