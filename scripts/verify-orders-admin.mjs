import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const id = '71db7916-d20a-42ad-ab83-2de421d2ac1e';

const sel = await supabase
  .from('orders')
  .select('id,status,total_amount')
  .eq('id', id)
  .maybeSingle();

if (sel.error) {
  console.log('SELECT_ERROR', sel.error.message);
  process.exit(1);
}
console.log('SELECT_OK', sel.data?.status);

const upd = await supabase
  .from('orders')
  .update({ status: 'Dispatched' })
  .eq('id', id)
  .select('id,status')
  .maybeSingle();

if (upd.error) {
  console.log('UPDATE_ERROR', upd.error.message);
  process.exit(1);
}
console.log('UPDATE_OK', upd.data?.status);
