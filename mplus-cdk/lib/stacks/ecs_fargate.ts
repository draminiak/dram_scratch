import * as cdk from 'aws-cdk-lib';
import {
    aws_certificatemanager as cert,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_logs as logs,
    aws_route53 as rt53, aws_ssm as ssm
} from 'aws-cdk-lib';
import {
    AccessSecurityGroup,
    applySecurityGroupRulesToSource,
    T3Stack,
    T3StackProps,
    SourceSecurityGroup
} from "../stack";
import {
    AUTOSCALING_DEFAULTS, autoScalingProps,
    ECS_SCALING_DEFAULTS, ecsScalingProps,
    EcsFargateConfig
} from "../resources/ecs_fargate";

/** Interfaces **/
export interface EcsFargateStackProps extends T3StackProps {
    readonly vpc: ec2.Vpc
    readonly logGroup: logs.LogGroup
    readonly domainApex?: string
    readonly albVanityDomain?: string
    readonly hostedZoneId?: string
    readonly certificateArn?: string
    readonly repoName: string;
    readonly imageTag: string;
    readonly internetFacing?: boolean
    readonly isEcr?: boolean
    readonly healthCheckEndpoint?: string
    // readonly securityGroup: ec2.SecurityGroup
    readonly targetSecurityGroupAccessProps?: AccessSecurityGroup[]
    scalingConfig?: ECS_FARGATE_SCALING_DEFAULTS_PROPS
    containerPort?: number
    serviceEnv?: { [key: string]: string }
    serviceSecrets?: { [key: string]: ecs.Secret }
    enableCloudWatchAgent?: boolean
}

/** Default Config **/
export interface ECS_FARGATE_SCALING_DEFAULTS_PROPS extends ecsScalingProps, autoScalingProps {}

export abstract class EcsFargateAbstract extends T3Stack {
    readonly containerImage: ecs.ContainerImage
    readonly logDriver: ecs.LogDriver
    readonly taskCluster: ecs.Cluster

    protected constructor(scope: cdk.App, props: EcsFargateStackProps) {
        super(scope, props);
        props.containerPort = props.containerPort || 8080;
        props.enableCloudWatchAgent = props.enableCloudWatchAgent || false;
        props.serviceEnv = props.serviceEnv || {};
        props.scalingConfig = {
            ...ECS_SCALING_DEFAULTS,
            ...AUTOSCALING_DEFAULTS,
            ...props.scalingConfig
        }

        /** Log Driver **/
        this.logDriver = EcsFargateConfig.logDriver(this, props.logGroup);

        /** Security Group **/
        // this.securityGroup = props.securityGroup;

        /** Container Image **/
        this.containerImage = EcsFargateConfig.fetchContainerImage(this, props.repoName, props.imageTag, props.isEcr);

        /** Task Cluster **/
        this.taskCluster = EcsFargateConfig.taskCluster(this, props.vpc);
    }
}

/** Class EcsFargateStack **/
export class EcsFargateStack extends EcsFargateAbstract {
    declare fargateService: ecs_patterns.ApplicationLoadBalancedFargateService

    constructor(scope: cdk.App, props: EcsFargateStackProps) {
        super(scope, props);
        this._initStack(props);
    }

