document.addEventListener('DOMContentLoaded', () => {
    const foodWheel = document.getElementById('foodWheel');
    const itemDisplay = foodWheel.querySelector('.item-display');
    
    // Settings Gear and Modal elements
    const settingsGear = document.getElementById('settingsGear');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModalButton = document.getElementById('closeSettingsModal');
    const categoriesListDiv = document.getElementById('categoriesList');
    const saveSettingsButton = document.getElementById('saveSettingsButton');

    let allFoodItems = []; // All items from JSON
    let spinableItems = []; // Filtered items based on selected categories
    let allCategories = new Set(); // To store unique categories
    let selectedCategories = new Set(); // To store user-selected categories

    let isSpinning = false;
    let foodLoadedSuccessfully = false;

    // --- Settings Modal Logic ---
    settingsGear.addEventListener('click', () => {
        settingsModal.classList.add('show');
        populateCategoriesPanel(); // Re-populate in case categories changed (though unlikely for this app)
    });

    closeSettingsModalButton.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });

    saveSettingsButton.addEventListener('click', () => {
        // Save selected categories from checkboxes
        selectedCategories.clear();
        const checkboxes = categoriesListDiv.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedCategories.add(checkbox.value);
            }
        });
        localStorage.setItem('selectedFoodCategories', JSON.stringify(Array.from(selectedCategories)));
        settingsModal.classList.remove('show');
        updateSpinableItemsAndWheelText(); // Update the available items and wheel text
    });

    // Close modal if clicked outside of modal-content
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });

    function populateCategoriesPanel() {
        categoriesListDiv.innerHTML = ''; // Clear previous list
        const sortedCategories = Array.from(allCategories).sort();

        sortedCategories.forEach(category => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.checked = selectedCategories.has(category); // Check based on current selection
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${category}`));
            categoriesListDiv.appendChild(label);
        });
    }

    function loadSelectedCategories() {
        const storedCategories = localStorage.getItem('selectedFoodCategories');
        if (storedCategories) {
            // Ensure allCategories is populated before trying to use stored ones
            // This is important for validating stored categories against available ones
            if (allCategories.size > 0) {
                const parsedCategories = JSON.parse(storedCategories);
                // Filter stored categories to only include those that actually exist in allCategories
                selectedCategories = new Set(parsedCategories.filter(cat => allCategories.has(cat)));
                // If after filtering, selectedCategories is empty, and we have categories, re-select all
                if (selectedCategories.size === 0 && allCategories.size > 0) {
                    selectedCategories = new Set(allCategories); // Default to all if stored selection is invalid/empty
                }
            } else {
                 // If allCategories isn't populated yet, we'll handle this after food load
            }
        } else if (allCategories.size > 0) {
            selectedCategories = new Set(allCategories); // Default to all if nothing in localStorage
        }
    }
    
    function updateSpinableItemsAndWheelText() {
        if (allFoodItems.length === 0) {
            foodLoadedSuccessfully = false;
            itemDisplay.textContent = "Laden..."; // Or "Geen gerechten"
            foodWheel.classList.add('disabled');
            return;
        }

        spinableItems = allFoodItems.filter(item => selectedCategories.has(item.category));

        if (spinableItems.length === 0) {
            itemDisplay.textContent = "Kies categorieën!";
            foodWheel.classList.add('disabled');
            foodLoadedSuccessfully = false; // Or a different flag for "spinable"
        } else {
            itemDisplay.textContent = "Klik om te draaien!";
            foodWheel.classList.remove('disabled');
            foodLoadedSuccessfully = true;
        }
    }


    async function loadFoodItems() {
        itemDisplay.textContent = "Laden...";
        try {
            const response = await fetch('food.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allFoodItems = await response.json();

            // Extract all unique categories
            allFoodItems.forEach(item => {
                if (item.category) {
                    allCategories.add(item.category);
                }
            });
            
            loadSelectedCategories(); // Load user preferences or default to all

            // If after attempting to load, selectedCategories is still empty but allCategories is not, default to all
            if (selectedCategories.size === 0 && allCategories.size > 0) {
                selectedCategories = new Set(allCategories);
                 localStorage.setItem('selectedFoodCategories', JSON.stringify(Array.from(selectedCategories))); // Save this default
            }

            updateSpinableItemsAndWheelText(); // Initial update

        } catch (error) {
            console.error("Could not load food items:", error);
            itemDisplay.textContent = "Fout bij laden!";
            foodWheel.classList.add('disabled');
            foodLoadedSuccessfully = false;
        }
    }

    function spin() {
        if (isSpinning || spinableItems.length === 0) {
            // Update text if trying to spin with no selectable items
            if (spinableItems.length === 0 && allFoodItems.length > 0) {
                 itemDisplay.textContent = "Kies categorieën!";
            }
            return;
        }
        isSpinning = true;
        foodWheel.classList.add('disabled');
        itemDisplay.classList.add('spinning');

        let spinDuration = 2000;
        let spinInterval = 100;
        let cycles = spinDuration / spinInterval;
        let currentCycle = 0;

        const spinEffect = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * spinableItems.length);
            const randomFood = spinableItems[randomIndex];
            let spinText = randomFood.name;
            const maxSpinLength = 28;
            if (spinText.length > maxSpinLength) {
                spinText = spinText.substring(0, maxSpinLength) + '...';
            }
            itemDisplay.textContent = spinText;
            currentCycle++;

            if (currentCycle >= cycles) {
                clearInterval(spinEffect);
                selectFinalItem();
            }
        }, spinInterval);
    }

    function selectFinalItem() {
        // Ensure spinableItems isn't empty (should be caught by spin() but good for safety)
        if (spinableItems.length === 0) {
            isSpinning = false;
            updateSpinableItemsAndWheelText();
            return;
        }

        const randomIndex = Math.floor(Math.random() * spinableItems.length);
        const selectedFood = spinableItems[randomIndex];

        itemDisplay.classList.remove('spinning');
        itemDisplay.style.opacity = 0;

        setTimeout(() => {
            itemDisplay.textContent = selectedFood.name;
            itemDisplay.style.opacity = 1;

            isSpinning = false;
            if (spinableItems.length > 0) { // Check spinableItems, not just foodLoadedSuccessfully
                foodWheel.classList.remove('disabled');
            } else {
                foodWheel.classList.add('disabled');
                itemDisplay.textContent = "Kies categorieën!";
            }
        }, 300);
    }

    foodWheel.addEventListener('click', spin);
    loadFoodItems(); // Initial load
});
