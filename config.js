// Runner configuration for self-hosted Renovate. Policy lives in default.json, not here.
module.exports = {
  platform: 'github',
  repositories: ['Feedsystem/nch'],
  onboarding: true,
  onboardingConfig: {
    $schema: 'https://docs.renovatebot.com/renovate-schema.json',
    extends: ['github>netliferesearch/renovate'],
  },
  // nch's composer.json allows craftcms/plugin-installer and yiisoft/yii2-composer; the lock
  // update fails without these.
  allowPlugins: true,
  allowScripts: true,
  // DRY_RUN=full is set by the workflow_dispatch input; see .github/workflows/renovate.yml
  dryRun: process.env.DRY_RUN === 'full' ? 'full' : null,
};
