# source ~/.bashrc
if [ -f $HOME/.bashrc ]; then
  source $HOME/.bashrc
fi

# Git branch in prompt.
parse_git_branch() {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/ (\1)/'
}

export PS1="\u@ \w\[\033[32m\]\$(parse_git_branch)\[\033[00m\] $ "

# Git autocmoplete
[ -f /usr/local/etc/bash_completion ] && . /usr/local/etc/bash_completion || {
    # if not found in /usr/local/etc, try the brew --prefix location
    [ -f "$(brew --prefix)/etc/bash_completion.d/git-completion.bash" ] && \
        . $(brew --prefix)/etc/bash_completion.d/git-completion.bash
}

source ~/.bashrc

eval "$(pyenv virtualenv-init -)"
