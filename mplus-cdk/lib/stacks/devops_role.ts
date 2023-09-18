import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import {T3Stack, T3StackProps} from "../stack";

export interface DevOpsPipelineDeployRoleStackProps extends T3StackProps {
    deployUser: string
}

export class DevOpsPipelineDeployRoleStack extends T3Stack {
    constructor(scope: cdk.App, props: DevOpsPipelineDeployRoleStackProps) {
        super(scope, props);

        const deployUser = props.deployUser;

        // Create the user
        const user = new iam.User(this, 'DeployUser', {
            userName: deployUser,
        });

        // Add roles
        const assumedUser = new iam.ArnPrincipal(user.userArn);

        const sidPrefix = this.stackName.replace(/[^a-z0-9]/gi, '');

        // 👇 Create a Policy Document -- Collection of Policy Statements (max 5)
        const policyDocument = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    sid: `${sidPrefix}ServiceRole`,
                    resources: ['*'],
                    actions: [
                        "iam:PassRole",
                    ]
                }),

                /**
                 * Gitlab Mirror -> Aws:codeCommit
                 */
                new iam.PolicyStatement({
                    sid: `${sidPrefix}Mirror`,
                    resources: ['*'],
                    actions: [
                        "codecommit:*",
                    ]
                }),

                /**
                 * codePipeline deploy/execution access
                 */
                new iam.PolicyStatement({
                    sid: `${sidPrefix}CodePipeline`,
                    resources: ['*'],
                    actions: [
                        "codeartifact:*",
                        "codebuild:*",
                        "codepipeline:*",
                        "kms:*",
                        "secretsmanager:*",
                        "sts:*",
                        "ssm:*",
                    ]
                }),

                // /**
                //  * Legacy CI
                //  */
                // new iam.PolicyStatement({
                //     sid: `${sidPrefix}Ci`,
                //     resources: ['*'],
                //     actions: [
                //         "cloudformation:*",
                //         "ecr:*",
                //         "secretsmanager:*",
                //     ]
                // })
            ],
        });

        // Add statement to allow assumerole action for this account
        const assumeStatement = new iam.PolicyStatement({
            resources: ['arn:aws:iam::*:user/*'],
            actions: ['sts:AssumeRole']
        });

        // 👇 Create role, to which we'll attach our Policies
        const role_inline = new iam.Role(this, `${sidPrefix}-inlineRole`, {
            assumedBy: assumedUser,
            roleName: `${deployUser}-cross-account-access`,
            description: 'IAM role for inline policies',
            inlinePolicies: {
                // 👇 attach the Policy Document as inline policies
                CrossAccountInlinePolicies: policyDocument,
            },
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRoute53FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("IAMFullAccess"),
                // iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElastiCacheFullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
                // iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSFullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCertificateManagerFullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCodePipeline_FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("CloudFrontFullAccess")
            ]
        });
        role_inline.addToPrincipalPolicy(assumeStatement);

        new iam.Policy(this, `${this.stackName}-Policy`, {
            document: policyDocument,
            // roles: [role_inline, role_managed_1, role_managed_2],
            roles: [role_inline],
            // groups: [group],
            users: [
                    iam.User.fromUserName(this, `${this.stackName}-DeployUser`, deployUser),
            ],
        });
    }
}
