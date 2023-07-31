#!/usr/bin/env node

'use strict';
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const favicon = require('serve-favicon');

const { Player } = require('./player');
const { Explorer } = require('./file-explorer');

const app = express();
const port = 3000;

const roots = {};
if (process.argv.length === 2) {
  roots[path.basename(process.cwd())] = process.cwd();
} else {
  for (let i = 2; i < process.argv.length; i++) {
    let absolutePath;
    if (path.isAbsolute(process.argv[i])) {
      absolutePath = process.argv[i];
    } else {
      absolutePath = path.relative(process.cwd(), process.argv[i]);
    }
    roots[path.basename(process.argv[i])] = absolutePath;
  }
}

const explorer = new Explorer(roots);

async function sendDirectoryListing (directory, response) {
  console.log('Listing directory %s', directory);
  const files_list = explorer.listFiles(directory).filter((file) => {
    return file.type === 'directory' || Player.supportsFile(file.name);
  });

  if (global.runningPlayer !== undefined && global.runningPlayer.isRunning()) {
    response.render('list', {
      nav: files_list,
      title: global.runningPlayer.getPlayingFilename()
    });
  } else {
    response.render('list', { nav: files_list });
  }
}

async function read_file (file) {
  const player = new Player(file);
  try {
    player.start();
  } catch (e) {
    player.setError(e);
  }
}

const hbs = exphbs.create({
  helpers: {
    files_list: genList
  },
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, '../views/layouts')
});

function genList (items, options) {
  return `<ul>${items.map((item) => `<li>${options.fn(item)}</li>`).join('')}</ul>`;
}

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(favicon(path.join(__dirname, '../public/favicon.ico')));

function explore (target, response) {
  console.log('Looking up %s', target);
  try {
    // "resolvePath" will throw 'Not Found' if target either doesn't exist or if it does not belong to a root
    const absolutePath = explorer.resolvePath(target);
    if (explorer.isDirectory(target)) {
      sendDirectoryListing(target, response);
    } else {
      if (Player.supportsFile(absolutePath)) {
        console.log('Reading file %s', absolutePath);
        read_file(absolutePath, response);
        response.redirect('/status');
      } else {
        throw new Error('Not Found');
      }
    }
  } catch (e) {
    if (e.message === 'Not Found') {
      console.log('Forbidden path: %s', target);
      response.status(404);
      response.render('error', {
        message: 'Sadly, you are not allowed to access this area.'
      });
    } else {
      throw e;
    }
  }
}

app.get('/', (request, response) => {
  response.redirect('/status');
});

app.get('/status', (request, response) => {
  if (global.runningPlayer === undefined) {
    response.redirect('/list/');
  } else if (global.runningPlayer.isDead()) {
    response.render(global.runningPlayer.interface, {
      title: global.runningPlayer.getPlayingFilename(),
      status: 'Finished'
    });
  } else if (global.runningPlayer.isRunning()) {
    response.render(global.runningPlayer.interface, {
      title: global.runningPlayer.getPlayingFilename(),
      status: 'Running'
    });
  }
});

app.get('/list/*', (request, response) => {
  if (request.url) {
    const requested = decodeURI(request.url).replace(/^\/list/, '');
    explore(requested, response);
  }
});

app.post('/command/*', (request, response) => {
  if (request.url) {
    if (global.runningPlayer) {
      const command = decodeURI(request.url).replace(/^\/command\//, '');
      const controller = global.runningPlayer.getController();
      if (controller && controller[command]) {
        controller[command](global.runningPlayer.currentProcess);
      } else {
        console.log(`No command '${command}'`);
      }
    }
    response.redirect('/status');
  }
});

app.listen(port, (err) => {
  if (err) {
    console.log('something bad happened', err);
  }
  console.log(`server is listening on ${port}`);
});
