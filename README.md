# Graz Transit: Moserhofgasse → Jakominiplatz

A simple, modern one-page application to check the next public transport connections from **Graz Moserhofgasse** to **Graz Jakominiplatz** using the ÖBB HAFAS API.

## Features
- 🕒 **Real-time Departures**: Shows the next available connections.
- ⏳ **Countdown**: Live countdown in minutes for each departure.
- 🚦 **Delay Info**: Displays real-time delay information when available.
- 📱 **Responsive Design**: Optimized for both mobile and desktop.
- 🔄 **Auto-refresh**: Updates the schedule every minute.

## Tech Stack
- **HTML5**: Semantic structure.
- **CSS3**: Modern layout with Flexbox and CSS Grid, custom properties for theming.
- **Vanilla JavaScript**: Fetching and processing HAFAS API data.
- **ÖBB HAFAS API**: The underlying data source for Austrian public transport.

## API & CORS
This application interacts with the **ÖBB HAFAS** data via a RESTful proxy at `https://oebb.macistry.com/api`.

> [!NOTE]
> Unlike the direct ÖBB endpoint, this REST proxy supports **CORS**, allowing the application to fetch live transit data directly from your browser. A mock data fallback is still included as a safety measure.

## Setup
1. Clone the repository.
2. Open `index.html` in your browser.
3. (Optional) Use a CORS-disabling extension or a local proxy for live data.

## Credits
- Data provided by [ÖBB Scotty](https://fahrplan.oebb.at).
- Design inspired by modern transit signage.
