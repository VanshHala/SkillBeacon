import axios from 'axios';

async function testGemini() {
    try {
        const apiKey = "";
        const model = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("SUCCESS:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("ERROR:", e.response ? e.response.status : e.message);
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        }
    }
}
testGemini();
