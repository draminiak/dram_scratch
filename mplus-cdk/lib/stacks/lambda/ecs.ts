import * as cdk from "aws-cdk-lib";
import {aws_iam as iam, aws_lambda as lambda} from "aws-cdk-lib";
import {LambdaCreateFunctionProps, LambdaStack, LambdaStackProps} from "../lambda";
import path = require('path');

/** Interfaces & Default Config **/
export interface EcsLamddaStackProps extends LambdaStackProps {
    readonly runtime?: lambda.Runtime   // python version
    readonly code?: lambda.Code         // path to python handler file (handler.py)
    readonly timeout?: cdk.Duration     // max execution time
}

const ECS_DEFAULTS = {
    runtime: lambda.Runtime.PYTHON_3_9,
    code: lambda.Code.fromAsset(path.join(__dirname, '../../../dram/lambda/ecs')),
    function: 'container_image_update',  // function name inside the handler file
    invokeUserBase: 'fn-ecs',
    timeout: cdk.Duration.seconds(30),
};

/** Class EcsLambdaStack **/
export class EcsLambdaStack extends LambdaStack {
    constructor(scope: cdk.App, props: EcsLamddaStackProps) {
        super(scope, props);

        const ecsFunction = ECS_DEFAULTS.function;
        const ecsInvokeUser = `${this.clientId}-${this.deployEnv}-${ECS_DEFAULTS.invokeUserBase}`;
        const lambdaFunction = props.deployEnv + '_' + ecsFunction

        // Create the user
        // new iam.User(this, `EcsLambda-${ECS_DEFAULTS.invokeUserBase}`, {
        //     userName: ecsInvokeUser,
        // });

        const createProps: LambdaCreateFunctionProps = {
            vpc: props.vpc,
            runtime: props.runtime || ECS_DEFAULTS.runtime,
            code: props.code || ECS_DEFAULTS.code,
            environment: {},
            timeout: props.timeout || ECS_DEFAULTS.timeout,
            timeoutAlarm: true,
            handler: 'handler.' + ecsFunction,
            funcName: lambdaFunction,
            invocationUser: ecsInvokeUser
        };

        // Function for updating ECS
        const ecrUpdate = this.createFunction(createProps);
        this.createRole(ecrUpdate);
    }

    private createRole(fn: lambda.Function) {
        const role = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                // "ecs:DescribeServices",
                "ecs:UpdateService",
            ],
            resources: [
                `arn:aws:ecs:${this.region}:${cdk.Stack.of(this).account}:*`,
            ],
        });
        fn.addToRolePolicy(role);
    }
}
