
import type { LambdaRequest, LambdaResponse } from "@/types/traffic";

// Correct Lambda URL with the EU North region
const LAMBDA_URL = "https://xphhfrlnpiikldzbmfkboitshq0dkdnt.lambda-url.eu-north-1.on.aws/";

/**
 * Sends optimization request to AWS Lambda function
 */
export async function callLambdaOptimization(request: LambdaRequest): Promise<LambdaResponse> {
  try {
    console.log('Calling Lambda with request:', JSON.stringify(request, null, 2));
    
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": window.location.origin,
        // Add CORS headers
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      mode: "cors", // Explicitly set CORS mode
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lambda response error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const lambdaResults = await response.json();
    console.log('Lambda results:', lambdaResults);
    
    return lambdaResults;
  } catch (error) {
    console.error('Error calling Lambda optimization:', error);
    
    // Add fallback mock response for development/testing
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Returning mock data due to Lambda call failure');
      return getMockResponse(request);
    }
    
    throw error;
  }
}

/**
 * Provides mock response for development/testing when Lambda calls fail
 */
function getMockResponse(request: LambdaRequest): LambdaResponse {
  // Create a simple mock response based on the request
  const numIntersections = request.data.intersections.length;
  const mockOffsets = Array(numIntersections).fill(0).map((_, i) => i * 10);
  
  // Generate mock pair bandwidth arrays
  const mockPairBandwidth = Array(numIntersections - 1).fill(20);
  
  return {
    optimization_results: {
      offsets: request.manualOffsets || mockOffsets,
      status: "success",
      objective_value: 45.5,
      corridor_bandwidth_up: 25,
      corridor_bandwidth_down: 20,
      pair_bandwidth_up: mockPairBandwidth,
      pair_bandwidth_down: mockPairBandwidth,
      avg_delay_up: Array(numIntersections - 1).fill(5),
      avg_delay_down: Array(numIntersections - 1).fill(6),
      max_delay_up: Array(numIntersections - 1).fill(10),
      max_delay_down: Array(numIntersections - 1).fill(12),
      diagonal_points: {
        up: request.data.intersections.map((intersection, index) => ({
          junction: intersection.id,
          top: index * 15,
          low: index * 15 + 30
        })),
        down: request.data.intersections.map((intersection, index) => ({
          junction: intersection.id,
          top: index * 15 + 45,
          low: index * 15 + 75
        }))
      }
    },
    baseline_results: {
      offsets: Array(numIntersections).fill(0),
      status: "success",
      objective_value: 30.2,
      corridor_bandwidth_up: 15,
      corridor_bandwidth_down: 10,
      pair_bandwidth_up: mockPairBandwidth.map(v => v * 0.7),
      pair_bandwidth_down: mockPairBandwidth.map(v => v * 0.6),
      avg_delay_up: Array(numIntersections - 1).fill(8),
      avg_delay_down: Array(numIntersections - 1).fill(9),
      max_delay_up: Array(numIntersections - 1).fill(15),
      max_delay_down: Array(numIntersections - 1).fill(18),
      diagonal_points: {
        up: request.data.intersections.map((intersection, index) => ({
          junction: intersection.id,
          top: index * 10,
          low: index * 10 + 25
        })),
        down: request.data.intersections.map((intersection, index) => ({
          junction: intersection.id,
          top: index * 10 + 40,
          low: index * 10 + 65
        }))
      }
    }
  };
}
