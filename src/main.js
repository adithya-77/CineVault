import {
  searchTitles, listTitles, getTitle,
  getTitleCredits, getTitleCertificates, getTitleBoxOffice,
  saveMovieToSupabase,
} from './api.js';
import {
  renderHomePage, renderMovieGrid, renderMovieDetail,
  renderSearchResults, renderBrowsePage, renderLoader,
  renderSkeletonGrid, renderMovieCard,
} from './components.js';
import { formatYouTubeDescription, copyToClipboard } from './youtube.js';
import '../style.css';

// --- State ---
let currentPageToken = null;
let currentRoute = '';
let browseFilters = {};
let searchDebounceTimer = null;

// --- DOM refs ---
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');
const searchClear = document.getElementById('searchClear');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');

// --- Router ---
function getRoute() {
  const hash = window.location.hash || '#/';
  return hash;
}

async function handleRoute() {
  const hash = getRoute();
  currentRoute = hash;
  closeModal();
  searchDropdown.classList.remove('show');

  if (hash.startsWith('#/title/')) {
    const titleId = hash.replace('#/title/', '');
    await showMovieDetail(titleId);
  } else if (hash.startsWith('#/search')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const query = params.get('q') || '';
    searchInput.value = query;
    await showSearchResults(query);
  } else if (hash === '#/browse') {
    await showBrowsePage();
  } else {
    await showHomePage();
  }
}

// --- Pages ---
async function showHomePage() {
  currentPageToken = null;
  mainContent.innerHTML = renderHomePage();

  try {
    const data = await listTitles({ sortBy: 'SORT_BY_POPULARITY', sortOrder: 'ASC' });
    const grid = document.getElementById('trendingGrid');
    if (grid) {
      grid.innerHTML = renderMovieGrid(data.titles, 'trendingGrid');
      attachCardListeners(grid);
    }
    currentPageToken = data.nextPageToken || null;
    showLoadMore();
  } catch (err) {
    console.error(err);
    const grid = document.getElementById('trendingGrid');
    if (grid) grid.innerHTML = `<div class="error-state">Failed to load titles. Please try again.</div>`;
  }
}

async function showSearchResults(query) {
  if (!query) { window.location.hash = '#/'; return; }
  mainContent.innerHTML = renderSearchResults(query);

  try {
    const data = await searchTitles(query);
    const grid = document.getElementById('searchResultsGrid');
    if (grid) {
      grid.innerHTML = renderMovieGrid(data.titles || data.results || [], 'searchResultsGrid');
      attachCardListeners(grid);
    }
  } catch (err) {
    console.error(err);
    const grid = document.getElementById('searchResultsGrid');
    if (grid) grid.innerHTML = `<div class="error-state">Search failed. Please try again.</div>`;
  }
}

async function showBrowsePage() {
  currentPageToken = null;
  browseFilters = {};
  mainContent.innerHTML = renderBrowsePage();

  const applyBtn = document.getElementById('filterApplyBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => applyBrowseFilters());
  }

  await loadBrowseResults();
}

async function applyBrowseFilters() {
  const type = document.getElementById('filterType')?.value;
  const genre = document.getElementById('filterGenre')?.value;
  const sortBy = document.getElementById('filterSort')?.value;
  const sortOrder = document.getElementById('filterOrder')?.value;
  const minRating = document.getElementById('filterMinRating')?.value;

  browseFilters = {};
  if (type) browseFilters.types = [type];
  if (genre) browseFilters.genres = [genre];
  if (sortBy) browseFilters.sortBy = sortBy;
  if (sortOrder) browseFilters.sortOrder = sortOrder;
  if (minRating) browseFilters.minAggregateRating = parseFloat(minRating);

  currentPageToken = null;
  const grid = document.getElementById('browseGrid');
  if (grid) grid.innerHTML = renderSkeletonGrid(12);
  await loadBrowseResults();
}

