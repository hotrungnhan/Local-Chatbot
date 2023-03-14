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
        if (!this[threadID]) {
            this[threadID] = {}
        }
        this[threadID].status = status;
    }
    getMode(threadID) {
        if (!this[threadID]) {
            this[threadID] = {}
        }
        return this[threadID].mode || "chat";
    }
    changeMode(threadID, mode) {
        if (!this[threadID]) {
            this[threadID] = {}
        }
        this[threadID].mode = mode;
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
