part of 'create_campaign_editor.dart';

Widget _ccBuildEditorForm(
  _CreateCampaignEditorState s, {
  required List<ContactList> lists,
  required List<Exophone> exophones,
  required List<AppFlow> flows,
}) {
  return CreateCampaignForm(
    nameController: s._nameController,
    audienceMode: s._audienceMode,
    selectedListIds: s._selectedListIds,
    lists: lists,
    csvFileName: s._csvFileName,
    contentMode: s._contentMode,
    readTextController: s._readTextController,
    flows: flows,
    selectedFlowId: s._selectedFlowId,
    exophones: exophones,
    selectedCallerId: s._selectedCallerId,
    callTypeTrans: s._callTypeTrans,
    scheduleChoice: s._scheduleChoice,
    sendAt: s._sendAt,
    endAt: s._endAt,
    retryCount: s._retryCount,
    intervalController: s._intervalController,
    mechanism: s._mechanism,
    retryBusy: s._retryBusy,
    retryNoAnswer: s._retryNoAnswer,
    retryFailed: s._retryFailed,
    callDuplicates: s._callDuplicates,
    throttleAuto: s._throttleAuto,
    throttleCpmController: s._throttleCpmController,
    statusCallbackController: s._statusCbController,
    callStatusCallbackController: s._callStatusCbController,
    callScheduleCallbackController: s._callScheduleCbController,
    customFieldController: s._customFieldController,
    repeatMenuController: s._repeatMenuController,
    syncToExotel: s._syncToExotel,
    scrollController: s._scrollController,
    onAudienceModeChanged: s._setAudience,
    onToggleList: s._toggleList,
    onCsvParsed: (name, phones) => s._apply(() {
      s._csvFileName = name;
      s._csvPhones = phones;
    }),
    onClearCsv: () => s._apply(() {
      s._csvPhones = '';
      s._csvFileName = null;
    }),
    onContentModeChanged: (m) => s._apply(() => s._contentMode = m),
    onFlowChanged: (v) => s._apply(() => s._selectedFlowId = v),
    onCallerIdChanged: (v) => s._apply(() => s._selectedCallerId = v),
    onCallTypeTransChanged: (v) => s._apply(() => s._callTypeTrans = v),
    onScheduleChanged: (x) => s._apply(() => s._scheduleChoice = x),
    onPickSend: s._pickSend,
    onPickEnd: s._pickEnd,
    onRetryCountChanged: (n) => s._apply(() => s._retryCount = n),
    onMechanismChanged: (v) => s._apply(() {
          if (v != null) s._mechanism = v;
        }),
    onRetryBusy: (v) => s._apply(() => s._retryBusy = v),
    onRetryNoAnswer: (v) => s._apply(() => s._retryNoAnswer = v),
    onRetryFailed: (v) => s._apply(() => s._retryFailed = v),
    onCallDuplicatesChanged: (v) => s._apply(() => s._callDuplicates = v),
    onThrottleAutoChanged: (v) => s._apply(() => s._throttleAuto = v),
    onSyncChanged: (v) => s._apply(() => s._syncToExotel = v ?? true),
  );
}
