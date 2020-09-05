const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('room', {
    roomId: req.query.room,
    userName: req.query.name,
  });
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });

    socket.on('client-message', (roomId, userName, message) => {
      io.to(roomId).emit('server-message', userName, message);
    });
  });
});

server.listen(3000);
