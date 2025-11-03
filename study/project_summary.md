# VulnVerse Project Summary: A HackTheBox-style Platform

This document provides a comprehensive overview of the development process for the VulnVerse platform, detailing the technologies used, the steps taken, and the troubleshooting encountered.

## I. Introduction

**Project Goal:** To create a platform for ethical hacking practice on vulnerable, containerized machines, managed via a central web interface. Inspired by platforms like HackTheBox.

**Core Architectural Components:**
*   **The Web Application (Full-Stack):**
    *   **Frontend:** React (user interface).
    *   **Backend:** FastAPI (Python) - manages users, machines, flag submissions, scoring, and interacts with the machine provisioning system.
*   **The Vulnerable Labs (Cybersecurity):** Docker for isolated, reproducible vulnerable machine environments.
*   **The Network Layer (Networking & Security):** OpenVPN for secure user access to the lab network.

**Proposed Technology Stack:**
*   **Frontend:** React (created with Vite for a lightweight setup).
*   **Backend:** FastAPI (Python).
*   **Database:** PostgreSQL.
*   **Containerization:** Docker.
*   **VPN:** OpenVPN.

---

## II. Phase 1: Core Backend and Database Setup (Python)

**Objective:** To set up the FastAPI project, define the database schema, and configure database migrations.

**Key Technologies & Concepts:**
*   **FastAPI:** A modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.
*   **Uvicorn:** An ASGI (Asynchronous Server Gateway Interface) server implementation for Python, used to run FastAPI applications.
*   **Python-dotenv:** A library to read key-value pairs from a `.env` file and set them as environment variables. Essential for managing sensitive configurations like database credentials.
*   **Psycopg2-binary:** A PostgreSQL adapter for Python, allowing Python applications to connect and interact with PostgreSQL databases.
*   **SQLAlchemy:** A powerful SQL toolkit and Object Relational Mapper (ORM) for Python. It allows developers to interact with databases using Python objects instead of raw SQL queries.
*   **Alembic:** A lightweight database migration tool for SQLAlchemy. It helps manage changes to the database schema over time in a version-controlled manner.
*   **PostgreSQL:** A powerful, open-source relational database system known for its reliability, feature robustness, and performance.

**Steps Performed:**

1.  **Project Directory Creation:**
    *   The main project directory `D:\Think\vulnverse` was created.
2.  **Python Virtual Environment (venv) Setup:**
    *   A virtual environment was created and activated (`.\venv\Scripts\activate`). This isolates project dependencies from the system-wide Python installation.
3.  **Required Python Packages Installation:**
    *   `fastapi`, `uvicorn`, `python-dotenv`, `psycopg2-binary`, `sqlalchemy`, `alembic` were installed into the virtual environment.
4.  **FastAPI Entry Point (`main.py`):**
    *   An initial `main.py` was created to serve as the main application file for FastAPI.
5.  **Database Connection Setup (`database.py`):**
    *   `database.py` was created to define the SQLAlchemy engine and session, establishing the connection to the PostgreSQL database.
6.  **SQLAlchemy ORM Models (`models.py`):**
    *   `models.py` was created to define the database schema using SQLAlchemy's ORM. Models for `User`, `Machine`, `Flag`, and `Submission` were defined, mapping Python classes to database tables.
7.  **Environment Variables (`.env`):**
    *   A `.env` file was created to store the `DATABASE_URL` (e.g., `postgresql://user:password@localhost:5432/vulnverse_db`). This allows for easy configuration changes without modifying code.
8.  **Alembic Initialization:**
    *   Alembic was initialized within the project, creating the `alembic` directory and `alembic.ini` configuration file.
    *   `alembic/env.py` was modified to load the `DATABASE_URL` from `.env` and to use `models.Base.metadata` for autogeneration, allowing Alembic to detect changes in `models.py`.
