'use strict';

const { statSync, readdirSync, existsSync } = require('fs');
const { normalize, join, sep } = require('path');

class Explorer {
  constructor (roots) {
    this.roots = roots;
  }

  // explorePath (filepath) {
  //   filepath = normalize(filepath);
  //   if (filepath === '/') {
  //     return Object.keys(this.roots).map((root) => {
  //       return { name: root, path: root };
  //     });
  //   } else {
  //     const [, root, ...relativePath] = filepath.split(sep);
  //     const absolutePath = join(this.roots[root], ...relativePath);
  //   }
  // }

  resolvePath (filepath) {
    filepath = normalize(filepath);
    if (filepath === '/') {
      return '/';
    } else {
      const [, root, ...relativePath] = filepath.split(sep);
      const absolutePath = join(this.roots[root], ...relativePath);
      if (root in this.roots && existsSync(absolutePath)) {
        return absolutePath;
      } else {
        throw new Error('Not Found');
      }
    }
  }

  isDirectory (filepath) {
    const resolvedPath = this.resolvePath(filepath);
    if (resolvedPath === '/') {
      return true;
    } else {
      const stat = statSync(resolvedPath);
      return stat.isDirectory();
    }
  }

  listFiles (directoryPath) {
    const absolutePath = this.resolvePath(directoryPath);
    console.log('Listing content of %s', absolutePath);
    if (absolutePath === '/') {
      return Object.keys(this.roots).map((root) => {
        return {
          name: root,
          path: root,
          type: 'directory'
        };
      });
    }

    const files_list = [];
    files_list.push({
      path: join(directoryPath, '..'),
      name: '..',
      type: 'directory'
    });
    const files = readdirSync(absolutePath);
    for (const file of files) {
      if (file.startsWith('.')) {
        continue;
      }
      const filepath = join(directoryPath, file);
      if (this.isDirectory(filepath)) {
        files_list.push({
          name: file,
          path: filepath,
          type: 'directory'
        });
      } else {
        files_list.push({
          name: file,
          path: filepath,
          type: 'file'
        });
      }
    }
    return files_list;
  }
}

module.exports = {
  Explorer
};
