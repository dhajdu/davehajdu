export type Purpose = 'business' | 'eo' | 'personal' | 'unknown';
export type LegKind = 'flight' | 'hotel' | 'train' | 'car' | 'event';
export type LegStatus = 'confirmed' | 'changed' | 'cancelled';

export type Place = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  kind: string;
  iata: string | null;
};

export type Trip = {
  id: string;
  title: string;
  title_locked: boolean;
  start_on: string;
  end_on: string | null;
  purpose: Purpose;
  notes: string | null;
  primary_place_id: string | null;
  primary: Pick<Place, 'name' | 'city' | 'country' | 'lat' | 'lng'> | null;
};

export type SourceEmail = {
  id: string;
  external_id: string;
  received_at: string;
  subject: string | null;
  from: string | null;
  sources: { slug: string } | null;
};

export type Leg = {
  id: string;
  trip_id: string | null;
  kind: LegKind;
  status: LegStatus;
  confirmation_code: string | null;
  provider: string | null;
  number: string | null;
  starts_at: string;
  start_tz: string;
  ends_at: string | null;
  end_tz: string | null;
  address: string | null;
  origin: Place | null;
  destination: Place | null;
  source: SourceEmail | null;
};
