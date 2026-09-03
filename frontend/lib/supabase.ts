import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check Supabase URL
if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing from frontend/.env.local"
  );
}

// Check Supabase publishable key
if (!supabasePublishableKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing from frontend/.env.local"
  );
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);