import * as cdk from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { LambdaStack, LambdaStackProps } from "../lambda";
/** Class SmtpSesLambdaStack **/
export interface SmtpSesStackProps extends LambdaStackProps {
    readonly sesRegion: string;
    readonly verifiedIdentities: string[];
    readonly runtime?: lambda.Runtime;
    readonly code?: lambda.Code;
    readonly timeout?: cdk.Duration;
}
/** Class SmtpSesLambdaStack **/
export declare class SmtpSesLambdaStack extends LambdaStack {
    constructor(scope: cdk.App, props: SmtpSesStackProps);
    private createRole;
}
