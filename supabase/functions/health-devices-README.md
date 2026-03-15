# Health Device Setup Guide

## Whoop
1. Go to developer.whoop.com → create application
2. Add redirect URI: [SUPABASE_URL]/functions/v1/whoop-oauth?action=callback
3. Add to Supabase Vault: WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET

## Oura Ring
1. Go to cloud.ouraring.com/oauth/applications → create app
2. Add redirect URI: [SUPABASE_URL]/functions/v1/oura-oauth?action=callback
3. Add to Supabase Vault: OURA_CLIENT_ID, OURA_CLIENT_SECRET

## Polar
1. Go to admin.polaraccesslink.com → create application
2. Add redirect URI: [SUPABASE_URL]/functions/v1/polar-oauth?action=callback
3. Add to Supabase Vault: POLAR_CLIENT_ID, POLAR_CLIENT_SECRET

## Garmin Connect
1. Apply for Garmin Health API access at:
   https://developer.garmin.com/gc-developer-program/overview/
2. Once approved, get credentials from the developer portal
3. Add redirect URI: [SUPABASE_URL]/functions/v1/garmin-oauth?action=callback
4. Add to Supabase Vault: GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET
Note: Garmin uses OAuth 1.0a (not 2.0). The edge function
handles the HMAC-SHA1 signing automatically.
Key metric: Body Battery (stored as strain_score in health_data)
shows athlete energy reserves — unique to Garmin devices.

## Apple Health
Requires the ACE native iOS app (React Native / Capacitor).
The toggle in the app is a placeholder until the mobile app launches.
When ready, use HealthKit API with the following entitlements:
- com.apple.developer.healthkit
- Read: HKQuantityTypeIdentifierStepCount
- Read: HKQuantityTypeIdentifierActiveEnergyBurned
- Read: HKQuantityTypeIdentifierHeartRate
- Read: HKCategoryTypeIdentifierSleepAnalysis
