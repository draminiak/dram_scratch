import * as cdk from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { LambdaStack, LambdaStackProps } from "../lambda";
/** Interfaces & Default Config **/
export interface EcsLamddaStackProps extends LambdaStackProps {
    readonly runtime?: lambda.Runtime;
    readonly code?: lambda.Code;
    readonly timeout?: cdk.Duration;
}
/** Class EcsLambdaStack **/
export declare class EcsLambdaStack extends LambdaStack {
    constructor(scope: cdk.App, props: EcsLamddaStackProps);
    private createRole;
}
