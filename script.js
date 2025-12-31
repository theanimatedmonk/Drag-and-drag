// Icons data - Replace image paths with your actual icon images
const iconsData = [
    { id: 1, name: 'Chrome', image: 'icons/chrome.svg' },
    { id: 2, name: 'Gemini', image: 'icons/gemini.svg' },
    { id: 3, name: 'Instagram', image: 'icons/instagram.svg' },
    { id: 4, name: 'LinkedIn', image: 'icons/linkedin.svg' },
    { id: 5, name: 'Maps', image: 'icons/maps.svg' },
    { id: 6, name: 'Mastodon', image: 'icons/mastodon.svg' },
    { id: 7, name: 'Meet', image: 'icons/meet.svg' },
    { id: 8, name: 'Msn', image: 'icons/msn.svg' },
    { id: 9, name: 'Onedrive', image: 'icons/onedrive.svg' },
    { id: 10, name: 'Photos', image: 'icons/photos.svg' },
    { id: 11, name: 'Sound', image: 'icons/sound.svg' },
    { id: 12, name: 'Teams', image: 'icons/teams.svg' },
    { id: 13, name: 'Video', image: 'icons/video.svg' },
    { id: 14, name: 'Wallet', image: 'icons/wallet.svg' },
    { id: 15, name: 'Whatsapp', image: 'icons/whatsapp.svg' },
    { id: 16, name: 'X', image: 'icons/x.svg' },
    { id: 17, name: 'Xbox', image: 'icons/xbox.svg' },
    { id: 18, name: 'Youtube', image: 'icons/youtube.svg' },
];

// Grid configuration
const TOTAL_SLOTS = 20;
const COLUMNS = 4;
const ROWS = 5;

// Grid state
let grid = [];
let dotsOverlay = null;

// ============== SOUND EFFECTS ==============

// Sound configuration - replace with your own sound files
const SOUNDS = {
    swap: 'sounds/swap.mp3',    // Sound X: when slots swap positions
    drop: 'sounds/drop.mp3'     // Sound Y: when icon is finally placed
};

// Audio context for generating sounds (fallback if no sound files)
let audioContext = null;

// Preloaded audio elements
let swapSound = null;
let dropSound = null;