9.  **Alembic Migrations:**
    *   **Generating Initial Migration:**
        ```bash
        venv\Scripts\python.exe -m alembic revision --autogenerate -m "Create_initial_tables"
        ```
        *   **Purpose:** This command inspects the SQLAlchemy models (`models.py`) and compares them to the current database schema (or lack thereof). It then generates a Python script (a migration file) that contains the necessary SQL commands to create or alter tables to match the models.
        *   **Troubleshooting:** Initial attempts failed due to spaces in the `-m` message. The fix was to replace spaces with underscores (e.g., `"Create_initial_tables"`) or enclose the message in quotes properly.
    *   **Applying Migration:**
        ```bash
        venv\Scripts\python.exe -m alembic upgrade head
        ```
        *   **Purpose:** This command executes the generated migration script, applying the schema changes to the connected PostgreSQL database. `head` refers to the latest migration script.

**Diagram Idea:** A diagram showing `main.py` importing `database.py` and `models.py`. `database.py` connects to PostgreSQL. Alembic interacts with `models.py` to generate migrations, which are then applied to PostgreSQL.

---

## III. Phase 2: Frontend Scaffolding and User Authentication (React & FastAPI)

**Objective:** To implement user registration and login functionalities in the FastAPI backend and prepare the frontend for interaction.

**Key Technologies & Concepts:**
*   **Passlib[bcrypt]:** A password hashing library for Python, using the bcrypt algorithm for secure password storage.
*   **Python-jose:** A Python library for JSON Web Signatures (JWS) and JSON Web Tokens (JWT). Used for creating and verifying secure access tokens.
*   **FastAPI Security (OAuth2PasswordBearer):** FastAPI's built-in utilities for handling authentication, specifically OAuth2 for token-based authentication.
*   **Pydantic:** A data validation and settings management library for Python. It's used extensively in FastAPI to define data shapes for requests and responses, ensuring data integrity.

**Steps Performed:**

1.  **Installation of Authentication Dependencies:**
    *   `passlib[bcrypt]` and `python-jose` were installed.
2.  **Creation of `auth.py`:**
    *   A new file `auth.py` was created to encapsulate authentication logic:
        *   `pwd_context`: For password hashing and verification using bcrypt.
        *   `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`: Constants for JWT token generation.
        *   `verify_password`, `get_password_hash`: Functions for password handling.
        *   `create_access_token`: Function to generate JWT tokens.
        *   `get_current_user`: A dependency function for FastAPI to extract and validate the user from a JWT token.
3.  **Adding `SECRET_KEY` to `.env`:**
    *   A `SECRET_KEY` was added to the `.env` file. This key is crucial for signing JWT tokens securely.
4.  **Modification of `main.py` for Authentication Endpoints:**
    *   **`UserCreate` Pydantic Model:** Initially defined directly in `main.py` for user registration data.
    *   **`/users/` (POST) Endpoint:** For user registration. It hashes the password and stores the new user in the database.
    *   **`/token` (POST) Endpoint:** For user login. It verifies credentials and generates an `access_token` (JWT).
    *   **`/users/me/` (GET) Endpoint:** An authenticated endpoint to retrieve the current user's information, demonstrating JWT validation.

**Troubleshooting & Refinements:**

*   **`FastAPIError: Invalid args for response field`:**
    *   **Problem:** FastAPI was attempting to use SQLAlchemy ORM models directly as Pydantic response models, which is not supported.
    *   **Solution:** Created a separate file `schemas.py` to define explicit Pydantic models (`UserBase`, `UserCreate`, `User`, `MachineBase`, `MachineCreate`, `Machine`, etc.). These Pydantic models are used for API request body validation and response serialization, while SQLAlchemy models are used for database interaction. `orm_mode = True` (now `from_attributes = True` in Pydantic v2) was added to Pydantic models to allow them to be created directly from ORM objects.
    *   `main.py` was updated to import and use these `schemas` models.
*   **`RuntimeError: Form data requires "python-multipart"`:**
    *   **Problem:** The `/token` endpoint uses `OAuth2PasswordRequestForm`, which relies on `python-multipart` for parsing form data. This dependency was missing.
    *   **Solution:** Installed `python-multipart` using `pip install python-multipart`.
