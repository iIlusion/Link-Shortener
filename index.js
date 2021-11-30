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

ext.interceptByNameOrHash(HDirection.TOSERVER, 'Chat', async (hMessage) => {
  let hPacket = hMessage.getPacket()
  let message = hPacket.readString();

  if (detectURLs(message)) {
    hMessage.setBlocked(true)
    shorten(message)
  }
})

  async function shorten(message) {

    let url = detectURLs(message)
    if (!url) return
    let shortenedUrl = await axios.post('https://abre.ai/_/generate', {
      "url_translation": {
        "url": url[0],
        "token": ""
      }
    },
    {headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
    .then((response) => response.data.data.attributes.shortenedUrl.replace(/(^\w+:|^)\/\//, ''))
    .catch((error) => createMessage(error.response.data.errors))

    let newMessage = message.replace(url, `\`${shortenedUrl.replace(".", " ")}\``)

    let messagePacket = new HPacket(`{out:Chat}{s:"${newMessage}"}{i:0}{i:0}`)
    ext.sendToServer(messagePacket)

  }

  function detectURLs(message) {
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return message.match(urlRegex)
  }

  async function createMessage(text) {
    let messagePacket = new HPacket(
      `{in:NotificationDialog}{s:""}{i:3}{s:"display"}{s:"BUBBLE"}{s:"message"}{s:"${text}"}{s:"image"}{s:"https://raw.githubusercontent.com/sirjonasxx/G-ExtensionStore/repo/1.5.1/store/extensions/ListeningMotto/icon.png"}`
    );
    ext.sendToClient(messagePacket);
  }