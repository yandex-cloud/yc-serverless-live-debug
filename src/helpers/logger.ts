import createLogger, { LogLevelNames } from 'console-log-level';

export const logger = createLogger({
  level: <LogLevelNames>process.env.LOG_LEVEL || 'info'
});
