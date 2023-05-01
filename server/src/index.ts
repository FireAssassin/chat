import { WebSocketServer, WebSocket } from "ws";
import { addHistory, getHistory } from "./log";
import { Calculate } from "./calc";
import {
    id,
    sendError,
    joined,
    left,
    readConfig,
    getConfig,
    DateFormat,
    getColor,
} from "./usefull";

type user = {
    id: string;
    user: string;
    socket: WebSocket;
    color: color;
};

type data = {
    type: "message" | "history" | "error" | "motd" | "command";
    user: string;
    message: string;
    "server-password"?: string;
    password?: string;
    limit?: number;
    arguments?: string[];
};

type color = {
    red: number;
    green: number;
    blue: number;
    error: boolean;
};

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
        // ! Check if server is full
        if (users.length >= config["max-users"]) {
            sendError(socket, "Server is full!");
            return;
        }

        // ! Handle data
        try {
            const data = JSON.parse(raw.toString());

            // * Check if server is private
            if (config.private) {
                // ! Check if user send correct server password
                if (data["server-password"] != config["server-password"]) {
                    sendError(socket, "Invalid server password");
                    return;
                }
            }

            // * Check if anyone can join is enabled
            if (config["anyone-can-join"]) {
                if (data.user.match(/[^a-zA-Z0-9]/g)) {
                    if (!users.find((user) => user.socket == socket)) {
                        users.push({
                            id: id(),
                            user: data.user,
                            socket: socket,
                            color: getColor(),
                        });
                        joined(data.user, server.clients, config["server-color"]);
                        addHistory(
                            new Date().getTime(),
                            "Server",
                            "@@@@@@",
                            `${data.user} joined`,
                            getColor(config["server-color"]),
                        )
                    }
                    let user = users.find((user) => user.socket == socket);
                    handle(user, data);
                } else sendError(socket, "Invalid username");
                return;
            }

            if (!users.find((user) => user.socket == socket)) {
                // * Login
                if (
                    config["allowed-users"].find(
                        (user) =>
                            user.user == data.user &&
                            user.password == data.password
                    )
                ) {
                    users.push({
                        id: id(),
                        user: data.user,
                        socket: socket,
                        color: getColor(),
                    });
                    joined(data.user, server, config["server-color"]);
                    addHistory(
                        new Date().getTime(),
                        "Server",
                        "@@@@@@",
                        `${data.user} joined`,
                        getColor(config["server-color"]),
                    )
                } else {
                    sendError(socket, "Invalid username or password");
                    return;
                }
            }

            let user = users.find((user) => user.socket == socket);
            handle(user, data);
            return;
        } catch (error) {
            // ! Handle errors
            console.log("[SERVER] Error:", error);
            sendError(
                socket,
                "Invalid message format. If you tried to crash the server, you failed :D"
            );
            return;
        }
    });
    socket.on("close", () => {
        console.log(
            `[SERVER] Connection closed (${request.socket.remoteAddress})`
        );
        left(users.find((user) => user.socket == socket).user, server, config["server-color"]);
        addHistory(
            new Date().getTime(),
            "Server",
            "@@@@@@",
            `${users.find((user) => user.socket == socket).user} left`,
            getColor(config["server-color"]),
        )
        users = users.filter((user) => user.socket != socket);
    });
});

server.on("close", () => {
    console.log("[SERVER] Closed");
});

server.on("error", (error) => {
    console.log("[SERVER] Error:", error);
});

function handle(req: user, data: data) {
    switch (data.type) {
        case "history":
            req.socket.send(
                JSON.stringify({
                    type: "history",
                    history: getHistory(data.limit),
                })
            );
            break;

        case "motd":
            req.socket.send(
                JSON.stringify({
                    type: "motd",
                    motd: config.motd,
                })
            );
            break;

        case "command":
            if (data.arguments.length > 0) {
                switch (data.arguments[0]) {
                    case "/help":
                        req.socket.send(
                            JSON.stringify({
                                type: "message",
                                user: "Server",
                                id: "@@@@@@",
                                message: "Commands: /help, /calc",
                                color: getColor(config["server-color"]),
                                date: new Date().getTime(),
                            })
                        );
                        break;

                    case "/calc":
                        const result = Calculate(data.arguments[1]);
                        addHistory(
                            new Date().getTime(),
                            "Server",
                            "@@@@@@",
                            `${data.arguments[1]} = ${result}`,
                            getColor(config["server-color"])
                        );
                        server.clients.forEach((client) => {
                            client.send(
                                JSON.stringify({
                                    type: "message",
                                    user: "Server",
                                    id: "@@@@@@",
                                    message: `${data.arguments[1]} = ${result}`,
                                    color: getColor(config["server-color"]),
                                    date: new Date().getTime(),
                                })
                            );
                        });
                        break;
                }
            }
            break;

        case "message":
            if (data.message.length > 0) {
                const time = new Date().getTime();
                addHistory(time, data.user, req.id, data.message, req.color);
                users.forEach((user) => {
                    const self = user.socket == req.socket;
                    user.socket.send(
                        JSON.stringify({
                            type: "message",
                            user: data.user,
                            id: req.id,
                            message: data.message,
                            color: req.color,
                            date: time,
                            self: self,
                        })
                    );
                });
                break;
            }
    }
}
