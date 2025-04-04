
import type { LambdaRequest, LambdaResponse } from "@/types/traffic";

// Correct Lambda URL with the EU North region
const LAMBDA_URL = "https://xphhfrlnpiikldzbmfkboitshq0dkdnt.lambda-url.eu-north-1.on.aws/";

// Store the latest request and response for debugging
let latestRequest: LambdaRequest | null = null;
let latestResponse: LambdaResponse | null = null;
let latestErrorResponse: any = null;

// Add retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Helper function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends optimization request to AWS Lambda function with retry mechanism
 */
export async function callLambdaOptimization(request: LambdaRequest): Promise<LambdaResponse> {
  let retries = 0;
  let lastError: Error | null = null;

  // Store the request for debugging
  latestRequest = request;
  console.log('Calling Lambda with request:', JSON.stringify(request, null, 2));

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": window.location.origin
        },
        mode: "cors", // Explicitly set CORS mode
        body: JSON.stringify(request)
      });

      // Get response as text first to handle both successful and error responses
      const responseText = await response.text();
      let parsedResponse: any;
      
      try {
        // Try to parse as JSON
        parsedResponse = JSON.parse(responseText);
      } catch (e) {
        // If not valid JSON, use the raw text
        parsedResponse = { error: responseText };
      }
      
      // Store the response for debugging (whether successful or error)
      if (!response.ok) {
        console.error('Lambda response error:', response.status, responseText);
        latestErrorResponse = parsedResponse;
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      console.log('Lambda results:', parsedResponse);
      latestResponse = parsedResponse;
      
      return parsedResponse;
    } catch (error) {
      lastError = error as Error;
      console.warn(`API call attempt ${retries + 1} failed:`, error);
      retries++;
      
      if (retries < MAX_RETRIES) {
        // Wait before retrying with exponential backoff
        await delay(RETRY_DELAY * Math.pow(2, retries - 1));
      }
    }
  }

  console.error('All retry attempts failed for Lambda optimization call');
  throw lastError || new Error('Failed to call Lambda optimization after multiple retries');
}

/**
 * Returns the latest request and response for debugging
 */
export function getLatestDebugData() {
  return {
    request: latestRequest,
    response: latestResponse || latestErrorResponse
  };
}
