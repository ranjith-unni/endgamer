import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

// Chess.js library code (v0.13.4) adapted for inline script
// Removed 'export' keywords to work in standard browser script
const CHESS_JS_CODE = `
// Explicitly expose to window
window.Chess = function (fen) {
  var BLACK = 'b'
  var WHITE = 'w'
  var EMPTY = -1
  var PAWN = 'p'
  var KNIGHT = 'n'
  var BISHOP = 'b'
  var ROOK = 'r'
  var QUEEN = 'q'
  var KING = 'k'
  var SYMBOLS = 'pnbrqkPNBRQK'
  var DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  var TERMINATION_MARKERS = ['1-0', '0-1', '1/2-1/2', '*']
  var PAWN_OFFSETS = {
    b: [16, 32, 17, 15],
    w: [-16, -32, -17, -15],
  }
  var PIECE_OFFSETS = {
    n: [-18, -33, -31, -14, 18, 33, 31, 14],
    b: [-17, -15, 17, 15],
    r: [-16, 1, 16, -1],
    q: [-17, -16, -15, 1, 17, 16, 15, -1],
    k: [-17, -16, -15, 1, 17, 16, 15, -1],
  }
  var ATTACKS = [
    20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20, 0,
     0,20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0,
     0, 0,20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0,
     0, 0, 0,20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0,
     0, 0, 0, 0,20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0,20, 2, 24,  2,20, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 2,53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
    24,24,24,24,24,24,56,  0, 56,24,24,24,24,24,24, 0,
     0, 0, 0, 0, 0, 2,53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0,20, 2, 24,  2,20, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0,20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0,
     0, 0, 0,20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0,
     0, 0,20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0,
     0,20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0,
    20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20
  ]
  var RAYS = [
     17,  0,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0,  0, 15, 0,
      0, 17,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0, 15,  0, 0,
      0,  0, 17,  0,  0,  0,  0, 16,  0,  0,  0,  0, 15,  0,  0, 0,
      0,  0,  0, 17,  0,  0,  0, 16,  0,  0,  0, 15,  0,  0,  0, 0,
      0,  0,  0,  0, 17,  0,  0, 16,  0,  0, 15,  0,  0,  0,  0, 0,
      0,  0,  0,  0,  0, 17,  0, 16,  0, 15,  0,  0,  0,  0,  0, 0,
      0,  0,  0,  0,  0,  0, 17, 16, 15,  0,  0,  0,  0,  0,  0, 0,
      1,  1,  1,  1,  1,  1,  1,  0, -1, -1,  -1,-1, -1, -1, -1, 0,
      0,  0,  0,  0,  0,  0,-15,-16,-17,  0,  0,  0,  0,  0,  0, 0,
      0,  0,  0,  0,  0,-15,  0,-16,  0,-17,  0,  0,  0,  0,  0, 0,
      0,  0,  0,  0,-15,  0,  0,-16,  0,  0,-17,  0,  0,  0,  0, 0,
      0,  0,  0,-15,  0,  0,  0,-16,  0,  0,  0,-17,  0,  0,  0, 0,
      0,  0,-15,  0,  0,  0,  0,-16,  0,  0,  0,  0,-17,  0,  0, 0,
      0,-15,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,-17,  0, 0,
    -15,  0,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,  0,-17
  ]
  var SHIFTS = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 }
  var FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    BIG_PAWN: 'b',
    EP_CAPTURE: 'e',
    PROMOTION: 'p',
    KSIDE_CASTLE: 'k',
    QSIDE_CASTLE: 'q',
  }
  var BITS = {
    NORMAL: 1,
    CAPTURE: 2,
    BIG_PAWN: 4,
    EP_CAPTURE: 8,
    PROMOTION: 16,
    KSIDE_CASTLE: 32,
    QSIDE_CASTLE: 64,
  }
  var RANK_1 = 7
  var RANK_2 = 6
  var RANK_3 = 5
  var RANK_4 = 4
  var RANK_5 = 3
  var RANK_6 = 2
  var RANK_7 = 1
  var RANK_8 = 0
  var SQUARE_MAP = {
    a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
    a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
    a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
    a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
    a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
    a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
    a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
    a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
  }
  var ROOKS = {
    w: [{ square: SQUARE_MAP.a1, flag: BITS.QSIDE_CASTLE },
        { square: SQUARE_MAP.h1, flag: BITS.KSIDE_CASTLE }],
    b: [{ square: SQUARE_MAP.a8, flag: BITS.QSIDE_CASTLE },
        { square: SQUARE_MAP.h8, flag: BITS.KSIDE_CASTLE }]
  }
  var board = new Array(128)
  var kings = { w: EMPTY, b: EMPTY }
  var turn = WHITE
  var castling = { w: 0, b: 0 }
  var ep_square = EMPTY
  var half_moves = 0
  var move_number = 1
  var history = []
  var header = {}
  
  if (typeof fen === 'undefined') { load(DEFAULT_POSITION) } else { load(fen) }
  
  function clear(keep_headers) {
    if (typeof keep_headers === 'undefined') { keep_headers = false }
    board = new Array(128)
    kings = { w: EMPTY, b: EMPTY }
    turn = WHITE
    castling = { w: 0, b: 0 }
    ep_square = EMPTY
    half_moves = 0
    move_number = 1
    move_number = 1
    history = []
    if (!keep_headers) header = {}
    update_setup(generate_fen())
  }
  function reset() { load(DEFAULT_POSITION) }
  function load(fen, keep_headers) {
    if (typeof keep_headers === 'undefined') { keep_headers = false }
    var tokens = fen.split(/\\s+/)
    var position = tokens[0]
    var square = 0
    if (!validate_fen(fen).valid) { return false }
    clear(keep_headers)
    for (var i = 0; i < position.length; i++) {
      var piece = position.charAt(i)
      if (piece === '/') { square += 8 }
      else if (is_digit(piece)) { square += parseInt(piece, 10) }
      else {
        var color = piece < 'a' ? WHITE : BLACK
        put({ type: piece.toLowerCase(), color: color }, algebraic(square))
        square++
      }
    }
    turn = tokens[1]
    if (tokens[2].indexOf('K') > -1) { castling.w |= BITS.KSIDE_CASTLE }
    if (tokens[2].indexOf('Q') > -1) { castling.w |= BITS.QSIDE_CASTLE }
    if (tokens[2].indexOf('k') > -1) { castling.b |= BITS.KSIDE_CASTLE }
    if (tokens[2].indexOf('q') > -1) { castling.b |= BITS.QSIDE_CASTLE }
    ep_square = tokens[3] === '-' ? EMPTY : SQUARE_MAP[tokens[3]]
    half_moves = parseInt(tokens[4], 10)
    move_number = parseInt(tokens[5], 10)
    update_setup(generate_fen())
    return true
  }
  function validate_fen(fen) {
    var errors = { 0: 'No errors.', 1: 'FEN string must contain six space-delimited fields.', 2: '6th field (move number) must be a positive integer.', 3: '5th field (half move counter) must be a non-negative integer.', 4: '4th field (en-passant square) is invalid.', 5: '3rd field (castling availability) is invalid.', 6: '2nd field (side to move) is invalid.', 7: "1st field (piece positions) does not contain 8 '/'-delimited rows.", 8: '1st field (piece positions) is invalid [consecutive numbers].', 9: '1st field (piece positions) is invalid [invalid piece].', 10: '1st field (piece positions) is invalid [row too large].', 11: 'Illegal en-passant square' }
    var tokens = fen.split(/\\s+/)
    if (tokens.length !== 6) return { valid: false, error_number: 1, error: errors[1] }
    if (isNaN(parseInt(tokens[5])) || parseInt(tokens[5], 10) <= 0) return { valid: false, error_number: 2, error: errors[2] }
    if (isNaN(parseInt(tokens[4])) || parseInt(tokens[4], 10) < 0) return { valid: false, error_number: 3, error: errors[3] }
    if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) return { valid: false, error_number: 4, error: errors[4] }
    if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) return { valid: false, error_number: 5, error: errors[5] }
    if (!/^(w|b)$/.test(tokens[1])) return { valid: false, error_number: 6, error: errors[6] }
    var rows = tokens[0].split('/')
    if (rows.length !== 8) return { valid: false, error_number: 7, error: errors[7] }
    for (var i = 0; i < rows.length; i++) {
        var sum_fields = 0
        var previous_was_number = false
        for (var k = 0; k < rows[i].length; k++) {
            if (!isNaN(rows[i][k])) {
                if (previous_was_number) return { valid: false, error_number: 8, error: errors[8] }
                sum_fields += parseInt(rows[i][k], 10)
                previous_was_number = true
            } else {
                if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) return { valid: false, error_number: 9, error: errors[9] }
                sum_fields += 1
                previous_was_number = false
            }
        }
        if (sum_fields !== 8) return { valid: false, error_number: 10, error: errors[10] }
    }
    if ((tokens[3][1] == '3' && tokens[1] == 'w') || (tokens[3][1] == '6' && tokens[1] == 'b')) return { valid: false, error_number: 11, error: errors[11] }
    return { valid: true, error_number: 0, error: errors[0] }
  }
  function generate_fen() {
    var empty = 0
    var fen = ''
    for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
        if (board[i] == null) { empty++ } else {
            if (empty > 0) { fen += empty; empty = 0 }
            var color = board[i].color
            var piece = board[i].type
            fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase()
        }
        if ((i + 1) & 0x88) {
            if (empty > 0) { fen += empty }
            if (i !== SQUARE_MAP.h1) { fen += '/' }
            empty = 0
            i += 8
        }
    }
    var cflags = ''
    if (castling[WHITE] & BITS.KSIDE_CASTLE) { cflags += 'K' }
    if (castling[WHITE] & BITS.QSIDE_CASTLE) { cflags += 'Q' }
    if (castling[BLACK] & BITS.KSIDE_CASTLE) { cflags += 'k' }
    if (castling[BLACK] & BITS.QSIDE_CASTLE) { cflags += 'q' }
    cflags = cflags || '-'
    var epflags = ep_square === EMPTY ? '-' : algebraic(ep_square)
    return [fen, turn, cflags, epflags, half_moves, move_number].join(' ')
  }
  function update_setup(fen) {
    if (history.length > 0) return
    if (fen !== DEFAULT_POSITION) { header['SetUp'] = '1'; header['FEN'] = fen } else { delete header['SetUp']; delete header['FEN'] }
  }
  function get(square) {
    var piece = board[SQUARE_MAP[square]]
    return piece ? { type: piece.type, color: piece.color } : null
  }
  function put(piece, square) {
    if (!('type' in piece && 'color' in piece)) return false
    if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) return false
    if (!(square in SQUARE_MAP)) return false
    var sq = SQUARE_MAP[square]
    if (piece.type == KING && !(kings[piece.color] == EMPTY || kings[piece.color] == sq)) return false
    board[sq] = { type: piece.type, color: piece.color }
    if (piece.type === KING) { kings[piece.color] = sq }
    update_setup(generate_fen())
    return true
  }
  function build_move(board, from, to, flags, promotion) {
    var move = { color: turn, from: from, to: to, flags: flags, piece: board[from].type }
    if (promotion) { move.flags |= BITS.PROMOTION; move.promotion = promotion }
    if (board[to]) { move.captured = board[to].type } else if (flags & BITS.EP_CAPTURE) { move.captured = PAWN }
    return move
  }
  function generate_moves(options) {
    function add_move(board, moves, from, to, flags) {
      if (board[from].type === PAWN && (rank(to) === RANK_8 || rank(to) === RANK_1)) {
        var pieces = [QUEEN, ROOK, BISHOP, KNIGHT]
        for (var i = 0, len = pieces.length; i < len; i++) { moves.push(build_move(board, from, to, flags, pieces[i])) }
      } else { moves.push(build_move(board, from, to, flags)) }
    }
    var moves = []
    var us = turn
    var them = swap_color(us)
    var second_rank = { b: RANK_7, w: RANK_2 }
    var first_sq = SQUARE_MAP.a8
    var last_sq = SQUARE_MAP.h1
    var single_square = false
    var legal = typeof options !== 'undefined' && 'legal' in options ? options.legal : true
    if (typeof options !== 'undefined' && 'square' in options) {
        if (options.square in SQUARE_MAP) { first_sq = last_sq = SQUARE_MAP[options.square]; single_square = true } else { return [] }
    }
    for (var i = first_sq; i <= last_sq; i++) {
        if (i & 0x88) { i += 7; continue }
        var piece = board[i]
        if (piece == null || piece.color !== us) continue
        if (piece.type === PAWN) {
            var square = i + PAWN_OFFSETS[us][0]
            if (board[square] == null) {
                add_move(board, moves, i, square, BITS.NORMAL)
                var square = i + PAWN_OFFSETS[us][1]
                if (second_rank[us] === rank(i) && board[square] == null) { add_move(board, moves, i, square, BITS.BIG_PAWN) }
            }
            for (j = 2; j < 4; j++) {
                var square = i + PAWN_OFFSETS[us][j]
                if (square & 0x88) continue
                if (board[square] != null && board[square].color === them) { add_move(board, moves, i, square, BITS.CAPTURE) }
                else if (square === ep_square) { add_move(board, moves, i, ep_square, BITS.EP_CAPTURE) }
            }
        } else {
            for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
                var offset = PIECE_OFFSETS[piece.type][j]
                var square = i
                while (true) {
                    square += offset
                    if (square & 0x88) break
                    if (board[square] == null) { add_move(board, moves, i, square, BITS.NORMAL) }
                    else {
                        if (board[square].color === us) break
                        add_move(board, moves, i, square, BITS.CAPTURE)
                        break
                    }
                    if (piece.type === 'n' || piece.type === 'k') break
                }
            }
        }
    }
    if (legal) {
        var legal_moves = []
        for (var i = 0, len = moves.length; i < len; i++) {
            make_move(moves[i])
            if (!king_attacked(us)) { legal_moves.push(moves[i]) }
            undo_move()
        }
        return legal_moves
    }
    return moves
  }
  function algebraic(i) {
    var f = file(i), r = rank(i)
    return 'abcdefgh'.substring(f, f + 1) + '87654321'.substring(r, r + 1)
  }
  function file(i) { return i & 15 }
  function rank(i) { return i >> 4 }
  function shift(i) { return i } // Dummy for compatibility
  function swap_color(c) { return c === WHITE ? BLACK : WHITE }
  function is_digit(c) { return '0123456789'.indexOf(c) !== -1 }
  function make_move(move) {
    var us = turn
    var them = swap_color(us)
    history.push(move)
    board[move.to] = board[move.from]
    board[move.from] = null
    if (move.flags & BITS.EP_CAPTURE) { if (turn === BLACK) { board[move.to - 16] = null } else { board[move.to + 16] = null } }
    if (move.flags & BITS.PROMOTION) { board[move.to] = { type: move.promotion, color: us } }
    if (board[move.to].type === KING) { kings[board[move.to].color] = move.to }
    if (move.flags & BITS.KSIDE_CASTLE) {
        var castling_to = move.to - 1, castling_from = move.to + 1
        board[castling_to] = board[castling_from]
        board[castling_from] = null
    }
    if (move.flags & BITS.QSIDE_CASTLE) {
        var castling_to = move.to + 1, castling_from = move.to - 2
        board[castling_to] = board[castling_from]
        board[castling_from] = null
    }
    turn = them
    if (move.flags & BITS.BIG_PAWN) { ep_square = move.to === 'b' ? move.to - 16 : move.to + 16 } else { ep_square = EMPTY }
    if (move.piece === 'p') { half_moves = 0 } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) { half_moves = 0 } else { half_moves++ }
    if (turn === WHITE) { move_number++ }
  }
  function undo_move() {
      var old = history.pop()
      if (old == null) return null
      var us = turn
      var them = swap_color(us)
      turn = them
      ep_square = EMPTY // should calculate from previous history but simplified for this internal usage
      // This is a simplified undo, might need more state tracking if full undo needed
      // But for validation check, we just reversed board state.
      // Re-applying basic board state:
      var move = old
      board[move.from] = board[move.to]
      board[move.from].type = move.piece // undo promotion
      board[move.to] = null
      if (move.flags & BITS.CAPTURE) { board[move.to] = { type: move.captured, color: them } }
      else if (move.flags & BITS.EP_CAPTURE) {
          var index = move.to + (us === BLACK ? 16 : -16)
          board[index] = { type: PAWN, color: them }
      }
      if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          var castling_to, castling_from
          if (move.flags & BITS.KSIDE_CASTLE) { castling_to = move.to - 1; castling_from = move.to + 1 }
          if (move.flags & BITS.QSIDE_CASTLE) { castling_to = move.to + 1; castling_from = move.to - 2 }
          board[castling_from] = board[castling_to]
          board[castling_to] = null
      }
      return move
  }
  function king_attacked(color) { return attacked(swap_color(color), kings[color]) }
  function attacked(color, square) {
    for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
        if (i & 0x88) { i += 7; continue }
        if (board[i] == null || board[i].color !== color) continue
        var difference = i - square
        var index = difference + 119
        if (ATTACKS[index] & (1 << SHIFTS[board[i].type])) {
            if (board[i].type === PAWN) {
                if (difference > 0) { if (board[i].color === WHITE) return true } else { if (board[i].color === BLACK) return true }
                continue
            }
            if (board[i].type === 'n' || board[i].type === 'k') return true
            var offset = RAYS[index]
            var j = i + offset
            var blocked = false
            while (j !== square) {
                if (board[j] != null) { blocked = true; break }
                j += offset
            }
            if (!blocked) return true
        }
    }
    return false
  }
  
  return {
    load: function(fen) { return load(fen) },
    reset: function() { return reset() },
    fen: function() { return generate_fen() },
    game_over: function() { return generate_moves({legal: true}).length === 0 },
    in_check: function() { return king_attacked(turn) },
    in_checkmate: function() { return king_attacked(turn) && generate_moves({legal: true}).length === 0 },
    in_draw: function() { return false }, // Simplified
    moves: function(options) { return generate_moves(options) },
    board: function() {
        var output = [], row = []
        for (var i = SQUARE_MAP.a8; i <= SQUARE_MAP.h1; i++) {
            if (board[i] == null) row.push(null)
            else row.push({ type: board[i].type, color: board[i].color })
            if ((i + 1) & 0x88) { output.push(row); row = []; i += 8 }
        }
        return output
    },
    turn: function() { return turn },
    move: function(move) {
        var moves = generate_moves({ legal: true })
        for (var i = 0; i < moves.length; i++) {
            if (move === moves[i].san || (typeof move === 'object' && move.from === algebraic(moves[i].from) && move.to === algebraic(moves[i].to) && (!move.promotion || move.promotion === moves[i].promotion))) {
                make_move(moves[i])
                return moves[i]
            }
        }
        return null
    },
    get: function(square) { return get(square) },
    put: function(piece, square) { return put(piece, square) },
    remove: function(square) { return remove(square) },
  }
}
const BLACK = 'b';
const WHITE = 'w';
`;

