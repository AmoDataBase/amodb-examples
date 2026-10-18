import { SlashCommandBuilder } from 'discord.js';

// Shared by deploy-commands.js (registers them) and index.js (handles them by name).
export const commands = [
  new SlashCommandBuilder()
    .setName('movie')
    .setDescription('Look up a movie by title')
    .addStringOption((option) => option.setName('title').setDescription('Movie title').setRequired(true)),
  new SlashCommandBuilder().setName('trending').setDescription('Popular movies this week'),
];
