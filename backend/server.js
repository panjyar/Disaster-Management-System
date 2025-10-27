import app from './src/app.js';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import listEndpoints from 'express-list-endpoints';

console.log(listEndpoints(app)); 
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Build allowed origins consistent with Express CORS
const prodOrigins = [];
if (process.env.FRONTEND_URL) prodOrigins.push(process.env.FRONTEND_URL);
if (process.env.FRONTEND_URLS) {
  prodOrigins.push(
    ...process.env.FRONTEND_URLS.split(',').map(s => s.trim()).filter(Boolean)
  );
}

const io = new SocketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? prodOrigins 
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type','x-user','x-role'],
    credentials: true
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
