
alias ll="ls -al"
alias grep="grep --exclude-dir=venv --exclude-dir=node_modules"

alias gb="git branch -avv | grep -v remote"
alias gba="git branch -avv"
alias gr="git remote -vvv"
alias gs="git status"
alias lenv="grep -v '^#' .env | xargs"
alias repos="cd ~/repos"

eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

