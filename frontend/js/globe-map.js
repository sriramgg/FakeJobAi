// 3D Globe Visualization for Next Level Dashboard
// Uses globe.gl

let world;

function initGlobe() {
    const mapContainer = document.getElementById('threatMap');
    if (!mapContainer) return;

    // Clear previous
    mapContainer.innerHTML = '';

    const arcs = generateRandomArcs(5);

    world = Globe()
        (mapContainer)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .arcsData(arcs)
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(4)
        .arcDashInitialGap(() => Math.random() * 5)
        .arcDashAnimateTime(2000)
        .labelsData([])
        .labelSize(1.5)
        .labelDotRadius(0.5)
        .labelColor('color')
        .labelText('text')
        .labelResolution(2)
        .ringsData([])
        .ringColor(() => user => 'rgba(255,100,0,0.5)')
        .ringMaxRadius('maxR')
        .ringPropagationSpeed('propagationSpeed')
        .ringRepeatPeriod('repeatPeriod');

    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.8;

    // Fit to container
    setTimeout(() => {
        world.width(mapContainer.clientWidth);
        world.height(mapContainer.clientHeight);
    }, 100);

    // Responsive resize
    window.addEventListener('resize', () => {
        world.width(mapContainer.clientWidth);
        world.height(mapContainer.clientHeight);
    });
}

function generateRandomArcs(N) {
    return [...Array(N).keys()].map(() => ({
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: [['red', 'white', 'purple', 'cyan'][Math.round(Math.random() * 3)], ['red', 'white', 'purple', 'cyan'][Math.round(Math.random() * 3)]]
    }));
}

// Global hook to update map (Matches old Leaflet interface)
window.updateMapWithJob = async function (locationStr, isFake, title) {
    if (!world) return;

    let lat, lng;

    try {
        if (!locationStr || locationStr === "Unknown") throw new Error("No loc");

        // Use OpenStreetMap Nominatim API (Free, rate-limited)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}`);
        const data = await res.json();

        if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
        } else {
            throw new Error("Geocode failed");
        }
    } catch (e) {
        // Fallback to random if geocoding fails or limits hit
        lat = (Math.random() * 140) - 70;
        lng = (Math.random() * 360) - 180;
    }

    const color = isFake ? '#ff3333' : '#33ff33';

    // Add Label
    const newLabel = { lat, lng, text: isFake ? "⚠ " + title.substring(0, 15) : "✅ " + title.substring(0, 15), color, size: 1.5 };

    // Update data
    const currentLabels = world.labelsData();
    world.labelsData([...currentLabels, newLabel]);

    // Fly to it
    world.pointOfView({ lat, lng, altitude: 1.5 }, 2000);
    world.controls().autoRotate = false; // Stop rotating to focus

    // Add ringing effect
    const rings = world.ringsData();
    const newRing = { lat, lng, maxR: 15, propagationSpeed: 5, repeatPeriod: 500, color: isFake ? 'red' : 'green' };
    world.ringsData([...rings, newRing]);

    // Re-enable rotation after a bit
    setTimeout(() => { world.controls().autoRotate = true; }, 5000);

    // Remove data after 15s to keep clean
    setTimeout(() => {
        world.labelsData(world.labelsData().filter(l => l !== newLabel));
        world.ringsData(world.ringsData().filter(r => r !== newRing));
    }, 15000);

    // Update Live Count UI
    const countEl = document.getElementById('liveThreatCount');
    if (countEl) countEl.innerText = (parseInt(countEl.innerText.replace(/,/g, '')) + 1).toLocaleString();
}

// Init on load
document.addEventListener('DOMContentLoaded', initGlobe);
