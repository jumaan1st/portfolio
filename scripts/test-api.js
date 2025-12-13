
const fetch = require('node-fetch');

async function check() {
    const res = await fetch('http://localhost:3000/api/projects');
    const data = await res.json();
    console.log('Count:', data.length);
    if (data.length > 0) {
        console.log('First Item Keys:', Object.keys(data[0]));
        console.log('Tech type:', typeof data[0].tech, Array.isArray(data[0].tech));
        console.log('Features type:', typeof data[0].features, Array.isArray(data[0].features));
        console.log('Tech value:', data[0].tech);
        console.log('Features value:', data[0].features);
    }
}

check().catch(console.error);
