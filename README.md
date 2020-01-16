# hubot-dingtalk

[Hubot](http://hubot.github.com/) 的`dingtalk`适配器，让钉钉机器人无缝接入`hubot`。

**注意: 需要先配置好`hubot`。**

## Adapter 配置

### 添加机器人

打开钉钉添加机器人页面，在底部找到`POST 地址`和`Token`（需要开通Outgoing权限）

#### POST 地址

`Adapter`在启动之后会创建回调`/hubot/dingtalk/message/`用于接收消息。

在`POST 地址`填入`域名/hubot/dingtalk/message/`

#### Token

需要配置环境变量`HUBOT_DINGTALK_TOKEN`

对应钉钉自定义机器人`outgoing`回调`token`，用于校验`POST 地址`接收请求的有效性。

## Todo

- 接入主动发消息webhook
- 优化消息显示