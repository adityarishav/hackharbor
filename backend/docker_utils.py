import docker
import os

VULNVERSE_NETWORK_NAME = os.getenv("DOCKER_NETWORK_NAME", "vulnverse_network")

def get_or_create_docker_network():
    client = docker.from_env()
    try:
        network = client.networks.get(VULNVERSE_NETWORK_NAME)
    except docker.errors.NotFound:
        ipam_pool = docker.types.IPAMPool(subnet='172.20.0.0/16', gateway='172.20.0.1')
        ipam_config = docker.types.IPAMConfig(pool_configs=[ipam_pool])
        network = client.networks.create(VULNVERSE_NETWORK_NAME, driver="bridge", ipam=ipam_config)
    return network
