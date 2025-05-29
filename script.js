document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spinButton');
    const itemDisplay = document.querySelector('.item-display');
    const foodImageDisplay = document.getElementById('foodImage');
    const selectedFoodNameDisplay = document.getElementById('selectedFoodName');
    let foodItems = [];
    let isSpinning = false;

    // 1. Load food items from JSON
    async function loadFoodItems() {
        try {
            const response = await fetch('food.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            foodItems = await response.json();
            if (foodItems.length === 0) {
                itemDisplay.textContent = "No food loaded!";
                spinButton.disabled = true;
            } else {
                itemDisplay.textContent = "¿Qué Tapa Toca Hoy?"; // Initial text
            }
        } catch (error) {
            console.error("Could not load food items:", error);
            itemDisplay.textContent = "Error loading food!";
            spinButton.disabled = true;
        }
    }

    // 2. Spin function
    function spin() {
        if (isSpinning || foodItems.length === 0) {
            return;
        }
        isSpinning = true;
        spinButton.disabled = true;
        itemDisplay.classList.add('spinning');
        selectedFoodNameDisplay.textContent = ""; // Clear previous selection name
        foodImageDisplay.style.display = 'none'; // Hide previous image


        let spinDuration = 2000; // Total spin time in milliseconds (e.g., 2 seconds)
        let spinInterval = 100; // How often to change the displayed item during spin (ms)
        let cycles = spinDuration / spinInterval;
        let currentCycle = 0;

        const spinEffect = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * foodItems.length);
            const randomFood = foodItems[randomIndex];
            itemDisplay.textContent = randomFood.name.substring(0, 15) + (randomFood.name.length > 15 ? '...' : ''); // Show part of the name
            currentCycle++;

            if (currentCycle >= cycles) {
                clearInterval(spinEffect);
                selectFinalItem();
            }
        }, spinInterval);
    }

    // 3. Select the final item
    function selectFinalItem() {
        const randomIndex = Math.floor(Math.random() * foodItems.length);
        const selectedFood = foodItems[randomIndex];

        // Inside selectFinalItem function, after getting selectedFood:
        itemDisplay.textContent = selectedFood.name;
        selectedFoodNameDisplay.textContent = `¡A pedir: ${selectedFood.name} (${selectedFood.category})!`;


        itemDisplay.classList.remove('spinning');
        itemDisplay.style.opacity = 0; // Fade out old text

        setTimeout(() => {
            itemDisplay.textContent = selectedFood.name;
            itemDisplay.style.opacity = 1; // Fade in new text

            selectedFoodNameDisplay.textContent = `¡A pedir: ${selectedFood.name}!`;

            if (selectedFood.image) {
                foodImageDisplay.src = selectedFood.image;
                foodImageDisplay.alt = selectedFood.name;
                foodImageDisplay.style.display = 'block';
            } else {
                foodImageDisplay.style.display = 'none';
            }

            isSpinning = false;
            spinButton.disabled = false;
        }, 300); // Short delay for text transition
    }

    // Event Listener for the spin button
    spinButton.addEventListener('click', spin);

    // Initial load of food items
    loadFoodItems();
});

