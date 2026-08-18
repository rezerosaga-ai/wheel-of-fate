// فحص سريع لاتصال DB (نفس driver الذي تستخدمه drizzle)
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { connect_timeout: 10 });
try {
  const rows = await sql`SELECT 1 AS ok`;
  console.log('DIRECT OK:', JSON.stringify(rows[0]));
  const rooms = await sql`SELECT code FROM rooms LIMIT 1`;
  console.log('rooms sample:', rooms[0]?.code ?? 'empty-table');
} catch (e) {
  console.log('DIRECT FAIL:', e.message.slice(0, 150));
} finally {
  await sql.end({ timeout: 5 });
}
