# Lambda : smtp-ses
## Function : SendEmail

Lambda function to send an email using the SES service.

To test the function, you must have credentials to an execution role on
the appropriate AWS account (fn-smtp-ses in 1Password).

The source email address must be a verified identity on SES. 
For instances other than production, the destination address also needs to be verified.

## TODO
- lint
- unit tests

## .env
Copy the .env.dist into .env; correct the variable values within. 
Execution role credentials are stored in 1Password.

## Local Testing example
```
# Load your ENV vars
$ cd ci/aws/lambda/smtp_ses/examples/
$ pipenv install

pipenv run test_lambda my.name@materialplus.io
```

If you would like to run other commands, you can also open a shell:

```
$ pipenv shell
$ python test_lambda.py my.name@materialplus.io
```
