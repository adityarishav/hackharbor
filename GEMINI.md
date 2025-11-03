# VulnVerse Project: Gemini Development Checkpoint

This document summarizes the current state of the VulnVerse platform as of our last interaction, detailing implemented features, recent changes, and instructions for resuming development. This serves as a persistent memory for the Gemini CLI.

## 1. Project Goal & Architecture

**Goal:** To create a HackTheBox-style platform for ethical hacking practice on vulnerable, containerized machines, managed via a central web interface.

**Core Architectural Components:**
*   **Web Application (Full-Stack):**
    *   **Frontend:** React (user interface).
    *   **Backend:** FastAPI (Python) - manages users, machines, flag submissions, scoring, and interacts with the machine provisioning system.
*   **Vulnerable Labs (Cybersecurity):** Docker for isolated, reproducible vulnerable machine environments.
*   **Network Layer (Networking & Security):** OpenVPN for secure user access to the lab network.

**Technology Stack:**
*   **Frontend:** React (JavaScript/JSX) with Vite (build tool), Axios (API calls), React Router DOM (routing), Chart.js & React-Chartjs-2 (analytics).
*   **Backend:** FastAPI (Python), SQLAlchemy (ORM), Alembic (migrations), python-jose (JWTs), passlib[bcrypt] (password hashing), python-dotenv, psycopg2-binary, python-docker (Docker SDK).
*   **Database:** PostgreSQL.
*   **Containerization:** Docker.
*   **VPN:** OpenVPN (Dockerized).

## 2. Key Features Implemented & Current State

### Phase 1: Core Backend and Database Setup
*   FastAPI project initialized.
*   SQLAlchemy engine, session, and Base defined (`database.py`).
*   User, Machine, Flag, and Submission models defined (`models.py`).
*   `.env` for `DATABASE_URL` and `SECRET_KEY`.
*   Alembic setup for database migrations.
*   **Current State:** PostgreSQL schema fully set up, including `ip_address` in `machines`, `category` and `difficulty` in `machines`, `role` in `users`, and `flag_id` in `submissions`. `logs` table created.

### Phase 2: Frontend Scaffolding and User Authentication
*   Backend authentication logic (`auth.py`) with password hashing and JWTs.
*   Pydantic schemas (`schemas.py`) for API validation.
*   FastAPI authentication endpoints (`main.py` - now handled by `auth_router`).
*   React frontend (`frontend/`) scaffolded with Vite, Axios, React Router DOM.
*   Login and Register components.
*   **Current State:** User registration and login fully functional. Authentication logic refactored into `auth.py` using `APIRouter`.

### Phase 3: Dockerized Lab Management
*   Docker SDK integrated for container management.
*   Sample vulnerable application (`vulnerable_app/`).
*   FastAPI endpoints for listing, creating, starting, and stopping machines.
*   **Current State:** Backend can manage Docker containers, assign/track IPs. Frontend displays machine info and allows control. "Restart Machine" functionality added.

### Phase 4: OpenVPN Integration
*   OpenVPN server setup (Dockerized).
*   FastAPI endpoint to serve `client.ovpn`.
*   Frontend button to download VPN config.
*   **Current State:** OpenVPN server running, config downloadable.

### Phase 5: Flag Submission & Scoring
*   FastAPI endpoints for adding flags and submitting flags.
*   **Unique Flag Scoring:** `Submission` model now includes `flag_id`. `create_submission` prevents duplicate submissions of the *same specific flag* by the *same user* for the *same machine*. `get_my_score` counts unique `flag_id`s.
*   **Multi-Flag Support:** `MachineCreate` schema accepts a list of flags.
*   **Frontend Flag Submission UI:** `MachineDetail.jsx` now fetches and displays individual flags for a machine, with separate input fields and submit buttons. Submitted flags are disabled.
*   **Current State:** Core game loop functional with unique flag scoring and improved multi-flag submission UX.

### Phase 6: Admin Panel & Core Feature Refinements
*   **Role-Based Access Control (RBAC):** `User` model has `role` column. `auth.py` includes `role` in JWT and `get_current_admin_user` dependency.
*   **Admin Machine Management:**
    *   `POST /admin/machines/` endpoint (admin-only) for adding machines with name, description, docker image, category, difficulty, and multiple flags.
    *   `DELETE /admin/machines/{machine_id}` endpoint (admin-only) for **soft-deleting** machines. The Docker container is stopped and removed, but the machine record remains in DB with `is_deleted=True`.
    *   `PUT /admin/machines/{machine_id}` endpoint (admin-only) for updating machine details and flags.
    *   `GET /admin/machines/all` endpoint (admin-only) to retrieve all machines, including soft-deleted ones.
