#!/usr/bin/env node

'use strict';

const fs = require('fs');
const _ = require('xutil');
const path = require('path');
const moment = require('moment');
const child_process = require('child_process');
const homeDir = require('os').homedir();
const argv = require('minimist')(process.argv.slice(2));

const pullgitTmpFile = path.join(homeDir, 'pullgit-result.json');

const {
  chalk
} = _;

const rootDir = process.cwd();

console.log(`walk from: ${chalk.cyan(rootDir)}`);

const isGitProject = (directory) => {
  const gitPath = path.join(directory, '.git');
  return _.isExistedDir(gitPath);
};

const result = [];

function gitCheckoutMaster(dist) {
  console.log(`git checkout master ${chalk.green(dist)}`);
  const out0 = child_process.spawnSync('git', ['checkout', 'master'], {
    cwd: dist
  });
  console.log(`${chalk.yellow(out0.stdout.toString().trim())}`);
}

const traversal = root => {
  const list = fs.readdirSync(root);
  list.forEach(item => {
    const dist = path.join(root, item);
    if (isGitProject(dist)) {
      try {
        if (argv.master) {
          gitCheckoutMaster(dist);
        }
        console.log(`git pull ${chalk.green(dist)}`);
        const out1 = child_process.spawnSync('git', ['pull'], {
          cwd: dist
        });
        console.log(`${chalk.yellow(out1.stdout.toString().trim())}`);

        console.log(`git fetch -p ${chalk.green(dist)}`);
        const out2 = child_process.spawnSync('git', ['fetch', '-p'], {
          cwd: dist
        });
        console.log(`${chalk.yellow(out2.stdout.toString().trim())}`);
        const { ctime } = fs.statSync(dist);
        result.push({
          ctime,
          dist
        });
        const res = result
          .sort((a, b) => a.ctime - b.ctime)
          .map(item => `${moment(item.ctime).format('YYYY.MM.DD hh:mm:ss')}|${item.dist}`);
        fs.writeFileSync(pullgitTmpFile, JSON.stringify(res, null, 2));
      } catch (e) {
        console.log(e);
      }
    } else if (_.isExistedDir(dist)) {
      traversal(dist);
    } else {
      console.log(`skip ${chalk.red(dist)}`);
    }
  });
};

traversal(rootDir);
