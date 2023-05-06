import * as fs from "fs";
import Fit from "./models/fit";
function parse(filename: string): any {
    console.log(`parsing '${filename}'`);
    let file = fs
        .readFileSync(`${process.cwd()}/${filename}`)
        .toString()
        .split("\n");

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
                buffer += `${file[i].trim()}\n`;

                if (file[i + 1] === "```") {
                    let fit = Fit.FromEFT(buffer);

                    if (desc) fit.description = desc;
                    
                    return fit;
                }
                
                i++;
            }
        }
    }
}

function main(): void {
    let date = new Date().toISOString().split("T")[0]

    console.log(`arg len ${process.argv.length}`);
    console.log(process.argv);

    //Build Diff
    const fits = [];
    let changedFiles = fs
        .readFileSync(`${process.cwd()}/fits`)
        .toString()
        .split("\n");
    
    for (let file of changedFiles) {
        if (!file.startsWith("Fits")) continue;
        fits.push(parse(file.trim()));
    }

    if(fits.length == 0) console.log("No new fits.");

    let diff = `<?xml version="1.0" ?>\n\t<fittings>`;

    diff += fits.map(f => f.ToXML()).join("\n");

    diff += `\t</fittings>`;

    let filename = `.builder/${date}.diff.xml`;

    if(fs.existsSync(filename)) {

    }

    fs.writeFileSync(filename, diff);

    //travcerse ./Fits/**/*



    fs.writeFileSync(filename, diff);

}

main();
