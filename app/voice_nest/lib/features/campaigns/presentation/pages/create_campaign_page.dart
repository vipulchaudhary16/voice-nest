import 'package:flutter/material.dart';

import 'create_campaign_editor.dart';

class CreateCampaignPage extends StatelessWidget {
  const CreateCampaignPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: AppBar(
        elevation: 0,
        title: const Text('Create Call Campaign'),
      ),
      body: const CreateCampaignEditor(),
    );
  }
}
