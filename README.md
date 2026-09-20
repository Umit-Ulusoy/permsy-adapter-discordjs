# @permsy/adapter-discordjs

Discord.js adapter for the Permsy permission management engine.

This adapter bridges Discord.js events (Slash Commands and Prefix Messages) with Permsy, allowing you to run role and permission checks in your Discord bots.

---

## Features

* Dual Event Support: Native handling for both Slash Commands (ChatInputCommandInteraction) and traditional Prefix Commands (Message).
* Discord.js v14 Ready: Automatically extracts computed user permissions and roles using Discord.js v14 standards.
* TypeScript Support: Built with TypeScript, providing full type safety out of the box.

---

## Installation

Install @permsy/adapter-discordjs:

npm install @permsy/adapter-discordjs

Note: This package requires permsy and discord.js to be installed in your project

---

## Quick Start

1. Initialize Permsy with the Adapter

import { Permsy } from "permsy";
import { DiscordJsAdapter } from "@permsy/adapter-discordjs";

const adapter = new DiscordJsAdapter();

const permsy = new Permsy({
adapter,
configDir: "./",
fileName: "permsy.config.js"
});

2. Usage with Slash Commands

Pass the interaction object directly as the source when handling slash commands:

client.on("interactionCreate", async (interaction) => {
if (!interaction.isChatInputCommand()) return;

const isAllowed = await permsy.isAllowed(interaction);

if (!isAllowed) return;

//
});

3. Usage with Prefix Commands

Pass the message alongside the resolved commandName:

client.on("messageCreate", async (message) => {
if (message.author.bot || !message.content.startsWith("!")) return;

const args = message.content.slice(1).trim().split(/ +/);
const commandName = args.shift()?.toLowerCase();

if (!commandName) return;

const isAllowed = await permsy.isAllowed({
message,
commandName,
});

if (!isAllowed) return;

//
});

---

## License

MIT © Ümit ULUSOY