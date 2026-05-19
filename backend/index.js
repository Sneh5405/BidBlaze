const express = require("express");
const http = require('http')
const cors = require("cors");
const app = express();
const authRoutes = require('./routes/auth')
const auctionRoutes = require('./routes/auction')
const { Server } = require('socket.io')
const startAuctionScheduler = require('./scheduler/auctionScheduler')
const userRoutes = require('./routes/user')
const chatRoutes = require('./routes/chat')

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(express.json());
app.use(cors({origin:"http://localhost:5173",credentials: true}));
app.get("/",(req,res)=>{
    res.send("This is Entry Portal");
});
app.use("/auth",authRoutes);
app.use('/auction', auctionRoutes)
require('./socket/bidSocket.js')(io)
app.use('/user', userRoutes)
app.use('/chat', chatRoutes)

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`)
  startAuctionScheduler(io)  // ← start scheduler when server starts
})