*   **`405 Method Not Allowed` (CORS Issue):**
    *   **Problem:** The frontend (running on a different origin, e.g., `localhost:5173`) was making requests to the backend (`localhost:8000`), leading to Cross-Origin Resource Sharing (CORS) policy violations, especially for `OPTIONS` preflight requests.
    *   **Solution:** Added `CORSMiddleware` to `main.py`, configuring `allow_origins`, `allow_credentials`, `allow_methods`, and `allow_headers` to permit requests from the frontend's origin.
*   **`psycopg2.OperationalError: password authentication failed`:**
    *   **Problem:** The FastAPI application could not connect to the PostgreSQL database due to incorrect credentials.
    *   **Solution:** Advised checking the `DATABASE_URL` in the `.env` file and ensuring it matched the PostgreSQL server's user and password.
*   **`401 Unauthorized` (Token Expiry):**
    *   **Problem:** Users were getting unauthorized errors after some time, indicating their JWT access tokens had expired.
    *   **Solution:** Increased `ACCESS_TOKEN_EXPIRE_MINUTES` in `auth.py` from 30 minutes to 1440 minutes (24 hours) for better development experience.

**Diagram Idea:** A flowchart showing the user interacting with the React frontend, which sends requests to FastAPI. FastAPI uses `auth.py` for authentication and `schemas.py` for data validation before interacting with the database via SQLAlchemy.

---

## IV. Phase 3: Dockerized Lab Management (Python & Docker)

**Objective:** To implement the ability to manage vulnerable Docker containers from the backend, allowing users to start and stop lab machines.

**Key Technologies & Concepts:**
*   **Docker SDK for Python:** A Python library that provides an API for interacting with the Docker daemon. It allows Python applications to build, run, stop, and manage Docker containers and images programmatically.
*   **Docker:** A platform for developing, shipping, and running applications in containers. Containers are lightweight, portable, and self-sufficient units that package an application and its dependencies.

**Steps Performed:**

1.  **Installation of Docker SDK:**
    *   `docker` library was installed using `pip install docker`.
2.  **Creation of a Sample Vulnerable Application:**
    *   A directory `vulnerable_app/` was created.
    *   `vulnerable_app/app.py`: A simple Flask web application with a command injection vulnerability was created. This serves as our first "vulnerable machine."
    *   `vulnerable_app/Dockerfile`: A Dockerfile was created to define how to build a Docker image for the Flask application.
3.  **Building the Docker Image:**
    *   The Docker image for the vulnerable app was built:
        ```bash
        docker build -t vuln-app:latest .
        ```
        *   **Purpose:** This command reads the `Dockerfile` and creates a runnable Docker image named `vuln-app` with the tag `latest`.
4.  **Modification of `main.py` for Machine Management Endpoints:**
    *   **`/machines/` (GET) Endpoint:** Retrieves and lists all available machines from the database.
    *   **`/machines/` (POST) Endpoint:** Allows creation of new machine entries in the database.
    *   **`/machines/{machine_id}/start` (POST) Endpoint:**
        *   **Purpose:** Starts a Docker container for the specified machine.
        *   **Logic:**
            *   Retrieves machine details from the database.
            *   Uses `docker.from_env()` to connect to the Docker daemon.
            *   **`get_or_create_docker_network()`:** A new helper function was added to ensure a dedicated Docker bridge network (`vulnverse_network`) exists. This network uses a specific subnet (`172.20.0.0/16`) and gateway (`172.20.0.1`) to provide a controlled environment for the labs.
            *   Runs the Docker container, connecting it to the `vulnverse_network`.
            *   Retrieves the dynamically assigned IP address of the container within the `vulnverse_network`.
            *   **Stores the IP address:** Updates the `ip_address` field of the `Machine` record in the database with the assigned IP.
    *   **`/machines/{machine_id}/stop` (POST) Endpoint:**
        *   **Purpose:** Stops and removes a Docker container for the specified machine.
        *   **Logic:**
            *   Retrieves machine details.
            *   Gets the running container by name.
            *   Stops and removes the container.
            *   **Clears the IP address:** Sets the `ip_address` field of the `Machine` record in the database to `None`.
