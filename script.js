document.addEventListener('DOMContentLoaded', () => {
    const foodWheel = document.getElementById('foodWheel'); // Get the wheel
    const itemDisplay = foodWheel.querySelector('.item-display'); // Get the text display area within the wheel
    const selectedFoodNameDisplay = document.getElementById('selectedFoodName');
    let foodItems = [];
    let isSpinning = false;
    let foodLoadedSuccessfully = false; // To track if food items are ready

    // Initial text set in HTML is "Laden..."

    async function loadFoodItems() {
        try {
            const response = await fetch('food.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            foodItems = await response.json();

            if (foodItems.length === 0) {
                itemDisplay.textContent = "Geen gerechten!"; // No food available
                foodWheel.classList.add('disabled'); // Optional: style to show it's not clickable
                foodLoadedSuccessfully = false;
            } else {
                itemDisplay.textContent = "Klik om te draaien!"; // Default text when ready
                foodLoadedSuccessfully = true;
                foodWheel.classList.remove('disabled');
            }
        } catch (error) {
            console.error("Could not load food items:", error);
            itemDisplay.textContent = "Fout bij laden!";
            foodWheel.classList.add('disabled');
            foodLoadedSuccessfully = false;
        }
    }

    function spin() {
        // Prevent spinning if already spinning, or if food hasn't loaded, or no food items
        if (isSpinning || !foodLoadedSuccessfully || foodItems.length === 0) {
            return;
        }
        isSpinning = true;
        foodWheel.classList.add('disabled'); // Disable clicking during spin
        itemDisplay.classList.add('spinning'); // Visual spinning effect for text
        selectedFoodNameDisplay.textContent = ""; // Clear previous selection name

        let spinDuration = 2000;
        let spinInterval = 100;
        let cycles = spinDuration / spinInterval;
        let currentCycle = 0;

        const spinEffect = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * foodItems.length);
            const randomFood = foodItems[randomIndex];
            // Truncate long names during spinning for better visual
            itemDisplay.textContent = randomFood.name.substring(0, 18) + (randomFood.name.length > 18 ? '...' : '');
            currentCycle++;

            if (currentCycle >= cycles) {
                clearInterval(spinEffect);
                selectFinalItem();
            }
        }, spinInterval);
    }

    function selectFinalItem() {
        const randomIndex = Math.floor(Math.random() * foodItems.length);
        const selectedFood = foodItems[randomIndex];

        itemDisplay.classList.remove('spinning');
        itemDisplay.style.opacity = 0; // Fade out old text

        setTimeout(() => {
            itemDisplay.textContent = selectedFood.name; // Display full name of selected item
            itemDisplay.style.opacity = 1; // Fade in new text

            if (selectedFood.category) {
                 selectedFoodNameDisplay.textContent = `¡A pedir: ${selectedFood.name} (${selectedFood.category})!`;
            } else {
                 selectedFoodNameDisplay.textContent = `¡A pedir: ${selectedFood.name}!`;
            }

            isSpinning = false;
            if (foodLoadedSuccessfully && foodItems.length > 0) {
                foodWheel.classList.remove('disabled'); // Re-enable clicking
                // After a spin, you might want to revert to "Klik om te draaien!" or keep the last result.
                // For now, it keeps the last result. If you want to revert:
                // setTimeout(() => { itemDisplay.textContent = "Klik om te draaien!"; }, 2000); // Example delay
            }
        }, 300); // Short delay for text transition
    }

    // Event Listener for the wheel
    foodWheel.addEventListener('click', spin);

    // Initial load of food items
    loadFoodItems();
});
