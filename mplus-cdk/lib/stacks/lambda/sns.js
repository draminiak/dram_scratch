"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsLambdaStack = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda_1 = require("../lambda");
const path = require("path");
const SNS_DEFAULTS = {
    runtime: aws_cdk_lib_1.aws_lambda.Runtime.PYTHON_3_9,
    code: aws_cdk_lib_1.aws_lambda.Code.fromAsset(path.join(__dirname, '../../../dram/lambda/sns')),
    timeout: cdk.Duration.seconds(30),
};
/** Class SnsLambdaStack **/
class SnsLambdaStack extends lambda_1.LambdaStack {
    constructor(scope, props) {
        super(scope, props);
        const createProps = {
            vpc: props.vpc,
            runtime: props.runtime || SNS_DEFAULTS.runtime,
            code: props.code || SNS_DEFAULTS.code,
            timeout: props.timeout || SNS_DEFAULTS.timeout,
            timeoutAlarm: true,
            handler: 'handler.publish_message',
            funcName: props.deployEnv + 'PublishMessage',
            invocationUser: 'fn-sns' // IAM user created manually in the aws console
        };
        // Function for publishing SNS messages
        const snsPublish = this.createFunction(createProps);
        this.createRole(snsPublish, props.allowedTopicArns);
    }
    createRole(fn, allowedTopicArns) {
        // Add permissions to the Lambda function to publish messages to a specified sns topic
        const allowedTopics = [
        // `arn:aws:sns:${this.region}:${cdk.Stack.of(this).account}:*`,
        ];
        for (const topicArn of allowedTopicArns) {
            allowedTopics.push(topicArn);
        }
        const role = new aws_cdk_lib_1.aws_iam.PolicyStatement({
            effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
            actions: [
                'sns:Publish',
            ],
            resources: allowedTopics,
        });
        fn.addToRolePolicy(role);
    }
}
exports.SnsLambdaStack = SnsLambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FBaUU7QUFDakUsc0NBQW1GO0FBQ25GLDZCQUE4QjtBQVU5QixNQUFNLFlBQVksR0FBRztJQUNqQixPQUFPLEVBQUUsd0JBQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtJQUNsQyxJQUFJLEVBQUUsd0JBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDN0UsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztDQUNwQyxDQUFDO0FBRUYsNEJBQTRCO0FBQzVCLE1BQWEsY0FBZSxTQUFRLG9CQUFXO0lBQzNDLFlBQVksS0FBYyxFQUFFLEtBQTBCO1FBQ2xELEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFcEIsTUFBTSxXQUFXLEdBQThCO1lBQzNDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztZQUNkLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPO1lBQzlDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJO1lBQ3JDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPO1lBQzlDLFlBQVksRUFBRSxJQUFJO1lBQ2xCLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsUUFBUSxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCO1lBQzVDLGNBQWMsRUFBRSxRQUFRLENBQUMsK0NBQStDO1NBQzNFLENBQUM7UUFFRix1Q0FBdUM7UUFDdkMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU8sVUFBVSxDQUFDLEVBQW1CLEVBQUUsZ0JBQTBCO1FBQzlELHNGQUFzRjtRQUN0RixNQUFNLGFBQWEsR0FBRztRQUNsQixnRUFBZ0U7U0FDbkUsQ0FBQztRQUNGLEtBQUssTUFBTSxRQUFRLElBQUksZ0JBQWdCLEVBQUU7WUFDckMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztRQUNELE1BQU0sSUFBSSxHQUFHLElBQUkscUJBQUcsQ0FBQyxlQUFlLENBQUM7WUFDakMsTUFBTSxFQUFFLHFCQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFO2dCQUNMLGFBQWE7YUFDaEI7WUFDRCxTQUFTLEVBQUUsYUFBYTtTQUMzQixDQUFDLENBQUM7UUFDSCxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7Q0FDSjtBQXJDRCx3Q0FxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQge2F3c19pYW0gYXMgaWFtLCBhd3NfbGFtYmRhIGFzIGxhbWJkYX0gZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQge0xhbWJkYUNyZWF0ZUZ1bmN0aW9uUHJvcHMsIExhbWJkYVN0YWNrLCBMYW1iZGFTdGFja1Byb3BzfSBmcm9tIFwiLi4vbGFtYmRhXCI7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuLyoqIENsYXNzIFNuc0xhbWJkYVN0YWNrICoqL1xuZXhwb3J0IGludGVyZmFjZSBTbnNMYW1iZGFTdGFja1Byb3BzIGV4dGVuZHMgTGFtYmRhU3RhY2tQcm9wcyB7XG4gICAgcmVhZG9ubHkgYWxsb3dlZFRvcGljQXJuczogc3RyaW5nW10gICAgIC8vIFNOUyB0b3BpY3MgYWxsb3dlZCBieSB0aGUgbGFtYmRhIHRvIHB1Ymxpc2ggbWVzc2FnZXMgKGV4IFthcm46YXdzOnNuczp1cy1lYXN0LTE6MTM4NDA1NTQ5NTU1Om5ldy1vcmRlcnNdKVxuICAgIHJlYWRvbmx5IHJ1bnRpbWU/OiBsYW1iZGEuUnVudGltZSAgICAgICAvLyBweXRob24gdmVyc2lvblxuICAgIHJlYWRvbmx5IGNvZGU/OiBsYW1iZGEuQ29kZSAgICAgICAgICAgICAvLyBwYXRoIHRvIHB5dGhvbiBoYW5kbGVyIGZpbGUgKGhhbmRsZXIucHkpXG4gICAgcmVhZG9ubHkgdGltZW91dD86IGNkay5EdXJhdGlvbiAgICAgICAgIC8vIG1heCBleGVjdXRpb24gdGltZVxufVxuXG5jb25zdCBTTlNfREVGQVVMVFMgPSB7XG4gICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2RyYW0vbGFtYmRhL3NucycpKSxcbiAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG59O1xuXG4vKiogQ2xhc3MgU25zTGFtYmRhU3RhY2sgKiovXG5leHBvcnQgY2xhc3MgU25zTGFtYmRhU3RhY2sgZXh0ZW5kcyBMYW1iZGFTdGFjayB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIHByb3BzOiBTbnNMYW1iZGFTdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBwcm9wcyk7XG5cbiAgICAgICAgY29uc3QgY3JlYXRlUHJvcHM6IExhbWJkYUNyZWF0ZUZ1bmN0aW9uUHJvcHMgPSB7XG4gICAgICAgICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgICAgICAgIHJ1bnRpbWU6IHByb3BzLnJ1bnRpbWUgfHwgU05TX0RFRkFVTFRTLnJ1bnRpbWUsXG4gICAgICAgICAgICBjb2RlOiBwcm9wcy5jb2RlIHx8IFNOU19ERUZBVUxUUy5jb2RlLFxuICAgICAgICAgICAgdGltZW91dDogcHJvcHMudGltZW91dCB8fCBTTlNfREVGQVVMVFMudGltZW91dCxcbiAgICAgICAgICAgIHRpbWVvdXRBbGFybTogdHJ1ZSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdoYW5kbGVyLnB1Ymxpc2hfbWVzc2FnZScsXG4gICAgICAgICAgICBmdW5jTmFtZTogcHJvcHMuZGVwbG95RW52ICsgJ1B1Ymxpc2hNZXNzYWdlJyxcbiAgICAgICAgICAgIGludm9jYXRpb25Vc2VyOiAnZm4tc25zJyAvLyBJQU0gdXNlciBjcmVhdGVkIG1hbnVhbGx5IGluIHRoZSBhd3MgY29uc29sZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEZ1bmN0aW9uIGZvciBwdWJsaXNoaW5nIFNOUyBtZXNzYWdlc1xuICAgICAgICBjb25zdCBzbnNQdWJsaXNoID0gdGhpcy5jcmVhdGVGdW5jdGlvbihjcmVhdGVQcm9wcyk7XG4gICAgICAgIHRoaXMuY3JlYXRlUm9sZShzbnNQdWJsaXNoLCBwcm9wcy5hbGxvd2VkVG9waWNBcm5zKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVJvbGUoZm46IGxhbWJkYS5GdW5jdGlvbiwgYWxsb3dlZFRvcGljQXJuczogc3RyaW5nW10pIHtcbiAgICAgICAgLy8gQWRkIHBlcm1pc3Npb25zIHRvIHRoZSBMYW1iZGEgZnVuY3Rpb24gdG8gcHVibGlzaCBtZXNzYWdlcyB0byBhIHNwZWNpZmllZCBzbnMgdG9waWNcbiAgICAgICAgY29uc3QgYWxsb3dlZFRvcGljcyA9IFtcbiAgICAgICAgICAgIC8vIGBhcm46YXdzOnNuczoke3RoaXMucmVnaW9ufToke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fToqYCxcbiAgICAgICAgXTtcbiAgICAgICAgZm9yIChjb25zdCB0b3BpY0FybiBvZiBhbGxvd2VkVG9waWNBcm5zKSB7XG4gICAgICAgICAgICBhbGxvd2VkVG9waWNzLnB1c2godG9waWNBcm4pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ3NuczpQdWJsaXNoJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IGFsbG93ZWRUb3BpY3MsXG4gICAgICAgIH0pO1xuICAgICAgICBmbi5hZGRUb1JvbGVQb2xpY3kocm9sZSk7XG4gICAgfVxufVxuIl19