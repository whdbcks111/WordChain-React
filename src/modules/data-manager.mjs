import fs from 'fs';

export function loadDataFile(filePath, objGetter) {
  if (fs.existsSync(filePath)) {
    fs.readFile(filePath, 'utf-8', ((err, data) => {
      Object.assign(objGetter(), JSON.parse(data));
    }));
  }
}

export function saveDataFileImmediately(filePath, obj) {
  let seen = new WeakSet();
  fs.writeFile(filePath,
    JSON.stringify(obj, (k, v) => {
      if(typeof v === 'object' && v !== null) {
        if(seen.has(v)) return null;
        seen.add(v);
      }
      return v;
    }, 4), 'utf-8', err => {
      if (err) console.log(err);
    });
}

export function saveDataFile(filePath, objGetter, intervalTime) {
  setInterval(() => {
    let seen = new WeakSet();
    fs.writeFile(filePath,
      JSON.stringify(objGetter(), (k, v) => {
        if(typeof v === 'object' && v !== null) {
          if(seen.has(v)) return null;
          seen.add(v);
        }
        return v;
      }, 4), 'utf-8', err => {
        if (err) console.log(err);
      });
  }, Math.floor(intervalTime * 1000));
}