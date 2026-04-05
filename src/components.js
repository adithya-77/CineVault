/**
 * Reusable UI component renderers
 */

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
    <rect fill="#1a1a2e" width="300" height="450"/>
    <text fill="#555" font-family="sans-serif" font-size="18" text-anchor="middle" x="150" y="225">No Image</text>
  </svg>`
);

const PERSON_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
    <rect fill="#1a1a2e" width="150" height="150" rx="75"/>
    <text fill="#555" font-family="sans-serif" font-size="14" text-anchor="middle" x="75" y="80">No Photo</text>
  </svg>`
);

export function renderStarRating(rating) {
  const stars = Math.round(rating / 2);
  let html = '<div class="star-rating">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= stars ? 'star-filled' : 'star-empty'}">★</span>`;
  }
  html += `<span class="rating-number">${rating}</span>`;
  html += '</div>';
  return html;
}

export function renderMovieCard(title) {
  const imgUrl = title.primaryImage?.url || PLACEHOLDER_IMG;
  const year = title.startYear || '';
  const rating = title.rating?.aggregateRating || '';
  const genres = (title.genres || []).slice(0, 2).join(', ');
  const typeLabel = formatType(title.type);

  return `
    <article class="movie-card" data-id="${title.id}" tabindex="0">
      <div class="movie-card-poster">
        <img src="${imgUrl}" alt="${title.primaryTitle}" loading="lazy" />
        <div class="movie-card-overlay">
          <button class="movie-card-btn" data-id="${title.id}">View Details</button>
        </div>
        ${rating ? `<div class="movie-card-rating"><span class="rating-star">★</span> ${rating}</div>` : ''}
        ${typeLabel ? `<div class="movie-card-type">${typeLabel}</div>` : ''}
      </div>
      <div class="movie-card-info">
        <h3 class="movie-card-title">${title.primaryTitle}</h3>
        <div class="movie-card-meta">
          <span class="movie-card-year">${year}</span>
          ${genres ? `<span class="movie-card-genres">${genres}</span>` : ''}
        </div>
      </div>
    </article>
  `;
}

export function renderMovieGrid(titles, containerId = 'movieGrid') {
  if (!titles || !titles.length) {
    return `<div class="empty-state" id="${containerId}">
      <div class="empty-icon">🎬</div>
      <h3>No titles found</h3>
      <p>Try adjusting your search or filters.</p>
    </div>`;
  }
  return `<div class="movie-grid" id="${containerId}">
    ${titles.map(t => renderMovieCard(t)).join('')}
  </div>`;
}

export function renderLoader() {
  return `<div class="loader-container">
    <div class="loader">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
    </div>
    <p class="loader-text">Loading...</p>
  </div>`;
}

export function renderSkeletonGrid(count = 12) {
  let cards = '';
  for (let i = 0; i < count; i++) {
    cards += `<article class="movie-card skeleton-card">
      <div class="movie-card-poster skeleton-poster"><div class="skeleton-shimmer"></div></div>
      <div class="movie-card-info">
        <div class="skeleton-text skeleton-title"></div>
        <div class="skeleton-text skeleton-meta"></div>
      </div>
    </article>`;
  }
  return `<div class="movie-grid">${cards}</div>`;
}

