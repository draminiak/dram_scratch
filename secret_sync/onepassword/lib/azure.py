"""
Azure Interface Class
"""
import logging
import os
import pprint

logger = logging.getLogger()
pp = pprint.PrettyPrinter(indent=4)

from azure.identity import DefaultAzureCredential
from azure.mgmt.keyvault import KeyVaultManagementClient
from azure.keyvault.secrets import SecretClient


def import_azure(target_kv_store: str, op_vars: dict, dry_run: bool):
    """
    Initialization Function
    """
    tenant_id = os.environ.get("AZURE_TENANT_ID", None)
    subscription_id = os.environ.get("AZURE_SUBSCRIPTION_ID", None)
    assert tenant_id
    assert subscription_id
    logging.info(f'AZURE_TENANT_ID: {tenant_id}')
    logging.info(f'AZURE_SUBSCRIPTION_ID: {subscription_id}')

    rg_name = os.environ.get("AZURE_RESOURCE_GROUP", None)
    principal_id = os.environ.get("AZURE_PRINCIPAL_ID", None)
    region = os.environ.get("AZURE_REGION", None)
    assert rg_name
    assert principal_id
    assert region
    logging.info(f'AZURE_RESOURCE_GROUP: {rg_name}')
    logging.info(f'AZURE_PRINCIPAL_ID: {principal_id}')
    logging.info(f'AZURE_REGION: {region}')

    az_client = Azure(tenant_id, subscription_id, dry_run=dry_run)
    az_client.create_vault(target_kv_store, rg_name, principal_id, region)
    az_client.load_vault(vault_name=target_kv_store, op_vars=op_vars)


class Azure:
    """
    Azure KeyVault Interface
    """
    def __init__(self, tenant_id: str, subscription_id: str, dry_run: bool = False):
        assert tenant_id
        self.tenant_id: str = tenant_id
        self.kv_client = KeyVaultManagementClient(credential=DefaultAzureCredential(),
                                                  subscription_id=subscription_id)
        self.dry_run = dry_run

    def create_vault(self, vault_name, rg_name, principal_id, location) -> None:
        """
        Create KeyVault
        """
        self.kv_client.vaults.begin_create_or_update(
            rg_name,
            vault_name,
            {
                "location": location,
                "properties": {
                    "tenant_id": self.tenant_id,
                    "sku": {
                        "family": "A",
                        "name": "standard"
                    },
                    "access_policies": [
                        {
                            "tenant_id": self.tenant_id,
                            "object_id": principal_id,
                            "permissions": {
                                "secrets": [
                                    "get",
                                    "list",
                                    "set",
                                    "delete",
                                    "backup",
                                    "restore",
                                    "recover",
                                    "purge"
                                ],
                            }
                        }
                    ],
                    "enabled_for_deployment": True,
                    "enabled_for_disk_encryption": True,
                    "enabled_for_template_deployment": True
                }
            },
        ).result()

    def load_vault(self, vault_name: str, op_vars: dict) -> None:
        """
        Add vars to the KeyVault
        """
        logging.warning(f'New AzKV vars to vault... {vault_name}')
        for var in op_vars:
            secret_kwargs = self.__format_env_var(op_vars[var])
            logging.info(secret_kwargs)
            if not self.dry_run:
                self.__add_secret(vault_name, **secret_kwargs)
            else:
                pp.pprint(secret_kwargs)

    @staticmethod
    def __format_env_var(op_var: dict) -> dict:
        """
        Format var for SecretsManager import
        """
        key = op_var['label'].replace("_", "-", )
        value = op_var['value'] if op_var['value'] is not None else 'null'
        content_type = 'password' if op_var['type'] == 'CONCEALED' else 'text/plain'
        return {
            "secret_name": key,
            "secret_value": value,
            "content_type": content_type
        }

    @staticmethod
    def __add_secret(vault_name, secret_name, secret_value, content_type="text/plain") -> None:
        """
        Add a key/value pair to the KeyVault
        """
        vault_url = f"https://{vault_name}.vault.azure.net/"
        client = SecretClient(vault_url=vault_url, credential=DefaultAzureCredential())
        client.set_secret(name=secret_name, value=secret_value, content_type=content_type)
