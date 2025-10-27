import ExpoModulesCore

public class NowPlayingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NowPlayingManager")

    AsyncFunction("setNowPlayingInfo") { (info: [String: Any]) -> Bool in
      DispatchQueue.main.async {
        let nowPlayingInfo = NSMutableDictionary()
        
        if let title = info["title"] as? String {
          nowPlayingInfo[MPMediaItemPropertyTitle] = title
        }
        
        if let artist = info["artist"] as? String {
          nowPlayingInfo[MPMediaItemPropertyArtist] = artist
        }
        
        if let album = info["album"] as? String {
          nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
        }
        
        if let duration = info["duration"] as? NSNumber {
          nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        }
        
        if let position = info["position"] as? NSNumber {
          nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = position
        }
        
        if let playbackRate = info["playbackRate"] as? NSNumber {
          nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = playbackRate
        }
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo as? [String: Any]
      }
      return true
    }

    AsyncFunction("clearNowPlayingInfo") { () -> Bool in
      DispatchQueue.main.async {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
      }
      return true
    }

    AsyncFunction("setupRemoteCommandCenter") { () -> Bool in
      DispatchQueue.main.async {
        let commandCenter = MPRemoteCommandCenter.shared()
        
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { _ in
          NotificationCenter.default.post(name: NSNotification.Name("RemotePlayCommand"), object: nil)
          return .success
        }
        
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { _ in
          NotificationCenter.default.post(name: NSNotification.Name("RemotePauseCommand"), object: nil)
          return .success
        }
        
        commandCenter.stopCommand.isEnabled = true
        commandCenter.stopCommand.addTarget { _ in
          NotificationCenter.default.post(name: NSNotification.Name("RemoteStopCommand"), object: nil)
          return .success
        }
        
        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { event in
          if let event = event as? MPChangePlaybackPositionCommandEvent {
            NotificationCenter.default.post(name: NSNotification.Name("RemoteSeekCommand"), object: nil, userInfo: ["position": event.positionTime])
          }
          return .success
        }
      }
      return true
    }
  }
}
