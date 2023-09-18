import * as cdk from 'aws-cdk-lib';
import {
    aws_ecr as ecr,
    aws_kms as kms,
    RemovalPolicy
} from 'aws-cdk-lib';
import {T3Stack, T3StackProps} from "../stack";

interface EcrStackProps extends T3StackProps {
    readonly kmsKeyArn?: string
    readonly repoNames: string[]
}

export class EcrStack extends T3Stack {
    declare repos: { [key: string]: ecr.Repository }

    constructor(scope: cdk.App, props: EcrStackProps) {
        super(scope, props);
        this.repos = {};
        const kmsKey = this.kmsKey(props.kmsKeyArn);
        for(let repoName of props.repoNames) {
            repoName = [this.clientId, this.deployEnv, repoName].filter(Boolean).join('-').toLowerCase();
            this.repos[repoName] = this.createRepo(repoName, kmsKey);
        }
    }

    createRepo(repoName: string, kmsKey: kms.IKey): ecr.Repository {
        return new ecr.Repository(this, `EcrRepo${repoName}`, {
            repositoryName: repoName,
            removalPolicy: RemovalPolicy.RETAIN,
            encryptionKey: kmsKey,
            imageScanOnPush: true,
            lifecycleRules: [
                {
                    rulePriority: 1,
                    description: "Delete untagged images",
                    tagStatus: ecr.TagStatus.UNTAGGED,
                    maxImageCount: 1,
                },
                {
                    rulePriority: 2,
                    description: "Keep only last 25 tagged images",
                    tagStatus: ecr.TagStatus.TAGGED,
                    tagPrefixList: ['v'],
                    maxImageCount: 25,
                },
            ]
        });
    }
}
