import * as fs from "fs";
import Fit from "./models/fit";
function parse(): any {
    let file = fs.readFileSync("./test.md").toString().split("\n");

    let buffer = "";

    let desc = "";
    for (let i = 0; i < file.length; i++) {
        if (!file[i].startsWith("##")) continue;
        if (file[i].toLowerCase().trim() == "## description") {
            i++;
            while (true) {
                if (file[i + 1].startsWith("##")) {
                    desc = buffer.trim();
                    buffer = "";
                    break;
                }
                buffer += `${file[i]}`;
                i++;
            }
        }

        if (file[i].toLowerCase().trim() == "## fit") {
            while (file[i].trim() !== "```") {
                i++;
                continue;
            }
            i++;
            while (true) {
                if (!file[i + 1] || file[i + 1].startsWith("##")) {
                    let fit = Fit.FromEFT(buffer);
                    if (desc) fit.description = desc;
                    return fit;
                }
                buffer += `${file[i]}`;
                i++;
            }
        }
    }
}

let fit: Fit = parse();

console.log(fit.ToEFT());
console.log(fit.ToXML());
