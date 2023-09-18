"""Lambda Function to send emails via SES API"""
import boto3
import json
import os

CHARSET = 'UTF-8'

def send_email(event, context):
    """Send event via SES API"""
    client = boto3.client('ses', region_name=os.environ['AWS_LAMBDA_SES_REGION'])

    message = {
        'Body': {
            'Text': {
                'Charset': CHARSET,
                'Data': event['body']
            }
        },
        'Subject': {
            'Charset': CHARSET,
            'Data': event['subject']
        }
    }

    body_html = event.get('body_html')
    if body_html:
        message['Body']['Html'] = {
            'Charset': CHARSET,
            'Data': body_html
        }

    return client.send_email(
        Destination={
            'ToAddresses': [event['destination']] if isinstance(event["destination"], str) else event['destination']
        },
        Message=message,
        Source=event['source']
    )
