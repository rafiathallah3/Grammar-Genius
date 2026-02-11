const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

const withProcessText = (config) => {

    // 1. AndroidManifest: Handle Aliases (Text) AND Share Intent (Images)
    config = withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const app = androidManifest.manifest.application[0];
        const mainActivity = app.activity.find(
            (a) => a['$']['android:name'] === '.MainActivity'
        );

        if (mainActivity) {
            mainActivity['$']['android:launchMode'] = 'singleTask';

            // A. Cleanup: Remove PROCESS_TEXT from MainActivity (it lives in Aliases now)
            if (mainActivity['intent-filter']) {
                mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(filter => {
                    const isProcessText = filter.action && filter.action.some(
                        a => a['$']['android:name'] === 'android.intent.action.PROCESS_TEXT'
                    );
                    return !isProcessText;
                });
            }

            // B. Add SHARE IMAGE support to MainActivity
            // Check if it already exists to avoid duplicates
            const hasShare = mainActivity['intent-filter'] && mainActivity['intent-filter'].some(f =>
                f.action && f.action.some(a => a['$']['android:name'] === 'android.intent.action.SEND')
            );

            if (!hasShare) {
                if (!mainActivity['intent-filter']) mainActivity['intent-filter'] = [];
                mainActivity['intent-filter'].push({
                    action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
                    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
                    data: [{ $: { 'android:mimeType': 'image/*' } }], // Accept any image
                });
            }
        }

        // C. Create the Text Selection Aliases (Side Doors)
        const addAlias = (name, label) => {
            if (!app['activity-alias']) app['activity-alias'] = [];
            const existing = app['activity-alias'].find(a => a['$']['android:name'] === name);
            if (!existing) {
                app['activity-alias'].push({
                    $: {
                        'android:name': name,
                        'android:targetActivity': '.MainActivity',
                        'android:label': label,
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

        addAlias('.FixGrammarAlias', 'Fix with Grammar Genius');
        addAlias('.AnalyzeTextAlias', 'Analyze with Grammar Genius');

        return config;
    });

    // 2. MainActivity: Kotlin Logic for Text AND Images
    config = withMainActivity(config, (config) => {
        let src = config.modResults.contents;
        const scheme = config.scheme || 'grammarapp';

        // MERGED LOGIC: Handles both PROCESS_TEXT and SEND (Share)
        const logicBlock = `
    // [START INTENT HANDLER]
    val action = intent.action
    val type = intent.type

    // 1. Text Handling (Via Menu Aliases)
    if (action == "android.intent.action.PROCESS_TEXT") {
        val text = intent.getCharSequenceExtra("android.intent.extra.PROCESS_TEXT")?.toString()
        if (text != null) {
            val encodedText = android.net.Uri.encode(text)
            
            // Route based on which button was clicked
            val componentName = intent.component?.className
            val targetPath = if (componentName != null && componentName.contains("AnalyzeTextAlias")) {
                "sentences" 
            } else {
                "grammar"
            }

            intent.data = android.net.Uri.parse("${scheme}://(tabs)/$targetPath?text=$encodedText")
            intent.action = android.content.Intent.ACTION_VIEW
        }
    }
    // 2. Image Handling (Via Share Sheet)
    else if (action == android.content.Intent.ACTION_SEND && type != null) {
        if (type.startsWith("image/")) {
            val imageUri = intent.getParcelableExtra<android.net.Uri>(android.content.Intent.EXTRA_STREAM)
            if (imageUri != null) {
                val encodedUri = android.net.Uri.encode(imageUri.toString())
                // Route to Camera/Scan page
                intent.data = android.net.Uri.parse("${scheme}://(tabs)/camera?imageUri=$encodedUri")
                intent.action = android.content.Intent.ACTION_VIEW
            }
        }
    }
    // [END INTENT HANDLER]
    `;

        // Inject into onCreate
        if (!src.includes('[START INTENT HANDLER]')) {
            const onCreateRegex = /super\.onCreate\(([^)]*)\)/;
            src = src.replace(onCreateRegex, (match) => `${logicBlock}\n    ${match}`);
        }

        // Inject into onNewIntent
        if (!src.includes('fun onNewIntent')) {
            const onNewIntentBlock = `
  override fun onNewIntent(intent: android.content.Intent) {
    ${logicBlock}
    super.onNewIntent(intent)
    setIntent(intent)
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