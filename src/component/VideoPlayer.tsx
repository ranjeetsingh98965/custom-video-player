import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Video, {DRMType} from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';

type VideoPlayerProps = {
  uri?: string;
  drmLicense?: string;
  loadingColor?: string;
  sliderMinimumTrackTintColor?: string;
  sliderMaximumTrackTintColor?: string;
  sliderThumbTintColor?: string;
  videoType?: 'mp4' | 'm3u8' | 'webm' | 'mpd'; // specify allowed video types
  pause?: boolean;
  isOfflineVideo?: boolean;
  hideMuteButton?: boolean;
  hidePlaybackButton?: boolean;
  autoPlay?: boolean;
  playbackArray?: number[];
  changeCurrentTime?: number;
  videoCurrentTime?: (time: number) => void;
  videoDuration?: (duration: number) => void;
  onVideoEnd?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  error?: (err: Error) => void;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri = '',
  drmLicense = '',
  loadingColor = '#fff',
  sliderMinimumTrackTintColor = '#fff',
  sliderMaximumTrackTintColor = 'grey',
  sliderThumbTintColor = 'dodgerblue',
  videoType = 'mp4',
  pause = false,
  isOfflineVideo = false,
  hideMuteButton = false,
  hidePlaybackButton = false,
  autoPlay = true,
  playbackArray = [0.5, 1.0, 1.25, 1.5, 1.75, 2.0],
  changeCurrentTime = 0,
  videoCurrentTime = time => {},
  videoDuration = duration => {},
  onVideoEnd = () => {},
  onPause = () => {},
  onPlay = () => {},
  error = err => {},
}) => {
  const [showAllControls, setShowAllControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0); // Default playback speed
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paused, setPaused] = useState(!autoPlay); // Track play/pause state
  const [currentTime, setCurrentTime] = useState(changeCurrentTime); // Track current time
  const [duration, setDuration] = useState(0); // Track video duration
  const [isMuted, setIsMuted] = useState(false); // Track audio mute state
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const prevUri = useRef(uri);
  const [videoDimensions, setVideoDimensions] = useState({
    screenWidth: Dimensions.get('window').width,
    screenHeight: Dimensions.get('window').height,
  });
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Monitor network status changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      // console.log('lele mera: ', state.isConnected);
      if (state.isConnected) {
        // Automatically play video when connection is restored
        setPaused(false);
      } else {
        // Pause video when connection is lost
        if (!isOfflineVideo) {
          setPaused(true);
        }
      }
    });

    return () => {
      unsubscribe(); // Cleanup on unmount
    };
  }, []);

  // To pause Video
  useEffect(() => {
    setPaused(pause);
  }, [pause]);

  useEffect(() => {
    // Hide status bar in fullscreen mode
    StatusBar.setHidden(isFullscreen, 'fade');
  }, [isFullscreen]);

  useEffect(() => {
    const updateVideoDimensions = () => {
      const {width, height} = Dimensions.get('window');
      setVideoDimensions({
        screenWidth: width,
        screenHeight: height,
      });
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateVideoDimensions,
    );
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (prevUri.current !== uri) {
      // Reset when URI changes
      setIsLoading(true); // Show loading indicator
      setCurrentTime(0);
      setPlaybackRate(1.0);
      setPaused(true); // Pause video to load new URI
      prevUri.current = uri; // Update the previous URI
    }
  }, [uri]);

  // back button handle
  const backButtonHandler = () => {
    Orientation.getOrientation(or => {
      // console.log(or);
      if (or == 'LANDSCAPE-LEFT' || or == 'LANDSCAPE-RIGHT') {
        Orientation.lockToPortrait();
        setIsFullscreen(false);
      }
    });
    return true;
  };

  useEffect(() => {
    // Add event listener
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backButtonHandler,
    );

    // Cleanup function to remove event listener
    return () => {
      backHandler.remove();
    };
  }, []);
  //  End back handle

  const changePlaybackSpeed = rate => {
    setPlaybackRate(rate);
    setShowSpeedControls(false); // Hide speed controls after selection
  };

  const toggleFullscreen = () => {
    setShowSpeedControls(false);
    setIsFullscreen(prev => {
      const newFullscreenState = !prev;
      // Lock or unlock orientation based on fullscreen state
      if (newFullscreenState) {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }

      return newFullscreenState;
    });
  };

  const onVideoLoad = data => {
    setDuration(data.duration); // Set video duration
    setIsLoading(false); // Hide loading indicator once loaded
    videoDuration(data.duration);
    if (videoRef.current && changeCurrentTime < data.duration) {
      videoRef.current.seek(changeCurrentTime);
      setCurrentTime(changeCurrentTime);
    }
    if (autoPlay) {
      setPaused(false); // Auto-play if enabled
    }
  };

  const onSeek = value => {
    if (videoRef.current) {
      videoRef.current.seek(value);
      setCurrentTime(value);
      setShowSpeedControls(false);
    }
  };

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}`;
  };

  const addTime = seconds => {
    setShowSpeedControls(false);
    const newTime = Math.min(currentTime + seconds, duration); // Ensure it doesn't exceed duration
    setCurrentTime(newTime);
    onSeek(newTime); // Seek to the new time
  };

  const subtractTime = seconds => {
    setShowSpeedControls(false);
    const newTime = Math.max(currentTime - seconds, 0); // Ensure it doesn't go below 0
    setCurrentTime(newTime);
    onSeek(newTime); // Seek to the new time
  };

  // Function to reset video
  const resetVideo = () => {
    setCurrentTime(0);
    setPaused(true); // Pause the video
  };

  // Function to handle video end
  const handleVideoEnd = () => {
    setPaused(true); // Pause the video
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.seek(0); // Seek to the beginning
    }
    onVideoEnd();
  };

  // Function to Toggle mute state
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <View
      style={
        isFullscreen
          ? {
              width: '100%',
              height: videoDimensions.screenHeight,
              backgroundColor: 'black',
              zIndex: 0,
            }
          : {
              backgroundColor: 'black',
              width: '100%',
              height: videoDimensions.screenHeight * (30 / 100),
            }
      }>
      {isOfflineVideo ? (
        <Video
          ref={videoRef}
          source={{uri: `file://${uri}`}}
          style={{width: '100%', height: '100%'}}
          resizeMode="contain"
          paused={paused}
          controls={false}
          rate={playbackRate}
          muted={isMuted}
          bufferConfig={{
            minBufferMs: 15000, // Minimum buffered duration in milliseconds
            maxBufferMs: 50000, // Maximum buffered duration in milliseconds
            bufferForPlaybackMs: 2500, // Buffer size required to start playback
            bufferForPlaybackAfterRebufferMs: 5000, // Buffer size required after a rebuffering event
          }}
          onBuffer={({isBuffering}) => setIsLoading(isBuffering)}
          onError={err => {
            error(err);
          }}
          onLoad={onVideoLoad}
          onProgress={data => {
            setCurrentTime(data.currentTime);
            videoCurrentTime(data.currentTime);
          }}
          onControlsVisibilityChange={data => {
            setShowAllControls(data.isVisible);
            if (data.isVisible == false) {
              setShowSpeedControls(false);
            }
          }}
          onEnd={handleVideoEnd}
        />
      ) : (
        <>
          {drmLicense != '' ? (
            <Video
              ref={videoRef}
              source={{
                type: videoType,
                uri: uri,
              }}
              drm={{
                type: DRMType.WIDEVINE,
                licenseServer: drmLicense,
              }}
              style={{width: '100%', height: '100%'}}
              resizeMode="contain"
              paused={paused}
              controls={false}
              rate={playbackRate}
              muted={isMuted}
              bufferConfig={{
                minBufferMs: 15000, // Minimum buffered duration in milliseconds
                maxBufferMs: 50000, // Maximum buffered duration in milliseconds
                bufferForPlaybackMs: 2500, // Buffer size required to start playback
                bufferForPlaybackAfterRebufferMs: 5000, // Buffer size required after a rebuffering event
              }}
              onBuffer={({isBuffering}) => setIsLoading(isBuffering)}
              onError={err => {
                error(err);
              }}
              onLoad={onVideoLoad}
              onProgress={data => {
                setCurrentTime(data.currentTime);
                videoCurrentTime(data.currentTime);
              }}
              onControlsVisibilityChange={data => {
                setShowAllControls(data.isVisible);
                if (data.isVisible == false) {
                  setShowSpeedControls(false);
                }
              }}
              onEnd={handleVideoEnd}
            />
          ) : (
            <Video
              ref={videoRef}
              source={{
                type: videoType,
                uri: uri,
              }}
              style={{width: '100%', height: '100%'}}
              resizeMode="contain"
              paused={paused}
              controls={false}
              rate={playbackRate}
              muted={isMuted}
              bufferConfig={{
                minBufferMs: 15000, // Minimum buffered duration in milliseconds
                maxBufferMs: 50000, // Maximum buffered duration in milliseconds
                bufferForPlaybackMs: 2500, // Buffer size required to start playback
                bufferForPlaybackAfterRebufferMs: 5000, // Buffer size required after a rebuffering event
              }}
              onBuffer={({isBuffering}) => setIsLoading(isBuffering)}
              onError={err => {
                error(err);
              }}
              onLoad={onVideoLoad}
              onProgress={data => {
                setCurrentTime(data.currentTime);
                videoCurrentTime(data.currentTime);
              }}
              onControlsVisibilityChange={data => {
                setShowAllControls(data.isVisible);
                if (data.isVisible == false) {
                  setShowSpeedControls(false);
                }
              }}
              onEnd={handleVideoEnd}
            />
          )}
        </>
      )}

      {/* Offline Indicator */}
      {!isConnected && !isOfflineVideo && (
        <View
          style={{
            ...styles.offlineOverlay,
            padding: videoDimensions.screenWidth > 1000 ? 15 : 10,
            alignSelf: 'center',
          }}>
          <Text
            style={{
              ...styles.offlineText,
              fontSize: videoDimensions.screenWidth > 1000 ? 20 : 16,
            }}>
            You are offline
          </Text>
        </View>
      )}

      {/* Top */}
      {showAllControls && (isConnected || isOfflineVideo) ? (
        <View
          style={{
            flexDirection: 'row',
            width:
              videoDimensions.screenWidth > 1000
                ? hidePlaybackButton
                  ? 90
                  : 200
                : hidePlaybackButton
                ? 45
                : 100,
            top: 20,
            right: videoDimensions.screenWidth * (2 / 100),
            position: 'absolute',
          }}>
          {/* Toggle Button for Speed Controls */}
          {!hidePlaybackButton ? (
            <TouchableOpacity
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,.5)',
                borderRadius: 10,
                marginRight: 10,
                paddingVertical: videoDimensions.screenWidth > 1000 ? 10 : 0,
              }}
              onPress={() => setShowSpeedControls(!showSpeedControls)}>
              <Text
                style={{
                  ...styles.speedButtonText,
                  fontSize: videoDimensions.screenWidth > 1000 ? 20 : 16,
                }}>{`${playbackRate}x`}</Text>
            </TouchableOpacity>
          ) : null}

          {/* show / hide fullscreen */}
          <TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,.5)',
              borderRadius: 10,
            }}
            onPress={toggleFullscreen}>
            {isFullscreen ? (
              <Icon
                name="fullscreen-exit"
                size={videoDimensions.screenWidth > 1000 ? 35 : 30}
                color={'#fff'}
              />
            ) : (
              <Icon
                name="fullscreen"
                size={videoDimensions.screenWidth > 1000 ? 35 : 30}
                color={'#fff'}
              />
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {!isConnected && !isOfflineVideo ? (
        <View
          style={{
            flexDirection: 'row',
            width:
              videoDimensions.screenWidth > 1000
                ? hidePlaybackButton
                  ? 45
                  : 100
                : hidePlaybackButton
                ? 23.5
                : 50,
            top: 20,
            right: videoDimensions.screenWidth * (2 / 100),
            position: 'absolute',
          }}>
          {/* show / hide fullscreen */}
          <TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,.5)',
              borderRadius: 10,
              paddingVertical: videoDimensions.screenWidth > 1000 ? 10 : 0,
            }}
            onPress={toggleFullscreen}>
            {isFullscreen ? (
              <Icon
                name="fullscreen-exit"
                size={videoDimensions.screenWidth > 1000 ? 35 : 30}
                color={'#fff'}
              />
            ) : (
              <Icon
                name="fullscreen"
                size={videoDimensions.screenWidth > 1000 ? 35 : 30}
                color={'#fff'}
              />
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Speed Control Options */}
      {showSpeedControls &&
        showAllControls &&
        (isConnected || isOfflineVideo) && (
          <View
            style={
              isFullscreen
                ? styles.fullscreenSpeedControls
                : styles.speedControls
            }>
            {playbackArray.map(rate => (
              <TouchableOpacity
                key={rate}
                onPress={() => changePlaybackSpeed(rate)}
                style={styles.speedOption}>
                <Text style={styles.speedOptionText}>{`${rate}x`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      {/* middle Loading */}
      {isLoading ? (
        <View
          style={{
            position: 'absolute',
            zIndex: 9999,
            alignSelf: 'center',
            top: '42%',
          }}>
          <ActivityIndicator
            size={videoDimensions.screenWidth > 1000 ? 80 : 50}
            color={loadingColor}
          />
        </View>
      ) : null}

      {/* middle 1 */}
      {showAllControls && !isLoading && (isConnected || isOfflineVideo) ? (
        <View
          style={{
            position: 'absolute',
            flexDirection: 'row',
            alignSelf: 'center',
            zIndex: 99,
            top: '42%',
          }}>
          {/* 10- Buttons */}
          <TouchableOpacity
            style={{
              ...styles.timeButton,
              marginVertical: videoDimensions.screenWidth > 1000 ? 20 : 10,
            }}
            onPress={() => subtractTime(10)}>
            <Icon
              name="rewind-10"
              size={videoDimensions.screenWidth > 1000 ? 30 : 20}
              color={'#fff'}
            />
          </TouchableOpacity>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={{
              ...styles.playPauseButton,
              marginHorizontal: videoDimensions.screenWidth > 1000 ? 20 : 10,
            }}
            onPress={() => {
              if (currentTime >= duration && videoRef.current) {
                videoRef.current.seek(0); // Seek to start if video ended
              }
              setPaused(prev => {
                if (prev == true) {
                  onPlay();
                } else {
                  onPause();
                }
                return !prev;
              });
              setShowSpeedControls(false);
            }}>
            {paused ? (
              <Icon
                name="play"
                size={videoDimensions.screenWidth > 1000 ? 80 : 50}
                color={'#fff'}
              />
            ) : (
              <Icon
                name="pause"
                size={videoDimensions.screenWidth > 1000 ? 80 : 50}
                color={'#fff'}
              />
            )}
          </TouchableOpacity>
          {/* 10+ Button */}
          <TouchableOpacity
            style={{
              ...styles.timeButton,
              marginVertical: videoDimensions.screenWidth > 1000 ? 20 : 10,
            }}
            onPress={() => addTime(10)}>
            <Icon
              name="fast-forward-10"
              size={videoDimensions.screenWidth > 1000 ? 30 : 20}
              color={'#fff'}
            />
          </TouchableOpacity>
        </View>
      ) : null}
      {/* middle 2 */}
      {showAllControls &&
      (isConnected || isOfflineVideo) &&
      hideMuteButton == false ? (
        <>
          {/* Mute/Unmute Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 60,
              left: videoDimensions.screenWidth * (2 / 100),
              backgroundColor: 'rgba(0,0,0,.5)',
              padding: videoDimensions.screenWidth > 1000 ? 10 : 4,
              borderRadius: 4,
            }}
            onPress={toggleMute}>
            {isMuted ? (
              <Icon
                name="volume-off"
                size={videoDimensions.screenWidth > 1000 ? 30 : 25}
                color={'#fff'}
              />
            ) : (
              <Icon
                name="volume-high"
                size={videoDimensions.screenWidth > 1000 ? 30 : 25}
                color={'#fff'}
              />
            )}
          </TouchableOpacity>
        </>
      ) : null}

      {/* Bottom */}
      {showAllControls && (isConnected || isOfflineVideo) ? (
        <View
          style={{
            width: '96%',
            backgroundColor: 'rgba(0,0,0,.5)',
            flexDirection: 'row',
            paddingVertical: 4,
            // marginHorizontal: 10,
            alignSelf: 'center',
            borderRadius: 4,
            bottom: 50,
          }}>
          {/* current time */}
          <Text style={{...styles.timeText, marginLeft: 10}}>
            {formatTime(currentTime)}
          </Text>

          {/* Seek Bar */}
          <Slider
            style={{flex: 1}}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onSlidingComplete={val => {
              onSeek(val); // Seek to the selected time
            }}
            minimumTrackTintColor={sliderMinimumTrackTintColor}
            maximumTrackTintColor={sliderMaximumTrackTintColor}
            thumbTintColor={sliderThumbTintColor}
          />
          {/* duration */}
          <Text style={{...styles.timeText, marginRight: 10}}>
            {formatTime(duration)}
          </Text>
        </View>
      ) : null}

      {/* Refresh Button */}
      {/* {currentTime == duration && (
        <TouchableOpacity style={styles.refreshButton} onPress={resetVideo}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },

  speedButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  speedControls: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 5,
    zIndex: 99,
    flexDirection: 'row',
    marginTop: 5,
    alignSelf: 'center',
  },
  fullscreenSpeedControls: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 5,
    padding: 5,
    zIndex: 99,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  speedOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  speedOptionText: {
    color: 'white',
    fontSize: 16,
  },
  button: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 5,
  },
  fullscreenButton: {
    padding: 8,
    backgroundColor: 'green',
    borderRadius: 5,
    zIndex: 99,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  playPauseButton: {
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 5,
  },
  timeContainer: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: [{translateX: -50}],
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
  },
  timeButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,.6)', // Button background color
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center', // Center text horizontally
  },
  refreshButton: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{translateX: -50}],
    padding: 10,
    backgroundColor: '#FF0000', // Red background for visibility
    borderRadius: 5,
  },
  offlineOverlay: {
    position: 'absolute',
    top: '45%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 5,
  },
  offlineText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default VideoPlayer;