// Initialize sounds
function initSounds() {
    // Try to load sound files
    swapSound = new Audio(SOUNDS.swap);
    dropSound = new Audio(SOUNDS.drop);
    
    // Preload
    swapSound.load();
    dropSound.load();
    
    // Set volumes
    swapSound.volume = 0.3;
    dropSound.volume = 0.5;
    
    // Initialize Web Audio API as fallback
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

// Play swap sound (Sound X) - short tick/pop sound
function playSwapSound() {
    // Try to play the audio file first
    if (swapSound && swapSound.readyState >= 2) {
        swapSound.currentTime = 0;
        swapSound.play().catch(() => {});
        return;
    }
    
    // Fallback: generate a short tick sound
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialDecayTo = 0.01;
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

// Play drop sound (Sound Y) - satisfying placement sound
function playDropSound() {
    // Try to play the audio file first
    if (dropSound && dropSound.readyState >= 2) {
        dropSound.currentTime = 0;
        dropSound.play().catch(() => {});
        return;
    }
    
    // Fallback: generate a drop/thud sound
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

// ============== END SOUND EFFECTS ==============

// Initialize grid with icons in first slots, rest empty
function initGrid() {
    grid = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        grid[i] = iconsData[i] || null;
    }
}

// Get grid container
const gridContainer = document.getElementById('gridContainer');

// Create fixed dots overlay
function createDotsOverlay() {
    dotsOverlay = document.createElement('div');
    dotsOverlay.className = 'dots-overlay';
    dotsOverlay.id = 'dotsOverlay';
    gridContainer.appendChild(dotsOverlay);
}

// Calculate and position dots based on current grid layout
function positionDots() {
    if (!dotsOverlay) return;
    
    // Clear existing dots
    dotsOverlay.innerHTML = '';
    
    // Get all slots to calculate positions
    const slots = gridContainer.querySelectorAll('.icon-slot');
    if (slots.length < 5) return;
    
    // Get the container's bounding rect
    const containerRect = gridContainer.getBoundingClientRect();
    
    // Create dots at intersection points (between slots)
    for (let row = 0; row < ROWS - 1; row++) {
        for (let col = 0; col < COLUMNS - 1; col++) {
            // Get the 4 slots around this intersection
            const topLeftIndex = row * COLUMNS + col;
            const topRightIndex = topLeftIndex + 1;
            const bottomLeftIndex = topLeftIndex + COLUMNS;
            
            const topLeftSlot = slots[topLeftIndex];
            const topRightSlot = slots[topRightIndex];
            const bottomLeftSlot = slots[bottomLeftIndex];
            
            if (!topLeftSlot || !topRightSlot || !bottomLeftSlot) continue;
            
            const topLeftRect = topLeftSlot.getBoundingClientRect();
            const topRightRect = topRightSlot.getBoundingClientRect();
            const bottomLeftRect = bottomLeftSlot.getBoundingClientRect();
            
            // Calculate center point of the intersection
            const x = (topLeftRect.right + topRightRect.left) / 2 - containerRect.left;
            const y = (topLeftRect.bottom + bottomLeftRect.top) / 2 - containerRect.top;
            
            // Create dot
            const dot = document.createElement('div');
            dot.className = 'indicator-dot';
            dot.style.left = `${x - 2}px`;
            dot.style.top = `${y - 2}px`;
            dotsOverlay.appendChild(dot);
        }
    }
}

// Show dots overlay
function showDots() {
    positionDots();
    if (dotsOverlay) {
        dotsOverlay.classList.add('visible');
    }
}

// Hide dots overlay
function hideDots() {
    if (dotsOverlay) {
        dotsOverlay.classList.remove('visible');
    }
}

// Render all slots based on grid state
function renderGrid() {
    gridContainer.innerHTML = '';
    
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const icon = grid[i];
        const slot = createSlot(icon, i);
        gridContainer.appendChild(slot);
    }
    
    // Create the dots overlay (fixed, doesn't move with items)
    createDotsOverlay();
}

// Create a slot element (with icon or empty)
function createSlot(icon, index) {
    const slot = document.createElement('div');
    slot.className = icon ? 'icon-slot' : 'icon-slot empty-slot';
    slot.dataset.index = index;
    
    if (icon) {
        slot.dataset.id = icon.id;
        slot.innerHTML = `
            <div class="icon-wrapper">
                <img src="${icon.image}" alt="${icon.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e8e8e8%22 width=%22100%22 height=%22100%22 rx=%2222%22/><text x=%2250%22 y=%2258%22 text-anchor=%22middle%22 font-size=%2236%22 font-family=%22-apple-system,system-ui,sans-serif%22 fill=%22%23888%22>${icon.name.charAt(0)}</text></svg>'">
            </div>
            <span class="icon-name">${icon.name}</span>
        `;
    } else {
        slot.dataset.id = 'empty';
        slot.innerHTML = `
            <div class="icon-wrapper empty-wrapper"></div>
        `;
    }
    
    return slot;
}

// Read current DOM order and update grid state
function syncGridWithDOM() {
    const newGrid = [];
    
    gridContainer.querySelectorAll('.icon-slot').forEach((slot, index) => {
        const id = slot.dataset.id;
        if (id && id !== 'empty') {
            const icon = iconsData.find(i => i.id === parseInt(id));
            newGrid[index] = icon || null;
        } else {
            newGrid[index] = null;
        }
    });
    
    grid = newGrid;
    console.log('Grid updated:', grid.map((g, i) => g ? `${i}: ${g.name}` : `${i}: empty`));
}

// Initialize Sortable
function initSortable() {
    new Sortable(gridContainer, {
        animation: 200,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        swapThreshold: 0.65,
        
        // When drag starts - show indicator dots
        onStart: function(evt) {
            if (evt.item.classList.contains('empty-slot')) {
                return false;
            }
            showDots();
        },
        
        // When items swap/change position during drag
        onChange: function(evt) {
            playSwapSound();
        },
        
        // When drag ends - hide dots, play drop sound, sync state
        onEnd: function(evt) {
            hideDots();
            playDropSound();
            syncGridWithDOM();
        }
    });
}

// Initialize
initGrid();
initSounds();
renderGrid();
initSortable();

console.log('Drag & Drop initialized with SortableJS + Sound Effects');