5.  **IP Address Management in Database and Schemas:**
    *   **`models.py` Update:** Added an `ip_address` column (String, nullable) to the `Machine` model.
    *   **Alembic Migration:** Generated and applied a new Alembic migration (`alembic revision --autogenerate -m "Add_ip_address_to_Machine"`, `alembic upgrade head`) to update the database schema with the new column.
    *   **`schemas.py` Update:** Included `ip_address` in the `Machine` Pydantic schema to allow it to be returned in API responses.

**Diagram Idea:** A diagram showing the FastAPI backend interacting with the Docker daemon. Docker daemon manages containers on a `vulnverse_network`. The database stores machine details including their assigned IP.

---

## V. Phase 4: OpenVPN Integration (Python & OpenVPN)

**Objective:** To enable secure user access to the lab network via OpenVPN, allowing players to connect to the vulnerable machines.

**Key Technologies & Concepts:**
*   **OpenVPN (Dockerized `kylemanna/openvpn` image):** A robust and widely used open-source VPN solution. Using a pre-built Docker image simplifies deployment.
*   **Docker Volumes:** Used to persist data (like OpenVPN configurations, certificates, and keys) outside the container, ensuring they are not lost if the container is removed or recreated.
*   **PKI (Public Key Infrastructure):** A set of roles, policies, and procedures needed to create, manage, distribute, use, store, and revoke digital certificates. Essential for secure VPN authentication.

**Steps Performed:**

1.  **Installation of `openvpn-api`:**
    *   `openvpn-api` was installed, although its direct use for server management was not implemented in this phase. It's a useful library for interacting with OpenVPN management interfaces.
2.  **Dockerized OpenVPN Server Setup:**
    *   **Create Data Directory:** `mkdir openvpn-data` was executed to create a directory on the host to store persistent OpenVPN data.
    *   **Generate OpenVPN Configuration:**
        ```bash
        docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm kylemanna/openvpn ovpn_genconfig -u udp://YOUR_VPN_SERVER_IP
        ```
        *   **Purpose:** This command generates the basic server configuration.
        *   **`YOUR_VPN_SERVER_IP` Explanation:**
            *   `127.0.0.1` (localhost): For testing connections *only* from the same machine where the OpenVPN server is running.
            *   Your WiFi IP address (e.g., `192.168.1.100`): For testing connections from other devices on your local WiFi network.
            *   A public IP address or domain name: For a production setup where clients connect from anywhere on the internet.
            *   `0.0.0.0` is **not valid** here, as it's a bind address, not a connectable address for clients.
    *   **Initialize PKI:**
        ```bash
        docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm -it kylemanna/openvpn ovpn_initpki
        ```
        *   **Purpose:** Sets up the Certificate Authority (CA) and generates the server certificate and key.
        *   **Prompts:** Requires a passphrase for the CA key (remember it!) and a Common Name (e.g., `VulnVerse CA`).
    *   **Generate Client Certificate:**
        ```bash
        docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm -it kylemanna/openvpn easyrsa build-client-full client nopass
        ```
        *   **Purpose:** Creates a client certificate and key. `nopass` avoids a passphrase for convenience.
    *   **Generate Client `.ovpn` File:**
        ```bash
        docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm kylemanna/openvpn ovpn_getclient client > D:/Think/vulnverse/openvpn-data/client.ovpn
        ```
        *   **Purpose:** Consolidates the client certificate, key, CA certificate, and server configuration into a single `.ovpn` file for easy client import.
    *   **Ensure Docker Network Exists:**
        ```bash
        docker network create --subnet 172.20.0.0/16 --gateway 172.20.0.1 vulnverse_network || true
        ```
        *   **Purpose:** Ensures the `vulnverse_network` (where vulnerable machines reside) is available and configured for the OpenVPN server to connect to.
    *   **Start OpenVPN Server Container:**
        ```bash
        docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn -d -p 1194:1194/udp --cap-add=NET_ADMIN --network vulnverse_network --name openvpn_server kylemanna/openvpn
        ```
        *   **Purpose:** Runs the OpenVPN server, mapping port 1194 (UDP) to the host, adding network admin capabilities, and connecting it to the `vulnverse_network`.
