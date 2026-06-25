# ⚡ BidBlaze — Real-Time Auction & Bidding Platform

BidBlaze is a premium, high-performance, full-stack real-time auction application. Built with a modern **React + Vite** frontend and a robust **Node.js + Express + Prisma + PostgreSQL** backend, BidBlaze incorporates **Redis** for rapid query caching and **Socket.io** for instantaneous real-time bid updates and buyer-seller chat.

---

## 🚀 Key Features

*   🔄 **Real-Time Synchronized Bids:** Instant bid updates are broadcasted to all active auction viewers using WebSockets. Atomic SQL updates ensure that bid collisions are prevented and only valid higher bids succeed.
*   ⏱️ **Automated Auction Scheduler:** A background cron scheduler (running every minute) automatically transitions auctions from `upcoming` to `active` when the start time passes, and from `active` to `completed` when the end time is reached.
*   💬 **Winner-Seller Live Chat:** Immediately upon auction completion, an exclusive chat room is generated for the winner and seller, facilitating seamless handover coordination via real-time messages.
*   ⚡ **Robust Caching Layer:** Caches expensive queries (like active listings) in Redis with customizable TTLs (Time To Live). Employs automated SCAN-based cache invalidation during data mutations (e.g., placing a new bid) to ensure consistency.
*   🛡️ **Multi-Tier Rate Limiting:** Custom IP- and user-based rate limiters protect the API from DDoS, OTP spamming, brute-force auth attempts, and malicious image upload operations.
*   📧 **OTP Email Verification:** Signup and password recovery flows are verified securely using temporary OTP tokens sent via Nodemailer.
*   🖼️ **Secure File Uploads:** Configured with Multer and Cloudinary to support multi-image uploads (up to 5 per listing) with cloud storage optimization.

---

## 🛠️ Tech Stack & Key Libraries

### Backend
*   **Core:** Node.js, Express.js (CommonJS modules)
*   **Database & ORM:** PostgreSQL, Prisma ORM
*   **Caching & Queue:** Redis (utilizing `ioredis`)
*   **Real-Time Communications:** Socket.io
*   **Validation:** Zod schemas
*   **Scheduling:** Node-cron
*   **Security:** JSON Web Tokens (JWT), BcryptJS, Express-rate-limit
*   **File Uploads:** Multer, Cloudinary API

### Frontend (`frontend/Auction`)
*   **Core:** React 19, Vite, Tailwind CSS
*   **State Management:** Zustand
*   **Routing:** React Router Dom (v7)
*   **Real-Time Communications:** Socket.io-client
*   **API Client:** Axios

---

## 📁 Repository Structure

```
BidBlaze/
├── backend/
│   ├── config/              # Redis, Mailer, and Cloudinary initializers
│   ├── controllers/         # Express controllers (auth, auction, chat, user)
│   ├── middleware/          # JWT auth, file upload rules, rate limiters, validation
│   ├── prisma/              # Prisma schema definition and migration log
│   ├── routes/              # Express API endpoint routers
│   ├── scheduler/           # Cron job definitions for auction activation/expiry
│   ├── socket/              # Web Socket event handlers for bidding and chat
│   ├── utils/               # Caching helpers and ephemeral OTP stores
│   ├── docker-compose.yml   # Local PostgreSQL + Redis + Adminer stack
│   ├── index.js             # Express application entrypoint
│   └── package.json
├── frontend/
│   └── Auction/
│       ├── src/
│       │   ├── api/         # Axios instance and API abstraction layers
│       │   ├── components/  # Reusable UI elements (Navbar, BidPanel, Countdown, etc.)
│       │   ├── pages/       # Page views (Dashboard, AuctionDetail, Chat, Login, etc.)
│       │   ├── store/       # Zustand store declarations (auth/user states)
│       │   ├── App.jsx      # Navigation and page layout declarations
│       │   └── main.jsx     # Vite render entry point
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.js
└── README.md                # Project documentation (this file)
```

---

## 🗄️ Database Schema & Relations

The PostgreSQL database is organized with the following main models using Prisma:

```mermaid
erDiagram
    User ||--o{ Auction : "sells"
    User ||--o{ Auction : "wins"
    User ||--o{ Bid : "places"
    User ||--o{ ChatRoom : "sellers chat"
    User ||--o{ ChatRoom : "winners chat"
    User ||--o{ Message : "sends"
    
    Auction ||--o{ Bid : "has"
    Auction ||--o| ChatRoom : "triggers"
    
    ChatRoom ||--o{ Message : "contains"
```

1.  **User:** Houses authentication details (email, password) and connects to seller listings, won auctions, placed bids, and participating chats.
2.  **Auction:** Defines the details of the item (start price, current price, status, image assets, category, start and end times). References a seller `User` and an optional winner `User`.
3.  **Bid:** Records bid amounts mapped to a specific `Auction` and bidder `User`. Relies on a composite index on `(auctionId, amount)` to retrieve the leading bid efficiently.
4.  **ChatRoom:** Connects a seller, the auction winner, and the respective completed `Auction`.
5.  **Message:** Captures textual logs sent within a `ChatRoom` by a sender `User`.

