import {
  ChatInputCommandInteraction,
  Message,
  PermissionsBitField,
  GuildMember,
} from "discord.js";
import type { AdapterContext, BaseAdapter } from "permsy";
import type { PrefixSource } from "./types";

export class DiscordJsAdapter implements BaseAdapter {
  private isInteraction(source: unknown): source is ChatInputCommandInteraction {
    return (
      typeof source === "object" &&
      source !== null &&
      "isChatInputCommand" in source &&
      typeof (source as ChatInputCommandInteraction).isChatInputCommand === "function" &&
      (source as ChatInputCommandInteraction).isChatInputCommand()
    );
  }

  private extractFromInteraction(
    interaction: ChatInputCommandInteraction
  ): AdapterContext {
    const member = interaction.member as GuildMember | null;

    const roles = Array.isArray(member?.roles)
      ? member.roles
      : member?.roles?.cache?.map((role) => role.id) ?? [];

    const permissions =
      member?.permissions instanceof PermissionsBitField
        ? member.permissions.toArray()
        : [];

    return {
      type: "slash",
      userId: interaction.user.id,
      commandName: interaction.commandName,
      channelId: interaction.channelId,
      roles,
      permissions,
    };
  }

  private extractFromMessage(
    message: Message,
    commandName: string
  ): AdapterContext {
    const member = message.member;

    const roles = member?.roles?.cache?.map((role) => role.id) ?? [];
    const permissions =
      member?.permissions instanceof PermissionsBitField
        ? member.permissions.toArray()
        : [];

    return {
      type: "prefix",
      userId: message.author.id,
      commandName,
      channelId: message.channelId,
      roles,
      permissions,
    };
  }

  resolveContext = async (source: unknown): Promise<AdapterContext> => {
    if (!source || typeof source !== "object") {
      throw new Error(
        "[permsy-djs-adapter] Invalid 'source': expected an object."
      );
    }

    // 1. Direct Slash Interaction
    if (this.isInteraction(source)) {
      return this.extractFromInteraction(source);
    }

    // 2. Explicit { kind } Structure
    if ("kind" in source) {
      const wrapped = source as
        | { kind: "slash"; interaction: ChatInputCommandInteraction }
        | { kind: "prefix"; message: Message; commandName: string };

      if (wrapped.kind === "slash") {
        return this.extractFromInteraction(wrapped.interaction);
      }
      if (wrapped.kind === "prefix") {
        return this.extractFromMessage(wrapped.message, wrapped.commandName);
      }
    }

    // 3. Compact Prefix Object { message, commandName }
    if ("message" in source && "commandName" in source) {
      const { message, commandName } = source as PrefixSource;
      return this.extractFromMessage(message, commandName);
    }

    throw new Error(
      "[permsy-djs-adapter] Unsupported 'source' structure passed to resolveContext."
    );
  };

  sendDenyMessage = async (source: unknown, denyMessage: string): Promise<void> => {
    const content = denyMessage;

    let target: unknown = source;

    if (typeof source === "object" && source !== null) {
      if ("kind" in source) {
        const wrapped = source as Record<string, unknown>;
        target = wrapped.interaction ?? wrapped.message;
      } else if ("message" in source) {
        target = (source as PrefixSource).message;
      }
    }

    if (this.isInteraction(target)) {
      if (target.deferred || target.replied) {
        await target.editReply({ content });
      } else {
        await target.reply({ content, flags: 64 });
      }
      return;
    }

    if (
      typeof target === "object" &&
      target !== null &&
      "reply" in target &&
      typeof (target as Message).reply === "function"
    ) {
      await (target as Message).reply({ content });
    }
  };
}

