# HaBITAW Backend

This is the Node.js/Express backend for the HaBITAW habit tracker.

## Setup

1.  **Navigate to server directory**:
    ```bash
    cd server
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the `server` directory based on `.env.example`.
    You strictly need to provide:
    *   `MONGODB_URI`: Your MongoDB Atlas connection string.
    *   `GMAIL_USER`: Your Gmail address for sending verification codes.
    *   `GMAIL_APP_PASSWORD`: Your Gmail App Password (not your login password).
    *   `JWT_SECRET`: A secure random string.

4.  **Run Server**:
    ```bash
    npm run dev
    ```
    The server works on port 5000 by default.

## API Usage

### Auth
*   `POST /api/auth/register`: { username, email, password } -> Sends email code
*   `POST /api/auth/verify`: { userId, code } -> Returns token
*   `POST /api/auth/login`: { email, password } -> Returns token

### Habits (Requires Bearer Token)
*   `GET /api/habits`: Get user habits
*   `POST /api/habits`: Create habit
*   `POST /api/habits/:id/toggle`: Check/Uncheck habit for today

## Frontend Connection

To connect your frontend:
1.  Use `fetch` or `axios` to make requests to `http://localhost:5000/api/...`.
2.  Store the `token` received from login in `localStorage`.
3.  Include `Authorization: Bearer <token>` header in authenticated requests.
