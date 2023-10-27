"""
Local .env file functions
"""
import logging
import pprint

logger = logging.getLogger()
pp = pprint.PrettyPrinter(indent=4)


def create_dotenv(dotenv_file: str, op_vars: dict, app: str, dry_run: bool):
    """
    Initialization Function
    """
    local_client = LocalDotEnv(dry_run=dry_run)
    local_client.load_file(dotenv_file=dotenv_file, op_vars=op_vars, app=app)


class LocalDotEnv:
    """
    Local file export
    """
    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run

    def load_file(self, dotenv_file: str, op_vars: dict, app: str):
        """
        Write the .env file from exported vars
        """
        if self.dry_run:
            print(f"# {app} vars")
            for k, v in op_vars.items():
                print(f"{k}={v['value']}")
        else:
            with open(file=dotenv_file, mode='w', encoding='UTF-8') as dot_env:
                dot_env.write(f"# {app} vars\n")
                for k, v in op_vars.items():
                    dot_env.write(f"{k}={v['value']}\n")
                dot_env.write("\n\n")
