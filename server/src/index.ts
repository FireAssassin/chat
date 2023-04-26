import { WebSocketServer } from "ws";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { parse, stringify } from "yaml";
import * as Crypto from "crypto";
import { log, addHistory, getHistory } from "./log";
import { readConfig, getConfig, DateFormat, id, getColor } from "./usefull";

type user = {
    id: string;
    user: string;
    socket: Socket;
    color: string;
};

type data = {
    type: "message" | "history";
    user: user;
    message: string;
    "server-password"?: string;
    password?: string;
};

type color = {
    hex: `#${string}`;
};

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
        // ! Check if server is full
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

        // ! Handle data
        try {
            const data = JSON.parse(raw.toString());

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
                    }

                    let user = users.find((user) => user.socket == socket);

                    handle(user, data);

                    return;
                } else {
                    socket.send(
                        JSON.stringify({
                            type: "error",
                            message: "Invalid username",
                        })
                    );
                    socket.close();
                    return;
                }
            }

            // * Check if server is private
            if (config.private) {
                // ! Check if user send correct server password
                if (data["server-password"] != config["server-password"]) {
                    socket.send(
                        JSON.stringify({
                            type: "error",
                            message: "Invalid server password",
                        })
                    );
                    socket.close();
                    return;
                }

                // * Check if user is logged in
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
                } else {
                    socket.send(
                        JSON.stringify({
                            type: "error",
                            message: "Invalid username or password",
                        })
                    );
                    socket.close();
                    return;
                }
                let user = users.find((user) => user.socket == socket);

                handle(user, data);

                return;
            
            // * When server is not private (meaning server password is not required)
            } else {
                // * Check if user is logged in
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
                    } else {
                        socket.send(
                            JSON.stringify({
                                type: "error",
                                message: "Invalid username or password",
                            })
                        );
                        socket.close();
                        return;
                    }
                }

                let user = users.find((user) => user.socket == socket);
                handle(user, data);
                return;
            }
        } catch (error) {
            // ! Handle errors
            socket.send(
                JSON.stringify({
                    type: "error",
                    message:
                        "Invalid message format. If you tried to crash the server, you failed :D",
                })
            );
            socket.close();
            return;
        }
    });
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

function handle(req: user, data: data) {
    switch (data.type) {
        case "history": {
            req.socket.send(
                JSON.stringify({
                    type: "history",
                    history: getHistory(),
                })
            );
        }
        case "message": {
            if (data.message.length > 0) {
        
            }
        }
    }
}
