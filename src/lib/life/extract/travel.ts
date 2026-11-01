import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedLeg, TravelExtraction } from './legs';

// W3: classify a booking email and extract its legs with Claude structured output.

const MODEL = 'claude-sonnet-5-5';
// Booking emails are rarely this long; anything longer is cut and flagged in the extraction.
const MAX_BODY_CHARS = 120_000;

const nullableString = { type: ['string', 'null'] } as const;

const LEG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'kind', 'status', 'confirmation_code', 'provider', 'number', 'origin_iata', 'destination_iata',
    'origin_city', 'destination_city', 'starts_at_local', 'start_tz', 'ends_at_local', 'end_tz',
    'hotel_name', 'address', 'city', 'country', 'confidence',
  ],
  properties: {
    kind: { type: 'string', enum: ['flight', 'hotel', 'train', 'car', 'event'] },
    status: { type: 'string', enum: ['confirmed', 'changed', 'cancelled'] },
    confirmation_code: nullableString,
    provider: nullableString,
    number: nullableString,
    origin_iata: nullableString,
    destination_iata: nullableString,
    origin_city: nullableString,
    destination_city: nullableString,
    starts_at_local: { type: 'string' },
    start_tz: nullableString,
    ends_at_local: nullableString,
    end_tz: nullableString,
    hotel_name: nullableString,
    address: nullableString,
    city: nullableString,
    country: nullableString,
    confidence: { type: 'number' },
  },
};

const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'confidence', 'notes', 'legs'],
  properties: {
    kind: {
      type: 'string',
      enum: ['flight', 'hotel', 'train', 'car', 'event', 'cancellation', 'change', 'not_travel'],
    },
    confidence: { type: 'number' },
    notes: nullableString,
    legs: { type: 'array', items: LEG_SCHEMA },
  },
};

const SYSTEM = `You read emails from Dave's inbox and extract travel bookings. Dave lives in Ho Chi Minh City (Saigon, airport SGN) and travels often across Southeast Asia, Australia, the Middle East, Europe and the US.

Classify the email as one kind:
- flight, hotel, train, car, event: a new or confirmed booking (an e-ticket, itinerary, reservation or booking confirmation).
- change: a schedule change or modification to an existing booking. Return the legs with their NEW times and status "changed".
- cancellation: a booking was cancelled. Return the cancelled legs (confirmation code plus whatever identifies them: flight numbers, hotel name, dates) with status "cancelled".
- not_travel: anything else, including marketing, newsletters, loyalty statements, fare alerts, check-in reminders that add nothing new, and receipts with no itinerary. Return no legs.

For each leg:
- Flights: one leg per flight segment (a connection is two legs). number is the marketing flight number, e.g. "QR971". origin_iata and destination_iata are 3-letter airport codes. starts_at_local is the departure and ends_at_local the arrival, each in the airport's local time. start_tz and end_tz are the IANA zones of the departure and arrival airports (e.g. "Asia/Ho_Chi_Minh", "Asia/Qatar").
- Hotels: hotel_name is the property name, starts_at_local is check-in and ends_at_local check-out. If no time is given, use 15:00 for check-in and 11:00 for check-out. start_tz and end_tz are the hotel's IANA zone. Fill address, city and country.
- Trains, cars, events: starts_at_local / ends_at_local are local times, with the IANA zone of the place.
- Times are wall-clock local ISO 8601 without offset, "YYYY-MM-DDTHH:MM". Never convert to UTC.
- confirmation_code is the booking reference or PNR exactly as shown (e.g. "ABC123"), or null.
- provider is the airline, hotel chain or booking site (e.g. "Vietnam Airlines", "Marriott", "Agoda").
- city and country are where the leg takes place (the destination city for flights).
- confidence (0 to 1) reflects how sure you are about this leg's dates, times and identifiers. Use below 0.8 if anything had to be guessed, such as a missing year, an ambiguous date format, or a time zone you inferred.

Top-level confidence (0 to 1) is how sure you are about the classification. Put anything ambiguous in notes; otherwise notes is null. Only extract what the email states; never invent bookings.`;

let client: Anthropic | null = null;
function anthropic() {
  if (!client) client = new Anthropic();
  return client;
}

export interface EmailPayload {
  from: string;
  subject: string;
  body_text: string;
}

export async function extractTravel(
  email: EmailPayload,
  receivedAt: string
): Promise<TravelExtraction & { truncated: boolean; model: string }> {
  const body = email.body_text ?? '';
  const truncated = body.length > MAX_BODY_CHARS;
  const text = truncated ? body.slice(0, MAX_BODY_CHARS) : body;

  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: EXTRACTION_SCHEMA },
    },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Received: ${receivedAt}\nFrom: ${email.from}\nSubject: ${email.subject}\n\n<email_body>\n${text}\n</email_body>`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to extract this email');
  if (response.stop_reason === 'max_tokens') throw new Error('Extraction hit max_tokens');

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No extraction returned');
  const parsed = JSON.parse(textBlock.text) as TravelExtraction;

  return {
    ...normalizeExtraction(parsed),
    truncated,
    model: response.model,
  };
}

const clamp01 = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function normalizeExtraction(x: TravelExtraction): TravelExtraction {
  const legs: ExtractedLeg[] = x.kind === 'not_travel' ? [] : (x.legs ?? []).map((l) => ({ ...l, confidence: clamp01(l.confidence) }));
  return { kind: x.kind, confidence: clamp01(x.confidence), notes: x.notes ?? null, legs };
}
