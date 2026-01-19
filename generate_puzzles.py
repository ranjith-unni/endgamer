
import json

# Manually extracted data from tool outputs
easy_raw = [
    {"problemid":1,"type":"Mate in One","fen":"3q1rk1/5pbp/5Qp1/8/8/2B5/5PPP/6K1 w - - 0 1","moves":"f6-g7"},
    {"problemid":2,"type":"Mate in One","fen":"2r2rk1/2q2p1p/6pQ/4P1N1/8/8/PPP5/2KR4 w - - 0 1","moves":"h6-h7"},
    {"problemid":3,"type":"Mate in One","fen":"r2q1rk1/pp1p1p1p/5PpQ/8/4N3/8/PP3PPP/R5K1 w - - 0 1","moves":"h6-g7"},
    {"problemid":4,"type":"Mate in One","fen":"6r1/7k/2p1pPp1/3p4/8/1R6/5PPP/5K2 w - - 0 1","moves":"b3-h3"},
    {"problemid":5,"type":"Mate in One","fen":"1r4k1/1q3p2/5Bp1/8/8/8/PP6/1K5R w - - 0 1","moves":"h1-h8"},
    {"problemid":6,"type":"Mate in One","fen":"r4rk1/5p1p/8/8/8/8/1BP5/2KR4 w - - 0 1","moves":"d1-g1"},
    {"problemid":7,"type":"Mate in One","fen":"4r2k/4r1p1/6p1/8/2B5/8/1PP5/2KR4 w - - 0 1","moves":"d1-h1"},
    {"problemid":8,"type":"Mate in One","fen":"8/2r1N1pk/8/8/8/2q2p2/2P5/2KR4 w - - 0 1","moves":"d1-h1"},
    {"problemid":9,"type":"Mate in One","fen":"r7/4KNkp/8/8/b7/8/8/1R6 w - - 0 1","moves":"b1-g1"},
    {"problemid":10,"type":"Mate in One","fen":"2kr4/3n4/2p5/8/5B2/8/6PP/5B1K w - - 0 1","moves":"f1-a6"},
    {"problemid":11,"type":"Mate in One","fen":"r1b1kb1r/5ppp/8/6B1/8/8/5PPP/3R3K w - - 0 1","moves":"d1-d8"},
    {"problemid":12,"type":"Mate in One","fen":"r4rk1/p6p/1n6/6N1/3B4/3B4/6PP/7K w - - 0 1","moves":"d3-h7"},
    {"problemid":13,"type":"Mate in One","fen":"r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1","moves":"f3-f7"},
    {"problemid":14,"type":"Mate in One","fen":"rnbqkbnr/ppppp2p/5p2/6p1/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1","moves":"d1-h5"},
    {"problemid":15,"type":"Mate in One","fen":"6k1/5ppp/r1p5/3b4/8/1pB5/1Pr2PPP/3RR1K1 w - - 0 1","moves":"e1-e8"},
    {"problemid":16,"type":"Mate in One","fen":"rnbq1rk1/ppp1nppp/3bp3/3p3Q/3P4/3BPN2/PPP2PPP/RNB1K2R w KQ - 0 1","moves":"h5-h7"},
    {"problemid":17,"type":"Mate in One","fen":"6k1/p1p2rpp/1q6/2p5/4P3/PQ6/1P4PP/3R3K w - - 0 1","moves":"d1-d8"},
    {"problemid":18,"type":"Mate in One","fen":"rnb4k/p5pp/8/4N3/8/1B6/PPP5/2K4R w - - 0 1","moves":"e5-g6"},
    {"problemid":19,"type":"Mate in One","fen":"6r1/2Q2P2/5k2/5P2/5K2/8/8/8 w - - 0 1","moves":"f7-g8n"},
    {"problemid":20,"type":"Mate in One","fen":"8/3pkP2/4p3/8/8/3K4/8/5R2 w - - 0 1","moves":"f7-f8q"},
]

