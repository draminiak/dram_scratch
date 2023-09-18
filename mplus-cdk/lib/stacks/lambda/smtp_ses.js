"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpSesLambdaStack = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda_1 = require("../lambda");
const path = require("path");
const SMTP_SES_DEFAULTS = {
    runtime: aws_cdk_lib_1.aws_lambda.Runtime.PYTHON_3_9,
    code: aws_cdk_lib_1.aws_lambda.Code.fromAsset(path.join(__dirname, '../../../dram/lambda/smtp_ses')),
    timeout: cdk.Duration.seconds(30),
};
/** Class SmtpSesLambdaStack **/
class SmtpSesLambdaStack extends lambda_1.LambdaStack {
    constructor(scope, props) {
        super(scope, props);
        const createProps = {
            vpc: props.vpc,
            runtime: props.runtime || SMTP_SES_DEFAULTS.runtime,
            code: props.code || SMTP_SES_DEFAULTS.code,
            environment: {
                AWS_LAMBDA_SES_REGION: props.sesRegion
            },
            timeout: props.timeout || SMTP_SES_DEFAULTS.timeout,
            timeoutAlarm: true,
            handler: 'handler.send_email',
            funcName: props.deployEnv + 'SendEmail',
            invocationUser: 'fn-smtp-ses' // IAM user created manually in the aws console
        };
        // Function for sending emails via SES
        const sendEmail = this.createFunction(createProps);
        this.createRole(sendEmail, props.verifiedIdentities, props.sesRegion);
    }
    createRole(fn, verifiedIdentities, region) {
        // Add permissions to the Lambda function to send Emails
        const verifiedSenderResources = [];
        for (const source of verifiedIdentities) {
            verifiedSenderResources.push(`arn:aws:ses:${region}:${cdk.Stack.of(this).account}:identity/${source}`);
        }
        const role = new aws_cdk_lib_1.aws_iam.PolicyStatement({
            effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
            actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
                'ses:SendTemplatedEmail',
            ],
            resources: verifiedSenderResources,
        });
        fn.addToRolePolicy(role);
    }
}
exports.SmtpSesLambdaStack = SmtpSesLambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic210cF9zZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzbXRwX3Nlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQWlFO0FBQ2pFLHNDQUFtRjtBQUNuRiw2QkFBOEI7QUFXOUIsTUFBTSxpQkFBaUIsR0FBRztJQUN0QixPQUFPLEVBQUUsd0JBQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtJQUNsQyxJQUFJLEVBQUUsd0JBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLCtCQUErQixDQUFDLENBQUM7SUFDbEYsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztDQUNwQyxDQUFDO0FBRUYsZ0NBQWdDO0FBQ2hDLE1BQWEsa0JBQW1CLFNBQVEsb0JBQVc7SUFDL0MsWUFBWSxLQUFjLEVBQUUsS0FBd0I7UUFDaEQsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVwQixNQUFNLFdBQVcsR0FBOEI7WUFDM0MsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO1lBQ2QsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksaUJBQWlCLENBQUMsT0FBTztZQUNuRCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxJQUFJO1lBQzFDLFdBQVcsRUFBRTtnQkFDVCxxQkFBcUIsRUFBRSxLQUFLLENBQUMsU0FBUzthQUN6QztZQUNELE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLE9BQU87WUFDbkQsWUFBWSxFQUFFLElBQUk7WUFDbEIsT0FBTyxFQUFFLG9CQUFvQjtZQUM3QixRQUFRLEVBQUUsS0FBSyxDQUFDLFNBQVMsR0FBRyxXQUFXO1lBQ3ZDLGNBQWMsRUFBRSxhQUFhLENBQUMsK0NBQStDO1NBQ2hGLENBQUM7UUFFRixzQ0FBc0M7UUFDdEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFTyxVQUFVLENBQUMsRUFBbUIsRUFBRSxrQkFBNEIsRUFBRSxNQUFjO1FBQ2hGLHdEQUF3RDtRQUN4RCxNQUFNLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztRQUNuQyxLQUFLLE1BQU0sTUFBTSxJQUFJLGtCQUFrQixFQUFFO1lBQ3JDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxlQUFlLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLGFBQWEsTUFBTSxFQUFFLENBQUMsQ0FBQztTQUMxRztRQUVELE1BQU0sSUFBSSxHQUFHLElBQUkscUJBQUcsQ0FBQyxlQUFlLENBQUM7WUFDakMsTUFBTSxFQUFFLHFCQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxFQUFFO2dCQUNMLGVBQWU7Z0JBQ2Ysa0JBQWtCO2dCQUNsQix3QkFBd0I7YUFDM0I7WUFDRCxTQUFTLEVBQUUsdUJBQXVCO1NBQ3JDLENBQUMsQ0FBQztRQUNILEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUNKO0FBekNELGdEQXlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7YXdzX2lhbSBhcyBpYW0sIGF3c19sYW1iZGEgYXMgbGFtYmRhfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7TGFtYmRhQ3JlYXRlRnVuY3Rpb25Qcm9wcywgTGFtYmRhU3RhY2ssIExhbWJkYVN0YWNrUHJvcHN9IGZyb20gXCIuLi9sYW1iZGFcIjtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG4vKiogQ2xhc3MgU210cFNlc0xhbWJkYVN0YWNrICoqL1xuZXhwb3J0IGludGVyZmFjZSBTbXRwU2VzU3RhY2tQcm9wcyBleHRlbmRzIExhbWJkYVN0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IHNlc1JlZ2lvbjogc3RyaW5nXG4gICAgcmVhZG9ubHkgdmVyaWZpZWRJZGVudGl0aWVzOiBzdHJpbmdbXSAvLyB2YWxpZGF0ZWQgc291cmNlcyBpbiBTRVNcbiAgICByZWFkb25seSBydW50aW1lPzogbGFtYmRhLlJ1bnRpbWUgICAvLyBweXRob24gdmVyc2lvblxuICAgIHJlYWRvbmx5IGNvZGU/OiBsYW1iZGEuQ29kZSAgICAgICAgIC8vIHBhdGggdG8gcHl0aG9uIGhhbmRsZXIgZmlsZSAoaGFuZGxlci5weSlcbiAgICByZWFkb25seSB0aW1lb3V0PzogY2RrLkR1cmF0aW9uICAgICAvLyBtYXggZXhlY3V0aW9uIHRpbWVcbn1cblxuY29uc3QgU01UUF9TRVNfREVGQVVMVFMgPSB7XG4gICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2RyYW0vbGFtYmRhL3NtdHBfc2VzJykpLFxuICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbn07XG5cbi8qKiBDbGFzcyBTbXRwU2VzTGFtYmRhU3RhY2sgKiovXG5leHBvcnQgY2xhc3MgU210cFNlc0xhbWJkYVN0YWNrIGV4dGVuZHMgTGFtYmRhU3RhY2sge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBwcm9wczogU210cFNlc1N0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIHByb3BzKTtcblxuICAgICAgICBjb25zdCBjcmVhdGVQcm9wczogTGFtYmRhQ3JlYXRlRnVuY3Rpb25Qcm9wcyA9IHtcbiAgICAgICAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgICAgICAgcnVudGltZTogcHJvcHMucnVudGltZSB8fCBTTVRQX1NFU19ERUZBVUxUUy5ydW50aW1lLFxuICAgICAgICAgICAgY29kZTogcHJvcHMuY29kZSB8fCBTTVRQX1NFU19ERUZBVUxUUy5jb2RlLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgICAgICBBV1NfTEFNQkRBX1NFU19SRUdJT046IHByb3BzLnNlc1JlZ2lvblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IHByb3BzLnRpbWVvdXQgfHwgU01UUF9TRVNfREVGQVVMVFMudGltZW91dCxcbiAgICAgICAgICAgIHRpbWVvdXRBbGFybTogdHJ1ZSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdoYW5kbGVyLnNlbmRfZW1haWwnLFxuICAgICAgICAgICAgZnVuY05hbWU6IHByb3BzLmRlcGxveUVudiArICdTZW5kRW1haWwnLFxuICAgICAgICAgICAgaW52b2NhdGlvblVzZXI6ICdmbi1zbXRwLXNlcycgLy8gSUFNIHVzZXIgY3JlYXRlZCBtYW51YWxseSBpbiB0aGUgYXdzIGNvbnNvbGVcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBGdW5jdGlvbiBmb3Igc2VuZGluZyBlbWFpbHMgdmlhIFNFU1xuICAgICAgICBjb25zdCBzZW5kRW1haWwgPSB0aGlzLmNyZWF0ZUZ1bmN0aW9uKGNyZWF0ZVByb3BzKTtcbiAgICAgICAgdGhpcy5jcmVhdGVSb2xlKHNlbmRFbWFpbCwgcHJvcHMudmVyaWZpZWRJZGVudGl0aWVzLCBwcm9wcy5zZXNSZWdpb24pO1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlUm9sZShmbjogbGFtYmRhLkZ1bmN0aW9uLCB2ZXJpZmllZElkZW50aXRpZXM6IHN0cmluZ1tdLCByZWdpb246IHN0cmluZykge1xuICAgICAgICAvLyBBZGQgcGVybWlzc2lvbnMgdG8gdGhlIExhbWJkYSBmdW5jdGlvbiB0byBzZW5kIEVtYWlsc1xuICAgICAgICBjb25zdCB2ZXJpZmllZFNlbmRlclJlc291cmNlcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiB2ZXJpZmllZElkZW50aXRpZXMpIHtcbiAgICAgICAgICAgIHZlcmlmaWVkU2VuZGVyUmVzb3VyY2VzLnB1c2goYGFybjphd3M6c2VzOiR7cmVnaW9ufToke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fTppZGVudGl0eS8ke3NvdXJjZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ3NlczpTZW5kRW1haWwnLFxuICAgICAgICAgICAgICAgICdzZXM6U2VuZFJhd0VtYWlsJyxcbiAgICAgICAgICAgICAgICAnc2VzOlNlbmRUZW1wbGF0ZWRFbWFpbCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiB2ZXJpZmllZFNlbmRlclJlc291cmNlcyxcbiAgICAgICAgfSk7XG4gICAgICAgIGZuLmFkZFRvUm9sZVBvbGljeShyb2xlKTtcbiAgICB9XG59XG4iXX0=