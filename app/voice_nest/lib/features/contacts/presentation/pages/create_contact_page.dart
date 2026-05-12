import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/models/app_models.dart';
import '../../../../shared/providers/app_providers.dart';

class CreateContactPage extends ConsumerStatefulWidget {
  const CreateContactPage({super.key, this.initialContact});

  final Contact? initialContact;

  @override
  ConsumerState<CreateContactPage> createState() => _CreateContactPageState();
}

class _CreateContactPageState extends ConsumerState<CreateContactPage> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _tag = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _syncToExotel = true;
  bool _saving = false;

  bool get _isEditMode => widget.initialContact != null;

  @override
  void initState() {
    super.initState();
    final existing = widget.initialContact;
    if (existing != null) {
      _firstName.text = existing.firstName;
      _lastName.text = existing.lastName;
      _email.text = existing.email ?? '';
      _phone.text = existing.phoneNo;
      _tag.text = existing.tag ?? '';
      _syncToExotel = false;
    }
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _tag.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = {
        'first_name': _firstName.text.trim(),
        'last_name': _lastName.text.trim(),
        'email': _email.text.trim(),
        'phone_no': _phone.text.trim(),
        'tag': _tag.text.trim(),
      };
      if (_isEditMode) {
        await ref.read(apiClientProvider).updateContact(widget.initialContact!.id, payload);
      } else {
        await ref.read(apiClientProvider).createContact({
          ...payload,
          'sync_to_exotel': _syncToExotel,
        });
      }
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(_isEditMode ? 'Edit Contact' : 'New Contact')),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              scheme.primaryContainer.withValues(alpha: 0.35),
              scheme.surface,
            ],
          ),
        ),
        child: SafeArea(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: scheme.primaryContainer,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(Icons.person_add_alt_1, color: scheme.primary),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isEditMode ? 'Edit Contact' : 'Create Contact',
                              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isEditMode
                                  ? 'Update contact details.'
                                  : 'Add details and sync to Exotel if needed.',
                              style: theme.textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _FormCard(
                  title: 'Basic Info',
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _firstName,
                            decoration: const InputDecoration(labelText: 'First name'),
                            validator: (value) =>
                                value == null || value.trim().isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _lastName,
                            decoration: const InputDecoration(labelText: 'Last name'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone (+country code)',
                        hintText: '+919876543210',
                      ),
                      validator: (value) {
                        final phone = (value ?? '').trim();
                        if (phone.isEmpty) {
                          return 'Phone number is required';
                        }
                        if (!phone.startsWith('+')) {
                          return 'Start with +country code';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _tag,
                      decoration: const InputDecoration(labelText: 'Tag'),
                    ),
                    const SizedBox(height: 12),
                    if (!_isEditMode)
                      SwitchListTile.adaptive(
                        value: _syncToExotel,
                        onChanged: (value) => setState(() => _syncToExotel = value),
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Sync to Exotel'),
                        subtitle: const Text('Creates or updates address book contact in Exotel'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton.icon(
            onPressed: _saving ? null : _save,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            icon: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check_circle_outline),
            label: Text(
              _saving ? 'Saving...' : (_isEditMode ? 'Update contact' : 'Create contact'),
            ),
          ),
        ),
      ),
    );
  }
}

class _FormCard extends StatelessWidget {
  const _FormCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}
