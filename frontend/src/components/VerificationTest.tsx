import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Image } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface VerificationResult {
  score: number;
  explanation: string;
  status: 'verified' | 'suspicious' | 'error';
}

const VerificationTest: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchApiInfo = async (data: any) => {
    try {
      const response = await axios.get(`${API_URL}/api/verification`);
      fetchApiInfo(response.data);
    } catch (error) {
      console.error('Error fetching API info:', error);
    }
  };

  const testVerification = async () => {
    if (!imageUrl) {
      setError('Please provide an image URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/verification/verify-image`, {
        image_url: imageUrl,
        context: context || undefined
      });
      setResult(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const sampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500',
      description: 'Flood waters in urban area',
      context: 'Urban flooding after heavy rainfall'
    },
    {
      url: 'https://images.unsplash.com/photo-1574924919440-37ad64f5d89d?w=500',
      description: 'Wildfire smoke and flames',
      context: 'Forest fire spreading near residential area'
    },
    {
      url: 'https://images.unsplash.com/photo-1504691342899-4d92b50853e1?w=500',
      description: 'Hurricane damage to buildings',
      context: 'Building damage from hurricane winds'
    },
    {
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      description: 'Emergency vehicles and responders',
      context: 'Emergency response to disaster'
    }
  ];



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4CAF50';
      case 'suspicious': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#607D8B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'suspicious': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
     <div>
       <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Image Verification Tool</h1>
       <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Test the AI-powered image authenticity verification system.
       </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Form */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Input Image</h2></div>
           <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">Image URL *</label>
            <input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="form-input"/>
          </div>
          <div className="form-group">
            <label htmlFor="context" className="form-label">Context (optional)</label>
            <textarea id="context" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., 'Flooding in downtown area'" rows={2} className="form-input" />
          </div>
           <button onClick={testVerification} disabled={loading || !imageUrl} className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>
             {loading ? <div className="loading-spinner"/> : <ShieldCheck/>} Verify Image
          </button>
        </div>

        {/* Right Column: Result */}
        <div className="card">
           <div className="card-header"><h2 className="card-title">Verification Analysis</h2></div>
           {imageUrl && <img src={imageUrl} alt="Preview" style={{width: '100%', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', maxHeight: '250px', objectFit: 'cover'}}/>}
           {loading && <p>Analyzing...</p>}
           {error && <div className="alert-error">{error}</div>}
           {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                    <span style={{padding: '0.3rem 1rem', borderRadius: '99px', color: 'white', backgroundColor: getStatusColor(result.status), fontWeight: 600}}>{result.status}</span>
                    <span style={{fontSize: '1.2rem', fontWeight: 700}}>Score: {result.score}/100</span>
                </div>
                <div>
                    <p className="form-label">Explanation</p>
                    <p>{result.explanation}</p>
                </div>
              </motion.div>
           )}
           {!loading && !result && !error && <p>Analysis will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default VerificationTest;