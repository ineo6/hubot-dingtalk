const MessageTemplateAbs = require("./MessageTemplateAbs");

class Text extends MessageTemplateAbs {
    constructor(content) {
        super();
        this.msgtype = 'text';
        this.canAt = true;
        content && this.setContent(content);
    }
    setContent(content) {
        this.content = content;
    }
    get() {
        return this.render({
            text: {
                content: this.content,
            },
        });
    }
}
module.exports = Text;
