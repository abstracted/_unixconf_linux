# Easy Archlinux Configurator

Easy Archlinux Configurator is an [Ansible][1] playbook meant to provision an
[Arch Linux][2] environment. 

It is intended to run locally on a fresh Arch install (ie,taking the place of any [post-installation][3]), but due to Ansible's idempotent nature it may also be run on top of an already configured machine.

The goal of this project is to make adding new configurations as trival and as less time consuming as possible.

## Configuration

Configuration is split into multiple files for modularity.

`config/global/base.yml` - This is where the base configurations are. Think this of this as the generic config file for all your systems.

`config/global/packages.yml` - This file is for creating categorized lists of packages (both pacman and aur). This is done so that packages are defined in a single file. These lists can be referenced in other configuration files.

`config/modules/[module_name].yml` - Define components of configuration which can be added to other configurations.

`config/systems/[system_name].yml` - Configurations for the specific machine to install. Define specific configurations for your desktop, your laptop, your server or any other independent machine which will run archlinux.

### Generating a configuration

Configurations are not only modular by each file can share similar configurations. 

- Whenever the configuration is generated the yaml objects are ***deep merged*** into a single yaml object. 
- For objects: If two config files share the same object paths, the object paths will be overidden by the more specific config file.
    - So for example, configurations made in `config/global/base.yml` would be overidden by those in `config/modules/[module_name].yml` and those in `config/modules/[module_name].yml` would be overriden by the specific system configuration `config/systems/[system_name].yml`.
    - To be even more specific: If `global/base.yml` has `foo.bar.baz = "blah"` and `systems/desktop.yml` has `foo.bar.baz = "woah"`, the generated configuration would use `foo.bar.baz = "woah"`.
- For arrays: If an array exists in the same object path, items will be appened to the ends of the array, nothing gets overridden or removed.

When you're ready to generate a merged config file, run:
```bash
./generate_config
# This will generate the config only for global/base.yml

./generate_config -m foo,bar -s baz
# This will generate a merged config file from global/base.yml, modules/foo.yml, modules/bar.yml and systems/baz.yml
```

The generated config file will be written to `vars/config.yml`.

### Users & Dotfiles

#### Users
User accounts can be defined in the list `users` in either the common or specific configuration files in `config/**.yml`.

*Note: When a new user is created, its password will initially be set to the username. Once you change this, it will stay the value you change it to.*

#### Dotfiles

If you have your dotfiles hosted at a git repo, you can have them setup for you using [stow][4].

Simply provide the link to your dotfiles git repo at `users[].dotfiles` for your user and the playbook will clone the directory to `/home/[username]/.dotfiles`, backup any existing files that conflict with your dotfiles, and then run stow to link your dotfiles in your home directory. 

*Note: If there is already a directory called `.dotfiles` in the user's home directory, the steps to setup dotfiles will be skipped in order to prevent overwriting the existing directory.*

### System Files

The files contained in `templates/` will overwrite any files of the same path on the host machine. For example, if the file `templates/etc/pacman.conf.j2` exists, the file on the host at `/etc/pacman.conf` will be overwritten. 

If you need to manage new files, simply add them to the templates directory as a `.j2` file. The templates themselves are Jinja2 templates and have access to the variables defined in the configuration files in `config/**.yml`.

In addition to text files, other files such as binaries and blobs can be with into the `files` directory in the same fashion as those in the `templates` directory. These files will simply be copied over as is with no additional processing.

### Packages

System packages are defined in `config/global/packages.yml` via category.

The way packages are organized as lists in specific categories such as `_FONTS` or `_OFFICE`. 

In order to change which packages will get installed, you add or remove one of those categories from the `packages` variable in the specific configuraton,  (ie: `systems/desktop.yml`).

### Services

You can configure the state of various system services via the `services` list defined in configuration files in `config/**.yml` in the SERVICES section.

### Other configurations

There are many more capabilities of this script, just look through the config files, tasks, and templates to get an idea of what this thing is capable of. 

## Running

*Note: Before runnning, the user that runs this playbook should be part of the wheel group.* 

### First, sync mirrors and install Ansible:

    $ pacman -Syy python-passlib ansible

### Second, generate the config file:

    $ ./generate_config -m [module_name],[module_name] -s [system_name]

### Run the playbook as root:

    # sudo ansible-playbook playbook.yml

## Testing & Developing

*Note: Before running, you might want to decrease the amount of packages that will be installed by changing the `packages` variable. This is to prevent the virtual machine's disk from filling up.*

Running in a virtual environment while making changes is the most convenient way of testing your configurations.

### Setup

#### First, set your hosts variable in playbook.yaml to "test"

    # - hosts: test

#### Second, sync mirrors and install Ansible, Vagrant & Virtualbox:

    $ pacman -Syy python-passlib ansible vagrant virtualbox

#### Test the playbook.

    # vagrant up

From the ansible directory, run the vagrant up command. 

When run, vagrant will download an archlinux virtualmachine and run it in headless mode with virtualbox.

Ansible should automatically start provisioning the virtual machine with your configurations.

### Usage

#### SSH into the virtual environment

    $ vagrant ssh

#### Run the playbook on the virtualmachine

    $ vagrant provision

#### Destroy the virtual environment

    $ vagrant destroy

## Installing Archlinux

### Read the wiki
https://wiki.archlinux.org/index.php/Installation_guide

### Run the Archfi an Installer
https://github.com/MatMoul/archfi

### Build an ISO with Arcolinux
https://arcolinuxb.com/category/byoi/arcolinuxb-iso-minimal/

[1]: http://www.ansible.com
[2]: https://www.archlinux.org
[3]: https://wiki.archlinux.org/index.php/Installation_guide#Post-installation
[4]: https://www.gnu.org/software/stow/
