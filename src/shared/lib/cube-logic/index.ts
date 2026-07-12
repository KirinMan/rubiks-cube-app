import { CubeColor, CubeSize, CubeState, FaceId, FaceState, Move } from '../../types';

// Color assignments per face: U=white, D=yellow, F=red, B=orange, L=blue, R=green
const FACE_COLORS: Record<FaceId, CubeColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'blue',
  R: 'green',
};

function createFace(size: CubeSize, color: CubeColor): FaceState {
  return Array.from({ length: size }, () => Array(size).fill(color) as CubeColor[]);
}

export function createSolvedCube(size: CubeSize): CubeState {
  return {
    U: createFace(size, FACE_COLORS.U),
    D: createFace(size, FACE_COLORS.D),
    F: createFace(size, FACE_COLORS.F),
    B: createFace(size, FACE_COLORS.B),
    L: createFace(size, FACE_COLORS.L),
    R: createFace(size, FACE_COLORS.R),
  };
}

export function isSolved(state: CubeState): boolean {
  const faces: FaceId[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const faceId of faces) {
    const face = state[faceId];
    const first = face[0][0];
    for (const row of face) {
      for (const cell of row) {
        if (cell !== first) return false;
      }
    }
  }
  return true;
}

export function rotateFace(face: FaceState, direction: 1 | -1): FaceState {
  const n = face.length;
  const result: FaceState = Array.from({ length: n }, () => Array(n).fill('white') as CubeColor[]);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (direction === 1) {
        // clockwise: [r][c] -> [c][n-1-r]
        result[c][n - 1 - r] = face[r][c];
      } else {
        // counter-clockwise: [r][c] -> [n-1-c][r]
        result[n - 1 - c][r] = face[r][c];
      }
    }
  }
  return result;
}

function deepCopyState(state: CubeState): CubeState {
  return {
    U: state.U.map((row) => [...row]),
    D: state.D.map((row) => [...row]),
    F: state.F.map((row) => [...row]),
    B: state.B.map((row) => [...row]),
    L: state.L.map((row) => [...row]),
    R: state.R.map((row) => [...row]),
  };
}

function applyMoveTimes(state: CubeState, move: Move, size: CubeSize, times: number): CubeState {
  let s = state;
  for (let i = 0; i < times; i++) {
    s = applySingleMove(s, move, size);
  }
  return s;
}

