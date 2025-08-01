import supabase from '../utils/supabase.js';

class CacheService {
  static async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttlMinutes = 60) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Cache set error:', error);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async clear(pattern) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .like('key', `${pattern}%`);

      if (error) {
        console.error('Cache clear error:', error);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export default CacheService;
