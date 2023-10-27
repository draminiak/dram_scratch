
import unittest
from ddt import ddt, file_data
from onepassword.lib.aws import Aws  # pylint: disable=E0401

needs_mock = unittest.skip("Needs object mock")


@ddt
class AwsTest(unittest.TestCase):
    """
    Test the Aws Class
    """

    def setUp(self):
        self.aws_obj = Aws()

    @needs_mock
    def test_load_secret(self):  # pylint: disable=C0116
        pass

    @file_data('data_1pass.json')
    def test__format_env_vars(self, secret_store, variables, expect):
        """
        Validate data transformation between 1pass and aws
        """
        res = self.aws_obj._Aws__format_env_vars(secret_store["name"], variables, secret_store["exists"])
        self.assertEqual(res, expect['aws'])

    @needs_mock
    def test__secret_exists(self):  # pylint: disable=C0116
        pass
