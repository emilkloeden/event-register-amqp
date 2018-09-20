/**
# Event Register AMQP

A single file express server that expects to receive a json
representation of an `event` (an object with two properties:
type: string
data: object
via an HTTP POST request.

It then sends the event onto a RabbitMQ fanout exchange called "books" - this could stand refactoring

It's intended purpose is to be used in the "books" project (github.com/emilkloeden/books) as
part of the book upload and conversion pipeline

By default it listens on port 7000 and expects to find RabbitMQ
at localhost:5672.

 */
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const amqp = require("amqplib/callback_api");

const port = process.env.PORT || 7000;
const amqpURL = process.env.AMQP_URL || "amqp://localhost:5672";

const app = express();

app.use(logger("dev"));
app.use(bodyParser.json());

const handleChannelCreation = (err, ch) => {
  if (err) {
    console.error(`Error creating channel: ${err}`);
  }

  ch.assertExchange("books", "fanout", { durable: false });

  app.post("/", registerEvent(ch));

  app.listen(port, () =>
    console.log(`event-register-amqp server running on ${port}`)
  );
};

const registerEvent = ch => (req, res) => {
  try {
    // If either `type` or `data` not present, it's a Bad Request
    if (!(req.body.type && req.body.data)) {
      return res.sendStatus(400);
    }
    // Convert to a buffer and only send `type` and `data` properties to RabbitMQ
    const { type, data } = req.body;
    const e = Buffer.from(JSON.stringify({ type, data }));

    // Publish event on books exchange
    ch.publish("books", "", e);

    // Return 200:OK
    return res.sendStatus(200);
  } catch (err) {
    // An error occurred creating or publishing the event, that's on us.
    console.error(`Error in processing request: ${err}`);
    return res.sendStatus(500);
  }
};

amqp.connect(
  amqpURL,
  (err, conn) => {
    if (err) {
      // If we error out here, we might as well quit
      console.error(`Error in connecting to RabbitMQ: ${err}`);
      process.exit(1);
    }
    conn.createChannel(handleChannelCreation);
  }
);
