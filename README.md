# 💬 Real-Time Chat Application

A full-stack, production-grade real-time chat application built with **Node.js, Express, Socket.io, MongoDB, and React**. It features secure JWT authentication, 1-on-1 private messaging, multi-user group chat rooms, real-time presence tracking (online/offline), typing indicators, and media upload support.

---

## 🚀 Features

- 🔐 **Secure Authentication**:
  - Double-token architecture (Access Token & Refresh Token).
  - Secure, HTTP-only cookie storage.
  - Password hashing with `bcryptjs`.
- 💬 **1-to-1 Private Messaging**:
  - Direct real-time messaging between users.
  - Search and discover users.
  - Persistent message history in MongoDB.
- 👥 **Group Chat Rooms**:
  - Create custom group rooms with multiple participants.
  - Admin controls (add/remove members, rename group).
  - Multi-user broadcast via Socket.io room channels.
- 🟢 **Real-Time Presence & Status**:
  - Live online/offline status indicators.
  - Instant "User is typing..." indicators.
- 🖼️ **Media & Profile Avatars**:
  - Multipart upload with Multer disk storage.
  - Cloud storage integration with Cloudinary.
  - Automatic fallback to DiceBear SVG avatars.
- 🛠️ **Production Architecture**:
  - Standardized `ApiResponse` and `ApiError` utility wrappers.
  - Centralized global error handling middleware.
  - Clean separation of Express configuration (`app.js`) and HTTP/Socket server (`server.js`).

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **Real-Time Engine**: [Socket.io](https://socket.io/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: `multer` + `cloudinary`

### Frontend (Upcoming)
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State & Logic**: React Hooks (`useState`, `useEffect`, `useContext`, `useRef`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: Lucide React
- **Real-Time Client**: `socket.io-client`

---

## 📁 Project Structure

```
RealTimeChatApp/
├── backend/
│   ├── public/
│   │   └── temp/             # Temporary folder for Multer disk storage
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js         # MongoDB connection setup
│   │   ├── controllers/
│   │   │   ├── user.controller.js     # Auth, tokens, profile, user search
│   │   │   ├── chat.controller.js     # 1-to-1 & group room operations
│   │   │   └── message.controller.js  # Message sending & history
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js     # JWT verification middleware
│   │   │   ├── error.middleware.js    # Global error response formatter
│   │   │   └── multer.middleware.js   # Disk storage file handler
│   │   ├── models/
│   │   │   ├── user.model.js          # User schema with JWT instance methods
│   │   │   ├── chat.model.js          # 1-to-1 & group chat schema
│   │   │   └── message.model.js       # Chat messages schema
│   │   ├── routes/
│   │   │   ├── user.routes.js         # /api/users routes
│   │   │   ├── chat.routes.js         # /api/chats routes
│   │   │   └── message.routes.js      # /api/messages routes
│   │   ├── socket/
│   │   │   └── socket.js              # Socket.io connection, rooms, presence
│   │   ├── utils/
│   │   │   ├── ApiError.js            # Standardized API error class
│   │   │   ├── ApiResponse.js          # Standardized API response class
│   │   │   ├── asyncHandler.js         # Async error handler wrapper
│   │   │   └── cloudinary.js          # Cloudinary upload & delete helpers
│   │   ├── app.js            # Express app configuration & middlewares
│   │   ├── constants.js      # App constants (DB_NAME)
│   │   └── server.js         # Entry point (HTTP server + Socket.io + DB connect)
│   ├── .env                  # Environment variables
│   └── package.json
├── CONFIG_CHANGES.txt        # Checklist of environment configurations to customize
└── README.md
```

---

## 📡 REST API Documentation

### 1. User & Auth Endpoints (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register new user (with optional avatar file) | No |
| `POST` | `/api/users/login` | Log in user with email/username and password | No |
| `POST` | `/api/users/logout` | Clear refresh token & delete cookies | Yes |
| `POST` | `/api/users/refresh-token` | Regenerate access token via refresh token | No |
| `GET` | `/api/users/current-user` | Get authenticated user profile | Yes |
| `GET` | `/api/users?search=name` | Search & fetch users for contacts list | Yes |
| `PATCH`| `/api/users/avatar` | Update profile picture via Cloudinary | Yes |

### 2. Chat Endpoints (`/api/chats`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chats` | Access or create a 1-to-1 chat (`{ userId }`) | Yes |
| `GET` | `/api/chats` | Fetch all 1-to-1 and group chats for user | Yes |
| `POST` | `/api/chats/group` | Create a group chat (`{ name, users: [...] }`) | Yes |
| `PATCH`| `/api/chats/group/rename` | Rename group (`{ chatId, chatName }`) | Yes |
| `PATCH`| `/api/chats/group/add` | Add user to group (`{ chatId, userId }`) | Yes (Admin) |
| `PATCH`| `/api/chats/group/remove` | Remove user or leave group (`{ chatId, userId }`)| Yes |

### 3. Message Endpoints (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/messages` | Send message (`{ content, chatId }`) | Yes |
| `GET` | `/api/messages/:chatId` | Fetch all messages for a specific chat | Yes |

---

## ⚡ Socket.io Real-Time Events

### Client ➡️ Server
- `joinChat(chatId)`: User subscribes to a specific 1-to-1 or group room.
- `leaveChat(chatId)`: User leaves the room channel.
- `typing(chatId)`: Broadcasts that the user is typing in `chatId`.
- `stopTyping(chatId)`: Broadcasts that typing stopped.

### Server ➡️ Client
- `getOnlineUsers`: Emits array of active online user IDs whenever presence changes.
- `receiveMessage`: Emits newly created message in real time to the room participants.
- `typing`: Notifies room participants that a user is typing.
- `stopTyping`: Clears typing indicator.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=supersecretjwtkey_chat_app_12345
ACCESS_TOKEN_SECRET=supersecret_access_token_key_12345
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=supersecret_refresh_token_key_67890
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Cloudinary (Optional for custom avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

*See [`CONFIG_CHANGES.txt`](./CONFIG_CHANGES.txt) for step-by-step checklist of credentials to configure.*

---

## 🏃 Getting Started

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server with nodemon
npm run dev

# Or start in production mode
npm start
```

The backend server will run on `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`
