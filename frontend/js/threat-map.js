
/**
 * FakeJobAI - Interactive Threat Map
 * Maps ACTUAL jobs scanned by the user in real-time.
 */

let map;
let markers = [];

// 1. Initialize Map (Empty at start)
function initMap() {
    // Default view: middle of Atlantic to show world
    map = L.map('threatMap').setView([30, 0], 2);

    // Dark Theme Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Initial message
    const popup = L.popup()
        .setLatLng([30, 0])
        .setContent('<div class="text-center p-2"><b>Ready to Track</b><br>Scan a job to see it here!</div>')
        .openOn(map);
}

// 2. Function to Add a Real Job Pin
// This will be called by dashboard.html when a result comes in
window.updateMapWithJob = async function (locationName, isFake, jobTitle) {
    if (!locationName || !map) return;

    try {
        // Geocoding: Convert City Name -> Lat/Lng (using OpenStreetMap Nominatim API)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            const color = isFake ? '#ef4444' : '#10b981'; // Red for fake, Green for real

            // Create Pulse Icon
            const icon = L.divIcon({
                className: 'custom-pin',
                html: `
                    <div style="
                        width: 15px;
                        height: 15px;
                        background: ${color};
                        border-radius: 50%;
                        box-shadow: 0 0 15px ${color};
                        border: 2px solid white;
                    "></div>
                `
            });

            // Add Marker
            const marker = L.marker([lat, lon], { icon: icon }).addTo(map);

            // Add Popup
            marker.bindPopup(`
                <div style="font-family: 'Outfit', sans-serif;">
                    <strong style="color: ${color}">${isFake ? '🚨 POUTENTIALLY FAKE' : '✅ VERIFIED REAL'}</strong><br>
                    <b>${jobTitle}</b><br>
                    <small>${locationName}</small>
                </div>
            `).openPopup();

            // Fly to location
            map.flyTo([lat, lon], 5, { duration: 2 });

            // Add to history
            markers.push(marker);
        }

    } catch (e) {
        console.error("Map Error:", e);
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', initMap);
