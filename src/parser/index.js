const htmlToLinkStream = require('./parser')

const linkStream = new htmlToLinkStream('https://www.w3schools.com/html/')

process.stdin.pipe(linkStream).pipe(process.stdout)