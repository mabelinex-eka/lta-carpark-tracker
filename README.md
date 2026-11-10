# SG CarPark Real-Time Tracker

A modern, responsive Singapore Carpark Availability Tracker built with React, TypeScript, Tailwind CSS, and Leaflet. Tracks real-time lot availability across HDB, URA, and Commercial carparks in Singapore.

## Features

- **Live Lot Tracking**: Real-time availability for Cars (Class C), Motorcycles (Class Y), and Heavy Vehicles (Class H).
- **Lot Delta Indicator**: Real-time delta changes showing when lots are freed up or taken.
- **Interactive Singapore Map**: Leaflet dark mode map centered on Singapore (`1.3521, 103.8198`) with custom SVG lot badges and quick-nav popups.
- **Parking Fee Estimator**: Calculates estimated parking cost based on entry time, duration, and Singapore parking rate schemes (grace period, HDB Sunday free parking, night caps).
- **24-Hour Occupancy Forecast**: Visual bar chart showing daily peak vs. off-peak hours for every carpark.
- **Backend Integration Hub**: Built with an isolated connector layer ready to switch between:
  - Simulated real-time stream
  - Official Singapore Government API (`https://api.data.gov.sg/v1/transport/carpark-availability`)
  - Custom REST backend endpoint with ping testing & latency metrics
- **GPS Locate Me**: Calculates real-time distance in kilometers to each carpark.
- **Direct Navigation**: 1-click directions via Google Maps, OneMap Singapore, and Waze.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/mabelinex-eka/lta-carpark-tracker.git
cd lta-carpark-tracker

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## License

Apache-2.0
