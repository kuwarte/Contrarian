# Contributing to Contrarian

Thanks for wanting to contribute! Follow the steps below to get set up.

## 1. Fork the Repo

Click **Fork** on the GitHub repo page to create your own copy.

## 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/contrarian.git
cd contrarian
```

## 3. Add the Upstream Remote

```bash
git remote add upstream https://github.com/Aiidz/contrarian.git
```

This lets you pull in future changes from the original repo.

## 4. Keep Your Fork Up to Date

Before starting any new work, sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## 5. Create a Branch

Never work directly on `main`. Create a branch for your change:

```bash
git checkout -b feat/your-feature
# or
git checkout -b fix/your-fix
```

## 6. Set Up the Project

Follow the installation steps in the [README](./README.md) to install dependencies and configure your `.env` files.

## 7. Make Your Changes

Test everything locally with both the frontend and backend running before committing.

## 8. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add X"
# or
git commit -m "fix: correct Y"
```

## 9. Push to Your Fork

```bash
git push origin feat/your-feature
```

## 10. Open a Pull Request

Go to your fork on GitHub and click **Compare & pull request**. Target the `main` branch of the original repo. Include a clear description of what you changed and why, and add screenshots for any UI changes.

---

## Guidelines

- Keep PRs small and focused on one thing
- Include screenshots for UI changes
- Don't break the one-vote-per-device rule on the backend
- Use TypeScript types — avoid `any`
- Follow PEP 8 for Python code

## Reporting Issues

Open an issue with a clear title, steps to reproduce, and your environment details (OS, Expo SDK, Python version).
