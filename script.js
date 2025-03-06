const recipes = [
    {
        id: 1,
        title: "Vegan Lentil Soup",
        cuisine: "Mediterranean",
        time: 30,
        image: "./chicken.webp",
        ingredients: [
            "red lentils",
            "carrots", 
            "onion",
            "garlic",
            "tomato paste",
            "cumin",
            "paprika", 
            "vegetable broth",
            "olive oil",
            "salt"
        ],
        dietary: ["vegan"],
        ingredientCount: 10,
        popularity: 85,
        pricePerServing: 2.50
    },
    {
        id: 2,
        title: "Vegetarian Pesto Pasta",
        cuisine: "Italian",
        time: 25,
        image: "./chicken.webp",
        ingredients: [
            "pasta",
            "basil",
            "parmesan cheese",
            "garlic",
            "pine nuts",
            "olive oil",
            "salt",
            "black pepper"
        ],
        dietary: ["vegetarian"],
        ingredientCount: 8,
        popularity: 92,
        pricePerServing: 3.00
    },
    {
        id: 3,
        title: "Gluten-Free Chicken Stir-Fry",
        cuisine: "Asian",
        time: 20,
        image: "./chicken.webp",
        ingredients: [
            "chicken breast",
            "broccoli",
            "bell pepper",
            "carrot",
            "soy sauce (gluten-free)",
            "ginger",
            "garlic",
            "sesame oil",
            "cornstarch",
            "green onion",
            "sesame seeds",
            "rice"
        ],
        dietary: ["gluten-free"],
        ingredientCount: 12,
        popularity: 78,
        pricePerServing: 4.00
    },
    {
        id: 4,
        title: "Dairy-Free Tacos",
        cuisine: "Mexican",
        time: 15,
        image: "./chicken.webp",
        ingredients: [
            "corn tortillas",
            "ground beef",
            "taco seasoning",
            "lettuce",
            "tomato",
            "avocado"
        ],
        dietary: ["dairy-free"],
        ingredientCount: 6,
        popularity: 88,
        pricePerServing: 2.80
    },
    {
        id: 5,
        title: "Middle Eastern Hummus",
        cuisine: "Middle Eastern",
        time: 10,
        image: "./chicken.webp",
        ingredients: [
            "chickpeas",
            "tahini",
            "garlic",
            "lemon juice",
            "olive oil"
        ],
        dietary: ["vegan", "gluten-free"],
        ingredientCount: 5,
        popularity: 95,
        pricePerServing: 1.50
    },
    {
        id: 6,
        title: "Quick Avocado Toast",
        cuisine: "Mediterranean",
        time: 5,
        image: "./chicken.webp",
        ingredients: [
            "bread",
            "avocado",
            "lemon juice",
            "salt"
        ],
        dietary: ["vegan"],
        ingredientCount: 4,
        popularity: 90,
        pricePerServing: 2.00
    },
    {
        id: 7,
        title: "Beef Stew",
        cuisine: "European",
        time: 90,
        image: "./chicken.webp",
        ingredients: [
            "beef chunks",
            "potatoes",
            "carrots",
            "onion",
            "garlic",
            "tomato paste",
            "beef broth",
            "red wine",
            "bay leaves",
            "thyme",
            "salt",
            "black pepper",
            "butter",
            "flour",
            "celery",
            "mushrooms"
        ],
        dietary: [],
        ingredientCount: 16,
        popularity: 80,
        pricePerServing: 5.50
    }
]

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

