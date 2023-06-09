import { readFileSync, existsSync, writeFileSync } from "fs";
import { parse, stringify } from "yaml";
import * as Crypto from "crypto";

const colors: string[] = [
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

const id = () => {
    return Crypto.randomBytes(4).toString("hex");
};

const sendError = (ws, error) => {
    ws.send(
        JSON.stringify({
            type: "error",
            error: error,
        })
    );
    ws.close();
};

const joined = (user: string, server, serverColor) => {
    const message = JSON.stringify({
        type: "message",
        user: "Server",
        id: "@@@@@@",
        message: `${user} joined`,
        color: getColor(serverColor),
        date: new Date().getTime(),
    });
    server.clients.forEach((client) => {
        client.send(message);
    });
};

const left = (user: string, server, serverColor) => {
    const message = JSON.stringify({
        type: "message",
        user: "Server",
        id: "@@@@@@",
        message: `${user} left`,
        color: getColor(serverColor),
        date: new Date().getTime(),
    });
    server.clients.forEach((client) => {
        client.send(message);
    });
};

function readConfig() {
    if (!existsSync("./config.yaml")) {
        console.log("[SERVER] Config file not found");
        console.log("[SERVER] Creating config file");
        const config: any = {
            port: 3525,
            "server-password": "password",
            "allowed-users": [
                { user: "user1", password: "qazxsw" },
                { user: "user2", password: "wsxzaq" },
            ],
            private: true,
            "anyone-can-join": false,
            "max-users": 10,
            motd: "Welcome to the server",
            "server-color": "#00FF00",
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
    if (
        (!config["anyone-can-join"] && !config.private) ||
        config["max-users"] < 1 ||
        config["max-users"] > 100
    ) {
        console.log("[SERVER] Invalid config");
        console.log("[SERVER] Please edit the config file");
        process.exit(0);
    }
    // ! Check if allowed users doesn't have the same user
    const users = [];
    for (const user of config["allowed-users"]) {
        if (users.includes(user.user)) {
            console.log("[SERVER] Invalid config");
            console.log("[SERVER] Please edit the config file");
            process.exit(0);
        }
        users.push(user.user);
    }
    if (config.motd === undefined) {
        config.motd = "Welcome to the server";
    }
    if (config["port"] === undefined) {
        config["port"] = 3525;
    }
}

function getConfig() {
    return config;
}

function DateFormat(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function DateFormatJSON(date: Date) {
    const DateJSON = {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
    };
    return DateJSON;
}

function getColor(hex?) {
    if (hex === undefined) {
        const random = Math.floor(Math.random() * colors.length);
        const color = colors[random];
        const red = parseInt(color.substr(1, 2), 16);
        const green = parseInt(color.substr(3, 2), 16);
        const blue = parseInt(color.substr(5, 2), 16);
        return { red: red, green: green, blue: blue, error: false };
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

export {
    id,
    sendError,
    joined,
    left,
    readConfig,
    getConfig,
    DateFormat,
    DateFormatJSON,
    getColor,
};
