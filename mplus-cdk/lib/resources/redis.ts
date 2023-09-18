import * as cdk from "aws-cdk-lib";
import {AccessSecurityGroup, T3Stack, T3StackProps} from "../stack";
import {
    aws_ec2 as ec2,
    aws_elasticache as elasticache,
} from "aws-cdk-lib";

/** Interfaces **/
export interface RedisStackProps extends T3StackProps {
    readonly authToken: string
    readonly cacheNodeType: string
    readonly numNodeGroups: number
    readonly replicasPerNodeGroup: number
    readonly vpc?: ec2.Vpc
    readonly vpcId?: string
}

/** Class RedisStack **/
export class RedisStack extends T3Stack {
    declare subnetGroup: elasticache.CfnSubnetGroup
    declare replicationGroup: elasticache.CfnReplicationGroup

    constructor(scope: cdk.App, props: RedisStackProps) {
        super(scope, props);
        const vpc = props.vpc || this.existingVpc(props.vpcId);

        // Security Group ID From Export
        const securityGroupId = cdk.Fn.importValue(`${this.stackName}-SecurityGroupId`);

        // SubnetGroup
        this.subnetGroup = new elasticache.CfnSubnetGroup(this, 'SubnetGroup', {
            description: "redis subnet",
            subnetIds: vpc.privateSubnets.map((subnet) => {
                return subnet.subnetId
            }),
        });

        // ReplicationGroup
        let replicationGroupProps: elasticache.CfnReplicationGroupProps = {
            replicationGroupDescription: `${props.service} cluster`,
            replicasPerNodeGroup: 1,
            numNodeGroups: 3,
            engine: "redis",
            cacheNodeType: props.cacheNodeType,
            multiAzEnabled: true,
            cacheSubnetGroupName: this.subnetGroup.ref,
            securityGroupIds: [securityGroupId],
        };
        this.replicationGroup = new elasticache.CfnReplicationGroup(this, 'ReplicaGroup', replicationGroupProps);
    }
}

export function redisAccessProps(clientId: string, deployEnv: string, service: string): AccessSecurityGroup {
    return {
        service: service,
        securityGroupId: cdk.Fn.importValue(`${clientId}-${deployEnv}-${service}-SecurityGroupId`),
        port: ec2.Port.tcp(6379),
        description: `Access to Redis ${deployEnv}`
    };
}
