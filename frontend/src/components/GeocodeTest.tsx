import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Map, MapPin } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface GeocodeResult {
  location_name: string;
  coordinates: {
    lat: number;
    lng: number;
    formatted_address?: string;
  };
}

const GeocodeTest: React.FC = () => {
  const [locationName, setLocationName] = useState("");
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchApiInfo = async (data: any) => {
    try {
      const response = await axios.get(`${API_URL}/api/geocode`);
      fetchApiInfo(response.data);
    } catch (error) {
      console.error("Error fetching API info:", error);
    }
  };

  const testGeocode = async () => {
    if (!locationName && !description) {
      setError("Please provide either a location name or description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/geocode`, {
        location_name: locationName || undefined,
        description: description || undefined,
      });
      setResult(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "Geocoding failed");
    } finally {
      setLoading(false);
    }
  };

  const presetLocations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "San Jose, CA",
  ];

  const presetDescriptions = [
    "Severe flooding reported in downtown Manhattan area",
    "Earthquake damage visible near Golden Gate Bridge in San Francisco",
    "Wildfire spreading through Malibu hills in Los Angeles County",
    "Hurricane damage along Miami Beach coastline",
    "Tornado touchdown reported in Moore, Oklahoma",
  ];

 

  return (
 <div>
       <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Geocoding Tool</h1>
       <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Test the system's ability to convert location names into geographic coordinates.
       </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Form */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Input Location</h2></div>
          <div className="form-group">
            <label htmlFor="location" className="form-label">Location Name or Description</label>
            <input id="location" type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g., Downtown Manhattan" className="form-input"/>
          </div>
          <div style={{ margin: '1rem 0' }}>
            <p className="form-label" style={{marginBottom: '0.75rem'}}>Presets</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {presetLocations.map(loc => <button key={loc} onClick={() => setLocationName(loc)} className="btn btn-secondary">{loc}</button>)}
            </div>
          </div>
          <button onClick={testGeocode} disabled={loading || !locationName} className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>
            {loading ? <div className="loading-spinner"/> : <MapPin/>} Geocode Location
          </button>
        </div>

        {/* Right Column: Result */}
        <div className="card">
           <div className="card-header"><h2 className="card-title">Result</h2></div>
           {loading && <p>Loading...</p>}
           {error && <div className="alert-error">{error}</div>}
           {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{marginBottom: '1rem'}}>
                    <p className="form-label">Location Name</p>
                    <p style={{fontWeight: 600}}>{result.location_name}</p>
                </div>
                 <div style={{marginBottom: '1rem'}}>
                    <p className="form-label">Coordinates</p>
                    <p style={{fontWeight: 600}}>Lat: {result.coordinates.lat.toFixed(4)}, Lng: {result.coordinates.lng.toFixed(4)}</p>
                </div>
                 {result.coordinates.formatted_address && (
                    <div>
                        <p className="form-label">Formatted Address</p>
                        <p style={{fontWeight: 600}}>{result.coordinates.formatted_address}</p>
                    </div>
                 )}
              </motion.div>
           )}
           {!loading && !result && !error && <p>Results will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default GeocodeTest;
