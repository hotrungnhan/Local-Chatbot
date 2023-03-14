const login = require("fb-chat-api");


require('dotenv').config()
const State = require("./state")
const ChatGPT = require("./chat_gpt")
const Draw = require("./draw")
//

const CREDENTIAL = atob(process.env.BASE_64_CREDENTIAL)

//
const state = new State();

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
        if (message.body == 'bot on') {
            const m = `Bot is on now.`
            state.addConversation(message.threadID, "system", m);
            state.setBot(message.threadID, true)
            api.sendMessage(m, message.threadID);
            return
        }

        if (state.getBot(message.threadID) && message.body == 'bot off') {
            const m = `Bot is off.`
            state.addConversation(message.threadID, "system", m);
            state.setBot(message.threadID, false)
            api.sendMessage(m, message.threadID);
            return
        }
        if (state.getBot(message.threadID) && message.body == 'change draw') {
            const m = `Switching to draw mode.`
            state.changeMode(message.threadID, "draw")
            api.sendMessage(m, message.threadID);
            return
        }
        if (state.getBot(message.threadID) && message.body == 'change chat') {
            const m = `Switching to chat mode.`
            state.changeMode(message.threadID, "chat")
            api.sendMessage(m, message.threadID);
            return
        }

        if (state.getBot(message.threadID) && message.body == 'bot status') {
            const m = `Bot status is ${state.getBot(message.threadID) ? "on" : "off"}.`
            state.addConversation(message.threadID, "system", m);
            api.sendMessage(m, message.threadID);
            return
        }

        if (state.getBot(message.threadID) && message.body.split(" ").length < 3) {
            api.sendMessage(`Too less word to answear`, message.threadID);
            return
        }

        if (state.getBot(message.threadID) && state.getBot(message.threadID) == "draw") {
            Draw(message).then(img => {
                api.sendMessage({
                    attachment: img,
                }, message.threadID);
            })
        }
        if (state.getBot(message.threadID) && state.getBot(message.threadID) == "chat") {
            const myInterval = setInterval(() => api.sendTypingIndicator(message.threadID), 1000);
            state.addConversation(message.threadID, "user", message.body);
            ChatGPT(state.getConversation(message.threadID), message.threadID).then(res => {
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
