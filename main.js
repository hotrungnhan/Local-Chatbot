require('dotenv').config()
const login = require("fb-chat-api");
//
const State = require("./state")
const ChatGPT = require("./chat_gpt")
const Draw = require("./draw")
//

const CREDENTIAL = atob(process.env.BASE_64_CREDENTIAL)

//
const state = new State();

login({ appState: JSON.parse(CREDENTIAL) }, {}, (err, api) => {
    if (err) return console.error(err);
    api.listen(async (err, message) => {
        if (err) {
            console.log(err);
            return;
        }

        if (message && message.type != "message") {
            return;
        }
        console.log(message.threadID, " : ", await state.getBot(message.threadID))
        if (message.body == 'bot on') {
            const m = `Bot is on now.`
            await state.addConversation(message.threadID, "system", m);
            await state.setBot(message.threadID, true)
            await api.sendMessage(m, message.threadID);
            return
        }
        const botState = await state.getBot(message.threadID)
        if (!botState) {
            return
        }
        console.log(message.threadID, " : ", await state.getMode(message.threadID))

        if (message.body == 'bot off') {
            const m = `Bot is off.`
            await state.addConversation(message.threadID, "system", m);
            await state.setBot(message.threadID, false)
            await api.sendMessage(m, message.threadID);
            return
        }
        if (message.body == 'switch draw') {
            const m = `Switching to draw mode.`
            await state.changeMode(message.threadID, "draw")
            await api.sendMessage(m, message.threadID);
            return
        }

        if (message.body == 'stop draw') {
            const m = `Switching to chat mode.`
            await state.changeMode(message.threadID, "chat")
            await api.sendMessage(m, message.threadID);
            return
        }

        if (message.body == 'bot status') {
            const m = `Bot status is ${state.getBot(message.threadID) ? "on" : "off"}.`
            await state.addConversation(message.threadID, "system", m);
            await api.sendMessage(m, message.threadID);
            return
        }

        if (message.body.split(" ").length < 3) {
            await api.sendMessage(`Too less word to answear`, message.threadID);
            return
        }
        if (state.getMode(message.threadID) == "draw") {
            await Draw(message.body).then(img => {
                api.sendMessage({
                    attachment: img,
                }, message.threadID);
            })
        }
        if (state.getMode(message.threadID) == "chat") {
            const myInterval = setInterval(() => api.sendTypingIndicator(message.threadID), 1000);
            await state.addConversation(message.threadID, "user", message.body);
            await ChatGPT(state.getConversation(message.threadID), message.threadID).then(async res => {
                if (res.content.length > 2000) {
                    res.content.split("\n").map(t => api.sendMessage(t, message.threadID))
                } else {
                    await state.addConversation(message.threadID, res.role, res.content)
                    await api.sendMessage(res.content, message.threadID);
                }
            }).catch(async err => {
                if (err.message == "CHAT_GPT_INVATID_RESPONSE") {
                    await api.sendMessage("Please ask some else question that i can answer !!!", message.threadID);
                }
                await api.sendMessage("Chat GPT in stunned by unknown meteorite !!", message.threadID);
                await api.sendMessage(err, message.threadID);
            }).finally(() => clearInterval(myInterval))
        }
    });
})
