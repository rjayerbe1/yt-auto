import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || './logs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    try {
      // Función para sanitizar objetos circulares
      const sanitizeCircular = (obj: any, seen = new WeakSet()): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (seen.has(obj)) return '[Circular]';
        
        seen.add(obj);
        
        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeCircular(item, seen));
        }
        
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Omitir propiedades problemáticas comunes
          if (['socket', '_httpMessage', 'req', 'res', 'client', '_socket'].includes(key)) {
            sanitized[key] = '[Omitted]';
          } else if (value instanceof Error) {
            sanitized[key] = { message: value.message, stack: value.stack };
          } else {
            sanitized[key] = sanitizeCircular(value, seen);
          }
        }
        return sanitized;
      };
      
      const metaStr = Object.keys(meta).length 
        ? JSON.stringify(sanitizeCircular(meta), null, 2) 
        : '';
        
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    } catch (err) {
      // Si falla el stringify, solo mostrar el mensaje básico
      return `${timestamp} [${level}]: ${message}`;
    }
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'yt-auto' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create child loggers for specific modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};