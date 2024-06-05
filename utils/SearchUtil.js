import User from "../models/User.js";
import Announcement from "../models/Announcement.js";
import Message from "../models/Message.js";

class SearchHelper {
    static stopWords = new Set([
        "a","able","about","across","after","all","almost","also","am","among","an","and","any","are","as","at",
        "be","because","been","but","by","can","cannot","could","dear","did","do","does","either","else","ever",
        "every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i",
        "if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must",
        "my","neither","no","nor","not","of","off","often","on","only","or","other","our","own","rather","said",
        "say","says","she","should","since","so","some","than","that","the","their","them","then","there","these",
        "they","this","tis","to","too","twas","us","wants","was","we","were","what","when","where","which",
        "while","who","whom","why","will","with","would","yet","you","your"
    ]);

    static filterStopWords(strToFilter) {
        if (!strToFilter)
            return "";
        return strToFilter.split(/\s+/)
            .filter(word => !SearchHelper.stopWords.has(word.toLowerCase()))
            .join(" ");
    }

    static compareUser(a, b) {
        // First, sort by isOnline status
        if (a.isOnline && !b.isOnline)
            return -1;
        if (!a.isOnline && b.isOnline)
            return 1;

        // If isOnline status is the same, sort by username (ascending)
        return a.username.localeCompare(b.username);
    }
}

class ISearchResultFactory {
    constructor() { }

    async createResult(criteria) { }

    async getAllResultJson(criteria) {
        const searchResult = await this.createResult(criteria);
        const searchResultJson = searchResult.toJson();
        return {
            results: searchResultJson,
            context: criteria.context,
            totalResults: searchResultJson.length,
        };
    }

    async getLimitResultJson(criteria) {
        const searchResult = await this.createResult(criteria);
        const searchResultJson = searchResult.toJson();
        return {
            results: searchResultJson.slice(criteria.offset, criteria.offset + criteria.limit),
            context: criteria.context,
            totalResults: searchResultJson.length,
            offset: criteria.offset,
            limit: criteria.limit,
        };
    }
}

class ISearchResult {
    constructor() { }

    toJson() { }
}

export class UserSearchResultFactory extends ISearchResultFactory {
    async createResult(criteria) {
        await super.createResult(criteria);

        let users = await User.getAllUsers();
        if (criteria.status) {
            // search user by status
            users = users.filter((user) => user.status.toLowerCase() === criteria.status.toLowerCase());
        } else if (criteria.keyword) {
            // search user by name
            users = users.filter((user) => user.username.includes(criteria.keyword));
        } else {
            // error
            users = [];
        }
        return new UserSearchResult(users);
    }
}

class UserSearchResult extends ISearchResult {
    constructor(users) {
        super();
        this.users = users;
    }

    toJson() {
        super.toJson();
        this.users.sort(SearchHelper.compareUser);
        return this.users.map((user) => {
            return {
                username: user.username,
                status: user.status,
                timestamp: user.timestamp,
                // message: "string",
                isOnline: user.isOnline,
                // senderUsername: "string",
                // receiverUsername: "string",
                // senderStatus: "string",
                // receiverStatus: "string",
                // messageStatus: "string"
            };
        });
    }
}

export class AnnouncementSearchResultFactory extends ISearchResultFactory {
    async createResult(criteria) {
        await super.createResult(criteria);

        criteria.keyword = SearchHelper.filterStopWords(criteria.keyword).toLowerCase();
        if (criteria.keyword.length === 0) {
            return new AnnouncementSearchResult([]);
        }
        let announcements = await Announcement.getAllAnnouncements();
        announcements = announcements.filter((a) => {
            const contentToMatch = SearchHelper.filterStopWords(a.content).toLowerCase();
            return contentToMatch.includes(criteria.keyword);
        });
        announcements.reverse();
        return new AnnouncementSearchResult(announcements);
    }
}

class AnnouncementSearchResult extends ISearchResult {
    constructor(announcements) {
        super();
        this.announcements = announcements;
    }

    toJson() {
        super.toJson();
        return this.announcements.map((a) => {
            return {
                username: a.sender.username,
                timestamp: a.timestamp,
                message: a.content,
                senderUsername: a.sender.username,
            }
        });
    }
}

export class PublicMessageSearchResultFactory extends ISearchResultFactory {
    async createResult(criteria) {
        await super.createResult(criteria);

        criteria.keyword = SearchHelper.filterStopWords(criteria.keyword).toLowerCase();
        if (criteria.keyword.length === 0) {
            return new MessageSearchResult([]);
        }
        let messages = await Message.getAllPublicMessages();
        messages = messages.filter((m) => {
            const contentToMatch = SearchHelper.filterStopWords(m.content).toLowerCase();
            return contentToMatch.includes(criteria.keyword);
        });
        messages.reverse();
        return new MessageSearchResult(messages);
    }
}

export class PrivateMessageSearchResultFactory extends ISearchResultFactory {
    async createResult(criteria) {
        await super.createResult(criteria);

        const user1 = await User.findUser(criteria.user1);
        const user2 = await User.findUser(criteria.user2);
        if (!user1 || !user2)
            return new MessageSearchResult([]);
        criteria.keyword = SearchHelper.filterStopWords(criteria.keyword).toLowerCase();
        if (criteria.keyword.length === 0)
            return new MessageSearchResult([]);

        let messages = await Message.getAllPrivateMessagesBetweenUsers(user1, user2);

        // Special case: criteria.keyword === "status"
        if (criteria.keyword === "status") {
            const filteredMessages = [];
            let prevMsg = null;
            for (const msg of messages) {
                if (prevMsg && msg.sender.username === user2.username && msg.status !== prevMsg.status)
                    filteredMessages.push(msg);

                if (msg.sender.username === user2.username) {
                    if (prevMsg === null)
                        filteredMessages.push(msg);
                    prevMsg = msg;
                }
            }
            filteredMessages.reverse();
            return new MessageSearchResult(filteredMessages);
        }

        messages = messages.filter((m) => {
            const contentToMatch = SearchHelper.filterStopWords(m.content).toLowerCase();
            return contentToMatch.includes(criteria.keyword);
        });
        messages.reverse();
        return new MessageSearchResult(messages);
    }
}

class MessageSearchResult extends ISearchResult {
    constructor(messages) {
        super();
        this.messages = messages;
    }

    toJson() {
        super.toJson();
        return this.messages.map((m) => {
            return {
                username: m.sender.username,
                status: m.status,
                timestamp: m.timestamp,
                message: m.content,
                senderUsername: m.sender.username,
                receiverUsername: (m.receiver) ? m.receiver.username : null,
                senderStatus: m.sender.status,
                receiverStatus: (m.receiver) ? m.receiver.status : null,
                messageStatus: m.status
            }
        });
    }
}
