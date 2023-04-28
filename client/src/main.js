const webSocket = require("ws");
const fs = require("fs");
const yaml = require("yaml");
const readline = require("readline");

const resetFormatString = `\x1b[0m`;
let history = [];
let time = Date.now();
let config;
let typing = "";
let motd = "";

const prompt = readline.createInterface({
    input: process.stdin,
});

readline.emitKeypressEvents(process.stdin);

prompt.on("line", (_input) => {
    const input = typing;
    if (input[0] === "/") {
        const args = input.split(" ");
        client.send(
            JSON.stringify({
                user: config.user,
                "server-password": config["server-password"],
                password: config["password"],
                type: "command",
                arguments: args,
            })
        );
    } else {
        client.send(
            JSON.stringify({
                user: config.user,
                "server-password": config["server-password"],
                password: config["password"],
                type: "message",
                message: input,
            })
        );
    }
    render();
});

function readConfig() {
    if (!fs.existsSync("./config.yaml")) {
        console.log("Config file not found");
        console.log("Creating config file");
        const defaultConfig = {
            host: "localhost",
            port: 8080,
            password: "password",
            "server-password": "password",
            user: "user",
            SelfName: "You",
            SelfColor: "null",
            "date-format": "DD/MM/RRRR hh:mm:ss",
            sound: false,
        };
        const comments = [
            "# RRRR - year",
            "# MM - month",
            "# DD - day",
            "# hh - hour",
            "# mm - minute",
            "# ss - second",
        ];
        const yamlString = yaml.stringify(defaultConfig);
        //add comments to the end of the file
        const file = yamlString + comments.join("\r");

        fs.writeFileSync("./config.yaml", file);
        console.log("Config file created");
        process.exit(1);
    }
    const path = "./config.yaml";
    const file = fs.readFileSync(path, "utf8");
    config = yaml.parse(file);
}
readConfig();

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

function DateFormat(date) {
    date = new Date(date);
    const format = config["date-format"];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours =
        date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
    const minutes =
        date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    const seconds =
        date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();

    const formatted = format
        .replace("RRRR", year)
        .replace("MM", month)
        .replace("DD", day)
        .replace("hh", hours)
        .replace("mm", minutes)
        .replace("ss", seconds);

    return formatted;
}

const url = new URL(`ws:${config.host}:${config.port}`);
const client = new webSocket(url);

client.on("open", () => {
    console.log("Connected");
    client.send(
        JSON.stringify({
            type: "history",
            user: config.user,
            "server-password": config["server-password"],
            password: config["password"],
            limit: 500,
        })
    );
    client.send(
        JSON.stringify({
            type: "motd",
            user: config.user,
            "server-password": config["server-password"],
            password: config["password"],
        })
    )
});

client.on("pong", (data) => {
    const color = getColor("#c3ff00");
    console.log(
        `\x1b[38;2;${color.red};${color.green};${color.blue}m ${
            Date.now() - time
        }ms${resetFormatString}`
    );
});

client.on("message", (data) => {
    const message = JSON.parse(data.toString());
    switch (message.type) {
        case "history":
            history = message.history;
            render();
            break;

        case "message":
            history.push(message);
            render();
            break;

        case "error":
            console.log(message.error);
            client.terminate();
            process.exit(1);
            break;

        case "motd":
            motd = message.motd;
            break;
    }
});

client.on("close", () => {
    console.log("Disconnected");
    process.exit(1);
});

function sort(history) {
    history.sort((a, b) => {
        return a.date - b.date;
    });
    return history;
}

function renderInput() {
    const size = getSize();
    process.stdout.cursorTo(0, size[1] - 1);
    process.stdout.write("> " + typing);
}

function renderHistory() {
    const size = getSize();
    const maxHistory = size[1] - 5;
    const historyLength = history.length;

    const sortedHistory = sort(history);

    process.stdout.cursorTo(0, 2);
    process.stdout.clearScreenDown();

    for (let i = maxHistory; i >= 0; i--) {
        if (historyLength - i - 1 < 0) continue;

        const message = sortedHistory[historyLength - i - 1];
        let color = message.color;
        let name = message.user;
        if (message.self) {
            name = config.SelfName;
            const selfColor = getColor(config.SelfColor);
            if (!selfColor.error) color = selfColor;
        }
        let fgColorString = `\x1b[38;2;${color.red};${color.green};${color.blue}m`;
        const transmit = `${DateFormat(message.date)} ${name} [${
            message.id
        }]: ${message.message}`;

        process.stdout.write(
            `${fgColorString}${transmit}${resetFormatString}\n`
        );
    }
}

function getSize() {
    return process.stdout.getWindowSize();
}

function render() {
    const center = Math.floor((getSize()[0] - motd.length) / 2);
    clear()
    process.stdout.cursorTo(center, 0);
    process.stdout.write(motd);
    renderHistory();
    renderInput();
}

// while user is typing save it to 'typing'
process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
        client.terminate();
        process.exit(1);
    } else if (key.name === "backspace") {
        typing = typing.slice(0, -1);
    } else if (key.name === "return") {
        typing = "";
    } else {
        typing += str;
        renderInput();
    }
});

function clear() {
    process.stdout.cursorTo(0, 0);
    process.stdout.clearScreenDown();
}

setInterval(() => {
    render();
}, 1000);
