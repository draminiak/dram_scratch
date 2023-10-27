## Local Dev
Copy the ENV template and update values within.
```bash
cp .env.dist .env
vi .env
```

Install packages & load the .env into the Python shell
```bash
pip install pipenv==2023.3.20
pipenv shell
pipenv run setup-dev
pipenv run lint
pipenv run test
```
