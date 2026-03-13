const { extractPanData } = require('./services/panExtractionService');

const sampleOcrText = `
INCOME TAX DEPARTMENT
GOVT. OF INDIA
MANISH DAS
RAJESH DAS
25/08/1990
Permanent Account Number Card
ABCDE1234F
`;

console.log("Testing PAN Extraction Service...");
const extracted = extractPanData(sampleOcrText);

console.log(JSON.stringify(extracted, null, 2));

const expected = {
  name: "Manish Das",
  fatherName: "Rajesh Das",
  dateOfBirth: "25/08/1990",
  panNumber: "ABCDE1234F"
};

let success = true;
for (const key in expected) {
  if (extracted[key] !== expected[key]) {
    console.error(`Mismatch for ${key}: expected "${expected[key]}", got "${extracted[key]}"`);
    success = false;
  }
}

if (success) {
  console.log("\n✅ Test Passed!");
} else {
  console.log("\n❌ Test Failed!");
  process.exit(1);
}
