"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("aws-cdk-lib");
// import {
//     aws_fsx as fsx,
// } from 'aws-cdk-lib';
const devops_role_1 = require("../lib/stacks/devops_role");
const infra_1 = require("../lib/stacks/infra");
// import {SecretManager} from "../lib/stacks/secrets";
const ecr_1 = require("../lib/resources/ecr");
const rds_postgres_1 = require("../lib/resources/rds_postgres");
const redis_1 = require("../lib/resources/redis");
// import {SmtpSesLambdaStack} from "../lib/stacks/lambda/smtp_ses";
// import {SnsLambdaStack} from "../lib/stacks/lambda/sns";
// import {EcsLambdaStack} from "../lib/stacks/lambda/ecs";
const ecs_fargate_1 = require("../lib/stacks/ecs_fargate");
// import {ScheduledTaskStack} from "../lib/stacks/scheduled_task";
const pipeline_1 = require("../lib/stacks/pipeline");
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
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
    clientId: process.env.CLIENT_ID,
    clientJobCode: process.env.CLIENT_JOB_CODE,
    deployEnv: process.env.DEPLOY_ENV,
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
new ecr_1.EcrStack(app, Object.assign(Object.assign({ service: 'ecr' }, T3STACK_FROM_ENV), { repoNames: ecrRepoNames }));
/** User Policy to allow cdk resource deploy **/
new devops_role_1.DevOpsPipelineDeployRoleStack(app, Object.assign(Object.assign({ service: 'deployUserPolicy' }, T3STACK_FROM_ENV), { deployUser: deployUser }));
/** Secrets Manager **/
// const secrets = new SecretManager(app,{
//     service: 'secretsManagerAccess',
//     ...T3STACK_FROM_ENV,
// });
/** CodePipeline **/
new pipeline_1.Pipeline(app, Object.assign(Object.assign({ service: 'codePipeline-deploy' }, T3STACK_FROM_ENV), { buildSpecFile: pipelineBuildSpecFile, codeCommitRepoName: pipelineCodeCommitRepoName, 
    // TODO : override defaults?
    environmentVars: {
        DEPLOY_ENV: T3STACK_FROM_ENV.deployEnv
    } }));
//////////////////////////////////////////////////////////////////////////////////////
// Infra
/** Infra : vpc **/
const infraStack = new infra_1.InfraStack(app, Object.assign({ service: 'infra' }, T3STACK_FROM_ENV));
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
const rdsStack = new rds_postgres_1.RdsPostgresStack(app, Object.assign(Object.assign({ service: 'rds', vpc: infraStack.vpc }, T3STACK_FROM_ENV), { databaseName: 'dramtest', kmsKeyArn: kmsKeyArnDefault }));
const rdsSecurityGroupAccessProps = (0, rds_postgres_1.rdsAccessProps)(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, rdsStack.service);
console.log(rdsSecurityGroupAccessProps.securityGroupId);
const rdsStack2 = new rds_postgres_1.RdsPostgresStack(app, Object.assign(Object.assign({ service: rdsServiceName + '2', vpc: infraStack.vpc }, T3STACK_FROM_ENV), { existingDbConfig: rdsExisting, kmsKeyArn: kmsKeyArnDefault }));
const rdsSecurityGroupAccessProps2 = (0, rds_postgres_1.rdsAccessProps)(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, rdsStack2.service);
const rdsStack3 = new rds_postgres_1.RdsPostgresStack(app, Object.assign(Object.assign({ service: rdsServiceName + '3', vpc: infraStack.vpc }, T3STACK_FROM_ENV), { existingDbConfig: rdsExisting, kmsKeyArn: kmsKeyArnDefault }));
const rdsSecurityGroupAccessProps3 = (0, rds_postgres_1.rdsAccessProps)(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, rdsStack2.service);
//////////////////////////////////////////////////////////////////////////////////////
/** Redis **/
const redisStack = new redis_1.RedisStack(app, Object.assign(Object.assign({ service: redisServiceName, vpc: infraStack.vpc }, T3STACK_FROM_ENV), { authToken: redisAuthToken, cacheNodeType: 'cache.t3.micro', numNodeGroups: 1, replicasPerNodeGroup: 2 }));
const redisSecurityGroupAccessProps = (0, redis_1.redisAccessProps)(T3STACK_FROM_ENV.clientId, T3STACK_FROM_ENV.deployEnv, redisStack.service);
// //////////////////////////////////////////////////////////////////////////////////////
// // Lambdas
//
// /** Lambda - Ses **/
// new SmtpSesLambdaStack(app,{
//     service: 'lambda-smtp-ses',
//     vpc: infraStack.vpc,
//     ...T3STACK_FROM_ENV,
//     // TODO : override defaults?
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
//     // TODO : override defaults?
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
//     // TODO : override defaults?
//     // runtime: lambda.Runtime.PYTHON_3_9,
//     // code: lambda.Code.fromAsset(path.join(__dirname, 'lib/stacks/lambda/ecs')),
//     // timeout: cdk.Duration.seconds(30)
// });
//////////////////////////////////////////////////////////////////////////////////////
// Ecs Applications
/** Ecs Fargate - Api **/
const apiInternalServiceName = 'api-internal';
new ecs_fargate_1.EcsFargateStack(app, Object.assign(Object.assign(Object.assign({ service: apiInternalServiceName, vpc: infraStack.vpc, logGroup: infraStack.logGroup }, T3STACK_FROM_ENV), INFRA_CONFIG), { 
    // TODO : override defaults?
    // scalingConfig: {},
    // albVanityDomain: ecsFargateTestApiVanityDomain,
    repoName: ecsFargateTestApiEcrRepoName, imageTag: ecsFargateTestApiEcrImageTag, containerPort: ecsFargateTestApiContainerPort, isEcr: ecsFargateTestApiIsEcr, healthCheckEndpoint: ecsFargateTestApiHealthCheck, internetFacing: false }));
/** Ecs Fargate - Api Facade **/
const apiFacadeServiceName = 'api-facade';
new ecs_fargate_1.EcsFargateStack(app, Object.assign(Object.assign(Object.assign({ service: apiFacadeServiceName, vpc: infraStack.vpc, logGroup: infraStack.logGroup }, T3STACK_FROM_ENV), INFRA_CONFIG), { 
    // TODO : override defaults?
    // scalingConfig: {},
    // albVanityDomain: ecsFargateTestApiFacadeVanityDomain,
    // accessSecurityGroups: [],
    repoName: ecsFargateTestApiFacadeEcrRepoName, imageTag: ecsFargateTestApiFacadeEcrImageTag, containerPort: ecsFargateTestApiFacadeContainerPort, isEcr: ecsFargateTestApiFacadeIsEcr, healthCheckEndpoint: ecsFargateTestApiFacadeHealthCheck, targetSecurityGroupAccessProps: [
        // rdsSecurityGroupAccessProps,
        rdsSecurityGroupAccessProps2,
        rdsSecurityGroupAccessProps3,
        redisSecurityGroupAccessProps,
    ], serviceEnv: {
        POSTGRES_HOST_2: rdsStack2.database.instanceEndpoint.hostname,
        POSTGRES_PORT_2: rdsStack2.database.instanceEndpoint.port.toString(),
        POSTGRES_NAME_2: rdsStack2.databaseName,
        POSTGRES_HOST_3: rdsStack3.database.instanceEndpoint.hostname,
        POSTGRES_PORT_3: rdsStack3.database.instanceEndpoint.port.toString(),
        POSTGRES_NAME_3: rdsStack3.databaseName,
        POSTGRES_USER_2: rdsStack2.credentials.username,
        POSTGRES_PASSWORD_2: rdsStack2.credentials.password,
        POSTGRES_USER_3: rdsStack3.credentials.username,
        POSTGRES_PASSWORD_3: rdsStack3.credentials.password,
        REDIS_AUTH_TOKEN: redisAuthToken,
        REDIS_PROTOCOL: redisCacheProtocol,
        REDIS_ENDPOINT: redisStack.replicationGroup.attrConfigurationEndPointAddress,
    } }));
