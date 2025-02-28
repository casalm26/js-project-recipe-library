// Sample recipe data
const recipes = [
    {
        id: 1,
        title: "Placeholder Recipe",
        cuisine: "Mexican", 
        time: 90,
        image: "path_to_recipe_image.jpg",
        ingredients: [
            "6 bone-in chicken breast halves",
            "1/2 teaspoon coarse salt",
            "1/2 teaspoon Mrs. Dash seasoning", 
            "1/4 teaspoon black pepper"
        ],
        dietary: ["dairy-free", "gluten-free"],
        ingredientCount: 4,
        popularity: 4.5,
        pricePerServing: 3.50
    },
    {
        id: 2,
        title: "Cheat's cheesy Focaccia",
        cuisine: "Italian",
        time: 40,
        image: "path_to_focaccia_image.jpg",
        ingredients: [
            "500g pack bread mix",
            "2tbsp olive oil, plus a little extra for drizzling",
            "25g parmesan (or vegetarian alternative), grated",
            "75g dolcelatte cheese (or vegetarian alternative)"
        ],
        dietary: ["vegetarian"],
        ingredientCount: 4,
        popularity: 4.2,
        pricePerServing: 2.75
    },
    // Add more recipes here
];

// DOM Elements
const recipesContainer = document.getElementById('recipesContainer');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortButtons = document.querySelectorAll('.sort-btn');

// Update DOM Elements
const customSelects = document.querySelectorAll('.custom-select');

// Current filter and sort state
let currentFilters = {
    dietary: [],
    cuisine: [],
    time: [],
    ingredients: []
};
let currentSort = 'none';

// Add a messages array to store filter/sort history
let filterMessages = [];

