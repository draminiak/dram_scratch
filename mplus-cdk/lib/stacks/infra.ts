import * as cdk from 'aws-cdk-lib';
import {T3Stack, T3StackProps} from "../stack";
import {Construct} from "constructs";
import {
    aws_ec2 as ec2,
    aws_logs as logs,
    // aws_ssm as ssm,
} from "aws-cdk-lib";
import * as vpc from "../resources/vpc";

export interface InfraStackProps extends T3StackProps {
    natGatewayEip?: string
}

export class InfraStack extends T3Stack {
    readonly vpc: ec2.Vpc
    readonly vpcId: string
    readonly logGroup: logs.LogGroup

    constructor(scope: Construct, props: InfraStackProps) {
        super(scope, props);
        this.vpc = vpc.vpcInit(this, props);
        this.vpcId = this.vpc.vpcId;

        this.logGroup = new logs.LogGroup(this, 'StackLogGroup', {
            retention: logs.RetentionDays.ONE_YEAR,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        vpc.flowLogs(this, {
            ...props,
            logGroup: this.logGroup,
            vpc: this.vpc
        });

        vpc.interfaceEndpoints(this.vpc);
        vpc.naclRules(this, this.vpc);

        // this.setSsm();
        this.setOutputs();
    }

    // setSsm() {
    //     // Vpc Id
    //     new ssm.StringParameter(this, 'VpcId', {
    //         parameterName: `/Vpc-${this.deployEnv}/VpcId`,
    //         stringValue: this.vpc.vpcId
    //     })
    // }

    createSecurityGroup(vpc: ec2.Vpc|ec2.IVpc, service: string): ec2.SecurityGroup {
        const sgName = `${this.clientId}-${this.deployEnv}-${service}-SecurityGroupId`;
        const sg = new ec2.SecurityGroup(this, sgName, {
            vpc: vpc,
            allowAllOutbound: true,
            // securityGroupName: sgName,
            description: `Security Group for ${service} Access`,
        });
        this.stackOutput(sgName, sg.securityGroupId);
        return sg;
    }

    setOutputs() {
        // Vpc Arn
        this.stackOutput(`${this.clientId}-${this.deployEnv}-${this.service}-VpcArn`, this.vpc.vpcArn);
    }
}
