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
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        renderTrips(data);
    } catch (error) {
        console.error('Fetch error:', error);
        UI.status.innerHTML = `
            <div class="error-container">
                <p>⚠️ <b>Unable to load live data</b></p>
                <p class="error-detail">${error.message}</p>
                <p>Please check your connection or try again later.</p>
            </div>
        `;
        UI.results.innerHTML = '';
    }
}

function renderTrips(data) {
    if (!data.journeys || data.journeys.length === 0) {
        UI.status.textContent = 'No connections found.';
        return;
    }

    UI.results.innerHTML = '';
    UI.status.style.display = 'none';

    const transportJourneys = data.journeys.filter(journey => 
        journey.legs && journey.legs.some(leg => !leg.walking)
    );

    if (transportJourneys.length === 0) {
        UI.status.textContent = 'No transport connections found.';
        return;
    }

    transportJourneys.forEach(journey => {
        // Find the first non-walking leg to display its info
        const firstLeg = journey.legs.find(leg => !leg.walking);
        if (!firstLeg) return;
        
        const lastLeg = journey.legs[journey.legs.length - 1];
        
        const depTime = new Date(firstLeg.departure);
        const plannedDep = new Date(firstLeg.plannedDeparture);
        const delay = Math.round((depTime - plannedDep) / 60000);
        
        const lineName = firstLeg.line ? firstLeg.line.name : 'Trip';
        const direction = firstLeg.direction || lastLeg.destination.name;
        
        const diffMs = depTime - new Date();
        const diffMins = Math.floor(diffMs / 60000);

        const card = document.createElement('div');
        card.className = 'trip-card';
        
        let typeClass = 'bus';
        if (lineName.includes('Tram') || (firstLeg.line && firstLeg.line.product === 'tram')) typeClass = 'tram';

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