// Helper functions
const createFilterMessage = (filterType, selectedItems) => {
    const filterNames = {
        dietary: 'dietary preferences',
        cuisine: 'cuisines',
        ingredients: 'ingredient counts'
    };

    if (filterType === 'sort') {
        return `Sorted by: ${selectedItems}`;
    }

    if (filterType === 'time') {
        const timeValues = currentFilters.time.map(t => parseInt(t)).sort((a, b) => a - b);
        if (!timeValues.length) return `Cleared cooking times filter`;
        
        if (timeValues.includes(61)) {
            return `Selected cooking times: Over 60 min`;
        }
        const minTime = 0;
        const maxTime = Math.max(...timeValues);
        return `Selected cooking times: ${minTime} to ${maxTime} min`;
    }

    if (filterType === 'random') {
        return `Selected "${selectedItems[0]}"`;
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
                <p>Try adjusting your filters to find more recipes</p>
            </div>
        </div>
    `;
    return createCard('no-results-card', noResultsHtml);
};

const createRecipeCard = (recipe) => {
    const recipeHtml = `
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
    return createCard('recipe-card', recipeHtml);
};

const createCard = (className, innerHTML) => {
    const card = document.createElement('div');
    card.className = `recipe-card ${className}`;
    card.innerHTML = innerHTML;
    return card;
};

const formatFilterDescription = (filters) => {
    return Object.entries(filters)
        .filter(([filter, values]) => values.length > 0)
        .map(([filter, values]) => {
            switch(filter) {
                case 'dietary':
                    return `that are ${values.join(' and ')}`;
                case 'cuisine':
                    return `from ${values.join(' or ')} cuisine`;
                case 'time':
                    return `with a cooking time of ${values.join(' or ')} mins`;
                case 'ingredients':
                    return `with ${values.join(' or ')} ingredients`;
                default:
                    return '';
            }
        })
        .filter(text => text)
        .reduce((acc, text, i, arr) => {
            if (i === 0) return text;
            if (i === arr.length - 1) return `${acc} and ${text}`;
            return `${acc}, ${text}`;
        }, '');
};

// Filter and sort functions
const applyDietaryFilter = (recipes) => 
    !currentFilters.dietary.length ? recipes :
    recipes.filter(recipe => 
        currentFilters.dietary.every(diet => recipe.dietary.includes(diet))
    );

const applyCuisineFilter = (recipes) =>
    !currentFilters.cuisine.length ? recipes :
    recipes.filter(recipe => 
        currentFilters.cuisine.some(cuisine => 
            recipe.cuisine.toLowerCase() === cuisine.toLowerCase()
        )
    );

const applyTimeFilter = (recipes) =>
    !currentFilters.time.length ? recipes :
    recipes.filter(recipe => 
        currentFilters.time.some(timeLimit => {
            const limit = parseInt(timeLimit);
            return limit === 61 ? recipe.time > 60 : recipe.time <= limit;
        })
    );

const applyIngredientsFilter = (recipes) =>
    !currentFilters.ingredients.length ? recipes :
    recipes.filter(recipe => 
        currentFilters.ingredients.some(limit => {
            const count = parseInt(limit);
            return count === 16 ? recipe.ingredientCount >= 16 : recipe.ingredientCount <= count;
        })
    );

const sortRecipes = (recipes) => {
    if (currentSort === 'none') return recipes;

    const sortFunctions = {
        time: (a, b) => a.time - b.time,
        popularity: (a, b) => b.popularity - a.popularity,
        price: (a, b) => a.pricePerServing - b.pricePerServing,
        ingredients: (a, b) => a.ingredientCount - b.ingredientCount
    };

    return [...recipes].sort(sortFunctions[currentSort] || (() => 0));
};

// Main functions
const filterRecipes = () => {
    let filteredRecipes = recipes;
    filteredRecipes = applyDietaryFilter(filteredRecipes);
    filteredRecipes = applyCuisineFilter(filteredRecipes);
    filteredRecipes = applyTimeFilter(filteredRecipes);
    filteredRecipes = applyIngredientsFilter(filteredRecipes);
    
    renderRecipes(sortRecipes(filteredRecipes), false);
};

const renderRecipes = (recipesToRender, isRandomRecipe = false) => {
    recipesContainer.innerHTML = '';
    
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
};

const addFilterMessage = (filterType, selectedItems) => {
    const message = createFilterMessage(filterType, selectedItems);
    filterMessages.unshift(message);
    if (filterMessages.length > 5) filterMessages.pop();
    filterRecipes();
};

const resetUIState = () => {
    customSelects.forEach(select => {
        const filterType = select.dataset.filterType;
        const selectedValue = select.querySelector('.selected-value');
        
        if (filterType !== 'sort') {
            select.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            select.classList.remove('has-active-filters');
        }
        
        const defaultText = {
            dietary: 'Dietary Preferences',
            cuisine: 'Cuisines',
            time: 'Cooking Time',
            ingredients: 'No. of Ingredients'
        }[filterType] || 'No sorting';
        
        selectedValue.textContent = defaultText;
        if (filterType === 'sort') {
            select.classList.remove('has-active-sort');
        }
    });
};

// Event handlers
const clearAllFilters = () => {
    currentFilters = {
        dietary: [],
        cuisine: [],
        time: [],
        ingredients: []
    };
    currentSort = 'none';
    filterMessages = [];
    resetUIState();
    filterRecipes();
};

const handleRandomRecipe = () => {
    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    currentFilters = {
        dietary: [],
        cuisine: [],
        time: [],
        ingredients: []
    };
    currentSort = 'none';
    resetUIState();
    addFilterMessage('random', [randomRecipe.title]);
    renderRecipes([randomRecipe], true);
};

// Event listeners
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const randomRecipeBtn = document.getElementById('randomRecipeBtn');

clearFiltersBtn.addEventListener('click', clearAllFilters);
randomRecipeBtn.addEventListener('click', handleRandomRecipe);

customSelects.forEach(select => {
    const button = select.querySelector('.select-button');
    const selectedValue = button.querySelector('.selected-value');
    const dropdown = select.querySelector('.select-dropdown');
    const filterType = select.dataset.filterType;

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        select.classList.toggle('open');
        document.querySelectorAll('.custom-select.open')
            .forEach(openSelect => {
                if (openSelect !== select) openSelect.classList.remove('open');
            });
    });

    if (filterType !== 'sort') {
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const value = checkbox.dataset.value;
                
                if (checkbox.checked) {
                    currentFilters[filterType].push(value);
                } else {
                    currentFilters[filterType] = currentFilters[filterType]
                        .filter(v => v !== value);
                }

                const selectedItems = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.parentElement.textContent.trim());

                select.classList.toggle('has-active-filters', selectedItems.length > 0);
                selectedValue.textContent = selectedItems.length > 0 
                    ? selectedItems.join(', ')
                    : button.dataset.defaultText;

                addFilterMessage(filterType, selectedItems);
            });
        });
    } else {
        dropdown.querySelectorAll('li').forEach(option => {
            option.addEventListener('click', () => {
                selectedValue.textContent = option.textContent;
                select.classList.remove('open');
                currentSort = option.dataset.value;
                select.classList.toggle('has-active-sort', currentSort !== 'none');
                addFilterMessage('sort', option.textContent);
            });
        });
    }
});

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select.open')
        .forEach(select => select.classList.remove('open'));
});

// Initial render
filterRecipes();