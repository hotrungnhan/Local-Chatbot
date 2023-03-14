const axios = require("axios");
const rateLimit = require("axios-rate-limit");
const http = rateLimit(axios.create(), { maxRPS: 10 })
const CHAT_GPT_CONFIG = {
    model: "gpt-3.5-turbo",
}
const CHAT_GPT_API_KEY = process.env.CHAT_GPT_API_KEY
module.exports = async function ChatGPT(messages, user) {
    function requestChatGpt(messages, user) {
        return http.post("https://api.openai.com/v1/chat/completions", { ...CHAT_GPT_CONFIG, "messages": messages, user: user }, {
            headers: {
                Authorization: "Bearer " + CHAT_GPT_API_KEY,
            }
        }).then(async res => {
            const firstChoice = res.data.choices[0]
            const textResponse = firstChoice.message;
            if (firstChoice.finish_reason == "length") {
                const longerTextResponse = await requestChatGpt(firstChoice);
                textResponse.content += longerTextResponse;
                return textResponse;
            }
            return textResponse;
        })
    }

    const response = await requestChatGpt(messages);
    return response
}
