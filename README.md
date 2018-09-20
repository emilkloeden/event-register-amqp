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
