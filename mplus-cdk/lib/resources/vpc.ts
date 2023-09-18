import {
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
} from "aws-cdk-lib";
import {Construct} from "constructs";
import {addNaclRules} from "./nacl";

interface VpcInitProps {
    readonly natGatewayEip?: string
}

export function vpcInit(stack: Construct, props: VpcInitProps): ec2.Vpc {
    // A Virtual Private Cloud runs everything in a private context. The
    // instances inside it can talk to each other via the private subnet, but
    // to connect to the open Internet, a gateway and security groups are needed.
    const constructId = 'Vpc';

    let vpcProps: ec2.VpcProps = {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        natGateways: 1,
        maxAzs: 3,
        subnetConfiguration: [
            {
                name: `${constructId}Public`,
                subnetType: ec2.SubnetType.PUBLIC,
            },
            {
                name: `${constructId}PrivateWithEgress`,
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            {
                name: `${constructId}PrivateIsolated`,
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
        ],
    };

    // Nat Gateway
    let natGatewayProvider: ec2.NatProvider;
    if (!props.natGatewayEip) {
        natGatewayProvider = ec2.NatProvider.gateway({eipAllocationIds: undefined})
    } else {
        natGatewayProvider = ec2.NatProvider.gateway({eipAllocationIds: [props.natGatewayEip]})
    }

    vpcProps = {
        ...vpcProps,
        natGatewayProvider: natGatewayProvider
    };
    return new ec2.Vpc(stack, constructId, vpcProps);
}

/**
 * Vpc Flow Logs
 */
interface flowLogsProps {
    readonly logGroup: logs.LogGroup
    readonly vpc: ec2.Vpc
}
export function flowLogs(stack: Construct, props: flowLogsProps) {
    // Setup IAM user for logs
    const flowRole = new iam.Role(stack, 'FlowLog', {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com')
    });

    // Setup VPC flow logs
    new ec2.CfnFlowLog(stack, 'FlowLogs', {
        resourceId: props.vpc.vpcId,
        resourceType: 'VPC',
        trafficType: 'ALL',
        deliverLogsPermissionArn: flowRole.roleArn,
        logDestinationType: 'cloud-watch-logs',
        logGroupName: props.logGroup.logGroupName
    });
}

/**
 * Builds VPC endpoints to access AWS services without using NAT Gateway.
 */
export function interfaceEndpoints(vpc: ec2.Vpc): void {
    // Allow ECS to pull Docker images without using NAT Gateway
    // https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html
    _addInterfaceEndpoint(vpc, "ECRDockerEndpoint", ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER);
    _addInterfaceEndpoint(vpc, "ECREndpoint", ec2.InterfaceVpcEndpointAwsService.ECR);
    _addInterfaceEndpoint(vpc, "ElastiCache", ec2.InterfaceVpcEndpointAwsService.ELASTICACHE);
    _addInterfaceEndpoint(vpc, "SecretManagerEndpoint", ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER);
    // _addInterfaceEndpoint(vpc, "CloudWatchEndpoint", ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH);
    // _addInterfaceEndpoint(vpc, "CloudWatchLogsEndpoint", ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS);
    // _addInterfaceEndpoint(vpc, "CloudWatchEventsEndpoint", ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_EVENTS);
    _addInterfaceEndpoint(vpc, "SSMEndpoint", ec2.InterfaceVpcEndpointAwsService.SSM);
}
function _addInterfaceEndpoint(vpc: ec2.Vpc, name: string, awsService: ec2.InterfaceVpcEndpointAwsService): void {
    const endpoint: ec2.InterfaceVpcEndpoint = vpc.addInterfaceEndpoint(`${name}`, {
        service: awsService
    });
    endpoint.connections.allowFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock), endpoint.connections.defaultPort!);
}

/** Nacl Rules **/
export function naclRules(stack: Construct, vpc: ec2.Vpc) {
    /** Nacl restrict Public subnet */
    const publicNacl = new ec2.NetworkAcl(stack, 'PublicNacl', {
        vpc: vpc,
        networkAclName: 'PublicNacl',
        subnetSelection: { subnetType: ec2.SubnetType.PUBLIC }
    });
    addNaclRules(publicNacl);

    /** Nacl restrict Private subnet */
    const privateNacl = new ec2.NetworkAcl(stack, 'PrivateNacl', {
        vpc: vpc,
        networkAclName: 'PrivateNacl',
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });
    addNaclRules(privateNacl);
}
