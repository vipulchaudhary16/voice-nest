import 'package:flutter/material.dart';

class CreateCampaignBottomBar extends StatelessWidget {
  const CreateCampaignBottomBar({
    required this.isSubmitting,
    required this.onSubmit,
    super.key,
  });

  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 8,
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          child: FilledButton(
            onPressed: isSubmitting ? null : onSubmit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: Text(isSubmitting ? 'Creating…' : 'Create campaign'),
          ),
        ),
      ),
    );
  }
}
