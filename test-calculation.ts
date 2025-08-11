// Test direct de calculateWordTimings
import { SyncedVideoGenerator } from './src/video/SyncedVideoGenerator';

const generator = new SyncedVideoGenerator();

// Acceder al método privado mediante reflection
const calculateWordTimings = (generator as any).calculateWordTimings.bind(generator);

// Test the method
const text = "Hello world test";
const startTime = 0;
const duration = 3;

console.log(`Testing calculateWordTimings with: "${text}", start: ${startTime}, duration: ${duration}`);

const result = calculateWordTimings(text, startTime, duration);

console.log('\nResult:');
console.log(JSON.stringify(result, null, 2));

// Check if values are null
const hasNullValues = result.some((wt: any) => 
  wt.startTime === null || wt.endTime === null
);

if (hasNullValues) {
  console.log('\n❌ ERROR: El método está devolviendo valores null!');
} else {
  console.log('\n✅ El método funciona correctamente');
}