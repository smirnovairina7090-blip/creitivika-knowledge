import { getRawDb } from '@/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await getRawDb().prepare('SELECT count(*) FROM kb_schema_migrations').first();
    const ready = !!process.env.KB_EDITOR_CODE_HASH && !!process.env.KB_SESSION_SECRET;
    return Response.json({ ready }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ready: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
