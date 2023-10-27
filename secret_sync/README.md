# Overview 
Export variables from Material source-of-truth (1password) for import into specified client cloud host (aws, azure).

## Setup
* Create a 1Password vault specifically for project env vars
* Each item within the vault should be "tagged" with a specific application & deployEnv combination (dev, stage, prod, etc)
  * Caveat to this would be a "common" tag for a given app, which would hold default values for vars

EXAMPLE :
```
VAULT = "MyProject Env Vars"
ITEMS = [
    MyInfra-common (tags = "infra", "common")
    MyInfra-prod (tags = "infra", "prod")
    MyApi-dev/stage (tags = "api", "dev", "stage")
    MyApi-prod (tags = "api", "prod")
    MyWeb-common (tags = "web", "common")
    MyWeb-stage (tags = "web", "stage")
    MyWeb-prod (tags = "web", "prod")
]
```

## Install 
* 1Password CLI : https://github.com/1Password/homebrew-tap

## Configure 
Audit the config file to support custom implementations.
```bash
vi config.yaml
```

### Configure the 1password sync API server
REF : https://developer.1password.com/docs/connect/connect-cli/

### Create local client-specific config files
There are 2 options for this. The first is a simple reference to create necessary files.
The latter is meant for power users, who toggle between multiple clients and want to quickly switch between configs.

#### Option 1
1. Create a `.env` file : Copy the .env.dist -> .env and modify to use valid values
2. Create a `1password-credentials.json` file : This should exist in 1Pass in a client-specific vault if the "Integration" was created as expected.
3. Create a `config.yml` file : Copy the config.yml.dist -> config.yml and modify to use valid values
4. Run docker-compose start/stop to spin up the required OnePassword Client image
5. Manually run `docker-compose stop` when applicable

#### Option 2
1. You still need to follow the steps in Option 1 for each client, but put the files in a `.client/%client-id%/` folder.
EXAMPLE:
```bash
$ ls -al ./client
./client
  yamaha/
    .env
    1password-credentials.json
    config.yml
  sportclips/
    .env
    1password-credentials.json
    config.yml
```
2. Run the following command to copy files from the .client/ dir by name into the right places;
this runs `docker-compoose start -d` as well.
```bash
$ ./config.sh sportclips
```
3. You will still need to manually run `docker-compose stop` when applicable


### Execute the 1Pass Sync to a specified cloud-host
```bash
python onepassword/sync.py app env
# or
pipenv run sync app env
```
EXAMPLES :
```bash
pipenv run sync web stage
pipenv run sync api prod
```

# Dry-Run
By default, the script executed in "dry-run" mode. This prints all key/value pairs in plain-text to the screen.
In order to disable dry-run and migrate data to the cloud host destination, pass the "-d" option into the command.
```bash
pipenv run sync web stage -d
```

# Help
Review script usage & options with the "-h" option.
```bash
pipenv run sync -h
```

# Output
A cloud hosted env group (aws=SecretsManager, azure=keyVault) will be created with the format :
`%CLIENT_ID%-%APP%-%ENV%` -- i.e. "YAMAHA-web-stage" or "NIKE-api-development"

# Notes
In all cases, the script should never pull more than 2 items from the vault, a "common" and/or and app-env-specific item.
Key/Value pairs within each item will br pushed into the vault.
Common vars would be overwritten by any app-env-specific var.

EXAMPLE = "YAMAHA-web-stage" : 
```
YamWeb-common : {
  VAR_1 = one
  VAR_2 = this
}
YamWeb-stage : {
  VAR_2 = that
}

# results in a single SecretsManager record 
YAMAHA-web-stage : {
  VAR_1 = one
  VAR_2 = that
}
```
