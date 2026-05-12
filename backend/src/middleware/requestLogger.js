function requestLogger(req, res, next) {
  const startNs = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    const contentLength = res.getHeader('content-length') || '-';
    console.log(
      `[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${elapsedMs.toFixed(1)}ms len=${contentLength}`
    );
  });

  next();
}

module.exports = {
  requestLogger,
};

