
import type { LambdaRequest, LambdaResponse } from "@/types/traffic";

// Updated Lambda URL with correct region and endpoint
const LAMBDA_URL = "https://i7txrmmzkmylymjlnaxvbojbri0xluqn.lambda-url.eu-west-1.on.aws/";

/**
 * Sends optimization request to AWS Lambda function
 */
export async function callLambdaOptimization(request: LambdaRequest): Promise<LambdaResponse> {
  try {
    console.log('Calling Lambda with request:', JSON.stringify(request, null, 2));
    
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
    throw error;
  }
}
