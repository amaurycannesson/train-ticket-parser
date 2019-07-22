'use strict';

const fs = require('fs');
const path = require('path');
const ticketParser = require('./src/ticketParser');

const ticketFilename = process.argv[2] ? path.normalize(process.argv[2]) : './test/test.html';

fs.readFile(ticketFilename, 'utf8', (error, fileContent) => {
    if (error) {
        console.error('Error reading from file');

        throw error;
    }

    const html = fileContent.replace(/(\\r|\\n|\\)/g, '');
    const jsonTicket = ticketParser.parse(html);
    const parsingResult = ticketParser.validate(jsonTicket);

    if (parsingResult.error) {
        console.error(parsingResult.error);
    }

    fs.writeFileSync(path.join(__dirname, 'out/result.json'), JSON.stringify(parsingResult, null, 2));
});
