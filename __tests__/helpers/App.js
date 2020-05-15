const FakeRobot = require('./mocks/robot')

class App {
  async start() {
    this.config = {
      secret: "test-client-secret",
      type: "sign",
      accessToken: "test-client-id",
    }

    process.env['HUBOT_DINGTALK_ACCESS_TOKEN'] = this.config.accessToken;
    process.env['HUBOT_DINGTALK_SECRET'] = this.config.secret;
    process.env['HUBOT_DINGTALK_AUTH_TYPE'] = this.config.type;

    const dingtalkAdapter = require('../../dingtalk')

    this.robot = new FakeRobot(__dirname, "dingtalk", true, "jarvis")

    await this.robot.init();

    this.adapter = dingtalkAdapter.use(this.robot)
    this.client = null;

    // load conf
    const conf = this.adapter.read(__dirname)

    conf.forEach((config) => {
      if (config.room && config.env && process.env[config.env]) {
        this.robot.brain.set(config.room, process.env[config.env])
      }
    })

    await new Promise((resolve, reject) => {
      this.adapter.once('connected', () => {
        resolve(this.adapter)
      })

      this.adapter.once('error', (error) => {
        reject(error)
      })


      this.adapter.run()
    })

    return this
  }

  async stop() {
    this.robot.shutdown();
    return this.adapter.close()
  }
}

module.exports = App
