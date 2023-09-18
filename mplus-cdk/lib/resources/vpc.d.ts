import { aws_ec2 as ec2, aws_logs as logs } from "aws-cdk-lib";
import { Construct } from "constructs";
interface VpcInitProps {
    readonly natGatewayEip?: string;
}
export declare function vpcInit(stack: Construct, props: VpcInitProps): ec2.Vpc;
/**
 * Vpc Flow Logs
 */
interface flowLogsProps {
    readonly logGroup: logs.LogGroup;
    readonly vpc: ec2.Vpc;
}
export declare function flowLogs(stack: Construct, props: flowLogsProps): void;
/**
 * Builds VPC endpoints to access AWS services without using NAT Gateway.
 */
export declare function interfaceEndpoints(vpc: ec2.Vpc): void;
/** Nacl Rules **/
export declare function naclRules(stack: Construct, vpc: ec2.Vpc): void;
export {};
