import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_campaign_calls.dart';
import '../../../../shared/providers/app_providers.dart';
import '../../domain/campaign_detail_models.dart';
import 'call_details_row_card.dart';

class CampaignCallDetailsTab extends ConsumerStatefulWidget {
  const CampaignCallDetailsTab({
    super.key,
    required this.campaignId,
    required this.onPlayTap,
    required this.isRecordingLoading,
  });

  final String campaignId;
  final Future<void> Function(CampaignCallRow row) onPlayTap;
  final bool Function(String callSid) isRecordingLoading;

  @override
  ConsumerState<CampaignCallDetailsTab> createState() => _CampaignCallDetailsTabState();
}

class _CampaignCallDetailsTabState extends ConsumerState<CampaignCallDetailsTab> {
  final TextEditingController _numberFilterController = TextEditingController();
  String _numberFilter = '';
  int _offset = 0;
  final int _limit = 20;
  late Future<CampaignCallDetailsPageData> _future = _load();

  Future<CampaignCallDetailsPageData> _load() {
    return ref.read(apiClientProvider).getCampaignCallDetails(
          widget.campaignId,
          offset: _offset,
          limit: _limit,
        );
  }

  @override
  void dispose() {
    _numberFilterController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<CampaignCallDetailsPageData>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError || !snapshot.hasData) {
          return Center(child: Text(snapshot.error?.toString() ?? 'Failed to load call details'));
        }
        final page = snapshot.data!;
        final hasPrev = page.offset > 0;
        final hasNext = page.offset + page.limit < page.total;
        final query = _numberFilter.trim().toLowerCase();
        final rows = page.rows.where((row) => query.isEmpty || row.number.toLowerCase().contains(query)).toList();
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
              child: TextField(
                controller: _numberFilterController,
                onChanged: (value) => setState(() => _numberFilter = value),
                decoration: InputDecoration(
                  hintText: 'Filter by number',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _numberFilter.isEmpty
                      ? null
                      : IconButton(
                          onPressed: () {
                            _numberFilterController.clear();
                            setState(() => _numberFilter = '');
                          },
                          icon: const Icon(Icons.close),
                        ),
                ),
              ),
            ),
            Expanded(
              child: rows.isEmpty
                  ? Center(
                      child: Text(
                        page.rows.isEmpty ? 'No call details found for this campaign.' : 'No numbers match your filter.',
                      ),
                    )
                  : ListView.builder(
                      itemCount: rows.length,
                      itemBuilder: (context, index) {
                        final row = rows[index];
                        return CallDetailsRowCard(
                          row: row,
                          toTitleCase: _toTitleCase,
                          formatDateTime: _formatDateTime,
                          onPlayTap: () => widget.onPlayTap(row),
                          isPlayLoading: widget.isRecordingLoading(row.callSid),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(child: Text('Showing ${rows.length} rows | Total: ${page.total}')),
                  OutlinedButton(
                    onPressed: hasPrev
                        ? () => setState(() {
                            _offset = (_offset - _limit).clamp(0, _offset);
                            _future = _load();
                          })
                        : null,
                    child: const Text('Previous'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: hasNext
                        ? () => setState(() {
                            _offset += _limit;
                            _future = _load();
                          })
                        : null,
                    child: const Text('Next'),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

String _formatDateTime(String value) {
  if (value.isEmpty) return '-';
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  return '${date.toLocal()}'.split('.').first;
}

String _toTitleCase(String value) {
  if (value.isEmpty) return '-';
  return value
      .split('-')
      .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}