3.  **Modification of `main.py` for VPN Config Serving:**
    *   The `/vpn/generate-config` endpoint was updated to read the generated `client.ovpn` file directly from the `D:/Think/vulnverse/openvpn-data` directory and serve it as a `PlainTextResponse`. This replaces the previous placeholder.

**Diagram Idea:** A diagram showing the user's device with an OpenVPN client connecting to the OpenVPN Server (Docker container). The OpenVPN Server is connected to the `vulnverse_network` (Docker bridge network), which also hosts the vulnerable machine containers.

---

## VI. Phase 5: The "Game Loop" (Python & React)

**Objective:** To implement the core "game loop" functionalities, specifically flag submission and validation.

**Key Technologies & Concepts:**
*   **FastAPI Endpoints:** For receiving flag submissions.
*   **Database Interaction:** To store submission records and verify flags against stored correct flags.

**Steps Performed:**

1.  **Modification of `main.py` for Flag Submission Endpoint:**
    *   **`/submissions/` (POST) Endpoint:**
        *   **Purpose:** Handles user flag submissions.
        *   **Logic:**
            *   Receives `machine_id` and `flag` from the user.
            *   Verifies if the `machine_id` exists.
            *   Checks if the submitted `flag` matches a correct flag for that `machine_id` in the database.
            *   Checks if the user has already submitted the flag for that machine.
            *   If valid and not already submitted, records the submission in the database.

**Troubleshooting & Refinements:**

*   **`ResponseValidationError` for `machine_id` in flag submission:**
    *   **Problem:** The `SubmissionCreate` Pydantic schema in `schemas.py` was missing the `machine_id` field, causing validation errors when the backend tried to process the submission.
    *   **Solution:** Updated `schemas.py` to include `machine_id` in the `SubmissionCreate` schema.

---

## VII. Frontend Development (React)

**Objective:** To create a basic web interface for users to interact with the VulnVerse platform.

**Key Technologies & Concepts:**
*   **React (with Vite):** A JavaScript library for building user interfaces. Vite is a fast build tool that provides a quick development server.
*   **Axios:** A popular promise-based HTTP client for the browser and Node.js, used for making API requests to the FastAPI backend.
*   **React Router DOM:** A library for declarative routing in React applications, allowing navigation between different views/pages.

**Steps Performed:**

1.  **React Project Initialization:**
    ```bash
    npm create vite@latest frontend -- --template react
    ```
    *   **Purpose:** Scaffolds a new React project using Vite.
2.  **Installation of Frontend Dependencies:**
    *   `npm install axios react-router-dom` was executed.
3.  **Creation of `src/services/api.js`:**
    *   An Axios instance was created with a `baseURL` pointing to the FastAPI backend (`http://127.0.0.1:8000`). This centralizes API calls.
4.  **Creation of React Components:**
    *   **`src/components/Login.jsx`:** Provides a form for user login, sending credentials to `/token` and storing the received access token in `localStorage`.
    *   **`src/components/Register.jsx`:** Provides a form for user registration, sending data to `/users/`.
    *   **`src/components/Dashboard.jsx`:**
        *   Fetches and displays a list of machines from `/machines/`.
        *   Includes buttons for:
            *   **Start Machine:** Calls `/machines/{machine_id}/start`.
            *   **Stop Machine:** Calls `/machines/{machine_id}/stop`.
            *   **Download VPN Config:** Calls `/vpn/generate-config` and handles file download.
            *   **Submit Flag:** Prompts for a flag and calls `/submissions/`.
        *   Displays the `ip_address` for started machines.
5.  **Modification of `src/App.jsx`:**
    *   Set up routing using `BrowserRouter`, `Routes`, and `Route` from `react-router-dom` to navigate between `/login`, `/register`, and `/dashboard`.

**Troubleshooting & Refinements:**

*   **`TypeError: crypto.hash is not a function`:**
    *   **Problem:** Incompatibility between the Node.js version (`v21.5.0`) and the Vite version (`^7.1.0`). Older Vite versions used a Node.js internal `crypto.hash` function that was removed in newer Node.js versions.
    *   **Solution:** Updated `vite` to `^5.0.0` and `@vitejs/plugin-react` to `^4.3.1` in `package.json`, then ran `npm install` to update dependencies. This resolved the incompatibility.
