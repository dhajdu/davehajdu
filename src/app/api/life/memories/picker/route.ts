import { NextResponse } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { accessToken, createPickerSession, GoogleDisconnected } from '@/lib/life/google-photos';

// Opens a Google Photos picking session. The owner finishes it in Google's UI.
export async function POST() {
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const token = await accessToken(ctx.user.id);
    const session = await createPickerSession(token);
    // When Google drops the session: past it the picker refuses the selection.
    const timeoutS = Number.parseFloat(session.pollingConfig?.timeoutIn ?? '');
    const expires = session.expireTime ? Date.parse(session.expireTime) : NaN;
    const deadline = Number.isFinite(expires) ? expires : Number.isFinite(timeoutS) ? Date.now() + timeoutS * 1000 : null;
    console.log(`[memories] picker session opened, expireTime=${session.expireTime ?? 'none'} timeoutIn=${session.pollingConfig?.timeoutIn ?? 'none'}`);
    return NextResponse.json({ sessionId: session.id, pickerUri: session.pickerUri, deadline });
  } catch (e) {
    console.error('[memories] picker failed:', e);
    const status = e instanceof GoogleDisconnected ? 409 : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start the picker' }, { status });
  }
}
