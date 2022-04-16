const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 4000;
const twilio = require("twilio");

app.use(cors());
app.use(express.json());

//Send SMS
app.post("/sms/send", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    const client = new twilio(
      "ACd7762d947ec45b73ef8d81af705632d8",
      "1bebc17e27e1c10c8e580a37269cf369"
    );
    const message_id = [];
    for (number of receiver) {
      await client.messages
        .create({
          body: message,
          to: number,
          from: sender,
        })
        .then((message) => {
          console.log(message);
          if (message.sid) {
            message_id.push(message.sid);
          }
        });
    }
    res.json({
      status: 200,
      message: "Message Sent Successfully",
      messageIds: message_id,
    });
  } catch (error) {
    console.log(error);
    res.json({ status: 400, message: "Message Sent Failed!" + " " + error.message, code: error.code });
  }
});

app.get("/", (req, res) => {
  res.send("SMS Sender Application Server");
});

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
