'use strict';

const cheerio = require('cheerio');
const _ = require('lodash');
const Joi = require('@hapi/joi');
const { toNumber, extractDate } = require('./helpers');

function parseTrains($, productEl) {
    const departureEl = $(productEl).find('tr').first();
    const arrivalEl = $(productEl).find('tr').last();

    return {
        departureTime: departureEl.find('.origin-destination-hour').text().trim().replace(/h/, ':'),
        departureStation: departureEl.find('.origin-destination-station').text().trim(),
        arrivalTime: arrivalEl.find('.origin-destination-hour').text().trim().replace(/h/, ':'),
        arrivalStation: arrivalEl.find('.origin-destination-station').text().trim(),
        type: departureEl.find('.segment').first().text().trim(),
        number: departureEl.find('.segment').first().next().text().trim(),
        passengers: $(productEl).next().find('.typology').toArray().map((el) => ({
            age: $(el).contents().last().text().trim(),
            type: $(el).siblings('.fare-details').text().includes('Billet échangeable') ? 'échangeable' : 'non échangeable',
        })),
    };
}

exports.parse = (html) => {
    const $ = cheerio.load(html);

    const code = $('.pnr-ref > .pnr-info').last().text().trim();
    const name = $('.pnr-name > .pnr-info').last().text().trim();
    const roundTripDates = _.flatten($('.pnr-summary').toArray().map((el) => extractDate($(el).text())));
    const roundTrips = $('.product-details')
        .toArray()
        .map((el, i) => ({
            type: $(el).find('.travel-way').text().trim(), 
            date: roundTripDates[i],
            trains: [{ ...parseTrains($, el) }],
        }));
    const amounts = $('.product-header')
        .find('td')
        .toArray()
        .map((el) => $(el).text().includes('€') && $(el).text())
        .filter(text => text)
        .map(text => toNumber(text));

    return {
        trips: [{
            name,
            code,
            details: {
                price: amounts.reduce((sum, amount) => amount + sum, 0),
                roundTrips,
            },
        }],
        custom: { prices: amounts.map((price) => ({ value: price })) },
    };
}

exports.validate = (json) => {
    const ticketSchema = Joi.object().keys({
        trips: Joi.array().items(Joi.object().keys({
            name: Joi.string().min(1).max(20).required(),
            code: Joi.string().min(1).max(10).required(),
            details: Joi.object().keys({
                price: Joi.number().positive().required(),
                roundTrips: Joi.array().items(Joi.object().keys({
                    type: Joi.string().valid('Aller', 'Retour').required(),
                    date: Joi.date().iso().required(),
                    trains: Joi.array().items(Joi.object().keys({
                        departureTime: Joi.string().regex(/[0-9]{2}:[0-9]{2}/).required(),
                        departureStation: Joi.string().min(1).max(25).required(),
                        arrivalTime: Joi.string().regex(/[0-9]{2}:[0-9]{2}/).required(),
                        arrivalStation: Joi.string().min(1).max(25).required(),
                        type: Joi.string().min(1).max(10).required(),
                        number: Joi.string().min(1).max(10).required(),
                        passengers: Joi.array().items(Joi.object().keys({
                            age: Joi.string().min(1).max(20).required(),
                            type: Joi.string().valid('échangeable', 'non échangeable').required(),
                        })).required(),
                    })).required(),
                })).required(),
            }).required(),
        })).required(),
        custom: Joi.object().keys({
            prices: Joi.array().items(Joi.object().keys({
                value: Joi.number().positive().required(),
            }))
        }).required(),
    });
    
    const result = ticketSchema.validate(json);

    const parsingResult = {
        status: result.error ? "nok" : "ok",
        result: json,
    };

    if (result.error) {
        parsingResult.error = result.error.message;
    }

    return parsingResult;
}