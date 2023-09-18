"""Testing the EmailSend lambda function"""
import boto3
import json
import os
import sys

RECIPIENT = sys.argv[2]
SENDER = sys.argv[2] or os.getenv('LAMBDA_SMTP_SES_SENDER_ADDRESS')

lambda_client = boto3.client(
    'lambda',
    region_name=os.environ.get('AWS_LAMBDA_SES_REGION'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID_LAMBDA_SES'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY_LAMBDA_SES')
)
lambda_function_name = f"{os.getenv('DEPLOY_ENVIRONMENT')}SendEmail"

print(f'Sending test email to {RECIPIENT} using {lambda_function_name} Lambda function.')

response = lambda_client.invoke(
    FunctionName=lambda_function_name,
    Payload=json.dumps({
        'source': SENDER,
        'subject': 'SES email test',
        'body': 'Test email from lambda ses',
        'body_html': '<p>Test <i>email</i> from <b>Lambda SES</b>.</p>',
        'destination': RECIPIENT,
    })
)

data = json.loads(response['Payload'].read().decode("utf-8"))
print(json.dumps(data, indent=4))
