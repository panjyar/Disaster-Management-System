# Disaster Management System

A comprehensive disaster response platform with real-time updates and geospatial capabilities.

## Features

- Real-time disaster tracking and reporting
- Resource management and allocation
- Social media integration for crowd-sourced information
- Image verification using AI
- Geospatial queries and mapping
- RESTful API with WebSocket support

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL with PostGIS)
- **AI Services:** Google Gemini API
- **Mapping:** Google Maps API
- **Real-time:** Socket.IO
- **Frontend:** React (separate repository)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Set up database using `database-setup.sql`
5. Start the server: `npm start`

## API Endpoints

- `GET /health` - System health check
- `GET /api/disasters` - List all disasters
- `POST /api/disasters` - Create new disaster
- `GET /api/resources` - List all resources
- `GET /api/social-media/:disasterId` - Get social media reports

For complete API documentation, visit `/api/status` when the server is running.

## Setup Guide

See the setup guide in the artifacts for detailed configuration instructions.