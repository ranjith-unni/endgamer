# Publishing Guide (Android)

This guide walks you through the process of taking your Expo app and publishing it to the Google Play Store.

## Prerequisites

1.  **Expo Account**: Sign up at [expo.dev](https://expo.dev/signup).
2.  **Google Play Developer Account**: Sign up at [play.google.com/console](https://play.google.com/console). note: There is a one-time $25 registration fee.
3.  **EAS CLI**: Installed globally on your machine.
    ```bash
    npm install -g eas-cli
    ```

## Step 1: Login and Configure

1.  Log in to EAS CLI:
    ```bash
    eas login
    ```
2.  Configure the project for building:
    ```bash
    cd mobile
    eas build:configure
    ```
    - Choose **Android** when prompted.
    - This creates an `eas.json` file in your root.

## Step 2: Build the Bundle (AAB)

Google Play requires an Android App Bundle (.aab) file.

1.  Run the build command:
    ```bash
    eas build --platform android
    ```
    - You may be asked to generate a Keystore. select "Yes" to let Expo handle it securely.
2.  Wait for the build to finish. It will take a few minutes in the cloud.
3.  Once done, you will get a link to download the `.aab` file.

## Step 3: Upload to Google Play Console

1.  Go to the **Google Play Console**.
2.  Click **Create app**.
3.  Fill in the app details (Name, default language, free/paid, etc.).
4.  Navigate to **Testing > Internal testing** (recommended for first release) or **Production**.
5.  Click **Create new release**.
6.  Upload the `.aab` file you downloaded from Expo.
7.  Complete the Store Listing, Content Rating, and Privacy Policy sections.
8.  Review and rollout the release!

## Updating the App

For standard updates (JS changes), you can use EAS Update without submitting a new build:

```bash
eas update --branch production --message "Fixed bug"
```

For native changes (installing new native libraries), you must build a new binary (Step 2) and submit a new release to the Play Store.
