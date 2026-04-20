const Call = require("../models/callModel");
const Tenant = require("../models/tenantModel");
const Contact = require("../models/contactModel");
const {
  buildPhoneToNameMap,
  contactNameForPhone,
} = require("../utils/contactPhoneLookup");

exports.getCalls = async (req, res, next) => {
  try {
    const filter = { tenant_id: req.user.tenant_id };
    const { date, from, to, q } = req.query;

    if (from && to) {
      const start = new Date(String(from));
      const end = new Date(String(to));
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end > start
      ) {
        filter.time = { $gte: start, $lt: end };
      }
    } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      const [y, m, d] = String(date).split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, d));
      const end = new Date(Date.UTC(y, m - 1, d + 1));
      filter.time = { $gte: start, $lt: end };
    }

    const search = typeof q === "string" ? q.trim() : "";
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      filter.$or = [{ from: rx }, { to: rx }];
    }

    const calls = await Call.find(filter).sort("-createdAt").lean();
    const contacts = await Contact.find({
      tenant_id: req.user.tenant_id,
    })
      .select("phone_no first_name last_name")
      .lean();
    const phoneToName = buildPhoneToNameMap(contacts);
    const data = calls.map((c) => {
      const to_name = contactNameForPhone(c.to, phoneToName);
      return to_name ? { ...c, to_name } : c;
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Webhook for Exotel to hit: /exotel/press/1
// Will be a GET request with query params
exports.exotelWebhook = async (req, res, next) => {
  try {
    const keypad_no = req.params.keypad_no;
    let status = "";

    if (keypad_no === "1") {
      status = "completed";
    } else if (keypad_no === "10") {
      status = "did_not_respond";
    }

    const data = req.query;
    console.log("Webhook received:", data);

    const exotelTenantId =
      data.tenant_id != null && data.tenant_id !== ""
        ? String(data.tenant_id).trim()
        : null;

    const tenant = exotelTenantId
      ? await Tenant.findOne({ exotel_tenant_id: exotelTenantId })
      : null;

    if (!tenant) {
      if (exotelTenantId) {
        console.warn(
          "Exotel webhook: no tenant for exotel_tenant_id=%s",
          exotelTenantId,
        );
      } else {
        console.warn("Exotel webhook: tenant_id query param missing");
      }
      return res.status(200).send("OK");
    }

    const callCreatePayload = {
      from: data.CallTo || data.From || "Unknown",
      to: data.CallFrom || data.To || "Unknown",
      time: data.StartTime || new Date(),
      metadata: data,
      status: status,
      tenant_id: tenant._id,
    };

    const call = await Call.create(callCreatePayload);
    const io = req.app.get("io");
    if (io) {
      const contacts = await Contact.find({ tenant_id: tenant._id })
        .select("phone_no first_name last_name")
        .lean();
      const phoneToName = buildPhoneToNameMap(contacts);
      const payload = call.toObject();
      const to_name = contactNameForPhone(call.to, phoneToName);
      if (to_name) payload.to_name = to_name;
      io.emit("new_call", payload);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Error");
  }
};
