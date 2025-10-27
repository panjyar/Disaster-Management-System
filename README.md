#  Disaster Response Coordination Platform  
**Backend-Heavy MERN Stack Project**

![License](https://img.shields.io/badge/License-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-black?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini-AI-blueviolet)
![Deployed](https://img.shields.io/badge/Status-Deployed-success)

---

##  Overview  
A real-time coordination system built to manage disaster response using **AI-driven insights**, **geospatial queries**, and **live updates**.  
It consolidates citizen reports, relief resources, and official data into a single, intelligent platform.

---

##  Motivation  
During disasters, information is scattered across multiple platforms — social media, news, and official sites.  
My motivation was to build a unified system that merges these streams, enhances them with AI, and helps responders act faster with reliable, location-based intelligence.

---

##  Problem It Solves  
- **Centralizes** real-time data from citizens, authorities, and social media.  
- **Extracts** and verifies locations or images using Google **Gemini AI**.  
- **Maps** nearby resources with **Supabase/Postgres geospatial queries**.  
- **Broadcasts** live updates via **Socket.IO**.  
- **Caches** data intelligently to reduce redundant API calls.  

---

##  Tech Stack  

| Category | Technology |
|-----------|-------------|
| **Frontend** | React.js |
| **Backend** | Node.js, Express.js |
| **Database** | Supabase (PostgreSQL + Geospatial) |
| **AI Integration** | Google Gemini API |
| **Real-time** | Socket.IO |
| **Caching & Storage** | Supabase JSONB |
| **Maps/Geocoding** | Google Maps API / OpenStreetMap |
| **Deployment** | Render / Fly.io / Railway (Backend), Vercel / Netlify (Frontend) |

---

##  Features  
- 🧠 **AI-Powered Location Extraction:** Extracts coordinates from text using Gemini.  
- 🖼️ **Image Verification:** Validates authenticity through AI models.  
- 🗺️ **Geospatial Resource Mapping:** Finds resources near disaster areas.  
- ⚡ **Realtime Updates:** Broadcasts events using Socket.IO.  
- 📰 **Official Updates Scraper:** Fetches verified government/NGO reports.  
- 💾 **Smart Caching:** Optimizes response time with Supabase caching.  
- 💬 **Mock Social Feed:** Simulates citizen updates for testing.

---

##  What I Learned  
- Designing **AI-integrated backend systems** with multiple APIs.  
- Writing **geospatial SQL queries** and Supabase RPC functions.  
- Handling **real-time communication** efficiently with Socket.IO.  
- Deploying backend-heavy apps using **cloud-native tools**.  

---

##  What Makes It Stand Out  
- AI + Geospatial + Real-time — all integrated in one system.  
- Backend-first architecture optimized for reliability and scalability.  
- Intelligent caching and indexing for speed and efficiency.  
- Minimal frontend, but powerful backend workflows designed for real-world disaster coordination.

---

## Quick Start  

### Backend
```bash
cd backend
cp .env.example .env   # Fill in environment variables
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start
```
# Runs on http://localhost:3000

### Environment Variables (Backend)
```bash
PORT=5000
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GOOGLE_MAPS_API_KEY=
```

FRONTEND_URL=http://localhost:3000

### Database Setup
```bash
ables: disasters, resources, reports, cache
Spatial columns: disasters.location, resources.location
Indexes: GIST (spatial), GIN (tags)
RPC: nearby_resources(lon, lat, radius_m, p_disaster_id)
SQL file: backend/database-setup.sql
```

