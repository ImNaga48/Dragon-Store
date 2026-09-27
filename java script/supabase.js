// =========================
// SUPABASE CONNECTION
// Dragon Store
// =========================

import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// =========================
// SUPABASE CONFIG
// =========================

const SUPABASE_URL =
  "https://zisjxyqqmvoogbxqrvxt.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_RaNJPLAtMu3b9KeQbF1B3w__E_SjeHl";

// =========================
// CREATE CLIENT
// =========================

export const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );