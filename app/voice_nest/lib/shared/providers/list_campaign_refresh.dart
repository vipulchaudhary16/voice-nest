import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_providers.dart';

Future<void> refreshLists(WidgetRef ref) async {
  ref.invalidate(listsProvider);
  await ref.read(listsProvider.future);
}

Future<void> refreshCampaigns(WidgetRef ref) async {
  ref.invalidate(campaignsProvider);
  await ref.read(campaignsProvider.future);
}
