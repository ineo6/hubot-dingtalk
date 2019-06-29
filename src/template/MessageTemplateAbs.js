class MessageTemplateAbs {
    constructor() {
        this.canAt = false;
        this.isAtAll = false;
        this.atMobiles = new Set();
        this.atDingtalkIds = new Set();
        if (new.target === MessageTemplateAbs) {
            throw new Error('抽象类不可以实例化');
        }
    }
    render(options) {
        return Object.assign({
            msgtype: this.msgtype,
        }, options, this.canAt
            ? {
                at: {
                    atMobiles: Array.from(this.atMobiles),
                    atDingtalkIds: Array.from(this.atDingtalkIds),
                    isAtAll: this.isAtAll,
                },
            }
            : {});
    }
    get() {
        throw new Error('抽象方法render不可以调用');
    }
    toJsonString() {
        throw new Error('抽象方法toJsonString不可以调用');
    }
    atAll() {
        this.isAtAll = true;
        return this;
    }
    atPhone(phones) {
        if (phones instanceof Array) {
            phones.map(phone => {
                this.atMobiles.add(phone);
            });
        }
        else {
            this.atMobiles.add(phones);
        }
        return this;
    }
    atId(ids) {
        if (ids instanceof Array) {
            ids.map(phone => {
                this.atDingtalkIds.add(phone);
            });
        }
        else {
            this.atDingtalkIds.add(ids);
        }
        return this;
    }
}

module.exports = MessageTemplateAbs;
