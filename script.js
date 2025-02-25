// Sample recipe data
const recipes = [
    {
        id: 1,
        title: "Temporary placeholder recipe",
        cuisine: "American",
        time: 90, // 1h 30min converted to minutes
        image: "path_to_recipe_image.jpg", // You'll need to update this with actual image path
        ingredients: [
            "6 bone-in chicken breast halves, or 6 chicken thighs and wings, skin-on",
            "1/2 teaspoon coarse salt",
            "1/2 teaspoon Mrs. Dash seasoning",
            "1/4 teaspoon freshly ground black pepper"
        ],
        dietary: ["dairy-free"],
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
        ]
    },
    // Add more recipes here
];

// DOM Elements
const recipesContainer = document.getElementById('recipesContainer');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortButtons = document.querySelectorAll('.sort-btn');

// Update DOM Elements
const filterSelects = document.querySelectorAll('.filter-select');
const sortSelect = document.querySelector('.sort-select');

// Current filter and sort state
let currentFilters = {
    dietary: 'all',
    cuisine: 'all',
    time: 'all',
    ingredients: 'all'
};
let currentSort = 'time';

// Render recipes
function renderRecipes(recipesToRender) {
    recipesContainer.innerHTML = '';
    
    recipesToRender.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        recipeCard.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
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
        `;
        
        recipesContainer.appendChild(recipeCard);
    });
}

// Filter recipes
function filterRecipes() {
    let filteredRecipes = recipes;

    // Apply dietary filter
    if (currentFilters.dietary !== 'all') {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.dietary.includes(currentFilters.dietary)
        );
    }

    // Apply cuisine filter
    if (currentFilters.cuisine !== 'all') {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.cuisine.toLowerCase() === currentFilters.cuisine
        );
    }

    // Apply time filter
    if (currentFilters.time !== 'all') {
        const timeLimit = parseInt(currentFilters.time);
        filteredRecipes = filteredRecipes.filter(recipe => {
            if (timeLimit === 61) return recipe.time > 60;
            return recipe.time <= timeLimit;
        });
    }

    // Apply ingredients filter
    if (currentFilters.ingredients !== 'all') {
        const ingredientLimit = parseInt(currentFilters.ingredients);
        filteredRecipes = filteredRecipes.filter(recipe => {
            if (ingredientLimit === 16) return recipe.ingredientCount >= 16;
            return recipe.ingredientCount <= ingredientLimit;
        });
    }

    sortRecipes(filteredRecipes);
}

// Sort recipes
function sortRecipes(recipesToSort) {
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
}

// Event Listeners
filterSelects.forEach(select => {
    select.addEventListener('change', () => {
        const filterType = select.dataset.filterType;
        const filterValue = select.value;
        currentFilters[filterType] = filterValue;
        filterRecipes();
    });
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterRecipes();
});

// Initial render
filterRecipes(); 