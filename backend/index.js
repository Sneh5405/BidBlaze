const express = require("express");
const cors = require("cors");
const app = express();
const authRoutes = require('./routes/auth')

app.use(express.json());
app.use(cors({origin:"http://localhost:5173",credentials: true}));
app.get("/",(req,res)=>{
    res.send("This is Entry Portal");
});
app.use("/auth",authRoutes);

app.listen(5000,()=>{
    console.log("server is running on port 5000")
})