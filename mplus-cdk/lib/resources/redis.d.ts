import * as cdk from "aws-cdk-lib";
import { AccessSecurityGroup, T3Stack, T3StackProps } from "../stack";
import { aws_ec2 as ec2, aws_elasticache as elasticache } from "aws-cdk-lib";
/** Interfaces **/
export interface RedisStackProps extends T3StackProps {
    readonly authToken: string;
    readonly cacheNodeType: string;
    readonly numNodeGroups: number;
    readonly replicasPerNodeGroup: number;
    readonly vpc?: ec2.Vpc;
    readonly vpcId?: string;
}
/** Class RedisStack **/
export declare class RedisStack extends T3Stack {
    subnetGroup: elasticache.CfnSubnetGroup;
    replicationGroup: elasticache.CfnReplicationGroup;
    constructor(scope: cdk.App, props: RedisStackProps);
}
export declare function redisAccessProps(clientId: string, deployEnv: string, service: string): AccessSecurityGroup;
