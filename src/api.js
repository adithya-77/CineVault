const BASE_URL = 'https://api.imdbapi.dev';

async function fetchJSON(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  });
  const res = await fetch(url.toString(), {
    headers: { 'accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function searchTitles(query) {
  return fetchJSON('/search/titles', { query });
}

export async function listTitles(params = {}) {
  return fetchJSON('/titles', params);
}

export async function getTitle(titleId) {
  return fetchJSON(`/titles/${titleId}`);
}

export async function getTitleCredits(titleId) {
  return fetchJSON(`/titles/${titleId}/credits`);
}

export async function getTitleCertificates(titleId) {
  return fetchJSON(`/titles/${titleId}/certificates`);
}

export async function getTitleBoxOffice(titleId) {
  return fetchJSON(`/titles/${titleId}/boxOffice`);
}

export async function getTitleImages(titleId) {
  return fetchJSON(`/titles/${titleId}/images`);
}

export async function getTitleVideos(titleId) {
  return fetchJSON(`/titles/${titleId}/videos`);
}

/**
 * Save movie details to Supabase
 */
export async function saveMovieToSupabase(movieData) {
  const url = 'https://uobuzgtgewhbsvcfoxyj.supabase.co/rest/v1/movies';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYnV6Z3RnZXdoYnN2Y2ZveHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzA0OTYsImV4cCI6MjA5MDg0NjQ5Nn0.ya-END9vIlSzvyHTa8n0FxGZlM0QoaeKfvsaFambgKM';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(movieData)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Supabase Error: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return true;
}