export function renderMovieDetail(title, credits, certificates, boxOffice) {
  const imgUrl = title.primaryImage?.url || PLACEHOLDER_IMG;
  const year = title.startYear ? (title.endYear ? `${title.startYear}–${title.endYear}` : `${title.startYear}`) : '';
  const runtime = title.runtimeSeconds ? formatRuntime(title.runtimeSeconds) : '';
  const typeLabel = formatType(title.type);

  // Credits breakdown
  const allCredits = credits?.credits || [];
  const directors = allCredits.filter(c => c.category === 'director');
  const writers = allCredits.filter(c => c.category === 'writer');
  const cast = allCredits.filter(c =>
    c.category === 'actor' || c.category === 'actress' || c.category === 'self'
  );

  // Fallback to title-level data
  const directorList = directors.length ? directors : (title.directors || []);
  const writerList = writers.length ? writers : (title.writers || []);
  const castList = cast.length ? cast : (title.stars || []);

  return `
    <div class="detail-hero">
      <div class="detail-backdrop" style="background-image: url('${imgUrl}')"></div>
      <div class="detail-hero-content">
        <div class="detail-poster">
          <img src="${imgUrl}" alt="${title.primaryTitle}" />
        </div>
        <div class="detail-info">
          <div class="detail-badges">
            ${typeLabel ? `<span class="badge badge-type">${typeLabel}</span>` : ''}
            ${title.rating ? `<span class="badge badge-rating"><span class="rating-star">★</span> ${title.rating.aggregateRating}/10</span>` : ''}
            ${year ? `<span class="badge badge-year">${year}</span>` : ''}
            ${runtime ? `<span class="badge badge-runtime">${runtime}</span>` : ''}
          </div>
          <h1 class="detail-title">${title.primaryTitle}</h1>
          ${title.originalTitle && title.originalTitle !== title.primaryTitle
      ? `<p class="detail-original-title">Original: ${title.originalTitle}</p>` : ''}
          <div class="detail-genres">
            ${(title.genres || []).map(g => `<span class="genre-tag">${g}</span>`).join('')}
          </div>
          ${title.rating ? `
            <div class="detail-rating-block">
              ${renderStarRating(title.rating.aggregateRating)}
              <span class="detail-votes">${title.rating.voteCount?.toLocaleString()} votes</span>
            </div>
          ` : ''}
          ${title.plot ? `<p class="detail-plot">${title.plot}</p>` : ''}

          ${renderCreditsList('Directors', directorList)}
          ${renderCreditsList('Writers', writerList)}

          ${renderCertificatesRow(certificates)}
          ${renderBoxOfficeRow(boxOffice)}
        </div>
      </div>
    </div>

    ${castList.length ? `
      <section class="detail-section">
        <h2 class="section-heading">Cast</h2>
        <div class="cast-scroll">
          ${castList.slice(0, 20).map(c => renderCastCard(c)).join('')}
        </div>
      </section>
    ` : ''}

    <section class="detail-section">
      <h2 class="section-heading">💾 Save to Database</h2>
      <div class="supabase-box">
        <div class="supabase-input-group">
          <input type="url" id="movieYoutubeUrl" class="supabase-input" placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)" />
          <button id="supabaseSaveBtn" class="supabase-save-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save to Database
          </button>
        </div>
        <p class="supabase-hint">This will save the movie details along with the YouTube URL to the central database.</p>
      </div>
    </section>

    <section class="detail-section">
      <h2 class="section-heading">📋 YouTube Description</h2>
      <div class="yt-copy-box" id="ytCopyBox">
        <textarea class="yt-textarea" id="ytTextarea" readonly></textarea>
        <button class="yt-copy-btn" id="ytCopyBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy to Clipboard
        </button>
      </div>
    </section>
  `;
}

function renderCreditsList(label, list) {
  if (!list || !list.length) return '';
  const names = list.map(p => p.name?.displayName || p.displayName).filter(Boolean);
  if (!names.length) return '';
  return `<div class="detail-credits-line"><strong>${label}:</strong> ${names.join(', ')}</div>`;
}

function renderCertificatesRow(certificates) {
  if (!certificates?.certificates?.length) return '';
  const certs = certificates.certificates.slice(0, 8);
  return `
    <div class="detail-certs">
      <strong>Certificates:</strong>
      ${certs.map(c => `<span class="cert-badge">${c.country?.code || ''} ${c.rating}</span>`).join('')}
    </div>
  `;
}

