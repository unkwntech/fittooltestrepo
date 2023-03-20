export default class Fit {
    public name: string;
    public type: string;
    public modules: { Name: string; ID: number; Slot: string }[];
    public cargo: { type: string; qty: number }[];
    public description: string;

    public constructor(json: any) {
        if (!json.name) throw new Error("Name is required for EFT_Fit");
        this.name = json.name;

        if (!json.type) throw new Error("Type is required for EFT_Fit");
        this.type = json.type;

        this.modules = json.modules;
        this.cargo = json.cargo;
        this.description = json.description;
    }

    public ToEFT(): string {
        let output = `[${this.type}, ${this.name}]\n`;

        output += "\n";

        for (let mod of this.modules) {
            output += `${mod.Name}\n`;
        }

        output += "\n";

        for (let c of this.cargo) {
            output += `${c.type} x${c.qty}\n`;
        }

        return output;
    }

    public ToXML(): string {
        let output = `<fitting name="${this.name}">\n`;

        if (this.description) {
            output += `<description value="${this.description}"/>\n`;
        }

        output += `<shipType value="${this.type}"/>\n`;

        const highSlots = this.modules.filter((m) => m.Slot == "high");
        for (let i = 0; i < highSlots.length; i++) {
            output += `<hardware slot="hi slot ${i}" type="${highSlots[i].Name}"/>\n`;
        }

        const midSlots = this.modules.filter((m) => m.Slot == "mid");
        for (let i = 0; i < midSlots.length; i++) {
            output += `<hardware slot="med slot ${i}" type="${midSlots[i].Name}"/>\n`;
        }

        const lowSlots = this.modules.filter((m) => m.Slot == "low");
        for (let i = 0; i < lowSlots.length; i++) {
            output += `<hardware slot="low slot ${i}" type="${lowSlots[i].Name}"/>\n`;
        }

        const rigSlots = this.modules.filter((m) => m.Slot == "rig");
        for (let i = 0; i < rigSlots.length; i++) {
            output += `<hardware slot="rig slot ${i}" type="${rigSlots[i].Name}"/>\n`;
        }

        for (let c of this.cargo) {
            output += `<hardware qty="${c.qty}" slot="cargo" type="${c.type}"/>\n`;
        }

        output += `</fitting>\n`;
        return output;
    }

    public static FromEFT(eft: string): Fit {
        eft = eft.replace(/\[Empty .*? slot\]/gi, "");
        let header = [
            ...eft.matchAll(/\[(?<type>.+?)\,\s+?(?<name>.+?)\]/gi),
        ][0].groups;
        if (!header) throw new Error("Input is malformed");

        eft = eft.replace(/\[(?<type>.+?)\,\s+?(?<name>.+?)\]/gi, "");

        let cargo = [...eft.matchAll(/(?<type>.*?)\s+x(?<qty>\d+)/gi)].map(
            (c) => {
                return { type: c.groups?.type, qty: c.groups?.qty };
            }
        );
        eft = eft.replace(/(?<type>.*?)\s+x(?<qty>\d+)/gi, "");

        let moduleList = require("../../data/modules.json");

        return new Fit({
            description: "",
            type: header.type,
            name: header.name,
            cargo: cargo,
            modules: eft
                .split("\r")
                .filter((m) => m.trim().length)
                .map((m) => {
                    let info = moduleList.find((l: any) => l.Name === m);
                    return {
                        Name: m,
                        Slot: info.Slot,
                        ID: info.ID,
                    };
                }),
        });
    }
}