function applySingleMove(state: CubeState, move: Move, size: CubeSize): CubeState {
  const n = size;
  const s = deepCopyState(state);
  const dir = move.direction;

  // Rotate the primary face
  s[move.face] = rotateFace(state[move.face], dir);

  // Cycle adjacent edge cells
  switch (move.face) {
    case 'U': {
      // U clockwise: F-top -> R-top -> B-top -> L-top (each is row 0)
      // U counter-clockwise: F-top -> L-top -> B-top -> R-top
      const fTop = state.F[0].slice();
      const rTop = state.R[0].slice();
      const bTop = state.B[0].slice();
      const lTop = state.L[0].slice();
      if (dir === 1) {
        s.R[0] = fTop;
        s.B[0] = rTop;
        s.L[0] = bTop;
        s.F[0] = lTop;
      } else {
        s.L[0] = fTop;
        s.B[0] = lTop;
        s.R[0] = bTop;
        s.F[0] = rTop;
      }
      break;
    }
    case 'D': {
      // D clockwise: F-bottom -> L-bottom -> B-bottom -> R-bottom
      const last = n - 1;
      const fBot = state.F[last].slice();
      const rBot = state.R[last].slice();
      const bBot = state.B[last].slice();
      const lBot = state.L[last].slice();
      if (dir === 1) {
        s.L[last] = fBot;
        s.B[last] = lBot;
        s.R[last] = bBot;
        s.F[last] = rBot;
      } else {
        s.R[last] = fBot;
        s.B[last] = rBot;
        s.L[last] = bBot;
        s.F[last] = lBot;
      }
      break;
    }
    case 'F': {
      // F clockwise: U-bottom-row -> R-left-col (top to bottom) -> D-top-row (reversed) -> L-right-col (bottom to top)
      // U bottom row = U[n-1][0..n-1]
      // R left col = R[0..n-1][0]
      // D top row = D[0][0..n-1]
      // L right col = L[0..n-1][n-1]
      const last = n - 1;
      const uBottom = state.U[last].slice();
      const rLeft = Array.from({ length: n }, (_, i) => state.R[i][0]);
      const dTop = state.D[0].slice();
      const lRight = Array.from({ length: n }, (_, i) => state.L[i][last]);
      if (dir === 1) {
        // U-bottom -> R-left (U[n-1][i] -> R[i][0])
        for (let i = 0; i < n; i++) s.R[i][0] = uBottom[i];
        // R-left -> D-top reversed (R[i][0] -> D[0][n-1-i])
        for (let i = 0; i < n; i++) s.D[0][last - i] = rLeft[i];
        // D-top -> L-right (D[0][i] -> L[n-1-i][n-1])
        for (let i = 0; i < n; i++) s.L[last - i][last] = dTop[i];
        // L-right -> U-bottom (L[i][n-1] -> U[n-1][i])
        for (let i = 0; i < n; i++) s.U[last][i] = lRight[i];
      } else {
        // U-bottom -> L-right reversed (U[n-1][i] -> L[n-1-i][n-1])
        for (let i = 0; i < n; i++) s.L[last - i][last] = uBottom[i];
        // L-right -> D-top (L[i][n-1] -> D[0][i])
        for (let i = 0; i < n; i++) s.D[0][i] = lRight[i];
        // D-top -> R-left reversed (D[0][i] -> R[n-1-i][0])
        for (let i = 0; i < n; i++) s.R[last - i][0] = dTop[i];
        // R-left -> U-bottom (R[i][0] -> U[n-1][i])
        for (let i = 0; i < n; i++) s.U[last][i] = rLeft[i];
      }
      break;
    }
    case 'B': {
      // B clockwise: U-top-row -> L-left-col (bottom to top) -> D-bottom-row (reversed) -> R-right-col (top to bottom)
      // U top row = U[0][0..n-1]
      // L left col = L[0..n-1][0]
      // D bottom row = D[n-1][0..n-1]
      // R right col = R[0..n-1][n-1]
      const last = n - 1;
      const uTop = state.U[0].slice();
      const lLeft = Array.from({ length: n }, (_, i) => state.L[i][0]);
      const dBottom = state.D[last].slice();
      const rRight = Array.from({ length: n }, (_, i) => state.R[i][last]);
      if (dir === 1) {
        // U-top -> L-left reversed (U[0][i] -> L[n-1-i][0])
        for (let i = 0; i < n; i++) s.L[last - i][0] = uTop[i];
        // L-left -> D-bottom (L[i][0] -> D[n-1][i])
        for (let i = 0; i < n; i++) s.D[last][i] = lLeft[i];
        // D-bottom -> R-right reversed (D[n-1][i] -> R[n-1-i][n-1])
        for (let i = 0; i < n; i++) s.R[last - i][last] = dBottom[i];
        // R-right -> U-top (R[i][n-1] -> U[0][i])
        for (let i = 0; i < n; i++) s.U[0][i] = rRight[i];
      } else {
        // U-top -> R-right (U[0][i] -> R[i][n-1])
        for (let i = 0; i < n; i++) s.R[i][last] = uTop[i];
        // R-right -> D-bottom reversed (R[i][n-1] -> D[n-1][n-1-i])
        for (let i = 0; i < n; i++) s.D[last][last - i] = rRight[i];
        // D-bottom -> L-left (D[n-1][i] -> L[i][0])
        for (let i = 0; i < n; i++) s.L[i][0] = dBottom[i];
        // L-left -> U-top reversed (L[i][0] -> U[0][n-1-i])
        for (let i = 0; i < n; i++) s.U[0][last - i] = lLeft[i];
      }
      break;
    }
    case 'L': {
      // L clockwise: U-left-col -> F-left-col -> D-left-col -> B-right-col (reversed)
      // U left col = U[0..n-1][0]
      // F left col = F[0..n-1][0]
      // D left col = D[0..n-1][0]
      // B right col = B[0..n-1][n-1]
      const last = n - 1;
      const uLeft = Array.from({ length: n }, (_, i) => state.U[i][0]);
      const fLeft = Array.from({ length: n }, (_, i) => state.F[i][0]);
      const dLeft = Array.from({ length: n }, (_, i) => state.D[i][0]);
      const bRight = Array.from({ length: n }, (_, i) => state.B[i][last]);
      if (dir === 1) {
        // U-left -> F-left
        for (let i = 0; i < n; i++) s.F[i][0] = uLeft[i];
        // F-left -> D-left
        for (let i = 0; i < n; i++) s.D[i][0] = fLeft[i];
        // D-left -> B-right reversed
        for (let i = 0; i < n; i++) s.B[last - i][last] = dLeft[i];
        // B-right -> U-left reversed
        for (let i = 0; i < n; i++) s.U[last - i][0] = bRight[i];
      } else {
        // U-left -> B-right reversed
        for (let i = 0; i < n; i++) s.B[last - i][last] = uLeft[i];
        // B-right -> D-left reversed
        for (let i = 0; i < n; i++) s.D[last - i][0] = bRight[i];
        // D-left -> F-left
        for (let i = 0; i < n; i++) s.F[i][0] = dLeft[i];
        // F-left -> U-left
        for (let i = 0; i < n; i++) s.U[i][0] = fLeft[i];
      }
      break;
    }
    case 'R': {
      // R clockwise: U-right-col -> B-left-col (reversed) -> D-right-col -> F-right-col
      // U right col = U[0..n-1][n-1]
      // F right col = F[0..n-1][n-1]
      // D right col = D[0..n-1][n-1]
      // B left col = B[0..n-1][0]
      const last = n - 1;
      const uRight = Array.from({ length: n }, (_, i) => state.U[i][last]);
      const fRight = Array.from({ length: n }, (_, i) => state.F[i][last]);
      const dRight = Array.from({ length: n }, (_, i) => state.D[i][last]);
      const bLeft = Array.from({ length: n }, (_, i) => state.B[i][0]);
      if (dir === 1) {
        // U-right -> B-left reversed
        for (let i = 0; i < n; i++) s.B[last - i][0] = uRight[i];
        // B-left -> D-right reversed
        for (let i = 0; i < n; i++) s.D[last - i][last] = bLeft[i];
        // D-right -> F-right
        for (let i = 0; i < n; i++) s.F[i][last] = dRight[i];
        // F-right -> U-right
        for (let i = 0; i < n; i++) s.U[i][last] = fRight[i];
      } else {
        // U-right -> F-right
        for (let i = 0; i < n; i++) s.F[i][last] = uRight[i];
        // F-right -> D-right
        for (let i = 0; i < n; i++) s.D[i][last] = fRight[i];
        // D-right -> B-left reversed
        for (let i = 0; i < n; i++) s.B[last - i][0] = dRight[i];
        // B-left -> U-right reversed
        for (let i = 0; i < n; i++) s.U[last - i][last] = bLeft[i];
      }
      break;
    }
  }

  return s;
}

