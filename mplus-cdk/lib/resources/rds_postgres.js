"use strict";
/**
 * Set RdsPostgresStackProps.databaseName to create a new DB instance; else existingDbConfig.databaseName is used.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rdsAccessProps = exports.RdsPostgresStack = exports.RDS_POSTGRES_DEFAULTS = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const stack_1 = require("../stack");
exports.RDS_POSTGRES_DEFAULTS = {
    instanceClass: aws_cdk_lib_1.aws_ec2.InstanceClass.BURSTABLE3,
    instanceSize: aws_cdk_lib_1.aws_ec2.InstanceSize.MICRO,
    pgVersion: aws_cdk_lib_1.aws_rds.PostgresEngineVersion.VER_15_3,
};
/** Class RdsPostgresStack **/
class RdsPostgresStack extends stack_1.T3Stack {
    constructor(scope, props) {
        super(scope, props);
        this.databaseName = props.existingDbConfig ? props.existingDbConfig.databaseName : props.databaseName;
        this.instanceClass = props.instanceClass || exports.RDS_POSTGRES_DEFAULTS.instanceClass;
        this.instanceSize = props.instanceSize || exports.RDS_POSTGRES_DEFAULTS.instanceSize;
        this.pgVersion = props.pgVersion || exports.RDS_POSTGRES_DEFAULTS.pgVersion;
        const vpc = props.vpc || this.existingVpc(props.vpcId);
        const kmsKey = this.kmsKey(props.kmsKeyArn, {
            alias: `${this.service}-${this.deployEnv}`,
        });
        // Security Group ID From Export
        const securityGroupId = cdk.Fn.importValue(`${this.stackName}-SecurityGroupId`);
        const securityGroup = aws_cdk_lib_1.aws_ec2.SecurityGroup.fromSecurityGroupId(this, 'RdsSg', securityGroupId);
        this.securityGroupId = securityGroup.securityGroupId;
        if (props.existingDbConfig) {
            this.database = aws_cdk_lib_1.aws_rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'RdsPostgresFromAttr', Object.assign(Object.assign({}, props.existingDbConfig), { securityGroups: [securityGroup] }));
            this.securityGroupId = props.existingDbConfig.clusterSecurityGroup;
            this.credentials = {
                username: props.existingDbConfig.secretUsr,
                password: props.existingDbConfig.secretPwd
            };
        }
        else {
            const dbUsername = this.databaseName;
            this.database = new aws_cdk_lib_1.aws_rds.DatabaseInstance(this, 'RdsPostgresDatabase', {
                vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: aws_cdk_lib_1.aws_ec2.SubnetType.PRIVATE_ISOLATED
                }),
                engine: aws_cdk_lib_1.aws_rds.DatabaseInstanceEngine.postgres({
                    version: this.pgVersion
                }),
                instanceType: aws_cdk_lib_1.aws_ec2.InstanceType.of(this.instanceClass, this.instanceSize),
                databaseName: this.databaseName,
                // create db credentials on the fly and store them in Secrets Manager
                credentials: aws_cdk_lib_1.aws_rds.Credentials.fromGeneratedSecret(dbUsername),
                multiAz: true,
                allocatedStorage: 100,
                maxAllocatedStorage: 120,
                allowMajorVersionUpgrade: false,
                autoMinorVersionUpgrade: true,
                backupRetention: cdk.Duration.days(3),
                cloudwatchLogsRetention: aws_cdk_lib_1.aws_logs.RetentionDays.ONE_MONTH,
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
        if (this.database instanceof aws_cdk_lib_1.aws_rds.DatabaseInstance) {
            return aws_cdk_lib_1.aws_ecs.Secret.fromSecretsManager(this.database.secret, "username");
        }
        else {
            return this.credentials.username;
        }
    }
    dbPassword() {
        if (this.database instanceof aws_cdk_lib_1.aws_rds.DatabaseInstance) {
            return aws_cdk_lib_1.aws_ecs.Secret.fromSecretsManager(this.database.secret, "password");
        }
        else {
            return this.credentials.password;
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
exports.RdsPostgresStack = RdsPostgresStack;
function rdsAccessProps(clientId, deployEnv, service) {
    return {
        service: service,
        securityGroupId: cdk.Fn.importValue(`${clientId}-${deployEnv}-${service}-SecurityGroupId`),
        port: aws_cdk_lib_1.aws_ec2.Port.tcp(5432),
        description: `Access to Rds ${deployEnv}`
    };
}
exports.rdsAccessProps = rdsAccessProps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzX3Bvc3RncmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzX3Bvc3RncmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsbUNBQW1DO0FBQ25DLDZDQUtxQjtBQUNyQixvQ0FBb0U7QUF3QnZELFFBQUEscUJBQXFCLEdBQUc7SUFDakMsYUFBYSxFQUFFLHFCQUFHLENBQUMsYUFBYSxDQUFDLFVBQVU7SUFDM0MsWUFBWSxFQUFFLHFCQUFHLENBQUMsWUFBWSxDQUFDLEtBQUs7SUFDcEMsU0FBUyxFQUFFLHFCQUFHLENBQUMscUJBQXFCLENBQUMsUUFBUTtDQUNoRCxDQUFBO0FBRUQsOEJBQThCO0FBQzlCLE1BQWEsZ0JBQWlCLFNBQVEsZUFBTztJQVl6QyxZQUFZLEtBQWMsRUFBRSxLQUE0QjtRQUNwRCxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBYSxDQUFDO1FBQ3ZHLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsSUFBSSw2QkFBcUIsQ0FBQyxhQUFhLENBQUM7UUFDaEYsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxJQUFJLDZCQUFxQixDQUFDLFlBQVksQ0FBQztRQUM3RSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksNkJBQXFCLENBQUMsU0FBUyxDQUFDO1FBRXBFLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFF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O0FBUEQsd0NBT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNldCBSZHNQb3N0Z3Jlc1N0YWNrUHJvcHMuZGF0YWJhc2VOYW1lIHRvIGNyZWF0ZSBhIG5ldyBEQiBpbnN0YW5jZTsgZWxzZSBleGlzdGluZ0RiQ29uZmlnLmRhdGFiYXNlTmFtZSBpcyB1c2VkLlxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQge1xuICAgIGF3c19lYzIgYXMgZWMyLFxuICAgIGF3c19lY3MgYXMgZWNzLFxuICAgIGF3c19sb2dzIGFzIGxvZ3MsXG4gICAgYXdzX3JkcyBhcyByZHNcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHtBY2Nlc3NTZWN1cml0eUdyb3VwLCBUM1N0YWNrLCBUM1N0YWNrUHJvcHN9IGZyb20gXCIuLi9zdGFja1wiO1xuXG4vKiogSW50ZXJmYWNlcyAmIERlZmF1bHQgQ29uZmlnICoqL1xuZXhwb3J0IGludGVyZmFjZSBSZHNQb3N0Z3Jlc1N0YWNrUHJvcHMgZXh0ZW5kcyBUM1N0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IGRhdGFiYXNlTmFtZT86IHN0cmluZ1xuICAgIHJlYWRvbmx5IGV4aXN0aW5nRGJDb25maWc/OiBSZHNQb3N0Z3Jlc0V4aXN0aW5nUHJvcHNcbiAgICByZWFkb25seSBpbnN0YW5jZUNsYXNzPzogZWMyLkluc3RhbmNlQ2xhc3NcbiAgICByZWFkb25seSBpbnN0YW5jZVNpemU/OiBlYzIuSW5zdGFuY2VTaXplXG4gICAgcmVhZG9ubHkga21zS2V5QXJuPzogc3RyaW5nXG4gICAgcmVhZG9ubHkgcGdWZXJzaW9uPzogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvblxuICAgIHJlYWRvbmx5IHZwYz86IGVjMi5WcGNcbiAgICByZWFkb25seSB2cGNJZD86IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc1Bvc3RncmVzRXhpc3RpbmdQcm9wcyB7XG4gICAgY2x1c3RlclNlY3VyaXR5R3JvdXA6IHN0cmluZ1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nXG4gICAgaW5zdGFuY2VJZGVudGlmaWVyOiBzdHJpbmdcbiAgICBpbnN0YW5jZUVuZHBvaW50QWRkcmVzczogc3RyaW5nXG4gICAgcG9ydDogbnVtYmVyXG4gICAgc2VjcmV0VXNyOiBzdHJpbmdcbiAgICBzZWNyZXRQd2Q6IHN0cmluZ1xufVxuXG5leHBvcnQgY29uc3QgUkRTX1BPU1RHUkVTX0RFRkFVTFRTID0ge1xuICAgIGluc3RhbmNlQ2xhc3M6IGVjMi5JbnN0YW5jZUNsYXNzLkJVUlNUQUJMRTMsXG4gICAgaW5zdGFuY2VTaXplOiBlYzIuSW5zdGFuY2VTaXplLk1JQ1JPLFxuICAgIHBnVmVyc2lvbjogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvbi5WRVJfMTVfMyxcbn1cblxuLyoqIENsYXNzIFJkc1Bvc3RncmVzU3RhY2sgKiovXG5leHBvcnQgY2xhc3MgUmRzUG9zdGdyZXNTdGFjayBleHRlbmRzIFQzU3RhY2sge1xuICAgIHJlYWRvbmx5IGRhdGFiYXNlOiByZHMuRGF0YWJhc2VJbnN0YW5jZXxyZHMuSURhdGFiYXNlSW5zdGFuY2VcbiAgICByZWFkb25seSBkYXRhYmFzZU5hbWU6IHN0cmluZ1xuICAgIHJlYWRvbmx5IGluc3RhbmNlQ2xhc3M6IGVjMi5JbnN0YW5jZUNsYXNzXG4gICAgcmVhZG9ubHkgaW5zdGFuY2VTaXplOiBlYzIuSW5zdGFuY2VTaXplXG4gICAgcmVhZG9ubHkgcGdWZXJzaW9uOiByZHMuUG9zdGdyZXNFbmdpbmVWZXJzaW9uXG4gICAgcmVhZG9ubHkgc2VjdXJpdHlHcm91cElkOiBzdHJpbmdcbiAgICByZWFkb25seSBjcmVkZW50aWFscz86IHtcbiAgICAgICAgdXNlcm5hbWU6IHN0cmluZ1xuICAgICAgICBwYXNzd29yZDogc3RyaW5nXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIHByb3BzOiBSZHNQb3N0Z3Jlc1N0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIHByb3BzKTtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBwcm9wcy5leGlzdGluZ0RiQ29uZmlnID8gcHJvcHMuZXhpc3RpbmdEYkNvbmZpZy5kYXRhYmFzZU5hbWUgOiBwcm9wcy5kYXRhYmFzZU5hbWUhO1xuICAgICAgICB0aGlzLmluc3RhbmNlQ2xhc3MgPSBwcm9wcy5pbnN0YW5jZUNsYXNzIHx8IFJEU19QT1NUR1JFU19ERUZBVUxUUy5pbnN0YW5jZUNsYXNzO1xuICAgICAgICB0aGlzLmluc3RhbmNlU2l6ZSA9IHByb3BzLmluc3RhbmNlU2l6ZSB8fCBSRFNfUE9TVEdSRVNfREVGQVVMVFMuaW5zdGFuY2VTaXplO1xuICAgICAgICB0aGlzLnBnVmVyc2lvbiA9IHByb3BzLnBnVmVyc2lvbiB8fCBSRFNfUE9TVEdSRVNfREVGQVVMVFMucGdWZXJzaW9uO1xuXG4gICAgICAgIGNvbnN0IHZwYyA9IHByb3BzLnZwYyB8fCB0aGlzLmV4aXN0aW5nVnBjKHByb3BzLnZwY0lkKTtcbiAgICAgICAgY29uc3Qga21zS2V5ID0gdGhpcy5rbXNLZXkocHJvcHMua21zS2V5QXJuLCB7XG4gICAgICAgICAgICBhbGlhczogYCR7dGhpcy5zZXJ2aWNlfS0ke3RoaXMuZGVwbG95RW52fWAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNlY3VyaXR5IEdyb3VwIElEIEZyb20gRXhwb3J0XG4gICAgICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBJZCA9IGNkay5Gbi5pbXBvcnRWYWx1ZShgJHt0aGlzLnN0YWNrTmFtZX0tU2VjdXJpdHlHcm91cElkYCk7XG4gICAgICAgIGNvbnN0IHNlY3VyaXR5R3JvdXAgPSBlYzIuU2VjdXJpdHlHcm91cC5mcm9tU2VjdXJpdHlHcm91cElkKHRoaXMsICdSZHNTZycsIHNlY3VyaXR5R3JvdXBJZCk7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gc2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWQ7XG5cbiAgICAgICAgaWYgKHByb3BzLmV4aXN0aW5nRGJDb25maWcpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YWJhc2UgPSByZHMuRGF0YWJhc2VJbnN0YW5jZS5mcm9tRGF0YWJhc2VJbnN0YW5jZUF0dHJpYnV0ZXModGhpcywgJ1Jkc1Bvc3RncmVzRnJvbUF0dHInLCB7XG4gICAgICAgICAgICAgICAgLi4ucHJvcHMuZXhpc3RpbmdEYkNvbmZpZyxcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW3NlY3VyaXR5R3JvdXBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gcHJvcHMuZXhpc3RpbmdEYkNvbmZpZy5jbHVzdGVyU2VjdXJpdHlHcm91cDtcbiAgICAgICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHByb3BzLmV4aXN0aW5nRGJDb25maWcuc2VjcmV0VXNyLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBwcm9wcy5leGlzdGluZ0RiQ29uZmlnLnNlY3JldFB3ZFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGJVc2VybmFtZSA9IHRoaXMuZGF0YWJhc2VOYW1lO1xuICAgICAgICAgICAgdGhpcy5kYXRhYmFzZSA9IG5ldyByZHMuRGF0YWJhc2VJbnN0YW5jZSh0aGlzLCAnUmRzUG9zdGdyZXNEYXRhYmFzZScsIHtcbiAgICAgICAgICAgICAgICB2cGMsXG4gICAgICAgICAgICAgICAgdnBjU3VibmV0czogdnBjLnNlbGVjdFN1Ym5ldHMoe1xuICAgICAgICAgICAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVEXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgZW5naW5lOiByZHMuRGF0YWJhc2VJbnN0YW5jZUVuZ2luZS5wb3N0Z3Jlcyh7XG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHRoaXMucGdWZXJzaW9uXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlQ2xhc3MsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VTaXplXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBkYXRhYmFzZU5hbWU6IHRoaXMuZGF0YWJhc2VOYW1lLFxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBkYiBjcmVkZW50aWFscyBvbiB0aGUgZmx5IGFuZCBzdG9yZSB0aGVtIGluIFNlY3JldHMgTWFuYWdlclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzOiByZHMuQ3JlZGVudGlhbHMuZnJvbUdlbmVyYXRlZFNlY3JldChkYlVzZXJuYW1lKSxcbiAgICAgICAgICAgICAgICBtdWx0aUF6OiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDEwMCxcbiAgICAgICAgICAgICAgICBtYXhBbGxvY2F0ZWRTdG9yYWdlOiAxMjAsXG4gICAgICAgICAgICAgICAgYWxsb3dNYWpvclZlcnNpb25VcGdyYWRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBiYWNrdXBSZXRlbnRpb246IGNkay5EdXJhdGlvbi5kYXlzKDMpLFxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2hMb2dzUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX01PTlRILFxuICAgICAgICAgICAgICAgIGRlbGV0ZUF1dG9tYXRlZEJhY2t1cHM6IHRydWUsXG4gICAgICAgICAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgICAgICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VFbmNyeXB0aW9uS2V5OiBrbXNLZXksXG4gICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0RW5jcnlwdGlvbktleToga21zS2V5LFxuICAgICAgICAgICAgICAgIC8vIHBhcmFtZXRlckdyb3VwOiBuZXcgcmRzLlBhcmFtZXRlckdyb3VwKHRoaXMsICdDbHVzdGVyUGFyYW1ldGVyR3JvdXAnLCB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGVuZ2luZTogcmRzLkRhdGFiYXNlQ2x1c3RlckVuZ2luZS5hdXJvcmFQb3N0Z3Jlcyh7IHZlcnNpb246IHRoaXMucGdWZXJzaW9ufSksXG4gICAgICAgICAgICAgICAgLy8gICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICdyZHMuZm9yY2Vfc3NsJzogJzEnLFxuICAgICAgICAgICAgICAgIC8vICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIH0pLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2VjdXJpdHlHcm91cF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0RXhwb3J0cygpO1xuICAgIH1cblxuICAgIGRiVXNlcm5hbWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFiYXNlIGluc3RhbmNlb2YgcmRzLkRhdGFiYXNlSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBlY3MuU2VjcmV0LmZyb21TZWNyZXRzTWFuYWdlcihcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFiYXNlLnNlY3JldCEsXG4gICAgICAgICAgICAgICAgXCJ1c2VybmFtZVwiXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlZGVudGlhbHMhLnVzZXJuYW1lO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGJQYXNzd29yZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGF0YWJhc2UgaW5zdGFuY2VvZiByZHMuRGF0YWJhc2VJbnN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGVjcy5TZWNyZXQuZnJvbVNlY3JldHNNYW5hZ2VyKFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YWJhc2Uuc2VjcmV0ISxcbiAgICAgICAgICAgICAgICBcInBhc3N3b3JkXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVkZW50aWFscyEucGFzc3dvcmQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRFeHBvcnRzKCkge1xuICAgICAgICAvLyBSRFMgSW5zdGFuY2UgaWRlbnRpZmllclxuICAgICAgICAvLyBUT0RPIDogdmFsdWUgaW5jb3JyZWN0bHkgc2V0IGFzIFwiW29iamVjdCBPYmplY3RdXCIgZm9yIGV4aXN0aW5nIGluc3RhbmNlc1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgUkRTSW5zdGFuY2VJZGVudGlmaWVyLSR7dGhpcy5kZXBsb3lFbnZ9YCwge1xuICAgICAgICAgICAgdmFsdWU6IHRoaXMuZGF0YWJhc2UuaW5zdGFuY2VJZGVudGlmaWVyLFxuICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LWV4cG9ydFJkc0luc3RhbmNlSWRgLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZHNBY2Nlc3NQcm9wcyhjbGllbnRJZDogc3RyaW5nLCBkZXBsb3lFbnY6IHN0cmluZywgc2VydmljZTogc3RyaW5nKTogQWNjZXNzU2VjdXJpdHlHcm91cCB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VydmljZTogc2VydmljZSxcbiAgICAgICAgc2VjdXJpdHlHcm91cElkOiBjZGsuRm4uaW1wb3J0VmFsdWUoYCR7Y2xpZW50SWR9LSR7ZGVwbG95RW52fS0ke3NlcnZpY2V9LVNlY3VyaXR5R3JvdXBJZGApLFxuICAgICAgICBwb3J0OiBlYzIuUG9ydC50Y3AoNTQzMiksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgQWNjZXNzIHRvIFJkcyAke2RlcGxveUVudn1gXG4gICAgfTtcbn1cbiJdfQ==