const token = 'sbp_d423a360a953979e9a98dcf50c35d84b99659f65';
const projectRef = 'xpewybeinooiunznakag';
const sql = `
ALTER TABLE liquidations ADD CONSTRAINT liquidations_assignment_id_unique UNIQUE (assignment_id);
`;

async function run() {
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Error executing SQL:');
      console.error(JSON.stringify(data, null, 2));
    } else {
      console.log('SQL results for reports table:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error executing SQL:');
    console.error(error.message);
  }
}

run();
