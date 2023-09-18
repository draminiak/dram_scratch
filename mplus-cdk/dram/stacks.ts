import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import {
//     aws_fsx as fsx,
// } from 'aws-cdk-lib';

import {DevOpsPipelineDeployRoleStack} from "../lib/stacks/devops_role";
import {InfraStack} from "../lib/stacks/infra";
// import {SecretManager} from "../lib/stacks/secrets";
import {EcrStack} from "../lib/resources/ecr";
import {RdsPostgresStack, rdsAccessProps} from "../lib/resources/rds_postgres";
import {RedisStack, redisAccessProps} from "../lib/resources/redis";
// import {SmtpSesLambdaStack} from "../lib/stacks/lambda/smtp_ses";
// import {SnsLambdaStack} from "../lib/stacks/lambda/sns";
// import {EcsLambdaStack} from "../lib/stacks/lambda/ecs";
import {EcsFargateStack} from "../lib/stacks/ecs_fargate";
// import {ScheduledTaskStack} from "../lib/stacks/scheduled_task";
import {Pipeline} from "../lib/stacks/pipeline";

/**
 * PREREQUISITES
 *
 * Create a domain & hosted zone in Route53
 * Create an SSL Cert in ACM
 */
const INFRA_CONFIG = {
    domainApex: 'devops-t3.com',
    hostedZoneId: 'Z053629622YSOU5ATJWJN',
    certificateArn: 'arn:aws:acm:us-east-2:138405549555:certificate/2d355315-0699-42f6-9168-353ce0dbfb51',
};

/**
 * Deploy codePipeline from gitlab-ci
 * Publish ecs stack using codePipeline
 */
const app = new cdk.App();

//////////////////////////////////////////////////////////////////////////////////////
// Config
const T3STACK_FROM_ENV = {
    account: process.env.AWS_ACCOUNT_ID!,
    region: process.env.AWS_REGION!,
    clientId: process.env.CLIENT_ID!,
    clientJobCode: process.env.CLIENT_JOB_CODE!,
    deployEnv: process.env.DEPLOY_ENV!,
};
console.log(T3STACK_FROM_ENV);
const deployUser = `${T3STACK_FROM_ENV.clientId}-${T3STACK_FROM_ENV.deployEnv}`;
const ecrRepoNames = ['api', 'web'];

// If existing kmsKey
const kmsKeyArnDefault = 'arn:aws:kms:us-east-2:138405549555:key/7de0db53-f962-4273-b31e-ce2e73df5c05';
// if existing Vpc
// const vpcId = undefined; //'vpc-04baffcf739f5d80e'; // us-east-2 vpc default vpcId=vpc-0b65606c for POC testing

// Pipeline
const pipelineBuildSpecFile = './codePipeline/buildspec.yml';
const pipelineCodeCommitRepoName = 'devops-poc/flask-restapi';

// Rds
const rdsExisting = {
    databaseName: 'dramtest',
    instanceIdentifier: 'dram-rds-local-manual',
    instanceEndpointAddress: 'dram-rds-local-manual.chte3owckzbd.us-east-2.rds.amazonaws.com',
    secretUsr: 'dramtest',
    secretPwd: '66%gUgeji>#Qzv0E?nX63J:#mXSW',
    port: 5432,
    clusterSecurityGroup: 'sg-068e0c3b03e1c7163'
};

// Redis
const redisAuthToken = 'token';
const redisCacheProtocol = 'rediss';

// Lambdas
// const lambdaSmtpSesRegion = T3STACK_FROM_ENV.region;
// const lambdaSmtpSesVerifiedIdentities = ['david.raminiak@materialplus.io'];
// const lambdaAllowedTopicArns = [''];

// Applications
const ecsFargateTestApiEcrRepoName = 'chentex/go-rest-api';
const ecsFargateTestApiEcrImageTag = 'latest';
const ecsFargateTestApiContainerPort = 8080;
const ecsFargateTestApiIsEcr = false;
const ecsFargateTestApiHealthCheck = '/test';

const ecsFargateTestApiFacadeEcrRepoName = 'chentex/go-rest-api';
const ecsFargateTestApiFacadeEcrImageTag = 'latest';
const ecsFargateTestApiFacadeContainerPort = 8080;
const ecsFargateTestApiFacadeIsEcr = false;
const ecsFargateTestApiFacadeHealthCheck = '/test';

// const ecsFargateScheduledTaskEcrRepoName = 'chentex/go-rest-api';
// const ecsFargateScheduledTaskEcrImageTag = 'latest';
// const ecsFargateScheduledTaskContainerPort = 8080;
// const ecsFargateScheduledTaskIsEcr = false;

const ecsFargateTestWebEcrRepoName = 'tutum/hello-world';
const ecsFargateTestWebEcrImageTag = 'latest';
const ecsFargateTestWebContainerPort = 80;
const ecsFargateTestWebIsEcr = false;


//////////////////////////////////////////////////////////////////////////////////////

/** Ecr **/
// If no kmsKeyArn is passed, one will be created... but will NOT be deleted on stack destroy (requires manual deletion)
new EcrStack(app, {
    service: 'ecr',
    ...T3STACK_FROM_ENV,
    // Resource options
    kmsKeyArn: kmsKeyArnDefault,
    repoNames: ecrRepoNames,
});

/** User Policy to allow cdk resource deploy **/
new DevOpsPipelineDeployRoleStack(app,{
    service: 'deployUserPolicy',
    ...T3STACK_FROM_ENV,
    // Resource options
    deployUser: deployUser,
});

/** Secrets Manager **/
// const secrets = new SecretManager(app,{
//     service: 'secretsManagerAccess',
//     ...T3STACK_FROM_ENV,
// });

/** CodePipeline **/
new Pipeline(app, {
    service: 'codePipeline-deploy',
    ...T3STACK_FROM_ENV,
    // Resource options
    buildSpecFile: pipelineBuildSpecFile,
    codeCommitRepoName: pipelineCodeCommitRepoName,
    environmentVars: {
        DEPLOY_ENV: T3STACK_FROM_ENV.deployEnv
    },
    // secretVars: {},
});


//////////////////////////////////////////////////////////////////////////////////////
// Infra

/** Infra : vpc **/
const infraStack = new InfraStack(app,{
    service: 'infra',
    ...T3STACK_FROM_ENV,
    // Resource options
    // natGatewayEip: 'TBD'
});
// Rds Security Group
infraStack.createSecurityGroup(infraStack.vpc, 'rds');
const rdsServiceName = 'rds-existing';
infraStack.createSecurityGroup(infraStack.vpc, rdsServiceName + '2');
infraStack.createSecurityGroup(infraStack.vpc, rdsServiceName + '3');
// Redis Security Group
const redisServiceName = 'redis';
infraStack.createSecurityGroup(infraStack.vpc, redisServiceName);


/**
 * RDS
 *
 * NOTE : Deleting the "rdsStack" stack will fail
 *  - first remove any stack dependencies (i.e. api stack calls the RDS DB)
 *  - delete the stack using Cfn will ask to retain the SecurityGroup
 *  - if you delete the RDS instance, then you can delete the SG; otherwise it remains attached to the DB interface
 **/
const rdsStack = new RdsPostgresStack(app, {
    service: 'rds',
    vpc: infraStack.vpc,
    ...T3STACK_FROM_ENV,
    databaseName: 'dramtest',
    kmsKeyArn: kmsKeyArnDefault,
});
const rdsSecurityGroupAccessProps = rdsAccessProps(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, rdsStack.service);
console.log(rdsSecurityGroupAccessProps.securityGroupId);

const rdsStack2 = new RdsPostgresStack(app, {
    service: rdsServiceName + '2',
    vpc: infraStack.vpc,
    ...T3STACK_FROM_ENV,
    existingDbConfig: rdsExisting,
    kmsKeyArn: kmsKeyArnDefault,
});
const rdsSecurityGroupAccessProps2 = rdsAccessProps(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, rdsStack2.service);

const rdsStack3 = new RdsPostgresStack(app, {
    service: rdsServiceName + '3',
    vpc: infraStack.vpc,
    ...T3STACK_FROM_ENV,
    existingDbConfig: rdsExisting,
    kmsKeyArn: kmsKeyArnDefault,
});
const rdsSecurityGroupAccessProps3 = rdsAccessProps(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, rdsStack2.service);


//////////////////////////////////////////////////////////////////////////////////////

/** Redis **/
const redisStack = new RedisStack(app, {
    service: redisServiceName,
    vpc: infraStack.vpc,
    ...T3STACK_FROM_ENV,
    authToken: redisAuthToken,
    cacheNodeType: 'cache.t3.micro',
    numNodeGroups: 1,
    replicasPerNodeGroup: 2,
});
const redisSecurityGroupAccessProps = redisAccessProps(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, redisStack.service);


// //////////////////////////////////////////////////////////////////////////////////////
// // Lambdas
//
// /** Lambda - Ses **/
// new SmtpSesLambdaStack(app,{
//     service: 'lambda-smtp-ses',
//     vpc: infraStack.vpc,
//     ...T3STACK_FROM_ENV,
//     // runtime: lambda.Runtime.PYTHON_3_9,
//     // code: lambda.Code.fromAsset(path.join(__dirname, 'lib/stacks/lambda/smtp_ses')),
//     // timeout: cdk.Duration.seconds(30)
//     sesRegion: lambdaSmtpSesRegion,
//     verifiedIdentities: lambdaSmtpSesVerifiedIdentities,
// });
//
// /** Lambda - Sns **/
// new SnsLambdaStack(app, {
//     service: 'lambda-sns',
//     vpc: infraStack.vpc,
//     ...T3STACK_FROM_ENV,
//     // runtime: lambda.Runtime.PYTHON_3_9,
//     // code: lambda.Code.fromAsset(path.join(__dirname, 'lib/stacks/lambda/sns')),
//     // timeout: cdk.Duration.seconds(30)
//     allowedTopicArns: lambdaAllowedTopicArns,
// });
//
// /** Lambda - Ecs **/
// new EcsLambdaStack(app, {
//     service: 'lambda-ecs-test',
//     vpc: infraStack.vpc,
//     ...T3STACK_FROM_ENV,
//     // runtime: lambda.Runtime.PYTHON_3_9,
//     // code: lambda.Code.fromAsset(path.join(__dirname, 'lib/stacks/lambda/ecs')),
//     // timeout: cdk.Duration.seconds(30)
// });


//////////////////////////////////////////////////////////////////////////////////////
// Ecs Applications

/** Ecs Fargate - Api **/
const apiInternalServiceName = 'api-internal';
new EcsFargateStack(app,{
    service: apiInternalServiceName,
    vpc: infraStack.vpc,
    logGroup: infraStack.logGroup,
    ...T3STACK_FROM_ENV,
    ...INFRA_CONFIG,
    // scalingConfig: {},
    // albVanityDomain: ecsFargateTestApiVanityDomain,
    repoName: ecsFargateTestApiEcrRepoName,
    imageTag: ecsFargateTestApiEcrImageTag,
    containerPort: ecsFargateTestApiContainerPort,
    isEcr: ecsFargateTestApiIsEcr,
    healthCheckEndpoint: ecsFargateTestApiHealthCheck,
    internetFacing: false,
    // targetSecurityGroupAccessProps: [
    //     rdsSecurityGroupAccessProps,
    //     rdsSecurityGroupAccessProps2,
    //     rdsSecurityGroupAccessProps3,
    //     redisSecurityGroupAccessProps,
    // ],
    // serviceEnv: {
    //     // POSTGRES_HOST: rdsStack.database.instanceEndpoint.hostname,
    //     // POSTGRES_PORT: rdsStack.database.instanceEndpoint.port.toString(),
    //     // POSTGRES_NAME: rdsStack.databaseName,
    //     POSTGRES_HOST_2: rdsStack2.database.instanceEndpoint.hostname,
    //     POSTGRES_PORT_2: rdsStack2.database.instanceEndpoint.port.toString(),
    //     POSTGRES_NAME_2: rdsStack2.databaseName,
    //     REDIS_AUTH_TOKEN: redisAuthToken,
    //     REDIS_PROTOCOL: redisCacheProtocol,
    //     REDIS_ENDPOINT: redisStack.replicationGroup.attrConfigurationEndPointAddress,
    // },
    // serviceSecrets: {
    //     // POSTGRES_USER: rdsStack.dbUsername(),
    //     // POSTGRES_PASSWORD: rdsStack.dbPassword(),
    //     POSTGRES_USER_2: rdsStack2.dbUsername(),
    //     POSTGRES_PASSWORD_2: rdsStack2.dbPassword(),
    // },
});

/** Ecs Fargate - Api Facade **/
const apiFacadeServiceName = 'api-facade';
new EcsFargateStack(app,{
    service: apiFacadeServiceName,
    vpc: infraStack.vpc,
    logGroup: infraStack.logGroup,
    ...T3STACK_FROM_ENV,
    ...INFRA_CONFIG,
    // scalingConfig: {},
    // albVanityDomain: ecsFargateTestApiFacadeVanityDomain,
    // accessSecurityGroups: [],
    repoName: ecsFargateTestApiFacadeEcrRepoName,
    imageTag: ecsFargateTestApiFacadeEcrImageTag,
    containerPort: ecsFargateTestApiFacadeContainerPort,
    isEcr: ecsFargateTestApiFacadeIsEcr,
    healthCheckEndpoint: ecsFargateTestApiFacadeHealthCheck,

    targetSecurityGroupAccessProps: [
        // rdsSecurityGroupAccessProps,
        rdsSecurityGroupAccessProps2,
        rdsSecurityGroupAccessProps3,
        redisSecurityGroupAccessProps,
    ],
    serviceEnv: {
        POSTGRES_HOST_2: rdsStack2.database.instanceEndpoint.hostname,
        POSTGRES_PORT_2: rdsStack2.database.instanceEndpoint.port.toString(),
        POSTGRES_NAME_2: rdsStack2.databaseName,
        POSTGRES_HOST_3: rdsStack3.database.instanceEndpoint.hostname,
        POSTGRES_PORT_3: rdsStack3.database.instanceEndpoint.port.toString(),
        POSTGRES_NAME_3: rdsStack3.databaseName,

        POSTGRES_USER_2: rdsStack2.credentials!.username,
        POSTGRES_PASSWORD_2: rdsStack2.credentials!.password,
        POSTGRES_USER_3: rdsStack3.credentials!.username,
        POSTGRES_PASSWORD_3: rdsStack3.credentials!.password,

        REDIS_AUTH_TOKEN: redisAuthToken,
        REDIS_PROTOCOL: redisCacheProtocol,
        REDIS_ENDPOINT: redisStack.replicationGroup.attrConfigurationEndPointAddress,
    },
    // serviceSecrets: {
    //     POSTGRES_USER_2: rdsStack2.dbUsername(),
    //     POSTGRES_PASSWORD_2: rdsStack2.dbPassword(),
    //     POSTGRES_USER_3: rdsStack3.dbUsername(),
    //     POSTGRES_PASSWORD_3: rdsStack3.dbPassword(),
    // },
});

/** Ecs Fargate - Web **/
const webServiceName = 'web';
new EcsFargateStack(app,{
    service: webServiceName,
    vpc: infraStack.vpc,
    logGroup: infraStack.logGroup,
    ...T3STACK_FROM_ENV,
    ...INFRA_CONFIG,
    // Resource options
    // scalingConfig: {},
    // albVanityDomain: ecsFargateTestWebVanityDomain,
    // accessSecurityGroups: [],
    repoName: ecsFargateTestWebEcrRepoName,
    imageTag: ecsFargateTestWebEcrImageTag,
    containerPort: ecsFargateTestWebContainerPort,
    isEcr: ecsFargateTestWebIsEcr,
});


// //////////////////////////////////////////////////////////////////////////////////////
// // Scheduled Tasks
//
// /** Ecs Fargate - Scheduled Tasks - Dealers **/
// new ScheduledTaskStack(app, {
//     service: 'cron-dealer',
//     vpc: infraStack.vpc,
//     logGroup: infraStack.logGroup,
//     // scalingConfig: {},
//     ...T3STACK_FROM_ENV,
//     repoName: ecsFargateScheduledTaskEcrRepoName,
//     imageTag: ecsFargateScheduledTaskEcrImageTag,
//     containerPort: ecsFargateScheduledTaskContainerPort,
//     isEcr: ecsFargateScheduledTaskIsEcr,
//     scheduleHour: 1,
//     scheduleMin: 0,
//     accessSecurityGroups: [
//         rdsSecurityGroupFromExport(T3STACK_FROM_ENV.deployEnv),
//     ],
//     serviceEnv: rdsStack.dbConfig(),
//     serviceSecrets: rdsStack.dbSecrets(),
// });
//
// /** Ecs Fargate - Scheduled Tasks - Sku **/
// new ScheduledTaskStack(app, {
//     service: 'cron-sku',
//     vpc: infraStack.vpc,
//     logGroup: infraStack.logGroup,
//     // scalingConfig: {},
//     ...T3STACK_FROM_ENV,
//     repoName: ecsFargateScheduledTaskEcrRepoName,
//     imageTag: ecsFargateScheduledTaskEcrImageTag,
//     containerPort: ecsFargateScheduledTaskContainerPort,
//     isEcr: ecsFargateScheduledTaskIsEcr,
//     scheduleHour: 2,
//     scheduleMin: 0,
//     accessSecurityGroups: [
//         rdsSecurityGroupFromExport(T3STACK_FROM_ENV.deployEnv),
//     ],
//     serviceEnv: rdsStack.dbConfig(),
//     serviceSecrets: rdsStack.dbSecrets(),
// });
//
// /** Ecs Fargate - Scheduled Tasks - Fitment **/
// new ScheduledTaskStack(app, {
//     service: 'cron-fitment',
//     vpc: infraStack.vpc,
//     logGroup: infraStack.logGroup,
//     // scalingConfig: {},
//     ...T3STACK_FROM_ENV,
//     repoName: ecsFargateScheduledTaskEcrRepoName,
//     imageTag: ecsFargateScheduledTaskEcrImageTag,
//     containerPort: ecsFargateScheduledTaskContainerPort,
//     isEcr: ecsFargateScheduledTaskIsEcr,
//     scheduleHour: 3,
//     scheduleMin: 0,
//     accessSecurityGroups: [
//         rdsSecurityGroupFromExport(T3STACK_FROM_ENV.deployEnv),
//     ],
//     serviceEnv: rdsStack.dbConfig(),
//     serviceSecrets: rdsStack.dbSecrets(),
// });
//
// /** Ecs Fargate - Scheduled Tasks - Token Flush **/
// new ScheduledTaskStack(app, {
//     service: 'cron-token-flush',
//     vpc: infraStack.vpc,
//     logGroup: infraStack.logGroup,
//     // scalingConfig: {},
//     ...T3STACK_FROM_ENV,
//     repoName: ecsFargateScheduledTaskEcrRepoName,
//     imageTag: ecsFargateScheduledTaskEcrImageTag,
//     containerPort: ecsFargateScheduledTaskContainerPort,
//     isEcr: ecsFargateScheduledTaskIsEcr,
//     scheduleWeekday: fsx.Weekday.MONDAY,
//     scheduleHour: 4,
//     scheduleMin: 0,
//     accessSecurityGroups: [
//         rdsSecurityGroupFromExport(T3STACK_FROM_ENV.deployEnv),
//     ],
//     serviceEnv: rdsStack.dbConfig(),
//     serviceSecrets: rdsStack.dbSecrets(),
// });
