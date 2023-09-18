import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2, aws_kms as kms } from "aws-cdk-lib";
export interface T3StackProps extends cdk.StackProps {
    readonly account: string;
    readonly region: string;
    readonly clientId: string;
    readonly clientJobCode?: string;
    /**
     * Required to create unique IDs when running multiple deployEnvs in the same tenant.
     * deployEnv: [devops, dev, stage, prod, main, etc]
     */
    readonly deployEnv: string;
    /**
     * Used primarily to create unique construct IDs to mitigate resource collisions between similar stacks.
     * service: [codePipeline, spa, web, etc]
     */
    readonly service: string;
}
/**
 * Base class to use for all T3 Stacks
 */
export declare class T3Stack extends cdk.Stack {
    readonly clientId: string;
    readonly deployEnv: string;
    readonly service: string;
    constructor(scope: Construct, props: T3StackProps);
    private _addBillingTags;
    existingVpc(vpcId?: string): ec2.IVpc;
    kmsKey(kmsKeyArn?: string, props?: kms.KeyProps): kms.Key | kms.IKey;
    stackOutput(key: string, value: string): void;
}
export interface AccessSecurityGroup {
    service: string;
    securityGroupId: string;
    port: ec2.Port;
    description: string;
}
export interface SourceSecurityGroup {
    service: string;
    securityGroupId: string;
}
export declare function applySecurityGroupRulesToSource(scope: any, accessSecurityGroups: AccessSecurityGroup[] | undefined, sourceSecurityGroup: SourceSecurityGroup): void;
