const http = require('http');

const testData = JSON.stringify({
    name: "John Doe",
    dob: "01/01/1990",
    aadhaarNumber: "123456789012",
    panNumber: "ABCDE1234F",
    address: "123 Main St, New Delhi, India"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/autofill/aadhaar',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: \${res.statusCode}`);
    
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: \${chunk}`);
    });
    
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: \${e.message}`);
});

// Write data to request body
req.write(testData);
req.end();
