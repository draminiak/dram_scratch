#!/usr/bin/env bash

# REF : https://docs.gitlab.com/runner/install/linux-repository.html

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


# Update the runner
sudo yum update
sudo yum install gitlab-runner

## from a version prior to 10.0
#curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh | sudo bash
#sudo yum install gitlab-runner
#sudo /usr/share/gitlab-runner/post-install


# Fix for restart issue after yum upgrade
sudo rm -rf /var/lib/docker/devicemapper
sudo systemctl start docker


# runner config file
sudo cat /etc/gitlab-runner/config.toml
