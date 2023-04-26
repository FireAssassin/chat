import { appendFile } from "fs";

/* const ToLog: any[] = []; */
const history: any[] = [];

/* function log(date: Date, message: string) {
    ToLog.push({
        date: date,
        message: message,
    });
} */

function getHistory(limit = 100) {
    return history.slice(-limit);
}

function addHistory(
    date: Date,
    user: string,
    id: string,
    message: string,
    color: string,
) {
    history.push({
        type: "message",
        date: date,
        user: user,
        id: id,
        message: message,
        color: color,
        self: false,
    });
}

/* setInterval(() => {
    if (ToLog.length > 0) {
        appendFile("log.txt", JSON.stringify(ToLog), (err) => {
            if (err) {
                console.log(err);
            }
        });
        ToLog.length = 0;
    }
}, 10000); */

export { /* log, */ getHistory, addHistory };
