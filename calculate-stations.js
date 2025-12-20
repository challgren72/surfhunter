
const SPOTS = [
    { id: 1, name: "Torö Stenstrand", lat: 58.82, lng: 17.84 },
    { id: 2, name: "Apelviken", lat: 57.08, lng: 12.24 },
    { id: 3, name: "Kåseberga", lat: 55.38, lng: 14.06 },
    { id: 4, name: "Mölle", lat: 56.28, lng: 12.49 },
    { id: 5, name: "Salusand", lat: 63.49, lng: 19.26 },
    { id: 6, name: "Knäbäckshusen", lat: 55.59, lng: 14.28 },
    { id: 7, name: "Böda Sand", lat: 57.27, lng: 17.05 },
    { id: 8, name: "Tylösand", lat: 56.64, lng: 12.73 },
    { id: 9, name: "Ekeviken", lat: 57.96, lng: 19.23 },
    { id: 10, name: "Smitingen", lat: 62.61, lng: 17.96 },
    { id: 11, name: "Skrea Strand", lat: 56.88, lng: 12.50 },
    { id: 12, name: "Träslövsläge", lat: 57.06, lng: 12.27 },
];

import { METOBS_STATIONS, OCOBS_STATIONS } from './src/data/smhi-stations.js';

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function findNearest(spot, stations) {
    let minDist = Infinity;
    let nearest = null;
    for (const station of stations) {
        const dist = getDistance(spot.lat, spot.lng, station.lat, station.lng);
        if (dist < minDist) {
            minDist = dist;
            nearest = station;
        }
    }
    return nearest;
}

console.log("export const SPOT_STATION_DEFAULTS = {");
SPOTS.forEach(spot => {
    const wind = findNearest(spot, METOBS_STATIONS);
    const wave = findNearest(spot, OCOBS_STATIONS);
    console.log(`  ${spot.id}: { // ${spot.name}`);
    console.log(`    wind: '${wind.id}', // ${wind.name} (${Math.round(getDistance(spot.lat, spot.lng, wind.lat, wind.lng))} km)`);
    console.log(`    wave: '${wave.id}'  // ${wave.name} (${Math.round(getDistance(spot.lat, spot.lng, wave.lat, wave.lng))} km)`);
    console.log(`  },`);
});
console.log("};");
