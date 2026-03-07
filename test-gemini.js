const axios = require('axios');
async function testGemini() {
    try {
        const apiKey = "AIzaSyBOgrZTN7k_fNaThwkWYj4VIT3OgBVDEtE";
        const model = "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("SUCCESS:", response.data);
    } catch (e) {
        console.error("ERROR:");
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
testGemini();
