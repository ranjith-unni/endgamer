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

---

# Publishing Guide (iOS)

This guide focuses on publishing to the Apple App Store, prioritizing **iPad support**.

## Prerequisites

1.  **Apple Developer Account**: [Sign up here](https://developer.apple.com/programs/) ($99/year).
2.  **EAS CLI**: `npm install -g eas-cli`
3.  **macOS** (Recommended for testing)

## Step 1: Configure for iPad (iPad First)

Modify `app.json` to prioritize iPad support (Tablet support & orientations).

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "supportsTablet": true,
      "requiresFullScreen": false,
      "infoPlist": {
        "UIRequiresFullScreen": false,
        "UISupportedInterfaceOrientations~ipad": [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight"
        ]
      }
    }
  }
}
```
*Note: `~ipad` settings ensure full orientation support specifically for iPads.*

## Step 2: Build & Credentials

1.  Login and configure:
    ```bash
    eas login
    eas build:configure
    ```
    - Select **iOS**.
2.  Run the build (Production):
    ```bash
    eas build --platform ios --profile production
    ```
    - **Credentials**: Expo will ask to log in to your Apple ID to automatically generate certificates and provisioning profiles. Allow this.
3.  Download the `.ipa` file when the build finishes.

## Step 3: Upload to App Store Connect

1.  **Create App**: Log in to [App Store Connect](https://appstoreconnect.apple.com/), click **(+) New App**.
    - **Bundle ID**: Must match `app.json`.
2.  **Upload Build**: Use **Transporter** app (macOS) or `eas submit --platform ios` to upload the `.ipa`.
3.  **App Store Connect Settings**:
    - **Device Support**: Select **iPad** only. Uncheck iPhone.
    - **Screenshots**: Upload 12.9" iPad Pro (2nd/3rd Gen) screenshots (2048 x 2732).
4.  **Submit**: Fill in metadata (Description, Keywords, Age Rating) and click **Submit for Review**.

---

### Adding iPhone Support (Post-Launch)

1.  Update `app.json` to include iPhone orientations:
    ```json
    "infoPlist": {
      "UISupportedInterfaceOrientations": ["UIInterfaceOrientationPortrait"],
      "UISupportedInterfaceOrientations~ipad": [...]
    }
    ```
2.  Build a new binary (`eas build`).
3.  In App Store Connect, enable **iPhone** under Device Support and upload iPhone screenshots.

### Updating the App

- **JS Updates** (Quick): `eas update --branch production --message "Fixes"`
- **Native Updates** (New binary): Bump `buildNumber` in `app.json`, rebuild (Step 2), and resubmit.
