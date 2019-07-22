'use strict';

const fs = require('fs');
const path = require('path');
const ticketParser = require('../src/ticketParser');

describe('Ticker parser', () => {
    let ticketHtml;
    let ticketJsonExpected;

    beforeAll(() => {
        ticketHtml = fs.readFileSync(path.join(__dirname, './test.html'), 'utf8')
            .replace(/(\\r|\\n|\\)/g, '');
        
        ticketJsonExpected = JSON.parse(fs.readFileSync(path.join(__dirname, './test.json'), 'utf8'));
    });

    describe('Ticket parsing', () => {
        it('converts a ticket to json', () => {
            const ticketJson = ticketParser.parse(ticketHtml);

            expect(ticketJson).toEqual(ticketJsonExpected);
        });
    });

    describe('Validate ticket parsing', () => {
        describe('When a ticket is parsed correctly', () => {
            it('returns ok status ', () => {
                const result = ticketParser.validate(ticketJsonExpected);

                expect(result).toMatchObject({
                    status: 'ok',
                    result: ticketJsonExpected,
                });
            });
        });

        describe('When a ticket is not parsed correctly', () => {
            let ticketJsonUnexpected;

            beforeAll(() => {
                ticketJsonUnexpected = {
                    ...ticketJsonExpected,
                    name: 42,
                };
            });

            it('returns nok status', () => {
                const result = ticketParser.validate(ticketJsonUnexpected);

                expect(result).toMatchObject({
                    status: 'nok',
                    result: ticketJsonUnexpected,
                });
            });
        });
    });
});
