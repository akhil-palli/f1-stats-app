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
  PRODUCTION_API_URL: process.env.NEXT_PUBLIC_CLOUD_RUN_URL || "https://f1-stats-ml-386425820603.us-east1.run.app",
  DEV_API_URL: "http://localhost:8000",
  
  // API key MUST be injected via GitHub Actions during build - NO FALLBACK!
  API_KEY: process.env.NEXT_PUBLIC_F1_API_KEY!
};

// Secure API client function
export async function makeSecurePrediction(driverData: DriverData): Promise<PredictionResult> {
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? API_CONFIG.PRODUCTION_API_URL 
    : API_CONFIG.DEV_API_URL;

  // Fail fast if no API key
  if (!API_CONFIG.API_KEY) {
    throw new Error('API key is missing! Check GitHub Actions environment variable injection.');
  }

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
        grid_position: Number(driverData.qualifying_position),
        season: 2025,
        championship_position: Number(driverData.championship_position ?? 15),
        cumulative_points: Number(driverData.cumulative_points ?? 0),
        driver_avg_finish_3: Number(driverData.driver_avg_finish_3 ?? 12.0),
        driver_avg_quali_3: Number(driverData.driver_avg_quali_3 ?? 12.0),
        constructor_avg_finish_3: Number(driverData.constructor_avg_finish_3 ?? 12.0),
        driver_dnf_rate: Number(driverData.driver_dnf_rate ?? 0.15),
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
  const BATCH_SIZE = 10; // Increased to match API rate limit (200/min)
  const DELAY_BETWEEN_BATCHES = 400; // Reduced delay for faster processing
  
  const results: PredictionResult[] = [];
  const failedDrivers: string[] = [];
  
  // Process drivers in batches with parallel requests
  for (let i = 0; i < driversData.length; i += BATCH_SIZE) {
    const batch = driversData.slice(i, i + BATCH_SIZE);
    
    // Process current batch in parallel
    const batchPromises = batch.map(async (driverData) => {
      try {
        const result = await makeSecurePrediction(driverData);
        return result;
      } catch (error) {
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
  
  return results;
}