// Render recipes
const renderRecipes = (recipesToRender) => {
    recipesContainer.innerHTML = '';
    
    // Create and append the message card
    const messageCard = document.createElement('div');
    messageCard.className = 'recipe-card message-card';
    messageCard.innerHTML = `
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
    recipesContainer.appendChild(messageCard);
    
    // Add no results message if no recipes match filters
    if (recipesToRender.length === 0) {
        const noResultsCard = document.createElement('div');
        noResultsCard.className = 'recipe-card no-results-card';
        noResultsCard.innerHTML = `
            <div class="recipe-content">
                <div class="no-results-content">
                    <svg class="no-results-icon" viewBox="0 0 24 24" width="48" height="48">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <h3>No recipes found ${Object.entries(currentFilters)
                        .filter(([filter, values]) => values.length > 0)
                        .map(([filter, values]) => {
                            if (filter === 'dietary' && values.length) {
                                return `that are ${values.join(' and ')}`;
                            } else if (filter === 'cuisine' && values.length) {
                                return `from ${values.join(' or ')} cuisine`;
                            } else if (filter === 'time' && values.length) {
                                return `with a cooking time of ${values.join(' or ')} mins`;
                            } else if (filter === 'ingredients' && values.length) {
                                return `with ${values.join(' or ')} ingredients`;
                            } else {
                                return '';
                            }
                        })
                        .filter(text => text)
                        .reduce((acc, text, i, arr) => {
                            if (i === 0) return text;
                            if (i === arr.length - 1) return `${acc} and ${text}`;
                            return `${acc}, ${text}`;
                        }, '')}.</h3>
                    <p>Try adjusting your filters to find more recipes</p>
                </div>
            </div>
        `;
        recipesContainer.appendChild(noResultsCard);
        return;
    }
    
    // Render recipe cards
    recipesToRender.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <div class="recipe-info">
                    <p>Cuisine: ${recipe.cuisine}</p>
                    <p>Time: ${recipe.time} minutes</p>
                </div>
                <div class="recipe-ingredients">
                    <h4>Ingredients:</h4>
                    <ul>
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        recipesContainer.appendChild(recipeCard);
    });
};

// Filter recipes
const filterRecipes = () => {
    let filteredRecipes = recipes;

    // Apply dietary filters
    if (currentFilters.dietary.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            currentFilters.dietary.every(diet => 
                recipe.dietary.includes(diet)
            )
        );
    }

    // Apply cuisine filters
    if (currentFilters.cuisine.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            currentFilters.cuisine.includes(recipe.cuisine.toLowerCase())
        );
    }

    // Apply time filters
    if (currentFilters.time.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            currentFilters.time.some(timeLimit => {
                const limit = parseInt(timeLimit);
                if (limit === 61) return recipe.time > 60;
                return recipe.time <= limit;
            })
        );
    }

    // Apply ingredients filters
    if (currentFilters.ingredients.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            currentFilters.ingredients.some(ingredientLimit => {
                const limit = parseInt(ingredientLimit);
                if (limit === 16) return recipe.ingredientCount >= 16;
                return recipe.ingredientCount <= limit;
            })
        );
    }

    sortRecipes(filteredRecipes);
};

// Sort recipes
const sortRecipes = (recipesToSort) => {
    if (currentSort === 'none') {
        renderRecipes(recipesToSort);
        return;
    }

    const sortedRecipes = [...recipesToSort].sort((a, b) => {
        switch (currentSort) {
            case 'time':
                return a.time - b.time;
            case 'popularity':
                return b.popularity - a.popularity;
            case 'price':
                return a.pricePerServing - b.pricePerServing;
            case 'ingredients':
                return a.ingredientCount - b.ingredientCount;
            default:
                return 0;
        }
    });
    
    renderRecipes(sortedRecipes);
};

// Add function to create messages for filter changes
const addFilterMessage = (filterType, selectedItems) => {
    let message = '';
    const timestamp = new Date().toLocaleTimeString();
    
    if (filterType === 'sort') {
        message = `Sorted by: ${selectedItems}`;
    } else {
        const filterNames = {
            dietary: 'dietary preferences',
            cuisine: 'cuisines',
            time: 'cooking times',
            ingredients: 'ingredient counts'
        };
        
        if (selectedItems.length === 0) {
            message = `Cleared ${filterNames[filterType]} filter`;
        } else {
            message = `Selected ${filterNames[filterType]}: ${selectedItems.join(', ')}`;
        }
    }
    
    filterMessages.unshift(message);
    if (filterMessages.length > 5) {
        filterMessages.pop();
    }
    filterRecipes(); // Ensure the display updates
};

// Handle custom select functionality
customSelects.forEach(select => {
    const button = select.querySelector('.select-button');
    const selectedValue = button.querySelector('.selected-value');
    const dropdown = select.querySelector('.select-dropdown');
    const filterType = select.dataset.filterType;

    // Toggle dropdown
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        select.classList.toggle('open');
        
        // Close other dropdowns
        document.querySelectorAll('.custom-select.open').forEach(openSelect => {
            if (openSelect !== select) {
                openSelect.classList.remove('open');
            }
        });
    });

    // Handle checkbox changes for filter types
    if (filterType !== 'sort') {
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const value = checkbox.dataset.value;
                
                if (checkbox.checked) {
                    currentFilters[filterType].push(value);
                } else {
                    currentFilters[filterType] = currentFilters[filterType].filter(v => v !== value);
                }

                const selectedItems = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.parentElement.textContent.trim());

                // Add or remove active class based on selection
                if (selectedItems.length > 0) {
                    select.classList.add('has-active-filters');
                } else {
                    select.classList.remove('has-active-filters');
                }

                const defaultText = {
                    dietary: 'Dietary Preferences',
                    cuisine: 'Cuisines',
                    time: 'Cooking Time',
                    ingredients: 'No. of Ingredients'
                }[filterType];

                selectedValue.textContent = selectedItems.length > 0 
                    ? selectedItems.join(', ')
                    : defaultText;

                addFilterMessage(filterType, selectedItems);
            });
        });
    } else {
        // Handle regular single-select options for sort
        dropdown.querySelectorAll('li').forEach(option => {
            option.addEventListener('click', () => {
                selectedValue.textContent = option.textContent;
                select.classList.remove('open');
                currentSort = option.dataset.value;
                
                // Add or remove active class based on sort value
                if (currentSort === 'none') {
                    select.classList.remove('has-active-sort');
                } else {
                    select.classList.add('has-active-sort');
                }
                
                addFilterMessage('sort', option.textContent);
            });
        });
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select.open').forEach(select => {
        select.classList.remove('open');
    });
});

// Initial render
filterRecipes();