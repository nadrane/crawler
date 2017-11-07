import time
import os
import paramiko as ssh
from paramiko import util
from functools import partial
import boto3
from fabric import tasks
from fabric.api import run, env, put

env.user = 'ec2-user'
env.key_filename = os.path.join(os.getcwd(), 'crawler.pem')
env.reject_unknown_hosts = False
ec2 = boto3.resource('ec2', region_name="us-east-1")

def create_instances(n):
  return ec2.create_instances(ImageId='ami-8c1be5f6',
                              MinCount=1, MaxCount=1,
                              InstanceType='m3.medium',
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
  run("sudo service docker start")

def start_crawler():
  run("sudo docker run -p 80:80 -p 443:433 -v /frontiers:/frontiers drane128/crawler2")

def make_frontier_folder():
  run("sudo mkdir /frontiers")

instances = []

class Instance:
  def __init__(self, ec2_instance):
    self.ec2_instance = ec2_instance
    self.is_instance_running = False
    self.is_docker_running = False
    self.is_frontier_created = False
    self.is_crawl_running = False
    self.assigned_web_domain_range = []
    self.failed_connection_attempts = 0
    self.initialize_docker = partial(self.perform_task, "is_docker_running", install_docker_and_start_dameon)
    self.make_frontier_folder = partial(self.perform_task, "is_frontier_created", make_frontier_folder)
    self.start_crawler = partial(self.perform_task, "is_crawl_running", start_crawler)

  def wait_until_running(self):
    while (self.ec2_instance.state["Name"] != 'running'):
      self.ec2_instance.reload()
      time.sleep(5)
    print(self.ec2_instance.public_ip_address, ' running')
    self.is_instance_running = True

  def perform_task(self, task_name, task_function):
    getTaskAttribute = lambda: getattr(self, task_name)
    while(not getTaskAttribute() and self.failed_connection_attempts < 3):
      try:
        tasks.execute(task_function, host=self.ec2_instance.public_ip_address)
        print(self.ec2_instance.public_ip_address, task_function, " successfully completed")
        setattr(self, task_name, True)
      except:
        self.failed_connection_attempts += 1
        time.sleep(15)
    if (not getTaskAttribute()):
      print(self.ec2_instance.public_ip_address, task_function, " failed")
    return getTaskAttribute()

  def start(self):
    self.wait_until_running()
    for task in ["initialize_docker", "make_frontier_folder", "start_crawler"]:
      if not getattr(self, task)():
        self.ec2_instance.terminate()
        return False
    return True

if __name__ == "__main__":
  instance = Instance(create_instances(1)[0])
  instances.append(instance)
  if not instance.start():
    instances.remove(instance)

