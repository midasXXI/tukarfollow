const API_KEY = 'c000d7b8b0f5ee16b98b6103009745d8';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w780';
const MOVIES_JSON_PATH = 'https://midasxxi.github.io/tukarfollow/movies.json';
const JSON_FILES = [
    'https://midasxxi.github.io/tukarfollow/movies.json',
    'https://midasxxi.github.io/tukarfollow/movies2025.json',
    'https://midasxxi.github.io/tukarfollow/movies2024.json',
    'https://midasxxi.github.io/tukarfollow/moviesclassic.json'
];
const feedContainer = document.getElementById('feedContainer');
const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const infoPanel = document.getElementById('infoPanel');
const panelContentArea = document.getElementById('panelContentArea');
const videoPlayerContainer = document.getElementById('videoPlayerContainer');
const playerArea = document.getElementById('playerArea');
let moviesData = [];
let semuaFilm = [];
let activeMovieIndex = 0;
let currentPage = 1;
let currentActiveSection = null;
let isDesktop = false;
const SCROLL_POS_KEY = 'feedScrollPosition';

// ==============================================
// 📱 Deteksi Perangkat
// ==============================================
function detectDevice() {
    isDesktop = window.innerWidth >= 1024;
    const arrows = document.querySelectorAll('.arrow-actions-container');
    arrows.forEach(arrow => {
        if (arrow) arrow.style.display = isDesktop ? 'flex' : 'none';
    });
}

// ==============================================
// 💾 Simpan & Pulihkan Posisi Gulir
// ==============================================
function simpanPosisiGulir() {
    if (feedContainer) {
        sessionStorage.setItem(SCROLL_POS_KEY, feedContainer.scrollTop);
    }
}
function pulihkanPosisiGulir() {
    if (feedContainer) {
        const posisi = sessionStorage.getItem(SCROLL_POS_KEY);
        if (posisi !== null) {
            feedContainer.scrollTop = parseInt(posisi, 10);
        }
    }
}

