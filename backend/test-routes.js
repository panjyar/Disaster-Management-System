import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = 'http://localhost:5001';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class RouteChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      issues: []
    };
  }

  async checkRoute(method, endpoint, data = null, expectedStatus = 200) {
    try {
      log(`Testing ${method.toUpperCase()} ${endpoint}...`, 'blue');
      
      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await axios.get(`${API_BASE}${endpoint}`);
          break;
        case 'post':
          response = await axios.post(`${API_BASE}${endpoint}`, data);
          break;
        case 'put':
          response = await axios.put(`${API_BASE}${endpoint}`, data);
          break;
        case 'delete':
          response = await axios.delete(`${API_BASE}${endpoint}`, { data });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      if (response.status === expectedStatus) {
        log(`✅ PASS: ${method.toUpperCase()} ${endpoint} - Status: ${response.status}`, 'green');
        this.results.passed++;
        return { success: true, data: response.data, status: response.status };
      } else {
        log(`❌ FAIL: ${method.toUpperCase()} ${endpoint} - Expected: ${expectedStatus}, Got: ${response.status}`, 'red');
        this.results.failed++;
        this.results.issues.push(`${method.toUpperCase()} ${endpoint}: Status mismatch`);
        return { success: false, status: response.status };
      }
    } catch (error) {
      const status = error.response?.status || 'NETWORK_ERROR';
      const message = error.response?.data?.error || error.message;
      log(`❌ FAIL: ${method.toUpperCase()} ${endpoint} - Status: ${status}, Error: ${message}`, 'red');
      this.results.failed++;
      this.results.issues.push(`${method.toUpperCase()} ${endpoint}: ${message}`);
      return { success: false, error: message, status };
    }
  }

  async checkHealth() {
    log('\n=== Health Check ===', 'yellow');
    return await this.checkRoute('GET', '/health');
  }

  async checkDisasterRoutes() {
    log('\n=== Disaster Routes ===', 'yellow');
    
    // Test GET disasters
    const getResult = await this.checkRoute('GET', '/api/disasters');
    
    // Test POST create disaster
    const createData = {
      title: 'Test Disaster',
      description: 'This is a test disaster in New York City',
      location_name: 'New York City',
      tags: ['test', 'flooding']
    };
    const createResult = await this.checkRoute('POST', '/api/disasters', createData, 201);
    
    // If creation was successful, test UPDATE and DELETE
    if (createResult.success && createResult.data?.id) {
      const disasterId = createResult.data.id;
      
      // Test PUT update disaster
      const updateData = {
        title: 'Updated Test Disaster',
        description: 'Updated description',
        tags: ['test', 'updated']
      };
      await this.checkRoute('PUT', `/api/disasters/${disasterId}`, updateData);
      
      // Test DELETE disaster
      await this.checkRoute('DELETE', `/api/disasters/${disasterId}`, {}, 204);
    }
    
    return { getResult, createResult };
  }

  async checkResourceRoutes() {
    log('\n=== Resource Routes ===', 'yellow');
    
    // Test with a sample disaster ID
    const disasterId = 'test-disaster-id';
    await this.checkRoute('GET', `/api/resources/${disasterId}`);
    
    // Test with coordinates
    await this.checkRoute('GET', `/api/resources/${disasterId}?lat=40.7128&lng=-74.0060&radius=5000`);
  }

  async checkSocialMediaRoutes() {
    log('\n=== Social Media Routes ===', 'yellow');
    
    const disasterId = 'test-disaster-id';
    return await this.checkRoute('GET', `/api/social-media/${disasterId}`);
  }

  async checkGeocodeRoutes() {
    log('\n=== Geocoding Routes ===', 'yellow');
    
    const geocodeData = {
      description: 'Flooding reported in Manhattan, NYC',
      location_name: 'Manhattan, NYC'
    };
    return await this.checkRoute('POST', '/api/geocode', geocodeData);
  }

  async checkVerificationRoutes() {
    log('\n=== Verification Routes ===', 'yellow');
    
    const verificationData = {
      image_url: 'https://example.com/disaster-image.jpg',
      context: 'Flood damage verification'
    };
    return await this.checkRoute('POST', '/api/verification/verify-image', verificationData);
  }

  async checkNotFoundRoute() {
    log('\n=== 404 Handler ===', 'yellow');
    return await this.checkRoute('GET', '/api/nonexistent', null, 404);
  }

  async runAllTests() {
    log('🚀 Starting Backend Route Testing...', 'yellow');
    log(`Testing against: ${API_BASE}\n`, 'blue');

    try {
      // Check if server is running first
      await this.checkHealth();
      
      // Test all route categories
      await this.checkDisasterRoutes();
      await this.checkResourceRoutes();
      await this.checkSocialMediaRoutes();
      await this.checkGeocodeRoutes();
      await this.checkVerificationRoutes();
      await this.checkNotFoundRoute();
      
    } catch (error) {
      log(`\n❌ Critical Error: ${error.message}`, 'red');
      this.results.issues.push(`Critical: ${error.message}`);
    }

    this.printSummary();
  }

  printSummary() {
    log('\n' + '='.repeat(50), 'yellow');
    log('📊 TEST SUMMARY', 'yellow');
    log('='.repeat(50), 'yellow');
    
    log(`✅ Passed: ${this.results.passed}`, 'green');
    log(`❌ Failed: ${this.results.failed}`, 'red');
    log(`📊 Total: ${this.results.passed + this.results.failed}`, 'blue');
    
    if (this.results.issues.length > 0) {
      log('\n🔍 ISSUES FOUND:', 'red');
      this.results.issues.forEach((issue, index) => {
        log(`${index + 1}. ${issue}`, 'red');
      });
    } else {
      log('\n🎉 All tests passed!', 'green');
    }
    
    log('\n' + '='.repeat(50), 'yellow');
  }
}

// Check if server is running before starting tests
async function checkServerStatus() {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    log('❌ Server is not running or not accessible!', 'red');
    log('Please start the server with: npm run dev or npm start', 'yellow');
    log('Make sure it\'s running on port 5001', 'yellow');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServerStatus();
  
  if (serverRunning) {
    const checker = new RouteChecker();
    await checker.runAllTests();
  } else {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default RouteChecker;