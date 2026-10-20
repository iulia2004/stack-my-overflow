require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function inspect() {
  const tables = ['questions','answers','comments','votes','question_votes','answer_votes','comment_votes']
  for (const table of tables) {
    console.log(`\nTABLE: ${table}`)
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.error('table error for', table, error.message)
    } else if (!data || data.length === 0) {
      console.log('exists, no rows returned')
    } else {
      console.log('row sample:', data[0])
    }
  }
}
inspect().catch((err) => { console.error(err); process.exit(1)})
