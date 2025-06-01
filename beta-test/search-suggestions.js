// Search suggestions functionality for FreeFlix
class SearchSuggestions {
    constructor(inputSelector, suggestionsSelector) {
        this.searchInput = document.querySelector(inputSelector);
        this.suggestionsContainer = this.createSuggestionsContainer();
        this.tmdbApi = new TMDBApi();
        this.debounceTimer = null;
        this.currentSuggestions = [];
        this.selectedIndex = -1;

        this.init();
    }

    init() {
        if (!this.searchInput) return;

        this.setupEventListeners();
        this.positionSuggestionsContainer();
    }

    createSuggestionsContainer() {
        const container = document.createElement('div');
        container.className = 'search-suggestions';
        container.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(26, 26, 27, 0.95);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            border-top: none;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            display: none;
        `;

        return container;
    }

    setupEventListeners() {
        // Input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.currentSuggestions.length > 0) {
                this.showSuggestions();
            }
        });

        this.searchInput.addEventListener('blur', (e) => {
            // Delay hiding to allow clicks on suggestions
            setTimeout(() => {
                this.hideSuggestions();
            }, 200);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    positionSuggestionsContainer() {
        const searchContainer = this.searchInput.closest('.search-container');
        if (searchContainer) {
            searchContainer.style.position = 'relative';
            searchContainer.appendChild(this.suggestionsContainer);
        }
    }

    handleInput(query) {
        clearTimeout(this.debounceTimer);

        if (query.trim().length < 2) {
            this.hideSuggestions();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(query.trim());
        }, 300);
    }

    handleKeydown(e) {
        if (!this.suggestionsContainer.style.display || this.suggestionsContainer.style.display === 'none') {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateSuggestions(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateSuggestions(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.currentSuggestions[this.selectedIndex]);
                } else {
                    this.performSearch(this.searchInput.value.trim());
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                this.searchInput.blur();
                break;
        }
    }

    navigateSuggestions(direction) {
        const maxIndex = this.currentSuggestions.length - 1;

        if (direction === 1) {
            this.selectedIndex = this.selectedIndex < maxIndex ? this.selectedIndex + 1 : 0;
        } else {
            this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : maxIndex;
        }

        this.highlightSuggestion();
    }

    highlightSuggestion() {
        const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        suggestions.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    async fetchSuggestions(query) {
        try {
            // Fetch suggestions from TMDB
            const [movieResults, tvResults] = await Promise.all([
                this.tmdbApi.searchMovies(query, 1),
                this.tmdbApi.searchTVShows(query, 1)
            ]);

            // Combine and limit results
            const allResults = [
                ...movieResults.results.slice(0, 3),
                ...tvResults.results.slice(0, 3)
            ];

            this.currentSuggestions = allResults
                .filter(item => item.poster_path) // Only items with posters
                .slice(0, 6)
                .map(item => this.tmdbApi.formatSearchResult(item));

            if (this.currentSuggestions.length > 0) {
                this.renderSuggestions();
                this.showSuggestions();
            } else {
                this.hideSuggestions();
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.hideSuggestions();
        }
    }

    renderSuggestions() {
        const suggestionHTML = this.currentSuggestions.map((item, index) => `
            <div class="suggestion-item" data-index="${index}" onclick="searchSuggestions.selectSuggestion(searchSuggestions.currentSuggestions[${index}])">
                <div class="suggestion-poster">
                    <img src="${item.poster}" alt="${item.title}" loading="lazy"
                         onerror="this.src='/assets/placeholder-poster.jpg'">
                </div>
                <div class="suggestion-info">
                    <div class="suggestion-title">${item.title}</div>
                    <div class="suggestion-meta">
                        <span class="suggestion-type">${this.getTypeLabel(item.mediaType)}</span>
                        ${item.year ? `<span class="suggestion-year">${item.year}</span>` : ''}
                        ${item.rating !== 'N/A' ? `<span class="suggestion-rating">⭐ ${item.rating}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add "See all results" option
        const seeAllHTML = `
            <div class="suggestion-item see-all" onclick="searchSuggestions.performSearch('${this.searchInput.value.trim()}')">
                <div class="suggestion-poster see-all-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="suggestion-info">
                    <div class="suggestion-title">See all results for "${this.searchInput.value.trim()}"</div>
                    <div class="suggestion-meta">
                        <span class="suggestion-type">View complete search results</span>
                    </div>
                </div>
            </div>
        `;

        this.suggestionsContainer.innerHTML = suggestionHTML + seeAllHTML;
        this.addSuggestionStyles();
    }

    addSuggestionStyles() {
        if (document.getElementById('suggestion-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'suggestion-styles';
        styles.textContent = `
            .suggestion-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .suggestion-item:last-child {
                border-bottom: none;
            }

            .suggestion-item:hover,
            .suggestion-item.highlighted {
                background: rgba(139, 92, 246, 0.2);
                transform: translateX(4px);
            }

            .suggestion-poster {
                width: 40px;
                height: 60px;
                border-radius: 6px;
                overflow: hidden;
                margin-right: 12px;
                flex-shrink: 0;
                background: rgba(139, 92, 246, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .suggestion-poster img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .see-all-icon {
                color: rgba(139, 92, 246, 0.8);
            }

            .suggestion-info {
                flex: 1;
                min-width: 0;
            }

            .suggestion-title {
                font-weight: 600;
                color: white;
                font-size: 14px;
                line-height: 1.3;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .suggestion-meta {
                display: flex;
                gap: 8px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                align-items: center;
            }

            .suggestion-type {
                background: rgba(139, 92, 246, 0.3);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
            }

            .suggestion-year {
                color: rgba(139, 92, 246, 0.8);
            }

            .suggestion-rating {
                color: #ffd700;
            }

            .see-all .suggestion-title {
                color: rgba(139, 92, 246, 0.9);
            }

            .see-all .suggestion-type {
                background: none;
                padding: 0;
                color: rgba(255, 255, 255, 0.5);
            }
        `;

        document.head.appendChild(styles);
    }

    getTypeLabel(mediaType) {
        switch (mediaType) {
            case 'movie': return 'Movie';
            case 'tv': return 'TV Show';
            case 'person': return 'Person';
            default: return 'Media';
        }
    }

    selectSuggestion(suggestion) {
        this.searchInput.value = suggestion.title;
        this.hideSuggestions();
        this.performSearch(suggestion.title);
    }

    performSearch(query) {
        if (query.trim()) {
            window.location.href = `search-results.html?search=${encodeURIComponent(query.trim())}`;
        }
    }

    showSuggestions() {
        this.suggestionsContainer.style.display = 'block';
        this.selectedIndex = -1;
    }

    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
        this.selectedIndex = -1;
    }
}

// Global instance for external access
let searchSuggestions = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if TMDB API is available
    if (typeof TMDBApi !== 'undefined') {
        searchSuggestions = new SearchSuggestions('.search-input');
    }
});
