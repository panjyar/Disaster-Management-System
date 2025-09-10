import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Maximize, RefreshCw } from 'lucide-react';

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
const createMarkerHTML = (icon: string, color: string, size: number = 32) => {
  const markerDiv = document.createElement('div');
  markerDiv.style.width = `${size}px`;
  markerDiv.style.height = `${size}px`;
  markerDiv.style.borderRadius = '50%';
  markerDiv.style.backgroundColor = color;
  markerDiv.style.display = 'flex';
  markerDiv.style.justifyContent = 'center';
  markerDiv.style.alignItems = 'center';
  markerDiv.style.border = '2px solid white';
  markerDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  markerDiv.innerHTML = `<span style="font-size: ${size / 2}px;">${icon}</span>`;
  return markerDiv;
};

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

// src/components/ResourceMap.tsx

  const loadGoogleMaps = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      setMapError('Google Maps API key is not configured.');
      return;
    }

    if (window.google?.maps || scriptLoadedRef.current) {
      setMapLoaded(true);
      return;
    }

    scriptLoadedRef.current = true;
    
    // This creates a unique, temporary function on the global window object
    const callbackName = `initGoogleMap_${Date.now()}`;
    (window as any)[callbackName] = () => {
      setMapLoaded(true);
      // Clean up the function after it's called
      delete (window as any)[callbackName]; 
    };
    
    const script = document.createElement('script');
    // We use the dynamic callbackName and add loading=async
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true; // Fixes the performance warning
    
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
<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Map and Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ position: 'relative', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div ref={mapRef} style={{ width: '100%', height: '450px', backgroundColor: 'var(--neutral-lightest)' }}>
            {mapError && <div className="map-feedback-overlay">⚠️ {mapError}</div>}
            {!mapLoaded && !mapError && <div className="map-feedback-overlay">Loading Map...</div>}
          </div>
        </div>
        
        {/* Info & Legend */}
        <div>
          <h3 style={{marginTop: 0, fontWeight: 700}}>{disaster.location_name}</h3>
          {coordinates && <p style={{color: 'var(--neutral-medium)', marginTop: '-0.5rem'}}>Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button onClick={refreshResources} className="btn btn-secondary"><RefreshCw size={14}/> Refresh Resources</button>
              <button onClick={centerMapOnDisaster} className="btn btn-secondary"><Maximize size={14}/> Center Map</button>
          </div>
          
          <h4 style={{fontWeight: 600}}>Legend</h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            {/* Legend Items Here */}
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#de350b'}}/> Disaster Zone</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#36b37e'}}/> Shelter</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#ffab00'}}/> Food / Water</div>
            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#0052cc'}}/> Supplies / Medical</div>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <div>
        <h3 style={{fontWeight: 600}}>Resources ({resources.length})</h3>
        {resources.length > 0 ? (
          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
            {resources.map((resource, index) => (
              <motion.div key={resource.id} className="resource-item" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{delay: index * 0.05}}>
                <div>
                  <p style={{fontWeight: 600, margin: 0}}>{resource.name}</p>
                  <span style={{fontSize: '0.8rem', color: 'var(--neutral-medium)'}}>{resource.type}</span>
                </div>
                <button className="btn-icon"><MapPin size={16}/></button>
              </motion.div>
            ))}
          </div>
        ) : <p>No resources reported for this incident yet.</p>}
      </div>

      <style>{`
        .map-feedback-overlay { display: flex; align-items: center; justify-content: center; height: 100%; font-weight: 500; color: var(--neutral-medium); }
        .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
        .resource-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background-color: var(--neutral-lightest); border-radius: var(--border-radius-md); border: 1px solid var(--border-color); }
        .btn-icon { background: none; border: none; padding: 0.4rem; border-radius: 50%; cursor: pointer; color: var(--neutral-medium); transition: var(--transition-fast); }
        .btn-icon:hover { background-color: var(--neutral-light); color: var(--primary-blue); }
      `}</style>
    </div>
  );

};

export default ResourceMap;