/**
 * Set RdsPostgresStackProps.databaseName to create a new DB instance; else existingDbConfig.databaseName is used.
 */
import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2, aws_rds as rds } from 'aws-cdk-lib';
import { AccessSecurityGroup, T3Stack, T3StackProps } from "../stack";
/** Interfaces & Default Config **/
export interface RdsPostgresStackProps extends T3StackProps {
    readonly databaseName?: string;
    readonly existingDbConfig?: RdsPostgresExistingProps;
    readonly instanceClass?: ec2.InstanceClass;
    readonly instanceSize?: ec2.InstanceSize;
    readonly kmsKeyArn?: string;
    readonly pgVersion?: rds.PostgresEngineVersion;
    readonly vpc?: ec2.Vpc;
    readonly vpcId?: string;
}
export interface RdsPostgresExistingProps {
    clusterSecurityGroup: string;
    databaseName: string;
    instanceIdentifier: string;
    instanceEndpointAddress: string;
    port: number;
    secretUsr: string;
    secretPwd: string;
}
export declare const RDS_POSTGRES_DEFAULTS: {
    instanceClass: cdk.aws_ec2.InstanceClass;
    instanceSize: cdk.aws_ec2.InstanceSize;
    pgVersion: cdk.aws_rds.PostgresEngineVersion;
};
/** Class RdsPostgresStack **/
export declare class RdsPostgresStack extends T3Stack {
    readonly database: rds.DatabaseInstance | rds.IDatabaseInstance;
    readonly databaseName: string;
    readonly instanceClass: ec2.InstanceClass;
    readonly instanceSize: ec2.InstanceSize;
    readonly pgVersion: rds.PostgresEngineVersion;
    readonly securityGroupId: string;
    readonly credentials?: {
        username: string;
        password: string;
    };
    constructor(scope: cdk.App, props: RdsPostgresStackProps);
    dbUsername(): string | cdk.aws_ecs.Secret;
    dbPassword(): string | cdk.aws_ecs.Secret;
    setExports(): void;
}
export declare function rdsAccessProps(clientId: string, deployEnv: string, service: string): AccessSecurityGroup;