    private _initStack(props: EcsFargateStackProps): void {
        /** Access Roles **/
        const executionRole: iam.Role = EcsFargateConfig.createEcsExecutionRole(this, `${this.deployEnv}-${this.service}`);
        const taskRole: iam.Role = EcsFargateConfig.createEcsTaskRole(this, `${this.deployEnv}-${this.service}`);

        /** Load Balancer **/
        // Need to get immutable version because otherwise the ApplicationLoadBalancedFargateService
        // would create 0.0.0.0/0 rule for inbound traffic
        // REF : https://github.com/aws/aws-cdk/issues/3177
        // const sgImmutableCore = ec2.SecurityGroup.fromSecurityGroupId(this, `AlbSecurityGroupImmutable`,
        //     this.securityGroup.securityGroupId,
        //     // { mutable: false }
        // );
        const alb = new elbv2.ApplicationLoadBalancer(this, `LoadBalancer`, {
            vpc: props.vpc,
            internetFacing: 'internetFacing' in props ? props.internetFacing : true,
            // securityGroup: sgImmutableCore
        });

        let rt53props = {};
        if (props.domainApex) {
            const serviceDomain = [props.service, props.domainApex].filter(Boolean).join('.').toLowerCase();
            rt53props = {
                domainName: serviceDomain,
                domainZone: rt53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
                    zoneName: serviceDomain,
                    hostedZoneId: props.hostedZoneId!
                }),
                certificate: cert.Certificate.fromCertificateArn(this, 'Cert',
                    props.certificateArn!
                ),
            };
        }

        this.fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'FargateService',{
            ...rt53props,
            redirectHTTP: true,
            loadBalancer: alb,

            taskSubnets: props.vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            }),

            /////////////////////////////////////////
            // need this for ECR to be accessible
            // TODO: use endpoints for private subnets?
            // https://stackoverflow.com/questions/61265108/aws-ecs-fargate-resourceinitializationerror-unable-to-pull-secrets-or-registry
            assignPublicIp: true,
            publicLoadBalancer: true,
            // securityGroups: [this.securityGroup],
            //////////////////////////////////////////

            // TODO : https://blog.cloudglance.dev/deep-dive-on-ecs-desired-count-and-circuit-breaker-rollback/index.html
            desiredCount: props.scalingConfig!.taskCount,

            capacityProviderStrategies: [{
                capacityProvider: 'FARGATE',
                base: props.scalingConfig!.minCapacity,
                weight: props.scalingConfig!.maxCapacity,
            }],
            memoryLimitMiB: props.scalingConfig!.memoryLimitMiB,
            cpu: props.scalingConfig!.cpu,

            cluster: this.taskCluster,
            enableExecuteCommand: true,
            taskImageOptions: {
                containerPort: props.containerPort,
                executionRole: executionRole,
                taskRole: taskRole,
                // This will build a docker image from the specified folder
                // during deploy and upload it to ECR. Ensure that ECR is
                // reachable by instances in the VPC, i.e. from private subnets!
                image: this.containerImage,
                logDriver: this.logDriver,
                environment: {
                    AWS_EMF_AGENT_ENDPOINT: EcsFargateConfig.cwAgentEndpoint(props),
                    ...props.serviceEnv,
                },
                secrets: props.serviceSecrets
            },
        });

        this.fargateService.taskDefinition.executionRole?.addToPrincipalPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                    'secretsmanager:GetSecretValue',
                ]
            })
        );

        EcsFargateConfig.targetGroupConfig(this.fargateService, {
            healthCheckEndpoint: props.healthCheckEndpoint || '/healthcheck'
        });

        /** Ability for the container to connect to other accessible security groups */
        const sourceSecurityGroup: SourceSecurityGroup = { service: this.service, securityGroupId: cdk.Fn.select(0,
            this.fargateService.loadBalancer.loadBalancerSecurityGroups
        )};
        applySecurityGroupRulesToSource(this, props.targetSecurityGroupAccessProps, sourceSecurityGroup);

        // Listener Redirect Rules
        if (props.albVanityDomain) {
            EcsFargateConfig.listenerRedirects(this, this.service, this.fargateService, props.albVanityDomain);
        }

        // Auto-scaling
        EcsFargateConfig.autoScaling(this.fargateService, this.service, props.scalingConfig);

        // Cloudwatch Agent (sidecar container)
        if (props.enableCloudWatchAgent) {
            EcsFargateConfig.cloudWatchAgentSidecar(this.fargateService, this.service, {
                logGroup: props.logGroup
            });
        }

        this.setSsm();
    }

    setSsm() {
        // Ecs Cluster Name
        new ssm.StringParameter(this, 'ClusterName', {
            parameterName: `/${this.service}-${this.deployEnv}/ClusterName`,
            stringValue: this.fargateService.cluster.clusterName
        })

        // Ecs Service Name
        new ssm.StringParameter(this, 'ServiceName', {
            parameterName: `/${this.service}-${this.deployEnv}/ServiceName`,
            stringValue: this.fargateService.service.serviceName
        })
    }

    // setOutputs() {
    //     // Ecs Cluster Name
    //     const outputClusterName = `ClusterName-${this.service}-${this.deployEnv}`;
    //     new cdk.CfnOutput(this, outputClusterName, {
    //         value: this.fargateService.cluster.clusterName,
    //         exportName: outputClusterName,
    //     });
    //
    //     // Ecs Service Name
    //     const outputServiceName = `ServiceName-${this.service}-${this.deployEnv}`;
    //     new cdk.CfnOutput(this, outputServiceName, {
    //         value: this.fargateService.service.serviceName,
    //         exportName: outputServiceName,
    //     });
    // }
}
