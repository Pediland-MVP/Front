import log4js from 'log4js';
import jsonLayout from 'log4js-json-layout';

log4js.addLayout('json', jsonLayout);
log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'json' } } },
  categories: { default: { appenders: ['out'], level: 'info' } },
});

const logger = log4js.getLogger();
logger.level = 'info';
logger.info('Hello from Log4js-node', { name: 'John', age: 21 });
