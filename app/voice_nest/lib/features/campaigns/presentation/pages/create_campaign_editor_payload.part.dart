part of 'create_campaign_editor.dart';

({String? error, Map<String, dynamic>? payload}) _ccBuildCampaignPayload(
  _CreateCampaignEditorState s,
  List<AppFlow> flows,
) {
  final name = s._nameController.text.trim();
  if (name.isEmpty) {
    return (error: 'Campaign name is required', payload: null);
  }
  if (name.length < 3) {
    return (error: 'Use at least 3 characters for the campaign name (Exotel)', payload: null);
  }
  if (s._selectedCallerId == null) {
    return (error: 'Select a Caller ID', payload: null);
  }

  if (s._audienceMode == CreateAudienceMode.csvUpload) {
    if (s._csvPhones.isEmpty) {
      return (error: 'Upload a CSV with a number column', payload: null);
    }
  } else if (s._selectedListIds.isEmpty) {
    return (error: 'Select at least one list', payload: null);
  }

  if (s._audienceMode == CreateAudienceMode.staticList &&
      s._selectedListIds.length > CreateCampaignAudienceSection.kMaxStaticLists) {
    return (error: 'Select at most ${CreateCampaignAudienceSection.kMaxStaticLists} lists', payload: null);
  }

  final flowType = s._contentMode == CreateContentMode.readText ? 'greeting' : 'ivr';
  if (flowType == 'greeting' && s._readTextController.text.trim().isEmpty) {
    return (error: 'Enter read-out text', payload: null);
  }
  if (flowType == 'ivr' && s._selectedFlowId == null) {
    return (error: 'Select a flow', payload: null);
  }

  if (s._scheduleChoice == CreateScheduleChoice.later) {
    if (s._sendAt == null || s._endAt == null) {
      return (error: 'Pick start and end for scheduled campaign', payload: null);
    }
    if (!s._endAt!.isAfter(s._sendAt!)) {
      return (error: 'End time must be after start time', payload: null);
    }
  }

  final appId = _ccAppIdFor(s, flows);
  final schedule =
      s._scheduleChoice == CreateScheduleChoice.later && s._sendAt != null && s._endAt != null
          ? {
              'send_at': toRfc3339WithOffset(s._sendAt!.toLocal()),
              'end_at': toRfc3339WithOffset(s._endAt!.toLocal()),
            }
          : {'send_at': '', 'end_at': ''};

  final onStatus = <String>[];
  if (s._retryBusy) onStatus.add('busy');
  if (s._retryNoAnswer) onStatus.add('no-answer');
  if (s._retryFailed) onStatus.add('failed');
  if (onStatus.isEmpty) onStatus.addAll(['busy', 'no-answer', 'failed']);

  final interval = int.tryParse(s._intervalController.text.trim()) ?? 1;
  final repeatMenuIvr =
      flowType == 'ivr' ? (int.tryParse(s._repeatMenuController.text.trim()) ?? 0) : 0;

  final payload = <String, dynamic>{
    'name': name,
    'lists': s._audienceMode == CreateAudienceMode.csvUpload ? <String>[] : s._selectedListIds.toList(),
    if (s._audienceMode == CreateAudienceMode.csvUpload && s._csvPhones.isNotEmpty) 'from': s._csvPhones,
    'caller_id': s._selectedCallerId,
    'campaign_type': _ccExotelCampaignType(s),
    'flow_type': flowType,
    if (flowType == 'greeting') 'read_via_text': s._readTextController.text.trim(),
    if (flowType == 'ivr') 'url': appId,
    'sync_to_exotel': s._syncToExotel,
    'type': s._callTypeTrans ? 'trans' : 'promo',
    'call_duplicate_numbers': s._callDuplicates,
    'mode': s._throttleAuto ? 'auto' : 'custom',
    if (!s._throttleAuto) 'throttle': int.tryParse(s._throttleCpmController.text.trim()) ?? 1,
    'retries': {
      'number_of_retries': s._retryCount,
      'interval_mins': interval < 1 ? 1 : interval,
      'mechanism': s._mechanism,
      'on_status': onStatus,
    },
    'schedule': schedule,
    if (s._statusCbController.text.trim().isNotEmpty) 'status_callback': s._statusCbController.text.trim(),
    if (s._callStatusCbController.text.trim().isNotEmpty)
      'call_status_callback': s._callStatusCbController.text.trim(),
    if (s._callScheduleCbController.text.trim().isNotEmpty)
      'call_schedule_callback': s._callScheduleCbController.text.trim(),
    if (s._customFieldController.text.trim().isNotEmpty) 'custom_field': s._customFieldController.text.trim(),
    if (repeatMenuIvr > 0) 'repeat_menu_attempts': repeatMenuIvr,
  };

  return (error: null, payload: payload);
}

String _ccExotelCampaignType(_CreateCampaignEditorState s) {
  if (s._audienceMode == CreateAudienceMode.dynamicList) return 'dynamic';
  return 'static';
}

String _ccAppIdFor(_CreateCampaignEditorState s, List<AppFlow> flows) {
  if (s._selectedFlowId == null) return '';
  return flows
      .firstWhere(
        (f) => f.id == s._selectedFlowId,
        orElse: () => AppFlow(id: '', name: '', appId: '', tags: const []),
      )
      .appId;
}
