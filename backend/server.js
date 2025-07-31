const app = require('./src/app');
console.log('What is app:', app);
const http = require('http');
const socketIo = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store io instance globally for use in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_disaster', (disasterId) => {
    socket.join(`disaster_${disasterId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});