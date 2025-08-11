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
  // Cloud Run URL (will be public once you deploy)
  PRODUCTION_API_URL: process.env.REACT_APP_CLOUD_RUN_URL || "https://your-service-url.run.app",
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
