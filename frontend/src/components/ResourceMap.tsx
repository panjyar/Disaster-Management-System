import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Resource {
  id: string;
  name: string;
  location_name: string;
  type: string;
  created_at: string;
}

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
}

interface Coordinates {
  lat: number;
  lng: number;
  formatted_address?: string;
}

interface ResourceMapProps {
  disaster: Disaster;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap?: () => void;
  }
}

const ResourceMap: React.FC<ResourceMapProps> = ({ disaster }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const scriptLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    fetchResources();
    geocodeLocation();
  }, [disaster.id]);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapLoaded && coordinates) {
      initializeMap();
    }
  }, [mapLoaded, coordinates]);

  const loadGoogleMaps = () => {
    // Check if API key is available
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      setMapError('Google Maps API key not configured. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your environment variables.');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (scriptLoadedRef.current || document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    scriptLoadedRef.current = true;

    // Create script element with proper callback
    const script = document.createElement('script');
    const callbackName = `initGoogleMap_${Date.now()}`;
    
    // Set up the callback function
    (window as any)[callbackName] = () => {
      setMapLoaded(true);
      delete (window as any)[callbackName];
    };
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setMapError('Google Maps failed to load. Please check your API key and network connection.');
      scriptLoadedRef.current = false;
    };
    
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !coordinates || !window.google?.maps) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];

      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      googleMapRef.current = map;

      // Add disaster location marker (using standard marker for compatibility)
      const disasterMarker = new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map,
        title: disaster.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(createMarkerSVG('⚠️', '#ff4444')),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      const disasterInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">${disaster.title}</h3>
            <p style="margin: 0; color: #666; font-size: 12px;"><strong>Location:</strong> ${disaster.location_name}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;"><strong>Type:</strong> Disaster Zone</p>
          </div>
        `
      });

      disasterMarker.addListener('click', () => {
        disasterInfoWindow.open(map, disasterMarker);
      });

      markersRef.current.push(disasterMarker);

      // Add resource markers
      resources.forEach((resource) => {
        // Generate random coordinates near the disaster location for demo
        const offsetLat = (Math.random() - 0.5) * 0.02;
        const offsetLng = (Math.random() - 0.5) * 0.02;
        
        const resourceMarker = new window.google.maps.Marker({
          position: { 
            lat: coordinates.lat + offsetLat, 
            lng: coordinates.lng + offsetLng 
          },
          map: map,
          title: resource.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
              createMarkerSVG(getResourceIcon(resource.type), getResourceColor(resource.type))
            ),
            scaledSize: new window.google.maps.Size(24, 24)
          }
        });

        const resourceInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">${resource.name}</h4>
              <p style="margin: 0; color: #666; font-size: 12px;"><strong>Type:</strong> ${resource.type}</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;"><strong>Location:</strong> ${resource.location_name}</p>
            </div>
          `
        });

        resourceMarker.addListener('click', () => {
          resourceInfoWindow.open(map, resourceMarker);
        });

        markersRef.current.push(resourceMarker);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please try refreshing the page.');
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/resources/${disaster.id}`);
      const resourceData = Array.isArray(response.data) ? response.data : [];
      setResources(resourceData);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocation = async () => {
    if (!disaster.location_name) return;
    
    try {
      const response = await axios.post(`${API_URL}/api/geocode`, {
        location_name: disaster.location_name
      });
      setCoordinates(response.data.coordinates);
    } catch (error) {
      console.error('Error geocoding location:', error);
      // Fallback to a default location (NYC) for demo
      setCoordinates({
        lat: 40.7128,
        lng: -74.0060,
        formatted_address: 'New York, NY, USA'
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'hospital': return '🏥';
      case 'food': return '🍽️';
      case 'water': return '💧';
      case 'supplies': return '📦';
      default: return '📍';
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'shelter': return '#4CAF50';
      case 'hospital': return '#F44336';
      case 'food': return '#FF9800';
      case 'water': return '#2196F3';
      case 'supplies': return '#9C27B0';
      default: return '#607D8B';
    }
  };

  const createMarkerSVG = (icon: string, color: string) => {
    return `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="12" fill="white">${icon}</text>
      </svg>
    `;
  };

  const refreshResources = () => {
    fetchResources();
  };

  const centerMapOnDisaster = () => {
    if (googleMapRef.current && coordinates) {
      googleMapRef.current.setCenter({ lat: coordinates.lat, lng: coordinates.lng });
      googleMapRef.current.setZoom(13);
    }
  };

  return (
    <div className="resource-map">
      <div className="map-controls">
        <button onClick={refreshResources} className="control-btn">
          🔄 Refresh Resources
        </button>
        <button onClick={centerMapOnDisaster} className="control-btn">
          🎯 Center on Disaster
        </button>
        <button onClick={geocodeLocation} className="control-btn">
          📍 Refresh Location
        </button>
      </div>

      <div className="location-info">
        <h3>📍 {disaster.location_name || 'Location Unknown'}</h3>
        {coordinates && (
          <>
            <div className="coordinates">
              📌 Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
            </div>
            <div className="formatted-address">
              🗺️ {coordinates.formatted_address}
            </div>
          </>
        )}
      </div>

      {/* Google Maps Container */}
      <div className="map-container">
        <div ref={mapRef} className="google-map" style={{ width: '100%', height: '400px' }}>
          {mapError && (
            <div className="map-error" style={{ 
              padding: '20px', 
              textAlign: 'center', 
              background: '#ffebee', 
              color: '#c62828',
              border: '1px solid #ef9a9a',
              borderRadius: '4px'
            }}>
              <p>⚠️ {mapError}</p>
            </div>
          )}
          {!mapLoaded && !mapError && (
            <div className="map-loading" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: '#f5f5f5',
              color: '#666'
            }}>
              <div>
                <p>Loading Google Maps...</p>
                <div className="loading-spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ccc',
                  borderTop: '2px solid #666',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="resources-section">
        <div className="resources-header">
          <h4>🛠️ Available Resources ({resources.length})</h4>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#ff4444' }}></span>
              Disaster Zone
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
              Shelter
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
              Medical
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
              Food
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#2196F3' }}></span>
              Water
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#9C27B0' }}></span>
              Supplies
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : resources.length > 0 ? (
          <div className="resources-list">
            {resources.map((resource, index) => (
              <div key={resource.id} className="resource-item">
                <div className="resource-header">
                  <span className="resource-icon">
                    {getResourceIcon(resource.type)}
                  </span>
                  <span className="resource-name">{resource.name}</span>
                  <span 
                    className="resource-type"
                    style={{ backgroundColor: getResourceColor(resource.type) }}
                  >
                    {resource.type}
                  </span>
                </div>
                <div className="resource-location">
                  📍 {resource.location_name}
                </div>
                <div className="resource-actions">
                  <button 
                    onClick={() => {
                      if (googleMapRef.current && markersRef.current[index + 1]) {
                        // Focus on this resource marker (index + 1 because disaster marker is at index 0)
                        const marker = markersRef.current[index + 1];
                        googleMapRef.current.setCenter(marker.getPosition());
                        googleMapRef.current.setZoom(15);
                        // Trigger the info window
                        if (window.google?.maps?.event) {
                          window.google.maps.event.trigger(marker, 'click');
                        }
                      }
                    }}
                    className="resource-action-btn"
                  >
                    📍 Show on Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-resources">
            <p>📦 No resources mapped yet.</p>
            <small>Resources will appear here as they are reported and will be shown on the map above.</small>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ResourceMap;