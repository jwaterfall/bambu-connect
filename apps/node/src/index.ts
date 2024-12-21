import dotenv from "dotenv";
import { createLogger, format, transports } from "winston";
import http from "http";
import { Server } from "socket.io";
import { Command, Printer } from "@repo/interface";
import { Bambulab, BambulabModel } from "./adapters/bambulab";

dotenv.config();

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const adapters = [
  new Bambulab(
    {
      host: "192.168.1.21",
      token: "93994527",
      serial: "0309BA3A1600040",
      name: "Jack's A1 Mini",
      model: BambulabModel.A1Mini,
    },
    onStateChange,
    logger
  ),
  new Bambulab(
    {
      host: "192.168.1.15",
      token: "31106685",
      serial: "03919C460100470",
      name: "Jack's A1",
      model: BambulabModel.A1,
    },
    onStateChange,
    logger
  ),
];

function getPrinters(): Printer[] {
  return adapters
    .map((adapter) => adapter.getPrinter())
    .filter((printer) => printer !== null);
}

function onStateChange() {
  io.emit("printers", getPrinters());
}

io.on("connection", (socket) => {
  logger.info("Client connected");

  // Send the initial state to the client
  socket.emit("printers", getPrinters());

  socket.on("command", (command: Command) => {
    logger.info("Received command", command);

    const adapter = adapters.find(
      (adapter) => adapter.id === command.printerId
    );

    if (!adapter) {
      logger.error("Printer not found", command.printerId);
      return;
    }

    adapter.handleCommand(command);
  });

  socket.on("disconnect", () => {
    logger.info("Client disconnected");
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
