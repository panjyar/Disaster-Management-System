const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Check if we have placeholder/invalid credentials
const isPlaceholder = !supabaseUrl || !supabaseKey || 
  supabaseUrl.includes('placeholder') || 
  supabaseKey.includes('placeholder');

let supabase;

if (isPlaceholder) {
  console.warn('⚠️  Using mock Supabase client for development');
  console.warn('   Set real SUPABASE_URL and SUPABASE_ANON_KEY for production');
  
  // Create a mock Supabase client for development
  supabase = {
    from: (table) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: function() { return this; },
      order: function() { return this; },
      limit: function() { return this; }
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;