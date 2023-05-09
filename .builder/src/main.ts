import * as fs from "fs";
import Fit, { InvalidModuleError } from "./models/fit";
import {Glob, glob} from 'glob';
import axios from 'axios';

require("dotenv").config();

const date: string = (process.argv[3] as string);

function parseFile(filename: string, absolutePath: boolean = false): [boolean, Fit] {
    console.log(`parsing '${filename}'`);
    let path: string;

    if(absolutePath)
        path = filename;
    else
        path = `${process.cwd()}/${filename}`;

    let file = fs
        .readFileSync(path)
        .toString()
        .split("\n");

    const descSecStart = file.findIndex(line => line.toLowerCase().trim() === "## description");
    const descSecEnd = file.slice(descSecStart +1).findIndex(line => line.trim().startsWith("##"))
    const desc = file.slice(descSecStart + 1, descSecEnd + descSecStart).join("\n");
    
    const fitSecStart = file.findIndex(line => line.toLowerCase().trim() === "## fit");
    const codeblockStart = file.slice(fitSecStart).findIndex(line => line.trim() === "```");
    const codeblockEnd = file.slice(codeblockStart + fitSecStart + 1).findIndex(line => line.trim() === "```");
    
    const fitText = file.slice(codeblockStart + fitSecStart + 1, codeblockStart + fitSecStart + codeblockEnd + 1).join("\n");
    
    try{
        const fit = Fit.FromEFT(fitText);
        if(desc.trim().length > 0) fit.description = desc.trim();
        return [true, fit];
    } catch(e) {
        if(e instanceof InvalidModuleError) return [false, {} as Fit];
        else throw e;
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
        let [status, fit] = parseFile(file.trim());
        if(status) fits.push(fit);
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
        let [status, fit] = parseFile(file.fullpath(), true);
        if(status) fits.push(fit);
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
