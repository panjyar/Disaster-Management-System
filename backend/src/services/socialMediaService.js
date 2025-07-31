const CacheService = require('./cacheService');

class SocialMediaService {
  static async fetchDisasterReports(disasterId, tags = []) {
    const cacheKey = `social_media_${disasterId}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Mock Twitter-like data
      const mockReports = [
        {
          id: '1',
          user: 'citizen_reporter',
          content: `#${tags[0] || 'disaster'} Need immediate help! Water levels rising fast in downtown area`,
          timestamp: new Date().toISOString(),
          priority: 'high',
          verified: false
        },
        {
          id: '2',
          user: 'local_volunteer',
          content: `Offering shelter and food for anyone affected by the ${tags[0] || 'disaster'}. DM for location`,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          priority: 'medium',
          verified: true
        },
        {
          id: '3',
          user: 'emergency_updates',
          content: `URGENT: Evacuation ordered for residents in affected areas. Follow official channels for updates`,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          priority: 'critical',
          verified: true
        }
      ];

      // Add some randomization for realism
      const reports = mockReports.map(report => ({
        ...report,
        content: report.content.replace(/downtown area|affected areas/, 
          Math.random() > 0.5 ? 'Manhattan district' : 'Lower East Side')
      }));

      await CacheService.set(cacheKey, reports, 15); // Cache for 15 minutes
      return reports;
    } catch (error) {
      console.error('Social media fetch error:', error);
      return [];
    }
  }

  static async analyzePriority(content) {
    const urgentKeywords = ['urgent', 'sos', 'emergency', 'help', 'trapped', 'immediate'];
    const criticalKeywords = ['evacuation', 'danger', 'life-threatening', 'critical'];
    
    const contentLower = content.toLowerCase();
    
    if (criticalKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'critical';
    }
    
    if (urgentKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'high';
    }
    
    return 'medium';
  }
}

module.exports = SocialMediaService;