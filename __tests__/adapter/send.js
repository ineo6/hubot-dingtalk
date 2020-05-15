const Robot = require("dingtalk-robot-sdk")

const context = require('../helpers/Context')
const util = require('../helpers/util')
const dingtalk = require('../helpers/mocks/dingtalk')

const Text = Robot.Text;

beforeAll(() => context.begin())
afterAll(async (done) => {
  await context.end();
  done();
})

test('Adapter.send sends message to Dingtalk', async () => {
  const sendMessage = util.waitForRequest(dingtalk.sendMessage);

  context.app.adapter.send({
    room: "room"
  }, 'test message')

  const res = await sendMessage

  const text = new Text();
  text.setContent("test message");

  expect(res.body).toEqual(text.get())
})
