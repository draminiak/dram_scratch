import {Action, CommonNetworkAclEntryOptions, NetworkAcl, TrafficDirection} from 'aws-cdk-lib/aws-ec2';
import {aws_ec2 as ec2} from 'aws-cdk-lib';


export interface NamedNetworkAclEntry extends CommonNetworkAclEntryOptions {
    name: string
    comment:string
}

export const inboundRules: NamedNetworkAclEntry[] = [
    {
        name: "AllowHTTPipv4Ingress",
        ruleNumber: 100,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPort(80),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound HTTP traffic from any IPv4 address."
    },
    {
        name: "AllowHTTPipv6Ingress",
        ruleNumber: 105,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.tcpPort(80),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound HTTP traffic from any IPv6 address."
    },
    {
        name: "AllowHTTPSipv4Ingress",
        ruleNumber: 110,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPort(443),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound HTTPS traffic from any IPv4 address."
    },
    {
        name: "AllowHTTPSipv6Ingress",
        ruleNumber: 115,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.tcpPort(443),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound HTTPS traffic from any IPv6 address."
    },
    {
        name: "AllowSSHipv4Ingress",
        ruleNumber: 120,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPort(22),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound SSH traffic from any IPv4 address."
    },
    {
        name: "AllowCustomTCPipv4Ingress",
        ruleNumber: 140,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound return IPv4 traffic from the internet (that is, for requests that originate in the subnet)."
    },
    {
        name: "AllowCustomTCPipv6Ingress",
        ruleNumber: 145,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound return IPv4 traffic from the internet (that is, for requests that originate in the subnet)."
    },
    {
        name: "AllowUDPipv4Ingress",
        ruleNumber: 300,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.udpPort(53),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound return IPv4 traffic from udp"
    },
    {
        name: "AllowUDPipv6Ingress",
        ruleNumber: 400,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.udpPort(53),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound return IPv6 traffic from udp"
    },
    {
        name: "DenyAllTrafficipv4Ingress",
        ruleNumber: 500,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.DENY,
        comment: "Allows inbound return IPv4 traffic from the internet (that is, for requests that originate in the subnet)."
    },
    {
        name: "DenyAllTrafficipv6Ingress",
        ruleNumber: 505,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: TrafficDirection.INGRESS,
        ruleAction: Action.DENY,
        comment: "Allows inbound return IPv4 traffic from the internet (that is, for requests that originate in the subnet)."
    }
];

export const outboundRules:NamedNetworkAclEntry[] = [
    {
        name: "AllowHTTPipv4Egress",
        ruleNumber: 100,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPort(80),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound HTTP traffic from any IPv4 address."
    },
    {
        name: "AllowHTTPipv6Egress",
        ruleNumber: 105,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.tcpPort(80),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound HTTP traffic from any IPv6 address."
    },
    {
        name: "AllowHTTPSipv4Egress",
        ruleNumber: 110,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPort(443),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound HTTPS traffic from any IPv4 address."
    },
    {
        name: "AllowHTTPSipv6Egress",
        ruleNumber: 115,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.tcpPort(443),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound HTTPS traffic from any IPv6 address."
    },
    {
        name: "AllowSSHipv4Egress",
        ruleNumber: 120,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPort(22),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound SSH traffic from any IPv4 address."
    },
    {
        name: "AllowCustomTCPipv4Egress",
        ruleNumber: 140,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound return IPv4 traffic from the internet (that is, for requests that originate in the subnet)."
    },
    {
        name: "AllowCustomTCPipv6Egress",
        ruleNumber: 145,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows outbound return IPv6 traffic from the internet (that is, for requests that originate in the subnet)."
    },
    {
        name: "AllowUDPipv4Egress",
        ruleNumber: 300,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.udpPort(53),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound return IPv4 traffic from udp"
    },
    {
        name: "AllowUDPipv6Egress",
        ruleNumber: 400,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.udpPort(53),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.ALLOW,
        comment: "Allows inbound return IPv6 traffic from udp"
    },
    {
        name: "DenyAllTrafficipv4Egress",
        ruleNumber: 500,
        cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.DENY,
        comment: "Allows outbound return IPv4 traffic from the internet (that is, for requests that originate in the subnet)."
    },
    {
        name: "DenyAllTrafficipv6Egress",
        ruleNumber: 505,
        cidr: ec2.AclCidr.ipv6('::/0'),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: TrafficDirection.EGRESS,
        ruleAction: Action.DENY,
        comment: "Allows outbound return IPv6 traffic from the internet (that is, for requests that originate in the subnet)."
    }
];


export function addNaclRules(nacl: NetworkAcl): void {
    const rules = [...inboundRules, ...outboundRules];
    rules.forEach((rule)=>{
        nacl.addEntry(rule.name,{
            ruleNumber:rule.ruleNumber,
            ruleAction:rule.ruleAction,
            cidr:rule.cidr,
            traffic:rule.traffic,
            direction:rule.direction
        });
    })
}