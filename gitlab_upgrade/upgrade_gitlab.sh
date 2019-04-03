#!/usr/bin/env bash

# REF : https://www.howtoforge.com/tutorial/how-to-upgrade-kernel-in-centos-7-server/

# Garbage collect the registry
sudo gitlab-ctl registry-garbage-collect


# Upgrade all packages to the latest version
sudo yum -y update
sudo yum -y update
sudo yum -y install yum-plugin-fastestmirror

cat /etc/redhat-release
cat /etc/os-release
uname -msr

# add new repository ELRepo repository... because we want to use the kernel version from the ELRepo community
sudo rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
sudo rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
sudo yum repolist

# install latest kernel version
sudo yum --enablerepo=elrepo-kernel install kernel-ml


# use new kernel as our default
sudo awk -F\' '$1=="menuentry " {print i++ " : " $2}' /etc/grub2.cfg
sudo grub2-set-default 0


# generate the grub2 config with 'gurb2-mkconfig' command, and then reboot the server
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
sudo reboot


# verify kernel version (logout, then login again)
uname -msr


# remove old kernel (optional)
sudo yum install yum-utils
sudo package-cleanup --oldkernels


# check gitlab version
https://gitlab-dev.t-3.com/help
https://gitlab.t-3.com/help

# add the gitlab package repo
curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash

# upgrade gitlab
sudo yum install gitlab-ce

# verify gitlab version upgrade
https://gitlab-dev.t-3.com/help
https://gitlab.t-3.com/help
