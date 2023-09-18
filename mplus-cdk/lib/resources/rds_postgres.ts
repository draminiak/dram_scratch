/**
 * Set RdsPostgresStackProps.databaseName to create a new DB instance; else existingDbConfig.databaseName is used.
 */

import * as cdk from 'aws-cdk-lib';
import {
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_logs as logs,
    aws_rds as rds
} from 'aws-cdk-lib';
import {AccessSecurityGroup, T3Stack, T3StackProps} from "../stack";

/** Interfaces & Default Config **/
export interface RdsPostgresStackProps extends T3StackProps {
    readonly databaseName?: string
    readonly existingDbConfig?: RdsPostgresExistingProps
    readonly instanceClass?: ec2.InstanceClass
    readonly instanceSize?: ec2.InstanceSize
    readonly kmsKeyArn?: string
    readonly pgVersion?: rds.PostgresEngineVersion
    readonly vpc?: ec2.Vpc
    readonly vpcId?: string
}

export interface RdsPostgresExistingProps {
    clusterSecurityGroup: string
    databaseName: string
    instanceIdentifier: string
    instanceEndpointAddress: string
    port: number
    secretUsr: string
    secretPwd: string
}

export const RDS_POSTGRES_DEFAULTS = {
    instanceClass: ec2.InstanceClass.BURSTABLE3,
    instanceSize: ec2.InstanceSize.MICRO,
    pgVersion: rds.PostgresEngineVersion.VER_15_3,
}

/** Class RdsPostgresStack **/
export class RdsPostgresStack extends T3Stack {
    readonly database: rds.DatabaseInstance|rds.IDatabaseInstance
    readonly databaseName: string
    readonly instanceClass: ec2.InstanceClass
    readonly instanceSize: ec2.InstanceSize
    readonly pgVersion: rds.PostgresEngineVersion
    readonly securityGroupId: string
    readonly credentials?: {
        username: string
        password: string
    }

    constructor(scope: cdk.App, props: RdsPostgresStackProps) {
        super(scope, props);
        this.databaseName = props.existingDbConfig ? props.existingDbConfig.databaseName : props.databaseName!;
        this.instanceClass = props.instanceClass || RDS_POSTGRES_DEFAULTS.instanceClass;
        this.instanceSize = props.instanceSize || RDS_POSTGRES_DEFAULTS.instanceSize;
        this.pgVersion = props.pgVersion || RDS_POSTGRES_DEFAULTS.pgVersion;

        const vpc = props.vpc || this.existingVpc(props.vpcId);
        const kmsKey = this.kmsKey(props.kmsKeyArn, {
            alias: `${this.service}-${this.deployEnv}`,
        });

        // Security Group ID From Export
        const securityGroupId = cdk.Fn.importValue(`${this.stackName}-SecurityGroupId`);
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'RdsSg', securityGroupId);
        this.securityGroupId = securityGroup.securityGroupId;

        if (props.existingDbConfig) {
            this.database = rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'RdsPostgresFromAttr', {
                ...props.existingDbConfig,
                securityGroups: [securityGroup]
            });
            this.securityGroupId = props.existingDbConfig.clusterSecurityGroup;
            this.credentials = {
                username: props.existingDbConfig.secretUsr,
                password: props.existingDbConfig.secretPwd
            }
        } else {
            const dbUsername = this.databaseName;
            this.database = new rds.DatabaseInstance(this, 'RdsPostgresDatabase', {
                vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                }),
                engine: rds.DatabaseInstanceEngine.postgres({
                    version: this.pgVersion
                }),
                instanceType: ec2.InstanceType.of(
                    this.instanceClass,
                    this.instanceSize
                ),
                databaseName: this.databaseName,
                // create db credentials on the fly and store them in Secrets Manager
                credentials: rds.Credentials.fromGeneratedSecret(dbUsername),
                multiAz: true,
                allocatedStorage: 100,
                maxAllocatedStorage: 120,
                allowMajorVersionUpgrade: false,
                autoMinorVersionUpgrade: true,
                backupRetention: cdk.Duration.days(3),
                cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
                deleteAutomatedBackups: true,
                deletionProtection: true,
                removalPolicy: cdk.RemovalPolicy.RETAIN,
                publiclyAccessible: false,
                storageEncryptionKey: kmsKey,
                performanceInsightEncryptionKey: kmsKey,
                // parameterGroup: new rds.ParameterGroup(this, 'ClusterParameterGroup', {
                //     engine: rds.DatabaseClusterEngine.auroraPostgres({ version: this.pgVersion}),
                //     parameters: {
                //         'rds.force_ssl': '1',
                //     },
                // }),
                securityGroups: [securityGroup],
            });
        }

        this.setExports();
    }

    dbUsername() {
        if (this.database instanceof rds.DatabaseInstance) {
            return ecs.Secret.fromSecretsManager(
                this.database.secret!,
                "username"
            );
        } else {
            return this.credentials!.username;
        }
    }

    dbPassword() {
        if (this.database instanceof rds.DatabaseInstance) {
            return ecs.Secret.fromSecretsManager(
                this.database.secret!,
                "password"
            );
        } else {
            return this.credentials!.password;
        }
    }

    setExports() {
        // RDS Instance identifier
        // TODO : value incorrectly set as "[object Object]" for existing instances
        new cdk.CfnOutput(this, `RDSInstanceIdentifier-${this.deployEnv}`, {
            value: this.database.instanceIdentifier,
            exportName: `${this.stackName}-exportRdsInstanceId`,
        });
    }
}

export function rdsAccessProps(clientId: string, deployEnv: string, service: string): AccessSecurityGroup {
    return {
        service: service,
        securityGroupId: cdk.Fn.importValue(`${clientId}-${deployEnv}-${service}-SecurityGroupId`),
        port: ec2.Port.tcp(5432),
        description: `Access to Rds ${deployEnv}`
    };
}
