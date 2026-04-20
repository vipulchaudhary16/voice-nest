const Campaign = require("../models/campaignModel");
const Tenant = require("../models/tenantModel");
const Exophone = require("../models/exophoneModel");
const List = require("../models/listModel");
const exotelService = require("../services/exotelService");

exports.getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ tenant_id: req.user.tenant_id })
      .populate("caller_id")
      .populate("lists");
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

exports.getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    })
      .populate("caller_id")
      .populate("lists");
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const {
      name,
      lists,
      caller_id,
      campaign_type,
      flow_type,
      read_via_text,
      url,
      retries,
      schedule,
      sync_to_exotel,
    } = req.body;

    const caller = await Exophone.findById(caller_id);
    if (!caller)
      return res
        .status(404)
        .json({ success: false, message: "Caller ID not found" });

    const tenant = await Tenant.findById(req.user.tenant_id);
    if (!tenant)
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });

    let exotelUrl = url;
    // ExoML applet: numeric app id → full start_voice URL (UI "IVR Applet" uses flow_type ivr + id)
    if (flow_type === "ivr" && url && !String(url).includes("http")) {
      exotelUrl = `http://my.exotel.com/${tenant.ivr_data.account_sid}/exoml/start_voice/${url}`;
    }

    let final_sid = null;

    if (sync_to_exotel) {
      const listDocs = await List.find({ _id: { $in: lists } });
      const exotelLists = listDocs
        .map((l) => l.exotel_sid)
        .filter((sid) => sid);

      // Exotel rejects flow_type "ivr" together with url (error 1002). Greeting uses
      // flow_type + read_via_text; ExoML flows use url only (no flow_type in request).
      const payload = {
        name,
        caller_id: caller.phone_no,
        lists: exotelLists,
        campaign_type: campaign_type || "static",
        retries,
        schedule:
          schedule && schedule.send_at && schedule.end_at
            ? {
                send_at: schedule.send_at,
                end_at: schedule.end_at,
              }
            : null,
      };

      if (flow_type === "greeting") {
        payload.flow_type = "greeting";
        payload.read_via_text = read_via_text ?? null;
      } else {
        payload.url = exotelUrl;
        payload.read_via_text = null;
      }

      console.log("payload", payload);

      const syncRes = await exotelService.createCampaign(tenant, payload);

      if (syncRes && syncRes.response && syncRes.response.length > 0) {
        if (syncRes.response[0].status === "success") {
          final_sid = syncRes.response[0].data.id;
        } else {
          return res.status(400).json({
            success: false,
            message: "Exotel Campaign Creation Failed",
            error: syncRes.response[0].error_data,
          });
        }
      }
    }

    const campaign = await Campaign.create({
      name,
      lists,
      caller_id,
      campaign_type,
      flow_type,
      read_via_text,
      url: exotelUrl || url,
      retries,
      schedule,
      exotel_sid: final_sid,
      tenant_id: req.user.tenant_id,
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });

    if (campaign.exotel_sid) {
      const tenant = await Tenant.findById(req.user.tenant_id);
      try {
        await exotelService.deleteCampaign(tenant, campaign.exotel_sid);
      } catch (err) {
        console.error("Failed to delete on Exotel:", err.message);
      }
    }

    await campaign.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const { action } = req.body;
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });

    if (action && campaign.exotel_sid) {
      const tenant = await Tenant.findById(req.user.tenant_id);
      try {
        await exotelService.updateCampaign(tenant, campaign.exotel_sid, {
          action,
        });
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    if (action) {
      campaign.status =
        action === "complete"
          ? "Completed"
          : action === "pause"
            ? "paused"
            : action === "resume"
              ? "InProgress"
              : action;
      await campaign.save();
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

exports.getCampaignCallDetails = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    if (!campaign.exotel_sid) {
      return res.status(400).json({
        success: false,
        message: "Campaign is not synced to Exotel",
      });
    }

    const tenant = await Tenant.findById(req.user.tenant_id);
    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    const details = await exotelService.getCampaignCallDetails(
      tenant,
      campaign.exotel_sid,
      req.query,
    );

    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
};
