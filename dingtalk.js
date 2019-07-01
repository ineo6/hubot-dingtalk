/**
 * dingtalk adapter
 */

const Adapter = require.main.require('hubot/src/adapter')
const { TextMessage } = require.main.require('hubot/src/message')
const User = require.main.require('hubot/src/user')

const { Text } = require("./src/template");

class Dingtalk extends Adapter {
  constructor(robot, options) {
    super(robot);

    this.token = options.token;

    // 钉钉发送消息地址，20分钟有效期
    // todo cache?
    this.sessionWebhook = null;

    this.robot.logger.info("Constructor")
  }

  request(data, cb) {
    if (this.sessionWebhook) {
      this.robot.http(this.sessionWebhook)
        .header('Content-Type', 'application/json')
        .post(JSON.stringify(data.get()))((err, resp, body) => {
          const result = JSON.parse(body);

          if (result.errmsg === 0) {
            //this.robot.logger.info("request success")
          } else {
            this.robot.logger.error("request failed：" + result.errmsg, resp)
          }

          cb && cb();
        })
    } else {
      this.robot.logger.error("sessionWebhook is null")
    }
  }

  //for room
  send(envelope, ...strings) {
    this.robot.logger.info("Send")

    if (strings.length === 0) {
      return
    }

    const string = strings.shift()

    const text = new Text();
    text.setContent(string);

    if (envelope.user && envelope.user.id) {
      text.atId(envelope.user.id)
    }

    this.robot.logger.debug(`dingtalk sending message: ${text}`)

    this.request(text, () => {
      this.send.apply(this, [envelope].concat(strings))
    })

  }

  // for user
  reply(envelope, ...strings) {
    this.robot.logger.info("reply")

    this.send.apply(this, [envelope].concat(strings.map(str => `${envelope.user.name}: ${str}`)))
  }

  listen() {
    this.robot.router.post('/hubot/dingtalk/message/', (request, response) => {
      let data = {};

      if (request.body.payload) {
        JSON.parse(data = request.body.payload)
      }
      else {
        data = request.body
      }

      const requestToken = request.get('token');

      if (requestToken === this.token) {
        this.robot.logger.debug(`dingtalk receive data ${JSON.stringify(data)}`);

        this.sessionWebhook = data.sessionWebhook;
        this.receiveMessageFromUrl(data.text.content, data.createAt, data.senderId, data.senderNick)

        response.send(JSON.stringify({
          "msgtype": "empty",
        }));
      } else {
        response.send("who are you!!!");
      }
    });
  }

  // 针对钉钉talk特性，给message添加机器人名称才能出发hubot的respond
  addPrefixMessage(message) {
    if (!message.match(this.robot.respondPattern(''))) {
      return `${this.robot.name}: ${message}`;
    }

    return message;
  }

  receiveMessageFromUrl(msg, msgId, senderId, username) {
    this.robot.logger.info(msg);

    const user = new User(senderId, { name: username });
    this.receive(new TextMessage(user, this.addPrefixMessage(msg), msgId))
  }

  run() {
    this.robot.logger.info("Run");

    if (this.token) {
      this.listen();
    } else {
      this.robot.logger.error("No token provided to dingtalk!");
    }

    this.emit("connected")
  }
}

// 钉钉自定义机器人outgoing回调token
const token = process.env.HUBOT_DINGTALK_TOKEN;

exports.use = robot => new Dingtalk(robot, { token })