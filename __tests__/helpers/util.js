const crypto = require("crypto");

function waitForRequest(registerRequestListener, timeout = 1500) {
  const error = new Error(`Waiting > ${timeout} ms`)

  return new Promise((resolve, reject) => {
    function onReply(response) {

      return (uri, body) => {
        resolve({ uri, body })
        return response
      }
    }

    registerRequestListener(onReply)

    setTimeout(
      () => reject(error),
      timeout
    )
  })
}

function sign256(secret, timestamp) {
  return crypto
    .createHmac("sha256", secret)
    .update(timestamp + "\n" + secret)
    .digest("base64");
}

module.exports = {
  waitForRequest,
  sign256,
}
