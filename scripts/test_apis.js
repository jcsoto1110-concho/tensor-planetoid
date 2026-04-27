const fetch = require('node-fetch');

async function testApi() {
    const urls = [
        'http://localhost:3000/api/employees',
        'http://localhost:3000/api/documents',
        'http://localhost:3000/api/audit'
    ];
    
    for (const url of urls) {
        try {
            console.log(`Testing ${url}...`);
            const res = await fetch(url);
            const data = await res.json();
            console.log(`Status: ${res.status}`);
            console.log(`Success: ${data.success}`);
            if (data.data) {
                console.log(`Count: ${data.data.length}`);
                if (data.data.length > 0) {
                    console.log('Sample Data Key Names:', Object.keys(data.data[0]));
                }
            } else {
                console.log('No data field found');
            }
        } catch (e) {
            console.error(`Error testing ${url}:`, e.message);
        }
        console.log('---');
    }
}

testApi();
