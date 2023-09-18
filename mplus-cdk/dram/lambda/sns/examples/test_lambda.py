import boto3
import json
import os
import sys

TOPIC_ARN = sys.argv[1] or os.environ.get('LAMBDA_SNS_TEST_TOPIC')

lambda_client = boto3.client(
    'lambda',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID_LAMBDA_SNS'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY_LAMBDA_SNS')
)
lambda_function_name = f"{os.getenv('DEPLOY_ENVIRONMENT')}SnsMessage"

print(f'Publish an SNS message to the topic AWS_LAMBDA_SNS_TEST_TOPIC : {TOPIC_ARN} using  {lambda_function_name} Lambda function.')

response = lambda_client.invoke(
    FunctionName=lambda_function_name,
    Payload=json.dumps({
        'subject': 'sns publish test',
        'message': json.dumps({
            'first': 'ima',
            'last': 'person'
        }),
        'topic': TOPIC_ARN,
    }),
)

data = json.loads(response['Payload'].read().decode("utf-8"))
print(json.dumps(data, indent=4))
