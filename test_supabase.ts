import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function test() {
  const { data, error } = await supabase.from('manhwas').select('id, created_at, updated_at').limit(1)
  console.log(error || data)
}
test()
