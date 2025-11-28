# hackharbor

  
HackHarbor is a comprehensive full-stack web platform for cybersecurity training that combines fundamental basic learning to advance with hands-on practice. It features an Academy with structured modules, alongside a practical lab where users can ethically hack into vulnerable machines and learn how to perform defensive against attacks. Each of these machines is securely isolated as a Docker container within a VPN-controlled environment.

  

  The platform is powered by a React frontend and a FastAPI backend, which handles user authentication, machine orchestration, and a real-time flag submission and scoring system. For streamlined deployment, the entire application is containerized using Docker Compose.

# Installation

### Requirements
- [Docker](https://docs.docker.com/desktop/setup/install/linux/)

- To create this project inside docker you have to use this command
```shell
docker network create hackharbor_network
```

```shell
docker-compose up --build -d
```

- To do the PostgreSQL migration and database setup run this
```shell
docker exec hackharbor-backend alembic upgrade head
```
- Initial admin setup
  By default there is no admin user so when you create a account you have to make it as a admin user so that you can get the admin feature to add machines and other to do that you have to run these command 
```
docker exec -it hackharbor-postgres psql -U admin -d hackharbor_db

UPDATE users SET role='admin' where username=<your username>
```

- To install the image of machines in the docker use this run this from the each machine folder
```shell
docker build -t <image-name>:<version> .
```
