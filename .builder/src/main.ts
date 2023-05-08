import * as fs from "fs";
import Fit, { InvalidModuleError } from "./models/fit";
import {Glob, glob} from 'glob';
import axios from 'axios';

require("dotenv").config();

const date: string = (process.argv[3] as string);

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
                    let fit: Fit = {} as Fit;
                    try {
                        fit = Fit.FromEFT(buffer);

                    if (desc) fit.description = desc;

                    return fit;
                    
                    } catch(e) {
                        if(e instanceof InvalidModuleError) break;
                    }
                }
                
                i++;
            }
        }
    }
}

async function main(): Promise<void> {
    const hash = (process.argv[2] as string);
    const webhook = (process.env.WEBHOOK_URL as string);
    //Build Diff
    let fits: Fit[] = [];
    let changedFiles = fs
        .readFileSync(`${process.cwd()}/fits`)
        .toString()
        .split("\n");
    
    for (let file of changedFiles) {
        if (!file.startsWith("Fits")) continue;
        let fit = parse(file.trim());
        if(fit) fits.push(fit);
    }

    axios.post(webhook, {content: JSON.stringify(changedFiles)});

    if(fits.length == 0) console.log("No new fits.");

    let diff = `<?xml version="1.0" ?>\n\t<fittings>\n`;

    diff += fits.map(f => f.ToXML(date)).join("\n");

    diff += `\t</fittings>`;

    let filename = `.builder/${date}-${hash}`;

    fs.writeFileSync(`${filename}.diff.xml`, diff);

    fits = [];

    //traverse ./Fits/**/*
    for(let file of await glob(`${process.cwd()}/Fits/**/*.md`, {withFileTypes: true})) {
        let fit = parse(file.fullpath());
        if(fit) fits.push(fit);
    }
    // for (let file of getFilesFromDir('${process.cwd()}/../Fits/')) {
    //     if (!file.startsWith("Fits")) continue;
    //     let fit = parse(file.trim());
    //     if(fit) fits.push(fit);
    // }
    
    let full = `<?xml version="1.0" ?>\n\t<fittings>\n`;

    full += fits.map(f => f.ToXML(date)).join("\n");

    full += `\t</fittings>`;

    fs.writeFileSync(`${filename}.full.xml`, full);

}

function getFilesFromDir(path: string): string[] {
    let files: string[] = [];

    let dir = fs.opendirSync(path);

    let item;
    while(item = dir.readSync()) {
        if(item.isDirectory()) files.push(...getFilesFromDir(`${path}${item.name}`))
        else files.push(`${path}${item.name}`)
    }

    return files;
}

main();
