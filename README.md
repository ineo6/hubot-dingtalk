# hubot-dingtalk

[Hubot](http://hubot.github.com/) 的`dingtalk`适配器，让钉钉机器人无缝接入`hubot`。

**注意: 需要先配置好`hubot`。**

目前支持：

- 企业内部机器人（签名sign方式）
- 自定义机器人（token匹配方式）

环境变量：

- `HUBOT_DINGTALK_AUTH_TYPE` (认证类型：token,sign)
- `HUBOT_DINGTALK_TOKEN` (认证类型为token时)
- `HUBOT_DINGTALK_SECRET` (认证类型为sign时)
- `HUBOT_DINGTALK_MODE` (会话类型，1:全部，2:单聊，3:群聊)
- `HUBOT_DINGTALK_BLACKLIST` (会话黑名单，格式为`cidyyyy==,cidxxxx=`，优先极高)
- `HUBOT_DINGTALK_WHITELIST` (会话白名单，格式为`cidyyyy==,cidxxxx=`)

## Adapter 配置

### 添加自定义机器人

打开钉钉添加机器人页面，在底部找到`POST 地址`和`Token`（需要开通Outgoing权限）

#### POST 地址

`Adapter`在启动之后会创建回调`/hubot/dingtalk/message/`用于接收消息。

在`POST 地址`填入`域名/hubot/dingtalk/message/`

### 添加企业内部机器人

登录钉钉开发平台创建。

#### 权限认证

1.token比较

配置环境变量：

- `HUBOT_DINGTALK_AUTH_TYPE=token`
- `HUBOT_DINGTALK_TOKEN`

`HUBOT_DINGTALK_TOKEN`对应钉钉自定义机器人`outgoing`回调`token`，用于校验`POST 地址`接收请求的有效性。


2.sign签名

配置环境变量：

- `HUBOT_DINGTALK_AUTH_TYPE=sign`
- `HUBOT_DINGTALK_SECRET`

`HUBOT_DINGTALK_SECRET`在企业机器人配置`appSecret`一栏。

#### 会话控制

目前支持基础的会话控制，包含会话类型（单聊、群聊），会话黑白名单（基于`conversationId`）

- `HUBOT_DINGTALK_MODE=1`
- `HUBOT_DINGTALK_BLACKLIST=cidyyyy==,cidxxxx=`
- `HUBOT_DINGTALK_WHITELIST=cidyyyy==,cidxxxx=`

会优先使用黑名单，关于要使用哪种方式可以自由选取。

该方案目前是简单实现，`conversationId`的获取还没想到比较好的方式，因为时间问题，临时获取方式是在控制台中输出。

## 配置Webhook主动发送

在机器人目录`conf`目录（没有请创建），添加`dingtalk-room.json`文件。

同一个机器人在不同群的`access_token`是不一样的，所以要主动发送消息到群是要指定`access_token`。

这里通过维护别名的方式来实现发送到指定群，`room`是自定义的名称，可以设置成群聊名称一样，`env`是`access_token`的环境变量名称。

```json
[
  {
    "room": "room1",
    "env": "HUBOT_DINGTALK_ACCESS_TOKEN"
  },
  {
    "room": "room2",
    "env": "HUBOT_DINGTALK_ACCESS_TOKEN2"
  }
]
```

### 如何发送？

调用`robot.messageRoom`时，传入你想要发送的群聊别名即可。

```coffeescript
module.exports = (robot) ->
  robot.on "dingtalk", (params) ->
    robot.messageRoom 'room1', "response"
```

## Todo

- [x] 接入主动发消息webhook
- [ ] 优化消息显示

## 反馈

| Github Issue | 钉钉群  |
| --- | --- |
| [issues](https://github.com/ineo6/hubot-dingtalk/issues) | <img src="https://cdn.jsdelivr.net/gh/ineo6/hubot-dingtalk/dingtalk-group.JPG" width="260" />  |

## 如果喜欢的话

如果喜欢的话，欢迎请我喝一杯咖啡。`star`,`follow`也是对我工作的肯定和鼓励。

<img src="https://cdn.jsdelivr.net/gh/ineo6/hubot-dingtalk/wechat-like.jpeg" alt="wechat-like" width=256 height=256 />
