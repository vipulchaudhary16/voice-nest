import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_flows.dart';
import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';
import '../create_campaign_models.dart';
import '../create_campaign_pick_datetime.dart';
import '../create_campaign_rfc3339.dart';
import '../widgets/create_campaign_audience_section.dart';
import '../widgets/create_campaign_bottom_bar.dart';
import '../widgets/create_campaign_form.dart';

part 'create_campaign_editor_payload.part.dart';
part 'create_campaign_editor_form.part.dart';

class CreateCampaignEditor extends ConsumerStatefulWidget {
  const CreateCampaignEditor({super.key});

  @override
  ConsumerState<CreateCampaignEditor> createState() => _CreateCampaignEditorState();
}

class _CreateCampaignEditorState extends ConsumerState<CreateCampaignEditor> {
  final _nameController = TextEditingController();
  final _readTextController = TextEditingController();
  final _intervalController = TextEditingController(text: '1');
  final _throttleCpmController = TextEditingController(text: '60');
  final _statusCbController = TextEditingController();
  final _callStatusCbController = TextEditingController();
  final _callScheduleCbController = TextEditingController();
  final _customFieldController = TextEditingController();
  final _repeatMenuController = TextEditingController(text: '0');

  final _selectedListIds = <String>{};
  final _scrollController = ScrollController();
  late final Future<List<ContactList>> _listsFuture;
  late final Future<List<Exophone>> _exophonesFuture;
  late final Future<List<AppFlow>> _flowsFuture;
  late final Future<List<Object>> _bootstrapFuture;

  CreateAudienceMode _audienceMode = CreateAudienceMode.staticList;
  CreateContentMode _contentMode = CreateContentMode.readText;
  CreateScheduleChoice _scheduleChoice = CreateScheduleChoice.now;
  String _csvPhones = '';
  String? _csvFileName;
  String? _selectedCallerId;
  String? _selectedFlowId;
  bool _callTypeTrans = true;
  DateTime? _sendAt;
  DateTime? _endAt;
  int _retryCount = 0;
  String _mechanism = 'Exponential';
  bool _retryBusy = true;
  bool _retryNoAnswer = true;
  bool _retryFailed = true;
  bool _callDuplicates = false;
  bool _throttleAuto = true;
  bool _syncToExotel = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final api = ref.read(apiClientProvider);
    _listsFuture = api.getLists();
    _exophonesFuture = api.getExophones();
    _flowsFuture = api.getFlows();
    _bootstrapFuture = Future.wait([_listsFuture, _exophonesFuture, _flowsFuture]);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _readTextController.dispose();
    _intervalController.dispose();
    _throttleCpmController.dispose();
    _statusCbController.dispose();
    _callStatusCbController.dispose();
    _callScheduleCbController.dispose();
    _customFieldController.dispose();
    _repeatMenuController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _apply(void Function() fn) => setState(fn);

  Future<void> _pickSend() async {
    final v = await pickCampaignDateTime(context, initial: _sendAt ?? DateTime.now());
    if (v != null) setState(() => _sendAt = v);
  }

  Future<void> _pickEnd() async {
    final base = _endAt ?? _sendAt ?? DateTime.now().add(const Duration(hours: 8));
    final v = await pickCampaignDateTime(context, initial: base);
    if (v != null) setState(() => _endAt = v);
  }

  void _setAudience(CreateAudienceMode m) {
    setState(() {
      _audienceMode = m;
      if (m != CreateAudienceMode.csvUpload) {
        _csvPhones = '';
        _csvFileName = null;
      } else {
        _selectedListIds.clear();
      }
      if (m == CreateAudienceMode.dynamicList && _selectedListIds.length > 1) {
        final one = _selectedListIds.first;
        _selectedListIds.removeWhere((id) => id != one);
      }
    });
  }

  void _toggleList(ContactList list) {
    setState(() {
      if (_audienceMode == CreateAudienceMode.csvUpload) return;
      if (_audienceMode == CreateAudienceMode.dynamicList) {
        _selectedListIds
          ..clear()
          ..add(list.id);
        return;
      }
      if (_selectedListIds.contains(list.id)) {
        _selectedListIds.remove(list.id);
      } else {
        if (_selectedListIds.length >= CreateCampaignAudienceSection.kMaxStaticLists) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Select at most ${CreateCampaignAudienceSection.kMaxStaticLists} lists'),
            ),
          );
          return;
        }
        _selectedListIds.add(list.id);
      }
    });
  }

  Future<void> _submitCampaign(List<AppFlow> flows) async {
    final built = _ccBuildCampaignPayload(this, flows);
    if (built.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(built.error!)));
      return;
    }
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      await ref.read(apiClientProvider).createCampaign(built.payload!);
      ref.invalidate(campaignsProvider);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Object>>(
      future: _bootstrapFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text(snapshot.error.toString()));
        }
        final data = snapshot.data ?? const <Object>[];
        final lists = data.isNotEmpty ? data[0] as List<ContactList> : const <ContactList>[];
        final exophones = data.length > 1 ? data[1] as List<Exophone> : const <Exophone>[];
        final flows = data.length > 2 ? data[2] as List<AppFlow> : const <AppFlow>[];

        return Column(
          children: [
            Expanded(
              child: _ccBuildEditorForm(this, lists: lists, exophones: exophones, flows: flows),
            ),
            CreateCampaignBottomBar(
              isSubmitting: _isSubmitting,
              onSubmit: () => _submitCampaign(flows),
            ),
          ],
        );
      },
    );
  }
}
