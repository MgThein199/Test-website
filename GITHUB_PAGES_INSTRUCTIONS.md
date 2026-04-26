# Deploying to GitHub Pages

I've configured your app for GitHub Pages. Here are the steps to finalize the deployment:

## 1. Firebase Console Configuration
Since you are using Firebase Authentication, you MUST add your GitHub Pages domain to the authorized domains list in the Firebase Console.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Settings** > **Authorized Domains**.
4. Add your GitHub Pages domain: `your-username.github.io`.

## 2. GitHub Repository Secrets
If you use any environment variables (like API keys) in the GitHub Actions workflow, make sure to add them to your repository secrets:
1. Go to your GitHub repository.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Add a new repository secret called `VITE_FIREBASE_API_KEY` (if applicable).

## 3. Enable GitHub Pages
1. Go to your GitHub repository.
2. Go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.

## Changes made:
- Updated `vite.config.ts` to use a relative base path (`./`).
- Added `public/404.html` to handle routing fallbacks.
- Added `.github/workflows/deploy.yml` for automated deployment.
