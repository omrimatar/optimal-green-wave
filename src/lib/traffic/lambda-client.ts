
import type { LambdaRequest, LambdaResponse } from "@/types/traffic";

// Correct Lambda URL with the EU North region
const LAMBDA_URL = "https://xphhfrlnpiikldzbmfkboitshq0dkdnt.lambda-url.eu-north-1.on.aws/";

// Store the latest request and response for debugging
let latestRequest: LambdaRequest | null = null;
let latestResponse: LambdaResponse | null = null;

/**
 * Sends optimization request to AWS Lambda function
 */
export async function callLambdaOptimization(request: LambdaRequest): Promise<LambdaResponse> {
  try {
    console.log('Calling Lambda with request:', JSON.stringify(request, null, 2));
    
    // Store the request for debugging
    latestRequest = request;
    
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": window.location.origin
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
    
    // Store the response for debugging
    latestResponse = lambdaResults;
    
    return lambdaResults;
  } catch (error) {
    console.error('Error calling Lambda optimization:', error);
    throw error;
  }
}

/**
 * Returns the latest request and response for debugging
 */
export function getLatestDebugData() {
  return {
    request: latestRequest,
    response: latestResponse
  };
}