function renderBoxOfficeRow(boxOffice) {
  if (!boxOffice) return '';
  const items = [];
  if (boxOffice.productionBudget) items.push(['Budget', boxOffice.productionBudget]);
  if (boxOffice.domesticGross) items.push(['Domestic', boxOffice.domesticGross]);
  if (boxOffice.worldwideGross) items.push(['Worldwide', boxOffice.worldwideGross]);
  if (boxOffice.openingWeekendGross?.gross) items.push(['Opening Weekend', boxOffice.openingWeekendGross.gross]);
  if (!items.length) return '';
  return `
    <div class="detail-box-office">
      <strong>💰 Box Office:</strong>
      <div class="box-office-items">
        ${items.map(([label, val]) => `
          <div class="box-office-item">
            <span class="box-office-label">${label}</span>
            <span class="box-office-value">$${Number(val.amount).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCastCard(person) {
  const img = person.name?.primaryImage?.url || person.primaryImage?.url || PERSON_PLACEHOLDER;
  const name = person.name?.displayName || person.displayName || 'Unknown';
  const chars = person.characters?.join(', ') || '';

  return `
    <div class="cast-card">
      <div class="cast-img-wrapper">
        <img src="${img}" alt="${name}" loading="lazy" />
      </div>
      <div class="cast-name">${name}</div>
      ${chars ? `<div class="cast-character">${chars}</div>` : ''}
    </div>
  `;
}

export function renderHomePage() {
  return `
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <h1 class="hero-title">Discover <span class="hero-accent">Movies</span> & TV</h1>
        <p class="hero-subtitle">Explore millions of titles. Get cast, crew, ratings & more. Copy ready-to-use YouTube descriptions.</p>
      </div>
    </section>
    <section class="content-section">
      <div class="section-header">
        <h2 class="section-heading">🔥 Trending Now</h2>
      </div>
      <div id="trendingGrid">${renderSkeletonGrid(12)}</div>
    </section>
    <div class="load-more-container" id="loadMoreContainer" style="display:none;">
      <button class="load-more-btn" id="loadMoreBtn">Load More</button>
    </div>
  `;
}

export function renderSearchResults(query) {
  return `
    <section class="content-section">
      <div class="section-header">
        <h2 class="section-heading">Search Results for "<span class="search-query-text">${escapeHtml(query)}</span>"</h2>
      </div>
      <div id="searchResultsGrid">${renderSkeletonGrid(12)}</div>
    </section>
  `;
}

export function renderBrowsePage() {
  return `
    <section class="content-section">
      <div class="section-header">
        <h2 class="section-heading">📚 Browse Titles</h2>
      </div>
      <div class="filters-bar" id="filtersBar">
        <div class="filter-group">
          <label class="filter-label">Type</label>
          <select class="filter-select" id="filterType">
            <option value="">All</option>
            <option value="MOVIE">Movies</option>
            <option value="TV_SERIES">TV Series</option>
            <option value="TV_MINI_SERIES">Mini-Series</option>
            <option value="TV_MOVIE">TV Movie</option>
            <option value="SHORT">Short</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Genre</label>
          <select class="filter-select" id="filterGenre">
            <option value="">All</option>
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="Animation">Animation</option>
            <option value="Comedy">Comedy</option>
            <option value="Crime">Crime</option>
            <option value="Drama">Drama</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Horror">Horror</option>
            <option value="Mystery">Mystery</option>
            <option value="Romance">Romance</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Thriller">Thriller</option>
            <option value="War">War</option>
            <option value="Western">Western</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Sort By</label>
          <select class="filter-select" id="filterSort">
            <option value="SORT_BY_POPULARITY">Popularity</option>
            <option value="SORT_BY_USER_RATING">User Rating</option>
            <option value="SORT_BY_USER_RATING_COUNT">Rating Count</option>
            <option value="SORT_BY_RELEASE_DATE">Release Date</option>
            <option value="SORT_BY_YEAR">Year</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Order</label>
          <select class="filter-select" id="filterOrder">
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Min Rating</label>
          <input type="number" class="filter-input" id="filterMinRating" min="0" max="10" step="0.5" placeholder="0.0" />
        </div>
        <button class="filter-apply-btn" id="filterApplyBtn">Apply Filters</button>
      </div>
      <div id="browseGrid">${renderSkeletonGrid(12)}</div>
    </section>
    <div class="load-more-container" id="loadMoreContainer" style="display:none;">
      <button class="load-more-btn" id="loadMoreBtn">Load More</button>
    </div>
  `;
}

function formatRuntime(seconds) {
  const mins = Math.round(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
}

function formatType(type) {
  const map = {
    movie: 'Movie', tvSeries: 'Series', tvMiniSeries: 'Mini-Series',
    tvMovie: 'TV Movie', tvSpecial: 'Special', short: 'Short',
    video: 'Video', videoGame: 'Game',
  };
  return map[type] || type || '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
