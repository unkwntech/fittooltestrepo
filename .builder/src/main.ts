import * as fs from "fs";
import Fit from "./models/fit";
function parse(filename: string): any {
    let file = fs.readFileSync(`../../${filename}`).toString().split("\n");

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

// let fit: Fit = parse();

// console.log(fit.ToEFT());
// console.log(fit.ToXML());

function main(): void {
    console.log(__dirname);
    console.log(process.cwd());
    //console.log(process.argv[2]);
    let changedFiles = fs.readFileSync(`../../test`).toString().split("\n");
    for(let i = 0; i < changedFiles.length; i++) {
        console.log(`${i} - ${changedFiles[i].trim()}`);
        console.log(parse(changedFiles[i].trim()).ToXML());
    }
}



main();