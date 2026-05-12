import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/providers/app_providers.dart';
import '../../../campaigns/presentation/pages/campaigns_page.dart';
import '../../../contacts/presentation/pages/contacts_page.dart';
import '../../../flows/presentation/pages/flows_page.dart';
import '../../../lists/presentation/pages/lists_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';
import 'app_drawer.dart';

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _index = 0;
  final _titles = const ['Contacts', 'Lists', 'Campaigns', 'Profile'];
  int? _contactsTotal;
  int _contactsRemountKey = 0;
  bool _syncBusy = false;

  String get _appBarTitle {
    if (_index == 0) {
      return _contactsTotal == null ? 'Contacts' : 'Contacts (${_contactsTotal!})';
    }
    return _titles[_index];
  }

  List<String> _pullTargetsForTab(int index) {
    return switch (index) {
      0 => const ['contacts'],
      1 => const ['lists'],
      2 => const ['campaigns'],
      3 => const ['contacts', 'lists', 'campaigns'],
      _ => const <String>[],
    };
  }

  Widget _tabBody(int index) {
    return switch (index) {
      0 => ContactsPage(
          key: ValueKey(_contactsRemountKey),
          onTotalChanged: (total) {
            if (_contactsTotal != total && mounted) {
              setState(() => _contactsTotal = total);
            }
          },
        ),
      1 => const ListsPage(),
      2 => const CampaignsPage(),
      3 => const ProfilePage(),
      _ => const SizedBox.shrink(),
    };
  }

  Future<void> _pullFromExotel() async {
    if (_syncBusy) return;
    setState(() => _syncBusy = true);
    try {
      final targets = _pullTargetsForTab(_index);
      await ref.read(apiClientProvider).syncFromExotel(targets);
      if (!mounted) return;
      if (_index == 0 || _index == 3) {
        setState(() => _contactsRemountKey++);
      }
      if (_index == 1 || _index == 3) {
        ref.invalidate(listsProvider);
      }
      if (_index == 2 || _index == 3) {
        ref.invalidate(campaignsProvider);
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _index == 3 ? 'Synced contacts, lists, and campaigns from Exotel' : 'Synced from Exotel',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final message = switch (e) {
        DioException(:final response) =>
          response?.data is Map && (response!.data as Map)['message'] != null
              ? (response.data as Map)['message'].toString()
              : e.message ?? e.toString(),
        _ => e.toString(),
      };
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: $message')),
      );
    } finally {
      if (mounted) setState(() => _syncBusy = false);
    }
  }

  void _onMainTabSelected(int index) {
    if (index == 1) {
      ref.invalidate(listsProvider);
    } else if (index == 2) {
      ref.invalidate(campaignsProvider);
    }
    setState(() => _index = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_appBarTitle),
        actions: [
          IconButton(
            tooltip: _index == 3 ? 'Sync all from Exotel' : 'Sync from Exotel',
            onPressed: _syncBusy ? null : _pullFromExotel,
            icon: _syncBusy
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.sync),
          ),
        ],
      ),
      drawer: AppDrawer(
        onSelect: (index) {
          _onMainTabSelected(index);
          Navigator.pop(context);
        },
        onOpenFlows: () {
          Navigator.pop(context);
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const FlowsPage()),
          );
        },
      ),
      body: _tabBody(_index),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _onMainTabSelected,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.people_alt_outlined), label: 'Contacts'),
          NavigationDestination(icon: Icon(Icons.view_list_outlined), label: 'Lists'),
          NavigationDestination(icon: Icon(Icons.campaign_outlined), label: 'Campaigns'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

