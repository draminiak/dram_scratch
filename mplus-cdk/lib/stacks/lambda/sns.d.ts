import * as cdk from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { LambdaStack, LambdaStackProps } from "../lambda";
/** Class SnsLambdaStack **/
export interface SnsLambdaStackProps extends LambdaStackProps {
    readonly allowedTopicArns: string[];
    readonly runtime?: lambda.Runtime;
    readonly code?: lambda.Code;
    readonly timeout?: cdk.Duration;
}
/** Class SnsLambdaStack **/
export declare class SnsLambdaStack extends LambdaStack {
    constructor(scope: cdk.App, props: SnsLambdaStackProps);
    private createRole;
}
