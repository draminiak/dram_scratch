import boto3
import json
import os
import sys

CLUSTER_NAME = sys.argv[1]
SERVICE_NAME = sys.argv[2]

lambda_client = boto3.client(
    'lambda',
    region_name=os.environ.get('AWS_REGION'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID_LAMBDA_ECS'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY_LAMBDA_ECS'),
)
lambda_function_name = f"{os.getenv('DEPLOY_ENVIRONMENT')}_container_image_update"

print(f'Deploying updated container to ECS:{CLUSTER_NAME}:{SERVICE_NAME} via Lambda function {lambda_function_name}.')

response = lambda_client.invoke(
    FunctionName=lambda_function_name,
    Payload=json.dumps({
        'cluster_name': CLUSTER_NAME,
        'service_name': SERVICE_NAME
    }),
)

data = json.loads(response['Payload'].read().decode("utf-8"))
print(json.dumps(data, indent=4))
