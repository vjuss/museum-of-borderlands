const express = require("express");
var cors = require('cors');
const app = express();
app.use(cors());
app.use(express.static(__dirname + "/public"));


const port = process.env.PORT || 3000;
const http = require("http");
const server = http.createServer(app);
server.listen(port, () => console.log(`Server is running on port ${port}`));


const { Client, Message } = require('node-osc');
const client = new Client('10.100.116.218', 5000);



let broadcaster;

const io = require("socket.io")(server);

io.sockets.on("error", e => console.log(e));

io.sockets.on("connection", socket => {


  socket.on("broadcaster", () => {
    broadcaster = socket.id;
    socket.broadcast.emit("broadcaster");
  });
  socket.on("watcher", () => {
    socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("disconnect", () => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });

  socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });




  socket.on("param", function(data) {
    console.log(data);
    let address = data.address;
    client.send(address, data.val);
  });

});
