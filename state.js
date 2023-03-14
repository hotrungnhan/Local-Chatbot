const Redis = require("ioredis").default
const REDIS_URL = process.env.REDIS_URL
const client = new Redis(REDIS_URL)
client.on("ready", () => {
    console.log("redis connected !!!");
})
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
        return client.hset(`${threadID}::state`, {
            status: status
        });
    }
    getMode(threadID) {
        return client.hget(`${threadID}::state`, "mode").then(d => d || "chat")
    }
    changeMode(threadID, mode) {
        return client.hset(`${threadID}::state`, { "mode": mode });
    }
    getBot(threadID) {
        return Boolean(client.hget(`${threadID}::state`, "status"));
    }
    async getConversation(threadID) {
        return (await client.lrange(`${threadID}::conversations`, 0, -1)).map(s => JSON.parse(s))
    }
    async addConversation(threadID, role, content) {
        const listLength = await client.llen(`${threadID}::conversations`);
        if (listLength > this.constructor.MAX_CONVERSATION) {
            // reduce 1/2 conversation;
            await client.ltrim(`${threadID}::conversations`, 0, listLength - parseInt(listLength * this.constructor.REDUCE_RATIO))
        }
        return client.lpush(`${threadID}::conversations`, JSON.stringify({
            role: role,
            content: content
        }))
    }
}
