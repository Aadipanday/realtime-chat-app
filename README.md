# 💬 Real-Time Chat Application (WhatsApp Web Clone)

A modern, full-stack, production-grade real-time messaging platform inspired by **WhatsApp Web**, built with **Node.js, Express, Socket.io, MongoDB, React, and Tailwind CSS**.

It features cryptographic JWT socket authentication, 1-to-1 private chats, multi-user groups, voice notes, image sharing, message emoji reactions, delivery/read tick receipts, accurate "last seen" tracking, background desktop notifications, and robust security hardening.

---

## ✨ Key Features

### 💬 Messaging & Media
- **1-to-1 & Group Chats**: Seamless private messaging and multi-user group channels with administrative controls.
- **WhatsApp Checkmark Receipts**:
  - `✓` **Sent**: Message recorded on server.
  - `✓✓` **Delivered**: Recipient is online and received the message.
  - <span style="color:#53bdeb">`✓✓`</span> **Read/Seen**: Recipient opened the chat (instant blue tick sync).
- **Voice Audio Notes**: Browser `MediaRecorder` voice recording with live duration timer, cancel/discard controls, and custom audio player with play/pause and seek scrubbing.
- **Image Sharing & Lightbox**: Send photos with optional captions; view images in full-screen zoomable lightbox with direct download.
- **Emoji Reactions**: Hover over any message to react with quick emojis (`👍`, `❤️`, `😂`, `😮`, `😢`, `🙏`), aggregated in real-time reaction pills.
- **Message Deletion**: Senders can delete messages in real time with instant deletion across all participants' screens.
- **Typing Indicators**: Real-time "typing..." animation in chat headers and conversation lists.

### 🟢 Real-Time Presence & Notifications
- **Accurate "Last Seen" Status**: Tracks exact disconnect times (`last seen today at 10:20 PM`, `last seen yesterday`, etc.) and shows live green indicators when online.
- **Multi-Tab Resilience**: Backend tracks `Map<userId, Set<socketId>>`, ensuring users stay marked online across page reloads and multiple active tabs.
- **Browser Push Notifications**: Desktop alerts when messages arrive while the chat tab is hidden or backgrounded.

### 🛡️ Enterprise Security Hardening
- **Cryptographic Socket Handshake**: All Socket.io connections strictly require and verify a signed JWT token—raw `userId` query spoofing and impersonation attacks are completely blocked.
- **Room Authorization**: Validates chat membership on `joinChat` before letting users join any socket room.
- **Rate Limiting**: `express-rate-limit` prevents brute-force attacks on `/api/users/login` and `/api/users/register` (max 10 requests per 15 minutes).
- **MIME Type Whitelisting**: Strict Multer filter allows only safe image (`jpeg`, `png`, `webp`, `gif`) and audio (`webm`, `mp3`, `ogg`, `wav`, `m4a`) uploads.
- **Security Headers**: Standard HTTP security headers enabled via `helmet`.
- **ReDoS Protection**: Regex sanitization on user search queries to prevent regular expression denial-of-service.
- **Double Token Architecture**: `accessToken` (1 day) and `refreshToken` (7 days) with `httpOnly` secure cookies.

