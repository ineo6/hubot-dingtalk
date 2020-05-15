const got = require('got');

const context = require('../helpers/Context')
const { sign256 } = require("../helpers/util");

beforeAll(() => context.begin())
afterAll(() => context.end())

test('Adapter can receive messages', async () => {

  const data = {
    "msgtype": "text",
    "text": {
      "content": "我就是我, 是不一样的烟火"
    },
    "msgId": "XXXX",
    "createAt": 1487561654123,
    "conversationType": "2",
    "conversationId": "XXXX",
    "conversationTitle": "钉钉群标题",
    "senderId": "XXXX",
    "senderNick": "星星",
    "senderCorpId": "XXXX",
    "senderStaffId": "XXXX",
    "chatbotUserId": "XXXX",
    "atUsers": [
      {
        "dingtalkId": "XXXX",
        "staffId": "XXXX"
      }
    ]
  };

  const timeStamp = Date.now();
  const sign = sign256(context.app.config.secret, timeStamp);

  const res = await got.post(`http://localhost:8081/hubot/dingtalk/message/`, {
    json: data,
    headers: {
      sign: sign,
      timeStamp: timeStamp,
    }
  });

  const textMessage = context.app.robot.receive.mock.calls[0][0]

  expect(textMessage).toMatchObject({
    id: data.createAt,
    text: data.text.content,
    user: {
      id: data.senderId
    }
  })
  expect(res.statusCode).toEqual(200)
  expect(JSON.parse(res.body)).toMatchObject({
    msgtype: "empty"
  })
})
