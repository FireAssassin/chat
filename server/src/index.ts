import { WebSocketServer } from "ws";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { parse, stringify } from "yaml";
import * as Crypto from "crypto";
import { log, addHistory, getHistory } from "./log";

function readConfig() {
    if (!existsSync("./config.yaml")) {
        console.log("[SERVER] Config file not found");
        console.log("[SERVER] Creating config file");
        const config: any = {
            port: 8080,
            ServerPassword: "password",
            "allowed-users": [
                { user: "user1", password: "qazxsw" },
                { user: "user2", password: "wsxzaq" },
            ],
            private: true,
        };
        const file = stringify(config);
        writeFileSync("config.yaml", file);
        console.log("[SERVER] Config file created");
        console.log("[SERVER] Please edit the config file");
        process.exit(0);
    }
    const path = "./config.yaml";
    const file = readFileSync(path, "utf8");
    config = parse(file);
}

function DateFormat(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

/* function DateFormatJSON(date: Date) {
    const DateJSON = {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
    };
    return DateJSON;
} */

const id = () => {
    return Crypto.randomBytes(4).toString("hex");
};

function getColor(hex) {
    if (hex === undefined) {
        return { red: 0, green: 0, blue: 0, error: true };
    } else if (hex.length !== 7 && hex.length !== 6) {
        return { red: 0, green: 0, blue: 0, error: true };
    } else if (hex[0] === "#") {
        const red = parseInt(hex.substr(1, 2), 16);
        const green = parseInt(hex.substr(3, 2), 16);
        const blue = parseInt(hex.substr(5, 2), 16);
        return { red: red, green: green, blue: blue, error: false };
    } else if (hex[0] !== "#") {
        const red = parseInt(hex.substr(0, 2), 16);
        const green = parseInt(hex.substr(2, 2), 16);
        const blue = parseInt(hex.substr(4, 2), 16);
        return { red: red, green: green, blue: blue, error: false };
    }
}

const colors = [
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

let config;
readConfig();
let users: any = [];

const server = new WebSocketServer({ port: config.port });

server.once("listening", () => {
    console.log("[SERVER] Listening on port", config.port);
    log(new Date(), `[SERVER] Listening on port ${config.port}`);
});

server.on("connection", (socket, request) => {
    console.log("[SERVER] New connection (", request.socket.remoteAddress, ")");
    log(
        new Date(),
        `[SERVER] New connection (${request.socket.remoteAddress})`
    );
    socket.on("message", (raw) => {
        const message = JSON.parse(raw.toString());
        if (
            !config["allowed-users"].find((user) => user.user == message.user)
        ) {
            console.log(
                "[SERVER] Invalid user from",
                request.socket.remoteAddress
            );
            log(
                new Date(),
                `[SERVER] Invalid user from ${request.socket.remoteAddress}`
            );
            socket.send(
                JSON.stringify({ type: "error", message: "Invalid user" })
            );
            return;
        } else if (
            config.private &&
            message.ServerPassword != config.ServerPassword
        ) {
            console.log(
                "[SERVER] Invalid password from",
                request.socket.remoteAddress
            );
            log(
                new Date(),
                `[SERVER] Invalid password from ${request.socket.remoteAddress}`
            );
            socket.send(
                JSON.stringify({ type: "error", message: "Invalid password" })
            );
            return;
        } else {
            if (
                config["allowed-users"].find(
                    (user) => user.user == message.user
                ).password != message.UserPassword
            ) {
                console.log(
                    "[SERVER] Invalid password from",
                    request.socket.remoteAddress
                );
                log(
                    new Date(),
                    `[SERVER] Invalid password from ${request.socket.remoteAddress}`
                );
                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Invalid password",
                    })
                );
                return;
            }
            if (!users.find((user) => user.socket == socket)) {
                users.push({
                    id: id(),
                    socket: socket,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });
                console.log(
                    "[SERVER] Valid password from",
                    request.socket.remoteAddress
                );
                log(
                    new Date(),
                    `[SERVER] Valid password from ${request.socket.remoteAddress}`
                );
                socket.send(
                    JSON.stringify({
                        type: "success",
                        message: "Valid password",
                    })
                );
            }
            if (message.type == "message") {
                const message = JSON.parse(raw.toString());
                const date = DateFormat(new Date());
                const UserID = users.find((user) => user.socket == socket).id;
                const UserColor = users.find(
                    (user) => user.socket == socket
                ).color;
                const color = getColor(UserColor);
                const resetFormatString = `\x1b[0m`;
                const fgColorString = `\x1b[38;2;${color?.red};${color?.green};${color?.blue}m`;
                const ToSend = `${fgColorString}${date} [${message.user} ${UserID}] ${message.message}${resetFormatString}`;
                console.log(ToSend);
                log(new Date(), ToSend);
                addHistory(
                    new Date(),
                    message.user,
                    UserID,
                    message.message,
                    UserColor,
                    false
                );
                users.forEach((client) => {
                    if (client.socket == socket) {
                        client.socket.send(
                            JSON.stringify({
                                type: "message",
                                date: new Date(),
                                user: message.user,
                                id: UserID,
                                message: message.message,
                                color: UserColor,
                                self: true,
                            })
                        );
                    } else {
                        client.socket.send(
                            JSON.stringify({
                                type: "message",
                                date: new Date(),
                                user: message.user,
                                id: UserID,
                                message: message.message,
                                color: UserColor,
                                self: false,
                            })
                        );
                    }
                });
            } else if (message.type == "history") {
                getHistory().forEach((message) => {
                    socket.send(JSON.stringify(message));
                });
            }
        }
    });
    socket.on("close", () => {
        console.log(
            "[SERVER] Connection closed (",
            request.socket.remoteAddress,
            ")"
        );
        log(
            new Date(),
            `[SERVER] Connection closed (${request.socket.remoteAddress})`
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
