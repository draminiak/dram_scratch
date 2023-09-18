import * as cdk from 'aws-cdk-lib';
import { aws_ecr as ecr, aws_kms as kms } from 'aws-cdk-lib';
import { T3Stack, T3StackProps } from "../stack";
interface EcrStackProps extends T3StackProps {
    readonly kmsKeyArn?: string;
    readonly repoNames: string[];
}
export declare class EcrStack extends T3Stack {
    repos: {
        [key: string]: ecr.Repository;
    };
    constructor(scope: cdk.App, props: EcrStackProps);
    createRepo(repoName: string, kmsKey: kms.IKey): ecr.Repository;
}
export {};
