# Manual Route Testing Guide

## 1. Health Check
```bash
curl -X GET http://localhost:5001/health
```

## 2. Disaster Routes

### Get all disasters
```bash
curl -X GET http://localhost:5001/api/disasters
```

### Create a disaster
```bash
curl -X POST http://localhost:5001/api/disasters \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Flood",
    "description": "Flooding in downtown Manhattan, NYC",
    "location_name": "Manhattan, NYC",
    "tags": ["flood", "emergency"]
  }'
```

### Update a disaster (replace {id} with actual ID)
```bash
curl -X PUT http://localhost:5001/api/disasters/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Flood Alert",
    "description": "Updated flooding situation",
    "tags": ["flood", "updated"]
  }'
```

### Delete a disaster (replace {id} with actual ID)
```bash
curl -X DELETE http://localhost:5001/api/disasters/{id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 3. Resource Routes

### Get resources for a disaster
```bash
curl -X GET http://localhost:5001/api/resources/test-disaster-id
```

### Get resources with location filtering
```bash
curl -X GET "http://localhost:5001/api/resources/test-disaster-id?lat=40.7128&lng=-74.0060&radius=5000"
```

## 4. Social Media Routes

### Get social media reports
```bash
curl -X GET http://localhost:5001/api/social-media/test-disaster-id
```

## 5. Geocoding Routes

### Geocode a location
```bash
curl -X POST http://localhost:5001/api/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Earthquake in San Francisco Bay Area",
    "location_name": "San Francisco"
  }'
```

## 6. Verification Routes

### Verify an image
```bash
curl -X POST http://localhost:5001/api/verification/verify-image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/disaster-photo.jpg",
    "context": "Flood damage assessment"
  }'
```

## 7. Test 404 Handler
```bash
curl -X GET http://localhost:5001/api/nonexistent
```

## Expected Responses

### Working Routes (should return 200):
- Health check: `{"status":"OK","timestamp":"..."}`
- Social media: Array of mock social media reports
- Geocoding: Location coordinates
- Image verification: Verification score and status

### Database-dependent Routes (may fail with placeholder credentials):
- Disasters: Will fail due to invalid Supabase credentials
- Resources: Will fail due to invalid Supabase credentials

### Error Routes:
- 404 routes: `{"error":"Route not found"}`