const { createClient } = require("redis")
const REDIS_URL = process.env.REDIS_URL
const client = createClient({
    url: REDIS_URL
});
client.connect().then(() => console.log("redis connected !!!"));

module.exports = class State {
    // [thread: string]: {
    //     status: true,
    //     mode: "chat" | "draw"
    //     conversions: [{
    //         role: "",
    //         content: ""
    //     }],
    // }
    static MAX_CONVERSATION = 10;
    static REDUCE_RATIO = 0.5;
    setBot(threadID, status = true) {
        return client.HSET(`${threadID}::state`, "status", status);
    }
    getMode(threadID) {
        return client.HGET(`${threadID}::state`, "status").then(d => d || "chat")
    }
    changeMode(threadID, mode) {
        return client.HSET(`${threadID}::state`, "mode", mode);
    }
    getBot(threadID) {
        return client.HGET(`${threadID}::state`, "status");
    }
    getConversation(threadID) {
        return client.LRANGE(`${threadID}::conversations`, 0, -1)
    }
    async addConversation(threadID, role, content) {
        const listLength = await client.LLEN(`${threadID}::conversations`);
        if (listLength > this.constructor.MAX_CONVERSATION) {
            // reduce 1/2 conversation;
            await client.LTRIM(`${threadID}::conversations`, parseInt(listLength * this.constructor.REDUCE_RATIO), listLength)
        }
        return client.LPUSH(`${threadID}::conversations`, {
            role: role,
            content: content
        })
    }
}
