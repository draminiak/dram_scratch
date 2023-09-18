import * as cdk from "aws-cdk-lib";
import {
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_logs as logs
} from "aws-cdk-lib";
import {EcsFargateStack, EcsFargateAbstract} from "../stacks/ecs_fargate";

/** ECS Config Interface & Defaults **/
export interface ecsScalingProps {
    cpu?: number
    memoryLimitMiB?: number
    taskCount?: number
}
export const ECS_SCALING_DEFAULTS: ecsScalingProps = {
    cpu: 512,
    memoryLimitMiB: 1024,
    taskCount: 1,
}

/** AutoScaling Interface & Defaults **/
export interface autoScalingProps {
    minCapacity?: number
    maxCapacity?: number
    targetUtilizationPercent?: number
}
export const AUTOSCALING_DEFAULTS: autoScalingProps = {
    minCapacity: 1,
    maxCapacity: 2,
    targetUtilizationPercent: 70
}

/** TargetGroup Interface & Defaults **/
interface targetGroupProps {
    deregistrationDelay?: string
    enableCookieStickiness?: cdk.Duration
    healthCheckEndpoint?: string
    unhealthyThresholdCount?: number
}
const TARGET_GROUP_DEFAULTS: targetGroupProps = {
    deregistrationDelay: '60',
    enableCookieStickiness: cdk.Duration.minutes(30),
    unhealthyThresholdCount: 5
}

/** CloudWatch Sidecar Interface & Defaults **/
interface cloudWatchAgentSidecarProps {
    containerName?: string
    cpu?: number
    memoryLimitMiB?: number
    containerPort?: number
    logGroup?: logs.LogGroup
}
const CLOUDWATCH_AGENT_PROPS: cloudWatchAgentSidecarProps = {
    containerName: "cwagent",
    containerPort: 26888,
    cpu: 256,
    memoryLimitMiB: 256,
}

/** Class EcsFargateConfig **/
export class EcsFargateConfig {

    public static logDriver(stack: EcsFargateAbstract, logGroup: logs.LogGroup): ecs.LogDriver {
        return ecs.LogDriver.awsLogs({
            streamPrefix: `${stack.service}-${stack.deployEnv}-logs`,
            logGroup: logGroup
        });
    }

    public static taskCluster(stack: EcsFargateAbstract, vpc: ec2.Vpc): ecs.Cluster {
        return new ecs.Cluster(stack, `${stack.service}-${stack.deployEnv}-Cluster`, {
            vpc,
            containerInsights: true,
        });
    }

     public static fetchContainerImage(stack: EcsFargateAbstract, repoName: string, imageTag: string, isEcr?: boolean): ecs.ContainerImage {
        return isEcr ?
            ecs.ContainerImage.fromEcrRepository(
                ecr.Repository.fromRepositoryName(stack, `${stack.service}-${stack.deployEnv}-EcrRepo`, repoName),
                imageTag
            ) :
            ecs.ContainerImage.fromRegistry(`${repoName}:${imageTag}`);
    }

    /**
     * This IAM role is the set of permissions provided to the ECS Service Team to execute ECS Tasks on your behalf.
     * It is NOT the permissions your application will have while executing.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
     */
    public static createEcsExecutionRole(stack: EcsFargateStack, id: string): iam.Role {
        const role = new iam.Role(stack, `${id}EcsExecutionRole`, {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: `${id}-EcsExecutionRole`,
            description: `Fargate Execution Role for ${id}`,
        });
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'));
        // role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        return role;
    }

    /**
     * Creates the IAM role (with all the required permissions) which will be used by the ECS tasks.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
     */
    public static createEcsTaskRole(stack: EcsFargateStack, id: string): iam.Role {
        const role = new iam.Role(stack, `${id}EcsTaskRole`, {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: `${id}-EcsTaskRole`,
            description: `Fargate Task Role for ${id}`,
        });
        // role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
        // role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        return role;
    }

    public static targetGroupConfig(svc: ecs_patterns.ApplicationLoadBalancedFargateService, props: targetGroupProps): void {
        const tgProps = {
            ...TARGET_GROUP_DEFAULTS,
            ...props,
        };

        // Deregistration Delay
        svc.targetGroup.setAttribute('deregistration_delay.timeout_seconds', tgProps.deregistrationDelay);

        // Session Stickiness
        if (tgProps.enableCookieStickiness) {
            svc.targetGroup.enableCookieStickiness(tgProps.enableCookieStickiness);
        }

        // Health check for containers to check they were deployed correctly
        if (tgProps.healthCheckEndpoint) {
            svc.targetGroup.configureHealthCheck({
                path: tgProps.healthCheckEndpoint,
                protocol: elbv2.Protocol.HTTP,
                unhealthyThresholdCount: tgProps.unhealthyThresholdCount
            });
        }
    }

