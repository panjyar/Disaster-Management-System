import { Router } from 'express';
import * as cheerio from 'cheerio';
import axios from 'axios';
import CacheService from '../services/cacheService.js';
import supabase from '../utils/supabase.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Official Updates API',
    endpoints: {
      'GET /api/updates/:disasterId/official-updates': 'Fetch official updates for a disaster (cached for 1 hour)'
    }
  });
});

router.get('/:disasterId/official-updates', async (req, res) => {
  try {
    const { disasterId } = req.params;
    const cacheKey = `official_updates_${disasterId}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json({ source: 'cache', updates: cached });

    // Pull basic context for query hints
    let tags = [];
    let locationName = '';
    try {
      const { data } = await supabase
        .from('disasters')
        .select('tags, location_name, title')
        .eq('id', disasterId)
        .single();
      tags = data?.tags || [];
      locationName = data?.location_name || '';
    } catch {}

    const sources = [
      { name: 'FEMA', url: 'https://www.fema.gov/press-releases' },
      { name: 'Red Cross', url: 'https://www.redcross.org/about-us/news-and-events/press-releases.html' }
    ];

    const requests = await Promise.allSettled(
      sources.map(async (src) => {
        const res = await axios.get(src.url, { headers: { 'User-Agent': 'DisasterResponsePlatform/1.0' } });
        const $ = cheerio.load(res.data);
        const items = [];

        // Heuristic parsing for common press pages
        $('a').each((_, el) => {
          const title = $(el).text().trim();
          const href = $(el).attr('href');
          if (!href || !title) return;
          const absolute = href.startsWith('http') ? href : new URL(href, src.url).toString();
          // Basic filtering using tags/location if available
          const needle = [...tags, locationName].filter(Boolean).join(' ').toLowerCase();
          if (!needle || title.toLowerCase().includes(needle) || title.toLowerCase().includes('disaster') || title.toLowerCase().includes('emergency')) {
            items.push({ source: src.name, title, url: absolute });
          }
        });

        // Deduplicate by URL and take top N
        const seen = new Set();
        const unique = items.filter(i => (seen.has(i.url) ? false : seen.add(i.url)));
        return unique.slice(0, 10);
      })
    );

    const updates = requests
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .slice(0, 20);

    await CacheService.set(cacheKey, updates, 60);

    const io = req.app.get('io');
    if (io) io.to(`disaster_${disasterId}`).emit('official_updates', updates);

    res.json({ source: 'live', updates });
  } catch (error) {
    console.error('Official updates error:', error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
});

export default router;
