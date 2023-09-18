import * as cdk from 'aws-cdk-lib';
import {
    aws_ecs as ecs,
    aws_secretsmanager as secretsmanager,
} from 'aws-cdk-lib';
import {T3Stack, T3StackProps} from "../stack";

export class SecretManager extends T3Stack {
    declare secrets: { [key: string]: secretsmanager.ISecret }

    constructor(scope: cdk.App, props: T3StackProps) {
        super(scope, props);
        this.secrets = {};
    }

    loadSecret(secretName: string): secretsmanager.ISecret {
        if (!(secretName in this.secrets)) {
            this.secrets[secretName] = secretsmanager.Secret.fromSecretNameV2(this, secretName, secretName);
        }
        return this.secrets[secretName];
    }

    fetchSecret(secretName: string): ecs.Secret {
        return ecs.Secret.fromSecretsManager(this.loadSecret(secretName));
    }

    fetchKeyValue(secretName: string, keyName: string): ecs.Secret {
        return ecs.Secret.fromSecretsManager(this.loadSecret(secretName), keyName);
    }

    containerSecrets(secretName: string, secretKeyNames: string[]): { [key: string]: ecs.Secret } {
        let containerSecret: { [key: string]: ecs.Secret } = {};
        for (let keyName of secretKeyNames) {
            containerSecret[keyName] = ecs.Secret.fromSecretsManager(this.loadSecret(secretName), keyName);
        }
        return containerSecret;
    }

}
