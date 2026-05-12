import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_campaign_calls.dart';
import '../../../../shared/providers/app_providers.dart';
import '../../domain/campaign_detail_models.dart';
import '../widgets/campaign_call_details_tab.dart';
import '../widgets/campaign_detail_widgets.dart';
import '../widgets/recording_player_modal.dart';

class CampaignDetailPage extends ConsumerStatefulWidget {
  const CampaignDetailPage({super.key, required this.campaignId});

  final String campaignId;

  @override
  ConsumerState<CampaignDetailPage> createState() => _CampaignDetailPageState();
}

class _CampaignDetailPageState extends ConsumerState<CampaignDetailPage> with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  late Future<CampaignDetail> _campaignFuture;
  String _title = 'Campaign';
  final Set<String> _loadingRecordingSids = <String>{};

  @override
  void initState() {
    super.initState();
    _campaignFuture = ref.read(apiClientProvider).getCampaignById(widget.campaignId);
    _campaignFuture.then((campaign) {
      if (!mounted) return;
      setState(() => _title = campaign.name.isEmpty ? 'Campaign' : campaign.name);
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _handlePlayRecording(CampaignCallRow row) async {
    if (row.callSid.trim().isEmpty || _loadingRecordingSids.contains(row.callSid)) return;
    setState(() => _loadingRecordingSids.add(row.callSid));
    try {
      final detail = await ref.read(apiClientProvider).getCallDetailsBySid(row.callSid);
      if (!mounted) return;
      if (!detail.recordingAvailable || detail.recordingUrl.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Recording not available for this call.')),
        );
        return;
      }
      await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        builder: (_) => RecordingPlayerModal(
          recordingUrl: detail.recordingUrl,
          number: detail.customerNumber.isEmpty ? row.number : detail.customerNumber,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to fetch call details: $error')),
      );
    } finally {
      if (mounted) setState(() => _loadingRecordingSids.remove(row.callSid));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [Tab(text: 'Overview'), Tab(text: 'Call Details')],
        ),
      ),
      body: FutureBuilder<CampaignDetail>(
        future: _campaignFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(child: Text(snapshot.error?.toString() ?? 'Failed to load campaign details'));
          }
          final campaign = snapshot.data!;
          return TabBarView(
            controller: _tabs,
            children: [
              CampaignOverviewTab(campaign: campaign),
              CampaignCallDetailsTab(
                campaignId: widget.campaignId,
                onPlayTap: _handlePlayRecording,
                isRecordingLoading: (callSid) => _loadingRecordingSids.contains(callSid),
              ),
            ],
          );
        },
      ),
    );
  }
}
