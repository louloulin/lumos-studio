import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Define directories
const rootDir = path.resolve('.');
const outDir = path.join(rootDir, 'out');
const tauriResourceDir = path.join(rootDir, '..', 'src-tauri', 'resources', 'mastrax_dist');

// Create the output and resource directories if they don't exist
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

if (!fs.existsSync(tauriResourceDir)) {
  fs.mkdirSync(tauriResourceDir, { recursive: true });
}

// Update .env for production
const envFilePath = path.join(rootDir, '.env');
const envContent = fs.existsSync(envFilePath) 
  ? fs.readFileSync(envFilePath, 'utf8') 
  : '';

// Make sure PORT is set to 4111
const envLines = envContent.split('\n').filter(line => !line.startsWith('PORT='));
const updatedEnvContent = [...envLines, 'PORT=4111'].join('\n');
fs.writeFileSync(envFilePath, updatedEnvContent);

// Update package.json to include build and start scripts
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts) {
  packageJson.scripts = {};
}

packageJson.scripts.build = 'mastra build';
packageJson.scripts.start = 'bun run index.mjs';

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Building Mastra project...');

try {
  // Build the project
  execSync('mastra build', { stdio: 'inherit' });
  
  console.log('Mastra build completed successfully!');
  
  // Copy the output to the Tauri resources directory
  console.log(`Copying built files to Tauri resources at ${tauriResourceDir}...`);
  
  // Copy the .mastra build output to the out directory
  const mastraBuildDir = path.join(rootDir, '.mastra');
  
  if (fs.existsSync(mastraBuildDir)) {
    // Copy all files from .mastra to out directory
    copyDirectory(mastraBuildDir, outDir);
    
    // Then copy to Tauri resources
    copyDirectory(outDir, tauriResourceDir);
    
    console.log('Files copied successfully!');
  } else {
    console.error('Error: .mastra directory not found after build!');
    process.exit(1);
  }
} catch (error) {
  console.error('Error building Mastra project:', error);
  process.exit(1);
}

// Helper function to copy a directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      try {
        // Check if file is a regular file before copying
        const stats = fs.statSync(srcPath);
        if (stats.isFile()) {
          fs.copyFileSync(srcPath, destPath);
        } else {
          // Skip special files (sockets, devices, etc)
          console.log(`Skipping special file: ${srcPath}`);
        }
      } catch (err) {
        console.log(`Warning: Could not copy ${srcPath}: ${err.message}`);
      }
    }
  }
} 