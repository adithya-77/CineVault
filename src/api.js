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