const BOARD_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script>
        window.onerror = function(message, source, lineno, colno, error) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: message,
                    lineno: lineno
                }));
            }
        };
    </script>
    <script>
      ${CHESS_JS_CODE}
    </script>
    <style>
        :root {
            --board-light: #f0d9b5;
            --board-dark: #b58863;
            --board-border: #451a03;
            --primary-color: #38bdf8;
        }
        body { margin: 0; padding: 0; background: transparent; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        .chessboard {
            width: 100vw;
            height: 100vw;
            max-width: 100vh;
            max-height: 100vh;
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            border: 0;
        }
        .square {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .square.light { background-color: var(--board-light); }
        .square.dark { background-color: var(--board-dark); }
        .square.selected { box-shadow: inset 0 0 0 4px rgba(255, 255, 0, 0.6); }
        .square.hint { background-color: rgba(255, 255, 0, 0.5) !important; }
        .piece {
            width: 100%; height: 100%;
            background-size: contain; background-repeat: no-repeat;
            background-position: center;
        }
        
        /* Promotion Modal */
        #promotion-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex;
            justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: opacity 0.2s;
            z-index: 100;
        }
        #promotion-overlay.visible { opacity: 1; pointer-events: auto; }
        .promotion-options { display: flex; gap: 10px; }
        .btn-promotion {
            background: rgba(255,255,255,0.1); border: 2px solid #666;
            border-radius: 8px; padding: 10px; cursor: pointer;
        }
        .btn-promotion img { width: 40px; height: 40px; }
    </style>
</head>
<body>
    <div id="board" class="chessboard"></div>
    
    <div id="promotion-overlay">
        <div class="promotion-options">
            <div class="btn-promotion" data-piece="q"><img src="https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg"></div>
            <div class="btn-promotion" data-piece="r"><img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg"></div>
            <div class="btn-promotion" data-piece="b"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg"></div>
            <div class="btn-promotion" data-piece="n"><img src="https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg"></div>
        </div>
    </div>

    <script>
        // Inline ChessBoard Logic adapted for WebView
        class ChessBoard {
            constructor(elementId) {
                this.element = document.getElementById(elementId);
                this.game = new Chess();
                this.orientation = 'white';
                this.selectedSquare = null;
                this.pendingMove = null;
                
                this.setupPromotionListeners();
            }

            setupPromotionListeners() {
                document.querySelectorAll('.btn-promotion').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const piece = e.currentTarget.dataset.piece;
                        this.handlePromotionSelect(piece);
                    });
                });
            }

            loadFen(fen) {
                this.game.load(fen);
                this.selectedSquare = null;
                this.render();
            }

            setOrientation(color) {
                this.orientation = color;
                this.render();
            }

            render() {
                this.element.innerHTML = '';
                const board = this.game.board();
                const isWhite = this.orientation === 'white';
                
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const rowIdx = isWhite ? r : 7 - r;
                        const colIdx = isWhite ? c : 7 - c;
                        const squareData = board[rowIdx][colIdx];
                        
                        const squareEl = document.createElement('div');
                        const isLight = (rowIdx + colIdx) % 2 === 0;
                        squareEl.className = \`square \${isLight ? 'light' : 'dark'}\`;
                        
                        const file = 'abcdefgh'[colIdx];
                        const rank = 8 - rowIdx;
                        const squareId = \`\${file}\${rank}\`;
                        squareEl.dataset.square = squareId;

                        if (this.selectedSquare === squareId) squareEl.classList.add('selected');
                        
                        if (squareData) {
                            const pieceEl = document.createElement('div');
                            pieceEl.className = 'piece';
                            pieceEl.style.backgroundImage = \`url('\${this.getPieceUrl(squareData.color, squareData.type)}')\`;
                            squareEl.appendChild(pieceEl);
                        }
                        
                        squareEl.onclick = () => this.handleSquareClick(squareId);
                        this.element.appendChild(squareEl);
                    }
                }
            }

            getPieceUrl(color, type) {
                const urls = {
                    'wp': '4/45/Chess_plt45.svg', 'wn': '7/70/Chess_nlt45.svg', 'wb': 'b/b1/Chess_blt45.svg', 'wr': '7/72/Chess_rlt45.svg', 'wq': '1/15/Chess_qlt45.svg', 'wk': '4/42/Chess_klt45.svg',
                    'bp': 'c/c7/Chess_pdt45.svg', 'bn': 'e/ef/Chess_ndt45.svg', 'bb': '9/98/Chess_bdt45.svg', 'br': 'f/ff/Chess_rdt45.svg', 'bq': '4/47/Chess_qdt45.svg', 'bk': 'f/f0/Chess_kdt45.svg'
                };
                return 'https://upload.wikimedia.org/wikipedia/commons/' + urls[color + type];
            }

            handleSquareClick(square) {
                if (this.selectedSquare) {
                    if (this.selectedSquare === square) {
                        this.selectedSquare = null;
                        this.render();
                        return;
                    }

                    // Attempt move
                     const moveConfig = {
                        from: this.selectedSquare,
                        to: square,
                        promotion: 'q' 
                    };
                    
                    // Check promotion
                    const piece = this.game.get(this.selectedSquare);
                    if (piece && piece.type === 'p' && ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1'))) {
                         // Check legal
                         const moves = this.game.moves({verbose: true});
                         if (moves.some(m => m.from === this.selectedSquare && m.to === square)) {
                             this.pendingMove = { from: this.selectedSquare, to: square };
                             document.getElementById('promotion-overlay').classList.add('visible');
                             return;
                         }
                    }

                    const result = this.game.move(moveConfig);
                    if (result) {
                        this.selectedSquare = null;
                        this.render();
                        // Notify RN
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'move', move: result}));
                    } else {
                        // Clicked another piece?
                        const p = this.game.get(square);
                        if (p && p.color === this.game.turn()) {
                            this.selectedSquare = square;
                            this.render();
                        } else {
                            this.selectedSquare = null;
                            this.render();
                        }
                    }
                } else {
                    const piece = this.game.get(square);
                    if (piece && piece.color === this.game.turn()) {
                        this.selectedSquare = square;
                        this.render();
                    }
                }
            }
            
            handlePromotionSelect(pieceType) {
                if (this.pendingMove) {
                    const move = { ...this.pendingMove, promotion: pieceType };
                    const result = this.game.move(move);
                    if (result) {
                         window.ReactNativeWebView.postMessage(JSON.stringify({type: 'move', move: result}));
                    }
                    this.pendingMove = null;
                    this.selectedSquare = null;
                    document.getElementById('promotion-overlay').classList.remove('visible');
                    this.render();
                }
            }
        }

        const board = new ChessBoard('board');

        // Listen for messages from RN
        // Android: document.addEventListener("message", ...)
        // iOS: window.addEventListener("message", ...)
        
        function handleMessage(event) {
             try {
                const data = JSON.parse(event.data);
                if (data.type === 'loadFen') {
                    board.loadFen(data.fen);
                    // Set orientation based on side to move
                    const turn = board.game.turn();
                    board.setOrientation(turn === 'w' ? 'white' : 'black');
                }
             } catch(e) { console.error(e); }
        }
        
        document.addEventListener("message", handleMessage);
        window.addEventListener("message", handleMessage);
        
    </script>
</body>
</html>
`;

export default function WebChessBoard({ fen, onMove }) {
    const webViewRef = useRef(null);

    useEffect(() => {
        if (webViewRef.current && fen) {
            const script = `
                handleMessage({data: JSON.stringify({type: 'loadFen', fen: "${fen}"})});
            `;
            webViewRef.current.injectJavaScript(script);
        }
    }, [fen]);

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'move') {
                onMove({ move: data.move });
            } else if (data.type === 'error') {
                console.error('WebView JS Error:', data.message, 'Line:', data.lineno);
            }
        } catch (e) {
            console.error('WebBoard Error', e);
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: BOARD_HTML, baseUrl: '' }}
                onMessage={handleMessage}
                style={styles.webview}
                scrollEnabled={false}
                javaScriptEnabled={true}
                onError={(e) => console.log('WebView error', e.nativeEvent)}
                onHttpError={(e) => console.log('WebView http error', e.nativeEvent)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 340,
        height: 340,
        backgroundColor: 'transparent',
    },
    webview: {
        backgroundColor: 'transparent',
        flex: 1,
    }
});