*   **Frontend not updating IP after start/stop:**
    *   **Problem:** The `Dashboard.jsx` component was not re-fetching the machine list after a machine was started or stopped, so the `ip_address` change wasn't immediately visible.
    *   **Solution:** Added `fetchMachines()` calls within `handleStartMachine` and `handleStopMachine` functions to re-fetch the updated machine data from the backend.

---

## VIII. How to Restart Everything After a PC Restart

To bring your entire VulnVerse platform back online after a PC restart, follow these steps. **Open a NEW terminal window for each of the server processes (FastAPI and React) as they will occupy the terminal.**

1.  **Start your PostgreSQL Database (if running in Docker):**
    ```bash
    docker start vulnverse-postgres
    ```
    *(If you're using a local PostgreSQL installation, ensure its service is running.)*

2.  **Start the OpenVPN Server (Docker Container):**
    ```bash
    docker start openvpn_server
    ```

3.  **Start the FastAPI Backend:**
    ```bash
    cd D:\Think\vulnverse
    .\venv\Scripts\activate
    uvicorn main:app --reload
    ```
    *(Keep this terminal open and running.)*

4.  **Start the React Frontend:**
    ```bash
    cd D:\Think\vulnverse\frontend
    npm run dev
    ```
    *(Keep this terminal open and running.)*

---

## IX. How to Change OpenVPN Server IP

If you need to change the IP address that your OpenVPN server advertises (e.g., from `127.0.0.1` to your WiFi IP or a public IP), you must regenerate the OpenVPN configuration and client files. This process will invalidate any previously generated client `.ovpn` files.

**Replace `YOUR_NEW_VPN_SERVER_IP` with the actual IP address you want to use.**

1.  **Stop and Remove the Existing OpenVPN Server Container:**
    ```bash
    docker stop openvpn_server
    docker rm openvpn_server
    ```

2.  **Clean Up Existing OpenVPN Data:**
    ```bash
    del /S /Q D:\Think\vulnverse\openvpn-data\*
    ```
    *(Use `Remove-Item -Recurse -Force D:\Think\vulnverse\openvpn-data\*` in PowerShell)*

3.  **Re-generate OpenVPN Configuration with the New IP:**
    ```bash
    docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm kylemanna/openvpn ovpn_genconfig -u udp://YOUR_NEW_VPN_SERVER_IP
    ```

4.  **Re-initialize OpenVPN PKI:**
    ```bash
    docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm -it kylemanna/openvpn ovpn_initpki
    ```
    *(You will be prompted for the CA passphrase and Common Name.)*

5.  **Re-generate Client Certificate:**
    ```bash
    docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm -it kylemanna/openvpn easyrsa build-client-full client nopass
    ```
    *(You will be prompted for the CA passphrase.)*

6.  **Re-generate the Client `.ovpn` File:**
    ```bash
    docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn --log-driver=none --rm kylemanna/openvpn ovpn_getclient client > D:/Think/vulnverse/openvpn-data/client.ovpn
    ```

7.  **Start the OpenVPN Server Container with the New Configuration:**
    ```bash
    docker run -v D:/Think/vulnverse/openvpn-data:/etc/openvpn -d -p 1194:1194/udp --cap-add=NET_ADMIN --network vulnverse_network --name openvpn_server kylemanna/openvpn
    ```

**After these steps, download the new `client.ovpn` from your frontend and import it into your OpenVPN client.**

---

## X. Conclusion

We have successfully built the foundational components of the VulnVerse platform:

*   A robust **FastAPI backend** handling user authentication, machine management, and flag submissions.
*   A **PostgreSQL database** for persistent data storage, managed with Alembic migrations.
*   **Dockerized vulnerable labs** for isolated hacking environments.
*   A **Dockerized OpenVPN server** providing secure network access to these labs.
*   A basic **React frontend** for user interaction.

This setup provides a solid base for further development, including:
*   Implementing scoring and leaderboards.
*   Creating more diverse vulnerable machines.
*   Developing an admin panel for machine and user management.
*   Adding more sophisticated flag validation mechanisms.
*   Improving the frontend UI/UX.
