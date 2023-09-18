import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_ssm as ssm
} from "aws-cdk-lib";
import {v4 as uuidv4} from 'uuid';

export interface T3StackProps extends cdk.StackProps {
    readonly account: string
    readonly region: string

    readonly clientId: string
    readonly clientJobCode?: string

    /**
     * Required to create unique IDs when running multiple deployEnvs in the same tenant.
     * deployEnv: [devops, dev, stage, prod, main, etc]
     */
    readonly deployEnv: string

    /**
     * Used primarily to create unique construct IDs to mitigate resource collisions between similar stacks.
     * service: [codePipeline, spa, web, etc]
     */
    readonly service: string
}

/**
 * Base class to use for all T3 Stacks
 */
export class T3Stack extends cdk.Stack {
    readonly clientId: string
    readonly deployEnv: string
    readonly service: string
    // declare securityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, props: T3StackProps) {
        const stackName = [props.clientId, props.deployEnv, props.service].filter(Boolean).join('-');
        super(scope, stackName, {
            ...props,
            // Explicitly provide account and region for SSM access (vpc)
            env: {
                // account: cdk.Aws.ACCOUNT_ID,
                // region: cdk.Aws.REGION,
                account: props.account,
                region: props.region,
            }
        });
        this.clientId = props.clientId;
        this.deployEnv = props.deployEnv;
        this.service = props.service;
        this._addBillingTags(props.clientJobCode || 'n/a');
    }

    private _addBillingTags(clientJobCode: string): void {
        // Tag all resources in the stack with the given key/value pairs
        cdk.Tags.of(this).add('CLIENT_ID', this.clientId);
        cdk.Tags.of(this).add('CLIENT_JOB_CODE', clientJobCode);
        cdk.Tags.of(this).add('CLIENT_DEPLOY_ENV', this.deployEnv);
        cdk.Tags.of(this).add('CI_MAINTAINED', 'true');
    }

    existingVpc(vpcId?: string): ec2.IVpc {
        // Expects that the referenced Vpc exists with the corresponding vpcId
        // If param=vpcId is not passed, the stack will try to lookup by deployEnv the vpc created via IaC (if any)
        return ec2.Vpc.fromLookup(this, 'ImportVpc',{
            vpcId: vpcId ? vpcId : ssm.StringParameter.valueFromLookup(this,`/Vpc-${this.deployEnv}/VpcId`)
        });
    }

    kmsKey(kmsKeyArn?: string, props?: kms.KeyProps): kms.Key|kms.IKey {
        if (kmsKeyArn) {
            return kms.Key.fromKeyArn(this, 'KmsKey', kmsKeyArn);
        }
        return new kms.Key(this, 'KmsKey', props);
    }

    stackOutput(key: string, value: string) {
        // const exportName = `${this.clientId}-${this.service}-${this.deployEnv}-${key}`;
        new cdk.CfnOutput(this, key+'Export', {
            value: value,
            exportName: key,
        });
    }
}

export interface AccessSecurityGroup {
    service: string
    securityGroupId: string
    port: ec2.Port
    description: string
}

export interface SourceSecurityGroup {
    service: string
    securityGroupId: string
}

export function applySecurityGroupRulesToSource(scope: any, accessSecurityGroups: AccessSecurityGroup[] = [], sourceSecurityGroup: SourceSecurityGroup) {
    if (accessSecurityGroups && accessSecurityGroups.length > 0) {
        accessSecurityGroups.forEach(accessSecurityGroup => {
            const targetSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(scope, `SG-${accessSecurityGroup.service}${uuidv4().replace(/-/g, '')}`, accessSecurityGroup.securityGroupId);
            targetSecurityGroup.connections.allowFrom(targetSecurityGroup, accessSecurityGroup.port, `${accessSecurityGroup.description} from ${sourceSecurityGroup.service}`)
        });
    }
}
