let config;

function readConfig() {
    if (!existsSync("./config.yaml")) {
        console.log("[SERVER] Config file not found");
        console.log("[SERVER] Creating config file");
        const config: any = {
            port: 8080,
            "server-password": "password",
            "allowed-users": [
                { user: "user1", password: "qazxsw" },
                { user: "user2", password: "wsxzaq" },
            ],
            private: true,
            "anyone-can-join": false,
            "max-users": 10,
            motd: "Welcome to the server",
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
    if ((config["anyone-can-join"] && config.private) || (!config["anyone-can-join"] && !config.private)) {
        console.log("[SERVER] Invalid config");
        console.log("[SERVER] Please edit the config file");
        process.exit(0);
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

const id = () => {
    return Crypto.randomBytes(4).toString("hex");
};

function getColor(hex?) {
    if (hex === undefined) {
        const red = Math.floor(Math.random() * 256);
        const green = Math.floor(Math.random() * 256);
        const blue = Math.floor(Math.random() * 256);
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

export { readConfig, getConfig, DateFormat, DateFormatJSON, id, getColor };
