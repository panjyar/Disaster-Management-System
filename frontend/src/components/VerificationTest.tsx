import React, { useState } from 'react';
import axios from 'axios';

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
  const [apiInfo, setApiInfo] = useState<any>(null);

  const fetchApiInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/verification`);
      setApiInfo(response.data);
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

  React.useEffect(() => {
    fetchApiInfo();
  }, []);

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
    <div className="verification-test">
      <div className="api-section">
        <h2>🔍 Image Verification API Tester</h2>
        <p>Test the AI-powered image authenticity verification system.</p>
        
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
              <div className="example-request">
                <h4>Example Request:</h4>
                <pre>{JSON.stringify(apiInfo.example_request, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        <div className="test-form">
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL *:</label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/disaster-image.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">Context (optional):</label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Additional context about the image (e.g., 'Flood damage in downtown area')"
              rows={3}
            />
          </div>

          <div className="sample-images">
            <h3>📸 Sample Images</h3>
            <p>Click on any sample image to test verification:</p>
            <div className="image-grid">
              {sampleImages.map((sample, index) => (
                <div key={index} className="sample-image-card">
                  <img 
                    src={sample.url} 
                    alt={sample.description}
                    onClick={() => {
                      setImageUrl(sample.url);
                      setContext(sample.context);
                    }}
                  />
                  <div className="image-info">
                    <p><strong>{sample.description}</strong></p>
                    <p><small>{sample.context}</small></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={testVerification} 
              disabled={loading || !imageUrl}
              className="test-btn"
            >
              {loading ? '🔄 Analyzing...' : '🔍 Verify Image'}
            </button>
            <button 
              onClick={() => {
                setImageUrl('');
                setContext('');
                setResult(null);
                setError('');
              }}
              className="clear-btn"
            >
              🧹 Clear
            </button>
          </div>
        </div>

        {imageUrl && (
          <div className="image-preview">
            <h3>🖼️ Image Preview</h3>
            <div className="preview-container">
              <img src={imageUrl} alt="Preview" />
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <h4>❌ Error</h4>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3>🔍 Verification Result</h3>
            <div className="result-card">
              <div className="status-header">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(result.status) }}
                >
                  {getStatusIcon(result.status)} {result.status.toUpperCase()}
                </span>
                <span className="score">
                  Score: {result.score}/100
                </span>
              </div>
              
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${result.score}%`,
                    backgroundColor: getStatusColor(result.status)
                  }}
                ></div>
              </div>

              <div className="explanation">
                <h4>📝 Analysis</h4>
                <p>{result.explanation}</p>
              </div>

              <div className="score-interpretation">
                <h4>📊 Score Interpretation</h4>
                <div className="interpretation-grid">
                  <div className="interpretation-item">
                    <span className="range">90-100</span>
                    <span className="label verified">Highly Authentic</span>
                  </div>
                  <div className="interpretation-item">
                    <span className="range">70-89</span>
                    <span className="label verified">Likely Authentic</span>
                  </div>
                  <div className="interpretation-item">
                    <span className="range">40-69</span>
                    <span className="label suspicious">Requires Review</span>
                  </div>
                  <div className="interpretation-item">
                    <span className="range">0-39</span>
                    <span className="label error">Likely Manipulated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="verification-info">
          <h3>🛠️ How Verification Works</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>🤖 AI Analysis</h4>
              <p>Uses Google Gemini AI to analyze images for signs of manipulation, inconsistencies, and authenticity markers.</p>
            </div>
            <div className="info-card">
              <h4>🎯 Context Matching</h4>
              <p>Compares image content with provided context to verify relevance and accuracy.</p>
            </div>
            <div className="info-card">
              <h4>📊 Scoring System</h4>
              <p>Provides a 0-100 authenticity score with detailed explanations of the analysis.</p>
            </div>
            <div className="info-card">
              <h4>💾 Efficient Caching</h4>
              <p>Results are cached to improve performance and reduce duplicate analyses.</p>
            </div>
          </div>
        </div>

        <div className="verification-tips">
          <h3>💡 Verification Tips</h3>
          <div className="tips-list">
            <div className="tip">
              <strong>🏷️ Provide Context:</strong> Adding context helps the AI understand what to look for in the image.
            </div>
            <div className="tip">
              <strong>🔗 Use Direct URLs:</strong> Ensure image URLs are publicly accessible and point directly to image files.
            </div>
            <div className="tip">
              <strong>📏 Image Quality:</strong> Higher resolution images generally provide more accurate verification results.
            </div>
            <div className="tip">
              <strong>⚡ Real-time Analysis:</strong> Verification happens in real-time but results are cached for efficiency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationTest;