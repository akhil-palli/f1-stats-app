// Security configuration for your frontend
// The API key will be injected during build via GitHub Actions

interface DriverData {
  driver_name: string;
  constructor: string;
  circuit: string;
  qualifying_position: number;
  championship_position?: number;
  cumulative_points?: number;
  driver_avg_finish_3?: number;
  driver_avg_quali_3?: number;
  constructor_avg_finish_3?: number;
  driver_dnf_rate?: number;
}

interface PredictionResult {
  driver_name: string;
  predicted_position: number;
  confidence_interval?: [number, number];
  status: string;
}

const API_CONFIG = {
  // Cloud Run URL - environment variable fixed in GitHub Actions
  PRODUCTION_API_URL: process.env.REACT_APP_CLOUD_RUN_URL || "https://f1-stats-ml-386425820603.us-east1.run.app",
  DEV_API_URL: "http://localhost:8000",
  
  // API key injected via GitHub Actions during build
  // Never put the real key directly in code!
  API_KEY: process.env.REACT_APP_F1_API_KEY || "dev-key-for-local-testing"
};

// Secure API client function
export async function makeSecurePrediction(driverData: DriverData): Promise<PredictionResult> {
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? API_CONFIG.PRODUCTION_API_URL 
    : API_CONFIG.DEV_API_URL;

  // Debug logging to see what we're actually sending
  console.log('🔍 Debug info:', {
    NODE_ENV: process.env.NODE_ENV,
    API_URL: apiUrl,
    API_KEY_LENGTH: API_CONFIG.API_KEY.length,
    API_KEY_PREFIX: API_CONFIG.API_KEY.substring(0, 8) + '...'
  });

  try {
    const response = await fetch(`${apiUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_CONFIG.API_KEY,  // Send API key in header
      },
      body: JSON.stringify({
        driver: driverData.driver_name,
        constructor: driverData.constructor,
        circuit: driverData.circuit,
        grid_position: driverData.qualifying_position,
        season: 2025,
        championship_position: driverData.championship_position || 15,
        cumulative_points: driverData.cumulative_points || 0,
        driver_avg_finish_3: driverData.driver_avg_finish_3 || 12.0,
        driver_avg_quali_3: driverData.driver_avg_quali_3 || 12.0,
        constructor_avg_finish_3: driverData.constructor_avg_finish_3 || 12.0,
        driver_dnf_rate: driverData.driver_dnf_rate || 0.15,
        grid_penalty: 0
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return {
      driver_name: driverData.driver_name,
      predicted_position: result.predicted_position,
      confidence_interval: result.confidence_interval,
      status: result.status
    };

  } catch (error) {
    console.error('Prediction failed:', error);
    throw error;
  }
}

// Batch prediction function with concurrency control
export async function makeBatchPredictions(driversData: DriverData[]): Promise<PredictionResult[]> {
  const BATCH_SIZE = 8; // Stay under the 10 concurrency limit
  const DELAY_BETWEEN_BATCHES = 500; // 500ms delay between batches
  
  const results: PredictionResult[] = [];
  const failedDrivers: string[] = [];
  
  // Process drivers in batches
  for (let i = 0; i < driversData.length; i += BATCH_SIZE) {
    const batch = driversData.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(driversData.length / BATCH_SIZE)}: ${batch.length} drivers`);
    
    // Process current batch
    const batchPromises = batch.map(async (driverData) => {
      try {
        const result = await makeSecurePrediction(driverData);
        return result;
      } catch (error) {
        console.warn(`Failed to get prediction for ${driverData.driver_name}`);
        failedDrivers.push(driverData.driver_name);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Add successful results
    batchResults.forEach(result => {
      if (result) results.push(result);
    });
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < driversData.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`✅ Batch predictions complete: ${results.length} successful, ${failedDrivers.length} failed`);
  if (failedDrivers.length > 0) {
    console.warn('Failed drivers:', failedDrivers);
  }
  
  return results;
}
