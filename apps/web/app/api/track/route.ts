import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@locker/database/client';
import { trackedLinks, trackedLinkEvents } from '@locker/database';
import { eq, and } from 'drizzle-orm';
import {
  parseUserAgent,
  resolveGeoFromIp,
  getClientIp,
} from '@/lib/tracking';

type CreateEventBody = {
  token?: string;
  visitorId?: string;
  email?: string;
  eventType?: string;
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

type UpdateDurationBody = {
  token?: string;
  eventId?: string;
  durationSeconds?: number;
};

function toSafeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

async function updateDuration(body: UpdateDurationBody) {
  const { token, eventId } = body;
  const durationSeconds = toSafeNumber(body.durationSeconds);

  if (!token || !eventId || durationSeconds === null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const normalizedDuration = Math.max(
    0,
    Math.min(86_400, Math.round(durationSeconds)),
  );

  const db = getDb();
  const [event] = await db
    .select({ id: trackedLinkEvents.id })
    .from(trackedLinkEvents)
    .innerJoin(
      trackedLinks,
      eq(trackedLinks.id, trackedLinkEvents.trackedLinkId),
    )
    .where(
      and(
        eq(trackedLinkEvents.id, eventId),
        eq(trackedLinks.token, token),
      ),
    );

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  await db
    .update(trackedLinkEvents)
    .set({ durationSeconds: normalizedDuration })
    .where(eq(trackedLinkEvents.id, eventId));

  return NextResponse.json({ ok: true });
}

// POST /api/track
// - Create event when body contains token + view/download payload
// - Update duration when body contains token + eventId + durationSeconds
export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as CreateEventBody & UpdateDurationBody;

    if (rawBody.eventId && typeof rawBody.durationSeconds === 'number') {
      return updateDuration(rawBody);
    }

    const { token, visitorId, email, eventType } = rawBody;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const db = getDb();
    const [link] = await db
      .select({ id: trackedLinks.id, isActive: trackedLinks.isActive })
      .from(trackedLinks)
      .where(eq(trackedLinks.token, token));

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const headers = req.headers;
    const ip = getClientIp(headers);
    const ua = headers.get('user-agent') ?? '';
    const referer = headers.get('referer');
    const language = headers.get('accept-language')?.split(',')[0] ?? null;

    const parsed = parseUserAgent(ua);
    const geo = ip ? await resolveGeoFromIp(ip) : null;

    let pageUrl: URL | null = null;
    if (typeof rawBody.pageUrl === 'string') {
      try {
        pageUrl = new URL(rawBody.pageUrl);
      } catch {
        pageUrl = null;
      }
    }

    const utmSource =
      pageUrl?.searchParams.get('utm_source') ?? rawBody.utmSource ?? null;
    const utmMedium =
      pageUrl?.searchParams.get('utm_medium') ?? rawBody.utmMedium ?? null;
    const utmCampaign =
      pageUrl?.searchParams.get('utm_campaign') ?? rawBody.utmCampaign ?? null;

    const [created] = await db
      .insert(trackedLinkEvents)
      .values({
        trackedLinkId: link.id,
        eventType: eventType === 'download' ? 'download' : 'view',
        visitorId: visitorId ?? null,
        email: email ?? null,
        ipAddress: ip,
        country: geo?.country ?? null,
        countryCode: geo?.countryCode ?? null,
        region: geo?.region ?? null,
        city: geo?.city ?? null,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        userAgent: ua || null,
        browser: parsed.browser,
        browserVersion: parsed.browserVersion,
        os: parsed.os,
        osVersion: parsed.osVersion,
        deviceType: parsed.deviceType,
        referrer: referer ?? rawBody.referrer ?? null,
        utmSource,
        utmMedium,
        utmCampaign,
        language,
      })
      .returning({ id: trackedLinkEvents.id });

    return NextResponse.json({ ok: true, eventId: created?.id ?? null });
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}

// PATCH /api/track — updates duration for an existing event
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as UpdateDurationBody;
    return updateDuration(body);
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}