// ==============================================
// 🚀 Notifier Promosi
// ==============================================
function initPromoNotifier() {
    const notifier = document.getElementById('desktopNotifier');
    const promoCard = document.getElementById('promoCard');
    const promoTitle = document.getElementById('promoTitle');
    const promoCountry = document.getElementById('promoCountry');
    const promoGenres = document.getElementById('promoGenres');
    const promoSinopsis = document.getElementById('promoSinopsis');
    const promoWatchBtn = document.getElementById('promoWatchBtn');
    if (!notifier || !promoCard) return;
    let latestMovie = {
        title: "Avatar: The Way of Water",
        country: "US",
        release_date: "2022-12-16",
        sinopsis: "Jake Sully tinggal bersama keluarga barunya di planet Pandora...",
        genre: ["Aksi", "Fiksi Ilmiah"],
        image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1000",
        tmdb_id: 76600
    };
    fetch(MOVIES_JSON_PATH)
        .then(response => {
            if (!response.ok) throw new Error('movies.json tidak merespon');
            return response.json();
        })
        .then(movies => {
            semuaFilm = movies;
            if (Array.isArray(movies) && movies.length > 0) {
                const indeksAcak = Math.floor(Math.random() * movies.length);
                latestMovie = movies[indeksAcak];
            }
            tampilkanFlyer();
        })
        .catch(err => {
            console.warn("⚠️ movies.json gagal → pakai data default", err);
            tampilkanFlyer();
        });
    function tampilkanFlyer() {
        if (latestMovie.image) promoCard.style.backgroundImage = `url('${latestMovie.image}')`;
        if (promoTitle) promoTitle.textContent = latestMovie.title || 'Judul Film';
        if (promoCountry) {
            const tahun = latestMovie.release_date ? latestMovie.release_date.split('-')[0] : '';
            promoCountry.textContent = `${latestMovie.country || 'Unknown'} • ${tahun}`;
        }
        if (promoSinopsis) promoSinopsis.textContent = latestMovie.sinopsis || 'Tidak ada sinopsis.';
        if (promoGenres && latestMovie.genre) {
            promoGenres.innerHTML = '';
            latestMovie.genre.forEach(g => {
                const span = document.createElement('span');
                span.textContent = g;
                promoGenres.appendChild(span);
            });
        }
        if (promoWatchBtn) {
            promoWatchBtn.onclick = function() {
                closeNotifier();
                const targetedId = latestMovie.tmdb_id || latestMovie.id;
                if (targetedId) {
                    simpanPosisiGulir();
                    playMovie(targetedId);
                } else if (latestMovie.iframe && videoPlayerContainer && playerArea) {
                    videoPlayerContainer.style.display = 'block';
                    playerArea.innerHTML = `<iframe src="${latestMovie.iframe}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
                }
            };
        }
        notifier.style.setProperty('display', 'flex', 'important');
        notifier.style.setProperty('position', 'fixed', 'important');
        notifier.style.setProperty('z-index', '99999', 'important');
        notifier.style.opacity = '1';
        if (window.lucide) lucide.createIcons();
    }
}
function closeNotifier() {
    const notifier = document.getElementById('desktopNotifier');
    if (notifier) {
        notifier.style.opacity = '0';
        notifier.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            notifier.style.display = 'none';
            notifier.style.opacity = '1';
        }, 300);
    }
}

// ==============================================
// 🎯 Gulir Halaman
// ==============================================
function scrollFeed(direction) {
    if (!feedContainer) return;
    const cardHeight = window.innerHeight;
    feedContainer.scrollBy({
        top: direction === 'down' ? cardHeight : -cardHeight,
        behavior: 'smooth'
    });
}

// ==============================================
// 🎬 Ambil Data Film dari TMDB
// ==============================================
async function fetchMovies(page = 1) {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=id-ID&page=${page}`);
        if (!response.ok) throw new Error('Gagal memuat data');
        const data = await response.json();
        if (page === 1) {
            moviesData = data.results;
        } else {
            moviesData = [...moviesData, ...data.results];
        }
        renderFeed(moviesData);
    } catch (error) {
        console.warn('⚠️ Gagal hubung TMDB → pakai data cadangan:', error);
        loadFallbackData();
    }
}

// ==============================================
// 📂 Data Cadangan
// ==============================================
function loadFallbackData() {
    const fallback = [
        { id: 726888, title: 'Heartbeast', overview: 'Elina, rapper Finlandia, jatuh cinta pada Sofia...', release_date: '2022-11-04', poster_path: '', origin_country: ['FI'] },
        { id: 157336, title: 'Interstellar', overview: 'Sekelompok penjelajah melintasi lubang cacing di luar angkasa...', release_date: '2014-11-05', poster_path: '/gEU2Qv0vHB77Yp7v6v94goI86v3.jpg', origin_country: ['US'] }
    ];
    if (moviesData.length === 0) moviesData = fallback;
    else moviesData = [...moviesData, ...fallback];
    renderFeed(moviesData);
}

// ==============================================
// 🖼️ Tampilkan Daftar Film
// ==============================================
function renderFeed(movies) {
    if (!feedContainer) return;
    feedContainer.innerHTML = '';
    movies.forEach((movie, index) => {
        const posterUrl = movie.poster_path
            ? `${IMAGE_URL}${movie.poster_path}`
            : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';
        const year = movie.release_date ? movie.release_date.split('-')[0] : '-';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.backgroundImage = `url('${posterUrl}')`;
        card.innerHTML = `
            <div class="overlay"></div>
            <div class="top-title">${movie.title}</div>
            <div class="play-btn-container" onclick="simpanPosisiGulir(); playMovie(${movie.id})">
                <div class="play-circle"><i data-lucide="play" fill="#fff" size="32"></i></div>
            </div>
            <div class="main-content">
                <div class="side-actions">
                    <div class="arrow-actions-container" style="display: ${isDesktop ? 'flex' : 'none'};">
                        <div class="inline-scroll-arrow" onclick="scrollFeed('up')"><i data-lucide="chevron-up" size="22"></i></div>
                        <div class="inline-scroll-arrow" onclick="scrollFeed('down')"><i data-lucide="chevron-down" size="22"></i></div>
                    </div>
                    <div class="action-item" onclick="toggleSection(event, ${index}, 'info')">
                        <i data-lucide="info" size="28"></i>
                        <span>Info</span>
                    </div>
                    <div class="action-item" onclick="toggleSection(event, ${index}, 'release')">
                        <i data-lucide="calendar" size="28"></i>
                        <span>${year}</span>
                    </div>
                    <div class="action-item" onclick="toggleSection(event, ${index}, 'genre')">
                        <i data-lucide="clapperboard" size="28"></i>
                        <span>Genre</span>
                    </div>
                    <div class="action-item" onclick="toggleSection(event, ${index}, 'country')">
                        <i data-lucide="globe" size="28"></i>
                        <span>Negara</span>
                    </div>
                </div>
            </div>
        `;
        feedContainer.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

// ==============================================
// ➡️ Muat Halaman Berikutnya
// ==============================================
function loadNextPage() {
    currentPage++;
    fetchMovies(currentPage);
}

// ==============================================
// ℹ️ Panel Info Samping
// ==============================================
async function toggleSection(event, index, section) {
    event.stopPropagation();
    if (!infoPanel || !panelContentArea) return;
    const movie = moviesData[index];
    if (!movie) return;
    if (infoPanel.classList.contains('show') && currentActiveSection === section) {
        infoPanel.classList.remove('show');
        currentActiveSection = null;
        return;
    }
    currentActiveSection = section;
    panelContentArea.innerHTML = `<div style="padding:20px; color:#fff;">Memuat...</div>`;
    infoPanel.classList.add('show');
    try {
        const resDetail = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=id-ID`);
        const detailData = await resDetail.json();
        let html = '';
        switch (section) {
            case 'info':
                html = `<p style="line-height:1.7; color:#fff; margin:0;">${detailData.overview || movie.overview || 'Sinopsis tidak tersedia.'}</p>`;
                break;
            case 'release':
                html = `<p style="color:#fff; margin:0;"><strong>Tanggal Rilis:</strong><br>${detailData.release_date || movie.release_date || 'Tidak diketahui'}</p>`;
                break;
            case 'genre':
                const genreMap = {
                    28: 'Aksi', 12: 'Petualangan', 16: 'Animasi', 35: 'Komedi', 80: 'Kejahatan', 99: 'Dokumenter',
                    18: 'Drama', 10751: 'Keluarga', 14: 'Fantasi', 36: 'Sejarah', 27: 'Horor', 10402: 'Musik',
                    9648: 'Misteri', 10749: 'Romantis', 878: 'Fiksi Ilmiah', 10770: 'Film TV', 53: 'Thriller', 10752: 'Perang', 37: 'Barat'
                };
                const genres = detailData.genres?.map(g => g.name) || movie.genre_ids?.map(id => genreMap[id] || 'Lainnya');
                html = `<p style="color:#fff; margin:0;"><strong>Genre:</strong><br>${genres.join(', ') || 'Tidak ditentukan'}</p>`;
                break;
            case 'country':
                const countries = detailData.production_countries?.map(c => c.name) || movie.origin_country?.map(c => {
                    const map = { 'US': 'Amerika Serikat', 'FI': 'Finlandia', 'KR': 'Korea Selatan', 'JP': 'Jepang', 'ID': 'Indonesia', 'GB': 'Inggris', 'FR': 'Prancis', 'CN': 'Cina', 'HK': 'Hong Kong', 'TH': 'Thailand', 'IN': 'India' };
                    return map[c] || c;
                });
                html = `<p style="color:#fff; margin:0;"><strong>Negara:</strong><br>${countries.join(', ') || 'Tidak ditentukan'}</p>`;
                break;
        }
        panelContentArea.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        panelContentArea.innerHTML = `<p style="color:#ff6b6b;">Gagal memuat detail.</p>`;
    }
}

// ==============================================
// 🔍 Putar / Arahkan ke Halaman Tonton
// ==============================================
async function playMovie(tmdbId) {
    if (!tmdbId) return;
    let judulUrl = '';
    try {
        for (const file of JSON_FILES) {
            const res = await fetch(file, { cache: "no-store" });
            if (res.ok) {
                const daftarFilm = await res.json();
                const ketemu = daftarFilm.find(f => {
                    if (!f.tmdb_id) return false;
                    return String(f.tmdb_id).trim() === String(tmdbId).trim() || Number(f.tmdb_id) === Number(tmdbId);
                });
                if (ketemu && ketemu.title) {
                    judulUrl = ketemu.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
                    break;
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Gagal baca file JSON:', err);
    }
    if (!judulUrl) judulUrl = 'unknown';
    window.location.href = `watch.html?id=${String(tmdbId).trim()}/${judulUrl}`;
}

// ==============================================
// ⌨️ Pencarian Film
// ==============================================
let searchResultsLayer = document.getElementById('searchResultsLayer');
if (!searchResultsLayer) {
    searchResultsLayer = document.createElement('div');
    searchResultsLayer.id = 'searchResultsLayer';
    searchResultsLayer.className = 'search-results-layer';
    searchResultsLayer.innerHTML = `
        <div class="search-header">
            <h4>Hasil Pencarian</h4>
            <button class="close-search" onclick="tutupPencarian()"><i data-lucide="x" size="20"></i></button>
        </div>
        <div class="search-content" id="searchContent"></div>
    `;
    document.body.appendChild(searchResultsLayer);
}
function tutupPencarian() {
    searchResultsLayer.classList.remove('active');
    if (searchInput) searchInput.value = '';
}
async function cariFilm(kata) {
    if (!kata || kata.trim().length < 2) return;
    const searchContent = document.getElementById('searchContent');
    if (searchContent) searchContent.innerHTML = `<div style="padding:30px; color:#fff; text-align:center;">Mencari...</div>`;
    searchResultsLayer.classList.add('active');
    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=id-ID&query=${encodeURIComponent(kata)}&page=1&include_adult=false`);
        const data = await res.json();
        const hasilHTML = data.results?.map(movie => `
            <div class="search-item-row" onclick="simpanPosisiGulir(); playMovie(${movie.id})">
                <div class="search-item-thumb" style="background-image:url('${movie.poster_path ? IMAGE_URL + movie.poster_path : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200'}')"></div>
                <div class="search-item-info">
                    <h4>${movie.title}</h4>
                    <p>${movie.release_date ? movie.release_date.split('-')[0] : '-'}</p>
                    <p style="font-size:12px; opacity:0.7;">${movie.overview ? movie.overview.substring(0, 80) + '...' : 'Tidak ada sinopsis'}</p>
                </div>
            </div>
        `).join('') || `<div style="padding:40px; color:#aaa; text-align:center;">Tidak ada hasil ditemukan</div>`;
        if (searchContent) searchContent.innerHTML = hasilHTML;
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        if (searchContent) searchContent.innerHTML = `<div style="padding:40px; color:#ff6b6b; text-align:center;">Gagal terhubung</div>`;
    }
}
if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            cariFilm(searchInput.value.trim());
        }
    });
}

// ==============================================
// 🧭 Navigasi & GULIR OTOMATIS MUAT FILM
// ==============================================
const navSearch = document.getElementById('navSearch');
const navHome = document.getElementById('navHome');
if (navSearch) {
    navSearch.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!searchContainer) return;
        searchContainer.classList.toggle('show');
        if (searchContainer.classList.contains('show') && searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        } else {
            tutupPencarian();
        }
    });
}
if (navHome) {
    navHome.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        tutupPencarian();
        if (searchContainer) searchContainer.classList.remove('show');
        if (feedContainer) feedContainer.scrollTop = 0;
        sessionStorage.removeItem(SCROLL_POS_KEY);
    });
}

// ✅ BAGIAN PENTING: GULIR SAMPAI BAWAH → OTOMATIS MUAT HALAMAN BERIKUTNYA
let sedangMemuat = false; // Cegah pemanggilan ganda
if (feedContainer) {
    feedContainer.addEventListener('scroll', () => {
        const idx = Math.round(feedContainer.scrollTop / window.innerHeight);
        if (idx !== activeMovieIndex) {
            activeMovieIndex = idx;
            if (infoPanel) infoPanel.classList.remove('show');
            currentActiveSection = null;
        }

        // 👇 OTOMATIS MUAT FILM TAMBAHAN SAAT DEKAT BAWAH
        const sisaJarak = feedContainer.scrollHeight - feedContainer.scrollTop - feedContainer.clientHeight;
        if (sisaJarak < 300 && !sedangMemuat) {
            sedangMemuat = true;
            loadNextPage();
            // Beri jeda sebentar agar tidak dipanggil berkali-kali
            setTimeout(() => { sedangMemuat = false; }, 1500);
        }
    });
}

const closePlayerBtn = document.getElementById('closePlayerBtn');
if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        if (videoPlayerContainer) videoPlayerContainer.style.display = 'none';
        if (playerArea) playerArea.innerHTML = '';
    });
}

// ==============================================
// 🚀 JALANKAN SEMUA
// ==============================================
window.addEventListener('DOMContentLoaded', detectDevice);
window.addEventListener('load', () => {
    fetchMovies();
    setTimeout(pulihkanPosisiGulir, 100);
    setTimeout(initPromoNotifier, 400);
});
window.addEventListener('pageshow', (e) => {
    setTimeout(pulihkanPosisiGulir, e.persisted ? 50 : 150);
});
window.addEventListener('resize', detectDevice);

// PWA
let deferredPrompt;
const installBtn = document.getElementById('installPwaBtn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'flex';
});
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(outcome === 'accepted' ? 'PWA diinstal' : 'Dibatalkan');
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
}
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
    console.log('PWA sudah terpasang');
});
if (typeof lucide !== 'undefined') lucide.createIcons();
