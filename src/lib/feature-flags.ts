/**
 * @fileOverview Global feature flags based on environment variables.
 * Controls UI visibility and functionality availability.
 */

export const FEATURES = {
  // Grok (xAI) required for all strategy, scoring, and drafting
  ai: !!process.env.GROK_API_KEY,
  
  // Trulia or Realtor.com APIs via RapidAPI
  mlsData: !!(process.env.RAPIDAPI_TRULIA_KEY || process.env.RAPIDAPI_REALTOR_KEY || process.env.RAPIDAPI_KEY),
  
  // Spark API for LVR MLS (Las Vegas)
  sparkMLS: !!process.env.SPARK_API_KEY,

  // Google Maps for Farm Zone parcel visualization
  maps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  
  // Twilio for SMS outreach (Optional fallback to Gmail)
  sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  
  // Gmail is OAuth based and handled via user settings in Firestore
  gmail: true,
};
