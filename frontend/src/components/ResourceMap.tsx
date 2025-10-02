import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Maximize, RefreshCw, AlertCircle } from 'lucide-react';

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
  }
}

const ResourceMap: React.FC<ResourceMapProps> = ({ disaster }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false); // FIX: Added missing state
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
  }, [mapLoaded, coordinates, resources]);

  const loadGoogleMaps = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      setMapError('Google Maps API key is not configured. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file.');
      return;
    }

    if (window.google?.maps || scriptLoadedRef.current) {
      setMapLoaded(true);
      return;
    }

    scriptLoadedRef.current = true;
    
    const callbackName = `initGoogleMap_${Date.now()}`;
    (window as any)[callbackName] = () => {
      setMapLoaded(true);
      delete (window as any)[callbackName];
    };
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      setMapError('Failed to load Google Maps. Please check your API key and internet connection.');
    };
    
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !coordinates || !window.google?.maps) return;

    try {
      markersRef.current.forEach(marker => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];

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

      // Add disaster location marker
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
    setLoading(true); // FIX: Now setLoading is defined
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
    if (!disaster.location_name) {
      setCoordinates({
        lat: 40.7128,
        lng: -74.0060,
        formatted_address: 'New York, NY, USA (Default)'
      });
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/api/geocode`, {
        location_name: disaster.location_name
      });
      setCoordinates(response.data.coordinates);
    } catch (error) {
      console.error('Error geocoding location:', error);
      setCoordinates({
        lat: 40.7128,
        lng: -74.0060,
        formatted_address: 'New York, NY, USA (Fallback)'
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'medical': return '🏥';
      case 'food': return '🍽️';
      case 'water': return '💧';
      case 'supply': return '📦';
      case 'transport': return '🚐';
      default: return '📍';
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'shelter': return '#4CAF50';
      case 'medical': return '#F44336';
      case 'food': return '#FF9800';
      case 'water': return '#2196F3';
      case 'supply': return '#9C27B0';
      case 'transport': return '#607D8B';
      default: return '#757575';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ position: 'relative', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div ref={mapRef} style={{ width: '100%', height: '450px', backgroundColor: 'var(--neutral-lightest)' }}>
            {mapError && (
              <div className="map-feedback-overlay">
                <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, maxWidth: '300px', textAlign: 'center' }}>{mapError}</p>
              </div>
            )}
            {!mapLoaded && !mapError && (
              <div className="map-feedback-overlay">
                <div className="loading-spinner" style={{ marginBottom: '0.5rem' }} />
                <p>Loading Map...</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 style={{marginTop: 0, fontWeight: 700}}>{disaster.location_name}</h3>
          {coordinates && (
            <p style={{color: 'var(--neutral-medium)', marginTop: '-0.5rem', fontSize: '0.9rem'}}>
              Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button onClick={refreshResources} disabled={loading} className="btn btn-secondary">
              <RefreshCw size={14}/> {loading ? 'Loading...' : 'Refresh Resources'}
            </button>
            <button onClick={centerMapOnDisaster} className="btn btn-secondary">
              <Maximize size={14}/> Center Map
            </button>
          </div>
          
          <h4 style={{fontWeight: 600, marginBottom: '0.75rem'}}>Legend</h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#ff4444'}}/> Disaster Zone</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#4CAF50'}}/> Shelter</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#F44336'}}/> Medical</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#FF9800'}}/> Food</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#2196F3'}}/> Water</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#9C27B0'}}/> Supplies</div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{fontWeight: 600}}>Resources ({resources.length})</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : resources.length > 0 ? (
          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
            {resources.map((resource, index) => (
              <motion.div 
                key={resource.id} 
                className="resource-item" 
                initial={{opacity: 0, x: -20}} 
                animate={{opacity: 1, x: 0}} 
                transition={{delay: index * 0.05}}
              >
                <div>
                  <p style={{fontWeight: 600, margin: 0}}>{resource.name}</p>
                  <span style={{fontSize: '0.8rem', color: 'var(--neutral-medium)'}}>{resource.type} • {resource.location_name}</span>
                </div>
                <button className="btn-icon" onClick={centerMapOnDisaster}>
                  <MapPin size={16}/>
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>No resources reported for this incident yet.</p>
          </div>
        )}
      </div>

      <style>{`
        .map-feedback-overlay { 
          display: flex; 
          flex-direction: column;
          align-items: center; 
          justify-content: center; 
          height: 100%; 
          font-weight: 500; 
          color: var(--neutral-medium); 
        }
        .legend-item { 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          font-size: 0.9rem; 
        }
        .legend-dot { 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          flex-shrink: 0;
        }
        .resource-item { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 0.75rem 1rem; 
          background-color: var(--neutral-lightest); 
          border-radius: var(--border-radius-md); 
          border: 1px solid var(--border-color); 
        }
        .btn-icon { 
          background: none; 
          border: none; 
          padding: 0.4rem; 
          border-radius: 50%; 
          cursor: pointer; 
          color: var(--neutral-medium); 
          transition: var(--transition-fast); 
          flex-shrink: 0;
        }
        .btn-icon:hover { 
          background-color: var(--neutral-light); 
          color: var(--primary-blue); 
        }
      `}</style>
    </div>
  );
};

export default ResourceMap;