const App = require('./App')

class Context {
  constructor(options = { app: true, worker: false }) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000
    this.client = null
    this.app = null
  }

  async begin() {
    const startApp = (new App()).start()
    const app = await startApp

    this.client = app.client

    this.app = app

    return this
  }

  async end() {
    if (this.app) {
      await this.app.stop()
    }
  }
}

module.exports = new Context()

