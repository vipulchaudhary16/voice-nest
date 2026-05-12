const Campaign = require('../models/campaignModel');
const Tenant = require('../models/tenantModel');
const Exophone = require('../models/exophoneModel');
const List = require('../models/listModel');
const exotelService = require('../services/exotelService');

exports.getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ tenant_id: req.user.tenant_id })
      .populate('caller_id')
      .populate('lists');
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
      .populate('caller_id')
      .populate('lists');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
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
      from,
      caller_id,
      campaign_type,
      flow_type,
      read_via_text,
      url,
      retries,
      schedule,
      sync_to_exotel,
      type,
      call_duplicate_numbers,
      status_callback,
      call_status_callback,
      call_schedule_callback,
      mode,
      throttle,
      custom_field,
      repeat_menu_attempts,
    } = req.body;

    const caller = await Exophone.findById(caller_id);
    if (!caller) return res.status(404).json({ success: false, message: 'Caller ID not found' });

    const tenant = await Tenant.findById(req.user.tenant_id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    let exotelUrl = url;
    // ExoML applet: numeric app id → full start_voice URL (UI "IVR Applet" uses flow_type ivr + id)
    if (flow_type === 'ivr' && url && !String(url).includes('http')) {
      exotelUrl = `http://my.exotel.com/${tenant.ivr_data.account_sid}/exoml/start_voice/${url}`;
    }

    let final_sid = null;

    const fromTrimmed = typeof from === 'string' ? from.trim() : '';

    if (sync_to_exotel) {
      const listIds = Array.isArray(lists) ? lists : [];
      const listDocs = listIds.length ? await List.find({ _id: { $in: listIds } }) : [];
      const exotelLists = listDocs.map((l) => l.exotel_sid).filter((sid) => sid);

      if (!exotelLists.length && !fromTrimmed) {
        return res.status(400).json({
          success: false,
          message: 'Provide at least one synced list or phone numbers in `from` for Exotel sync',
        });
      }

      // Exotel rejects flow_type "ivr" together with url (error 1002). Greeting uses
      // flow_type + read_via_text; ExoML flows use url only (no flow_type in request).
      const payload = {
        name,
        caller_id: caller.phone_no,
        campaign_type: campaign_type || 'static',
        retries,
        schedule:
          schedule && schedule.send_at && schedule.end_at
            ? {
                send_at: schedule.send_at,
                end_at: schedule.end_at,
              }
            : null,
      };

      if (exotelLists.length) payload.lists = exotelLists;
      if (fromTrimmed) payload.from = fromTrimmed;
      if (type === 'promo' || type === 'trans') payload.type = type;
      if (typeof call_duplicate_numbers === 'boolean') {
        payload.call_duplicate_numbers = call_duplicate_numbers;
      }
      if (status_callback) payload.status_callback = status_callback;
      if (call_status_callback) payload.call_status_callback = call_status_callback;
      if (call_schedule_callback) payload.call_schedule_callback = call_schedule_callback;
      if (mode === 'custom' || mode === 'auto') payload.mode = mode;
      if (mode === 'custom' && throttle != null && throttle !== '') {
        payload.throttle = Number(throttle);
      }
      if (custom_field) payload.custom_field = String(custom_field);

      // Exotel: greeting vs ExoML URL are mutually exclusive. Do not send read_via_text
      // on URL campaigns (null can be treated as greeting). repeat_menu_attempts is only
      // valid for IVR — error 1002 if sent for greeting.
      if (flow_type === 'greeting') {
        payload.flow_type = 'greeting';
        payload.read_via_text = read_via_text ?? null;
      } else {
        payload.url = exotelUrl;
        const r = repeat_menu_attempts;
        if (r != null && r !== '' && Number(r) > 0) {
          payload.repeat_menu_attempts = Number(r);
        }
      }

      console.log('payload', payload);

      const syncRes = await exotelService.createCampaign(tenant, payload);

      if (syncRes && syncRes.response && syncRes.response.length > 0) {
        if (syncRes.response[0].status === 'success') {
          final_sid = syncRes.response[0].data.id;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Exotel Campaign Creation Failed',
            error: syncRes.response[0].error_data,
          });
        }
      }
    }

    const campaign = await Campaign.create({
      name,
      lists: Array.isArray(lists) ? lists : [],
      caller_id,
      campaign_type,
      flow_type,
      read_via_text,
      url: exotelUrl || url,
      retries,
      schedule,
      from_numbers: fromTrimmed || undefined,
      type: type === 'promo' ? 'promo' : 'trans',
      call_duplicate_numbers:
        typeof call_duplicate_numbers === 'boolean' ? call_duplicate_numbers : false,
      status_callback: status_callback || undefined,
      call_status_callback: call_status_callback || undefined,
      call_schedule_callback: call_schedule_callback || undefined,
      mode: mode === 'custom' ? 'custom' : 'auto',
      throttle: mode === 'custom' && throttle != null ? Number(throttle) : undefined,
      custom_field: custom_field || undefined,
      repeat_menu_attempts:
        repeat_menu_attempts != null && repeat_menu_attempts !== ''
          ? Number(repeat_menu_attempts)
          : 0,
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
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    if (campaign.exotel_sid) {
      const tenant = await Tenant.findById(req.user.tenant_id);
      try {
        await exotelService.deleteCampaign(tenant, campaign.exotel_sid);
      } catch (err) {
        console.error('Failed to delete on Exotel:', err.message);
      }
    }

    await campaign.deleteOne();
    res.status(200).json({ success: true, data: {} });
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
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (!campaign.exotel_sid) {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not synced to Exotel',
      });
    }

    const tenant = await Tenant.findById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const details = await exotelService.getCampaignCallDetails(
      tenant,
      campaign.exotel_sid,
      req.query
    );

    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
};
