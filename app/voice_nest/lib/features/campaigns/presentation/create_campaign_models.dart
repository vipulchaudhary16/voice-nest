/// Audience mapping: static lists (≤5), dynamic (1 list), or CSV → Exotel `from`.
enum CreateAudienceMode { staticList, dynamicList, csvUpload }

/// Content: greeting text, existing ExoML flow, or same flow path for "Create IVR" (configure in Flows).
enum CreateContentMode { readText, selectFlow, createIvr }

enum CreateScheduleChoice { now, later }