async function loadBrowseResults(append = false) {
  try {
    const params = { ...browseFilters };
    if (currentPageToken && append) params.pageToken = currentPageToken;

    const data = await listTitles(params);
    const grid = document.getElementById('browseGrid');
    if (grid) {
      if (append) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = (data.titles || []).map(t => renderMovieCard(t)).join('');
        while (tempDiv.firstChild) {
          grid.querySelector('.movie-grid')?.appendChild(tempDiv.firstChild) ||
            grid.appendChild(tempDiv.firstChild);
        }
      } else {
        grid.innerHTML = renderMovieGrid(data.titles || [], 'browseGridInner');
      }
      attachCardListeners(grid);
    }
    currentPageToken = data.nextPageToken || null;
    showLoadMore();
  } catch (err) {
    console.error(err);
  }
}

async function showMovieDetail(titleId) {
  openModal();
  modalContent.innerHTML = renderLoader();

  try {
    const [titleData, creditsData, certsData, boxData] = await Promise.allSettled([
      getTitle(titleId),
      getTitleCredits(titleId),
      getTitleCertificates(titleId),
      getTitleBoxOffice(titleId),
    ]);

    const title = titleData.status === 'fulfilled' ? titleData.value : null;
    const credits = creditsData.status === 'fulfilled' ? creditsData.value : null;
    const certificates = certsData.status === 'fulfilled' ? certsData.value : null;
    const boxOffice = boxData.status === 'fulfilled' ? boxData.value : null;

    if (!title) {
      modalContent.innerHTML = `<div class="error-state">Failed to load title details.</div>`;
      return;
    }

    modalContent.innerHTML = renderMovieDetail(title, credits, certificates, boxOffice);

    // Set YouTube description text
    const ytTextarea = document.getElementById('ytTextarea');
    const ytCopyBtn = document.getElementById('ytCopyBtn');
    if (ytTextarea) {
      ytTextarea.value = formatYouTubeDescription(title, credits, certificates, boxOffice);
    }
    if (ytCopyBtn) {
      ytCopyBtn.addEventListener('click', async () => {
        const text = ytTextarea?.value || '';
        try {
          await copyToClipboard(text);
          showToast('Copied to clipboard!');
          ytCopyBtn.classList.add('copied');
          ytCopyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 6L9 17l-5-5"/></svg> Copied!`;
          setTimeout(() => {
            ytCopyBtn.classList.remove('copied');
            ytCopyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy to Clipboard`;
          }, 2000);
        } catch {
          showToast('Failed to copy. Try manually.');
        }
      });
    }

    // Supabase Save logic
    const supabaseSaveBtn = document.getElementById('supabaseSaveBtn');
    const movieYoutubeUrl = document.getElementById('movieYoutubeUrl');
    if (supabaseSaveBtn && movieYoutubeUrl) {
      supabaseSaveBtn.addEventListener('click', async () => {
        const youtubeUrl = movieYoutubeUrl.value.trim();
        if (!youtubeUrl) {
          showToast('Please enter a YouTube URL');
          return;
        }

        supabaseSaveBtn.disabled = true;
        supabaseSaveBtn.textContent = 'Saving...';

        try {
          // Collect data for Supabase
          const payload = {
            imdb_id: title.id,
            name: title.primaryTitle,
            youtube_url: youtubeUrl,
            genres: JSON.stringify((title.genres || []).slice(0, 2)) // Only first two genres as requested
          };

          await saveMovieToSupabase(payload);
          showToast('✅ Saved to database!');
          movieYoutubeUrl.value = '';
        } catch (err) {
          console.error(err);
          showToast('❌ Failed to save. Check console.');
        } finally {
          supabaseSaveBtn.disabled = false;
          supabaseSaveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Database`;
        }
      });
    }
  } catch (err) {
    console.error(err);
    modalContent.innerHTML = `<div class="error-state">Failed to load title details. ${err.message}</div>`;
  }
}

// --- Search ---
searchInput?.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  searchClear.style.display = query ? 'flex' : 'none';

  clearTimeout(searchDebounceTimer);
  if (query.length < 2) {
    searchDropdown.classList.remove('show');
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    try {
      searchDropdown.innerHTML = '<div class="dropdown-loading">Searching...</div>';
      searchDropdown.classList.add('show');
      const data = await searchTitles(query);
      const results = data.titles || data.results || [];
      if (results.length === 0) {
        searchDropdown.innerHTML = '<div class="dropdown-empty">No results found</div>';
        return;
      }
      searchDropdown.innerHTML = results.slice(0, 8).map(t => {
        const img = t.primaryImage?.url || '';
        const year = t.startYear || '';
        const rating = t.rating?.aggregateRating || '';
        return `
          <a class="dropdown-item" href="#/title/${t.id}">
            <div class="dropdown-thumb">
              ${img ? `<img src="${img}" alt="" loading="lazy" />` : `<div class="dropdown-thumb-placeholder">🎬</div>`}
            </div>
            <div class="dropdown-info">
              <div class="dropdown-title">${t.primaryTitle}</div>
              <div class="dropdown-meta">
                ${year ? `<span>${year}</span>` : ''}
                ${rating ? `<span>★ ${rating}</span>` : ''}
              </div>
            </div>
          </a>
        `;
      }).join('') + `<a class="dropdown-see-all" href="#/search?q=${encodeURIComponent(query)}">See all results →</a>`;
    } catch (err) {
      searchDropdown.innerHTML = '<div class="dropdown-empty">Search failed</div>';
    }
  }, 350);
});

searchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      searchDropdown.classList.remove('show');
      window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
    }
  }
});

searchClear?.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchDropdown.classList.remove('show');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchDropdown.classList.remove('show');
  }
});

// --- Modal ---
function openModal() {
  modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('show');
  document.body.style.overflow = '';
  modalContent.innerHTML = '';
}

modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// --- Toast ---
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// --- Card click listeners ---
function attachCardListeners(container) {
  container.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.movie-card-btn')) return;
      const id = card.dataset.id;
      if (id) showMovieDetail(id);
    });
  });
  container.querySelectorAll('.movie-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (id) showMovieDetail(id);
    });
  });
}

// --- Load more ---
function showLoadMore() {
  const container = document.getElementById('loadMoreContainer');
  const btn = document.getElementById('loadMoreBtn');
  if (!container || !btn) return;

  if (currentPageToken) {
    container.style.display = 'flex';
    btn.onclick = async () => {
      btn.textContent = 'Loading...';
      btn.disabled = true;
      if (currentRoute === '#/browse') {
        await loadBrowseResults(true);
      } else {
        await loadMoreTrending();
      }
      btn.textContent = 'Load More';
      btn.disabled = false;
    };
  } else {
    container.style.display = 'none';
  }
}

async function loadMoreTrending() {
  try {
    const data = await listTitles({
      sortBy: 'SORT_BY_POPULARITY',
      sortOrder: 'ASC',
      pageToken: currentPageToken,
    });
    const grid = document.getElementById('trendingGrid');
    if (grid) {
      const movieGrid = grid.querySelector('.movie-grid');
      if (movieGrid) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = (data.titles || []).map(t => renderMovieCard(t)).join('');
        while (tempDiv.firstChild) {
          movieGrid.appendChild(tempDiv.firstChild);
        }
        attachCardListeners(movieGrid);
      }
    }
    currentPageToken = data.nextPageToken || null;
    showLoadMore();
  } catch (err) {
    console.error(err);
  }
}

// --- Header scroll effect ---
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (!header) return;
  const scrollY = window.scrollY;
  header.classList.toggle('header-scrolled', scrollY > 50);
  lastScroll = scrollY;
});

// --- Active nav ---
function updateNav() {
  const hash = getRoute();
  document.getElementById('navHome')?.classList.toggle('active', hash === '#/' || hash === '');
  document.getElementById('navBrowse')?.classList.toggle('active', hash.startsWith('#/browse'));
}

// --- Init ---
window.addEventListener('hashchange', () => {
  updateNav();
  handleRoute();
});

updateNav();
handleRoute();
