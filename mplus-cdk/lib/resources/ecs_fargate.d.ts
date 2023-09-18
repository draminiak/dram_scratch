import * as cdk from "aws-cdk-lib";
import { aws_ec2 as ec2, aws_ecs as ecs, aws_ecs_patterns as ecs_patterns, aws_iam as iam, aws_logs as logs } from "aws-cdk-lib";
import { EcsFargateStack, EcsFargateAbstract } from "../stacks/ecs_fargate";
/** ECS Config Interface & Defaults **/
export interface ecsScalingProps {
    cpu?: number;
    memoryLimitMiB?: number;
    taskCount?: number;
}
export declare const ECS_SCALING_DEFAULTS: ecsScalingProps;
/** AutoScaling Interface & Defaults **/
export interface autoScalingProps {
    minCapacity?: number;
    maxCapacity?: number;
    targetUtilizationPercent?: number;
}
export declare const AUTOSCALING_DEFAULTS: autoScalingProps;
/** TargetGroup Interface & Defaults **/
interface targetGroupProps {
    deregistrationDelay?: string;
    enableCookieStickiness?: cdk.Duration;
    healthCheckEndpoint?: string;
    unhealthyThresholdCount?: number;
}
/** CloudWatch Sidecar Interface & Defaults **/
interface cloudWatchAgentSidecarProps {
    containerName?: string;
    cpu?: number;
    memoryLimitMiB?: number;
    containerPort?: number;
    logGroup?: logs.LogGroup;
}
/** Class EcsFargateConfig **/
export declare class EcsFargateConfig {
    static logDriver(stack: EcsFargateAbstract, logGroup: logs.LogGroup): ecs.LogDriver;
    static taskCluster(stack: EcsFargateAbstract, vpc: ec2.Vpc): ecs.Cluster;
    static fetchContainerImage(stack: EcsFargateAbstract, repoName: string, imageTag: string, isEcr?: boolean): ecs.ContainerImage;
    /**
     * This IAM role is the set of permissions provided to the ECS Service Team to execute ECS Tasks on your behalf.
     * It is NOT the permissions your application will have while executing.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
     */
    static createEcsExecutionRole(stack: EcsFargateStack, id: string): iam.Role;
    /**
     * Creates the IAM role (with all the required permissions) which will be used by the ECS tasks.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
     */
    static createEcsTaskRole(stack: EcsFargateStack, id: string): iam.Role;
    static targetGroupConfig(svc: ecs_patterns.ApplicationLoadBalancedFargateService, props: targetGroupProps): void;
    /** Autoscaling **/
    static autoScaling(svc: cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService, id: string, props?: autoScalingProps): void;
    /** Listener Redirects **/
    static listenerRedirects(stack: EcsFargateStack, id: string, svc: ecs_patterns.ApplicationLoadBalancedFargateService, serviceDomain: string): void;
    /** CloudWatch Agent (sidecar container) **/
    static cloudWatchAgentSidecar(service: cdk.aws_ecs_patterns.ApplicationLoadBalancedFargateService, id: string, props: cloudWatchAgentSidecarProps): void;
    static cwAgentEndpoint(props: cloudWatchAgentSidecarProps): string;
}
export {};
