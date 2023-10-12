"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcsLambdaStack = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda_1 = require("../lambda");
const path = require("path");
const ECS_DEFAULTS = {
    runtime: aws_cdk_lib_1.aws_lambda.Runtime.PYTHON_3_9,
    code: aws_cdk_lib_1.aws_lambda.Code.fromAsset(path.join(__dirname, '../../../dram/lambda/ecs')),
    function: 'container_image_update',
    invokeUserBase: 'fn-ecs',
    timeout: cdk.Duration.seconds(30),
};
/** Class EcsLambdaStack **/
class EcsLambdaStack extends lambda_1.LambdaStack {
    constructor(scope, props) {
        super(scope, props);
        const ecsFunction = ECS_DEFAULTS.function;
        const ecsInvokeUser = `${this.clientId}-${this.deployEnv}-${ECS_DEFAULTS.invokeUserBase}`;
        const lambdaFunction = props.deployEnv + '_' + ecsFunction;
        // Create the user
        // new iam.User(this, `EcsLambda-${ECS_DEFAULTS.invokeUserBase}`, {
        //     userName: ecsInvokeUser,
        // });
        const createProps = {
            vpc: props.vpc,
            runtime: props.runtime || ECS_DEFAULTS.runtime,
            code: props.code || ECS_DEFAULTS.code,
            environment: {},
            timeout: props.timeout || ECS_DEFAULTS.timeout,
            timeoutAlarm: true,
            handler: 'handler.' + ecsFunction,
            funcName: lambdaFunction,
            invocationUser: ecsInvokeUser
        };
        // Function for updating ECS
        const ecrUpdate = this.createFunction(createProps);
        this.createRole(ecrUpdate);
    }
    createRole(fn) {
        const role = new aws_cdk_lib_1.aws_iam.PolicyStatement({
            effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
            actions: [
                // "ecs:DescribeServices",
                "ecs:UpdateService",
            ],
            resources: [
                `arn:aws:ecs:${this.region}:${cdk.Stack.of(this).account}:*`,
            ],
        });
        fn.addToRolePolicy(role);
    }
}
exports.EcsLambdaStack = EcsLambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FBaUU7QUFDakUsc0NBQW1GO0FBQ25GLDZCQUE4QjtBQVM5QixNQUFNLFlBQVksR0FBRztJQUNqQixPQUFPLEVBQUUsd0JBQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtJQUNsQyxJQUFJLEVBQUUsd0JBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDN0UsUUFBUSxFQUFFLHdCQUF3QjtJQUNsQyxjQUFjLEVBQUUsUUFBUTtJQUN4QixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0NBQ3BDLENBQUM7QUFFRiw0QkFBNEI7QUFDNUIsTUFBYSxjQUFlLFNBQVEsb0JBQVc7SUFDM0MsWUFBWSxLQUFjLEVBQUUsS0FBMEI7UUFDbEQsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVwQixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO1FBQzFDLE1BQU0sYUFBYSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxRixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUE7UUFFMUQsa0JBQWtCO1FBQ2xCLG1FQUFtRTtRQUNuRSwrQkFBK0I7UUFDL0IsTUFBTTtRQUVOLE1BQU0sV0FBVyxHQUE4QjtZQUMzQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDZCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxZQUFZLENBQUMsT0FBTztZQUM5QyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxZQUFZLENBQUMsSUFBSTtZQUNyQyxXQUFXLEVBQUUsRUFBRTtZQUNmLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPO1lBQzlDLFlBQVksRUFBRSxJQUFJO1lBQ2xCLE9BQU8sRUFBRSxVQUFVLEdBQUcsV0FBVztZQUNqQyxRQUFRLEVBQUUsY0FBYztZQUN4QixjQUFjLEVBQUUsYUFBYTtTQUNoQyxDQUFDO1FBRUYsNEJBQTRCO1FBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU8sVUFBVSxDQUFDLEVBQW1CO1FBQ2xDLE1BQU0sSUFBSSxHQUFHLElBQUkscUJBQUcsQ0FBQyxlQUFlLENBQUM7WUFDakMsTUFBTSxFQUFFLHFCQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFO2dCQUNMLDBCQUEwQjtnQkFDMUIsbUJBQW1CO2FBQ3RCO1lBQ0QsU0FBUyxFQUFFO2dCQUNQLGVBQWUsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUk7YUFDL0Q7U0FDSixDQUFDLENBQUM7UUFDSCxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7Q0FDSjtBQTNDRCx3Q0EyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQge2F3c19pYW0gYXMgaWFtLCBhd3NfbGFtYmRhIGFzIGxhbWJkYX0gZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQge0xhbWJkYUNyZWF0ZUZ1bmN0aW9uUHJvcHMsIExhbWJkYVN0YWNrLCBMYW1iZGFTdGFja1Byb3BzfSBmcm9tIFwiLi4vbGFtYmRhXCI7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuLyoqIEludGVyZmFjZXMgJiBEZWZhdWx0IENvbmZpZyAqKi9cbmV4cG9ydCBpbnRlcmZhY2UgRWNzTGFtZGRhU3RhY2tQcm9wcyBleHRlbmRzIExhbWJkYVN0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IHJ1bnRpbWU/OiBsYW1iZGEuUnVudGltZSAgIC8vIHB5dGhvbiB2ZXJzaW9uXG4gICAgcmVhZG9ubHkgY29kZT86IGxhbWJkYS5Db2RlICAgICAgICAgLy8gcGF0aCB0byBweXRob24gaGFuZGxlciBmaWxlIChoYW5kbGVyLnB5KVxuICAgIHJlYWRvbmx5IHRpbWVvdXQ/OiBjZGsuRHVyYXRpb24gICAgIC8vIG1heCBleGVjdXRpb24gdGltZVxufVxuXG5jb25zdCBFQ1NfREVGQVVMVFMgPSB7XG4gICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2RyYW0vbGFtYmRhL2VjcycpKSxcbiAgICBmdW5jdGlvbjogJ2NvbnRhaW5lcl9pbWFnZV91cGRhdGUnLCAgLy8gZnVuY3Rpb24gbmFtZSBpbnNpZGUgdGhlIGhhbmRsZXIgZmlsZVxuICAgIGludm9rZVVzZXJCYXNlOiAnZm4tZWNzJyxcbiAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG59O1xuXG4vKiogQ2xhc3MgRWNzTGFtYmRhU3RhY2sgKiovXG5leHBvcnQgY2xhc3MgRWNzTGFtYmRhU3RhY2sgZXh0ZW5kcyBMYW1iZGFTdGFjayB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIHByb3BzOiBFY3NMYW1kZGFTdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBwcm9wcyk7XG5cbiAgICAgICAgY29uc3QgZWNzRnVuY3Rpb24gPSBFQ1NfREVGQVVMVFMuZnVuY3Rpb247XG4gICAgICAgIGNvbnN0IGVjc0ludm9rZVVzZXIgPSBgJHt0aGlzLmNsaWVudElkfS0ke3RoaXMuZGVwbG95RW52fS0ke0VDU19ERUZBVUxUUy5pbnZva2VVc2VyQmFzZX1gO1xuICAgICAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IHByb3BzLmRlcGxveUVudiArICdfJyArIGVjc0Z1bmN0aW9uXG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSB1c2VyXG4gICAgICAgIC8vIG5ldyBpYW0uVXNlcih0aGlzLCBgRWNzTGFtYmRhLSR7RUNTX0RFRkFVTFRTLmludm9rZVVzZXJCYXNlfWAsIHtcbiAgICAgICAgLy8gICAgIHVzZXJOYW1lOiBlY3NJbnZva2VVc2VyLFxuICAgICAgICAvLyB9KTtcblxuICAgICAgICBjb25zdCBjcmVhdGVQcm9wczogTGFtYmRhQ3JlYXRlRnVuY3Rpb25Qcm9wcyA9IHtcbiAgICAgICAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgICAgICAgcnVudGltZTogcHJvcHMucnVudGltZSB8fCBFQ1NfREVGQVVMVFMucnVudGltZSxcbiAgICAgICAgICAgIGNvZGU6IHByb3BzLmNvZGUgfHwgRUNTX0RFRkFVTFRTLmNvZGUsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge30sXG4gICAgICAgICAgICB0aW1lb3V0OiBwcm9wcy50aW1lb3V0IHx8IEVDU19ERUZBVUxUUy50aW1lb3V0LFxuICAgICAgICAgICAgdGltZW91dEFsYXJtOiB0cnVlLFxuICAgICAgICAgICAgaGFuZGxlcjogJ2hhbmRsZXIuJyArIGVjc0Z1bmN0aW9uLFxuICAgICAgICAgICAgZnVuY05hbWU6IGxhbWJkYUZ1bmN0aW9uLFxuICAgICAgICAgICAgaW52b2NhdGlvblVzZXI6IGVjc0ludm9rZVVzZXJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBGdW5jdGlvbiBmb3IgdXBkYXRpbmcgRUNTXG4gICAgICAgIGNvbnN0IGVjclVwZGF0ZSA9IHRoaXMuY3JlYXRlRnVuY3Rpb24oY3JlYXRlUHJvcHMpO1xuICAgICAgICB0aGlzLmNyZWF0ZVJvbGUoZWNyVXBkYXRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVJvbGUoZm46IGxhbWJkYS5GdW5jdGlvbikge1xuICAgICAgICBjb25zdCByb2xlID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgIC8vIFwiZWNzOkRlc2NyaWJlU2VydmljZXNcIixcbiAgICAgICAgICAgICAgICBcImVjczpVcGRhdGVTZXJ2aWNlXCIsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYGFybjphd3M6ZWNzOiR7dGhpcy5yZWdpb259OiR7Y2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnR9OipgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGZuLmFkZFRvUm9sZVBvbGljeShyb2xlKTtcbiAgICB9XG59XG4iXX0=