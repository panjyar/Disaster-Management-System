import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface GeocodeResult {
  location_name: string;
  coordinates: {
    lat: number;
    lng: number;
    formatted_address?: string;
  };
}

const GeocodeTest: React.FC = () => {
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiInfo, setApiInfo] = useState<any>(null);

  const fetchApiInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/geocode`);
      setApiInfo(response.data);
    } catch (error) {
      console.error('Error fetching API info:', error);
    }
  };

  const testGeocode = async () => {
    if (!locationName && !description) {
      setError('Please provide either a location name or description');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/geocode`, {
        location_name: locationName || undefined,
        description: description || undefined
      });
      setResult(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Geocoding failed');
    } finally {
      setLoading(false);
    }
  };

  const presetLocations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA'
  ];

  const presetDescriptions = [
    'Severe flooding reported in downtown Manhattan area',
    'Earthquake damage visible near Golden Gate Bridge in San Francisco',
    'Wildfire spreading through Malibu hills in Los Angeles County',
    'Hurricane damage along Miami Beach coastline',
    'Tornado touchdown reported in Moore, Oklahoma'
  ];

  React.useEffect(() => {
    fetchApiInfo();
  }, []);

  return (
    <div className="geocode-test">
      <div className="api-section">
        <h2>🌍 Geocoding API Tester</h2>
        <p>Test the location extraction and geocoding functionality.</p>
        
        {apiInfo && (
          <div className="api-info">
            <h3>📋 API Information</h3>
            <div className="api-details">
              <p><strong>Description:</strong> {apiInfo.message}</p>
              <div className="endpoints">
                <h4>Available Endpoints:</h4>
                {Object.entries(apiInfo.endpoints).map(([endpoint, description]) => (
                  <div key={endpoint} className="endpoint">
                    <code>{endpoint}</code> - {description as string}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="test-form">
          <div className="form-section">
            <h3>🎯 Method 1: Direct Location Input</h3>
            <div className="form-group">
              <label htmlFor="location">Location Name:</label>
              <input
                id="location"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., New York, NY"
              />
            </div>
            <div className="preset-buttons">
              <p>Quick presets:</p>
              <div className="button-grid">
                {presetLocations.map(location => (
                  <button
                    key={location}
                    onClick={() => setLocationName(location)}
                    className="preset-btn"
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divider">OR</div>

          <div className="form-section">
            <h3>🔍 Method 2: Extract from Description</h3>
            <div className="form-group">
              <label htmlFor="description">Description (AI will extract location):</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Flooding reported in downtown Manhattan area"
                rows={4}
              />
            </div>
            <div className="preset-buttons">
              <p>Sample descriptions:</p>
              <div className="description-presets">
                {presetDescriptions.map(desc => (
                  <button
                    key={desc}
                    onClick={() => setDescription(desc)}
                    className="preset-desc-btn"
                  >
                    {desc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={testGeocode} 
              disabled={loading || (!locationName && !description)}
              className="test-btn"
            >
              {loading ? '🔄 Processing...' : '🌍 Test Geocoding'}
            </button>
            <button 
              onClick={() => {
                setLocationName('');
                setDescription('');
                setResult(null);
                setError('');
              }}
              className="clear-btn"
            >
              🧹 Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <h4>❌ Error</h4>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3>✅ Geocoding Result</h3>
            <div className="result-card">
              <div className="result-item">
                <strong>📍 Location Name:</strong>
                <span>{result.location_name}</span>
              </div>
              <div className="result-item">
                <strong>🌐 Coordinates:</strong>
                <span>
                  Lat: {result.coordinates.lat.toFixed(6)}, 
                  Lng: {result.coordinates.lng.toFixed(6)}
                </span>
              </div>
              {result.coordinates.formatted_address && (
                <div className="result-item">
                  <strong>🗺️ Formatted Address:</strong>
                  <span>{result.coordinates.formatted_address}</span>
                </div>
              )}
              <div className="map-links">
                <a 
                  href={`https://www.google.com/maps/@${result.coordinates.lat},${result.coordinates.lng},15z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  📍 View on Google Maps
                </a>
                <a 
                  href={`https://www.openstreetmap.org/#map=15/${result.coordinates.lat}/${result.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  🗺️ View on OpenStreetMap
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="usage-info">
          <h3>📚 How It Works</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>🤖 AI Location Extraction</h4>
              <p>Uses Google Gemini AI to extract location names from natural language descriptions.</p>
            </div>
            <div className="info-card">
              <h4>🌍 Geocoding Service</h4>
              <p>Converts location names to precise latitude/longitude coordinates using mapping services.</p>
            </div>
            <div className="info-card">
              <h4>💾 Smart Caching</h4>
              <p>Results are cached to improve performance and reduce API calls.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeocodeTest;