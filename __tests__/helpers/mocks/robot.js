const { EventEmitter } = require('events')
const HttpClient = require('scoped-http-client')
const express = require('express')
const net = require('net')

const http = function (url, options) {
  return HttpClient.create(url, options).header('User-Agent', `Hubot`)
}

class FakeHttp {
  constructor(url) {
    this.url = url;
  }

  header() {
    return this;
  }

  post() {
    return function (cb) {
      console.log(cb.toString())
      cb && cb()

      return (function (_this) {
        return function (callback) {
          if (callback) {
            return callback(null, {}, {});
          }
          return _this;
        };
      })(this);
    }
  }
}

function portIsOccupied(port) {
  const server = net.createServer().listen(port)
  return new Promise((resolve, reject) => {
    server.on('listening', () => {
      // console.log(`the server is runnint on port ${port}`)
      server.close()
      resolve(port)
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(portIsOccupied(port + (Math.floor((Math.random() * 10) + 1))))
        // console.log(`this port ${port} is occupied.try another.`)
      } else {
        reject(err)
      }
    })
  })
}

class FakeRobot extends EventEmitter {
  constructor() {
    super()
    this.logger = {
      log: function () {
      },
      info: function () {
      },
      error: function () {
      },
      debug: function () {
      },
    }
    this.receive = jest.fn()

    this.http = http;
    this.sockets = [];

    this.brain = {
      get: function (name) {
        if (name === "room") {
          return "token"
        }

        return "";
      },
      set: function () {
      },
    }

    this.respondPattern = jest.fn()
  }

  async init() {
    const app = express()

    app.use((req, res, next) => {
      res.setHeader('X-Powered-By', `hubot`)
      return next()
    })

    app.use(express.query())

    app.use(express.json())

    const defaultPort = process.env.EXPRESS_PORT || process.env.PORT || 8081
    const address = process.env.EXPRESS_BIND_ADDRESS || process.env.BIND_ADDRESS || '0.0.0.0'

    try {
      let port = await portIsOccupied(defaultPort)

      this.server = app.listen(port, address)

      this.server.on('error', async (err) => {
        port = await portIsOccupied(defaultPort + 1)

        this.server = app.listen(port, address)
      })

      this.router = app

      return port;
    } catch (error) {
      const err = error
      this.logger.error(`Error trying to start HTTP server: ${err}\n${err.stack}`)
    }
  }

  closeServer() {
    this.sockets.forEach(function (socket) {
      socket.end();
      socket.destroy();
    });
    this.server.close()
  }

  shutdown() {
    if (this.server) {
      this.closeServer()
    }
  }
}

module.exports = FakeRobot
