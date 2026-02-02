const API_URL = 'https://oebb.macistry.com/api/journeys';
const STATIONS = {
    FROM: "691044", // Graz Moserhofgasse
    TO: "1360161"   // Graz Jakominiplatz
};

const UI = {
    status: document.getElementById('status'),
    results: document.getElementById('results'),
    lastUpdate: document.getElementById('last-update'),
    refreshBtn: document.getElementById('refresh-btn')
};

async function fetchConnections() {
    UI.status.textContent = 'Updating schedule...';
    UI.status.style.display = 'block';
    
    const url = `${API_URL}?from=${STATIONS.FROM}&to=${STATIONS.TO}&results=6`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        renderTrips(data);
    } catch (error) {
        console.error('Fetch error:', error);
        UI.status.textContent = 'Failed to fetch live data. Using fallback.';
        showMockData();
    }
}

function showMockData() {
    UI.status.innerHTML = '⚠️ <b>CORS Issue or API Offline:</b> Using demonstration data.';
    UI.status.style.color = '#fbbf24';
    
    const now = new Date();
    const mockData = {
        journeys: [
            {
                legs: [{
                    departure: new Date(now.getTime() + 7 * 60000).toISOString(),
                    plannedDeparture: new Date(now.getTime() + 5 * 60000).toISOString(),
                    line: { name: "Tram 6", product: "tram" },
                    direction: "Smart City"
                }]
            },
            {
                legs: [{
                    departure: new Date(now.getTime() + 15 * 60000).toISOString(),
                    plannedDeparture: new Date(now.getTime() + 15 * 60000).toISOString(),
                    line: { name: "Bus 64", product: "bus" },
                    direction: "St. Leonhard"
                }]
            },
            {
                legs: [{
                    departure: new Date(now.getTime() + 25 * 60000).toISOString(),
                    plannedDeparture: new Date(now.getTime() + 25 * 60000).toISOString(),
                    line: { name: "Tram 1", product: "tram" },
                    direction: "Eggenberg"
                }]
            }
        ]
    };

    renderTrips(mockData);
}

function renderTrips(data) {
    if (!data.journeys || data.journeys.length === 0) {
        UI.status.textContent = 'No connections found.';
        return;
    }

    UI.results.innerHTML = '';
    UI.status.style.display = 'none';

    data.journeys.forEach(journey => {
        const firstLeg = journey.legs[0];
        const lastLeg = journey.legs[journey.legs.length - 1];
        
        const depTime = new Date(firstLeg.departure);
        const plannedDep = new Date(firstLeg.plannedDeparture);
        const delay = Math.round((depTime - plannedDep) / 60000);
        
        const lineName = firstLeg.line ? firstLeg.line.name : (firstLeg.walking ? 'Walk' : 'Trip');
        const direction = firstLeg.direction || lastLeg.destination.name;
        
        const diffMs = depTime - new Date();
        const diffMins = Math.floor(diffMs / 60000);

        const card = document.createElement('div');
        card.className = 'trip-card';
        
        let typeClass = 'bus';
        if (lineName.includes('Tram') || (firstLeg.line && firstLeg.line.product === 'tram')) typeClass = 'tram';
        if (firstLeg.walking) typeClass = 'walk';

        card.innerHTML = `
            <div class="time-info">
                <div class="time">${depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div class="delay ${delay > 0 ? 'late' : 'on-time'}">
                    ${isNaN(delay) ? '' : (delay > 0 ? `+${delay} min` : 'on time')}
                </div>
            </div>
            <div class="line-info">
                <div class="line-badge ${typeClass}">${lineName}</div>
                <div class="direction">to ${direction}</div>
            </div>
            <div class="countdown">
                <span class="minutes">${diffMins <= 0 ? 'now' : diffMins}</span>
                <span class="min-label">min</span>
            </div>
        `;
        UI.results.appendChild(card);
    });

    UI.lastUpdate.textContent = new Date().toLocaleTimeString();
}

UI.refreshBtn.addEventListener('click', fetchConnections);

// Initial fetch
fetchConnections();

// Auto refresh every minute
setInterval(fetchConnections, 60000);
