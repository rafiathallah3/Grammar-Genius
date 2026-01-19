const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

const withProcessText = (config) => {
  // 1. AndroidManifest: Create TWO Aliases (Two Side Doors)
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const app = androidManifest.manifest.application[0];
    const mainActivity = app.activity.find(
      (a) => a['$']['android:name'] === '.MainActivity'
    );

    // Ensure MainActivity is singleTask
    if (mainActivity) {
      mainActivity['$']['android:launchMode'] = 'singleTask';
      
      // Cleanup: Remove any PROCESS_TEXT filter from MainActivity itself
      if (mainActivity['intent-filter']) {
        mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(filter => {
          const isProcessText = filter.action && filter.action.some(
            a => a['$']['android:name'] === 'android.intent.action.PROCESS_TEXT'
          );
          return !isProcessText; 
        });
      }
    }

    // Helper to create an alias
    const addAlias = (name, label) => {
      if (!app['activity-alias']) app['activity-alias'] = [];
      
      const existing = app['activity-alias'].find(a => a['$']['android:name'] === name);
      if (!existing) {
        app['activity-alias'].push({
          $: {
            'android:name': name,
            'android:targetActivity': '.MainActivity',
            'android:label': label, // Custom Menu Text
            'android:exported': 'true',
          },
          'intent-filter': [{
            action: [{ $: { 'android:name': 'android.intent.action.PROCESS_TEXT' } }],
            category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
            data: [{ $: { 'android:mimeType': 'text/plain' } }],
          }],
        });
      }
    };

    // --- CREATE THE TWO MENU ITEMS HERE ---
    addAlias('.FixGrammarAlias', 'Fix with Grammar Genius');
    addAlias('.AnalyzeTextAlias', 'Analyze with Grammar Genius');

    return config;
  });

  // 2. MainActivity: Kotlin Logic to Route based on the Alias
  config = withMainActivity(config, (config) => {
    let src = config.modResults.contents;
    const scheme = config.scheme || 'grammarapp';

    // The logic block now checks "intent.component" to see which alias was used
    const logicBlock = `
    // [START PROCESS_TEXT HANDLER]
    val action = intent.action
    if (action == "android.intent.action.PROCESS_TEXT") {
        val text = intent.getCharSequenceExtra("android.intent.extra.PROCESS_TEXT")?.toString()
        if (text != null) {
            val encodedText = android.net.Uri.encode(text)
            
            // Check which Menu Item was clicked!
            val componentName = intent.component?.className
            val targetPath = if (componentName != null && componentName.contains("AnalyzeTextAlias")) {
                "sentences" // Go to sentences if "Analyze" was clicked
            } else {
                "grammar"  // Default to Grammar if "Fix" was clicked
            }

            // Construct the deep link: grammarapp://(tabs)/sentences?text=...
            intent.data = android.net.Uri.parse("${scheme}://(tabs)/$targetPath?text=$encodedText")
            intent.action = android.content.Intent.ACTION_VIEW
        }
    }
    // [END PROCESS_TEXT HANDLER]
    `;

    // Inject into onCreate
    if (!src.includes('[START PROCESS_TEXT HANDLER]')) {
      const onCreateRegex = /super\.onCreate\(([^)]*)\)/;
      src = src.replace(onCreateRegex, (match) => `${logicBlock}\n    ${match}`);
    }

    // Inject into onNewIntent (safe wrapper)
    if (!src.includes('fun onNewIntent')) {
       // We create the function but we re-use the SAME logic block so we don't duplicate code
       // Note: We need to adapt the logic slightly for onNewIntent to allow setIntent
      const onNewIntentBlock = `
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    
    // [START PROCESS_TEXT HANDLER COPY]
    val action = intent.action
    if (action == "android.intent.action.PROCESS_TEXT") {
        val text = intent.getCharSequenceExtra("android.intent.extra.PROCESS_TEXT")?.toString()
        if (text != null) {
            val encodedText = android.net.Uri.encode(text)

            // Check which Menu Item was clicked!
            val componentName = intent.component?.className
            val targetPath = if (componentName != null && componentName.contains("AnalyzeTextAlias")) {
                "sentences" 
            } else {
                "grammar"
            }

            intent.data = android.net.Uri.parse("${scheme}://(tabs)/$targetPath?text=$encodedText")
            intent.action = android.content.Intent.ACTION_VIEW
            setIntent(intent)
        }
    }
    // [END PROCESS_TEXT HANDLER COPY]
  }
`;
      const lastBraceIndex = src.lastIndexOf('}');
      if (lastBraceIndex > 0) {
        src = src.substring(0, lastBraceIndex) + onNewIntentBlock + src.substring(lastBraceIndex);
      }
    }

    config.modResults.contents = src;
    return config;
  });

  return config;
};

module.exports = withProcessText;