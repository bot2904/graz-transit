const API_URL = 'https://fahrplan.oebb.at/bin/mgate.exe';

// Station LIDs for Graz Moserhofgasse and Graz Jakominiplatz
const STATIONS = {
    FROM: "A=1@O=Graz Moserhofgasse@X=15452062@Y=47059698@U=81@L=691044@B=1@p=1769678933@",
    TO: "A=1@O=Graz Jakominiplatz@X=15442101@Y=47067258@U=81@L=1360161@B=1@p=1769678933@"
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
    
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.getHours().toString().padStart(2, '0') + 
                 now.getMinutes().toString().padStart(2, '0') + '00';

    const payload = {
        "id": "1",
        "ver": "1.67",
        "lang": "deu",
        "auth": { "type": "AID", "aid": "OWDL4fE4ixNiPBBm" },
        "client": { "id": "OEBB", "type": "WEB", "name": "webapp", "l": "vs_webapp" },
        "formatted": false,
        "svcReqL": [{
            "req": {
                "depLocL": [{ "lid": STATIONS.FROM, "type": "S" }],
                "arrLocL": [{ "lid": STATIONS.TO, "type": "S" }],
                "jnyFltrL": [{ "type": "PROD", "mode": "INC", "value": "1023" }],
                "getPolyline": false,
                "getPasslist": true,
                "outDate": date,
                "outTime": time,
                "outFrwd": true,
                "numF": 6
            },
            "meth": "TripSearch"
        }]
    };

    try {
        // Direct calls to fahrplan.oebb.at from browser fail due to CORS.
        // In a production environment, you would use a backend proxy.
        // For this demo, we attempt the call, but fall back to mock data if it fails.
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => {
            console.warn("CORS blocked the request. Falling back to mock data for demonstration.");
            return { ok: false };
        });

        if (response.ok) {
            const data = await response.json();
            renderTrips(data);
        } else {
            showMockData();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showMockData();
    }
}

function showMockData() {
    UI.status.innerHTML = '⚠️ <b>CORS Blocked:</b> Direct API calls to ÖBB are restricted from browsers.<br>Showing demonstration data below.';
    UI.status.style.color = '#fbbf24';
    
    const mockData = {
        svcResL: [{
            res: {
                common: {
                    prodL: [
                        { name: "Tram 6", cls: 512 },
                        { name: "Bus 64", cls: 64 },
                        { name: "Tram 1", cls: 512 }
                    ]
                },
                outConL: [
                    {
                        date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                        dep: { dTimeS: "081500", dTimeR: "081700" },
                        secL: [{ type: "JNY", jny: { prodX: 0, dirTxt: "Smart City" } }]
                    },
                    {
                        date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                        dep: { dTimeS: "082200" },
                        secL: [{ type: "JNY", jny: { prodX: 1, dirTxt: "St. Leonhard" } }]
                    },
                    {
                        date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                        dep: { dTimeS: "083500", dTimeR: "083500" },
                        secL: [{ type: "JNY", jny: { prodX: 2, dirTxt: "Eggenberg" } }]
                    }
                ]
            }
        }]
    };

    // Adjust mock times to be in the future relative to now
    const now = new Date();
    mockData.svcResL[0].res.outConL.forEach((con, i) => {
        const future = new Date(now.getTime() + (i + 1) * 7 * 60000);
        con.dep.dTimeS = future.getHours().toString().padStart(2, '0') + 
                         future.getMinutes().toString().padStart(2, '0') + "00";
    });

    renderTrips(mockData);
}

function renderTrips(data) {
    const res = data.svcResL[0].res;
    if (!res.outConL) {
        UI.status.textContent = 'No connections found.';
        return;
    }

    const prods = res.common.prodL;
    UI.results.innerHTML = '';
    UI.status.style.display = 'none';

    res.outConL.forEach(con => {
        const depTime = formatTime(con.dep.dTimeS);
        const depDate = formatDate(con.date);
        const delay = con.dep.dTimeR ? calculateDelay(con.dep.dTimeS, con.dep.dTimeR) : null;
        
        // Get first leg product
        const firstLeg = con.secL.find(s => s.type === 'JNY');
        const prod = prods[firstLeg.jny.prodX];
        const lineName = prod.name.trim() || prod.addName || 'Line';
        const direction = firstLeg.jny.dirTxt;
        
        const diffMs = parseHafasTime(con.date, con.dep.dTimeS) - new Date();
        const diffMins = Math.floor(diffMs / 60000);

        const card = document.createElement('div');
        card.className = 'trip-card';
        
        let typeClass = 'bus';
        if (lineName.match(/^[0-9]+$/) || lineName.includes('Tram')) typeClass = 'tram';

        card.innerHTML = `
            <div class="time-info">
                <div class="time">${depTime}</div>
                <div class="delay ${delay > 0 ? 'late' : 'on-time'}">
                    ${delay === null ? '' : (delay > 0 ? `+${delay} min` : 'on time')}
                </div>
            </div>
            <div class="line-info">
                <div class="line-badge ${typeClass}">${lineName}</div>
                <div class="direction">to ${direction}</div>
            </div>
            <div class="countdown">
                <span class="minutes">${diffMins < 0 ? 'now' : diffMins}</span>
                <span class="min-label">min</span>
            </div>
        `;
        UI.results.appendChild(card);
    });

    UI.lastUpdate.textContent = new Date().toLocaleTimeString();
}

function formatTime(hafasTime) {
    return hafasTime.slice(0, 2) + ':' + hafasTime.slice(2, 4);
}

function formatDate(hafasDate) {
    return hafasDate.slice(6, 8) + '.' + hafasDate.slice(4, 6) + '.' + hafasDate.slice(0, 4);
}

function parseHafasTime(dateStr, timeStr) {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const hour = parseInt(timeStr.slice(0, 2));
    const min = parseInt(timeStr.slice(2, 4));
    return new Date(year, month, day, hour, min);
}

function calculateDelay(scheduled, real) {
    const sMin = parseInt(scheduled.slice(0, 2)) * 60 + parseInt(scheduled.slice(2, 4));
    const rMin = parseInt(real.slice(0, 2)) * 60 + parseInt(real.slice(2, 4));
    return rMin - sMin;
}

UI.refreshBtn.addEventListener('click', fetchConnections);

// Initial fetch
fetchConnections();

// Auto refresh every minute
setInterval(fetchConnections, 60000);
