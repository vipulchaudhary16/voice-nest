import 'package:flutter/material.dart';

import 'create_campaign_section.dart';

class CreateCampaignNameSection extends StatelessWidget {
  const CreateCampaignNameSection({required this.nameController, super.key});

  final TextEditingController nameController;

  @override
  Widget build(BuildContext context) {
    return CreateCampaignSection(
      title: 'Campaign info',
      child: TextField(
        controller: nameController,
        decoration: const InputDecoration(
          labelText: '* Campaign name',
          border: OutlineInputBorder(),
        ),
      ),
    );
  }
}