/** Ecs Fargate - Web **/
const webServiceName = 'web';
new ecs_fargate_1.EcsFargateStack(app, Object.assign(Object.assign(Object.assign({ service: webServiceName, vpc: infraStack.vpc, logGroup: infraStack.logGroup }, T3STACK_FROM_ENV), INFRA_CONFIG), { 
    // TODO : override defaults?
    // scalingConfig: {},
    // albVanityDomain: ecsFargateTestWebVanityDomain,
    // accessSecurityGroups: [],
    repoName: ecsFargateTestWebEcrRepoName, imageTag: ecsFargateTestWebEcrImageTag, containerPort: ecsFargateTestWebContainerPort, isEcr: ecsFargateTestWebIsEcr }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhY2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXFDO0FBQ3JDLG1DQUFtQztBQUNuQyxXQUFXO0FBQ1gsc0JBQXNCO0FBQ3RCLHdCQUF3QjtBQUV4QiwyREFBd0U7QUFDeEUsK0NBQStDO0FBQy9DLHVEQUF1RDtBQUN2RCw4Q0FBOEM7QUFDOUMsZ0VBQStFO0FBQy9FLGtEQUFvRTtBQUNwRSxvRUFBb0U7QUFDcEUsMkRBQTJEO0FBQzNELDJEQUEyRDtBQUMzRCwyREFBMEQ7QUFDMUQsbUVBQW1FO0FBQ25FLHFEQUFnRDtBQUVoRDs7Ozs7R0FLRztBQUNILE1BQU0sWUFBWSxHQUFHO0lBQ2pCLFVBQVUsRUFBRSxlQUFlO0lBQzNCLFlBQVksRUFBRSx1QkFBdUI7SUFDckMsY0FBYyxFQUFFLHFGQUFxRjtDQUN4RyxDQUFDO0FBRUY7OztHQUdHO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsc0ZBQXNGO0FBQ3RGLFNBQVM7QUFDVCxNQUFNLGdCQUFnQixHQUFHO0lBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWU7SUFDcEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVztJQUMvQixRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFVO0lBQ2hDLGFBQWEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWdCO0lBQzNDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVc7Q0FDckMsQ0FBQztBQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM5QixNQUFNLFVBQVUsR0FBRyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNoRixNQUFNLFlBQVksR0FBRyxDQUFDLEtBQUss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QTJCO0FBQzNCLHFDQUFxQztBQUNyQyw0QkFBNEI7QUFDNUIsMkJBQTJCO0FBQzNCLG9EQUFvRDtBQUNwRCxvREFBb0Q7QUFDcEQsMkRBQTJEO0FBQzNELDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsdUJBQXVCO0FBQ3ZCLHNCQUFzQjtBQUN0Qiw4QkFBOEI7QUFDOUIsa0VBQWtFO0FBQ2xFLFNBQVM7QUFDVCx1Q0FBdUM7QUFDdkMsNENBQTRDO0FBQzVDLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuLy8gaW1wb3J0IHtcbi8vICAgICBhd3NfZnN4IGFzIGZzeCxcbi8vIH0gZnJvbSAnYXdzLWNkay1saWInO1xuXG5pbXBvcnQge0Rldk9wc1BpcGVsaW5lRGVwbG95Um9sZVN0YWNrfSBmcm9tIFwiLi4vbGliL3N0YWNrcy9kZXZvcHNfcm9sZVwiO1xuaW1wb3J0IHtJbmZyYVN0YWNrfSBmcm9tIFwiLi4vbGliL3N0YWNrcy9pbmZyYVwiO1xuLy8gaW1wb3J0IHtTZWNyZXRNYW5hZ2VyfSBmcm9tIFwiLi4vbGliL3N0YWNrcy9zZWNyZXRzXCI7XG5pbXBvcnQge0VjclN0YWNrfSBmcm9tIFwiLi4vbGliL3Jlc291cmNlcy9lY3JcIjtcbmltcG9ydCB7UmRzUG9zdGdyZXNTdGFjaywgcmRzQWNjZXNzUHJvcHN9IGZyb20gXCIuLi9saWIvcmVzb3VyY2VzL3Jkc19wb3N0Z3Jlc1wiO1xuaW1wb3J0IHtSZWRpc1N0YWNrLCByZWRpc0FjY2Vzc1Byb3BzfSBmcm9tIFwiLi4vbGliL3Jlc291cmNlcy9yZWRpc1wiO1xuLy8gaW1wb3J0IHtTbXRwU2VzTGFtYmRhU3RhY2t9IGZyb20gXCIuLi9saWIvc3RhY2tzL2xhbWJkYS9zbXRwX3Nlc1wiO1xuLy8gaW1wb3J0IHtTbnNMYW1iZGFTdGFja30gZnJvbSBcIi4uL2xpYi9zdGFja3MvbGFtYmRhL3Nuc1wiO1xuLy8gaW1wb3J0IHtFY3NMYW1iZGFTdGFja30gZnJvbSBcIi4uL2xpYi9zdGFja3MvbGFtYmRhL2Vjc1wiO1xuaW1wb3J0IHtFY3NGYXJnYXRlU3RhY2t9IGZyb20gXCIuLi9saWIvc3RhY2tzL2Vjc19mYXJnYXRlXCI7XG4vLyBpbXBvcnQge1NjaGVkdWxlZFRhc2tTdGFja30gZnJvbSBcIi4uL2xpYi9zdGFja3Mvc2NoZWR1bGVkX3Rhc2tcIjtcbmltcG9ydCB7UGlwZWxpbmV9IGZyb20gXCIuLi9saWIvc3RhY2tzL3BpcGVsaW5lXCI7XG5cbi8qKlxuICogUFJFUkVRVUlTSVRFU1xuICpcbiAqIENyZWF0ZSBhIGRvbWFpbiAmIGhvc3RlZCB6b25lIGluIFJvdXRlNTNcbiAqIENyZWF0ZSBhbiBTU0wgQ2VydCBpbiBBQ01cbiAqL1xuY29uc3QgSU5GUkFfQ09ORklHID0ge1xuICAgIGRvbWFpbkFwZXg6ICdkZXZvcHMtdDMuY29tJyxcbiAgICBob3N0ZWRab25lSWQ6ICdaMDUzNjI5NjIyWVNPVTVBVEpXSk4nLFxuICAgIGNlcnRpZmljYXRlQXJuOiAnYXJuOmF3czphY206dXMtZWFzdC0yOjEzODQwNTU0OTU1NTpjZXJ0aWZpY2F0ZS8yZDM1NTMxNS0wNjk5LTQyZjYtOTE2OC0zNTNjZTBkYmZiNTEnLFxufTtcblxuLyoqXG4gKiBEZXBsb3kgY29kZVBpcGVsaW5lIGZyb20gZ2l0bGFiLWNpXG4gKiBQdWJsaXNoIGVjcyBzdGFjayB1c2luZyBjb2RlUGlwZWxpbmVcbiAqL1xuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIENvbmZpZ1xuY29uc3QgVDNTVEFDS19GUk9NX0VOViA9IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5BV1NfQUNDT1VOVF9JRCEsXG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OISxcbiAgICBjbGllbnRJZDogcHJvY2Vzcy5lbnYuQ0xJRU5UX0lEISxcbiAgICBjbGllbnRKb2JDb2RlOiBwcm9jZXNzLmVudi5DTElFTlRfSk9CX0NPREUhLFxuICAgIGRlcGxveUVudjogcHJvY2Vzcy5lbnYuREVQTE9ZX0VOViEsXG59O1xuY29uc29sZS5sb2coVDNTVEFDS19GUk9NX0VOVik7XG5jb25zdCBkZXBsb3lVc2VyID0gYCR7VDNTVEFDS19GUk9NX0VOVi5jbGllbnRJZH0tJHtUM1NUQUNLX0ZST01fRU5WLmRlcGxveUVudn1gO1xuY29uc3QgZWNyUmVwb05hbWVzID0gWydhcGknLCAnd2ViJ107XG5cbi8vIElmIGV4aXN0aW5nIGttc0tleVxuY29uc3Qga21zS2V5QXJuRGVmYXVsdCA9ICdhcm46YXdzOmttczp1cy1lYXN0LTI6MTM4NDA1NTQ5NTU1OmtleS83ZGUwZGI1My1mOTYyLTQyNzMtYjMxZS1jZTJlNzNkZjVjMDUnO1xuLy8gaWYgZXhpc3RpbmcgVnBjXG4vLyBjb25zdCB2cGNJZCA9IHVuZGVmaW5lZDsgLy8ndnBjLTA0YmFmZmNmNzM5ZjVkODBlJzsgLy8gdXMtZWFzdC0yIHZwYyBkZWZhdWx0IHZwY0lkPXZwYy0wYjY1NjA2YyBmb3IgUE9DIHRlc3RpbmdcblxuLy8gUGlwZWxpbmVcbmNvbnN0IHBpcGVsaW5lQnVpbGRTcGVjRmlsZSA9ICcuL2NvZGVQaXBlbGluZS9idWlsZHNwZWMueW1sJztcbmNvbnN0IHBpcGVsaW5lQ29kZUNvbW1pdFJlcG9OYW1lID0gJ2Rldm9wcy1wb2MvZmxhc2stcmVzdGFwaSc7XG5cbi8vIFJkc1xuY29uc3QgcmRzRXhpc3RpbmcgPSB7XG4gICAgZGF0YWJhc2VOYW1lOiAnZHJhbXRlc3QnLFxuICAgIGluc3RhbmNlSWRlbnRpZmllcjogJ2RyYW0tcmRzLWxvY2FsLW1hbnVhbCcsXG4gICAgaW5zdGFuY2VFbmRwb2ludEFkZHJlc3M6ICdkcmFtLXJkcy1sb2NhbC1tYW51YWwuY2h0ZTNvd2NremJkLnVzLWVhc3QtMi5yZHMuYW1hem9uYXdzLmNvbScsXG4gICAgc2VjcmV0VXNyOiAnZHJhbXRlc3QnLFxuICAgIHNlY3JldFB3ZDogJzY2JWdVZ2VqaT4jUXp2MEU/blg2M0o6I21YU1cnLFxuICAgIHBvcnQ6IDU0MzIsXG4gICAgY2x1c3RlclNlY3VyaXR5R3JvdXA6ICdzZy0wNjhlMGMzYjAzZTFjNzE2Mydcbn07XG5cbi8vIFJlZGlzXG5jb25zdCByZWRpc0F1dGhUb2tlbiA9ICd0b2tlbic7XG5jb25zdCByZWRpc0NhY2hlUHJvdG9jb2wgPSAncmVkaXNzJztcblxuLy8gTGFtYmRhc1xuLy8gY29uc3QgbGFtYmRhU210cFNlc1JlZ2lvbiA9IFQzU1RBQ0tfRlJPTV9FTlYucmVnaW9uO1xuLy8gY29uc3QgbGFtYmRhU210cFNlc1ZlcmlmaWVkSWRlbnRpdGllcyA9IFsnZGF2aWQucmFtaW5pYWtAbWF0ZXJpYWxwbHVzLmlvJ107XG4vLyBjb25zdCBsYW1iZGFBbGxvd2VkVG9waWNBcm5zID0gWycnXTtcblxuLy8gQXBwbGljYXRpb25zXG5jb25zdCBlY3NGYXJnYXRlVGVzdEFwaUVjclJlcG9OYW1lID0gJ2NoZW50ZXgvZ28tcmVzdC1hcGknO1xuY29uc3QgZWNzRmFyZ2F0ZVRlc3RBcGlFY3JJbWFnZVRhZyA9ICdsYXRlc3QnO1xuY29uc3QgZWNzRmFyZ2F0ZVRlc3RBcGlDb250YWluZXJQb3J0ID0gODA4MDtcbmNvbnN0IGVjc0ZhcmdhdGVUZXN0QXBpSXNFY3IgPSBmYWxzZTtcbmNvbnN0IGVjc0ZhcmdhdGVUZXN0QXBpSGVhbHRoQ2hlY2sgPSAnL3Rlc3QnO1xuXG5jb25zdCBlY3NGYXJnYXRlVGVzdEFwaUZhY2FkZUVjclJlcG9OYW1lID0gJ2NoZW50ZXgvZ28tcmVzdC1hcGknO1xuY29uc3QgZWNzRmFyZ2F0ZVRlc3RBcGlGYWNhZGVFY3JJbWFnZVRhZyA9ICdsYXRlc3QnO1xuY29uc3QgZWNzRmFyZ2F0ZVRlc3RBcGlGYWNhZGVDb250YWluZXJQb3J0ID0gODA4MDtcbmNvbnN0IGVjc0ZhcmdhdGVUZXN0QXBpRmFjYWRlSXNFY3IgPSBmYWxzZTtcbmNvbnN0IGVjc0ZhcmdhdGVUZXN0QXBpRmFjYWRlSGVhbHRoQ2hlY2sgPSAnL3Rlc3QnO1xuXG4vLyBjb25zdCBlY3NGYXJnYXRlU2NoZWR1bGVkVGFza0VjclJlcG9OYW1lID0gJ2NoZW50ZXgvZ28tcmVzdC1hcGknO1xuLy8gY29uc3QgZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JJbWFnZVRhZyA9ICdsYXRlc3QnO1xuLy8gY29uc3QgZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tDb250YWluZXJQb3J0ID0gODA4MDtcbi8vIGNvbnN0IGVjc0ZhcmdhdGVTY2hlZHVsZWRUYXNrSXNFY3IgPSBmYWxzZTtcblxuY29uc3QgZWNzRmFyZ2F0ZVRlc3RXZWJFY3JSZXBvTmFtZSA9ICd0dXR1bS9oZWxsby13b3JsZCc7XG5jb25zdCBlY3NGYXJnYXRlVGVzdFdlYkVjckltYWdlVGFnID0gJ2xhdGVzdCc7XG5jb25zdCBlY3NGYXJnYXRlVGVzdFdlYkNvbnRhaW5lclBvcnQgPSA4MDtcbmNvbnN0IGVjc0ZhcmdhdGVUZXN0V2ViSXNFY3IgPSBmYWxzZTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKiogRWNyICoqL1xubmV3IEVjclN0YWNrKGFwcCwge1xuICAgIHNlcnZpY2U6ICdlY3InLFxuICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4gICAgcmVwb05hbWVzOiBlY3JSZXBvTmFtZXMsXG4gICAgLy8gVE9ETyA6IG92ZXJyaWRlIGRlZmF1bHRzP1xuICAgIC8vIGttc0tleUFybjoga21zS2V5QXJuRGVmYXVsdCxcbn0pO1xuXG4vKiogVXNlciBQb2xpY3kgdG8gYWxsb3cgY2RrIHJlc291cmNlIGRlcGxveSAqKi9cbm5ldyBEZXZPcHNQaXBlbGluZURlcGxveVJvbGVTdGFjayhhcHAse1xuICAgIHNlcnZpY2U6ICdkZXBsb3lVc2VyUG9saWN5JyxcbiAgICAuLi5UM1NUQUNLX0ZST01fRU5WLFxuICAgIGRlcGxveVVzZXI6IGRlcGxveVVzZXIsXG59KTtcblxuLyoqIFNlY3JldHMgTWFuYWdlciAqKi9cbi8vIGNvbnN0IHNlY3JldHMgPSBuZXcgU2VjcmV0TWFuYWdlcihhcHAse1xuLy8gICAgIHNlcnZpY2U6ICdzZWNyZXRzTWFuYWdlckFjY2VzcycsXG4vLyAgICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbi8vIH0pO1xuXG4vKiogQ29kZVBpcGVsaW5lICoqL1xubmV3IFBpcGVsaW5lKGFwcCwge1xuICAgIHNlcnZpY2U6ICdjb2RlUGlwZWxpbmUtZGVwbG95JyxcbiAgICAuLi5UM1NUQUNLX0ZST01fRU5WLFxuICAgIGJ1aWxkU3BlY0ZpbGU6IHBpcGVsaW5lQnVpbGRTcGVjRmlsZSxcbiAgICBjb2RlQ29tbWl0UmVwb05hbWU6IHBpcGVsaW5lQ29kZUNvbW1pdFJlcG9OYW1lLFxuICAgIC8vIFRPRE8gOiBvdmVycmlkZSBkZWZhdWx0cz9cbiAgICBlbnZpcm9ubWVudFZhcnM6IHtcbiAgICAgICAgREVQTE9ZX0VOVjogVDNTVEFDS19GUk9NX0VOVi5kZXBsb3lFbnZcbiAgICB9LFxuICAgIC8vIHNlY3JldFZhcnM6IHt9LFxufSk7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEluZnJhXG5cbi8qKiBJbmZyYSA6IHZwYyAqKi9cbmNvbnN0IGluZnJhU3RhY2sgPSBuZXcgSW5mcmFTdGFjayhhcHAse1xuICAgIHNlcnZpY2U6ICdpbmZyYScsXG4gICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbiAgICAvLyBuYXRHYXRld2F5RWlwOiAnVEJEJ1xufSk7XG4vLyBSZHMgU2VjdXJpdHkgR3JvdXBcbmluZnJhU3RhY2suY3JlYXRlU2VjdXJpdHlHcm91cChpbmZyYVN0YWNrLnZwYywgJ3JkcycpO1xuY29uc3QgcmRzU2VydmljZU5hbWUgPSAncmRzLWV4aXN0aW5nJztcbmluZnJhU3RhY2suY3JlYXRlU2VjdXJpdHlHcm91cChpbmZyYVN0YWNrLnZwYywgcmRzU2VydmljZU5hbWUgKyAnMicpO1xuaW5mcmFTdGFjay5jcmVhdGVTZWN1cml0eUdyb3VwKGluZnJhU3RhY2sudnBjLCByZHNTZXJ2aWNlTmFtZSArICczJyk7XG4vLyBSZWRpcyBTZWN1cml0eSBHcm91cFxuY29uc3QgcmVkaXNTZXJ2aWNlTmFtZSA9ICdyZWRpcyc7XG5pbmZyYVN0YWNrLmNyZWF0ZVNlY3VyaXR5R3JvdXAoaW5mcmFTdGFjay52cGMsIHJlZGlzU2VydmljZU5hbWUpO1xuXG5cbi8qKlxuICogUkRTXG4gKlxuICogTk9URSA6IERlbGV0aW5nIHRoZSBcInJkc1N0YWNrXCIgc3RhY2sgd2lsbCBmYWlsXG4gKiAgLSBmaXJzdCByZW1vdmUgYW55IHN0YWNrIGRlcGVuZGVuY2llcyAoaS5lLiBhcGkgc3RhY2sgY2FsbHMgdGhlIFJEUyBEQilcbiAqICAtIGRlbGV0ZSB0aGUgc3RhY2sgdXNpbmcgQ2ZuIHdpbGwgYXNrIHRvIHJldGFpbiB0aGUgU2VjdXJpdHlHcm91cFxuICogIC0gaWYgeW91IGRlbGV0ZSB0aGUgUkRTIGluc3RhbmNlLCB0aGVuIHlvdSBjYW4gZGVsZXRlIHRoZSBTRzsgb3RoZXJ3aXNlIGl0IHJlbWFpbnMgYXR0YWNoZWQgdG8gdGhlIERCIGludGVyZmFjZVxuICoqL1xuY29uc3QgcmRzU3RhY2sgPSBuZXcgUmRzUG9zdGdyZXNTdGFjayhhcHAsIHtcbiAgICBzZXJ2aWNlOiAncmRzJyxcbiAgICB2cGM6IGluZnJhU3RhY2sudnBjLFxuICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4gICAgZGF0YWJhc2VOYW1lOiAnZHJhbXRlc3QnLFxuICAgIGttc0tleUFybjoga21zS2V5QXJuRGVmYXVsdCxcbn0pO1xuY29uc3QgcmRzU2VjdXJpdHlHcm91cEFjY2Vzc1Byb3BzID0gcmRzQWNjZXNzUHJvcHMoVDNTVEFDS19GUk9NX0VOVi5jbGllbnRJZCwgVDNTVEFDS19GUk9NX0VOVi5kZXBsb3lFbnYsIHJkc1N0YWNrLnNlcnZpY2UpO1xuY29uc29sZS5sb2cocmRzU2VjdXJpdHlHcm91cEFjY2Vzc1Byb3BzLnNlY3VyaXR5R3JvdXBJZCk7XG5cbmNvbnN0IHJkc1N0YWNrMiA9IG5ldyBSZHNQb3N0Z3Jlc1N0YWNrKGFwcCwge1xuICAgIHNlcnZpY2U6IHJkc1NlcnZpY2VOYW1lICsgJzInLFxuICAgIHZwYzogaW5mcmFTdGFjay52cGMsXG4gICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbiAgICBleGlzdGluZ0RiQ29uZmlnOiByZHNFeGlzdGluZyxcbiAgICBrbXNLZXlBcm46IGttc0tleUFybkRlZmF1bHQsXG59KTtcbmNvbnN0IHJkc1NlY3VyaXR5R3JvdXBBY2Nlc3NQcm9wczIgPSByZHNBY2Nlc3NQcm9wcyhUM1NUQUNLX0ZST01fRU5WLmNsaWVudElkLCBUM1NUQUNLX0ZST01fRU5WLmRlcGxveUVudiwgcmRzU3RhY2syLnNlcnZpY2UpO1xuXG5jb25zdCByZHNTdGFjazMgPSBuZXcgUmRzUG9zdGdyZXNTdGFjayhhcHAsIHtcbiAgICBzZXJ2aWNlOiByZHNTZXJ2aWNlTmFtZSArICczJyxcbiAgICB2cGM6IGluZnJhU3RhY2sudnBjLFxuICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4gICAgZXhpc3RpbmdEYkNvbmZpZzogcmRzRXhpc3RpbmcsXG4gICAga21zS2V5QXJuOiBrbXNLZXlBcm5EZWZhdWx0LFxufSk7XG5jb25zdCByZHNTZWN1cml0eUdyb3VwQWNjZXNzUHJvcHMzID0gcmRzQWNjZXNzUHJvcHMoVDNTVEFDS19GUk9NX0VOVi5jbGllbnRJZCwgVDNTVEFDS19GUk9NX0VOVi5kZXBsb3lFbnYsIHJkc1N0YWNrMi5zZXJ2aWNlKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKiogUmVkaXMgKiovXG5jb25zdCByZWRpc1N0YWNrID0gbmV3IFJlZGlzU3RhY2soYXBwLCB7XG4gICAgc2VydmljZTogcmVkaXNTZXJ2aWNlTmFtZSxcbiAgICB2cGM6IGluZnJhU3RhY2sudnBjLFxuICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4gICAgYXV0aFRva2VuOiByZWRpc0F1dGhUb2tlbixcbiAgICBjYWNoZU5vZGVUeXBlOiAnY2FjaGUudDMubWljcm8nLFxuICAgIG51bU5vZGVHcm91cHM6IDEsXG4gICAgcmVwbGljYXNQZXJOb2RlR3JvdXA6IDIsXG59KTtcbmNvbnN0IHJlZGlzU2VjdXJpdHlHcm91cEFjY2Vzc1Byb3BzID0gcmVkaXNBY2Nlc3NQcm9wcyhUM1NUQUNLX0ZST01fRU5WLmNsaWVudElkLCBUM1NUQUNLX0ZST01fRU5WLmRlcGxveUVudiwgcmVkaXNTdGFjay5zZXJ2aWNlKTtcblxuXG4vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gLy8gTGFtYmRhc1xuLy9cbi8vIC8qKiBMYW1iZGEgLSBTZXMgKiovXG4vLyBuZXcgU210cFNlc0xhbWJkYVN0YWNrKGFwcCx7XG4vLyAgICAgc2VydmljZTogJ2xhbWJkYS1zbXRwLXNlcycsXG4vLyAgICAgdnBjOiBpbmZyYVN0YWNrLnZwYyxcbi8vICAgICAuLi5UM1NUQUNLX0ZST01fRU5WLFxuLy8gICAgIC8vIFRPRE8gOiBvdmVycmlkZSBkZWZhdWx0cz9cbi8vICAgICAvLyBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM185LFxuLy8gICAgIC8vIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL3N0YWNrcy9sYW1iZGEvc210cF9zZXMnKSksXG4vLyAgICAgLy8gdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApXG4vLyAgICAgc2VzUmVnaW9uOiBsYW1iZGFTbXRwU2VzUmVnaW9uLFxuLy8gICAgIHZlcmlmaWVkSWRlbnRpdGllczogbGFtYmRhU210cFNlc1ZlcmlmaWVkSWRlbnRpdGllcyxcbi8vIH0pO1xuLy9cbi8vIC8qKiBMYW1iZGEgLSBTbnMgKiovXG4vLyBuZXcgU25zTGFtYmRhU3RhY2soYXBwLCB7XG4vLyAgICAgc2VydmljZTogJ2xhbWJkYS1zbnMnLFxuLy8gICAgIHZwYzogaW5mcmFTdGFjay52cGMsXG4vLyAgICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbi8vICAgICAvLyBUT0RPIDogb3ZlcnJpZGUgZGVmYXVsdHM/XG4vLyAgICAgLy8gcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbi8vICAgICAvLyBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9zdGFja3MvbGFtYmRhL3NucycpKSxcbi8vICAgICAvLyB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMClcbi8vICAgICBhbGxvd2VkVG9waWNBcm5zOiBsYW1iZGFBbGxvd2VkVG9waWNBcm5zLFxuLy8gfSk7XG4vL1xuLy8gLyoqIExhbWJkYSAtIEVjcyAqKi9cbi8vIG5ldyBFY3NMYW1iZGFTdGFjayhhcHAsIHtcbi8vICAgICBzZXJ2aWNlOiAnbGFtYmRhLWVjcy10ZXN0Jyxcbi8vICAgICB2cGM6IGluZnJhU3RhY2sudnBjLFxuLy8gICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4vLyAgICAgLy8gVE9ETyA6IG92ZXJyaWRlIGRlZmF1bHRzP1xuLy8gICAgIC8vIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzksXG4vLyAgICAgLy8gY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvc3RhY2tzL2xhbWJkYS9lY3MnKSksXG4vLyAgICAgLy8gdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApXG4vLyB9KTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gRWNzIEFwcGxpY2F0aW9uc1xuXG4vKiogRWNzIEZhcmdhdGUgLSBBcGkgKiovXG5jb25zdCBhcGlJbnRlcm5hbFNlcnZpY2VOYW1lID0gJ2FwaS1pbnRlcm5hbCc7XG5uZXcgRWNzRmFyZ2F0ZVN0YWNrKGFwcCx7XG4gICAgc2VydmljZTogYXBpSW50ZXJuYWxTZXJ2aWNlTmFtZSxcbiAgICB2cGM6IGluZnJhU3RhY2sudnBjLFxuICAgIGxvZ0dyb3VwOiBpbmZyYVN0YWNrLmxvZ0dyb3VwLFxuICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4gICAgLi4uSU5GUkFfQ09ORklHLFxuICAgIC8vIFRPRE8gOiBvdmVycmlkZSBkZWZhdWx0cz9cbiAgICAvLyBzY2FsaW5nQ29uZmlnOiB7fSxcbiAgICAvLyBhbGJWYW5pdHlEb21haW46IGVjc0ZhcmdhdGVUZXN0QXBpVmFuaXR5RG9tYWluLFxuICAgIHJlcG9OYW1lOiBlY3NGYXJnYXRlVGVzdEFwaUVjclJlcG9OYW1lLFxuICAgIGltYWdlVGFnOiBlY3NGYXJnYXRlVGVzdEFwaUVjckltYWdlVGFnLFxuICAgIGNvbnRhaW5lclBvcnQ6IGVjc0ZhcmdhdGVUZXN0QXBpQ29udGFpbmVyUG9ydCxcbiAgICBpc0VjcjogZWNzRmFyZ2F0ZVRlc3RBcGlJc0VjcixcbiAgICBoZWFsdGhDaGVja0VuZHBvaW50OiBlY3NGYXJnYXRlVGVzdEFwaUhlYWx0aENoZWNrLFxuICAgIGludGVybmV0RmFjaW5nOiBmYWxzZSxcbiAgICAvLyB0YXJnZXRTZWN1cml0eUdyb3VwQWNjZXNzUHJvcHM6IFtcbiAgICAvLyAgICAgcmRzU2VjdXJpdHlHcm91cEFjY2Vzc1Byb3BzLFxuICAgIC8vICAgICByZHNTZWN1cml0eUdyb3VwQWNjZXNzUHJvcHMyLFxuICAgIC8vICAgICByZHNTZWN1cml0eUdyb3VwQWNjZXNzUHJvcHMzLFxuICAgIC8vICAgICByZWRpc1NlY3VyaXR5R3JvdXBBY2Nlc3NQcm9wcyxcbiAgICAvLyBdLFxuICAgIC8vIHNlcnZpY2VFbnY6IHtcbiAgICAvLyAgICAgLy8gUE9TVEdSRVNfSE9TVDogcmRzU3RhY2suZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5ob3N0bmFtZSxcbiAgICAvLyAgICAgLy8gUE9TVEdSRVNfUE9SVDogcmRzU3RhY2suZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5wb3J0LnRvU3RyaW5nKCksXG4gICAgLy8gICAgIC8vIFBPU1RHUkVTX05BTUU6IHJkc1N0YWNrLmRhdGFiYXNlTmFtZSxcbiAgICAvLyAgICAgUE9TVEdSRVNfSE9TVF8yOiByZHNTdGFjazIuZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5ob3N0bmFtZSxcbiAgICAvLyAgICAgUE9TVEdSRVNfUE9SVF8yOiByZHNTdGFjazIuZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5wb3J0LnRvU3RyaW5nKCksXG4gICAgLy8gICAgIFBPU1RHUkVTX05BTUVfMjogcmRzU3RhY2syLmRhdGFiYXNlTmFtZSxcbiAgICAvLyAgICAgUkVESVNfQVVUSF9UT0tFTjogcmVkaXNBdXRoVG9rZW4sXG4gICAgLy8gICAgIFJFRElTX1BST1RPQ09MOiByZWRpc0NhY2hlUHJvdG9jb2wsXG4gICAgLy8gICAgIFJFRElTX0VORFBPSU5UOiByZWRpc1N0YWNrLnJlcGxpY2F0aW9uR3JvdXAuYXR0ckNvbmZpZ3VyYXRpb25FbmRQb2ludEFkZHJlc3MsXG4gICAgLy8gfSxcbiAgICAvLyBzZXJ2aWNlU2VjcmV0czoge1xuICAgIC8vICAgICAvLyBQT1NUR1JFU19VU0VSOiByZHNTdGFjay5kYlVzZXJuYW1lKCksXG4gICAgLy8gICAgIC8vIFBPU1RHUkVTX1BBU1NXT1JEOiByZHNTdGFjay5kYlBhc3N3b3JkKCksXG4gICAgLy8gICAgIFBPU1RHUkVTX1VTRVJfMjogcmRzU3RhY2syLmRiVXNlcm5hbWUoKSxcbiAgICAvLyAgICAgUE9TVEdSRVNfUEFTU1dPUkRfMjogcmRzU3RhY2syLmRiUGFzc3dvcmQoKSxcbiAgICAvLyB9LFxufSk7XG5cbi8qKiBFY3MgRmFyZ2F0ZSAtIEFwaSBGYWNhZGUgKiovXG5jb25zdCBhcGlGYWNhZGVTZXJ2aWNlTmFtZSA9ICdhcGktZmFjYWRlJztcbm5ldyBFY3NGYXJnYXRlU3RhY2soYXBwLHtcbiAgICBzZXJ2aWNlOiBhcGlGYWNhZGVTZXJ2aWNlTmFtZSxcbiAgICB2cGM6IGluZnJhU3RhY2sudnBjLFxuICAgIGxvZ0dyb3VwOiBpbmZyYVN0YWNrLmxvZ0dyb3VwLFxuICAgIC4uLlQzU1RBQ0tfRlJPTV9FTlYsXG4gICAgLi4uSU5GUkFfQ09ORklHLFxuICAgIC8vIFRPRE8gOiBvdmVycmlkZSBkZWZhdWx0cz9cbiAgICAvLyBzY2FsaW5nQ29uZmlnOiB7fSxcbiAgICAvLyBhbGJWYW5pdHlEb21haW46IGVjc0ZhcmdhdGVUZXN0QXBpRmFjYWRlVmFuaXR5RG9tYWluLFxuICAgIC8vIGFjY2Vzc1NlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICByZXBvTmFtZTogZWNzRmFyZ2F0ZVRlc3RBcGlGYWNhZGVFY3JSZXBvTmFtZSxcbiAgICBpbWFnZVRhZzogZWNzRmFyZ2F0ZVRlc3RBcGlGYWNhZGVFY3JJbWFnZVRhZyxcbiAgICBjb250YWluZXJQb3J0OiBlY3NGYXJnYXRlVGVzdEFwaUZhY2FkZUNvbnRhaW5lclBvcnQsXG4gICAgaXNFY3I6IGVjc0ZhcmdhdGVUZXN0QXBpRmFjYWRlSXNFY3IsXG4gICAgaGVhbHRoQ2hlY2tFbmRwb2ludDogZWNzRmFyZ2F0ZVRlc3RBcGlGYWNhZGVIZWFsdGhDaGVjayxcblxuICAgIHRhcmdldFNlY3VyaXR5R3JvdXBBY2Nlc3NQcm9wczogW1xuICAgICAgICAvLyByZHNTZWN1cml0eUdyb3VwQWNjZXNzUHJvcHMsXG4gICAgICAgIHJkc1NlY3VyaXR5R3JvdXBBY2Nlc3NQcm9wczIsXG4gICAgICAgIHJkc1NlY3VyaXR5R3JvdXBBY2Nlc3NQcm9wczMsXG4gICAgICAgIHJlZGlzU2VjdXJpdHlHcm91cEFjY2Vzc1Byb3BzLFxuICAgIF0sXG4gICAgc2VydmljZUVudjoge1xuICAgICAgICBQT1NUR1JFU19IT1NUXzI6IHJkc1N0YWNrMi5kYXRhYmFzZS5pbnN0YW5jZUVuZHBvaW50Lmhvc3RuYW1lLFxuICAgICAgICBQT1NUR1JFU19QT1JUXzI6IHJkc1N0YWNrMi5kYXRhYmFzZS5pbnN0YW5jZUVuZHBvaW50LnBvcnQudG9TdHJpbmcoKSxcbiAgICAgICAgUE9TVEdSRVNfTkFNRV8yOiByZHNTdGFjazIuZGF0YWJhc2VOYW1lLFxuICAgICAgICBQT1NUR1JFU19IT1NUXzM6IHJkc1N0YWNrMy5kYXRhYmFzZS5pbnN0YW5jZUVuZHBvaW50Lmhvc3RuYW1lLFxuICAgICAgICBQT1NUR1JFU19QT1JUXzM6IHJkc1N0YWNrMy5kYXRhYmFzZS5pbnN0YW5jZUVuZHBvaW50LnBvcnQudG9TdHJpbmcoKSxcbiAgICAgICAgUE9TVEdSRVNfTkFNRV8zOiByZHNTdGFjazMuZGF0YWJhc2VOYW1lLFxuXG4gICAgICAgIFBPU1RHUkVTX1VTRVJfMjogcmRzU3RhY2syLmNyZWRlbnRpYWxzIS51c2VybmFtZSxcbiAgICAgICAgUE9TVEdSRVNfUEFTU1dPUkRfMjogcmRzU3RhY2syLmNyZWRlbnRpYWxzIS5wYXNzd29yZCxcbiAgICAgICAgUE9TVEdSRVNfVVNFUl8zOiByZHNTdGFjazMuY3JlZGVudGlhbHMhLnVzZXJuYW1lLFxuICAgICAgICBQT1NUR1JFU19QQVNTV09SRF8zOiByZHNTdGFjazMuY3JlZGVudGlhbHMhLnBhc3N3b3JkLFxuXG4gICAgICAgIFJFRElTX0FVVEhfVE9LRU46IHJlZGlzQXV0aFRva2VuLFxuICAgICAgICBSRURJU19QUk9UT0NPTDogcmVkaXNDYWNoZVByb3RvY29sLFxuICAgICAgICBSRURJU19FTkRQT0lOVDogcmVkaXNTdGFjay5yZXBsaWNhdGlvbkdyb3VwLmF0dHJDb25maWd1cmF0aW9uRW5kUG9pbnRBZGRyZXNzLFxuICAgIH0sXG4gICAgLy8gc2VydmljZVNlY3JldHM6IHtcbiAgICAvLyAgICAgUE9TVEdSRVNfVVNFUl8yOiByZHNTdGFjazIuZGJVc2VybmFtZSgpLFxuICAgIC8vICAgICBQT1NUR1JFU19QQVNTV09SRF8yOiByZHNTdGFjazIuZGJQYXNzd29yZCgpLFxuICAgIC8vICAgICBQT1NUR1JFU19VU0VSXzM6IHJkc1N0YWNrMy5kYlVzZXJuYW1lKCksXG4gICAgLy8gICAgIFBPU1RHUkVTX1BBU1NXT1JEXzM6IHJkc1N0YWNrMy5kYlBhc3N3b3JkKCksXG4gICAgLy8gfSxcbn0pO1xuXG4vKiogRWNzIEZhcmdhdGUgLSBXZWIgKiovXG5jb25zdCB3ZWJTZXJ2aWNlTmFtZSA9ICd3ZWInO1xubmV3IEVjc0ZhcmdhdGVTdGFjayhhcHAse1xuICAgIHNlcnZpY2U6IHdlYlNlcnZpY2VOYW1lLFxuICAgIHZwYzogaW5mcmFTdGFjay52cGMsXG4gICAgbG9nR3JvdXA6IGluZnJhU3RhY2subG9nR3JvdXAsXG4gICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbiAgICAuLi5JTkZSQV9DT05GSUcsXG4gICAgLy8gVE9ETyA6IG92ZXJyaWRlIGRlZmF1bHRzP1xuICAgIC8vIHNjYWxpbmdDb25maWc6IHt9LFxuICAgIC8vIGFsYlZhbml0eURvbWFpbjogZWNzRmFyZ2F0ZVRlc3RXZWJWYW5pdHlEb21haW4sXG4gICAgLy8gYWNjZXNzU2VjdXJpdHlHcm91cHM6IFtdLFxuICAgIHJlcG9OYW1lOiBlY3NGYXJnYXRlVGVzdFdlYkVjclJlcG9OYW1lLFxuICAgIGltYWdlVGFnOiBlY3NGYXJnYXRlVGVzdFdlYkVjckltYWdlVGFnLFxuICAgIGNvbnRhaW5lclBvcnQ6IGVjc0ZhcmdhdGVUZXN0V2ViQ29udGFpbmVyUG9ydCxcbiAgICBpc0VjcjogZWNzRmFyZ2F0ZVRlc3RXZWJJc0Vjcixcbn0pO1xuXG5cbi8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAvLyBTY2hlZHVsZWQgVGFza3Ncbi8vXG4vLyAvKiogRWNzIEZhcmdhdGUgLSBTY2hlZHVsZWQgVGFza3MgLSBEZWFsZXJzICoqL1xuLy8gbmV3IFNjaGVkdWxlZFRhc2tTdGFjayhhcHAsIHtcbi8vICAgICBzZXJ2aWNlOiAnY3Jvbi1kZWFsZXInLFxuLy8gICAgIHZwYzogaW5mcmFTdGFjay52cGMsXG4vLyAgICAgbG9nR3JvdXA6IGluZnJhU3RhY2subG9nR3JvdXAsXG4vLyAgICAgLy8gc2NhbGluZ0NvbmZpZzoge30sXG4vLyAgICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbi8vICAgICByZXBvTmFtZTogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JSZXBvTmFtZSxcbi8vICAgICBpbWFnZVRhZzogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JJbWFnZVRhZyxcbi8vICAgICBjb250YWluZXJQb3J0OiBlY3NGYXJnYXRlU2NoZWR1bGVkVGFza0NvbnRhaW5lclBvcnQsXG4vLyAgICAgaXNFY3I6IGVjc0ZhcmdhdGVTY2hlZHVsZWRUYXNrSXNFY3IsXG4vLyAgICAgc2NoZWR1bGVIb3VyOiAxLFxuLy8gICAgIHNjaGVkdWxlTWluOiAwLFxuLy8gICAgIGFjY2Vzc1NlY3VyaXR5R3JvdXBzOiBbXG4vLyAgICAgICAgIHJkc1NlY3VyaXR5R3JvdXBGcm9tRXhwb3J0KFQzU1RBQ0tfRlJPTV9FTlYuZGVwbG95RW52KSxcbi8vICAgICBdLFxuLy8gICAgIHNlcnZpY2VFbnY6IHJkc1N0YWNrLmRiQ29uZmlnKCksXG4vLyAgICAgc2VydmljZVNlY3JldHM6IHJkc1N0YWNrLmRiU2VjcmV0cygpLFxuLy8gfSk7XG4vL1xuLy8gLyoqIEVjcyBGYXJnYXRlIC0gU2NoZWR1bGVkIFRhc2tzIC0gU2t1ICoqL1xuLy8gbmV3IFNjaGVkdWxlZFRhc2tTdGFjayhhcHAsIHtcbi8vICAgICBzZXJ2aWNlOiAnY3Jvbi1za3UnLFxuLy8gICAgIHZwYzogaW5mcmFTdGFjay52cGMsXG4vLyAgICAgbG9nR3JvdXA6IGluZnJhU3RhY2subG9nR3JvdXAsXG4vLyAgICAgLy8gc2NhbGluZ0NvbmZpZzoge30sXG4vLyAgICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbi8vICAgICByZXBvTmFtZTogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JSZXBvTmFtZSxcbi8vICAgICBpbWFnZVRhZzogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JJbWFnZVRhZyxcbi8vICAgICBjb250YWluZXJQb3J0OiBlY3NGYXJnYXRlU2NoZWR1bGVkVGFza0NvbnRhaW5lclBvcnQsXG4vLyAgICAgaXNFY3I6IGVjc0ZhcmdhdGVTY2hlZHVsZWRUYXNrSXNFY3IsXG4vLyAgICAgc2NoZWR1bGVIb3VyOiAyLFxuLy8gICAgIHNjaGVkdWxlTWluOiAwLFxuLy8gICAgIGFjY2Vzc1NlY3VyaXR5R3JvdXBzOiBbXG4vLyAgICAgICAgIHJkc1NlY3VyaXR5R3JvdXBGcm9tRXhwb3J0KFQzU1RBQ0tfRlJPTV9FTlYuZGVwbG95RW52KSxcbi8vICAgICBdLFxuLy8gICAgIHNlcnZpY2VFbnY6IHJkc1N0YWNrLmRiQ29uZmlnKCksXG4vLyAgICAgc2VydmljZVNlY3JldHM6IHJkc1N0YWNrLmRiU2VjcmV0cygpLFxuLy8gfSk7XG4vL1xuLy8gLyoqIEVjcyBGYXJnYXRlIC0gU2NoZWR1bGVkIFRhc2tzIC0gRml0bWVudCAqKi9cbi8vIG5ldyBTY2hlZHVsZWRUYXNrU3RhY2soYXBwLCB7XG4vLyAgICAgc2VydmljZTogJ2Nyb24tZml0bWVudCcsXG4vLyAgICAgdnBjOiBpbmZyYVN0YWNrLnZwYyxcbi8vICAgICBsb2dHcm91cDogaW5mcmFTdGFjay5sb2dHcm91cCxcbi8vICAgICAvLyBzY2FsaW5nQ29uZmlnOiB7fSxcbi8vICAgICAuLi5UM1NUQUNLX0ZST01fRU5WLFxuLy8gICAgIHJlcG9OYW1lOiBlY3NGYXJnYXRlU2NoZWR1bGVkVGFza0VjclJlcG9OYW1lLFxuLy8gICAgIGltYWdlVGFnOiBlY3NGYXJnYXRlU2NoZWR1bGVkVGFza0VjckltYWdlVGFnLFxuLy8gICAgIGNvbnRhaW5lclBvcnQ6IGVjc0ZhcmdhdGVTY2hlZHVsZWRUYXNrQ29udGFpbmVyUG9ydCxcbi8vICAgICBpc0VjcjogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tJc0Vjcixcbi8vICAgICBzY2hlZHVsZUhvdXI6IDMsXG4vLyAgICAgc2NoZWR1bGVNaW46IDAsXG4vLyAgICAgYWNjZXNzU2VjdXJpdHlHcm91cHM6IFtcbi8vICAgICAgICAgcmRzU2VjdXJpdHlHcm91cEZyb21FeHBvcnQoVDNTVEFDS19GUk9NX0VOVi5kZXBsb3lFbnYpLFxuLy8gICAgIF0sXG4vLyAgICAgc2VydmljZUVudjogcmRzU3RhY2suZGJDb25maWcoKSxcbi8vICAgICBzZXJ2aWNlU2VjcmV0czogcmRzU3RhY2suZGJTZWNyZXRzKCksXG4vLyB9KTtcbi8vXG4vLyAvKiogRWNzIEZhcmdhdGUgLSBTY2hlZHVsZWQgVGFza3MgLSBUb2tlbiBGbHVzaCAqKi9cbi8vIG5ldyBTY2hlZHVsZWRUYXNrU3RhY2soYXBwLCB7XG4vLyAgICAgc2VydmljZTogJ2Nyb24tdG9rZW4tZmx1c2gnLFxuLy8gICAgIHZwYzogaW5mcmFTdGFjay52cGMsXG4vLyAgICAgbG9nR3JvdXA6IGluZnJhU3RhY2subG9nR3JvdXAsXG4vLyAgICAgLy8gc2NhbGluZ0NvbmZpZzoge30sXG4vLyAgICAgLi4uVDNTVEFDS19GUk9NX0VOVixcbi8vICAgICByZXBvTmFtZTogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JSZXBvTmFtZSxcbi8vICAgICBpbWFnZVRhZzogZWNzRmFyZ2F0ZVNjaGVkdWxlZFRhc2tFY3JJbWFnZVRhZyxcbi8vICAgICBjb250YWluZXJQb3J0OiBlY3NGYXJnYXRlU2NoZWR1bGVkVGFza0NvbnRhaW5lclBvcnQsXG4vLyAgICAgaXNFY3I6IGVjc0ZhcmdhdGVTY2hlZHVsZWRUYXNrSXNFY3IsXG4vLyAgICAgc2NoZWR1bGVXZWVrZGF5OiBmc3guV2Vla2RheS5NT05EQVksXG4vLyAgICAgc2NoZWR1bGVIb3VyOiA0LFxuLy8gICAgIHNjaGVkdWxlTWluOiAwLFxuLy8gICAgIGFjY2Vzc1NlY3VyaXR5R3JvdXBzOiBbXG4vLyAgICAgICAgIHJkc1NlY3VyaXR5R3JvdXBGcm9tRXhwb3J0KFQzU1RBQ0tfRlJPTV9FTlYuZGVwbG95RW52KSxcbi8vICAgICBdLFxuLy8gICAgIHNlcnZpY2VFbnY6IHJkc1N0YWNrLmRiQ29uZmlnKCksXG4vLyAgICAgc2VydmljZVNlY3JldHM6IHJkc1N0YWNrLmRiU2VjcmV0cygpLFxuLy8gfSk7XG4iXX0=