
import unittest
from onepassword.lib.sdk import OnePass  # pylint: disable=E0401
from sklearn.utils import Bunch

from ddt import ddt, data, unpack

needs_mock = unittest.skip("Needs object mock")


@ddt
class OnePassTest(unittest.TestCase):
    """
    Test the OnePass Class
    """

    def setUp(self):
        self.op_obj = OnePass('infra', 'dev', 'TEST-infra-dev')

    @data('config.yml')
    def test__load_config(self, file):
        """
        Validate the config file gets loaded as expected
        """
        res = self.op_obj._OnePass__load_config(file)

        self.assertIsInstance(res['target'], str)
        self.assertIn(res['target'], ['aws', 'azure', 'local'])

        self.assertIsInstance(res['app'], list)
        self.assertIsInstance(res['env'], list)

    @needs_mock
    def test_get_items_by_vault(self):  # pylint: disable=C0116
        pass

    @needs_mock
    def test__fetch_items_by_vault(self):  # pylint: disable=C0116
        pass

    @data(([
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'yw42k64nytt7vjdhayhf4mx5r4',
            'last_edited_by': 'QTYRMQA5ZRBEJBAADTZKF4UKUU',
            'tags': ['dev', 'infra'],
            'title': 'infrastructure-dev',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': '2xncpodd3minfkhkwww73n4iea',
            'last_edited_by': 'C6KBOI42F5GPXFXG5ZQMFEHRNA',
            'tags': ['middleware', 'prod'],
            'title': 'middleware-prod [PLACEHOLDER]',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 7
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'aw7q5vbc32zvb56gd3lczw6rt4',
            'last_edited_by': 'QTYRMQA5ZRBEJBAADTZKF4UKUU',
            'tags': ['dev', 'devops', 'mobile', 'prod', 'stage'],
            'title': 'mobile-common',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'iar62gscs2t3q6jwt4qkwx5qli',
            'last_edited_by': 'QTYRMQA5ZRBEJBAADTZKF4UKUU',
            'tags': ['dev', 'devops', 'prod', 'stage', 'web'],
            'title': 'web-common',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'o6d6uxsoijb765vtcu54i2bbwy',
            'last_edited_by': 'C6KBOI42F5GPXFXG5ZQMFEHRNA',
            'tags': ['dev', 'devops', 'middleware'],
            'title': 'middleware-dev-devops',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 8
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'p5xgwfagzyukx2clq7em4lfosa',
            'last_edited_by': 'C6KBOI42F5GPXFXG5ZQMFEHRNA',
            'tags': ['middleware', 'stage'],
            'title': 'middleware-stage [PLACEHOLDER]',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'pwf7tf6kwekcu7b546uhd5jiaa',
            'last_edited_by': 'C6KBOI42F5GPXFXG5ZQMFEHRNA',
            'tags': ['common', 'devops', 'infra'],
            'title': 'infrastructure-common',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'xzl24c7jcgybdqbesf7z5t7dua',
            'last_edited_by': 'QTYRMQA5ZRBEJBAADTZKF4UKUU',
            'tags': ['devops', 'infra'],
            'title': 'infrastructure-devops',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 2
        })
    ], [
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'yw42k64nytt7vjdhayhf4mx5r4',
            'last_edited_by': 'QTYRMQA5ZRBEJBAADTZKF4UKUU',
            'tags': ['dev', 'infra'],
            'title': 'infrastructure-dev',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        }),
        Bunch(**{
            'category': 'PASSWORD',
            'favorite': False,
            'id': 'pwf7tf6kwekcu7b546uhd5jiaa',
            'last_edited_by': 'C6KBOI42F5GPXFXG5ZQMFEHRNA',
            'tags': ['common', 'devops', 'infra'],
            'title': 'infrastructure-common',
            'trashed': False,
            'urls': None,
            'vault': {'id': 'gzfrlrrqsfzcd6bgjmn42uhjli'},
            'version': 5
        })
    ]))
    @unpack
    def test__filter_items_by_tag(self, item_list: list, expect: list):
        """
        Validate tag filter on 1Pass item response
        """
        filtered_list = self.op_obj._OnePass__filter_items_by_tag(item_list)
        self.assertEqual(filtered_list, expect)

    @needs_mock
    def test_get_env_vars_by_item_ids(self):  # pylint: disable=C0116
        pass

    @needs_mock
    def test__fetch_item_by_id(self):  # pylint: disable=C0116
        pass

    @data(([
        Bunch(**{
            'entropy': None,
            'generate': False,
            'id': 'password',
            'label': 'password',
            'purpose': 'PASSWORD',
            'section': None,
            'totp': None,
            'type': 'CONCEALED',
            'value': None
        }),
        Bunch(**{
            'entropy': None,
            'generate': False,
            'id': 'notesPlain',
            'label': 'notesPlain',
            'purpose': 'NOTES',
            'section': None,
            'totp': None,
            'type': 'STRING',
            'value': None
        }),
        Bunch(**{
            'entropy': None,
            'generate': False,
            'id': 'drhtm5nowekkw56klio6ugwjy4',
            'label': 'SERVICE_PRINCIPAL_APPID',
            'purpose': None,
            'section': {'id': 'Section_umjl7u336wrznf5aiybhw7vkdi'},
            'totp': None,
            'type': 'STRING',
            'value': '9b9a800a-8300-4cd4-a147-18725b2d796e'
        }),
        Bunch(**{
            'entropy': None,
            'generate': False,
            'id': '4x6ijszlrktdhemngxbxr4jql4',
            'label': 'SERVICE_PRINCIPAL_PASSWORD',
            'purpose': None,
            'section': {'id': 'Section_umjl7u336wrznf5aiybhw7vkdi'},
            'totp': None,
            'type': 'CONCEALED',
            'value': '6do8Q~1bIKk4XF0CqVuSym9eZjmw_Il5d.OT_cKo'
        }),
        Bunch(**{
            'entropy': None,
            'generate': False,
            'id': 'bcut2bslvnuuox7aw4fzpfrfnq',
            'label': 'SERVICE_PRINCIPAL_TENANT',
            'purpose': None,
            'section': {'id': 'Section_umjl7u336wrznf5aiybhw7vkdi'},
            'totp': None,
            'type': 'STRING',
            'value': '7edebcbb-82b7-4673-8647-3bf882ee1154'
        }),
        Bunch(**{
            'entropy': None,
            'generate': False,
            'id': 'ueddg46e3xpmelrbux5vtimaj4',
            'label': 'ACR_SERVER',
            'purpose': None,
            'section': {'id': 'Section_umjl7u336wrznf5aiybhw7vkdi'},
            'totp': None,
            'type': 'STRING',
            'value': 'scuserservice.azurecr.io'
        })
    ], {
        'ACR_SERVER': {
            'label': 'ACR_SERVER',
            'type': 'STRING',
            'value': 'scuserservice.azurecr.io'
        },
        'SERVICE_PRINCIPAL_APPID': {
            'label': 'SERVICE_PRINCIPAL_APPID',
            'type': 'STRING',
            'value': '9b9a800a-8300-4cd4-a147-18725b2d796e'
        },
        'SERVICE_PRINCIPAL_PASSWORD': {
            'label': 'SERVICE_PRINCIPAL_PASSWORD',
            'type': 'CONCEALED',
            'value': '6do8Q~1bIKk4XF0CqVuSym9eZjmw_Il5d.OT_cKo'
        },
        'SERVICE_PRINCIPAL_TENANT': {
            'label': 'SERVICE_PRINCIPAL_TENANT',
            'type': 'STRING',
            'value': '7edebcbb-82b7-4673-8647-3bf882ee1154'
        }
    }))
    @unpack
    def test__normalize_vars_from_item(self, filtered_items: list, expect: dict):
        """
        Verify data transformation from 1Pass item to ENV var list
        """
        env_vars = self.op_obj._OnePass__normalize_vars_from_item(filtered_items)
        self.assertEqual(env_vars, expect)
