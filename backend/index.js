const express = require("express");

const app = express();

app.use(express.json());

app.get("/",(req,res)=>{
    res.send("This is Entry Portal");
});

app.listen(5000,()=>{
    console.log("server is running on port 5000")
})