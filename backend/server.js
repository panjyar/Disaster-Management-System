import app from './src/app.js';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import listEndpoints from 'express-list-endpoints';

console.log(listEndpoints(app)); 
const PORT = process.env.PORT || 5001;
const server = createServer(app);

const io = new SocketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : "http://localhost:3000",
    methods: ["GET", "POST"]
    
  }
});

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
