# EndGamer

EndGamer is a premium web-based chess endgame puzzle trainer designed to help players sharpen their tactical skills in the final stages of the game.

Play live at  https://ranjith-unni.github.io/endgamer/ !

## Features

- **Curated Puzzle Library**: 349 hand-picked endgame puzzles, including:
  - **Easy**: Mate in One (Quick tactical checks).
  - **Medium**: Mate in Two (Deeper calculation).
  - **Hard**: Mate in Three (Complex endgame combinations).
- **Pro Premium Design**: A beautiful, distraction-free **Dark Minimalist Wood** theme optimized for focus and aesthetics.
- **Interactive Board**: Fluid drag-and-drop piece movement with legal move validation and visual highlights.
- **Intelligent Hint System**: Assistance that identifies the critical piece to move when you're stuck.
- **Progress Tracking**: Automatic score tracking and hint usage saved to your browser's local storage.
- **Mobile Experience**: A dedicated React Native application for training on the go, featuring native gestures and responsive design.
- **Pawn Promotion Support**: Fully implemented pawn promotion logic (Queen, Rook, Bishop, Knight) with interactive piece selection.

### Web (Vanilla JS)
Simply open `index.html` in any modern web browser to start your training session.

### Mobile (React Native / Expo)
The mobile version is powered by **Expo**. To run it locally:
1. Navigate to the mobile directory: `cd mobile`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Scan the QR code with the **Expo Go** app on your Android/iOS device, or press `w` to open in the browser.

## Developer & Testing Tools

To accelerate development and testing, the mobile app includes:
- **Jump to ID**: Directly navigate to any puzzle by entering its ID in the input field at the bottom of the Game Screen. Great for testing specific scenarios like pawn promotions (e.g., Puzzle #20).
- **Web Preview**: Run the mobile app in a browser environment (`npm run web`) for rapid UI iteration and agentic testing.

## Maintenance and Extension

The project features a robust data management system for scaling and maintenance:
- **`generate_puzzles.js`**: Node.js utility for processing and formatting large datasets.
- **`generate_puzzles.py`**: Python-based automation for library expansion and cleanup.
- **`validate_puzzles.js`**: Maintenance script that identifies and removes invalid puzzles from the data files.
- **`test_puzzles.js`**: Integration test suite that performs a comprehensive audit of all puzzles (run via `npm test`).
- **Automated ID Management**: Scripts to ensure consistent sorting and numbering across all difficulty levels.

To expand the library further, update the source data in the management scripts and rebuild the `src/data/puzzles.js` database.

## Quality Assurance & Testing

The project includes a robust testing suite to ensure puzzle quality and consistency. Every puzzle is verified for:
- **FEN Validity**: Proper chess board state parsing.
- **Color Consistency**: The side to move matches the description.
- **Hint Logic**: The suggested first move piece matches the player's color.
- **Solution Correctness**: Every move is legal and leads to a forced checkmate.

### Running Tests
```bash
# Run the full integration test suite (Read-only)
npm test

# Run the maintenance script to automatically clean up invalid puzzles
npm run validate
```

### Continuous Integration
The project uses **GitHub Actions** to automatically run validation tests on every push and pull request, ensuring no invalid data is ever merged into the main branch.

## Technologies

- **Mobile Framework**: React Native with [Expo](https://expo.dev/) for cross-platform development.
- **Chess Engine Logic**: [Chess.js](https://github.com/jhlywa/chess.js) for precise move validation and FEN handling.
- **Visuals**: [React Native SVG](https://github.com/software-mansion/react-native-svg) for high-quality, scalable chess piece rendering.
- **Data Architecture**: Optimized JSON-based puzzle storage for fast loading and offline access.
