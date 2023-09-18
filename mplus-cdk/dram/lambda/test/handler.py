import boto3
import json
import os

def test_me(event, context):
    """
    Generic Response
    """
    print('## ENVIRONMENT VARIABLES')
    print(os.environ)
    print('## EVENT')
    print(event)

    # endpoint payload
    client_id = event['clientId']
    trigger = event['trigger']

    # default error response
    body = {"input": event, "message": "Lambda test_me() FAILED"}
    status_code = 400

    # success messages
    if trigger == 'logging':
        body = {"input": event, "message": "Lambda test_me() SUCCESS"}
        status_code = 200

    print(f'## EVENT (app=lambda, trigger={trigger}, clientId={client_id}) : {status_code}')
    return {'status_code': status_code, 'message': json.dumps(body)}
