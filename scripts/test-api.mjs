
async function check() {
    try {
        const res = await fetch('http://localhost:3000/api/projects');
        const data = await res.json();
        console.log('Count:', data.length);
        if (data.length > 0) {
            console.log('Tech:', data[0].tech);
            console.log('Type:', typeof data[0].tech);
            console.log('IsArray:', Array.isArray(data[0].tech));
        }
    } catch (e) {
        console.error(e);
    }
}

check();
