import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/app_providers.dart';
import '../../../../shared/providers/list_campaign_refresh.dart';
import '../campaigns_page_grouping.dart';
import 'campaign_detail_page.dart';
import 'create_campaign_page.dart';

class CampaignsPage extends ConsumerWidget {
  const CampaignsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(campaignsProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CreateCampaignPage()),
          );
          ref.invalidate(campaignsProvider);
        },
        icon: const Icon(Icons.rocket_launch_outlined),
        label: const Text('Create'),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => LayoutBuilder(
          builder: (context, constraints) => RefreshIndicator(
            onRefresh: () => refreshCampaigns(ref),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Center(child: Text(error.toString())),
              ),
            ),
          ),
        ),
        data: (campaigns) {
          Future<void> onRefresh() => refreshCampaigns(ref);
          if (campaigns.isEmpty) {
            return LayoutBuilder(
              builder: (context, constraints) => RefreshIndicator(
                onRefresh: onRefresh,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: const Center(child: Text('No campaigns yet.')),
                  ),
                ),
              ),
            );
          }
          final groupedCampaigns = groupCampaignsByDate(campaigns);
          final sectionKeys = groupedCampaigns.keys.toList();
          return RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              itemCount: sectionKeys.length,
              itemBuilder: (context, index) {
                final key = sectionKeys[index];
                final sectionCampaigns = groupedCampaigns[key] ?? const [];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
                      child: Text(
                        campaignSectionTitleForKey(key),
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                    ...sectionCampaigns.map(
                      (c) => Card(
                        child: ListTile(
                          contentPadding: const EdgeInsetsDirectional.only(
                            start: 16,
                            end: 4,
                            top: 8,
                            bottom: 8,
                          ),
                          onTap: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => CampaignDetailPage(campaignId: c.id),
                              ),
                            );
                            ref.invalidate(campaignsProvider);
                          },
                          title: Text(c.name),
                          subtitle: Text(
                            '${c.status} • ${c.campaignType} • Lists: ${c.lists.length}',
                          ),
                          trailing: PopupMenuButton<String>(
                            padding: EdgeInsets.zero,
                            icon: const Icon(Icons.more_vert),
                            tooltip: 'Actions',
                            onSelected: (value) async {
                              if (value == 'delete') {
                                await ref.read(apiClientProvider).deleteCampaign(c.id);
                                ref.invalidate(campaignsProvider);
                              }
                            },
                            itemBuilder: (context) => const [
                              PopupMenuItem(value: 'delete', child: Text('Delete')),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }
}
