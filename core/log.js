const {createWriteStream} = require('fs');
const path = require('path');
const pino = require('pino');
const udpTransport = require('pino-udp');
const {multistream} = require('pino-multi-stream');
const ecsFormat = require('@elastic/ecs-pino-format');
const config = require('./config');

const datadir = process.env.DATADIR;
const {level, enabled} = config.log;
const options = {enabled, formatters: ecsFormat(), level: pino.levels.values[level]};
const streams = [];
const sendTo = config.log.sendLogsTo || process.env.SEND_LOGS_TO;

if (sendTo) {
    const [address, port] = sendTo.split('://').pop().split(':');
    streams.push(new udpTransport({address, port}));
}

streams.push(
    {level: options.level, stream: pino({prettyPrint: {colorize: true}})[pino.symbols.streamSym]},
    {level: options.level, stream: createWriteStream(path.resolve(path.join(datadir, 'point.log')))}
);

module.exports = Object.assign(pino(options, multistream(streams)), {
    close() {
        for (const {stream} in streams) {
            if (stream && typeof stream.close === 'function') {
                stream.close();
            }
        }
    }
});