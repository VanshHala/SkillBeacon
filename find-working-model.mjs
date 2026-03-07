import axios from 'axios';

async function testGemini(modelName) {
    try {
        const apiKey = "AIzaSyBOgrZTN7k_fNaThwkWYj4VIT3OgBVDEtE";
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log(`[${modelName}] SUCCESS`);
    } catch (e) {
        console.error(`[${modelName}] ERROR:`, e.response?.status, typeof e.response?.data === 'object' ? e.response?.data?.error?.message : '');
    }
}
async function run() {
    await testGemini("models/gemini-2.5-flash");
    await testGemini("models/gemini-flash-latest");
}
run();
