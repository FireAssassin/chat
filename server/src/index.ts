import { WebSocketServer } from "ws";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { parse, stringify } from "yaml";
import * as Crypto from "crypto";
import { log, addHistory, getHistory } from "./log";
import { readConfig, getConfig, DateFormat, id, getColor } from "./usefull";

type user = {
    id: string,
    user: string,
    socket: Socket,
    color: string,
}

type color = {
    hex: `#${string}`,
}

const colors: color[] = [
    "#fa2d2d",
    "#fa4b00",
    "#ffbb00",
    "#c3ff00",
    "#7bff00",
    "#1eff00",
    "#00ffc3",
    "#00d5ff",
    "#0073ff",
    "#002fff",
    "#6f00ff",
    "#b300ff",
    "#ff0084",
    "#ff0051",
];

readConfig();
let config = getConfig();
let users: user[] = [];

const server = new WebSocketServer({ port: config.port });

server.once("listening", () => {
    console.log("[SERVER] Listening on port", config.port);
});

server.on("connection", (socket, request) => {
    console.log(`[SERVER] New connection (${request.socket.remoteAddress})`);

    socket.on("ping", () => {
        socket.pong();
    });

    socket.on("message", (raw) => {
        if (users.length >= config["max-users"]) {
            socket.send(
                JSON.stringify({
                    type: "error",
                    message: "Server is full",
                })
            );
            socket.close();
            return;
        }

        try {
            const data = JSON.parse(raw.toString());

            if (config["anyone-can-join"]) {
                return;
            }
            if (config.private) {
                return;
            }
        }

        catch (error) {
            socket.send(
                JSON.stringify({
                    type: "error",
                    message: "Invalid message format. If you tried to crash the server, you failed :D",
                })
            )
            socket.close();
            return;
        }
    })
    socket.on("close", () => {
        console.log(
            "[SERVER] Connection closed (",
            request.socket.remoteAddress,
            ")"
        );
        users = users.filter((user) => user.socket != socket);
    });
});

server.on("close", () => {
    console.log("[SERVER] Closed");
    log(new Date(), `[SERVER] Closed`);
});

server.on("error", (error) => {
    console.log("[SERVER] Error:", error);
    log(new Date(), `[SERVER] Error: ${error}`);
});
