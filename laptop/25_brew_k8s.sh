# k8s
brew install minikube
brew install helm
brew install sops
helm repo add bitnami https://charts.bitnami.com/bitnami
helm plugin install https://github.com/jkroepke/helm-secrets
minikube start --profile msl --driver=virtualbox --kubernetes-version v1.19.0
brew install kubectl
brew install kubernetes-cli
brew install kubectx
brew install watch

