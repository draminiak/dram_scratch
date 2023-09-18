# Initialize
- create IAM user with admin access
- create access secret key creds
- load .env (see dram/.env)
- yarn aws:config
- yarn aws:cdk-bootstrap

# Deploy
- create generic deploy user (no access)
- add user name to config (dram/stacks.ts)
- yarn build:ts; yarn aws:cdk-synth
- yarn aws:cdk-deploy


infra
x    vpc
    securityGroup
x    nacl
x    secretsManager
    ecr

resources
-    redis
-    rds
-    codePipeline
    ecs
    rt53
    s3

apps
    storybook
-    web
-    api
-    scheduledTask
    spa
-    lambda
