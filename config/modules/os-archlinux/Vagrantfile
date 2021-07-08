Vagrant.configure("2") do |config|
  config.vm.define "test"
  config.vm.box = "archlinux/archlinux"
  config.vm.synced_folder '.', '/vagrant', disabled: true
  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "./playbook.yml"
  end
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.auto_update = false
  end
end
