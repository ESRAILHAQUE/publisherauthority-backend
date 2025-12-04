import Settings, { ISettings } from './settings.model';

/**
 * Settings Service
 */
class SettingsService {
  /**
   * Get Settings
   */
  async getSettings(): Promise<ISettings> {
    const settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if none exist
      return await Settings.create({});
    }
    return settings;
  }

  /**
   * Update Settings
   */
  async updateSettings(updateData: Partial<ISettings>): Promise<ISettings> {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(updateData);
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }
    
    return settings;
  }
}

export default new SettingsService();

