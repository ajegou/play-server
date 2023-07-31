module.exports.omxplayer = {
  pause: (process) => {
    process.stdin.write(' ');
  },
  volumeUp: (process) => {
    process.stdin.write('+');
  },
  volumeDown: (process) => {
    process.stdin.write('-');
  },
  forward: (process) => {
    process.stdin.write(Buffer.from('\u001b[C')); // right
  },
  backward: (process) => {
    process.stdin.write(Buffer.from('\u001b[D')); // left
  },
  bigForward: (process) => {
    process.stdin.write(Buffer.from('\u001b[A')); // up
  },
  bigBackward: (process) => {
    process.stdin.write(Buffer.from('\u001b[B')); // down
  },
  quit: (process) => {
    process.stdin.write('q');
  },
  enableSubtitles: (process) => {
    process.stdin.write('s');
  },
  hideSubtitles: (process) => {
    process.stdin.write('x');
  },
  showSubtitles: (process) => {
    process.stdin.write('w');
  },
  nextSubtitles: (process) => {
    process.stdin.write('m');
  },
  increaseSubDelay: (process) => {
    process.stdin.write('f');
  },
  decreaseSubDelay: (process) => {
    process.stdin.write('d');
  },
  nextAudio: (process) => {
    process.stdin.write('k');
  }
};

module.exports.eog = {
  next: (process) => {
    process.stdin.write(Buffer.from('\u001b[C')); // right
  },
  previous: (process) => {
    process.stdin.write(Buffer.from('\u001b[D')); // left
  }
};
