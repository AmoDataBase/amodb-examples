import { Bot, InlineKeyboard } from 'grammy';
import { amodb, imageUrl, titleWithYear, truncate } from './amodb.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN and AMODB_API_KEY first. See .env.example.');
  process.exit(1);
}

const bot = new Bot(token);

// One button per movie. The callback data holds the movie id (Telegram allows 64 bytes).
function movieButtons(movies) {
  const keyboard = new InlineKeyboard();
  for (const movie of movies.slice(0, 5)) {
    keyboard.text(titleWithYear(movie.title, movie.release_date), `movie:${movie.id}`).row();
  }
  return keyboard;
}

bot.command('start', (ctx) =>
  ctx.reply('Send /search <title> to find a movie, or /trending to see what is popular this week.'),
);

bot.command('search', async (ctx) => {
  const query = ctx.match.trim();
  if (!query) return ctx.reply('Usage: /search <title>');
  const { results } = await amodb('/search/movie', { query });
  if (!results.length) return ctx.reply(`Nothing found for "${query}".`);
  await ctx.reply(`Top results for "${query}":`, { reply_markup: movieButtons(results) });
});

bot.command('trending', async (ctx) => {
  const { results } = await amodb('/trending/movie/week');
  await ctx.reply('Trending this week:', { reply_markup: movieButtons(results) });
});

// Runs when the user taps a button from /search or /trending.
bot.callbackQuery(/^movie:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const movie = await amodb(`/movie/${ctx.match[1]}`);

  const caption = [
    titleWithYear(movie.title, movie.release_date),
    `Rating: ${movie.vote_average ? movie.vote_average.toFixed(1) : 'n/a'} / 10`,
    movie.runtime ? `Runtime: ${movie.runtime} min` : null,
    movie.genres?.length ? `Genres: ${movie.genres.map((genre) => genre.name).join(', ')}` : null,
    '',
    truncate(movie.overview || 'No overview yet.', 600),
  ]
    .filter((line) => line !== null)
    .join('\n');

  // Telegram fetches the poster from the image host itself. Captions are limited to 1024 characters.
  const poster = imageUrl(movie.poster_path, 'w500');
  if (poster) await ctx.replyWithPhoto(poster, { caption });
  else await ctx.reply(caption);
});

// Without a handler, one failed API call would stop the whole bot.
bot.catch(async ({ ctx, error }) => {
  console.error('Update failed:', error.message);
  await ctx.reply(`That did not work: ${error.message}`).catch(() => {});
});

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

await bot.api.setMyCommands([
  { command: 'search', description: 'Find a movie by title' },
  { command: 'trending', description: 'Popular movies this week' },
]);
await bot.start({ onStart: (me) => console.log(`Running as @${me.username}. Press Ctrl+C to stop.`) });
