import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../../../shared/models/app_models.dart';
import '../create_campaign_csv_utils.dart';
import '../create_campaign_models.dart';
import 'create_campaign_section.dart';

class CreateCampaignAudienceSection extends StatelessWidget {
  const CreateCampaignAudienceSection({
    required this.audienceMode,
    required this.selectedListIds,
    required this.lists,
    required this.csvFileLabel,
    required this.onAudienceModeChanged,
    required this.onToggleList,
    required this.onCsvParsed,
    required this.onClearCsv,
    super.key,
  });

  final CreateAudienceMode audienceMode;
  final Set<String> selectedListIds;
  final List<ContactList> lists;
  final String? csvFileLabel;
  final ValueChanged<CreateAudienceMode> onAudienceModeChanged;
  final ValueChanged<ContactList> onToggleList;
  final void Function(String fileName, String phones) onCsvParsed;
  final VoidCallback onClearCsv;

  static const int kMaxStaticLists = 5;

  Future<void> _pickCsv(BuildContext context) async {
    final r = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['csv'],
      withData: true,
    );
    if (r == null || r.files.isEmpty) return;
    final f = r.files.single;
    String? raw;
    if (f.bytes != null) {
      raw = String.fromCharCodes(f.bytes!);
    } else if (f.path != null) {
      raw = await File(f.path!).readAsString();
    }
    if (raw == null || raw.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not read CSV file')),
        );
      }
      return;
    }
    try {
      final phones = parseCsvPhoneColumn(raw);
      if (phones.isEmpty) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No numbers found under "number" column')),
          );
        }
        return;
      }
      onCsvParsed(f.name, phones);
    } on FormatException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return CreateCampaignSection(
      title: 'Choose your audience',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Audience type', style: theme.textTheme.labelLarge),
          const SizedBox(height: 6),
          SegmentedButton<CreateAudienceMode>(
            segments: const [
              ButtonSegment(value: CreateAudienceMode.staticList, label: Text('Static')),
              ButtonSegment(value: CreateAudienceMode.dynamicList, label: Text('Dynamic')),
              ButtonSegment(value: CreateAudienceMode.csvUpload, label: Text('CSV')),
            ],
            selected: {audienceMode},
            onSelectionChanged: (s) => onAudienceModeChanged(s.first),
          ),
          const SizedBox(height: 12),
          if (audienceMode == CreateAudienceMode.csvUpload) ...[
            OutlinedButton.icon(
              onPressed: () => _pickCsv(context),
              icon: const Icon(Icons.upload_file_outlined),
              label: const Text('Browse CSV'),
            ),
            if (csvFileLabel != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      csvFileLabel!,
                      style: theme.textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  TextButton(onPressed: onClearCsv, child: const Text('Clear')),
                ],
              ),
            ],
            const SizedBox(height: 8),
            _InfoNote(
              theme,
              'First column must be named "number". Up to 5,000 numbers. '
              'Use @@ColumnName in greeting text for other CSV columns (per Exotel).',
            ),
          ] else ...[
            Text(
              audienceMode == CreateAudienceMode.dynamicList
                  ? '* Dynamic list (select one)'
                  : '* Contact lists (up to $kMaxStaticLists)',
              style: theme.textTheme.labelLarge,
            ),
            const SizedBox(height: 6),
            ...lists.map((list) {
              final selected = selectedListIds.contains(list.id);
              return CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                value: selected,
                onChanged: (_) => onToggleList(list),
                title: Text(list.name, maxLines: 1, overflow: TextOverflow.ellipsis),
              );
            }),
            const SizedBox(height: 6),
            _InfoNote(
              theme,
              audienceMode == CreateAudienceMode.dynamicList
                  ? 'Dynamic campaigns use contacts from the list at call time.'
                  : 'Static campaigns snapshot numbers from the lists at creation time.',
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoNote extends StatelessWidget {
  const _InfoNote(this.theme, this.text);

  final ThemeData theme;
  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Text(text, style: theme.textTheme.bodySmall),
      ),
    );
  }
}
