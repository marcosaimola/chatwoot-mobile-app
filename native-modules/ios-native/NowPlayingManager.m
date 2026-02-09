//
//  NowPlayingManager.m
//  ZapiCrm
//
//  Native module for iOS Now Playing Center (Lock Screen Controls)
//

#import "NowPlayingManager.h"
#import <MediaPlayer/MediaPlayer.h>
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <React/RCTLog.h>

// Artwork fixa usando o ícone do app (evita mostrar foto errada de outro contato)
static MPMediaItemArtwork *appIconArtwork = nil;

@implementation NowPlayingManager
{
  bool hasListeners;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onRemotePlay", @"onRemotePause", @"onRemoteStop", @"onRemoteSeek", @"onRemoteToggle"];
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

/**
 * Carrega o ícone do app como artwork fixa para o Now Playing
 * Isso evita mostrar foto de contato errado quando há cache
 */
- (MPMediaItemArtwork *)getAppIconArtwork {
  if (appIconArtwork != nil) {
    return appIconArtwork;
  }
  
  // Tenta carregar o ícone do app do bundle
  UIImage *appIcon = [UIImage imageNamed:@"AppIcon"];
  
  // Se não encontrar AppIcon, tenta o ícone padrão do app
  if (!appIcon) {
    NSDictionary *infoPlist = [[NSBundle mainBundle] infoDictionary];
    NSArray *iconFiles = infoPlist[@"CFBundleIcons"][@"CFBundlePrimaryIcon"][@"CFBundleIconFiles"];
    if (iconFiles && iconFiles.count > 0) {
      appIcon = [UIImage imageNamed:iconFiles.lastObject];
    }
  }
  
  // Fallback: tenta carregar do asset catalog diretamente
  if (!appIcon) {
    appIcon = [UIImage imageNamed:@"App-Icon-1024x1024@1x"];
  }
  
  if (appIcon) {
    appIconArtwork = [[MPMediaItemArtwork alloc] initWithBoundsSize:appIcon.size
                                                     requestHandler:^UIImage * _Nonnull(CGSize size) {
      return appIcon;
    }];
  }
  
  return appIconArtwork;
}

RCT_EXPORT_METHOD(setupRemoteCommandCenter:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      // Don't reconfigure audio session - let expo-av handle it
      // Just set up the remote command center
      // Start receiving remote control events (required for Now Playing to work)
      [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];
      
      MPRemoteCommandCenter *commandCenter = [MPRemoteCommandCenter sharedCommandCenter];
      
      // Enable play command
      [commandCenter.playCommand setEnabled:YES];
      [commandCenter.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        if (self->hasListeners) {
          [self sendEventWithName:@"onRemotePlay" body:@{}];
        }
        return MPRemoteCommandHandlerStatusSuccess;
      }];
      
      // Enable pause command
      [commandCenter.pauseCommand setEnabled:YES];
      [commandCenter.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        if (self->hasListeners) {
          [self sendEventWithName:@"onRemotePause" body:@{}];
        }
        return MPRemoteCommandHandlerStatusSuccess;
      }];
      
      // Enable toggle play/pause command (used by AirPods, CarPlay, etc.)
      [commandCenter.togglePlayPauseCommand setEnabled:YES];
      [commandCenter.togglePlayPauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        if (self->hasListeners) {
          // Toggle: send play if paused, pause if playing
          [self sendEventWithName:@"onRemoteToggle" body:@{}];
        }
        return MPRemoteCommandHandlerStatusSuccess;
      }];
      
      // Enable stop command
      [commandCenter.stopCommand setEnabled:YES];
      [commandCenter.stopCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        if (self->hasListeners) {
          [self sendEventWithName:@"onRemoteStop" body:@{}];
        }
        return MPRemoteCommandHandlerStatusSuccess;
      }];
      
      // Enable seek command
      [commandCenter.changePlaybackPositionCommand setEnabled:YES];
      [commandCenter.changePlaybackPositionCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
        MPChangePlaybackPositionCommandEvent *seekEvent = (MPChangePlaybackPositionCommandEvent *)event;
        if (self->hasListeners) {
          [self sendEventWithName:@"onRemoteSeek" body:@{@"position": @(seekEvent.positionTime)}];
        }
        return MPRemoteCommandHandlerStatusSuccess;
      }];
      
      // Disable skip commands (not needed for audio messages)
      [commandCenter.nextTrackCommand setEnabled:NO];
      [commandCenter.previousTrackCommand setEnabled:NO];
      [commandCenter.skipForwardCommand setEnabled:NO];
      [commandCenter.skipBackwardCommand setEnabled:NO];
      
      resolve(@{@"success": @YES});
    } @catch (NSException *exception) {
      reject(@"setup_error", exception.reason, nil);
    }
  });
}

RCT_EXPORT_METHOD(setNowPlayingInfo:(NSDictionary *)info
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      NSMutableDictionary *nowPlayingInfo = [[NSMutableDictionary alloc] init];
      
      // Title (conversation name or "Audio Message")
      NSString *title = info[@"title"];
      if (title) {
        nowPlayingInfo[MPMediaItemPropertyTitle] = title;
      }
      
      // Artist (contact name or app name)
      NSString *artist = info[@"artist"];
      if (artist) {
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist;
      }
      
      // Album (could be inbox name)
      NSString *album = info[@"album"];
      if (album) {
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album;
      }
      
      // Duration in seconds
      NSNumber *duration = info[@"duration"];
      if (duration != nil) {
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration;
      }
      
      // Current position in seconds
      NSNumber *position = info[@"position"];
      if (position != nil) {
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = position;
      }
      
      // Playback rate (0 = paused, 1 = playing)
      NSNumber *playbackRate = info[@"playbackRate"];
      if (playbackRate != nil) {
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = playbackRate;
      }
      
      // Set media type as voice message
      nowPlayingInfo[MPMediaItemPropertyMediaType] = @(MPMediaTypeAnyAudio);
      
      // Usar ícone do app como artwork fixa
      // Isso evita mostrar foto de contato errado quando há cache
      MPMediaItemArtwork *artwork = [self getAppIconArtwork];
      if (artwork) {
        nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork;
      }
      
      // Set now playing info
      [[MPNowPlayingInfoCenter defaultCenter] setNowPlayingInfo:nowPlayingInfo];
      resolve(@{@"success": @YES});
    } @catch (NSException *exception) {
      reject(@"set_info_error", exception.reason, nil);
    }
  });
}

RCT_EXPORT_METHOD(activateAudioSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      NSError *error = nil;
      AVAudioSession *session = [AVAudioSession sharedInstance];
      
      // CRITICAL: Force the category to Playback for Now Playing to work
      // expo-av sets it to Ambient which doesn't support Now Playing widget
      if (![session.category isEqualToString:AVAudioSessionCategoryPlayback]) {
        [session setCategory:AVAudioSessionCategoryPlayback
                        mode:AVAudioSessionModeDefault
                     options:AVAudioSessionCategoryOptionDuckOthers
                       error:&error];
        if (error) {
          RCTLogWarn(@"[NowPlayingManager] Failed to set category: %@", error);
        }
      }
      
      // Activate the session
      BOOL success = [session setActive:YES error:&error];
      
      if (error) {
        RCTLogWarn(@"[NowPlayingManager] Audio session activation error: %@", error);
        resolve(@{@"success": @NO, @"error": error.localizedDescription});
      } else {
        resolve(@{@"success": @YES, @"category": session.category});
      }
    } @catch (NSException *exception) {
      reject(@"activation_error", exception.reason, nil);
    }
  });
}

RCT_EXPORT_METHOD(clearNowPlayingInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      [[MPNowPlayingInfoCenter defaultCenter] setNowPlayingInfo:nil];
      resolve(@{@"success": @YES});
    } @catch (NSException *exception) {
      reject(@"clear_error", exception.reason, nil);
    }
  });
}

@end
