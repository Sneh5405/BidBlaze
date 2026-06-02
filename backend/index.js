require('dotenv').config();
const express = require("express");
const http = require('http')
const cors = require("cors");
const app = express();
const authRoutes = require('./routes/auth')
const cookieParser = require('cookie-parser');
const auctionRoutes = require('./routes/auction')
const { Server } = require('socket.io')
const startAuctionScheduler = require('./scheduler/auctionScheduler')
const userRoutes = require('./routes/user')
const chatRoutes = require('./routes/chat')
const apiLimiter = require('./middleware/rateLimiter')
const server = http.createServer(app)
const compression = require('compression')
const redis = require('./config/redis')
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(apiLimiter);
app.get("/", (req, res) => {
  res.send("This is Entry Portal");
});
redis.connect();
app.use("/auth", authRoutes);
app.use('/auction', auctionRoutes)
require('./socket/bidSocket.js')(io)
app.use('/user', userRoutes)
app.use('/chat', chatRoutes)

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`)
  startAuctionScheduler(io)  // ← start scheduler when server starts
})