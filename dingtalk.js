/**
 * dingtalk adapter
 */
const crypto = require("crypto");
const Adapter = require.main.require("hubot/src/adapter");
const { TextMessage } = require.main.require("hubot/src/message");
const User = require.main.require("hubot/src/user");

const Robot = require("dingtalk-robot-sdk")
const path = require('path')
const fs = require('fs')

const Text = Robot.Text;

const authDict = ["token", "sign"];

const dict = {
  MODE: {
    Both: 1,
    Single: 2,
    Group: 3,
  }
};

const modeDict = [dict.MODE.Both, dict.MODE.Single, dict.MODE.Group];

class Dingtalk extends Adapter {
  constructor(robot, options) {
    super(robot);

    this.token = options.token;
    this.secret = options.secret;
    this.authType = options.authType || authDict[0];
    this.mode = options.mode ? options.mode * 1 : dict.MODE.Both;
    this.blackList = options.blackList ? options.blackList.split(",") : [];
    this.whiteList = options.whiteList ? options.whiteList.split(",") : [];

    // 钉钉发送消息地址，20分钟有效期
    // todo cache?
    this.sessionWebhook = null;
    this.webhook = null;

    this.robot.logger.info("Constructor");
  }

  getWebHookUrl(accessToken) {
    return new Robot({ accessToken: accessToken, secret: this.secret }).getWebHook();
  }

