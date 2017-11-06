import time
import os
import paramiko as ssh
from paramiko import util

import boto3
from fabric import tasks
from fabric.api import run, env, put

env.user = 'ec2-user'
env.key_filename = os.path.join(os.getcwd(), 'crawler.pem')
env.reject_unknown_hosts = False
ec2 = boto3.resource('ec2', region_name="us-east-1")

# running_instances = {instance.id : instance for instance in instances}
# print([instance.public_ip_address for instance in instances])

# while True:
#   [instance.load() for instance in instances]
#   print([(instance.public_ip_address, instance.state) for instance in instances])
#   time.sleep(1)

# [instance.terminate() for instance in instances]



def create_instances(n):
  return ec2.create_instances(ImageId='ami-8c1be5f6',
                              MinCount=1, MaxCount=1,
                              InstanceType='t2.micro',
                              SubnetId="subnet-237cc168",
                              Monitoring={'Enabled': True},
                              KeyName="crawler",
                              IamInstanceProfile={
                                "Name": "ec2-s3-read"
                              })

def terminate_all_instances():
  instances = ec2.describe_instances()
  print(instances)

def install_docker_and_start_dameon():
  run("sudo yum update -y")
  run("sudo yum install -y docker")
  run("sudo service docker start")[0]

def start_crawler():
  run("sudo docker run -p 80:80 -p 443:443 -v ~/app:/app drane128/crawler2")

instances = []

class Instance:
  def __init__(self, ec2_instance):
    self.ec2_instance = ec2_instance
    self.is_instance_running = False
    self.is_docker_running = False
    self.secrets_received = False
    self.is_crawl_running = False
    self.assigned_web_domain_range = []
    self.failed_connection_attempts = 0

  def wait_until_running(self):
    while (self.ec2_instance.state["Name"] != 'running'):
      self.ec2_instance.reload()
      time.sleep(5)
    print(self.ec2_instance.public_ip_address, ' running')
    self.is_instance_running = True

  def initialize_docker(self):
    while(not self.is_docker_running and self.failed_connection_attempts < 4):
      try:
        tasks.execute(install_docker_and_start_dameon, host=self.ec2_instance.public_ip_address)
        print(self.ec2_instance.public_ip_address, ' docker initialized')
        self.is_docker_running = True
      except:
        self.failed_connection_attempts += 1
        time.sleep(10)
    if (not self.is_docker_running):
      print(self.ec2_instance.public_ip_address, ' docker initialized failed')
      self.ec2_instance.terminate()
      instances.remove(self)
    self.failed_connection_attempts = 0

  def start_crawler(self):
    while(not self.is_crawl_running and self.failed_connection_attempts < 4):
      try:
        tasks.execute(start_crawler, host=self.ec2_instance.public_ip_address)
        print(self.ec2_instance.public_ip_address, 'crawler running')
        self.is_crawl_running = True
      except:
        self.failed_connection_attempts += 1
        time.sleep(10)
    if (not self.is_crawl_running):
      print(self.ec2_instance.public_ip_address, ' crawling failed to start')
      self.ec2_instance.terminate()
      instances.remove(self)
    self.failed_connection_attempts = 0

  # def initialize_crawl(self):


if __name__ == "__main__":
  instance = Instance(create_instances(1)[0])
  # instances.append(instance)
  # instance.wait_until_running()
  # instance.initialize_docker()
  # tasks.execute(send_secrets, host="54.85.96.78")
  # tasks.execute(start_crawler, host="54.85.96.78")




# print('connecting', instance.public_ip_address, env.user, env.key_filename)
# time.sleep(10)
# util.log_to_file('./logs2')
# client = ssh.SSHClient()
# client.set_missing_host_key_policy(ssh.AutoAddPolicy())
# try:
#   client.connect(hostname=instance.public_ip_address, port=22, username=env.user, key_filename=[env.key_filename])
#   print('connected')
# except Exception as e:
#   print('error', e)