*   **Admin Dashboard (`AdminDashboard.jsx`):** Conditional rendering for admin link. Navigation to "Add New Machine", "View Analytics". Displays existing machines with "Edit" and "Delete" buttons. Soft-deleted machines are visually differentiated.
*   **Add Machine Page (`AddMachine.jsx`):** Dedicated page for adding machines with dynamic flag input fields.
*   **Edit Machine Page (`EditMachine.jsx`):** New page for editing existing machine details, pre-filling data, and updating via `PUT` endpoint.
*   **Analytics Dashboard (`AnalyticsDashboard.jsx`):** Displays various metrics (total users, machines, submissions, top users, machine completion rates) with visual charts (Line, Bar, Doughnut) using Chart.js. Layout adjusted to 3 columns.
*   **Changelog Feature (Backend & Frontend):**
    *   `Changelog` model added to `models.py` (with Alembic migration).
    *   `Changelog` schemas added to `schemas.py`.
    *   `POST /admin/machines/{machine_id}/changelog` endpoint added for admin to add entries.
    *   `GET /machines/{machine_id}/changelog` endpoint added for users to view entries.
    *   **Frontend (`MachineDetail.jsx`):** Implemented tabbed interface ("Machine Info" and "Changelog"), fetching and displaying changelog entries, and an admin-only form to add new entries.
*   **Generalized Machine Model & VirtualBox Integration:**
    *   **Problem:** Initial `Machine` model was Docker-specific, limiting extensibility.
    *   **Solution:** Refactored `Machine` model for generalization and integrated VirtualBox management.
        *   **Backend (`models.py`)::** Removed `docker_image`, `machine_type`, `vm_name`, `vm_snapshot_name`. Added `provider` (String, default "docker"), `source_identifier` (String, nullable), and `config_json` (String, nullable, for provider-specific JSON config like snapshot names).
        *   **Backend (`schemas.py`):** Updated `MachineBase` and `Machine` schemas to reflect these new fields.
        *   **Backend (`virtualbox_manager.py`):** New module created to encapsulate `VBoxManage` commands (`start_vm`, `stop_vm`, `reset_vm`, `get_vm_ip`) using `subprocess`.
        *   **Backend (`main.py`):**
            *   `create_admin_machine` and `update_machine` adjusted to handle `provider`, `source_identifier`, `config_json`.
            *   `start_machine`, `stop_machine`, `restart_machine` refactored to dispatch operations dynamically based on `db_machine.provider`.
        *   **Frontend (`AddMachine.jsx`, `EditMachine.jsx`):** Updated forms with `Provider` dropdown, generic `Source Identifier` input, and conditional `Config JSON` textarea for VirtualBox.
        *   **Frontend (`MachineDetail.jsx`):** Updated to display `Provider` and `Source Identifier`, and dynamically change "Start" button label.
*   **Frontend Core Refinements:**
    *   Centralized authentication guard in `MainLayout` (`App.jsx`) for robust route protection.
    *   `addNotification` utility correctly integrated across frontend components, replacing `alert()` calls.
    *   User registration (`POST /users/`) no longer requires admin authentication.
    *   Search box added to Dashboard (`Dashboard.jsx`) next to "Machines" title.
    *   Sidebar footer (Welcome message, Logout button) centered.
    *   **Frontend Error Message Clarity:** Enhanced `catch` blocks in `AddMachine.jsx` and `EditMachine.jsx` to parse and display detailed `422 Unprocessable Entity` validation errors from the backend.
*   **Current State:** Comprehensive admin panel with machine management (add, edit, soft-delete), analytics, and full changelog feature. Frontend core is more robust. Generalized machine provisioning supports Docker and VirtualBox.

## 3. How to Get Everything Running

To bring your entire VulnVerse platform back online, follow these steps. Open a NEW terminal window for each of the server processes (FastAPI and React) as they will occupy the terminal.

