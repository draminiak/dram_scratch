
import unittest
from ddt import ddt, file_data
from onepassword.lib.local import LocalDotEnv  # pylint: disable=E0401
from unittest.mock import patch, mock_open


@ddt
class LocalTest(unittest.TestCase):
    """
    Test the Aws Class
    """

    def setUp(self):
        self.local_obj = LocalDotEnv()

    @file_data('data_1pass.json')
    def test_LocalDotEnv(self, secret_store, variables, expect):
        """
        Validate data for output to file
        """
        open_mock = mock_open()
        outfile = secret_store['name']
        with patch("onepassword.lib.local.open", open_mock, create=True):
            self.local_obj.load_file(dotenv_file=outfile, op_vars=variables, app="web")
        open_mock.assert_called_with(**expect['local'])
        self.assertEqual(secret_store['name'], expect['local']['file'])
