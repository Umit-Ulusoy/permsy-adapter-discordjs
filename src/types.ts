import type { ChatInputCommandInteraction, Message } from "discord.js";

export type PrefixSource = {
  message: Message;
  commandName: string;
};

export type DiscordSource =
  | ChatInputCommandInteraction
  | PrefixSource
  | { kind: "slash"; interaction: ChatInputCommandInteraction }
  | { kind: "prefix"; message: Message; commandName: string };