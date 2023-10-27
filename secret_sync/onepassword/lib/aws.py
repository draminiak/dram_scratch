"""
Aws Interface Class
"""
import boto3
import json
import logging
import os
import pprint

logger = logging.getLogger()
pp = pprint.PrettyPrinter(indent=4)


def import_aws(target_kv_store: str, op_vars: dict, dry_run: bool):
    """
    Initialization Function
    """
    region = os.environ.get("AWS_REGION", None)
    aws_client = Aws(region=region, dry_run=dry_run)
    aws_client.load_secret(secret_name=target_kv_store, op_vars=op_vars)


class Aws:
    """
    Aws Cloud Interface

    SecretsManager vs ParameterStore
        * https://medium.com/awesome-cloud/aws-difference-between-secrets-manager-and-parameter-store-systems-manager-f02686604eae  #noqa
    """
    def __init__(self, region: str, resource: str = "secretsmanager", dry_run: bool = False):
        assert resource in ['secretsmanager', 'ssm'], "Invalid Aws 'resource' param"
        self.resource = resource
        self.aws_client = boto3.client(self.resource, region_name=region)
        self.region = region
        self.dry_run = dry_run

    def load_secret(self, secret_name: str, op_vars: dict) -> None:
        """
        Add vars to SecretsManager
        """
        assert self.resource == 'secretsmanager', "Aws 'resource' must be 'secretsmanager' to call load_secret()"
        logging.warning(f'New Aws:SecretsManager vars to vault... {secret_name}')

        # Check if the secret_name exists yet in SecretsManager
        #   FALSE if dry_run=True so we don't make the extraneous calls
        secret_exists = False if self.dry_run else self.__secret_exists(secret_name)

        # Normalize 1pass response for SecretManager
        kwargs = self.__format_env_vars(secret_name, op_vars, secret_exists)

        # Create/Update SecretsManager
        if not self.dry_run:
            if secret_exists:
                self.aws_client.update_secret(**kwargs)
            else:
                self.aws_client.create_secret(**kwargs)
        else:
            pp.pprint(json.loads(kwargs["SecretString"]))

    @staticmethod
    def __format_env_vars(secret_name: str, op_vars: dict, secret_exists: bool) -> dict:
        """
        Format vars for SecretsManager import
        """
        env_vars = {}
        for var in op_vars:
            env_vars[op_vars[var]['label']] = op_vars[var]['value']

        # Update existing or create new secret
        kwargs = {
            "SecretString": json.dumps(env_vars)
        }
        if secret_exists:
            kwargs["SecretId"] = secret_name
        else:
            kwargs["Name"] = secret_name
        return kwargs

    def __secret_exists(self, secret_name: str) -> bool:
        """
        Check if the secret exists
        """
        logging.warning(f'AWS_REGION: {os.environ.get("AWS_REGION", "")}')
        secret_list = self.aws_client.list_secrets(Filters=[
            {
                'Key': 'name',
                'Values': [secret_name]
            }
        ])
        if len(secret_list['SecretList']) > 0:
            for secret in secret_list['SecretList']:
                if secret['Name'] == secret_name:
                    return True
        return False
