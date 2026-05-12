import 'package:flutter/material.dart';

import '../../../../shared/models/app_models.dart';
import '../create_campaign_models.dart';
import 'create_campaign_advanced_section.dart';
import 'create_campaign_audience_section.dart';
import 'create_campaign_content_section.dart';
import 'create_campaign_name_section.dart';
import 'create_campaign_schedule_section.dart';

class CreateCampaignForm extends StatelessWidget {
  const CreateCampaignForm({
    required this.nameController,
    required this.audienceMode,
    required this.selectedListIds,
    required this.lists,
    required this.csvFileName,
    required this.contentMode,
    required this.readTextController,
    required this.flows,
    required this.selectedFlowId,
    required this.exophones,
    required this.selectedCallerId,
    required this.callTypeTrans,
    required this.scheduleChoice,
    required this.sendAt,
    required this.endAt,
    required this.retryCount,
    required this.intervalController,
    required this.mechanism,
    required this.retryBusy,
    required this.retryNoAnswer,
    required this.retryFailed,
    required this.callDuplicates,
    required this.throttleAuto,
    required this.throttleCpmController,
    required this.statusCallbackController,
    required this.callStatusCallbackController,
    required this.callScheduleCallbackController,
    required this.customFieldController,
    required this.repeatMenuController,
    required this.syncToExotel,
    required this.onAudienceModeChanged,
    required this.onToggleList,
    required this.onCsvParsed,
    required this.onClearCsv,
    required this.onContentModeChanged,
    required this.onFlowChanged,
    required this.onCallerIdChanged,
    required this.onCallTypeTransChanged,
    required this.onScheduleChanged,
    required this.onPickSend,
    required this.onPickEnd,
    required this.onRetryCountChanged,
    required this.onMechanismChanged,
    required this.onRetryBusy,
    required this.onRetryNoAnswer,
    required this.onRetryFailed,
    required this.onCallDuplicatesChanged,
    required this.onThrottleAutoChanged,
    required this.onSyncChanged,
    this.scrollController,
    super.key,
  });

  final TextEditingController nameController;
  final CreateAudienceMode audienceMode;
  final Set<String> selectedListIds;
  final List<ContactList> lists;
  final String? csvFileName;
  final CreateContentMode contentMode;
  final TextEditingController readTextController;
  final List<AppFlow> flows;
  final String? selectedFlowId;
  final List<Exophone> exophones;
  final String? selectedCallerId;
  final bool callTypeTrans;
  final CreateScheduleChoice scheduleChoice;
  final DateTime? sendAt;
  final DateTime? endAt;
  final int retryCount;
  final TextEditingController intervalController;
  final String mechanism;
  final bool retryBusy;
  final bool retryNoAnswer;
  final bool retryFailed;
  final bool callDuplicates;
  final bool throttleAuto;
  final TextEditingController throttleCpmController;
  final TextEditingController statusCallbackController;
  final TextEditingController callStatusCallbackController;
  final TextEditingController callScheduleCallbackController;
  final TextEditingController customFieldController;
  final TextEditingController repeatMenuController;
  final bool syncToExotel;
  final ScrollController? scrollController;
  final ValueChanged<CreateAudienceMode> onAudienceModeChanged;
  final ValueChanged<ContactList> onToggleList;
  final void Function(String fileName, String phones) onCsvParsed;
  final VoidCallback onClearCsv;
  final ValueChanged<CreateContentMode> onContentModeChanged;
  final ValueChanged<String?> onFlowChanged;
  final ValueChanged<String?> onCallerIdChanged;
  final ValueChanged<bool> onCallTypeTransChanged;
  final ValueChanged<CreateScheduleChoice> onScheduleChanged;
  final VoidCallback onPickSend;
  final VoidCallback onPickEnd;
  final ValueChanged<int> onRetryCountChanged;
  final ValueChanged<String?> onMechanismChanged;
  final ValueChanged<bool> onRetryBusy;
  final ValueChanged<bool> onRetryNoAnswer;
  final ValueChanged<bool> onRetryFailed;
  final ValueChanged<bool> onCallDuplicatesChanged;
  final ValueChanged<bool> onThrottleAutoChanged;
  final ValueChanged<bool?> onSyncChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CreateCampaignNameSection(nameController: nameController),
          const SizedBox(height: 12),
          CreateCampaignAudienceSection(
            audienceMode: audienceMode,
            selectedListIds: selectedListIds,
            lists: lists,
            csvFileLabel: csvFileName,
            onAudienceModeChanged: onAudienceModeChanged,
            onToggleList: onToggleList,
            onCsvParsed: onCsvParsed,
            onClearCsv: onClearCsv,
          ),
          const SizedBox(height: 12),
          CreateCampaignContentSection(
            contentMode: contentMode,
            readTextController: readTextController,
            flows: flows,
            selectedFlowId: selectedFlowId,
            exophones: exophones,
            selectedCallerId: selectedCallerId,
            callTypeTrans: callTypeTrans,
            onContentModeChanged: onContentModeChanged,
            onFlowChanged: onFlowChanged,
            onCallerIdChanged: onCallerIdChanged,
            onCallTypeTransChanged: onCallTypeTransChanged,
          ),
          const SizedBox(height: 12),
          CreateCampaignScheduleSection(
            scheduleChoice: scheduleChoice,
            sendAt: sendAt,
            endAt: endAt,
            onScheduleChanged: onScheduleChanged,
            onPickSend: onPickSend,
            onPickEnd: onPickEnd,
          ),
          const SizedBox(height: 12),
          CreateCampaignAdvancedSection(
            retryCount: retryCount,
            intervalController: intervalController,
            mechanism: mechanism,
            retryBusy: retryBusy,
            retryNoAnswer: retryNoAnswer,
            retryFailed: retryFailed,
            callDuplicates: callDuplicates,
            throttleAuto: throttleAuto,
            throttleCpmController: throttleCpmController,
            statusCallbackController: statusCallbackController,
            callStatusCallbackController: callStatusCallbackController,
            callScheduleCallbackController: callScheduleCallbackController,
            customFieldController: customFieldController,
            repeatMenuController: repeatMenuController,
            syncToExotel: syncToExotel,
            onRetryCountChanged: onRetryCountChanged,
            onMechanismChanged: onMechanismChanged,
            onRetryBusy: onRetryBusy,
            onRetryNoAnswer: onRetryNoAnswer,
            onRetryFailed: onRetryFailed,
            onCallDuplicatesChanged: onCallDuplicatesChanged,
            onThrottleAutoChanged: onThrottleAutoChanged,
            onSyncChanged: onSyncChanged,
          ),
        ],
      ),
    );
  }
}
