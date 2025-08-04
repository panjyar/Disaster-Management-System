import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ReportFormProps {
  disasterId: string;
}

interface VerificationResult {
  status: string;
  score: number;
  explanation: string;
}

const ReportForm: React.FC<ReportFormProps> = ({ disasterId }) => {
  const [formData, setFormData] = useState({
    content: '',
    image_url: '',
    user_id: 'citizen1'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setVerification(null);

    try {
      // Submit report
      await axios.post(`${API_URL}/api/disasters/${disasterId}/reports`, formData);
      
      // Verify image if provided
      if (formData.image_url) {
        try {
          const verifyResponse = await axios.post(`${API_URL}/api/verification/verify-image`, {
            image_url: formData.image_url,
            context: formData.content
          });
          setVerification(verifyResponse.data);
        } catch (verifyError) {
          console.error('Verification error:', verifyError);
        }
      }
      
      setMessage({ type: 'success', text: 'Report submitted successfully!' });
      setFormData({ content: '', image_url: '', user_id: 'citizen1' });
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Failed to submit report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-50 text-green-800 border-green-200';
      case 'suspicious': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            required
            rows={4}
            placeholder="Describe what you're seeing, needs, or resources available..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          />
        </div>

        {/* Image URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (optional)
          </label>
          <div className="relative">
            <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Reporter Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reporter
          </label>
          <select
            value={formData.user_id}
            onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="citizen1">citizen1</option>
            <option value="volunteer">volunteer</option>
            <option value="first_responder">first_responder</option>
            <option value="official">official</option>
          </select>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
              />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </>
          )}
        </motion.button>
      </form>

      {/* Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </motion.div>
      )}

      {/* Verification Result */}
      {verification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900">Image Verification</h4>
          </div>
          
          <div className={`p-2 rounded-lg border mb-2 ${getVerificationStatusColor(verification.status)}`}>
            <div className="text-sm font-medium">
              Status: {verification.status} (Score: {verification.score}/100)
            </div>
          </div>
          
          <p className="text-sm text-gray-600">{verification.explanation}</p>
        </motion.div>
      )}
    </div>
  );
};

export default ReportForm;