---

## ⚙️ Environment Variables Setup

Create a `.env` file inside the `backend/` directory:

```env
# Server Config
PORT=5000
JWT_SECRET="your_jwt_access_secret_key"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"

# Database Connection
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/bidblaze?schema=public&connection_limit=40"

# Redis Cache Config
REDIS_HOST="localhost"
REDIS_PORT=6379
# REDIS_PASSWORD="" # Uncomment if password-protected

# Cloudinary Integration (Image Uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Email Configuration (Nodemailer OTP delivery)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password" # Use App Passwords for Gmail OAuth
```

---

## 🚀 Installation & Local Setup

Ensure you have [Node.js](https://nodejs.org/), [Docker Desktop](https://www.docker.com/products/docker-desktop/), and Git installed.

### 1. Launch Services (PostgreSQL, Redis, Adminer)
Use Docker Compose to launch database, caching, and management instances:
```bash
cd backend
docker-compose up -d
```
*   **PostgreSQL** runs on port `5432`
*   **Redis** runs on port `6379`
*   **Adminer** (Database manager interface) runs on [http://localhost:8080](http://localhost:8080)

### 2. Configure Backend Server
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Set up database tables and run migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will run on port `5000` (or the `PORT` specified in your `.env` file).

### 3. Configure Frontend Client
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend/Auction
    ```
2.  Install client-side dependencies:
    ```bash
    npm install
    ```
3.  Run the Vite development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 WebSockets API Reference

Socket.io endpoints facilitate real-time auctions and live winner-seller chat rooms.

### Bidding Room Connections
*   **`join-auction` (Listener):** Accepts `auctionId` and adds the socket to the auction room channel.
*   **`place-bid` (Listener):** Accepts `{ auctionId, bidderId, amount }`. Validates input constraints and, if successful, updates the current price atomically, invalidates caches, saves the bid, and broadcasts details.
*   **`bid-updated` (Emitter):** Broadcasts `{ auctionId, currentPrice, bid }` to everyone in the room.
*   **`bid-error` (Emitter):** Notifies the initiator of validation or server failures.
*   **`leave-auction` (Listener):** Unsubscribes socket from the auction room channel.

### Live Chat Room Connections
*   **`join-chat` (Listener):** Accepts `roomId` and subscribes the user to the corresponding chat channel.
*   **`send-message` (Listener):** Accepts `{ roomId, senderId, content }`. Saves the message to the database and broadcasts the new entry to the room.
*   **`new-message` (Emitter):** Sends `{ id, content, sender, createdAt }` in real-time to active room listeners.
*   **`chat-error` (Emitter):** Returns authentication or transmission errors to the client.
*   **`leave-chat` (Listener):** Unsubscribes socket from the chat room channel.

---

## 🔌 REST API Endpoints

### 🔑 Authentication (`/auth`)
| Method | Endpoint | Description | Limit / Rate |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Initiates signup by generating and emailing verification OTP | 3 / min |
| `POST` | `/auth/verify-otp` | Validates OTP and persists new User profile | 10 / 15 min |
| `POST` | `/auth/resend-otp` | Re-sends the verification OTP | 3 / min |
| `POST` | `/auth/login` | Authenticates User by password & issues access/refresh tokens | 10 / 15 min |
| `POST` | `/auth/forgot-password` | Requests OTP reset token for password recovery | 3 / min |
| `POST` | `/auth/verify-login-otp` | Validates OTP to allow password resets | 10 / 15 min |
| `POST` | `/auth/refresh` | Refreshes expired access tokens | General |
| `POST` | `/auth/logout` | Clears refresh tokens and user sessions | General |

### 🔨 Auctions (`/auction`)
| Method | Endpoint | Description | Limit / Rate |
| :--- | :--- | :--- | :--- |
| `GET` | `/auction/all` | Lists all auctions (supports cache check & pagination) | General |
| `GET` | `/auction/:id` | Returns specific auction details and full bid history | General |
| `POST` | `/auction/create` | Creates new auction listing (supports up to 5 images) | 10 / hour |
| `DELETE` | `/auction/:id` | Removes an auction (Restricted to listing seller) | General |

### 👤 User Services (`/user`)
| Method | Endpoint | Description | Limit / Rate |
| :--- | :--- | :--- | :--- |
| `GET` | `/user/profile` | Fetches active authenticated user profile details | General |
| `GET` | `/user/my-auctions` | Lists auctions listed by current logged-in user | General |
| `GET` | `/user/my-bids` | Retrieves bid history associated with logged-in user | General |
| `GET` | `/user/my-wins` | Retrieves completed auctions won by user | General |

### 💬 Chat Rooms (`/chat`)
| Method | Endpoint | Description | Limit / Rate |
| :--- | :--- | :--- | :--- |
| `GET` | `/chat/rooms` | Lists active room portals (authorized for winner & seller) | General |
| `GET` | `/chat/rooms/:id` | Retrieves historical messages list inside specific chat room | General |
