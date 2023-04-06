const webSocket = require("ws");
const fs = require("fs");
const yaml = require("yaml");
const readline = require("readline");
const calculate = require("../commands/calc.js");

const prompt = readline.createInterface({
    input: process.stdin,
});

prompt.on("line", (input) => {
    if (input[0] === "/") {
        command(input);
    } else {
        client.send(
            JSON.stringify({
                user: config.user,
                ServerPassword: config.ServerPassword,
                UserPassword: config.UserPassword,
                type: "message",
                message: input,
            })
        );
    }
});

const resetFormatString = `\x1b[0m`;
let time = Date.now();
let config;

function command(input) {
    const args = input.split(" ");
    switch (args[0]) {
        case "/help":
            const commands = [];
            console.log(
                "Available commands: \n" +
                    "/help - shows this message \n" +
                    "/exit - exits the program \n" +
                    "/ping - pings the server \n" +
                    "/stats - shows clients usage stats \n" +
                    "/calc - calculates a math expression"
            );
            break;
        case "/ping":
            time = Date.now();
            client.ping();
            break;
        case "/stats":
            const color = getColor("#fa2d2d");
            const stats = [];
            stats.push(`Uptime: ${process.uptime()}`);
            stats.push(`Memory usage: ${process.memoryUsage().heapUsed}`);
            stats.push(`Platform: ${process.platform}`);
            stats.push(`Architecture: ${process.arch}`);
            console.log(
                `\x1b[38;2;${color.red};${color.green};${
                    color.blue
                }m ${stats.join("\n")}${resetFormatString}`
            );
            break;
        case "/exit":
            process.exit(0);
            break;
    }
}

function readConfig() {
    if (!fs.existsSync("./config.yaml")) {
        console.log("Config file not found");
        console.log("Creating config file");
        const defaultConfig = {
            host: "localhost",
            port: 8080,
            UserPassword: "password",
            ServerPassword: "password",
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
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formatted = format
        .replace("RRRR", year)
        .replace("MM", month)
        .replace("DD", day)
        .replace("hh", hours)
        .replace("mm", minutes)
        .replace("ss", seconds);

    return formatted;
}

function FormatMessage(input) {
    if (input.type === "message") {
        const color = getColor(input.color);
        const selfColor = getColor(config.SelfColor);
        if (input.self === true && selfColor.error === false) {
            let fgColorString = `\x1b[38;2;${selfColor.red};${selfColor.green};${selfColor.blue}m`;
            const message = `${DateFormat(input.date)}${config.SelfName}[${
                input.id
            }]: ${input.message}`;
            return `${fgColorString}${message}${resetFormatString}`;
        } else if (input.self === true && selfColor.error === true) {
            let fgColorString = `\x1b[38;2;${color.red};${color.green};${color.blue}m`;
            const message = `${DateFormat(input.date)} ${config.SelfName} [${
                input.id
            }]: ${input.message}`;
            return `${fgColorString}${message}${resetFormatString}`;
        } else {
            let fgColorString = `\x1b[38;2;${color.red};${color.green};${color.blue}m`;
            const message = `${DateFormat(input.date)} ${input.user} [${
                input.id
            }]: ${input.message}`;
            return `${fgColorString}${message}${resetFormatString}`;
        }
    } else if (input.type === "success") {
        return input.message;
    } else if (input.type === "error") {
        client.terminate();
        return input.message;
    }
}

const url = new URL(`ws:${config.host}:${config.port}`);
const client = new webSocket(url);

client.on("open", () => {
    console.log("Connected");
    client.send(
        JSON.stringify({
            type: "history",
            user: config.user,
            ServerPassword: config.ServerPassword,
            UserPassword: config.UserPassword,
        })
    );
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
    console.log(FormatMessage(message));
});

client.on("close", () => {
    console.log("Disconnected");
});
