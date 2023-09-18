import * as cdk from 'aws-cdk-lib';
import {T3Stack, T3StackProps} from "../stack";
import {Construct} from "constructs";
import {
    aws_lambda as lambda,
} from "aws-cdk-lib";

export interface LambdaStackProps extends T3StackProps {
    readonly runtime?: lambda.Runtime   // python version
    readonly code?: lambda.Code         // path to python handler file (handler.py)
    readonly timeout?: cdk.Duration     // max execution time
}

export class LambdaStack extends T3Stack {

    constructor(scope: Construct, props: LambdaStackProps) {
        super(scope, props);
    }

}
