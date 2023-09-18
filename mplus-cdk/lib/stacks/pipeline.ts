import * as cdk from "aws-cdk-lib";
import {
    aws_codebuild as codebuild,
    aws_codecommit as codecommit,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_iam as iam
} from "aws-cdk-lib";
import * as yaml from "js-yaml";
import * as fs from "fs";
import {T3Stack, T3StackProps} from "../stack";

/** Interfaces **/
export interface PipelineProps extends T3StackProps {
    readonly deployEnv: string
    readonly buildSpecFile: string  // "path/to/buildspec_file.yml"
    readonly codeCommitRepoName: string
    readonly environmentVars?: { [key: string]: string }
    readonly secretVars?: { [key: string]: string }
}

interface buildSpecJsonProps extends codebuild.BuildSpec {
    readonly version: string
    readonly env: {
        variables: {[key: string]: string},
        "secrets-manager": {[key: string]: string}
    }
}

/** Pipeline Class **/
export class Pipeline extends T3Stack {
    private readonly repository: codecommit.IRepository
    public readonly codePipeline: codepipeline.Pipeline
    codeBuildProject: codebuild.PipelineProject

    private readonly sourceOutput: codepipeline.Artifact
    private readonly buildOutput: codepipeline.Artifact

    constructor(scope: cdk.App, props: PipelineProps) {
        super(scope, props);
        this.codePipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            crossAccountKeys: false
            // restartExecutionOnUpdate: true
        });

        // CodeCommit repo
        const repoName = props.codeCommitRepoName;
        this.repository =  codecommit.Repository.fromRepositoryName(this, 'ImportedRepo', repoName);

        // CodeBuild Project
        this.codeBuildProject = this.createCodeBuildProject(props);

        // Pipeline Stages
        this.sourceOutput = new codepipeline.Artifact();
        this.buildOutput = new codepipeline.Artifact();
        if (props.buildSpecFile) {
            // Source Stage
            this.codePipeline.addStage({
                stageName: 'Source',
                actions: [this.getCodeCommitSourceAction(props.deployEnv)],
            });

            // Build Stage
            this.codePipeline.addStage({
                stageName: 'Build',
                actions: [this.getCodeBuildAction(this.getSourceOutput())]
            });

            // Deploy Stage
            if (0) {
                this.codePipeline.addStage({
                    stageName: 'Deploy',
                    actions: [this.getCodeCommitDeployAction(this.getBuildOutput())]
                });
            }
        }
    }

    /**
     * Source Stage
     */
    public getCodeCommitSourceAction = (deployBranch: string) : codepipeline_actions.CodeCommitSourceAction => {
        return new codepipeline_actions.CodeCommitSourceAction({
            actionName: 'Source',
            output: this.sourceOutput,
            repository: this.repository,
            branch: deployBranch,
            trigger: codepipeline_actions.CodeCommitTrigger.NONE,
            codeBuildCloneOutput: true
        });
    }
    public getSourceOutput = () : codepipeline.Artifact => {
        return this.sourceOutput;
    }

    /**
     * Build Stage
     */
    public getCodeBuildAction = (sourceOutput: codepipeline.Artifact): codepipeline_actions.CodeBuildAction => {
        return new codepipeline_actions.CodeBuildAction({
            actionName: 'CodeBuild',
            input: sourceOutput,
            project: this.codeBuildProject,
            outputs: [this.buildOutput]
        });
    }
    public getBuildOutput = () : codepipeline.Artifact => {
        return this.buildOutput;
    }
    private createCodeBuildProject = (props: PipelineProps): codebuild.PipelineProject => {
        // read BuildSpec into json var, so we can augment
        const buildSpecJson: {[key: string]: string} = Pipeline._yamlToJson(props);

        this.codeBuildProject = new codebuild.PipelineProject(this, 'PipelineProject', {
            projectName: 'PipelineProject',
            // buildSpec: codebuild.BuildSpec.fromSourceFilename(buildSpec),
            buildSpec: codebuild.BuildSpec.fromObject(buildSpecJson),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
                privileged: true,
            },
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
            timeout: cdk.Duration.hours(3)
        });

        // Add policy to allow fetching from secrets manager; must have individual access to ALL necessary secretsManager ARNs
        const secretArns: string[] = ['*'];
        // TODO : PipelineProps.secretsManagerNames should target specific secretsManager ARNs not all (i.e. ['*'] above)
        // let secretArns: string[] = [];
        // for (const secretName in this.props.secretsManagerNames) {
        //     const secret = secretsmanager.Secret.fromSecretNameV2(this, secretName, secretName);
        //     secretArns.push(secret.secretArn);
        // }

        this.codeBuildProject.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'secretsmanager:GetRandomPassword',
                    'secretsmanager:GetResourcePolicy',
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:ListSecretVersionIds',
                ],
                resources: secretArns,
            })
        );

        this.codeBuildProject.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'codecommit:GitPull',
                ],
                resources: [
                    'arn:aws:codecommit:*:*:' + this.repository
                ]
            })
        );
        return this.codeBuildProject;
    }

    /**
     * Deploy Stage
     */
    public getCodeCommitDeployAction = (buildOutput: codepipeline.Artifact) : codepipeline_actions.CodeCommitSourceAction => {
        return new codepipeline_actions.CodeCommitSourceAction({
            actionName: 'CodeDeploy',
            output: buildOutput,
            repository: this.repository
        });
    }

    private static _yamlToJson(props: PipelineProps) : {[key: string]: any} {
        let buildSpecJson = <buildSpecJsonProps>yaml.load(fs.readFileSync(props.buildSpecFile, {encoding: 'utf-8'}));
        if (buildSpecJson !== null && typeof buildSpecJson === 'object' && "env" in buildSpecJson) {
            if (typeof buildSpecJson['env'] === 'object' && "variables" in buildSpecJson.env) {
                buildSpecJson.env.variables.DEPLOY_ENV = props.deployEnv;

                if ('environmentVars' in props) {
                    buildSpecJson.env.variables = {
                        ...buildSpecJson.env.variables,
                        ...props.environmentVars
                    }
                }

                if ('secretVars' in props) {
                    buildSpecJson.env["secrets-manager"] = {
                        ...buildSpecJson.env["secrets-manager"],
                        ...props.secretVars
                    }
                }
            }
        }
        return buildSpecJson;
    }
}
