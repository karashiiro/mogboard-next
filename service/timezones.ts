import { differenceInMinutes } from 'date-fns';
import { cache } from './cache';

export interface TimeZone {
  id: string;
  offset: number;
  name: string;
}

export async function getTimeZones(): Promise<TimeZone[]> {
  if (cache.timezones && differenceInMinutes(cache.timezones.cachedAt, new Date()) <= 5) {
    return cache.timezones.value;
  }

  try {
    const timezones = await fetch('https://universalis.app/api/v3/misc/time-zones').then((res) =>
      res.json()
    );

    cache.timezones = {
      value: timezones,
      cachedAt: new Date(),
    };
  } catch (err) {
    if (cache.timezones) {
      return cache.timezones.value;
    }

    throw err;
  }

  return cache.timezones.value;
}
