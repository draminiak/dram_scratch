"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaFunction = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const stack_1 = require("../stack");
/** Default Config **/
const LAMBDA_DEFAULTS = {
    timeout: cdk.Duration.seconds(30),
    timeoutAlarm: false,
};
/** Class LambdaStack **/
class LambdaFunction extends stack_1.T3Stack {
    constructor(scope, props) {
        super(scope, props);
        this.fnVersion = props.fnVersion || this.unique_version();
    }
    createFunction(props) {
        // Prefix the lambda function name with the deployEnv to avoid naming collisions across deploy environments
        const fnName = props.funcName;
        const fn = new aws_cdk_lib_1.aws_lambda.Function(this, fnName, {
            vpc: props.vpc,
            runtime: props.runtime,
            code: props.code,
            timeout: props.timeout || LAMBDA_DEFAULTS.timeout,
            handler: props.handler,
            functionName: fnName,
            environment: Object.assign(Object.assign({}, (props.environment || {})), { RELEASE_VERSION: this.fnVersion, 
                // AWS_ACCOUNT_ID: cdk.Stack.of(this).account,
                AWS_LAMBDA_SNS_TEST_TOPIC: `arn:aws:sns:${this.region}:${this.account}:devops-test` })
        });
        // // Create a CloudWatch alarm to report when the function timed out
        // const timeoutAlarm = 'timeoutAlarm' in props ? props.timeoutAlarm : LAMBDA_DEFAULTS.timeoutAlarm;
        // if (fn.timeout && timeoutAlarm) {
        //     new cloudwatch.Alarm(this, `${fnName}-TimeoutAlarm`, {
        //         metric: fn.metricDuration().with({
        //             statistic: 'Maximum',
        //         }),
        //         evaluationPeriods: 1,
        //         datapointsToAlarm: 1,
        //         threshold: fn.timeout.toMilliseconds(),
        //         treatMissingData: cloudwatch.TreatMissingData.IGNORE,
        //         alarmName: `${fnName} Function Timeout`,
        //     });
        // }
        // // Policy for invocation
        // this.invokePolicy(props.invocationUser);
        return fn;
    }
    unique_version() {
        const now = new Date();
        return now.getTime().toString();
    }
}
exports.LambdaFunction = LambdaFunction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FHcUI7QUFDckIsb0NBQStDO0FBbUIvQyxzQkFBc0I7QUFDdEIsTUFBTSxlQUFlLEdBQUc7SUFDcEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQUNqQyxZQUFZLEVBQUUsS0FBSztDQUN0QixDQUFDO0FBR0YseUJBQXlCO0FBQ3pCLE1BQWEsY0FBZSxTQUFRLGVBQU87SUFHdkMsWUFBWSxLQUFjLEVBQUUsS0FBdUI7UUFDL0MsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQzlELENBQUM7SUFFUyxjQUFjLENBQUMsS0FBZ0M7UUFDckQsMkdBQTJHO1FBQzNHLE1BQU0sTUFBTSxHQUFXLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFFdEMsTUFBTSxFQUFFLEdBQUcsSUFBSSx3QkFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO1lBQ3pDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztZQUNkLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztZQUN0QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksZUFBZSxDQUFDLE9BQU87WUFDakQsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3RCLFlBQVksRUFBRSxNQUFNO1lBQ3BCLFdBQVcsa0NBQ0osQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxLQUM1QixlQUFlLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQy9CLDhDQUE4QztnQkFDOUMseUJBQXlCLEVBQUUsZUFBZSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLGNBQWMsR0FDdEY7U0FDSixDQUFDLENBQUM7UUFFSCxxRUFBcUU7UUFDckUsb0dBQW9HO1FBQ3BHLG9DQUFvQztRQUNwQyw2REFBNkQ7UUFDN0QsNkNBQTZDO1FBQzdDLG9DQUFvQztRQUNwQyxjQUFjO1FBQ2QsZ0NBQWdDO1FBQ2hDLGdDQUFnQztRQUNoQyxrREFBa0Q7UUFDbEQsZ0VBQWdFO1FBQ2hFLG1EQUFtRDtRQUNuRCxVQUFVO1FBQ1YsSUFBSTtRQUVKLDJCQUEyQjtRQUMzQiwyQ0FBMkM7UUFFM0MsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRVMsY0FBYztRQUNwQixNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3ZCLE9BQU8sR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3BDLENBQUM7Q0FzQko7QUF6RUQsd0NBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7XG4gICAgYXdzX2VjMiBhcyBlYzIsXG4gICAgYXdzX2xhbWJkYSBhcyBsYW1iZGFcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHtUM1N0YWNrLCBUM1N0YWNrUHJvcHN9IGZyb20gXCIuLi9zdGFja1wiO1xuXG4vKiogSW50ZXJmYWNlcyAqKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGFtYmRhU3RhY2tQcm9wcyBleHRlbmRzIFQzU3RhY2tQcm9wcyB7XG4gICAgcmVhZG9ubHkgZm5WZXJzaW9uPzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGFtYmRhQ3JlYXRlRnVuY3Rpb25Qcm9wcyB7XG4gICAgcmVhZG9ubHkgdnBjOiBlYzIuVnBjXG4gICAgcmVhZG9ubHkgcnVudGltZTogbGFtYmRhLlJ1bnRpbWVcbiAgICByZWFkb25seSBjb2RlOiBsYW1iZGEuQ29kZVxuICAgIHJlYWRvbmx5IGhhbmRsZXI6IHN0cmluZ1xuICAgIHJlYWRvbmx5IGZ1bmNOYW1lOiBzdHJpbmdcbiAgICByZWFkb25seSBpbnZvY2F0aW9uVXNlcjogc3RyaW5nXG4gICAgcmVhZG9ubHkgZW52aXJvbm1lbnQ/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9XG4gICAgcmVhZG9ubHkgdGltZW91dD86IGNkay5EdXJhdGlvblxuICAgIHJlYWRvbmx5IHRpbWVvdXRBbGFybT86IGJvb2xlYW5cbn1cblxuLyoqIERlZmF1bHQgQ29uZmlnICoqL1xuY29uc3QgTEFNQkRBX0RFRkFVTFRTID0ge1xuICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB0aW1lb3V0QWxhcm06IGZhbHNlLFxufTtcblxuXG4vKiogQ2xhc3MgTGFtYmRhU3RhY2sgKiovXG5leHBvcnQgY2xhc3MgTGFtYmRhRnVuY3Rpb24gZXh0ZW5kcyBUM1N0YWNrIHtcbiAgICBkZWNsYXJlIGZuVmVyc2lvbjogc3RyaW5nXG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgcHJvcHM6IExhbWJkYVN0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIHByb3BzKTtcbiAgICAgICAgdGhpcy5mblZlcnNpb24gPSBwcm9wcy5mblZlcnNpb24gfHwgdGhpcy51bmlxdWVfdmVyc2lvbigpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjcmVhdGVGdW5jdGlvbihwcm9wczogTGFtYmRhQ3JlYXRlRnVuY3Rpb25Qcm9wcyk6IGxhbWJkYS5GdW5jdGlvbiB7XG4gICAgICAgIC8vIFByZWZpeCB0aGUgbGFtYmRhIGZ1bmN0aW9uIG5hbWUgd2l0aCB0aGUgZGVwbG95RW52IHRvIGF2b2lkIG5hbWluZyBjb2xsaXNpb25zIGFjcm9zcyBkZXBsb3kgZW52aXJvbm1lbnRzXG4gICAgICAgIGNvbnN0IGZuTmFtZTogc3RyaW5nID0gcHJvcHMuZnVuY05hbWU7XG5cbiAgICAgICAgY29uc3QgZm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGZuTmFtZSwge1xuICAgICAgICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICAgICAgICBydW50aW1lOiBwcm9wcy5ydW50aW1lLFxuICAgICAgICAgICAgY29kZTogcHJvcHMuY29kZSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IHByb3BzLnRpbWVvdXQgfHwgTEFNQkRBX0RFRkFVTFRTLnRpbWVvdXQsXG4gICAgICAgICAgICBoYW5kbGVyOiBwcm9wcy5oYW5kbGVyLFxuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOiBmbk5hbWUsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIC4uLihwcm9wcy5lbnZpcm9ubWVudCB8fCB7fSksXG4gICAgICAgICAgICAgICAgUkVMRUFTRV9WRVJTSU9OOiB0aGlzLmZuVmVyc2lvbiwgLy8gUkVGIDogaHR0cHM6Ly93d3cuZGVmaW5lLnJ1bi9wb3N0cy9jZGstbm90LXVwZGF0aW5nLWxhbWJkYS9cbiAgICAgICAgICAgICAgICAvLyBBV1NfQUNDT1VOVF9JRDogY2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnQsXG4gICAgICAgICAgICAgICAgQVdTX0xBTUJEQV9TTlNfVEVTVF9UT1BJQzogYGFybjphd3M6c25zOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpkZXZvcHMtdGVzdGBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gLy8gQ3JlYXRlIGEgQ2xvdWRXYXRjaCBhbGFybSB0byByZXBvcnQgd2hlbiB0aGUgZnVuY3Rpb24gdGltZWQgb3V0XG4gICAgICAgIC8vIGNvbnN0IHRpbWVvdXRBbGFybSA9ICd0aW1lb3V0QWxhcm0nIGluIHByb3BzID8gcHJvcHMudGltZW91dEFsYXJtIDogTEFNQkRBX0RFRkFVTFRTLnRpbWVvdXRBbGFybTtcbiAgICAgICAgLy8gaWYgKGZuLnRpbWVvdXQgJiYgdGltZW91dEFsYXJtKSB7XG4gICAgICAgIC8vICAgICBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBgJHtmbk5hbWV9LVRpbWVvdXRBbGFybWAsIHtcbiAgICAgICAgLy8gICAgICAgICBtZXRyaWM6IGZuLm1ldHJpY0R1cmF0aW9uKCkud2l0aCh7XG4gICAgICAgIC8vICAgICAgICAgICAgIHN0YXRpc3RpYzogJ01heGltdW0nLFxuICAgICAgICAvLyAgICAgICAgIH0pLFxuICAgICAgICAvLyAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICAvLyAgICAgICAgIGRhdGFwb2ludHNUb0FsYXJtOiAxLFxuICAgICAgICAvLyAgICAgICAgIHRocmVzaG9sZDogZm4udGltZW91dC50b01pbGxpc2Vjb25kcygpLFxuICAgICAgICAvLyAgICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5JR05PUkUsXG4gICAgICAgIC8vICAgICAgICAgYWxhcm1OYW1lOiBgJHtmbk5hbWV9IEZ1bmN0aW9uIFRpbWVvdXRgLFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyAvLyBQb2xpY3kgZm9yIGludm9jYXRpb25cbiAgICAgICAgLy8gdGhpcy5pbnZva2VQb2xpY3kocHJvcHMuaW52b2NhdGlvblVzZXIpO1xuXG4gICAgICAgIHJldHVybiBmbjtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdW5pcXVlX3ZlcnNpb24oKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgcmV0dXJuIG5vdy5nZXRUaW1lKCkudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICAvLyBwcm90ZWN0ZWQgaW52b2tlUG9saWN5KGludm9jYXRpb25Vc2VyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyAgICAgbmV3IGlhbS5Qb2xpY3kodGhpcywgJ0xhbWJkYUludm9rZVBvbGljeScsIHtcbiAgICAvLyAgICAgICAgIGRvY3VtZW50OiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAvLyAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgLy8gICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHNpZDogYExhbWJkYVJvbGVgLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6aWFtOjoqOnVzZXIvJHtpbnZvY2F0aW9uVXNlcn1gXSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBcImxhbWJkYTpJbnZva2VBc3luY1wiLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIFwibGFtYmRhOkludm9rZUZ1bmN0aW9uXCIsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdXG4gICAgLy8gICAgICAgICAgICAgICAgIH0pLFxuICAgIC8vICAgICAgICAgICAgIF0sXG4gICAgLy8gICAgICAgICB9KSxcbiAgICAvLyAgICAgICAgIHVzZXJzOiBbXG4gICAgLy8gICAgICAgICAgICAgaWFtLlVzZXIuZnJvbVVzZXJOYW1lKHRoaXMsICdMYW1iZGFJbnZva2VVc2VyJywgaW52b2NhdGlvblVzZXIpLFxuICAgIC8vICAgICAgICAgXSxcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAgIHJldHVybjtcbiAgICAvLyB9XG59XG4iXX0=