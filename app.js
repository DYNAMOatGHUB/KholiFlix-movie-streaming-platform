// TMDB API Configuration
const TMDB_API_KEY = 'b9cd4ee40ca04611f564a0127bfbea03';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const moviesContainer = document.getElementById("movies");
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// Fetch movies from TMDB
async function fetchMovies(page = 1, query = '') {
  try {
    let url;
    if (query) {
      url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    } else {
      url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch movies');
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Fetch movie videos/trailers
async function fetchMovieVideos(movieId) {
  try {
    const url = `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return { results: [] };
  }
}

function renderMovieCard(movie) {
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  const rating = movie.vote_average || 0;
  const ratingPercent = Math.round(rating * 10);
  
  return `
    <article class="movie-card" data-movie-id="${movie.id}">
      <div class="poster-container">
        <img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster" loading="lazy">
        <div class="rating-badge">${ratingPercent}%</div>
        <div class="movie-overlay">
          <button class="watch-btn" onclick="openTrailer(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
            <span>▶</span> Watch Now
          </button>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-meta">${movie.release_date?.split('-')[0] || 'N/A'}</p>
        <p class="movie-description">${movie.overview || 'No description available.'}</p>
      </div>
    </article>
  `;
}

async function renderMovies(page = 1) {
  try {
    currentPage = page;
    moviesContainer.innerHTML = '<div class="loading">⏳ Loading movies...</div>';
    
    const data = await fetchMovies(page, searchQuery);
    totalPages = data.total_pages;
    const movies = data.results.filter(m => m.poster_path);
    
    if (movies.length === 0) {
      moviesContainer.innerHTML = '<div class="error-state"><h3>No movies found</h3><p>Try a different search term</p></div>';
      return;
    }
    
    moviesContainer.innerHTML = movies.map(renderMovieCard).join('');
    updatePagination();
  } catch (error) {
    moviesContainer.innerHTML = `
      <div class="error-state">
        <h3>⚠️ Unable to load movies</h3>
        <p>Please check your connection or try again later.</p>
        <button onclick="renderMovies(1)">Retry</button>
      </div>
    `;
    console.error('Failed to render movies', error);
  }
}

function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  let html = '';
  
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="renderMovies(1)">« First</button>`;
    html += `<button class="page-btn" onclick="renderMovies(${currentPage - 1})">‹ Prev</button>`;
  }
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<button class="page-btn active">${i}</button>`;
    } else {
      html += `<button class="page-btn" onclick="renderMovies(${i})">${i}</button>`;
    }
  }
  
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="renderMovies(${currentPage + 1})">Next ›</button>`;
    html += `<button class="page-btn" onclick="renderMovies(${totalPages})">Last »</button>`;
  }
  
  paginationContainer.innerHTML = html;
}

async function openTrailer(movieId, title) {
  try {
    const videoData = await fetchMovieVideos(movieId);
    const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    
    if (trailer && trailer.key) {
      showTrailerModal(title, trailer.key);
    } else {
      alert(`🎬 No trailer available for "${title}"\n\nBut the movie is available on TMDB!`);
    }
  } catch (error) {
    console.error('Error loading trailer:', error);
    alert('Unable to load trailer. Please try again.');
  }
}

function showTrailerModal(title, youtubeKey) {
  const modal = document.getElementById('trailer-modal');
  const modalTitle = document.getElementById('modal-title');
  const videoFrame = document.getElementById('video-frame');
  
  modalTitle.textContent = title;
  videoFrame.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1`;
  modal.style.display = 'block';
}

function closeTrailerModal() {
  const modal = document.getElementById('trailer-modal');
  const videoFrame = document.getElementById('video-frame');
  modal.style.display = 'none';
  videoFrame.src = '';
}

function searchMovies(event) {
  event.preventDefault();
  const input = document.getElementById('search-input');
  searchQuery = input.value.trim();
  currentPage = 1;
  renderMovies(1);
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  currentPage = 1;
  renderMovies(1);
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  const modal = document.getElementById('trailer-modal');
  if (event.target === modal) {
    closeTrailerModal();
  }
});

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
  renderMovies(1);
});
