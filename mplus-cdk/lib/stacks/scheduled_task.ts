import * as cdk from "aws-cdk-lib";
import {
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_events as events,
    aws_iam as iam,
} from "aws-cdk-lib";
import {EcsFargateAbstract, EcsFargateStackProps} from "./ecs_fargate";

/** Interfaces **/
export interface ScheduledTaskStackProps extends EcsFargateStackProps {
    readonly scheduleWeekday?: number|string
    readonly scheduleHour: number|string
    readonly scheduleMin: number|string
    memoryLimitMiB?: number
    cpu?: number
}

/** Class ScheduledTaskStack **/
const SCHEDULED_TASK_SCALING_PROPS = {
    memoryLimitMiB: 1024,
    cpu: 512,
};

export class ScheduledTaskStack extends EcsFargateAbstract {
    // declare containerPort: number;
    declare memoryLimitMiB: number;
    declare cpu: number;
    declare desiredTaskCount: number;
    declare scheduledTask: ecs_patterns.ScheduledFargateTask

    constructor(scope: cdk.App, props: ScheduledTaskStackProps) {
        super(scope, props);
        this._setScalingValues(props);
        this._initTaskStack(props);
    }

    private _initTaskStack(props: ScheduledTaskStackProps): void {
        /** SFTP Access **/
        this.taskCluster.connections.allowTo(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SFTP access');

        const taskDef = new ecs.FargateTaskDefinition(this, 'FargateTaskDef', {
            cpu: this.cpu,
            memoryLimitMiB: this.memoryLimitMiB,
            // ephemeralStorageGiB: 50,
            executionRole: this.createEcsExecutionRole(),
            taskRole: this.createEcsTaskRole()
        });
        taskDef.addContainer('AppContainer', {
            containerName: 'app',
            image: this.containerImage,
            environment: props.serviceEnv,
            // portMappings: [{
            //   containerPort: this.containerPort,
            //   protocol: ecs.Protocol.TCP,
            // }],
            secrets: props.serviceSecrets,
            logging: this.logDriver,
        });

        this.scheduledTask = new ecs_patterns.ScheduledFargateTask(this, 'ScheduledFargateTask', {
            platformVersion: ecs.FargatePlatformVersion.VERSION1_3,
            vpc: props.vpc,
            subnetSelection: props.vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            }),
            cluster: this.taskCluster,
            scheduledFargateTaskDefinitionOptions: {
                taskDefinition: taskDef,
            },
            schedule: events.Schedule.cron({
                weekDay: props.scheduleWeekday ? props.scheduleWeekday.toString() : '*',
                hour: props.scheduleHour.toString(),
                minute: props.scheduleMin.toString()
            }),
            desiredTaskCount: this.desiredTaskCount,
            ruleName: `${this.service}-${this.deployEnv}-ScheduledEc2TaskRule`,
            // securityGroups: [this.securityGroup!],
        });
    }

    private _setScalingValues(props: ScheduledTaskStackProps) {
        this.desiredTaskCount = 1;
        this.memoryLimitMiB = props.memoryLimitMiB || SCHEDULED_TASK_SCALING_PROPS.memoryLimitMiB;
        this.cpu = props.cpu || SCHEDULED_TASK_SCALING_PROPS.cpu;
    }

    /**
     * This IAM role is the set of permissions provided to the ECS Service Team to execute ECS Tasks on your behalf.
     * It is NOT the permissions your application will have while executing.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
     * @private
     */
    private createEcsExecutionRole(): iam.Role {
        const role = new iam.Role(this, 'TaskExecutionRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: `${this.service}-${this.deployEnv}-TaskExecutionRole`,
        });
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        return role;
    }

    /**
    * Creates the IAM role (with all the required permissions) which will be used by the ECS tasks.
    * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
    * @private
    */
    private createEcsTaskRole(): iam.IRole {
        const role = new iam.Role(this, 'EcsTaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: `${this.service}-${this.deployEnv}-EcsTaskRole`,
        });
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
        // ecsTaskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
        return role;
    }
}
