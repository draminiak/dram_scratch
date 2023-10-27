
import logging
import os
import unittest
from ddt import ddt, file_data
from onepassword.lib.azure import Azure  # pylint: disable=E0401

logger = logging.getLogger()
needs_mock = unittest.skip("Needs object mock")


@ddt
class AzureTest(unittest.TestCase):
    """
    Test the Azure Class
    """

    def setUp(self):
        tenant_id = os.environ.get("AZURE_TENANT_ID", None)
        subscription_id = os.environ.get("AZURE_SUBSCRIPTION_ID", None)
        self.aws_obj = Azure(tenant_id, subscription_id)

    @needs_mock
    def test_create_vault(self):  # pylint: disable=C0116
        pass

    @needs_mock
    def test_load_vault(self):  # pylint: disable=C0116
        pass

    @file_data('data_1pass.json')
    def test__format_env_var(self, secret_store, variables, expect):
        """
        Validate data transformation between 1pass and aws
        """
        logging.info(secret_store)
        for var in variables:
            res = self.aws_obj._Azure__format_env_var(variables[var])
            self.assertEqual(res, expect['azure'][var])

    @needs_mock
    def test__add_secret(self):  # pylint: disable=C0116
        pass