    /** Autoscaling **/
    public static autoScaling(svc: cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService, id: string, props?: autoScalingProps) : void {
        const scalingProps = {
            ...AUTOSCALING_DEFAULTS,
            ...props,
        };

        // Task Count Guardrails
        const scalableTarget = svc.service.autoScaleTaskCount({
            minCapacity: scalingProps.minCapacity,
            maxCapacity: scalingProps.maxCapacity!
        });

        // Metric-Based Auto-Scaling
        scalableTarget.scaleOnCpuUtilization(`${id}CpuScaling`, {
            targetUtilizationPercent: scalingProps.targetUtilizationPercent!
        });
        scalableTarget.scaleOnMemoryUtilization(`${id}MemoryScaling`, {
            targetUtilizationPercent: scalingProps.targetUtilizationPercent!
        });

        // Schedule-Based Auto-Scaling
        // scalableTarget.scaleOnSchedule('DaytimeScaleDown', {
        //   schedule: appscaling.Schedule.cron({ hour: '8', minute: '0'}),
        //   minCapacity: 1,
        // });
        // scalableTarget.scaleOnSchedule('EveningRushScaleUp', {
        //   schedule: appscaling.Schedule.cron({ hour: '20', minute: '0'}),
        //   minCapacity: 10,
        // });
    }

    /** Listener Redirects **/
    public static listenerRedirects(stack: EcsFargateStack, id: string, svc: ecs_patterns.ApplicationLoadBalancedFargateService, serviceDomain: string) {
        // Redirect all HTTP:80 to HTTPS:443 & host-specific (props.serviceDomain)
        if (svc.redirectListener) {
            svc.redirectListener.addAction(`HttpDefaultRedirectAction${id}`, {
                priority: 1,
                conditions: [
                    elbv2.ListenerCondition.sourceIps(['0.0.0.0/0']),
                ],
                action: elbv2.ListenerAction.redirect({
                    host: serviceDomain,
                    path: '/#{path}',
                    permanent: true,
                    port: '443', // '#{port}'
                    protocol: 'HTTPS', // always redirect to HTTPS
                    query: '#{query}'
                }),
            });
        }
        // console.log(stack.stackName)

        // Send host-header traffic on HTTPS:443 to the alb target group
        new elbv2.ApplicationListenerRule(stack, `HttpsHostHeaderWAFRule${id}`, {
            listener: svc.listener,
            priority: 1,
            conditions: [
                elbv2.ListenerCondition.hostHeaders([serviceDomain]),
            ],
            action: elbv2.ListenerAction.forward([svc.targetGroup]),
        });

        // Redirect all other HTTPS:443 to WAF to get the host-header (props.serviceDomain)
        new elbv2.ApplicationListenerRule(stack, `HttpsWAFRedirectRule${id}`, {
            listener: svc.listener,
            priority: 2,
            conditions: [
                elbv2.ListenerCondition.sourceIps(['0.0.0.0/0']),
            ],
            action: elbv2.ListenerAction.redirect({
                host: serviceDomain,
                path: '/#{path}',
                permanent: true,
                port: '443',
                protocol: 'HTTPS', // always redirect to HTTPS
                query: '#{query}'
            }),
        });
    }

    /** CloudWatch Agent (sidecar container) **/
    // REF : https://searchcode.com/file/312811034/packages/%40aws-cdk-containers/ecs-service-extensions/lib/extensions/cloudwatch-agent.ts/
    public static cloudWatchAgentSidecar(service: cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService, id: string, props: cloudWatchAgentSidecarProps) : void {
        const cwSidecarProps = {
            ...CLOUDWATCH_AGENT_PROPS,
            ...props,
        };

        let cwProps: ecs.ContainerDefinitionOptions = {
            containerName: cwSidecarProps.containerName,
            image: ecs.ContainerImage.fromRegistry('public.ecr.aws/cloudwatch-agent/cloudwatch-agent:latest'),
            environment: {
                CW_CONFIG_CONTENT: '{"logs":{"metrics_collected":{"emf":{}}}}'
            },
            cpu: cwSidecarProps.cpu,
            memoryLimitMiB: cwSidecarProps.memoryLimitMiB,
            portMappings: [{
                protocol: ecs.Protocol.TCP,
                containerPort: cwSidecarProps.containerPort!
            }],
        };
        if (props.logGroup) {
            cwProps = {
                ...cwProps,
                logging: ecs.LogDriver.awsLogs({
                    streamPrefix: `${id}-${props.containerName}-logs`,
                    logGroup: props.logGroup,
                }),
            }
        }
        service.taskDefinition.addContainer(`${id}CloudWatchSidecar`, cwProps);
    }

    public static cwAgentEndpoint(props: cloudWatchAgentSidecarProps) {
        const cwSidecarProps = {
            ...CLOUDWATCH_AGENT_PROPS,
            ...props,
        };
        return `tcp://${cwSidecarProps.containerName}:${cwSidecarProps.containerPort}`;
    }
}
