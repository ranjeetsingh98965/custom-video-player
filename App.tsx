import React, {useState} from 'react';
import {
  Button,
  StatusBar,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import VideoPlayer from './src/component/VideoPlayer';

const App = () => {
  const url1 =
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4';
  const url2 =
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';

  const [url, setUrl] = useState(url1);
  return (
    <View style={{}}>
      <VideoPlayer
        // uri="https://d3ri16u9ij2lx4.cloudfront.net/private/9Gp2kE4jRJd.mp4?response-content-disposition=attachment%3B+filename%3DBig+Buck+Bunny+Video.mp4&Expires=1730915082&Signature=odNDl3y5K2HqPHtZCzoNPYWgk-dpDdxf9HJzkA4HK2GQxLPUTzN2H~250s9YOR81yoaqXQOlLiLsn~hCsNnpoYVCzhNmgzA8HKqUy4kjXXtG9lCw1AJActpGIiPGGnoR~cwQiAM3JyYzNkxX2FmwDhbak6f~-SoxwLQd2B78VCLaXFT1B-3TfSA-y4vfPqR~p9kZ08lV5UXP3WvtKRa1LOYonym8kydJkNPPsLJdr8PDLnR8ao2hAV6F2LtpX7Lfshli5wzOW1PA8wpuFM5Lf7ES3dKrLWknM-lGMXTeci7-npos6s68rntB5B59D8oCrD6R49kzAzuoFa8kqPhnkQ__&Key-Pair-Id=K2XWKDWM065EGO"
        uri={'https://content.jwplatform.com/videos/GlFeRqS3-61QB1HuB.mp4'}
        // uri={url1}
        isOfflineVideo={false}
        // videoType="mpd"
        // videoType="mp4"
        // drmLicense="https://app.tpstreams.com/api/v1/mzh3kt/assets/9Gp2kE4jRJd/drm_license/?access_token=4d875f23-c74c-4a5e-82b3-5c8b0fcc973e"
        // changeCurrentTime={url == url1 ? 40 : 80}
        hideMuteButton={false}
        pause={false}
        hidePlaybackButton={false}
        autoPlay={true}
        playbackArray={[0.5, 1.0, 1.5]}
        loadingColor="#F3983E"
        sliderMinimumTrackTintColor="#fff"
        sliderMaximumTrackTintColor="grey"
        sliderThumbTintColor="#F3983E"
        error={err => console.log('err: ', err)}
        // videoCurrentTime={time => console.log('time: ', time)}
        videoDuration={duration => console.log('duration: ', duration)}
        // onVideoEnd={() => console.log('lele mera end: 😂')}
        // onPause={() => console.log('lele mera pause: 😂')}
        // onPlay={() => console.log('lele mera play: 😂')}
      />
      <View>
        <TouchableOpacity
          style={{justifyContent: 'center', alignItems: 'center'}}
          onPress={() => {
            setUrl(url == url1 ? url2 : url1);
          }}>
          <Text style={{textAlign: 'center'}}>Change Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default App;
