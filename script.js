document.addEventListener('DOMContentLoaded', () => {
    const foodWheel = document.getElementById('foodWheel');
    const itemDisplay = foodWheel.querySelector('.item-display');
    const animationContainer = document.getElementById('animationContainer'); // Get the new container
    const backgroundMusic = document.getElementById('backgroundMusic'); // Get the audio element

    // Settings Gear and Modal elements
    const settingsGear = document.getElementById('settingsGear');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModalButton = document.getElementById('closeSettingsModal');
    const categoriesListDiv = document.getElementById('categoriesList');
    const saveSettingsButton = document.getElementById('saveSettingsButton');

    const tacoAnimations = ['fallAndRotate', 'fallAndDrift', 'simpleFall'];


    let allFoodItems = []; // All items from JSON
    let spinableItems = []; // Filtered items based on selected categories
    let allCategories = new Set(); // To store unique categories
    let selectedCategories = new Set(); // To store user-selected categories

    let isSpinning = false;
    let foodLoadedSuccessfully = false;

    let musicAttemptedPlay = false;
    let musicPlaying = false;

    // Set a default volume (0.0 to 1.0)
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3; // Adjust as desired (e.g., 30% volume)
    }

    function playBackgroundMusic() {
        if (!backgroundMusic || musicPlaying) {
            return;
        }

        // Try to play the music
        backgroundMusic.play().then(() => {
            console.log("Background music started successfully.");
            musicPlaying = true;
            // Remove interaction listeners once music has started
            document.removeEventListener('click', playMusicOnFirstInteraction, true);
            document.removeEventListener('touchstart', playMusicOnFirstInteraction, true);
            document.removeEventListener('keydown', playMusicOnFirstInteraction, true);
        }).catch(error => {
            console.warn("Background music autoplay prevented:", error.name, error.message);
            // If autoplay is prevented, musicAttemptedPlay ensures we only attach listeners once.
            if (!musicAttemptedPlay) {
                // Add listeners for the first user interaction to try playing again
                console.log("Setting up listeners to play music on first user interaction.");
                document.addEventListener('click', playMusicOnFirstInteraction, { capture: true, once: true });
                document.addEventListener('touchstart', playMusicOnFirstInteraction, { capture: true, once: true });
                document.addEventListener('keydown', playMusicOnFirstInteraction, { capture: true, once: true });
            }
        });
        musicAttemptedPlay = true;
    }

    // This specific handler will be used for the 'once' listeners
    function playMusicOnFirstInteraction() {
        console.log("User interaction detected, attempting to play music.");
        playBackgroundMusic(); // Try to play again
    }

function createFallingTaco() {
        if (!animationContainer) return; // Safety check

        const taco = document.createElement('div');
        taco.classList.add('falling-taco');

        // Random horizontal start position
        taco.style.left = `${Math.random() * 90}vw`; // Random position across viewport width (0-90%)

        // Random animation style
        const randomAnimation = tacoAnimations[Math.floor(Math.random() * tacoAnimations.length)];
        taco.style.animationName = randomAnimation;

        // Random animation duration (e.g., 2 to 5 seconds)
        const randomDuration = Math.random() * 3 + 2;
        taco.style.animationDuration = `${randomDuration}s`;
        
        taco.style.animationTimingFunction = 'linear'; // Consistent fall speed
        taco.style.animationFillMode = 'forwards'; // Keep final state (though it falls off screen)

        animationContainer.appendChild(taco);

        // Remove taco after animation (plus a small buffer)
        taco.addEventListener('animationend', () => {
            taco.remove();
        });

        // Fallback removal in case animationend event doesn't fire (e.g., element removed early)
        setTimeout(() => {
            if (taco.parentElement) {
                taco.remove();
            }
        }, (randomDuration * 1000) + 500); // duration in ms + buffer
    }

    function triggerTacoRain(numberOfTacos = 12) {
        for (let i = 0; i < numberOfTacos; i++) {
            setTimeout(() => {
                createFallingTaco();
            }, i * 100); // Stagger the creation of tacos for a nicer effect
        }
    }

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
        if (spinableItems.length === 0) {
            isSpinning = false;
            updateSpinableItemsAndWheelText(); // This function should exist from previous step
            return;
        }

        const randomIndex = Math.floor(Math.random() * spinableItems.length);
        const selectedFood = spinableItems[randomIndex];

        itemDisplay.classList.remove('spinning');
        itemDisplay.style.opacity = 0;

        setTimeout(() => {
            itemDisplay.textContent = selectedFood.name;
            itemDisplay.style.opacity = 1;

            // --- TRIGGER TACO RAIN HERE! ---
            triggerTacoRain(); 
            // ---------------------------------

            isSpinning = false;
            if (spinableItems.length > 0) {
                foodWheel.classList.remove('disabled');
            } else {
                foodWheel.classList.add('disabled');
                itemDisplay.textContent = "Kies categorieën!";
            }
        }, 300);
    }

    foodWheel.addEventListener('click', spin);
    loadFoodItems(); // Initial load



    // Call to load items and potentially start music
    loadFoodItems().then(() => {
        // Attempt to play music after everything else is potentially set up.
        // The user interaction listeners will handle it if autoplay is blocked.
        playBackgroundMusic();
    });

    // Make sure event listeners for main interactive elements also try to play music if it hasn't started
    // This is a fallback in case the general 'once' listeners on document don't cover all initial interactions desired.
    if (foodWheel) {
        foodWheel.addEventListener('click', () => {
            if (!musicPlaying && backgroundMusic && backgroundMusic.paused) {
                playBackgroundMusic();
            }
        }, true);
    }
    if (settingsGear) {
        settingsGear.addEventListener('click', () => {
            if (!musicPlaying && backgroundMusic && backgroundMusic.paused) {
                playBackgroundMusic();
            }
        }, true);
    }
});