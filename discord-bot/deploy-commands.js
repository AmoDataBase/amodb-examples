import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('Set DISCORD_TOKEN and DISCORD_CLIENT_ID first. See .env.example.');
  process.exit(1);
}

// A guild id registers the commands in one server and they show up at once.
// Without it the commands are global and can take a while to appear.
const route = DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

try {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  const registered = await rest.put(route, { body: commands.map((command) => command.toJSON()) });
  console.log(`Registered ${registered.length} commands ${DISCORD_GUILD_ID ? 'in the guild' : 'globally'}.`);
} catch (error) {
  console.error('Registering commands failed:', error.message);
  process.exit(1);
}
