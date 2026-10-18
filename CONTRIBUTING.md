# Contributing

Thanks for helping. Keep changes small and focused.

1. Open an issue first for anything larger than a bug fix or a doc fix.
2. Fork the repository and create a branch from `main`.
3. Run the checks before you open a pull request:

```sh
# Next.js app: install and type check
cd nextjs-movie-app && npm install && npm run typecheck && cd ..

# Telegram and Discord bots: install and syntax check
cd telegram-bot && npm install && npm run check && cd ..
cd discord-bot && npm install && npm run check && cd ..

# Python CLI: unit tests against a local stub server
cd python-cli && python -m unittest && cd ..
```

4. Add or update tests for the behavior you change.
5. Write commit messages in the imperative mood, one short line, no trailing period.

Each example is independent. Keep it free of any amodb SDK package: call the API with plain `fetch` or the Python standard library.

Text in docs and comments: short, concrete sentences, sentence case headings, no long dashes.

Never commit API keys. Use environment variables and `.env` files that are ignored by git.

## Releasing

For maintainers.

1. Update `CHANGELOG.md`.
2. Tag the commit and push the tag: `git tag v0.2.0 && git push origin v0.2.0`.

The Release workflow builds every example and creates the GitHub release. Nothing is published to a package registry.

By contributing you agree that your work is released under the MIT license of this repository.