medium_raw = [
    {"problemid":624,"type":"Mate in Two","fen":"4k3/R6R/8/K1p5/1p1N4/p1n5/5rb1/b7 w - - 0 1","moves":"d4-f3;a3-a2;a7-a8"},
    {"problemid":625,"type":"Mate in Two","fen":"r1bq3r/pp1pB1pp/3R1p2/k2P4/2Q5/8/P4PPP/R5K1 w - - 0 1","moves":"d6-a6;b7-a6;c4-b4"},
    {"problemid":626,"type":"Mate in Two","fen":"8/npN5/1pb2R2/4pp2/2Bpk2p/3Np1Pr/K3P3/4b2n w - - 0 1","moves":"d3-c5;b6-c5;c4-d3"},
    {"problemid":627,"type":"Mate in Two","fen":"3k4/2R1N3/3NP3/nb1P2n1/8/2B1r3/1K6/4q3 w - - 0 1","moves":"c7-c8;d8-e7;d6-f5"},
    {"problemid":628,"type":"Mate in Two","fen":"3b2rk/5Qn1/5nR1/8/8/8/8/7K w - - 0 1","moves":"f7-f6;h8-h7;g6-h6"},
    {"problemid":629,"type":"Mate in Two","fen":"8/3Nr1b1/1Q5p/p2b2p1/P1k2n2/8/3K4/3N1q2 w - - 0 1","moves":"d7-e5;e7-e5;d1-b2"},
    {"problemid":630,"type":"Mate in Two","fen":"Bq6/4n2b/p2P4/R4p2/2pk1B2/2pp2PK/Pr5N/nQ5r w - - 0 1","moves":"b1-g1;h1-g1;h2-f3"},
    {"problemid":631,"type":"Mate in Two","fen":"2B3q1/2b2p2/7n/3kpn2/1P5Q/2p1B1p1/2P2P2/6K1 w - - 0 1","moves":"h4-e4;d5-d6;e3-c5"},
    {"problemid":632,"type":"Mate in Two","fen":"8/2B1p1n1/2p1b3/8/K2kpN2/p3Np2/2Qp1q2/8 w - - 0 1","moves":"c2-c3;d4-c3;c7-e5"},
    {"problemid":633,"type":"Mate in Two","fen":"3n4/p7/3k1N2/PbnPp3/q1p5/2K3N1/3P1Q2/8 w - - 0 1","moves":"f2-c5;d6-c5;g3-e4"},
    {"problemid":634,"type":"Mate in Two","fen":"2R3nK/3B4/R4B1p/1N1k1b2/Q4q1r/4r3/2Pn4/8 w - - 0 1","moves":"a4-e4;f4-e4;a6-d6"},
    {"problemid":635,"type":"Mate in Two","fen":"4Q3/1n2p3/pP2P1N1/P2k2P1/4N2K/1p2p3/2P1Brq1/8 w - - 0 1","moves":"e8-c6;d5-c6;g6-e7"},
    {"problemid":636,"type":"Mate in Two","fen":"8/3p1K1p/Q7/2PR4/2brk3/4p1B1/4P3/7q w - - 0 1","moves":"a6-e6;d7-e6;d5-e5"},
    {"problemid":637,"type":"Mate in Two","fen":"8/3R4/2k1Pp2/6b1/Kp1P4/4rp2/1qP2Q2/6B1 w - - 0 1","moves":"f2-f3;e3-e4;d4-d5"},
    {"problemid":638,"type":"Mate in Two","fen":"4r3/1N3p2/1p2q3/3p1bP1/3k1N1R/PPRP4/rp2QP1B/n3K3 w - - 0 1","moves":"e2-e5;e6-e5;f4-e2"},
    {"problemid":639,"type":"Mate in Two","fen":"4NQ2/Kp5r/6b1/1P1kb3/N3R3/2p1p1P1/q1P3P1/n7 w - - 0 1","moves":"f8-d6;e5-d6;e8-f6"},
    {"problemid":640,"type":"Mate in Two","fen":"r4nk1/p4rbR/3q1p2/2pNp3/2B1P1Q1/P6P/1PP3P1/6K1 w - - 0 1","moves":"g4-g7;f7-g7;d5-f6"},
    {"problemid":641,"type":"Mate in Two","fen":"4k2r/n1p2p1p/1pp2B2/2p1p2p/8/8/8/R3K2B w Qk - 0 1","moves":"e1-c1;c5-c4;d1-d8"},
    {"problemid":642,"type":"Mate in Two","fen":"2Qrkr2/5p2/5R2/4p3/8/8/8/7K w - - 0 1","moves":"f6-e6;f7-e6;c8-e6"},
    {"problemid":643,"type":"Mate in Two","fen":"4Q2r/rb4pk/2n4p/1p4p1/1qn5/8/PPP2PP1/2KR3R w - - 0 1","moves":"h1-h6;g7-h6;e8-f7"},
]

