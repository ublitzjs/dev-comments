![ublitzjs](https://github.com/ublitzjs/core/blob/main/logo.png)

# @ublitzjs/dev-comments package for removing unused code using build step

This package (currently) removes all code between <code>/\*\_START_DEV\_\*/</code> comment and <code>/\*\_END_DEV\_\*/</code>.

## minifyFile

For example, there is a file with console.log
_some.js_

```javascript
let a = 10;
console.log("BEFORE", a);
a = await doSomething(a);
console.log("AFTER", a);
sendSomewhere(a);
```

But you want to debug this code AND don't care about that when the project goes to production<br>
Just do this (esm or cjs - no difference)

_some.js_

```javascript
let a = 10;
/*_START_DEV_*/ console.log("BEFORE", a); /*_END_DEV_*/
a = await prepare(a);
/*_START_DEV_*/ console.log("AFTER", a); /*_END_DEV_*/
sendSomewhere(a);
```

and in separate file define "build" script

_build.js_

```javascript
import { minifyFile } from "@ublitzjs/dev-comments";
import path from "node:path";
await minifyFile(
  /*absolute paths*/
  path.resolve(import.meta.dirname, "./some.js"),
  path.resolve(import.meta.dirname, "./some.output.js")
);
```

It will generate the file as follows

```javascript
let a = 10;

a = await doSomething(a);

sendSomewhere(a);
```

## minifyFolder

this function goes through all given file paths (which are off thee same format as keys of return type of "@ublitzjs/static".analyzeFolder function)

```javascript
import { minifyFolder } from "@ublitzjs/dev-comments";

minifyFolder(
  /*input directory path relative ot absolute path*/ "from",
  /*ouput dir path*/ "to",
  /*files */ ["b.js"]
);
```

and example using analyzeFolder from "static" package

```javascript
import { minifyFolder } from "@ublitzjs/dev-comments";
import { analyzeFolder } from "@ublitzjs/static";

await minifyFolder(
  "from",
  "to",
  Object.keys(await analyzeFolder("from", { deleteMimesList: true }))
);
```
