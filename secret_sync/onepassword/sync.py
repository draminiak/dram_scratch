"""
Sync 1Password vars to various cloud target key/value pair stores
"""
import argparse
import logging
import os
import pprint

from lib.aws import import_aws
from lib.azure import import_azure
from lib.local import create_dotenv
from lib.sdk import export_1pass

log_level = os.environ.get('LOG_LEVEL', 'WARNING').upper()
logging.warning(f'LOG-LEVEL: {log_level}')
logging.basicConfig(format='%(process)d-%(levelname)s -- %(message)s', level=log_level)
pp = pprint.PrettyPrinter(indent=4)

parser = argparse.ArgumentParser(
    prog='1Password Sync',
    description='Sync environment variables from 1Pass to a given cloud host or to a local .env file',
    epilog='Need Help? Check out the README or email devops@t-3.com')
parser.add_argument('app', type=str)
parser.add_argument('env', type=str)
parser.add_argument('-d', '--disable-dry-run', dest='disable_dry_run', type=bool, default=False,
                    action=argparse.BooleanOptionalAction)


def main():
    """
    Main script body
    """
    #
    # Load CLI args
    #
    args = parser.parse_args()
    app = args.app
    deploy_env = args.env
    dry_run = not args.disable_dry_run
    logging.warning(f'APP: {app}')
    logging.warning(f'DEPLOY_ENV: {deploy_env}')
    logging.warning(f'DRY-RUN: {dry_run}')

    #
    # Export 1Pass vars
    #
    op_vault_id = os.environ.get('OP_VAULT_ID', None)
    assert op_vault_id
    logging.info(f'OP_VAULT_ID: {op_vault_id}')

    print('Exporting data from 1Pass by tag...')
    op_vars, target = export_1pass(app=app, deploy_env=deploy_env, vault_id=op_vault_id)

    #
    # Import cloud host ENV vars
    #
    client_id = os.environ.get('CLIENT_ID', None)
    assert client_id
    logging.info(f'CLIENT_ID: {client_id}')

    logging.info(f'TARGET VARIABLE STORE: {target}')
    target_kv_store = f'{client_id}-{app}-{deploy_env}'

    print(f'Importing data into {target.capitalize()} (dry_run={dry_run})...')
    match target:
        case 'local':
            dotenv_file = f'.env-{target_kv_store}'
            logging.warning(f"DOTENV_FILE: {dotenv_file}\n")
            create_dotenv(dotenv_file=dotenv_file, op_vars=op_vars, app=app, dry_run=dry_run)

        case 'aws':
            logging.info(f'AWS_SECRETS_MANAGER_NAME: {target_kv_store}')
            import_aws(target_kv_store=target_kv_store, op_vars=op_vars, dry_run=dry_run)

        case 'azure':
            logging.info(f'AZURE_VAULT: {target_kv_store}')
            import_azure(target_kv_store=target_kv_store, op_vars=op_vars, dry_run=dry_run)


if __name__ == "__main__":
    main()
    print()
