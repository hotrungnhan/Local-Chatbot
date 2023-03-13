const login = require("fb-chat-api");
const axios = require("axios");
const rateLimit = require("axios-rate-limit");
const http = rateLimit(axios.create(), { maxRPS: 10 })
require('dotenv').config()
const CHAT_GPT_CONFIG = {
    model: "gpt-3.5-turbo",
    // temperature: 0.7,
}
class State {
    // [thread: string]: {
    //     status: true,
    //     conversions: [{
    //         role: "",
    //         content: ""
    //     }],
    // }
    static MAX_CONVERSATION = 10;
    static REDUCE_RATIO = 0.5;
    setBot(threadID, status = true) {
        if (!this[threadID]) {
            this[threadID] = {}
        }
        this[threadID].status = status;
    }
    getBot(threadID) {
        if (!this[threadID]) {
            this[threadID] = {}
        }
        return this[threadID].status
    }
    getConversation(threadID) {
        if (!this[threadID]) {
            this[threadID] = {}
        }
        if (!this[threadID].conversations) {
            this[threadID].conversations = []
        }
        return this[threadID].conversations;
    }
    addConversation(threadID, role, content) {
        if (!this[threadID]) {
            this[threadID] = {}
        }
        if (!this[threadID].conversations) {
            this[threadID].conversations = []
        }
        if (this[threadID].conversations.length > this.constructor.MAX_CONVERSATION) {
            // reduce 1/2 conversation;
            this[threadID].conversations = this[threadID].conversations.slice(this[threadID].conversations.length - parseInt(this.constructor.MAX_CONVERSATION * this.constructor.REDUCE_RATIO), this[threadID].conversations.length)
        }
        this[threadID].conversations.push({
            role: role,
            content: content
        })
    }
}
const CHAT_GPT_API_KEY = process.env.CHAT_GPT_API_KEY
const CREDENTIAL = atob(process.env.BASE_64_CREDENTIAL)
const state = new State();

async function chatGpt(messages, user) {
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

login({ appState: JSON.parse(CREDENTIAL) }, {}, (err, api) => {
    if (err) return console.error(err);
    api.listen((err, message) => {
        if (err) {
            console.log(err);
            return;
        }

        if (message && message.type != "message") {
            return;
        }
        if (!CHAT_GPT_API_KEY) {
            api.sendMessage("Ask admin for update valid api key.", message.threadID);
            return
        }

        if (message.body == 'bot on') {
            const m = `Bot is on now.`
            state.addConversation(message.threadID, "system", m);
            state.setBot(message.threadID, true)
            api.sendMessage(m, message.threadID);
            return
        }

        if (message.body == 'bot off') {
            const m = `Bot is off.`
            state.addConversation(message.threadID, "system", m);
            state.setBot(message.threadID, false)
            api.sendMessage(m, message.threadID);
            return
        }

        if (message.body == 'bot status') {
            const m = `Bot status is ${state.getBot(message.threadID) ? "on" : "off"}.`
            state.addConversation(message.threadID, "system", m);
            api.sendMessage(m, message.threadID);
            return
        }

        if (state.getBot(message.threadID) && message.body.split(" ").length < 3) {
            api.sendMessage(`Too less word to answear`, message.threadID);
            return
        }

        if (state.getBot(message.threadID)) {
            const myInterval = setInterval(() => api.sendTypingIndicator(message.threadID), 1000);
            state.addConversation(message.threadID, "user", message.body);
            console.log(state)
            chatGpt(state.getConversation(message.threadID), message.threadID).then(res => {
                if (res.content.length > 2000) {
                    res.content.split("\n").map(t => api.sendMessage(t, message.threadID))
                } else {
                    state.addConversation(message.threadID, res.role, res.content)
                    api.sendMessage(res.content, message.threadID);
                }
            }).catch(err => {
                if (err.message == "CHAT_GPT_INVATID_RESPONSE") {
                    api.sendMessage("Please ask some else question that i can answer !!!", message.threadID);
                }
                api.sendMessage("Chat GPT in stunned by unknown meteorite !!", message.threadID);
                api.sendMessage(err, message.threadID);
            }).finally(() => clearInterval(myInterval))
        }
    });
})
