import { Client, EmbedBuilder, Events, GatewayIntentBits } from 'discord.js';
import { amodb, imageUrl, titleWithYear, truncate } from './amodb.js';

if (!process.env.DISCORD_TOKEN) {
  console.error('Set DISCORD_TOKEN and AMODB_API_KEY first. See .env.example.');
  process.exit(1);
}

// Slash commands need no message intents.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function movieEmbed(movie) {
  const embed = new EmbedBuilder()
    .setColor(0x4a4ae0)
    .setTitle(titleWithYear(movie.title, movie.release_date))
    .setDescription(truncate(movie.overview || 'No overview yet.', 400))
    .addFields(
      { name: 'Rating', value: movie.vote_average ? `${movie.vote_average.toFixed(1)} / 10` : 'n/a', inline: true },
      { name: 'Release date', value: movie.release_date || 'n/a', inline: true },
    )
    .setFooter({ text: 'amodb.dev' });

  // Only the details endpoint returns imdb_id. It is shown as plain text, not a link.
  if (movie.imdb_id) embed.addFields({ name: 'IMDb id', value: movie.imdb_id, inline: true });

  const poster = imageUrl(movie.poster_path, 'w342');
  if (poster) embed.setThumbnail(poster);
  return embed;
}

// Each handler returns the reply payload for its command.
const handlers = {
  async movie(interaction) {
    const title = interaction.options.getString('title', true);
    const { results } = await amodb('/search/movie', { query: title });
    if (!results.length) return { content: `No movie found for "${title}".` };
    const movie = await amodb(`/movie/${results[0].id}`);
    return { embeds: [movieEmbed(movie)] };
  },

  async trending() {
    const { results } = await amodb('/trending/movie/week');
    if (!results.length) return { content: 'Nothing is trending right now.' };
    return { embeds: results.slice(0, 5).map(movieEmbed) };
  },
};

client.once(Events.ClientReady, (ready) => console.log(`Logged in as ${ready.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
  const handler = interaction.isChatInputCommand() ? handlers[interaction.commandName] : undefined;
  if (!handler) return;

  try {
    // Defer first: an API call can take longer than the 3 second reply window.
    await interaction.deferReply();
    await interaction.editReply(await handler(interaction));
  } catch (error) {
    console.error(error);
    if (interaction.deferred) await interaction.editReply(`That did not work: ${error.message}`).catch(() => {});
  }
});

await client.login(process.env.DISCORD_TOKEN);
