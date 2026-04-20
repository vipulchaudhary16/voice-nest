const { getDefinition, listDefinitions } = require("../import/registry");
const ImportRunner = require("../import/ImportRunner");

exports.listImportTypes = (req, res) => {
  res.status(200).json({ success: true, data: listDefinitions() });
};

exports.downloadTemplate = (req, res, next) => {
  try {
    const type = req.query.type;
    const def = getDefinition(type);
    if (!def) {
      return res.status(400).json({
        success: false,
        message: `Unknown or missing import type. Use ?type=contacts`,
      });
    }
    const body = def.buildTemplateCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${def.templateFileName}"`,
    );
    return res.status(200).send(body);
  } catch (e) {
    return next(e);
  }
};

exports.runImport = async (req, res, next) => {
  try {
    const { type, csvText } = req.body || {};
    const result = await ImportRunner.run(type, csvText, {
      tenant_id: req.user.tenant_id,
      user: req.user,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({
        success: false,
        message: e.message,
      });
    }
    return next(e);
  }
};
