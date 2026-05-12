import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_contacts/flutter_contacts.dart' as device_contacts;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/network/api_client.dart';
import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';
import '../../../../shared/widgets/expandable_action_fab.dart';
import '../widgets/contacts_grouped_list_view.dart';
import 'contact_detail_page.dart';
import 'create_contact_page.dart';

part 'contacts_page_state.part.dart';
part 'contacts_page_build.part.dart';
part 'contacts_page_import.part.dart';
part 'contacts_page_preview.part.dart';
part 'contacts_page_utils.part.dart';
part 'contacts_sync_preview_page.part.dart';

class ContactsPage extends ConsumerStatefulWidget {
  const ContactsPage({super.key, this.onTotalChanged});

  final ValueChanged<int>? onTotalChanged;

  @override
  ConsumerState<ContactsPage> createState() => _ContactsPageState();
}

class _ContactsPageState extends ConsumerState<ContactsPage> {
  static const int _maxCsvBytes = 1024 * 1024;

  final Set<String> _selectedIds = <String>{};
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Contact> _contacts = const [];
  List<String> _tags = const [];
  Timer? _debounce;

  bool _loading = true;
  bool _loadingMore = false;
  bool _busy = false;
  bool _hasMore = true;
  bool _selectionMode = false;

  String _search = '';
  String _tag = '';
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadInitial();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _buildPage(context);
}
