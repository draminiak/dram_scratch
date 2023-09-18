"""Lambda Function to update Ecs Task Container"""
import boto3
import json
import os

client = boto3.client('ecs')


def container_image_update(event, context):
    """
    Replace Ecs container image with a newer version.
    """
    cluster = event['cluster_name']
    service = event['service_name']

    client.update_service(
        cluster=cluster, service=service, forceNewDeployment=True
    )
