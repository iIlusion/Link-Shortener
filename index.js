import {
    Extension,
    HDirection,
    HPacket,
  } from "gnode-api";
import axios from 'axios'

  const extensionInfo = {
    name: "Link Shortener",
    description: "shortens your chat links using abre.ai",
    version: "0.1",
    author: "Lxx",
  };

  const ext = new Extension(extensionInfo);

  process
  .on("unhandledRejection", (reason, p) => {
    ext.writeToConsole(
      `${reason.toString()} Unhandled Rejection at Promise ${p.toString()}`
    );
  })
  .on("uncaughtException", (err) => {
    ext.writeToConsole(`${err.toString()} Uncaught Exception thrown`);
  });

ext.run();

ext.interceptByNameOrHash(HDirection.TOSERVER, 'Chat', (hMessage) => {
  let hPacket = hMessage.getPacket()
  let message = hPacket.readString();

  if (message.startsWith("!")) {
    hMessage.setBlocked(true);

    if (message.startsWith("!short")) {
      shorten(message.replace("!short", ''))
    }
  }
})

  async function shorten(message) {

    let url = detectURLs(message)
    let shortenedUrl = await axios.post('https://abre.ai/_/generate', {
      "url_translation": {
        "url": "https://www.youtube.com/watch?v=K_A-CpRbcGM",
        "token": ""
      }
    },
    {headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({url_translation: {url: url, token: ''} })
  })
    .then((response) => response.data.data.attributes.shortenedUrl.replace(/(^\w+:|^)\/\//, ''))
    .catch((error) => console.log(error.response))

    let newMessage = message.replace(url, shortenedUrl.replace(".", " "))

    let messagePacket = new HPacket(`{out:Chat}{s:"${newMessage}"}{i:0}{i:0}`)
    ext.sendToServer(messagePacket)

  }

  function detectURLs(message) {
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return message.match(urlRegex)
  }