### 🎨 WhatsApp UI & Customization
- Authentic WhatsApp Web dark theme layout with custom chat wallpaper.
- Built-in theme switcher (WhatsApp Dark, Emerald, Midnight Blue, Slate).
- User profile modal with custom avatar upload via Cloudinary and DiceBear fallbacks.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Real-Time Client**: [Socket.io Client](https://socket.io/docs/v4/client-api/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/) + Web Notification API

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **WebSockets**: [Socket.io](https://socket.io/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Security**: `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`
- **File Handling**: `multer`, [Cloudinary SDK](https://cloudinary.com/)

---

## 📁 Project Structure

```
RealTimeChatApp/
├── backend/
│   ├── public/temp/              # Temporary disk staging for file uploads
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB Mongoose connection
│   │   ├── controllers/
│   │   │   ├── user.controller.js  # Auth, profile, user search
│   │   │   ├── chat.controller.js  # 1-to-1 & group room operations
│   │   │   └── message.controller.js # Messaging, media, reactions, deletion
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js  # JWT verification for Express routes
│   │   │   ├── error.middleware.js # Standardized global error handler
│   │   │   └── multer.middleware.js # Disk storage & MIME type validation
│   │   ├── models/
│   │   │   ├── user.model.js       # User schema with bcrypt & token generators
│   │   │   ├── chat.model.js       # Conversation schema
│   │   │   └── message.model.js    # Message schema with reactions & mediaUrl
│   │   ├── routes/
│   │   │   ├── user.routes.js      # /api/users
│   │   │   ├── chat.routes.js      # /api/chats
│   │   │   └── message.routes.js   # /api/messages
│   │   ├── socket/
│   │   │   └── socket.js           # JWT socket handshake, rooms, presence
│   │   ├── utils/
│   │   │   ├── ApiError.js         # Custom API error wrapper
│   │   │   ├── ApiResponse.js      # Standardized API response format
│   │   │   ├── asyncHandler.js     # Async controller wrapper
│   │   │   └── cloudinary.js       # Cloudinary upload utility
│   │   ├── app.js                 # Express configuration, helmet, rate limiting
│   │   └── server.js              # HTTP server & Socket.io initialization
│   ├── .env                       # Backend environment variables
│   └── package.json
│
├── frontend/
│   ├── public/                    # Static assets & icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/              # Login & Register views
│   │   │   ├── ChatArea/          # ChatHeader, MessageList, MessageInput
│   │   │   ├── Common/            # Avatar, ThemeModal, ProfileModal
│   │   │   └── Sidebar/           # Sidebar, UserSearchModal, CreateGroupModal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state & token storage
│   │   │   ├── ChatContext.jsx    # Messages, chats, reactions, desktop notifications
│   │   │   ├── SocketContext.jsx  # Authenticated socket lifecycle & presence
│   │   │   └── ThemeContext.jsx   # Dynamic themes & styling
│   │   ├── services/
│   │   │   └── api.js             # Axios instance with credentials
│   │   ├── App.jsx
│   │   ├── index.css              # WhatsApp custom CSS variables & wallpaper
│   │   └── main.jsx
│   ├── vite.config.js             # Vite proxy configuration
│   └── package.json
└── README.md
```

---

## 📡 REST API Reference

### 1. User & Authentication (`/api/users`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/users/register` | Register new user (supports avatar upload) | ❌ |
| `POST` | `/api/users/login` | Login with username/email & password (rate-limited) | ❌ |
| `POST` | `/api/users/logout` | Logout and clear session cookies | 🔒 |
| `POST` | `/api/users/refresh-token` | Renew expired access token | ❌ |
| `GET` | `/api/users/current-user` | Get logged-in user profile & access token | 🔒 |
| `GET` | `/api/users?search=query` | Search user directory (ReDoS-protected) | 🔒 |
| `PATCH`| `/api/users/avatar` | Update user avatar image | 🔒 |

### 2. Conversations (`/api/chats`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/chats` | Create or fetch 1-to-1 conversation | 🔒 |
| `GET` | `/api/chats` | List all conversations for active user | 🔒 |
| `POST` | `/api/chats/group` | Create group chat with participants | 🔒 |
| `PATCH`| `/api/chats/group/rename` | Rename group (authorized members only) | 🔒 |
| `PATCH`| `/api/chats/group/add` | Add member to group | 🔒 Admin |
| `PATCH`| `/api/chats/group/remove` | Remove member or leave group | 🔒 |

### 3. Messages (`/api/messages`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/messages` | Send message (supports text, image, or audio) | 🔒 |
| `GET` | `/api/messages/:chatId` | Fetch message history & mark messages read | 🔒 |
| `PATCH`| `/api/messages/:messageId/react` | Add/toggle emoji reaction (`{ emoji }`) | 🔒 |
| `DELETE`| `/api/messages/:messageId` | Delete message (sender only) | 🔒 |

---

## ⚡ Socket.io Event Documentation

### Client ➡️ Server
- `joinChat(chatId)`: Authorizes and joins user to chat room.
- `leaveChat(chatId)`: Leaves chat room.
- `markAsRead({ chatId, userId })`: Marks messages as read in database and notifies sender.
- `typing(chatId)`: Emits typing indicator.
- `stopTyping(chatId)`: Emits stop typing indicator.

### Server ➡️ Client
- `getOnlineUsers`: Broadcasts array of active online user IDs.
- `userStatusChanged`: Broadcasts real-time `{ userId, isOnline, lastSeen }` on connect/disconnect.
- `receiveMessage`: Delivers new message to chat room.
- `messageNotification`: Sends notification to offline or inactive chat recipients.
- `messagesRead`: Notifies sender when recipient reads messages (turns checks blue).
- `messageReactionUpdated`: Syncs emoji reactions across all participants.
- `messageDeleted`: Broadcasts message removal in real time.
- `newChatCreated`: Notifies recipient when a new 1-on-1 or group conversation is started.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (`frontend/.env`) *(Optional in development due to Vite proxy)*
```env
VITE_API_URL=/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local MongoDB instance
- [Cloudinary Account](https://cloudinary.com/) (for media uploads)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/RealTimeChatApp.git
cd RealTimeChatApp
```

### 2. Setup & Run Backend
```bash
cd backend
npm install
npm run dev
```
*The backend server will start on `http://localhost:5000`.*

### 3. Setup & Run Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*The Vite frontend will launch on `http://localhost:5173`.*

---

## 🔒 Security Notes
- Messages are transmitted over secure WebSocket/HTTP connections (`TLS/HTTPS` in production).
- Passwords are salted and hashed with `bcryptjs` (cost factor 10).
- Cross-site script access to session tokens is protected using `httpOnly` cookies and strict socket authentication.
- In production, set `NODE_ENV=production` so cookies enforce `secure: true` and `SameSite: strict/none`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
