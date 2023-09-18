"""Lambda Function to send messages via SNS API"""
import boto3
import json
import os

'''
Publish a message to SNS
'''
def publish_message(event, context):
    """Send event via SES API"""
    client = boto3.client('sns')

    return client.publish(
        TopicArn=event['topic'],
        Message=event['message'],
        Subject=event['subject'] if event['subject'] else 'no subject',
    )

'''
Topic
'''
# def sns_topic_test(event, context, topicName):
#     sns_topic_create(event, context, topicName)
#     sns_topic_delete(event, context, topicArn)
#
# def sns_topic_create(event, context, topicName):
#     client = boto3.client("sns")
#     try:
#         response = client.create_topic(Name=topicName)
#     except Exception as e:
#         return {'status_code': 400, 'message': str(e)}
#     else:
#         return {'status_code': 200, 'message': response}
#
# def sns_topic_delete(event, context, topicArn):
#     client = boto3.client("sns")
#     try:
#         response = client.delete_topic(TopicArn=topicArn)
#     except Exception as e:
#         return {'status_code': 400, 'message': str(e)}
#     else:
#         return {'status_code': 200, 'message': response}


'''
Subscribe
'''
# def sns_subscribe(event, context):
#     try:
#         topic.subscribe(
#             TopicArn=event['topic'],
#             Protocol=event['protocol'],
#             Endpoint=event['endpoint'],
#             ReturnSubscriptionArn=True
#         )
#     except Exception as e:
#         return {'status_code': 400, 'message': str(e)}
#     else:
#         return {'status_code': 200}

# def sns_unsubscribe(event, context):
#     subscription_arn = event['subscriptionArn']
#     client = boto3.client("sns")
#     client.unsubscribe(
#         SubscriptionArn=subscription_arn
#     )
#     return {'status_code': 200}
