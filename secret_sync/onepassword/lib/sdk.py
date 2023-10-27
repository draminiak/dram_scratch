"""
1Password Interface Class
"""
import yaml
import onepasswordconnectsdk
import pprint

pp = pprint.PrettyPrinter(indent=4)


def export_1pass(app: str, deploy_env: str, vault_id: str) -> tuple[list, str]:
    """
    Initialization Function
    """
    op = OnePass(app, deploy_env, vault_id)
    op_items: list = op.get_items_by_vault()
    return op.get_env_vars_by_item_ids(op_items=op_items), op.target


class OnePass:
    """
    1Password SDK Interface
    """
    def __init__(self, app: str, env: str, vault_id: str):
        self.config: dict = self.__load_config('config.yml')
        assert app in self.config['app']
        assert env in self.config['env']

        self.app: str = app
        self.env: str = env
        self.vault_id: str = vault_id
        self.target: str = self.config['target']
        assert self.app
        assert self.env
        assert self.vault_id
        assert self.target

        self.op_client = onepasswordconnectsdk.client.new_client_from_environment()

    @staticmethod
    def extract_config(cfg: str = "config.yml") -> dict:
        """
        Load the config file.
        """
        return OnePass.__load_config(cfg)

    @staticmethod
    def __load_config(cfg: str) -> dict:
        """
        Load data from a given yaml file (cfg).
        """
        with open(cfg, "r", encoding="utf-8") as raw_data:
            config: dict = yaml.load(raw_data, Loader=yaml.FullLoader)
            return config

    def get_items_by_vault(self) -> list:
        """
        Fetch items from the 1Password vault and filter results by tag
        """
        op_items: list = self.__fetch_items_by_vault()
        filtered_items: list = self.__filter_items_by_tag(op_items)
        # Verify we get at most 2 levels of items; assumed "common" item and/or an env-specific item
        assert len(filtered_items) <= 2
        return filtered_items

    def __fetch_items_by_vault(self) -> list:
        """
        Fetch vault items from 1Password
        """
        return self.op_client.get_items(vault_id=self.vault_id)

    def __filter_items_by_tag(self, op_items: list) -> list:
        """
        Filter vault items by tags
        """
        filtered_items: list = []
        for item in op_items:
            if item.tags is not None and self.app in item.tags and (self.env in item.tags or 'common' in item.tags):
                filtered_items.append(item)
        return filtered_items

    def get_env_vars_by_item_ids(self, op_items: list) -> dict:
        """
        Get 1Password items filtered by env and normalized for cloud host import
        """
        env_vars: dict = {}
        for item in op_items:
            item_data: dict = self.__fetch_item_by_id(item_id=item.id, vault_id=self.vault_id)
            item_vars: dict = self.__normalize_vars_from_item(field_list=item_data.fields)
            # Always overwrite 'common' with env-specific
            if 'common' in item.tags:
                env_vars = dict(list(item_vars.items()) + list(env_vars.items()))
            else:
                env_vars = dict(list(env_vars.items()) + list(item_vars.items()))
        return env_vars

    def __fetch_item_by_id(self, item_id: str, vault_id: str) -> list:
        """
        Fetch item data from 1Password and filter out the cruft
        """
        return self.op_client.get_item(item_id, vault_id)

    @staticmethod
    def __normalize_vars_from_item(field_list: list) -> dict:
        """
        Normalize fields for cloud host import as env vars
        """
        env_vars: dict = {}
        for field in field_list:
            # These are never necessary as they are inherent to the OP vault item "type"
            if field.label in ['notesPlain', 'password']:
                continue
            env_vars.update({
                f'{field.label}': {
                    "label": field.label,
                    "value": field.value if field.value is not None else '',
                    "type": field.type
                }
            })
        return env_vars