1.  **Start your PostgreSQL Database (if running in Docker):**
    ```bash
    docker start vulnverse-postgres
    ```
    (If you're using a local PostgreSQL installation, ensure its service is running.)

2.  **Start the OpenVPN Server (Docker Container):**
    ```bash
    docker start openvpn_server
    ```

3.  **Apply Pending Alembic Migrations (if any):**
    *   Navigate to `D:\Think\vulnverse`
    *   Run: `alembic -c alembic.ini upgrade head`
    *   **Note:** If you encounter "Multiple head revisions" error, run `alembic merge <head1_id> <head2_id> -m "Merge heads"` first, then `alembic upgrade head`.

4.  **Start the FastAPI Backend:**
    *   Navigate to `D:\Think\vulnverse`
    *   Activate your virtual environment: `.\venv\Scripts\activate`
    *   Run: `uvicorn main:app --reload`
    *   (Keep this terminal open and running.)

5.  **Start the React Frontend:**
    *   Navigate to `D:\Think\vulnverse\frontend`
    *   Run: `npm run dev`
    *   (Keep this terminal open and running.)

## 4. Troubleshooting Recap

This section summarizes the common issues encountered during development and their solutions, providing insights into debugging and problem-solving.

*   **Database Reset & Alembic Migration Issues:**
    *   **Problem:** Database corruption from raw `psql` queries, requiring a full reset.
    *   **Solution:** Drop and recreate database, then apply all Alembic migrations.
    *   **Problem:** `psycopg2.errors.ForeignKeyViolation` when deleting flags during machine update.
    *   **Solution:** Implemented soft-deletion for flags (`is_deleted` column) instead of physical deletion, preserving foreign key integrity.
    *   **Problem:** Alembic commands (e.g., `alembic upgrade head`, `alembic revision --autogenerate`) failed with "No 'script_location' key found" or "Multiple head revisions".
    *   **Reason:** Environmental issues with `run_shell_command` or branched migration history.
    *   **Solution:** Manual execution of Alembic commands (`alembic -c alembic.ini upgrade head`, `alembic merge <head1_id> <head2_id> -m "Merge heads"`) in the user's terminal.
*   **CORS (Cross-Origin Resource Sharing) Issues:**
    *   **Problem:** Frontend requests blocked by CORS policy (`Access-Control-Allow-Origin` header missing).
    *   **Reason:** Frontend (`localhost:5173`) and backend (`127.0.0.1:8000`) were considered different origins.
    *   **Solution:** Temporarily set `allow_origins=["*"]` in `CORSMiddleware` in `main.py` for development.
*   **Frontend/Backend Data Validation Mismatches:**
    *   **Problem:** `422 Unprocessable Entity` errors with `ResponseValidationError` (e.g., `config_json - Input should be a valid string`).
    *   **Reason:** Frontend was parsing `config_json` (a JSON string) into a JavaScript object before sending it, but the backend's Pydantic schema expected a string.
    *   **Solution:** Modified frontend (`AddMachine.jsx`, `EditMachine.jsx`) to send `config_json` as a raw string or `null`, allowing the backend to handle parsing.
*   **VirtualBox IP Retrieval Error:**
    *   **Problem:** `500 Internal Server Error: Could not retrieve IP for VirtualBox VM...`
    *   **Reason:** `virtualbox_manager.py` relies on VirtualBox Guest Additions to get the VM's IP via `VBoxManage guestproperty`. Guest Additions were not installed or configured correctly inside the VM.
    *   **Solution:** Manual installation and verification of VirtualBox Guest Additions within the guest VM.

## 5. Pending Tasks / Next Steps

*   **Further Admin Features:**
    *   User management (view, edit roles, delete users).
    *   Flag management (edit/delete flags).
*   **CTF Features:**
    *   Hints system.
    *   Dynamic scoring (points for flags based on time/difficulty).
    *   Challenge categories beyond machines (e.g., standalone web challenges, forensics).
*   **UI/UX Enhancements:**
    *   More refined styling and responsiveness (especially for the new search box functionality).
    *   Implement search functionality for machines in the Dashboard.
    *   User activity tracking (e.g., last seen, active sessions).
*   **Deployment:** Instructions for deploying the entire stack.
*   **Testing:** Implement unit and integration tests for new features.

### Phase 7: Dockerization

**Goal:** Containerize the Frontend (React) and Backend (FastAPI) applications for easier deployment and hosting. This phase involved creating Dockerfiles, updating `docker-compose.yml`, and resolving various environment-specific issues.

*   **`Dockerfile.backend` (Created in root directory):**
    *   **Purpose:** Builds the FastAPI backend application into a Docker image.
    *   **Key Changes:**
        *   `FROM python:3.10-slim-bullseye`: Changed from `python:3.10-slim-buster` to address Debian Buster's End-of-Life and repository 404 errors.
        *   `RUN apt-get update && apt-get install -y --no-install-recommends ...`: Installed system dependencies (`gcc`, `libpq-dev`, `netcat-traditional`) required for `psycopg2-binary` and database waiting. Combined `update` and `install` for robustness.
        *   `CMD ["/bin/bash", "-c", "while ! nc -z postgres 5432; do sleep 0.1; done; uvicorn main:app --host 0.0.0.0 --port 8000"]`: Ensures the backend waits for the PostgreSQL service (`postgres`) to be available before starting Uvicorn.
        *   **Static Change:** `nc -z postgres 5432` uses `postgres` as the service name for the database.

*   **`Dockerfile.frontend` (Created in `frontend/` directory):**
    *   **Purpose:** Builds the React frontend application into a Docker image.
    *   **Key Changes:**
        *   `FROM node:18 AS build`: Changed from `node:18-alpine` to a Debian-based Node.js image for better compatibility and to avoid potential missing build tools.
        *   `ENV VITE_API_BASE_URL=/api`: Set this environment variable to tell Vite where the API is located relative to the frontend, allowing Nginx to proxy requests.
        *   `ENV NODE_OPTIONS=--max_old_space_size=4096`: Set to increase Node.js memory during build, addressing potential memory-related build failures.

*   **`frontend/nginx.conf` (Created in `frontend/` directory):**
    *   **Purpose:** Nginx configuration to serve the React app and proxy API requests to the backend.
    *   **Key Changes:**
        *   `location /api/ { proxy_pass http://backend:8000/; ... }`: Configured Nginx to proxy requests to `/api/` to the `backend` service (Docker Compose service name) on port 8000.

*   **`docker-compose.yml` (Modified in root directory):**
    *   **Purpose:** Orchestrates all services (PostgreSQL, OpenVPN, Backend, Frontend).
    *   **Key Changes:**
        *   **`backend` service:**
            *   `build: { context: ., dockerfile: Dockerfile.backend }`: Instructs Docker Compose to build the backend image.
            *   `ports: "8000:8000"`.
            *   `environment: { DATABASE_URL: postgresql://admin:adityA10!@postgres:5432/vulnverse_db, SECRET_KEY: your-secret-key }`: `DATABASE_URL` uses `postgres` as the hostname; `SECRET_KEY` is a placeholder.
            *   `depends_on: - postgres`: Ensures PostgreSQL starts first.
            *   `volumes: - /var/run/docker.sock:/var/run/docker.sock`: Mounted the Docker daemon socket into the backend container, allowing the backend to manage other Docker containers (e.g., starting vulnerable machines).
        *   **`frontend` service:**
            *   `build: { context: ./frontend, dockerfile: Dockerfile.frontend }`: Instructs Docker Compose to build the frontend image.
            *   `ports: "8080:80"`: Mapped container port 80 to host port 8080 to avoid conflicts on host port 80.
            *   `depends_on: - backend`: Ensures backend starts first.
        *   **`postgres` and `openvpn` services:** Included with their full configurations, `ports`, and `volumes` to be managed by this `docker-compose.yml`.

*   **`requirements.txt` (Modified in root directory):**
    *   **Purpose:** To ensure compatible Python dependencies for the backend.
    *   **Key Changes:**
        *   `passlib==1.7.4`: Pinned version.
        *   `bcrypt==4.0.1`: Explicitly added and pinned version.
        *   `cffi==1.15.1`: Explicitly added and pinned version (often a dependency for `bcrypt`).
        *   Removed `[bcrypt]` from `passlib` as `bcrypt` is now explicitly listed.

*   **`frontend/package.json` (Modified in `frontend/` directory):**
    *   **Purpose:** To include necessary frontend dependencies.
    *   **Key Changes:**
        *   Added `"chart.js": "^4.4.3"` to `dependencies`.
        *   Added `"react-chartjs-2": "^5.2.0"` to `dependencies`.

*   **`frontend/src/services/api.js` (Modified in `frontend/src/services/` directory):**
    *   **Purpose:** To correctly configure the API base URL for the frontend when running in Docker.
    *   **Key Changes:**
        *   `baseURL: import.meta.env.VITE_API_BASE_URL,`: Changed from hardcoded `http://127.0.0.1:8000` to use the `VITE_API_BASE_URL` environment variable, which Nginx then proxies.

## 3. How to Get Everything Running

To bring your entire VulnVerse platform back online, follow these steps. Open a NEW terminal window for each of the server processes (FastAPI and React) as they will occupy the terminal.

1.  **Start your PostgreSQL Database (if running in Docker):**
    ```bash
    docker start vulnverse-postgres
    ```
    (If you're using a local PostgreSQL installation, ensure its service is running.)

2.  **Start the OpenVPN Server (Docker Container):**
    ```bash
    docker start openvpn_server
    ```

3.  **Apply Pending Alembic Migrations (if any):**
    *   Navigate to `D:\Think\vulnverse`
    *   Run: `alembic -c alembic.ini upgrade head`
    *   **Note:** If you encounter "Multiple head revisions" error, run `alembic merge <head1_id> <head2_id> -m "Merge heads"` first, then `alembic upgrade head`.

4.  **Start the FastAPI Backend:**
    *   Navigate to `D:\Think\vulnverse`
    *   Activate your virtual environment: `.\venv\Scripts\activate`
    *   Run: `uvicorn main:app --reload`
    *   (Keep this terminal open and running.)

5.  **Start the React Frontend:**
    *   Navigate to `D:\Think\vulnverse\frontend`
    *   Run: `npm run dev`
    *   (Keep this terminal open and running.)

## 4. Troubleshooting Recap

This section summarizes the common issues encountered during development and their solutions, providing insights into debugging and problem-solving.

*   **Database Reset & Alembic Migration Issues:**
    *   **Problem:** Database corruption from raw `psql` queries, requiring a full reset.
    *   **Solution:** Drop and recreate database, then apply all Alembic migrations.
    *   **Problem:** `psycopg2.errors.ForeignKeyViolation` when deleting flags during machine update.
    *   **Solution:** Implemented soft-deletion for flags (`is_deleted` column) instead of physical deletion, preserving foreign key integrity.
    *   **Problem:** Alembic commands (e.g., `alembic upgrade head`, `alembic revision --autogenerate`) failed with "No 'script_location' key found" or "Multiple head revisions".
    *   **Reason:** Environmental issues with `run_shell_command` or branched migration history.
    *   **Solution:** Manual execution of Alembic commands (`alembic -c alembic.ini upgrade head`, `alembic merge <head1_id> <head2_id> -m "Merge heads"`) in the user's terminal.
*   **CORS (Cross-Origin Resource Sharing) Issues:**
    *   **Problem:** Frontend requests blocked by CORS policy (`Access-Control-Allow-Origin` header missing).
    *   **Reason:** Frontend (`localhost:5173`) and backend (`127.0.0.1:8000`) were considered different origins.
    *   **Solution:** Temporarily set `allow_origins=["*"]` in `CORSMiddleware` in `main.py` for development.
*   **Frontend/Backend Data Validation Mismatches:**
    *   **Problem:** `422 Unprocessable Entity` errors with `ResponseValidationError` (e.g., `config_json - Input should be a valid string`).
    *   **Reason:** Frontend was parsing `config_json` (a JSON string) into a JavaScript object before sending it, but the backend's Pydantic schema expected a string.
    *   **Solution:** Modified frontend (`AddMachine.jsx`, `EditMachine.jsx`) to send `config_json` as a raw string or `null`, allowing the backend to handle parsing.
*   **VirtualBox IP Retrieval Error:**
    *   **Problem:** `500 Internal Server Error: Could not retrieve IP for VirtualBox VM...`
    *   **Reason:** `virtualbox_manager.py` relies on VirtualBox Guest Additions to get the VM's IP via `VBoxManage guestproperty`. Guest Additions were not installed or configured correctly inside the VM.
    *   **Solution:** Manual installation and verification of VirtualBox Guest Additions within the guest VM.

## 5. Pending Tasks / Next Steps

*   **Further Admin Features:**
    *   User management (view, edit roles, delete users).
    *   Flag management (edit/delete flags).
*   **CTF Features:**
    *   Hints system.
    *   Dynamic scoring (points for flags based on time/difficulty).
    *   Challenge categories beyond machines (e.g., standalone web challenges, forensics).
*   **UI/UX Enhancements:**
    *   More refined styling and responsiveness (especially for the new search box functionality).
    *   Implement search functionality for machines in the Dashboard.
    *   User activity tracking (e.g., last seen, active sessions).
*   **Deployment:** Instructions for deploying the entire stack.
*   **Testing:** Implement unit and integration tests for new features.
