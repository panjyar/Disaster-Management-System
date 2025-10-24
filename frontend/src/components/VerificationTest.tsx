// src/components/VerificationTest.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

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
  const [imageError, setImageError] = useState(false);

  const testVerification = async () => {
    if (!imageUrl) {
      setError('Please provide an image URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setImageError(false);

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
      description: 'Flood waters in urban area'
    },
    {
      url: 'https://images.unsplash.com/photo-1574924919440-37ad64f5d89d?w=500',
      description: 'Wildfire smoke'
    },
    {
      url: 'https://images.unsplash.com/photo-1504691342899-4d92b50853e1?w=500',
      description: 'Hurricane damage'
    }
  ];

  const loadSampleImage = (sample: typeof sampleImages[0]) => {
    setImageUrl(sample.url);
    setContext(sample.description);
    setImageError(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4CAF50';
      case 'suspicious': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#607D8B';
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Image Verification Tool</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem', marginBottom: '1rem' }}>
        Test the AI-powered image authenticity verification system.
      </p>

      {/* WARNING BANNER */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: 'var(--border-radius-md)',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        <AlertTriangle size={20} color="#856404" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong style={{ color: '#856404' }}>Demo Mode:</strong>
          <p style={{ margin: '0.25rem 0 0', color: '#856404', fontSize: '0.9rem' }}>
            This verification uses a text-based AI model and returns randomized scores (70-100). 
            For production, implement Gemini Pro Vision or similar image analysis model.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Form */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Input Image</h2></div>
          
          <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">Image URL *</label>
            <input 
              id="imageUrl" 
              type="url" 
              value={imageUrl} 
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(false);
              }} 
              placeholder="https://example.com/image.jpg" 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sample Images</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sampleImages.map((sample, idx) => (
                <button 
                  key={idx}
                  onClick={() => loadSampleImage(sample)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                >
                  {sample.description}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="context" className="form-label">Context (optional)</label>
            <textarea 
              id="context" 
              value={context} 
              onChange={(e) => setContext(e.target.value)} 
              placeholder="e.g., 'Flooding in downtown area'" 
              rows={2} 
              className="form-input" 
            />
          </div>

          <button 
            onClick={testVerification} 
            disabled={loading || !imageUrl} 
            className="btn btn-primary" 
            style={{width: '100%', marginTop: '1rem'}}
          >
            {loading ? (
              <>
                <div className="loading-spinner"/> Analyzing...
              </>
            ) : (
              <>
                <ShieldCheck/> Verify Image
              </>
            )}
          </button>
        </div>

        {/* Right Column: Result */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Verification Analysis</h2></div>
          
          {imageUrl && (
            <div style={{ marginBottom: '1rem' }}>
              <img 
                src={imageUrl} 
                alt="Preview" 
                style={{
                  width: '100%', 
                  borderRadius: 'var(--border-radius-md)', 
                  maxHeight: '250px', 
                  objectFit: 'cover',
                  display: imageError ? 'none' : 'block'
                }}
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div style={{
                  backgroundColor: 'var(--neutral-lightest)',
                  padding: '3rem',
                  borderRadius: 'var(--border-radius-md)',
                  textAlign: 'center',
                  color: 'var(--neutral-medium)'
                }}>
                  Image could not be loaded
                </div>
              )}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Analyzing image...</p>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c00',
              padding: '0.75rem',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--neutral-lightest)',
                borderRadius: 'var(--border-radius-md)'
              }}>
                <span style={{
                  padding: '0.3rem 1rem', 
                  borderRadius: '99px', 
                  color: 'white', 
                  backgroundColor: getStatusColor(result.status), 
                  fontWeight: 600
                }}>
                  {result.status.toUpperCase()}
                </span>
                <span style={{fontSize: '1.2rem', fontWeight: 700}}>
                  Score: {result.score}/100
                </span>
              </div>
              
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#856404'
              }}>
                <strong>Note:</strong> This is a mock score for demonstration purposes.
              </div>

              <div>
                <p className="form-label">Explanation</p>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{result.explanation}</p>
              </div>
            </motion.div>
          )}

          {!loading && !result && !error && (
            <p style={{ color: 'var(--neutral-medium)', textAlign: 'center', padding: '2rem' }}>
              Analysis results will appear here after verification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationTest;