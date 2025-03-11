// API configuration
const API_KEY = 'ae9a7ed28b524302b564a7e680a506ef'; // Replace with your actual Spoonacular API key
const API_URL = 'https://api.spoonacular.com/recipes/random';
const NUMBER_OF_RECIPES = 10; // Number of recipes to fetch
const CACHE_EXPIRY = 60 * 60 * 1000; // Cache expiry time: 1 hour in milliseconds

// Store fetched recipes
let recipes = [];
let favorites = [];
let isLoading = false;
let page = 0;
const recipesPerPage = 5;

// Current filters state
const currentFilters = {
    dietary: [],
    cuisine: [],
    time: [],
    ingredients: [],
    search: ''
};

let currentSort = 'none';
const filterMessages = [];

// DOM Elements
const recipesContainer = document.getElementById('recipesContainer');
const dietarySelect = document.querySelector('[data-filter-type="dietary"]');
const cuisineSelect = document.querySelector('[data-filter-type="cuisine"]');
const timeSelect = document.querySelector('[data-filter-type="time"]');
const ingredientsSelect = document.querySelector('[data-filter-type="ingredients"]');
const sortSelect = document.querySelector('[data-filter-type="sort"]');
const randomRecipeBtn = document.getElementById('randomRecipeBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

// Add favorites button to header
const headerButtons = document.querySelector('.header-buttons');
const favoritesBtn = document.createElement('button');
favoritesBtn.id = 'favoritesBtn';
favoritesBtn.className = 'favorites-btn';
favoritesBtn.textContent = 'View Favorites';
headerButtons.appendChild(favoritesBtn);

// Setup custom select elements
const customSelects = document.querySelectorAll('.custom-select');
customSelects.forEach(select => {
    const button = select.querySelector('.select-button');
    const dropdown = select.querySelector('.select-dropdown');
    
    button.addEventListener('click', () => {
        const wasOpen = select.classList.contains('open');
        
        // Close all selects first
        customSelects.forEach(s => s.classList.remove('open'));
        
        // Then open this one if it wasn't open before
        if (!wasOpen) {
            select.classList.add('open');
        }
    });
    
    // Handle checkbox selection for filter types
    if (select.dataset.filterType !== 'sort') {
        const checkboxes = select.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const filterType = select.dataset.filterType;
                const value = checkbox.dataset.value;
                
                if (checkbox.checked) {
                    currentFilters[filterType].push(value);
                    select.classList.add('has-active-filters');
                } else {
                    currentFilters[filterType] = currentFilters[filterType].filter(v => v !== value);
                    if (currentFilters[filterType].length === 0) {
                        select.classList.remove('has-active-filters');
                    }
                }
                
                // Update the button text
                const selectedValues = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.parentNode.textContent.trim());
                
                const buttonText = select.querySelector('.selected-value');
                buttonText.textContent = selectedValues.length ? 
                    `${selectedValues.length} selected` : 
                    button.querySelector('.selected-value').dataset.default || button.querySelector('.selected-value').textContent;
                
                // Add message and filter recipes
                addFilterMessage(filterType, selectedValues);
                filterRecipes();
            });
        });
    } else {
        // Handle sort selection
        const sortOptions = select.querySelectorAll('li');
        sortOptions.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                currentSort = value;
                
                // Update the button text
                const buttonText = select.querySelector('.selected-value');
                buttonText.textContent = option.textContent;
                
                // Toggle active class for styling
                if (value === 'none') {
                    select.classList.remove('has-active-sort');
                } else {
                    select.classList.add('has-active-sort');
                }
                
                // Add message and filter recipes
                addFilterMessage('sort', [option.textContent]);
                filterRecipes();
                
                // Close the dropdown
                select.classList.remove('open');
            });
        });
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
        customSelects.forEach(select => select.classList.remove('open'));
    }
});

// Helper functions
const createFilterMessage = (filterType, selectedItems) => {
    const filterNames = {
        dietary: 'dietary preferences',
        cuisine: 'cuisines',
        time: 'cooking time',
        ingredients: 'number of ingredients',
        sort: 'sorting',
        search: 'search query',
        favorites: 'favorites view'
    };
    
    if (filterType === 'time') {
        if (selectedItems.length === 0) {
            return `Cleared cooking time filter`;
        }
        
        const timeFilters = currentFilters.time.map(Number);
        const minTime = Math.min(...timeFilters);
        const maxTime = Math.max(...timeFilters);
        
        // Adjust based on your time filter values
        const getTimeRange = time => {
            if (time === 15) return '0-15';
            if (time === 30) return '15-30';
            if (time === 60) return '30-60';
            if (time === 61) return '60+';
            return '';
        };
        
        const minRange = getTimeRange(minTime);
        const maxRange = getTimeRange(maxTime);
        
        return `Selected cooking times: ${minRange} to ${maxRange} min`;
    }
    
    if (filterType === 'random') {
        return `Selected "${selectedItems[0]}"`;
    }

    if (filterType === 'search') {
        return `Searched for: "${selectedItems[0]}"`;
    }

    if (filterType === 'favorites') {
        return `Viewing favorite recipes`;
    }
    
    return selectedItems.length === 0
        ? `Cleared ${filterNames[filterType]} filter`
        : `Selected ${filterNames[filterType]}: ${selectedItems.join(', ')}`;
};

const createMessageCard = () => {
    const messageHtml = `
        <div class="recipe-content">
            <h3 class="recipe-title">Filter and Sort History</h3>
            <div class="message-container">
                ${filterMessages.length > 0 
                    ? filterMessages.map(msg => `<p class="filter-message">${msg}</p>`).join('')
                    : '<p class="filter-message">No filters or sorting applied yet</p>'
                }
            </div>
        </div>
    `;
    return createCard('message-card', messageHtml);
};

const createNoResultsCard = () => {
    const noResultsHtml = `
        <div class="recipe-content">
            <div class="no-results-content">
                <svg class="no-results-icon" viewBox="0 0 24 24" width="48" height="48">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <h3>No recipes found ${formatFilterDescription(currentFilters)}.</h3>
                <p>Try adjusting your filters to see more recipes.</p>
            </div>
        </div>
    `;
    return createCard('no-results-card', noResultsHtml);
};

const createLoadingCard = () => {
    const loadingHtml = `
        <div class="recipe-content">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3>Loading recipes...</h3>
                <p>Getting delicious recipes for you</p>
            </div>
        </div>
    `;
    return createCard('loading-card', loadingHtml);
};

const createRecipeCard = (recipe) => {
    // Extract ingredients from Spoonacular format
    const ingredients = recipe.extendedIngredients 
        ? recipe.extendedIngredients.map(ing => ing.original || ing.name)
        : [];
    
    // Check if recipe is in favorites
    const isFavorite = favorites.some(fav => fav.id === recipe.id);
    
    const recipeHtml = `
        <a href="${recipe.sourceUrl || `#recipe-${recipe.id}`}" class="recipe-link" target="_blank">
            <div class="recipe-content">
                ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" style="width:100%; border-radius:8px; margin-bottom:12px;">` : ''}
                <h3 class="recipe-title">${recipe.title}</h3>
                <div class="recipe-info">
                    <p>Cuisine: ${recipe.cuisines && recipe.cuisines.length ? recipe.cuisines.join(', ') : 'Various'}</p>
                    <p>Time: ${recipe.readyInMinutes || '?'} minutes</p>
                </div>
                <div class="recipe-ingredients">
                    <h4>Ingredients:</h4>
                    <ul>
                        ${ingredients.slice(0, 8).map(ingredient => `<li>${ingredient}</li>`).join('')}
                        ${ingredients.length > 8 ? `<li>+ ${ingredients.length - 8} more ingredients</li>` : ''}
                    </ul>
                </div>
            </div>
        </a>
        <button class="favorite-btn ${isFavorite ? 'is-favorite' : ''}" data-id="${recipe.id}">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        </button>
    `;
    const card = createCard('recipe-card', recipeHtml);
    
    // Add event listener for the favorite button
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(recipe);
        favoriteBtn.classList.toggle('is-favorite');
    });
    
    return card;
};

const createCard = (className, innerHTML) => {
    const card = document.createElement('div');
    card.className = `recipe-card ${className}`;
    card.innerHTML = innerHTML;
    return card;
};

const formatFilterDescription = (filters) => {
    const parts = [];
    if (filters.dietary.length) parts.push(`with dietary preferences: ${filters.dietary.join(', ')}`);
    if (filters.cuisine.length) parts.push(`in cuisine: ${filters.cuisine.join(', ')}`);
    if (filters.time.length) parts.push(`within cooking time: ${filters.time.join(', ')} minutes`);
    if (filters.ingredients.length) parts.push(`with ingredient count: ${filters.ingredients.join(', ')}`);
    if (filters.search) parts.push(`matching search: "${filters.search}"`);
    return parts.length ? ` (${parts.join('; ')})` : '';
};

// Filter functions
const dietaryFilter = (recipes) => 
    !currentFilters.dietary.length ? recipes :
    recipes.filter(recipe => 
        currentFilters.dietary.some(diet => 
            // Check if recipe has matching diet property
            (recipe.diets && recipe.diets.some(d => 
                d.toLowerCase() === diet.toLowerCase())
            )
        )
    );

const cuisineFilter = (recipes) =>
    !currentFilters.cuisine.length ? recipes :
    recipes.filter(recipe => 
        currentFilters.cuisine.some(cuisine => 
            // Check if recipe has matching cuisine
            (recipe.cuisines && recipe.cuisines.some(c => 
                c.toLowerCase() === cuisine.toLowerCase())
            )
        )
    );

const timeFilter = (recipes) =>
    !currentFilters.time.length ? recipes :
    recipes.filter(recipe => {
        const time = recipe.readyInMinutes || 0;
        return currentFilters.time.some(range => {
            const rangeNum = parseInt(range);
            if (rangeNum === 15) return time <= 15;
            if (rangeNum === 30) return time > 15 && time <= 30;
            if (rangeNum === 60) return time > 30 && time <= 60;
            if (rangeNum === 61) return time > 60;
            return false;
        });
    });

const ingredientsFilter = (recipes) =>
    !currentFilters.ingredients.length ? recipes :
    recipes.filter(recipe => {
        const count = recipe.extendedIngredients ? recipe.extendedIngredients.length : 0;
        return currentFilters.ingredients.some(range => {
            const rangeNum = parseInt(range);
            if (rangeNum === 5) return count <= 5;
            if (rangeNum === 10) return count > 5 && count <= 10;
            if (rangeNum === 15) return count > 10 && count <= 15;
            if (rangeNum === 16) return count > 15;
            return false;
        });
    });

const searchFilter = (recipes) => 
    !currentFilters.search ? recipes :
    recipes.filter(recipe => {
        const searchTerm = currentFilters.search.toLowerCase();
        const titleMatch = recipe.title.toLowerCase().includes(searchTerm);
        const ingredientMatch = recipe.extendedIngredients && 
            recipe.extendedIngredients.some(ing => 
                (ing.name && ing.name.toLowerCase().includes(searchTerm)) || 
                (ing.original && ing.original.toLowerCase().includes(searchTerm))
            );
        return titleMatch || ingredientMatch;
    });

const sortRecipes = (recipes) => {
    if (currentSort === 'none') return recipes;

    const sortFunctions = {
        time: (a, b) => (a.readyInMinutes || 0) - (b.readyInMinutes || 0),
        popularity: (a, b) => (b.aggregateLikes || 0) - (a.aggregateLikes || 0),
        price: (a, b) => (a.pricePerServing || 0) - (b.pricePerServing || 0),
        ingredients: (a, b) => (a.extendedIngredients?.length || 0) - (b.extendedIngredients?.length || 0)
    };

    return [...recipes].sort(sortFunctions[currentSort] || (() => 0));
};

// Main functions
const filterRecipes = (showFavorites = false) => {
    if (recipes.length === 0 && !showFavorites) {
        return; // No recipes to filter yet
    }
    
    let filteredRecipes = showFavorites ? favorites : recipes;
    filteredRecipes = dietaryFilter(filteredRecipes);
    filteredRecipes = cuisineFilter(filteredRecipes);
    filteredRecipes = timeFilter(filteredRecipes);
    filteredRecipes = ingredientsFilter(filteredRecipes);
    filteredRecipes = searchFilter(filteredRecipes);
    
    renderRecipes(sortRecipes(filteredRecipes), false, showFavorites);
};

const renderRecipes = (recipesToRender, isRandomRecipe = false, showingFavorites = false) => {
    recipesContainer.innerHTML = '';
    
    // Show loading indicator
    if (isLoading) {
        recipesContainer.appendChild(createLoadingCard());
        return;
    }
    
    // Show message card only if not a random recipe
    if (!isRandomRecipe) {
        recipesContainer.appendChild(createMessageCard());
    }
    
    if (recipesToRender.length === 0) {
        recipesContainer.appendChild(createNoResultsCard());
        return;
    }
    
    recipesToRender.forEach(recipe => {
        recipesContainer.appendChild(createRecipeCard(recipe));
    });

    // Add load more button if not showing favorites and there are more recipes to load
    if (!showingFavorites && !isRandomRecipe && recipes.length > 0) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = 'Load More Recipes';
        loadMoreBtn.addEventListener('click', () => {
            fetchMoreRecipes();
        });
        recipesContainer.appendChild(loadMoreBtn);
    }
};

const addFilterMessage = (filterType, selectedItems) => {
    const message = createFilterMessage(filterType, selectedItems);
    filterMessages.unshift(message); // Add to the beginning
    
    // Keep only the last 10 messages
    if (filterMessages.length > 10) {
        filterMessages.pop();
    }
};

const resetUIState = () => {
    // Reset all select components to default state
    customSelects.forEach(select => {
        const filterType = select.dataset.filterType;
        select.classList.remove('has-active-filters', 'has-active-sort', 'open');
        
        if (filterType !== 'sort') {
            const checkboxes = select.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
            
            const buttonText = select.querySelector('.selected-value');
            buttonText.textContent = buttonText.dataset.default || buttonText.textContent;
        } else {
            const buttonText = select.querySelector('.selected-value');
            buttonText.textContent = 'No sorting';
        }
    });

    // Clear search input
    searchInput.value = '';
};

const clearAllFilters = () => {
    // Reset filter state
    Object.keys(currentFilters).forEach(key => {
        currentFilters[key] = [];
    });
    currentFilters.search = '';
    currentSort = 'none';
    
    // Reset UI
    resetUIState();
    
    // Add message
    addFilterMessage('clear', ['all filters']);
    
    // Re-filter recipes
    filterRecipes();
};

const handleRandomRecipe = () => {
    if (recipes.length > 0) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        currentFilters = {
            dietary: [],
            cuisine: [],
            time: [],
            ingredients: [],
            search: ''
        };
        currentSort = 'none';
        resetUIState();
        addFilterMessage('random', [randomRecipe.title]);
        renderRecipes([randomRecipe], true);
    }
};

// Local storage functions
const saveToLocalStorage = (key, data) => {
    try {
        const item = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
};

const getFromLocalStorage = (key) => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const parsedItem = JSON.parse(item);
        const now = Date.now();
        
        // Check if cache is expired
        if (now - parsedItem.timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            return null;
        }
        
        return parsedItem.data;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
};

// Favorites functions
const toggleFavorite = (recipe) => {
    const index = favorites.findIndex(fav => fav.id === recipe.id);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(recipe);
        addFilterMessage('favorite', [`Added "${recipe.title}" to favorites`]);
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        addFilterMessage('favorite', [`Removed "${recipe.title}" from favorites`]);
        
        // If we're currently viewing favorites, update the view
        if (favoritesBtn.classList.contains('active')) {
            filterRecipes(true);
        }
    }
    
    // Save to local storage
    saveToLocalStorage('favorites', favorites);
};

const loadFavorites = () => {
    const storedFavorites = getFromLocalStorage('favorites');
    if (storedFavorites) {
        favorites = storedFavorites;
    }
};

// Fetch recipes from Spoonacular API
const fetchRecipes = async (isInitial = true) => {
    // Try to get from cache first if it's the initial load
    if (isInitial) {
        const cachedRecipes = getFromLocalStorage('recipes');
        if (cachedRecipes && cachedRecipes.length > 0) {
            recipes = cachedRecipes;
            filterRecipes();
            return;
        }
    }

    isLoading = true;
    renderRecipes([], false); // Show loading state
    
    try {
        const response = await fetch(`${API_URL}?apiKey=${API_KEY}&number=${NUMBER_OF_RECIPES}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isInitial) {
            recipes = data.recipes;
            // Save to local storage
            saveToLocalStorage('recipes', recipes);
        } else {
            // Append new recipes
            recipes = [...recipes, ...data.recipes];
            saveToLocalStorage('recipes', recipes);
        }
        
        isLoading = false;
        
        // Initialize the page with the fetched recipes
        filterRecipes();
    } catch (error) {
        console.error('Error fetching recipes:', error);
        isLoading = false;
        
        // Handle API quota exceeded
        if (error.message.includes('402')) {
            recipesContainer.innerHTML = `
                <div class="recipe-card no-results-card">
                    <div class="recipe-content">
                        <div class="no-results-content">
                            <h3>Daily API Quota Exceeded</h3>
                            <p>Sorry, we've reached our daily limit for recipe requests. Please try again tomorrow!</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            recipesContainer.innerHTML = `
                <div class="recipe-card no-results-card">
                    <div class="recipe-content">
                        <div class="no-results-content">
                            <h3>Error Loading Recipes</h3>
                            <p>Something went wrong while fetching recipes. Please try again later.</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
};

const fetchMoreRecipes = () => {
    fetchRecipes(false);
};

// Search function
const handleSearch = () => {
    const searchTerm = searchInput.value.trim();
    currentFilters.search = searchTerm;
    
    if (searchTerm) {
        addFilterMessage('search', [searchTerm]);
    } else {
        // If search is cleared, add a message
        addFilterMessage('search', ['']);
    }
    
    filterRecipes();
};

// View favorites function
const toggleFavoritesView = () => {
    favoritesBtn.classList.toggle('active');
    
    if (favoritesBtn.classList.contains('active')) {
        favoritesBtn.textContent = 'View All Recipes';
        addFilterMessage('favorites', []);
        filterRecipes(true);
    } else {
        favoritesBtn.textContent = 'View Favorites';
        addFilterMessage('favorites', ['Showing all recipes']);
        filterRecipes(false);
    }
};

// Event listeners
randomRecipeBtn.addEventListener('click', handleRandomRecipe);
clearFiltersBtn.addEventListener('click', clearAllFilters);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});
favoritesBtn.addEventListener('click', toggleFavoritesView);

// Implement infinite scroll
window.addEventListener('scroll', () => {
    if (!isLoading && !favoritesBtn.classList.contains('active')) {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            fetchMoreRecipes();
        }
    }
});

// Close dropdowns when clicking escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        customSelects.forEach(select => select.classList.remove('open'));
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites(); // Load favorites from local storage
    fetchRecipes(); // Fetch recipes with caching
});