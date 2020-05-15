const nock = require('nock')

const apiUrl = 'https://oapi.dingtalk.com';

function sendMessage(onReply, {} = {}) {
  return nock(apiUrl)
    .post(uri => uri.includes('/robot/send'))
    .reply(200, onReply({
      errmsg: 'ok'
    }))
}

module.exports = {
  sendMessage,
}
