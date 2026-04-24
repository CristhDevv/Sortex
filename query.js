const q = `SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;`;

async function run() {
  const t = 'sbp_8a63831dce2a8541020907391bd44a3354e05424';
  const url = 'https://api.supabase.com/v1/projects/xpewybeinooiunznakag/database/query';
  
  const headers = {
    'Authorization': `Bearer ${t}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ query: q }) });
  console.log(await res.text());
}

run();
