import { CommonNetworkAclEntryOptions, NetworkAcl } from 'aws-cdk-lib/aws-ec2';
export interface NamedNetworkAclEntry extends CommonNetworkAclEntryOptions {
    name: string;
    comment: string;
}
export declare const inboundRules: NamedNetworkAclEntry[];
export declare const outboundRules: NamedNetworkAclEntry[];
export declare function addNaclRules(nacl: NetworkAcl): void;
