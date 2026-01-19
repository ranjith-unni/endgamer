# EndGamer

EndGamer is a web-based chess endgame puzzle trainer designed to help players sharpen their tactical skills in the final stages of the game.

## Features

- **Curated Puzzles**: A wide variety of endgame tactical positions.
- **Difficulty Levels**: 
  - **Easy**: Mate in One puzzles.
  - **Medium**: Mate in Two puzzles.
  - **Hard**: Mate in Three puzzles.
- **Interactive Board**: Drag-and-drop piece movement with legal move validation.
- **Hint System**: Provides assistance by identifying the piece that needs to move.
- **Statistics**: Tracks solved puzzles and hints used (saved to your browser's local storage).

## Getting Started

Simply open `index.html` in any modern web browser to start solving puzzles.

## Maintenance and Extension

The project includes scripts for generating and expanding the puzzle database:
- `generate_puzzles.js`: A Node.js script for processing puzzle data.
- `generate_puzzles.py`: A Python script for processing puzzle data.

To add new puzzles, update the raw data in these scripts and run them to update `src/data/puzzles.js`.

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Logic**: [Chess.js](https://github.com/jhlywa/chess.js) for move validation.
- **Data**: JSON-based puzzle storage.
