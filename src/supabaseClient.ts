import { createClient } from '@supabase/supabase-js'

// .env ஃபைலில் இருந்து URL மற்றும் Key-ஐ எடுக்கிறது
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// இரண்டில் ஏதேனும் ஒன்று இல்லை என்றால் எரர் காட்டும்
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL அல்லது Anon Key .env ஃபைலில் இல்லை! தயவுசெய்து செக் பண்ணவும்.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)