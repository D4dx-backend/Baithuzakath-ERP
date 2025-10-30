const fs = require('fs');
const path = require('path');
const config = require('../config/environment');

/**
 * Simple logger utility
 */
class Logger {
  constructor() {
    this.logLevel = config.LOG_LEVEL || 'info';
    this.logFile = config.LOG_FILE || './logs/app.log';
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  /**
   * Write log to file
   */
  writeToFile(formattedMessage) {
    try {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    return levels[level] <= levels[this.logLevel];
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    if (!this.shouldLog('error')) return;

    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;

    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;

    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;

    const formattedMessage = this.formatMessage('debug', message, meta);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log HTTP request
   */
  request(req, res, responseTime) {
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`;
    const meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id
    };

    if (res.statusCode >= 400) {
      this.error(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  /**
   * Log database operation
   */
  database(operation, collection, query = {}, result = {}) {
    const message = `DB ${operation} on ${collection}`;
    const meta = {
      query: JSON.stringify(query),
      result: typeof result === 'object' ? JSON.stringify(result) : result
    };

    this.debug(message, meta);
  }

  /**
   * Log authentication event
   */
  auth(event, userId, details = {}) {
    const message = `Auth ${event} for user ${userId}`;
    this.info(message, details);
  }

  /**
   * Log notification event
   */
  notification(type, recipient, status, details = {}) {
    const message = `${type.toUpperCase()} notification to ${recipient} - ${status}`;
    this.info(message, details);
  }

  /**
   * Log application workflow event
   */
  workflow(applicationId, action, fromStatus, toStatus, userId) {
    const message = `Application ${applicationId} - ${action} by ${userId}`;
    const meta = {
      fromStatus,
      toStatus,
      timestamp: this.getTimestamp()
    };
    this.info(message, meta);
  }

  /**
   * Log payment event
   */
  payment(paymentId, event, amount, userId, details = {}) {
    const message = `Payment ${paymentId} - ${event} - ₹${amount} by ${userId}`;
    this.info(message, details);
  }

  /**
   * Log system event
   */
  system(event, details = {}) {
    const message = `System ${event}`;
    this.info(message, details);
  }
}

module.exports = new Logger();