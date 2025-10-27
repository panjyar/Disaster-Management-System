# Disaster Response Coordination Platform (Backend-heavy MERN)

Minimal frontend + feature-rich Node/Express backend to coordinate disaster response using Gemini for location extraction and image verification, Supabase for storage + geospatial queries + caching, mock social media, official updates scraping, and Socket.IO for realtime.

## Monorepo Structure

- backend/ — Node.js/Express API with Supabase, Gemini, geocoding, caching, WebSockets
- frontend/ — Minimal React UI to exercise backend features

## Quick Start

- Backend
  - Copy backend/.env.example to backend/.env and fill values
  - Apply SQL in backend/database-setup.sql to your Supabase project (SQL editor)
  - Install deps and run
    - cd backend && npm install && npm run dev
  - API base: http://localhost:5000
- Frontend
  - Set REACT_APP_API_URL=http://localhost:5000 in frontend/.env (optional; defaults to 5000)
  - cd frontend && npm install && npm start
  - UI: http://localhost:3000

## Environment Variables (backend/.env)

- PORT=5000
- SUPABASE_URL, SUPABASE_ANON_KEY
- GEMINI_API_KEY (aistudio.google.com/app/apikey)
- GOOGLE_MAPS_API_KEY (optional; falls back to OSM Nominatim)
- FRONTEND_URL=http://localhost:3000

## Database Schema (Supabase/Postgres)

- Tables: disasters, resources, reports, cache
- Geospatial columns: disasters.location, resources.location (geography(Point,4326))
- Indexes: GIST on location columns; GIN on disasters.tags
- RPC: nearby_resources(lon, lat, radius_m, p_disaster_id) using ST_DWithin
- Apply via backend/database-setup.sql

## Authentication (Mock)

- Send headers to simulate users/roles
  - x-user: netrunnerX | reliefAdmin | citizen1
  - x-role: contributor | admin
- Routes requiring roles
  - POST /api/disasters (contributor)
  - PUT /api/disasters/:id (contributor)
  - DELETE /api/disasters/:id (admin)
  - POST /api/disasters/:id/reports (contributor)
  - POST /api/resources (contributor)

## Realtime (Socket.IO)

- Events
  - disaster_created, disaster_updated, disaster_deleted
  - social_media_updated
  - resource_created, resources_updated
  - official_updates
- Clients can join rooms per disaster: join_disaster -> `disaster_<id>`

## Key Endpoints

- Health/Status
  - GET /health
  - GET /api/status
- Disasters
  - GET /api/disasters[?tag=&owner_id=&limit=&offset=]
  - POST /api/disasters
  - PUT /api/disasters/:id
  - DELETE /api/disasters/:id
  - POST /api/disasters/:id/reports
- Resources
  - GET /api/resources
  - GET /api/resources/:disasterId[?lat=&lng=&radius=10000&limit=20] (geospatial RPC if lat/lng)
  - POST /api/resources
- Social Media (mock)
  - GET /api/social-media
  - GET /api/social-media/:disasterId
- Geocoding
  - GET /api/geocode
  - POST /api/geocode { location_name? , description? } → Gemini location extract + Maps/OSM geocode
- Image Verification (Gemini-like)
  - GET /api/verification
  - POST /api/verification/verify-image { image_url, context? }
- Official Updates (scraped + cached)
  - GET /api/updates
  - GET /api/updates/:disasterId/official-updates

## Caching

- cache table: key, value (JSONB), expires_at
- Cached: social media mock (15m), geocoding (24h), Gemini requests (1h), official updates (1h)

## Geocoding

- Prefers Google Maps Geocoding API if key present, else falls back to OpenStreetMap Nominatim
- Gemini extracts locations from freeform description when location_name not provided

## Sample Requests

```
curl -X POST http://localhost:5000/api/disasters \
  -H "Content-Type: application/json" \
  -H "x-user: netrunnerX" -H "x-role: contributor" \
  -d '{
    "title": "NYC Flood",
    "location_name": "Manhattan, NYC",
    "description": "Heavy flooding in Manhattan",
    "tags": ["flood", "urgent"],
    "owner_id": "netrunnerX"
  }'

curl "http://localhost:5000/api/resources/<DISASTER_ID>?lat=40.7128&lng=-74.0060&radius=10000"

curl -X POST http://localhost:5000/api/disasters/<DISASTER_ID>/reports \
  -H "Content-Type: application/json" \
  -H "x-user: citizen1" -H "x-role: contributor" \
  -d '{"content": "Need food in Lower East Side","image_url":"http://example.com/flood.jpg"}'
```

## Frontend Notes

- React app in frontend/ exercises APIs and listens to WebSocket events
- Set REACT_APP_API_URL to target backend

## Shortcuts/Assumptions

- Social media is mocked; integrate Twitter/Bluesky if keys available
- Gemini image verification returns a simulated score unless a vision-capable model is wired
- Official updates scraping uses heuristic selectors and may vary by source markup

## Deployment

- Frontend: Vercel or Netlify build in frontend/
- Backend: Render/Fly.io/railway app in backend/
- Configure environment variables and CORS FRONTEND_URL

## AI Tooling Note

- Routes, caching, and geospatial logic drafted with Windsurf Cascade assistance.
