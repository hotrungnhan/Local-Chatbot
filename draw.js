const axios = require("axios");
const rateLimit = require("axios-rate-limit");
const http = rateLimit(axios.create(), { maxRPS: 100 })
const DRAW_CONFIG = {
}
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || "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"
async function Draw(propmt) {
    function reqDraw() {
        return http.post("https://api-inference.huggingface.co/models/prompthero/openjourney", { ...DRAW_CONFIG, inputs: propmt }, {
            headers: {
                Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,

            },
            responseType: 'stream'
        }).then(res => res.data)
    }
    const response = await reqDraw();
    return response
}
// Draw("girl with celebricate").then(data => {
//     console.log(data)
//     const write = fs.createWriteStream("image.png")
//     data.pipe(write);
//     return finished(write);
// })
module.exports = Draw