  request(data, envelope, cb) {
    let webHookUrl = this.sessionWebhook;

    // 只有指定room时使用webhook，outgoing返回消息采用sessionWebhook
    if (envelope.room) {
      const accessToken = this.robot.brain.get(envelope.room);

      if (accessToken) {
        webHookUrl = this.getWebHookUrl(accessToken);
      } else {
        this.robot.logger.error(`dingtalk send to room ${envelope.room} failed: accessToken not found`);
        return;
      }
    }

    // todo 直接调用robot.send时缺少room，可能会使用sessionWebhook导致错误发送
    if (webHookUrl) {
      this.robot
        .http(webHookUrl)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(data.get()))((err, resp, body) => {
          if (body) {
            try {
              const result = JSON.parse(body);

              if (result.errmsg !== 'ok') {
                this.robot.logger.error("response failed：" + result.errmsg);
              }
            } catch (e) {
              this.robot.logger.error("response failed：" + e.errmsg);
            }
          } else {
            this.robot.logger.error("request failed：" + err);
          }

          cb && cb();
        });
    } else {
      this.robot.logger.error("missing webhook");
    }
  }

  //for room
  send(envelope, ...strings) {
    this.robot.logger.info("Send");

    if (strings.length === 0) {
      return;
    }

    const string = strings.shift();

    const text = new Text();
    text.setContent(string);

    if (envelope.user && envelope.user.id) {
      text.atId(envelope.user.id);
    }

    this.robot.logger.debug(`dingtalk send to ${envelope.room || ""}  message: ${text}`);

    this.request(text, envelope, () => {
      this.send.apply(this, [envelope].concat(strings));
    });
  }

  // for user
  reply(envelope, ...strings) {
    this.robot.logger.info("reply");

    this.send.apply(
      this,
      [envelope].concat(strings.map(str => `${envelope.user.name}: ${str}`))
    );
  }

  referrerCheck(request) {
    if (this.authType === "token") {
      const requestToken = request.get("token");

      return requestToken === this.token;
    } else {
      const timestamp = request.get("timestamp");
      const sign = request.get("sign");

      const hash = crypto
        .createHmac("sha256", this.secret)
        .update(timestamp + "\n" + this.secret)
        .digest("base64");

      return hash === sign;
    }
  }

  isRobotSupportMode(messageData) {
    const { conversationType } = messageData;

    // 判断消息模式
    if (this.mode === 1) {
      return conversationType === "1" || conversationType === "2"
    } else if (this.mode === 2) {
      return conversationType === "1"
    } else if (this.mode === 3) {
      return conversationType === "2"
    }

    return false;
  }

  isMessageChannelDisabled(messageData) {
    const { conversationId, } = messageData;

    // 判断会话权限

    // 优先使用黑名单，为空时再使用白名单
    if (this.blackList && this.blackList.length) {
      if (this.blackList.indexOf(conversationId) >= 0) {
        this.robot.logger.info(
          `${conversationId} is blocked`
        );

        return true;
      }
    } else if (this.whiteList && this.whiteList.length) {
      if (this.whiteList.indexOf(conversationId) >= 0) {
        return false;
      }

      this.robot.logger.info(
        `${conversationId} is blocked`
      );

      return true;
    }

    return false;
  }

  listen() {
    this.robot.router.get("/hubot/dingtalk/message/", (request, response) => {
      response.send("<h1>Hubot Dingtalk</h1><p>请使用POST方式请求！</p>");
    })

    this.robot.router.post("/hubot/dingtalk/message/", (request, response) => {
      let data = {};

      if (request.body.payload) {
        JSON.parse((data = request.body.payload));
      } else {
        data = request.body;
      }

      if (this.referrerCheck(request)) {
        this.robot.logger.info(
          `dingtalk receive data conversationId: ${data.conversationId}`
        );

        this.robot.logger.debug(
          `${JSON.stringify(data)}`
        );

        const isRobotSupportMode = this.isRobotSupportMode(data);

        if (!isRobotSupportMode) {
          const bannedText = new Text();
          bannedText.setContent(`机器人不支持${data.conversationType === "1" ? '单聊' : '群聊'}!`);

          if (data.senderId && data.conversationType === "2") {
            bannedText.atId(data.senderId);
          }

          response.send(
            JSON.stringify(bannedText.get())
          );

          return;
        }

        const isMessageChannelDisabled = this.isMessageChannelDisabled(data);

        if (isMessageChannelDisabled) {
          const bannedText = new Text();
          bannedText.setContent("机器人尚未对该会话启用!");

          if (data.senderId && data.conversationType === "2") {
            bannedText.atId(data.senderId);
          }

          response.send(
            JSON.stringify(bannedText.get())
          );

          return;
        }

        this.sessionWebhook = data.sessionWebhook;

        this.receiveMessageFromUrl(
          data.text.content,
          data.createAt,
          data.senderId,
          data.senderNick
        );

        response.send(
          JSON.stringify({
            msgtype: "empty"
          })
        );
      } else {
        response.send("who are you!!!");
      }
    });
  }

  // 针对钉钉talk特性，给message添加机器人名称才能出发hubot的respond
  addPrefixMessage(message) {
    if (!message.match(this.robot.respondPattern(""))) {
      return `${this.robot.name}: ${message}`;
    }

    return message;
  }

  read(base) {
    const configFilePath = path.resolve(base || ".", "conf", "dingtalk-room.json");

    if (fs.existsSync(configFilePath)) {
      try {
        const data = fs.readFileSync(configFilePath);

        return JSON.parse(data);
      } catch (e) {
        this.robot.logger.error("Read file: " + configFilePath + " failed");
        this.robot.logger.error(e.message);
      }
    } else {
      this.robot.logger.info("Definition file not found:" + configFilePath);
    }

    return [];
  }

  receiveMessageFromUrl(msg, msgId, senderId, username) {
    this.robot.logger.info(msg);

    const user = new User(senderId, { name: username });
    this.receive(new TextMessage(user, this.addPrefixMessage(msg), msgId));
  }

  run() {
    this.robot.logger.info("Run");

    if (authDict.indexOf(this.authType) === -1) {
      this.robot.logger.error("Allowed auth type is token or sign!");
      return false;
    }

    if (modeDict.indexOf(this.mode) === -1) {
      this.robot.logger.error("Valid mode is one of 1,2,3!");
      return false;
    }

    if (!this.token && !this.secret) {
      this.robot.logger.error("No token or secret is provided to dingtalk!");
    } else {
      this.listen();
    }

    // start incoming webhook
    const conf = this.read();

    conf.forEach((config) => {
      if (config.room && config.env && process.env[config.env]) {
        this.robot.brain.set(config.room, process.env[config.env])
      }
    })

    this.emit("connected");
  }
}

// 钉钉自定义机器人签名
const token = process.env.HUBOT_DINGTALK_TOKEN;
const secret = process.env.HUBOT_DINGTALK_SECRET;
const authType = process.env.HUBOT_DINGTALK_AUTH_TYPE;
const mode = process.env.HUBOT_DINGTALK_MODE;
const blackList = process.env.HUBOT_DINGTALK_BLACKLIST;
const whiteList = process.env.HUBOT_DINGTALK_WHITELIST;

exports.use = robot => {
  return new Dingtalk(robot, {
    token,
    secret,
    authType,
    mode,
    blackList,
    whiteList
  })
};
