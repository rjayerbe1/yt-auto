import { SyncedVideoGenerator } from './src/video/SyncedVideoGenerator';

async function testSyncedVideo() {
  console.log('🎬 Testing synced video generation with 2-second duration...');
  
  const generator = new SyncedVideoGenerator(2); // 2 second test
  
  generator.on('progress', (data) => {
    console.log(`[${data.progress}%] ${data.message}`);
  });
  
  try {
    const videoPath = await generator.generateSyncedVideo();
    console.log('✅ Video generated successfully:', videoPath);
  } catch (error) {
    console.error('❌ Error generating video:', error);
  }
}

testSyncedVideo();