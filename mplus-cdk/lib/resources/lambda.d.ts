import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2, aws_lambda as lambda } from 'aws-cdk-lib';
import { T3Stack, T3StackProps } from "../stack";
/** Interfaces **/
export interface LambdaStackProps extends T3StackProps {
    readonly fnVersion?: string;
}
export interface LambdaCreateFunctionProps {
    readonly vpc: ec2.Vpc;
    readonly runtime: lambda.Runtime;
    readonly code: lambda.Code;
    readonly handler: string;
    readonly funcName: string;
    readonly invocationUser: string;
    readonly environment?: {
        [key: string]: string;
    };
    readonly timeout?: cdk.Duration;
    readonly timeoutAlarm?: boolean;
}
/** Class LambdaStack **/
export declare class LambdaFunction extends T3Stack {
    fnVersion: string;
    constructor(scope: cdk.App, props: LambdaStackProps);
    protected createFunction(props: LambdaCreateFunctionProps): lambda.Function;
    protected unique_version(): string;
}