hard_raw = [
    {"problemid":4414,"type":"Mate in Three","fen":"6k1/p4ppp/8/6K1/3QP3/7q/PPP5/R1B2R2 b - - 0 1","moves":"h7-h6;g5-f4;g7-g5;f4-e5;h3-e6"},
    {"problemid":4415,"type":"Mate in Three","fen":"3r2k1/R4pp1/8/P6K/4p3/4NnP1/4Nn1P/8 b - - 0 1","moves":"d8-d5;e3-d5;g7-g6;h5-h6;f2-g4"},
    {"problemid":4416,"type":"Mate in Three","fen":"6k1/1p5p/3p1rp1/P2Pbn2/1PB4P/3Q1q2/4R3/4B1K1 b - - 0 1","moves":"f3-f1;g1-f1;f5-e3;f1-g1;f6-f1"},
    {"problemid":4417,"type":"Mate in Three","fen":"1rr3k1/5p1p/p2Q2p1/N2b4/3Pp3/R3P3/4qPPP/5RK1 b - - 0 1","moves":"e2-f1;g1-f1;b8-b1;f1-e2;c8-c2"},
    {"problemid":4418,"type":"Mate in Three","fen":"8/4R2p/6pk/1P4r1/2P2QBK/RN5P/6r1/6q1 b - - 0 1","moves":"g1-f2;f4-f2;g5-h5;g4-h5;g6-g5"},
    {"problemid":4419,"type":"Mate in Three","fen":"4Q3/3P2pk/5p2/8/4p1PK/3rP2P/4nP2/8 b - - 0 1","moves":"g7-g5;h4-h5;e2-f4;e3-f4;d3-h3"},
    {"problemid":4420,"type":"Mate in Three","fen":"1r3k1r/p1p3p1/3q1n2/2b3p1/4p1b1/1B1P2P1/PPPQ1P1P/RNB2RK1 b - - 0 1","moves":"d6-g3;h2-g3;g4-f3;a2-a3;h8-h1"},
    {"problemid":4421,"type":"Mate in Three","fen":"4r1k1/p2Q2pp/8/3pq3/2p2b1B/2P2R1P/1N4P1/7K b - - 0 1","moves":"e5-e1;h4-e1;e8-e1;f3-f1;e1-f1"},
    {"problemid":4422,"type":"Mate in Three","fen":"7r/1RR2P2/5bk1/3p4/p3n2p/8/PPP3PP/5B1K b - - 0 1","moves":"e4-g3;h2-g3;h4-g3;h1-g1;f6-d4"},
    {"problemid":4423,"type":"Mate in Three","fen":"r1b3k1/pppn2bp/3p2r1/3P4/2P1PB1q/2N1KP2/PPQ1BP2/R4R2 b - - 0 1","moves":"h4-f4;e3-f4;g7-h6;f4-f5;d7-e5"},
]

def format_moves(move_str):
    parts = move_str.split(';')
    return [p.replace('-', '') for p in parts]

def get_difficulty(type_str):
    if "One" in type_str: return "easy"
    if "Two" in type_str: return "medium"
    return "hard"

def get_desc(type_str, fen):
    side = "White" if " w " in fen else "Black"
    return f"{side} to move. {type_str}."

all_puzzles = []
for p in easy_raw + medium_raw + hard_raw:
    all_puzzles.append({
        "id": p["problemid"],
        "fen": p["fen"],
        "difficulty": get_difficulty(p["type"]),
        "description": get_desc(p["type"], p["fen"]),
        "solution": format_moves(p["moves"])
    })

output = "window.GAME_DATA = window.GAME_DATA || {};\n"
output += "window.GAME_DATA.puzzles = " + json.dumps(all_puzzles, indent=4) + ";"

with open("puzzles_expanded.js", "w") as f:
    f.write(output)