export function applyMove(state: CubeState, move: Move, size: CubeSize): CubeState {
  const times = move.double ? 2 : 1;
  return applyMoveTimes(state, { ...move, double: false }, size, times);
}

export function applyMoves(state: CubeState, moves: Move[], size: CubeSize): CubeState {
  return moves.reduce((s, m) => applyMove(s, m, size), state);
}

export function parseMove(notation: string): Move {
  // Supported formats: R, R', R2, Rw, Rw', Rw2, 3Rw, etc.
  let remaining = notation.trim();

  // layer prefix: optional leading digit(s)
  let layer: number | undefined;
  const layerMatch = remaining.match(/^(\d+)/);
  if (layerMatch) {
    layer = parseInt(layerMatch[1], 10);
    remaining = remaining.slice(layerMatch[1].length);
  }

  // Face
  const faceChar = remaining[0]?.toUpperCase();
  const validFaces: FaceId[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  if (!faceChar || !validFaces.includes(faceChar as FaceId)) {
    throw new Error(`Invalid move notation: "${notation}"`);
  }
  const face = faceChar as FaceId;
  remaining = remaining.slice(1);

  // Wide modifier
  let wide = false;
  if (remaining.startsWith('w') || remaining.startsWith('W')) {
    wide = true;
    remaining = remaining.slice(1);
  }

  // Direction/double
  let direction: 1 | -1 = 1;
  let double = false;
  if (remaining.startsWith("'")) {
    direction = -1;
    remaining = remaining.slice(1);
  } else if (remaining.startsWith('2')) {
    double = true;
    remaining = remaining.slice(1);
  }

  const move: Move = { face, direction, wide, double };
  if (layer !== undefined) move.layer = layer;
  return move;
}

export function moveToNotation(move: Move): string {
  let notation = '';
  if (move.layer !== undefined && move.layer > 1) {
    notation += move.layer;
  }
  notation += move.face;
  if (move.wide) notation += 'w';
  if (move.double) {
    notation += '2';
  } else if (move.direction === -1) {
    notation += "'";
  }
  return notation;
}
