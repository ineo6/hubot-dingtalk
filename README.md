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

## Todo

- 接入主动发消息webhook
- 优化消息显示
