# Lambda : ecs
## Function : containerImageUpdate

Lambda function to update an ECS container.

To test the function, you must have credentials to an execution role on
the appropriate AWS account (fn-sns in 1Password).

## TODO
- lint
- unit tests


## .env
Copy the .env.dist into .env; correct the variable values within.
Execution role credentials are stored in 1Password.

## Local Testing example
```
# Load your ENV vars
$ cd ci/aws/lambda/ecs/examples/
$ pipenv install

pipenv run test_lambda
```

If you would like to run other commands, you can also open a shell:

```
$ pipenv shell
$ python test_lambda.py
```