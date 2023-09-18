"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcsFargateConfig = exports.AUTOSCALING_DEFAULTS = exports.ECS_SCALING_DEFAULTS = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
exports.ECS_SCALING_DEFAULTS = {
    cpu: 512,
    memoryLimitMiB: 1024,
    taskCount: 1,
};
exports.AUTOSCALING_DEFAULTS = {
    minCapacity: 1,
    maxCapacity: 2,
    targetUtilizationPercent: 70
};
const TARGET_GROUP_DEFAULTS = {
    deregistrationDelay: '60',
    enableCookieStickiness: cdk.Duration.minutes(30),
    unhealthyThresholdCount: 5
};
const CLOUDWATCH_AGENT_PROPS = {
    containerName: "cwagent",
    containerPort: 26888,
    cpu: 256,
    memoryLimitMiB: 256,
};
/** Class EcsFargateConfig **/
class EcsFargateConfig {
    static logDriver(stack, logGroup) {
        return aws_cdk_lib_1.aws_ecs.LogDriver.awsLogs({
            streamPrefix: `${stack.service}-${stack.deployEnv}-logs`,
            logGroup: logGroup
        });
    }
    static taskCluster(stack, vpc) {
        return new aws_cdk_lib_1.aws_ecs.Cluster(stack, `${stack.service}-${stack.deployEnv}-Cluster`, {
            vpc,
            containerInsights: true,
        });
    }
    static fetchContainerImage(stack, repoName, imageTag, isEcr) {
        return isEcr ?
            aws_cdk_lib_1.aws_ecs.ContainerImage.fromEcrRepository(aws_cdk_lib_1.aws_ecr.Repository.fromRepositoryName(stack, `${stack.service}-${stack.deployEnv}-EcrRepo`, repoName), imageTag) :
            aws_cdk_lib_1.aws_ecs.ContainerImage.fromRegistry(`${repoName}:${imageTag}`);
    }
    /**
     * This IAM role is the set of permissions provided to the ECS Service Team to execute ECS Tasks on your behalf.
     * It is NOT the permissions your application will have while executing.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
     */
    static createEcsExecutionRole(stack, id) {
        const role = new aws_cdk_lib_1.aws_iam.Role(stack, `${id}EcsExecutionRole`, {
            assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: `${id}-EcsExecutionRole`,
            description: `Fargate Execution Role for ${id}`,
        });
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'));
        // role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        return role;
    }
    /**
     * Creates the IAM role (with all the required permissions) which will be used by the ECS tasks.
     * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
     */
    static createEcsTaskRole(stack, id) {
        const role = new aws_cdk_lib_1.aws_iam.Role(stack, `${id}EcsTaskRole`, {
            assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            roleName: `${id}-EcsTaskRole`,
            description: `Fargate Task Role for ${id}`,
        });
        // role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
        // role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        return role;
    }
    static targetGroupConfig(svc, props) {
        const tgProps = Object.assign(Object.assign({}, TARGET_GROUP_DEFAULTS), props);
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
                protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.Protocol.HTTP,
                unhealthyThresholdCount: tgProps.unhealthyThresholdCount
            });
        }
    }
    /** Autoscaling **/
    static autoScaling(svc, id, props) {
        const scalingProps = Object.assign(Object.assign({}, exports.AUTOSCALING_DEFAULTS), props);
        // Task Count Guardrails
        const scalableTarget = svc.service.autoScaleTaskCount({
            minCapacity: scalingProps.minCapacity,
            maxCapacity: scalingProps.maxCapacity
        });
        // Metric-Based Auto-Scaling
        scalableTarget.scaleOnCpuUtilization(`${id}CpuScaling`, {
            targetUtilizationPercent: scalingProps.targetUtilizationPercent
        });
        scalableTarget.scaleOnMemoryUtilization(`${id}MemoryScaling`, {
            targetUtilizationPercent: scalingProps.targetUtilizationPercent
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
    static listenerRedirects(stack, id, svc, serviceDomain) {
        // Redirect all HTTP:80 to HTTPS:443 & host-specific (props.serviceDomain)
        if (svc.redirectListener) {
            svc.redirectListener.addAction(`HttpDefaultRedirectAction${id}`, {
                priority: 1,
                conditions: [
                    aws_cdk_lib_1.aws_elasticloadbalancingv2.ListenerCondition.sourceIps(['0.0.0.0/0']),
                ],
                action: aws_cdk_lib_1.aws_elasticloadbalancingv2.ListenerAction.redirect({
                    host: serviceDomain,
                    path: '/#{path}',
                    permanent: true,
                    port: '443',
                    protocol: 'HTTPS',
                    query: '#{query}'
                }),
            });
        }
        // console.log(stack.stackName)
        // Send host-header traffic on HTTPS:443 to the alb target group
        new aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationListenerRule(stack, `HttpsHostHeaderWAFRule${id}`, {
            listener: svc.listener,
            priority: 1,
            conditions: [
                aws_cdk_lib_1.aws_elasticloadbalancingv2.ListenerCondition.hostHeaders([serviceDomain]),
            ],
            action: aws_cdk_lib_1.aws_elasticloadbalancingv2.ListenerAction.forward([svc.targetGroup]),
        });
        // Redirect all other HTTPS:443 to WAF to get the host-header (props.serviceDomain)
        new aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationListenerRule(stack, `HttpsWAFRedirectRule${id}`, {
            listener: svc.listener,
            priority: 2,
            conditions: [
                aws_cdk_lib_1.aws_elasticloadbalancingv2.ListenerCondition.sourceIps(['0.0.0.0/0']),
            ],
            action: aws_cdk_lib_1.aws_elasticloadbalancingv2.ListenerAction.redirect({
                host: serviceDomain,
                path: '/#{path}',
                permanent: true,
                port: '443',
                protocol: 'HTTPS',
                query: '#{query}'
            }),
        });
    }
    /** CloudWatch Agent (sidecar container) **/
    // REF : https://searchcode.com/file/312811034/packages/%40aws-cdk-containers/ecs-service-extensions/lib/extensions/cloudwatch-agent.ts/
    static cloudWatchAgentSidecar(service, id, props) {
        const cwSidecarProps = Object.assign(Object.assign({}, CLOUDWATCH_AGENT_PROPS), props);
        let cwProps = {
            containerName: cwSidecarProps.containerName,
            image: aws_cdk_lib_1.aws_ecs.ContainerImage.fromRegistry('public.ecr.aws/cloudwatch-agent/cloudwatch-agent:latest'),
            environment: {
                CW_CONFIG_CONTENT: '{"logs":{"metrics_collected":{"emf":{}}}}'
            },
            cpu: cwSidecarProps.cpu,
            memoryLimitMiB: cwSidecarProps.memoryLimitMiB,
            portMappings: [{
                    protocol: aws_cdk_lib_1.aws_ecs.Protocol.TCP,
                    containerPort: cwSidecarProps.containerPort
                }],
        };
        if (props.logGroup) {
            cwProps = Object.assign(Object.assign({}, cwProps), { logging: aws_cdk_lib_1.aws_ecs.LogDriver.awsLogs({
                    streamPrefix: `${id}-${props.containerName}-logs`,
                    logGroup: props.logGroup,
                }) });
        }
        service.taskDefinition.addContainer(`${id}CloudWatchSidecar`, cwProps);
    }
    static cwAgentEndpoint(props) {
        const cwSidecarProps = Object.assign(Object.assign({}, CLOUDWATCH_AGENT_PROPS), props);
        return `tcp://${cwSidecarProps.containerName}:${cwSidecarProps.containerPort}`;
    }
}
exports.EcsFargateConfig = EcsFargateConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzX2ZhcmdhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlY3NfZmFyZ2F0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBUXFCO0FBU1IsUUFBQSxvQkFBb0IsR0FBb0I7SUFDakQsR0FBRyxFQUFFLEdBQUc7SUFDUixjQUFjLEVBQUUsSUFBSTtJQUNwQixTQUFTLEVBQUUsQ0FBQztDQUNmLENBQUE7QUFRWSxRQUFBLG9CQUFvQixHQUFxQjtJQUNsRCxXQUFXLEVBQUUsQ0FBQztJQUNkLFdBQVcsRUFBRSxDQUFDO0lBQ2Qsd0JBQXdCLEVBQUUsRUFBRTtDQUMvQixDQUFBO0FBU0QsTUFBTSxxQkFBcUIsR0FBcUI7SUFDNUMsbUJBQW1CLEVBQUUsSUFBSTtJQUN6QixzQkFBc0IsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7SUFDaEQsdUJBQXVCLEVBQUUsQ0FBQztDQUM3QixDQUFBO0FBVUQsTUFBTSxzQkFBc0IsR0FBZ0M7SUFDeEQsYUFBYSxFQUFFLFNBQVM7SUFDeEIsYUFBYSxFQUFFLEtBQUs7SUFDcEIsR0FBRyxFQUFFLEdBQUc7SUFDUixjQUFjLEVBQUUsR0FBRztDQUN0QixDQUFBO0FBRUQsOEJBQThCO0FBQzlCLE1BQWEsZ0JBQWdCO0lBRWxCLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBeUIsRUFBRSxRQUF1QjtRQUN0RSxPQUFPLHFCQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztZQUN6QixZQUFZLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxTQUFTLE9BQU87WUFDeEQsUUFBUSxFQUFFLFFBQVE7U0FDckIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBeUIsRUFBRSxHQUFZO1FBQzdELE9BQU8sSUFBSSxxQkFBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFL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QVksRUFBRSxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUMsYUFBYSxPQUFPO29CQUNqRCxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7aUJBQzNCLENBQUMsR0FDTCxDQUFBO1NBQ0o7UUFDRCxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVNLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBa0M7UUFDNUQsTUFBTSxjQUFjLG1DQUNiLHNCQUFzQixHQUN0QixLQUFLLENBQ1gsQ0FBQztRQUNGLE9BQU8sU0FBUyxjQUFjLENBQUMsYUFBYSxJQUFJLGNBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNuRixDQUFDO0NBQ0o7QUE5TUQsNENBOE1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHtcbiAgICBhd3NfZWMyIGFzIGVjMixcbiAgICBhd3NfZWNyIGFzIGVjcixcbiAgICBhd3NfZWNzIGFzIGVjcyxcbiAgICBhd3NfZWNzX3BhdHRlcm5zIGFzIGVjc19wYXR0ZXJucyxcbiAgICBhd3NfZWxhc3RpY2xvYWRiYWxhbmNpbmd2MiBhcyBlbGJ2MixcbiAgICBhd3NfaWFtIGFzIGlhbSxcbiAgICBhd3NfbG9ncyBhcyBsb2dzXG59IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHtFY3NGYXJnYXRlU3RhY2ssIEVjc0ZhcmdhdGVBYnN0cmFjdH0gZnJvbSBcIi4uL3N0YWNrcy9lY3NfZmFyZ2F0ZVwiO1xuXG4vKiogRUNTIENvbmZpZyBJbnRlcmZhY2UgJiBEZWZhdWx0cyAqKi9cbmV4cG9ydCBpbnRlcmZhY2UgZWNzU2NhbGluZ1Byb3BzIHtcbiAgICBjcHU/OiBudW1iZXJcbiAgICBtZW1vcnlMaW1pdE1pQj86IG51bWJlclxuICAgIHRhc2tDb3VudD86IG51bWJlclxufVxuZXhwb3J0IGNvbnN0IEVDU19TQ0FMSU5HX0RFRkFVTFRTOiBlY3NTY2FsaW5nUHJvcHMgPSB7XG4gICAgY3B1OiA1MTIsXG4gICAgbWVtb3J5TGltaXRNaUI6IDEwMjQsXG4gICAgdGFza0NvdW50OiAxLFxufVxuXG4vKiogQXV0b1NjYWxpbmcgSW50ZXJmYWNlICYgRGVmYXVsdHMgKiovXG5leHBvcnQgaW50ZXJmYWNlIGF1dG9TY2FsaW5nUHJvcHMge1xuICAgIG1pbkNhcGFjaXR5PzogbnVtYmVyXG4gICAgbWF4Q2FwYWNpdHk/OiBudW1iZXJcbiAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ/OiBudW1iZXJcbn1cbmV4cG9ydCBjb25zdCBBVVRPU0NBTElOR19ERUZBVUxUUzogYXV0b1NjYWxpbmdQcm9wcyA9IHtcbiAgICBtaW5DYXBhY2l0eTogMSxcbiAgICBtYXhDYXBhY2l0eTogMixcbiAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDcwXG59XG5cbi8qKiBUYXJnZXRHcm91cCBJbnRlcmZhY2UgJiBEZWZhdWx0cyAqKi9cbmludGVyZmFjZSB0YXJnZXRHcm91cFByb3BzIHtcbiAgICBkZXJlZ2lzdHJhdGlvbkRlbGF5Pzogc3RyaW5nXG4gICAgZW5hYmxlQ29va2llU3RpY2tpbmVzcz86IGNkay5EdXJhdGlvblxuICAgIGhlYWx0aENoZWNrRW5kcG9pbnQ/OiBzdHJpbmdcbiAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudD86IG51bWJlclxufVxuY29uc3QgVEFSR0VUX0dST1VQX0RFRkFVTFRTOiB0YXJnZXRHcm91cFByb3BzID0ge1xuICAgIGRlcmVnaXN0cmF0aW9uRGVsYXk6ICc2MCcsXG4gICAgZW5hYmxlQ29va2llU3RpY2tpbmVzczogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMzApLFxuICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiA1XG59XG5cbi8qKiBDbG91ZFdhdGNoIFNpZGVjYXIgSW50ZXJmYWNlICYgRGVmYXVsdHMgKiovXG5pbnRlcmZhY2UgY2xvdWRXYXRjaEFnZW50U2lkZWNhclByb3BzIHtcbiAgICBjb250YWluZXJOYW1lPzogc3RyaW5nXG4gICAgY3B1PzogbnVtYmVyXG4gICAgbWVtb3J5TGltaXRNaUI/OiBudW1iZXJcbiAgICBjb250YWluZXJQb3J0PzogbnVtYmVyXG4gICAgbG9nR3JvdXA/OiBsb2dzLkxvZ0dyb3VwXG59XG5jb25zdCBDTE9VRFdBVENIX0FHRU5UX1BST1BTOiBjbG91ZFdhdGNoQWdlbnRTaWRlY2FyUHJvcHMgPSB7XG4gICAgY29udGFpbmVyTmFtZTogXCJjd2FnZW50XCIsXG4gICAgY29udGFpbmVyUG9ydDogMjY4ODgsXG4gICAgY3B1OiAyNTYsXG4gICAgbWVtb3J5TGltaXRNaUI6IDI1Nixcbn1cblxuLyoqIENsYXNzIEVjc0ZhcmdhdGVDb25maWcgKiovXG5leHBvcnQgY2xhc3MgRWNzRmFyZ2F0ZUNvbmZpZyB7XG5cbiAgICBwdWJsaWMgc3RhdGljIGxvZ0RyaXZlcihzdGFjazogRWNzRmFyZ2F0ZUFic3RyYWN0LCBsb2dHcm91cDogbG9ncy5Mb2dHcm91cCk6IGVjcy5Mb2dEcml2ZXIge1xuICAgICAgICByZXR1cm4gZWNzLkxvZ0RyaXZlci5hd3NMb2dzKHtcbiAgICAgICAgICAgIHN0cmVhbVByZWZpeDogYCR7c3RhY2suc2VydmljZX0tJHtzdGFjay5kZXBsb3lFbnZ9LWxvZ3NgLFxuICAgICAgICAgICAgbG9nR3JvdXA6IGxvZ0dyb3VwXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgdGFza0NsdXN0ZXIoc3RhY2s6IEVjc0ZhcmdhdGVBYnN0cmFjdCwgdnBjOiBlYzIuVnBjKTogZWNzLkNsdXN0ZXIge1xuICAgICAgICByZXR1cm4gbmV3IGVjcy5DbHVzdGVyKHN0YWNrLCBgJHtzdGFjay5zZXJ2aWNlfS0ke3N0YWNrLmRlcGxveUVudn0tQ2x1c3RlcmAsIHtcbiAgICAgICAgICAgIHZwYyxcbiAgICAgICAgICAgIGNvbnRhaW5lckluc2lnaHRzOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAgcHVibGljIHN0YXRpYyBmZXRjaENvbnRhaW5lckltYWdlKHN0YWNrOiBFY3NGYXJnYXRlQWJzdHJhY3QsIHJlcG9OYW1lOiBzdHJpbmcsIGltYWdlVGFnOiBzdHJpbmcsIGlzRWNyPzogYm9vbGVhbik6IGVjcy5Db250YWluZXJJbWFnZSB7XG4gICAgICAgIHJldHVybiBpc0VjciA/XG4gICAgICAgICAgICBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbUVjclJlcG9zaXRvcnkoXG4gICAgICAgICAgICAgICAgZWNyLlJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKHN0YWNrLCBgJHtzdGFjay5zZXJ2aWNlfS0ke3N0YWNrLmRlcGxveUVudn0tRWNyUmVwb2AsIHJlcG9OYW1lKSxcbiAgICAgICAgICAgICAgICBpbWFnZVRhZ1xuICAgICAgICAgICAgKSA6XG4gICAgICAgICAgICBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KGAke3JlcG9OYW1lfToke2ltYWdlVGFnfWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgSUFNIHJvbGUgaXMgdGhlIHNldCBvZiBwZXJtaXNzaW9ucyBwcm92aWRlZCB0byB0aGUgRUNTIFNlcnZpY2UgVGVhbSB0byBleGVjdXRlIEVDUyBUYXNrcyBvbiB5b3VyIGJlaGFsZi5cbiAgICAgKiBJdCBpcyBOT1QgdGhlIHBlcm1pc3Npb25zIHlvdXIgYXBwbGljYXRpb24gd2lsbCBoYXZlIHdoaWxlIGV4ZWN1dGluZy5cbiAgICAgKiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQW1hem9uRUNTL2xhdGVzdC9kZXZlbG9wZXJndWlkZS90YXNrX2V4ZWN1dGlvbl9JQU1fcm9sZS5odG1sXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVFY3NFeGVjdXRpb25Sb2xlKHN0YWNrOiBFY3NGYXJnYXRlU3RhY2ssIGlkOiBzdHJpbmcpOiBpYW0uUm9sZSB7XG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUoc3RhY2ssIGAke2lkfUVjc0V4ZWN1dGlvblJvbGVgLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgICAgIHJvbGVOYW1lOiBgJHtpZH0tRWNzRXhlY3V0aW9uUm9sZWAsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYEZhcmdhdGUgRXhlY3V0aW9uIFJvbGUgZm9yICR7aWR9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVDMkNvbnRhaW5lclJlZ2lzdHJ5UmVhZE9ubHknKSk7XG4gICAgICAgIHJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BbWF6b25FQ1NUYXNrRXhlY3V0aW9uUm9sZVBvbGljeScpKTtcbiAgICAgICAgcm9sZS5hZGRNYW5hZ2VkUG9saWN5KGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRUNTX0Z1bGxBY2Nlc3MnKSk7XG4gICAgICAgIC8vIHJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblNTTUZ1bGxBY2Nlc3MnKSk7XG4gICAgICAgIHJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hMb2dzRnVsbEFjY2VzcycpKTtcbiAgICAgICAgcm9sZS5hZGRNYW5hZ2VkUG9saWN5KGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnU2VjcmV0c01hbmFnZXJSZWFkV3JpdGUnKSk7XG4gICAgICAgIHJldHVybiByb2xlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIElBTSByb2xlICh3aXRoIGFsbCB0aGUgcmVxdWlyZWQgcGVybWlzc2lvbnMpIHdoaWNoIHdpbGwgYmUgdXNlZCBieSB0aGUgRUNTIHRhc2tzLlxuICAgICAqIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BbWF6b25FQ1MvbGF0ZXN0L2RldmVsb3Blcmd1aWRlL2luc3RhbmNlX0lBTV9yb2xlLmh0bWxcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZUVjc1Rhc2tSb2xlKHN0YWNrOiBFY3NGYXJnYXRlU3RhY2ssIGlkOiBzdHJpbmcpOiBpYW0uUm9sZSB7XG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUoc3RhY2ssIGAke2lkfUVjc1Rhc2tSb2xlYCwge1xuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2Vjcy10YXNrcy5hbWF6b25hd3MuY29tJyksXG4gICAgICAgICAgICByb2xlTmFtZTogYCR7aWR9LUVjc1Rhc2tSb2xlYCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRmFyZ2F0ZSBUYXNrIFJvbGUgZm9yICR7aWR9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVDMkNvbnRhaW5lclJlZ2lzdHJ5UmVhZE9ubHknKSk7XG4gICAgICAgIHJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hMb2dzRnVsbEFjY2VzcycpKTtcbiAgICAgICAgLy8gcm9sZS5hZGRNYW5hZ2VkUG9saWN5KGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnU2VjcmV0c01hbmFnZXJSZWFkV3JpdGUnKSk7XG4gICAgICAgIHJldHVybiByb2xlO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgdGFyZ2V0R3JvdXBDb25maWcoc3ZjOiBlY3NfcGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZSwgcHJvcHM6IHRhcmdldEdyb3VwUHJvcHMpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgdGdQcm9wcyA9IHtcbiAgICAgICAgICAgIC4uLlRBUkdFVF9HUk9VUF9ERUZBVUxUUyxcbiAgICAgICAgICAgIC4uLnByb3BzLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERlcmVnaXN0cmF0aW9uIERlbGF5XG4gICAgICAgIHN2Yy50YXJnZXRHcm91cC5zZXRBdHRyaWJ1dGUoJ2RlcmVnaXN0cmF0aW9uX2RlbGF5LnRpbWVvdXRfc2Vjb25kcycsIHRnUHJvcHMuZGVyZWdpc3RyYXRpb25EZWxheSk7XG5cbiAgICAgICAgLy8gU2Vzc2lvbiBTdGlja2luZXNzXG4gICAgICAgIGlmICh0Z1Byb3BzLmVuYWJsZUNvb2tpZVN0aWNraW5lc3MpIHtcbiAgICAgICAgICAgIHN2Yy50YXJnZXRHcm91cC5lbmFibGVDb29raWVTdGlja2luZXNzKHRnUHJvcHMuZW5hYmxlQ29va2llU3RpY2tpbmVzcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIZWFsdGggY2hlY2sgZm9yIGNvbnRhaW5lcnMgdG8gY2hlY2sgdGhleSB3ZXJlIGRlcGxveWVkIGNvcnJlY3RseVxuICAgICAgICBpZiAodGdQcm9wcy5oZWFsdGhDaGVja0VuZHBvaW50KSB7XG4gICAgICAgICAgICBzdmMudGFyZ2V0R3JvdXAuY29uZmlndXJlSGVhbHRoQ2hlY2soe1xuICAgICAgICAgICAgICAgIHBhdGg6IHRnUHJvcHMuaGVhbHRoQ2hlY2tFbmRwb2ludCxcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogZWxidjIuUHJvdG9jb2wuSFRUUCxcbiAgICAgICAgICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogdGdQcm9wcy51bmhlYWx0aHlUaHJlc2hvbGRDb3VudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQXV0b3NjYWxpbmcgKiovXG4gICAgcHVibGljIHN0YXRpYyBhdXRvU2NhbGluZyhzdmM6IGNkay5hd3NfZWNzX3BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRmFyZ2F0ZVNlcnZpY2UsIGlkOiBzdHJpbmcsIHByb3BzPzogYXV0b1NjYWxpbmdQcm9wcykgOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2NhbGluZ1Byb3BzID0ge1xuICAgICAgICAgICAgLi4uQVVUT1NDQUxJTkdfREVGQVVMVFMsXG4gICAgICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBUYXNrIENvdW50IEd1YXJkcmFpbHNcbiAgICAgICAgY29uc3Qgc2NhbGFibGVUYXJnZXQgPSBzdmMuc2VydmljZS5hdXRvU2NhbGVUYXNrQ291bnQoe1xuICAgICAgICAgICAgbWluQ2FwYWNpdHk6IHNjYWxpbmdQcm9wcy5taW5DYXBhY2l0eSxcbiAgICAgICAgICAgIG1heENhcGFjaXR5OiBzY2FsaW5nUHJvcHMubWF4Q2FwYWNpdHkhXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE1ldHJpYy1CYXNlZCBBdXRvLVNjYWxpbmdcbiAgICAgICAgc2NhbGFibGVUYXJnZXQuc2NhbGVPbkNwdVV0aWxpemF0aW9uKGAke2lkfUNwdVNjYWxpbmdgLCB7XG4gICAgICAgICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IHNjYWxpbmdQcm9wcy50YXJnZXRVdGlsaXphdGlvblBlcmNlbnQhXG4gICAgICAgIH0pO1xuICAgICAgICBzY2FsYWJsZVRhcmdldC5zY2FsZU9uTWVtb3J5VXRpbGl6YXRpb24oYCR7aWR9TWVtb3J5U2NhbGluZ2AsIHtcbiAgICAgICAgICAgIHRhcmdldFV0aWxpemF0aW9uUGVyY2VudDogc2NhbGluZ1Byb3BzLnRhcmdldFV0aWxpemF0aW9uUGVyY2VudCFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2NoZWR1bGUtQmFzZWQgQXV0by1TY2FsaW5nXG4gICAgICAgIC8vIHNjYWxhYmxlVGFyZ2V0LnNjYWxlT25TY2hlZHVsZSgnRGF5dGltZVNjYWxlRG93bicsIHtcbiAgICAgICAgLy8gICBzY2hlZHVsZTogYXBwc2NhbGluZy5TY2hlZHVsZS5jcm9uKHsgaG91cjogJzgnLCBtaW51dGU6ICcwJ30pLFxuICAgICAgICAvLyAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gc2NhbGFibGVUYXJnZXQuc2NhbGVPblNjaGVkdWxlKCdFdmVuaW5nUnVzaFNjYWxlVXAnLCB7XG4gICAgICAgIC8vICAgc2NoZWR1bGU6IGFwcHNjYWxpbmcuU2NoZWR1bGUuY3Jvbih7IGhvdXI6ICcyMCcsIG1pbnV0ZTogJzAnfSksXG4gICAgICAgIC8vICAgbWluQ2FwYWNpdHk6IDEwLFxuICAgICAgICAvLyB9KTtcbiAgICB9XG5cbiAgICAvKiogTGlzdGVuZXIgUmVkaXJlY3RzICoqL1xuICAgIHB1YmxpYyBzdGF0aWMgbGlzdGVuZXJSZWRpcmVjdHMoc3RhY2s6IEVjc0ZhcmdhdGVTdGFjaywgaWQ6IHN0cmluZywgc3ZjOiBlY3NfcGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZSwgc2VydmljZURvbWFpbjogc3RyaW5nKSB7XG4gICAgICAgIC8vIFJlZGlyZWN0IGFsbCBIVFRQOjgwIHRvIEhUVFBTOjQ0MyAmIGhvc3Qtc3BlY2lmaWMgKHByb3BzLnNlcnZpY2VEb21haW4pXG4gICAgICAgIGlmIChzdmMucmVkaXJlY3RMaXN0ZW5lcikge1xuICAgICAgICAgICAgc3ZjLnJlZGlyZWN0TGlzdGVuZXIuYWRkQWN0aW9uKGBIdHRwRGVmYXVsdFJlZGlyZWN0QWN0aW9uJHtpZH1gLCB7XG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICAgICAgICAgICAgY29uZGl0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICBlbGJ2Mi5MaXN0ZW5lckNvbmRpdGlvbi5zb3VyY2VJcHMoWycwLjAuMC4wLzAnXSksXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBhY3Rpb246IGVsYnYyLkxpc3RlbmVyQWN0aW9uLnJlZGlyZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgaG9zdDogc2VydmljZURvbWFpbixcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogJy8je3BhdGh9JyxcbiAgICAgICAgICAgICAgICAgICAgcGVybWFuZW50OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwb3J0OiAnNDQzJywgLy8gJyN7cG9ydH0nXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiAnSFRUUFMnLCAvLyBhbHdheXMgcmVkaXJlY3QgdG8gSFRUUFNcbiAgICAgICAgICAgICAgICAgICAgcXVlcnk6ICcje3F1ZXJ5fSdcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHN0YWNrLnN0YWNrTmFtZSlcblxuICAgICAgICAvLyBTZW5kIGhvc3QtaGVhZGVyIHRyYWZmaWMgb24gSFRUUFM6NDQzIHRvIHRoZSBhbGIgdGFyZ2V0IGdyb3VwXG4gICAgICAgIG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxpc3RlbmVyUnVsZShzdGFjaywgYEh0dHBzSG9zdEhlYWRlcldBRlJ1bGUke2lkfWAsIHtcbiAgICAgICAgICAgIGxpc3RlbmVyOiBzdmMubGlzdGVuZXIsXG4gICAgICAgICAgICBwcmlvcml0eTogMSxcbiAgICAgICAgICAgIGNvbmRpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBlbGJ2Mi5MaXN0ZW5lckNvbmRpdGlvbi5ob3N0SGVhZGVycyhbc2VydmljZURvbWFpbl0pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGFjdGlvbjogZWxidjIuTGlzdGVuZXJBY3Rpb24uZm9yd2FyZChbc3ZjLnRhcmdldEdyb3VwXSksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlZGlyZWN0IGFsbCBvdGhlciBIVFRQUzo0NDMgdG8gV0FGIHRvIGdldCB0aGUgaG9zdC1oZWFkZXIgKHByb3BzLnNlcnZpY2VEb21haW4pXG4gICAgICAgIG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxpc3RlbmVyUnVsZShzdGFjaywgYEh0dHBzV0FGUmVkaXJlY3RSdWxlJHtpZH1gLCB7XG4gICAgICAgICAgICBsaXN0ZW5lcjogc3ZjLmxpc3RlbmVyLFxuICAgICAgICAgICAgcHJpb3JpdHk6IDIsXG4gICAgICAgICAgICBjb25kaXRpb25zOiBbXG4gICAgICAgICAgICAgICAgZWxidjIuTGlzdGVuZXJDb25kaXRpb24uc291cmNlSXBzKFsnMC4wLjAuMC8wJ10pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGFjdGlvbjogZWxidjIuTGlzdGVuZXJBY3Rpb24ucmVkaXJlY3Qoe1xuICAgICAgICAgICAgICAgIGhvc3Q6IHNlcnZpY2VEb21haW4sXG4gICAgICAgICAgICAgICAgcGF0aDogJy8je3BhdGh9JyxcbiAgICAgICAgICAgICAgICBwZXJtYW5lbnQ6IHRydWUsXG4gICAgICAgICAgICAgICAgcG9ydDogJzQ0MycsXG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6ICdIVFRQUycsIC8vIGFsd2F5cyByZWRpcmVjdCB0byBIVFRQU1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiAnI3txdWVyeX0nXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqIENsb3VkV2F0Y2ggQWdlbnQgKHNpZGVjYXIgY29udGFpbmVyKSAqKi9cbiAgICAvLyBSRUYgOiBodHRwczovL3NlYXJjaGNvZGUuY29tL2ZpbGUvMzEyODExMDM0L3BhY2thZ2VzLyU0MGF3cy1jZGstY29udGFpbmVycy9lY3Mtc2VydmljZS1leHRlbnNpb25zL2xpYi9leHRlbnNpb25zL2Nsb3Vkd2F0Y2gtYWdlbnQudHMvXG4gICAgcHVibGljIHN0YXRpYyBjbG91ZFdhdGNoQWdlbnRTaWRlY2FyKHNlcnZpY2U6IGNkay5hd3NfZWNzX3BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRmFyZ2F0ZVNlcnZpY2UsIGlkOiBzdHJpbmcsIHByb3BzOiBjbG91ZFdhdGNoQWdlbnRTaWRlY2FyUHJvcHMpIDogdm9pZCB7XG4gICAgICAgIGNvbnN0IGN3U2lkZWNhclByb3BzID0ge1xuICAgICAgICAgICAgLi4uQ0xPVURXQVRDSF9BR0VOVF9QUk9QUyxcbiAgICAgICAgICAgIC4uLnByb3BzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBjd1Byb3BzOiBlY3MuQ29udGFpbmVyRGVmaW5pdGlvbk9wdGlvbnMgPSB7XG4gICAgICAgICAgICBjb250YWluZXJOYW1lOiBjd1NpZGVjYXJQcm9wcy5jb250YWluZXJOYW1lLFxuICAgICAgICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoJ3B1YmxpYy5lY3IuYXdzL2Nsb3Vkd2F0Y2gtYWdlbnQvY2xvdWR3YXRjaC1hZ2VudDpsYXRlc3QnKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgQ1dfQ09ORklHX0NPTlRFTlQ6ICd7XCJsb2dzXCI6e1wibWV0cmljc19jb2xsZWN0ZWRcIjp7XCJlbWZcIjp7fX19fSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcHU6IGN3U2lkZWNhclByb3BzLmNwdSxcbiAgICAgICAgICAgIG1lbW9yeUxpbWl0TWlCOiBjd1NpZGVjYXJQcm9wcy5tZW1vcnlMaW1pdE1pQixcbiAgICAgICAgICAgIHBvcnRNYXBwaW5nczogW3tcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogZWNzLlByb3RvY29sLlRDUCxcbiAgICAgICAgICAgICAgICBjb250YWluZXJQb3J0OiBjd1NpZGVjYXJQcm9wcy5jb250YWluZXJQb3J0IVxuICAgICAgICAgICAgfV0sXG4gICAgICAgIH07XG4gICAgICAgIGlmIChwcm9wcy5sb2dHcm91cCkge1xuICAgICAgICAgICAgY3dQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICAuLi5jd1Byb3BzLFxuICAgICAgICAgICAgICAgIGxvZ2dpbmc6IGVjcy5Mb2dEcml2ZXIuYXdzTG9ncyh7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbVByZWZpeDogYCR7aWR9LSR7cHJvcHMuY29udGFpbmVyTmFtZX0tbG9nc2AsXG4gICAgICAgICAgICAgICAgICAgIGxvZ0dyb3VwOiBwcm9wcy5sb2dHcm91cCxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZXJ2aWNlLnRhc2tEZWZpbml0aW9uLmFkZENvbnRhaW5lcihgJHtpZH1DbG91ZFdhdGNoU2lkZWNhcmAsIGN3UHJvcHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgY3dBZ2VudEVuZHBvaW50KHByb3BzOiBjbG91ZFdhdGNoQWdlbnRTaWRlY2FyUHJvcHMpIHtcbiAgICAgICAgY29uc3QgY3dTaWRlY2FyUHJvcHMgPSB7XG4gICAgICAgICAgICAuLi5DTE9VRFdBVENIX0FHRU5UX1BST1BTLFxuICAgICAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBgdGNwOi8vJHtjd1NpZGVjYXJQcm9wcy5jb250YWluZXJOYW1lfToke2N3U2lkZWNhclByb3BzLmNvbnRhaW5lclBvcnR9YDtcbiAgICB9XG59XG4iXX0=