import { SelectedTerritory } from '../public-content/relevance';

export interface PublicTerritory extends SelectedTerritory {
  label: string;
}

export const DEFAULT_TERRITORY: PublicTerritory = {
  regionId: null,
  provinceId: null,
  municipalityId: null,
  label: 'Argentina'
};

/**
 * Parses the raw value of the lgf_territory cookie and returns a validated PublicTerritory.
 */
export function parseTerritoryCookie(cookieValue?: string): PublicTerritory {
  if (!cookieValue) return DEFAULT_TERRITORY;
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue));
    if (parsed && typeof parsed === 'object') {
      return {
        regionId: typeof parsed.regionId === 'string' ? parsed.regionId : null,
        provinceId: typeof parsed.provinceId === 'string' ? parsed.provinceId : null,
        municipalityId: typeof parsed.municipalityId === 'string' ? parsed.municipalityId : null,
        label: typeof parsed.label === 'string' ? parsed.label : 'Argentina'
      };
    }
  } catch (e) {
    console.error('Error parsing lgf_territory cookie', e);
  }
  return DEFAULT_TERRITORY;
}

/**
 * Serializes a PublicTerritory object into a URL-safe JSON string for cookie storage.
 */
export function serializeTerritoryCookie(territory: PublicTerritory): string {
  return encodeURIComponent(JSON.stringify({
    regionId: territory.regionId,
    provinceId: territory.provinceId,
    municipalityId: territory.municipalityId,
    label: territory.label
  }));
}

/**
 * Reads a cookie by name on the client side.
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

/**
 * Sets a cookie on the client side.
 */
export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
}

