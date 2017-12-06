import sqlite3 from 'sqlite3';
import os from 'os';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import slugify from 'slugify';
import metalsmith from 'metalsmith';
import markdown from 'metalsmith-markdown';
import metalsmithPrism from 'metalsmith-prism';
import collections from 'metalsmith-collections';
import permalinks from 'metalsmith-permalinks';
import assets from 'metalsmith-assets';
import layouts from 'metalsmith-layouts';

const sqlite3Verbose = sqlite3.verbose();

const dbPath = path.resolve(`${os.homedir()}/Library/Containers/net.shinyfrog.bear/Data/Documents/Application\ Data/database.sqlite`);

var db = new sqlite3Verbose.Database(dbPath, sqlite3.OPEN_READONLY);


mkdirp(path.resolve('notes'));

db.each("SELECT Z_PK as id, ZTITLE AS title, ZCREATIONDATE as date, ZTEXT as text FROM ZSFNOTE", function(err, row) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    const unix = new Date(1970, 1, 1);
    const cocoa = new Date(2001, 1, 1);
    const diff = cocoa - unix;

    console.log(row.date, diff);
    const date = new Date((Math.floor(row.date*1000) + diff));
    const dateString = date.toISOString();

    fs.writeFileSync(path.resolve(`notes/${row.id}-${slugify(row.title)}.md`), `---
title: ${row.title}
collection: notes
date: ${dateString}
layout: layout.hbs
slug: ${row.id}-${slugify(row.title)}
---

${row.text}`);
    console.log(`> Written ${slugify(row.title)}`);
});

metalsmith(process.cwd())
    .source('notes')
    .clean(true)    
    .destination('dist')
    .use(markdown({
        smartypants: true,
        gfm: true,
        tables: true,
        langPrefix: 'language-'
    }))
    .use(metalsmithPrism())
    .use(assets({ // Compiles assets from working directory to build directory.
        source: './assets', // relative to the working directory
        destination: './assets' // relative to the build directory
      }))
    .use(collections({
        notes: {
            pattern: '*',
            'sort-by': 'date',
            reverse: true,
            refer: true
        }
    }))
    .use(layouts({ //Layouts plugin
        engine: "handlebars", // Use Handlebars.
        partials: "partials" // Partials are in the "partials" directory.
      }))
    // .use(permalinks({                       // generate permalinks
    //     pattern: ':mainCollection/:title'
    // }))
    .build((err) => {
        if(err) {
            console.log(err);
        }
    })
;

console.log('🎉   Done');


  
  db.close();