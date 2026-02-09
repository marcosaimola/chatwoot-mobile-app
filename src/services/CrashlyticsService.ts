import crashlytics from '@react-native-firebase/crashlytics';

/**
 * CrashlyticsService - Centralized service for Firebase Crashlytics
 * 
 * This service provides methods to:
 * - Initialize Crashlytics
 * - Log custom errors and messages
 * - Set user identifiers and attributes
 * - Record non-fatal errors
 */
class CrashlyticsService {
  private static instance: CrashlyticsService;
  private isEnabled: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CrashlyticsService {
    if (!CrashlyticsService.instance) {
      CrashlyticsService.instance = new CrashlyticsService();
    }
    return CrashlyticsService.instance;
  }

  /**
   * Initialize Crashlytics
   * Should be called on app startup
   */
  public async initialize(): Promise<void> {
    try {
      // Enable Crashlytics data collection
      await crashlytics().setCrashlyticsCollectionEnabled(true);
      this.isEnabled = true;
      
      if (__DEV__) {
        console.log('✅ Crashlytics initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Crashlytics:', error);
    }
  }

  /**
   * Set user identifier for crash reports
   * @param userId - User ID to associate with crashes
   */
  public setUserId(userId: string): void {
    if (!this.isEnabled) return;
    
    try {
      crashlytics().setUserId(userId);
      if (__DEV__) {
        console.log('Crashlytics: User ID set:', userId);
      }
    } catch (error) {
      console.error('Failed to set user ID in Crashlytics:', error);
    }
  }

  /**
   * Set custom attribute for crash reports
   * @param key - Attribute key
   * @param value - Attribute value
   */
  public setAttribute(key: string, value: string): void {
    if (!this.isEnabled) return;
    
    try {
      crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('Failed to set attribute in Crashlytics:', error);
    }
  }

  /**
   * Set multiple custom attributes at once
   * @param attributes - Object with key-value pairs
   */
  public setAttributes(attributes: Record<string, string>): void {
    if (!this.isEnabled) return;
    
    try {
      crashlytics().setAttributes(attributes);
    } catch (error) {
      console.error('Failed to set attributes in Crashlytics:', error);
    }
  }

  /**
   * Log a custom message to Crashlytics
   * @param message - Message to log
   */
  public log(message: string): void {
    if (!this.isEnabled) return;
    
    try {
      crashlytics().log(message);
    } catch (error) {
      console.error('Failed to log message in Crashlytics:', error);
    }
  }

  /**
   * Record a non-fatal error
   * @param error - Error object or message
   * @param context - Optional context information
   */
  public recordError(error: Error | string, context?: string): void {
    if (!this.isEnabled) return;
    
    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      
      if (context) {
        crashlytics().log(`Context: ${context}`);
      }
      
      crashlytics().recordError(errorObj);
      
      if (__DEV__) {
        console.log('Crashlytics: Error recorded:', errorObj.message);
      }
    } catch (e) {
      console.error('Failed to record error in Crashlytics:', e);
    }
  }

  /**
   * Force a crash for testing purposes
   * ⚠️ USE ONLY FOR TESTING
   */
  public testCrash(): void {
    if (__DEV__) {
      console.warn('🔥 Forcing a test crash...');
    }
    crashlytics().crash();
  }

  /**
   * Check if Crashlytics is enabled
   */
  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Disable Crashlytics data collection
   */
  public async disable(): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(false);
      this.isEnabled = false;
      if (__DEV__) {
        console.log('Crashlytics disabled');
      }
    } catch (error) {
      console.error('Failed to disable Crashlytics:', error);
    }
  }
}

// Export singleton instance
export const crashlyticsService = CrashlyticsService.getInstance();
export default crashlyticsService;
