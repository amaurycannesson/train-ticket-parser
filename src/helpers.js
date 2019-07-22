'use strict';

const moment = require('moment');

function toISODate(text) {
    return moment(text, 'DD/MM/YYYY', true).hours(2).minute(0).second(0).toISOString();
}

exports.toNumber = (text) => {
    return text.replace(/([^0-9,.])/g, '').replace(/,/g, '.')*1;
}

exports.extractDate = (text) => {
    return text.match(/([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}/g)
        .map(textDate => toISODate(textDate).replace(/T/, ' '));
}
