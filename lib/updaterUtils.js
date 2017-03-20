/**
 * Object literal with functions useful to the main script.
 */

const logger = require('winston');

const updaterUtils = {
  /**
   * Configure the logger properly. Different behaviour is added depending
   * if the logger is run in production or development.
   *
   * @param {object} config The configuration object
   * @returns {object} winston logger object.
   */
  setupLogger(config) {
    logger.remove(logger.transports.Console);

    let options = {
      colorize: true,
      timestamp: true,
      json: false
    };

    switch (process.env.NODE_ENV) {
      case 'development':
      case 'docker':
      case 'integration':
      case 'test':
        console.log(`Environment is ${process.env.NODE_ENV}, logging to: Console.`);
        logger.add(logger.transports.Console, options);
        break;
      default:
        console.log(`Environment is ${process.env.NODE_ENV}, logging to ${config.logfile}.`);
        options.filename = config.logfile;
        logger.add(logger.transports.File, options);
        break;
    }

    return logger;
  }
}

module.exports = updaterUtils;
