"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcrStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const stack_1 = require("../stack");
class EcrStack extends stack_1.T3Stack {
    constructor(scope, props) {
        super(scope, props);
        this.repos = {};
        const kmsKey = this.kmsKey(props.kmsKeyArn);
        for (let repoName of props.repoNames) {
            repoName = [this.clientId, this.deployEnv, repoName].filter(Boolean).join('-').toLowerCase();
            this.repos[repoName] = this.createRepo(repoName, kmsKey);
        }
    }
    createRepo(repoName, kmsKey) {
        return new aws_cdk_lib_1.aws_ecr.Repository(this, `EcrRepo${repoName}`, {
            repositoryName: repoName,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            encryptionKey: kmsKey,
            imageScanOnPush: true,
            lifecycleRules: [
                {
                    rulePriority: 1,
                    description: "Delete untagged images",
                    tagStatus: aws_cdk_lib_1.aws_ecr.TagStatus.UNTAGGED,
                    maxImageCount: 1,
                },
                {
                    rulePriority: 2,
                    description: "Keep only last 25 tagged images",
                    tagStatus: aws_cdk_lib_1.aws_ecr.TagStatus.TAGGED,
                    tagPrefixList: ['v'],
                    maxImageCount: 25,
                },
            ]
        });
    }
}
exports.EcrStack = EcrStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDZDQUlxQjtBQUNyQixvQ0FBK0M7QUFPL0MsTUFBYSxRQUFTLFNBQVEsZUFBTztJQUdqQyxZQUFZLEtBQWMsRUFBRSxLQUFvQjtRQUM1QyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLEtBQUksSUFBSSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRTtZQUNqQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3RixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzVEO0lBQ0wsQ0FBQztJQUVELFVBQVUsQ0FBQyxRQUFnQixFQUFFLE1BQWdCO1FBQ3pDLE9BQU8sSUFBSSxxQkFBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxRQUFRLEVBQUUsRUFBRTtZQUNsRCxjQUFjLEVBQUUsUUFBUTtZQUN4QixhQUFhLEVBQUUsMkJBQWEsQ0FBQyxNQUFNO1lBQ25DLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGNBQWMsRUFBRTtnQkFDWjtvQkFDSSxZQUFZLEVBQUUsQ0FBQztvQkFDZixXQUFXLEVBQUUsd0JBQXdCO29CQUNyQyxTQUFTLEVBQUUscUJBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUTtvQkFDakMsYUFBYSxFQUFFLENBQUM7aUJBQ25CO2dCQUNEO29CQUNJLFlBQVksRUFBRSxDQUFDO29CQUNmLFdBQVcsRUFBRSxpQ0FBaUM7b0JBQzlDLFNBQVMsRUFBRSxxQkFBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNO29CQUMvQixhQUFhLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3BCLGFBQWEsRUFBRSxFQUFFO2lCQUNwQjthQUNKO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBcENELDRCQW9DQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQge1xuICAgIGF3c19lY3IgYXMgZWNyLFxuICAgIGF3c19rbXMgYXMga21zLFxuICAgIFJlbW92YWxQb2xpY3lcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHtUM1N0YWNrLCBUM1N0YWNrUHJvcHN9IGZyb20gXCIuLi9zdGFja1wiO1xuXG5pbnRlcmZhY2UgRWNyU3RhY2tQcm9wcyBleHRlbmRzIFQzU3RhY2tQcm9wcyB7XG4gICAgcmVhZG9ubHkga21zS2V5QXJuPzogc3RyaW5nXG4gICAgcmVhZG9ubHkgcmVwb05hbWVzOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgY2xhc3MgRWNyU3RhY2sgZXh0ZW5kcyBUM1N0YWNrIHtcbiAgICBkZWNsYXJlIHJlcG9zOiB7IFtrZXk6IHN0cmluZ106IGVjci5SZXBvc2l0b3J5IH1cblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBwcm9wczogRWNyU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgcHJvcHMpO1xuICAgICAgICB0aGlzLnJlcG9zID0ge307XG4gICAgICAgIGNvbnN0IGttc0tleSA9IHRoaXMua21zS2V5KHByb3BzLmttc0tleUFybik7XG4gICAgICAgIGZvcihsZXQgcmVwb05hbWUgb2YgcHJvcHMucmVwb05hbWVzKSB7XG4gICAgICAgICAgICByZXBvTmFtZSA9IFt0aGlzLmNsaWVudElkLCB0aGlzLmRlcGxveUVudiwgcmVwb05hbWVdLmZpbHRlcihCb29sZWFuKS5qb2luKCctJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMucmVwb3NbcmVwb05hbWVdID0gdGhpcy5jcmVhdGVSZXBvKHJlcG9OYW1lLCBrbXNLZXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlUmVwbyhyZXBvTmFtZTogc3RyaW5nLCBrbXNLZXk6IGttcy5JS2V5KTogZWNyLlJlcG9zaXRvcnkge1xuICAgICAgICByZXR1cm4gbmV3IGVjci5SZXBvc2l0b3J5KHRoaXMsIGBFY3JSZXBvJHtyZXBvTmFtZX1gLCB7XG4gICAgICAgICAgICByZXBvc2l0b3J5TmFtZTogcmVwb05hbWUsXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgICAgICAgIGVuY3J5cHRpb25LZXk6IGttc0tleSxcbiAgICAgICAgICAgIGltYWdlU2Nhbk9uUHVzaDogdHJ1ZSxcbiAgICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJpb3JpdHk6IDEsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRlbGV0ZSB1bnRhZ2dlZCBpbWFnZXNcIixcbiAgICAgICAgICAgICAgICAgICAgdGFnU3RhdHVzOiBlY3IuVGFnU3RhdHVzLlVOVEFHR0VELFxuICAgICAgICAgICAgICAgICAgICBtYXhJbWFnZUNvdW50OiAxLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBydWxlUHJpb3JpdHk6IDIsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIktlZXAgb25seSBsYXN0IDI1IHRhZ2dlZCBpbWFnZXNcIixcbiAgICAgICAgICAgICAgICAgICAgdGFnU3RhdHVzOiBlY3IuVGFnU3RhdHVzLlRBR0dFRCxcbiAgICAgICAgICAgICAgICAgICAgdGFnUHJlZml4TGlzdDogWyd2J10sXG4gICAgICAgICAgICAgICAgICAgIG1heEltYWdlQ291bnQ6IDI1LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==