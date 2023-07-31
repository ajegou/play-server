'use strict';

const path = require('path');
// eslint-disable-next-line camelcase
const child_process = require('child_process');
const kill = require('tree-kill');
const controllers = require('./controllers');

const softwaresMapping = new Map();

softwaresMapping.set('.avi', {
  command: 'omxplayer',
  args: ['-b', '-o', 'hdmi', '-r'],
  interface: 'video-player'
});

// for local tests with vlc (controls do not work)
// softwaresMapping.set('.avi', {
//   command: 'vlc',
//   args: [],
//   interface: 'video-player'
// });

softwaresMapping.set('.mkv', softwaresMapping.get('.avi'));
softwaresMapping.set('.mp4', softwaresMapping.get('.avi'));
softwaresMapping.set('.mov', softwaresMapping.get('.avi'));
softwaresMapping.set('.ogm', softwaresMapping.get('.avi'));
softwaresMapping.set('.mpg', softwaresMapping.get('.avi'));
softwaresMapping.set('.divx', softwaresMapping.get('.avi'));

softwaresMapping.set('.png', {
  command: 'fbi',
  args: [],
  interface: 'image-viewer'
});
softwaresMapping.set('.jpg', softwaresMapping.get('.png'));
softwaresMapping.set('.jpeg', softwaresMapping.get('.png'));

class Player {
  constructor (file) {
    this.file = file;
    const extension = path.extname(file);
    this.command = softwaresMapping.get(extension).command;
    this.defaultArgs = softwaresMapping.get(extension).args;
    this.interface = softwaresMapping.get(extension).interface;
    if (this.command === undefined) {
      throw new Error(`No player for extension '${extension}'`);
    }
    this.errors = [];
  }

  static supportsFile (file) {
    return softwaresMapping.has('.' + file.split('.').pop());
  }

  start () {
    return new Promise((resolve, reject) => {
      Player.killRunningPlayer();
      if (global.runningPlayer !== undefined) {
        reject(new Error('A player is already running'));
        return;
      }
      this.running = true;
      global.runningPlayer = this;
      this.currentProcess = child_process.spawn(this.command, [...this.defaultArgs, this.file]);
      this.currentProcess.stdin.setEncoding('utf-8');
      this.currentProcess.on('error', (err) => {
        console.log('Received an error from child process: %s', err);
        this.die();
        reject(err);
      });
      this.currentProcess.on('close', (code, signal) => {
        console.log('Received close from child process, code %s signal %s', code, signal);
        this.die();
        resolve();
      });
      this.currentProcess.on('exit', (code, signal) => {
        console.log('Received exit from child process, code %s signal %s', code, signal);
        this.die();
        resolve();
      });
    });
  }

  getController () {
    return controllers[this.command];
  }

  assertIfAlive () {
    if (this.isDead) {
      throw new Error('Quelqu\'un m\'a tuer');
    }
  }

  isRunning () {
    return this.running;
  }

  isDead () {
    return this.dead;
  }

  getPlayingFilename () {
    return (this.file || '').split(path.sep).pop();
  }

  die () {
    if (this.dead) {
      console.log('Player is already dead');
      return;
    }
    console.log('Killing player');
    this.running = false;
    this.dead = true;
    if (global.runningPlayer === this) {
      delete global.runningPlayer;
    }
    if (this.currentProcess) {
      kill(this.currentProcess.pid);
      delete this.currentProcess;
    }
  }

  hasErrors () {
    return this.errors.length > 0;
  }

  setError (error) {
    this.errors.push(error);
  }

  static killRunningPlayer () {
    if (global.runningPlayer) {
      global.runningPlayer.die();
    }
  }
};

module.exports = {
  Player
};
