require('dotenv').config();
const { generateRoadmap } = require('./services/geminiService');

async function test() {
    try {
        const roadmap = await generateRoadmap({ name: "Test User" }, { movedCity: true });
        console.log("Success:", JSON.stringify(roadmap, null, 2));
    } catch(err) {
        console.error("Error generating roadmap:", err);
    }
}
test();
