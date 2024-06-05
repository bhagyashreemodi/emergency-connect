import {OK, NOT_FOUND} from "../utils/HttpStatus.js";
import {
    UserSearchResultFactory,
    AnnouncementSearchResultFactory,
    PublicMessageSearchResultFactory,
    PrivateMessageSearchResultFactory,
} from "../utils/SearchUtil.js";

export default class SearchController {
    constructor() { }

    async performSearch(req, res) {
        const criteria = {
            context: req.query.context,
            keyword: req.query.keyword,
            status: req.query.status,
            user1: req.query.user1,
            user2: req.query.user2,
            offset: parseInt(req.query.offset),
            limit: parseInt(req.query.limit),
        };

        if (criteria.context === 'user') {
            const searchResultFactory = new UserSearchResultFactory();
            const result = await searchResultFactory.getAllResultJson(criteria);
            return res.status(OK).send(result);
        } else if (criteria.context === 'announcement') {
            const searchResultFactory = new AnnouncementSearchResultFactory();
            const result = await searchResultFactory.getLimitResultJson(criteria);
            return res.status(OK).send(result);
        } else if (criteria.context === 'public-message') {
            const searchResultFactory = new PublicMessageSearchResultFactory();
            const result = await searchResultFactory.getLimitResultJson(criteria);
            return res.status(OK).send(result);
        } else if (criteria.context === 'private-message') {
            const searchResultFactory = new PrivateMessageSearchResultFactory();
            const result = await searchResultFactory.getLimitResultJson(criteria);
            return res.status(OK).send(result);
        } else {
            // criteria.context not recognized
            return res.status(NOT_FOUND).send(criteria);
        }
    }
}